import { EventNames } from '../../constants/EventNames';

/**
 * JumpController class handles all jump-related functionality for the player
 * including jump physics, buffering, variable height, and state tracking.
 */
export class JumpController {
    /**
     * Create a new JumpController
     * @param {Phaser.Scene} scene - The scene this controller belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        
        // Jump state
        this.jumpsUsed = 0;
        this.maxJumps = 3;
        this.jumpState = 'grounded'; // 'grounded', 'rising', 'peak', 'falling'
        this.isOnGround = false;
        
        // Jump tracking variables
        this._jumpBufferTimer = null;
        this._jumpKeyHeld = false;
        this._jumpReleased = false;
        this._currentJumpNumber = 0;
        this._lastVelocityY = 0;
        this._landingRecoveryTimer = null;
        this._isInLandingRecovery = false;
        this._coyoteTimer = null;
        this._lastOnGround = false;
        
        // Jump physics parameters
        this.jumpParams = {
            baseForce: -45,          // Base jump force
            releaseMultiplier: 0.5,  // Multiplier when jump key is released early
            minJumpTime: 100,        // Minimum jump time in ms
            bufferTime: 150,         // Jump buffer time in ms
            landingRecoveryTime: 80, // Landing recovery time in ms
            coyoteTime: 100,         // Coyote time in ms
            
            // Jump forces for each jump
            forces: {
                1: -45, // First jump
                2: -50, // Second jump
                3: -55  // Third jump
            },
            
            // Horizontal boost parameters
            horizontalBoost: {
                threshold: 0.5,      // Minimum horizontal velocity to apply boost
                multiplier: 1.5      // Boost multiplier
            },
            
            // Additional impulse parameters
            additionalImpulse: {
                x: 0,
                y: -15
            }
        };
        
        console.log('[JumpController] Initialized');
    }
    
    /**
     * Update method called every frame
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     * @param {object} input - Input state object with jump key states
     */
    update(body, sprite, input) {
        if (!body) return;
        
        // Update jump state based on velocity
        this.updateJumpState(body, sprite);
        
        // Track jump key state
        this.trackJumpKeyState(input);
        
        // Handle jump input
        this.handleJumpInput(body, sprite, input);
    }
    
    /**
     * Set ground state
     * @param {boolean} isOnGround - Whether the player is on the ground
     */
    setGroundState(isOnGround) {
        // Store previous ground state
        const wasOnGround = this._lastOnGround;
        
        // Update ground state
        this.isOnGround = isOnGround;
        
        // Handle coyote time
        this.handleCoyoteTime();
        
        // Handle landing
        if (!wasOnGround && this.isOnGround) {
            this.handleLanding();
        }
        
        // Reset jump count when on ground
        if (this.isOnGround) {
            this.jumpsUsed = 0;
        }
        
        // Store ground state for next frame
        this._lastOnGround = this.isOnGround;
    }
    
    /**
     * Handle coyote time (grace period after leaving platform)
     */
    handleCoyoteTime() {
        // Add a small coyote time (grace period after leaving platform)
        if (!this.isOnGround && this._lastOnGround) {
            if (!this._coyoteTimer) {
                this._coyoteTimer = this.scene.time.addEvent({
                    delay: this.jumpParams.coyoteTime,
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
            
            // Execute buffered jump if there is one
            if (this._jumpBufferTimer && !this._isInLandingRecovery) {
                this.executeJump();
                this._jumpBufferTimer.remove();
                this._jumpBufferTimer = null;
            }
        }
    }
    
    /**
     * Handle landing event
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     */
    handleLanding(body, sprite) {
        if (!body || !sprite) return;
        
        // Start landing recovery timer
        this._isInLandingRecovery = true;
        this._landingRecoveryTimer = this.scene.time.delayedCall(
            this.jumpParams.landingRecoveryTime,
            () => {
                this._isInLandingRecovery = false;
                this._landingRecoveryTimer = null;
            }
        );
        
        // Apply a small squash effect on landing
        this.applySquashEffect(sprite, 1.2, 0.8, 100);
        
        // Get position and velocity for event data
        const position = body.translation();
        const velocity = body.linvel();
        
        // Emit the land event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_LAND, {
                position: {
                    x: position.x,
                    y: position.y
                },
                velocity: {
                    x: velocity.x,
                    y: velocity.y
                },
                sprite: sprite
            });
            
            // Also emit the land impact event for effects
            this.eventSystem.emit(EventNames.PLAYER_LAND_IMPACT, {
                position: {
                    x: position.x,
                    y: position.y
                },
                velocity: {
                    x: velocity.x,
                    y: velocity.y
                },
                impactForce: Math.min(Math.abs(velocity.y) / 20, 2), // Cap at 2x
                sprite: sprite
            });
        }
        
        // Reset jump state
        this.jumpState = 'grounded';
        this._currentJumpNumber = 0;
    }
    
