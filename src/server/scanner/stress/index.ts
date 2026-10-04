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

  // Group findings by scenario and issueType
  const groupedFindings: StressFinding[] = [];
  const groups = new Map<string, StressFinding>();

  for (const finding of allFindings) {
    // If it's a document level issue, just add it directly (no need to group children)
    if (finding.issueType === "Document Horizontal Overflow") {
      const key = `${finding.scenarioName}-${finding.issueType}`;
      if (!groups.has(key)) {
        groups.set(key, { ...finding, affectedElements: [] });
      }
      continue;
    }

    // Group element-level issues
    const key = `${finding.scenarioName}-${finding.issueType}`;
    if (!groups.has(key)) {
      groups.set(key, {
        ...finding,
        description: `Multiple elements affected by ${finding.issueType}`,
        selector: `Multiple elements (e.g., ${finding.selector})`,
        affectedElements: [{
          selector: finding.selector || "",
          text: finding.text || "",
          boundingRect: finding.boundingRect!,
          computedStyles: finding.computedStyles || {}
        }]
      });
    } else {
      const group = groups.get(key)!;
      // Prevent unbounded growth by limiting stored evidence to 10
      if (group.affectedElements!.length < 10) {
        group.affectedElements!.push({
          selector: finding.selector || "",
          text: finding.text || "",
          boundingRect: finding.boundingRect!,
          computedStyles: finding.computedStyles || {}
        });
      }
      group.description = `${group.affectedElements!.length}${group.affectedElements!.length >= 10 ? '+' : ''} elements affected by ${finding.issueType}`;
    }
  }

  for (const group of groups.values()) {
    if (group.affectedElements && group.affectedElements.length === 1 && group.issueType !== "Document Horizontal Overflow") {
      // Revert to single finding description if only one element
      const el = group.affectedElements[0];
      group.selector = el.selector;
      group.text = el.text;
      group.boundingRect = el.boundingRect;
      group.computedStyles = el.computedStyles;
      group.description = allFindings.find(f => f.issueType === group.issueType && f.selector === el.selector)?.description || group.description;
    }
    groupedFindings.push(group);
  }

  return {
    scenariosCompleted: completed,
    totalScenarios: SCENARIO_IDS.length,
    isPartial,
    totalFindings: groupedFindings.length,
    findings: groupedFindings
  };
}
