export interface Remediation {
  whyItMatters: string;
  recommendedFix: string;
  prompt: string;
}

export interface RemediationFinding {
  module: "accessibility" | "stress" | "security" | "network";
  id?: string;
  remediation: Remediation;
}
