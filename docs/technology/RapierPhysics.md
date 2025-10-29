# Rapier Physics Engine Integration

**Current API Version**: Rapier 0.19+
**Migration Status**: ✅ Complete
**For Breaking Changes**: See [RAPIER_019_MIGRATION.md](./RAPIER_019_MIGRATION.md)

## Table of Contents
- [Overview](#overview)
- [Version Information](#version-information)
- [Integration with Phaser](#integration-with-phaser)
- [Core Concepts](#core-concepts)
  - [World](#world)
  - [Rigid Bodies](#rigid-bodies)
  - [Colliders](#colliders)
- [Implementation in WynIsBuff2](#implementation-in-wynisbuff2)
  - [Initialization](#initialization)
  - [Creating Game Objects with Physics](#creating-game-objects-with-physics)
  - [Physics Simulation Loop](#physics-simulation-loop)
  - [Collision Detection](#collision-detection)
- [Best Practices](#best-practices)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Resources](#resources)

## Overview

Rapier is a high-performance physics engine written in Rust with JavaScript bindings. In WynIsBuff2, Rapier provides realistic physics simulation for game objects, including gravity, collisions, and movement.

**⚠️ Important**: This guide uses Rapier 0.19+ API. For migration from older versions, see [RAPIER_019_MIGRATION.md](./RAPIER_019_MIGRATION.md).

## Version Information

- **Package**: @dimforge/rapier2d-compat
- **Version**: 0.19+ (current)
- **Previous Version**: 0.14.0 (deprecated)
- **Official Documentation**: https://rapier.rs/docs/
- **GitHub Repository**: https://github.com/dimforge/rapier
- **JavaScript API Reference**: https://rapier.rs/javascript2d/index.html

**Breaking Changes**: Rapier 0.19+ introduced significant API changes. See [RAPIER_019_MIGRATION.md](./RAPIER_019_MIGRATION.md) for details.

## Integration with Phaser

Rapier is used as an alternative to Phaser's built-in Arcade, Matter, or Box2D physics systems. The integration requires manual synchronization between Phaser game objects and Rapier physics bodies.

## Core Concepts

### World

The Rapier World is the container for all physics objects and simulations:

```javascript
// Create a world with gravity (x: 0, y: 9.81)
const world = new RAPIER.World(new RAPIER.Vector2(0.0, 9.81));
```

### Rigid Bodies

Rigid bodies represent physical objects that can move and collide:

- **Dynamic**: Bodies that move and are affected by forces
- **Static**: Immovable bodies (like ground and platforms)
- **Kinematic**: Bodies that move but are not affected by forces

```javascript
// Create a dynamic rigid body
const bodyDesc = RAPIER.RigidBodyDesc.dynamic();
bodyDesc.setTranslation(x, y);
const rigidBody = world.createRigidBody(bodyDesc);
```

### Colliders

Colliders define the shape used for collision detection:

```javascript
// Create a cuboid collider
const colliderDesc = RAPIER.ColliderDesc.cuboid(width/2, height/2);
colliderDesc.setRestitution(0.7); // Bounciness
world.createCollider(colliderDesc, rigidBody);
```

## Implementation in WynIsBuff2

### Initialization

Rapier must be initialized asynchronously before use. **Rapier 0.19+ requires EventQueue creation**:

```javascript
async create() {
    // Initialize Rapier
    await RAPIER.init();

    // Create physics world with gravity
    this.rapierWorld = new RAPIER.World(new RAPIER.Vector2(0.0, 9.81));

    // Create EventQueue (REQUIRED in Rapier 0.19+)
    this.eventQueue = new RAPIER.EventQueue(true);

    // Configure integration parameters on world object
    this.rapierWorld.integrationParameters.dt = 1/60; // Fixed timestep
    this.rapierWorld.integrationParameters.numSolverIterations = 8;
}
```

**⚠️ Breaking Change**: Rapier 0.19+ requires EventQueue. Without it, `world.step()` will throw `Error: expected instance of z`. See [RAPIER_019_MIGRATION.md#1-eventqueue-requirement](./RAPIER_019_MIGRATION.md#1-eventqueue-requirement).

### Creating Game Objects with Physics

The game uses a pattern of creating Phaser game objects with corresponding Rapier physics bodies:

```javascript
// Create a Phaser game object
const sprite = this.add.rectangle(x, y, width, height, color);

// Create a Rapier rigid body
const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, y);

const rigidBody = this.rapierWorld.createRigidBody(bodyDesc);

// Create a collider
const colliderDesc = RAPIER.ColliderDesc.cuboid(width/2, height/2);
this.rapierWorld.createCollider(colliderDesc, rigidBody);

// Store the association between body and sprite
this.bodyToSprite.set(rigidBody.handle, sprite);
```

### Physics Simulation Loop

The physics world is stepped forward in the update loop with EventQueue, and game objects are synchronized using iterator methods:

```javascript
update() {
    // Configure integration parameters (can be set once in init, or per-frame)
    this.rapierWorld.integrationParameters.dt = 1/60;
    this.rapierWorld.integrationParameters.numSolverIterations = 8;

    // Step the physics simulation with EventQueue (REQUIRED in 0.19+)
    this.rapierWorld.step(this.eventQueue);

    // Process collision events from the queue
    this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
        if (started) {
            // Collision started - handle it
            this.handleCollision(handle1, handle2);
        }
    });

    // Update all sprites using forEachRigidBody iterator (0.19+ API)
    this.rapierWorld.forEachRigidBody(body => {
        const sprite = this.bodyToSprite.get(body.handle);

        if (sprite) {
            const position = body.translation();
            const rotation = body.rotation();

            sprite.x = position.x;
            sprite.y = position.y;
            sprite.rotation = rotation;
        }
    });
}
```

**⚠️ Breaking Changes**:
- `world.step()` now requires EventQueue parameter (0.19+)
- `world.bodies.forEach()` replaced with `world.forEachRigidBody()` (0.19+)
- See [RAPIER_019_MIGRATION.md#2-world-body-iteration](./RAPIER_019_MIGRATION.md#2-world-body-iteration) for details

### Collision Detection

WynIsBuff2 uses Rapier's **KinematicCharacterController** for advanced collision handling and ground detection.

#### Character Controller Setup

```javascript
// Create character controller
const characterController = this.rapierWorld.createCharacterController(0.01); // 0.01 = offset from walls
characterController.enableAutostep(0.5, 0.2, true); // (maxHeight, minWidth, includeDynamicBodies)
characterController.enableSnapToGround(0.3); // 0.3 = max snap distance
```

#### Ground Detection (Rapier 0.19+)

**⚠️ Critical Change**: `characterController.isGrounded()` and `numGroundedColliders` were **removed in Rapier 0.19+**.

**Modern approach - Physics-based detection**:

```javascript
/**
 * Ground detection by comparing desired vs corrected movement
 * MUST be called AFTER computeColliderMovement()
 */
updateGroundState(desiredMovement, correctedMovement) {
    const GROUND_THRESHOLD = 0.01;

    // 1. Check if falling movement was blocked by collision
    const isFalling = this.velocity.y > 0; // Positive Y = downward
    const verticalBlocked = isFalling &&
        Math.abs(correctedMovement.y) < Math.abs(desiredMovement.y) - GROUND_THRESHOLD;

    // 2. Check if velocity is near zero (at rest)
    const atRest = Math.abs(this.velocity.y) < GROUND_THRESHOLD;

    // Either condition means we're grounded
    this.isGrounded = verticalBlocked || atRest;
}

// Usage in update loop:
const desiredMovement = new RAPIER.Vector2(dx, dy);
characterController.computeColliderMovement(collider, desiredMovement);
const correctedMovement = characterController.computedMovement();

// Update ground state by comparing movements
this.updateGroundState(desiredMovement, correctedMovement);
```

**⚠️ Breaking Change**: Ground detection APIs completely removed. See [RAPIER_019_MIGRATION.md#3-ground-detection](./RAPIER_019_MIGRATION.md#3-ground-detection) for full details and implementation.

## Best Practices

### Rapier 0.19+ Specific

1. **EventQueue Creation**: Always create EventQueue before first physics step
   ```javascript
   this.eventQueue = new RAPIER.EventQueue(true);
   this.world.step(this.eventQueue); // Required!
   ```

2. **Use Iterator Methods**: Use `forEachRigidBody()` instead of `world.bodies`
   ```javascript
   // ✅ Correct
   this.world.forEachRigidBody(body => { /* ... */ });
   // ❌ Wrong (0.14 API)
   this.world.bodies.forEach(body => { /* ... */ });
   ```

3. **Ground Detection After Movement**: Call ground detection AFTER `computeColliderMovement()`
   ```javascript
   characterController.computeColliderMovement(collider, desired);
   const corrected = characterController.computedMovement();
   this.updateGroundState(desired, corrected); // Order matters!
   ```

### General Best Practices

4. **Async Initialization**: Always initialize Rapier with `await RAPIER.init()` before creating a world.

5. **Body-Sprite Association**: Maintain a mapping between physics bodies and game objects for synchronization.

6. **Consistent Units**: Use consistent units for positions, sizes, and forces (WynIsBuff2 uses meters for physics, pixels for rendering).

7. **Performance Optimization**:
   - Use appropriate collision shapes (cuboid for rectangles, ball for circles)
   - Limit the number of dynamic bodies
   - Consider using sensor colliders for triggers that don't need physical response
   - Use fixed timestep (1/60) for deterministic physics

8. **Error Handling**: Wrap Rapier operations in try-catch blocks with circuit breakers (see [ERROR_HANDLING_LOGGING.md](../systems/ERROR_HANDLING_LOGGING.md))

9. **Movement Implementation**:
   - Use CharacterController for player movement
   - Apply appropriate friction when no movement keys are pressed
   - Balance movement speed with game scale and physics simulation

10. **Jumping Mechanics**:
    - Implement variable jump heights for more dynamic gameplay
    - Use "coyote time" (short grace period after leaving platform)
    - Scale jump forces appropriately with gravity settings

11. **Collision Detection**:
    - Use CharacterController for robust character collision
    - Consider velocity direction in ground detection
    - Implement small tolerance values (epsilon) for floating-point comparisons

## Common Issues and Solutions

1. **Physics Objects Not Moving**:
   - Ensure gravity is set correctly
   - Check that bodies are dynamic, not static
   - Verify forces are being applied correctly
   - Movement speed might be too low - increase velocity values

2. **Collision Detection Issues**:
   - Ensure colliders are properly sized
   - Check that colliders are attached to the correct bodies
   - Verify collision groups and filters if used
   - Implement more precise collision detection using object positions and dimensions

3. **Performance Problems**:
   - Reduce the number of physics bodies
   - Simplify collision shapes
   - Increase the time step for physics simulation

4. **Movement Feels Sluggish**:
   - Increase movement speed values
   - Implement acceleration for smoother movement
   - Reduce friction to allow for better momentum
   - Consider the scale of your game world when setting velocity values

5. **Jumping Feels Unresponsive**:
   - Increase jump force
   - Implement coyote time for more forgiving jump timing
   - Consider variable jump heights based on button press duration
   - Make multi-jumps (double/triple jumps) progressively stronger

## Resources

### Internal Documentation

- **[RAPIER_019_MIGRATION.md](./RAPIER_019_MIGRATION.md)** - Complete Rapier 0.19+ migration guide with breaking changes and fixes
- **[rapier-updated-api-research.md](../design/rapier-updated-api-research.md)** - Deep dive into Rapier's API evolution and character controller architectures
- **[PhysicsManager.js](../../src/core/PhysicsManager.js)** - Physics world management implementation
- **[PlayerController.js](../../src/modules/player/PlayerController.js)** - Player physics implementation
- **[ERROR_HANDLING_LOGGING.md](../systems/ERROR_HANDLING_LOGGING.md)** - Error handling patterns and circuit breakers

### External Resources

- [Rapier Official Documentation](https://rapier.rs/docs/)
- [Rapier JavaScript API Reference](https://rapier.rs/javascript2d/index.html)
- [Character Controller Guide](https://rapier.rs/docs/user_guides/javascript/character_controller/)
- [Scene Queries API](https://rapier.rs/docs/user_guides/javascript/scene_queries/)
- [Phaser Rapier Sandbox Examples](https://phaser.io/sandbox/full/ZhbGYVBa)
- [Rapier Connector Template](https://github.com/phaserjs/rapier-connector)
- [Rapier GitHub Repository](https://github.com/dimforge/rapier)