    /**
     * Track jump key state for variable jump height
     * @param {object} input - Input state object with jump key states
     */
    trackJumpKeyState(input) {
        // Check if any jump key is held
        const jumpKeyDown = 
            input.spaceKey.isDown || 
            input.wasd.up.isDown || 
            input.cursors.up.isDown;
        
        // Track when jump key is released during a jump
        if (this._jumpKeyHeld && !jumpKeyDown && this.jumpState === 'rising') {
            this._jumpReleased = true;
            
            // Apply variable jump height by cutting the upward velocity
            if (this.body && this._jumpReleased) {
                const currentVel = this.body.linvel();
                if (currentVel.y < 0) {
                    // Only reduce velocity if still moving upward
                    this.body.setLinvel({
                        x: currentVel.x,
                        y: currentVel.y * this.jumpParams.releaseMultiplier
                    }, true);
                }
            }
        }
        
        // Update jump key held state
        this._jumpKeyHeld = jumpKeyDown;
    }
    
    /**
     * Handle jump input
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     * @param {object} input - Input state object with jump key states
     */
    handleJumpInput(body, sprite, input) {
        if (!body) return;
        
        // Check for jump input from SPACE, W, or UP arrow
        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(input.spaceKey) ||
            Phaser.Input.Keyboard.JustDown(input.wasd.up) ||
            Phaser.Input.Keyboard.JustDown(input.cursors.up);
        
        if (jumpPressed) {
            // If on ground or have jumps left, execute jump immediately
            if (this.isOnGround || this.jumpsUsed < this.maxJumps) {
                this.executeJump(body, sprite);
            } else {
                // Otherwise, buffer the jump for a short time
                this.bufferJump();
            }
        }
    }
    
    /**
     * Buffer a jump for a short time
     */
    bufferJump() {
        // Clear any existing buffer timer
        if (this._jumpBufferTimer) {
            this._jumpBufferTimer.remove();
        }
        
        // Create a new buffer timer
        this._jumpBufferTimer = this.scene.time.delayedCall(
            this.jumpParams.bufferTime,
            () => {
                this._jumpBufferTimer = null;
            }
        );
    }
    
