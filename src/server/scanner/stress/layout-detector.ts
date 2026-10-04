import { Page } from "playwright";
import { StressFinding } from "./types";

const layoutDetectorScript = `
  (function(scenario) {
    const findings = [];
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    function getElementSelector(el) {
      if (el.id) return '#' + el.id;
      if (el.className && typeof el.className === "string") {
        return el.tagName.toLowerCase() + '.' + el.className.split(" ").join(".");
      }
      return el.tagName.toLowerCase();
    }

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

    const elements = document.querySelectorAll("body *");
    
    for (const el of Array.from(elements)) {
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(el.tagName)) continue;
      
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || rect.width === 0 || rect.height === 0) {
        continue;
      }

      if (rect.right > viewportWidth + 5) {
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

      if (style.textOverflow !== "ellipsis") {
        const isOverflowHidden = style.overflow === "hidden" || style.overflowX === "hidden" || style.overflowY === "hidden";
        if (isOverflowHidden) {
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
      }

      if ((style.position === "absolute" || style.position === "fixed" || parseFloat(style.marginTop) < 0) && style.zIndex !== "auto") {
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        
        if (centerX >= 0 && centerX <= viewportWidth && centerY >= 0 && centerY <= viewportHeight) {
          const topEl = document.elementFromPoint(centerX, centerY);
          
          if (topEl && topEl !== el && !el.contains(topEl) && !topEl.contains(el)) {
            const topStyle = window.getComputedStyle(topEl);
            
            const isTransparent = topStyle.opacity === "0" || 
                                  topStyle.visibility === "hidden" || 
                                  topStyle.backgroundColor === "rgba(0, 0, 0, 0)" ||
                                  topStyle.backgroundColor === "transparent";
                                  
            const ignoresPointer = topStyle.pointerEvents === "none";
            
            if (!isTransparent && !ignoresPointer) {
              findings.push({
                scenarioName: scenario,
                viewport: { width: viewportWidth, height: viewportHeight },
                selector: getElementSelector(el),
                text: el.innerText ? el.innerText.substring(0, 50) : "",
                boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                computedStyles: { position: style.position, zIndex: style.zIndex },
                description: 'Element is potentially overlapping or obscured by ' + getElementSelector(topEl),
                severity: "medium",
                suspected: true,
              });
            }
          }
        }
      }
    }

    return findings;
  })
`;

export async function detectLayoutIssues(page: Page, scenarioName: string): Promise<StressFinding[]> {
  return await page.evaluate(`${layoutDetectorScript}('${scenarioName}')`);
}
