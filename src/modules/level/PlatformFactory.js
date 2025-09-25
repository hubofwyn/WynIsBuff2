import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../../constants/EventNames';
import { PhysicsConfig } from '../../constants/PhysicsConfig.js';
import { pixelsToMeters } from '../../constants/PhysicsConstants.js';
import { CollisionGroups } from '../../constants/CollisionGroups.js';

/**
 * PlatformFactory class is responsible for creating and managing static platforms
 */
export class PlatformFactory {
    /**
     * Create a new PlatformFactory
     * @param {Phaser.Scene} scene - The scene this factory belongs to
     * @param {RAPIER.World} world - The Rapier physics world
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, world, eventSystem) {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;
        
        // Store created platforms for later reference
        this.platforms = [];
        
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
            console.log(`[PlatformFactory] ${message}`);
        }
    }
    
    /**
     * Create platforms at specified positions
     * @param {Array} platformConfigs - Array of platform configurations
     * @returns {Array} Array of created platform objects
     */
    createPlatforms(platformConfigs = []) {
        try {
            this.log(`Creating ${platformConfigs.length} platforms...`);
            
            // Use default platforms if none provided
            if (platformConfigs.length === 0) {
                platformConfigs = [
                    { x: 200, y: 500, width: 200, height: 20, color: 0x00AA00 },  // Green platform
                    { x: 600, y: 400, width: 200, height: 20, color: 0xAA00AA },  // Purple platform
                    { x: 400, y: 300, width: 200, height: 20, color: 0xAAAA00 }   // Yellow platform
                ];
            }
            
            // Remove existing platforms
            this.removePlatforms();
            
            // Create each platform
            platformConfigs.forEach((platform, index) => {
                try {
                    this.log(`Creating platform ${index+1}`);
                    
                    // Create a visual representation (in pixels)
                    const platformSprite = this.scene.add.rectangle(
                        platform.x, platform.y,
                        platform.width, platform.height,
                        platform.color
                    );
                    
                    // Create a fixed rigid body with proper scaling (pixels to meters)
                    const platformBodyDesc = RAPIER.RigidBodyDesc.fixed()
                        .setTranslation(
                            pixelsToMeters(platform.x), 
                            pixelsToMeters(platform.y)
                        );
                    
                    const platformBody = this.world.createRigidBody(platformBodyDesc);
                    
                    // Store the association between body and sprite
                    this.bodyToSprite.set(platformBody.handle, platformSprite);
                    
                    // Create a collider with proper scaling and physics properties
                    const platformColliderDesc = RAPIER.ColliderDesc
                        .cuboid(
                            pixelsToMeters(platform.width / 2), 
                            pixelsToMeters(platform.height / 2)
                        )
                        .setFriction(PhysicsConfig.ground.friction)
                        .setRestitution(PhysicsConfig.ground.restitution)
                        .setDensity(PhysicsConfig.ground.density)
                        .setSensor(false) // P0-4: CRITICAL - must not be sensor
                        // STATIC collides with DYNAMIC, PLAYER, ENEMY
                        .setCollisionGroups(
                            CollisionGroups.createMask(
                                CollisionGroups.STATIC,
                                (CollisionGroups.DYNAMIC | CollisionGroups.PLAYER | CollisionGroups.ENEMY)
                            )
                        )
                        .setActiveEvents(
                            (RAPIER.ActiveEvents?.COLLISION_EVENTS || 0)
                            | (RAPIER.ActiveEvents?.INTERSECTION_EVENTS || 0)
                        );
                        
                    const platformCollider = this.world.createCollider(
                        platformColliderDesc, 
                        platformBody
                    );
                    
                    // Store platform info
                    this.platforms.push({
                        body: platformBody,
                        sprite: platformSprite,
                        collider: platformCollider,
                        config: platform
                    });
                    
                    this.log(`Platform ${index+1} created successfully`);
                    
                    // Emit event for each platform
                    if (this.eventSystem) {
                        this.eventSystem.emit(EventNames.custom('level', 'platformCreated'), {
                            index,
                            position: { x: platform.x, y: platform.y },
                            dimensions: { width: platform.width, height: platform.height },
                            color: platform.color
                        });
                    }
                } catch (error) {
                    console.error(`[PlatformFactory] Error creating platform ${index+1}:`, error);
                }
            });
            
            return this.platforms;
        } catch (error) {
            console.error('[PlatformFactory] Error in createPlatforms:', error);
            return [];
        }
    }
    
    /**
     * Remove all platforms
     */
    removePlatforms() {
        if (this.platforms.length === 0) {
            return;
        }
        
        this.log(`Removing ${this.platforms.length} platforms`);
        
        // Remove each platform
        this.platforms.forEach(platform => {
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
        
        // Clear platforms array
        this.platforms = [];
    }
    
    /**
     * Get all platforms
     * @returns {Array} Array of platform objects
     */
    getPlatforms() {
        return this.platforms;
    }
    
    /**
     * Get the body-to-sprite mapping
     * @returns {Map} Map of body handles to sprites
     */
    getBodyToSpriteMap() {
        return this.bodyToSprite;
    }
}
