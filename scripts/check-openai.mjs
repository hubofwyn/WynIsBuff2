#!/usr/bin/env node
// Simple OpenAI connectivity check: verifies OPENAI_API_KEY and performs a minimal API call.

import fs from 'node:fs';
import path from 'node:path';

function maskKey(k) {
  if (!k) return '';
  if (k.length <= 8) return '****';
  return k.slice(0, 4) + '...' + k.slice(-4);
}

function loadEnvVarFromDotenv(name) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      if (key === name && !process.env[name]) {
        process.env[name] = val;
      }
    }
  } catch {}
}

async function main() {
  const NAME = 'OPENAI_API_KEY';
  loadEnvVarFromDotenv(NAME);
  const key = process.env[NAME];
  if (!key) {
    console.error(`❌ ${NAME} not set. Please add it to the project root .env`);
    process.exit(1);
  }
  const looksValid = key.startsWith('sk-') || key.length > 32;
  console.log(`🔐 ${NAME} present: ${maskKey(key)}${looksValid ? '' : ' (format unrecognized)'}`);

  // Minimal, low-cost endpoint: list models (no tokens consumed)
  const res = await fetch('https://api.openai.com/v1/models?limit=1', {
    method: 'GET',
    headers: { Authorization: `Bearer ${key}` }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`❌ OpenAI connectivity failed: ${res.status} ${res.statusText}\n${text}`);
    process.exit(1);
  }
  const json = await res.json();
  const first = json?.data?.[0]?.id || 'unknown-model';
  console.log(`✅ OpenAI connectivity confirmed. Example model: ${first}`);
}

main().catch(err => {
  console.error('❌ Error during check:', err?.message || err);
  process.exit(1);
});

