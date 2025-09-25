import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../../constants/EventNames';

/**
 * CollectibleManager class is responsible for creating and managing collectibles
 */
export class CollectibleManager {
    /**
     * Create a new CollectibleManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {RAPIER.World} world - The Rapier physics world
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, world, eventSystem) {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;
        
        // Store created collectibles for later reference
        this.collectibles = [];
        
        // Track collectibles collected in the current level
        this.collectedItems = new Set();
        
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
            console.log(`[CollectibleManager] ${message}`);
        }
    }
    
    /**
     * Create collectibles
     * @param {Array} collectibleConfigs - Array of collectible configurations
     * @returns {Array} Array of created collectible objects
     */
    createCollectibles(collectibleConfigs = []) {
        try {
            this.log(`Creating ${collectibleConfigs.length} collectibles...`);
            
            // Remove existing collectibles
            this.removeCollectibles();
            
            // Reset collected items
            this.collectedItems.clear();
            
            // Create each collectible
            collectibleConfigs.forEach((collectible, index) => {
                try {
                    // Validate collectible data
                    if (!collectible || typeof collectible !== 'object') {
                        console.warn(`[CollectibleManager] Invalid collectible at index ${index}:`, collectible);
                        return;
                    }
                    
                    // Ensure required properties exist
                    if (!collectible.x || !collectible.y) {
                        console.warn(`[CollectibleManager] Collectible missing position at index ${index}:`, collectible);
                        return;
                    }
                    
                    this.log(`Creating collectible ${index+1} of type: ${collectible.type || 'default'}`);
                    
                    // Determine color based on type
                    let color = 0xFFD700; // Gold for default
                    if (collectible.type === 'protein') {
                        color = 0xFFD700; // Gold for protein
                    } else if (collectible.type === 'dumbbell') {
                        color = 0xC0C0C0; // Silver for dumbbell
                    }
                    
                    // Create a visual representation (sprite if available, otherwise circle)
                    let collectibleSprite;
                    const spriteKey = `collectible-${collectible.type || 'default'}`;
                    if (this.scene.textures.exists(spriteKey)) {
                        collectibleSprite = this.scene.add.image(
                            collectible.x, collectible.y,
                            spriteKey
                        ).setDisplaySize(30, 30);
                    } else {
                        collectibleSprite = this.scene.add.circle(
                            collectible.x, collectible.y,
                            15, // radius
                            color
                        );
                    }
                    
                    // Add a pulsing effect
                    this.scene.tweens.add({
                        targets: collectibleSprite,
                        scale: { from: 0.8, to: 1.2 },
                        duration: 1000,
                        yoyo: true,
                        repeat: -1
                    });
                    
                    // Create a sensor rigid body for the collectible
                    const collectibleBodyDesc = RAPIER.RigidBodyDesc.fixed()
                        .setTranslation(collectible.x, collectible.y);
                    
                    const collectibleBody = this.world.createRigidBody(collectibleBodyDesc);
                    
                    // Store the association between body and sprite
                    this.bodyToSprite.set(collectibleBody.handle, collectibleSprite);
                    
                    // Create a sensor collider for the collectible
                    const collectibleColliderDesc = RAPIER.ColliderDesc
                        .ball(15) // radius
                        .setSensor(true) // Make it a sensor (no physical collision)
                        .setActiveEvents(
                            (RAPIER.ActiveEvents?.INTERSECTION_EVENTS || 0)
                        );
                        
                    const collectibleCollider = this.world.createCollider(
                        collectibleColliderDesc, 
                        collectibleBody
                    );
                    
                    // Store collectible info
                    this.collectibles.push({
                        body: collectibleBody,
                        sprite: collectibleSprite,
                        collider: collectibleCollider,
                        config: collectible,
                        collected: false,
                        id: `collectible_${index}`
                    });
                    
                    this.log(`Collectible ${index+1} created successfully`);
                } catch (error) {
                    console.error(`[CollectibleManager] Error creating collectible ${index+1}:`, error);
                }
            });
            
            return this.collectibles;
        } catch (error) {
            console.error('[CollectibleManager] Error in createCollectibles:', error);
            return [];
        }
    }
    
