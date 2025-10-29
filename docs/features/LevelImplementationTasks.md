# Level Implementation Tasks for Phaser Coder

## Overview

This document outlines the remaining tasks to complete Phase 2.2 (Level Implementation) using the newly created modular level system architecture. The architectural foundation has been established, but the integration with the Game scene and testing of the levels still needs to be completed.

## Task List

### 1. Update Game Scene to Use Modular Level System

- [ ] Modify the Game.js scene to use the new LevelManager facade
- [ ] Update the create method to load a specific level instead of creating default platforms
- [ ] Update the update method to pass delta to the LevelManager's update method
- [ ] Register collision handlers for collectibles and level completion triggers
- [ ] Add UI elements for level information (name, collectibles count, etc.)

```javascript
// Example Game.js update
// In create method
this.levelManager = new LevelManager(this, this.physicsManager.getWorld(), this.eventSystem);
this.levelManager.loadLevel('level1'); // Load the first level

// Register level body-sprite mappings with physics manager
this.physicsManager.registerBodySpriteMap(this.levelManager.getBodyToSpriteMap());

// In update method
update(time, delta) {
    // Only proceed if physics is initialized
    if (!this.physicsManager || !this.physicsManager.isInitialized()) {
        return;
    }
    
    try {
        // Update physics (steps the world and updates sprites)
        this.physicsManager.update();
        
        // Update level elements with delta time
        if (this.levelManager) {
            this.levelManager.update(delta);
        }
        
        // Update player
        if (this.playerController) {
            this.playerController.update();
        }
    } catch (error) {
        console.error('[Game] Error in update:', error);
    }
}
```

### 2. Implement Collectible Interactions

- [ ] Update the PhysicsManager to detect collisions with collectibles
- [ ] Connect the CollectibleManager's handleCollectibleCollision method to collision events
- [ ] Implement visual and audio feedback when collecting items
- [ ] Update UI to show collectible count

```javascript
// Example collision handling in PhysicsManager
this.world.contactPairEvents.on('begin', (event) => {
    // Extract the body handles from the event
    const bodyHandleA = event.collider1.parent().handle;
    const bodyHandleB = event.collider2.parent().handle;
    
    // Emit collision event
    if (this.eventSystem) {
        this.eventSystem.emit(EventNames.COLLISION_START, {
            bodyHandleA,
            bodyHandleB
        });
    }
});
```

### 3. Implement Level Completion and Transitions

- [ ] Connect the LevelCompletionManager's handleTriggerCollision method to collision events
- [ ] Implement level completion UI (success message, stats, etc.)
- [ ] Test level transitions between all 5 levels
- [ ] Add game completion screen after the final level

```javascript
// Example level completion handling in Game.js
this.eventSystem.on(EventNames.LEVEL_COMPLETE, (data) => {
    console.log(`Level ${data.levelId} completed!`);
    
    // Show completion UI
    this.uiManager.showLevelCompleteUI({
        levelName: data.name,
        collectiblesCollected: data.collectiblesCollected,
        totalCollectibles: data.totalCollectibles
    });
});
```

### 4. Test and Refine the 5 Levels

- [ ] Test each level for proper difficulty progression
- [ ] Ensure collectibles are placed in interesting and challenging locations
- [ ] Verify that moving platforms work correctly
- [ ] Adjust level designs based on playtesting feedback

### 5. Add Level Selection UI (Optional)

- [ ] Create a level selection screen
- [ ] Show locked/unlocked status for each level
- [ ] Display completion status (collectibles collected, etc.)
- [ ] Allow players to replay completed levels

```javascript
// Example level selection in MainMenu.js
createLevelButtons() {
    const levels = [
        { id: 'level1', name: 'First Steps', x: 200, y: 200 },
        { id: 'level2', name: 'Double Trouble', x: 400, y: 200 },
        { id: 'level3', name: 'Triple Threat', x: 600, y: 200 },
        { id: 'level4', name: 'Momentum Master', x: 200, y: 300 },
        { id: 'level5', name: 'The Gauntlet', x: 400, y: 300 }
    ];
    
    levels.forEach(level => {
        const button = this.add.text(level.x, level.y, level.name, {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff'
        }).setInteractive();
        
        button.on('pointerdown', () => {
            this.scene.start('Game', { levelId: level.id });
        });
    });
}
```

### 6. Implement Game State Persistence (Optional)

- [ ] Save completed levels to localStorage
- [ ] Track collectibles collected per level
- [ ] Add a reset progress option
- [ ] Implement a continue button on the main menu

```javascript
// Example game state persistence
class GameStateManager {
    saveProgress(levelId, collectiblesCollected, totalCollectibles) {
        const progress = this.loadProgress();
        progress[levelId] = {
            completed: true,
            collectiblesCollected,
            totalCollectibles
        };
        localStorage.setItem('wynIsBuff2Progress', JSON.stringify(progress));
    }
    
    loadProgress() {
        const progress = localStorage.getItem('wynIsBuff2Progress');
        return progress ? JSON.parse(progress) : {};
    }
    
    isLevelCompleted(levelId) {
        const progress = this.loadProgress();
        return progress[levelId] && progress[levelId].completed;
    }
    
    resetProgress() {
        localStorage.removeItem('wynIsBuff2Progress');
    }
}
```

## Integration Notes

1. **Event System**: The modular level system relies heavily on the Event System for communication between components. Make sure all events are properly connected.

2. **Physics Integration**: The level system creates physics bodies and colliders. Ensure the PhysicsManager is properly updated with all body-sprite mappings.

3. **Player Controller**: The player controller needs to interact with the level elements. Update it to work with the new level system.

4. **UI Manager**: The UI needs to display level information, collectible counts, and completion messages. Update the UI Manager to handle these new requirements.

5. **Scene Flow**: The game now has a more complex scene flow with level transitions. Ensure the scene management is properly implemented.

## Testing Checklist

- [ ] All 5 levels load correctly
- [ ] Player can move and jump in all levels
- [ ] Collectibles can be collected
- [ ] Level completion triggers work
- [ ] Level transitions are smooth
- [ ] UI updates correctly
- [ ] Game state is saved and loaded properly
- [ ] Performance is acceptable on all levels

## Resources

- [ModularLevelArchitecture.md](../systems/ModularLevelArchitecture.md): Overview of the modular level system architecture
- [ModularLevelSystemImplementation.md](../systems/ModularLevelSystemImplementation.md): Detailed implementation guide
- [LevelImplementationArchitecture.md](./LevelImplementationArchitecture.md): Original level implementation plan
- [MVPLevelDesignGuide.md](../design/MVPLevelDesignGuide.md): Level design guidelines