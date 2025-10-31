# Movement System Documentation

**Current Implementation**: Rapier 0.19+ with KinematicCharacterController
**Status**: Modern physics-based approach (October 2025)

**⚠️ Note**: This document contains historical implementation patterns alongside current approaches. For Rapier 0.19+ specific details, see:

- [RAPIER_019_MIGRATION.md](../technology/RAPIER_019_MIGRATION.md) - API migration guide
- [RapierPhysics.md](../technology/RapierPhysics.md) - Current Rapier integration patterns
- [PlayerController.js](../../src/modules/player/PlayerController.js) - Current implementation

## Table of Contents

- [Overview](#overview)
- [Modern Implementation (Current)](#modern-implementation-current)
    - [Character Controller Approach](#character-controller-approach)
    - [Physics-Based Ground Detection](#physics-based-ground-detection)
- [Implementation Details (Historical)](#implementation-details-historical)
    - [Player Movement](#player-movement)
    - [Jumping Mechanics](#jumping-mechanics)
    - [Collision Detection](#collision-detection)
- [Improvements Made](#improvements-made)
- [Lessons Learned](#lessons-learned)
- [Future Enhancements](#future-enhancements)

## Overview

The movement system in WynIsBuff2 handles player movement, jumping, and ground detection using Rapier physics engine integrated with Phaser.

### Current Architecture (October 2025)

WynIsBuff2 uses **Rapier's KinematicCharacterController** for robust player movement with physics-based ground detection. This replaces earlier manual collision detection approaches.

**Key Components**:

- `PlayerController.js` - Coordinates character movement and physics
- `PhysicsManager.js` - Manages Rapier world and collision events
- `InputManager.js` - Clean input snapshot system

**See Also**: [ModularPlayerController.md](./ModularPlayerController.md) for complete architecture details.

---

## Modern Implementation (Current)

### Character Controller Approach

WynIsBuff2 uses Rapier's **KinematicCharacterController** for player movement:

```javascript
// Create character controller with offset for stability
this.characterController = world.createCharacterController(0.01);

// Configure features
this.characterController.enableAutostep(0.5, 0.2, true);
this.characterController.enableSnapToGround(0.3);

// Each frame: compute collision-corrected movement
const desiredMovement = new RAPIER.Vector2(dx, dy);
this.characterController.computeColliderMovement(this.collider, desiredMovement);
const correctedMovement = this.characterController.computedMovement();
```

**Benefits**:

- Automatic slope handling
- Step climbing
- Smooth wall sliding
- Snap-to-ground for better "feel"

### Physics-Based Ground Detection

**⚠️ Critical**: `isGrounded()` and `numGroundedColliders` were **removed in Rapier 0.19+**.

**Modern approach** - Compare desired vs corrected movement:

```javascript
updateGroundState(desiredMovement, correctedMovement) {
    const GROUND_THRESHOLD = 0.01;

    // Check if falling movement was blocked
    const isFalling = this.velocity.y > 0;
    const verticalBlocked = isFalling &&
        Math.abs(correctedMovement.y) < Math.abs(desiredMovement.y) - GROUND_THRESHOLD;

    // Check if at rest
    const atRest = Math.abs(this.velocity.y) < GROUND_THRESHOLD;

    this.isGrounded = verticalBlocked || atRest;
}
```

**Why this works**: When the character controller resolves collisions, it reduces downward movement if the ground blocks it. By comparing what we wanted vs. what we got, we can infer ground contact.

**See**: [RAPIER_019_MIGRATION.md#3-ground-detection](../technology/RAPIER_019_MIGRATION.md#3-ground-detection) for complete details.

---

## Implementation Details (Historical)

**Note**: The following sections describe earlier implementation approaches. They provide context for evolution but may not reflect current code.

### Player Movement

Player movement is implemented in the `handlePlayerMovement` method in the Game scene:

```javascript
handlePlayerMovement() {
    try {
        // Only proceed if player body exists
        if (!this.playerBody) return;

        const moveSpeed = 8; // Increased from 3 to 8 for faster movement
        const acceleration = 0.5; // Acceleration factor for smoother movement
        const friction = 0.85; // Slightly increased friction for better control
        let vx = 0;

        // Check WASD keys first
        if (this.wasd.left.isDown) {
            vx = -moveSpeed;
        } else if (this.wasd.right.isDown) {
            vx = moveSpeed;
        }

        // If WASD isn't pressed, check arrow keys
        if (vx === 0) {
            if (this.cursors.left.isDown) {
                vx = -moveSpeed;
            } else if (this.cursors.right.isDown) {
                vx = moveSpeed;
            }
        }

        // Get current velocity to preserve y-component
        const currentVel = this.playerBody.linvel();

        // Set the new velocity with acceleration for smoother movement
        if (vx !== 0) {
            // Apply acceleration instead of setting velocity directly
            const targetVel = vx;
            const newVelX = currentVel.x + (targetVel - currentVel.x) * acceleration;
            this.playerBody.setLinvel({ x: newVelX, y: currentVel.y }, true);
        } else {
            // Apply improved friction when no keys are pressed
            this.playerBody.setLinvel({ x: currentVel.x * friction, y: currentVel.y }, true);
        }
    } catch (error) {
        console.error('[Game] Error in handlePlayerMovement:', error);
    }
}
```

Key components:

- **Movement Speed**: Controls how fast the player moves horizontally
- **Acceleration**: Smooths out movement by gradually changing velocity
- **Friction**: Controls how quickly the player slows down when no keys are pressed

### Jumping Mechanics

Jumping is implemented in the `handleJumping` method:

```javascript
handleJumping() {
    try {
        // Only proceed if player body exists
        if (!this.playerBody) return;

        // If player is on the ground, reset jump count
        if (this.isOnGround) {
            this.jumpsUsed = 0;
        }

        // Check for jump input from SPACE, W, or UP arrow
        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.up);

        if (jumpPressed) {
            if (this.isOnGround || this.jumpsUsed < this.maxJumps) {
                const currentVel = this.playerBody.linvel();

                // Vary jump force based on which jump it is
                let jumpForce = -15; // Increased base jump force from -12 to -15

                // Make subsequent jumps more powerful for better triple jump feel
                if (this.jumpsUsed === 1) {
                    jumpForce = -16; // Second jump slightly stronger
                } else if (this.jumpsUsed === 2) {
                    jumpForce = -17; // Third jump even stronger
                }

                // Apply the jump force
                this.playerBody.setLinvel({ x: currentVel.x, y: jumpForce }, true);
                this.jumpsUsed++;

                // Visual feedback code...
            }
        }

        // Update jump text and reset color when on ground...
    } catch (error) {
        console.error('[Game] Error in handleJumping:', error);
    }
}
```

Key components:

- **Jump Force**: Controls how high the player jumps
- **Triple Jump**: Player can jump up to three times before needing to touch ground
- **Variable Jump Heights**: Each successive jump has a slightly stronger force
- **Visual Feedback**: Player color changes based on jump number

### Collision Detection

Ground detection is implemented in the `processCollisions` method:

```javascript
processCollisions() {
    try {
        // Reset ground state at the beginning of each frame
        this.isOnGround = false;

        // Only proceed if player body exists
        if (!this.playerBody) return;

        // Get player position and velocity
        const playerPos = this.playerBody.translation();
        const playerVel = this.playerBody.linvel();

        // Player dimensions (from createPlayer)
        const playerHeight = 32;
        const playerWidth = 32;
        const playerFeet = playerPos.y + (playerHeight / 2) - 2; // Position of player's feet with small offset

        // Improved ground collision check
        // Check if player's feet are close to any platform
        for (const platform of this.platforms) {
            const platformPos = platform.body.translation();
            const platformWidth = 200; // From platform creation
            const platformHeight = 20; // From platform creation
            const platformTop = platformPos.y - (platformHeight / 2);

            // More precise collision check
            // 1. Player must be within the platform width
            // 2. Player's feet must be very close to the platform top
            // 3. Player must be moving downward or stationary (not jumping up)
            if (Math.abs(playerPos.x - platformPos.x) < (platformWidth / 2) - 5 && // Within platform width with margin
                Math.abs(playerFeet - platformTop) < 5 && // Very close to platform top
                playerVel.y >= 0) { // Moving down or stationary
                this.isOnGround = true;
                break;
            }
        }

        // Check if on the main ground with improved precision
        const groundTop = 700 - 25; // Ground Y (700) minus half height (50/2)
        if (playerFeet >= groundTop - 5 && playerVel.y >= 0) { // Close to ground top and moving down or stationary
            this.isOnGround = true;
        }

        // Add a small coyote time (grace period after leaving platform)
        if (!this.isOnGround && this._lastOnGround) {
            if (!this._coyoteTimer) {
                this._coyoteTimer = this.time.addEvent({
                    delay: 100, // 100ms coyote time
                    callback: () => {
                        this._coyoteTimer = null;
                    }
                });
                // Still considered on ground during coyote time
                this.isOnGround = true;
            }
        } else if (this.isOnGround) {
            // Reset coyote timer when on ground
            if (this._coyoteTimer) {
                this._coyoteTimer.remove();
                this._coyoteTimer = null;
            }
        }

        // Store ground state for next frame
        this._lastOnGround = this.isOnGround;
    } catch (error) {
        console.error('[Game] Error in processCollisions:', error);
    }
}
```

Key components:

- **Precise Collision Detection**: Uses player and platform dimensions for accurate detection
- **Velocity-Based Detection**: Considers player's vertical velocity for better ground detection
- **Coyote Time**: Provides a short grace period after leaving a platform where the player can still jump

## Improvements Made

The following improvements were made to the movement system:

1. **Increased Movement Speed**:
    - Increased base movement speed from 3 to 8
    - Added acceleration (0.5) for smoother movement transitions
    - Adjusted friction from 0.9 to 0.85 for better control

2. **Enhanced Jumping**:
    - Increased base jump force from -12 to -15
    - Implemented progressive jump forces for triple jumps (-15, -16, -17)
    - Added visual feedback for jump states

3. **Improved Collision Detection**:
    - Implemented more precise platform collision checks using actual dimensions
    - Added velocity-based ground detection
    - Implemented small tolerance values (5 pixels) for more forgiving gameplay
    - Added coyote time (100ms) for better jump feel

## Lessons Learned

### Rapier 0.19+ Migration (October 2025)

1. **API Evolution**:
    - Breaking changes in physics engines are inevitable
    - Don't rely on undocumented properties like `numGroundedColliders`
    - Use official high-level APIs (CharacterController) for future-proofing

2. **Ground Detection**:
    - Simple boolean checks (`.isGrounded()`) hide important physics details
    - Physics-based detection (comparing desired vs corrected movement) is more robust
    - Call timing matters: update ground state AFTER `computeColliderMovement()`

3. **Debugging Strategies**:
    - Property introspection (`Object.keys()`) reveals actual available APIs
    - Console log analysis with state dumps identifies root causes quickly
    - Circuit breakers prevent infinite error loops during debugging

### General Movement (Historical)

4. **Movement Speed Calibration**:
    - Initial movement speed (3) was too slow for satisfying gameplay
    - Direct velocity setting feels abrupt; acceleration provides smoother movement
    - Movement speed must be balanced with the game's scale and physics simulation

5. **Jump Mechanics**:
    - Jump force needs to be proportional to gravity and game scale
    - Variable jump heights add depth to platforming mechanics
    - Visual feedback helps players understand the triple jump system

6. **Collision Detection**:
    - CharacterController is more reliable than manual position checks
    - Considering velocity direction improves ground detection accuracy
    - Coyote time significantly improves the feel of platforming games

## Future Enhancements

Potential future improvements to the movement system:

1. **Variable Jump Height Based on Button Press Duration**:
    - Implement shorter jumps when the jump button is tapped
    - Allow higher jumps when the button is held longer

2. **Wall Jumping/Sliding**:
    - Detect wall collisions
    - Allow players to slide down walls and jump off them

3. **Momentum-Based Movement**:
    - Implement more realistic acceleration and deceleration
    - Add air control limitations when the player is not on the ground

4. **Advanced Collision System**:
    - Use Rapier's built-in collision events for more accurate detection
    - Implement one-way platforms that can be jumped through from below

5. **Animation Integration**:
    - Add running, jumping, and falling animations
    - Implement animation transitions based on movement state
