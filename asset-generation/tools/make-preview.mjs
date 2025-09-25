#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const GEN_DIR = path.resolve('assets/images/generated');
const OUT = path.resolve('.reports/assets/preview.html');

const head = `<!doctype html><meta charset="utf-8"><title>WynIsBuff2 Assets Preview</title>
<style>
body{font-family:ui-sans-serif,system-ui;margin:20px;background:#0b0f14;color:#e6f2ff}
h1{margin:0 0 16px 0}
.wrap{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.card{background:#121923;border:1px solid #213042;border-radius:12px;padding:12px}
.card img{width:100%;image-rendering:pixelated;background:#0e141b;border-radius:8px}
.key{font-size:12px;color:#85a8c7;word-break:break-all;margin-top:8px}
</style>`;
const foot = `<script>console.log('preview loaded')</script>`;

(async () => {
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  const files = await fs.readdir(GEN_DIR).catch(()=>[]);
  const items = await Promise.all(files.filter(f=>/\.(png|webp)$/i.test(f)).map(async f=>{
    const p = path.join(GEN_DIR,f);
    const stat = await fs.stat(p);
    return { f, kb: Math.round(stat.size/1024) };
  }));
  const cards = items.map(({f,kb}) =>
    `<div class="card"><img src="../../assets/images/generated/${f}" alt="${f}"><div class="key">${f} — ${kb} KB</div></div>`
  ).join("");
  const html = `${head}<h1>WynIsBuff2 — Generated Assets</h1><div class="wrap">${cards}</div>${foot}`;
  await fs.writeFile(OUT, html);
  console.log('Preview written:', OUT);
})();

