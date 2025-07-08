import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../../constants/EventNames';

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
                    
                    // Create a visual representation using tileset
                    const platformSprite = this.createTiledPlatform(
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
     * Create a tiled platform using the dungeon tileset
     * @param {number} x - Platform center X position
     * @param {number} y - Platform center Y position
     * @param {number} width - Platform width
     * @param {number} height - Platform height
     * @param {number} color - Platform color (used as tint)
     * @returns {Phaser.GameObjects.Container} The platform container
     */
    createTiledPlatform(x, y, width, height, color) {
        const container = this.scene.add.container(x, y);
        
        // If tileset is available, use it
        if (this.scene.textures.exists('dungeon-tiles')) {
            const tileSize = 16;
            const tilesX = Math.ceil(width / tileSize);
            const tilesY = Math.ceil(height / tileSize);
            
            // Tile indices for different platform parts (from dungeon tileset)
            const TILE_LEFT = 1;     // Left edge tile
            const TILE_MIDDLE = 2;   // Middle tile
            const TILE_RIGHT = 3;    // Right edge tile
            const TILE_TOP = 17;     // Top surface tile
            
            for (let ty = 0; ty < tilesY; ty++) {
                for (let tx = 0; tx < tilesX; tx++) {
                    let tileFrame = TILE_MIDDLE;
                    
                    // Use different tiles for edges and top
                    if (ty === 0) {
                        tileFrame = TILE_TOP;
                    }
                    if (tx === 0) {
                        tileFrame = TILE_LEFT;
                    } else if (tx === tilesX - 1) {
                        tileFrame = TILE_RIGHT;
                    }
                    
                    const tile = this.scene.add.sprite(
                        (tx * tileSize) - (width / 2) + (tileSize / 2),
                        (ty * tileSize) - (height / 2) + (tileSize / 2),
                        'dungeon-tiles',
                        tileFrame
                    );
                    
                    // Apply color tint
                    tile.setTint(color);
                    container.add(tile);
                }
            }
        } else {
            // Fallback to rectangle if tileset not loaded
            const rect = this.scene.add.rectangle(0, 0, width, height, color);
            container.add(rect);
        }
        
        return container;
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