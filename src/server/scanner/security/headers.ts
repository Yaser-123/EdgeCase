import { Response } from "playwright";
import { SecurityFinding } from "./types";

export function checkSecurityHeaders(response: Response): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const headers = response.headers();
  const url = response.url();
  const isHttps = url.startsWith("https://");

  // 1. Strict-Transport-Security (HSTS)
  if (isHttps) {
    const hsts = headers["strict-transport-security"];
    if (!hsts) {
      findings.push({
        checkName: "Strict-Transport-Security (HSTS) Missing",
        category: "misconfiguration",
        description: "The application lacks HSTS enforcement. This is a configuration weakness that allows initial connections over unencrypted HTTP before redirecting.",
        evidence: "Missing 'Strict-Transport-Security' header",
        severity: "medium",
        confidence: "certain",
        remediation: "Add the Strict-Transport-Security header (e.g., max-age=31536000; includeSubDomains).",
      });
    }
  }

  // 2. Content-Security-Policy (CSP)
  const csp = headers["content-security-policy"];
  if (!csp) {
    findings.push({
      checkName: "Content-Security-Policy (CSP) Missing",
      category: "defense-in-depth",
      description: "No CSP is implemented. While not an immediate vulnerability, lacking a CSP reduces defense-in-depth against XSS attacks.",
      evidence: "Missing 'Content-Security-Policy' header",
      severity: "low",
      confidence: "certain",
      remediation: "Implement a restrictive CSP to limit allowed resource origins.",
    });
  }

  // 3. X-Content-Type-Options
  const xcto = headers["x-content-type-options"];
  if (!xcto || xcto.toLowerCase() !== "nosniff") {
    findings.push({
      checkName: "X-Content-Type-Options Missing or Invalid",
      category: "misconfiguration",
      description: "The application does not enforce strict MIME types, which is a minor configuration weakness that could allow MIME-sniffing.",
      evidence: xcto ? `Found: ${xcto}` : "Missing 'X-Content-Type-Options' header",
      severity: "low",
      confidence: "certain",
      remediation: "Set 'X-Content-Type-Options: nosniff'.",
    });
  }

  // 4. Clickjacking Protection (X-Frame-Options OR CSP frame-ancestors)
  const xfo = headers["x-frame-options"];
  const hasFrameAncestors = csp && csp.toLowerCase().includes("frame-ancestors");
  if (!hasFrameAncestors && !xfo) {
    findings.push({
      checkName: "Clickjacking Protection Missing",
      category: "misconfiguration",
      description: "The application does not restrict framing. This configuration weakness could allow the page to be embedded in an attacker's site.",
      evidence: "Missing both 'X-Frame-Options' and CSP 'frame-ancestors' directive",
      severity: "medium",
      confidence: "certain",
      remediation: "Implement CSP 'frame-ancestors' or add 'X-Frame-Options: DENY' / 'SAMEORIGIN'.",
    });
  }

  // 5. Server / X-Powered-By / Technology Disclosure
  const server = headers["server"];
  if (server) {
    findings.push({
      checkName: "Server Header Disclosure",
      category: "information-disclosure",
      description: "The application discloses its server software, which can aid attackers in fingerprinting.",
      evidence: `Server: ${server}`,
      severity: "info",
      confidence: "certain",
      remediation: "Remove or mask the 'Server' header.",
    });
  }

  const poweredBy = headers["x-powered-by"];
  if (poweredBy) {
    findings.push({
      checkName: "X-Powered-By Header Disclosure",
      category: "information-disclosure",
      description: "The application explicitly discloses its underlying framework.",
      evidence: `X-Powered-By: ${poweredBy}`,
      severity: "info",
      confidence: "certain",
      remediation: "Remove the 'X-Powered-By' header.",
    });
  }

  return findings;
}
