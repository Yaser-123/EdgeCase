export type Severity = "high" | "medium" | "low";

export interface StressFinding {
  scenarioName: string;
  viewport: { width: number; height: number };
  selector: string;
  text: string;
  boundingRect: { x: number; y: number; width: number; height: number };
  computedStyles: Record<string, string>;
  description: string;
  severity: Severity;
  suspected: boolean; // True if we are uncertain
}

export interface StressScenario {
  id: string;
  name: string;
  apply: () => void;
  revert: () => void;
}

export interface StressResult {
  scenariosCompleted: number;
  totalScenarios: number;
  isPartial: boolean;
  totalFindings: number;
  findings: StressFinding[];
}
