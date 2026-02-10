# Module Files Rules

**Applies to:** `src/modules/**/*.js`

## Module-Specific Requirements

### 1. NO Direct Vendor Imports

Modules MUST NOT import vendor libraries directly:

```javascript
// ❌ WRONG - Never in modules
import { Scene } from 'phaser';
import RAPIER from '@dimforge/rapier2d-compat';
import { Howl } from 'howler';

// ✅ CORRECT - Use abstractions from @features/core
import { BaseScene, PhysicsTypes } from '@features/core';
import { AudioManager } from '@features/core';
```

### 2. Manager Pattern

If creating a manager, MUST extend BaseManager:

```javascript
import { BaseManager } from '@features/core';

export class MyManager extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }

    init() {
        // Initialization logic
        this.setInitialized();
    }
    
    // Singleton accessor
    static getInstance() {
        if (!MyManager.instance) {
            MyManager.instance = new MyManager();
        }
        return MyManager.instance;
    }
}
```

### 3. Event Communication

Use EventBus for cross-module communication:

```javascript
import { EventBus } from '@features/core';
import { EventNames } from '../constants/EventNames.js';

class PlayerController {
    jump() {
        // Perform jump logic
        
        // Emit event
        EventBus.getInstance().emit(EventNames.PLAYER_JUMP, {
            height: this.jumpHeight,
            position: this.position
        });
    }
}
```

### 4. Structured Logging

```javascript
import { LOG } from '@observability';

class PlayerController {
    spawn(x, y) {
        LOG.info('PLAYER_SPAWN', {
            subsystem: 'player',
            message: 'Player spawned',
            position: { x, y }
        });
    }
    
    handleError(error) {
        LOG.error('PLAYER_ERROR', {
            subsystem: 'player',
            error,
            message: 'Player controller error',
            hint: 'Check player state and physics body'
        });
    }
}
```

### 5. Constants Usage

ALWAYS use generated constants:

```javascript
import { ImageAssets, AudioAssets } from '../constants/Assets.js';
import { EventNames } from '../constants/EventNames.js';

// ✅ CORRECT
this.sprite = scene.add.sprite(x, y, ImageAssets.PLAYER);
this.eventBus.emit(EventNames.PLAYER_JUMP);

// ❌ WRONG
this.sprite = scene.add.sprite(x, y, 'player');
this.eventBus.emit('player:jump');
```

### 6. Module Organization

Each module should have:

- Clear single responsibility
- Minimal dependencies on other modules
- Communication via events, not direct coupling
- Proper cleanup methods

### 7. Physics Integration

Use PhysicsManager for all physics operations:

```javascript
import { PhysicsManager, PhysicsTypes } from '@features/core';

class PlayerController {
    createPhysicsBody(x, y) {
        const physicsManager = PhysicsManager.getInstance();
        
        // Create rigid body
        const bodyDesc = PhysicsTypes.RigidBodyDesc.dynamic()
            .setTranslation(x, y);
        this.rigidBody = physicsManager.createRigidBody(bodyDesc);
        
        // Create collider
        const colliderDesc = PhysicsTypes.ColliderDesc.cuboid(16, 32);
        this.collider = physicsManager.createCollider(colliderDesc, this.rigidBody);
    }
}
```

### 8. Audio Integration

Use AudioManager for all audio operations:

```javascript
import { AudioManager } from '@features/core';
import { AudioAssets } from '../constants/Assets.js';

class PlayerController {
    playJumpSound() {
        const audioManager = AudioManager.getInstance();
        audioManager.play(AudioAssets.JUMP, {
            volume: 0.5,
            rate: 1.0
        });
    }
}
```

## Module Categories

### Player Module

- PlayerController - Main player logic
- PlayerMovement - Movement mechanics
- PlayerAnimation - Animation state machine

### Level Module

- LevelManager - Level loading and management
- LevelLoader - Asset and data loading
- Platform - Platform entities

### Effects Module

- ParticleManager - Particle effects
- ScreenShake - Camera shake effects
- ColorTransition - Color transition effects

### Enemy Module

- EnemyController - Enemy AI and behavior
- EnemySpawner - Enemy spawning logic

## Testing Modules

- Write unit tests in `tests/` (CommonJS .cjs format)
- Test singleton behavior
- Test event emission and handling
- Mock dependencies when needed
