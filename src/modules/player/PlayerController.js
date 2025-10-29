import Phaser from 'phaser';
import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../../constants/EventNames';
import { PhysicsConfig } from '../../constants/PhysicsConfig.js';
import { PIXELS_PER_METER, pixelsToMeters, metersToPixels } from '../../constants/PhysicsConstants.js';
import { createEmptyInputState } from '../../types/InputState.js';
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
        console.log('[PlayerController] About to setup controls, inputManager available:', !!this.scene.inputManager);
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
     * Set up keyboard controls - Modern InputState snapshot architecture
     */
    setupControls() {
        // Verify InputManager is available
        const inputManager = this.scene.inputManager;

        if (!inputManager || !inputManager.keys) {
            console.warn('[PlayerController] InputManager not available!');
            console.warn('[PlayerController] Creating fallback direct keyboard controls');

            // Emergency fallback - direct key polling
            this.cursors = this.scene.input.keyboard.createCursorKeys();
            this.wasd = {
                up: this.scene.input.keyboard.addKey('W'),
                down: this.scene.input.keyboard.addKey('S'),
                left: this.scene.input.keyboard.addKey('A'),
                right: this.scene.input.keyboard.addKey('D')
            };
            this.spaceKey = this.scene.input.keyboard.addKey('SPACE');
            this.duckKey = this.scene.input.keyboard.addKey('C');
        } else {
            console.log('[PlayerController] InputManager confirmed available');
            // Store reference to InputManager (not individual keys)
            this.inputManager = inputManager;
        }

        console.log('[PlayerController] ──────────────────────────────────');
        console.log('[PlayerController] INPUT: Snapshot-based (modern)');
        console.log('[PlayerController] Consuming InputState per frame');
        console.log('[PlayerController] ──────────────────────────────────');

        this.isDucking = false;
    }
    
    /**
     * Modern character controller update - Snapshot-based input architecture
     * @param {number} deltaTime - Frame time in milliseconds
     */
    update(deltaTime) {
        // Guard clauses
        if (!this.body || !this.characterController || !this.collider || !this.sprite) {
            console.warn('[PlayerController] Missing essential components');
            return;
        }

        if (this.errorCount > 5) {
            console.warn('[PlayerController] Too many errors, player disabled');
            return;
        }

        try {
            // Sanitize delta time
            const clampedDelta = Math.min(deltaTime, 50);
            const dt = clampedDelta / 1000;

            if (!Number.isFinite(dt) || dt <= 0) {
                console.warn('[PlayerController] Invalid deltaTime:', deltaTime);
                return;
            }

            // ═══════════════════════════════════════════════════════════
            // GET INPUT SNAPSHOT (MODERN PATH)
            // ═══════════════════════════════════════════════════════════

            let inputState;

            if (this.inputManager && this.inputManager.getSnapshot) {
                // Modern: Get clean snapshot
                inputState = this.inputManager.getSnapshot();

                // Debug: Log input state occasionally
                if (Math.random() < 0.01) {
                    console.log('[PlayerController] InputState:', inputState);
                }
            } else {
                // Fallback: Create snapshot from direct key polling
                console.warn('[PlayerController] Using fallback input polling, inputManager:', !!this.inputManager, 'getSnapshot:', !!this.inputManager?.getSnapshot);
                inputState = this.createFallbackInputState();
            }

            // ═══════════════════════════════════════════════════════════
            // GAME LOGIC (SNAPSHOT-DRIVEN)
            // ═══════════════════════════════════════════════════════════

            this.updateTimers(dt);
            this.updateGroundState();

            // Calculate movement from clean input data
            const desiredMovement = this.calculateMovementFromInput(inputState, dt);

            // Validate movement
            if (!desiredMovement || !Number.isFinite(desiredMovement.x) || !Number.isFinite(desiredMovement.y)) {
                console.warn('[PlayerController] Invalid movement vector');
                return;
            }

            // Physics integration
            this.characterController.computeColliderMovement(this.collider, desiredMovement);
            const correctedMovement = this.characterController.computedMovement();

            if (!correctedMovement || !Number.isFinite(correctedMovement.x) || !Number.isFinite(correctedMovement.y)) {
                console.warn('[PlayerController] Invalid corrected movement');
                return;
            }

            const currentPosition = this.body.translation();
            if (currentPosition) {
                this.body.setNextKinematicTranslation({
                    x: currentPosition.x + correctedMovement.x,
                    y: currentPosition.y + correctedMovement.y
                });
            }

            this.updateVelocityFromMovement(correctedMovement, dt);
            this.handleLandingDetection();
            this.updateSpritePosition();
            this.handleDuckingFromInput(inputState);

            this.errorCount = 0;

        } catch (error) {
            this.errorCount = (this.errorCount || 0) + 1;
            console.error(`[PlayerController] ═══════════════════════════════════════════`);
            console.error(`[PlayerController] ERROR ${this.errorCount}/5 in update loop`);
            console.error(`[PlayerController] Error Type: ${error.name}`);
            console.error(`[PlayerController] Error Message: ${error.message}`);
            console.error(`[PlayerController] Stack Trace:`);
            console.error(error.stack);
            console.error(`[PlayerController] State at error:`);
            console.error(`  - body: ${!!this.body}`);
            console.error(`  - characterController: ${!!this.characterController}`);
            console.error(`  - collider: ${!!this.collider}`);
            console.error(`  - sprite: ${!!this.sprite}`);
            console.error(`  - inputManager: ${!!this.inputManager}`);
            console.error(`  - velocity: (${this.velocity?.x || 'N/A'}, ${this.velocity?.y || 'N/A'})`);
            console.error(`  - isGrounded: ${this.isGrounded}`);
            console.error(`  - deltaTime: ${arguments[0]}`);
            console.error(`[PlayerController] ═══════════════════════════════════════════`);

            // Emergency fallback
            try {
                if (this.body && this.sprite) {
                    this.updateSpritePosition();
                }
            } catch (fallbackError) {
                console.error('[PlayerController] Fallback sprite sync failed:');
                console.error(`  Error: ${fallbackError.message}`);
                console.error(`  Stack: ${fallbackError.stack}`);
            }
        }
    }

    /**
     * Create fallback input state from direct key polling
     * @returns {InputState}
     */
    createFallbackInputState() {
        if (!this.cursors || !this.wasd || !this.spaceKey) {
            return createEmptyInputState();
        }

        const justDown = Phaser.Input.Keyboard.JustDown;
        const justUp = Phaser.Input.Keyboard.JustUp;

        return {
            left: this.cursors.left.isDown || this.wasd.left.isDown,
            right: this.cursors.right.isDown || this.wasd.right.isDown,
            up: this.cursors.up.isDown || this.wasd.up.isDown,
            down: this.cursors.down.isDown || this.wasd.down.isDown,
            jump: this.spaceKey.isDown || this.cursors.up.isDown,
            jumpPressed: justDown(this.spaceKey) || justDown(this.cursors.up),
            jumpReleased: justUp(this.spaceKey) || justUp(this.cursors.up),
            duck: this.duckKey.isDown || this.cursors.down.isDown,
        };
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
     * Rapier 0.19+ API: use numGroundedColliders() instead of isGrounded()
     */
    updateGroundState() {
        const wasGrounded = this.isGrounded;
        // Rapier 0.19+ API: numGroundedColliders() returns count of ground contacts
        this.isGrounded = this.characterController.numGroundedColliders() > 0;

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
     * Calculate movement from InputState snapshot
     *
     * @param {InputState} input - Clean input data (no Phaser types)
     * @param {number} dt - Delta time in seconds
     * @returns {RAPIER.Vector2} Desired movement in meters
     */
    calculateMovementFromInput(input, dt) {
        const movement = new RAPIER.Vector2(0, 0);

        // ═══════════════════════════════════════════════════════════
        // HORIZONTAL INPUT (from snapshot)
        // ═══════════════════════════════════════════════════════════

        // Convert boolean inputs to signed axis (-1, 0, 1)
        const horizontalInput = (input.left ? -1 : 0) + (input.right ? 1 : 0);

        // Calculate target speed
        const targetSpeed = horizontalInput * PhysicsConfig.movement.walkSpeed;

        // Choose acceleration based on ground state
        const acceleration = this.isGrounded ?
            PhysicsConfig.movement.groundAcceleration :
            PhysicsConfig.movement.airAcceleration * PhysicsConfig.movement.airControlFactor;

        // Validate
        if (!Number.isFinite(targetSpeed) || !Number.isFinite(acceleration)) {
            console.warn('[PlayerController] Invalid movement params');
            return new RAPIER.Vector2(0, 0);
        }

        // Apply landing recovery
        const recoveryMultiplier = this.landingRecoveryTimer > 0 ?
            PhysicsConfig.gameFeel.landingSpeedMultiplier : 1.0;

        if (horizontalInput !== 0) {
            // Accelerate toward target
            const speedDiff = (targetSpeed * recoveryMultiplier) - this.velocity.x;
            const maxAccel = acceleration * dt;
            this.velocity.x += Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), maxAccel);
        } else {
            // Decelerate to zero
            const deceleration = this.isGrounded ?
                PhysicsConfig.movement.deceleration :
                PhysicsConfig.movement.airAcceleration;
            const decel = deceleration * dt;

            if (Math.abs(this.velocity.x) <= decel) {
                this.velocity.x = 0;
            } else {
                this.velocity.x -= Math.sign(this.velocity.x) * decel;
            }
        }

        // ═══════════════════════════════════════════════════════════
        // JUMP (snapshot-driven)
        // ═══════════════════════════════════════════════════════════

        this.handleJumpInputFromSnapshot(input);

        // ═══════════════════════════════════════════════════════════
        // GRAVITY & VERTICAL MOVEMENT
        // ═══════════════════════════════════════════════════════════

        if (!this.isGrounded) {
            this.velocity.y += PhysicsConfig.gravityY * dt;

            if (this.velocity.y > PhysicsConfig.movement.maxFallSpeed) {
                this.velocity.y = PhysicsConfig.movement.maxFallSpeed;
            }
        } else {
            if (this.velocity.y > 0) {
                this.velocity.y = 0;
            }
        }

        // Fast fall (snapshot-driven)
        if (input.down && this.velocity.y > 0) {
            this.velocity.y *= PhysicsConfig.movement.fastFallMultiplier;
        }

        // ═══════════════════════════════════════════════════════════
        // SAFETY: Clamp velocities
        // ═══════════════════════════════════════════════════════════

        const maxSpeed = 50;
        this.velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, this.velocity.x));
        this.velocity.y = Math.max(-maxSpeed, Math.min(maxSpeed, this.velocity.y));

        if (!Number.isFinite(this.velocity.x)) this.velocity.x = 0;
        if (!Number.isFinite(this.velocity.y)) this.velocity.y = 0;

        // ═══════════════════════════════════════════════════════════
        // CONVERT TO MOVEMENT
        // ═══════════════════════════════════════════════════════════

        movement.x = this.velocity.x * dt;
        movement.y = this.velocity.y * dt;

        return movement;
    }
    
    /**
     * Handle jump input from snapshot
     * @param {InputState} input
     */
    handleJumpInputFromSnapshot(input) {
        // Jump buffering - remember jump intent
        if (input.jumpPressed) {
            this.jumpBufferTimer = PhysicsConfig.gameFeel.jumpBufferTime;
        }

        // Can jump if grounded OR coyote time active
        const canJump = this.isGrounded || this.coyoteTimer > 0;

        // Execute jump
        if (canJump && this.jumpBufferTimer > 0) {
            this.velocity.y = -PhysicsConfig.movement.jumpVelocity;
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            this.landingRecoveryTimer = 0;

            // Emit feedback event (NOT control event!)
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.PLAYER_JUMP, {
                    position: this.body.translation(),
                    velocity: { x: this.velocity.x, y: this.velocity.y }
                });
            }
        }

        // Variable jump height
        if (input.jumpReleased && this.velocity.y < 0) {
            const minJumpVel = -PhysicsConfig.movement.jumpVelocity *
                               PhysicsConfig.gameFeel.variableJumpMinHeight;
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
     * Handle ducking from input snapshot
     * @param {InputState} input
     */
    handleDuckingFromInput(input) {
        if (!this.sprite || !this.body || !this.collider) return;

        const wasDucking = this.isDucking;
        this.isDucking = input.duck;

        // ═══════════════════════════════════════════════════════════
        // CRITICAL FIX: Use METERS, not pixels!
        // ═══════════════════════════════════════════════════════════

        if (this.isDucking && !wasDucking) {
            // Start ducking
            this.sprite.setRotation(Math.PI / 2);

            // Remove old collider
            this.world.removeCollider(this.collider);

            // Create SHORTER capsule in METERS
            const duckPixelHeight = 24;  // Duck height in pixels
            const duckHalfHeight = pixelsToMeters(duckPixelHeight / 2) - PhysicsConfig.player.radius;

            const colliderDesc = RAPIER.ColliderDesc
                .capsule(duckHalfHeight, PhysicsConfig.player.radius)  // ✅ METERS
                .setFriction(PhysicsConfig.player.friction)
                .setRestitution(PhysicsConfig.player.restitution)
                .setDensity(PhysicsConfig.player.density);

            this.collider = this.world.createCollider(colliderDesc, this.body);

            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.PLAYER_DUCK, {
                    position: this.body.translation()
                });
            }

        } else if (!this.isDucking && wasDucking) {
            // Stop ducking
            this.sprite.setRotation(0);

            // Restore original capsule
            this.world.removeCollider(this.collider);

            const standPixelHeight = 48;  // Standing height
            const standHalfHeight = pixelsToMeters(standPixelHeight / 2) - PhysicsConfig.player.radius;

            const colliderDesc = RAPIER.ColliderDesc
                .capsule(standHalfHeight, PhysicsConfig.player.radius)  // ✅ METERS
                .setFriction(PhysicsConfig.player.friction)
                .setRestitution(PhysicsConfig.player.restitution)
                .setDensity(PhysicsConfig.player.density);

            this.collider = this.world.createCollider(colliderDesc, this.body);
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