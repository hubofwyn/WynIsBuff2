# Modular Player Controller Architecture

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
  - [PlayerController](#playercontroller)
  - [JumpController](#jumpcontroller)
  - [MovementController](#movementcontroller)
  - [CollisionController](#collisioncontroller)
- [Effect Systems](#effect-systems)
  - [ParticleManager](#particlemanager)
  - [CameraManager](#cameramanager)
  - [ColorManager](#colormanager)
- [Integration with Event System](#integration-with-event-system)
- [Physics Refinements](#physics-refinements)
- [Usage Guide](#usage-guide)

## Overview

The Modular Player Controller Architecture is a comprehensive redesign of the player control system that separates concerns into specialized controllers. This approach enhances maintainability, testability, and extensibility while providing more granular control over player mechanics.

The architecture consists of a main `PlayerController` that coordinates three specialized controllers:
- `JumpController`: Handles all jump-related functionality
- `MovementController`: Handles horizontal movement and air control
- `CollisionController`: Handles collision detection and ground state

Additionally, three effect managers provide visual feedback:
- `ParticleManager`: Handles particle effects for jumps, landings, and movement
- `CameraManager`: Handles screen shake and camera effects
- `ColorManager`: Handles color transitions for the player sprite

## Architecture

### PlayerController

The `PlayerController` serves as a coordinator that delegates specific responsibilities to specialized controllers. It:

- Creates and initializes the physics body and sprite
- Sets up input handlers
- Coordinates updates between specialized controllers
- Provides access to the player's physics body and sprite
- Emits high-level player events

```javascript
// Example usage
const playerController = new PlayerController(scene, world, eventSystem, x, y);
playerController.update(platforms);
```

### JumpController

The `JumpController` handles all jump-related functionality, including:

- Jump physics and forces
- Jump state tracking (grounded, rising, peak, falling)
- Jump buffering for more responsive controls
- Variable jump height based on button press duration
- Coyote time for more forgiving jumps
- Landing recovery and effects
- Jump-related event emissions

Key features:
- Triple jump with increasing power for each jump
- Horizontal boost when jumping while moving
- Squash and stretch effects for jumps and landings
- Comprehensive jump state tracking for visual feedback

```javascript
// JumpController parameters
jumpParams = {
    baseForce: -45,          // Base jump force
    releaseMultiplier: 0.5,  // Multiplier when jump key is released early
    minJumpTime: 100,        // Minimum jump time in ms
    bufferTime: 150,         // Jump buffer time in ms
    landingRecoveryTime: 80, // Landing recovery time in ms
    
    // Jump forces for each jump
    forces: {
        1: -45, // First jump
        2: -50, // Second jump
        3: -55  // Third jump
    }
};
```

### MovementController

The `MovementController` handles all movement-related functionality, including:

- Horizontal movement with snappy controls
- Air control with appropriate physics
- Falling acceleration with improved feel
- Self-balancing to keep player upright
- Movement-related event emissions

Key features:
- Different movement parameters for ground and air
- Snappy direction changes with momentum
- Improved falling acceleration curve
- Landing recovery affecting movement speed

```javascript
// Ground movement parameters
groundParams = {
    moveSpeed: 35,         // Moderate max speed
    snapFactor: 0.8,       // How quickly to snap to target velocity (0-1)
    stopSnapFactor: 0.9,   // How quickly to stop (0-1)
    directionChangeFactor: 1.5 // Multiplier for direction changes
};

// Air movement parameters
airParams = {
    moveSpeed: 30,         // Slightly lower max speed in air
    snapFactor: 0.6,       // Slower acceleration in air
    stopSnapFactor: 0.05,  // Much slower stopping in air
    directionChangeFactor: 1.2 // Less responsive direction changes in air
};
```

### CollisionController

The `CollisionController` handles all collision-related functionality, including:

- Ground detection with platforms and main ground
- Precise collision checks for better feel
- Ray casting for advanced collision detection
- Collision-related state tracking

Key features:
- Precise ground detection with configurable parameters
- Platform collision detection
- Ray casting for advanced collision queries

```javascript
// Collision parameters
collisionParams = {
    playerWidth: 32,
    playerHeight: 32,
    feetOffset: 2,       // Offset from center to feet position
    platformMargin: 5,   // Margin for platform width collision
    groundTopOffset: 5,  // Offset for ground top collision
};
```

## Effect Systems

### ParticleManager

The `ParticleManager` handles all particle effects for the player, including:

- Jump particles with different effects for each jump
- Landing particles based on impact velocity
- Movement particles when running
- Custom particle emission for special effects

Key features:
- Different particle configurations for each jump type
- Impact-based landing particles
- Movement trail particles
- Event-based particle emission

```javascript
// Example particle configuration
jumpParticleConfigs = {
    1: {
        frame: ['white'],
        lifespan: 600,
        speed: { min: 50, max: 100 },
        scale: { start: 0.1, end: 0 },
        quantity: 10,
        tint: 0xcccccc // Light gray dust
    }
};
```

### CameraManager

The `CameraManager` handles all camera effects, including:

- Screen shake for jumps and landings
- Intensity-based shake effects
- Direction-based shake
- Accessibility options for disabling screen shake

Key features:
- Configurable shake parameters
- Impact-based shake intensity
- Directional shake for different actions
- Accessibility considerations

```javascript
// Example shake configuration
shakeConfig = {
    duration: 100,
    intensity: 0.01,
    force: 0,
    direction: null, // null for random direction
    decay: true // whether shake intensity should decay over time
};
```

### ColorManager

The `ColorManager` handles all color-related effects for the player, including:

- Smooth color transitions between jump states
- Brightness changes based on jump phase
- Pulse effects for jumps and landings
- Color interpolation for smooth transitions

Key features:
- Smooth color transitions using tweens
- State-based color changes
- Pulse effects for visual feedback
- Brightness modulation based on jump state

```javascript
// Example color configuration
colorConfigs = {
    ground: 0x0000FF,  // Blue
    jump1: 0x00FF00,   // Green
    jump2: 0xFFFF00,   // Yellow
    jump3: 0xFF0000,   // Red
};
```

## Integration with Event System

The modular architecture leverages the Event System for communication between components. Key events include:

- `PLAYER_JUMP`: Emitted when the player jumps
- `PLAYER_JUMP_START`: Emitted at the start of a jump
- `PLAYER_JUMP_PEAK`: Emitted at the peak of a jump
- `PLAYER_JUMP_FALL`: Emitted when the player starts falling
- `PLAYER_LAND`: Emitted when the player lands
- `PLAYER_LAND_IMPACT`: Emitted with impact data when landing
- `PLAYER_MOVE`: Emitted during player movement
- `CAMERA_SHAKE`: Emitted to request camera shake
- `EMIT_PARTICLES`: Emitted to request particle emission

This event-based approach ensures loose coupling between components and allows for easy extension and modification.

## Physics Refinements

The modular architecture includes several physics refinements:

### Jump Physics
- Variable jump height based on button press duration
- Jump buffering for more responsive controls
- Coyote time for more forgiving jumps
- Increasing jump force for each jump in the triple jump sequence
- Horizontal boost when jumping while moving
- Additional impulse for extra "pop" feeling

### Movement Physics
- Snappy ground movement with quick acceleration
- Reduced air control with appropriate physics
- Improved falling acceleration curve
- Self-balancing to keep player upright
- Landing recovery affecting movement speed

### Collision Physics
- Precise ground detection with configurable parameters
- Platform collision detection with margins
- Ray casting for advanced collision queries

## Usage Guide

### Initializing the Player Controller

```javascript
// In your game scene
this.playerController = new PlayerController(
    this,                       // scene
    this.physicsManager.getWorld(), // Rapier world
    this.eventSystem,           // event system
    512,                        // x position
    300                         // y position
);
```

### Initializing Effect Managers

```javascript
// In your game scene
this.particleManager = new ParticleManager(this, this.eventSystem);
this.cameraManager = new CameraManager(this, this.eventSystem);
this.colorManager = new ColorManager(this, this.eventSystem);
```

### Updating the Player Controller

```javascript
// In your game scene's update method
this.playerController.update(this.levelManager.getPlatforms());
```

### Accessing Specialized Controllers

```javascript
// Get the jump controller
const jumpController = this.playerController.getJumpController();

// Get the movement controller
const movementController = this.playerController.getMovementController();

// Get the collision controller
const collisionController = this.playerController.getCollisionController();
```

### Customizing Physics Parameters

Each controller exposes parameters that can be customized:

```javascript
// Customize jump parameters
const jumpController = this.playerController.getJumpController();
jumpController.jumpParams.forces[1] = -40; // Adjust first jump force
jumpController.jumpParams.bufferTime = 200; // Increase jump buffer time

// Customize movement parameters
const movementController = this.playerController.getMovementController();
movementController.groundParams.moveSpeed = 40; // Increase ground speed
movementController.airParams.snapFactor = 0.5; // Adjust air control

// Customize collision parameters
const collisionController = this.playerController.getCollisionController();
collisionController.collisionParams.feetOffset = 3; // Adjust feet position
```

### Handling Player Events

The Event System allows for easy handling of player events:

```javascript
// Listen for jump events
this.eventSystem.on(EventNames.PLAYER_JUMP, (data) => {
    console.log(`Player jumped: Jump ${data.jumpNumber} of ${data.maxJumps}`);
});

// Listen for land events
this.eventSystem.on(EventNames.PLAYER_LAND, (data) => {
    console.log(`Player landed with velocity: ${data.velocity.y}`);
});
```

## Conclusion

The Modular Player Controller Architecture provides a robust foundation for player mechanics with enhanced visual feedback. By separating concerns into specialized controllers and effect managers, the architecture is more maintainable, testable, and extensible while providing more granular control over player mechanics.