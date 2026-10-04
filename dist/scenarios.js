"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCENARIO_IDS = void 0;
exports.applyScenario = applyScenario;
exports.revertScenarios = revertScenarios;
// Scenarios run entirely inside the browser context.
// We manage state via a global variable to restore text content.
async function applyScenario(page, scenarioId) {
    await page.evaluate((id) => {
        // Initialize backup store if missing
        if (!window.__stressBackup) {
            window.__stressBackup = new Map();
        }
        const backup = window.__stressBackup;
        // Helpers
        function isTextNodeValid(node) {
            if (node.nodeType !== Node.TEXT_NODE)
                return false;
            const text = node.nodeValue?.trim();
            if (!text)
                return false; // Ignore empty/whitespace nodes
            const parent = node.parentElement;
            if (!parent)
                return false;
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT'].includes(parent.tagName))
                return false;
            return true;
        }
        function getTextNodes(node, textNodes = []) {
            if (isTextNodeValid(node))
                textNodes.push(node);
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
        if (!mutator)
            throw new Error(`Unknown scenario: ${id}`);
        // Mutate Text Nodes
        for (const node of allTextNodes) {
            if (!backup.has(node)) {
                backup.set(node, node.nodeValue || "");
            }
            const original = backup.get(node) || "";
            const newValue = mutator(original);
            if (newValue !== original) {
                node.nodeValue = newValue;
            }
        }
        // Mutate Form Elements
        for (const el of formElements) {
            // Store on element directly as value changes aren't easily tracked by Node reference in Map for inputs
            if (!backup.has(el)) {
                backup.set(el, el.value || "");
            }
            const original = backup.get(el) || "";
            const newValue = mutator(original);
            if (newValue !== original) {
                // Do not dispatch events to avoid triggering application state changes/submissions
                el.value = newValue;
            }
        }
    }, scenarioId);
}
async function revertScenarios(page) {
    await page.evaluate(() => {
        const backup = window.__stressBackup;
        if (!backup)
            return;
        for (const [node, originalText] of backup.entries()) {
            if (node.nodeType === Node.TEXT_NODE) {
                node.nodeValue = originalText;
            }
            else if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
                node.value = originalText;
            }
        }
    });
}
exports.SCENARIO_IDS = [
    "long-text",
    "long-username",
    "large-numeric",
    "emojis",
    "rtl",
    "empty"
];
