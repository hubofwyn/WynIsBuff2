---
globs: src/core/**/*.js
---

# Core Files Rules

This is the **only** directory allowed to import vendor libraries directly:
- `phaser` (Phaser 3)
- `@dimforge/rapier2d-compat` (Rapier physics)
- `howler` (Audio)

All managers in this directory MUST extend `BaseManager` with `init()` and `setInitialized()`.

Exports from core are re-exported through `src/features/core/index.js` for the rest of the codebase.

Key files:
- `BaseScene.js` - Scene abstraction wrapping Phaser.Scene
- `PhysicsTypes.js` - Rapier type re-exports (Vector2, RigidBodyDesc, ColliderDesc)
- `PhysicsManager.js` - Singleton physics world manager
- `AudioManager.js` - Singleton audio manager wrapping Howler
- `BaseManager.js` - Base class for all singleton managers

Use structured logging (`LOG` from `@observability`), never `console.*`.
