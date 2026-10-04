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
        return el.tagName.toLowerCase() + '.' + el.className.trim().replace(/\\s+/g, ".");
      }
      return el.tagName.toLowerCase();
    }

    function hasHorizontalScrollAncestor(el) {
      let parent = el.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (style.overflowX === "auto" || style.overflowX === "scroll" || style.overflow === "auto" || style.overflow === "scroll") {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    }

    // 1. Document-level horizontal overflow
    if (document.documentElement.scrollWidth > viewportWidth + 10) {
      findings.push({
        scenarioName: scenario,
        issueType: "Document Horizontal Overflow",
        selector: "html",
        text: "",
        boundingRect: { x: 0, y: 0, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
        computedStyles: {},
        description: "The page has unintended document-level horizontal overflow (scrollWidth > viewportWidth).",
        severity: "high",
        suspected: false,
      });
    }

    const elements = document.querySelectorAll("body *");
    
    for (const el of Array.from(elements)) {
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(el.tagName)) continue;
      
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      
      // Ignore invisible elements
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || rect.width === 0 || rect.height === 0) {
        continue;
      }

      // 2. Element extending beyond viewport (and not inside an intentional scroll container)
      if (rect.right > viewportWidth + 5 && rect.left < viewportWidth) {
        if (!hasHorizontalScrollAncestor(el)) {
          findings.push({
            scenarioName: scenario,
            issueType: "Element Viewport Overflow",
            selector: getElementSelector(el),
            text: el.innerText ? el.innerText.substring(0, 50).replace(/\\n/g, ' ') : "",
            boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            computedStyles: { display: style.display, position: style.position, width: style.width },
            description: "Element extends beyond the right edge of the viewport.",
            severity: "low",
            suspected: true,
          });
        }
      }

      // 3. Clipping detection
      if (style.textOverflow !== "ellipsis") {
        const isOverflowHidden = style.overflow === "hidden" || style.overflowX === "hidden" || style.overflowY === "hidden";
        // Avoid flagging if -webkit-line-clamp is intentionally used
        const isLineClamp = style.webkitLineClamp && style.webkitLineClamp !== "none";
        
        if (isOverflowHidden && !isLineClamp) {
          if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) {
            findings.push({
              scenarioName: scenario,
              issueType: "Content Clipping",
              selector: getElementSelector(el),
              text: el.innerText ? el.innerText.substring(0, 50).replace(/\\n/g, ' ') : "",
              boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              computedStyles: { overflow: style.overflow, textOverflow: style.textOverflow },
              description: "Element content is clipped or overflowing its container.",
              severity: "medium", // Adjusted severity
              suspected: false,
            });
          }
        }
      }

      // 4. Overlap detection
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
                issueType: "Element Overlap",
                selector: getElementSelector(el),
                text: el.innerText ? el.innerText.substring(0, 50).replace(/\\n/g, ' ') : "",
                boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                computedStyles: { position: style.position, zIndex: style.zIndex },
                description: 'Element is potentially overlapping or obscured by ' + getElementSelector(topEl),
                severity: "low",
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
