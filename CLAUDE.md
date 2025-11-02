# CLAUDE.md

Development guide for Claude Code and AI assistants working on WynIsBuff2.

> **Note for Windsurf/Cascade Users**: This project includes optimized Windsurf configuration in `.windsurf/` with workspace rules, file-scoped rules, and automated workflows. See [.windsurf/README.md](.windsurf/README.md) for details.

## Quick Start

```bash
npm install             # Install dependencies
npm run dev             # Start development server (port 5173)
npm test                # Run tests
npm run build           # Production build
npm run arch:health     # Check architecture health
```

## Architecture Essentials

**Core Pattern**: Feature-based architecture with event-driven communication and generated constants.

**Six Principles:**

1. **Barrel Exports** - Import from `@features/*`, never from `../modules/*`
2. **Vendor Abstraction** - Use `BaseScene` and `PhysicsTypes` from `@features/core`, never import vendor libraries directly
3. **Generated Constants** - Use `ImageAssets.*`, `AudioAssets.*`, `SceneKeys.*`, `EventNames.*`
4. **Singleton Managers** - Extend `BaseManager` with `init()` and `setInitialized()`
5. **Event-Driven** - Communicate via `EventBus` with namespaced events (`namespace:action`)
6. **Observability First** - Use structured logging via `LOG` system, never `console.*`

### Project Structure

```
src/
├── constants/        # AUTO-GENERATED: Assets.js | MANUAL: EventNames.js, SceneKeys.js
├── core/             # Vendor abstractions (BaseScene, PhysicsTypes) + Core managers
├── features/         # Barrel exports (@features/player, @features/level, @features/core)
├── modules/          # Implementation (player/, level/, effects/, enemy/)
└── scenes/           # Game scenes extending BaseScene
```

## Critical Rules

### Import Pattern (Enforce Strictly)

```javascript
// ✅ CORRECT - Barrel exports + constants
import { PlayerController } from '@features/player';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets } from '../constants/Assets.js';

// ❌ WRONG - Direct paths or magic strings
import { PlayerController } from '../modules/player/PlayerController.js';
this.load.image('logo', 'images/ui/logo.png');
this.scene.start('MainMenu');
```

### Vendor Abstraction (Enforce Strictly)

**Rule**: Only `src/core/` may import vendor libraries. All other code uses abstractions from `@features/core`.

```javascript
// ✅ CORRECT - Use abstractions
import { BaseScene } from '@features/core';
import { Vector2, RigidBodyDesc, ColliderDesc } from '@features/core';

export class GameScene extends BaseScene {
    constructor() {
        super(SceneKeys.GAME);
    }
}

// ❌ WRONG - Direct vendor imports
import { Scene } from 'phaser';
import RAPIER from '@dimforge/rapier2d-compat';
```

**Available Abstractions:**
- `BaseScene` - Extends Phaser.Scene with observability
- `PhysicsTypes` - All Rapier types (Vector2, RigidBodyDesc, ColliderDesc, etc.) and helper functions

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

### Event System (Standard Communication)

```javascript
// Emit events with namespace:action format
this.eventSystem.emit(EventNames.PLAYER_JUMP, { height: 100 });
this.eventSystem.on(EventNames.LEVEL_COMPLETE, this.handleComplete);

// Examples: player:jump, level:complete, game:pause
```

### Observability System (Required for All Code)

**CRITICAL**: Never use `console.log`, `console.error`, etc. Always use structured logging.

```javascript
import { LOG } from '@observability';

// ✅ CORRECT - Structured logging
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

// ❌ WRONG - Console logging
console.log('Player spawned'); // Never do this
console.error('Error:', error); // Never do this
```

**Log Levels:**

- `LOG.dev()` - Development/verbose (1% sampled)
- `LOG.info()` - Important state changes
- `LOG.warn()` - Unexpected but handled situations
- `LOG.error()` - Failures that impact functionality
- `LOG.fatal()` - Critical failures, triggers crash dumps

**Querying Logs (Browser Console):**