    /**
     * Remove all collectibles
     */
    removeCollectibles() {
        if (this.collectibles.length === 0) {
            return;
        }
        
        this.log(`Removing ${this.collectibles.length} collectibles`);
        
        // Remove each collectible
        this.collectibles.forEach(collectible => {
            // Remove physics body
            if (collectible.body) {
                this.world.removeRigidBody(collectible.body);
            }
            
            // Remove sprite
            if (collectible.sprite) {
                collectible.sprite.destroy();
            }
            
            // Clear body-sprite mapping
            if (collectible.body) {
                this.bodyToSprite.delete(collectible.body.handle);
            }
        });
        
        // Clear collectibles array
        this.collectibles = [];
        
        // Clear collected items
        this.collectedItems.clear();
    }
    
    /**
     * Handle collectible collection
     * @param {string} collectibleId - ID of the collectible
     */
    collectItem(collectibleId) {
        const collectible = this.collectibles.find(c => c.id === collectibleId);
        if (!collectible || collectible.collected) {
            return;
        }
        
        this.log(`Collecting item: ${collectibleId}`);
        
        // Mark as collected
        collectible.collected = true;
        this.collectedItems.add(collectibleId);
        
        // Hide the sprite
        if (collectible.sprite) {
            collectible.sprite.setVisible(false);
        }
        
        // Emit collection event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.COLLECTIBLE_COLLECTED, {
                id: collectibleId,
                type: collectible.config.type,
                value: collectible.config.value,
                position: { x: collectible.config.x, y: collectible.config.y },
                totalCollected: this.collectedItems.size,
                totalCollectibles: this.collectibles.length
            });
        }
        
        // Apply collectible effect based on type
        this.applyCollectibleEffect(collectible);
    }
    
    /**
     * Apply collectible effect based on type
     * @param {Object} collectible - The collectible object
     */
    applyCollectibleEffect(collectible) {
        if (!collectible || !collectible.config) {
            return;
        }
        
        const type = collectible.config.type;
        const value = collectible.config.value || 10;
        
        // Emit effect event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.COLLECTIBLE_EFFECT, {
                type,
                value,
                position: { x: collectible.config.x, y: collectible.config.y }
            });
        }
        
        // Create visual effect
        this.createCollectionEffect(collectible.config.x, collectible.config.y, type);
    }
    
    /**
     * Create visual effect for collectible collection
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} type - Collectible type
     */
    createCollectionEffect(x, y, type) {
        // Create particle effect
        let particleColor = 0xFFD700; // Gold for default
        
        if (type === 'protein') {
            particleColor = 0xFFD700; // Gold for protein
        } else if (type === 'dumbbell') {
            particleColor = 0xC0C0C0; // Silver for dumbbell
        }
        
        // Emit particle effect event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.EMIT_PARTICLES, {
                x,
                y,
                color: particleColor,
                count: 10,
                speed: 100,
                lifespan: 500
            });
        }
        
        // Play sound effect
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAY_SOUND, {
                key: `collect_${type}`,
                volume: 0.5
            });
        }
    }
    
    /**
     * Handle collision with a collectible
     * @param {RAPIER.RigidBodyHandle} bodyHandle - The body handle of the collectible
     */
    handleCollectibleCollision(bodyHandle) {
        const collectible = this.collectibles.find(c => c.body && c.body.handle === bodyHandle);
        if (collectible && !collectible.collected) {
            this.collectItem(collectible.id);
        }
    }
    
    /**
     * Check if all collectibles have been collected
     * @returns {boolean} Whether all collectibles have been collected
     */
    areAllCollectiblesCollected() {
        return this.collectedItems.size === this.collectibles.length;
    }
    
    /**
     * Get all collectibles
     * @returns {Array} Array of collectible objects
     */
    getCollectibles() {
        return this.collectibles;
    }
    
    /**
     * Get the number of collected items
     * @returns {number} Number of collected items
     */
    getCollectedCount() {
        return this.collectedItems.size;
    }
    
    /**
     * Get the total number of collectibles
     * @returns {number} Total number of collectibles
     */
    getTotalCount() {
        return this.collectibles.length;
    }
    
    /**
     * Get the body-to-sprite mapping
     * @returns {Map} Map of body handles to sprites
     */
    getBodyToSpriteMap() {
        return this.bodyToSprite;
    }
}
