import { chromium, Browser, BrowserContext, Page } from "playwright";

// Lock state: false | true | "fatal"
let isScanning: boolean | "fatal" = false;
const OVERALL_TIMEOUT_MS = 45000; // 45 seconds

export async function withBrowser<T>(
  action: (page: Page, browser: Browser) => Promise<T>
): Promise<T> {
  if (isScanning === "fatal") {
    throw new Error("Scanner is unavailable due to an unrecoverable browser error. Please restart the service.");
  }
  if (isScanning) {
    throw new Error("A scan is already in progress. Please try again later.");
  }
  
  isScanning = true;
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let timeoutTimer: NodeJS.Timeout;

  try {
    const launchAndRun = async () => {
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true,
      });

      const page = await context.newPage();
      
      // Set to 50s so that the 45s overall timeout triggers first on infinite hangs
      page.setDefaultTimeout(50000);
      page.setDefaultNavigationTimeout(50000);

      return await action(page, browser);
    };

    // 1. Preserve the original scan promise
    const scanPromise = launchAndRun();
    
    // Attach a silent rejection handler to prevent unhandled rejections if it finishes after timeout
    scanPromise.catch(() => { /* Silent catch for orphaned promise */ });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutTimer = setTimeout(() => {
        reject(new Error(`Overall scan timeout exceeded (${OVERALL_TIMEOUT_MS}ms).`));
      }, OVERALL_TIMEOUT_MS);
    });

    return await Promise.race([scanPromise, timeoutPromise]);
  } finally {
    // 8. Clear the timer if it finished normally
    clearTimeout(timeoutTimer!);

    // Attempt bounded cleanup while lock is STILL HELD
    let cleanupFailed = false;

    try {
      if (context) {
        await Promise.race([
          context.close(),
          new Promise((_, r) => setTimeout(() => r(new Error("Context close timeout")), 3000))
        ]);
      }
    } catch (e) {
      console.error("Browser context cleanup failed or timed out:", e);
      cleanupFailed = true;
    }
    
    try {
      if (browser) {
        await Promise.race([
          browser.close(),
          new Promise((_, r) => setTimeout(() => r(new Error("Browser close timeout")), 5000))
        ]);
      }
    } catch (e) {
      console.error("Browser close failed or timed out:", e);
      cleanupFailed = true;
      
      // Fallback: forcefully kill the Chromium process
      const proc = browser?.process();
      if (proc && !proc.killed) {
        console.warn("Force killing orphaned Chromium process...");
        proc.kill('SIGKILL');
      }
    }

    // Release lock only after cleanup is fully attempted
    if (cleanupFailed) {
      // If we couldn't reliably kill the browser, mark it fatal to prevent accumulation
      // We assume SIGKILL works, but if it doesn't, we should fail safe.
      const proc = browser?.process();
      if (proc && !proc.killed) {
        isScanning = "fatal";
        console.error("FATAL: Failed to kill Chromium process. Scanner is permanently locked.");
      } else {
        isScanning = false;
      }
    } else {
      isScanning = false;
    }
  }
}
