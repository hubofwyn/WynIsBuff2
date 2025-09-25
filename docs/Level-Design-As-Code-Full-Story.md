# WynIsBuff2 — Level Design as Code (Full Story of the Planned System)

This document captures the complete intended “Level Design as Code” system described across our design docs (e.g., level-progression-plan.md, ModularLevelArchitecture.md, ArchitecturalAssessment.md), reconciles it with the current code, and details what remains to implement. It is the authoritative story of how levels should be defined, validated, spawned, and tested.

-------------------------------------------------------------------------------

## 1) Vision Overview

- Data-driven levels authored in human-friendly files (YAML/JSON), validated by a strict schema (AJV).
- “Prefabs” mapped 1:1 from spec entries to Rapier bodies/colliders and Phaser sprites.
- Rich object palette beyond rectangles: slopes (polygons), springs, conveyors, hazards, crumble/fall platforms, gates, triggers, turrets, bullets, moving platforms with paths/easing.
- Separation of concerns:
  - Authoring (assets/levels/*.yaml)
  - Validation (scripts/validate-levels.js, schemas/levels.schema.json)
  - Runtime translation (LevelLoader → EntityFactory)
  - Game managers (PhysicsManager, InputManager, UIManager, AudioManager)
- Deterministic update order and a single transform authority (PhysicsManager) to ensure smooth sync.
- Difficulty scaling applied at load time (parameter injection) based on zone/stage.

-------------------------------------------------------------------------------

## 2) Current Implementation vs. Planned

Current code (implemented):
- LevelManager, LevelLoader, Factories for ground/platforms, MovingPlatformController, CollectibleManager, LevelCompletionManager.
- Levels defined in `src/constants/LevelData.js` (JavaScript object), not YAML.
- Platforms/hazards are rectangles only; moving platforms support simple linear motion.
- No AJV schema validation or compile-time pipeline.
- No slopes/polygons, conveyors, crumble/falling platforms, turrets/bullets, scripted triggers.
- Parallax backgrounds supported in a simple, manual way per level config.

Planned (not yet implemented):
- YAML/JSON-driven level files under assets/levels/ with schema validation.
- Prefab palette (40+) with specific physics/materials, including:
  - slope (poly collider), pit/spikes (sensor), spring (sensor with impulse), conveyor (friction/impulse application), ring/pickup (sensor), turret/bullet (timed spawner/projectile), crumble/fall (stateful kinematic→dynamic), gate (conditional sensor), checkpoint, sensor(event), debris, etc.
- Difficulty Scaler that injects parameters like platform gap, mover speed, spring power, spike frequency.
- Robust collision layers/masks (player/terrain/hazard/pickup), unified in constants module.
- World building pipeline: YAMLLoader → Scaler → EntityFactory → Managers.
- Teaching/UX triggers (in-level messaging), boss-escape routes, thorough debug harness.

-------------------------------------------------------------------------------

## 3) Data Model & Schema (Planned)

Directory layout:
```
assets/levels/
  Z0_Tutorial/
    stage-1.yaml
    stage-2.yaml
  Z1_MomentumMountains/
    stage-1.yaml
schemas/levels.schema.json
```

Schema essentials (AJV):
- Root requires `meta`, `objects`, `player_spawn`.
- `meta` has `zone`, `stage`, `music`, `theme`.
- `objects[]` entries include `type`, `x`, `y`, optional `w`, `h`, `path[]`, `speed`, `event`, `requires`, `sensor`, `angle`, `len`, etc.
- Optional collections: `parallax[]` (key, scrollFactor), `decor[]`, `ui` overrides.

Validation flow:
- `scripts/validate-levels.js` runs in CI and locally, validating all YAML against `levels.schema.json`.
- On success, generator produces bundled JSON for the game (`dist/levels.json`) or keeps raw files loaded dynamically.

-------------------------------------------------------------------------------

## 4) Collision Layers & Groups (Planned)

- Constants module e.g., `src/constants/CollisionGroups.js`:
```
export const Groups = {
  STATIC:  0x0001,
  PLAYER:  0x0002,
  HAZARD:  0x0004,
  PICKUP:  0x0008,
};
export function maskFor(...bits) {
  const g = bits.reduce((m,b)=>m|b,0);
  return (g << 16) | g;
}
```
- Objects set `collisionGroups` consistently; queries use `QueryFilterFlags.EXCLUDE_SENSORS` and proper masks.

-------------------------------------------------------------------------------

## 5) Prefab Palette (Detailed)

Legend: RB (RigidBody), Col (Collider)

- ledge: RB=fixed, Col=cuboid(w,h), material friction≈0.9. Static platforms.
- slope: RB=fixed, Col=polygon(triangle) defined by angle and length. Used for ramps.
- pit/spike: RB=fixed (optional) or none, Col=sensor (spike shape or thin rect). On enter → emit `player:damage`.
- mover: RB=kinematicPositionBased, Col=cuboid. `path[]` of points with optional easing. Runtime updates via `setNextKinematicTranslation`.
- fall/crumble: starts kinematic/fixed; after `delay_ms` on player contact converts to dynamic; respawns after `respawn_ms`.
- spring: RB=fixed, Col=sensor. On bottom-hit emits upward impulse to player (JUMP-like) with `power`.
- conveyor: RB=fixed, Col=cuboid. On contact applies tangential impulse/velocity to bodies; visually animates belt.
- ring/pickup: RB=fixed, Col=sensor (ball/rect). On enter: score/collect event; tween spin; destroy/hide.
- turret: RB=fixed, spawns `bullet` prefab on a rate timer; bullets dynamic w/ ball collider; mask to hit player only.
- checkpoint (cp): sensor that records respawn position.
- gate: sensor that checks `requires[]` (e.g., tokens) and opens/unlocks when conditions met.
- sensor: generic event-bridge sensor that emits `event` with `payload` on enter/exit.
- debris_*: dynamic chunks with low density/restitution for cinematic effects.

Prefab spec example (YAML excerpt):
```
objects:
  - type: ledge
    x: 320
    y: 480
    w: 128
    h: 16
  - type: mover
    x: 600
    y: 420
    w: 96
    h: 16
    path:
      - {x: 600, y: 420}
      - {x: 760, y: 420}
    speed: 60
  - type: slope
    x: 900
    y: 500
    angle_deg: 30
    len: 128
```

-------------------------------------------------------------------------------

## 6) Runtime Builder Pipeline (Planned)

1) YAMLLoader
   - Loads and parses YAML files, producing JS object graphs.
2) Scaler
   - Injects difficulty parameters per zone/stage (`gap`, `platformW`, `moverSpeed`, etc.).
3) EntityFactory
   - For each object, creates Rapier body + collider + Phaser sprite/graphics.
   - Registers bodies with PhysicsManager for sync.
4) Linkers
   - Connects sensors/events to EventSystem; binds gates to collected tokens; sets turret timers; wires crumble states.
5) Post
   - Builds parallax layers; positions player spawn; updates UI; schedules music via AudioManager.

-------------------------------------------------------------------------------

## 7) Movement & KCC Interaction (Planned)

- Player uses Rapier KCC (0.18.2) with:
  - `setUp({x:0,y:-1})`, `setOffset(skin)`, `setSlideEnabled(true)`
  - `enableAutostep(maxHeight,minWidth,includeDynamics)`
  - `setSnapToGround(true, snapDist)`, slope climb/slide angles.
- Level geometry must:
  - Use non-sensor colliders for terrain
  - Provide proper masks so KCC queries can “see” the ground
- Hazards/pits/springs/gates use sensors for events, not blocking colliders.

-------------------------------------------------------------------------------

## 8) Teaching/UX Triggers & Boss Escape (Planned)

- Teaching triggers:
  - Invisible sensors that emit `ui:hint` events; UIManager shows labeled prompts (“Press SPACE to jump!”) contextually.
  - Timeouts/cooldowns to avoid spam; de-dup within the same region.
- Boss escape:
  - Levels offer branch/escape gates; reaching a gate emits `scene:transition` with next stage id; supports post-boss “victory lap”.

-------------------------------------------------------------------------------

## 9) Debug Harness & Instrumentation (Planned)

- Overlays:
  - Toggle draw of all collider shapes (including polygons) and sensor bounds.
  - Visualize controller grounding, autostep, and snap events.
- Hotkeys to reload current level YAML; cycle difficulty presets; spawn prefab samples.
- Determinism tests (fixed seed + scripted inputs).

-------------------------------------------------------------------------------

## 10) Implementation Plan (Bridging the Gap)

Phase 1 — Data & Validation
- Add `schemas/levels.schema.json` reflecting documented fields.
- Implement `scripts/validate-levels.js` (AJV) + `npm run validate-levels`/`bun run` equivalent.
- Author initial YAML levels that mirror existing `LevelData.js` content.

Phase 2 — Loader & Factory
- Add `YAMLLoader` (or reuse a small loader using `yaml` package) and integrate into `LevelLoader`.
- Create `EntityFactory` with prefab registry mapping `type → handler(scene, world, spec)`.
- Migrate existing ground/platform/moving platforms to the prefab system (rectangles first).

Phase 3 — Expanded Prefabs
- Implement sensors: `pit`, `ring`, `checkpoint`, `sensor(event)`.
- Implement `spring`, `conveyor` behaviors (impulse/friction application upon contact).
- Implement `fall/crumble` with kinematic→dynamic state and respawn.
- Implement `slope` as polygon collider (triangle), ensure KCC handles slopes (tuning angles).
- Implement `turret` + `bullet` spawner with masks.

Phase 4 — KCC & Ordering
- Finalize KCC controller with autostep/snap/slope angles.
- Reorder `Game.update` so PlayerController applies movement before PhysicsManager steps.
- Consolidate transform authority to PhysicsManager (remove postupdate force-sync & duplicate setters).

Phase 5 — UX & Debug
- Add teaching/UX sensors mapped to UIManager prompts.
- Add debug overlay for colliders and KCC state visualizations.
- Extend tests to cover prefab spawn and basic interactions (collectibles, pits, springs, gates).

-------------------------------------------------------------------------------

## 11) Risks & Mitigations

- Polygon slopes: ensure winding and units (meters), verify KCC slope angles; add fallbacks to step-like ramps if instability occurs.
- Sensor spam: introduce debounce and per-region gating for teaching triggers.
- Performance: batch creation, reduce overdraw in parallax, keep collider counts reasonable; profile moving path interpolation.

-------------------------------------------------------------------------------

## 12) Concrete TODOs (Unimplemented as of now)

- [ ] Add YAML schema + AJV validator; integrate into scripts
- [ ] Implement YAML loader → LevelLoader bridge
- [ ] Implement `EntityFactory` and prefab registry (ledge, mover, slope, pit, spring, conveyor, ring, turret, bullet, crumble, gate, checkpoint, sensor, debris)
- [ ] Create CollisionGroups constants and apply masks consistently
- [ ] Expand MovingPlatformController to path arrays + easing
- [ ] Add crumble/fall state machine with timers and respawn
- [ ] Implement hazard and teaching sensors emitting EventSystem events
- [ ] Add polygon collider builder for slopes (triangle) with meters conversion
- [ ] Link collectibles/gates/checkpoints to progression (LevelCompletionManager/TransitionController)
- [ ] KCC finalization and update ordering refactor
- [ ] Debug overlays and determinism test cases

-------------------------------------------------------------------------------

## 13) Example Pseudocode — Prefab Registry

```js
// src/modules/level/EntityFactory.js (planned)
const registry = new Map([
  ['ledge', (ctx, o) => spawnRect(ctx, o, { rb: 'fixed', sensor:false })],
  ['mover', (ctx, o) => spawnMover(ctx, o)],
  ['slope', (ctx, o) => spawnSlope(ctx, o)],
  ['pit',   (ctx, o) => spawnSensor(ctx, o, { kind:'hazard' })],
  ['ring',  (ctx, o) => spawnPickup(ctx, o)],
  ['spring',(ctx, o) => spawnSpring(ctx, o)],
  ['fall',  (ctx, o) => spawnCrumble(ctx, o)],
  ['gate',  (ctx, o) => spawnGate(ctx, o)],
  ['cp',    (ctx, o) => spawnCheckpoint(ctx, o)],
]);
export function buildLevel(ctx, spec) {
  for (const obj of spec.objects) {
    const handler = registry.get(obj.type);
    if (!handler) { console.warn('Unknown prefab', obj.type); continue; }
    handler(ctx, obj);
  }
}
```

-------------------------------------------------------------------------------

## 14) Conclusion

The level design system envisioned in our docs is richer and more scalable than the current code. By introducing schema-validated, data-driven levels; a prefab registry; robust collision groups; and a KCC-first movement model, we’ll unlock the full design space (slopes, crumble, conveyors, hazards, triggers) while maintaining performance and determinism.

This document is the blueprint for implementing those missing pieces.

*** End of Full Story ***

