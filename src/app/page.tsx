"use client";

import React, { useState } from "react";
import { 
  Activity, 
  ShieldCheck, 
  MonitorOff, 
  Accessibility, 
  ArrowRight,
  Globe,
  TerminalSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [message, setMessage] = useState("");

  const handleRunTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setMessage("Please enter a valid URL.");
      return;
    }
    
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      setMessage("");
      setIsSimulating(true);
      
      // Simulate connection attempt for the UI (MVP step 1)
      setTimeout(() => {
        setIsSimulating(false);
        setMessage("Scanner engine not connected yet. (Coming soon)");
      }, 1500);
    } catch {
      setMessage("Please enter a valid URL (e.g., https://example.com).");
    }
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
          <nav className="hidden sm:flex gap-6 text-sm font-medium text-foreground/80">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
          </nav>
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
                  />
                </div>
                <Button 
                  type="submit" 
                  className="h-12 px-8 font-semibold text-base whitespace-nowrap"
                  disabled={isSimulating}
                >
                  {isSimulating ? "Connecting..." : "Run Stress Test"}
                  {!isSimulating && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </form>
            
            {message && (
              <div className="mt-6 inline-block bg-secondary/80 backdrop-blur-sm border border-border text-sm px-4 py-2 rounded-full text-primary-foreground animate-in fade-in slide-in-from-bottom-2">
                {message}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-secondary/30 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Four Dimensions of Testing</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Our automated engine analyzes your provided URL across four critical categories to ensure production readiness.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <FeatureCard 
                icon={<MonitorOff className="w-8 h-8 text-blue-400" />}
                title="UI Stress Testing"
                description="Injects extreme text, huge numbers, and tests responsive breakpoints to find clipping, overflow, and layout shifts."
              />
              <FeatureCard 
                icon={<Accessibility className="w-8 h-8 text-green-400" />}
                title="Accessibility"
                description="Runs deep axe-core audits to detect missing labels, contrast issues, and keyboard navigation traps."
              />
              <FeatureCard 
                icon={<ShieldCheck className="w-8 h-8 text-purple-400" />}
                title="Security Audit"
                description="Passively scans for missing security headers, bad cookie flags, mixed content, and exposed data."
              />
              <FeatureCard 
                icon={<Activity className="w-8 h-8 text-orange-400" />}
                title="Network Testing"
                description="Simulates slow connections, latency spikes, and records failed resource requests and API errors."
              />
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="py-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-12">How EdgeCase Works</h2>
            
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="relative">
                <div className="text-5xl font-extrabold text-primary/10 absolute -top-6 -left-4">01</div>
                <h3 className="text-xl font-semibold mb-3 relative z-10">Provide URL</h3>
                <p className="text-foreground/70 text-sm">Enter the address of your staging or production environment. We support any publicly accessible web application.</p>
              </div>
              <div className="relative">
                <div className="text-5xl font-extrabold text-primary/10 absolute -top-6 -left-4">02</div>
                <h3 className="text-xl font-semibold mb-3 relative z-10">Automated Audit</h3>
                <p className="text-foreground/70 text-sm">Our headless Playwright engine navigates your site, injecting tests and capturing network and accessibility data.</p>
              </div>
              <div className="relative">
                <div className="text-5xl font-extrabold text-primary/10 absolute -top-6 -left-4">03</div>
                <h3 className="text-xl font-semibold mb-3 relative z-10">Actionable Results</h3>
                <p className="text-foreground/70 text-sm">Review a comprehensive dashboard with severity levels, screenshots of broken UI, and exact remediation steps.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Placeholder Results Section */}
        <section className="py-20 border-t border-border bg-card/30">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <h2 className="text-2xl font-bold mb-8">Scan Results</h2>
            <div className="bg-background border border-border rounded-xl p-12 border-dashed flex flex-col items-center justify-center text-foreground/50">
              <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
              <p>No active scan data available.</p>
              <p className="text-sm mt-2">Enter a URL above to generate your first quality report.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-foreground/50 text-sm">
        <p>EdgeCase &copy; {new Date().getFullYear()}. Automated Quality & Security Testing.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-card border border-border p-6 rounded-xl hover:border-primary/50 transition-colors group">
      <div className="bg-background w-14 h-14 rounded-lg border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-foreground/70 leading-relaxed">{description}</p>
    </div>
  );
}
