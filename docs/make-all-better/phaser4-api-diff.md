Phaser 3 → Phaser 4 API Migration (Draft)

Repo Alignment
- Imports: use `@features/*` barrels and constants from `src/constants/*.js` (e.g., `Assets.js`, `EventNames.js`).
- Tests: keep `.cjs` tests; use `bun tests/run-tests.cjs`.

Scope
- Summarize meaningful deltas for loader, input, scenes, cameras, and particles relevant to WynIsBuff2.
- Provide mapping recommendations for ParallaxLayers, UIButton rendering, and Rapier stepping.

Highlights
- Loader: prefer asset manifest with explicit file extensions; ensure ESM imports where possible.
- Scenes: lifecycle remains similar; scene plugin architecture is leaner; prefer ESM imports with explicit paths.
- Cameras: scroll/zoom API preserved; camera effects (shake/fade) maintained with minor names.
- Particles: Emitters available; ensure texture keys exist and alpha/scale configs use objects.
- Input: Pointer/keyboard events remain; mapping names may differ (verify in sandbox).

Recommendations
- Parallax: Port ParallaxLayers to use Phaser 4 image/tile mechanisms; continue scaling to cover viewport; use camera scroll factors when feasible.
- UIButton: Static image + text overlay approach should continue working; verify interactive hit areas; adjust for any input API changes.
- Rapier: Continue using @dimforge/rapier2d-compat; step world in a fixed tick (1/60) and keep scene update decoupled from physics step.
- Assets: Maintain manifest-driven approach with constants; ensure loader path handling matches Phaser 4 expectations.

Smokes (Sandbox)
- Boot smoke: create and destroy Phaser 4 game quickly.
- Parallax smoke: render three layers with simple motion.
- Rapier smoke: create world, step once.

Rollout Strategy
- Freeze scenes and migrate incrementally in a sandbox branch.
- Port smallest surface areas first (render-only scenes) and validate smokes.
- Maintain a fallback path until final cutover.

Delta Table (Repo-Centric)
- Loader:
  - P3 `this.load.image(key, url)` → P4 same; ensure manifest constants from `src/constants/Assets.js` are used, not string literals.
  - File extensions must be explicit; verify `png/jpg/mp3` handling unchanged.
- Input:
  - P3 `this.input.keyboard.addKey('SPACE')` → P4 same pattern; verify keycode maps and event names in sandbox.
  - Pointer `pointerdown`, `pointerup` remain; check drag/interactive enable calls.
- Cameras:
  - P3 `cameras.main.setZoom(z)`/`setScroll(x,y)` → P4 same naming; verify camera effects `shake`, `fade` signatures.
- Scenes:
  - Lifecycle (`preload/create/update`) stable; plugin injection leaner; confirm `this.add`, `this.tweens` accessors.
- Particles:
  - Emitter config objects continue; ensure textures loaded; verify alpha/scale config object shapes.
