import { Page, Response } from "playwright";
import { SecurityFinding, SecurityResult, SecuritySeverity } from "./types";
import { checkSecurityHeaders } from "./headers";
import { checkCookies } from "./cookies";
import { checkContentSecurity } from "./content";

export async function runSecurityAudit(page: Page, response: Response): Promise<SecurityResult> {
  const allFindings: SecurityFinding[] = [];
  const checksToRun = [
    "Security Headers",
    "Cookie Security",
    "Content & Configuration"
  ];
  let checksCompleted = 0;

  try {
    // 1. Headers
    const headerFindings = checkSecurityHeaders(response);
    allFindings.push(...headerFindings);
    checksCompleted++;

    // 2. Cookies
    const cookieFindings = await checkCookies(page.context(), page.url());
    allFindings.push(...cookieFindings);
    checksCompleted++;

    // 3. Content
    const contentFindings = await checkContentSecurity(page);
    allFindings.push(...contentFindings);
    checksCompleted++;

  } catch (error) {
    console.error("Error during security audit:", error);
  }

  const severityCounts: Record<SecuritySeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const finding of allFindings) {
    severityCounts[finding.severity]++;
  }

  return {
    totalChecks: checksToRun.length,
    checksCompleted,
    isPartial: checksCompleted < checksToRun.length,
    totalFindings: allFindings.length,
    findings: allFindings,
    severityCounts,
  };
}
