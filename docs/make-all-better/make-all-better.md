# WynIsBuff2 Complete Refactor Implementation Guide

> Repository Alignment Notes
> - Imports: use `@features/*` barrel exports and constants from `src/constants/*.js` (e.g., `Assets.js`, `EventNames.js`). Example snippets that show `@/...` are illustrative; prefer `@features/*` in code.
> - Testing: keep CommonJS `.cjs` tests and run via `bun tests/run-tests.cjs` (see package.json). Any `bun:test` usage is pseudo-code for this repo.
> - Engine: `phaser@^4.0.0-rc.5` is installed, but many modules follow Phaser 3-era patterns. Treat Phase 6 migration as draft until delta tables are finalized.
> - Types: some examples use TypeScript-like types for clarity; consider them pseudo-code with JS equivalents.

## Overview

This guide provides a production-ready refactor path that modernizes your toolchain (Bun, Biome), fixes critical physics architecture issues (KCC implementation), preserves your manifest-driven asset system, and introduces agentic testing capabilities. Each phase is designed to be independently valuable while building toward a cohesive, maintainable codebase.

---

## Phase 0: Foundation & Safety Net (2 days)

> Philosophy: This is a quality‑first hobby project. We’re not preserving legacy quirks or avoiding change; we’ll refactor decisively toward a production‑grade foundation and only keep what’s solid.

### 0.0 Bold Reset Plan (Do Now)
- Hard prune legacy assets and wiring that don’t serve the new direction.
- Establish a minimal “golden path” from Boot → Preloader → Welcome → Run → Results using only manifest constants.
- Enforce clean imports, event constants, and 2‑space formatting on all touched files.
- Prefer replacing brittle code with new, well‑structured modules rather than shimming old ones.

Deliverables
- Only assets referenced via `ImageAssets.*` remain in code; legacy ad‑hoc paths removed.
- Scenes compile and run through the golden path with generated parallax backdrops.
- Lint/format rules applied to changed files.

### 0.1 Branch Strategy
```bash
git checkout -b refactor/main
git tag pre-refactor-baseline
```

### 0.2 Baseline Metrics Capture
```javascript
// scripts/capture-baseline.js
import { performance } from 'perf_hooks';

export async function captureBaseline() {
  const metrics = {
    timestamp: new Date().toISOString(),
    bundleSize: await getBundleSize(),
    physics: {
      avgFPS: [],
      inputLatency: [],
      groundDetectionAccuracy: 0
    },
    knownBugs: [
      {
        id: 'ground-raycast-1',
        description: 'Raycast fails on thin platforms',
        repro: 'Jump onto moving platform edge'
      }
    ]
  };
  
  await fs.writeFile('docs/refactor/baseline.json', JSON.stringify(metrics, null, 2));
}
```

### 0.3 Initial Test Harness
```javascript
// tests/baseline/physics.test.js
import { describe, test, expect, beforeAll } from 'bun:test';

describe('Current Physics Behavior (Baseline)', () => {
  let world, player;
  
  beforeAll(async () => {
    // Document current behavior, even if buggy
    world = await createTestWorld();
    player = createPlayer(world);
  });
  
  test('documents current ground detection behavior', () => {
    // This captures CURRENT behavior, not ideal behavior
    const raycast = player.groundRaycast();
    expect(raycast.range).toBe(0.1); // Current brittle value
    expect(raycast.hit).toBeDefined();
  });
});
```

### 0.4 Asset Baseline & Lock
Use the manifest-driven pipeline you already have to pin the current art state and surface integration gaps before refactoring.

- Create a lockfile of current images for reproducibility:
  - `npm run --prefix asset-generation gfx:lock` → writes `assets/manifest.lock.json`
- Audit code usage vs manifest to find dead or missing references:
  - `npm run assets:usage-audit` → `.reports/assets/usage-audit.json`
- Generate a simple preview for visual inspection (optional):
  - `npm run --prefix asset-generation gfx:preview` → `.reports/assets/preview.html`

Exit criteria
- Lockfile exists and is committed.
- Usage audit produced and reviewed; issues filed for “unused GEN_*” and any “missing manifest entries”.

### 0.5 Dependency & Runtime Freeze
Minimize environmental drift while refactoring.

- Node version: document the version used to run build/tests (e.g., Node 18.x) and add `.nvmrc` (optional).
- Pin dev tools in `package-lock.json` (keep it committed).
- Capture `npm ls --depth=0` output into `docs/refactor/deps-baseline.txt` for quick diffing later.

### 0.6 Linting/Formatting Guardrails (lightweight)
Do not reformat the whole repo in Phase 0. Instead, add minimal guardrails to avoid regressions.

- Focus areas only: new/modified web files use 2‑space indent, `.js` ESM import extensions, and alphabetized barrels.
- Add a CI lint job later (Phase 1); for now, document conventions and apply during changes touched in refactor.

### 0.7 Import & Event Normalization Preflight
Identify hotspots so Phase 1–2 changes don’t fight inconsistent interfaces.

- Imports: prefer explicit `.../EventNames.js` and `.../Assets.js` to avoid resolution drift.
- Events: confirm target constants exist (e.g., `EventNames.BOSS_FIRST_CLEAR`) and note places where scene‑local events should migrate to global `EventBus`.
- Run orchestrator to list current fails (this is expected now):
  - `npm run get-more-buff` (verifications + tests)
- File the failures as Phase 1 tasks if not already covered in `tasks/get-more-buff.json`.

