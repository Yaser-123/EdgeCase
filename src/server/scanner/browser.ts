import { chromium, Browser, BrowserContext, Page } from "playwright";

// Manage a single instance lock for MVP
let isScanning = false;
const OVERALL_TIMEOUT_MS = 45000; // 45 seconds

export async function withBrowser<T>(
  action: (page: Page, browser: Browser) => Promise<T>
): Promise<T> {
  if (isScanning) {
    throw new Error("A scan is already in progress. Please try again later.");
  }
  
  isScanning = true;
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    const launchPromise = async () => {
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
      
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);

      return await action(page, browser);
    };

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Overall scan timeout exceeded (45s)."));
      }, OVERALL_TIMEOUT_MS);
    });

    return await Promise.race([launchPromise(), timeoutPromise]);
  } finally {
    // Release lock first to prevent it from being stuck if cleanup hangs
    isScanning = false;
    
    // Attempt cleanup
    try {
      if (context) await context.close();
    } catch (e) {
      console.error("Error closing context:", e);
    }
    
    try {
      if (browser) await browser.close();
    } catch (e) {
      console.error("Error closing browser:", e);
    }
  }
}
