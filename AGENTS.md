# AGENTS.md

> Canonical project contract for WynIsBuff2. Tool-agnostic, single source of truth.

## Project Identity

**WynIsBuff2** - A skill-to-automation 2D platformer where player performance creates idle automation through "clone forging."

| Technology | Version | Purpose |
|---|---|---|
| Phaser 3 | 3.90.x | Game framework |
| Rapier (compat) | 0.19.x | 2D physics (via PhysicsManager) |
| Howler | 2.2.4 | Audio (via AudioManager) |
| Vite | 7.1.x | Build tool |
| Bun | latest | Runtime & package manager |

## Architecture Principles

**Core Pattern**: Feature-based architecture with event-driven communication and generated constants.

1. **Barrel Exports** - Import from `@features/*`, never from `../modules/*`
2. **Vendor Abstraction** - Only `src/core/` imports Phaser/Rapier/Howler directly; all other code uses abstractions from `@features/core`
3. **Generated Constants** - Use `ImageAssets.*`, `AudioAssets.*`, `SceneKeys.*`, `EventNames.*`
4. **Singleton Managers** - Extend `BaseManager` with `init()` and `setInitialized()`
5. **Event-Driven** - Communicate via `EventBus` with namespaced events (`namespace:action`)
6. **Observability First** - Structured logging via `LOG` system, never `console.*`

## Directory Structure

```
src/
├── constants/        # AUTO-GENERATED: Assets.js | MANUAL: EventNames.js, SceneKeys.js
├── core/             # Vendor abstractions (BaseScene, PhysicsTypes) + Core managers
├── features/         # Barrel exports (@features/player, @features/level, @features/core)
├── modules/          # Implementation (player/, level/, effects/, enemy/)
├── observability/    # LOG system, debugAPI
└── scenes/           # Game scenes extending BaseScene
```

## Critical Rules

### Import Pattern (Enforce Strictly)

```javascript
// CORRECT - Barrel exports + constants
import { PlayerController } from '@features/player';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets } from '../constants/Assets.js';

// WRONG - Direct paths or magic strings
import { PlayerController } from '../modules/player/PlayerController.js';
this.load.image('logo', 'images/ui/logo.png');
this.scene.start('MainMenu');
```

### Vendor Abstraction (Enforce Strictly)

Only `src/core/` may import vendor libraries. All other code uses abstractions from `@features/core`.

```javascript
// CORRECT
import { BaseScene } from '@features/core';
import { Vector2, RigidBodyDesc, ColliderDesc } from '@features/core';

export class GameScene extends BaseScene {
    constructor() { super(SceneKeys.GAME); }
}

// WRONG
import { Scene } from 'phaser';
import RAPIER from '@dimforge/rapier2d-compat';
```

Available abstractions:
- `BaseScene` - Extends Phaser.Scene with observability
- `PhysicsTypes` - All Rapier types (Vector2, RigidBodyDesc, ColliderDesc, etc.)

See [ADR-001](docs/architecture/adrs/ADR-001-vendor-abstraction-layer.md) for rationale.

### Manager Pattern (Required)

```javascript
export class MyManager extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }
    init() {
        // Initialize here
        this.setInitialized();
    }
}
```

### Event System

```javascript
// Emit with namespace:action format
this.eventSystem.emit(EventNames.PLAYER_JUMP, { height: 100 });
this.eventSystem.on(EventNames.LEVEL_COMPLETE, this.handleComplete);
// Examples: player:jump, level:complete, game:pause
```

### Observability (Required for All Code)

**Never use `console.log`, `console.error`, etc.** Always use structured logging.

```javascript
import { LOG } from '@observability';

LOG.info('PLAYER_SPAWN', {
    subsystem: 'player',
    message: 'Player spawned successfully',
    position: { x: 100, y: 200 },
});

LOG.error('PHYSICS_UPDATE_ERROR', {
    subsystem: 'physics',
    error,
    message: 'Failed to update physics world',
    hint: 'Check if physics world is initialized',
});
```

