# Scene Files Rules

**Applies to:** `src/scenes/**/*.js`

## Scene-Specific Requirements

### 1. MUST Extend BaseScene (Not Phaser.Scene)

```javascript
// ✅ CORRECT
import { BaseScene } from '@features/core';
import { SceneKeys } from '../constants/SceneKeys.js';

export class GameScene extends BaseScene {
    constructor() {
        super(SceneKeys.GAME);
    }
}

// ❌ WRONG - Never import Phaser directly
import { Scene } from 'phaser';
export class GameScene extends Scene { }
```

### 2. Scene Key Usage

- ALWAYS use `SceneKeys.*` constants
- Pass to `super()` in constructor
- Use for scene transitions: `this.scene.start(SceneKeys.MAIN_MENU)`

### 3. Asset Loading

```javascript
preload() {
    // ✅ CORRECT - Use constants
    this.load.image(ImageAssets.PLAYER, ImagePaths.PLAYER);
    this.load.audio(AudioAssets.JUMP, AudioPaths.JUMP);
    
    // ❌ WRONG - No magic strings
    this.load.image('player', 'sprites/player.png');
}
```

### 4. Event Emission

Scenes should emit events for major state changes:

```javascript
create() {
    // Emit scene ready event
    this.eventSystem.emit(EventNames.SCENE_READY, { 
        scene: SceneKeys.GAME 
    });
}
```

### 5. Cleanup

ALWAYS clean up in shutdown:

```javascript
shutdown() {
    // Remove event listeners
    this.eventSystem.off(EventNames.PLAYER_JUMP, this.handleJump);
    
    // Clean up physics bodies
    // Clean up timers
    // Clean up tweens
}
```

### 6. Structured Logging

```javascript
import { LOG } from '@observability';

create() {
    LOG.info('SCENE_CREATE', {
        subsystem: 'scene',
        scene: SceneKeys.GAME,
        message: 'Scene created successfully'
    });
}
```

## Common Scene Patterns

### Preloader Scene
- Load all assets using constants
- Show loading progress
- Transition to MainMenu when complete

### Game Scene
- Initialize physics via PhysicsManager
- Create player via PlayerController
- Set up level via LevelManager
- Handle game loop and state

### MainMenu Scene
- Simple UI with buttons
- Scene transitions to Game or BirthdayMinigame
- Background effects

## Testing Scenes

Test across all scenes when making changes:
- Boot
- Preloader
- MainMenu
- Game
- BirthdayMinigame
