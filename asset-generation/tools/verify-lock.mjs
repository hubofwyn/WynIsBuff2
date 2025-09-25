#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const MANIFEST = path.resolve('assets/manifest.json');
const LOCK = path.resolve('assets/manifest.lock.json');

function sha256(buf){ return crypto.createHash('sha256').update(buf).digest('hex'); }

async function computeLock() {
  const raw = await fs.readFile(MANIFEST, 'utf8');
  const json = JSON.parse(raw);
  const entries = [];
  const images = json.assets?.images || {};
  for (const [key, meta] of Object.entries(images)) {
    const rel = meta.path;
    const p = path.resolve('assets', rel.startsWith('images')? rel : rel);
    let hash = 'MISSING';
    try { hash = sha256(await fs.readFile(p)); } catch {}
    entries.push({ key, path: meta.path, sha256: hash });
  }
  return { generatedAt: null, entries };
}

async function main() {
  const expected = await computeLock();
  let current;
  try { current = JSON.parse(await fs.readFile(LOCK, 'utf8')); } catch { current = null; }
  if (!current) {
    console.error('Lockfile missing:', LOCK);
    process.exit(1);
  }
  const mismatch = [];
  const curMap = new Map((current.entries||[]).map(e=>[`${e.key}|${e.path}`, e.sha256]));
  for (const e of expected.entries) {
    const k = `${e.key}|${e.path}`;
    const cur = curMap.get(k);
    if (!cur || cur !== e.sha256) mismatch.push({ key: e.key, path: e.path, expected: e.sha256, current: cur });
  }
  if (mismatch.length) {
    console.error('Manifest lock mismatch for', mismatch.length, 'entries');
    mismatch.slice(0,10).forEach(m=>console.error(` - ${m.key} (${m.path})`));
    process.exit(1);
  }
  console.log('Manifest lock verified OK');
}

main().catch(err => { console.error(err); process.exit(1); });

