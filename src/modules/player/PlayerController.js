import Phaser from 'phaser';
import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../../constants/EventNames';
import { PhysicsConfig } from '../../constants/PhysicsConfig.js';
import { PIXELS_PER_METER, pixelsToMeters, metersToPixels } from '../../constants/PhysicsConstants.js';
import { JumpController } from './JumpController';
import { MovementController } from './MovementController';
import { CollisionController } from './CollisionController';
import { WallJumpController } from './WallJumpController';

/**
 * PlayerController class for modern 2D platformer using KinematicCharacterController
 * Implements proper scaling, responsive controls, and "game feel" mechanics
 * Based on expert guide recommendations for tight, action-oriented movement
 */
export class PlayerController {
    /**
     * Create a new PlayerController using KinematicCharacterController
     * @param {Phaser.Scene} scene - The scene this controller belongs to
     * @param {RAPIER.World} world - The Rapier physics world
     * @param {EventSystem} eventSystem - The event system for communication
     * @param {number} x - Initial x position in pixels
     * @param {number} y - Initial y position in pixels
     * @param {string} textureKey - Key of the sprite texture to use
     */
    constructor(scene, world, eventSystem, x = 512, y = 300, textureKey = 'player') {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;
        this.textureKey = textureKey;
        
        // Modern character controller setup
        this.body = null;                    // KinematicPositionBased body
        this.collider = null;                // Character collider
        this.characterController = null;     // Rapier's KinematicCharacterController
        this.sprite = null;                  // Visual representation
        
        // Movement state for proper physics integration
        this.velocity = new RAPIER.Vector2(0, 0);  // In meters per second
        this.isGrounded = false;
        this.groundContactTimer = 0;
        
        // Game feel timers
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.landingRecoveryTimer = 0;
        
        // Create the player at the specified position
        this.create(x, y);
        
        // Set up input handlers
        this.setupControls();
        
        // Emit player spawn event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_SPAWN, {
                position: { x, y },
                sprite: this.sprite
            });
        }
        
        console.log('[PlayerController] Initialized with KinematicCharacterController');
    }
    
    /**
     * Create the modern character controller setup with proper scaling
     * @param {number} x - Initial x position in pixels
     * @param {number} y - Initial y position in pixels
     */
    create(x, y) {
        try {
            console.log('[PlayerController] Creating modern character controller...');
            
            // Player dimensions in pixels
            const playerWidth = 32;   // Smaller, more precise hitbox
            const playerHeight = 48;  // Taller for platformer character feel
            
            // Create visual representation
            if (this.scene.textures.exists(this.textureKey)) {
                console.log('[PlayerController] Using texture:', this.textureKey);
                this.sprite = this.scene.add.sprite(x, y, this.textureKey);
                this.sprite.setDisplaySize(playerWidth, playerHeight);
            } else {
                console.log('[PlayerController] Texture not found:', this.textureKey, 'using rectangle');
                this.sprite = this.scene.add.rectangle(x, y, playerWidth, playerHeight, 0x00ff00);
            }
            this.sprite.setDepth(100);
            this.sprite.setVisible(true);
            
            // Add glow effect
            this.createGlowEffect();
            
            // Create KinematicPositionBased body (not Dynamic!)
            const bodyDesc = RAPIER.RigidBodyDesc
                .kinematicPositionBased()
                .setTranslation(pixelsToMeters(x), pixelsToMeters(y));
            
            this.body = this.world.createRigidBody(bodyDesc);
            console.log('[PlayerController] Kinematic body created at:', pixelsToMeters(x), pixelsToMeters(y));
            
            // Create capsule collider for smooth movement over edges
            const halfHeight = pixelsToMeters(playerHeight / 2) - PhysicsConfig.player.radius;
            const colliderDesc = RAPIER.ColliderDesc
                .capsule(halfHeight, PhysicsConfig.player.radius)
                .setFriction(PhysicsConfig.player.friction)
                .setRestitution(PhysicsConfig.player.restitution)
                .setDensity(PhysicsConfig.player.density);
            
            this.collider = this.world.createCollider(colliderDesc, this.body);
            
            // Create the KinematicCharacterController - the key to responsive movement
            this.characterController = this.world.createCharacterController(PhysicsConfig.player.offset);
            
            // Configure modern platformer features
            if (PhysicsConfig.player.enableAutostep) {
                this.characterController.enableAutostep(
                    PhysicsConfig.player.autostepMaxHeight,
                    PhysicsConfig.player.autostepMinWidth,
                    true
                );
            }
            
            if (PhysicsConfig.player.enableSnapToGround) {
                this.characterController.enableSnapToGround(PhysicsConfig.player.snapToGroundDistance);
            }
            
            this.characterController.setMaxSlopeClimbAngle(PhysicsConfig.player.maxSlopeClimbAngle);
            
            console.log('[PlayerController] Modern character controller created successfully');
        } catch (error) {
            console.error('[PlayerController] Error in create:', error);
        }
    }
    
    /**
     * Set up keyboard controls
     */
    setupControls() {
        // Acquire input keys from InputManager if available
        if (this.scene.inputManager && this.scene.inputManager.keys) {
            const keys = this.scene.inputManager.keys;
            this.cursors = keys.cursors;
            this.wasd = {
                up: keys.W,
                down: keys.S,
                left: keys.A,
                right: keys.D
            };
            this.spaceKey = keys.SPACE;
            this.duckKey = keys.C;
        } else {
            // Fallback to direct keyboard polling
            this.cursors = this.scene.input.keyboard.createCursorKeys();
            this.wasd = {
                up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
            this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.duckKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        }
        
        // Track ducking state
        this.isDucking = false;
    }
    
    /**
     * Modern character controller update using KinematicCharacterController
     * @param {number} deltaTime - Frame time in milliseconds
     */
    update(deltaTime) {
        if (!this.body || !this.characterController || !this.collider) return;
        
        try {
            const dt = deltaTime / 1000; // Convert to seconds
            
            // Update game feel timers
            this.updateTimers(dt);
            
            // Check ground state using character controller
            this.updateGroundState();
            
            // Handle input and calculate desired movement
            const desiredMovement = this.calculateMovement(dt);
            
            // Use character controller to compute collision-aware movement
            this.characterController.computeColliderMovement(
                this.collider,
                desiredMovement
            );
            
            // Get the final, collision-corrected movement
            const correctedMovement = this.characterController.computedMovement();
            
            // Apply the movement to the kinematic body
            const currentPosition = this.body.translation();
            this.body.setNextKinematicTranslation({
                x: currentPosition.x + correctedMovement.x,
                y: currentPosition.y + correctedMovement.y
            });
            
            // Update velocity based on actual movement for next frame
            this.updateVelocityFromMovement(correctedMovement, dt);
            
            // Handle landing detection and recovery
            this.handleLandingDetection();
            
            // Update sprite position to match physics body
            this.updateSpritePosition();
            
            // Handle ducking
            this.handleDucking();
            
        } catch (error) {
            console.error('[PlayerController] Error in update:', error);
        }
    }
    
    /**
     * Update game feel timers (coyote time, jump buffer, landing recovery)
     * @param {number} dt - Delta time in seconds
     */
    updateTimers(dt) {
        if (this.coyoteTimer > 0) {
            this.coyoteTimer -= dt;
        }
        
        if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer -= dt;
        }
        
        if (this.landingRecoveryTimer > 0) {
            this.landingRecoveryTimer -= dt;
        }
    }
    
    /**
     * Update ground state using character controller
     */
    updateGroundState() {
        const wasGrounded = this.isGrounded;
        this.isGrounded = this.characterController.isGrounded();
        
        // Handle coyote time - grace period after leaving ground
        if (wasGrounded && !this.isGrounded) {
            this.coyoteTimer = PhysicsConfig.gameFeel.coyoteTime;
        }
        
        // Reset ground timer when grounded
        if (this.isGrounded) {
            this.groundContactTimer = 0;
        } else {
            this.groundContactTimer += 1/60; // Rough frame time
        }
    }
    
    /**
     * Calculate desired movement based on input and physics
     * @param {number} dt - Delta time in seconds
     * @returns {RAPIER.Vector2} Desired movement vector in meters
     */
    calculateMovement(dt) {
        const movement = new RAPIER.Vector2(0, 0);
        
        // Handle horizontal input
        let horizontalInput = 0;
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            horizontalInput = -1;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            horizontalInput = 1;
        }
        
        // Apply horizontal movement with proper acceleration
        const targetSpeed = horizontalInput * PhysicsConfig.movement.walkSpeed;
        const acceleration = this.isGrounded ? 
            PhysicsConfig.movement.groundAcceleration : 
            PhysicsConfig.movement.airAcceleration * PhysicsConfig.movement.airControlFactor;
        
        // Apply landing recovery reduction
        const recoveryMultiplier = this.landingRecoveryTimer > 0 ? 
            PhysicsConfig.gameFeel.landingSpeedMultiplier : 1.0;
        
        if (horizontalInput !== 0) {
            // Accelerate towards target speed
            const speedDiff = (targetSpeed * recoveryMultiplier) - this.velocity.x;
            const maxAccel = acceleration * dt;
            this.velocity.x += Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), maxAccel);
        } else {
            // Decelerate when no input
            const deceleration = this.isGrounded ? PhysicsConfig.movement.deceleration : PhysicsConfig.movement.airAcceleration;
            const decel = deceleration * dt;
            if (Math.abs(this.velocity.x) <= decel) {
                this.velocity.x = 0;
            } else {
                this.velocity.x -= Math.sign(this.velocity.x) * decel;
            }
        }
        
        // Handle jumping with modern game feel
        this.handleJumpInput();
        
        // Apply gravity (character controller doesn't do this automatically)
        if (!this.isGrounded) {
            this.velocity.y += PhysicsConfig.gravityY * dt;
            
            // Cap fall speed
            if (this.velocity.y > PhysicsConfig.movement.maxFallSpeed) {
                this.velocity.y = PhysicsConfig.movement.maxFallSpeed;
            }
        } else {
            // Reset vertical velocity when grounded
            if (this.velocity.y > 0) {
                this.velocity.y = 0;
            }
        }
        
        // Handle fast fall
        if ((this.cursors.down.isDown || this.wasd.down.isDown) && this.velocity.y > 0) {
            this.velocity.y *= PhysicsConfig.movement.fastFallMultiplier;
        }
        
        // Convert velocity to movement for this frame
        movement.x = this.velocity.x * dt;
        movement.y = this.velocity.y * dt;
        
        return movement;
    }
    
    /**
     * Handle jump input with modern game feel mechanics
     */
    handleJumpInput() {
        const jumpPressed = this.spaceKey.isDown;
        const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.spaceKey);
        
        // Jump buffering - remember jump input for a short time
        if (jumpJustPressed) {
            this.jumpBufferTimer = PhysicsConfig.gameFeel.jumpBufferTime;
        }
        
        // Can jump if grounded OR within coyote time
        const canJump = this.isGrounded || this.coyoteTimer > 0;
        
        // Execute jump if we can jump and have buffered input
        if (canJump && this.jumpBufferTimer > 0) {
            this.velocity.y = -PhysicsConfig.movement.jumpVelocity; // Negative for upward
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            
            // Start landing recovery timer for when we land
            this.landingRecoveryTimer = 0;
            
            // Emit jump event
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.PLAYER_JUMP, {
                    position: this.body.translation(),
                    velocity: this.velocity
                });
            }
        }
        
        // Variable jump height - cut jump short if released early
        if (!jumpPressed && this.velocity.y < 0) {
            const minJumpVel = -PhysicsConfig.movement.jumpVelocity * PhysicsConfig.gameFeel.variableJumpMinHeight;
            if (this.velocity.y < minJumpVel) {
                this.velocity.y = minJumpVel;
            }
        }
    }
    
    /**
     * Update velocity based on actual movement that occurred
     * @param {RAPIER.Vector2} correctedMovement - The actual movement after collision
     * @param {number} dt - Delta time in seconds
     */
    updateVelocityFromMovement(correctedMovement, dt) {
        // If we didn't move as expected horizontally, we hit a wall - stop horizontal velocity
        const expectedHorizontal = this.velocity.x * dt;
        if (Math.abs(correctedMovement.x) < Math.abs(expectedHorizontal) * 0.5) {
            this.velocity.x = 0;
        }
        
        // If we didn't move vertically as expected, we hit floor/ceiling
        const expectedVertical = this.velocity.y * dt;
        if (Math.abs(correctedMovement.y) < Math.abs(expectedVertical) * 0.5) {
            if (this.velocity.y > 0) {
                // We were falling and hit the ground
                this.velocity.y = 0;
            } else {
                // We were jumping and hit the ceiling
                this.velocity.y = 0;
            }
        }
    }
    
    /**
     * Handle landing detection and recovery period
     */
    handleLandingDetection() {
        if (this.isGrounded && this.landingRecoveryTimer <= 0 && this.velocity.y === 0) {
            // We just landed - start recovery period
            this.landingRecoveryTimer = PhysicsConfig.gameFeel.landingRecoveryTime;
            
            // Emit landing event
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.PLAYER_LAND, {
                    position: this.body.translation()
                });
            }
        }
    }
    
    /**
     * Update sprite position with proper scaling
     */
    updateSpritePosition() {
        if (!this.body || !this.sprite) return;
        
        const position = this.body.translation();
        // Convert from physics meters to render pixels
        this.sprite.setPosition(
            metersToPixels(position.x), 
            metersToPixels(position.y)
        );
        
        // Don't update rotation from physics if ducking
        if (!this.isDucking) {
            this.sprite.setRotation(this.body.rotation());
        }
        
        // Update glow position
        if (this.glowGraphics) {
            this.updateGlow(0.4);
        }
    }
    
    /**
     * Handle ducking mechanics
     */
    handleDucking() {
        if (!this.sprite || !this.body || !this.collider) return;
        
        const wasDucking = this.isDucking;
        this.isDucking = this.duckKey.isDown;
        
        // Apply duck transformation
        if (this.isDucking && !wasDucking) {
            // Start ducking - rotate 90 degrees clockwise
            this.sprite.setRotation(Math.PI / 2);
            
            // Update physics collider to match ducked shape
            // Remove old collider
            this.world.removeCollider(this.collider);
            
            // Create new horizontal collider
            const playerColliderDesc = RAPIER.ColliderDesc
                .cuboid(32, 32) // Swapped dimensions for horizontal shape
                .setFriction(0.1)
                .setDensity(2.0)
                .setRestitution(0.15);
                
            this.collider = this.world.createCollider(
                playerColliderDesc,
                this.body
            );
            
            // Emit duck event
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.PLAYER_DUCK, {
                    position: this.body.translation()
                });
            }
        } else if (!this.isDucking && wasDucking) {
            // Stop ducking - return to normal
            this.sprite.setRotation(0);
            
            // Restore original collider
            this.world.removeCollider(this.collider);
            
            const playerColliderDesc = RAPIER.ColliderDesc
                .cuboid(32, 32) // Original square dimensions
                .setFriction(0.1)
                .setDensity(2.0)
                .setRestitution(0.15);
                
            this.collider = this.world.createCollider(
                playerColliderDesc,
                this.body
            );
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
    
    /**
     * Get velocity information for debugging
     * @returns {object} Current velocity and movement state
     */
    getVelocityInfo() {
        return {
            velocity: { x: this.velocity.x, y: this.velocity.y },
            isGrounded: this.isGrounded,
            coyoteTimer: this.coyoteTimer,
            jumpBufferTimer: this.jumpBufferTimer
        };
    }
    
    /**
     * Set the player position (called by level loader)
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     */
    setPosition(x, y) {
        if (this.body) {
            this.body.setTranslation(pixelsToMeters(x), pixelsToMeters(y));
        }
        if (this.sprite) {
            this.sprite.setPosition(x, y);
        }
        
        // Reset velocity
        this.velocity.x = 0;
        this.velocity.y = 0;
    }
    
    /**
     * Reset the player state (called by level loader)
     */
    reset() {
        // Reset velocity
        this.velocity.x = 0;
        this.velocity.y = 0;
        
        // Reset timers
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.landingRecoveryTimer = 0;
        
        // Reset ground state
        this.isGrounded = false;
        this.groundContactTimer = 0;
        
        // Reset ducking
        this.isDucking = false;
        if (this.sprite) {
            this.sprite.setRotation(0);
        }
        
        console.log('[PlayerController] Player state reset');
    }
    
    /**
     * Create a glow effect around the player
     */
    createGlowEffect() {
        if (!this.sprite) return;
        
        // Create glow graphics behind the sprite
        this.glowGraphics = this.scene.add.graphics();
        this.glowGraphics.setDepth(99); // Just below the sprite
        
        // Create pulsing glow animation
        this.scene.tweens.add({
            targets: { intensity: 0.3 },
            intensity: 0.6,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
            onUpdate: (tween) => {
                const intensity = tween.getValue();
                this.updateGlow(intensity);
            }
        });
    }
    
    /**
     * Update the glow effect
     * @param {number} intensity - Glow intensity
     */
    updateGlow(intensity) {
        if (!this.glowGraphics || !this.sprite) return;
        
        this.glowGraphics.clear();
        
        // Create multiple circles for soft glow
        const colors = [0x00ff00, 0x44ff44, 0x88ff88];
        const sizes = [40, 30, 20];
        
        colors.forEach((color, i) => {
            this.glowGraphics.fillStyle(color, intensity * (0.3 - i * 0.1));
            this.glowGraphics.fillCircle(
                this.sprite.x,
                this.sprite.y,
                sizes[i]
            );
        });
    }
    
    /**
     * Clean up resources when scene is shut down
     */
    shutdown() {
        // Clean up physics resources
        if (this.world && this.body) {
            this.world.removeRigidBody(this.body);
        }
        
        // Clean up graphics
        if (this.glowGraphics) {
            this.glowGraphics.destroy();
        }
        
        // Clean up input listeners via InputManager
        if (this.scene.inputManager) {
            this.scene.inputManager.destroy();
        }
        
        console.log('[PlayerController] Resources cleaned up');
    }
}