### 0.8 Smoke Plans (Manual & Automated)
Define small checks you can repeat after every refactor slice.

- Build/dev smoke: `npm run dev` launches; Welcome → Preloader transitions; no red console spam.
- Scene smoke: Preloader loads generated assets (autoload of `GEN_*` keys); add one `add.image` in a feature branch to validate.
- Test smoke: `npm test` runs without hanging; capture flaky tests list if any.

### 0.9 Risk Register (living section)
Track known risky areas to protect during refactor; update as you learn.

- Physics coupling between player control and platform collision assumptions (thin platforms, moving edges).
- Event string drift across scenes vs. centralized constants.
- Asset path assumptions in code vs. manifest constants.
- Save/load interplay among `BossRewardSystem`, `EnhancedCloneManager`, `GameStateManager`.

### 0.10 Phase 0 Deliverables (must-have)
- `docs/refactor/baseline.json` capturing metrics + known bugs.
- `assets/manifest.lock.json` committed.
- `.reports/assets/usage-audit.json` reviewed; issues opened.
- Orchestrator report from `npm run get-more-buff` pasted into a tracking issue.
- Agreement on Node version and “no global reformat” rule for Phase 0.

---

## Phase 1: Tooling Modernization (1 day)

### 1.1 Bun Configuration
```json
// package.json
{
  "name": "wynisbuff2",
  "type": "module",
  "engines": {
    "bun": ">=1.2.21"
  },
  "trustedDependencies": [],
  "scripts": {
    // Development
    "dev": "bunx vite --config vite/config.dev.mjs",
    "dev:headless": "bun run src/headless/server.js",
    
    // Build
    "build": "bun run build.ts",
    "build:analyze": "bun run build.ts --analyze",
    
    // Assets (preserve existing)
    "generate-assets": "bun run scripts/generate-assets.js",
    "assets:usage-audit": "bun run scripts/audit-assets.js",
    "gfx:integrate": "bun run tools/integrate-winners.mjs",
    
    // Quality
    "lint": "biome lint .",
    "lint:fix": "biome check --write .",
    "typecheck": "tsc --noEmit",
    
    // Testing
    "test": "bun test",
    "test:integration": "bun test tests/integration",
    "test:agent": "bun run tests/agent/train.js"
  }
}
```

### 1.2 Biome Configuration
```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      "assets",
      "*.cjs",
      "src/constants/Assets.js" // Generated file
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "semicolons": "always",
      "trailingCommas": "all",
      "quoteStyle": "single"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "a11y": "off",
      "style": {
        "noExcessiveCognitiveComplexity": { "level": "warn", "options": { "maxComplexity": 15 } },
        "useWhile": "error",
        "useConst": "warn"
      },
      "performance": {
        "noAccumulatingSpread": "error",
        "noDelete": "error"
      },
      "suspicious": {
        "noExplicitAny": "off", // JS project
        "noImplicitAnyLet": "off"
      },
      "correctness": {
        "noVoidTypeReturn": "error",
        "noUselessThisAlias": "error",
        "noGlobalIsNan": "error",
        "useExhaustiveDependencies": "warn"
      }
    }
  }
}
```

### 1.3 Build Script
```typescript
// build.ts
import { build } from 'bun';
import { manifest } from './assets/manifest.json';

const startTime = performance.now();

console.log('🏗️ Building WynIsBuff2...');

// Auto-detect entry points from manifest
const generatedAssets = Object.keys(manifest.images)
  .filter(key => key.startsWith('gen'))
  .map(key => `./assets/${manifest.images[key].path}`);

const result = await build({
  entrypoints: ['./src/main.js'],
  outdir: './dist',
  target: 'browser',
  splitting: false,
  minify: true,
  sourcemap: 'external',
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.mp3': 'file',
    '.ogg': 'file'
  },
  naming: {
    entry: '[name]-[hash].js',
    chunk: '[name]-[hash].js',
    asset: 'assets/[name]-[hash].[ext]'
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});

if (!result.success) {
  console.error('❌ Build failed:', result.logs);
  process.exit(1);
}

const buildTime = ((performance.now() - startTime) / 1000).toFixed(2);
console.log(`✅ Build complete in ${buildTime}s`);
console.log('📦 Output files:', result.outputs.map(o => o.path));
```

---

## Phase 2: KCC Physics Architecture (3 days)

### 2.1 Collision Groups
```javascript
// src/constants/CollisionGroups.js
export const CollisionGroups = {
  NONE: 0,
  STATIC: 0b0001,
  PLAYER: 0b0010,
  HAZARD: 0b0100,
  PICKUP: 0b1000,
  SENSOR: 0b10000,
  DYNAMIC: 0b100000,
  
  // Helper to create Rapier collision masks
  createMask(membership, filter = 0b111111) {
    return (membership << 16) | filter;
  }
};

// Query filter presets
export const QueryFilters = {
  PLAYER_MOVEMENT: {
    groups: CollisionGroups.createMask(CollisionGroups.PLAYER, CollisionGroups.STATIC | CollisionGroups.DYNAMIC),
    flags: null, // Will be set to RAPIER.QueryFilterFlags.EXCLUDE_SENSORS
    predicate: null
  }
};
```

