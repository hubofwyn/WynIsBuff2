# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev              # Start development server with logging
npm run build            # Build for production with logging
npm test                 # Run tests (CommonJS format in tests/)
npm run generate-assets  # Regenerate asset constants after adding new assets to manifest.json
```

## Architecture Overview

This is a Phaser 3 game built with a feature-based architecture and strong conventions around imports and constants.

### Key Architectural Patterns

1. **Feature-Based Organization**: Code is organized by domain (player, level, effects) with barrel exports at `@features/*`
2. **Event-Driven Architecture**: Centralized EventBus with namespaced events (e.g., `player:jump`, `level:complete`)
3. **Singleton Managers**: All managers extend BaseManager for consistent singleton pattern
4. **No Magic Strings**: Everything uses generated constants - assets, scenes, events

### Recent Enhancements (Latest)

- **Scene Transition System**: Old-school scene changes triggered by events (e.g., passing boss in level 1)
- **Visual Effects**: Player glow, atmospheric particles, vignette, gradient backgrounds
- **Refined Jump Mechanics**: Subtle scaling (1.0x → 1.05x → 1.1x) with improved squash/stretch
- **Duck Mechanic**: C key rotates player 90° with physics collider adjustment

### Project Structure

```
src/
├── constants/        # Auto-generated Assets.js + manually maintained EventNames.js, SceneKeys.js
├── core/            # Infrastructure: BaseManager, EventBus, AudioManager, GameStateManager, etc.
├── features/        # Barrel exports for clean imports (@features/player, @features/level, etc.)
├── modules/         # Implementation details organized by domain
│   ├── player/      # PlayerController and related controllers (movement, jump, collision)
│   ├── level/       # Level loading, platforms, collectibles, transitions
│   ├── effects/     # Visual effects (particles, camera shake, color transitions)
│   └── enemy/       # Enemy AI and behavior
└── scenes/          # Phaser scenes (Boot, Preloader, Game, MainMenu, etc.)
```

## Critical Development Rules

### Import Patterns (ALWAYS follow these)

```javascript
// ✅ CORRECT - Use barrel exports and constants
import { PlayerController } from '@features/player';
import { AudioManager, GameStateManager } from '@features/core';
import { SceneKeys } from '../constants/SceneKeys.js';
import { EventNames } from '../constants/EventNames.js';
import { ImageAssets, AudioAssets } from '../constants/Assets.js';

// ❌ WRONG - Never use direct imports or magic strings
import { PlayerController } from '../modules/player/PlayerController.js';
this.load.image('logo', 'images/ui/logo.png'); // NO!
this.scene.start('MainMenu'); // NO!
```

### Manager Pattern

All managers must extend BaseManager:

```javascript
export class MyManager extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        // Your initialization logic here
        this.setInitialized();
    }
}
```

### Event System Usage

```javascript
// Always use EventNames constants
this.eventSystem.emit(EventNames.PLAYER_JUMP, { height: 100 });
this.eventSystem.on(EventNames.LEVEL_COMPLETE, this.handleLevelComplete);

// Event names follow namespace:action format
// Examples: player:jump, level:complete, game:pause
```

### Asset Management Workflow

1. Add new assets to `/assets/manifest.json`
2. Run `npm run generate-assets`
3. Use generated constants: `ImageAssets.PLAYER_SPRITE`, `AudioAssets.JUMP_SOUND`

### File Naming Conventions

- **Classes**: PascalCase (e.g., `PlayerController.js`)
- **Directories**: camelCase (e.g., `src/modules/player/`)
- **Assets**: kebab-case (e.g., `player-sprite.png`)

## Testing

Tests use CommonJS format (`.cjs` files) with Node.js assert module. No external testing framework.

```bash
npm test  # Runs all tests in tests/ directory
```

Focus areas for tests:
- Singleton behavior of managers
- Event handling and dispatch
- Asset loading and constants
- Core game logic

## Technology Stack

- **Phaser 3.88.2**: HTML5 game framework
- **Rapier 0.18.2**: 2D physics engine (accessed via PhysicsManager)
- **Howler 2.2.4**: Audio management (wrapped by AudioManager)
- **Vite 5.4.19**: Build tool with custom configs in `vite/` directory

## Common Tasks

### Adding a New Feature Module

1. Create directory in `src/modules/yourFeature/`
2. Implement your classes/controllers
3. Create barrel export in `src/features/yourFeature/index.js`
4. Add any new events to `EventNames.js`
5. Import using `@features/yourFeature`

### Adding New Assets

1. Place asset files in appropriate `assets/` subdirectory
2. Add entry to `/assets/manifest.json` with type and path
3. Run `npm run generate-assets`
4. Use via `ImageAssets.YOUR_ASSET` or `AudioAssets.YOUR_ASSET`

### Working with Scenes

1. All scene keys must be in `SceneKeys.js`
2. Reference scenes only through constants: `this.scene.start(SceneKeys.MAIN_MENU)`
3. Scenes should emit events for major state changes

## Key Principles

1. **Separation of Concerns**: Keep modules focused and independent
2. **Testability**: Design for unit testing with dependency injection where needed
3. **Performance**: Use singleton patterns, efficient event dispatch
4. **Developer Experience**: Clean imports, consistent patterns, no magic strings

## Recent Major Changes

- Migrated to modern modular architecture (features-based)
- Refactored all managers to extend BaseManager
- Consolidated event systems (EventSystem wraps EventBus)
- Replaced magic strings with generated constants
- Improved UI/UX for character selection
- Enhanced physics and jump effects for better game feel
- Added level selector with card-based design
- **NEW: Wyn's 9th Birthday Minigame!** Special "Shake Shake" delivery rush game celebrating Wyn's birthday

## Birthday Minigame Details

The birthday minigame (`BirthdayMinigame.js`) is a special lane-based runner game where players:
- Control Wyn sprite delivering special "Shake Shakes" (S²)
- Navigate 5 lanes avoiding obstacles
- Collect power-ups including special birthday power-ups
- Must deliver exactly 9 Shake Shakes to win (for Wyn's 9th birthday)
- Features enhanced particle effects and birthday-themed celebrations

Access from the main menu via the animated rainbow birthday button!

## Determinism and Testing Framework

### GoldenSeedTester Usage

The `GoldenSeedTester` is available for deterministic testing and validating game behavior:

```javascript
// In development scenes, you can enable golden seed testing:
import { GoldenSeedTester, DeterministicRNG } from '@features/core';

// To record a golden run (in Game.js create() method):
if (this.game.config.goldenSeedTest) {
  this.goldenTester = GoldenSeedTester.getInstance();
  this.goldenTester.startRecording({ seed: 1138, maxFrames: 600 });
}

// In update loop:
if (this.goldenTester?.isRecording) {
  this.goldenTester.recordFrame({
    player: this.player,
    enemies: this.enemies,
    score: this.score,
    coins: this.coins
  });
}

// To validate against a snapshot:
const snapshot = localStorage.getItem('goldenSnapshot');
if (snapshot) {
  this.goldenTester.startValidation(JSON.parse(snapshot));
}
```

### Deterministic RNG

All randomness should use `DeterministicRNG` for reproducible gameplay:

```javascript
import { DeterministicRNG } from '@features/core';

const rng = DeterministicRNG.getInstance();
rng.init(seedValue); // Initialize with a specific seed

// Use different streams for different systems:
const enemyChoice = rng.pick(['goblin', 'orc'], 'ai');
const lootRoll = rng.int(1, 100, 'loot');
const particleSpread = rng.gaussian(0, 10, 'particles');
```

## Agent Orchestration System (NEW!)

This project now includes an intelligent multi-agent orchestration system that automatically routes tasks to specialized agents based on context and requirements.

### Available Agents

1. **architecture-guardian**: Ensures architectural consistency, reviews system design, validates patterns
   - Triggers: New features, refactoring, module creation, code organization
   - Priority: Highest (enforces all conventions)

2. **game-physics-expert**: Expert in Phaser 3 and Rapier physics for 2D platformers
   - Triggers: Physics implementation, collision detection, movement mechanics, performance
   - Specialties: Jump mechanics, gravity, velocity calculations, optimization

3. **game-design-innovator**: Creative game design expert for innovative mechanics
   - Triggers: Game mechanics, level design, power-ups, player experience
   - Specialties: Creative features, game feel, experimental gameplay

### Automatic Agent Routing

The system automatically analyzes your requests and routes them to the appropriate agent(s):

```javascript
// Examples of automatic routing:

"Add wall jumping mechanic" 
→ game-design-innovator (design) → architecture-guardian (review) → game-physics-expert (implement)

"Fix collision detection bug"
→ game-physics-expert (diagnose) → architecture-guardian (validate fix)

"Create new power-up system"
→ game-design-innovator (conceptualize) → architecture-guardian (structure) → implementation

"Refactor the player controller"
→ architecture-guardian (primary) with game-physics-expert (supporting)
```

### Workflow Types

#### Feature Development Workflow
1. **Design Phase** (game-design-innovator): Conceptualize and prototype
2. **Architecture Phase** (architecture-guardian): Review and validate patterns
3. **Implementation Phase** (game-physics-expert): Build with optimal physics
4. **Validation Phase** (architecture-guardian): Final review and integration

#### Bug Fixing Workflow
1. **Analysis Phase**: Appropriate expert diagnoses the issue
2. **Solution Phase**: Architecture guardian validates the fix approach

#### Optimization Workflow
1. **Profiling Phase** (game-physics-expert): Identify bottlenecks
2. **Optimization Phase** (game-physics-expert): Implement improvements
3. **Validation Phase** (architecture-guardian): Ensure maintainability

### Quality Gates

All code changes pass through automated quality gates:

**Pre-Implementation Checks:**
- Pattern compliance (BaseManager inheritance)
- Naming conventions (PascalCase classes, camelCase directories)
- Import structure (@features/* barrel exports)

**Post-Implementation Checks:**
- Test coverage verification
- Documentation completeness
- Event consistency (namespace:action format)

### How It Works

1. **Task Analysis**: Your request is analyzed for keywords, patterns, and intent
2. **Agent Selection**: Primary and supporting agents are selected based on confidence scores
3. **Workflow Matching**: Complex tasks trigger multi-phase workflows
4. **Parallel Execution**: Supporting agents can work in parallel when appropriate
5. **Quality Assurance**: Code passes through quality gates at key checkpoints

### Manual Agent Selection

While automatic routing is the default, you can explicitly request specific agents:

```
"Use the game-design-innovator agent to brainstorm boss battle mechanics"
"Have the architecture-guardian review this module structure"
"Ask the game-physics-expert about optimizing collision detection"
```

### Configuration

The orchestration system is configured in `.claude-orchestration.json` and managed by `src/core/AgentOrchestrator.js`. The system:
- Maintains execution history for learning
- Supports parallel agent execution (max 2 concurrent)
- Falls back to architecture-guardian when uncertain
- Enforces all project conventions automatically

### Best Practices with Agents

1. **Let the system route automatically** - It knows the patterns and will choose optimally
2. **Complex features trigger workflows** - Multi-phase execution ensures quality
3. **Architecture guardian has final say** - All code must pass architectural review
4. **Physics expert owns performance** - Performance issues go directly to physics expert
5. **Design innovator leads creativity** - New mechanics start with design phase

This orchestration system ensures consistent, high-quality code that follows all project conventions while leveraging specialized expertise for each aspect of game development.
