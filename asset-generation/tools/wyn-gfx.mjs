#!/usr/bin/env node
// WynIsBuff2 – Asset Generation CLI (no execution here; framework only)
// Commands: init, thumbs, score, final, all

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const GEN_DIR = path.resolve(__dirname, '..', 'generated');
const REPORT_DIR = path.join(ROOT, '.reports', 'assets');
const CACHE_DIR = path.join(ROOT, '.cache', 'assets');

// Lazy dotenv load without hard dependency (so repo stays light)
async function loadEnv() {
  try {
    const dotenv = await import('dotenv');
    dotenv.config({ path: path.join(ROOT, '.env') });
  } catch (_) {
    // fallback: rely on the environment
  }
}

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required env: ${name}. Set it in project root .env`);
  }
  return val;
}

async function ensureDirs() {
  await fs.mkdir(GEN_DIR, { recursive: true });
  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

async function writeJson(p, obj) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(obj, null, 2), 'utf8');
}

// Approximate budget model (USD); adjust to your pricing
const PRICES = {
  image512: 0.02,            // gpt-image-1 512x512 standard (estimate)
  image1024High: 0.08,       // gpt-image-1 1024x1024 high (estimate)
  imageEdit512: 0.02,        // inpaint/edit 512x512 (estimate)
  imageEdit1024High: 0.08,   // inpaint/edit 1024x1024 high (estimate)
  visionScorePerImage: 0.0005 // gpt-4o-mini vision (estimate)
};

class BudgetGuard {
  constructor(capUSD) {
    this.cap = Number(capUSD) || 20;
    this.spend = 0;
  }
  charge(amount, reason) {
    this.spend += amount;
    if (this.spend > this.cap) {
      throw new Error(`Budget exceeded: $${this.spend.toFixed(2)} > $${this.cap.toFixed(2)} while ${reason}`);
    }
  }
}

async function initShots() {
  const shotsPath = path.join(__dirname, '..', 'shots.json');
  const stylePath = path.join(__dirname, '..', 'style.md');
  const exists = async p => !!(await fs.stat(p).catch(() => null));
  if (!(await exists(shotsPath))) {
    await fs.writeFile(shotsPath, JSON.stringify({ version: 1, shots: [] }, null, 2));
  }
  if (!(await exists(stylePath))) {
    await fs.writeFile(stylePath, '# Style\n');
  }
  console.log('Initialized shots.json and style.md');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'help';
  const params = {};
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      const val = v === undefined ? true : v;
      // normalize booleans
      params[k] = val === 'true' ? true : val === 'false' ? false : val;
    }
  }
  return { cmd, params };
}

async function openaiFetch(pathname, body) {
  const API_KEY = requireEnv('OPENAI_API_KEY');
  const res = await fetch(`https://api.openai.com/v1/${pathname}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }
  return res.json();
}

async function generateImages({ n = 4, size = 512, shots, budget, quality = 'low', dryRun = false }) {
  const out = [];
  for (const shot of shots) {
    for (let i = 0; i < n; i++) {
      const sizeStr = '1024x1024';
      const sizeTag = sizeStr.split('x')[0];
      const body = {
        model: 'gpt-image-1',
        prompt: `${shot.prompt}\n\nGlobal style:\n${await fs.readFile(path.join(__dirname, '..', 'style.md'), 'utf8')}`,
        size: sizeStr,
        quality
      };
      const estimate = PRICES.image1024High;
      budget.charge(estimate, `generating ${shot.id} ${sizeTag}`);
      const filename = `${shot.id}_${sizeTag}_${i + 1}.png`;
      const outPath = path.join(GEN_DIR, filename);
      // Resume-safe: skip if file already exists
      if (!dryRun && (await fs.stat(outPath).catch(() => null))) {
        console.log(`[resume] Skipping existing ${outPath}`);
        out.push(outPath);
        continue;
      }
      if (dryRun) {
        console.log(`[dry-run] Would generate ${outPath}`);
        out.push(outPath);
      } else {
        const json = await openaiFetch('images/generations', body);
        const b64 = json.data?.[0]?.b64_json;
        if (!b64) throw new Error('No image data returned');
        const buf = Buffer.from(b64, 'base64');
        await fs.writeFile(outPath, buf);
        out.push(outPath);
        console.log(`Saved ${outPath}`);
      }
    }
  }
  return out;
}

