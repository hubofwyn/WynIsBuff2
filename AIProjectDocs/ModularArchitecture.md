# Modular Architecture Documentation

## Table of Contents
- [Overview](#overview)
- [Module Structure](#module-structure)
  - [PhysicsManager](#physicsmanager)
  - [LevelManager](#levelmanager)
  - [PlayerController](#playercontroller)
- [Integration with Phaser Scenes](#integration-with-phaser-scenes)
- [Benefits of Modularization](#benefits-of-modularization)
- [Best Practices](#best-practices)
- [Future Improvements](#future-improvements)

## Overview

The WynIsBuff2 game has been refactored to use a modular architecture, separating concerns into distinct modules that handle specific aspects of the game. This approach improves code organization, maintainability, and reusability.

## Module Structure

The game is organized into the following modules:

### PhysicsManager

**File**: `src/modules/PhysicsManager.js`

The PhysicsManager is responsible for:
- Initializing the Rapier physics engine
- Creating and managing the physics world
- Stepping the physics simulation
- Synchronizing physics bodies with their visual representations (sprites)

```javascript
// Example usage
const physicsManager = new PhysicsManager(scene);
await physicsManager.initialize(0.0, 20.0); // Initialize with gravity (x, y)
physicsManager.update(); // Call in scene's update method
```

### LevelManager

**File**: `src/modules/LevelManager.js`

The LevelManager is responsible for:
- Creating and managing level elements (ground, platforms, etc.)
- Storing references to level objects
- Providing access to level elements for collision detection

```javascript
// Example usage
const levelManager = new LevelManager(scene, physicsWorld);
levelManager.createGround();
levelManager.createPlatforms();
const platforms = levelManager.getPlatforms();
```

### PlayerController

**File**: `src/modules/PlayerController.js`

The PlayerController is responsible for:
- Creating and managing the player character
- Handling player input
- Implementing movement and jumping mechanics
- Managing player state (on ground, jumps used, etc.)
- Detecting collisions with level elements

```javascript
// Example usage
const playerController = new PlayerController(scene, physicsWorld, x, y);
playerController.update(platforms, jumpText);
```

## Integration with Phaser Scenes

The modules are integrated with Phaser scenes as follows:

1. **Initialization**: Modules are instantiated in the scene's `create` method
2. **Update Loop**: Module update methods are called in the scene's `update` method
3. **Inter-module Communication**: Modules can communicate through the scene or by passing references

Example from `Game.js`:

```javascript
async create() {
    // Initialize physics
    this.physicsManager = new PhysicsManager(this);
    await this.physicsManager.initialize(0.0, 20.0);
    
    // Create level
    this.levelManager = new LevelManager(this, this.physicsManager.getWorld());
    this.levelManager.createGround();
    this.levelManager.createPlatforms();
    
    // Create player
    this.playerController = new PlayerController(
        this, 
        this.physicsManager.getWorld(),
        512, 300
    );
}

update() {
    // Update all modules
    this.physicsManager.update();
    this.levelManager.update();
    this.playerController.update(this.levelManager.getPlatforms(), this.jumpText);
}
```

## Benefits of Modularization

The modular architecture provides several benefits:

1. **Separation of Concerns**: Each module has a specific responsibility, making the code easier to understand and maintain.

2. **Code Reusability**: Modules can be reused across different scenes or even different projects.

3. **Easier Debugging**: Issues can be isolated to specific modules, making debugging more straightforward.

4. **Improved Collaboration**: Team members can work on different modules simultaneously without conflicts.

5. **Scalability**: New features can be added by creating new modules or extending existing ones without modifying the core game logic.

6. **Testability**: Modules can be tested in isolation, making unit testing more effective.

## Best Practices

When working with the modular architecture, follow these best practices:

1. **Single Responsibility**: Each module should have a single responsibility and reason to change.

2. **Encapsulation**: Keep module internals private and expose only necessary methods and properties.

3. **Dependency Injection**: Pass dependencies to modules rather than having modules create their dependencies.

4. **Clear Interfaces**: Define clear interfaces for communication between modules.

5. **Error Handling**: Implement proper error handling within each module to prevent cascading failures.

6. **Documentation**: Document module purposes, interfaces, and usage examples.

7. **Consistent Naming**: Use consistent naming conventions across modules.

## Future Improvements

Potential improvements to the modular architecture:

1. **Event System**: Implement an event system for communication between modules instead of direct references.

2. **Module Registry**: Create a central registry for modules to facilitate discovery and communication.

3. **Configuration System**: Add a configuration system to allow modules to be configured without code changes.

4. **Asset Management Module**: Create a dedicated module for asset loading and management.

5. **UI Module**: Separate UI elements into their own module.

6. **State Management**: Implement a more robust state management system for game state.

7. **Module Factories**: Create factory functions or classes for module instantiation.