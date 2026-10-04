export type SecuritySeverity = "low" | "medium" | "high" | "critical" | "info";
export type SecurityConfidence = "certain" | "firm" | "tentative";
export type SecurityCategory = "misconfiguration" | "information-disclosure" | "mixed-content" | "cookie-security" | "defense-in-depth";

export interface SecurityFinding {
  checkName: string;
  category: SecurityCategory;
  description: string;
  evidence: string;
  severity: SecuritySeverity;
  confidence: SecurityConfidence;
  remediation: string;
}

export interface SecurityResult {
  totalChecks: number;
  checksCompleted: number;
  isPartial: boolean;
  totalFindings: number;
  findings: SecurityFinding[];
  severityCounts: Record<SecuritySeverity, number>;
}
