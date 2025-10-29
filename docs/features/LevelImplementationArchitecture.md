# Level Implementation Architecture for WynIsBuff2

## Table of Contents
- [Overview](#overview)
- [Architectural Approach](#architectural-approach)
- [Level Manager Enhancements](#level-manager-enhancements)
- [Level Data Structure](#level-data-structure)
- [Level Transition System](#level-transition-system)
- [Collectibles System](#collectibles-system)
- [Moving Platforms](#moving-platforms)
- [Level Completion Triggers](#level-completion-triggers)
- [Integration with Event System](#integration-with-event-system)
- [Implementation Plan](#implementation-plan)

## Overview

This document outlines the architectural approach for implementing the level system in WynIsBuff2. The goal is to create a flexible, data-driven level system that supports the 5 focused levels described in the [MVP Level Design Guide](../design/MVPLevelDesignGuide.md), while enabling easy level transitions, collectibles, and completion triggers.

## Architectural Approach

The level implementation will follow these key architectural principles:

1. **Data-Driven Design**: Level layouts and properties will be defined in data structures, separating level design from implementation logic.
2. **Event-Based Communication**: Level events (completion, collectibles, transitions) will use the existing Event System.
3. **Modular Components**: Each level element (platforms, collectibles, triggers) will be implemented as modular components.
4. **Progressive Loading**: Levels will be loaded and unloaded as needed to optimize performance.
5. **Visual Feedback**: Clear visual cues will indicate level progression, collectibles, and completion.

## Level Manager Enhancements

The existing `LevelManager` class will be enhanced with the following capabilities:

### New Methods

```javascript
// Load a specific level by ID
loadLevel(levelId)

// Transition to the next level
nextLevel()

// Reset the current level
resetLevel()

// Create collectibles for the current level
createCollectibles(collectibleConfigs)

// Create moving platforms
createMovingPlatforms(movingPlatformConfigs)

// Create level completion trigger
createLevelCompletionTrigger(triggerConfig)

// Check if all collectibles have been collected
areAllCollectiblesCollected()
```

### New Properties

```javascript
// Store the current level ID
currentLevelId

// Store level configurations
levelConfigs

// Track collectibles
collectibles

// Track moving platforms
movingPlatforms

// Track completion trigger
completionTrigger
```

## Level Data Structure

Each level will be defined using a consistent data structure:

```javascript
{
  id: 'level1',
  name: 'First Steps',
  description: 'Learn basic movement and single jumps',
  
  // Player starting position
  playerStart: { x: 100, y: 600 },
  
  // Ground configuration
  ground: { width: 1024, height: 50, y: 700 },
  
  // Static platforms
  platforms: [
    { x: 200, y: 500, width: 200, height: 20, color: 0x00AA00 },
    // More platforms...
  ],
  
  // Moving platforms
  movingPlatforms: [
    { 
      x: 400, y: 300, width: 100, height: 20, color: 0xAA00AA,
      movement: { type: 'horizontal', distance: 200, speed: 100 }
    },
    // More moving platforms...
  ],
  
  // Collectibles
  collectibles: [
    { x: 300, y: 450, type: 'protein', value: 10 },
    // More collectibles...
  ],
  
  // Level completion trigger
  completionTrigger: {
    x: 800, y: 200, width: 50, height: 50,
    requireAllCollectibles: true
  },
  
  // Background elements
  background: {
    color: 0x87CEEB,
    elements: [
      { type: 'image', key: 'gym_background', x: 512, y: 384, alpha: 0.5 }
    ]
  },
  
  // UI elements specific to this level
  ui: {
    instructionText: 'Use WASD to move and SPACE to jump!'
  }
}
```

## Level Transition System

The level transition system will handle smooth transitions between levels:

1. **Transition Trigger**: When a player reaches the level completion trigger, a transition sequence begins.
2. **Transition Sequence**:
   - Fade out the current level
   - Display level completion UI
   - Load the next level data
   - Initialize the next level
   - Position the player at the start position
   - Fade in the new level
3. **Level Persistence**: The system will track which levels have been completed.

## Collectibles System

Collectibles will enhance the gameplay experience and provide additional objectives:

1. **Types of Collectibles**:
   - Protein shakes (standard collectibles)
   - Dumbbells (special collectibles with gameplay effects)
   - Gym badges (achievement collectibles)

2. **Collectible Behavior**:
   - Visual feedback on collection (particles, sound)
   - Counter in UI showing collected/total
   - Optional requirement for level completion

3. **Implementation**:
   - Physics-based collision detection
   - Event emission on collection
   - Tracking via the LevelManager

## Moving Platforms

Moving platforms will add dynamic elements to levels:

1. **Movement Types**:
   - Horizontal (left-right)
   - Vertical (up-down)
   - Circular (around a point)
   - Path-based (following a series of points)

2. **Platform Properties**:
   - Movement distance
   - Movement speed
   - Pause duration at endpoints

3. **Implementation**:
   - Physics-based movement using Rapier
   - Kinematic bodies that can carry the player
   - Smooth interpolation between positions

## Level Completion Triggers

Level completion triggers will determine when a level is finished:

1. **Trigger Types**:
   - Area trigger (player enters a specific area)
   - Collection trigger (player collects all required items)
   - Time trigger (player completes level within time limit)

2. **Visual Representation**:
   - Clear visual indicator (flag, portal, etc.)
   - Particle effects to draw attention
   - Optional animation

3. **Implementation**:
   - Physics-based collision detection
   - Event emission on trigger
   - Optional conditions (all collectibles, time limit)

## Integration with Event System

The level system will integrate with the existing Event System using these events:

```javascript
// Add to EventNames.js
LEVEL_LOAD: 'level:load',
LEVEL_LOADED: 'level:loaded',
LEVEL_RESET: 'level:reset',
LEVEL_COMPLETE: 'level:complete', // Already exists
COLLECTIBLE_COLLECTED: 'level:collectibleCollected',
COLLECTIBLE_EFFECT: 'level:collectibleEffect',
PLATFORM_MOVE: 'level:platformMove',
LEVEL_TRANSITION_START: 'level:transitionStart',
LEVEL_TRANSITION_COMPLETE: 'level:transitionComplete'
```

## Implementation Plan

The level implementation will be broken down into these steps:

1. **Enhance LevelManager** (1 day)
   - Add support for level configurations
   - Implement level loading/unloading
   - Add methods for level transitions

2. **Implement Collectibles** (0.5 day)
   - Create collectible objects
   - Implement collection logic
   - Add UI for tracking collectibles

3. **Implement Moving Platforms** (0.5 day)
   - Create moving platform logic
   - Implement different movement patterns
   - Ensure proper physics interactions

4. **Create Level Completion System** (0.5 day)
   - Implement completion triggers
   - Create level transition effects
   - Add completion UI

5. **Design and Implement 5 Levels** (1.5 days)
   - Create level data for each level
   - Test and refine each level
   - Ensure proper progression

This implementation plan aligns with the 2-day estimate for Phase 2.2 in the [Revised MVP Implementation Plan](../archive/aiprojectdocs-historical/RevisedMVPImplementationPlan.md).