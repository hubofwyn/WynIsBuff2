// LEGACY COMPATIBILITY WRAPPER - DEPRECATED
// Use @features/level instead for new code
import { LevelManager as ModularLevelManager } from './level/LevelManager';

/**
 * LevelManager class serves as a wrapper for the modular level system.
 * This class maintains backward compatibility with the original LevelManager
 * while delegating to the new modular implementation.
 */
export class LevelManager {
    /**
     * Create a new LevelManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {RAPIER.World} world - The Rapier physics world
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, world, eventSystem) {
        console.log('[LevelManager] Initializing modular level system');
        
        // Create the modular level manager
        this.levelManager = new ModularLevelManager(scene, world, eventSystem);
        
        // Set debug mode based on environment
        this.levelManager.setDebugMode(process.env.NODE_ENV !== 'production');
        
        // Load the first level by default
        this.currentLevelId = 'level1';
    }
    
    /**
     * Create the ground (for backward compatibility)
     * @param {number} width - Width of the ground
     * @param {number} height - Height of the ground
     * @param {number} y - Y position of the ground
     * @returns {Object} The created ground object
     */
    createGround(width = 1024, height = 50, y = 700) {
        console.log('[LevelManager] Creating ground using modular system');
        
        // If no level is loaded yet, load the first level
        if (!this.levelManager.getCurrentLevelId()) {
            this.levelManager.loadLevel(this.currentLevelId);
        }
        
        return this.levelManager.getGround();
    }
    
    /**
     * Create platforms at specified positions (for backward compatibility)
     * @param {Array} platformConfigs - Array of platform configurations
     * @returns {Array} Array of created platform objects
     */
    createPlatforms(platformConfigs = []) {
        console.log('[LevelManager] Creating platforms using modular system');
        
        // If no level is loaded yet, load the first level
        if (!this.levelManager.getCurrentLevelId()) {
            this.levelManager.loadLevel(this.currentLevelId);
        }
        
        return this.levelManager.getPlatforms();
    }
    
    /**
     * Get all platforms
     * @returns {Array} Array of platform objects
     */
    getPlatforms() {
        return this.levelManager.getPlatforms();
    }
    
    /**
     * Get the ground object
     * @returns {Object} The ground object
     */
    getGround() {
        return this.levelManager.getGround();
    }
    
    /**
     * Get the body-to-sprite mapping
     * @returns {Map} Map of body handles to sprites
     */
    getBodyToSpriteMap() {
        return this.levelManager.getBodyToSpriteMap();
    }
    
    /**
     * Load a specific level
     * @param {string} levelId - The ID of the level to load
     * @returns {boolean} Whether the level was loaded successfully
     */
    loadLevel(levelId) {
        this.currentLevelId = levelId;
        return this.levelManager.loadLevel(levelId);
    }
    
    /**
     * Load the next level
     * @returns {boolean} Whether the next level was loaded successfully
     */
    nextLevel() {
        return this.levelManager.nextLevel();
    }
    
    /**
     * Reset the current level
     * @returns {boolean} Whether the level was reset successfully
     */
    resetLevel() {
        return this.levelManager.resetLevel();
    }
    
    /**
     * Update method called every frame
     * @param {number} delta - Time elapsed since last update
     */
    update(delta) {
        this.levelManager.update(delta);
    }

    /**
     * Get the current level ID
     * @returns {string} The current level ID
     */
    getCurrentLevelId() {
        return this.levelManager.getCurrentLevelId();
    }

    /**
     * Get the current level configuration
     * @returns {Object} The current level configuration
     */
    getCurrentLevelConfig() {
        return this.levelManager.getCurrentLevelConfig();
    }
    
    /**
     * Check if a level is currently being loaded or in transition
     * @returns {boolean} Whether a level operation is in progress
     */
    isLevelOperationInProgress() {
        return this.levelManager.isLevelOperationInProgress();
    }
}