### 2.2 KCC Adapter
```javascript
// src/physics/KccAdapter.js
import { CollisionGroups, QueryFilters } from '@/constants/CollisionGroups.js';
import { pixelsToMeters, metersToPixels } from '@/utils/units.js';

export class KccAdapter {
  constructor(world, RAPIER) {
    this.world = world;
    this.RAPIER = RAPIER;
    this.controller = null;
    this.collider = null;
    this.body = null;
    
    // State tracking
    this.state = {
      grounded: false,
      groundedLastFrame: false,
      velocity: { x: 0, y: 0 },
      groundNormal: { x: 0, y: 0 }
    };
    
    // Configuration tuned for platformer feel
    this.config = {
      offset: 0.01,
      autostepMaxHeight: pixelsToMeters(8), // 8px step height
      autostepMinWidth: pixelsToMeters(16),
      snapToGroundDistance: pixelsToMeters(12),
      maxSlopeClimbAngle: Math.PI / 4, // 45 degrees
      minSlopeSlideAngle: Math.PI / 3  // 60 degrees
    };
  }

  create(x, y, width, height) {
    const position = { 
      x: pixelsToMeters(x), 
      y: pixelsToMeters(y) 
    };
    
    // Create kinematic body
    const bodyDesc = this.RAPIER.RigidBodyDesc
      .kinematicPositionBased()
      .setTranslation(position.x, position.y)
      .setCanSleep(false);
    
    this.body = this.world.createRigidBody(bodyDesc);
    
    // Create collider with proper groups
    const halfWidth = pixelsToMeters(width) / 2;
    const halfHeight = pixelsToMeters(height) / 2;
    
    const colliderDesc = this.RAPIER.ColliderDesc
      .cuboid(halfWidth, halfHeight)
      .setCollisionGroups(CollisionGroups.createMask(CollisionGroups.PLAYER))
      .setActiveEvents(this.RAPIER.ActiveEvents.COLLISION_EVENTS);
    
    this.collider = this.world.createCollider(colliderDesc, this.body);
    
    // Create and configure controller
    this.controller = this.world.createCharacterController(this.config.offset);
    this.controller.setUp({ x: 0, y: -1 }); // Y-up for 2D
    this.controller.setSlideEnabled(true);
    this.controller.enableAutostep(
      this.config.autostepMaxHeight,
      this.config.autostepMinWidth,
      false // Don't include dynamic bodies in autostep
    );
    this.controller.setSnapToGround(this.config.snapToGroundDistance);
    this.controller.setMaxSlopeClimbAngle(this.config.maxSlopeClimbAngle);
    this.controller.setMinSlopeSlideAngle(this.config.minSlopeSlideAngle);
    
    return this;
  }

  computeMovement(desiredTranslation) {
    if (!this.controller || !this.collider) {
      return { x: 0, y: 0, grounded: false };
    }
    
    // Convert to meters
    const desired = {
      x: pixelsToMeters(desiredTranslation.x),
      y: pixelsToMeters(desiredTranslation.y)
    };
    
    // Compute corrected movement
    this.controller.computeColliderMovement(
      this.collider,
      desired,
      this.RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
      QueryFilters.PLAYER_MOVEMENT.groups
    );
    
    // Get corrected movement
    const corrected = this.controller.computedMovement();
    
    // Update grounded state
    this.state.groundedLastFrame = this.state.grounded;
    this.state.grounded = this._checkGrounded();
    
    // Calculate velocity for animation/effects
    this.state.velocity = {
      x: metersToPixels(corrected.x) * 60, // Convert to pixels/sec
      y: metersToPixels(corrected.y) * 60
    };
    
    return {
      x: metersToPixels(corrected.x),
      y: metersToPixels(corrected.y),
      grounded: this.state.grounded
    };
  }

  applyMovement() {
    if (!this.body || !this.controller) return;
    
    const corrected = this.controller.computedMovement();
    const current = this.body.translation();
    
    this.body.setNextKinematicTranslation({
      x: current.x + corrected.x,
      y: current.y + corrected.y
    });
  }

  _checkGrounded() {
    const numCollisions = this.controller.numComputedCollisions();
    
    for (let i = 0; i < numCollisions; i++) {
      const collision = this.controller.computedCollision(i);
      // Check if normal points up (ground contact)
      if (collision.normal.y < -0.7) {
        this.state.groundNormal = collision.normal;
        return true;
      }
    }
    
    return false;
  }

  // Helper methods
  isGrounded() { return this.state.grounded; }
  justLanded() { return this.state.grounded && !this.state.groundedLastFrame; }
  justLeftGround() { return !this.state.grounded && this.state.groundedLastFrame; }
  getVelocity() { return this.state.velocity; }
  getPosition() {
    const pos = this.body.translation();
    return {
      x: metersToPixels(pos.x),
      y: metersToPixels(pos.y)
    };
  }
}
```

