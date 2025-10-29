# Event System Implementation Guide

## Table of Contents
- [Overview](#overview)
- [Implementation Details](#implementation-details)
- [Usage Examples](#usage-examples)
- [Integration with Existing Modules](#integration-with-existing-modules)
- [Best Practices](#best-practices)
- [Testing Strategy](#testing-strategy)

## Overview

The Event System will serve as the foundation for inter-module communication in WynIsBuff2. It implements a simple publisher-subscriber (pub/sub) pattern that allows modules to communicate without direct references to each other, promoting loose coupling and better maintainability.

### Key Benefits
- **Decoupled Communication**: Modules can communicate without direct references
- **Extensibility**: New features can subscribe to existing events without modifying source code
- **Centralized Event Handling**: Single source of truth for game events
- **Improved Testability**: Easier to test modules in isolation

## Implementation Details

### EventSystem Class

```javascript
// src/modules/EventSystem.js
export class EventSystem {
    constructor() {
        // Map of event names to arrays of callback functions
        this.events = new Map();
        
        // Optional: track event history for debugging
        this.eventHistory = [];
        this.maxHistoryLength = 100;
        this.debugMode = false;
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - The event name
     * @param {Function} callback - The callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        this.events.get(event).push(callback);
        
        // Return an unsubscribe function
        return () => this.off(event, callback);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - The event name
     * @param {Function} callback - The callback function to remove
     */
    off(event, callback) {
        if (!this.events.has(event)) return;
        
        const callbacks = this.events.get(event);
        this.events.set(event, callbacks.filter(cb => cb !== callback));
        
        // Clean up empty event arrays
        if (this.events.get(event).length === 0) {
            this.events.delete(event);
        }
    }
    
    /**
     * Emit an event with data
     * @param {string} event - The event name
     * @param {any} data - The data to pass to callbacks
     */
    emit(event, data) {
        if (this.debugMode) {
            console.log(`[EventSystem] Event emitted: ${event}`, data);
            this.eventHistory.push({
                event,
                data,
                timestamp: Date.now()
            });
            
            // Trim history if needed
            if (this.eventHistory.length > this.maxHistoryLength) {
                this.eventHistory.shift();
            }
        }
        
        if (!this.events.has(event)) return;
        
        this.events.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[EventSystem] Error in event handler for ${event}:`, error);
            }
        });
    }
    
    /**
     * Subscribe to an event and automatically unsubscribe after it fires once
     * @param {string} event - The event name
     * @param {Function} callback - The callback function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        const onceCallback = (data) => {
            this.off(event, onceCallback);
            callback(data);
        };
        
        return this.on(event, onceCallback);
    }
    
    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether debug mode should be enabled
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    /**
     * Get event history (only available in debug mode)
     * @returns {Array} Event history
     */
    getEventHistory() {
        return [...this.eventHistory];
    }
    
    /**
     * Clear all event subscriptions
     */
    clear() {
        this.events.clear();
        this.eventHistory = [];
    }
}
```

### Standard Event Names

To maintain consistency, we'll define standard event names for common game events:

```javascript
// src/constants/EventNames.js
export const EventNames = {
    // Game state events
    GAME_INIT: 'game:init',
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_OVER: 'game:over',
    LEVEL_LOADED: 'level:loaded',
    LEVEL_COMPLETE: 'level:complete',
    
    // Player events
    PLAYER_SPAWN: 'player:spawn',
    PLAYER_MOVE: 'player:move',
    PLAYER_JUMP: 'player:jump',
    PLAYER_LAND: 'player:land',
    PLAYER_DAMAGE: 'player:damage',
    PLAYER_DEATH: 'player:death',
    PLAYER_RESPAWN: 'player:respawn',
    
    // Physics events
    COLLISION_START: 'collision:start',
    COLLISION_END: 'collision:end',
    
    // UI events
    SCORE_CHANGE: 'score:change',
    HEALTH_CHANGE: 'health:change',
    
    // Item events
    ITEM_COLLECT: 'item:collect',
    POWERUP_ACTIVATE: 'powerup:activate',
    POWERUP_DEACTIVATE: 'powerup:deactivate',
    
    // Audio events
    MUSIC_PLAY: 'music:play',
    MUSIC_STOP: 'music:stop',
    SOUND_PLAY: 'sound:play',
    
    // Input events
    INPUT_ACTION: 'input:action',
    
    // Custom event creator
    custom: (category, action) => `${category}:${action}`
};
```

## Usage Examples

### Basic Usage

```javascript
// Create an event system
const events = new EventSystem();

// Subscribe to an event
const unsubscribe = events.on('player:jump', (data) => {
    console.log('Player jumped!', data);
});

// Emit an event
events.emit('player:jump', { height: 10, position: { x: 100, y: 200 } });

