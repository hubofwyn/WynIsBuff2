import Phaser from 'phaser';
// RAPIER is now loaded in Boot scene and passed via registry
import { EventNames } from '../../constants/EventNames';
import { PhysicsConfig } from '../../constants/PhysicsConfig.js';
import { PIXELS_PER_METER, pixelsToMeters, metersToPixels } from '../../constants/PhysicsConstants.js';
import { MovementTuning, FIXED_TIMESTEP } from '../../constants/MovementTuning.js';
import { JumpController } from './JumpController';
import { MovementController } from './MovementController';
import { CollisionController } from './CollisionController';
import { WallJumpController } from './WallJumpController';
import { CollisionGroups } from '../../constants/CollisionGroups.js';
import { KccAdapter } from './KccAdapter.js';

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
        
        // Get RAPIER from registry
        this.RAPIER = scene.registry.get('RAPIER');
        if (!this.RAPIER) {
            throw new Error('[PlayerController] RAPIER not found in registry!');
        }
        
        // P0: Assert single Rapier world instance
        if (scene.physicsManager && scene.physicsManager.getWorld) {
            const physicsManagerWorld = scene.physicsManager.getWorld();
            console.assert(this.world === physicsManagerWorld, '[FATAL] PlayerController has different Rapier World instance');
            if (this.world !== physicsManagerWorld) {
                throw new Error('PlayerController world mismatch - different Rapier World instance!');
            }
        }
        
        // Modern character controller setup
        this.body = null;                    // Dynamic body for proper physics
        this.collider = null;                // Character collider
        
        // Create debug graphics for raycast visualization
        this.debugGraphics = this.scene.add.graphics();
        this.debugGraphics.setDepth(1000); // Make sure it's on top
        this.sprite = null;                  // Visual representation
        this.onGround = false;               // Ground detection state
        this.noMotionFrames = 0;             // Health check counter
        
        // Movement state for proper physics integration
        this.velocity = { x: 0, y: 0 };  // In meters per second (simple object, not RAPIER.Vector2)
        this.isGrounded = false;
        this.groundContactTimer = 0;
        
        // Game feel timers
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.landingRecoveryTimer = 0;
        
        // Circuit breaker state
        this.disabledWarningShown = false;
        
        // Create the player at the specified position
        this.create(x, y);

        // KCC adapter for ground probing (movement remains dynamic)
        this.kcc = new KccAdapter({
            RAPIER: this.RAPIER,
            world: this.world,
            body: this.body,
            collider: this.collider,
            pxPerMeter: PIXELS_PER_METER
        });
        
        // Set up input handlers
        this.setupControls();
        
        // Emit player spawn event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_SPAWN, {
                position: { x, y },
                sprite: this.sprite
            });
        }
        
        // Initialized
    }
    
    /**
     * Create the modern character controller setup with proper scaling
     * @param {number} x - Initial x position in pixels
     * @param {number} y - Initial y position in pixels
     */
    create(x, y) {
        try {
            
            // Player dimensions in pixels
            const playerWidth = 32;   // Smaller, more precise hitbox
            const playerHeight = 48;  // Taller for platformer character feel
            
            // Create visual representation
            if (this.scene.textures.exists(this.textureKey)) {
                this.sprite = this.scene.add.sprite(x, y, this.textureKey);
                this.sprite.setDisplaySize(playerWidth, playerHeight);
            } else {
                this.sprite = this.scene.add.rectangle(x, y, playerWidth, playerHeight, 0x00ff00);
            }
            this.sprite.setDepth(100);
            this.sprite.setVisible(true);
            
            // Add glow effect
            this.createGlowEffect();
            
            // Create DYNAMIC body for proper physics-based movement
            const bodyDesc = this.RAPIER.RigidBodyDesc
                .dynamic()
                .setTranslation(pixelsToMeters(x), pixelsToMeters(y))
                .setCanSleep(false)        // Prevent sleeping
                .lockRotations(true)        // Prevent rotation for platformer feel
                .setLinearDamping(4.0);     // Smooth deceleration
            
            this.body = this.world.createRigidBody(bodyDesc);
            
            // P0-7: Enable CCD to prevent tunneling
            this.body.enableCcd(true);
            
            // Verify body type
            const bodyType = this.body.bodyType();
            const initialLinvel = this.body.linvel();
            
            // Ensure dynamic body
            if (bodyType !== 0) {
                throw new Error(`Player body is not dynamic! Type=${bodyType}`);
            }
            
            // Create box collider for player
            const colliderDesc = this.RAPIER.ColliderDesc
                .cuboid(
                    pixelsToMeters(playerWidth / 2),
                    pixelsToMeters(playerHeight / 2)
                )
                .setFriction(PhysicsConfig.player.friction || 0.8)
                .setRestitution(PhysicsConfig.player.restitution || 0.0)
                .setDensity(PhysicsConfig.player.density || 2.0)
                .setActiveEvents(
                    (this.RAPIER.ActiveEvents?.COLLISION_EVENTS || 0)
                    | (this.RAPIER.ActiveEvents?.INTERSECTION_EVENTS || 0)
                );
            
            this.collider = this.world.createCollider(colliderDesc, this.body);
            
            // P0: Verify collider is not sensor and properly attached
            console.assert(!this.collider.isSensor(), '[P0] Player collider is sensor - will not resolve contacts!');
            console.assert(this.collider.parent() === this.body, '[P0] Player collider not attached to body');
            
            // Set collision groups: PLAYER collides with STATIC and DYNAMIC
            const collideWith = (CollisionGroups.STATIC | CollisionGroups.DYNAMIC);
            this.collider.setCollisionGroups(CollisionGroups.createMask(CollisionGroups.PLAYER, collideWith));
            
            // Enable all collision types for dynamic body
            this.collider.setActiveCollisionTypes(
                this.RAPIER.ActiveCollisionTypes.DEFAULT |
                this.RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED |
                this.RAPIER.ActiveCollisionTypes.KINEMATIC_DYNAMIC
            );
            
            // Collider verified
        } catch (error) {
            console.error('[PlayerController] Error in create:', error);
        }
    }
    
    /**
     * Set input keys from InputManager
     * @param {Object} keys - Keys object from InputManager
     */
    setInputKeys(keys) {
        // Create scene-specific key references
        
        // IMPORTANT: Create our own key references for this scene
        // Phaser keys are scene-specific, so we need keys for THIS scene
        const keyboard = this.scene.input.keyboard;
        
        // Create cursor keys for this scene
        this.cursors = keyboard.createCursorKeys();
        
        // Create WASD keys for this scene
        this.wasd = {
            up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Create other keys
        this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.duckKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        
        // Keys created
    }
    
    /**
     * Set up keyboard controls
     */
    setupControls() {
        // Get InputManager singleton instance
        const inputManager = this.scene.inputManager;
        
        if (inputManager && inputManager.keys) {
            const keys = inputManager.keys;
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
            // Direct keyboard controls as fallback
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
        
        // Skip extra event debug listeners
        
        // Track ducking state
        this.isDucking = false;
    }
    
    /**
     * Update player using dynamic body with velocity control
     * @param {number} deltaTime - Frame time in milliseconds
     */
    update(deltaTime) {
        // TRIAGE FIX: Only run player updates in appropriate scenes (avoid running in menus)
        if (this.scene && this.scene.scene && this.scene.scene.key) {
            const sceneKey = this.scene.scene.key;
            const validScenes = ['Game', 'RunScene', 'TestScene', 'HubScene', 'TestScene_CharacterMotion'];
            if (!validScenes.includes(sceneKey)) {
                return; // Don't run player updates in menu scenes
            }
        }
        
        // TRIAGE FIX: Early exit guards to prevent crashes
        if (!this.body || !this.collider || !this.sprite) {
            console.warn('[PlayerController] Missing essential components, skipping update');
            return;
        }
        
        // Skip verbose input debug logs
        
        // Circuit breaker: disable if too many errors
        if (this.errorCount > 5) {
            // Stop spamming warnings once disabled
            if (!this.disabledWarningShown) {
                console.warn('[PlayerController] Too many errors, player disabled');
                this.disabledWarningShown = true;
            }
            return;
        }
        
        try {
            // TRIAGE FIX: Clamp deltaTime to prevent physics explosions
            const clampedDelta = Math.min(deltaTime, 50); // Cap at 50ms (20 FPS minimum)
            const dt = clampedDelta / 1000; // Convert to seconds
            
            // TRIAGE FIX: Validate dt is finite
            if (!Number.isFinite(dt) || dt <= 0) {
                console.warn('[PlayerController] Invalid deltaTime:', deltaTime);
                return;
            }
            
            // Update game feel timers
            this.updateTimers(dt);
            
            // Check ground state with raycast
            this.checkGroundContact();
            
            // Handle input and apply forces
            this.handleMovementInput(dt);
            
            // Health check for stuck movement
            this.performHealthCheck();
            
            // Handle landing detection and recovery
            this.handleLandingDetection();
            
            // Update sprite position to match physics body
            this.updateSpritePosition();
            
            // Handle ducking
            this.handleDucking();
            
            // Reset error count on successful update
            this.errorCount = 0;
            
        } catch (error) {
            this.errorCount = (this.errorCount || 0) + 1;
            console.error(`[PlayerController] Error in update (${this.errorCount}/5):`, error);
            
            // Emergency fallback: try to at least update sprite position
            try {
                if (this.body && this.sprite) {
                    this.updateSpritePosition();
                }
            } catch (fallbackError) {
                console.error('[PlayerController] Fallback update also failed:', fallbackError);
            }
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
     * Check ground contact using KccAdapter probe
     */
    checkGroundContact() {
        const wasGrounded = this.onGround;
        const mask = CollisionGroups.createMask(
            CollisionGroups.PLAYER,
            (CollisionGroups.STATIC | CollisionGroups.DYNAMIC)
        );
        const grounded = this.kcc ? this.kcc.probeGround(8, mask) : false;
        this.onGround = !!grounded;

        // Visual indicator (short line under the player)
        if (this.debugGraphics && this.sprite) {
            const x = this.sprite.x;
            const y = this.sprite.y + 24 + 2; // bottom + small offset
            this.debugGraphics.clear();
            this.debugGraphics.lineStyle(2, this.onGround ? 0x00ff00 : 0xff0000, 1);
            this.debugGraphics.beginPath();
            this.debugGraphics.moveTo(x, y);
            this.debugGraphics.lineTo(x, y + 10);
            this.debugGraphics.strokePath();
        }

        if (wasGrounded && !this.onGround) {
            this.coyoteTimer = MovementTuning.COYOTE_TIME;
        }
        if (this.onGround) {
            this.groundContactTimer = 0;
        } else {
            this.groundContactTimer += 1 / 60;
        }
    }
    
    /**
     * Handle movement input and apply velocities to dynamic body
     * @param {number} dt - Delta time in seconds
     */
    handleMovementInput(dt) {
        // Get current velocity
        const linvel = this.body.linvel();
        let targetVx = linvel.x;
        
        // Handle horizontal input
        let horizontalInput = 0;
        
        // Debug key state checking
        if (!this.cursors || !this.wasd) {
            console.warn('[PlayerController] Keys not initialized!', {
                cursors: !!this.cursors,
                wasd: !!this.wasd
            });
            return;
        }
        
        // Check if keys exist and their state
        const leftPressed = (this.cursors?.left?.isDown || this.wasd?.left?.isDown);
        const rightPressed = (this.cursors?.right?.isDown || this.wasd?.right?.isDown);
        
        if (leftPressed) {
            horizontalInput = -1;
            targetVx = -MovementTuning.WALK_SPEED; // Use tuned meters/sec
        } else if (rightPressed) {
            horizontalInput = 1;
            targetVx = MovementTuning.WALK_SPEED; // Use tuned meters/sec
        } else {
            targetVx = 0; // Stop when no input
        }
        
        // Apply horizontal via adapter if enabled; otherwise direct
        const currentY = this.body.linvel().y; // Get FRESH Y velocity right before setting
        if (MovementTuning.USE_KCC_HORIZONTAL && this.kcc && typeof this.kcc.applyHorizontalVelocity === 'function') {
            this.kcc.applyHorizontalVelocity(targetVx);
        } else {
            this.body.setLinvel({ x: targetVx, y: currentY }, true);
        }
        
        // Skip verbose movement logs
        
        // Handle jumping
        this.handleJumpInput();
    }
    
    /**
     * Handle jump input with modern game feel mechanics
     */
    handleJumpInput() {
        const jumpPressed = this.spaceKey?.isDown;
        const jumpJustPressed = this.spaceKey ? Phaser.Input.Keyboard.JustDown(this.spaceKey) : false;
        
        // Jump buffering - remember jump input for a short time
        if (jumpJustPressed) {
            this.jumpBufferTimer = MovementTuning.JUMP_BUFFER_TIME;
        }
        
        // Can jump if grounded OR within coyote time
        const canJump = this.onGround || this.coyoteTimer > 0;
        
        // DETAILED DEBUG: Log jump decision factors
        if (this.jumpBufferTimer > 0 && !canJump) {
            console.warn('[JUMP BLOCKED] Player is not grounded!');
        }
        
        // Execute jump if we can jump and have buffered input
        if (canJump && this.jumpBufferTimer > 0) {
            const beforeVel = this.body.linvel();
            const jumpVelocity = -MovementTuning.JUMP_VELOCITY; // Negative for upward in Rapier
            this.body.setLinvel({ x: beforeVel.x, y: jumpVelocity }, true);
            const afterVel = this.body.linvel();
            
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            
            // Jump applied
            
            // Emit jump event
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.PLAYER_JUMP, {
                    position: this.body.translation(),
                    velocity: { x: beforeVel.x, y: jumpVelocity }
                });
            }
        }
        
        // Variable jump height - cut jump short if released early
        if (!jumpPressed) {
            const currentVel = this.body.linvel();
            if (currentVel.y < 0) { // Going up
                const minJumpVel = -MovementTuning.JUMP_VELOCITY * MovementTuning.VARIABLE_JUMP_MIN_HEIGHT;
                if (currentVel.y < minJumpVel) {
                    this.body.setLinvel({ x: currentVel.x, y: minJumpVel }, true);
                }
            }
        }
    }
    
    /**
     * Perform health check for stuck movement
     */
    performHealthCheck() {
        const linvel = this.body.linvel();
        const hasInput = this.cursors?.left?.isDown || this.cursors?.right?.isDown || 
                        this.wasd?.left?.isDown || this.wasd?.right?.isDown;
        
        // Check if we're stuck (input but no movement)
        if (hasInput && Math.abs(linvel.x) < MovementTuning.MOTION_THRESHOLD) {
            this.noMotionFrames++;
            if (this.noMotionFrames > MovementTuning.HEALTH_CHECK_FRAMES) {
                console.error('[HEALTH][Player] 30f no-motion under input — check bodyType/linvel');
                console.error('[HEALTH] Body type:', this.body.bodyType(), '(0=dynamic, 1=static, 2=kinematic)');
                console.error('[HEALTH] linvel:', { x: linvel.x.toFixed(3), y: linvel.y.toFixed(3) });
                console.error('[HEALTH] onGround:', this.onGround, 'hasInput:', hasInput);
                this.noMotionFrames = 0; // Reset counter
            }
        } else {
            this.noMotionFrames = 0;
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
            
            // Create new horizontal collider (values are half-extents in meters)
            const playerColliderDesc = this.RAPIER.ColliderDesc
                .cuboid(pixelsToMeters(24), pixelsToMeters(16))
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
            
            const playerColliderDesc = this.RAPIER.ColliderDesc
                .cuboid(pixelsToMeters(16), pixelsToMeters(24))
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
     * @returns {Object} The player's physics body
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
