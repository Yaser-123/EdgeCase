export type NetworkSeverity = "low" | "medium" | "high" | "critical" | "info";
export type NetworkConfidence = "certain" | "firm" | "tentative";

export interface NetworkFinding {
  scenarioName: string;
  resourceUrl?: string | string[];
  resourceType?: string;
  status?: string | number;
  timing?: number;
  description: string;
  severity: NetworkSeverity;
  confidence: NetworkConfidence;
  remediation: string;
  applicationErrorOccurred?: boolean;
}

export interface NetworkResult {
  totalScenarios: number;
  scenariosCompleted: number;
  isPartial: boolean;
  totalFindings: number;
  severityCounts: Record<NetworkSeverity, number>;
  findings: NetworkFinding[];
}
