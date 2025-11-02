# WynIsBuff2 Workspace Rules

**Last Updated:** 2025-01-02  
**Scope:** WynIsBuff2 project  
**Applies to:** All files unless overridden by file-scoped rules

---

## Project Context

WynIsBuff2 is a Phaser 3 platformer with:
- Feature-based modular architecture
- Event-driven communication via EventBus
- Rapier physics integration via PhysicsManager
- Automated asset generation pipeline
- Strict vendor abstraction layer

**Tech Stack:**
- Phaser 3.90.x (game framework)
- Rapier 0.19.x (physics engine)
- Howler 2.2.4 (audio)
- Vite 7.1.x (build tool)
- Bun (package manager & runtime)

---

## Critical Architecture Rules (STRICT ENFORCEMENT)

### 1. Import Patterns - NEVER VIOLATE

```javascript
// ✅ CORRECT - Use barrel exports and constants
import { PlayerController } from '@features/player';
import { AudioManager } from '@features/core';
import { BaseScene, PhysicsTypes } from '@features/core';
import { SceneKeys } from '../constants/SceneKeys.js';
import { EventNames } from '../constants/EventNames.js';
import { ImageAssets, AudioAssets } from '../constants/Assets.js';

// ❌ WRONG - Never use direct imports or magic strings
import { PlayerController } from '../modules/player/PlayerController.js';
import { Scene } from 'phaser';  // NEVER import vendors directly
import RAPIER from '@dimforge/rapier2d-compat';  // NEVER
this.load.image('logo', 'images/ui/logo.png');  // NO magic strings
this.scene.start('MainMenu');  // NO magic strings
```

**Rule:** Only `src/core/` may import vendor libraries. All other code MUST use abstractions from `@features/core`.

### 2. Vendor Abstraction Layer (MANDATORY)

- **BaseScene** - Extends Phaser.Scene with observability hooks
- **PhysicsTypes** - All Rapier types (Vector2, RigidBodyDesc, ColliderDesc, etc.)

All scenes MUST extend `BaseScene` from `@features/core`, not Phaser.Scene directly.

See: `docs/architecture/adrs/ADR-001-vendor-abstraction-layer.md`

### 3. No Magic Strings - Use Generated Constants

- **Assets:** `ImageAssets.*`, `AudioAssets.*`, `ImagePaths.*`, `AudioPaths.*`
- **Scenes:** `SceneKeys.*`
- **Events:** `EventNames.*`

**Workflow:**
1. Add asset to `/assets/manifest.json`
2. Run `bun run generate-assets`
3. Use via constants

### 4. Singleton Manager Pattern

All managers MUST extend `BaseManager`:

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

### 5. Event-Driven Communication

Use EventBus with namespaced events (`namespace:action`):

```javascript
this.eventSystem.emit(EventNames.PLAYER_JUMP, { height: 100 });
this.eventSystem.on(EventNames.LEVEL_COMPLETE, this.handleComplete);
```

### 6. Observability First - NO CONSOLE LOGGING

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

// ❌ WRONG - NEVER use console.*
console.log('Player spawned');  // FORBIDDEN
console.error('Error:', error);  // FORBIDDEN
```

**Log Levels:**
- `LOG.dev()` - Development/verbose (1% sampled)
- `LOG.info()` - Important state changes
- `LOG.warn()` - Unexpected but handled situations
- `LOG.error()` - Failures that impact functionality
- `LOG.fatal()` - Critical failures

---

## Build & Test Commands

```bash
# Development
bun run dev              # Start dev server with logging
bun run dev-nolog        # Start dev server without logging
bun run build            # Production build

# Asset Management
bun run generate-assets  # Regenerate Assets.js from manifest.json
bun run validate-assets  # Check asset integrity

# Testing
bun run test             # Run all tests (CommonJS .cjs)

# Quality Checks
bun run lint             # ESLint checking
bun run lint:fix         # Auto-fix linting issues
bun run format           # Format with Prettier
bun run format:check     # Check formatting

