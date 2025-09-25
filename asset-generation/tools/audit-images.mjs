#!/usr/bin/env node
// Simple image audit: checks size, dimensions, POT, alpha present, writes JSON report

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const GEN_DIR = path.resolve(__dirname, '..', 'generated');
const REPORT_DIR = path.join(ROOT, '.reports', 'assets');

function isPowerOfTwo(n) { return (n & (n - 1)) === 0; }

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

async function getPngInfo(buf) {
  // Minimal PNG header parsing for width/height
  // PNG signature 8 bytes + IHDR chunk
  if (buf.length < 24 || buf.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  // IHDR color type at offset 25
  const colorType = buf.readUInt8(25);
  const hasAlpha = colorType === 4 || colorType === 6; // 4: grayscale+alpha, 6: truecolor+alpha
  return { width, height, hasAlpha };
}

async function audit() {
  await ensureDir(REPORT_DIR);
  const files = (await fs.readdir(GEN_DIR).catch(() => []))
    .filter(f => /\.(png|webp)$/i.test(f));

  const report = [];
  for (const f of files) {
    const p = path.join(GEN_DIR, f);
    const buf = await fs.readFile(p);
    const sizeKB = buf.length / 1024;
    let width = null, height = null, hasAlpha = null;
    if (/\.png$/i.test(f)) {
      const png = await getPngInfo(buf);
      if (png) { width = png.width; height = png.height; hasAlpha = png.hasAlpha; }
    }
    const pot = width && height ? (isPowerOfTwo(width) && isPowerOfTwo(height)) : null;
    report.push({ file: f, sizeKB: Number(sizeKB.toFixed(1)), width, height, powerOfTwo: pot, hasAlpha });
  }
  const out = path.join(REPORT_DIR, 'audit.json');
  await fs.writeFile(out, JSON.stringify(report, null, 2));
  console.log(`Wrote ${out}`);
}

if (import.meta.url === `file://${__filename}`) {
  audit().catch(err => { console.error(err); process.exit(1); });
}
