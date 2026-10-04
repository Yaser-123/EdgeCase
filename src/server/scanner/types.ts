export interface ScanResult {
  status: "success" | "error";
  metadata?: {
    url: string;
    title: string;
  };
  timing?: {
    navigationStart: number;
    loadEventEnd: number;
    duration: number;
  };
  accessibility?: AccessibilityResult;
  screenshot?: string; // base64 data URI
  error?: string;
}

export interface AccessibilityResult {
  passesCount: number;
  violationsCount: number;
  incompleteCount: number;
  violations: Array<{
    id: string;
    impact: string | null | undefined;
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
      target: string[];
      html: string;
      failureSummary?: string;
    }>;
  }>;
}
