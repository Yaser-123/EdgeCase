import { Page } from "playwright";
import { StressFinding } from "./types";

export async function detectLayoutIssues(page: Page, scenarioName: string): Promise<StressFinding[]> {
  return await page.evaluate((scenario) => {
    const findings: any[] = [];
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Helper to generate a unique selector
    function getElementSelector(el: HTMLElement): string {
      if (el.id) return `#${el.id}`;
      if (el.className && typeof el.className === "string") {
        return `${el.tagName.toLowerCase()}.${el.className.split(" ").join(".")}`;
      }
      return el.tagName.toLowerCase();
    }

    // 1. Page Horizontal Overflow
    if (document.documentElement.scrollWidth > viewportWidth) {
      findings.push({
        scenarioName: scenario,
        viewport: { width: viewportWidth, height: viewportHeight },
        selector: "html",
        text: "",
        boundingRect: { x: 0, y: 0, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
        computedStyles: {},
        description: "Page has horizontal overflow (scrollWidth > viewport width)",
        severity: "high",
        suspected: false,
      });
    }

    // Process all elements
    const elements = document.querySelectorAll<HTMLElement>("body *");
    
    for (const el of Array.from(elements)) {
      // Ignore non-visual elements
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(el.tagName)) continue;
      
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      
      // Ignore hidden elements
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || rect.width === 0 || rect.height === 0) {
        continue;
      }

      // 2. Elements extending beyond viewport horizontally
      if (rect.right > viewportWidth + 5) {
        // Only flag if it's not a block element legitimately spanning 100% and getting pushed slightly
        findings.push({
          scenarioName: scenario,
          viewport: { width: viewportWidth, height: viewportHeight },
          selector: getElementSelector(el),
          text: el.innerText ? el.innerText.substring(0, 50) : "",
          boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          computedStyles: { display: style.display, position: style.position, width: style.width },
          description: "Element extends beyond the right edge of the viewport",
          severity: "medium",
          suspected: true,
        });
      }

      // 3. Text clipping or truncation
      const isOverflowHidden = style.overflow === "hidden" || style.overflowX === "hidden" || style.overflowY === "hidden";
      if (isOverflowHidden || style.textOverflow === "ellipsis") {
        if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) {
          findings.push({
            scenarioName: scenario,
            viewport: { width: viewportWidth, height: viewportHeight },
            selector: getElementSelector(el),
            text: el.innerText ? el.innerText.substring(0, 50) : "",
            boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            computedStyles: { overflow: style.overflow, textOverflow: style.textOverflow },
            description: "Element content is clipped or overflowing its container",
            severity: "high",
            suspected: false,
          });
        }
      }

      // 4. Overlap Detection (Basic heuristic)
      // Check if this element is overlapping another sibling or text node unexpectedly
      // We only flag elements that have absolute/fixed positioning or negative margins as culprits
      if ((style.position === "absolute" || style.position === "fixed" || parseFloat(style.marginTop) < 0) && style.zIndex !== "auto") {
        // Naive overlap check by taking center point and checking elementFromPoint
        // If elementFromPoint is not this element or its descendant, it might be obscured.
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        
        if (centerX >= 0 && centerX <= viewportWidth && centerY >= 0 && centerY <= viewportHeight) {
          const topEl = document.elementFromPoint(centerX, centerY);
          if (topEl && topEl !== el && !el.contains(topEl) && !topEl.contains(el)) {
            // Found a potential overlap
            findings.push({
              scenarioName: scenario,
              viewport: { width: viewportWidth, height: viewportHeight },
              selector: getElementSelector(el),
              text: el.innerText ? el.innerText.substring(0, 50) : "",
              boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              computedStyles: { position: style.position, zIndex: style.zIndex },
              description: `Element is potentially overlapping or obscured by ${getElementSelector(topEl as HTMLElement)}`,
              severity: "medium",
              suspected: true,
            });
          }
        }
      }
    }

    return findings;
  }, scenarioName);
}
