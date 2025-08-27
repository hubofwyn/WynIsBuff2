
## What I added (and re-emphasized)

* **0A) HOTFIX: Asset Integrity & Resilience (NOW)**
  Step-by-step plan to:

  * audit and quarantine bad assets,
  * harden the loader (await decode, mipmaps OFF by default),
  * refine fail-safes so **asset failures don’t disable physics/player**, and
  * clean up WebGL deprecations.

* **Submission Quickstart** now starts with:

  ```
  wfac assets audit ... --out .reports/assets/audit.json --fix-report .reports/assets/fixes.md
  ```

  so your agents produce a machine-readable fail list + suggested fixes.

* **CLI Stubs** gained `assets audit`, with outputs designed for agentic consumption.

* **GitHub Actions** gained an **assets-audit job** that fails the build if any corrupt/invalid images are detected.

* **Evidence Bundle** now requires the asset audit and a before/after **episode artifact** to prove stability.

* **0B) HOTFIX: Event Constants & Wiring (NOW)**
  Step-by-step plan to:
  
  * add missing `BOSS_FIRST_CLEAR` in `src/constants/EventNames.js` (`boss:firstClear`),
  * instantiate `BossRewardSystem` early (e.g., Boot/Hub) so it subscribes to `boss:defeated`,
  * make boss controllers emit a complete defeat payload via the global `EventBus`:
    `{ bossId, runScore, timeElapsed, hitsTaken }` (fix Pulsar import to `EventNames.js`),
  * standardize on `EventBus` for factory/boss/clone events (avoid scene-local `this.events.emit` for cross-system signals),
  * keep forge events consistent: `clone:forgeStart/clone:forgeComplete` only.

* **0C) HOTFIX: Resource Schema Unification (NOW)**
  Decide and enforce one resource authority:
  
  * Option A: extend `EconomyManager` with `coins`, `buffDNA`, `gritShards`; route BossRewardSystem and FactoryScene through it;
  * Option B: remap rewards to existing `EconomyManager` pools (`energy/matter/timeCrystals`) and rename UI labels accordingly;
  * Update FactoryScene and Results/Rewards to use the same manager; remove ad‑hoc `GameStateManager` resource mutations.

* **0D) HOTFIX: Factory × EnhancedCloneManager (NOW)**
  Replace simulated production with real lanes:
  
  * source lanes from `EnhancedCloneManager.getInstance().lanes`,
  * display `effectiveRate`, decay percent, and stability; subscribe to `idle:decayApplied`, boost events,
  * compute production/collection based on lane output; emit factory events via `EventBus`,
  * remove `this.time.now % 1000` progress hack; base progress on real production ticks.

* **0E) HOTFIX: Determinism Safety (NOW)**
  * clamp `u1` in `DeterministicRNG.gaussian` to `>= 1e‑12` before `Math.log(u1)`,
  * add unit tests for `gaussian`, `weighted`, `shuffle` edge cases.

* **0F) TESTS: Real Integration Coverage (NOW)**
  * add a CJS test that imports the real `BossRewardSystem` and `EventNames` to catch missing constants and resource/API mismatches,
  * add a lane integration test: forge clone → lane created → decay over simulated time → production accrues → factory reflects it,
  * basic FactoryScene headless boot: asserts it renders lanes from `EnhancedCloneManager` and listens on `EventBus`,
  * ensure all new tests are required in `tests/run-tests.cjs`.

* **0G) Save/Load Cohesion (SOON)**
  * centralize manager state persistence: ensure `BossRewardSystem.serialize/deserialize` is invoked by a single save/load path (e.g., via `GameStateManager.saveFullIdleState/loadFullIdleState`),
  * persist `EnhancedCloneManager` lanes and boosts; reconcile on load; compute offline production via its API.

* **0H) Noise & Style (SOON)**
  * gate logs (`console.log/warn/error`) behind a debug flag or `NODE_ENV !== 'production'`,
  * enforce two‑space indentation for web code and alphabetize barrel exports/imports for new/modified files.

## Immediate next steps for you

1. Run the new audit (or stub it quickly) on your `assets/` directory.
2. Turn **mipmaps OFF by default** (only opt-in for POT textures).
3. Ensure **scene-scoped texture ownership** and unload on `shutdown()`.
4. Update your fail-safe counters so **only math/physics faults** increment them; asset issues swap to a 1×1 placeholder and log `ASSET_*` codes.
5. Re-run your Gym Trial and capture the episode artifact; confirm physics/player stay enabled.

6. Wire core loop events and rewards:
   - add `BOSS_FIRST_CLEAR` constant; instantiate `BossRewardSystem` at bootstrap;
   - update Pulsar (and other bosses) to emit full defeat payload via `EventBus`;
   - standardize factory/boss/clone events on `EventBus`.

7. Unify resources and hook up Factory to real clone lanes:
   - pick Resource Schema Option A or B; update EconomyManager/FactoryScene accordingly;
   - render `EnhancedCloneManager` lanes in Factory, showing effective rate and decay; base production and collection on lane output.

8. Determinism hardening + tests:
   - clamp RNG gaussian; add RNG and integration tests; include in `run-tests.cjs`.

9. Save/Load pass:
   - ensure defeated bosses (first‑clear) and clone lanes/boosts persist and restore; compute offline with EnhancedCloneManager.

10. Style/logs cleanup:
   - reduce console noise in production; align imports/indentation.

System Integration Checklist (Run → Rewards → Factory)
- Run end → PerformanceAnalyzer → forge stats → `clone:forgeStart` → EnhancedCloneManager lane created → `clone:forgeComplete`.
- Boss defeat emits via `EventBus` with `{ bossId, runScore, timeElapsed, hitsTaken }` → BossRewardSystem grants rewards + unlocks + mutation → `boss:firstClear` (if applicable) + `boss:rewardClaimed`.
- FactoryScene reads `EnhancedCloneManager` lanes, visualizes decay/effective rate, and routes production/collect via the unified resource manager.


If you want, I can also drop in:

* a tiny **asset decoder/checker** (Node + Canvas) that detects truncation and can **auto-rewrite** images (downscale / POT-pad / strip mipmaps), and
* a **Phaser bootstrap** snippet with all the safe defaults (decode-then-upload, mipmap guard, context-loss handler, dev HUD).
