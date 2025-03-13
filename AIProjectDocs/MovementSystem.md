# Movement System Documentation

## Table of Contents
- [Overview](#overview)
- [Implementation Details](#implementation-details)
  - [Player Movement](#player-movement)
  - [Jumping Mechanics](#jumping-mechanics)
  - [Collision Detection](#collision-detection)
- [Improvements Made](#improvements-made)
- [Lessons Learned](#lessons-learned)
- [Future Enhancements](#future-enhancements)

## Overview

The movement system in WynIsBuff2 handles player movement, jumping, and ground detection using the Rapier physics engine integrated with Phaser. This document outlines the implementation details, recent improvements, and lessons learned during development.

## Implementation Details

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

1. **Movement Speed Calibration**:
   - Initial movement speed (3) was too slow for satisfying gameplay
   - Direct velocity setting feels abrupt; acceleration provides smoother movement
   - Movement speed must be balanced with the game's scale and physics simulation

2. **Jump Mechanics**:
   - Jump force needs to be proportional to gravity and game scale
   - Variable jump heights add depth to platforming mechanics
   - Visual feedback helps players understand the triple jump system

3. **Collision Detection**:
   - Simple distance-based collision checks are insufficient for precise platforming
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