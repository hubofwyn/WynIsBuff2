# WynIsBuff2 Refactor Report — Bun, Biome, Phaser 4 RC, Rapier 0.18.2 (2D compat)

This report documents the current architecture and tooling, then proposes a practical, low-risk refactor path to:

- Use Bun (latest) as package manager/runtime
- Use Biome as formatter+linter (replacing ESLint/Prettier)
- Upgrade Phaser from 3.90.x to Phaser 4 RC
- Align Rapier at 0.18.2 (2D compat)

The goal is to produce a cohesive, modern toolchain and a clarified runtime architecture with a Kinematic Character Controller (KCC) at its core.

-------------------------------------------------------------------------------

## 1) Current State Summary

- Language: JavaScript (ES modules; `type: module`)
- Build: Vite 7.x (dev/build scripts)
- Minification: terser
- Tests: Custom CommonJS tests (`tests/*.cjs`) executed via `node tests/run-tests.cjs`
- Game framework: Phaser 3.90.x
- Physics engine: Rapier 2D compat (now pinned to 0.18.2)
- Audio: Howler 2.2.4
- Asset pipeline: custom scripts (`scripts/`, `asset-generation/`); Assets constants generation
- Linting/Formatting: No ESLint/Prettier config found in repo; style enforced informally via docs

### Runtime Architecture (High level)
- Core managers (singletons via `BaseManager`): `PhysicsManager`, `InputManager`, `UIManager`, `GameStateManager`, `AudioManager`
- Scenes: `Boot` → `Preloader` → `Game` (+ others for menus/tests)
- PhysicsManager:
  - Initializes Rapier world with gravity from `PhysicsConfig`
  - Maintains fixed timestep (1/60), event queue, and interpolation-based sprite syncing for registered bodies
  - Provides body→sprite registry and update loop
- Level system: `LevelManager`, `GroundFactory`, `PlatformFactory`
  - Creates fixed bodies/colliders for ground/platforms using pixels→meters conversion
  - Uses permissive collision groups mask `(ALL << 16) | ALL` (0xFFFF) for compatibility
- Player: `PlayerController` (currently dynamic body + manual velocity)
  - Reads input, sets linvel, raychecks ground, updates sprite, ducking resizes collider
  - Competes with a Game-level postupdate “force sync” for sprite transforms
  - Logs and comments claim KCC; implementation is dynamic (mismatch to intent)
- Input: `InputManager` (singleton) creates keys and emits events; `PlayerController` also creates scene-specific keys (duplication)

### Notable Pain Points (observed)
- Multiple transform authorities (Player, Game postupdate, and PhysicsManager) → potential jitter/conflicts
- Update order: physics steps before Player input is applied (dynamic model) → 1-frame latency, brittle ground checks
- Ground check reliance on raycasts → sensitive to scaling/range; better replaced by KCC’s ground snap/step
- Documentation mismatch (previously claimed Rapier 0.14.0)

-------------------------------------------------------------------------------

## 2) Target Stack & Tooling

### Package/runtime
- **Bun (latest)**: package manager and runtime for scripts
  - Faster dev cycles; compatible with Vite and modern bundling
  - Use `bun pm` for install; `bun run` for scripts; `bunx` for CLIs

### Linting & Formatting
- **Biome**: unified linter+formatter
  - Replaces ESLint+Prettier with one tool; fast and well-integrated
  - Enforce ESM, import order, naming, and stylistic rules project-wide

### Engine & Physics
- **Phaser 4 RC** (breaking changes from Phaser 3)
  - Modern ESM-first; some systems and APIs reorganized/renamed
  - Requires a dedicated migration step (Scenes, Loader, Input, Camera, Pipeline differences)
- **Rapier 0.18.2 (2D compat)**
  - Use **Kinematic Character Controller (KCC)** as the authoritative player movement model
  - Compat build + `RAPIER.init()` in Boot; world from registry

### Build
- **Vite 7.x** remains; Bun can run Vite without issue
- Optional: later evaluate Vite’s Bun-native optimizations or Bun’s bundler once stable for Phaser 4 RC

### Tests
- Keep `tests/*.cjs` for now (low-risk); later consider:
  - Convert to ESM tests, or
  - Use `bun test` for unified runner (Bun supports test runner built-in)

-------------------------------------------------------------------------------

## 3) Migration Strategy Overview (Phaser 4 + KCC)

### 3.1 Phaser 3 → Phaser 4 RC Checklist
1) Replace Phaser import paths with Phaser 4 ESM entry (RC naming may vary). Validate Scene base class, Loader, Input APIs.
2) Scene Lifecycle:
   - Ensure Boot/Preloader/Game still conform to updated lifecycle hooks (preload/create/update) signatures
3) Display & Camera:
   - Confirm camera APIs; apply renderer/pipeline changes if any
