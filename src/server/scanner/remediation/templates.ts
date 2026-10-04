import { Remediation } from "./types";
import { StressFinding } from "../stress/types";
import { SecurityFinding } from "../security/types";
import { NetworkFinding } from "../network/types";

// Accessibility
export function generateA11yRemediation(finding: any): Remediation {
  const ruleId = finding.id;
  const description = finding.description;
  const selectors = finding.nodes.map((n: any) => n.target.join(", ")).join(" | ");

  let whyItMatters = "Accessibility issues prevent users with disabilities from navigating or using your application effectively.";
  let recommendedFix = "Review the affected elements and apply appropriate ARIA attributes or semantic HTML.";

  if (ruleId.includes("color-contrast")) {
    whyItMatters = "Low contrast text is difficult or impossible to read for users with low vision or color blindness.";
    recommendedFix = "Increase the contrast ratio between the text and its background to at least 4.5:1 for normal text.";
  } else if (ruleId.includes("label") || ruleId.includes("name")) {
    whyItMatters = "Without an accessible name, screen readers cannot announce the purpose of form fields or buttons.";
    recommendedFix = "Add an aria-label, aria-labelledby, or visible text label to the element.";
  } else if (ruleId.includes("landmark")) {
    whyItMatters = "Missing landmarks make it harder for screen reader users to jump between sections of the page.";
    recommendedFix = "Wrap your content in semantic landmark tags like <main>, <nav>, <header>, or <footer>.";
  } else if (ruleId.includes("keyboard")) {
    whyItMatters = "Interactive elements must be operable by keyboard alone for users who cannot use a mouse.";
    recommendedFix = "Ensure the element has a valid tabindex and listens for 'Enter' or 'Space' keydown events.";
  }

  const prompt = `Please fix the following Accessibility issue:

**Issue**: ${ruleId} (${description})
**Affected Selectors**: \`${selectors}\`

**Why it matters**:
${whyItMatters}

**Investigation & Fix Instructions**:
1. Locate the component(s) corresponding to the selector(s) provided.
2. ${recommendedFix}
3. Preserve the existing component's design, layout, and core functionality.
4. Add or update tests to prevent this accessibility regression.
5. Do not hallucinate file paths; please search the codebase to find where the selector is defined.
6. Once complete, report the modified files and run the tests.`;

  return { whyItMatters, recommendedFix, prompt };
}

// UI Stress
export function generateStressRemediation(finding: StressFinding): Remediation {
  let whyItMatters = "Unexpected layout breakages under stress degrade the user experience and can make the UI inaccessible.";
  let recommendedFix = "Ensure the element uses responsive CSS units, allows text wrapping, or implements scrolling.";

  if (finding.issueType === "Document Horizontal Overflow") {
    whyItMatters = "Unintentional document-level horizontal scrolling ruins mobile experiences and breaks the viewport layout.";
    recommendedFix = "Locate the element pushing the width beyond 100vw, and apply max-width: 100% or overflow-x: hidden to the container.";
  } else if (finding.issueType === "Element Viewport Overflow") {
    whyItMatters = "Elements extending past the viewport cause horizontal scrolling or become partially invisible.";
    recommendedFix = "Use max-width: 100%, allow text to wrap with word-break: break-word, or place it inside a container with overflow-x: auto.";
  } else if (finding.issueType === "Content Clipping") {
    whyItMatters = "Clipped text makes content unreadable, which is especially problematic for dynamic data, long usernames, or translations.";
    recommendedFix = "Allow the container to expand vertically, or use text-overflow: ellipsis with a tooltip for truncated text.";
  } else if (finding.issueType === "Element Overlap") {
    whyItMatters = "Overlapping elements can obscure important text or make buttons unclickable, leading to broken functionality.";
    recommendedFix = "Review the z-index stacking context and absolute positioning to ensure the elements do not visually collide.";
  }

  let selectorList = finding.selector || "";
  if (finding.affectedElements && finding.affectedElements.length > 0) {
    selectorList = finding.affectedElements.slice(0, 3).map(el => el.selector).join(", ");
    if (finding.affectedElements.length > 3) selectorList += " and more...";
  }

  const verificationInstruction = finding.suspected 
    ? "This is a *suspected* issue. Please visually verify if the overlap or layout issue is an actual defect before applying changes." 
    : "This is a confirmed layout defect.";

  const prompt = `Please fix the following UI Layout issue:

**Scenario**: ${finding.scenarioName.toUpperCase()}
**Issue Type**: ${finding.issueType}
**Affected Selector(s)**: \`${selectorList}\`
**Severity**: ${finding.severity}

**Why it matters**:
${whyItMatters}

**Investigation & Fix Instructions**:
1. ${verificationInstruction}
2. Locate the component matching the selector(s).
3. ${recommendedFix}
4. Ensure the design remains consistent under normal conditions. Do not remove essential layout structures.
5. Please write a regression test or unit test asserting the layout properties if possible.
6. Do not guess file paths; search for the selector. Report modified files and test results when done.`;

  return { whyItMatters, recommendedFix, prompt };
}

