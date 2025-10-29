# Event System Implementation Steps

## Overview

This document provides step-by-step instructions for implementing the Event System, which is the highest priority architectural improvement for the WynIsBuff2 MVP. The Event System enables decoupled communication between modules, making the code more maintainable and extensible.

## Implementation Steps

### Step 1: Create the Event System Module

Create a new file `src/modules/EventSystem.js`:

```javascript
export class EventSystem {
    constructor() {
        this.events = new Map();
        this.debugMode = false;
    }
    
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        if (!this.events.has(event)) return;
        const callbacks = this.events.get(event);
        this.events.set(event, callbacks.filter(cb => cb !== callback));
        if (this.events.get(event).length === 0) {
            this.events.delete(event);
        }
    }
    
    emit(event, data) {
        if (this.debugMode) {
            console.log(`[EventSystem] Event emitted: ${event}`, data);
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
    
    once(event, callback) {
        const onceCallback = (data) => {
            this.off(event, onceCallback);
            callback(data);
        };
        return this.on(event, onceCallback);
    }
    
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}
```

### Step 2: Define Standard Event Names

Create a new file `src/constants/EventNames.js`:

```javascript
export const EventNames = {
    // Game state events
    GAME_INIT: 'game:init',
    GAME_START: 'game:start',
    LEVEL_COMPLETE: 'level:complete',
    
    // Player events
    PLAYER_SPAWN: 'player:spawn',
    PLAYER_JUMP: 'player:jump',
    PLAYER_LAND: 'player:land',
    PLAYER_MOVE: 'player:move',
    
    // Physics events
    COLLISION_START: 'physics:collisionStart',
    
    // UI events
    UI_UPDATE: 'ui:update',
    
    // Audio events
    PLAY_SOUND: 'audio:playSound',
    
    // Helper function for custom events
    custom: (category, action) => `${category}:${action}`
};
```

### Step 3: Update Game Scene

Modify `src/scenes/Game.js` to use the Event System:

1. Import the Event System and EventNames:
```javascript
import { EventSystem } from '../modules/EventSystem';
import { EventNames } from '../constants/EventNames';
```

2. Add an eventSystem property to the Game class:
```javascript
constructor() {
    super('Game');
    this.eventSystem = null;
    // ... existing code
}
```

3. Initialize the Event System in the create method:
```javascript
async create() {
    try {
        // Initialize event system
        this.eventSystem = new EventSystem();
        this.eventSystem.setDebugMode(true);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // ... existing code
        
        // Pass eventSystem to managers
        this.physicsManager = new PhysicsManager(this, this.eventSystem);
        // ... existing code
        this.levelManager = new LevelManager(this, this.physicsManager.getWorld(), this.eventSystem);
        // ... existing code
        this.playerController = new PlayerController(
            this,
            this.physicsManager.getWorld(),
            this.eventSystem,
            512, 300
        );
        
        // ... existing code
        
        // Emit game init event
        this.eventSystem.emit(EventNames.GAME_INIT, { scene: 'Game' });
    } catch (error) {
        // ... existing error handling
    }
}
```

4. Add a setupEventListeners method:
```javascript
setupEventListeners() {
    // Listen for player jump events to update UI
    this.eventSystem.on(EventNames.PLAYER_JUMP, (data) => {
        if (this.jumpText) {
            this.jumpText.setText(`Jumps Used: ${data.jumpsUsed} / ${data.maxJumps}`);
        }
    });
    
    // Listen for player land events
    this.eventSystem.on(EventNames.PLAYER_LAND, (data) => {
        // Could add screen shake or other effects here
    });
}
```

### Step 4: Update PhysicsManager

Modify `src/modules/PhysicsManager.js`:

1. Import EventNames:
```javascript
import { EventNames } from '../constants/EventNames';
```

2. Update the constructor to accept the Event System:
```javascript
constructor(scene, eventSystem) {
    this.scene = scene;
    this.eventSystem = eventSystem;
    // ... existing code
}
```

3. Emit events in the initialize method:
```javascript
async initialize(gravityX = 0.0, gravityY = 20.0) {
    try {
        // ... existing code
        
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.GAME_INIT, { 
                module: 'physics',
                gravity: { x: gravityX, y: gravityY }
            });
        }
        
        return true;
    } catch (error) {
        // ... existing error handling
    }
}
```

### Step 5: Update PlayerController

Modify `src/modules/PlayerController.js`:

1. Import EventNames:
```javascript
import { EventNames } from '../constants/EventNames';
```

2. Update the constructor to accept the Event System:
```javascript
constructor(scene, world, eventSystem, x = 512, y = 300) {
    this.scene = scene;
    this.world = world;
    this.eventSystem = eventSystem;
    // ... existing code
    
    // Emit player spawn event
    if (this.eventSystem) {
        this.eventSystem.emit(EventNames.PLAYER_SPAWN, {
            position: { x, y },
            maxJumps: this.maxJumps
        });
    }
}
```

3. Emit jump events in the handleJumping method:
```javascript
handleJumping(jumpText) {
    try {
        // ... existing code
        
        if (jumpPressed) {
            if (this.isOnGround || this.jumpsUsed < this.maxJumps) {
                // ... existing jump code
                
                // Emit jump event
                if (this.eventSystem) {
                    this.eventSystem.emit(EventNames.PLAYER_JUMP, {
                        jumpsUsed: this.jumpsUsed,
                        maxJumps: this.maxJumps,
                        position: {
                            x: this.body.translation().x,
                            y: this.body.translation().y
                        },
                        velocity: {
                            x: jumpBoostX,
                            y: jumpForce
                        },
                        jumpNumber: this.jumpsUsed
                    });
                }
                
                // ... existing code
            }
        }
        
        // ... existing code
    } catch (error) {
        // ... existing error handling
    }
}
```

4. Emit land events in the processCollisions method:
```javascript
processCollisions(platforms) {
    try {
        // Store previous ground state
        const wasOnGround = this.isOnGround;
        
        // ... existing collision detection code
        
        // Emit land event if just landed
        if (!wasOnGround && this.isOnGround && this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_LAND, {
                position: {
                    x: playerPos.x,
                    y: playerPos.y
                },
                velocity: {
                    x: playerVel.x,
                    y: playerVel.y
                }
            });
        }
        
        // ... existing code
    } catch (error) {
        // ... existing error handling
    }
}
```

### Step 6: Testing and Verification

1. Run the game and check the console for event logs (with debug mode enabled)
2. Verify that jumping updates the jump counter text via events
3. Confirm that player landing events are emitted correctly
4. Test that the game initialization event is emitted

## Next Steps

After implementing the Event System and UI Manager, proceed with:

1. ✅ Creating the Basic UI Manager (Completed)
2. Refining the triple jump mechanics (Current Priority)
3. Implementing level designs that showcase the mechanics

These steps align with the Revised MVP Implementation Plan, focusing on delivering the core gameplay experience with minimal architectural overhead. For a complete overview of implementation progress, refer to the [Implementation Progress Tracker](../archive/aiprojectdocs-historical/ImplementationProgress.md).
