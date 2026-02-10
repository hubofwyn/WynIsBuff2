---
globs: src/modules/**/*.js
---

# Module Files Rules

Modules contain domain implementation code (player, level, effects, enemy).

**Strict rules:**
- NO direct vendor imports (no `phaser`, `@dimforge/rapier2d-compat`, `howler`)
- Import abstractions from `@features/core` (BaseScene, PhysicsTypes, etc.)
- Import sibling modules via barrel exports: `@features/player`, `@features/level`, etc.
- Use constants: `SceneKeys.*`, `EventNames.*`, `ImageAssets.*`, `AudioAssets.*`
- Use structured logging: `import { LOG } from '@observability'` - never `console.*`
- Emit events via `EventBus` with `namespace:action` format
- Managers must extend `BaseManager`