    /**
     * Execute a jump
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     */
    executeJump(body, sprite) {
        if (!body || !sprite) return;
        
        const currentVel = body.linvel();
        
        // Determine which jump this is (first, second, or third)
        const jumpNumber = this.isOnGround ? 1 : this.jumpsUsed + 1;
        
        // Get the appropriate jump force
        let jumpForce = this.jumpParams.forces[jumpNumber] || this.jumpParams.baseForce;
        
        // Add horizontal boost when jumping while moving
        let jumpBoostX = currentVel.x;
        if (Math.abs(currentVel.x) > this.jumpParams.horizontalBoost.threshold) {
            // Boost in the direction of movement
            jumpBoostX = currentVel.x * this.jumpParams.horizontalBoost.multiplier;
        }
        
        // Apply the jump force with horizontal boost
        body.setLinvel({ x: jumpBoostX, y: jumpForce }, true);
        
        // Add a stronger upward impulse for extra "pop" feeling
        body.applyImpulse({
            x: this.jumpParams.additionalImpulse.x,
            y: this.jumpParams.additionalImpulse.y
        }, true);
        
        // Apply a stretch effect
        this.applySquashEffect(sprite, 0.8, 1.2, 100);
        
        // Update jump state
        this.jumpsUsed = jumpNumber;
        this._currentJumpNumber = jumpNumber;
        this.jumpState = 'rising';
        this._jumpKeyHeld = true;
        this._jumpReleased = false;
        
        // Emit jump event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_JUMP, {
                jumpsUsed: this.jumpsUsed,
                maxJumps: this.maxJumps,
                position: {
                    x: body.translation().x,
                    y: body.translation().y
                },
                velocity: {
                    x: jumpBoostX,
                    y: jumpForce
                },
                jumpNumber: this.jumpsUsed,
                sprite: sprite
            });
            
            // Also emit jump start event
            this.eventSystem.emit(EventNames.PLAYER_JUMP_START, {
                position: {
                    x: body.translation().x,
                    y: body.translation().y
                },
                jumpNumber: this._currentJumpNumber,
                velocity: {
                    x: jumpBoostX,
                    y: jumpForce
                },
                sprite: sprite
            });
        }
    }
    
    /**
     * Update jump state based on velocity changes
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     */
    updateJumpState(body, sprite) {
        if (!body || !sprite) return;
        
        const currentVel = body.linvel();
        const previousVel = this._lastVelocityY;
        
        // Only track jump state if we're in the air and have used jumps
        if (!this.isOnGround && this._currentJumpNumber > 0) {
            // Detect rising to peak transition
            if (this.jumpState === 'rising' && currentVel.y >= -2 && currentVel.y <= 2) {
                this.jumpState = 'peak';
                
                // Emit jump peak event
                if (this.eventSystem) {
                    this.eventSystem.emit(EventNames.PLAYER_JUMP_PEAK, {
                        position: {
                            x: body.translation().x,
                            y: body.translation().y
                        },
                        jumpNumber: this._currentJumpNumber,
                        sprite: sprite
                    });
                }
            }
            // Detect peak to falling transition
            else if (this.jumpState === 'peak' && currentVel.y > 2) {
                this.jumpState = 'falling';
                
                // Emit jump fall event
                if (this.eventSystem) {
                    this.eventSystem.emit(EventNames.PLAYER_JUMP_FALL, {
                        position: {
                            x: body.translation().x,
                            y: body.translation().y
                        },
                        jumpNumber: this._currentJumpNumber,
                        velocity: {
                            x: currentVel.x,
                            y: currentVel.y
                        },
                        sprite: sprite
                    });
                }
            }
            // Detect rising state if velocity is significantly upward
            else if (this.jumpState === 'grounded' && currentVel.y < -5) {
                this.jumpState = 'rising';
            }
        }
        
        // Store current velocity for next frame
        this._lastVelocityY = currentVel.y;
    }
    
    /**
     * Apply a squash and stretch effect to the sprite
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The sprite
     * @param {number} squashX - X scale factor for squash
     * @param {number} squashY - Y scale factor for squash
     * @param {number} duration - Effect duration in ms
     */
    applySquashEffect(sprite, squashX, squashY, duration) {
        if (!sprite) return;
        
        // Store original scale
        const originalScaleX = sprite.scaleX || 1;
        const originalScaleY = sprite.scaleY || 1;
        
        // Apply squash
        sprite.setScale(originalScaleX * squashX, originalScaleY * squashY);
        
        // Return to normal over duration
        this.scene.tweens.add({
            targets: sprite,
            scaleX: originalScaleX,
            scaleY: originalScaleY,
            duration: duration,
            ease: 'Elastic.Out'
        });
    }
    
    /**
     * Get the current jump state
     * @returns {object} Jump state information
     */
    getJumpState() {
        return {
            jumpsUsed: this.jumpsUsed,
            maxJumps: this.maxJumps,
            jumpState: this.jumpState,
            isOnGround: this.isOnGround,
            isInLandingRecovery: this._isInLandingRecovery,
            currentJumpNumber: this._currentJumpNumber
        };
    }
    
    /**
     * Clean up resources when scene is shut down
     */
    shutdown() {
        // Clear any active timers
        if (this._jumpBufferTimer) {
            this._jumpBufferTimer.remove();
            this._jumpBufferTimer = null;
        }
        
        if (this._landingRecoveryTimer) {
            this._landingRecoveryTimer.remove();
            this._landingRecoveryTimer = null;
        }
        
        if (this._coyoteTimer) {
            this._coyoteTimer.remove();
            this._coyoteTimer = null;
        }
    }
}