### 2.3 Updated PlayerController
```javascript
// src/entities/PlayerController.js
import { EventNames } from '@/constants/EventNames.js';
import { KccAdapter } from '@/physics/KccAdapter.js';
import { ImageAssets } from '@/constants/Assets.js';

export class PlayerController {
  constructor(scene, x, y) {
    this.scene = scene;
    this.kcc = null;
    
    // Movement tuning
    this.tuning = {
      moveSpeed: 200,        // px/s
      acceleration: 1400,    // px/s²
      deceleration: 1600,    // px/s²
      airControl: 0.3,       // Multiplier when airborne
      jumpImpulse: [480, 420, 360], // Triple jump impulses
      gravity: 900,          // px/s²
      maxFallSpeed: 600,     // px/s
      coyoteTime: 0.1,       // seconds
      jumpBufferTime: 0.15  // seconds
    };
    
    // State machine
    this.state = {
      current: 'idle',
      velocity: { x: 0, y: 0 },
      jumpCount: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      facing: 1 // 1 = right, -1 = left
    };
    
    // Create sprite (but don't control its position directly)
    this.sprite = scene.add.sprite(x, y, ImageAssets.PLAYER);
    this.sprite.setDepth(10);
    
    // Initialize KCC
    this.initializeKCC(x, y);
    
    // Setup input through InputManager only
    this.setupInput();
  }

  initializeKCC(x, y) {
    const RAPIER = this.scene.registry.get('RAPIER');
    const world = this.scene.physicsManager.world;
    
    this.kcc = new KccAdapter(world, RAPIER);
    this.kcc.create(x, y, 32, 48); // Player size in pixels
    
    // Register with PhysicsManager for sprite sync
    this.scene.physicsManager.registerKCC(this.kcc, this.sprite);
  }

  setupInput() {
    // Subscribe to InputManager events
    this.scene.events.on(EventNames.INPUT_LEFT, () => this.inputState.left = true);
    this.scene.events.on(EventNames.INPUT_RIGHT, () => this.inputState.right = true);
    this.scene.events.on(EventNames.INPUT_JUMP_PRESSED, () => {
      this.inputState.jumpPressed = true;
      this.state.jumpBufferTimer = this.tuning.jumpBufferTime;
    });
    
    this.inputState = {
      left: false,
      right: false,
      jumpPressed: false
    };
  }

  // Called BEFORE physics step
  prePhysicsUpdate(time, delta) {
    const dt = delta / 1000;
    
    // Update timers
    if (!this.kcc.isGrounded()) {
      this.state.coyoteTimer -= dt;
    } else {
      this.state.coyoteTimer = this.tuning.coyoteTime;
      this.state.jumpCount = 0;
    }
    
    if (this.state.jumpBufferTimer > 0) {
      this.state.jumpBufferTimer -= dt;
    }
    
    // Calculate desired movement
    const desiredMovement = this.calculateMovement(dt);
    
    // Compute through KCC
    const result = this.kcc.computeMovement(desiredMovement);
    
    // Apply the movement (will be processed in physics step)
    this.kcc.applyMovement();
    
    // Update state based on results
    this.updateStateFromMovement(result);
    
    // Emit events
    this.emitStateEvents();
    
    // Reset per-frame input
    this.inputState.jumpPressed = false;
  }

  calculateMovement(dt) {
    const input = this.scene.inputManager.getActiveInput();
    const isGrounded = this.kcc.isGrounded();
    
    // Horizontal movement
    let targetVelX = 0;
    if (input.left) {
      targetVelX = -this.tuning.moveSpeed;
      this.state.facing = -1;
    }
    if (input.right) {
      targetVelX = this.tuning.moveSpeed;
      this.state.facing = 1;
    }
    
    // Apply acceleration/deceleration
    const accel = isGrounded ? this.tuning.acceleration : this.tuning.acceleration * this.tuning.airControl;
    const decel = isGrounded ? this.tuning.deceleration : this.tuning.deceleration * this.tuning.airControl;
    
    if (Math.abs(targetVelX) > 0) {
      // Accelerating
      this.state.velocity.x = this.moveToward(this.state.velocity.x, targetVelX, accel * dt);
    } else {
      // Decelerating
      this.state.velocity.x = this.moveToward(this.state.velocity.x, 0, decel * dt);
    }
    
    // Vertical movement
    if (this.canJump() && this.state.jumpBufferTimer > 0) {
      this.state.velocity.y = -this.tuning.jumpImpulse[this.state.jumpCount];
      this.state.jumpCount++;
      this.state.jumpBufferTimer = 0;
      this.scene.events.emit(EventNames.PLAYER_JUMPED, {
        jumpNumber: this.state.jumpCount
      });
    }
    
    // Apply gravity
    if (!isGrounded) {
      this.state.velocity.y += this.tuning.gravity * dt;
      this.state.velocity.y = Math.min(this.state.velocity.y, this.tuning.maxFallSpeed);
    } else if (this.state.velocity.y > 0) {
      this.state.velocity.y = 0; // Stop falling when grounded
    }
    
    return {
      x: this.state.velocity.x * dt,
      y: this.state.velocity.y * dt
    };
  }

  canJump() {
    return (this.kcc.isGrounded() || this.state.coyoteTimer > 0) 
      && this.state.jumpCount < 3;
  }

  updateStateFromMovement(result) {
    // Update animation state
    if (this.kcc.isGrounded()) {
      if (Math.abs(this.state.velocity.x) > 10) {
        this.state.current = 'running';
      } else {
        this.state.current = 'idle';
      }
    } else {
      if (this.state.velocity.y < 0) {
        this.state.current = 'jumping';
      } else {
        this.state.current = 'falling';
      }
    }
    
    // Update sprite animation
    this.sprite.setFlipX(this.state.facing < 0);
    if (this.sprite.anims && this.sprite.anims.currentAnim?.key !== this.state.current) {
      this.sprite.play(this.state.current, true);
    }
  }

  emitStateEvents() {
    if (this.kcc.justLanded()) {
      this.scene.events.emit(EventNames.PLAYER_LANDED);
    }
    
    if (this.kcc.justLeftGround() && this.state.jumpCount === 0) {
      // Started falling without jumping (walked off ledge)
      this.scene.events.emit(EventNames.PLAYER_FELL);
    }
  }

  moveToward(current, target, maxDelta) {
    if (current < target) {
      return Math.min(current + maxDelta, target);
    } else {
      return Math.max(current - maxDelta, target);
    }
  }
}
```

