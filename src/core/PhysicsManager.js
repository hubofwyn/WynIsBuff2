import RAPIER from '@dimforge/rapier2d-compat';

import { EventNames } from '../constants/EventNames';
import { PhysicsConfig } from '../constants/PhysicsConfig';
import { metersToPixels } from '../constants/PhysicsConstants.js';
import { LOG } from '../observability/core/LogSystem.js';
import { CrashDumpGenerator } from '../observability/utils/CrashDumpGenerator.js';

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
    async init(
        scene,
        eventSystem,
        gravityX = PhysicsConfig.gravityX,
        gravityY = PhysicsConfig.gravityY
    ) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        try {
            LOG.info('PHYSICS_INIT_START', {
                subsystem: 'physics',
                message: 'Initializing Rapier physics engine',
            });
            await RAPIER.init();
            LOG.info('PHYSICS_INIT_SUCCESS', {
                subsystem: 'physics',
                message: 'Rapier initialized successfully',
            });

            // Create physics world with gravity
            this.world = new RAPIER.World(new RAPIER.Vector2(gravityX, gravityY));
            LOG.info('PHYSICS_WORLD_CREATED', {
                subsystem: 'physics',
                message: 'Rapier world created',
                gravity: { x: gravityX, y: gravityY },
            });

            // Create event queue for collision events (required in Rapier 0.19+)
            this.eventQueue = new RAPIER.EventQueue(true);
            LOG.dev('PHYSICS_EVENT_QUEUE', {
                subsystem: 'physics',
                message: 'Event queue created',
            });

            // Set up collision event handling
            this.setupCollisionEvents();

            this._initialized = true;

            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.GAME_INIT, {
                    module: 'physics',
                    gravity: { x: gravityX, y: gravityY },
                });
            }

            return true;
        } catch (error) {
            LOG.error('PHYSICS_INIT_ERROR', {
                subsystem: 'physics',
                error,
                message: 'Failed to initialize physics engine',
                hint: 'Check if Rapier WASM files are accessible. Verify gravity values are valid.',
                gravity: { x: gravityX, y: gravityY },
            });
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
                        positionB: { x: positionB.x, y: positionB.y },
                    });
                }

                // Call any registered collision handlers
                this.handleCollision(bodyHandleA, bodyHandleB);
            });
        } else {
            // Fallback for collision event handling if contactPairEvents is not available
            LOG.warn('PHYSICS_NO_CONTACT_EVENTS', {
                subsystem: 'physics',
                message: 'contactPairEvents not available, using manual collision detection',
                hint: 'For basic platformer gameplay, character controller contact detection is sufficient',
            });
            // Note: Collision detection will be handled manually in the update() method if needed
            // For basic platformer gameplay, contact detection via characterController is sufficient
        }

        LOG.dev('PHYSICS_COLLISION_SETUP', {
            subsystem: 'physics',
            message: 'Collision events set up',
        });
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
                LOG.error('PHYSICS_COLLISION_HANDLER_ERROR', {
                    subsystem: 'physics',
                    error,
                    message: 'Error in collision handler',
                    bodyHandles: { A: bodyHandleA, B: bodyHandleB },
                    hint: 'Check collision handler implementation for errors',
                });
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

        // TRIAGE FIX: Circuit breaker for repeated errors
        if (this.errorCount > 10) {
            // Generate comprehensive crash dump for analysis
            const crashDump = CrashDumpGenerator.generate(
                new Error('Physics circuit breaker triggered'),
                {
                    subsystem: 'physics',
                    errorCount: this.errorCount,
                    threshold: 10,
                    recentErrors: LOG.getByCode('PHYSICS_UPDATE_ERROR', 10),
                    physicsState: {
                        bodyCount: this.bodyToSprite?.size || 0,
                        worldStep: this.fixedTimeStep,
                        accumulator: this.accumulator,
                        isActive: this.isActive,
                    },
                }
            );

            LOG.fatal('PHYSICS_CIRCUIT_BREAKER', {
                subsystem: 'physics',
                message: 'Circuit breaker triggered: too many errors, physics disabled',
                errorCount: this.errorCount,
                threshold: 10,
                hint: 'Check recent physics errors. May indicate Rapier API issues or invalid body state.',
                crashDump,
                crashDumpSummary: CrashDumpGenerator.generateSummary(crashDump),
            });

            // Disable physics to prevent further errors
            this.isActive = false;
            return;
        }

        try {
            // TRIAGE FIX: Validate delta is a finite number
            if (!Number.isFinite(delta) || delta < 0 || delta > 1000) {
                LOG.warn('PHYSICS_INVALID_DELTA', {
                    subsystem: 'physics',
                    message: 'Invalid delta time received, using fallback',
                    invalidDelta: delta,
                    fallbackDelta: 16.67,
                    hint: 'Check game loop timing. Delta should be between 0-1000ms.',
                });
                delta = 16.67; // Fallback to 60fps
            }

            // Convert delta from milliseconds to seconds
            const deltaSeconds = delta ? delta / 1000 : PhysicsConfig.timeStep;

            // TRIAGE FIX: More aggressive delta capping to prevent physics explosions
            const cappedDelta = Math.min(deltaSeconds, 1 / 20); // Cap to 50ms (20 FPS minimum)

            // Fixed timestep for deterministic physics (as recommended in guide)
            const fixedTimeStep = PhysicsConfig.timeStep; // 1/60 for 60Hz
            this.accumulator += cappedDelta;

            // Limit max steps per frame to prevent freezing
            const maxStepsPerFrame = 3;
            let steps = 0;

            // Track physics timing
            const startTime = performance.now();

            // Configure integration parameters for improved stability
            this.world.integrationParameters.dt = fixedTimeStep;
            this.world.integrationParameters.numSolverIterations = PhysicsConfig.maxVelIterations;
            this.world.integrationParameters.numAdditionalFrictionIterations =
                PhysicsConfig.maxPosIterations;
            this.world.integrationParameters.erp = PhysicsConfig.erp; // Error reduction parameter

            // Step physics with event queue (Rapier 0.19+ API)
            while (this.accumulator >= fixedTimeStep && steps < maxStepsPerFrame) {
                // Pass eventQueue to step for collision event collection
                this.world.step(this.eventQueue);
                this.accumulator -= fixedTimeStep;
                steps++;
            }

            // Process collision events from the event queue
            this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
                if (started) {
                    // Collision started - emit event if eventSystem is available
                    if (this.eventSystem) {
                        const bodyA = this.world.getRigidBody(handle1);
                        const bodyB = this.world.getRigidBody(handle2);

                        if (bodyA && bodyB) {
                            const positionA = bodyA.translation();
                            const positionB = bodyB.translation();

                            this.eventSystem.emit(EventNames.COLLISION_START, {
                                bodyHandleA: handle1,
                                bodyHandleB: handle2,
                                positionA: { x: positionA.x, y: positionA.y },
                                positionB: { x: positionB.x, y: positionB.y },
                            });
                        }
                    }

                    // Call registered collision handlers
                    this.handleCollision(handle1, handle2);
                }
            });

            // Record physics metrics
            const physicsTime = performance.now() - startTime;

            // Emit performance metrics
            if (this.eventSystem && steps > 0) {
                this.eventSystem.emit('physics:performance', {
                    steps,
                    time: physicsTime,
                    accumulator: this.accumulator,
                    fixedTimeStep,
                });
            }

            // Reset accumulator if we hit max steps (prevents permanent lag)
            if (steps >= maxStepsPerFrame) {
                this.accumulator = 0;
                LOG.warn('PHYSICS_FRAME_BUDGET_EXCEEDED', {
                    subsystem: 'physics',
                    message: 'Frame budget exceeded, resetting accumulator',
                    steps,
                    maxSteps: maxStepsPerFrame,
                    hint: 'Physics simulation running slowly. Consider optimizing collision shapes or reducing body count.',
                });
            }

            // Calculate interpolation factor for smooth rendering
            const interpolation = this.accumulator / fixedTimeStep;

            // Update all sprites with proper scaling
            this.updateGameObjects(interpolation);

            // Reset error count on successful update
            this.errorCount = 0;
        } catch (error) {
            this.errorCount = (this.errorCount || 0) + 1;
            LOG.error('PHYSICS_UPDATE_ERROR', {
                subsystem: 'physics',
                error,
                message: `Physics update error ${this.errorCount}/10`,
                errorCount: this.errorCount,
                threshold: 10,
                state: {
                    hasWorld: !!this.world,
                    accumulator: this.accumulator,
                    bodyCount: this.bodyToSprite?.size || 0,
                    delta: arguments[0],
                },
                hint: 'Check Rapier body state. Verify all bodies have valid translations. May indicate invalid body configuration.',
            });

            // TRIAGE FIX: Emergency fallback - try to at least update sprites
            try {
                if (this.bodyToSprite && this.bodyToSprite.size > 0) {
                    this.updateGameObjects(0); // No interpolation in emergency mode
                }
            } catch (fallbackError) {
                LOG.error('PHYSICS_FALLBACK_ERROR', {
                    subsystem: 'physics',
                    error: fallbackError,
                    message: 'Emergency fallback update also failed',
                    hint: 'Physics system in critical state. Consider restarting scene.',
                });
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
            // Use forEachRigidBody() for Rapier 0.19+ compatibility
            this.world.forEachRigidBody((body) => {
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
                        sprite.rotation =
                            sprite.prevRotation + (rotation - sprite.prevRotation) * interpolation;
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
            LOG.error('PHYSICS_UPDATE_GAMEOBJECTS_ERROR', {
                subsystem: 'physics',
                error,
                message: 'Error updating game objects from physics bodies',
                bodyCount: this.bodyToSprite?.size || 0,
                hint: 'Check body-sprite synchronization. Verify all bodies have valid translation() method.',
            });
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
