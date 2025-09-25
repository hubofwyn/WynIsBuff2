#!/usr/bin/env node
// Integrate generated finals into assets/ and update assets/manifest.json, then regenerate constants

import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const GEN_DIR = path.resolve(__dirname, '..', 'generated');
const TARGET_DIR = path.join(ROOT, 'assets', 'images', 'generated');
const MANIFEST = path.join(ROOT, 'assets', 'manifest.json');
const SCORES = path.join(ROOT, '.reports', 'assets', 'thumb-scores.json');

function toCamel(key) {
  return key.replace(/[_-](\w)/g, (_, c) => c.toUpperCase());
}
function toPascal(key) {
  const c = toCamel(key);
  return c.charAt(0).toUpperCase() + c.slice(1);
}
function normalizeIdForKey(id) {
  // Remove common stop words like 'the' in ids
  const cleaned = id.replace(/(^|_)the_/g, '$1');
  return cleaned;
}

async function integrate() {
  await fs.mkdir(TARGET_DIR, { recursive: true });
  // Determine winners via thumb-scores (best per shot)
  let scored = [];
  try { scored = JSON.parse(await fs.readFile(SCORES, 'utf8')); } catch {}
  const bestPerShot = new Map(); // id -> { file, score }
  for (const r of scored) {
    const base = path.basename(r.file);
    const parts = base.replace(/\.png$/i, '').split('_');
    const id = parts.slice(0, -2).join('_'); // drop size and index
    const prev = bestPerShot.get(id);
    if (!prev || (r.score || 0) > (prev.score || 0)) bestPerShot.set(id, r);
  }
  const files = Array.from(bestPerShot.values()).map(r => path.basename(r.file));
  if (files.length === 0) {
    console.log('No winners found in scores. Skipping integration.');
    return;
  }

  const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  manifest.assets = manifest.assets || {};
  manifest.assets.images = manifest.assets.images || {};

  for (const f of files) {
    const parts = f.replace(/\.png$/i, '').split('_');
    const id = parts.slice(0, -2).join('_'); // e.g., sprite_wyn_idle
    const name = `${id}_final.png`;
    const src = path.join(GEN_DIR, f);
    const dst = path.join(TARGET_DIR, name);
    await fs.copyFile(src, dst);
    const key = `gen${toPascal(normalizeIdForKey(id))}`; // e.g., genSpriteClumperBoss
    manifest.assets.images[key] = {
      type: 'image',
      path: `images/generated/${name}`,
      description: `Generated final for ${id}`
    };
    console.log(`Integrated ${f} → ${manifest.assets.images[key].path} (key: ${key})`);
  }

  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`Updated manifest: ${MANIFEST}`);

  // Regenerate constants
  const res = spawnSync('npm', ['run', 'generate-assets'], { stdio: 'inherit', cwd: ROOT });
  if (res.status !== 0) {
    throw new Error('Failed to regenerate assets constants');
  }
}

if (import.meta.url === `file://${__filename}`) {
  integrate().catch(err => { console.error(err); process.exit(1); });
}