4) Input System:
   - Validate keyboard handling; re-map to Phaser 4 equivalents
5) Physics Integration:
   - Using direct Rapier integration (no Phaser physics plugin). Confirm render loop order with Vite dev server
6) Plugins/Extras:
   - Audit any custom shader pipelines or postprocessing

Note: Phaser 4 RC evolves; pin RC version in package.json and capture changelog diffs in `docs/migrations/phaser4.md`.

### 3.2 Rapier KCC Adoption
1) Player body → kinematic position-based
2) Create KCC via world; configure:
   - up direction ({x:0,y:-1}), skin offset, slide enabled
   - autostep (max height, min width)
   - snap-to-ground (distance)
   - slope climb/slide angles
3) Input pipeline:
   - Convert input to desired translation (meters) per frame
   - `computeColliderMovement` with proper query filters and collision groups
   - `setNextKinematicTranslation` with corrected translation
4) Update ordering:
   - PlayerController computes/apply KCC movement before PhysicsManager steps the world
   - Keep a single sprite sync authority (prefer PhysicsManager)
5) Grounding state:
   - Derive from controller result; avoid per-frame long raycasts

-------------------------------------------------------------------------------

## 4) Package Management & Scripts (Bun)

### 4.1 package.json changes
- Add engines (optional):
  ```json
  {
    "engines": { "bun": ">=1.1.0" }
  }
  ```
- Scripts (keep names; run via bun):
  - `bun run dev` → Vite dev
  - `bun run build` → Vite build
  - `bun run test` → existing Node-based test runner initially; later migrate to `bun test`

### 4.2 Install & run
- `bun pm install` (or `bun install`)
- `bun run dev` / `bun run build` / `bun run test`

-------------------------------------------------------------------------------

## 5) Linting & Formatting (Biome)

### 5.1 Add Biome config
- Create `biome.json`:
  ```json
  {
    "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
    "formatter": { "enabled": true },
    "linter": {
      "enabled": true,
      "rules": {
        "style": { "useConst": "warn" },
        "suspicious": { "noDuplicateObjectKeys": "error" }
      }
    },
    "javascript": {
      "formatter": {
        "quoteStyle": "single",
        "indentStyle": "space",
        "indentWidth": 2
      }
    }
  }
  ```
- Add scripts:
  ```json
  {
    "scripts": {
      "fmt": "biome format --write .",
      "lint": "biome check ."
    }
  }
  ```

### 5.2 Policy
- Biome replaces ESLint/Prettier entirely
- Enforce import order and consistent module style
- Validate against accidental CommonJS in src (tests may remain CJS temporarily)

-------------------------------------------------------------------------------

## 6) Type Management

- Current project is JS-only; no TypeScript found
- Options:
  1) Stay JS + JSDoc (low friction)
  2) Introduce TS incrementally (start with `src/constants` and managers)
- If adopting TypeScript later:
  - `tsconfig.json` with `module: esnext`, `target: es2022`, `moduleResolution: bundler`
  - Vite handles TS seamlessly; Bun supports TS via transpile
  - Rapier and Phaser types: install `@types/howler` if needed; Phaser 4 provides types with ESM

-------------------------------------------------------------------------------

## 7) Build & Dev Server

- Vite 7.x retained; compatible with Bun runner
- Ensure import paths match Phaser 4 ESM; avoid deep internal paths
- Optimize dev start time (Bun faster install; optional Vite caching)

-------------------------------------------------------------------------------

## 8) Testing Strategy

- Short term: keep `tests/*.cjs` runner
  - `bun run test` invokes `node tests/run-tests.cjs` or directly `bun node`-compatible
- Medium term: migrate to `bun test` (native test runner)
  - Convert tests to ESM; group integration vs unit tests
  - Mock Rapier/Phaser where applicable; maintain integration smoke tests for physics+render loop

-------------------------------------------------------------------------------

## 9) Detailed Runtime Architecture (Target)

### 9.1 Event & Manager Topology
- Singleton managers (extend `BaseManager`) remain: PhysicsManager, InputManager, UIManager, GameStateManager, AudioManager
- `EventSystem` continues as central bus for scene-agnostic signaling

### 9.2 PhysicsManager (Rapier 0.18.2)
- World: created in Boot or on first scene that needs it (from registry)
- EventQueue: `new RAPIER.EventQueue(true)`; drained after each step
- Fixed timestep: accumulator + `1/60` step cap + substep guard
- Sprite sync: this remains the single source of truth for render transforms
  - Player body should be registered here (remove Game postupdate force-sync)

### 9.3 PlayerController (KCC-authority)
- Body type: `kinematicPositionBased`
- Collider: box sized via `pixelsToMeters`
- Controller: configured with autostep, snap-to-ground, slope limits
- Input→DesiredTranslation: compute in meters each frame (speeds from `MovementTuning`)
- `computeColliderMovement` → apply corrected displacement via `setNextKinematicTranslation`
- Grounded: derive from controller; avoid long rays (optional short feelers OK)
- Jumping: apply vertical desired translation based on timers (coyote, buffer) and KCC state