### 2.4 PhysicsManager Refactor
```javascript
// src/managers/PhysicsManager.js
import { BaseManager } from './BaseManager.js';
import { EventNames } from '@/constants/EventNames.js';

export class PhysicsManager extends BaseManager {
  constructor(scene) {
    super(scene);
    
    this.world = null;
    this.eventQueue = null;
    this.RAPIER = null;
    
    // Entity registries
    this.kccEntities = new Map(); // KCC -> Sprite
    this.dynamicEntities = new Map(); // Body -> Sprite
    this.staticEntities = new Map(); // For debug visualization
    
    // Fixed timestep configuration
    this.fixedTimestep = 1/60;
    this.accumulator = 0;
    this.maxSubsteps = 3;
  }

  async initialize() {
    // Get RAPIER from registry (initialized in Boot scene)
    this.RAPIER = this.scene.registry.get('RAPIER');
    
    // Create world
    const gravity = { x: 0, y: 9.8 }; // Rapier uses meters
    this.world = new this.RAPIER.World(gravity);
    
    // Create event queue
    this.eventQueue = new this.RAPIER.EventQueue(true);
    
    // Set integration parameters for stability
    const params = this.world.integrationParameters;
    params.dt = this.fixedTimestep;
    params.maxVelocityIterations = 4;
    params.maxPositionIterations = 1;
    params.erp = 0.8; // Error reduction parameter
    
    return this;
  }

  registerKCC(kcc, sprite) {
    this.kccEntities.set(kcc, sprite);
  }

  registerDynamic(body, sprite) {
    this.dynamicEntities.set(body, sprite);
  }

  update(time, delta) {
    if (!this.world) return;
    
    const dt = delta / 1000;
    this.accumulator += dt;
    
    // Fixed timestep with interpolation
    let substeps = 0;
    while (this.accumulator >= this.fixedTimestep && substeps < this.maxSubsteps) {
      // Pre-physics: Let KCCs compute and apply their movements
      this.scene.events.emit(EventNames.PRE_PHYSICS_STEP, this.fixedTimestep);
      
      // Step the physics world
      this.world.timestep = this.fixedTimestep;
      this.world.step(this.eventQueue);
      
      // Post-physics: Process events
      this.processPhysicsEvents();
      
      this.accumulator -= this.fixedTimestep;
      substeps++;
    }
    
    // Sync all sprites after physics
    this.syncSprites();
    
    // Emit frame complete
    this.scene.events.emit(EventNames.PHYSICS_FRAME_COMPLETE);
  }

  syncSprites() {
    // Sync KCC entities (single source of truth for position)
    for (const [kcc, sprite] of this.kccEntities) {
      const pos = kcc.getPosition(); // Already in pixels
      sprite.x = pos.x;
      sprite.y = pos.y;
      // KCCs don't rotate in 2D platformers
    }
    
    // Sync dynamic entities
    for (const [body, sprite] of this.dynamicEntities) {
      const pos = body.translation();
      const rot = body.rotation();
      sprite.x = metersToPixels(pos.x);
      sprite.y = metersToPixels(pos.y);
      sprite.rotation = rot;
    }
  }

  processPhysicsEvents() {
    this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      const collider1 = this.world.getCollider(handle1);
      const collider2 = this.world.getCollider(handle2);
      
      if (!collider1 || !collider2) return;
      
      // Get user data from colliders
      const data1 = collider1.parent()?.userData;
      const data2 = collider2.parent()?.userData;
      
      if (started) {
        this.scene.events.emit(EventNames.COLLISION_START, {
          entity1: data1,
          entity2: data2
        });
      } else {
        this.scene.events.emit(EventNames.COLLISION_END, {
          entity1: data1,
          entity2: data2
        });
      }
    });
  }
}
```

---

## Phase 3: Asset System Integration (1 day)

The existing manifest-driven asset system remains largely unchanged, but we add TypeScript definitions for better IDE support:

### 3.1 Asset Type Definitions
```typescript
// src/types/assets.d.ts
declare module '@/constants/Assets.js' {
  export const ImageAssets: Record<string, string>;
  export const ImagePaths: Record<string, string>;
  export const AudioAssets: Record<string, string>;
  export const AudioPaths: Record<string, string>;
  export const SpritesheetConfigs: Record<string, any>;
  
  export function getAssetsByType(type: string): Array<any>;
  export function getAssetPath(key: string): string;
  export function validateAssets(): boolean;
}
```

### 3.2 Enhanced Asset Health Manager
```javascript
// src/managers/AssetHealthManager.js
export class AssetHealthManager extends BaseManager {
  constructor(scene) {
    super(scene);
    this.failedAssets = new Set();
    this.fallbackAssets = new Map();
  }

  initialize() {
    // Listen for load errors
    this.scene.load.on('loaderror', (file) => {
      console.error(`Failed to load: ${file.key}`);
      this.failedAssets.add(file.key);
      
      // Emit for monitoring
      this.scene.events.emit(EventNames.ASSET_LOAD_ERROR, {
        key: file.key,
        type: file.type,
        url: file.url
      });
      
      // Try fallback if available
      this.loadFallback(file);
    });
  }

  loadFallback(file) {
    const fallbackKey = `${file.key}_fallback`;
    if (this.fallbackAssets.has(file.key)) {
      const fallbackPath = this.fallbackAssets.get(file.key);
      this.scene.load[file.type](fallbackKey, fallbackPath);
      this.scene.load.start();
    }
  }

  registerFallback(assetKey, fallbackPath) {
    this.fallbackAssets.set(assetKey, fallbackPath);
  }
}
```

