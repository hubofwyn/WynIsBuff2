import { EventNames } from '../../constants/EventNames';
import { getLogger } from '../../core/Logger';

/**
 * CameraManager class handles camera effects like screen shake
 * and transitions for various game events.
 */
export class CameraManager {
    /**
     * Create a new CameraManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.logger = getLogger('CameraManager');
        this.scene = scene;
        this.eventSystem = eventSystem;
        this.camera = scene.cameras.main;
        
        // Default shake configuration
        this.defaultShakeConfig = {
            duration: 100,
            intensity: 0.01,
            force: 0,
            direction: null, // null for random direction
            decay: true // whether shake intensity should decay over time
        };
        
        // Shake state tracking
        this.isShaking = false;
        this.shakeTimer = null;
        
        // Accessibility settings
        this.effectsEnabled = true;
        
        // Set up event listeners
        this.setupEventListeners();
        
        this.logger.info('Initialized');
    }
    
    /**
     * Set up event listeners for camera effects
     */
    setupEventListeners() {
        if (!this.eventSystem) return;
        
        // Listen for jump events to trigger appropriate shake
        this.eventSystem.on(EventNames.PLAYER_JUMP, this.handleJump.bind(this));
        
        // Listen for land events to trigger landing shake
        this.eventSystem.on(EventNames.PLAYER_LAND, this.handleLand.bind(this));
        
        // Listen for direct camera shake requests
        this.eventSystem.on(EventNames.CAMERA_SHAKE, this.handleShakeRequest.bind(this));
    }
    
    /**
     * Handle jump events
     * @param {object} data - Jump event data
     */
    handleJump(data) {
        const jumpNumber = data.jumpNumber;
        
        // Only shake for second and third jumps
        if (jumpNumber === 1) {
            // No shake for first jump
            return;
        } else if (jumpNumber === 2) {
            // Subtle shake for second jump
            this.shake({
                duration: 100,
                intensity: 0.005,
                force: 0.5
            });
        } else if (jumpNumber === 3) {
            // Stronger shake for third jump
            this.shake({
                duration: 200,
                intensity: 0.01,
                force: 1.0
            });
        }
    }
    
    /**
     * Handle land events
     * @param {object} data - Land event data
     */
    handleLand(data) {
        const velocity = data.velocity;
        
        // Only shake if landing with significant velocity
        if (Math.abs(velocity.y) < 20) return;
        
        // Calculate shake intensity based on landing velocity
        const impactForce = Math.min(Math.abs(velocity.y) / 50, 1.5); // Cap at 1.5x
        
        // Shake in the direction of impact
        this.shake({
            duration: 150,
            intensity: 0.005 * impactForce,
            force: impactForce,
            direction: { x: 0, y: 1 } // Shake downward for landing
        });
    }
    
    /**
     * Handle direct shake requests
     * @param {object} config - Shake configuration
     */
    handleShakeRequest(config) {
        this.shake(config);
    }
    
    /**
     * Apply screen shake effect
     * @param {object} config - Shake configuration
     */
    shake(config = {}) {
        // Skip if effects are disabled
        if (!this.effectsEnabled) return;
        
        // Skip if already shaking with higher force
        if (this.isShaking && this.currentShakeForce > (config.force || 0)) return;
        
        // Merge with default config
        const shakeConfig = {
            ...this.defaultShakeConfig,
            ...config
        };
        
        // Store current shake force for comparison
        this.currentShakeForce = shakeConfig.force;
        
        // Clear any existing shake timer
        if (this.shakeTimer) {
            this.shakeTimer.remove();
            this.shakeTimer = null;
        }
        
        // Apply the shake effect
        this.camera.shake(
            shakeConfig.duration,
            shakeConfig.intensity,
            shakeConfig.decay,
            false, // Don't shake on the vertical axis only
            shakeConfig.direction
        );
        
        // Track shake state
        this.isShaking = true;
        
        // Set timer to reset shake state
        this.shakeTimer = this.scene.time.delayedCall(
            shakeConfig.duration,
            () => {
                this.isShaking = false;
                this.currentShakeForce = 0;
                this.shakeTimer = null;
            }
        );
    }
    
    /**
     * Enable or disable camera effects
     * @param {boolean} enabled - Whether effects should be enabled
     */
    setEffectsEnabled(enabled) {
        this.effectsEnabled = enabled;
    }
    
    /**
     * Clean up resources when scene is shut down
     */
    shutdown() {
        // Remove event listeners
        if (this.eventSystem) {
            this.eventSystem.off(EventNames.PLAYER_JUMP, this.handleJump);
            this.eventSystem.off(EventNames.PLAYER_LAND, this.handleLand);
            this.eventSystem.off(EventNames.CAMERA_SHAKE, this.handleShakeRequest);
        }
        
        // Clear any active timers
        if (this.shakeTimer) {
            this.shakeTimer.remove();
            this.shakeTimer = null;
        }
    }
    /**
     * Set graphics quality for camera effects
     * @param {string} level - 'Low', 'Medium', or 'High'
     */
    setQuality(level) {
        this.quality = level;
        // Disable effects on 'Low'
        this.effectsEnabled = level !== 'Low';
        this.logger.info(`Quality set to ${level}, effectsEnabled=${this.effectsEnabled}`);
    }
}