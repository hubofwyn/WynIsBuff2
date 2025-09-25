#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const MANIFEST = path.resolve('assets/manifest.json');
const LOCK = path.resolve('assets/manifest.lock.json');

function sha256(buf){ return crypto.createHash('sha256').update(buf).digest('hex'); }

(async()=>{
  const raw = await fs.readFile(MANIFEST, 'utf8');
  const json = JSON.parse(raw);
  const entries = [];
  const images = json.assets?.images || {};
  for (const [key, meta] of Object.entries(images)) {
    const p = path.resolve('assets', meta.path.startsWith('images')? meta.path : meta.path);
    let hash = 'MISSING';
    try { hash = sha256(await fs.readFile(p)); } catch {}
    entries.push({ key, path: meta.path, sha256: hash });
  }
  const lock = { generatedAt: new Date().toISOString(), entries };
  await fs.writeFile(LOCK, JSON.stringify(lock, null, 2));
  console.log('Lock written:', LOCK);
})();

