#!/usr/bin/env node
/*
 * Agentic Testing Orchestrator
 * - Runs usage audit, lint, and tests multiple times to sniff flakiness
 * - Aggregates results into .reports/agentic/summary.json
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, '.reports', 'agentic');

function run(cmd, args, opts={}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  return res.status === 0;
}

function runCapture(cmd, args, opts={}) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', shell: false, ...opts });
  return { ok: res.status === 0, out: res.stdout || '', err: res.stderr || '' };
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const summary = { startedAt: new Date().toISOString(), runs: [], audit: null, lintOk: null, sceneImports: [] };

  // Usage audit
  console.log('\n=== Agentic: Usage audit ===');
  const auditOk = run('bun', ['scripts/audit-asset-usage.mjs']);
  summary.audit = auditOk;

  // Lint
  console.log('\n=== Agentic: Lint ===');
  // Auto-fix first, then lint
  run('bunx', ['biome', 'check', '--write', '.']);
  summary.lintOk = run('bunx', ['biome', 'lint', '.']);

  // Optional scene import smokes (parse/load-time issues)
  try {
    const scenesDir = path.join(ROOT, 'src', 'scenes');
    if (fs.existsSync(scenesDir)) {
      const files = fs.readdirSync(scenesDir).filter(f => f.endsWith('.js'));
      for (const f of files) {
        try {
          await import(path.join(scenesDir, f));
          summary.sceneImports.push({ file: `src/scenes/${f}`, ok: true });
        } catch (e) {
          summary.sceneImports.push({ file: `src/scenes/${f}`, ok: false, err: String(e?.message || e) });
        }
      }
    }
  } catch {}

  const runs = Math.max(1, Number(process.env.AGENTIC_RUNS || 2));
  for (let i = 0; i < runs; i++) {
    console.log(`\n=== Agentic: Test run ${i+1} ===`);
    const start = Date.now();
    const cap = runCapture('bun', ['tests/run-tests.cjs']);
    const durationMs = Date.now() - start;
    summary.runs.push({ ok: cap.ok, durationMs, outLen: cap.out.length, errLen: cap.err.length });
    if (!cap.ok) {
      console.error('Test run failed');
    }
  }

  // Flake detection
  const okCounts = summary.runs.filter(r => r.ok).length;
  summary.flaky = okCounts > 0 && okCounts < summary.runs.length;

  // Optional sandbox smokes
  try {
    if (process.env.AGENTIC_CALL_SANDBOX === '1') {
      const mod = await import(path.join(ROOT, 'sandbox/phaser4/main.js'));
      const sb = [];
      const sandboxRuns = Math.max(1, Number(process.env.SANDBOX_RUNS || 1));
      for (let i = 0; i < sandboxRuns; i++) {
        const srun = { iter: i+1 };
        try { srun.boot = await mod.bootPhaser4Sandbox(); } catch { srun.boot = false; }
        try { srun.parallax = await mod.runParallaxSmoke(); } catch { srun.parallax = false; }
        try { srun.rapier = await mod.rapierSmoke(); } catch { srun.rapier = false; }
        try { srun.sp = await mod.runStochasticPlayer(200, (process.env.SEED||1337)+i); } catch { srun.sp = false; }
        try { srun.goal = await mod.runGoalAgent(100, 300); } catch { srun.goal = false; }
        try { srun.parallaxPort = await mod.runParallaxLayersPort(); } catch { srun.parallaxPort = false; }
        try { srun.loader = await mod.runLoaderSmoke(); } catch { srun.loader = false; }
        try {
          const genKey = process.env.SANDBOX_GEN_KEY || 'GEN_BACKDROP_FACTORY_SKY';
          srun.loaderGen = await mod.runLoaderGeneratedSmoke(genKey);
        } catch { srun.loaderGen = false; }
        sb.push(srun);
      }
      summary.sandbox = sb;
    }
  } catch {}

  summary.completedAt = new Date().toISOString();

  const outPath = path.join(REPORT_DIR, 'summary.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log('Agentic summary written:', outPath);

  // Exit with failure if any guaranteed gates failed
  const anyFail = !auditOk || !summary.lintOk || summary.runs.some(r => !r.ok);
  if (anyFail) process.exit(1);
}

main();
