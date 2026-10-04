import { Page } from "playwright";
import { StressResult, StressFinding } from "./types";
import { SCENARIO_IDS, applyScenario, revertScenarios } from "./scenarios";
import { detectLayoutIssues } from "./layout-detector";

export async function runStressTests(page: Page): Promise<StressResult> {
  const allFindings: StressFinding[] = [];

  // Wait for page to be stable before taking baseline
  await page.waitForTimeout(1000);

  // Take a baseline snapshot? We rely on revertScenarios which uses the DOM node backup.
  
  for (const scenarioId of SCENARIO_IDS) {
    try {
      // Apply synthetic stress content
      await applyScenario(page, scenarioId);

      // Allow a brief moment for the browser to re-calculate layout
      await page.waitForTimeout(500);

      // Detect layout breakages
      const findings = await detectLayoutIssues(page, scenarioId);
      allFindings.push(...findings);

      // Restore baseline
      await revertScenarios(page);
    } catch (e) {
      console.error(`Error running stress scenario ${scenarioId}:`, e);
      // Attempt revert even on failure
      await revertScenarios(page).catch(() => {});
    }
  }

  return {
    totalFindings: allFindings.length,
    findings: allFindings
  };
}
