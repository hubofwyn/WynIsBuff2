Boom 💪 I dropped a complete, copy-pasteable **Node CLI** into the canvas that will keep your image spend **under \~\$20** while still delivering high-quality finals:

### What you’ve got now

* **`tools/wyn-gfx.mjs`** — the CLI:

  * `init` → seeds `shots.json` + `style.md`
  * `thumbs` → cheap **512²** variations with **gpt-image-1**
  * `score` → auto-ranks thumbnails with **gpt-4o-mini** (cheap vision)
  * `final` → generates **1024²** winners at `quality:"high"`
  * `all` → runs the whole pipeline with a **BudgetGuard** (soft cap `--budget 20`)
* **`shots.json`** — starter shot list (biomes, arena plates, sprites)
* **`style.md`** — global art direction for consistent results
* **`tools/audit-images.mjs`** — sanity checks (dims, POT, alpha, size) → `.reports/assets/audit.json`
* **`package.json`** scripts to run everything with **pnpm** (works with npm/yarn too)
* **`.env.example`** — set your `OPENAI_API_KEY`

### How to run

```bash
# 1) Set your API key in the project root .env
echo "OPENAI_API_KEY=sk-..." >> .env

# 2) Install asset-generation deps (dotenv only)
npm install --prefix asset-generation

# 3) Initialize shot/style files
npm run gfx:init

# 4) Controlled run (thumbnails → score → finals) with soft budget cap
npm run gfx:all -- --budget 20 --concurrency 3 --n 4

# 5) Audit outputs
npm run gfx:audit

### Edit / Inpainting

```bash
# Example: clean up edges using a transparent mask (white = keep, black = edit)
npm run gfx:edit -- --input asset-generation/generated/sprite_wyn_idle_512_1.png \
  --mask asset-generation/masks/sprite_wyn_idle_mask.png \
  --prompt "Tighten edges and preserve silhouette" --size 512
```

### Dry-Run (no API calls)

Add `--dry-run` to estimate costs and write `.reports/assets/dry-run-estimate.json`:

```bash
npm run gfx:all -- --budget 20 --concurrency 3 --n 4 --dry-run
```
```

### What it outputs

* **`generated/`**: sprites (PNG-32, transparent) + backdrops (WebP by default)
* **`.reports/assets/audit.json`**: quick health report
* Heuristic budget readout at the end (tweak `charge()` if your dashboard differs)

If you want edits/inpainting (e.g., fix an edge on a sprite), the `edit` subcommand calls `gpt-image-1`’s **mask edits** with a one-line PNG mask and keeps the same size/alpha.

Notes:
- Commands above are root-level npm scripts that proxy to asset-generation/package.json.
- Node 18+ is required (uses global fetch).
- Pricing constants in `tools/wyn-gfx.mjs` are estimates—tune `PRICES` to your dashboard.
