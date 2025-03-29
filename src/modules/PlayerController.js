import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../constants/EventNames';

/**
 * PlayerController class handles all player-related functionality including
 * movement, jumping, and physics interactions.
 */
export class PlayerController {
    /**
     * Create a new PlayerController
     * @param {Phaser.Scene} scene - The scene this controller belongs to
     * @param {RAPIER.World} world - The Rapier physics world
     * @param {EventSystem} eventSystem - The event system for communication
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     */
    constructor(scene, world, eventSystem, x = 512, y = 300) {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;
        
        // Player state
        this.body = null;
        this.sprite = null;
        this.collider = null;
        this.isOnGround = false;
        this.jumpsUsed = 0;
        this.maxJumps = 3;
        this.jumpState = 'grounded'; // 'grounded', 'rising', 'peak', 'falling'
        
        // Movement tracking variables
        this._lastMoveDir = 'none';
        this._lastOnGround = false;
        this._coyoteTimer = null;
        this._jumpBufferTimer = null;
        this._jumpKeyHeld = false;
        this._jumpReleased = false;
        this._currentJumpNumber = 0;
        this._lastVelocityY = 0;
        this._landingRecoveryTimer = null;
        this._isInLandingRecovery = false;
        
        // Jump physics parameters
        this.jumpParams = {
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
            },
            
            // Air control parameters
            airControl: {
                acceleration: 0.6,   // Air acceleration factor (0-1)
                maxSpeed: 30,        // Maximum air speed
                directionChangeFactor: 1.2 // Direction change factor in air
            }
        };
        
        // Create the player at the specified position
        this.create(x, y);
        
        // Set up input handlers
        this.setupControls();
        
