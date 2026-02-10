# WynIsBuff2

A 2D platformer where Wyn achieves maximum buffness through triple-jump mechanics and physics-based movement.

## What Is This?

**WynIsBuff2** is a Phaser 3 game featuring:

- **Triple jump mechanics** with progressive power scaling
- **Physics-based movement** via Rapier 2D physics engine
- **Visual feedback** through particles, screen shake, and color transitions
- **Modular architecture** with feature-based organization and generated constants

Play as Wyn, navigate levels with precise jumping, and experience increasingly buff gameplay.

## Quick Start

```bash
bun install           # Install dependencies (generates bun.lockb)
bun run dev           # Start dev server (port 8080 per Vite config)
bun run build         # Production build
bun run test          # Run tests (Path A runner)
```

## Controls

| Input                      | Action                                           |
| -------------------------- | ------------------------------------------------ |
| **WASD** or **Arrow Keys** | Move                                             |
| **Space**                  | Triple jump (progressive power: 1st → 2nd → 3rd) |
| **C**                      | Duck (rotate 90°, adjust collider)               |
| **ESC**                    | Pause                                            |

## Features

### Core Mechanics

- **Triple Jump System**: Three jumps with increasing power and visual scaling (1.0x → 1.05x → 1.1x)
- **Duck Mechanic**: Rotate player 90° with physics collider adjustment
- **Scene Transitions**: Old-school level progression triggered by in-game events

### Visual Effects

- Player glow with pulsing aura
- Particle explosions on jumps and landings
- Screen shake on impacts
- Smooth color transitions
- Atmospheric background particles
- Gradient backgrounds with vignette

### Technical Features

- **Physics**: Rapier 2D engine via PhysicsManager singleton
- **Audio**: Howler.js with MP3/OGG support and stereo panning
- **Assets**: Generated constants (no magic strings)
- **Events**: Centralized EventBus with namespaced events
- **Observability**: Structured logging with automatic context capture and agent-friendly debugging API
- **Deterministic Testing**: GoldenSeedTester and DeterministicRNG

## Technology Stack

| Technology      | Version | Purpose              |
| --------------- | ------- | -------------------- |
| Phaser 3        | 3.90.x  | HTML5 game framework |
| Rapier (compat) | 0.19.x  | 2D physics engine    |
| Howler.js       | 2.2.4   | Audio management     |
| Vite            | 7.1.x   | Build tool           |
| JavaScript      | ES6+    | Language             |

## Project Structure

```text
WynIsBuff2/
├── assets/              # Game assets
│   └── manifest.json    # Asset catalog (generates constants)
├── src/
│   ├── core/           # BaseManager, EventBus, AudioManager, GameStateManager
│   ├── features/       # Barrel exports (@features/player, @features/core)
│   ├── modules/        # Implementation (player/, level/, effects/, enemy/)
│   ├── constants/      # Generated: Assets.js | Manual: SceneKeys.js, EventNames.js
│   └── scenes/         # Phaser scenes (Boot, Preloader, Game, MainMenu)
├── scripts/            # Automation (generate-assets.js)
├── docs/               # Documentation
├── tests/              # CommonJS tests (.cjs)
└── CONTRIBUTING.md     # Development guide
```

## Architecture Highlights

### Feature-Based Organization

Code organized by domain with barrel exports:

- `@features/player` - Player controls and movement
- `@features/level` - Level management and loading
- `@features/effects` - Visual and particle effects
- `@features/core` - Core systems and managers

### No Magic Strings

All assets, scenes, and events use generated constants:

```javascript
// Old approach
this.scene.start('MainMenu');
this.load.image('player', 'sprites/player.png');

// Current approach
this.scene.start(SceneKeys.MAIN_MENU);
this.load.image(ImageAssets.PLAYER, ImagePaths.PLAYER);
```

### Singleton Pattern

All managers extend `BaseManager` with consistent initialization:

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

### Event-Driven Architecture

Centralized EventBus with namespaced events (`namespace:action`):

```javascript
this.eventSystem.emit(EventNames.PLAYER_JUMP, { height: 100 });
this.eventSystem.on(EventNames.LEVEL_COMPLETE, this.handleComplete);
```

## Development

### Adding Features

1. Create module in `src/modules/yourFeature/`
2. Implement classes
3. Create barrel export: `src/features/yourFeature/index.js`
4. Add events to `EventNames.js`
5. Import via `@features/yourFeature`

### Adding Assets

1. Place asset in `assets/` subdirectory
2. Add to `/assets/manifest.json`:

    ```json
    {
        "type": "image",
        "key": "my-asset",
        "path": "images/my-asset.png"
    }
    ```

3. Run `bun run generate-assets`
4. Use via `ImageAssets.MY_ASSET`

### Testing

Tests use CommonJS format (`.cjs`) with Node.js assert module:

```bash
bun test  # Runs all tests/ files
```

### Observability & Debugging

WynIsBuff2 includes a comprehensive observability system with structured logging and agent-friendly debugging tools.

**Browser Console Commands:**

```javascript
// Check system health
window.debugAPI.getSummary();

// View recent logs
window.debugAPI.getRecentLogs(60000); // Last 60 seconds

// Analyze subsystem
window.debugAPI.analyzeSubsystem('physics');

// Get error suggestions
window.debugAPI.getSuggestions('PHYSICS_UPDATE_ERROR');

// Export report
window.debugAPI.exportForAnalysis({ format: 'markdown' });
```

**In Code:**

```javascript
import { LOG } from '@observability';

// Structured logging (replaces console.*)
LOG.info('PLAYER_SPAWN', {
    subsystem: 'player',
    message: 'Player spawned',
    position: { x, y },
});
```

See [docs/guides/DEBUGGING.md](docs/guides/DEBUGGING.md) for complete guide.

## Documentation

- **Windsurf/Cascade**: [.windsurf/README.md](.windsurf/README.md) - AI configuration and rules
- **Development Guide**: [CLAUDE.md](CLAUDE.md) - AI assistant and developer guide
- **Debugging Guide**: [docs/guides/DEBUGGING.md](docs/guides/DEBUGGING.md) - Observability and debugging
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md) - Development workflow and conventions
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design deep dive
- **Full Index**: [docs/INDEX.md](docs/INDEX.md) - Complete documentation map
- **Systems**: [docs/systems/](docs/systems/) - Core system documentation
- **Features**: [docs/features/](docs/features/) - Feature implementation guides

## Special Features

### Birthday Minigame

Lane-based runner where Wyn delivers "Shake Shakes" (S²). Navigate 5 lanes, collect power-ups, deliver exactly 9 to win. Access via rainbow button in main menu.

See [docs/birthday-minigame.md](docs/birthday-minigame.md) for details.

### Agent Orchestration

Multi-agent system for development with specialized agents:

- `architecture-guardian` - Enforces patterns and conventions
- `game-physics-expert` - Phaser/Rapier physics specialist
- `game-design-innovator` - Game mechanics and design

See [CLAUDE.md](CLAUDE.md) for details.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Architecture patterns and conventions
- Naming conventions
- Testing guidelines
- Asset management workflow
- Code style and best practices

---

**WynIsBuff2** - Where buffness meets clean, maintainable code.

## Scope

This README introduces the project, controls, technology stack, and links to the rest of the docs. For contribution workflow, see CONTRIBUTING.md. For system design, see docs/ARCHITECTURE.md. For assets, see docs/guides/ASSET_MANAGEMENT.md.
