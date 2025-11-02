# Windsurf Quick Reference

## Critical Rules (Never Violate)

### ✅ DO

```javascript
// Use barrel exports
import { PlayerController } from '@features/player';
import { BaseScene, PhysicsTypes } from '@features/core';

// Use constants
import { SceneKeys } from '../constants/SceneKeys.js';
import { EventNames } from '../constants/EventNames.js';
import { ImageAssets, AudioAssets } from '../constants/Assets.js';

// Use structured logging
import { LOG } from '@observability';
LOG.info('PLAYER_SPAWN', { subsystem: 'player', message: '...' });

// Extend BaseScene
export class GameScene extends BaseScene {
    constructor() {
        super(SceneKeys.GAME);
    }
}

// Use EventBus
this.eventSystem.emit(EventNames.PLAYER_JUMP, { height: 100 });
```

### ❌ DON'T

```javascript
// NO direct module imports
import { PlayerController } from '../modules/player/PlayerController.js';

// NO vendor imports (except in src/core/)
import { Scene } from 'phaser';
import RAPIER from '@dimforge/rapier2d-compat';

// NO magic strings
this.load.image('player', 'sprites/player.png');
this.scene.start('MainMenu');
this.eventBus.emit('player:jump');

// NO console logging
console.log('Player spawned');
console.error('Error:', error);
```

## Common Commands

```bash
# Development
bun run dev                 # Start dev server
bun run build               # Production build

# Assets
bun run generate-assets     # After editing manifest.json
bun run validate-assets     # Check asset integrity

# Quality
bun run test                # Run tests
bun run lint                # Lint code
bun run arch:health         # Check architecture

# Before Commit
bun run lint && bun run test && bun run arch:health
```

## Asset Workflow

1. Add file to `/assets/` subdirectory
2. Edit `/assets/manifest.json`
3. Run `bun run generate-assets`
4. Use via constants: `ImageAssets.MY_ASSET`

## Adding Events

1. Add to `src/constants/EventNames.js`:
   ```javascript
   PLAYER_JUMP: 'player:jump',
   ```
2. Use in code:
   ```javascript
   this.eventSystem.emit(EventNames.PLAYER_JUMP, data);
   ```

## Adding Scenes

1. Add to `src/constants/SceneKeys.js`:
   ```javascript
   MY_SCENE: 'MyScene',
   ```
2. Create scene extending `BaseScene`
3. Use key: `super(SceneKeys.MY_SCENE)`

## Log Levels

- `LOG.dev()` - Development/verbose
- `LOG.info()` - Important state changes
- `LOG.warn()` - Unexpected but handled
- `LOG.error()` - Failures
- `LOG.fatal()` - Critical failures

## File Patterns

- `src/scenes/**/*.js` → Use BaseScene, SceneKeys, cleanup
- `src/modules/**/*.js` → No vendor imports, use @features/core
- `src/core/**/*.js` → Only place for vendor imports
- `src/constants/**/*.js` → Assets.js auto-generated, others manual

## Manager Pattern

```javascript
export class MyManager extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }

    init() {
        // Initialize
        this.setInitialized();
    }
    
    static getInstance() {
        if (!MyManager.instance) {
            MyManager.instance = new MyManager();
        }
        return MyManager.instance;
    }
}
```

## Debugging

```javascript
// Browser console
window.debugAPI.getSummary();
window.debugAPI.getRecentLogs(60000);
window.debugAPI.analyzeSubsystem('physics');
```

## Documentation

- Architecture: `CLAUDE.md`
- Agents: `AGENTS.md`
- Contributing: `CONTRIBUTING.md`
- Windsurf: `.windsurf/README.md`