        // Emit player spawn event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_SPAWN, {
                position: { x, y },
                maxJumps: this.maxJumps,
                sprite: this.sprite
            });
        }
    }
    
    /**
     * Create the player physics body and sprite
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     */
    create(x, y) {
        try {
            console.log('[PlayerController] Creating player...');
            
            // Player dimensions
            const playerWidth = 32;
            const playerHeight = 32;
            
            // Create a visual representation of the player
            if (this.scene.textures.exists('player')) {
                console.log('[PlayerController] Using player sprite texture');
                this.sprite = this.scene.add.sprite(x, y, 'player', 0);
                this.sprite.setDisplaySize(playerWidth, playerHeight);
            } else {
                console.log('[PlayerController] Player texture not found, using rectangle');
                this.sprite = this.scene.add.rectangle(
                    x, y, playerWidth, playerHeight, 0x0000ff
                );
            }
            
            // Create a dynamic rigid body for the player
            const playerBodyDesc = RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(x, y)
                .setAngularDamping(4.0) // Add angular damping to reduce free rotation
                .setLinearDamping(0.1); // Reduce linear damping for more responsive movement
            
            this.body = this.world.createRigidBody(playerBodyDesc);
            console.log('[PlayerController] Player body created');
            
            // Create a collider (hitbox) for the player
            const playerColliderDesc = RAPIER.ColliderDesc
                .cuboid(playerWidth / 2, playerHeight / 2)
                .setDensity(1.0)
                .setRestitution(0.0); // No bounce
                
            this.collider = this.world.createCollider(
                playerColliderDesc,
                this.body
            );
            
            console.log('[PlayerController] Player created successfully');
        } catch (error) {
            console.error('[PlayerController] Error in create:', error);
        }
    }
    
    /**
     * Set up keyboard controls
     */
    setupControls() {
        try {
            // Set up arrow keys
            this.cursors = this.scene.input.keyboard.createCursorKeys();
            console.log('[PlayerController] Arrow keys set up');
            
            // Set up WASD keys
            this.wasd = {
                up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
            console.log('[PlayerController] WASD keys set up');

            // Add space key separately for jump
            this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            console.log('[PlayerController] Space key set up');
        } catch (error) {
            console.error('[PlayerController] Error in setupControls:', error);
        }
    }
    
    /**
     * Update method called every frame
     * @param {Array} platforms - Array of platforms to check for collisions
     */
    update(platforms) {
        if (!this.body) return;
        
        // Process collisions to detect ground contact
        this.processCollisions(platforms);
        
        // Track jump state changes
        this.updateJumpState();
        
        // Handle player movement and jumping
        this.handleMovement();
        this.handleJumping();
        
        // Emit move event for particle effects
        if (Math.abs(this.body.linvel().x) > 5) {
            this.emitMoveEvent();
        }
    }
    
    /**
     * Process collisions to detect if player is on ground
     * @param {Array} platforms - Array of platforms to check for collisions
     */
    processCollisions(platforms) {
        try {
            // Reset ground state at the beginning of each frame
            this.isOnGround = false;
            
            // Only proceed if player body exists
            if (!this.body) return;
            
            // Get player position and velocity
            const playerPos = this.body.translation();
            const playerVel = this.body.linvel();
            
            // Player dimensions
            const playerHeight = 32;
            const playerWidth = 32;
            const playerFeet = playerPos.y + (playerHeight / 2) - 2; // Position of player's feet with small offset
            
            // Improved ground collision check
            // Check if player's feet are close to any platform
            for (const platform of platforms) {
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
                    this._coyoteTimer = this.scene.time.addEvent({
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
                
                // Execute buffered jump if there is one
                if (this._jumpBufferTimer && !this._isInLandingRecovery) {
                    this.executeJump();
                    this._jumpBufferTimer.remove();
                    this._jumpBufferTimer = null;
                }
            }
            
            // Store previous ground state
            const wasOnGround = this._lastOnGround;
            
            // Emit land event if just landed
            if (!wasOnGround && this.isOnGround && this.eventSystem) {
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
                this.applySquashEffect(1.2, 0.8, 100);
                
                // Emit the land event
                this.eventSystem.emit(EventNames.PLAYER_LAND, {
                    position: {
                        x: playerPos.x,
                        y: playerPos.y
                    },
                    velocity: {
                        x: playerVel.x,
                        y: playerVel.y
                    },
                    sprite: this.sprite
                });
                
                // Also emit the land impact event for effects
                this.eventSystem.emit(EventNames.PLAYER_LAND_IMPACT, {
                    position: {
                        x: playerPos.x,
                        y: playerPos.y
                    },
                    velocity: {
                        x: playerVel.x,
                        y: playerVel.y
                    },
                    impactForce: Math.min(Math.abs(playerVel.y) / 20, 2), // Cap at 2x
                    sprite: this.sprite
                });
                
                // Reset jump state
                this.jumpState = 'grounded';
                this._currentJumpNumber = 0;
            }
            
            // Store ground state for next frame
            this._lastOnGround = this.isOnGround;
        } catch (error) {
            console.error('[PlayerController] Error in processCollisions:', error);
        }
    }
    
    /**
     * Update jump state based on velocity changes
     */
    updateJumpState() {
        if (!this.body) return;
        
        const currentVel = this.body.linvel();
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
                            x: this.body.translation().x,
                            y: this.body.translation().y
                        },
                        jumpNumber: this._currentJumpNumber,
                        sprite: this.sprite
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
                            x: this.body.translation().x,
                            y: this.body.translation().y
                        },
                        jumpNumber: this._currentJumpNumber,
                        velocity: {
                            x: currentVel.x,
                            y: currentVel.y
                        },
                        sprite: this.sprite
                    });
                }
            }
            // Detect rising state if velocity is significantly upward
            else if (this.jumpState === 'grounded' && currentVel.y < -5) {
                this.jumpState = 'rising';
                
                // Emit jump start event
                if (this.eventSystem) {
                    this.eventSystem.emit(EventNames.PLAYER_JUMP_START, {
                        position: {
                            x: this.body.translation().x,
                            y: this.body.translation().y
                        },
                        jumpNumber: this._currentJumpNumber,
                        velocity: {
                            x: currentVel.x,
                            y: currentVel.y
                        },
                        sprite: this.sprite
                    });
                }
            }
        }
        
        // Store current velocity for next frame
        this._lastVelocityY = currentVel.y;
    }
    
    /**
     * Emit move event for particle effects
     */
    emitMoveEvent() {
        if (!this.eventSystem || !this.body) return;
        
        this.eventSystem.emit(EventNames.PLAYER_MOVE, {
            position: {
                x: this.body.translation().x,
                y: this.body.translation().y
            },
            velocity: this.body.linvel(),
            isOnGround: this.isOnGround,
            sprite: this.sprite
        });
    }
    
    /**
     * Apply a squash and stretch effect to the sprite
     * @param {number} squashX - X scale factor for squash
     * @param {number} squashY - Y scale factor for squash
     * @param {number} duration - Effect duration in ms
     */
    applySquashEffect(squashX, squashY, duration) {
        if (!this.sprite) return;
        
        // Store original scale
        const originalScaleX = this.sprite.scaleX || 1;
        const originalScaleY = this.sprite.scaleY || 1;
        
        // Apply squash
        this.sprite.setScale(originalScaleX * squashX, originalScaleY * squashY);
        
        // Return to normal over duration
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: originalScaleX,
            scaleY: originalScaleY,
            duration: duration,
            ease: 'Elastic.Out'
        });
    }
    
    /**
     * Handle player movement based on input
     */
    handleMovement() {
        try {
            // Only proceed if player body exists
            if (!this.body) return;
            
            // Get movement parameters based on ground state
            const params = this.getMovementParams();
            
            // Track movement direction changes
            const wasMovingLeft = this._lastMoveDir === 'left';
            const wasMovingRight = this._lastMoveDir === 'right';
            let isMovingLeft = false;
            let isMovingRight = false;
            let vx = 0;
            
            // Check WASD keys first
            if (this.wasd.left.isDown) {
                vx = -params.moveSpeed;
                isMovingLeft = true;
            } else if (this.wasd.right.isDown) {
                vx = params.moveSpeed;
                isMovingRight = true;
            }
            
            // If WASD isn't pressed, check arrow keys
            if (vx === 0) {
                if (this.cursors.left.isDown) {
                    vx = -params.moveSpeed;
                    isMovingLeft = true;
                } else if (this.cursors.right.isDown) {
                    vx = params.moveSpeed;
                    isMovingRight = true;
                }
            }
            
            // Get current velocity
            const currentVel = this.body.linvel();
            
            // Apply falling acceleration with improved feel
            let newVelY = currentVel.y;
            if (currentVel.y > 0 && !this.isOnGround) {
                // Accelerate falling speed with a curve for better feel
                // Slower acceleration at first, then faster as player falls
                const fallAcceleration = 1.0 + (Math.min(currentVel.y, 20) / 40);
                newVelY = currentVel.y * fallAcceleration;
                
                // Cap maximum fall speed
                if (newVelY > 40) {
                    newVelY = 40;
                }
            }
            
            // Calculate new X velocity with snappy movement
            let newVelX = currentVel.x;
            
            if (vx !== 0) {
                // Direction change detection for snappier response
                const isChangingDirection = (vx < 0 && currentVel.x > 0) || (vx > 0 && currentVel.x < 0);
                
                if (isChangingDirection) {
                    // When changing direction, apply a stronger snap factor
                    // Use different factors for ground vs air
                    const changeFactor = this.isOnGround ?
                        params.directionChangeFactor :
                        this.jumpParams.airControl.directionChangeFactor;
                    
                    newVelX = vx * 0.5 + currentVel.x * (1 - changeFactor);
                } else {
                    // Normal movement - snap quickly to target velocity
                    newVelX = vx * params.snapFactor + currentVel.x * (1 - params.snapFactor);
                }
                
                // Add a small immediate boost when starting to move
                if ((isMovingLeft && !wasMovingLeft) || (isMovingRight && !wasMovingRight)) {
                    // Different boost factor for ground vs air
                    const boostFactor = this.isOnGround ? 0.6 : 0.4;
                    newVelX = vx * boostFactor;
                }
                
                // Store movement direction for next frame
                this._lastMoveDir = isMovingLeft ? 'left' : 'right';
            } else {
                // No movement keys pressed - snap quickly to zero
                // Different stop factors for ground vs air
                const stopFactor = this.isOnGround ? params.stopSnapFactor : 0.05;
                newVelX = currentVel.x * (1 - stopFactor);
                this._lastMoveDir = 'none';
            }
            
            // Apply the new velocity
            this.body.setLinvel({ x: newVelX, y: newVelY }, true);
            
            // Self-balancing mechanism - gradually return to upright position
            const currentRotation = this.body.rotation();
            if (Math.abs(currentRotation) > 0.1) { // Only apply if tilted significantly
                // Apply a gentle torque in the opposite direction of rotation
                const balanceForce = -currentRotation * 0.05;
                this.body.applyTorqueImpulse(balanceForce);
            }
        } catch (error) {
            console.error('[PlayerController] Error in handleMovement:', error);
        }
    }
    
    /**
     * Get movement parameters based on ground state
     * @returns {object} Movement parameters
     */
    getMovementParams() {
        // Base parameters for ground movement
        const groundParams = {
            moveSpeed: 35,         // Moderate max speed
            snapFactor: 0.8,       // How quickly to snap to target velocity (0-1)
            stopSnapFactor: 0.9,   // How quickly to stop (0-1)
            directionChangeFactor: 1.5 // Multiplier for direction changes
        };
        
        // If in air, modify parameters for air control
        if (!this.isOnGround) {
            return {
                moveSpeed: this.jumpParams.airControl.maxSpeed,
                snapFactor: this.jumpParams.airControl.acceleration,
                stopSnapFactor: 0.05, // Much slower stopping in air
                directionChangeFactor: this.jumpParams.airControl.directionChangeFactor
            };
        }
        
        // If in landing recovery, reduce movement speed slightly
        if (this._isInLandingRecovery) {
            return {
                ...groundParams,
                moveSpeed: groundParams.moveSpeed * 0.8, // 80% of normal speed during recovery
                snapFactor: groundParams.snapFactor * 0.8 // 80% of normal acceleration
            };
        }
        
        return groundParams;
    }
    
    /**
     * Handle player jumping based on input
     */
    handleJumping() {
        try {
            // Only proceed if player body exists
            if (!this.body) return;
            
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
                    const currentVel = this.body.linvel();
                    
                    // Vary jump force based on which jump it is
                    let jumpForce = -45; // Extremely powerful jump
                    
                    // Make subsequent jumps more powerful for better triple jump feel
                    if (this.jumpsUsed === 1) {
                        jumpForce = -50; // Second jump even stronger
                    } else if (this.jumpsUsed === 2) {
                        jumpForce = -55; // Third jump extremely powerful
                    }
                    
                    // Add horizontal boost when jumping while moving
                    let jumpBoostX = currentVel.x;
                    if (Math.abs(currentVel.x) > 0.5) {
                        // Boost in the direction of movement
                        jumpBoostX = currentVel.x * 1.5; // 50% horizontal boost when jumping while moving
                    }
                    
                    // Apply the jump force with horizontal boost
                    this.body.setLinvel({ x: jumpBoostX, y: jumpForce }, true);
                    
                    // Add a stronger upward impulse for extra "pop" feeling
                    this.body.applyImpulse({ x: 0, y: -15 }, true);
                    
                    // Note: Camera shake removed from default behavior
                    // Can be used as a special game mechanic for power jumps or impacts
                    
                    this.jumpsUsed++;
                    
                    // Emit jump event
                    if (this.eventSystem) {
                        this.eventSystem.emit(EventNames.PLAYER_JUMP, {
                            jumpsUsed: this.jumpsUsed,
                            maxJumps: this.maxJumps,
                            position: {
                                x: this.body.translation().x,
                                y: this.body.translation().y
                            },
                            velocity: {
                                x: jumpBoostX,
                                y: jumpForce
                            },
                            jumpNumber: this.jumpsUsed
                        });
                    }
                    
                    // Change player color based on jump number (visual feedback)
                    if (this.sprite.setTint) {
                        // If it's a sprite with setTint method
                        if (this.jumpsUsed === 1) {
                            this.sprite.setTint(0x00FF00); // Green for first jump
                        } else if (this.jumpsUsed === 2) {
                            this.sprite.setTint(0xFFFF00); // Yellow for second jump
                        } else if (this.jumpsUsed === 3) {
                            this.sprite.setTint(0xFF0000); // Red for third jump
                        }
                    } else if (this.sprite.fillColor !== undefined) {
                        // If it's a rectangle with fillColor property
                        if (this.jumpsUsed === 1) {
                            this.sprite.fillColor = 0x00FF00; // Green for first jump
                        } else if (this.jumpsUsed === 2) {
                            this.sprite.fillColor = 0xFFFF00; // Yellow for second jump
                        } else if (this.jumpsUsed === 3) {
                            this.sprite.fillColor = 0xFF0000; // Red for third jump
                        }
                    }
                }
            }
            
            // Reset color when on ground
            if (this.isOnGround) {
                if (this.sprite.setTint) {
                    this.sprite.clearTint(); // Clear tint if it's a sprite
                } else if (this.sprite.fillColor !== undefined) {
                    this.sprite.fillColor = 0x0000FF; // Blue when on ground if it's a rectangle
                }
            }
        } catch (error) {
            console.error('[PlayerController] Error in handleJumping:', error);
        }
    }
    
    /**
     * Get the player's physics body
     * @returns {RAPIER.RigidBody} The player's physics body
     */
    getBody() {
        return this.body;
    }
    
    /**
     * Get the player's sprite
     * @returns {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} The player's sprite
     */
    getSprite() {
        return this.sprite;
    }
}