// Unsubscribe when no longer needed
unsubscribe();

// Or unsubscribe using the off method
events.off('player:jump', myCallback);
```

### One-time Events

```javascript
// Subscribe to an event that will only fire once
events.once('level:complete', (data) => {
    console.log('Level completed!', data);
    // This callback will be automatically removed after execution
});
```

### Using with Phaser Scene

```javascript
class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.events = new EventSystem();
    }
    
    create() {
        // Make the event system available to all modules
        this.physicsManager = new PhysicsManager(this, this.events);
        this.levelManager = new LevelManager(this, this.physicsManager.getWorld(), this.events);
        this.playerController = new PlayerController(this, this.physicsManager.getWorld(), this.events);
        
        // Subscribe to events
        this.events.on(EventNames.PLAYER_JUMP, this.handlePlayerJump.bind(this));
        this.events.on(EventNames.LEVEL_COMPLETE, this.handleLevelComplete.bind(this));
    }
    
    handlePlayerJump(data) {
        // Handle player jump event
        console.log('Player jumped with data:', data);
    }
    
    handleLevelComplete(data) {
        // Handle level complete event
        console.log('Level completed with data:', data);
        this.scene.start('LevelComplete', data);
    }
}
```

## Integration with Existing Modules

### PhysicsManager Integration

```javascript
export class PhysicsManager {
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.events = eventSystem;
        this.world = null;
        this.initialized = false;
        this.bodyToSprite = new Map();
    }
    
    async initialize(gravityX = 0.0, gravityY = 20.0) {
        try {
            await RAPIER.init();
            this.world = new RAPIER.World(new RAPIER.Vector2(gravityX, gravityY));
            this.initialized = true;
            
            // Emit initialization event
            this.events.emit(EventNames.GAME_INIT, { 
                module: 'physics',
                gravity: { x: gravityX, y: gravityY }
            });
            
            return true;
        } catch (error) {
            console.error('[PhysicsManager] Error initializing physics:', error);
            return false;
        }
    }
    
    update() {
        if (!this.initialized || !this.world) return;
        
        try {
            // Step the physics world
            this.world.step();
            
            // Update all sprites based on their physics bodies
            this.updateGameObjects();
        } catch (error) {
            console.error('[PhysicsManager] Error in update:', error);
        }
    }
    
    // Add collision event handling
    setupCollisionEvents() {
        // This would require Rapier's collision event system
        // For example purposes only - actual implementation would depend on Rapier's API
        this.world.onCollisionStart((body1, body2) => {
            this.events.emit(EventNames.COLLISION_START, {
                bodyA: body1,
                bodyB: body2
            });
        });
        
        this.world.onCollisionEnd((body1, body2) => {
            this.events.emit(EventNames.COLLISION_END, {
                bodyA: body1,
                bodyB: body2
            });
        });
    }
}
```

### PlayerController Integration

```javascript
export class PlayerController {
    constructor(scene, world, eventSystem, x = 512, y = 300) {
        this.scene = scene;
        this.world = world;
        this.events = eventSystem;
        
        // Player state
        this.body = null;
        this.sprite = null;
        this.collider = null;
        this.isOnGround = false;
        this.jumpsUsed = 0;
        this.maxJumps = 3;
        
        // Create the player at the specified position
        this.create(x, y);
        
        // Set up input handlers
        this.setupControls();
        
        // Subscribe to relevant events
        this.subscribeToEvents();
    }
    
    subscribeToEvents() {
        // Listen for collision events that might affect the player
        this.events.on(EventNames.COLLISION_START, (data) => {
            // Check if this collision involves the player
            if (data.bodyA === this.body || data.bodyB === this.body) {
                // Handle player collision
                this.handleCollision(data);
            }
        });
    }
    
    handleJumping(jumpText) {
        // Existing jumping logic...
        
        if (jumpPressed) {
            if (this.isOnGround || this.jumpsUsed < this.maxJumps) {
                // Existing jump implementation...
                
                // Emit jump event
                this.events.emit(EventNames.PLAYER_JUMP, {
                    jumpsUsed: this.jumpsUsed,
                    maxJumps: this.maxJumps,
                    position: {
                        x: this.body.translation().x,
                        y: this.body.translation().y
                    },
                    velocity: {
                        x: this.body.linvel().x,
                        y: this.body.linvel().y
                    }
                });
            }
        }
    }
    
