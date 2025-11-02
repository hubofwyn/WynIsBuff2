import { RigidBodyDesc, ColliderDesc, PhysicsConfig, pixelsToMeters } from '@features/core';

import { EventNames } from '../../constants/EventNames.js';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * GroundFactory class is responsible for creating and managing the ground
 */
export class GroundFactory {
    /**
     * Create a new GroundFactory
     * @param {Phaser.Scene} scene - The scene this factory belongs to
     * @param {RAPIER.World} world - The Rapier physics world
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, world, eventSystem) {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;

        // Store ground for later reference
        this.ground = null;

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
            LOG.dev('GROUNDFACTORY_DEBUG', {
                subsystem: 'level',
                message,
            });
        }
    }

    /**
     * Create the ground
     * @param {Object} config - Ground configuration
     * @param {number} config.width - Width of the ground
     * @param {number} config.height - Height of the ground
     * @param {number} config.y - Y position of the ground
     * @param {number} config.color - Color of the ground (optional)
     * @returns {Object} The created ground object
     */
    createGround(config) {
        try {
            const width = config.width || 1024;
            const height = config.height || 50;
            const y = config.y || 700;
            const color = config.color || 0x654321;

            this.log('Creating ground...');

            // Remove existing ground if any
            this.removeGround();

            // Create a visual representation of the ground (in pixels)
            const groundSprite = this.scene.add.rectangle(width / 2, y, width, height, color);
            this.log('Ground sprite created');

            // Create a fixed (static) rigid body with proper scaling (pixels to meters)
            const groundBodyDesc = RigidBodyDesc.fixed().setTranslation(
                pixelsToMeters(width / 2),
                pixelsToMeters(y)
            );

            const groundBody = this.world.createRigidBody(groundBodyDesc);
            this.log('Ground body created');

            // Store the association between body and sprite
            this.bodyToSprite.set(groundBody.handle, groundSprite);

            // Create a collider with proper scaling and physics properties
            const groundColliderDesc = ColliderDesc.cuboid(
                pixelsToMeters(width / 2),
                pixelsToMeters(height / 2)
            )
                .setFriction(PhysicsConfig.ground.friction)
                .setRestitution(PhysicsConfig.ground.restitution)
                .setDensity(PhysicsConfig.ground.density);

            const groundCollider = this.world.createCollider(groundColliderDesc, groundBody);
            this.log('Ground collider created');

            // Store ground info
            this.ground = {
                body: groundBody,
                sprite: groundSprite,
                collider: groundCollider,
                config: {
                    width,
                    height,
                    y,
                    color,
                },
            };

            // Emit event
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.custom('level', 'groundCreated'), {
                    position: { x: width / 2, y },
                    dimensions: { width, height },
                });
            }

            return this.ground;
        } catch (error) {
            LOG.error('GROUNDFACTORY_CREATE_GROUND_ERROR', {
                subsystem: 'level',
                error,
                message: 'Error creating ground',
                config,
                hint: 'Check ground configuration and physics world state',
            });
            return null;
        }
    }

    /**
     * Remove the ground
     */
    removeGround() {
        if (!this.ground) {
            return;
        }

        this.log('Removing ground');

        // Remove physics body
        if (this.ground.body) {
            this.world.removeRigidBody(this.ground.body);
        }

        // Remove sprite
        if (this.ground.sprite) {
            this.ground.sprite.destroy();
        }

        // Clear body-sprite mapping
        if (this.ground.body) {
            this.bodyToSprite.delete(this.ground.body.handle);
        }

        // Clear ground reference
        this.ground = null;
    }

    /**
     * Get the ground object
     * @returns {Object} The ground object
     */
    getGround() {
        return this.ground;
    }

    /**
     * Get the body-to-sprite mapping
     * @returns {Map} Map of body handles to sprites
     */
    getBodyToSpriteMap() {
        return this.bodyToSprite;
    }
}