async function scoreThumbnails(files, { budget, dryRun = false }) {
  // Vision ranking using gpt-4o-mini (cheap), heuristic prompt
  const API_KEY = dryRun ? null : requireEnv('OPENAI_API_KEY');
  const ranked = [];
  // Reuse existing scores when available
  let existing = [];
  try { existing = await readJson(path.join(REPORT_DIR, 'thumb-scores.json')); } catch {}
  const existingMap = new Map(existing.map(e => [e.file, e.score]));
  for (const f of files) {
    if (existingMap.has(f)) {
      ranked.push({ file: f, score: existingMap.get(f) });
      continue;
    }
    const buf = await fs.readFile(f);
    const b64 = buf.toString('base64');
    budget.charge(PRICES.visionScorePerImage, `scoring ${path.basename(f)}`);
    let score = 0;
    if (dryRun) {
      console.log(`[dry-run] Would score ${path.basename(f)}`);
      score = 50; // nominal
    } else {
      const body = {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Rate this asset 0-100 for game readability, clean silhouette, and style consistency.' },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } }
            ]
          }
        ]
      };
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`Vision score failed: ${res.status}`);
      const json = await res.json();
      const text = json.choices?.[0]?.message?.content?.trim() || '0';
      score = Number((text.match(/\d{1,3}/) || [0])[0]);
    }
    ranked.push({ file: f, score: isFinite(score) ? score : 0 });
  }
  ranked.sort((a, b) => b.score - a.score);
  const reportPath = path.join(REPORT_DIR, 'thumb-scores.json');
  await writeJson(reportPath, ranked);
  console.log(`Scores saved: ${reportPath}`);
  return ranked;
}

