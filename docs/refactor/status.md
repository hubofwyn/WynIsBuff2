# Refactor Status Tracker

This living document tracks the execution of the phased refactor described in docs/make-all-better/*. It summarizes progress, open items, and links to related tasks.

## Overall
- Scope: Phases 0–6 (tooling, KCC physics, assets, debug overlays, agentic testing, Phaser 4 prep).
- Engine: Package uses `phaser@^4.0.0-rc.5`; many code paths still follow Phaser 3-era patterns. Migration plan remains draft.
- Tooling: Bun and Biome are present; Vite remains the build tool.

## Phase Summary

### Phase 0 — Foundation & Safety Net
- [x] Add Biome config with 2-space formatting and guarded rules (biome.json)
- [x] Keep generated asset constants out of lint scope (ignored in Biome)
- [ ] Capture dependency baseline snapshot to docs/refactor/deps-baseline.txt
- [ ] Create baseline performance snapshot script and export file
- [ ] Confirm golden path Boot → Preloader → Welcome → Run → Results

### Phase 1 — Tooling Modernization
- [x] Bun integrated (scripts use `bun`/`bunx`)
- [x] Biome lint and format scripts in package.json
- [x] Add CI lint job (Biome) — added in this change; verify on next CI run
- [ ] Keep npm-equivalent docs up to date (Vite remains primary dev server)

### Phase 2 — KCC Physics Architecture
- [x] Define `CollisionGroups` and masks under `src/constants/`
- [x] Draft `KccAdapter` aligned with current Rapier usage
- [x] Integrate ground detection via `KccAdapter.probeGround` in `PlayerController`
- [x] Add minimal ground detection debug overlay for validation
- [x] Trim verbose PlayerController logs; keep only essential warnings/errors

### Phase 3 — Debug Overlays
- [x] Toggleable debug UI (FPS) wired in TestScene, TestScene_CharacterMotion, and RunScene
- [x] Show contacts/sec (from PhysicsManager) and bodies in TestScene_CharacterMotion
- [x] Add contacts/bodies to RunScene overlay when PhysicsManager is present (optional path)
- [ ] Ensure no listener leaks across scene switches

### Phase 4 — Agentic Testing
- [x] Minimal Phase 1 harness (CommonJS `.cjs` under `tests/agentic/`)
- [x] Headless module smoke for Phaser (version capture)
- [x] Rapier ray filter smoke appends to agentic summary
- [ ] Curriculum and KPIs (later phases)

### Phase 5 — Asset Pipeline
- [x] Generated assets present; asset scripts wired
- [ ] Regular usage audits in CI and local scripts
- [ ] Scene compliance: replace magic strings with constants

### Phase 6 — Migration Execution (Draft)
- [ ] Finalize Phaser 4 delta table for Loader/Input/Camera APIs
- [ ] Map repo modules to migration steps
- [ ] Execute scene-by-scene migration with tests

## Links
- Plan: docs/make-all-better/make-all-better.md
- KCC Notes: docs/make-all-better/rapier-plus-phaser4.md
- Tooling: docs/make-all-better/biome-and-bun.md
- Agentic: docs/make-all-better/agentic-testing.md
- Phaser 4 Diff (draft): docs/make-all-better/phaser4-api-diff.md
