# Modular Level Architecture for WynIsBuff2

## Table of Contents

- [Overview](#overview)
- [SOLID Principles](#solid-principles)
- [Module Structure](#module-structure)
- [Class Responsibilities](#class-responsibilities)
- [Interaction Diagram](#interaction-diagram)
- [Implementation Plan](#implementation-plan)

## Overview

This document outlines the modular architecture for the level system in WynIsBuff2. The goal is to refactor the monolithic `LevelManager` class into a set of smaller, focused classes that each have a single responsibility, following SOLID object-oriented principles.

## SOLID Principles

The modular level architecture follows these SOLID principles:

1. **Single Responsibility Principle (SRP)**: Each class has one responsibility and one reason to change.
2. **Open/Closed Principle (OCP)**: Classes are open for extension but closed for modification.
3. **Liskov Substitution Principle (LSP)**: Derived classes can substitute their base classes.
4. **Interface Segregation Principle (ISP)**: Clients should not depend on interfaces they don't use.
5. **Dependency Inversion Principle (DIP)**: High-level modules depend on abstractions, not concrete implementations.

## Module Structure

The level system will be organized into the following directory structure:

```text
src/
  modules/
    level/
      LevelManager.js            # Main coordinator class (facade pattern)
      GroundFactory.js           # Creates and manages ground
      PlatformFactory.js         # Creates and manages platforms
      MovingPlatformController.js # Handles moving platform behavior
      CollectibleManager.js      # Manages collectibles
      LevelCompletionManager.js  # Handles level completion logic
      LevelTransitionController.js # Manages level transitions
      LevelLoader.js             # Loads level data and initializes level elements
```

## Class Responsibilities

### LevelManager

The `LevelManager` class serves as a facade for the level system, coordinating the other specialized classes:

- Initializes and manages all level-related components
- Provides a simplified interface for the Game scene
- Delegates specific tasks to specialized classes
- Maintains references to all level elements
- Handles high-level level operations (load, reset, next)

```javascript
// Key methods
constructor(scene, world, eventSystem);
loadLevel(levelId);
nextLevel();
resetLevel();
update(delta);
getBodyToSpriteMap();
```

### GroundFactory

The `GroundFactory` class is responsible for creating and managing the ground:

- Creates ground elements based on level configuration
- Manages ground physics bodies and sprites
- Handles ground-related events

```javascript
// Key methods
constructor(scene, world, eventSystem);
createGround(config);
removeGround();
getGround();
```

### PlatformFactory

The `PlatformFactory` class is responsible for creating and managing static platforms:

- Creates platform elements based on level configuration
- Manages platform physics bodies and sprites
- Handles platform-related events

```javascript
// Key methods
constructor(scene, world, eventSystem);
createPlatforms(platformConfigs);
removePlatforms();
getPlatforms();
```

### MovingPlatformController

The `MovingPlatformController` class is responsible for creating and managing moving platforms:

- Creates moving platform elements based on level configuration
- Manages platform physics bodies and sprites
- Updates platform positions based on movement patterns
- Handles platform-related events

```javascript
// Key methods
constructor(scene, world, eventSystem);
createMovingPlatforms(movingPlatformConfigs);
removeMovingPlatforms();
updateMovingPlatforms(delta);
getMovingPlatforms();
```

### CollectibleManager

The `CollectibleManager` class is responsible for creating and managing collectibles:

- Creates collectible elements based on level configuration
- Manages collectible physics bodies and sprites
- Handles collectible collection logic
- Tracks collected items
- Emits collectible-related events

```javascript
// Key methods
constructor(scene, world, eventSystem);
createCollectibles(collectibleConfigs);
removeCollectibles();
collectItem(collectibleId);
areAllCollectiblesCollected();
getCollectibles();
```

### LevelCompletionManager

The `LevelCompletionManager` class is responsible for handling level completion logic:

- Creates level completion trigger based on level configuration
- Checks completion conditions
- Handles level completion events
- Coordinates with LevelTransitionController for level transitions

```javascript
// Key methods
constructor(scene, world, eventSystem);
createCompletionTrigger(triggerConfig);
removeCompletionTrigger();
checkLevelCompletion(playerPosition);
completeLevel();
```

### LevelTransitionController

The `LevelTransitionController` class is responsible for managing level transitions:

- Handles transition effects (fade out/in)
- Manages transition timing
- Emits transition-related events
- Coordinates with LevelLoader for loading the next level

```javascript
// Key methods
constructor(scene, eventSystem);
startTransition(fromLevelId, toLevelId);
handleTransitionComplete();
```

### LevelLoader

The `LevelLoader` class is responsible for loading level data and initializing level elements:

- Loads level configuration from LevelData
- Initializes level elements through the appropriate factories/controllers
- Sets up level-specific UI and background
- Emits level loading events

```javascript
// Key methods
constructor(scene, eventSystem);
loadLevelData(levelId);
initializeLevel(levelConfig);
clearLevel();
```

## Interaction Diagram

```text
Game Scene
    |
    v
LevelManager (Facade)
    |
    |----> LevelLoader
    |        |
    |        v
    |----> GroundFactory
    |
    |----> PlatformFactory
    |
    |----> MovingPlatformController
    |
    |----> CollectibleManager
    |
    |----> LevelCompletionManager
            |
            v
        LevelTransitionController
```

## Implementation Plan

1. Create the base classes with minimal functionality
2. Refactor the existing LevelManager code into the appropriate classes
3. Update the Game scene to use the new LevelManager facade
4. Test each component individually
5. Integrate all components and test the complete level system

This modular architecture will make the level system more maintainable, extensible, and testable, while following SOLID object-oriented principles.
