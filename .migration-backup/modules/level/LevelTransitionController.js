import { EventNames } from '../../constants/EventNames';
import { getNextLevelId } from '../../constants/LevelData';
import { SceneKeys } from '../../constants/SceneKeys.js';

/**
 * LevelTransitionController class is responsible for managing level transitions
 */
export class LevelTransitionController {
    /**
     * Create a new LevelTransitionController
     * @param {Phaser.Scene} scene - The scene this controller belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        
        // Transition state
        this.isTransitioning = false;
        this.fromLevelId = null;
        this.toLevelId = null;
        
        // Transition graphics
        this.transitionGraphics = null;
        
        // Debug mode
        this.debugMode = false;
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initialize the transition controller
     */
    initialize() {
        // Create transition graphics (full-screen overlay)
        this.transitionGraphics = this.scene.add.graphics();
        this.transitionGraphics.setDepth(1000); // Ensure it's on top
        
        // Initially hidden
        this.transitionGraphics.clear();
        this.transitionGraphics.setVisible(false);
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
            console.log(`[LevelTransitionController] ${message}`);
        }
    }
    
    /**
     * Start a transition to the next level
     * @param {string} fromLevelId - The current level ID
     * @returns {boolean} Whether the transition was started
     */
    startTransitionToNextLevel(fromLevelId) {
        const nextLevelId = getNextLevelId(fromLevelId);
        
        if (!nextLevelId) {
            this.log('No next level available');
            
            // If no next level, transition to game over
            this.startTransitionToGameOver(fromLevelId);
            return true;
        }
        
        return this.startTransition(fromLevelId, nextLevelId);
    }
    
    /**
     * Start a transition to the game over scene
     * @param {string} fromLevelId - The current level ID
     * @returns {boolean} Whether the transition was started
     */
    startTransitionToGameOver(fromLevelId) {
        this.log(`Starting transition from ${fromLevelId} to GameOver`);
        
        // Store transition state
        this.isTransitioning = true;
        this.fromLevelId = fromLevelId;
        this.toLevelId = null; // No target level, going to GameOver
        
        // Emit transition start event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.LEVEL_TRANSITION_START, {
                fromLevelId: this.fromLevelId,
                toLevelId: null,
                toScene: 'GameOver'
            });
        }
        
        // Perform fade out
        this.fadeOut(() => {
            // Switch to GameOver scene
            this.scene.scene.start(SceneKeys.GAME_OVER);
            
            // Reset transition state
            this.isTransitioning = false;
            this.fromLevelId = null;
            this.toLevelId = null;
            
            // Emit transition complete event
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.LEVEL_TRANSITION_COMPLETE, {
                    fromLevelId: fromLevelId,
                    toLevelId: null,
                    toScene: 'GameOver'
                });
            }
        });
        
        return true;
    }
    
    /**
     * Start a transition between levels
     * @param {string} fromLevelId - The current level ID
     * @param {string} toLevelId - The target level ID
     * @returns {boolean} Whether the transition was started
     */
    startTransition(fromLevelId, toLevelId) {
        // Prevent multiple transitions
        if (this.isTransitioning) {
            this.log('Already transitioning, ignoring request');
            return false;
        }
        
        this.log(`Starting transition from ${fromLevelId} to ${toLevelId}`);
        
        // Store transition state
        this.isTransitioning = true;
        this.fromLevelId = fromLevelId;
        this.toLevelId = toLevelId;
        
        // Emit transition start event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.LEVEL_TRANSITION_START, {
                fromLevelId: this.fromLevelId,
                toLevelId: this.toLevelId
            });
        }
        
        // Perform fade out
        this.fadeOut(() => {
            // Emit level load event
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.LEVEL_LOAD, {
                    levelId: this.toLevelId
                });
            }
        });
        
        return true;
    }
    
    /**
     * Handle level loaded event
     * @param {string} levelId - The loaded level ID
     */
    handleLevelLoaded(levelId) {
        // Only proceed if we're transitioning to this level
        if (!this.isTransitioning || this.toLevelId !== levelId) {
            return;
        }
        
        this.log(`Level ${levelId} loaded, fading in`);
        
        // Perform fade in
        this.fadeIn(() => {
            // Reset transition state
            this.isTransitioning = false;
            
            // Store completed transition info
            const fromLevelId = this.fromLevelId;
            const toLevelId = this.toLevelId;
            
            this.fromLevelId = null;
            this.toLevelId = null;
            
            // Emit transition complete event
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.LEVEL_TRANSITION_COMPLETE, {
                    fromLevelId,
                    toLevelId
                });
            }
        });
    }
    
    /**
     * Fade out the screen
     * @param {Function} onComplete - Callback when fade out is complete
     */
    fadeOut(onComplete) {
        // Make transition graphics visible
        this.transitionGraphics.setVisible(true);
        
        // Start with clear overlay
        this.transitionGraphics.clear();
        this.transitionGraphics.fillStyle(0x000000, 0);
        this.transitionGraphics.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
        
        // Create tween for fade out
        this.scene.tweens.add({
            targets: this.transitionGraphics,
            fillAlpha: 1,
            duration: 500,
            onUpdate: () => {
                // Update graphics on each tween step
                this.transitionGraphics.clear();
                this.transitionGraphics.fillStyle(0x000000, this.transitionGraphics.fillAlpha);
                this.transitionGraphics.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
            },
            onComplete: () => {
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }
    
    /**
     * Fade in the screen
     * @param {Function} onComplete - Callback when fade in is complete
     */
    fadeIn(onComplete) {
        // Ensure transition graphics is visible
        this.transitionGraphics.setVisible(true);
        
        // Start with full black overlay
        this.transitionGraphics.clear();
        this.transitionGraphics.fillStyle(0x000000, 1);
        this.transitionGraphics.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
        
        // Create tween for fade in
        this.scene.tweens.add({
            targets: this.transitionGraphics,
            fillAlpha: 0,
            duration: 500,
            onUpdate: () => {
                // Update graphics on each tween step
                this.transitionGraphics.clear();
                this.transitionGraphics.fillStyle(0x000000, this.transitionGraphics.fillAlpha);
                this.transitionGraphics.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
            },
            onComplete: () => {
                // Hide transition graphics when complete
                this.transitionGraphics.setVisible(false);
                
                if (onComplete) {
                    onComplete();
                }
            }
        });
    }
    
    /**
     * Check if a transition is in progress
     * @returns {boolean} Whether a transition is in progress
     */
    isInTransition() {
        return this.isTransitioning;
    }
    
    /**
     * Get the current transition state
     * @returns {Object} The current transition state
     */
    getTransitionState() {
        return {
            isTransitioning: this.isTransitioning,
            fromLevelId: this.fromLevelId,
            toLevelId: this.toLevelId
        };
    }
}