    handleCollision(data) {
        // Handle collision logic
        // For example, detect landing on ground
        const otherBody = data.bodyA === this.body ? data.bodyB : data.bodyA;
        
        // Check if this is a landing collision
        if (!this.isOnGround && this.body.linvel().y > 0) {
            const playerPos = this.body.translation();
            const otherPos = otherBody.translation();
            
            // If player is above the other body, this might be a landing
            if (playerPos.y < otherPos.y) {
                this.events.emit(EventNames.PLAYER_LAND, {
                    velocity: this.body.linvel().y,
                    position: {
                        x: playerPos.x,
                        y: playerPos.y
                    }
                });
            }
        }
    }
}
```

### LevelManager Integration

```javascript
export class LevelManager {
    constructor(scene, world, eventSystem) {
        this.scene = scene;
        this.world = world;
        this.events = eventSystem;
        this.platforms = [];
        this.ground = null;
        this.bodyToSprite = new Map();
    }
    
    loadLevel(levelData) {
        // Clear existing level elements
        this.clearLevel();
        
        // Create platforms from level data
        if (levelData.platforms) {
            this.createPlatforms(levelData.platforms);
        }
        
        // Create ground from level data
        if (levelData.ground) {
            this.createGround(
                levelData.ground.width,
                levelData.ground.height,
                levelData.ground.y
            );
        }
        
        // Emit level loaded event
        this.events.emit(EventNames.LEVEL_LOADED, {
            levelId: levelData.id,
            platforms: this.platforms.length,
            items: levelData.items ? levelData.items.length : 0
        });
    }
    
    checkLevelCompletion() {
        // Example logic to check if level is complete
        // This would be called periodically or in response to certain events
        
        if (this.isLevelComplete()) {
            this.events.emit(EventNames.LEVEL_COMPLETE, {
                levelId: this.currentLevelId,
                timeElapsed: this.scene.time.now - this.levelStartTime,
                score: this.calculateScore()
            });
        }
    }
}
```

## Best Practices

### Event Naming Conventions

1. **Use Namespaces**: Group related events with namespaces (e.g., `player:jump`, `level:complete`)
2. **Be Specific**: Use clear, specific event names that describe what happened
3. **Consistency**: Maintain consistent naming patterns across the codebase
4. **Use Constants**: Define event names as constants to prevent typos and enable IDE auto-completion

### Event Data Structure

1. **Include Context**: Always include relevant context in event data
2. **Standardize Format**: Use consistent data structures for similar events
3. **Avoid Circular References**: Ensure event data can be safely serialized
4. **Be Selective**: Only include necessary data to avoid performance issues

### Performance Considerations

1. **Limit Subscribers**: Too many subscribers to a single event can impact performance
2. **Clean Up**: Always unsubscribe from events when components are destroyed
3. **Debounce Frequent Events**: For high-frequency events (like movement), consider debouncing
4. **Avoid Heavy Processing**: Keep event handlers lightweight; defer heavy processing

### Debugging

1. **Enable Debug Mode**: Use `setDebugMode(true)` during development
2. **Monitor Event Flow**: Review event history to understand the sequence of events
3. **Add Logging**: Add strategic logging in event handlers for important events
4. **Handle Errors**: Always wrap event handler code in try-catch blocks

## Testing Strategy

### Unit Testing

```javascript
// Example Jest test for EventSystem
describe('EventSystem', () => {
    let eventSystem;
    
    beforeEach(() => {
        eventSystem = new EventSystem();
    });
    
    test('should subscribe to events', () => {
        const mockCallback = jest.fn();
        eventSystem.on('test', mockCallback);
        
        eventSystem.emit('test', { value: 42 });
        
        expect(mockCallback).toHaveBeenCalledWith({ value: 42 });
    });
    
    test('should unsubscribe from events', () => {
        const mockCallback = jest.fn();
        const unsubscribe = eventSystem.on('test', mockCallback);
        
        unsubscribe();
        eventSystem.emit('test', { value: 42 });
        
        expect(mockCallback).not.toHaveBeenCalled();
    });
    
    test('should handle once events', () => {
        const mockCallback = jest.fn();
        eventSystem.once('test', mockCallback);
        
        eventSystem.emit('test', { value: 1 });
        eventSystem.emit('test', { value: 2 });
        
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith({ value: 1 });
    });
});
```

### Integration Testing

Test how modules interact through the event system:

```javascript
describe('Module Integration', () => {
    let eventSystem, physicsManager, playerController;
    
    beforeEach(() => {
        eventSystem = new EventSystem();
        physicsManager = new PhysicsManager(mockScene, eventSystem);
        playerController = new PlayerController(mockScene, mockWorld, eventSystem);
    });
    
    test('player jump should trigger physics update', () => {
        const spyPhysicsUpdate = jest.spyOn(physicsManager, 'update');
        
        // Simulate player jump
        eventSystem.emit(EventNames.PLAYER_JUMP, { height: 10 });
        
        expect(spyPhysicsUpdate).toHaveBeenCalled();
    });
});
```

By implementing this Event System, we establish a solid foundation for module communication in WynIsBuff2, enabling more flexible, maintainable, and testable code as the project grows.