Log levels: `LOG.dev()` (1% sampled) | `LOG.info()` | `LOG.warn()` | `LOG.error()` | `LOG.fatal()` (crash dumps)

Browser console: `window.debugAPI.getSummary()`, `.getRecentLogs(ms)`, `.analyzeSubsystem(name)`

### Asset Workflow

1. Add asset to `/assets/manifest.json`
2. Run `bun run generate-assets`
3. Use via constants: `ImageAssets.PLAYER_SPRITE`

## Common Development Tasks

### Add New Feature Module

1. Create `src/modules/yourFeature/`
2. Implement classes
3. Create barrel: `src/features/yourFeature/index.js`
4. Add events to `EventNames.js`
5. Import: `@features/yourFeature`

### Add Scene

1. Add key to `SceneKeys.js`
2. Create scene in `src/scenes/` extending `BaseScene` from `@features/core`
3. Constructor: `super(SceneKeys.YOUR_SCENE)`
4. Reference: `this.scene.start(SceneKeys.YOUR_SCENE)`
5. Emit events for state changes

### Add Assets

1. Place in `assets/` subdirectory
2. Add to `/assets/manifest.json`
3. Run `bun run generate-assets`
4. Use: `ImageAssets.MY_ASSET`

## Naming Conventions

| What | Convention | Example |
|---|---|---|
| Classes | PascalCase | `PlayerController.js` |
| Directories | camelCase | `src/modules/player/` |
| Assets | kebab-case | `player-sprite.png` |
| Events | namespace:action | `player:jump` |

## Testing

Tests use CommonJS (`.cjs`) with Node.js `assert`. No external framework.

```bash
bun test  # Runs all tests/ files
```

Focus: singleton behavior, event dispatch, asset loading, core game logic.

### Deterministic Testing

```javascript
import { GoldenSeedTester, DeterministicRNG } from '@features/core';

const tester = GoldenSeedTester.getInstance();
tester.startRecording({ seed: 1138, maxFrames: 600 });

const rng = DeterministicRNG.getInstance();
rng.init(seedValue);
const value = rng.int(1, 100, 'streamName');
```

## Agent Specializations

| Agent | Role | Triggers |
|---|---|---|
| `architecture-guardian` | Enforces patterns, validates structure | New features, refactoring, module creation |
| `game-physics-expert` | Phaser/Rapier physics implementation | Collision, movement, performance |
| `game-design-innovator` | Game mechanics and player experience | Mechanics, level design, UX |

## Quick Commands

| Command | Purpose |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Dev server (port 5173) |
| `bun test` | Run tests |
| `bun run build` | Production build |
| `bun run arch:health` | Architecture health check |
| `bun run generate-assets` | Regenerate asset constants |
| `bun run lint:boundaries` | Check import boundaries |
| `bun run deps:check` | Dependency analysis |

## Definition of Done

- [ ] Tests pass (`bun test`)
- [ ] Architecture health green (`bun run arch:health`)
- [ ] No vendor imports outside `src/core/`
- [ ] All imports use barrel exports
- [ ] No magic strings - constants only
- [ ] Structured logging via LOG (no console.*)
- [ ] Events follow namespace:action format

## Boundaries

**Always**: barrel exports, vendor abstraction, generated constants, structured logging, event-driven communication, BaseManager for singletons

**Ask first**: new module creation, new scene addition, changes to core/, changes to constants/, new event namespaces

**Never**: direct vendor imports outside core/, console.log/error/warn, magic strings for scenes/assets/events, manual edits to Assets.js (auto-generated)

## Documentation

- [Architecture](docs/ARCHITECTURE.md) | [Systems](docs/systems/) | [Features](docs/features/)
- [Debugging Guide](docs/guides/DEBUGGING.md) | [Asset Management](docs/guides/ASSET_MANAGEMENT.md)
- [Contributing](CONTRIBUTING.md) | [Full Index](docs/INDEX.md)
