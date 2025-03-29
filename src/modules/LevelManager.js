import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../constants/EventNames';

/**
 * LevelManager class handles the creation and management of level elements
 * such as ground, platforms, and other static elements.
 */
export class LevelManager {
    /**
     * Create a new LevelManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {RAPIER.World} world - The Rapier physics world
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, world, eventSystem) {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;
        
        // Store created platforms for later reference
        this.platforms = [];
        this.ground = null;
        
        // Mapping to track physics bodies to sprites
        this.bodyToSprite = new Map();
    }
    
    /**
     * Create the ground
     * @param {number} width - Width of the ground
     * @param {number} height - Height of the ground
     * @param {number} y - Y position of the ground
     * @returns {Object} The created ground object
     */
    createGround(width = 1024, height = 50, y = 700) {
        try {
            console.log('[LevelManager] Creating ground...');
            
            // Create a visual representation of the ground
            const groundSprite = this.scene.add.rectangle(
                width / 2, y, width, height, 0x654321
            );
            console.log('[LevelManager] Ground sprite created');
            
            // Create a fixed (static) rigid body for the ground
            const groundBodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(width / 2, y);
            
            const groundBody = this.world.createRigidBody(groundBodyDesc);
            console.log('[LevelManager] Ground body created');
            
            // Store the association between body and sprite
            this.bodyToSprite.set(groundBody.handle, groundSprite);
            
            // Create a collider (hitbox) for the ground
            const groundColliderDesc = RAPIER.ColliderDesc
                .cuboid(width / 2, height / 2)
                .setRestitution(0.0); // No bounce
                
            const groundCollider = this.world.createCollider(groundColliderDesc, groundBody);
            console.log('[LevelManager] Ground collider created');
            
            // Store ground info
            this.ground = {
                body: groundBody,
                sprite: groundSprite,
                collider: groundCollider
            };
            
            // Emit event
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.custom('level', 'groundCreated'), {
                    position: { x: width / 2, y },
                    dimensions: { width, height }
                });
            }
            
            return this.ground;
        } catch (error) {
            console.error('[LevelManager] Error in createGround:', error);
            return null;
        }
    }
    
    /**
     * Create platforms at specified positions
     * @param {Array} platformConfigs - Array of platform configurations
     * @returns {Array} Array of created platform objects
     */
    createPlatforms(platformConfigs = []) {
        try {
            console.log('[LevelManager] Creating platforms...');
            
            // Use default platforms if none provided
            if (platformConfigs.length === 0) {
                platformConfigs = [
                    { x: 200, y: 500, width: 200, height: 20, color: 0x00AA00 },  // Green platform
                    { x: 600, y: 400, width: 200, height: 20, color: 0xAA00AA },  // Purple platform
                    { x: 400, y: 300, width: 200, height: 20, color: 0xAAAA00 }   // Yellow platform
                ];
            }
            
            // Clear existing platforms
            this.platforms = [];
            
            // Create each platform
            platformConfigs.forEach((platform, index) => {
                try {
                    console.log(`[LevelManager] Creating platform ${index+1}`);
                    
                    // Create a visual representation
                    const platformSprite = this.scene.add.rectangle(
                        platform.x, platform.y,
                        platform.width, platform.height,
                        platform.color
                    );
                    
                    // Create a fixed rigid body for the platform
                    const platformBodyDesc = RAPIER.RigidBodyDesc.fixed()
                        .setTranslation(platform.x, platform.y);
                    
                    const platformBody = this.world.createRigidBody(platformBodyDesc);
                    
                    // Store the association between body and sprite
                    this.bodyToSprite.set(platformBody.handle, platformSprite);
                    
                    // Create a collider for the platform
                    const platformColliderDesc = RAPIER.ColliderDesc
                        .cuboid(platform.width / 2, platform.height / 2)
                        .setRestitution(0.0);
                        
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
                    
                    console.log(`[LevelManager] Platform ${index+1} created successfully`);
                    
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
                    console.error(`[LevelManager] Error creating platform ${index+1}:`, error);
                }
            });
            
            return this.platforms;
        } catch (error) {
            console.error('[LevelManager] Error in createPlatforms:', error);
            return [];
        }
    }
    
    /**
     * Get all platforms
     * @returns {Array} Array of platform objects
     */
    getPlatforms() {
        return this.platforms;
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
    
    /**
     * Update method called every frame
     */
    update() {
        // Currently empty, but could be used for moving platforms or other dynamic level elements
    }
}