import { ScanResult } from "../types";
import { generateA11yRemediation, generateStressRemediation, generateSecurityRemediation, generateNetworkRemediation } from "./templates";

export function enrichScanResultWithRemediation(result: ScanResult): ScanResult {
  if (result.accessibility?.violations) {
    result.accessibility.violations.forEach((violation: any) => {
      violation.fixAssistant = generateA11yRemediation(violation);
    });
  }

  if (result.stress?.findings) {
    result.stress.findings.forEach((finding: any) => {
      finding.fixAssistant = generateStressRemediation(finding);
    });
  }

  if (result.security?.findings) {
    result.security.findings.forEach((finding: any) => {
      finding.fixAssistant = generateSecurityRemediation(finding);
    });
  }

  if (result.network?.findings) {
    result.network.findings.forEach((finding: any) => {
      finding.fixAssistant = generateNetworkRemediation(finding);
    });
  }

  return result;
}
