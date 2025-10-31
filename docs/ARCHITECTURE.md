# WynIsBuff2 Architecture Documentation

## 🏗️ Architectural Overview

WynIsBuff2 implements a **feature-based architecture** with **barrel exports** to provide clean separation of concerns while maintaining backwards compatibility during refactoring.

### Scope

This document explains system architecture, design goals, event flows, and core managers. It does not replace onboarding or contribution workflow docs.

- Read this to understand how systems fit together
- For contribution workflow, see CONTRIBUTING.md
- For asset generation/validation, see ASSET_MANAGEMENT.md

### Design Goals

1. **Maintainability** - Clear separation between features and core systems
2. **Scalability** - Easy to add new features without breaking existing code
3. **Developer Experience** - Clean imports, no magic strings, consistent patterns
4. **Performance** - Singleton managers, efficient event system, optimized asset loading
5. **Testability** - Modular design allows for isolated testing

## 📊 System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        Scenes Layer                         │
│  (Boot, Preloader, Game, MainMenu, PauseScene,            │
│   BirthdayMinigame, GameOver, etc.)                       │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                      Features Layer                         │
│     (Barrel exports: @features/player, @features/core)     │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Implementation Layer                     │
│        (Modules: player/, level/, effects/, core/)         │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                     Infrastructure                          │
│      (Phaser, Rapier, Howler, EventBus, BaseManager)      │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Feature Organization

### Core Systems (`src/core/`)

Infrastructure and shared services that all features depend on.

- **BaseManager** - Singleton lifecycle management
- **EventBus** - Environment-agnostic event system
- **AudioManager** - Centralized audio management
- **GameStateManager** - Save/load and settings persistence
- **PhysicsManager** - Rapier physics integration
- **UIManager** - UI element management
- **InputManager** - Input handling and mapping

### Feature Modules (`src/modules/`)

Domain-specific implementations organized by functional area.

#### Player System (`modules/player/`)

```
PlayerController.js     # Main coordinator
├── MovementController  # Horizontal movement logic
├── JumpController     # Jump mechanics and multi-jump
└── CollisionController # Collision detection and response
```

#### Level System (`modules/level/`)

```
LevelManager.js         # Level coordinator
├── LevelLoader        # Level data loading
├── GroundFactory      # Ground/platform creation
├── PlatformFactory    # Platform generation
├── CollectibleManager # Item collection
├── LevelCompletion    # Completion detection
└── LevelTransition    # Scene transitions
```

#### Effects System (`modules/effects/`)

```
ParticleManager.js     # Particle effects
├── CameraManager      # Camera shake, zoom, follow
└── ColorManager       # Color themes, accessibility
```

#### Enemy System (`modules/enemy/`)

```
EnemyController.js     # Enemy behavior and AI
```

### Barrel Exports (`src/features/`)

Clean import interfaces that hide implementation details.

```javascript
// features/core/index.js
export { AudioManager } from '../../core/AudioManager.js';
export { GameStateManager } from '../../core/GameStateManager.js';
// ... other core managers

// features/player/index.js
export { PlayerController } from '../../modules/player/PlayerController.js';
export { MovementController } from '../../modules/player/MovementController.js';
// ... other player components
```

## 🔄 Event-Driven Architecture

### Event Flow

```
User Input → InputManager → EventNames → Feature Controllers → Game State Changes
    ↑                                                              ↓
UI Updates ← UIManager ← EventNames ← Audio/Visual Effects ← State Changes
```

### Event Categories

1. **Input Events** (`input:*`)
    - `input:moveLeft`, `input:jump`, `input:pause`
    - Generated by InputManager from keyboard/gamepad

2. **Player Events** (`player:*`)
    - `player:spawn`, `player:jump`, `player:land`
    - Generated by PlayerController and sub-controllers

3. **Level Events** (`level:*`)
    - `level:load`, `level:complete`, `level:reset`
    - Generated by LevelManager and related systems

4. **Game Events** (`game:*`)
    - `game:init`, `game:start`, `game:pause`
    - Generated by core game systems

5. **UI Events** (`ui:*`)
    - `ui:update`, `ui:selectCharacter`
    - Generated by UI interactions

### Event System Implementation

```javascript
// Event emission
this.eventSystem.emit(EventNames.PLAYER_JUMP, {
    position: { x: player.x, y: player.y },
    jumpNumber: this.jumpsUsed,
    force: jumpForce,
});

// Event handling
this.eventSystem.on(EventNames.LEVEL_COMPLETE, (data) => {
    this.gameStateManager.saveProgress(data.levelId, data.collectibles);
    this.transitionToNextLevel(data.nextLevelId);
});
```

## 🏛️ Manager Patterns

### BaseManager Lifecycle

All core managers follow the singleton pattern with standardized lifecycle:

```javascript
export class ExampleManager extends BaseManager {
    constructor() {
        super(); // Singleton enforcement

        if (this.isInitialized()) {
            return; // Early return for singleton
        }

        this.initializeManager();
    }

    initializeManager() {
        // Setup logic here
        this.setupEventListeners();
        this.loadConfiguration();

        this._initialized = true; // Mark as ready
    }

    destroy() {
        // Cleanup resources
        this.removeEventListeners();
        this.clearTimers();

        super.destroy(); // Call parent cleanup
    }
}
```

