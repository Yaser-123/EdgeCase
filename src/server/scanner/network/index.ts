import { Page } from "playwright";
import { NetworkResult, NetworkFinding, NetworkSeverity } from "./types";
import { runBaseline, runSlowNetwork, runHighLatency, runFailedResources, runOffline } from "./scenarios";

export async function runNetworkResilienceTests(page: Page, url: string, deadlineMs: number): Promise<NetworkResult> {
  const allFindings: NetworkFinding[] = [];
  const scenarios = [
    runBaseline,
    runSlowNetwork,
    runHighLatency,
    runFailedResources,
    runOffline
  ];
  
  let scenariosCompleted = 0;
  let isPartial = false;

  for (const scenario of scenarios) {
    if (Date.now() > deadlineMs) {
      isPartial = true;
      break;
    }

    try {
      const { findings } = await scenario(page, url);
      allFindings.push(...findings);
      scenariosCompleted++;
    } catch (e) {
      console.error(`Network scenario failed:`, e);
      // Ensure we restore network state if a scenario catastrophically failed
      try {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 0,
          downloadThroughput: -1,
          uploadThroughput: -1
        });
        await cdp.detach();
      } catch (err) {}
    }
  }
  
  // Clean up routing just in case
  try {
     // Playwright doesn't have an unrouteAll without params, but we can try to clear our specific ones
     // We remove all handlers that were specifically added for "**/*" by our scenarios, except the SSRF one.
     // Wait, page.unroute("**/*") removes ALL handlers for that URL pattern, including our SSRF protector!
     // We MUST NOT do `page.unroute("**/*")` if it wipes the global SSRF handler!
     // Let's rely on the scenario itself cleaning up its specific handler using `route.fallback()` logic above.
  } catch (err) {}

  const severityCounts: Record<NetworkSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const finding of allFindings) {
    severityCounts[finding.severity]++;
  }

  return {
    totalScenarios: scenarios.length,
    scenariosCompleted,
    isPartial,
    totalFindings: allFindings.length,
    severityCounts,
    findings: allFindings,
  };
}
