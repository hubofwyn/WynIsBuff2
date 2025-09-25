#!/usr/bin/env bun
/**
 * WynIsBuff2 – Logo Processor
 *
 * Processes a provided logo image to match game specs:
 * - Transparent background (remove white to alpha with configurable fuzz)
 * - Trim to content, then pad to 1024x512 with ~10–16 px safe padding
 * - Add dark stroke (2–4 px) and subtle neon glow for readability on dark BG
 * - Export downsizes 512x256 and 256x128
 *
 * Usage:
 *   bun asset-generation/tools/process-logo.mjs --input path/to/logov4.png [--bg=white] [--fuzz=8] [--stroke=3] [--glow=true]
 *
 * Integration:
 *   Outputs to assets/images/characters/mainlogo.png and @512/@256 variants.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

/** Parse CLI args into a simple object */
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith('--')) continue;
    const keyval = token.replace(/^--/, '');
    const eqIdx = keyval.indexOf('=');
    let key, val;
    if (eqIdx !== -1) {
      key = keyval.slice(0, eqIdx);
      val = keyval.slice(eqIdx + 1);
    } else {
      key = keyval;
      // Support space-separated form: --key value
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        val = next; i++; // consume next token as value
      } else {
        val = true; // bare flag
      }
    }
    if (val === 'true') val = true; else if (val === 'false') val = false;
    params[key] = val;
  }
  return params;
}

/** Run a shell command and throw on failure */
function sh(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

async function main() {
  const {
    input,
    bg = 'white',
    fuzz = '8',        // percentage for background removal
    stroke = '3',      // stroke width in px (approx)
    glow = 'true',     // add neon glow layer
  } = parseArgs();

  if (!input) {
    console.error('Error: --input path/to/logo is required');
    process.exit(1);
  }
  const inputPath = path.resolve(input);
  try { await fs.access(inputPath); } catch {
    console.error(`Error: input not found: ${inputPath}`);
    process.exit(1);
  }

  const ROOT = path.resolve('.');
  const OUT_DIR = path.join(ROOT, 'assets', 'images', 'characters');
  const CACHE_DIR = path.join(ROOT, '.cache', 'assets', 'logo-proc');
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  // 1) Normalize: remove background to alpha, trim, fit to safe box (972x492), center on 1024x512
  const base = path.join(CACHE_DIR, 'base.png');
  const trimmed = path.join(CACHE_DIR, 'trimmed.png');
  const fitted = path.join(CACHE_DIR, 'fitted.png');
  const canvas = path.join(CACHE_DIR, 'canvas.png');

  // Remove background to alpha using fuzz threshold; then trim
  // Note: This will also remove near-white edges; ideal for white BG logos.
  sh('convert', [
    inputPath,
    '-colorspace', 'sRGB',
    '-alpha', 'on',
    '-fuzz', `${fuzz}%`, '-transparent', `${bg}`,
    base,
  ]);

  sh('convert', [
    base,
    '-trim', '+repage',
    trimmed,
  ]);

  // Fit within 972x492 (adds ~10–16 px safe padding when centered on 1024x512)
  sh('convert', [
    trimmed,
    '-resize', '972x492',
    fitted,
  ]);

  sh('convert', [
    '-size', '1024x512', 'xc:none',
    fitted,
    '-gravity', 'center', '-compose', 'over', '-composite',
    canvas,
  ]);

  // 2) Build stroke and optional glow layers from alpha
  const strokePx = Math.max(1, Math.min(6, Number(stroke) || 3));
  const alpha = path.join(CACHE_DIR, 'alpha.png');
  const strokePng = path.join(CACHE_DIR, 'stroke.png');
  const glowPng = path.join(CACHE_DIR, 'glow.png');

  // Extract alpha
  sh('convert', [canvas, '-alpha', 'extract', alpha]);

  // Stroke: dilate alpha outward, colorize dark, use as opacity
  sh('convert', [
    alpha,
    '-morphology', `Dilate`, `Disk:${strokePx}`,
    '-blur', '0x0.5',
    '-threshold', '50%','-write', 'mpr:shell','+delete',
    'mpr:shell', '-fill', '#0F1B2B', '-colorize', '100', '-alpha', 'on',
    '-compose', 'CopyOpacity', alpha, '-composite',
    strokePng,
  ]);

  // Glow: larger radius + neon color
  if (glow === true || glow === 'true') {
    sh('convert', [
      alpha,
      '-morphology', 'Dilate', 'Disk:4',
      '-blur', '0x2',
      '-threshold', '50%','-write', 'mpr:glow','+delete',
      'mpr:glow', '-fill', '#00FF88', '-colorize', '100', '-alpha', 'on',
      '-compose', 'CopyOpacity', alpha, '-composite',
      glowPng,
    ]);
  } else {
    // Create an empty glow layer
    sh('convert', ['-size', '1024x512', 'xc:none', glowPng]);
  }

  // 3) Merge layers: glow under stroke under base content
  const merged = path.join(CACHE_DIR, 'merged.png');
  sh('convert', [
    '-size', '1024x512', 'xc:none',
    glowPng, '-compose', 'over', '-composite',
    strokePng, '-compose', 'over', '-composite',
    canvas, '-compose', 'over', '-composite',
    '-strip', '-depth', '8', '-define', 'png:compression-level=9', '-define', 'png:compression-strategy=1',
    merged,
  ]);

  // 4) Write outputs
  const outMain = path.join(OUT_DIR, 'mainlogo.png');
  const out512 = path.join(OUT_DIR, 'mainlogo@512.png');
  const out256 = path.join(OUT_DIR, 'mainlogo@256.png');

  sh('cp', [merged, outMain]);
  sh('convert', [outMain, '-resize', '512x256', '-strip', '-define', 'png:compression-level=9', out512]);
  sh('convert', [outMain, '-resize', '256x128', '-strip', '-define', 'png:compression-level=9', out256]);

  console.log('Logo processed and exported to:');
  console.log(' -', path.relative(ROOT, outMain));
  console.log(' -', path.relative(ROOT, out512));
  console.log(' -', path.relative(ROOT, out256));
}

main().catch(err => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