### 9.4 InputManager
- Owns key registration; emits events
- PlayerController consumes the InputManager’s keys or subscribes to events (pick one; avoid duplicating key objects)

### 9.5 Level Geometry
- GroundFactory/PlatformFactory:
  - Fixed bodies; non-sensor colliders; consistent collision groups
  - Collider sizes via `pixelsToMeters`
  - Consider grouping masks for player/query isolation when needed

-------------------------------------------------------------------------------

## 10) Collision Groups & Query Filters

- Create `src/constants/CollisionGroups.js`:
  ```js
  export const Groups = {
    NONE: 0,
    DEFAULT: 0x0001,
    PLAYER: 0x0002,
    GROUND: 0x0004,
  };
  export function maskFor(...bits) {
    const g = bits.reduce((m, b) => m | b, 0);
    return (g << 16) | g;
  }
  ```
- Apply to player, ground, platforms; pass masks into KCC queries
- Use `QueryFilterFlags.EXCLUDE_SENSORS` for movement queries

-------------------------------------------------------------------------------

## 11) Refactor Plan (Phased)

### Phase A — Tooling & Infrastructure
1) Add Biome config; add `fmt` and `lint` scripts; run on repo
2) Switch package manager to Bun: update docs, CI, and local workflows
3) Keep Vite; validate `bun run dev` flow

### Phase B — Physics & Player
1) Replace dynamic player with kinematic + KCC
2) Remove Game postupdate force-sync and PlayerController’s direct sprite set (if PhysicsManager owns sync)
3) Reorder Game update: PlayerController before PhysicsManager
4) Implement `createKcc`/`applyKccMovement` helpers

### Phase C — Phaser 4 RC Migration
1) Replace imports; adjust Scene lifecycle and APIs
2) Verify input/camera/loader changes
3) Smoke test all scenes (Boot → Preloader → Game → Minigame)

### Phase D — Tests & Docs
1) Keep CJS tests; add a minimal `bun test` suite stub
2) Document KCC usage and collision group policies
3) Update README and `docs/migrations/phaser4.md`

-------------------------------------------------------------------------------

## 12) Risks & Mitigations

- Phaser 4 RC churn: pin version; track breaking changes in a dedicated doc; keep Phaser 3 branch until migration stable
- KCC edge cases: slopes/steps tuning; add in-engine debug overlay to visualize controller decisions
- Input duplication: converge on single source (InputManager) to avoid key conflicts
- Transform authority conflicts: enforce single writer policy (PhysicsManager preferred)

-------------------------------------------------------------------------------

## 13) Appendix — Helpful Snippets

### A. KCC Creation Helper
```js
export function createKcc(world, playerCollider, cfg, RAPIER) {
  const ctrl = world.createCharacterController(cfg.autostepMaxHeight ?? 0.1);
  ctrl.setUp({ x: 0, y: -1 });
  ctrl.setOffset(cfg.offset ?? 0.01);
  ctrl.setSlideEnabled(true);
  if (cfg.enableAutostep) ctrl.enableAutostep(cfg.autostepMaxHeight, cfg.autostepMinWidth, true);
  if (cfg.enableSnapToGround) ctrl.setSnapToGround(true, cfg.snapToGroundDistance ?? 0.2);
  if (cfg.maxSlopeClimbAngle != null) ctrl.setMaxSlopeClimbAngle(cfg.maxSlopeClimbAngle);
  return ctrl;
}
```

### B. Apply KCC Movement
```js
export function applyKccMovement(ctrl, world, body, collider, desired, filters) {
  const current = body.translation();
  const corrected = ctrl.computeColliderMovement(collider, desired, filters);
  body.setNextKinematicTranslation({ x: current.x + corrected.x, y: current.y + corrected.y });
  return corrected;
}
```

### C. Biome Commands
```sh
bunx @biomejs/biome init
bun run fmt
bun run lint
```

### D. Bun Scripts
```json
{
  "scripts": {
    "dev": "vite --config vite/config.dev.mjs",
    "build": "vite build --config vite/config.prod.mjs",
    "test": "node tests/run-tests.cjs",
    "fmt": "biome format --write .",
    "lint": "biome check ."
  }
}
```

-------------------------------------------------------------------------------

## 14) Conclusion

Adopting Bun and Biome modernizes the developer experience and reduces tooling friction. Moving to Phaser 4 RC and Rapier’s KCC clarifies motion authority and solves long-standing ground/contact inconsistencies. Executing the phased plan above keeps risk contained while delivering a cleaner, more deterministic movement stack for the minigame and the broader project.

End of Report
