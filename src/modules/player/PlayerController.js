import Phaser from 'phaser';
import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../../constants/EventNames';
import { JumpController } from './JumpController';
import { MovementController } from './MovementController';
import { CollisionController } from './CollisionController';

/**
 * PlayerController class coordinates all player-related functionality
 * by delegating to specialized controllers for movement, jumping, and collisions.
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
    /**
     * @param {Phaser.Scene} scene
     * @param {RAPIER.World} world
     * @param {EventSystem} eventSystem
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     * @param {string} textureKey - Key of the sprite texture to use
     */
    constructor(scene, world, eventSystem, x = 512, y = 300, textureKey = 'player') {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;
        this.textureKey = textureKey;
        
        // Player physics objects
        this.body = null;
        this.sprite = null;
        this.collider = null;
        
        // Create specialized controllers
        this.jumpController = new JumpController(scene, eventSystem);
        this.movementController = new MovementController(scene, eventSystem);
        this.collisionController = new CollisionController(scene, eventSystem);
        
        // Create the player at the specified position
        this.create(x, y);
        
        // Set up input handlers
        this.setupControls();
        
        // Emit player spawn event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_SPAWN, {
                position: { x, y },
                maxJumps: this.jumpController.maxJumps,
                sprite: this.sprite
            });
        }
        
        console.log('[PlayerController] Initialized with modular architecture');
    }
    
    /**
     * Create the player physics body and sprite
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     */
    create(x, y) {
        try {
            console.log('[PlayerController] Creating player...');
            
            // Player dimensions - doubled for better visibility
            const playerWidth = 64;
            const playerHeight = 64;
            
            // Create a visual representation of the player
            if (this.scene.textures.exists(this.textureKey)) {
                console.log('[PlayerController] Using texture:', this.textureKey);
                this.sprite = this.scene.add.sprite(x, y, this.textureKey);
                this.sprite.setDisplaySize(playerWidth, playerHeight);
                // Ensure sprite is visible and on top
                this.sprite.setDepth(100);
                this.sprite.setVisible(true);
            } else {
                console.log('[PlayerController] Texture not found:', this.textureKey, 'using rectangle');
                this.sprite = this.scene.add.rectangle(
                    x, y, playerWidth, playerHeight, 0x0000ff
                );
                this.sprite.setDepth(100);
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
                .setFriction(0.1)      // Low friction for momentum sliding
                .setDensity(2.0)       // High density for heavy feel
                .setRestitution(0.15); // Slight bounce for impact feedback
                
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
     * Update method called every frame
     * @param {Array} platforms - Array of platforms to check for collisions
     */
    update(platforms) {
        if (!this.body) return;
        
        try {
            // Process collisions to detect ground contact
            const isOnGround = this.collisionController.update(this.body, platforms);
            
            // Update jump controller with ground state
            this.jumpController.setGroundState(isOnGround);
            
            // Get landing recovery state from jump controller
            const jumpState = this.jumpController.getJumpState();
            
            // Handle ducking
            this.handleDucking();
            
            // Update movement controller
            this.movementController.update(
                this.body, 
                this.sprite, 
                { cursors: this.cursors, wasd: this.wasd, spaceKey: this.spaceKey },
                isOnGround,
                jumpState.isInLandingRecovery
            );
            
            // Update jump controller (disable jumping while ducking)
            if (!this.isDucking) {
                this.jumpController.update(
                    this.body, 
                    this.sprite, 
                    { cursors: this.cursors, wasd: this.wasd, spaceKey: this.spaceKey }
                );
            }
            
            // Update sprite position to match physics body
            this.updateSpritePosition();
        } catch (error) {
            console.error('[PlayerController] Error in update:', error);
        }
    }
    
    /**
     * Update sprite position to match physics body
     */
    updateSpritePosition() {
        if (!this.body || !this.sprite) return;
        
        const position = this.body.translation();
        this.sprite.setPosition(position.x, position.y);
        
        // Don't update rotation from physics if ducking
        if (!this.isDucking) {
            this.sprite.setRotation(this.body.rotation());
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
     * Get the jump controller
     * @returns {JumpController} The jump controller
     */
    getJumpController() {
        return this.jumpController;
    }
    
    /**
     * Get the movement controller
     * @returns {MovementController} The movement controller
     */
    getMovementController() {
        return this.movementController;
    }
    
    /**
     * Get the collision controller
     * @returns {CollisionController} The collision controller
     */
    getCollisionController() {
        return this.collisionController;
    }
    
    /**
     * Clean up resources when scene is shut down
     */
    shutdown() {
        // Clean up controllers
        this.jumpController.shutdown();
        // Clean up input listeners via InputManager
        if (this.scene.inputManager) {
            this.scene.inputManager.destroy();
        }
    }
}