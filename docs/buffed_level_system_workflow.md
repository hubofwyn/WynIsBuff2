## Buffed Level System Orchestrated Workflow

This guide makes the “buffed” level and rewards loop practical and automated using the orchestration and asset tooling already in this repo. It ties code fixes, tests, and art generation into one predictable flow you can run locally and in CI.

—

### Goals
- Complete Run → Rewards → Forge → Factory loop with deterministic behavior and tests.
- Normalize events and resources so systems interoperate cleanly.
- Generate and audit first‑wave art assets under budget with resume‑safe runs.
- Produce a reproducible, locked asset manifest with a quick visual preview.

—

### Prerequisites
- Node 18+ and npm.
- Root `.env` with `OPENAI_API_KEY` set. Verify: `npm run check:openai`.
- Read the workflow plan: `npm run get-more-buff:plan`.

—

### One‑Command Happy Path
Use this to gate PRs while you build out tasks incrementally.

```
npm run get-more-buff  # prints workflow, runs verifications, then tests
```

This calls `scripts/orchestrate-get-more-buff.cjs` which checks event constants, boss reward wiring, determinism guardrails, and runs the test suite. It will fail until tasks in `tasks/get-more-buff.json` are completed.

—

### Phase A — Events, Rewards, Determinism
Bring the systems into agreement first. These changes are small and unlock everything else.

Commands
- Show phases: `npm run get-more-buff:plan`
- Verify + tests: `npm run get-more-buff`

Acceptance Gates (verified by orchestrator)
- Event constant `EventNames.BOSS_FIRST_CLEAR === 'boss:firstClear'` exists.
- Boss defeat emits via global `EventBus` with `{ bossId, runScore, timeElapsed, hitsTaken }`.
- `DeterministicRNG.gaussian` clamps `u1 >= 1e-12` to avoid `log(0)`.
- `FactoryScene` references `EventBus` for cross‑system events (heuristic).

Files of interest
- `src/constants/EventNames.js`
- `src/modules/boss/PulsarController.js`
- `src/modules/boss/BossRewardSystem.js`
- `src/scenes/FactoryScene.js`
- `src/core/DeterministicRNG.js`

—

### Phase B — Factory × Lanes Integration
Wire `FactoryScene` to real production lanes and unify resource accounting.

Tasks (see `tasks/get-more-buff.json`)
- Drive Factory from `EnhancedCloneManager` lanes; show `effectiveRate`, decay, stability.
- Unify where rewards are credited (extend or map to `EconomyManager`).
- Add integration tests (BossRewardSystem, lanes → production → collection).

Commands
- Run test suite: `npm test`

—

### Phase C — First‑Wave Art Assets (Budgeted, Resume‑Safe)
If you already ran moneyed image generations, focus on integrating and using what’s present under `assets/images/generated/`. The generation steps remain available but should be run only when you actually need new assets.

Shot Definitions
- File: `asset-generation/shots.json` (43+ entries, expanded to 46 in plan)
- Validator: `asset-generation/tools/validate-shots.mjs`

Integrate What You Have
- Manifest already includes generated keys (prefixed `gen*`), and `src/constants/Assets.js` exposes `ImageAssets.GEN_*` and `ImagePaths.*`.
- Preloader autoloads all generated image keys; no manual wiring needed for new ones.
- Usage audit to spot unused or missing references:
  - `npm run assets:usage-audit` → writes `.reports/assets/usage-audit.json`

Generate (Only If Needed)
- Dry-run budget estimate:
  - `node asset-generation/tools/wyn-gfx.mjs all --budget=20 --n=4 --dry-run`
- Thumbs → score → finals:
  - `npm run gfx:thumbs` → `npm run gfx:score` → `npm run gfx:final`
- Then integrate, preview, and lock as below.

Audit, Integrate, Preview, Lock
- Audit images (dimensions, POT, alpha presence):
  - `npm run gfx:audit`
- Integrate winners into game assets and update manifest/constants:
  - `npm run gfx:integrate`
- Make a quick visual preview grid HTML:
  - `npm run --prefix asset-generation gfx:preview`
- Write a lockfile with SHA‑256s for reproducibility:
  - `npm run --prefix asset-generation gfx:lock`

Budget & Safety
- Budget guard defaults to `$20`; adjust with `--budget=...`.
- Resume‑safe skips already generated files and reuses scores.
- Backdrops must NOT use alpha; sprites/UI must use alpha. The validator enforces this.

Where results land
- Generated images: `asset-generation/generated/` (intermediate) and `assets/images/generated/` (integrated finals)
- Reports: `.reports/assets/*` (scores, audit, preview)
- Manifest: `assets/manifest.json` (+ `assets/manifest.lock.json` after lock step)

—

### Phase D — CI Gate (recommended)
Add a CI job that runs the orchestrator and asset audit to block regressions.

Suggested steps
- `npm ci`
- `npm run get-more-buff` (verifications + tests)
- `npm run gfx:audit` (should pass on integrated images in `assets/images/generated/`)

Optional
- Run `check:openai` and a small `gfx:thumbs` smoke on a feature branch (skip on forks).

—

### Operations — Day‑to‑Day Use
- Iterating on code: run `npm run get-more-buff` frequently; keep tasks green.
- Using existing assets: rely on autoloaded `ImageAssets.GEN_*` keys directly in scenes.
- If you need a few new assets: update `asset-generation/shots.json`, then run thumbs → score → finals → integrate for just those (use `--include=…`).
- Partial runs (only when needed):
  - `node asset-generation/tools/wyn-gfx.mjs thumbs --include=sprite_wyn --budget=5`

—

### Patterns — Using the Assets In‑Game
- Parallax backdrops (any biome):
  - Import helper: `import { ParallaxLayers } from '../systems/ParallaxLayers.js'`
  - Create layers in a Scene:
    - `const { container } = ParallaxLayers.create(this, [ImageAssets.GEN_BACKDROP_FACTORY_SKY, ImageAssets.GEN_BACKDROP_FACTORY_MID, ImageAssets.GEN_BACKDROP_FACTORY_FORE, ImageAssets.GEN_BACKDROP_FACTORY_FG], [0.1, 0.3, 0.6, 0.9]);`
    - `this.add.existing(container);`
- Sprites/UI: Use `ImageAssets.GEN_SPRITE_*` and `ImageAssets.GEN_UI_*` directly in `add.image` or as textures for sprites.
- Backdrops policy: Keep backdrops behind gameplay; do not apply alpha or blend modes that reintroduce transparency.

—

### Ownership & Acceptance
Source of truth for work items and acceptance criteria:
- `tasks/get-more-buff.json` — task IDs, dependencies, success criteria, file list, owners
- `.claude-orchestration.json` — workflow phases and intended actions
- `scripts/orchestrate-get-more-buff.cjs` — verifications wired to concrete code

When all gates pass:
- The loop Run → Rewards → Forge → Factory is deterministic and test‑covered.
- First‑wave art is integrated, previewable, audited, and locked.
- Event names and resource flows are normalized; logs are gated in production.

—

### Troubleshooting
- Missing `OPENAI_API_KEY`: set it in project root `.env`, then `npm run check:openai`.
- Asset validator fails: fix prompts in `asset-generation/shots.json` (sprites must say “transparent background”; backdrops must not use alpha).
- Budget exceeded: use `--budget=…` or run in smaller batches with `--include=…`.
- Integration failed to update constants: ensure `npm run generate-assets` works locally (used by the integrator).

This workflow stays grounded in the current codebase and tooling, so you can adopt it incrementally and keep shipping while leveling up the system.
