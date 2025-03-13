import RAPIER from '@dimforge/rapier2d-compat';

/**
 * PhysicsManager class handles the Rapier physics world and synchronization
 * between physics bodies and sprites.
 */
export class PhysicsManager {
    /**
     * Create a new PhysicsManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.world = null;
        this.initialized = false;
        this.bodyToSprite = new Map();
    }
    
    /**
     * Initialize the Rapier physics engine
     * @param {number} gravityX - Horizontal gravity
     * @param {number} gravityY - Vertical gravity
     * @returns {Promise<boolean>} Promise that resolves to true if initialization was successful
     */
    async initialize(gravityX = 0.0, gravityY = 20.0) {
        try {
            console.log('[PhysicsManager] Initializing Rapier...');
            await RAPIER.init();
            console.log('[PhysicsManager] Rapier initialized successfully');
            
            // Create physics world with gravity
            this.world = new RAPIER.World(new RAPIER.Vector2(gravityX, gravityY));
            console.log('[PhysicsManager] Rapier world created with gravity:', gravityX, gravityY);
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('[PhysicsManager] Error initializing physics:', error);
            return false;
        }
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
}