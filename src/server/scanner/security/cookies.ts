import { BrowserContext } from "playwright";
import { SecurityFinding } from "./types";

export async function checkCookies(context: BrowserContext, url: string): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  const isHttps = url.startsWith("https://");
  
  // Get all cookies for the current domain
  const cookies = await context.cookies(url);

  for (const cookie of cookies) {
    // 1. Secure Flag
    if (isHttps && !cookie.secure) {
      findings.push({
        checkName: "Insecure Cookie on HTTPS",
        category: "cookie-security",
        description: `Cookie '${cookie.name}' is transmitted over HTTPS but lacks the Secure flag, allowing it to be sent over unencrypted connections.`,
        evidence: `Cookie: ${cookie.name} (domain: ${cookie.domain})`,
        severity: "medium",
        confidence: "firm",
        remediation: "Add the 'Secure' attribute to the cookie.",
      });
    }

    // 2. HttpOnly Flag
    // Some cookies like CSRF tokens need to be read by JS, so this is 'tentative' or 'low' severity for unknown cookies
    if (!cookie.httpOnly) {
      // Common session cookies
      const lowerName = cookie.name.toLowerCase();
      const isLikelySession = lowerName.includes("session") || lowerName.includes("token") || lowerName.includes("auth") || lowerName.includes("sid");
      
      findings.push({
        checkName: "HttpOnly Flag Missing",
        category: "cookie-security",
        description: isLikelySession 
          ? `Cookie '${cookie.name}' lacks the HttpOnly flag. Heuristic analysis suggests this may be an authentication cookie, making it a high-risk XSS target.`
          : `Cookie '${cookie.name}' lacks the HttpOnly flag. If this cookie does not need client-side JS access, it should be secured.`,
        evidence: `Cookie: ${cookie.name}`,
        severity: isLikelySession ? "high" : "low",
        confidence: isLikelySession ? "firm" : "tentative",
        remediation: "Add the 'HttpOnly' attribute if the cookie does not need to be accessed by JavaScript.",
      });
    }

    // 3. SameSite Attribute
    if (!cookie.sameSite || cookie.sameSite.toLowerCase() === "none") {
      // If it's SameSite=None, it MUST be Secure
      if (cookie.sameSite?.toLowerCase() === "none" && !cookie.secure) {
         findings.push({
          checkName: "Invalid SameSite=None configuration",
          category: "cookie-security",
          description: `Cookie '${cookie.name}' uses SameSite=None but is missing the Secure flag. Browsers will reject this cookie.`,
          evidence: `Cookie: ${cookie.name}`,
          severity: "medium",
          confidence: "certain",
          remediation: "Ensure SameSite=None cookies also have the Secure flag.",
        });
      }

      findings.push({
        checkName: "Permissive SameSite Attribute",
        category: "cookie-security",
        description: `Cookie '${cookie.name}' lacks a restrictive SameSite attribute, potentially exposing the application to CSRF attacks.`,
        evidence: `Cookie: ${cookie.name} (SameSite: ${cookie.sameSite || "Not Set"})`,
        severity: "low",
        confidence: "tentative",
        remediation: "Set SameSite to 'Lax' or 'Strict'.",
      });
    }
  }

  return findings;
}
