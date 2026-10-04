import { Page } from "playwright";

// Scenarios run entirely inside the browser context.
// We manage state via a global variable to restore text content.
export async function applyScenario(page: Page, scenarioId: string) {
  await page.evaluate((id) => {
    // Initialize backup store if missing
    if (!(window as any).__stressBackup) {
      (window as any).__stressBackup = new Map<Node, string>();
    }
    const backup = (window as any).__stressBackup as Map<Node, string>;

    // Helpers
    function isTextNodeValid(node: Node): boolean {
      if (node.nodeType !== Node.TEXT_NODE) return false;
      const text = node.nodeValue?.trim();
      if (!text) return false; // Ignore empty/whitespace nodes
      const parent = node.parentElement;
      if (!parent) return false;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT'].includes(parent.tagName)) return false;
      return true;
    }

    function getTextNodes(node: Node, textNodes: Node[] = []) {
      if (isTextNodeValid(node)) textNodes.push(node);
      for (let child = node.firstChild; child; child = child.nextSibling) {
        getTextNodes(child, textNodes);
      }
      return textNodes;
    }

    const allTextNodes = getTextNodes(document.body);

    const syntheticStrings: Record<string, (original: string) => string> = {
      "long-text": () => "This is an extremely long string designed to test wrapping and overflow behaviors in UI components. ".repeat(10),
      "long-username": () => "SuperLongUsernameWithNoSpacesAllowedAtAll1234567890",
      "large-numeric": (val: string) => {
        // Only modify if original looks like a number/currency
        if (/^[\$\€\£]?\s*[\d,\.]+/.test(val)) {
          return "$999,999,999,999.99";
        }
        return val; // leave unchanged if not numeric
      },
      "emojis": () => "👨‍👩‍👧‍👦 👩🏽‍💻 🔥 🐛 🛑 🚧 ⚠️ " + "🦊".repeat(20),
      "rtl": () => "مرحبا بك في تطبيقنا، هذا النص هو لاختبار دعم اللغة العربية",
      "empty": () => "",
    };

    const mutator = syntheticStrings[id];
    if (!mutator) throw new Error(`Unknown scenario: ${id}`);

    for (const node of allTextNodes) {
      if (!backup.has(node)) {
        backup.set(node, node.nodeValue || "");
      }
      
      const original = backup.get(node) || "";
      const newValue = mutator(original);
      
      // Only update if changed, to minimize reflows where not needed (e.g. numeric scenario)
      if (newValue !== original) {
        node.nodeValue = newValue;
      }
    }
  }, scenarioId);
}

export async function revertScenarios(page: Page) {
  await page.evaluate(() => {
    const backup = (window as any).__stressBackup as Map<Node, string>;
    if (!backup) return;
    
    for (const [node, originalText] of backup.entries()) {
      node.nodeValue = originalText;
    }
    // We don't clear the map so we can reuse it, or we could clear it. 
    // Keeping it is fine since we reuse the same page.
  });
}

export const SCENARIO_IDS = [
  "long-text",
  "long-username",
  "large-numeric",
  "emojis",
  "rtl",
  "empty"
];