---

## Phase 4: Debug & Visualization (1 day)

### 4.1 Debug Overlay System
```javascript
// src/debug/DebugOverlay.js
import { metersToPixels } from '@/utils/units.js';

export class DebugOverlay {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;
    
    // Graphics layers
    this.physicsGraphics = scene.add.graphics();
    this.uiGraphics = scene.add.graphics();
    
    // Debug text
    this.debugText = scene.add.text(10, 10, '', {
      fontSize: '12px',
      backgroundColor: '#000000aa',
      padding: { x: 5, y: 5 }
    });
    
    // Configuration
    this.config = {
      showColliders: true,
      showVelocities: true,
      showKCCState: true,
      showPerformance: true,
      showRaycasts: true
    };
    
    this.setupControls();
    this.setVisible(false);
  }

  setupControls() {
    // Toggle with backtick
    this.scene.input.keyboard.on('keydown-BACKQUOTE', () => {
      this.toggle();
    });
    
    // Individual toggles
    this.scene.input.keyboard.on('keydown-F1', () => {
      this.config.showColliders = !this.config.showColliders;
    });
    
    this.scene.input.keyboard.on('keydown-F2', () => {
      this.config.showVelocities = !this.config.showVelocities;
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    this.setVisible(this.enabled);
  }

  setVisible(visible) {
    this.physicsGraphics.visible = visible;
    this.uiGraphics.visible = visible;
    this.debugText.visible = visible;
  }

  update() {
    if (!this.enabled) return;
    
    this.physicsGraphics.clear();
    this.uiGraphics.clear();
    
    if (this.config.showColliders) {
      this.drawPhysicsWorld();
    }
    
    if (this.config.showVelocities) {
      this.drawVelocities();
    }
    
    if (this.config.showPerformance) {
      this.updatePerformanceText();
    }
  }

  drawPhysicsWorld() {
    const world = this.scene.physicsManager?.world;
    if (!world) return;
    
    // Draw static colliders
    this.physicsGraphics.lineStyle(2, 0x00ff00, 0.5);
    
    world.bodies.forEach(body => {
      const isKinematic = body.bodyType() === 1;
      const isDynamic = body.bodyType() === 0;
      
      if (isKinematic) {
        this.physicsGraphics.lineStyle(2, 0x00ffff, 0.7);
      } else if (isDynamic) {
        this.physicsGraphics.lineStyle(2, 0xffff00, 0.7);
      } else {
        this.physicsGraphics.lineStyle(2, 0x00ff00, 0.5);
      }
      
      const pos = body.translation();
      const rot = body.rotation();
      
      body.colliders.forEach(collider => {
        const shape = collider.shape;
        
        if (shape.type === 0) { // Cuboid
          const halfExtents = shape.halfExtents;
          const x = metersToPixels(pos.x - halfExtents.x);
          const y = metersToPixels(pos.y - halfExtents.y);
          const w = metersToPixels(halfExtents.x * 2);
          const h = metersToPixels(halfExtents.y * 2);
          
          this.physicsGraphics.strokeRect(x, y, w, h);
        }
      });
    });
  }

  drawVelocities() {
    // Draw velocity vectors for KCC entities
    this.scene.physicsManager?.kccEntities.forEach((sprite, kcc) => {
      const vel = kcc.getVelocity();
      const pos = kcc.getPosition();
      
      if (Math.abs(vel.x) > 0.1 || Math.abs(vel.y) > 0.1) {
        this.physicsGraphics.lineStyle(3, 0xff00ff, 0.8);
        this.physicsGraphics.lineBetween(
          pos.x, pos.y,
          pos.x + vel.x * 0.1,
          pos.y + vel.y * 0.1
        );
      }
    });
  }

  updatePerformanceText() {
    const player = this.scene.player;
    const fps = Math.round(this.scene.game.loop.actualFps);
    
    const lines = [
      `FPS: ${fps}`,
      `Bodies: ${this.scene.physicsManager?.world?.bodies.size || 0}`,
      `KCC Entities: ${this.scene.physicsManager?.kccEntities.size || 0}`
    ];
    
    if (player?.kcc) {
      lines.push('---');
      lines.push(`State: ${player.state.current}`);
      lines.push(`Grounded: ${player.kcc.isGrounded()}`);
      lines.push(`Velocity: ${player.state.velocity.x.toFixed(0)}, ${player.state.velocity.y.toFixed(0)}`);
      lines.push(`Jump Count: ${player.state.jumpCount}`);
      lines.push(`Coyote: ${player.state.coyoteTimer.toFixed(2)}`);
    }
    
    this.debugText.setText(lines.join('\n'));
  }
}
```

---

## Phase 5: Agentic Testing Infrastructure (3 days)

### 5.1 Headless Environment Setup
```javascript
// src/headless/server.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Setup Phaser for Node.js
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1280,
  innerHeight: 720
};

global.document = {
  createElement: () => ({
    getContext: () => ({
      drawImage: () => {},
      fillRect: () => {},
      clearRect: () => {}
    })
  }),
  addEventListener: () => {}
};

import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig.js';

// Create headless game instance
const headlessConfig = {
  ...GameConfig,
  type: Phaser.HEADLESS,
  width: 1280,
  height: 720,
  banner: false
};

export function createHeadlessGame() {
  return new Phaser.Game(headlessConfig);
}
```