# Architecture Validation
bun run arch:health      # Check architecture health
bun run arch:validate    # Validate architecture rules
bun run arch:check       # Full architecture check
bun run deps:check       # Check dependency rules
```

---

## Code Change Workflow

### For Any Code Change:

1. **Read existing patterns** in similar modules first
2. **Follow barrel export structure** (@features/*)
3. **Add events to EventNames.js** if needed
4. **Update manifest.json** for new assets
5. **Run `bun run generate-assets`** after manifest changes
6. **Use structured logging** (LOG.* not console.*)
7. **Test with `bun run test`**
8. **Run `bun run arch:health`** to verify compliance

### For New Features:

1. Create module in `src/modules/yourFeature/`
2. Implement classes following singleton pattern if manager
3. Create barrel export: `src/features/yourFeature/index.js`
4. Add events to `EventNames.js`
5. Import via `@features/yourFeature`
6. Add tests in `tests/` (CommonJS .cjs format)

### For New Scenes:

1. Add key to `SceneKeys.js`
2. Create scene in `src/scenes/` extending `BaseScene` from `@features/core`
3. Constructor: `super(SceneKeys.YOUR_SCENE)`
4. Use constants for all assets and scene references
5. Emit events for state changes

### For Bug Fixes:

1. Reproduce the issue first
2. Check event flow and manager states
3. Verify asset constants are used correctly
4. Add structured logging to track issue
5. Test fix across different scenes
6. Run tests to ensure no regression

---

## Naming Conventions

- **Classes:** `PascalCase` (PlayerController.js)
- **Files:** `PascalCase.js` for classes, `camelCase.js` for utilities
- **Directories:** `camelCase` (src/modules/player/)
- **Assets:** `kebab-case` (player-sprite.png)
- **Events:** `namespace:action` (player:jump, level:complete)
- **Constants:** `SCREAMING_SNAKE_CASE`

---

## Project Structure

```
src/
├── constants/        # AUTO-GENERATED: Assets.js | MANUAL: EventNames.js, SceneKeys.js
├── core/             # Vendor abstractions + Core managers (ONLY place for vendor imports)
├── features/         # Barrel exports (@features/player, @features/level, @features/core)
├── modules/          # Implementation (player/, level/, effects/, enemy/)
├── scenes/           # Game scenes extending BaseScene
└── observability/    # Logging and debugging system
```

---

## Testing Requirements

- Tests use CommonJS format (`.cjs` extension)
- Use Node.js `assert` module
- Focus on singleton behavior, event dispatch, asset loading, core logic
- Run `bun run test` before committing

---

## Security & Best Practices

- Never commit API keys or secrets
- Use environment variables for configuration
- Follow existing code style (2 spaces, camelCase)
- Maintain test coverage for critical paths
- Document complex game mechanics
- Clean up event listeners in scene shutdown

---

## Performance Considerations

- Use singletons for managers (avoid re-instantiation)
- Efficient event handling via EventBus
- Optimize asset loading in Preloader scene
- Consider texture atlases for sprites
- Profile with Chrome DevTools when optimizing

---

## Special Notes

### Birthday Minigame
The birthday minigame is a special feature for Wyn's 9th birthday. Handle with care and test thoroughly across scenes (MainMenu, Game, BirthdayMinigame).

### Deterministic Testing
Use `GoldenSeedTester` and `DeterministicRNG` for reproducible gameplay testing.

---

## Documentation References

- **CLAUDE.md** - AI assistant development guide
- **AGENTS.md** - Agent orchestration system
- **CONTRIBUTING.md** - Development workflow
- **docs/ARCHITECTURE.md** - System design
- **docs/guides/DEBUGGING.md** - Observability guide
- **docs/INDEX.md** - Complete documentation map

---

## When Unsure

1. Check existing patterns in similar modules
2. Read CLAUDE.md for architecture rules
3. Consult docs/architecture/ for design decisions
4. Run `bun run arch:health` to verify compliance
5. Ask before introducing new patterns or dependencies
