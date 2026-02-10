import { RigidBodyDesc, ColliderDesc } from '@features/core';

import { EventNames } from '../../constants/EventNames.js';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * MovingPlatformController class is responsible for creating and managing moving platforms
 */
export class MovingPlatformController {
    /**
     * Create a new MovingPlatformController
     * @param {Phaser.Scene} scene - The scene this controller belongs to
     * @param {RAPIER.World} world - The Rapier physics world
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, world, eventSystem) {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;

        // Store created moving platforms for later reference
        this.movingPlatforms = [];

        // Mapping to track physics bodies to sprites
        this.bodyToSprite = new Map();

        // Debug mode
        this.debugMode = false;
    }

    /**
     * Set debug mode
     * @param {boolean} enabled - Whether debug mode is enabled
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * Log a message if debug mode is enabled
     * @param {string} message - The message to log
     */
    log(message) {
        if (this.debugMode) {
            LOG.dev('MOVINGPLATFORMCONTROLLER_DEBUG', {
                subsystem: 'level',
                message,
            });
        }
    }

    /**
     * Create moving platforms
     * @param {Array} movingPlatformConfigs - Array of moving platform configurations
     * @returns {Array} Array of created moving platform objects
     */
    createMovingPlatforms(movingPlatformConfigs = []) {
        try {
            this.log(`Creating ${movingPlatformConfigs.length} moving platforms...`);

            // Remove existing moving platforms
            this.removeMovingPlatforms();

            // Create each moving platform
            movingPlatformConfigs.forEach((platform, index) => {
                try {
                    this.log(`Creating moving platform ${index + 1}`);

                    // Create a visual representation
                    const platformSprite = this.scene.add.rectangle(
                        platform.x,
                        platform.y,
                        platform.width,
                        platform.height,
                        platform.color
                    );

                    // Create a kinematic rigid body for the moving platform
                    const platformBodyDesc = RigidBodyDesc.kinematicPositionBased().setTranslation(
                        platform.x,
                        platform.y
                    );

                    const platformBody = this.world.createRigidBody(platformBodyDesc);

                    // Store the association between body and sprite
                    this.bodyToSprite.set(platformBody.handle, platformSprite);

                    // Create a collider for the platform
                    const platformColliderDesc = ColliderDesc.cuboid(
                        platform.width / 2,
                        platform.height / 2
                    ).setRestitution(0.0);

                    const platformCollider = this.world.createCollider(
                        platformColliderDesc,
                        platformBody
                    );

                    // Store movement data
                    const movementData = {
                        type: platform.movement.type,
                        speed: platform.movement.speed,
                        distance: platform.movement.distance,
                        startPosition: { x: platform.x, y: platform.y },
                        direction: 1, // 1 for positive direction, -1 for negative
                        progress: 0, // 0 to 1 for position along path
                        pauseTime: 0, // Time to pause at endpoints
                    };

                    // Store moving platform info
                    this.movingPlatforms.push({
                        body: platformBody,
                        sprite: platformSprite,
                        collider: platformCollider,
                        config: platform,
                        movement: movementData,
                    });

                    this.log(`Moving platform ${index + 1} created successfully`);

                    // Emit event for each platform
                    if (this.eventSystem) {
                        this.eventSystem.emit(EventNames.PLATFORM_MOVE, {
                            index,
                            position: { x: platform.x, y: platform.y },
                            dimensions: { width: platform.width, height: platform.height },
                            color: platform.color,
                            movement: platform.movement,
                        });
                    }
                } catch (error) {
                    LOG.error('MOVINGPLATFORMCONTROLLER_PLATFORM_CREATE_ERROR', {
                        subsystem: 'level',
                        error,
                        message: 'Error creating moving platform',
                        platformIndex: index + 1,
                        platformConfig: platform,
                        hint: 'Check platform configuration and physics world initialization',
                    });
                }
            });

            return this.movingPlatforms;
        } catch (error) {
            LOG.error('MOVINGPLATFORMCONTROLLER_CREATE_BATCH_ERROR', {
                subsystem: 'level',
                error,
                message: 'Error creating moving platforms batch',
                platformCount: movingPlatformConfigs?.length || 0,
                hint: 'Check level configuration and physics world state',
            });
            return [];
        }
    }

