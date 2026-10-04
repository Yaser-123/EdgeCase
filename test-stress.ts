import { chromium } from "playwright";
import { runStressTests } from "./src/server/scanner/stress/index";
import * as fs from "fs";
import * as path from "path";

async function run() {
  console.log("Running local stress test verification...");
  
  const browser = await chromium.launch({ headless: true });
  // Narrow viewport to force overflow scenarios on fixed-width boxes
  const context = await browser.newContext({ viewport: { width: 600, height: 800 } });
  const page = await context.newPage();

  try {
    const fixturePath = path.join(process.cwd(), "public", "stress-fixture.html");
    const html = fs.readFileSync(fixturePath, "utf-8");
    
    // Load local HTML
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    // Run tests with 45s deadline
    const deadlineMs = Date.now() + 45000;
    const results = await runStressTests(page, deadlineMs);
    
    console.log(`Test completed with ${results.totalFindings} findings.`);
    console.log(JSON.stringify(results.findings, null, 2));

    // Verify DOM Restoration
    console.log("\nVerifying DOM restoration...");
    const restoredInputValue = await page.evaluate(() => document.querySelector("input")?.value);
    const restoredTextareaValue = await page.evaluate(() => document.querySelector("textarea")?.value);
    
    if (restoredInputValue === "Short Value" && restoredTextareaValue === "Short Textarea") {
      console.log("✅ Original form values successfully restored.");
    } else {
      console.error("❌ Form restoration failed!", { restoredInputValue, restoredTextareaValue });
    }

    // Verify intentional ellipsis wasn't flagged
    const hasEllipsisFalsePositive = results.findings.some(f => f.selector && f.selector.includes("ellipsis"));
    if (hasEllipsisFalsePositive) {
       console.error("❌ Intentional ellipsis was incorrectly flagged!");
    } else {
       console.log("✅ Intentional ellipsis was correctly ignored.");
    }

  } catch (err: any) {
    console.error("Script Error:", err.message);
  } finally {
    await browser.close();
  }
}

run();
