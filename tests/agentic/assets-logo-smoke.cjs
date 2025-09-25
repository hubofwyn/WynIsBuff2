'use strict';

// Check that the logo asset referenced by ImagePaths exists on disk under assets/.
const fs = require('fs');
const path = require('path');
const { ImagePaths } = require('../../src/constants/Assets.js');

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

(function main() {
  const rel = ImagePaths.LOGO;
  const full = path.join(process.cwd(), 'assets', rel);
  const ok = fs.existsSync(full);
  const entry = { name: 'agentic.assets.logo', ok, path: 'assets/' + rel, timestamp: new Date().toISOString() };
  if (!ok) entry.error = 'Logo file missing on disk';
  appendSummary(entry);
  console.log('[agentic] assets-logo-smoke:', entry);
})();

