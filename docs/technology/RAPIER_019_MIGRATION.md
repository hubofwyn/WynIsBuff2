# Rapier 0.19+ API Migration Guide

**Critical Reference for WynIsBuff2 Physics Implementation**

This document is the authoritative guide for Rapier 0.19+ API changes and their implementation in WynIsBuff2. It details breaking changes, migration patterns, and workarounds discovered through actual implementation.

---

## Table of Contents

- [Overview](#overview)
- [Version Information](#version-information)
- [Breaking API Changes](#breaking-api-changes)
  - [1. EventQueue Requirement](#1-eventqueue-requirement)
  - [2. World Body Iteration](#2-world-body-iteration)
  - [3. Ground Detection](#3-ground-detection)
- [Migration Patterns](#migration-patterns)
- [Implementation in WynIsBuff2](#implementation-in-wynisbuff2)
- [Common Pitfalls](#common-pitfalls)
- [Testing and Validation](#testing-and-validation)
- [References](#references)

---

## Overview

Rapier 0.19+ introduced significant breaking changes to the JavaScript API. This guide documents:

1. **What changed** - Specific API removals and replacements
2. **Why it matters** - Impact on existing code
3. **How to fix** - Concrete migration patterns with code examples
4. **What we learned** - Implementation insights and debugging strategies

**Migration Status**: ✅ Complete (October 2025)

---

## Version Information

| Component            | Version                   | Status        |
| -------------------- | ------------------------- | ------------- |
| **Rapier Package**   | @dimforge/rapier2d-compat | Current       |
| **Target Version**   | 0.19+                     | Migrated ✅   |
| **Previous Version** | 0.14.0                    | Deprecated ❌ |
| **Phaser**           | 3.90.0                    | Compatible ✅ |

**Official Resources**:

- [Rapier Documentation](https://rapier.rs/docs/)
- [Rapier JavaScript API](https://rapier.rs/javascript2d/index.html)
- [Migration Announcements](https://github.com/dimforge/rapier/releases)

---

## Breaking API Changes

### 1. EventQueue Requirement

**The Change**: `world.step()` now requires an EventQueue parameter for collision event processing.

#### Before (0.14.0)

```javascript
// Configure integration parameters
const integrationParameters = {
    dt: fixedTimeStep,
    numSolverIterations: 8,
    // ...other params
};

// Step physics with parameters
this.world.step(integrationParameters);
```

#### After (0.19+)

```javascript
// Integration parameters now set on world object
this.world.integrationParameters.dt = fixedTimeStep;
this.world.integrationParameters.numSolverIterations = 8;

// EventQueue REQUIRED for collision events
this.eventQueue = new RAPIER.EventQueue(true);

// Step with EventQueue
this.world.step(this.eventQueue);
```

#### Why This Matters

- **Error**: `Error: expected instance of z` - cryptic error from minified Rapier code
- **Cause**: Passing wrong parameter type to `step()`
- **Impact**: Physics simulation crashes immediately

#### Implementation Location

- **File**: `src/core/PhysicsManager.js`
- **Init**: Lines 55-57 (EventQueue creation)
- **Configuration**: Lines 226-229 (integration parameters)
- **Step**: Line 234 (world.step call)
- **Event Processing**: Lines 239-263 (drainCollisionEvents)

---

### 2. World Body Iteration

**The Change**: `world.bodies` collection removed; use `world.forEachRigidBody()` iterator instead.

#### Before (0.14.0)

```javascript
// Iterate over bodies collection
this.world.bodies.forEach((rigidBody) => {
    const gameObject = rigidBody.userData;
    if (gameObject) {
        const position = rigidBody.translation();
        gameObject.x = position.x;
        gameObject.y = position.y;
    }
});
```

#### After (0.19+)

```javascript
// Use iterator method
this.world.forEachRigidBody((body) => {
    const sprite = this.bodyToSprite.get(body.handle);
    if (sprite) {
        const position = body.translation();
        sprite.x = position.x;
        sprite.y = position.y;
    }
});
```

#### Why This Matters

- **Error**: `TypeError: this.world.bodies.forEach is not a function`
- **Cause**: `world.bodies` doesn't exist in 0.19+
- **Impact**: Sprite synchronization fails; physics bodies move but sprites don't

#### Implementation Location

- **File**: `src/core/PhysicsManager.js`
- **Method**: `updateGameObjects()` at line 329

---

### 3. Ground Detection

**The Change**: `characterController.isGrounded()` and `numGroundedColliders` removed entirely.

#### Before (0.14.0)

```javascript
// Simple boolean method
updateGroundState() {
    this.isGrounded = this.characterController.isGrounded();
}

// OR property access
updateGroundState() {
    this.isGrounded = this.characterController.numGroundedColliders > 0;
}
```

#### After (0.19+)

```javascript
/**
 * Physics-based ground detection algorithm
 * Compares desired movement vs corrected movement after collision resolution
 */
updateGroundState(desiredMovement, correctedMovement) {
    const wasGrounded = this.isGrounded;

    // Detection heuristics:
    const GROUND_THRESHOLD = 0.01;

    // 1. Vertical blocking: falling movement was reduced by collisions
    const isFalling = this.velocity.y > 0; // Positive Y = down
    const verticalBlocked = isFalling &&
        Math.abs(correctedMovement.y) < Math.abs(desiredMovement.y) - GROUND_THRESHOLD;

    // 2. At rest: velocity near zero
    const atRest = Math.abs(this.velocity.y) < GROUND_THRESHOLD;

    this.isGrounded = verticalBlocked || atRest;

    // Handle coyote time
    if (wasGrounded && !this.isGrounded) {
        this.coyoteTimer = PhysicsConfig.gameFeel.coyoteTime;
    }
}
```

#### Why This Matters

- **Error**: `TypeError: this.characterController.isGrounded is not a function`
- **Then**: `TypeError: Cannot read properties of undefined (reading 'numGroundedColliders')`
- **Cause**: Both APIs completely removed from Rapier 0.19+
- **Impact**: Jumping completely broken; player can't detect landing

#### The Discovery Process

1. **First attempt**: Changed `isGrounded()` to `numGroundedColliders` property
2. **Result**: `undefined` (not even 0!)
3. **Introspection**: Checked `Object.keys(characterController)`:

    ```javascript
    [
        'params',
        'bodies',
        'colliders',
        'queries',
        'raw',
        'rawCharacterCollision',
        '_applyImpulsesToDynamicBodies',
        '_characterMass',
    ];
    ```

4. **Realization**: Ground detection API doesn't exist!
5. **Solution**: Implemented physics-based detection algorithm

#### Implementation Location

- **File**: `src/modules/player/PlayerController.js`
- **Method**: `updateGroundState()` at lines 347-381
- **Integration**: Called at line 237 AFTER `computeColliderMovement()`

---

## Migration Patterns

### Pattern 1: EventQueue Initialization

**When**: During physics world initialization

```javascript
async init(scene, eventSystem, gravityX, gravityY) {
    // 1. Initialize Rapier
    await RAPIER.init();

    // 2. Create world
    this.world = new RAPIER.World(new RAPIER.Vector2(gravityX, gravityY));

    // 3. Create EventQueue (REQUIRED in 0.19+)
    this.eventQueue = new RAPIER.EventQueue(true);

    // 4. Configure integration parameters on world object
    this.world.integrationParameters.dt = fixedTimeStep;
    this.world.integrationParameters.numSolverIterations = 8;
    this.world.integrationParameters.numAdditionalFrictionIterations = 2;
    this.world.integrationParameters.erp = 0.8;
}
```

### Pattern 2: Physics Step with Collision Events

**When**: Every frame in update loop

```javascript
update(delta) {
    // Step physics with EventQueue
    this.world.step(this.eventQueue);

    // Process collision events manually
    this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
        if (started) {
            // Get bodies
            const bodyA = this.world.getRigidBody(handle1);
            const bodyB = this.world.getRigidBody(handle2);

            if (bodyA && bodyB) {
                // Emit collision event
                this.eventSystem.emit(EventNames.COLLISION_START, {
                    bodyHandleA: handle1,
                    bodyHandleB: handle2,
                    positionA: bodyA.translation(),
                    positionB: bodyB.translation()
                });
            }
        }
    });
}
```

### Pattern 3: Body Iteration

**When**: Synchronizing sprites with physics bodies

```javascript
updateGameObjects() {
    // Use forEachRigidBody iterator
    this.world.forEachRigidBody(body => {
        const sprite = this.bodyToSprite.get(body.handle);

        if (sprite) {
            const position = body.translation();
            const rotation = body.rotation();

            // Meters to pixels conversion
            sprite.x = metersToPixels(position.x);
            sprite.y = metersToPixels(position.y);
            sprite.rotation = rotation;
        }
    });
}
```

### Pattern 4: Ground Detection Algorithm

**When**: After character controller movement computation

```javascript
// Calculate desired movement
const desiredMovement = new RAPIER.Vector2(dx, dy);

// Compute collision-corrected movement
this.characterController.computeColliderMovement(this.collider, desiredMovement);
const correctedMovement = this.characterController.computedMovement();

// Update ground state by comparing movements
this.updateGroundState(desiredMovement, correctedMovement);

// Apply corrected movement
const position = this.body.translation();
this.body.setTranslation(
    {
        x: position.x + correctedMovement.x,
        y: position.y + correctedMovement.y,
    },
    true
);
```

---

## Implementation in WynIsBuff2

### PhysicsManager Integration

**File**: `src/core/PhysicsManager.js`

```javascript
class PhysicsManager extends BaseManager {
    async init(scene, eventSystem, gravityX, gravityY) {
        await RAPIER.init();
        this.world = new RAPIER.World(new RAPIER.Vector2(gravityX, gravityY));

        // EventQueue for 0.19+
        this.eventQueue = new RAPIER.EventQueue(true);

        this._initialized = true;
    }

    update(delta) {
        // Configure integration parameters
        this.world.integrationParameters.dt = fixedTimeStep;
        this.world.integrationParameters.numSolverIterations = 8;

        // Step with EventQueue
        this.world.step(this.eventQueue);

        // Process collisions
        this.eventQueue.drainCollisionEvents((h1, h2, started) => {
            if (started) this.handleCollision(h1, h2);
        });

        // Update sprites
        this.updateGameObjects();
    }

    updateGameObjects() {
        this.world.forEachRigidBody((body) => {
            const sprite = this.bodyToSprite.get(body.handle);
            if (sprite) {
                const pos = body.translation();
                sprite.x = metersToPixels(pos.x);
                sprite.y = metersToPixels(pos.y);
            }
        });
    }
}
```

### PlayerController Integration

**File**: `src/modules/player/PlayerController.js`

```javascript
class PlayerController {
    update(deltaTime) {
        // Get input snapshot
        const inputState = this.inputManager.getSnapshot();

        // Calculate desired movement
        const desiredMovement = this.calculateMovementFromInput(inputState, dt);

        // Compute collision-corrected movement
        this.characterController.computeColliderMovement(this.collider, desiredMovement);
        const correctedMovement = this.characterController.computedMovement();

        // Update ground state (physics-based detection)
        this.updateGroundState(desiredMovement, correctedMovement);

        // Apply movement
        const position = this.body.translation();
        this.body.setTranslation(
            {
                x: position.x + correctedMovement.x,
                y: position.y + correctedMovement.y,
            },
            true
        );
    }

    updateGroundState(desired, corrected) {
        const THRESHOLD = 0.01;
        const isFalling = this.velocity.y > 0;
        const blocked = isFalling && Math.abs(corrected.y) < Math.abs(desired.y) - THRESHOLD;
        const atRest = Math.abs(this.velocity.y) < THRESHOLD;

        this.isGrounded = blocked || atRest;
    }
}
```

---

## Common Pitfalls

### Pitfall 1: Forgetting EventQueue

**Symptom**: `Error: expected instance of z`

**Cause**: Passing integration parameters directly to `step()`

**Fix**: Create EventQueue and pass it to `step()`

```javascript
// ❌ WRONG (0.14 pattern)
this.world.step({ dt: 1 / 60 });

// ✅ CORRECT (0.19+ pattern)
this.eventQueue = new RAPIER.EventQueue(true);
this.world.step(this.eventQueue);
```

### Pitfall 2: Using world.bodies

**Symptom**: `TypeError: this.world.bodies.forEach is not a function`

**Cause**: `world.bodies` collection doesn't exist

**Fix**: Use `forEachRigidBody()` iterator

```javascript
// ❌ WRONG (0.14 pattern)
this.world.bodies.forEach((body) => {
    /* ... */
});

// ✅ CORRECT (0.19+ pattern)
this.world.forEachRigidBody((body) => {
    /* ... */
});
```

### Pitfall 3: Assuming Ground Detection Exists

**Symptom**: `TypeError: isGrounded is not a function` or `numGroundedColliders is undefined`

**Cause**: Ground detection APIs completely removed

**Fix**: Implement physics-based detection

```javascript
// ❌ WRONG (0.14 pattern)
this.isGrounded = this.characterController.isGrounded();
// OR
this.isGrounded = this.characterController.numGroundedColliders > 0;

// ✅ CORRECT (0.19+ pattern)
// Compare desired vs corrected movement
const blocked = Math.abs(corrected.y) < Math.abs(desired.y);
const atRest = Math.abs(velocity.y) < 0.01;
this.isGrounded = blocked || atRest;
```

### Pitfall 4: Wrong updateGroundState Call Order

**Symptom**: Ground detection always false, jumping doesn't work

**Cause**: Calling `updateGroundState()` BEFORE `computeColliderMovement()`

**Fix**: Call AFTER to get corrected movement

```javascript
// ❌ WRONG - No corrected movement yet
this.updateGroundState();
this.characterController.computeColliderMovement(collider, desired);

// ✅ CORRECT - Compare movements after collision resolution
this.characterController.computeColliderMovement(collider, desired);
const corrected = this.characterController.computedMovement();
this.updateGroundState(desired, corrected);
```

---

## Testing and Validation

### Validation Checklist

- [ ] **Physics Step**: No "expected instance of z" errors
- [ ] **Sprite Sync**: Sprites follow physics bodies correctly
- [ ] **Ground Detection**: Player can jump when grounded
- [ ] **Landing**: Player detects landing and can jump again
- [ ] **Collision Events**: Collision events fire correctly
- [ ] **Performance**: Physics runs at 60 FPS without errors

### Debug Logging

Add these logs to verify migration:

```javascript
// Verify EventQueue creation
console.log('[PhysicsManager] Event queue created:', !!this.eventQueue);

// Verify body iteration
let bodyCount = 0;
this.world.forEachRigidBody((body) => bodyCount++);
console.log('[PhysicsManager] Bodies synced:', bodyCount);

// Verify ground detection
console.log('[PlayerController] Ground Detection:', {
    isGrounded: this.isGrounded,
    desiredY: desiredMovement.y,
    correctedY: correctedMovement.y,
    velocityY: this.velocity.y,
});
```

### Performance Metrics

Expected performance after migration:

- **Physics step**: < 4ms per frame
- **Collision detection**: < 2ms per frame
- **Sprite sync**: < 1ms per frame
- **Total physics**: < 7ms per frame (target: 16.67ms @ 60 FPS)

---

## References

### Internal Documentation

- [PhysicsManager.js](../../src/core/PhysicsManager.js) - Physics world management
- [PlayerController.js](../../src/modules/player/PlayerController.js) - Player physics
- [ERROR_HANDLING_LOGGING.md](../systems/ERROR_HANDLING_LOGGING.md) - Error handling patterns
- [RapierPhysics.md](./RapierPhysics.md) - Rapier integration guide
- [MovementSystem.md](../systems/MovementSystem.md) - Movement implementation
- [ModularPlayerController.md](../systems/ModularPlayerController.md) - Player architecture

### External Resources

- [Rapier 0.19 Release Notes](https://github.com/dimforge/rapier/releases)
- [Rapier JavaScript API Documentation](https://rapier.rs/javascript2d/index.html)
- [Rapier Migration Guide](https://rapier.rs/docs/user_guides/javascript/migration/)
- [Phaser + Rapier Examples](https://phaser.io/sandbox/full/ZhbGYVBa)

---

## Maintenance

**Last Updated**: October 29, 2025
**Migration Status**: Complete ✅
**Validated By**: Comprehensive testing and console log analysis
**Next Review**: When Rapier releases next major version

**Maintainers**: This is a living document. Update when:

- New Rapier breaking changes discovered
- Additional migration patterns identified
- Performance optimizations found
- New pitfalls encountered

---

**Related Documentation**:

- Previous: [RapierPhysics.md](./RapierPhysics.md) - General Rapier integration
- Next: [ERROR_HANDLING_LOGGING.md](../systems/ERROR_HANDLING_LOGGING.md) - Error handling
- See Also: [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