```javascript
// Get system health
window.debugAPI.getSummary();

// Recent errors
window.debugAPI.getRecentLogs(60000);

// Analyze subsystem
window.debugAPI.analyzeSubsystem('physics');
```

**Documentation:** See [docs/guides/DEBUGGING.md](docs/guides/DEBUGGING.md) for complete guide.

### Asset Workflow (Three Steps)

1. Add asset to `/assets/manifest.json`
2. Run `npm run generate-assets`
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
2. Add to `/assets/manifest.json`:
    ```json
    {
        "type": "image",
        "key": "my-asset",
        "path": "images/my-asset.png"
    }
    ```
3. Run `npm run generate-assets`
4. Use: `ImageAssets.MY_ASSET`

## Naming Conventions

- **Classes**: `PascalCase` (PlayerController.js)
- **Directories**: `camelCase` (src/modules/player/)
- **Assets**: `kebab-case` (player-sprite.png)
- **Events**: `namespace:action` (player:jump)

## Technology Stack

| Technology      | Version | Purpose                         |
| --------------- | ------- | ------------------------------- |
| Phaser 3        | 3.90.x  | Game framework                  |
| Rapier (compat) | 0.19.x  | 2D physics (via PhysicsManager) |
| Howler          | 2.2.4   | Audio (via AudioManager)        |
| Vite            | 7.1.x   | Build tool                      |

## Testing

Tests use CommonJS (`.cjs`) with Node.js `assert`. No external framework.

```bash
npm test  # Runs all tests/ files
```

**Focus Areas:**

- Singleton behavior
- Event dispatch
- Asset loading
- Core game logic

## Agent System

WynIsBuff2 uses specialized agents for different tasks. See [AGENTS.md](AGENTS.md) for details.

**Available Agents:**

- `architecture-guardian` - Enforces patterns and conventions
- `game-physics-expert` - Phaser/Rapier physics specialist
- `game-design-innovator` - Game mechanics and design

**Agent Routing:** Automatic based on task keywords. For explicit routing:

```
"Use game-physics-expert to optimize collision detection"
```

## Deterministic Testing

For reproducible gameplay testing:

```javascript
import { GoldenSeedTester, DeterministicRNG } from '@features/core';

// Record deterministic run
if (this.game.config.goldenSeedTest) {
    this.tester = GoldenSeedTester.getInstance();
    this.tester.startRecording({ seed: 1138, maxFrames: 600 });
}

// Use deterministic RNG
const rng = DeterministicRNG.getInstance();
rng.init(seedValue);
const value = rng.int(1, 100, 'streamName');
```

## Key Principles

1. **Separation of Concerns** - Modules are independent
2. **Architectural Boundaries** - Enforced layer boundaries with vendor abstraction
3. **Testability** - Design for unit testing
4. **Performance** - Singletons, efficient events
5. **Developer Experience** - Clean imports, consistent patterns, real-time validation

## Documentation

- **Windsurf Configuration**: [.windsurf/README.md](.windsurf/README.md) - Cascade AI setup and rules
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Systems**: [docs/systems/](docs/systems/)
- **Features**: [docs/features/](docs/features/)
- **Observability**: [docs/systems/ERROR_HANDLING_LOGGING.md](docs/systems/ERROR_HANDLING_LOGGING.md)
- **Debugging Guide**: [docs/guides/DEBUGGING.md](docs/guides/DEBUGGING.md)
- **Asset Management**: [ASSET_MANAGEMENT.md](ASSET_MANAGEMENT.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Full Index**: [docs/INDEX.md](docs/INDEX.md)

## Questions?

- Windsurf/Cascade setup → [.windsurf/README.md](.windsurf/README.md)
- Architecture questions → [docs/architecture/](docs/architecture/)
- Physics/Rapier → [docs/technology/RapierPhysics.md](docs/technology/RapierPhysics.md)
- Phaser integration → [docs/technology/PhaserFramework.md](docs/technology/PhaserFramework.md)
- Debugging/Observability → [docs/guides/DEBUGGING.md](docs/guides/DEBUGGING.md)
- Agent system → [AGENTS.md](AGENTS.md)
- Everything else → [docs/INDEX.md](docs/INDEX.md)