async function editImage({ input, mask, prompt, size = 512, budget, dryRun = false }) {
  const absInput = path.resolve(process.cwd(), input);
  const absMask = path.resolve(process.cwd(), mask);
  const inputBuf = await (await import('node:fs')).promises.readFile(absInput);
  const maskBuf = await (await import('node:fs')).promises.readFile(absMask);
  const estimate = size >= 1024 ? PRICES.imageEdit1024High : PRICES.imageEdit512;
  budget.charge(estimate, `editing ${path.basename(input)} ${size}`);

  const filename = `${path.parse(absInput).name}_edit_${size}.png`;
  const outPath = path.join(GEN_DIR, filename);

  if (dryRun) {
    console.log(`[dry-run] Would inpaint ${absInput} with ${absMask} → ${outPath}`);
    return outPath;
  }

  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', prompt);
  form.append('size', `${size}x${size}`);
  form.append('image', new Blob([inputBuf], { type: 'image/png' }), 'image.png');
  form.append('mask', new Blob([maskBuf], { type: 'image/png' }), 'mask.png');

  const API_KEY = requireEnv('OPENAI_API_KEY');
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    body: form
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Image edit failed: ${res.status} ${txt}`);
  }
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error('No edited image data returned');
  const buf = Buffer.from(b64, 'base64');
  await fs.writeFile(outPath, buf);
  console.log(`Saved ${outPath}`);
  return outPath;
}

async function estimateAll({ shots, n = 4, winnersRatio = 0.25 }) {
  const thumbs = shots.length * n;
  const finals = Math.max(1, Math.ceil(shots.length * winnersRatio));
  const costs = {
    thumbs: thumbs * PRICES.image512,
    score: thumbs * PRICES.visionScorePerImage,
    finals: finals * PRICES.image1024High
  };
  costs.total = costs.thumbs + costs.score + costs.finals;
  await writeJson(path.join(REPORT_DIR, 'dry-run-estimate.json'), { n, winnersRatio, shots: shots.length, ...costs });
  console.log(`Dry-run estimate: $${costs.total.toFixed(2)} (thumbs $${costs.thumbs.toFixed(2)}, score $${costs.score.toFixed(2)}, finals $${costs.finals.toFixed(2)})`);
  return costs;
}

async function main() {
  const { cmd, params } = parseArgs();
  await loadEnv();
  await ensureDirs();

  if (cmd === 'init') {
    await initShots();
    return;
  }

  const shotsPath = path.join(__dirname, '..', 'shots.json');
  let raw = await readJson(shotsPath);
  // Support both [{ key, kind, prompt }] and { shots: [{ id/type, prompt }] }
  let normalized = [];
  if (Array.isArray(raw)) {
    normalized = raw.map(s => ({ id: s.key, type: s.kind, prompt: s.prompt }));
  } else if (raw && Array.isArray(raw.shots)) {
    normalized = raw.shots.map(s => ({ id: s.id || s.key, type: s.type || s.kind, prompt: s.prompt }));
  } else {
    throw new Error('shots.json must be an array or an object with a shots array');
  }
  let selected = normalized;
  // Optional filter: --include=comma,separated,terms (matches id substrings)
  if (params.include) {
    const terms = String(params.include).split(',').map(s => s.trim()).filter(Boolean);
    selected = normalized.filter(s => terms.some(t => s.id.includes(t)));
    if (selected.length === 0) {
      console.warn(`[warn] include filter matched 0 shots: ${terms.join(', ')}`);
      selected = normalized;
    }
  }
  const concurrency = Number(params.concurrency || 3);
  const budget = new BudgetGuard(params.budget || 20);
  const n = Number(params.n || 4);
  const dryRun = Boolean(params['dry-run'] || params.dryrun || false);

  const runThumbs = async () => {
    console.log(`Generating thumbnails (${n} × ${selected.length}) at 1024`);
    // Simple concurrency pool
    const queue = [...selected];
    const results = [];
    const workers = Array.from({ length: concurrency }, async () => {
      while (queue.length) {
        const taskChunk = [queue.shift()].filter(Boolean);
        if (taskChunk.length) {
          results.push(
            ...(await generateImages({ n, size: 512, shots: taskChunk, budget, dryRun }))
          );
        }
      }
    });
    await Promise.all(workers);
    return results;
  };

  const runFinals = async (winners) => {
    console.log(`Generating finals (${winners.length}) at 1024`);
    // finals: one per winner prompt; map back to shots by id prefix
    const byShot = new Map();
    for (const w of winners) {
      const base = path.basename(w);
      const id = base.split('_')[0];
      const shot = selected.find(s => s.id.startsWith(id));
      if (shot && !byShot.has(shot.id)) byShot.set(shot.id, shot);
    }
    return generateImages({ n: 1, size: 1024, shots: [...byShot.values()], budget, quality: 'high', dryRun });
  };

  if (cmd === 'thumbs' || cmd === 'all') {
    if (dryRun) {
      await estimateAll({ shots: selected, n });
    } else {
      await runThumbs();
    }
    if (cmd !== 'all') return;
  }

  if (cmd === 'score' || cmd === 'all') {
    const files = (await fs.readdir(GEN_DIR))
      .filter(f => /_(1024|512)_\d+\.png$/i.test(f))
      .map(f => path.join(GEN_DIR, f));
    const ranked = await scoreThumbnails(files, { budget, dryRun });
    if (cmd !== 'all') return;
    // Pick the top file per shot id to ensure coverage
    const bestPerShot = new Map(); // id -> { file, score }
    for (const r of ranked) {
      const base = path.basename(r.file);
      const id = base.split('_')[0];
      const prev = bestPerShot.get(id);
      if (!prev || r.score > prev.score) bestPerShot.set(id, { file: r.file, score: r.score });
    }
    params._winners = Array.from(bestPerShot.values()).map(v => v.file);
  }

  if (cmd === 'final' || cmd === 'all') {
    const winners = params._winners || [];
    if (winners.length === 0 && cmd === 'final') {
      console.warn('No winners provided; select files from generated/*_512_*.png');
      return;
    }
    await runFinals(winners);
  }

  if (cmd === 'edit') {
    const input = params.input || params.i;
    const mask = params.mask || params.m;
    const prompt = params.prompt || params.p || 'Apply minor cleanup while preserving alpha silhouette.';
    const size = Number(params.size || 512);
    if (!input || !mask) {
      console.error('Usage: edit --input=path/to.png --mask=path/to-mask.png [--prompt="..."] [--size=512|1024] [--dry-run]');
      return;
    }
    await editImage({ input, mask, prompt, size, budget, dryRun });
  }
}

// Do not auto-run if imported; only when executed as CLI
if (import.meta.url === `file://${__filename}`) {
  const arg = process.argv[2];
  if (!arg || arg === 'help' || arg === '--help' || arg === '-h') {
    console.log('wyn-gfx CLI ready. Commands: init | thumbs | score | final | all');
    console.log('Example: node asset-generation/tools/wyn-gfx.mjs all --budget=20 --concurrency=3 --n=4');
    process.exit(0);
  }
  // Execute main. This file will reach out to OpenAI only when run by the user.
  // Our setup step does not invoke it.
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
