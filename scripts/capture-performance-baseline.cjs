'use strict';

// Minimal performance baseline capture.
// Records timestamp, Node/Bun versions, approximate dist size, and file counts.

const fs = require('fs');
const path = require('path');

function dirSizeBytes(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) total += dirSizeBytes(p);
    else total += st.size;
  }
  return total;
}

function countFiles(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) total += countFiles(p);
    else total += 1;
  }
  return total;
}

function main() {
  const out = {
    timestamp: new Date().toISOString(),
    env: {
      node: process.version,
      bun: process.env.BUN_INSTALL ? 'installed' : 'unknown'
    },
    repo: {
      srcFiles: countFiles(path.join(process.cwd(), 'src')),
      testFiles: countFiles(path.join(process.cwd(), 'tests'))
    },
    build: {
      distExists: fs.existsSync(path.join(process.cwd(), 'dist')),
      distSizeBytes: dirSizeBytes(path.join(process.cwd(), 'dist'))
    }
  };

  const reportsDir = path.join(process.cwd(), '.reports', 'perf');
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, 'baseline.json'), JSON.stringify(out, null, 2));

  const docsDir = path.join(process.cwd(), 'docs', 'refactor');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'perf-baseline.json'), JSON.stringify(out, null, 2));

  console.log('Wrote .reports/perf/baseline.json and docs/refactor/perf-baseline.json');
}

main();
