'use strict';

// Spawns the Phaser 4 sandbox entry via Bun to approximate a boot smoke.
// Pass criteria: process exits within timeout without non-zero code.

const { spawn } = require('child_process');
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

(function main() {
  const entry = { name: 'agentic.boot.game', ok: false, timestamp: new Date().toISOString() };
  const start = Date.now();
  try {
    const child = spawn('bun', ['sandbox/phaser4/main.js'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    const timeout = setTimeout(() => {
      entry.error = 'timeout';
      try { child.kill('SIGKILL'); } catch {}
    }, 8000);
    child.on('close', (code) => {
      clearTimeout(timeout);
      entry.durationMs = Date.now() - start;
      entry.ok = code === 0;
      if (!entry.ok) entry.error = `exit ${code}`;
      // Store a small excerpt for debugging
      entry.stdout = stdout.slice(0, 2000);
      entry.stderr = stderr.slice(0, 2000);
      appendSummary(entry);
      console.log('[agentic] boot-game smoke:', { ok: entry.ok, durationMs: entry.durationMs });
    });
  } catch (e) {
    entry.error = e?.message || String(e);
    appendSummary(entry);
    console.log('[agentic] boot-game smoke:', entry);
  }
})();

