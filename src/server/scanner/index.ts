import { ScanResult } from "./types";
import { validateAndNormalizeUrl } from "./url-validator";
import { withBrowser } from "./browser";
import { runAccessibilityAudit } from "./accessibility";

export async function runFullScan(inputUrl: string): Promise<ScanResult> {
  try {
    const validatedUrl = await validateAndNormalizeUrl(inputUrl);

    return await withBrowser(async (page) => {
      const startTime = Date.now();
      
      // Navigate to the page
      const response = await page.goto(validatedUrl, { waitUntil: "domcontentloaded" });
      
      if (!response) {
        throw new Error("Failed to load page: No response received");
      }

      // Allow a short rendering period for dynamic content without relying on networkidle
      await page.waitForTimeout(2000);
      
      const loadEventEnd = Date.now();

      // Collect Metadata
      const title = await page.title();
      const finalUrl = page.url();

      // Ensure we haven't been redirected to a local IP after initial load
      await validateAndNormalizeUrl(finalUrl);

      // Run Accessibility Audit
      const accessibility = await runAccessibilityAudit(page);

      // Capture full-page screenshot
      const screenshotBuffer = await page.screenshot({ fullPage: true, type: "jpeg", quality: 60 });
      const screenshot = `data:image/jpeg;base64,${screenshotBuffer.toString("base64")}`;

      return {
        status: "success",
        metadata: {
          url: finalUrl,
          title,
        },
        timing: {
          navigationStart: startTime,
          loadEventEnd: loadEventEnd,
          duration: loadEventEnd - startTime,
        },
        accessibility,
        screenshot,
      };
    });
  } catch (error: any) {
    console.error("Scan Failed:", error);
    return {
      status: "error",
      error: error.message || "An unknown error occurred during scanning",
    };
  }
}
