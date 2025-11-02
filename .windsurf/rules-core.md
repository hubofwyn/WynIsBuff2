# Core Files Rules

**Applies to:** `src/core/**/*.js`

## Core Module Responsibilities

The `src/core/` directory is the ONLY place where:
1. Vendor libraries can be imported directly
2. Vendor abstractions are created
3. Framework-specific code lives

## Critical Rules

### 1. Vendor Import Boundary

```javascript
// ✅ CORRECT - Only in src/core/
import Phaser from 'phaser';
import RAPIER from '@dimforge/rapier2d-compat';
import { Howl, Howler } from 'howler';

// Core files export abstractions
export { BaseScene } from './BaseScene.js';
export { PhysicsTypes } from './PhysicsTypes.js';
```

### 2. Abstraction Layer Pattern

Core files should provide clean abstractions:

```javascript
// BaseScene.js - Wraps Phaser.Scene
import Phaser from 'phaser';
import { LOG } from '@observability';

export class BaseScene extends Phaser.Scene {
    constructor(key) {
        super(key);
        this.eventSystem = null;
    }
    
    init() {
        LOG.dev('SCENE_INIT', {
            subsystem: 'scene',
            scene: this.scene.key,
            message: 'Scene initializing'
        });
    }
}
```

### 3. PhysicsTypes Abstraction

Expose all Rapier types through a single export:

```javascript
// PhysicsTypes.js
import RAPIER from '@dimforge/rapier2d-compat';

export const PhysicsTypes = {
    // Core types
    Vector2: RAPIER.Vector2,
    RigidBodyDesc: RAPIER.RigidBodyDesc,
    ColliderDesc: RAPIER.ColliderDesc,
    
    // Helper functions
    createVector2: (x, y) => new RAPIER.Vector2(x, y),
    // ... more helpers
};
```

### 4. Manager Implementation

Core managers MUST extend BaseManager:

```javascript
import { BaseManager } from './BaseManager.js';
import { LOG } from '@observability';

export class PhysicsManager extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.world = null;
        this.init();
    }

    async init() {
        try {
            await RAPIER.init();
            const gravity = new RAPIER.Vector2(0.0, 9.81);
            this.world = new RAPIER.World(gravity);
            
            this.setInitialized();
            
            LOG.info('PHYSICS_INIT', {
                subsystem: 'physics',
                message: 'Physics world initialized',
                gravity: { x: 0, y: 9.81 }
            });
        } catch (error) {
            LOG.error('PHYSICS_INIT_ERROR', {
                subsystem: 'physics',
                error,
                message: 'Failed to initialize physics world'
            });
        }
    }
    
    static getInstance() {
        if (!PhysicsManager.instance) {
            PhysicsManager.instance = new PhysicsManager();
        }
        return PhysicsManager.instance;
    }
}
```

### 5. EventBus Implementation

Centralized event system:

```javascript
export class EventBus extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.events = new Map();
        this.init();
    }

    init() {
        this.setInitialized();
    }

    on(eventName, callback, context) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push({ callback, context });
    }

    emit(eventName, data) {
        const listeners = this.events.get(eventName);
        if (listeners) {
            listeners.forEach(({ callback, context }) => {
                callback.call(context, data);
            });
        }
    }

    off(eventName, callback) {
        const listeners = this.events.get(eventName);
        if (listeners) {
            const index = listeners.findIndex(l => l.callback === callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
}
```

### 6. AudioManager Implementation

Wraps Howler.js:

```javascript
import { Howl, Howler } from 'howler';
import { BaseManager } from './BaseManager.js';
import { LOG } from '@observability';

export class AudioManager extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.sounds = new Map();
        this.init();
    }

    init() {
        Howler.volume(1.0);
        this.setInitialized();
    }

    load(key, path) {
        const sound = new Howl({
            src: [path],
            preload: true
        });
        this.sounds.set(key, sound);
    }

    play(key, options = {}) {
        const sound = this.sounds.get(key);
        if (sound) {
            return sound.play();
        }
        LOG.warn('AUDIO_NOT_FOUND', {
            subsystem: 'audio',
            key,
            message: 'Audio asset not found'
        });
    }
}
```

### 7. Structured Logging

All core modules MUST use structured logging:

```javascript
import { LOG } from '@observability';

// Log initialization
LOG.info('MANAGER_INIT', {
    subsystem: 'core',
    manager: 'PhysicsManager',
    message: 'Manager initialized'
});

// Log errors with context
LOG.error('MANAGER_ERROR', {
    subsystem: 'core',
    manager: 'PhysicsManager',
    error,
    message: 'Manager operation failed',
    hint: 'Check initialization state'
});
```

## Core Exports

Core should export via barrel file:

```javascript
// src/features/core/index.js
export { BaseManager } from '../../core/BaseManager.js';
export { BaseScene } from '../../core/BaseScene.js';
export { EventBus } from '../../core/EventBus.js';
export { PhysicsManager } from '../../core/PhysicsManager.js';
export { AudioManager } from '../../core/AudioManager.js';
export { PhysicsTypes } from '../../core/PhysicsTypes.js';
```

## Testing Core

- Test singleton behavior thoroughly
- Test initialization and cleanup
- Test error handling
- Mock vendor libraries when needed
- Verify abstraction layer completeness

## Documentation

Core modules should be well-documented:
- Purpose and responsibilities
- Public API surface
- Usage examples
- Integration points
