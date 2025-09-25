#!/usr/bin/env node
/*
 * Orchestrate the refactor-phase-1 flow: enforce asset constants, scene unification,
 * LevelLoader parallax mapping, and quality gates (usage audit + tests).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();

function read(p) { return fs.readFileSync(p, 'utf8'); }
function exists(p) { return fs.existsSync(p); }
function log(title) { console.log(`\n=== ${title} ===`); }
function pass(msg){ console.log(`✓ ${msg}`); return true; }
function fail(msg){ console.error(`✗ ${msg}`); return false; }

function printWorkflow() {
  try {
    const cfg = JSON.parse(read(path.join(ROOT, '.claude-orchestration.json')));
    const wf = cfg.workflows['refactor-phase-1'];
    log('Workflow: refactor-phase-1');
    wf.steps.forEach((s, i) => console.log(`${i+1}. ${s.phase} – ${s.agent} (${s.actions.join(', ')})`));
  } catch (e) {
    console.warn('Could not read .claude-orchestration.json:', e?.message || e);
  }
}

function loadTasks() {
  const p = path.join(ROOT, 'tasks', 'refactor-phase-1.json');
  if (!exists(p)) return null;
  return JSON.parse(read(p));
}

function run(cmd, args, opts={}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  return res.status === 0;
}

function scanScenesForLiteralTextures() {
  // Flag add.image/add.sprite with string literal keys in src/scenes/*.js
  const dir = path.join(ROOT, 'src', 'scenes');
  if (!exists(dir)) return pass('Scenes directory not found (skipping)');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  const offenders = [];
  const re = /\badd\.(image|sprite)\s*\([^,]*,[^,]*,\s*['"][a-zA-Z0-9_\-\/]+['"]/g;
  for (const f of files) {
    const txt = read(path.join(dir, f));
    const matches = txt.match(re) || [];
    // Allow using constants; block only bare string keys
    if (matches.length) offenders.push({ file: f, hits: matches });
  }
  if (offenders.length) {
    console.error('Found string literal texture keys in scenes:');
    offenders.forEach(o => console.error(` - ${o.file}: ${o.hits.length} occurrence(s)`));
    return false;
  }
  return pass('No string literal texture keys in scenes');
}

function verifyRunSceneParallax() {
  const p = path.join(ROOT, 'src', 'scenes', 'RunScene.js');
  if (!exists(p)) return pass('RunScene.js missing (skipping)');
  const txt = read(p);
  const hasImport = /from\s+['"]\.\.\/systems\/ParallaxLayers\.js['"]/m.test(txt);
  const usesParallax = /ParallaxLayers\.create\(/.test(txt);
  return (hasImport && usesParallax) ? pass('RunScene uses ParallaxLayers') : fail('RunScene must import and use ParallaxLayers');
}

function verifyLevelLoaderParallax() {
  const p = path.join(ROOT, 'src', 'modules', 'level', 'LevelLoader.js');
  if (!exists(p)) return pass('LevelLoader.js missing (skipping)');
  const txt = read(p);
  const hasImport = /from\s+['"]\.\.\/\.\.\/systems\/ParallaxLayers\.js['"]/m.test(txt);
  const usesMap = /parallaxKeysFor\(/.test(txt);
  return (hasImport && usesMap) ? pass('LevelLoader imports ParallaxLayers and uses parallax map') : fail('LevelLoader must import ParallaxLayers and use parallax map');
}

function infoCheckLegacyParallaxStrings() {
  const p = path.join(ROOT, 'src', 'modules', 'level', 'LevelLoader.js');
  if (!exists(p)) return pass('Legacy parallax check skipped (LevelLoader missing)');
  const txt = read(p);
  if (/parallax-\w+/.test(txt)) {
    console.warn('ℹ️ Info: LevelLoader still references legacy parallax keys; ensure fallbacks remain optional.');
  } else {
    pass('No legacy parallax string keys found in LevelLoader');
  }
  return true;
}

function infoScanScenesForLegacyParallax() {
  const dir = path.join(ROOT, 'src');
  const offenders = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    const ents = fs.readdirSync(d, { withFileTypes: true });
    for (const e of ents) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) stack.push(fp);
      else if (e.isFile() && /\.(js|mjs|cjs)$/.test(e.name)) {
        const text = read(fp);
        if (/['"]parallax-[a-z]/.test(text)) offenders.push(fp);
      }
    }
  }
  if (offenders.length) {
    console.warn('ℹ️ Info: Found legacy parallax string keys in:');
    offenders.slice(0, 10).forEach(f => console.warn(' -', path.relative(ROOT, f)));
    if (offenders.length > 10) console.warn(` …and ${offenders.length - 10} more`);
  } else {
    pass('No legacy parallax string keys found in src/');
  }
  return true;
}

function verifyWelcomeAndSettingsUseGenUIButton() {
  const targets = [
    path.join(ROOT, 'src', 'scenes', 'WelcomeScene.js'),
    path.join(ROOT, 'src', 'scenes', 'MainMenu.js'),
    path.join(ROOT, 'src', 'scenes', 'SettingsScene.js'),
  ];
  let found = 0;
  for (const p of targets) {
    if (!exists(p)) continue;
    const txt = read(p);
    if (/ImageAssets\.GEN_UI_BUTTON_PRIMARY/.test(txt)) found++;
  }
  return found > 0 ? pass('Generated UI button used in at least one menu/scene') : fail('Generated UI button not found in menus/scenes');
}

function verifyPreloaderAutoloadGen() {
  const p = path.join(ROOT, 'src', 'scenes', 'Preloader.js');
  if (!exists(p)) return pass('Preloader.js missing (skipping)');
  const txt = read(p);
  return /startsWith\(['"]GEN_['"]\)/.test(txt) ? pass('Preloader autoloads GEN_* assets') : fail('Preloader must autoload GEN_* assets');
}

function verifyImportExtensions() {
  // Informational: list relative imports without .js extension in src/
  const offenders = [];
  const stack = [path.join(ROOT, 'src')];
  while (stack.length) {
    const d = stack.pop();
    if (!fs.existsSync(d)) continue;
    const ents = fs.readdirSync(d, { withFileTypes: true });
    for (const e of ents) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) stack.push(fp);
      else if (e.isFile() && /\.(js|mjs)$/.test(e.name)) {
        const txt = read(fp);
        const re = /import\s+[^'"\n]+from\s+['"](\.\.\/|\.\/)[^'"\n]*[^'"\n\.]['"]/g;
        if (re.test(txt)) offenders.push(path.relative(ROOT, fp));
      }
    }
  }
  if (offenders.length) {
    console.error('Relative imports missing .js extension found in:');
    offenders.slice(0, 20).forEach(f => console.error(' -', f));
    if (offenders.length > 20) console.error(` …and ${offenders.length - 20} more`);
    return false;
  }
  return pass('All relative imports include .js extension');
}

function runUsageAudit() {
  return run('bun', ['scripts/audit-asset-usage.mjs']);
}

function runTests() {
  // Use Bun to run the custom test runner script
  return run('bun', ['tests/run-tests.cjs']);
}

function runLint() {
  // Auto-fix then lint to reduce friction
  run('bunx', ['biome', 'check', '--write', '.']);
  return run('bunx', ['biome', 'lint', '.']);
}

function runTypecheck() {
  // Optional gate for JS project: run ts typecheck if available
  return run('bunx', ['tsc', '--noEmit']);
}

function main() {
  printWorkflow();
  const tasks = loadTasks();
  if (tasks) {
    log('Tasks');
    tasks.tasks.forEach(t => console.log(`- [ ] (${t.id}) ${t.title}`));
  }

  log('Verifications');
  const checks = [];
  checks.push(scanScenesForLiteralTextures());
  checks.push(verifyRunSceneParallax());
  checks.push(verifyLevelLoaderParallax());
  checks.push(verifyWelcomeAndSettingsUseGenUIButton());
  checks.push(verifyPreloaderAutoloadGen());
  infoCheckLegacyParallaxStrings();
  infoScanScenesForLegacyParallax();
  checks.push(verifyImportExtensions());
  const okChecks = checks.every(Boolean);
  if (!okChecks) process.exitCode = 1;

  log('Usage audit');
  if (!runUsageAudit()) process.exitCode = 1;

  log('Lint');
  if (!runLint()) process.exitCode = 1;

  log('Typecheck');
  if (!runTypecheck()) {
    console.warn('Typecheck failed or TypeScript not installed; proceed as non-blocking for now.');
  }

  log('Verify manifest lock');
  if (!run('bun', ['asset-generation/tools/verify-lock.mjs'])) process.exitCode = 1;

  log('Tests');
  if (!runTests()) process.exitCode = 1;

  if (process.exitCode) {
    console.error('\nOne or more gates failed. See logs above.');
    process.exit(process.exitCode);
  } else {
    log('All gates passed');
  }
}

main();
