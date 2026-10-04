import { Page } from "playwright";
import { SecurityFinding } from "./types";

export async function checkContentSecurity(page: Page): Promise<SecurityFinding[]> {
  const url = page.url();
  const isHttps = url.startsWith("https://");
  
  if (!isHttps) return []; // Mixed content only applies to HTTPS pages

  return await page.evaluate(() => {
    const findings: any[] = [];
    
    // 1. Mixed Content
    const mediaElements = document.querySelectorAll("img, audio, video, source");
    for (const el of Array.from(mediaElements)) {
      const src = (el as any).src;
      if (src && src.startsWith("http://")) {
        findings.push({
          checkName: "Mixed Content (Passive)",
          category: "mixed-content",
          description: "An unencrypted resource is loaded on a secure (HTTPS) page.",
          evidence: `Tag: <${el.tagName.toLowerCase()}>, src: ${src}`,
          severity: "medium",
          confidence: "certain",
          remediation: "Load all resources over HTTPS.",
        });
      }
    }

    const activeElements = document.querySelectorAll("script, link, iframe, object");
    for (const el of Array.from(activeElements)) {
      const src = (el as any).src || (el as any).href;
      if (src && src.startsWith("http://")) {
        findings.push({
          checkName: "Mixed Content (Active)",
          category: "mixed-content",
          description: "An unencrypted active resource (script, stylesheet, iframe) is loaded on a secure page, allowing active man-in-the-middle attacks.",
          evidence: `Tag: <${el.tagName.toLowerCase()}>, src/href: ${src}`,
          severity: "high",
          confidence: "certain",
          remediation: "Load all active resources over HTTPS.",
        });
      }
    }

    // 2. Insecure Form Actions
    const forms = document.querySelectorAll("form");
    for (const form of Array.from(forms)) {
      const action = form.action;
      if (action && action.startsWith("http://")) {
        findings.push({
          checkName: "Insecure Form Action",
          category: "misconfiguration",
          description: "A form on this secure page submits data to an unencrypted HTTP endpoint.",
          evidence: `Form action: ${action}`,
          severity: "high",
          confidence: "certain",
          remediation: "Change the form action to use HTTPS.",
        });
      }
    }

    return findings;
  });
}
