#!/usr/bin/env node
// Mini validator for shots.json (Full Asset Flow spec)
// Ensures each entry has key/kind/prompt and validates sprite/backdrop prompt rules.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SHOTS_FILE = path.join(__dirname, '..', 'shots.json');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

function main() {
  if (!fs.existsSync(SHOTS_FILE)) {
    fail(`shots.json not found at ${SHOTS_FILE}`);
    return;
  }
  let data = JSON.parse(fs.readFileSync(SHOTS_FILE, 'utf8'));

  // Accept both array format (preferred) or { shots: [] } legacy
  if (Array.isArray(data)) {
    // ok
  } else if (data && Array.isArray(data.shots)) {
    data = data.shots.map(s => ({ key: s.id || s.key, kind: s.type || s.kind, prompt: s.prompt }));
  } else {
    fail('shots.json must be an array of shot objects or an object with a shots array');
    return;
  }

  let errors = 0;
  for (const [i, shot] of data.entries()) {
    if (!shot.key || !shot.kind || !shot.prompt) {
      console.error(`❌ Entry ${i} missing key/kind/prompt`);
      errors++;
      continue;
    }
    if (!['sprite', 'backdrop'].includes(shot.kind)) {
      console.error(`❌ Entry ${shot.key} has invalid kind: ${shot.kind}`);
      errors++;
    }
    // Rule: sprites must mention transparent background
    if (shot.kind === 'sprite' && !/transparent background/i.test(shot.prompt)) {
      console.error(`⚠️ Sprite ${shot.key} prompt missing "transparent background"`);
      errors++;
    }
    // Rule: backdrops must NOT mention transparency
    if (shot.kind === 'backdrop' && /transparent/i.test(shot.prompt)) {
      // Allow mentions if explicitly negated (e.g., "(but no alpha)" or "no transparency")
      if (!/(no\s+alpha|no\s+transparency)/i.test(shot.prompt)) {
        console.error(`⚠️ Backdrop ${shot.key} prompt should not mention transparency`);
        errors++;
      } else {
        console.warn(`ℹ️ Backdrop ${shot.key} mentions transparency but negates it (allowed)`);
      }
    }
    // Soft rule: should mention 1024
    if (!/1024/.test(shot.prompt)) {
      console.warn(`ℹ️ ${shot.key} prompt does not explicitly mention 1024x1024`);
    }
  }

  if (errors > 0) {
    fail(`Validation failed with ${errors} error(s).`);
  } else {
    console.log(`✅ Validation passed: ${data.length} entries checked.`);
  }
}

main();
