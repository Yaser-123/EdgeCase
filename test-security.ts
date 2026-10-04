import { chromium } from "playwright";
import * as http from "http";
import { checkSecurityHeaders } from "./src/server/scanner/security/headers";
import { checkCookies } from "./src/server/scanner/security/cookies";
import { checkContentSecurity } from "./src/server/scanner/security/content";

async function run() {
  console.log("Starting local security test server...");

  const server = http.createServer((req, res) => {
    // Deliberately missing CSP, HSTS, X-Content-Type-Options, X-Frame-Options
    // Deliberately exposing Server and X-Powered-By
    res.setHeader("Server", "VulnerableServer/1.0");
    res.setHeader("X-Powered-By", "InsecureFramework");
    
    // Set cookies with missing security attributes
    res.setHeader("Set-Cookie", [
      "session_id=12345; Path=/", // Missing HttpOnly, Secure, SameSite
      "tracking=abc; Path=/; SameSite=None", // SameSite=None without Secure
      "safe_cookie=xyz; Path=/; HttpOnly; Secure; SameSite=Lax" // Safe
    ]);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <html>
        <head>
          <title>Security Test Fixture</title>
        </head>
        <body>
          <h1>Security Test</h1>
          <!-- Active Mixed Content (simulated) -->
          <script src="http://example.com/insecure.js"></script>
          
          <!-- Passive Mixed Content -->
          <img src="http://example.com/insecure.jpg" />

          <!-- Insecure Form Action -->
          <form action="http://example.com/login" method="POST">
            <input type="text" name="user" />
            <button type="submit">Submit</button>
          </form>
        </body>
      </html>
    `);
  });

  server.listen(3001);

  console.log("Running local security test verification...");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // We navigate to http://localhost:3001
    // Note: Since our content checks look for mixed content on HTTPS pages only (to avoid false positives on HTTP pages),
    // we need to simulate the page being HTTPS for the content check, or we temporarily modify the URL in the check.
    // For this test, we will monkey-patch the page.url() to pretend it's HTTPS for the content check test.
    const response = await page.goto("http://localhost:3001");
    
    if (!response) throw new Error("No response");

    console.log("\n--- Header Findings ---");
    // Mock the URL as HTTPS to trigger HSTS check
    const mockResponse = {
      headers: () => response.headers(),
      url: () => "https://localhost:3001/"
    } as any;
    const headerFindings = checkSecurityHeaders(mockResponse);
    console.log(JSON.stringify(headerFindings, null, 2));

    console.log("\n--- Cookie Findings ---");
    const cookieFindings = await checkCookies(context, "https://localhost:3001/");
    console.log(JSON.stringify(cookieFindings, null, 2));

    console.log("\n--- Content Findings ---");
    // Override page.url() for the test
    page.url = () => "https://localhost:3001/";
    const contentFindings = await checkContentSecurity(page);
    console.log(JSON.stringify(contentFindings, null, 2));

  } catch (err: any) {
    console.error("Script Error:", err.message);
  } finally {
    await browser.close();
    server.close();
  }
}

run();