// Security
export function generateSecurityRemediation(finding: SecurityFinding): Remediation {
  let whyItMatters = "Security misconfigurations leave the application vulnerable to common web attacks.";
  let recommendedFix = finding.remediation || "Review the configuration and apply secure defaults.";

  if (finding.category === "cookie-security") {
    whyItMatters = "Cookies missing Secure or HttpOnly flags can be intercepted over unencrypted connections or stolen via XSS.";
  } else if (finding.category === "mixed-content") {
    whyItMatters = "Loading HTTP resources on an HTTPS page degrades the connection security and exposes users to active man-in-the-middle attacks.";
  } else if (finding.category === "information-disclosure") {
    whyItMatters = "Exposing internal version numbers or framework details helps attackers tailor their exploits against specific software versions.";
  } else if (finding.checkName.includes("Header") || finding.checkName.includes("CSP")) {
    whyItMatters = "Missing security headers (like CSP, HSTS, or X-Frame-Options) bypass standard browser protections against XSS, clickjacking, and packet sniffing.";
  }

  const prompt = `Please fix the following Security configuration issue:

**Issue**: ${finding.checkName} (${finding.category})
**Severity**: ${finding.severity}
**Evidence**: ${finding.evidence}

**Why it matters**:
${whyItMatters}

**Investigation & Fix Instructions**:
1. Locate where the headers, cookies, or configurations are defined in the server or middleware layer.
2. ${recommendedFix}
3. IMPORTANT: Never disable existing security protections or relax CORS/CSP rules unless absolutely necessary and explicitly authorized.
4. Do not commit hardcoded secrets or credentials during your fix.
5. Add or update security unit tests to enforce this protection.
6. Report the modified files and test results when complete.`;

  return { whyItMatters, recommendedFix, prompt };
}

// Network
export function generateNetworkRemediation(finding: NetworkFinding): Remediation {
  let whyItMatters = "Users often experience degraded network conditions; failing to handle these gracefully leads to broken pages and poor UX.";
  let recommendedFix = finding.remediation || "Implement error boundaries, fallback states, or retry logic.";

  if (finding.description.includes("failed") || finding.description.includes("aborted")) {
    whyItMatters = "Network requests can fail due to ad-blockers, timeouts, or offline states. The app must survive these failures.";
    recommendedFix = "Implement a graceful fallback (e.g., error boundaries, skeleton loaders, or default placeholder images) so the UI doesn't crash.";
  } else if (finding.description.includes("slow") || finding.description.includes("timeout")) {
    whyItMatters = "Slow responses can cause the user to think the app is frozen if there is no loading indicator.";
    recommendedFix = "Ensure there is a clear loading state (spinner, skeleton) and a timeout handling mechanism.";
  }
  
  const isSimulated = !finding.applicationErrorOccurred && (finding.description.includes("simulated") || finding.description.includes("dropped"));
  const contextInstruction = isSimulated
    ? "NOTE: This failure was a deliberately simulated network drop. DO NOT try to fix the network request itself. Instead, ensure the application handles the failure gracefully (e.g. by showing an error message or fallback UI)."
    : "The application experienced an actual crash or unhandled error due to this network condition. Implement proper error catching and fallback states.";

  const resources = Array.isArray(finding.resourceUrl) ? finding.resourceUrl.join(", ") : finding.resourceUrl || "Unknown Resource";

  const prompt = `Please fix the following Network Resilience issue:

**Scenario**: ${finding.scenarioName.toUpperCase()}
**Affected Resource(s)**: \`${resources}\`
**Severity**: ${finding.severity}

**Why it matters**:
${whyItMatters}

**Investigation & Fix Instructions**:
1. Locate the component or service fetching the affected resource.
2. ${contextInstruction}
3. ${recommendedFix}
4. Ensure the design is preserved and the fallback UI aligns with the existing design system.
5. Add a regression test for the network failure state.
6. Report the modified files and test results when done.`;

  return { whyItMatters, recommendedFix, prompt };
}
