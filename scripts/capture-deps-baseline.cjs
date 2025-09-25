'use strict';

// Capture a simple dependency baseline to docs/refactor/deps-baseline.txt
// Uses npm ls to avoid Bun-specific behavior and provide a familiar output.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  } catch (e) {
    return (e.stdout || '').toString() || (e.stderr || '').toString();
  }
}

function main() {
  const header = '# Dependency Baseline (npm ls --depth=0)\n';
  const timestamp = `# Captured: ${new Date().toISOString()}\n\n`;
  const tree = run('npm ls --depth=0');
  const outDir = path.join(process.cwd(), 'docs', 'refactor');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'deps-baseline.txt'), header + timestamp + tree, 'utf8');
  console.log('Wrote docs/refactor/deps-baseline.txt');
}

main();
