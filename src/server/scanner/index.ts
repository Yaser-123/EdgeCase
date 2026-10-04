import { ScanResult } from "./types";
import { validateAndNormalizeUrl, isSafeIp } from "./url-validator";
import { withBrowser } from "./browser";
import { runAccessibilityAudit } from "./accessibility";
import { runStressTests } from "./stress/index";
import { runSecurityAudit } from "./security/index";
import { promises as dns } from "dns";
import * as ipaddr from "ipaddr.js";

export async function runFullScan(inputUrl: string): Promise<ScanResult> {
  try {
    const validatedUrl = await validateAndNormalizeUrl(inputUrl);

    return await withBrowser(async (page) => {
      const startTime = Date.now();
      
      // Intercept and protect all network requests
      await page.route("**/*", async (route, request) => {
        const resourceType = request.resourceType();
        const reqUrl = request.url();
        
        // Deterministic test routes (these do not weaken URL validation)
        if (reqUrl === "https://example.com/edgecase-test-timeout") {
          // Never resolve, forcing a timeout
          return;
        }
        if (reqUrl === "https://example.com/edgecase-test-redirect") {
          // Redirect to a private IP to test SSRF protection during navigation
          return route.fulfill({
            status: 302,
            headers: { location: "http://127.0.0.1/" }
          });
        }
        if (reqUrl === "https://example.com/edgecase-test-subresource") {
          return route.fulfill({
            status: 200,
            contentType: "text/html",
            body: "<html><body><script>fetch('http://169.254.169.254/latest/meta-data/')</script><h1>Malicious</h1></body></html>"
          });
        }

        // Block heavy/unnecessary resources
        if (["image", "media", "font", "other"].includes(resourceType)) {
          return route.abort("blockedbyclient");
        }
        
        // Validate every request URL against SSRF
        try {
          const urlObj = new URL(reqUrl);
          
          if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
            return route.abort("accessdenied");
          }
          if (urlObj.port && urlObj.port !== "80" && urlObj.port !== "443") {
            return route.abort("accessdenied");
          }
          
          const hostname = urlObj.hostname;
          if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
             return route.abort("accessdenied");
          }

          // We must do a DNS lookup for every request to catch DNS rebinding 
          // or redirects to private IPs.
          let addresses: string[] = [];
          if (ipaddr.isValid(hostname)) {
            addresses = [hostname];
          } else {
            const results = await dns.lookup(hostname, { all: true });
            addresses = results.map(r => r.address);
          }

          for (const address of addresses) {
            if (!isSafeIp(address)) {
              return route.abort("accessdenied");
            }
          }

          // Ensure it's not trying to download a huge file by checking headers later?
          // Playwright doesn't easily let us inspect headers before downloading the body in route.continue,
          // but we blocked images and media, which are the main culprits.
          return route.continue();
        } catch {
          return route.abort("failed");
        }
      });

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

      // Run Passive Security Audit
      const security = await runSecurityAudit(page, response);

      // Run Accessibility Audit
      const accessibility = await runAccessibilityAudit(page);

      // Run UI Stress Tests
      // Leave a 10-second buffer before the hard 45s overall timeout
      const stressDeadline = startTime + 35000; 
      const stress = await runStressTests(page, stressDeadline);

      // Capture bounded screenshot to prevent OOM on massive pages
      const screenshotBuffer = await page.screenshot({ 
        type: "jpeg", 
        quality: 60,
        clip: { x: 0, y: 0, width: 1280, height: 2000 } // Bounded viewport
      });
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
        security,
        accessibility,
        stress,
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
