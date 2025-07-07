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
- **Rapier 0.14.0**: 2D physics engine (accessed via PhysicsManager)
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