# Revised MVP Implementation Plan for WynIsBuff2

## Table of Contents

- [Overview](#overview)
- [Implementation Status](#implementation-status)
- [Architectural Focus](#architectural-focus)
- [Implementation Phases](#implementation-phases)
- [Technical Specifications](#technical-specifications)
- [Integration with Game Design](#integration-with-game-design)
- [Testing Strategy](#testing-strategy)
- [Post-MVP Architecture Roadmap](#post-mvp-architecture-roadmap)

## Overview

This document presents a revised implementation plan for the WynIsBuff2 MVP, integrating the game designer's recommendations with our architectural approach. The plan focuses on delivering the essential architectural components that support the core gameplay experience while deferring less critical improvements to post-MVP development.

## Implementation Status

As of the latest update, the following components have been implemented:

- ✅ **Event System** (Phase 1.1) - Completed
- ✅ **Basic UI Manager** (Phase 1.2) - Completed

For a detailed progress report, see the [Implementation Progress Tracker](./ImplementationProgress.md).

## Architectural Focus

Based on the game designer's recommendations, we will focus on these key architectural components for the MVP:

### Primary Focus (Essential)

1. **Event System**: Implement a streamlined event system for decoupled module communication
2. **Basic UI Manager**: Create a simple UI management system for core interface elements

### Secondary Focus (As Needed)

1. **Simplified Audio Handling**: Basic audio playback for essential sound effects
2. **Movement System Refinements**: Enhance the existing PlayerController for better jump feedback

### Deferred for Post-MVP

1. **Full Input Manager**: Will continue using direct input handling for MVP
2. **State Management System**: Will use simple state tracking within scenes
3. **Enhanced Level Manager**: Will use the existing level creation approach
4. **Entity Management System**: Will use direct object creation and management
5. **Asset Management System**: Will use Phaser's built-in asset loading

## Implementation Phases

### Phase 1: Core Architecture (3-4 days) - COMPLETED ✅

#### 1.1 Event System Implementation (1-2 days) - COMPLETED ✅

- ✅ Created `EventSystem.js` module with core functionality:
  - ✅ Event subscription (`on` method)
  - ✅ Event unsubscription (`off` method)
  - ✅ Event emission (`emit` method)
  - ✅ One-time event handling (`once` method)
- ✅ Created `EventNames.js` constants file with standardized event names
- ✅ Updated Game scene to initialize and use the Event System
- ✅ Modified PhysicsManager to emit and listen for physics-related events
- ✅ Updated PlayerController to emit jump events and other player state changes
- ✅ Implemented debug mode for event tracing during development

#### 1.2 Basic UI Manager Implementation (1-2 days) - COMPLETED ✅

- ✅ Created `UIManager.js` module with comprehensive functionality:
  - ✅ Text creation and management
  - ✅ Button handling with hover effects
  - ✅ UI element positioning and grouping
  - ✅ UI state updates via events
- ✅ Moved existing UI elements (jump counter, instructions) to the UI Manager
- ✅ Connected UI Manager to Event System for updates
- ✅ Implemented responsive positioning for different screen sizes
- ✅ Added methods for showing/hiding UI elements based on game state

### Phase 2: Gameplay Enhancements (3-4 days) - CURRENT FOCUS 🔄

#### 2.1 Triple Jump Refinement (1-2 days) - NEXT PRIORITY 🔄

- Enhance visual feedback for each jump stage:
  - Improve color changes based on jump state
  - Add particle effects for jump and landing
  - Implement screen shake for powerful jumps
  - Refine jump physics for better "game feel"
- Connect jump events to UI updates via Event System
- Optimize jump detection and response timing
- Add "coyote time" and jump buffering refinements

#### 2.2 Level Implementation (2 days) - PENDING

- Create 3-5 focused levels following the level design guide:
  - Level 1: Basic movement and single jumps
  - Level 2: Double jump introduction
  - Level 3: Triple jump mastery
  - Level 4: Momentum and timing challenges
  - Level 5: Combined skills challenge
- Implement simple level transition system
- Add basic collectibles using existing physics system
- Create level completion triggers and feedback

### Phase 3: Polish and Finalization (2-3 days) - PENDING

#### 3.1 Audio and Visual Polish (1-2 days) - PENDING

- Implement basic sound effects for:
  - Jumping (different sounds for each jump)
  - Landing
  - Collecting items
  - Level completion
- Add simple background music
- Enhance visual elements:
  - Improve player animations
  - Add environmental details
  - Implement basic particle effects
  - Create transition effects between levels

#### 3.2 Testing and Optimization (1 day) - PENDING

- Perform comprehensive testing:
  - Movement mechanics
  - Physics interactions
  - Level progression
  - UI functionality
  - Audio playback
- Optimize performance:
  - Reduce unnecessary physics calculations
  - Optimize rendering
  - Manage memory usage
  - Ensure consistent frame rate

## Technical Specifications

### Event System Implementation

```javascript
// src/modules/EventSystem.js
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
        this.events.set(
            event,
            callbacks.filter((cb) => cb !== callback)
        );
    }

    emit(event, data) {
        if (this.debugMode) {
            console.log(`[EventSystem] Event: ${event}`, data);
        }

        if (!this.events.has(event)) return;
        this.events.get(event).forEach((callback) => {
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

// src/constants/EventNames.js
export const EventNames = {
    // Core game events
    GAME_INIT: 'game:init',
    GAME_START: 'game:start',
    LEVEL_COMPLETE: 'level:complete',

    // Player events
    PLAYER_JUMP: 'player:jump',
    PLAYER_LAND: 'player:land',
    PLAYER_MOVE: 'player:move',

    // UI events
    UI_UPDATE: 'ui:update',

    // Physics events
    COLLISION: 'physics:collision',

    // Audio events
    PLAY_SOUND: 'audio:playSound',
    PLAY_MUSIC: 'audio:playMusic',
};
```

### UI Manager Implementation

```javascript
// src/modules/UIManager.js
export class UIManager {
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.events = eventSystem;
        this.elements = new Map();

        // Listen for UI update events
        if (this.events) {
            this.events.on(EventNames.UI_UPDATE, this.handleUIUpdate.bind(this));
        }
    }

    createText(key, x, y, text, style) {
        const textElement = this.scene.add.text(x, y, text, style);
        this.elements.set(key, textElement);
        return textElement;
    }

    createButton(key, x, y, texture, callback) {
        const button = this.scene.add
            .image(x, y, texture)
            .setInteractive()
            .on('pointerdown', callback);
        this.elements.set(key, button);
        return button;
    }

    updateText(key, text) {
        const element = this.elements.get(key);
        if (element && element.setText) {
            element.setText(text);
        }
    }

    handleUIUpdate(data) {
        if (data.type === 'text' && data.key && data.value) {
            this.updateText(data.key, data.value);
        }
    }

    getElement(key) {
        return this.elements.get(key);
    }

    showElement(key) {
        const element = this.elements.get(key);
        if (element) {
            element.setVisible(true);
        }
    }

    hideElement(key) {
        const element = this.elements.get(key);
        if (element) {
            element.setVisible(false);
        }
    }
}
```

## Integration with Game Design

The architectural implementation directly supports the game design priorities:

### 1. Triple Jump Mechanics

- Event System enables better feedback and communication between jump mechanics and visual effects
- Events for jump states allow UI to update dynamically
- Decoupled communication allows for easier refinement of jump mechanics

### 2. Physics-Based Movement

- PhysicsManager continues to handle Rapier integration
- Event System allows for physics events to trigger visual and audio feedback
- Improved communication between physics and player controller

### 3. Basic Level Design

- Simplified approach focuses on creating a few well-designed levels
- Level transitions managed through simple scene changes
- Event-based completion triggers

### 4. Visual Feedback

- UI Manager handles visual indicators for player state
- Event System connects player actions to visual responses
- Centralized UI management for consistent feedback

### 5. Core UI Elements

- UI Manager provides organized approach to creating and updating UI
- Jump counter and instructions managed through UI Manager
- Event-based updates ensure UI reflects current game state

## Testing Strategy

### 1. Component Testing

- Test Event System with various event types and handlers
- Verify UI Manager correctly creates and updates elements
- Ensure PlayerController emits appropriate events

### 2. Integration Testing

- Test communication between modules via Event System
- Verify UI updates in response to player actions
- Ensure physics interactions trigger appropriate events

### 3. Gameplay Testing

- Test triple jump mechanics for responsiveness and feel
- Verify level progression and completion
- Ensure visual and audio feedback is appropriate

### 4. Performance Testing

- Monitor frame rate during gameplay
- Check memory usage over time
- Verify event handling doesn't impact performance

## Post-MVP Architecture Roadmap

After delivering the MVP, we'll implement these architectural improvements in order of priority:

1. **Input Manager**: Decouple input handling from PlayerController
2. **Audio Manager**: Create a comprehensive audio management system
3. **State Management**: Implement game state tracking and persistence
4. **Enhanced Level Manager**: Add tilemap support and data-driven level loading
5. **Entity Management System**: Create a system for managing game entities
6. **Asset Management**: Implement comprehensive asset organization and loading

## Conclusion

This revised implementation plan focuses on delivering the essential architectural components that support the core gameplay experience while deferring less critical improvements to post-MVP development.

**Current Status**: The first phase of the implementation plan has been successfully completed with the Event System and UI Manager now fully functional. These components provide the foundation for the game's communication system and user interface management, enabling decoupled module communication and consistent UI handling.

**Next Steps**: The focus has now shifted to Phase 2.1 - Triple Jump Refinement, which involves enhancing the visual feedback for jumps, refining the jump physics, and optimizing the jump detection and response timing.

For a detailed overview of the implementation progress and next steps, refer to the [Implementation Progress Tracker](./ImplementationProgress.md).

> Archived Notice: Superseded by IMPLEMENTATION_PLAN_V2.md and docs/INDEX.md. Refer there for the current plan.