    /**
     * Remove all moving platforms
     */
    removeMovingPlatforms() {
        if (this.movingPlatforms.length === 0) {
            return;
        }

        this.log(`Removing ${this.movingPlatforms.length} moving platforms`);

        // Remove each moving platform
        this.movingPlatforms.forEach((platform) => {
            // Remove physics body
            if (platform.body) {
                this.world.removeRigidBody(platform.body);
            }

            // Remove sprite
            if (platform.sprite) {
                platform.sprite.destroy();
            }

            // Clear body-sprite mapping
            if (platform.body) {
                this.bodyToSprite.delete(platform.body.handle);
            }
        });

        // Clear moving platforms array
        this.movingPlatforms = [];
    }

    /**
     * Update moving platforms
     * @param {number} delta - Time elapsed since last update in milliseconds
     */
    updateMovingPlatforms(delta) {
        if (this.movingPlatforms.length === 0) {
            return;
        }

        // Convert delta to seconds
        const dt = delta / 1000;

        // Update each moving platform
        this.movingPlatforms.forEach((platform) => {
            try {
                const movement = platform.movement;
                const config = platform.config;

                // Skip if paused
                if (movement.pauseTime > 0) {
                    movement.pauseTime -= dt;
                    return;
                }

                // Calculate new position based on movement type
                let newX = config.x;
                let newY = config.y;

                // Update progress
                movement.progress += (movement.direction * movement.speed * dt) / movement.distance;

                // Check if we need to change direction
                if (movement.progress >= 1) {
                    movement.direction = -1;
                    movement.progress = 1;
                    movement.pauseTime = 0.5; // Pause at endpoint
                } else if (movement.progress <= 0) {
                    movement.direction = 1;
                    movement.progress = 0;
                    movement.pauseTime = 0.5; // Pause at endpoint
                }

                // Calculate new position based on movement type
                if (movement.type === 'horizontal') {
                    newX = movement.startPosition.x + movement.progress * movement.distance;
                    newY = movement.startPosition.y;
                } else if (movement.type === 'vertical') {
                    newX = movement.startPosition.x;
                    newY = movement.startPosition.y + movement.progress * movement.distance;
                } else if (movement.type === 'circular') {
                    const angle = movement.progress * Math.PI * 2;
                    newX = movement.startPosition.x + Math.cos(angle) * movement.distance;
                    newY = movement.startPosition.y + Math.sin(angle) * movement.distance;
                }

                // Update physics body position
                if (platform.body) {
                    platform.body.setTranslation({ x: newX, y: newY });
                }

                // Update sprite position
                if (platform.sprite) {
                    platform.sprite.x = newX;
                    platform.sprite.y = newY;
                }

                // Emit platform move event
                if (this.eventSystem) {
                    this.eventSystem.emit(EventNames.PLATFORM_MOVE, {
                        index: this.movingPlatforms.indexOf(platform),
                        position: { x: newX, y: newY },
                        progress: movement.progress,
                        direction: movement.direction,
                    });
                }
            } catch (error) {
                LOG.error('MOVINGPLATFORMCONTROLLER_UPDATE_ERROR', {
                    subsystem: 'level',
                    error,
                    message: 'Error updating moving platform',
                    platformId: platform.id,
                    hint: 'Check platform body state and physics world integrity',
                });
            }
        });
    }

    /**
     * Get all moving platforms
     * @returns {Array} Array of moving platform objects
     */
    getMovingPlatforms() {
        return this.movingPlatforms;
    }

    /**
     * Get the body-to-sprite mapping
     * @returns {Map} Map of body handles to sprites
     */
    getBodyToSpriteMap() {
        return this.bodyToSprite;
    }
}
