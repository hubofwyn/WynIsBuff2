// RAPIER is now loaded in Boot scene and passed via registry
import { EventNames } from '../constants/EventNames';
import { PhysicsConfig } from '../constants/PhysicsConfig';
import { metersToPixels } from '../constants/PhysicsConstants.js';
import { BaseManager } from './BaseManager';

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
        
        this.scene = null;
        this.eventSystem = null;
        this.world = null;
        this.bodyToSprite = new Map();
        
        // Collision event handlers
        this.collisionHandlers = new Map();
        
        // Fixed timestep accumulator
        this.accumulator = 0;
        
        // Circuit breaker state
        this.disabledWarningShown = false;
        
        // Contact instrumentation
        this._contactsPerStep = 0;
        this._lastPhysBeacon = 0;
        this._lastContactsPerSec = 0;
        this._contactsLastStep = 0;
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
            // Get RAPIER from registry (already initialized in Boot scene)
            const RAPIER = scene.registry.get('RAPIER');
            if (!RAPIER) {
                console.error('[PhysicsManager] RAPIER not found in registry! Was Boot scene run?');
                return false;
            }
            console.log('[PhysicsManager] Using RAPIER from registry');
            
            // Store RAPIER reference for later use
            this.RAPIER = RAPIER;
            
            // Create physics world with gravity using non-deprecated API
            const gravity = { x: gravityX, y: gravityY };
            this.world = new RAPIER.World(gravity);
            console.log('[PhysicsManager] Rapier world created with gravity:', gravityX, gravityY);
            
            // Create event queue for collision detection - CRITICAL for world.step()
            console.log('[PhysicsManager] Creating event queue for collision handling...');
            this.eventQueue = new this.RAPIER.EventQueue(true); // The 'true' enables contact events
            
            if (this.eventQueue) {
                console.log('[PhysicsManager] ✅ EventQueue created successfully.');
            } else {
                console.error('[PhysicsManager] ❌ FAILED to create EventQueue!');
            }
            
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
        
        // We rely on eventQueue draining during step() to emit collision events consistently.
        // No setup required here; keep method for parity with previous architecture.
        console.log('[PhysicsManager] Collision events will be emitted via eventQueue draining.');
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
     * Step the physics simulation with modern configuration
     * @param {number} delta - Time since last frame in milliseconds
     */
    update(delta) {
        if (!this._initialized || !this.world) {
            return;
        }
        
        // TRIAGE FIX: Only run physics in appropriate scenes (avoid running in menus)
        if (this.scene && this.scene.scene && this.scene.scene.key) {
            const sceneKey = this.scene.scene.key;
            const validScenes = ['Game', 'GameScene', 'RunScene', 'TestScene', 'HubScene'];
            if (!validScenes.includes(sceneKey)) {
                console.log('[PhysicsManager] Skipping physics update for scene:', sceneKey);
                return; // Don't run physics in menu scenes
            }
        }
        
        // TRIAGE FIX: Circuit breaker for repeated errors (increased threshold)
        if (this.errorCount > 50) { // Increased from 10 to 50 to be less aggressive
            // Stop spamming warnings once disabled
            if (!this.disabledWarningShown) {
                console.warn('[PhysicsManager] Too many errors, physics disabled');
                this.disabledWarningShown = true;
            }
            return;
        }
        
        try {
            // TRIAGE FIX: Validate delta is a finite number
            if (!Number.isFinite(delta) || delta < 0 || delta > 1000) {
                console.warn('[PhysicsManager] Invalid delta:', delta, 'using fallback');
                delta = 16.67; // Fallback to 60fps
            }
            
            // Convert delta from milliseconds to seconds
            const deltaSeconds = delta ? delta / 1000 : PhysicsConfig.timeStep;
            
            // TRIAGE FIX: More aggressive delta capping to prevent physics explosions
            const cappedDelta = Math.min(deltaSeconds, 1/20); // Cap to 50ms (20 FPS minimum)
            
            // Fixed timestep for deterministic physics (as recommended in guide)
            const fixedTimeStep = PhysicsConfig.timeStep; // 1/60 for 60Hz
            this.accumulator += cappedDelta;
            
            // Limit max steps per frame to prevent spiral of death
            const MAX_SUBSTEPS = 5;
            let steps = 0;
            
            // Track physics timing only in debug mode
            const DEBUG_PHYSICS = false;
            const startTime = DEBUG_PHYSICS ? performance.now() : 0;
            
            // Configure integration parameters for improved stability
            const integrationParameters = new this.RAPIER.IntegrationParameters();
            integrationParameters.dt = fixedTimeStep;
            integrationParameters.max_velocity_iterations = PhysicsConfig.maxVelIterations;
            integrationParameters.max_position_iterations = PhysicsConfig.maxPosIterations;
            integrationParameters.erp = PhysicsConfig.erp; // Error reduction parameter
            
            // Step physics with proper integration parameters
            while (this.accumulator >= fixedTimeStep && steps < MAX_SUBSTEPS) {
                let stepContacts = 0;
                // Step the physics world with the event queue
                // The integrationParameters are set on the world, not passed to step()
                this.world.integrationParameters = integrationParameters;
                this.world.step(this.eventQueue);
                
                // Drain collision events and count contacts
                // Contact events (solid collisions)
                this.eventQueue.drainCollisionEvents((h1, h2, started) => {
                    this._contactsPerStep++;
                    stepContacts++;
                    if (this.eventSystem) {
                        try {
                            const bodyA = this.world.getBodyByHandle(h1);
                            const bodyB = this.world.getBodyByHandle(h2);
                            const positionA = bodyA ? bodyA.translation() : { x: 0, y: 0 };
                            const positionB = bodyB ? bodyB.translation() : { x: 0, y: 0 };
                            this.eventSystem.emit(EventNames.COLLISION_START, {
                                bodyHandleA: h1,
                                bodyHandleB: h2,
                                started,
                                positionA: { x: positionA.x, y: positionA.y },
                                positionB: { x: positionB.x, y: positionB.y }
                            });
                        } catch {}
                    }
                });
                // Intersection events (sensors/triggers)
                try {
                    if (typeof this.eventQueue.drainIntersectionEvents === 'function') {
                        this.eventQueue.drainIntersectionEvents((h1, h2, intersecting) => {
                            if (!intersecting) return;
                            if (this.eventSystem) {
                                try {
                                    const bodyA = this.world.getBodyByHandle(h1);
                                    const bodyB = this.world.getBodyByHandle(h2);
                                    const positionA = bodyA ? bodyA.translation() : { x: 0, y: 0 };
                                    const positionB = bodyB ? bodyB.translation() : { x: 0, y: 0 };
                                    this.eventSystem.emit(EventNames.COLLISION_START, {
                                        bodyHandleA: h1,
                                        bodyHandleB: h2,
                                        started: true,
                                        positionA: { x: positionA.x, y: positionA.y },
                                        positionB: { x: positionB.x, y: positionB.y },
                                        sensor: true
                                    });
                                } catch {}
                            }
                        });
                    }
                } catch {}
                
                this.accumulator -= fixedTimeStep;
                steps++;
                this._contactsLastStep = stepContacts;
                
                // Count total steps for validation
                this._stepCount = (this._stepCount || 0) + 1;
            }
            
            // Log step counter once per second
            const currentTime = performance.now();
            if (!this._lastBeacon || currentTime - this._lastBeacon > 1000) {
                this._lastBeacon = currentTime;
                console.log(`[PHYSICS] Steps per second: ${this._stepCount || 0}`);
                console.log(`[PHYS] contacts/sec: ${this._contactsPerStep}`);
                this._lastContactsPerSec = this._contactsPerStep;
                this._stepCount = 0;
                this._contactsPerStep = 0;
            }
            
            // Record physics metrics
            const physicsTime = performance.now() - startTime;
            
            // Only emit performance metrics in debug mode
            if (DEBUG_PHYSICS && this.eventSystem && steps > 0) {
                this.eventSystem.emit('physics:performance', {
                    steps: steps,
                    time: physicsTime,
                    accumulator: this.accumulator,
                    fixedTimeStep: fixedTimeStep
                });
            }
            
            // If starved, drop surplus to avoid spiral of death
            if (steps >= MAX_SUBSTEPS && this.accumulator >= fixedTimeStep) {
                this.accumulator = 0; // Reset silently
            }
            
            // Calculate interpolation factor for smooth rendering
            const interpolation = this.accumulator / fixedTimeStep;
            
            // Update all sprites with proper scaling
            this.updateGameObjects(interpolation);
            
            // Reset error count on successful update
            this.errorCount = 0;
            
        } catch (error) {
            this.errorCount = (this.errorCount || 0) + 1;
            console.error(`[PhysicsManager] Error in update (${this.errorCount}/50):`, error);
            
            // TRIAGE FIX: Emergency fallback - try to at least update sprites
            try {
                if (this.bodyToSprite && this.bodyToSprite.size > 0) {
                    this.updateGameObjects(0); // No interpolation in emergency mode
                }
            } catch (fallbackError) {
                console.error('[PhysicsManager] Fallback update also failed:', fallbackError);
            }
        }
    }
    
    /**
     * Update all game objects with proper meter-to-pixel scaling
     * @param {number} interpolation - Interpolation factor for smooth rendering (0-1)
     */
    updateGameObjects(interpolation = 0) {
        try {
            // Update all sprites based on their physics bodies with proper scaling
            this.world.bodies.forEach(body => {
                const sprite = this.bodyToSprite.get(body.handle);
                
                if (sprite) {
                    const position = body.translation();
                    const rotation = body.rotation();
                    
                    // Convert physics position (meters) to render position (pixels)
                    const pixelX = metersToPixels(position.x);
                    const pixelY = metersToPixels(position.y);
                    
                    // Store previous position if not exists
                    if (!sprite.prevX) {
                        sprite.prevX = pixelX;
                        sprite.prevY = pixelY;
                        sprite.prevRotation = rotation;
                    }
                    
                    // Interpolate between previous and current position for smooth rendering
                    if (interpolation > 0 && interpolation < 1) {
                        sprite.x = sprite.prevX + (pixelX - sprite.prevX) * interpolation;
                        sprite.y = sprite.prevY + (pixelY - sprite.prevY) * interpolation;
                        sprite.rotation = sprite.prevRotation + (rotation - sprite.prevRotation) * interpolation;
                    } else {
                        // Direct assignment when no interpolation
                        sprite.x = pixelX;
                        sprite.y = pixelY;
                        sprite.rotation = rotation;
                        
                        // Update previous values for next frame
                        sprite.prevX = pixelX;
                        sprite.prevY = pixelY;
                        sprite.prevRotation = rotation;
                    }
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
    // Inherited from BaseManager
    
    /**
     * Get the body-to-sprite mapping
     * @returns {Map} Map of body handles to sprites
     */
    getBodyToSpriteMap() {
        return this.bodyToSprite;
    }

    /**
     * Get last measured contacts/sec (updated roughly once per second)
     * @returns {number}
     */
    getLastContactsPerSec() {
        return this._lastContactsPerSec || 0;
    }

    /**
     * Get contacts observed in the last physics sub-step.
     * Useful in tests and overlays when you want immediate per-step feedback.
     * @returns {number}
     */
    getContactsLastStep() {
        return this._contactsLastStep || 0;
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
