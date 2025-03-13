# Rapier Physics Engine Integration

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

## Version Information

- **Package**: @dimforge/rapier2d-compat
- **Version**: 0.14.0
- **Official Documentation**: https://rapier.rs/docs/
- **GitHub Repository**: https://github.com/dimforge/rapier

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

Rapier must be initialized asynchronously before use:

```javascript
async create() {
    // Initialize Rapier
    await RAPIER.init();
    
    // Create physics world with gravity
    this.rapierWorld = new RAPIER.World(new RAPIER.Vector2(0.0, 9.81));
}
```

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

The physics world is stepped forward in the update loop, and game objects are synchronized with their physics bodies:

```javascript
update() {
    // Step the physics simulation
    this.rapierWorld.step();
    
    // Update all sprites based on their physics bodies
    this.rapierWorld.bodies.forEach(body => {
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

### Collision Detection

WynIsBuff2 uses a simplified approach to collision detection for ground contact:

```javascript
processCollisions() {
    // Reset ground state
    this.isOnGround = false;
    
    // Get player position
    const playerPos = this.playerBody.translation();
    
    // Check if player is on any platform
    for (const platform of this.platforms) {
        const platformPos = platform.body.translation();
        
        if (Math.abs(playerPos.x - platformPos.x) < 100 && 
            Math.abs(playerPos.y - platformPos.y) < 30) {
            this.isOnGround = true;
            break;
        }
    }
    
    // Check if on the main ground
    if (playerPos.y >= 680) {
        this.isOnGround = true;
    }
}
```

## Best Practices

1. **Async Initialization**: Always initialize Rapier with `await RAPIER.init()` before creating a world.

2. **Body-Sprite Association**: Maintain a mapping between physics bodies and game objects for synchronization.

3. **Consistent Units**: Use consistent units for positions, sizes, and forces.

4. **Performance Optimization**:
   - Use appropriate collision shapes (cuboid for rectangles, ball for circles)
   - Limit the number of dynamic bodies
   - Consider using sensor colliders for triggers that don't need physical response

5. **Error Handling**: Wrap Rapier operations in try-catch blocks to handle potential errors.

6. **Movement Implementation**:
   - Use acceleration rather than direct velocity setting for smoother movement
   - Apply appropriate friction when no movement keys are pressed
   - Balance movement speed with game scale and physics simulation

7. **Jumping Mechanics**:
   - Implement variable jump heights for more dynamic gameplay
   - Consider using "coyote time" (a short grace period after leaving a platform where the player can still jump)
   - Scale jump forces appropriately with gravity settings

8. **Collision Detection**:
   - Use precise collision checks based on object dimensions
   - Consider velocity direction in ground detection
   - Implement small tolerance values for more forgiving gameplay

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

- [Rapier Official Documentation](https://rapier.rs/docs/)
- [Rapier JavaScript API Reference](https://rapier.rs/javascript3d/index.html)
- [Phaser Rapier Sandbox Examples](https://phaser.io/sandbox/full/ZhbGYVBa)
- [Rapier Connector Template](https://github.com/phaserjs/rapier-connector)