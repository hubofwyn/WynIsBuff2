#!/usr/bin/env node
// Audits usage of manifest image assets in src/ code.
// Reports:
// - Generated assets present but never referenced via ImageAssets.X
// - References to ImageAssets.X with no manifest entry

import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const MANIFEST = path.join(ROOT, 'assets', 'manifest.json');
const ASSETS_CONST = path.join(ROOT, 'src', 'constants', 'Assets.js');

function rgFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    const ents = fssync.readdirSync(d, { withFileTypes: true });
    for (const e of ents) {
      if (e.isDirectory()) stack.push(path.join(d, e.name));
      else if (e.isFile() && /\.(js|cjs|mjs|ts|tsx)$/.test(e.name)) out.push(path.join(d, e.name));
    }
  }
  return out;
}

async function main(){
  const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  const images = manifest.assets?.images || {};
  const manifestKeys = new Set(Object.keys(images));

  const assetsJs = await fs.readFile(ASSETS_CONST, 'utf8');
  // Extract only the ImageAssets object to avoid picking up ImagePaths mappings
  const startMarker = 'export const ImageAssets = Object.freeze({';
  const endMarker = '});';
  const constMap = new Map();
  const startIdx = assetsJs.indexOf(startMarker);
  if (startIdx !== -1) {
    const afterStart = startIdx + startMarker.length;
    const endIdx = assetsJs.indexOf(endMarker, afterStart);
    if (endIdx !== -1) {
      const block = assetsJs.slice(afterStart, endIdx);
      const matches = [...block.matchAll(/\b([A-Z0-9_]+):\s*'([^']+)'/g)];
      for (const m of matches) constMap.set(m[1], m[2]);
    }
  }

  // Collect referenced constants in src
  const files = rgFiles(SRC);
  const usedConsts = new Set();
  for (const file of files) {
    const txt = await fs.readFile(file, 'utf8');
    for (const [constName] of constMap) {
      const re = new RegExp(`\\bImageAssets\\.${constName}\\b`, 'g');
      if (re.test(txt)) usedConsts.add(constName);
    }
  }

  // Unused generated constants (GEN_*)
  const unusedGen = [...constMap.keys()].filter(k => k.startsWith('GEN_') && !usedConsts.has(k));

  // Missing manifest entries for referenced constants
  const missing = [];
  for (const c of usedConsts) {
    const manifestKey = constMap.get(c);
    if (!manifestKeys.has(manifestKey)) missing.push({ const: c, manifestKey });
  }

  const report = { unusedGeneratedConstants: unusedGen, missingManifestEntries: missing };
  const out = path.join(ROOT, '.reports', 'assets', 'usage-audit.json');
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(report, null, 2));
  console.log('Usage audit written:', out);
  if (unusedGen.length) console.log(`Unused generated: ${unusedGen.length}`);
  if (missing.length) console.log(`Missing manifest entries for references: ${missing.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
