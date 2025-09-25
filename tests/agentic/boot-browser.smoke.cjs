'use strict';

// Browser boot smoke using Playwright if available.
// Skips gracefully if Playwright is not installed.

const fs = require('fs');
const path = require('path');

function appendSummary(entry) {
  const outDir = path.join(process.cwd(), '.reports', 'agentic');
  const file = path.join(outDir, 'summary.json');
  const base = { runs: [], flaky: false };
  try { fs.mkdirSync(outDir, { recursive: true }); } catch {}
  try {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      data.runs.push(entry);
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } else {
      base.runs.push(entry);
      fs.writeFileSync(file, JSON.stringify(base, null, 2));
    }
  } catch {}
}

(async function main() {
  const entry = { name: 'agentic.boot.browser', ok: false, skipped: false, timestamp: new Date().toISOString() };
  try {
    let chromium;
    try {
      chromium = require('playwright').chromium;
    } catch {
      entry.skipped = true;
      entry.ok = true;
      entry.reason = 'playwright not installed';
      appendSummary(entry);
      console.log('[agentic] boot-browser smoke: skipped (no Playwright)');
      return;
    }
    const port = process.env.VITE_PREVIEW_PORT || '4173';
    const url = `http://localhost:${port}/smoke.html`;
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      errors.push(String(err));
    });
    const start = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForFunction(() => window.__SMOKE_OK__ === true, { timeout: 8000 });
    const hadCanvas = await page.evaluate(() => !!window.__SMOKE_CANVAS__);
    entry.ok = hadCanvas && errors.length === 0;
    entry.durationMs = Date.now() - start;
    entry.errors = errors.slice(0, 10);
    // Capture screenshot on failure for triage
    if (!entry.ok) {
      const outDir = path.join(process.cwd(), '.reports', 'agentic');
      const shot = path.join(outDir, 'boot-browser.fail.png');
      try { fs.mkdirSync(outDir, { recursive: true }); } catch {}
      try {
        await page.screenshot({ path: shot, fullPage: true });
        entry.screenshot = shot;
      } catch {}
    }
    await browser.close();
    appendSummary(entry);
    console.log('[agentic] boot-browser smoke:', { ok: entry.ok, durationMs: entry.durationMs, errors: entry.errors.length });
  } catch (e) {
    entry.error = e?.message || String(e);
    appendSummary(entry);
    console.log('[agentic] boot-browser smoke FAILED:', entry.error);
  }
})();
