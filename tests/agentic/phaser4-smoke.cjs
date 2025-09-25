'use strict';

// Lightweight Phaser smoke: require the module and record version.
// Avoids creating a real game instance (no headless canvas here).

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
  } catch (e) {
    // Best-effort; ignore errors
  }
}

(function main() {
  const start = Date.now();
  let ok = false;
  let version = 'unknown';
  let err = null;
  try {
    const phaser = require('phaser');
    version = phaser?.VERSION || 'unknown';
    ok = !!version;
  } catch (e) {
    err = e?.message || String(e);
  }
  const durationMs = Date.now() - start;
  appendSummary({ name: 'agentic.phaser4.module', ok, version, durationMs, error: err, timestamp: new Date().toISOString() });
  console.log('[agentic] phaser4 smoke:', { ok, version, durationMs, error: err });
})();