### 5.2 QAgent Implementation
```javascript
// src/agents/QAgent.js
import * as tf from '@tensorflow/tfjs-node';

export class QAgent {
  constructor(config) {
    this.config = {
      stateSize: config.stateSize || 16,
      actionSize: config.actionSize || 4,
      learningRate: config.learningRate || 0.001,
      gamma: config.gamma || 0.95,
      epsilon: config.epsilon || 1.0,
      epsilonDecay: config.epsilonDecay || 0.995,
      epsilonMin: config.epsilonMin || 0.01,
      batchSize: config.batchSize || 32
    };
    
    // Build DQN model
    this.model = this.buildModel();
    this.targetModel = this.buildModel();
    
    // Experience replay buffer
    this.memory = [];
    this.maxMemorySize = 10000;
    
    // Metrics
    this.metrics = {
      episodes: 0,
      totalReward: 0,
      bugsFound: []
    };
  }

  buildModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.config.stateSize],
          units: 128,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 128,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: this.config.actionSize,
          activation: 'linear'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'meanSquaredError'
    });
    
    return model;
  }

  perceiveState(gameWorld) {
    // Extract state from game world
    const player = gameWorld.player;
    const kcc = player?.kcc;
    
    if (!kcc) return tf.zeros([1, this.config.stateSize]);
    
    const state = [
      // Player position (normalized)
      kcc.getPosition().x / 1280,
      kcc.getPosition().y / 720,
      
      // Velocity
      kcc.getVelocity().x / 500,
      kcc.getVelocity().y / 500,
      
      // Grounded state
      kcc.isGrounded() ? 1 : 0,
      
      // Raycasts (8 directions)
      ...this.performRaycasts(gameWorld, kcc.getPosition())
    ];
    
    // Pad or truncate to match state size
    while (state.length < this.config.stateSize) {
      state.push(0);
    }
    
    return tf.tensor2d([state.slice(0, this.config.stateSize)]);
  }

  performRaycasts(world, position) {
    // Simplified raycast simulation
    const directions = [
      { x: 1, y: 0 },   // Right
      { x: -1, y: 0 },  // Left
      { x: 0, y: 1 },   // Down
      { x: 0, y: -1 },  // Up
      { x: 0.7, y: 0.7 },  // Diagonals
      { x: -0.7, y: 0.7 },
      { x: 0.7, y: -0.7 },
      { x: -0.7, y: -0.7 }
    ];
    
    return directions.map(dir => {
      // Simplified distance calculation
      // In production, use actual Rapier raycasts
      return Math.random(); // Placeholder
    });
  }

  selectAction(state) {
    // Epsilon-greedy strategy
    if (Math.random() < this.config.epsilon) {
      return Math.floor(Math.random() * this.config.actionSize);
    }
    
    const qValues = this.model.predict(state);
    const action = qValues.argMax(-1).dataSync()[0];
    qValues.dispose();
    
    return action;
  }

  remember(state, action, reward, nextState, done) {
    this.memory.push({ state, action, reward, nextState, done });
    
    if (this.memory.length > this.maxMemorySize) {
      this.memory.shift();
    }
  }

  async replay() {
    if (this.memory.length < this.config.batchSize) return;
    
    // Sample batch
    const batch = [];
    for (let i = 0; i < this.config.batchSize; i++) {
      const idx = Math.floor(Math.random() * this.memory.length);
      batch.push(this.memory[idx]);
    }
    
    // Prepare training data
    const states = tf.concat(batch.map(exp => exp.state));
    const nextStates = tf.concat(batch.map(exp => exp.nextState));
    
    const currentQs = await this.model.predict(states).array();
    const futureQs = await this.targetModel.predict(nextStates).array();
    
    // Update Q values
    batch.forEach((exp, idx) => {
      let target = exp.reward;
      if (!exp.done) {
        target += this.config.gamma * Math.max(...futureQs[idx]);
      }
      currentQs[idx][exp.action] = target;
    });
    
    // Train model
    await this.model.fit(states, tf.tensor2d(currentQs), {
      epochs: 1,
      verbose: 0
    });
    
    // Cleanup
    states.dispose();
    nextStates.dispose();
    
    // Decay epsilon
    if (this.config.epsilon > this.config.epsilonMin) {
      this.config.epsilon *= this.config.epsilonDecay;
    }
  }

  updateTargetModel() {
    // Copy weights from main model to target model
    this.targetModel.setWeights(this.model.getWeights());
  }

  checkForBugs(gameWorld) {
    const bugs = [];
    const player = gameWorld.player;
    
    if (!player) return bugs;
    
    // Check for physics anomalies
    const vel = player.kcc.getVelocity();
    if (Math.abs(vel.x) > 1000 || Math.abs(vel.y) > 1000) {
      bugs.push({
        type: 'EXCESSIVE_VELOCITY',
        velocity: { x: vel.x, y: vel.y },
        position: player.kcc.getPosition(),
        timestamp: Date.now()
      });
    }
    
    // Check for out of bounds
    const pos = player.kcc.getPosition();
    if (pos.y > 2000 || pos.y < -500) {
      bugs.push({
        type: 'OUT_OF_BOUNDS',
        position: { x: pos.x, y: pos.y },
        timestamp: Date.now()
      });
    }
    
    return bugs;
  }
}
```

