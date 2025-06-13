import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../constants/EventNames';
import { PhysicsConfig } from '../constants/PhysicsConfig';

/**
 * PhysicsManager class handles the Rapier physics world and synchronization
 * between physics bodies and sprites.
 */
export class PhysicsManager {
    /**
     * Create a new PhysicsManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        this.world = null;
        this.initialized = false;
        this.bodyToSprite = new Map();
        
        // Collision event handlers
        this.collisionHandlers = new Map();
    }
    
    /**
     * Initialize the Rapier physics engine
     * @param {number} gravityX - Horizontal gravity
     * @param {number} gravityY - Vertical gravity
     * @returns {Promise<boolean>} Promise that resolves to true if initialization was successful
     */
    /**
     * Initialize the Rapier physics engine with configurable gravity.
     * @param {number} [gravityX=PhysicsConfig.gravityX] - Horizontal gravity
     * @param {number} [gravityY=PhysicsConfig.gravityY] - Vertical gravity
     */
    async initialize(gravityX = PhysicsConfig.gravityX, gravityY = PhysicsConfig.gravityY) {
        try {
            console.log('[PhysicsManager] Initializing Rapier...');
            await RAPIER.init();
            console.log('[PhysicsManager] Rapier initialized successfully');
            
            // Create physics world with gravity
            this.world = new RAPIER.World(new RAPIER.Vector2(gravityX, gravityY));
            console.log('[PhysicsManager] Rapier world created with gravity:', gravityX, gravityY);
            
            // Set up collision event handling
            this.setupCollisionEvents();
            
            this.initialized = true;
            
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.GAME_INIT, {
                    module: 'physics',
                    gravity: { x: gravityX, y: gravityY }
                });
            }
            
            return true;
        } catch (error) {
            console.error('[PhysicsManager] Error initializing physics:', error);
            return false;
        }
    }
    
    /**
     * Set up collision event handling
     */
    setupCollisionEvents() {
        if (!this.world) {
            return;
        }
        
        // Check if contactPairEvents is available
        if (this.world.contactPairEvents) {
            this.world.contactPairEvents.on('begin', (event) => {
                // Extract the body handles from the event
                const bodyHandleA = event.collider1.parent().handle;
                const bodyHandleB = event.collider2.parent().handle;
                
                // Get the positions of the colliding bodies
                const bodyA = this.world.getBodyByHandle(bodyHandleA);
                const bodyB = this.world.getBodyByHandle(bodyHandleB);
                
                if (!bodyA || !bodyB) {
                    return;
                }
                
                const positionA = bodyA.translation();
                const positionB = bodyB.translation();
                
                // Emit collision event
                if (this.eventSystem) {
                    this.eventSystem.emit(EventNames.COLLISION_START, {
                        bodyHandleA,
                        bodyHandleB,
                        positionA: { x: positionA.x, y: positionA.y },
                        positionB: { x: positionB.x, y: positionB.y }
                    });
                }
                
                // Call any registered collision handlers
                this.handleCollision(bodyHandleA, bodyHandleB);
            });
        } else {
            // Fallback for collision event handling if contactPairEvents is not available
            console.warn('[PhysicsManager] contactPairEvents is not available, using fallback collision detection.');
            this.world.bodies.forEach(body => {
                // Implement fallback collision detection logic here
            });
        }
        
        console.log('[PhysicsManager] Collision events set up');
    }
    
    /**
     * Register a collision handler
     * @param {string} key - Unique identifier for the handler
     * @param {Function} handler - Function to call when a collision occurs
     */
    registerCollisionHandler(key, handler) {
        if (typeof handler === 'function') {
            this.collisionHandlers.set(key, handler);
        }
    }
    
    /**
     * Unregister a collision handler
     * @param {string} key - Unique identifier for the handler
     */
    unregisterCollisionHandler(key) {
        this.collisionHandlers.delete(key);
    }
    
    /**
     * Handle a collision between two bodies
     * @param {number} bodyHandleA - Handle of the first body
     * @param {number} bodyHandleB - Handle of the second body
     */
    handleCollision(bodyHandleA, bodyHandleB) {
        // Call all registered collision handlers
        this.collisionHandlers.forEach((handler) => {
            try {
                handler(bodyHandleA, bodyHandleB);
            } catch (error) {
                console.error('[PhysicsManager] Error in collision handler:', error);
            }
        });
    }
    
    /**
     * Register a body-sprite pair for synchronization
     * @param {RAPIER.RigidBody} body - The physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The sprite to sync with
     */
    registerBodySprite(body, sprite) {
        if (body && sprite) {
            this.bodyToSprite.set(body.handle, sprite);
        }
    }
    
    /**
     * Register multiple body-sprite pairs from a map
     * @param {Map} bodyToSpriteMap - Map of body handles to sprites
     */
    registerBodySpriteMap(bodyToSpriteMap) {
        if (bodyToSpriteMap && bodyToSpriteMap instanceof Map) {
            // Merge the maps
            bodyToSpriteMap.forEach((sprite, handle) => {
                this.bodyToSprite.set(handle, sprite);
            });
        }
    }
    
    /**
     * Step the physics simulation and update sprites
     */
    update() {
        if (!this.initialized || !this.world) {
            return;
        }
        
        try {
            // Step the physics world
            this.world.step();
            
            // Update all sprites based on their physics bodies
            this.updateGameObjects();
        } catch (error) {
            console.error('[PhysicsManager] Error in update:', error);
        }
    }
    
    /**
     * Update all game objects based on their physics bodies
     */
    updateGameObjects() {
        try {
            // Update all sprites based on their physics bodies
            this.world.bodies.forEach(body => {
                const sprite = this.bodyToSprite.get(body.handle);
                
                if (sprite) {
                    const position = body.translation();
                    const rotation = body.rotation();
                    
                    sprite.x = position.x;
                    sprite.y = position.y;
                    sprite.rotation = rotation;
                }
            });
        } catch (error) {
            console.error('[PhysicsManager] Error in updateGameObjects:', error);
        }
    }
    
    /**
     * Get the Rapier physics world
     * @returns {RAPIER.World} The physics world
     */
    getWorld() {
        return this.world;
    }
    
    /**
     * Check if physics is initialized
     * @returns {boolean} True if physics is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    
    /**
     * Get the body-to-sprite mapping
     * @returns {Map} Map of body handles to sprites
     */
    getBodyToSpriteMap() {
        return this.bodyToSprite;
    }
    
    /**
     * Clean up resources when the scene is shut down
     */
    shutdown() {
        // Clear collision handlers
        this.collisionHandlers.clear();
        
        // Clear body-sprite mapping
        this.bodyToSprite.clear();
        
        // Destroy the physics world
        if (this.world) {
            // Note: Rapier doesn't have a direct destroy method,
            // but we can help garbage collection by removing references
            this.world = null;
        }
        
        this.initialized = false;
    }
}