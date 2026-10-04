import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { runStressTests } from "@/server/scanner/stress/index";
import fs from "fs";
import path from "path";

export async function GET() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 600, height: 800 } }); // Narrow viewport to force overflow
  const page = await context.newPage();

  try {
    const fixturePath = path.join(process.cwd(), "public", "stress-fixture.html");
    const html = fs.readFileSync(fixturePath, "utf-8");
    
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const results = await runStressTests(page);

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await browser.close();
  }
}
