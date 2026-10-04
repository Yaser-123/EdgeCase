import { Page } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { AccessibilityResult } from "./types";

export async function runAccessibilityAudit(page: Page): Promise<AccessibilityResult> {
  try {
    const results = await new AxeBuilder({ page }).analyze();

    return {
      passesCount: results.passes.length,
      violationsCount: results.violations.length,
      incompleteCount: results.incomplete.length,
      violations: results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
        })),
      })),
    };
  } catch (error) {
    console.error("Accessibility Audit Error:", error);
    throw new Error("Failed to run accessibility audit");
  }
}
