import { Page } from "playwright";
import { StressResult, StressFinding } from "./types";
import { SCENARIO_IDS, applyScenario, revertScenarios } from "./scenarios";
import { detectLayoutIssues } from "./layout-detector";

export async function runStressTests(page: Page, deadlineMs: number): Promise<StressResult> {
  const allFindings: StressFinding[] = [];
  let completed = 0;
  let isPartial = false;

  // Wait for page to be stable before taking baseline
  await page.waitForTimeout(1000);
  
  for (const scenarioId of SCENARIO_IDS) {
    if (Date.now() > deadlineMs) {
      isPartial = true;
      break;
    }

    try {
      // Apply synthetic stress content
      await applyScenario(page, scenarioId);

      // Allow a brief moment for the browser to re-calculate layout
      await page.waitForTimeout(500);

      // Detect layout breakages
      const findings = await detectLayoutIssues(page, scenarioId);
      allFindings.push(...findings);
      completed++;

      // Restore baseline
      await revertScenarios(page);
    } catch (e) {
      console.error(`Error running stress scenario ${scenarioId}:`, e);
      // Attempt revert even on failure
      await revertScenarios(page).catch(() => {});
    }
  }

  return {
    scenariosCompleted: completed,
    totalScenarios: SCENARIO_IDS.length,
    isPartial,
    totalFindings: allFindings.length,
    findings: allFindings
  };
}
