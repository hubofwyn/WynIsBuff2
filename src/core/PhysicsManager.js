import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../constants/EventNames';
import { PhysicsConfig } from '../constants/PhysicsConfig';
import { BaseManager } from './BaseManager';
import { getLogger } from './Logger';

/**
 * PhysicsManager class handles the Rapier physics world and synchronization
 * between physics bodies and sprites.
 * Follows the singleton pattern via BaseManager.
 */
export class PhysicsManager extends BaseManager {
    /**
     * Create PhysicsManager as a singleton
     */
    constructor() {
        super();
        if (this.isInitialized()) return;
        
        this.logger = getLogger('PhysicsManager');
        this.scene = null;
        this.eventSystem = null;
        this.world = null;
        this.bodyToSprite = new Map();
        
        // Collision event handlers
        this.collisionHandlers = new Map();
        
        // Fixed timestep accumulator
        this.accumulator = 0;
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
    async init(scene, eventSystem, gravityX = PhysicsConfig.gravityX, gravityY = PhysicsConfig.gravityY) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        try {
            this.logger.info('Initializing Rapier...');
            await RAPIER.init();
            this.logger.info('Rapier initialized successfully');
            
            // Create physics world with gravity
            this.world = new RAPIER.World(new RAPIER.Vector2(gravityX, gravityY));
            this.logger.info('Rapier world created with gravity:', gravityX, gravityY);
            
            // Set up collision event handling
            this.setupCollisionEvents();
            
            this._initialized = true;
            
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.GAME_INIT, {
                    module: 'physics',
                    gravity: { x: gravityX, y: gravityY }
                });
            }
            
            return true;
        } catch (error) {
            this.logger.error('Error initializing physics:', error);
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
            this.logger.warn('contactPairEvents is not available, using fallback collision detection.');
            this.world.bodies.forEach(body => {
                // Implement fallback collision detection logic here
            });
        }
        
        this.logger.debug('Collision events set up');
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
                this.logger.error('Error in collision handler:', error);
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
     * @param {number} delta - Time since last frame in milliseconds
     */
    update(delta) {
        if (!this._initialized || !this.world) {
            return;
        }
        
        try {
            // Convert delta from milliseconds to seconds
            const deltaSeconds = delta ? delta / 1000 : 1/60;
            
            // Cap delta to prevent spiral of death (max 1/30 second = ~33ms)
            const cappedDelta = Math.min(deltaSeconds, 1/30);
            
            // Fixed timestep for deterministic physics
            const fixedTimeStep = 1/60; // 60 Hz physics
            this.accumulator += cappedDelta;
            
            // Limit max steps per frame to prevent freezing on slow systems
            const maxStepsPerFrame = 3;
            let steps = 0;
            
            // Track physics timing for performance monitoring
            const startTime = performance.now();
            
            // Step physics with fixed timestep
            while (this.accumulator >= fixedTimeStep && steps < maxStepsPerFrame) {
                this.world.step();
                this.accumulator -= fixedTimeStep;
                steps++;
            }
            
            // Record physics metrics
            const physicsTime = performance.now() - startTime;
            
            // Emit performance metrics if we have the event system
            if (this.eventSystem && steps > 0) {
                this.eventSystem.emit('physics:performance', {
                    steps: steps,
                    time: physicsTime,
                    accumulator: this.accumulator
                });
            }
            
            // If we hit max steps, reset accumulator to prevent permanent lag
            if (steps >= maxStepsPerFrame) {
                this.accumulator = 0;
                this.logger.warn('Frame budget exceeded, resetting accumulator');
            }
            
            // Calculate interpolation factor for smooth rendering
            const interpolation = this.accumulator / fixedTimeStep;
            
            // Update all sprites based on their physics bodies with interpolation
            this.updateGameObjects(interpolation);
        } catch (error) {
            this.logger.error('Error in update:', error);
        }
    }
    
    /**
     * Update all game objects based on their physics bodies
     * @param {number} interpolation - Interpolation factor for smooth rendering (0-1)
     */
    updateGameObjects(interpolation = 0) {
        try {
            // Update all sprites based on their physics bodies
            this.world.bodies.forEach(body => {
                const sprite = this.bodyToSprite.get(body.handle);
                
                if (sprite) {
                    const position = body.translation();
                    const rotation = body.rotation();
                    
                    // Store previous position if not exists
                    if (!sprite.prevX) {
                        sprite.prevX = position.x;
                        sprite.prevY = position.y;
                        sprite.prevRotation = rotation;
                    }
                    
                    // Interpolate between previous and current position for smooth rendering
                    if (interpolation > 0 && interpolation < 1) {
                        sprite.x = sprite.prevX + (position.x - sprite.prevX) * interpolation;
                        sprite.y = sprite.prevY + (position.y - sprite.prevY) * interpolation;
                        sprite.rotation = sprite.prevRotation + (rotation - sprite.prevRotation) * interpolation;
                    } else {
                        // Direct assignment when no interpolation
                        sprite.x = position.x;
                        sprite.y = position.y;
                        sprite.rotation = rotation;
                        
                        // Update previous values for next frame
                        sprite.prevX = position.x;
                        sprite.prevY = position.y;
                        sprite.prevRotation = rotation;
                    }
                }
            });
        } catch (error) {
            this.logger.error('Error in updateGameObjects:', error);
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
    // Inherited from BaseManager
    
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
        
        this.scene = null;
        this.eventSystem = null;
        
        // Call parent destroy
        super.destroy();
    }
}