#!/usr/bin/env node
/*
 * Orchestrate the get-more-buff flow: print workflow plan, run targeted verifications,
 * and execute the test suite. Designed for local dev and CI preflight.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function exists(p) {
  return fs.existsSync(p);
}

function logSection(title) {
  console.log(`\n=== ${title} ===`);
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  return { ok: false, message: msg };
}

function pass(msg) {
  console.log(`✓ ${msg}`);
  return { ok: true, message: msg };
}

function verifyFileContains(file, regex, desc) {
  const content = read(file);
  const ok = regex.test(content);
  return ok ? pass(`${desc}`) : fail(`${desc} (missing in ${file})`);
}

function runCmd(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  return res.status === 0;
}

function printWorkflow() {
  const cfg = JSON.parse(read(path.join(process.cwd(), '.claude-orchestration.json')));
  const wf = cfg.workflows['get-more-buff'];
  logSection('Workflow: get-more-buff');
  wf.steps.forEach((s, i) => {
    console.log(`${i + 1}. ${s.phase} – ${s.agent} (${s.actions.join(', ')})`);
  });
}

function loadTasks() {
  const p = path.join(process.cwd(), 'tasks', 'get-more-buff.json');
  if (!exists(p)) {
    console.error('Tasks file not found:', p);
    process.exit(1);
  }
  return JSON.parse(read(p));
}

function runVerifications() {
  logSection('Verifications');
  const results = [];

  // 1) Event constant exists
  results.push(
    verifyFileContains(
      'src/constants/EventNames.js',
      /BOSS_FIRST_CLEAR:\s*'boss:firstClear'/,
      'EventNames has BOSS_FIRST_CLEAR'
    )
  );

  // 2) PulsarController uses .js extension and emits via EventBus a full payload (heuristic)
  if (exists('src/modules/boss/PulsarController.js')) {
    results.push(
      verifyFileContains(
        'src/modules/boss/PulsarController.js',
        /from\s+['"]\.\.\/\.\.\/constants\/EventNames\.js['"]/,
        'PulsarController imports EventNames with .js extension'
      )
    );
  }

  // 3) BossRewardSystem emits first-clear via EventNames
  if (exists('src/modules/boss/BossRewardSystem.js')) {
    results.push(
      verifyFileContains(
        'src/modules/boss/BossRewardSystem.js',
        /EventNames\.BOSS_FIRST_CLEAR/,
        'BossRewardSystem emits BOSS_FIRST_CLEAR'
      )
    );
  }

  // 4) DeterministicRNG gaussian clamps u1
  if (exists('src/core/DeterministicRNG.js')) {
    results.push(
      verifyFileContains(
        'src/core/DeterministicRNG.js',
        /const\s+u1\s*=\s*Math\.max\(\s*1e-12\s*,\s*this\.next\(stream\)\s*\)/,
        'DeterministicRNG.gaussian clamps u1 >= 1e-12'
      )
    );
  }

  // 5) FactoryScene event emissions via EventBus (heuristic presence)
  if (exists('src/scenes/FactoryScene.js')) {
    const content = read('src/scenes/FactoryScene.js');
    const usesEventBus = content.includes('EventBus') && content.includes('EventNames');
    results.push(usesEventBus ? pass('FactoryScene references EventBus') : fail('FactoryScene should use EventBus for cross-system events'));
  }

  // Summarize
  const ok = results.every(r => r.ok);
  if (!ok) {
    console.error('\nOne or more verifications failed.');
  }
  return ok;
}

function runTests() {
  logSection('Running tests');
  const ok = runCmd('bun', ['tests/run-tests.cjs']);
  if (!ok) {
    console.error('Tests failed');
  }
  return ok;
}

function main() {
  printWorkflow();
  const tasks = loadTasks();
  logSection('Tasks');
  tasks.tasks.forEach((t, i) => {
    console.log(`- [ ] (${t.id}) ${t.title}`);
  });

  const verifyOk = runVerifications();
  const testOk = runTests();
  if (!verifyOk || !testOk) process.exit(1);
  logSection('All checks passed');
}

main();