### 5.3 Training Script
```javascript
// tests/agent/train.js
import { createHeadlessGame } from '../../src/headless/server.js';
import { QAgent } from '../../src/agents/QAgent.js';
import fs from 'fs/promises';

async function trainAgent() {
  console.log('🤖 Starting QAgent training...');
  
  // Create headless game
  const game = createHeadlessGame();
  
  // Wait for game to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create agent
  const agent = new QAgent({
    stateSize: 16,
    actionSize: 4, // left, right, jump, idle
    learningRate: 0.001
  });
  
  // Training configuration
  const episodes = 1000;
  const maxStepsPerEpisode = 1000;
  
  for (let episode = 0; episode < episodes; episode++) {
    // Reset game state
    game.scene.scenes[0].resetForTraining();
    
    let totalReward = 0;
    let state = agent.perceiveState(game.scene.scenes[0]);
    
    for (let step = 0; step < maxStepsPerEpisode; step++) {
      // Select and execute action
      const action = agent.selectAction(state);
      const reward = executeAction(game, action);
      
      // Check for bugs
      const bugs = agent.checkForBugs(game.scene.scenes[0]);
      if (bugs.length > 0) {
        reward += 50; // Big reward for finding bugs
        agent.metrics.bugsFound.push(...bugs);
      }
      
      // Get next state
      const nextState = agent.perceiveState(game.scene.scenes[0]);
      const done = isEpisodeDone(game.scene.scenes[0]);
      
      // Remember experience
      agent.remember(state, action, reward, nextState, done);
      
      // Update state
      state = nextState;
      totalReward += reward;
      
      if (done) break;
    }
    
    // Train the model
    await agent.replay();
    
    // Update target network periodically
    if (episode % 10 === 0) {
      agent.updateTargetModel();
    }
    
    // Log progress
    if (episode % 10 === 0) {
      console.log(`Episode ${episode}: Total Reward = ${totalReward.toFixed(2)}, Epsilon = ${agent.config.epsilon.toFixed(3)}, Bugs Found = ${agent.metrics.bugsFound.length}`);
    }
  }
  
  // Save trained model
  await agent.model.save('file://./models/qagent');
  
  // Save bug report
  await fs.writeFile(
    '.reports/bugs-found.json',
    JSON.stringify(agent.metrics.bugsFound, null, 2)
  );
  
  console.log('✅ Training complete!');
  console.log(`Found ${agent.metrics.bugsFound.length} bugs`);
}

function executeAction(game, action) {
  const scene = game.scene.scenes[0];
  const input = scene.inputManager;
  
  // Reset inputs
  input.resetAll();
  
  // Apply action
  switch(action) {
    case 0: input.setLeft(true); break;
    case 1: input.setRight(true); break;
    case 2: input.setJump(true); break;
    case 3: break; // Idle
  }
  
  // Step game
  game.step(16); // Simulate one frame
  
  // Calculate reward
  let reward = 0.1; // Small reward for surviving
  
  const player = scene.player;
  if (player) {
    // Reward forward progress
    reward += player.kcc.getPosition().x * 0.001;
    
    // Penalize falling
    if (player.kcc.getPosition().y > 1000) {
      reward -= 10;
    }
  }
  
  return reward;
}

function isEpisodeDone(scene) {
  const player = scene.player;
  if (!player) return true;
  
  // Episode ends if player falls off map or reaches goal
  const pos = player.kcc.getPosition();
  return pos.y > 1500 || pos.x > 5000;
}

// Run training
trainAgent().catch(console.error);
```

---

## Phase 6: Migration Execution Plan

### Week 1: Foundation
- [ ] Day 1: Setup Bun, Biome, create baseline tests
- [ ] Day 2: Configure build pipeline, verify asset system compatibility
- [ ] Day 3-5: Implement KCC adapter and physics refactor

### Week 2: Core Systems
- [ ] Day 1-2: Update PlayerController with KCC
- [ ] Day 3: Fix PhysicsManager update order
- [ ] Day 4: Implement debug overlay
- [ ] Day 5: Integration testing

### Week 3: Testing Infrastructure
- [ ] Day 1-2: Setup headless environment
- [ ] Day 3-4: Implement basic QAgent
- [ ] Day 5: Run first training sessions

### Week 4: Polish & Validation
- [ ] Day 1-2: Performance optimization
- [ ] Day 3: Bug fixes from agent discoveries
- [ ] Day 4: Documentation updates
- [ ] Day 5: Final validation and merge

---

## Success Metrics

### Performance
- ✅ Stable 60 FPS with 50+ physics bodies
- ✅ Input latency < 16ms (single frame)
- ✅ Build time < 2 seconds
- ✅ Hot reload < 200ms

### Quality
- ✅ Zero ground detection failures
- ✅ No sprite jitter or position conflicts
- ✅ All KCC state transitions smooth
- ✅ 100% test coverage for critical paths

### Developer Experience
- ✅ Single source of truth for all state
- ✅ Debug overlay shows all relevant info
- ✅ QAgent finds and reports bugs automatically
- ✅ Asset pipeline unchanged (no breaking changes)

---

## Risk Mitigation

### Technical Risks
1. **KCC Edge Cases**: Extensive testing on slopes, moving platforms, thin platforms
2. **Performance Regression**: Profile before/after each phase
3. **Asset System Compatibility**: Verify manifest generation works with Bun

### Process Risks
1. **Scope Creep**: Stick to defined phases, defer nice-to-haves
2. **Breaking Changes**: Keep feature flags for gradual rollout
3. **Testing Gaps**: QAgent supplements but doesn't replace manual testing

---

This refactor plan provides a clear, actionable path to modernize WynIsBuff2 while preserving its strengths. The phased approach ensures each improvement is independently valuable, and the comprehensive testing infrastructure (including agentic testing) ensures quality throughout the migration.
