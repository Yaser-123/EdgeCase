"use client";

import React, { useState } from "react";
import { 
  Activity, 
  ShieldCheck, 
  MonitorOff, 
  Accessibility, 
  ArrowRight,
  Globe,
  TerminalSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layout,
  ExternalLink,
  Download,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanResult } from "@/server/scanner/types";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "info" } | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setMessage({ text: "Please enter a valid URL.", type: "error" });
      return;
    }
    
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      setMessage({ text: "Please enter a valid URL (e.g., https://example.com).", type: "error" });
      return;
    }

    setMessage({ text: "Initializing scanner engine. This may take up to 30 seconds...", type: "info" });
    setIsScanning(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      
      if (!response.ok || data.status === "error") {
        setMessage({ text: data.error || "Scan failed due to an unknown error.", type: "error" });
      } else {
        setResult(data);
        setMessage(null);
        // Scroll to results
        setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to reach the scanning service.", type: "error" });
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportReport = () => {
    if (!result) return;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>EdgeCase Scan Report: ${result.metadata?.url}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.5; color: #333; max-width: 900px; margin: 0 auto; padding: 2rem; }
    h1, h2, h3 { color: #111; }
    .header { border-bottom: 2px solid #eee; padding-bottom: 1rem; margin-bottom: 2rem; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .summary-card { background: #f9f9f9; padding: 1rem; border-radius: 8px; border: 1px solid #ddd; text-align: center; }
    .summary-card.danger { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
    .summary-card.success { background: #dcfce7; border-color: #86efac; color: #166534; }
    .finding { border: 1px solid #ddd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .finding h4 { margin-top: 0; }
    .severity { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
    .severity.high, .severity.critical { background: #fee2e2; color: #ef4444; }
    .severity.medium { background: #fef3c7; color: #f59e0b; }
    .severity.low, .severity.info { background: #e0f2fe; color: #3b82f6; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>EdgeCase Quality & Security Report</h1>
    <p><strong>Target URL:</strong> ${result.metadata?.url}</p>
    <p><strong>Scan Date:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Duration:</strong> ${result.timing ? (result.timing.duration / 1000).toFixed(2) : "--"}s</p>
  </div>
  
  <h2>Unified Summary</h2>
  <div class="summary">
    <div class="summary-card ${result.accessibility?.violationsCount ? 'danger' : 'success'}">
      <h3>${result.accessibility?.violationsCount || 0}</h3>
      <p>A11y Violations</p>
    </div>
    <div class="summary-card ${result.stress?.totalFindings ? 'danger' : 'success'}">
      <h3>${result.stress?.totalFindings || 0}</h3>
      <p>Stress Issues</p>
    </div>
    <div class="summary-card ${result.security?.totalFindings ? 'danger' : 'success'}">
      <h3>${result.security?.totalFindings || 0}</h3>
      <p>Security Findings</p>
    </div>
    <div class="summary-card ${result.network?.totalFindings ? 'danger' : 'success'}">
      <h3>${result.network?.totalFindings || 0}</h3>
      <p>Network Errors</p>
    </div>
  </div>

  <h2>Details</h2>
  <p>To view detailed findings and evidence, please review the results in the EdgeCase dashboard.</p>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edgecase-report-${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
              <TerminalSquare className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">EdgeCase</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
              Break your web app <br className="hidden sm:block" /> before your users do.
            </h1>
            <p className="text-lg sm:text-xl text-foreground/70 mb-10 max-w-2xl mx-auto">
              EdgeCase automatically tests your application against extreme UI stress, accessibility violations, security misconfigurations, and network failures.
            </p>

            <form onSubmit={handleRunTest} className="max-w-xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex flex-col sm:flex-row gap-3 bg-card p-2 rounded-lg border border-border">
                <div className="relative flex-1 flex items-center">
                  <Globe className="absolute left-3 w-5 h-5 text-foreground/40" />
                  <Input 
                    type="text" 
                    placeholder="https://your-webapp.com" 
                    className="pl-10 border-0 bg-transparent h-12 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isScanning}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="h-12 px-8 font-semibold text-base whitespace-nowrap"
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Scanning...
                    </span>
                  ) : (
                    <>Run Stress Test <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </form>
            
            {message && (
              <div className={`mt-6 flex items-center justify-center gap-2 max-w-xl mx-auto border px-4 py-3 rounded-lg text-sm ${
                message.type === "error" 
                  ? "bg-destructive/10 border-destructive/20 text-destructive-foreground" 
                  : "bg-secondary/80 border-border text-foreground"
              }`}>
                {message.type === "error" && <AlertCircle className="w-4 h-4" />}
                {message.type === "info" && <Activity className="w-4 h-4 text-primary animate-pulse" />}
                <span className={message.type === "error" ? "text-red-400" : ""}>{message.text}</span>
              </div>
            )}
          </div>
        </section>

        {/* Results Section */}
        <section id="results" className="py-20 border-t border-border bg-card/30">
          <div className="container mx-auto px-4 max-w-6xl">
            {result ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Scan Results</h2>
                    <p className="text-foreground/70 flex items-center gap-2">
                      <a href={result.metadata?.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        {result.metadata?.url} <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                  <div className="bg-background border border-border rounded-lg px-4 py-2 flex items-center gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-foreground/50">Page Title</span>
                      <span className="font-medium max-w-[200px] truncate" title={result.metadata?.title}>{result.metadata?.title}</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex flex-col">
                      <span className="text-foreground/50">Load Time</span>
                      <span className="font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {result.timing ? (result.timing.duration / 1000).toFixed(2) : "--"}s
                      </span>
                    </div>
                    <Button onClick={handleExportReport} variant="outline" className="ml-4 gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary">
                      <Download className="w-4 h-4" /> Export Report
                    </Button>
                  </div>
                </div>

                {/* Unified Scan Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className={`p-4 rounded-xl border ${result.accessibility?.violationsCount ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                    <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
                      <Accessibility className="w-4 h-4" /> Accessibility
                    </div>
                    <div className="text-3xl font-bold">{result.accessibility?.violationsCount || 0}</div>
                    <div className="text-xs text-foreground/50 uppercase font-semibold mt-1">Violations</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${result.stress?.totalFindings ? 'bg-purple-500/10 border-purple-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                    <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
                      <MonitorOff className="w-4 h-4" /> UI Stress
                    </div>
                    <div className="text-3xl font-bold">{result.stress?.totalFindings || 0}</div>
                    <div className="text-xs text-foreground/50 uppercase font-semibold mt-1">Layout Issues</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${result.security?.totalFindings ? 'bg-blue-500/10 border-blue-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                    <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
                      <ShieldCheck className="w-4 h-4" /> Security
                    </div>
                    <div className="text-3xl font-bold">{result.security?.totalFindings || 0}</div>
                    <div className="text-xs text-foreground/50 uppercase font-semibold mt-1">Passive Findings</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${result.network?.totalFindings ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                    <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
                      <Activity className="w-4 h-4" /> Network
                    </div>
                    <div className="text-3xl font-bold">{result.network?.totalFindings || 0}</div>
                    <div className="text-xs text-foreground/50 uppercase font-semibold mt-1">Simulated Errors</div>
                  </div>
                </div>

                {/* Modules Grid */}
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Left Column: Summary & Accessibility */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Accessibility Card */}
                    <div className="bg-background rounded-xl border border-border overflow-hidden">
                      <div className="p-6 border-b border-border bg-card/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <Accessibility className="w-5 h-5 text-green-500" />
                          </div>
                          <h3 className="text-xl font-semibold">Accessibility Audit</h3>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-400">{result.accessibility?.violationsCount || 0}</div>
                            <div className="text-xs text-foreground/50 uppercase font-semibold tracking-wider">Violations</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{result.accessibility?.passesCount || 0}</div>
                            <div className="text-xs text-foreground/50 uppercase font-semibold tracking-wider">Passes</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-0 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {result.accessibility?.violations && result.accessibility.violations.length > 0 ? (
                          <div className="divide-y divide-border">
                            {result.accessibility.violations.map((v, i) => (
                              <div key={i} className="p-6 hover:bg-secondary/20 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <h4 className="font-medium text-lg text-red-300">{v.id}</h4>
                                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${
                                    v.impact === 'critical' ? 'bg-red-500/20 text-red-400' :
                                    v.impact === 'serious' ? 'bg-orange-500/20 text-orange-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {v.impact || "Unknown"}
                                  </span>
                                </div>
                                <p className="text-foreground/80 mb-4">{v.description}</p>
                                
                                <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-border">
                                  <div className="text-foreground/50 text-xs mb-2 uppercase tracking-wider font-sans font-semibold">Affected Node (1 of {v.nodes.length})</div>
                                  <code className="text-blue-300 whitespace-pre-wrap">{v.nodes[0]?.html}</code>
                                  {v.nodes[0]?.failureSummary && (
                                    <div className="mt-3 pt-3 border-t border-border/50 text-red-200/80">
                                      {v.nodes[0].failureSummary}
                                    </div>
                                  )}
                                </div>
                                
                                <a href={v.helpUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4">
                                  {v.help} <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-12 text-center text-foreground/50">
                            <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
                            <p className="text-lg">Perfect! No accessibility violations detected.</p>
                            <p className="text-sm mt-1">Based on axe-core automated scanning.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Screenshot & Tech Info */}
                  <div className="space-y-6 lg:col-span-1">
                    <div className="bg-background rounded-xl border border-border overflow-hidden">
                      <div className="p-4 border-b border-border bg-card/50 flex items-center gap-2">
                        <Layout className="w-4 h-4 text-foreground/50" />
                        <h3 className="font-semibold text-sm">Full Page Snapshot</h3>
                      </div>
                      <div className="p-4 bg-secondary/30 relative">
                        {result.screenshot ? (
                          <div className="rounded-lg overflow-hidden border border-border max-h-[600px] overflow-y-auto custom-scrollbar relative">
                            <img 
                              src={result.screenshot} 
                              alt="Site screenshot" 
                              className="w-full h-auto"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="h-48 flex items-center justify-center text-foreground/50 border border-border border-dashed rounded-lg">
                            No screenshot available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: UI Stress Testing and Security Audit */}
                <div className="grid lg:grid-cols-2 gap-8 mt-8">
                  {/* Security Audit */}
                  <div className="bg-background rounded-xl border border-border overflow-hidden">
                    <div className="p-6 border-b border-border bg-card/50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <ShieldCheck className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold">Security Audit</h3>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">{result.security?.totalFindings || 0}</div>
                          <div className="text-xs text-foreground/50 uppercase font-semibold tracking-wider">Findings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{result.security?.checksCompleted || 0} / {result.security?.totalChecks || 0}</div>
                          <div className="text-xs text-foreground/50 uppercase font-semibold tracking-wider">Checks</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-0 max-h-[600px] overflow-y-auto custom-scrollbar">
                      {result.security?.findings && result.security.findings.length > 0 ? (
                        <div className="divide-y divide-border">
                          {result.security.findings.map((f, i) => (
                            <div key={i} className="p-6 hover:bg-secondary/20 transition-colors">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <h4 className="font-medium text-lg text-blue-300">
                                  {f.checkName}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-1 rounded font-bold uppercase tracking-wider bg-secondary text-foreground/60">
                                    {f.category}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${
                                    f.severity === 'critical' ? 'bg-red-600/20 text-red-500' :
                                    f.severity === 'high' ? 'bg-red-500/20 text-red-400' : 
                                    f.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                                    f.severity === 'low' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-blue-500/20 text-blue-400'
                                  }`}>
                                    {f.severity}
                                  </span>
                                </div>
                              </div>
                              <p className="text-foreground/80 mb-4">{f.description}</p>
                              
                              <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm border border-border">
                                <div className="text-foreground/50 text-xs mb-2 uppercase tracking-wider font-sans font-semibold">Evidence</div>
                                <code className="text-blue-300 break-all">{f.evidence}</code>
                              </div>
                              
                              {f.remediation && (
                                <div className="mt-4 bg-green-500/10 rounded-lg p-4 border border-green-500/20 text-sm text-green-200/80">
                                  <strong>Remediation:</strong> {f.remediation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center text-foreground/50">
                          <CheckCircle2 className="w-12 h-12 text-blue-500/50 mx-auto mb-4" />
                          <p className="text-lg">No passive security issues detected.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* UI Stress Testing */}
                  <div className="bg-background rounded-xl border border-border overflow-hidden">
                    <div className="p-6 border-b border-border bg-card/50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <MonitorOff className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold">UI Stress Testing</h3>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">{result.stress?.totalFindings || 0}</div>
                          <div className="text-xs text-foreground/50 uppercase font-semibold tracking-wider">Issues</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{result.stress?.scenariosCompleted || 0} / {result.stress?.totalScenarios || 0}</div>
                          <div className="text-xs text-foreground/50 uppercase font-semibold tracking-wider">Scenarios</div>
                        </div>
                      </div>
                    </div>
                    
                    {result.stress?.isPartial && (
                      <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-300 flex items-center justify-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Scan hit the 45-second timeout limit. Partial stress testing results are shown below.
                      </div>
                    )}
                    
                    <div className="p-0 max-h-[600px] overflow-y-auto custom-scrollbar">
                      {result.stress?.findings && result.stress.findings.length > 0 ? (
                        <div className="divide-y divide-border">
                          {result.stress.findings.map((f, i) => (
                            <div key={i} className="p-6 hover:bg-secondary/20 transition-colors">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <h4 className="font-medium text-lg text-purple-300">
                                  {f.scenarioName.replace('-', ' ').toUpperCase()} SCENARIO
                                </h4>
                                <div className="flex items-center gap-2">
                                  {f.suspected && (
                                    <span className="text-xs px-2 py-1 rounded font-bold uppercase tracking-wider bg-secondary text-foreground/60">
                                      Suspected
                                    </span>
                                  )}
                                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${
                                    f.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                                  }`}>
                                    {f.severity}
                                  </span>
                                </div>
                              </div>
                              <p className="text-foreground/80 mb-4">{f.description}</p>
                              
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm border border-border">
                                  <div className="text-foreground/50 text-xs mb-2 uppercase tracking-wider font-sans font-semibold">Selector</div>
                                  <code className="text-blue-300 break-all">{f.selector}</code>
                                </div>
                                
                                {Object.keys(f.computedStyles).length > 0 && (
                                  <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm border border-border">
                                    <div className="text-foreground/50 text-xs mb-2 uppercase tracking-wider font-sans font-semibold">Computed Styles</div>
                                    <pre className="text-green-300/80 whitespace-pre-wrap text-xs">
                                      {Object.entries(f.computedStyles).map(([k, v]) => `${k}: ${v};\n`).join('')}
                                    </pre>
                                  </div>
                                )}
                              </div>
                              
                              {f.text && (
                                <div className="mt-4 bg-secondary/30 rounded-lg p-4 border border-border text-sm italic text-foreground/60 break-all">
                                  "{f.text}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center text-foreground/50">
                          <CheckCircle2 className="w-12 h-12 text-purple-500/50 mx-auto mb-4" />
                          <p className="text-lg">No layout breakages detected under extreme UI stress.</p>
                          <p className="text-sm mt-1">Layout remained stable across all injected scenarios.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Network Resilience Testing */}
                  <div className="bg-background rounded-xl border border-border overflow-hidden lg:col-span-2">
                    <div className="p-6 border-b border-border bg-card/50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <Activity className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold">Network Resilience</h3>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">{result.network?.totalFindings || 0}</div>
                          <div className="text-xs text-foreground/50 uppercase font-semibold tracking-wider">Findings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-400">{result.network?.scenariosCompleted || 0} / {result.network?.totalScenarios || 0}</div>
                          <div className="text-xs text-foreground/50 uppercase font-semibold tracking-wider">Scenarios</div>
                        </div>
                      </div>
                    </div>
                    
                    {result.network?.isPartial && (
                      <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-300 flex items-center justify-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Scan hit the 45-second timeout limit. Partial network testing results are shown below.
                      </div>
                    )}
                    
                    <div className="p-0 max-h-[600px] overflow-y-auto custom-scrollbar">
                      {result.network?.findings && result.network.findings.length > 0 ? (
                        <div className="divide-y divide-border">
                          {result.network.findings.map((f, i) => (
                            <div key={i} className="p-6 hover:bg-secondary/20 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <h4 className="font-medium text-lg text-emerald-300">
                                    {f.scenarioName.replace('-', ' ').toUpperCase()} SCENARIO
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${
                                      f.severity === 'critical' ? 'bg-red-600/20 text-red-500' :
                                      f.severity === 'high' ? 'bg-red-500/20 text-red-400' : 
                                      f.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                                      f.severity === 'low' ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-emerald-500/20 text-emerald-400'
                                    }`}>
                                      {f.severity}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-foreground/80 mb-4">{f.description}</p>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                  {f.resourceUrl && (
                                    <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm border border-border md:col-span-2">
                                      <div className="text-foreground/50 text-xs mb-2 uppercase tracking-wider font-sans font-semibold">
                                        Resource URL{Array.isArray(f.resourceUrl) && f.resourceUrl.length > 1 ? `s (${f.resourceUrl.length})` : ''}
                                      </div>
                                      {Array.isArray(f.resourceUrl) ? (
                                        <div className="max-h-32 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                          {f.resourceUrl.map((url, idx) => (
                                            <code key={idx} className="text-blue-300 break-all block">{url}</code>
                                          ))}
                                        </div>
                                      ) : (
                                        <code className="text-blue-300 break-all">{f.resourceUrl}</code>
                                      )}
                                    </div>
                                  )}
                                  
                                  {f.resourceType && (
                                    <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm border border-border">
                                      <div className="text-foreground/50 text-xs mb-2 uppercase tracking-wider font-sans font-semibold">Type</div>
                                      <code className="text-emerald-300 break-all">{f.resourceType}</code>
                                    </div>
                                  )}

                                  {f.status && (
                                    <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm border border-border">
                                      <div className="text-foreground/50 text-xs mb-2 uppercase tracking-wider font-sans font-semibold">Status / Error</div>
                                      <code className="text-red-300 break-all">{f.status}</code>
                                      {f.status === "SIMULATED_FAILURE" && (
                                        <div className={`mt-2 text-xs font-sans font-bold px-2 py-1 rounded block w-fit ${f.applicationErrorOccurred ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                          {f.applicationErrorOccurred ? "Application Crashed" : "Application Survived"}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {f.remediation && (
                                  <div className="mt-4 bg-secondary/30 rounded-lg p-4 border border-border text-sm text-foreground/80">
                                    <strong>Remediation:</strong> {f.remediation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                      ) : (
                        <div className="p-12 text-center text-foreground/50">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
                          <p className="text-lg">No network resilience issues detected.</p>
                          <p className="text-sm mt-1">Application behaved flawlessly under simulated network duress.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-background border border-border rounded-xl p-12 border-dashed flex flex-col items-center justify-center text-foreground/50 max-w-4xl mx-auto">
                <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
                <p>No active scan data available.</p>
                <p className="text-sm mt-2">Enter a URL above to generate your first quality report.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-foreground/50 text-sm mt-auto">
        <p>EdgeCase &copy; {new Date().getFullYear()}. Automated Quality & Security Testing.</p>
      </footer>
    </div>
  );
}
