# Effects System (Particles, Camera, Color)

This document explains how WynIsBuff2 implements game effects (particles, camera, and color), how to add new effects intentionally, and how to debug them.

## Architecture

- Event-driven: Effect managers listen to namespaced events via `EventSystem`.
- Managers:
    - `ParticleManager` — Builds and emits particles for jump/land/move and custom FX.
    - `CameraManager` — Screen shake, zoom, and camera reactions to events.
    - `ColorManager` — Palette and color transitions based on state.
- Assets: All particle textures come from generated constants in `src/constants/Assets.js`.
- Scenes: Effect managers are created in `Game` scene and cleaned up with the scene lifecycle.

Flow (Jump example):

1. Controller emits event
    - `PlayerController` emits `EventNames.PLAYER_JUMP` with `{ position, velocity }`.
2. Manager handles event
    - `ParticleManager.handleJump(data)` selects a config and emits a burst.
3. Asset comes from constants
    - Uses `ImageAssets.PARTICLE_WHITE` loaded in `Preloader`.

## Key Files

- `src/modules/effects/ParticleManager.js`
- `src/modules/effects/CameraManager.js`
- `src/modules/effects/ColorManager.js`
- `src/scenes/Game.js` (constructed here)
- `src/scenes/Preloader.js` (loads particle textures)

## ParticleManager

Responsibilities:

- Handle `PLAYER_JUMP`, `PLAYER_LAND`, `PLAYER_MOVE`, and `EMIT_PARTICLES` events
- Create Phaser emitters via `this.scene.add.particles(x, y, ImageAssets.PARTICLE_WHITE, config)`
- Keep a registry of live emitters in `emitters: Map`
- Provide `setQuality(level)` for graphics scaling (hook for density adjustments)

Current event data (examples):

- `PLAYER_JUMP`: `{ position, velocity, jumpNumber? }`
- `PLAYER_LAND`: `{ position, velocity }` (velocity.y is the impact speed)
- `PLAYER_MOVE`: `{ position, velocity, isOnGround }`
- `EMIT_PARTICLES`: `{ type, position, config }` (custom)

Emitter creation:

- `getEmitter(key, config)` -> creates on demand using `createEmitter()` when not present
- Emit with `emitter.explode(quantity, x, y)` for bursts

Configs:

- Jump effects scale with `jumpNumber` (burst size)
- Land effects scale with impact (`|velocity.y|`)
- Move effects emit small puffs while moving on ground

Quality:

- `setQuality('Low'|'Medium'|'High')` available; currently logs only. Extend by adjusting config quantities.

Cleanup:

- `shutdown()`: Remove listeners and stop/destroy emitters
- Called when the scene shuts down

## CameraManager (overview)

- Listens to `PLAYER_JUMP` and `PLAYER_LAND`
- Applies `camera.shake()` and other effects
- Scales with settings via `setQuality()`

## ColorManager (overview)

- Listens to jump phase events and state
- Applies palette or tint transitions for readability and style

## Adding a New Effect (Checklist)

1. Pick the driving event
    - Prefer existing event names in `src/constants/EventNames.js`
    - If new, add to `EventNames`
2. Emit intent from gameplay code
    - Controllers/managers emit `this.eventSystem.emit(EventNames.MY_EVENT, payload)`
3. Handle in an effect manager
    - Add a handler in `ParticleManager`/`CameraManager`/`ColorManager`
    - Add or extend a config block with clear keys
4. Use generated constants
    - Use `ImageAssets.*` (never raw paths)
5. Test in `Game` scene
    - Effects managers are already constructed in `Game.create()`
6. Tune for quality
    - Use `setQuality()` hooks to scale density
7. Validate
    - Watch for console warnings from `LOG` (missing position/velocity)

## Debugging Effects

- Observability:
    - `LOG` tags for creation and emission (`PARTICLEMANAGER_*`).
    - `DebugContext` captures player, physics, and input state automatically.
- Quick checks:
    - Preloader loads `ImageAssets.PARTICLE_WHITE`
    - Events carry `position` and `velocity` as required
    - Ensure handlers are attached (constructed in `Game.create()`)
- Manual emit (custom):
    - Emit `EventNames.EMIT_PARTICLES` with `{ type, position, config }` from any scene/manager for one-off testing.

Example (custom FX):

```js
this.eventSystem.emit(EventNames.EMIT_PARTICLES, {
    type: 'celebrate',
    position: { x: 400, y: 300 },
    config: { lifespan: 800, quantity: 20, speed: { min: 80, max: 160 }, tint: 0x00ffcc },
});
```

## Design Guidelines (Scale Well)

- Event-driven: Only managers listen; gameplay emits intent
- Declarative configs: Keep per-effect configs together and named
- Generated assets: Always use `ImageAssets.*`
- Quality scaling: Gate density/quantity with `setQuality()` hooks
- Lifetime: Use bursts (`explode`) where possible; clean up long-lived emitters
- Performance budget: Prefer a shared small texture for general FX; use atlases for stylized FX later
- Determinism (when needed): Avoid RNG in tests; for gameplay, keep randomness small and controlled

## Roadmap (Incremental)

- Central FX registry: Normalize configs under a single `effects` map with keys (e.g., `fx.jump.1`, `fx.land.default`)
- Quality profiles: Scale configs by profiles (Low/Medium/High)
- DebugAPI hooks: Add simple console helpers to trigger common FX by name
- Visualization overlay: Toggle to show FX origins and bounding regions while tuning

See also:

- docs/ARCHITECTURE.md — System architecture
- ASSET_MANAGEMENT.md — Asset pipeline, manifest, and validation
- assets/ENEMY_ASSETS.md — Enemy spritesheets integration