### Manager Communication

Managers communicate through the event system to maintain loose coupling:

```javascript
// AudioManager listens for game events
this.eventSystem.on(EventNames.PLAYER_LAND, () => {
    this.playSFX('land');
});

// ParticleManager reacts to collectibles
this.eventSystem.on(EventNames.COLLECTIBLE_COLLECTED, (data) => {
    this.createParticles(data.position, 'sparkle');
});
```

## 🎮 Scene Architecture

### Scene Lifecycle

```
init(data) → preload() → create() → update(time, delta) → destroy()
    ↓            ↓           ↓             ↓                  ↓
  Setup      Load Assets  Initialize   Per-frame        Cleanup
  Data       for Scene    Objects      Updates          Resources
```

### Scene Dependencies

```javascript
export class GameScene extends Scene {
    constructor() {
        super(SceneKeys.GAME);

        // Manager references (initialized in create)
        this.eventSystem = null;
        this.physicsManager = null;
        this.levelManager = null;
        this.playerController = null;
    }

    create() {
        // Initialize managers in dependency order
        this.eventSystem = new EventSystem();
        this.physicsManager = new PhysicsManager(this, this.eventSystem);
        this.levelManager = new LevelManager(
            this,
            this.physicsManager.getWorld(),
            this.eventSystem
        );
        this.playerController = new PlayerController(
            this,
            this.physicsManager.getWorld(),
            this.eventSystem
        );

        // Set up inter-manager communication
        this.setupManagerCommunication();
    }
}
```

## 💾 Asset Management Architecture

Assets use a code generation pipeline to eliminate magic strings:

```
manifest.json → npm run generate-assets → Assets.js constants → Scene loading
```

**Key Constants**: `ImageAssets`, `ImagePaths`, `AudioAssets`, `AudioPaths`, `SpritesheetConfigs`

**Example Usage**:

```javascript
this.load.image(ImageAssets.PLAYER, ImagePaths.PLAYER);
this.load.audio(AudioAssets.JUMP_SFX, AudioPaths.JUMP_SFX);
```

See [ASSET_MANAGEMENT.md](../ASSET_MANAGEMENT.md) for complete workflow and guidelines.

## 🧩 Module Dependency Graph

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Scenes      │    │    Features     │    │   Constants     │
│                 │    │                 │    │                 │
│ Boot            │────│ @features/core  │────│ SceneKeys       │
│ Preloader       │    │ @features/player│    │ EventNames      │
│ Game            │    │ @features/level │    │ Assets          │
│ MainMenu        │    │ @features/effects│   │ UIConfig        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌─────────────────┴─────────────────┐
                │           Implementation          │
                │                                   │
                │ core/          modules/           │
                │ ├─BaseManager  ├─player/          │
                │ ├─EventBus     ├─level/           │
                │ ├─AudioManager ├─effects/         │
                │ └─...          └─enemy/           │
                └───────────────────────────────────┘
```

## 📈 Performance Considerations

### Singleton Pattern Benefits

- **Memory Efficiency** - Single instance of core managers
- **State Consistency** - Shared state across the application
- **Initialization Control** - Lazy loading and proper cleanup

### Event System Optimization

- **Efficient Dispatch** - Map-based event handling
- **Memory Management** - Automatic cleanup of listeners
- **Debug Mode** - Optional verbose logging for development

### Asset Loading Optimization

- **Centralized Loading** - All assets loaded in Preloader
- **Constant-Time Lookup** - Generated constants for fast access
- **Path Optimization** - Relative paths and asset bundling

## 🔧 Extension Points

### Adding New Features

1. **Create Module Directory** - `src/modules/newfeature/`
2. **Implement Controllers** - Following existing patterns
3. **Create Barrel Export** - `src/features/newfeature/index.js`
4. **Add Event Names** - Extend `EventNames.js`
5. **Add Assets** - Update `manifest.json` and regenerate
6. **Write Tests** - Follow existing test patterns
7. **Update Documentation** - This file and CONTRIBUTING.md

### Creating New Managers

```javascript
// src/core/NewManager.js
import { BaseManager } from './BaseManager.js';
import { EventNames } from '../constants/EventNames.js';

export class NewManager extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this._initialized = true;
    }

    setupEventListeners() {
        // Listen for relevant events
    }

    destroy() {
        // Cleanup
        super.destroy();
    }
}
```

## 📚 Design Patterns Used

1. **Singleton** - Core managers (AudioManager, GameStateManager)
2. **Observer** - Event system for loose coupling
3. **Factory** - GroundFactory, PlatformFactory for level creation
4. **Facade** - Barrel exports hide implementation complexity
5. **Strategy** - Different controllers for player behaviors
6. **Command** - Event-driven actions and state changes

---

This architecture provides a solid foundation for continued development while maintaining clean code organization and developer productivity.
