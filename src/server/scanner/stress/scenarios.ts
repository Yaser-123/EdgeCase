import { Page } from "playwright";

// Scenarios run entirely inside the browser context.
// We use a raw string for evaluate to prevent TS transpiler (like tsx) from injecting __name helpers that break Playwright.
const browserScript = `
  (function(id) {
    if (!window.__stressBackup) {
      window.__stressBackup = new Map();
    }
    const backup = window.__stressBackup;

    function isTextNodeValid(node) {
      if (node.nodeType !== Node.TEXT_NODE) return false;
      const text = node.nodeValue?.trim();
      if (!text) return false;
      const parent = node.parentElement;
      if (!parent) return false;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'TEXTAREA'].includes(parent.tagName)) return false;
      return true;
    }

    function getTextNodes(node, textNodes = []) {
      if (isTextNodeValid(node)) textNodes.push(node);
      for (let child = node.firstChild; child; child = child.nextSibling) {
        getTextNodes(child, textNodes);
      }
      return textNodes;
    }

    function getFormElements() {
      const inputs = Array.from(document.querySelectorAll("input"));
      const textareas = Array.from(document.querySelectorAll("textarea"));
      
      const allowedInputTypes = ["text", "email", "url", "search", "tel", "number"];
      
      const validInputs = inputs.filter(input => {
        const type = (input.getAttribute("type") || "text").toLowerCase();
        return allowedInputTypes.includes(type);
      });

      return [...validInputs, ...textareas];
    }

    const allTextNodes = getTextNodes(document.body);
    const formElements = getFormElements();

    const syntheticStrings = {
      "long-text": () => "This is an extremely long string designed to test wrapping and overflow behaviors in UI components. ".repeat(10),
      "long-username": () => "SuperLongUsernameWithNoSpacesAllowedAtAll1234567890",
      "large-numeric": (val) => {
        if (/^[\\$\\€\\£]?\\s*[\\d,\\.]+/.test(val)) {
          return "$999,999,999,999.99";
        }
        return val;
      },
      "emojis": () => "👨‍👩‍👧‍👦 👩🏽‍💻 🔥 🐛 🛑 🚧 ⚠️ " + "🦊".repeat(20),
      "rtl": () => "مرحبا بك في تطبيقنا، هذا النص هو لاختبار دعم اللغة العربية",
      "empty": () => "",
    };

    const mutator = syntheticStrings[id];
    if (!mutator) throw new Error("Unknown scenario: " + id);

    for (const node of allTextNodes) {
      if (!backup.has(node)) backup.set(node, node.nodeValue || "");
      const original = backup.get(node) || "";
      const newValue = mutator(original);
      if (newValue !== original) node.nodeValue = newValue;
    }

    for (const el of formElements) {
      if (!backup.has(el)) backup.set(el, el.value || "");
      const original = backup.get(el) || "";
      const newValue = mutator(original);
      if (newValue !== original) el.value = newValue;
    }
  })
`;

export async function applyScenario(page: Page, scenarioId: string) {
  await page.evaluate(`${browserScript}('${scenarioId}')`);
}

export async function revertScenarios(page: Page) {
  await page.evaluate(`
    (function() {
      const backup = window.__stressBackup;
      if (!backup) return;
      
      for (const [node, originalText] of backup.entries()) {
        if (node.nodeType === Node.TEXT_NODE) {
          node.nodeValue = originalText;
        } else {
          node.value = originalText;
        }
      }
    })();
  `);
}

export const SCENARIO_IDS = [
  "long-text",
  "long-username",
  "large-numeric",
  "emojis",
  "rtl",
  "empty"
];
