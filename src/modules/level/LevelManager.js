import { EventNames } from '../../constants/EventNames';
import { GroundFactory } from './GroundFactory';
import { PlatformFactory } from './PlatformFactory';
import { MovingPlatformController } from './MovingPlatformController';
import { CollectibleManager } from './CollectibleManager';
import { LevelCompletionManager } from './LevelCompletionManager';
import { LevelTransitionController } from './LevelTransitionController';
import { LevelLoader } from './LevelLoader';

/**
 * LevelManager class serves as a facade for the level system,
 * coordinating all the specialized level-related classes.
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
        
        // Debug mode
        this.debugMode = false;
        
        // Initialize all level-related components
        this.initializeComponents();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Initialize all level-related components
     */
    initializeComponents() {
        // Create ground factory
        this.groundFactory = new GroundFactory(this.scene, this.world, this.eventSystem);
        
        // Create platform factory
        this.platformFactory = new PlatformFactory(this.scene, this.world, this.eventSystem);
        
        // Create moving platform controller
        this.movingPlatformController = new MovingPlatformController(this.scene, this.world, this.eventSystem);
        
        // Create collectible manager
        this.collectibleManager = new CollectibleManager(this.scene, this.world, this.eventSystem);
        
        // Create level completion manager
        this.completionManager = new LevelCompletionManager(
            this.scene, 
            this.world, 
            this.eventSystem,
            this.collectibleManager
        );
        
        // Create level transition controller
        this.transitionController = new LevelTransitionController(this.scene, this.eventSystem);
        
        // Create level loader
        this.levelLoader = new LevelLoader(
            this.scene,
            this.eventSystem,
            {
                groundFactory: this.groundFactory,
                platformFactory: this.platformFactory,
                movingPlatformController: this.movingPlatformController,
                collectibleManager: this.collectibleManager,
                completionManager: this.completionManager
            }
        );
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for level complete events
        if (this.eventSystem) {
            this.eventSystem.on(EventNames.LEVEL_COMPLETE, this.handleLevelComplete.bind(this));
            this.eventSystem.on(EventNames.LEVEL_LOADED, this.handleLevelLoaded.bind(this));
            this.eventSystem.on(EventNames.COLLISION_START, this.handleCollision.bind(this));
        }
    }
    
    /**
     * Set debug mode for all components
     * @param {boolean} enabled - Whether debug mode is enabled
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        
        // Set debug mode for all components
        this.groundFactory.setDebugMode(enabled);
        this.platformFactory.setDebugMode(enabled);
        this.movingPlatformController.setDebugMode(enabled);
        this.collectibleManager.setDebugMode(enabled);
        this.completionManager.setDebugMode(enabled);
        this.transitionController.setDebugMode(enabled);
        this.levelLoader.setDebugMode(enabled);
    }
    
    /**
     * Log a message if debug mode is enabled
     * @param {string} message - The message to log
     */
    log(message) {
        if (this.debugMode) {
            console.log(`[LevelManager] ${message}`);
        }
    }
    
    /**
     * Load a level by ID
     * @param {string} levelId - The ID of the level to load
     * @returns {boolean} Whether the level was loaded successfully
     */
    loadLevel(levelId) {
        this.log(`Loading level: ${levelId}`);
        
        // Use the level loader to load the level
        return this.levelLoader.loadLevel(levelId);
    }
    
    /**
     * Load the next level
     * @returns {boolean} Whether the next level was loaded successfully
     */
    nextLevel() {
        const currentLevelId = this.levelLoader.getCurrentLevelId();
        
        if (!currentLevelId) {
            this.log('Cannot load next level: No current level');
            return false;
        }
        
        this.log(`Loading next level after: ${currentLevelId}`);
        
        // Use the transition controller to handle the transition
        return this.transitionController.startTransitionToNextLevel(currentLevelId);
    }
    
    /**
     * Reset the current level
     * @returns {boolean} Whether the level was reset successfully
     */
    resetLevel() {
        const currentLevelId = this.levelLoader.getCurrentLevelId();
        
        if (!currentLevelId) {
            this.log('Cannot reset level: No current level');
            return false;
        }
        
        this.log(`Resetting level: ${currentLevelId}`);
        
        // Emit level reset event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.LEVEL_RESET, { levelId: currentLevelId });
        }
        
        // Reload the current level
        return this.loadLevel(currentLevelId);
    }
    
    /**
     * Handle level complete event
     * @param {Object} data - Event data
     */
    handleLevelComplete(data) {
        this.log(`Level complete: ${data.levelId}`);
        
        // Start transition to next level
        this.transitionController.startTransitionToNextLevel(data.levelId);
    }
    
    /**
     * Handle level loaded event
     * @param {Object} data - Event data
     */
    handleLevelLoaded(data) {
        this.log(`Level loaded: ${data.levelId}`);
        
        // Notify the transition controller
        this.transitionController.handleLevelLoaded(data.levelId);
    }
    
    /**
     * Handle collision events
     * @param {Object} data - Collision data
     */
    handleCollision(data) {
        // Handle collectible collisions
        if (this.scene.playerController && 
            data.bodyHandleA === this.scene.playerController.getBody().handle) {
            
            // Check if player collided with a collectible
            this.collectibleManager.handleCollectibleCollision(data.bodyHandleB);
            
            // Check if player collided with level completion trigger
            const playerPosition = this.scene.playerController.getPosition();
            this.completionManager.handleTriggerCollision(data.bodyHandleB, playerPosition);
        }
        else if (this.scene.playerController && 
                 data.bodyHandleB === this.scene.playerController.getBody().handle) {
            
            // Check if player collided with a collectible
            this.collectibleManager.handleCollectibleCollision(data.bodyHandleA);
            
            // Check if player collided with level completion trigger
            const playerPosition = this.scene.playerController.getPosition();
            this.completionManager.handleTriggerCollision(data.bodyHandleA, playerPosition);
        }
    }
    
    /**
     * Update method called every frame
     * @param {number} delta - Time elapsed since last update
     */
    update(delta) {
        // Skip update if in transition
        if (this.transitionController.isInTransition()) {
            return;
        }
        
        // Update moving platforms
        this.movingPlatformController.updateMovingPlatforms(delta);
    }
    
    /**
     * Get the body-to-sprite mapping from all components
     * @returns {Map} Combined map of body handles to sprites
     */
    getBodyToSpriteMap() {
        // Create a new map to hold all body-sprite mappings
        const combinedMap = new Map();
        
        // Add mappings from ground factory
        const groundMap = this.groundFactory.getBodyToSpriteMap();
        groundMap.forEach((sprite, handle) => {
            combinedMap.set(handle, sprite);
        });
        
        // Add mappings from platform factory
        const platformMap = this.platformFactory.getBodyToSpriteMap();
        platformMap.forEach((sprite, handle) => {
            combinedMap.set(handle, sprite);
        });
        
        // Add mappings from moving platform controller
        const movingPlatformMap = this.movingPlatformController.getBodyToSpriteMap();
        movingPlatformMap.forEach((sprite, handle) => {
            combinedMap.set(handle, sprite);
        });
        
        // Add mappings from collectible manager
        const collectibleMap = this.collectibleManager.getBodyToSpriteMap();
        collectibleMap.forEach((sprite, handle) => {
            combinedMap.set(handle, sprite);
        });
        
        // Add mappings from completion manager
        const completionMap = this.completionManager.getBodyToSpriteMap();
        completionMap.forEach((sprite, handle) => {
            combinedMap.set(handle, sprite);
        });
        
        return combinedMap;
    }
    
    /**
     * Get all platforms (static and moving)
     * @returns {Array} Array of all platform objects
     */
    getPlatforms() {
        return [
            ...this.platformFactory.getPlatforms(),
            ...this.movingPlatformController.getMovingPlatforms()
        ];
    }
    
    /**
     * Get the ground object
     * @returns {Object} The ground object
     */
    getGround() {
        return this.groundFactory.getGround();
    }
    
    /**
     * Get the current level ID
     * @returns {string} The current level ID
     */
    getCurrentLevelId() {
        return this.levelLoader.getCurrentLevelId();
    }
    
    /**
     * Get the current level configuration
     * @returns {Object} The current level configuration
     */
    getCurrentLevelConfig() {
        return this.levelLoader.getCurrentLevelConfig();
    }
    
    /**
     * Check if a level is currently being loaded or in transition
     * @returns {boolean} Whether a level operation is in progress
     */
    isLevelOperationInProgress() {
        return this.transitionController.isInTransition();
    }
}