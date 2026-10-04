# 🚀 EdgeCase

**Break your web app before your users do.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-edgecase--ai.vercel.app-blue?style=for-the-badge)](https://edgecase-ai.vercel.app/)
[![Watch Demo](https://img.shields.io/badge/Watch_Video-YouTube-red?style=for-the-badge&logo=youtube)](https://youtu.be/-6Y50hW3FuQ)

EdgeCase is an autonomous, enterprise-grade web application scanner that stress-tests your UI, audits accessibility, uncovers passive security flaws, and simulates network duress in a single pass. 

Stop guessing how your UI reacts to extreme conditions. EdgeCase tests it for you and provides actionable, AI-powered remediation prompts.

---

## 🌟 Key Features

### 1. UI Stress Testing
Injects extreme data (e.g., 50,000-character strings) into your UI elements to dynamically test responsive clipping, horizontal overflows, and container boundaries.
### 2. Network Resilience
Simulates offline states, high latency, and dropped packets to verify that your app degrades gracefully and handles network errors cleanly.
### 3. Accessibility (A11y) Auditing
Automatically scans for missing landmarks, poor contrast ratios, missing ARIA labels, and WCAG compliance issues.
### 4. Passive Security Scans
Detects missing security headers (HSTS, CSP, X-Frame-Options) and highlights potential mixed-content vulnerabilities.
### 5. AI Fix Assistant 🤖
Every finding includes clear explanations ("Why it matters"), technical recommendations, and **copy-ready AI coding prompts** that you can feed to Cursor, GitHub Copilot, or ChatGPT for instant remediation.

---

## 🔗 Links
- **Live Application:** [https://edgecase-ai.vercel.app/](https://edgecase-ai.vercel.app/)
- **Demo Video:** [https://youtu.be/-6Y50hW3FuQ](https://youtu.be/-6Y50hW3FuQ)

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS (Zinc/Dark Mode)
- **Scanning Engine:** Playwright / `@sparticuz/chromium-min`
- **Deployment:** Vercel (Serverless Functions)

---

## 💻 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Yaser-123/EdgeCase.git
   cd EdgeCase
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Vercel Deployment

EdgeCase is fully configured to run on Vercel's Serverless environment using dynamic Chromium fetching (`@sparticuz/chromium-min`) to bypass the 50MB function size limit.

1. Import the project into Vercel.
2. The `next.config.ts` is pre-configured with `outputFileTracingIncludes` and `serverExternalPackages` to correctly package the Chromium engine.
3. The API route (`/api/scan`) is configured with `maxDuration = 60` to ensure deep scans don't hit the 10-second Hobby timeout.

---

## 📄 HTML Export
You can instantly export any scan result as a standalone, offline-ready HTML report to share with your QA team, product managers, or clients. The report preserves all findings and AI prompts in a beautiful dark-mode interface.
