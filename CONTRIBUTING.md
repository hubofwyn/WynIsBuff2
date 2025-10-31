# Contributing to WynIsBuff2

Welcome to the WynIsBuff2 development guide! This document explains our project structure, conventions, and development workflow.

## Scope

This guide focuses on day-to-day contribution flow: environment setup, folder structure, patterns, testing, and asset workflow. It is not a full architecture deep dive or art pipeline specification.

- Use this when onboarding and contributing code
- For system design, see docs/ARCHITECTURE.md
- For asset pipeline details, see ASSET_MANAGEMENT.md

## 📋 Table of Contents

- [Project Architecture](#project-architecture)
- [Folder Structure](#folder-structure)
- [Development Guidelines](#development-guidelines)
- [Naming Conventions](#naming-conventions)
- [Asset Management](#asset-management)
- [Testing](#testing)
- [Getting Started](#getting-started)

## 🏗️ Project Architecture

WynIsBuff2 follows a **feature-based architecture** with **barrel exports** for clean imports and backwards compatibility during refactoring.

### Core Principles

1. **Feature-Based Organization** - Code is organized by domain (player, level, effects, etc.)
2. **Barrel Exports** - Use `@features/*` imports for clean, maintainable code
3. **Singleton Patterns** - Core managers extend `BaseManager` for lifecycle management
4. **Event-Driven** - Centralized event system for loose coupling
5. **Asset Constants** - No magic strings, all assets defined in manifest

## 📁 Folder Structure

```
src/
├── main.js                    # Entry point
├── constants/                 # Shared constants and configurations
│   ├── Assets.js             # 🔄 Auto-generated from manifest.json
│   ├── EventNames.js         # Centralized event constants
│   ├── SceneKeys.js          # Scene key constants
│   ├── LevelData.js          # Level configuration
│   ├── PhysicsConfig.js      # Physics settings
│   └── UIConfig.js           # UI styling constants
├── core/                     # 🏗️ Core infrastructure
│   ├── BaseManager.js        # Singleton base class
│   ├── BaseController.js     # Controller base class
│   ├── EventBus.js           # Environment-agnostic events
│   ├── AudioManager.js       # Audio system
│   ├── EventSystem.js        # Game event coordinator
│   ├── GameStateManager.js   # Save/load and settings
│   ├── InputManager.js       # Input handling
│   ├── PhysicsManager.js     # Rapier physics wrapper
│   └── UIManager.js          # UI management
├── features/                 # 🎯 Feature barrel exports
│   ├── core/index.js         # Re-exports from src/core/
│   ├── player/index.js       # Re-exports from src/modules/player/
│   ├── level/index.js        # Re-exports from src/modules/level/
│   ├── effects/index.js      # Re-exports from src/modules/effects/
│   └── enemy/index.js        # Re-exports from src/modules/enemy/
├── modules/                  # 🔧 Implementation details
│   ├── effects/              # Visual effect managers
│   ├── enemy/                # Enemy-related controllers
│   ├── level/                # Level system components
│   └── player/               # Player controller modules
└── scenes/                   # 🎮 Phaser scene implementations
    ├── Boot.js               # Initial asset loading
    ├── Preloader.js          # Main asset loading
    ├── WelcomeScene.js       # Title screen
    ├── CharacterSelect.js    # Character selection
    ├── MainMenu.js           # Main menu
    ├── Game.js               # Core gameplay
    ├── PauseScene.js         # Pause overlay
    ├── SettingsScene.js      # Settings menu
    └── GameOver.js           # Game completion
```

### Import Patterns

#### ✅ Preferred (New Code)

```javascript
// Use barrel exports for clean, maintainable imports
import { PlayerController } from '@features/player';
import { LevelManager } from '@features/level';
import { AudioManager, GameStateManager } from '@features/core';
import { ParticleManager, CameraManager } from '@features/effects';

// Constants
import { SceneKeys } from '../constants/SceneKeys.js';
import { EventNames } from '../constants/EventNames.js';
import { ImageAssets, AudioAssets } from '../constants/Assets.js';
```

#### ⚠️ Legacy (Avoid in New Code)

```javascript
// Direct module imports (being phased out)
import { PlayerController } from '../modules/player/PlayerController.js';
import { AudioManager } from '../modules/AudioManager.js';

// Magic strings (never use)
this.load.image('logo', 'images/ui/logo.png');
this.scene.start('MainMenu');
```

## 🛠️ Development Guidelines

### Manager Lifecycle

All core managers should extend `BaseManager`:

```javascript
import { BaseManager } from '../core/BaseManager.js';

export class MyManager extends BaseManager {
    constructor() {
        super(); // Ensures singleton pattern

        if (this.isInitialized()) {
            return; // Early return for singleton
        }

        // Initialize your manager
        this.init();
    }

    init() {
        // Setup logic here
        this._initialized = true; // Mark as initialized
    }

    destroy() {
        // Cleanup logic here
        super.destroy();
    }
}

// Usage
const manager = MyManager.getInstance();
```

### Event System

Use the centralized event system for loose coupling:

```javascript
import { EventNames } from '../constants/EventNames.js';

// Emitting events
this.eventSystem.emit(EventNames.PLAYER_JUMP, {
    position: { x: 100, y: 200 },
    force: 45,
});

// Listening for events
this.eventSystem.on(EventNames.LEVEL_COMPLETE, (data) => {
    console.log('Level completed:', data.levelId);
});
```

### Scene Structure

Scenes should follow this pattern:

```javascript
import { Scene } from 'phaser';
import { SceneKeys } from '../constants/SceneKeys.js';
import { AudioManager } from '@features/core';

export class MyScene extends Scene {
    constructor() {
        super(SceneKeys.MY_SCENE); // Use constants
    }

    init(data) {
        // Handle scene data
    }

    preload() {
        // Load scene-specific assets
    }

    create() {
        // Initialize scene objects
    }

    update(time, delta) {
        // Per-frame logic
    }
}
```

## 📝 Naming Conventions

### Files and Directories

- **PascalCase** for class files: `PlayerController.js`, `AudioManager.js`
- **camelCase** for directories: `src/modules/player/`
- **kebab-case** for assets: `player-sprite.png`, `jump-sound.mp3`

### Constants

- **SCREAMING_SNAKE_CASE** for constants: `SCENE_KEYS.MAIN_MENU`
- **camelCase** for object keys: `ImageAssets.playerSprite`

### Classes and Functions

- **PascalCase** for classes: `PlayerController`, `LevelManager`
- **camelCase** for functions and variables: `loadLevel()`, `playerPosition`

### Events

- **Namespaced** format: `'player:jump'`, `'level:complete'`, `'ui:click'`
- Use `EventNames` constants: `EventNames.PLAYER_JUMP`

## 🎨 Asset Management

### Adding New Assets

1. **Add to Manifest** - Update `assets/manifest.json`:

```json
{
    "assets": {
        "images": {
            "newSprite": {
                "type": "image",
                "path": "images/sprites/new-sprite.png",
                "description": "Description of the new sprite"
            }
        }
    }
}
```

2. **Regenerate Constants**:

```bash
bun run generate-assets
```

3. **Use in Code**:

```javascript
import { ImageAssets, ImagePaths } from '../constants/Assets.js';

// In preload
this.load.image(ImageAssets.NEW_SPRITE, ImagePaths.NEW_SPRITE);

// In create
this.add.image(100, 100, ImageAssets.NEW_SPRITE);
```

### Asset Organization

```
assets/
├── manifest.json             # Asset catalog
├── images/
│   ├── characters/          # Character sprites
│   ├── ui/                  # Interface elements
│   ├── backgrounds/         # Background images
│   └── tilesets/           # Level tiles
└── sounds/
    ├── music/              # Background music
    ├── sfx/                # Sound effects
    └── voice/              # Voice clips
```

## 🧪 Testing

### Running Tests

```bash
bun run test                # Run all tests
bun run generate-assets     # Regenerate asset constants
```

### Test Structure

```javascript
// tests/test-myfeature.cjs
const assert = require('assert');
const { MyManager } = require('../src/core/MyManager');

console.log('Running MyManager tests...');

// Test singleton pattern
const instance1 = MyManager.getInstance();
const instance2 = MyManager.getInstance();
assert.strictEqual(instance1, instance2, 'Should return same instance');

console.log('MyManager tests passed.');
```

### Testing Guidelines

- Test core managers for singleton behavior
- Test event emission and handling
- Verify asset loading with constants
- Test scene transitions and state management

## 🚀 Getting Started

### Development Setup

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Run tests
bun run test

# Regenerate asset constants
bun run generate-assets
```

### Making Your First Contribution

1. **Understand the Architecture** - Read this guide thoroughly
2. **Follow Conventions** - Use the patterns and naming shown above
3. **Use Constants** - Never use magic strings for assets, scenes, or events
4. **Test Your Changes** - Ensure tests pass before submitting
5. **Document New Features** - Update this guide if adding new patterns

### Code Style

- Use ES6+ features and modules
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Keep functions small and focused
- Comment complex logic
- Use meaningful variable names

### Commit Messages

Use conventional commit format:

```
feat: add new particle effect system
fix: resolve audio loading issue in Safari
docs: update asset management guide
refactor: migrate scenes to use SceneKeys
```

## 📚 Additional Resources

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Rapier Physics Documentation](https://rapier.rs/docs/)
- [Howler.js Audio Documentation](https://howlerjs.com/)

## 🤝 Getting Help

- Check existing documentation first
- Review similar implementations in the codebase
- Ask questions in team discussions
- Follow the established patterns

---

**Happy coding! 🎮✨**
