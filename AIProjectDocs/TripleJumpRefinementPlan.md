# Triple Jump Refinement Implementation Plan

## Table of Contents
- [Overview](#overview)
- [Current Implementation](#current-implementation)
- [Enhancement Goals](#enhancement-goals)
- [Implementation Details](#implementation-details)
  - [1. Improved Color Changes](#1-improved-color-changes)
  - [2. Particle Effects](#2-particle-effects)
  - [3. Screen Shake](#3-screen-shake)
  - [4. Jump Physics Refinement](#4-jump-physics-refinement)
- [Integration with Event System](#integration-with-event-system)
- [Technical Approach](#technical-approach)
- [Testing Strategy](#testing-strategy)

## Overview

This document outlines the implementation plan for Phase 2.1: Triple Jump Refinement, which focuses on enhancing visual feedback and refining jump mechanics to create a more satisfying player experience. The refinements will leverage the existing Event System to ensure proper decoupling of components.

## Current Implementation

The current triple jump implementation includes:

- Basic color changes for each jump state (blue → green → yellow → red)
- Three distinct jump heights with increasing power
- Horizontal boost when jumping while moving
- "Coyote time" for more forgiving jump timing
- Event emission for jump and land events
- Jump counter UI that updates with each jump

## Enhancement Goals

The refinement phase aims to achieve the following:

1. **Enhanced Visual Feedback**:
   - More dynamic color transitions between jump states
   - Particle effects for jumps and landings
   - Screen shake for powerful jumps (especially the third jump)

2. **Improved Game Feel**:
   - Refined jump physics with better "weight" and responsiveness
   - Jump buffering for more responsive controls
   - Optimized jump detection and response timing

## Implementation Details

### 1. Improved Color Changes

#### Current Approach
Currently, the player sprite changes color instantly when jumping:
- Ground state: Blue (0x0000FF)
- First jump: Green (0x00FF00)
- Second jump: Yellow (0xFFFF00)
- Third jump: Red (0xFF0000)

#### Enhanced Approach
Implement a more dynamic color transition system:

- **Gradual Color Transitions**: Instead of instant color changes, implement a smooth transition between colors
- **Intensity Based on Velocity**: Vary color intensity based on player velocity (brighter at peak of jump)
- **Pulse Effect**: Add a subtle pulse effect when landing and when initiating a jump

#### Implementation Steps
1. Create a `ColorManager` class to handle color transitions
2. Implement a tween-based color transition system
3. Connect color changes to jump events and velocity changes
4. Add color pulse effects for jump and land events

### 2. Particle Effects

#### Particle Types
Implement different particle effects for different actions:

1. **Jump Particles**:
   - Small dust cloud when jumping from ground
   - Energy particles for double jump (second jump)
   - Burst effect for triple jump (third jump)

2. **Landing Particles**:
   - Dust cloud proportional to landing velocity
   - Impact ripple effect for high-velocity landings

3. **Movement Particles**:
   - Subtle dust trail when moving quickly

#### Implementation Steps
1. Create a `ParticleManager` class to handle particle creation and lifecycle
2. Define particle configurations for each effect type
3. Connect particle emission to player events (jump, land, move)
4. Optimize particle rendering for performance

### 3. Screen Shake

#### Screen Shake Types
Implement contextual screen shake effects:

1. **Jump Shake**:
   - No shake for first jump
   - Subtle shake for second jump
   - Stronger shake for third jump

2. **Landing Shake**:
   - Intensity based on landing velocity
   - Direction influenced by movement direction

#### Implementation Steps
1. Create a `CameraManager` class to handle screen effects
2. Implement a configurable screen shake system with:
   - Intensity control
   - Duration control
   - Decay rate
3. Connect screen shake to jump and land events
4. Add options to disable screen shake for accessibility

### 4. Jump Physics Refinement

#### Physics Improvements
Refine the jump physics for better game feel:

1. **Jump Buffering**:
   - Allow jump input to be buffered for a short time (100ms)
   - Execute jump when player lands if buffer is active

2. **Variable Jump Height**:
   - Implement variable jump height based on button press duration
   - Short press = shorter jump, long press = full height

3. **Air Control Refinement**:
   - Improve mid-air steering for more responsive control
   - Add subtle air resistance for more natural movement

4. **Landing Recovery**:
   - Add a very brief (50-100ms) landing recovery state
   - Visual squash effect on landing

#### Implementation Steps
1. Enhance the `PlayerController.handleJumping()` method with jump buffering
2. Implement variable jump height based on key press duration
3. Refine air control parameters in `PlayerController.handleMovement()`
4. Add landing recovery state and visual effects

## Integration with Event System

The refinements will leverage the existing Event System for communication between components:

### New Events
Add the following events to `EventNames.js`:

```javascript
// Visual feedback events
PLAYER_JUMP_START: 'player:jumpStart',
PLAYER_JUMP_PEAK: 'player:jumpPeak',
PLAYER_JUMP_FALL: 'player:jumpFall',
PLAYER_LAND_IMPACT: 'player:landImpact',

// Camera effect events
CAMERA_SHAKE: 'camera:shake',

// Particle effect events
EMIT_PARTICLES: 'fx:emitParticles',
```

### Event Flow
1. `PlayerController` detects jump/land actions and emits events
2. `ParticleManager` listens for events and creates appropriate particles
3. `CameraManager` listens for events and applies screen shake
4. `ColorManager` listens for events and updates player color

## Technical Approach

### New Modules
Create the following new modules:

1. **src/modules/effects/ParticleManager.js**
   - Handles creation and management of particle effects
   - Provides configurable particle emitters for different effect types

2. **src/modules/effects/CameraManager.js**
   - Manages camera effects including screen shake
   - Provides configurable shake parameters

3. **src/modules/effects/ColorManager.js**
   - Handles color transitions and effects for game objects
   - Provides tween-based color manipulation

### Module Integration
Integrate the new modules into the Game scene:

```javascript
// In Game.js create() method
this.particleManager = new ParticleManager(this, this.eventSystem);
this.cameraManager = new CameraManager(this, this.eventSystem);
this.colorManager = new ColorManager(this, this.eventSystem);
```

### PlayerController Enhancements
Enhance the PlayerController with:

1. Jump buffering system
2. Variable jump height
3. Refined air control
4. Additional event emissions for jump states

## Testing Strategy

Test the refinements with the following approach:

1. **Visual Feedback Testing**:
   - Verify color transitions are smooth and responsive
   - Ensure particle effects appear at appropriate times
   - Confirm screen shake intensity matches action magnitude

2. **Physics Feel Testing**:
   - Test jump buffering in various scenarios
   - Verify variable jump height works consistently
   - Ensure air control feels responsive but not excessive

3. **Performance Testing**:
   - Monitor frame rate during heavy particle emission
   - Ensure particle system doesn't cause memory leaks
   - Optimize effects for consistent performance

4. **Integration Testing**:
   - Verify all components communicate properly via Event System
   - Ensure no visual glitches when multiple effects trigger simultaneously