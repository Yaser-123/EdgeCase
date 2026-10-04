import { Page, CDPSession } from "playwright";
import { NetworkFinding } from "./types";

export interface NetworkMonitorResult {
  findings: NetworkFinding[];
  durationMs: number;
}

export class NetworkMonitor {
  private page: Page;
  private cdpSession: CDPSession | null = null;
  private scenarioName: string;
  private findings: NetworkFinding[] = [];
  
  // Listeners to detach later
  private onPageErrorBound: (err: Error) => void;
  private onRequestFailedBound: (request: any) => void;
  private onResponseBound: (response: any) => void;

  constructor(page: Page, scenarioName: string) {
    this.page = page;
    this.scenarioName = scenarioName;
    
    this.onPageErrorBound = this.onPageError.bind(this);
    this.onRequestFailedBound = this.onRequestFailed.bind(this);
    this.onResponseBound = this.onResponse.bind(this);
  }

  public async start() {
    this.cdpSession = await this.page.context().newCDPSession(this.page);
    this.page.on("pageerror", this.onPageErrorBound);
    this.page.on("requestfailed", this.onRequestFailedBound);
    this.page.on("response", this.onResponseBound);
  }

  public async stop(): Promise<NetworkFinding[]> {
    this.page.off("pageerror", this.onPageErrorBound);
    this.page.off("requestfailed", this.onRequestFailedBound);
    this.page.off("response", this.onResponseBound);

    if (this.cdpSession) {
      // Reset network conditions
      await this.cdpSession.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1
      }).catch(() => {});
      await this.cdpSession.detach().catch(() => {});
      this.cdpSession = null;
    }

    return this.findings;
  }

  public async setConditions(options: { offline: boolean, latency: number, downloadThroughput: number, uploadThroughput: number }) {
    if (this.cdpSession) {
      await this.cdpSession.send("Network.emulateNetworkConditions", options);
    }
  }

  private onPageError(err: Error) {
    this.findings.push({
      scenarioName: this.scenarioName,
      description: `Uncaught page error: ${err.message}`,
      severity: "high",
      confidence: "firm",
      remediation: "Fix the underlying JavaScript error."
    });
  }

  private onRequestFailed(request: any) {
    // Avoid double counting aborted or blocked by client (adblocker/SSRF protect)
    const failureText = request.failure()?.errorText || "Unknown error";
    if (failureText === "net::ERR_ABORTED" || failureText.includes("net::ERR_BLOCKED_BY_CLIENT")) return;
    if (this.scenarioName === "failed-resources" && failureText === "net::ERR_FAILED") return; // Simulated failure

    this.findings.push({
      scenarioName: this.scenarioName,
      resourceUrl: this.sanitizeUrl(request.url()),
      resourceType: request.resourceType(),
      status: failureText,
      description: `Resource failed to load under simulated network conditions.`,
      severity: this.scenarioName === "offline" ? "info" : "medium",
      confidence: "certain",
      remediation: "Ensure the application handles network failures gracefully and falls back correctly."
    });
  }

  private onResponse(response: any) {
    const status = response.status();
    if (status >= 400 && status !== 401 && status !== 403) {
      // Ignore 401/403 as we don't authenticate
      this.findings.push({
        scenarioName: this.scenarioName,
        resourceUrl: this.sanitizeUrl(response.url()),
        status,
        description: `Server responded with an error status (${status}).`,
        severity: status >= 500 ? "high" : "low",
        confidence: "firm",
        remediation: "Investigate why the server failed to process the request."
      });
    }
  }

  private sanitizeUrl(rawUrl: string): string {
    try {
      const url = new URL(rawUrl);
      url.search = ""; // Strip query params to avoid logging sensitive PII
      url.hash = "";
      return url.toString();
    } catch {
      return rawUrl;
    }
  }
}
