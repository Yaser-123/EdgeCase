import { Page } from "playwright";
import { NetworkMonitor, NetworkMonitorResult } from "./monitor";
import { NetworkFinding } from "./types";

export async function runBaseline(page: Page, url: string): Promise<NetworkMonitorResult> {
  const monitor = new NetworkMonitor(page, "baseline");
  await monitor.start();
  
  const start = Date.now();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
  } catch (e) {
    // Ignore timeout natively, monitor will record failed requests
  }
  
  const findings = await monitor.stop();
  return { findings, durationMs: Date.now() - start };
}

export async function runSlowNetwork(page: Page, url: string): Promise<NetworkMonitorResult> {
  const monitor = new NetworkMonitor(page, "slow-network");
  await monitor.start();
  
  // 400 Kbps = 400 * 1024 / 8 bytes per second
  const throughput = (400 * 1024) / 8;
  await monitor.setConditions({
    offline: false,
    latency: 400,
    downloadThroughput: throughput,
    uploadThroughput: throughput
  });

  const start = Date.now();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
  } catch (e) {
    // Expected to potentially timeout
  }
  
  const findings = await monitor.stop();
  
  if (Date.now() - start > 8000) {
    findings.push({
      scenarioName: "slow-network",
      description: "Page load exceeded 8 seconds under slow network conditions (3G).",
      severity: "medium",
      confidence: "firm",
      remediation: "Optimize resource sizes and prioritize critical rendering path."
    });
  }
  
  return { findings, durationMs: Date.now() - start };
}

export async function runHighLatency(page: Page, url: string): Promise<NetworkMonitorResult> {
  const monitor = new NetworkMonitor(page, "high-latency");
  await monitor.start();
  
  // 1500ms latency, high throughput
  const throughput = (50000 * 1024) / 8;
  await monitor.setConditions({
    offline: false,
    latency: 1500,
    downloadThroughput: throughput,
    uploadThroughput: throughput
  });

  const start = Date.now();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
  } catch (e) {
    // Expected to potentially timeout
  }
  
  const findings = await monitor.stop();
  return { findings, durationMs: Date.now() - start };
}

export async function runFailedResources(page: Page, url: string): Promise<NetworkMonitorResult> {
  const monitor = new NetworkMonitor(page, "failed-resources");
  await monitor.start();
  
  let blockedCount = 0;
  
  const handler = async (route: any, request: any) => {
    if (blockedCount < 3 && ["script", "stylesheet", "image"].includes(request.resourceType())) {
      blockedCount++;
      return route.abort("failed");
    }
    return route.fallback(); 
  };

  // Intercept and drop specific non-critical resources
  await page.route("**/*", handler);

  const start = Date.now();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
  } catch (e) {}
  
  // Clean up our specific route handler safely
  await page.unroute("**/*", handler);
  
  const findings = await monitor.stop();
  
  if (findings.some(f => f.description.includes("Uncaught page error"))) {
    findings.push({
      scenarioName: "failed-resources",
      description: "Page crashed or threw a JS error when resources failed to load.",
      severity: "high",
      confidence: "certain",
      remediation: "Implement error boundaries and fallback mechanisms for critical resources."
    });
  }

  return { findings, durationMs: Date.now() - start };
}

export async function runOffline(page: Page, url: string): Promise<NetworkMonitorResult> {
  const monitor = new NetworkMonitor(page, "offline");
  await monitor.start();
  
  // Load the page normally first
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
  } catch (e) {}
  
  const start = Date.now();
  
  // Cut network
  await monitor.setConditions({
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0
  });

  // Give it a moment to see if it starts throwing offline errors natively or via periodic fetch
  await page.waitForTimeout(2000);
  
  // Restore connectivity is handled automatically in monitor.stop()
  const findings = await monitor.stop();
  return { findings, durationMs: Date.now() - start };
}
