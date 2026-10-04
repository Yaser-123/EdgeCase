import { chromium, Browser, BrowserContext, Page } from "playwright";

// Manage a single instance lock for MVP
let isScanning = false;

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
      ignoreHTTPSErrors: true, // We want to scan even if certificate is invalid
    });

    const page = await context.newPage();
    
    // Set a reasonable timeout for all page operations
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    return await action(page, browser);
  } finally {
    isScanning = false;
    if (context) await context.close();
    if (browser) await browser.close();
  }
}
