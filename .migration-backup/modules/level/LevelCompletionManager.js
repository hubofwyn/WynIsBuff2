import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../../constants/EventNames';

/**
 * LevelCompletionManager class is responsible for handling level completion logic
 */
export class LevelCompletionManager {
    /**
     * Create a new LevelCompletionManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {RAPIER.World} world - The Rapier physics world
     * @param {EventSystem} eventSystem - The event system for communication
     * @param {CollectibleManager} collectibleManager - Reference to the collectible manager
     */
    constructor(scene, world, eventSystem, collectibleManager) {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;
        this.collectibleManager = collectibleManager;
        
        // Store completion trigger for later reference
        this.completionTrigger = null;
        
        // Current level ID
        this.currentLevelId = null;
        
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
            console.log(`[LevelCompletionManager] ${message}`);
        }
    }
    
    /**
     * Set the current level ID
     * @param {string} levelId - The current level ID
     */
    setCurrentLevelId(levelId) {
        this.currentLevelId = levelId;
    }
    
    /**
     * Create level completion trigger
     * @param {Object} triggerConfig - Configuration for the completion trigger
     * @returns {Object} The created trigger object
     */
    createCompletionTrigger(triggerConfig) {
        try {
            this.log('Creating level completion trigger...');
            
            // Remove existing trigger if any
            this.removeCompletionTrigger();
            
            // Create a visual representation
            const triggerSprite = this.scene.add.rectangle(
                triggerConfig.x, triggerConfig.y,
                triggerConfig.width, triggerConfig.height,
                0x00FFFF, // Cyan color
                0.5 // Alpha
            );
            
            // Add a pulsing effect
            this.scene.tweens.add({
                targets: triggerSprite,
                alpha: { from: 0.3, to: 0.7 },
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
            
            // Create a sensor rigid body for the trigger
            const triggerBodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(triggerConfig.x, triggerConfig.y);
            
            const triggerBody = this.world.createRigidBody(triggerBodyDesc);
            
            // Store the association between body and sprite
            this.bodyToSprite.set(triggerBody.handle, triggerSprite);
            
            // Create a sensor collider for the trigger
            const triggerColliderDesc = RAPIER.ColliderDesc
                .cuboid(triggerConfig.width / 2, triggerConfig.height / 2)
                .setSensor(true); // Make it a sensor (no physical collision)
                
            const triggerCollider = this.world.createCollider(
                triggerColliderDesc, 
                triggerBody
            );
            
            // Store trigger info
            this.completionTrigger = {
                body: triggerBody,
                sprite: triggerSprite,
                collider: triggerCollider,
                config: triggerConfig
            };
            
            this.log('Level completion trigger created successfully');
            
            return this.completionTrigger;
        } catch (error) {
            console.error('[LevelCompletionManager] Error in createCompletionTrigger:', error);
            return null;
        }
    }
    
    /**
     * Remove the completion trigger
     */
    removeCompletionTrigger() {
        if (!this.completionTrigger) {
            return;
        }
        
        this.log('Removing completion trigger');
        
        // Remove physics body
        if (this.completionTrigger.body) {
            this.world.removeRigidBody(this.completionTrigger.body);
        }
        
        // Remove sprite
        if (this.completionTrigger.sprite) {
            this.completionTrigger.sprite.destroy();
        }
        
        // Clear body-sprite mapping
        if (this.completionTrigger.body) {
            this.bodyToSprite.delete(this.completionTrigger.body.handle);
        }
        
        // Clear completion trigger reference
        this.completionTrigger = null;
    }
    
    /**
     * Check if the level should be completed
     * @param {Object} playerPosition - The player's current position
     * @param {Object} playerBody - The player's physics body
     * @returns {boolean} Whether the level should be completed
     */
    checkLevelCompletion(playerPosition, playerBody) {
        // If no completion trigger, can't complete
        if (!this.completionTrigger) {
            return false;
        }
        
        // If trigger requires all collectibles and not all collected, can't complete
        if (this.completionTrigger.config.requireAllCollectibles && 
            this.collectibleManager && 
            !this.collectibleManager.areAllCollectiblesCollected()) {
            return false;
        }
        
        // If player position is provided, check if player is in trigger area
        if (playerPosition) {
            const triggerX = this.completionTrigger.config.x;
            const triggerY = this.completionTrigger.config.y;
            const triggerWidth = this.completionTrigger.config.width;
            const triggerHeight = this.completionTrigger.config.height;
            
            // Check if player is within trigger bounds
            if (playerPosition.x < triggerX - triggerWidth/2 || 
                playerPosition.x > triggerX + triggerWidth/2 ||
                playerPosition.y < triggerY - triggerHeight/2 || 
                playerPosition.y > triggerY + triggerHeight/2) {
                return false; // Player not in trigger area
            }
        }
        
        // Complete the level
        this.completeLevel();
        return true;
    }
    
    /**
     * Handle collision with the level completion trigger
     * @param {RAPIER.RigidBodyHandle} bodyHandle - The body handle of the player
     * @param {Object} playerPosition - The player's current position
     * @returns {boolean} Whether the level was completed
     */
    handleTriggerCollision(bodyHandle, playerPosition) {
        if (!this.completionTrigger || !this.completionTrigger.body) {
            return false;
        }
        
        // Check if the colliding body is the player
        if (bodyHandle !== this.completionTrigger.body.handle) {
            return false;
        }
        
        return this.checkLevelCompletion(playerPosition);
    }
    
    /**
     * Complete the current level
     */
    completeLevel() {
        if (!this.currentLevelId) {
            this.log('Cannot complete level: No current level ID');
            return;
        }
        
        this.log(`Completing level: ${this.currentLevelId}`);
        
        // Get collectible stats if available
        let collectiblesCollected = 0;
        let totalCollectibles = 0;
        
        if (this.collectibleManager) {
            collectiblesCollected = this.collectibleManager.getCollectedCount();
            totalCollectibles = this.collectibleManager.getTotalCount();
        }
        
        // Emit level complete event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.LEVEL_COMPLETE, {
                levelId: this.currentLevelId,
                collectiblesCollected,
                totalCollectibles
            });
        }
        
        // Create completion effects
        this.createCompletionEffects();
    }
    
    /**
     * Create visual effects for level completion
     */
    createCompletionEffects() {
        if (!this.completionTrigger) {
            return;
        }
        
        const x = this.completionTrigger.config.x;
        const y = this.completionTrigger.config.y;
        
        // Emit particle effect
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.EMIT_PARTICLES, {
                x,
                y,
                color: 0x00FFFF, // Cyan
                count: 50,
                speed: 200,
                lifespan: 1000
            });
        }
        
        // Camera shake effect
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.CAMERA_SHAKE, {
                duration: 500,
                intensity: 0.02
            });
        }
        
        // Play completion sound
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAY_SOUND, {
                key: 'level_complete',
                volume: 0.7
            });
        }
    }
    
    /**
     * Get the completion trigger
     * @returns {Object} The completion trigger object
     */
    getCompletionTrigger() {
        return this.completionTrigger;
    }
    
    /**
     * Get the body-to-sprite mapping
     * @returns {Map} Map of body handles to sprites
     */
    getBodyToSpriteMap() {
        return this.bodyToSprite;
    }
}