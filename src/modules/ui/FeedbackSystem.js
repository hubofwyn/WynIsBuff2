import { BaseManager, EventBus } from '@features/core';
import { EventNames } from '../../constants/EventNames.js';

/**
 * FeedbackSystem - Provides visual and audio feedback for game events
 * 
 * Features:
 * - Floating damage/score numbers
 * - Achievement notifications  
 * - Progress indicators
 * - Visual feedback for state changes
 * - Screen shake and flash effects
 * - Audio cues coordination
 */
export class FeedbackSystem extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        // Debug flag
        this.debug = process.env.NODE_ENV !== 'production';
        
        // Scene reference
        this.scene = null;
        
        // Feedback configurations
        this.config = {
            floatingNumbers: {
                duration: 1500,
                fadeStartTime: 1000,
                fontSize: 24,
                fontFamily: 'Arial Black',
                yOffset: -100
            },
            notifications: {
                duration: 3000,
                slideInTime: 300,
                slideOutTime: 500,
                maxVisible: 3,
                spacing: 80
            },
            screenEffects: {
                shakeDuration: 200,
                flashDuration: 150,
                pulseScale: 1.1,
                pulseDuration: 300
            },
            progressBars: {
                animationDuration: 500,
                colorLerp: true,
                showPercentage: true
            }
        };
        
        // Active feedback elements
        this.activeElements = {
            floatingNumbers: [],
            notifications: [],
            progressBars: new Map(),
            screenEffects: []
        };
        
        // Color themes
        this.colors = {
            damage: 0xff4444,
            healing: 0x44ff44,
            energy: 0xffdd44,
            experience: 0x44ddff,
            combo: 0xff44ff,
            bonus: 0xffaa44,
            warning: 0xff8844,
            success: 0x44ff88,
            error: 0xff4488,
            neutral: 0xffffff
        };
        
        // Event listeners
        this.setupEventListeners();
        
        this.setInitialized();
    }
    
    /**
     * Setup event listeners for automatic feedback
     */
    setupEventListeners() {
        const eventBus = EventBus;
        
        // Combat feedback
        eventBus.on(EventNames.PLAYER_TAKE_DAMAGE, this.handlePlayerDamage.bind(this));
        eventBus.on(EventNames.BOSS_DEFEATED, this.handleBossDefeated.bind(this));
        
        // Resource feedback
        eventBus.on(EventNames.RESOURCE_GAINED, this.handleResourceGained.bind(this));
        eventBus.on(EventNames.COLLECTIBLE_COLLECTED, this.handleCollectibleCollected.bind(this));
        
        // Achievement feedback
        eventBus.on(EventNames.BOSS_FIRST_CLEAR, this.handleBossFirstClear.bind(this));
        eventBus.on(EventNames.CLONE_FORGE_COMPLETE, this.handleCloneForged.bind(this));
        eventBus.on(EventNames.MOVEMENT_UNLOCKED, this.handleMovementUnlocked.bind(this));
        
        // Performance feedback
        eventBus.on(EventNames.PERFORMANCE_METRIC_RECORDED, this.handlePerformanceWarning.bind(this));
        
        // Combo feedback
        eventBus.on(EventNames.COMBO_INCREASE, this.handleComboIncrease.bind(this));
        eventBus.on(EventNames.COMBO_BREAK, this.handleComboBreak.bind(this));
    }
    
    /**
     * Initialize with scene reference
     * @param {Phaser.Scene} scene - Scene to attach feedback to
     */
    initWithScene(scene) {
        this.scene = scene;
        
        // Create feedback containers
        this.createFeedbackContainers();
        
        if (this.debug) {
            console.log('[FeedbackSystem] Initialized with scene:', scene.scene.key);
        }
    }
    
    /**
     * Create UI containers for different feedback types
     */
    createFeedbackContainers() {
        if (!this.scene) return;
        
        // Floating numbers container (higher depth)
        this.floatingContainer = this.scene.add.container(0, 0)
            .setDepth(9000)
            .setScrollFactor(0);
        
        // Notifications container (top of screen)
        this.notificationContainer = this.scene.add.container(0, 0)
            .setDepth(8500)
            .setScrollFactor(0);
        
        // Progress bars container
        this.progressContainer = this.scene.add.container(0, 0)
            .setDepth(8000)
            .setScrollFactor(0);
        
        // Screen effects container (full screen overlay)
        this.effectsContainer = this.scene.add.container(0, 0)
            .setDepth(9500)
            .setScrollFactor(0);
    }
    
    /**
     * Show floating number at position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Text to display
     * @param {string} type - Type for color/styling
     * @param {Object} options - Additional options
     */
    showFloatingNumber(x, y, text, type = 'neutral', options = {}) {
        if (!this.scene || !this.floatingContainer) return;
        
        const config = { ...this.config.floatingNumbers, ...options };
        const color = this.colors[type] || this.colors.neutral;
        
        const textObj = this.scene.add.text(x, y, text, {
            fontSize: `${config.fontSize}px`,
            fontFamily: config.fontFamily,
            color: `#${color.toString(16).padStart(6, '0')}`,
            stroke: '#000000',
            strokeThickness: 4,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 3,
                fill: true
            }
        }).setOrigin(0.5);
        
        this.floatingContainer.add(textObj);
        
        // Animate floating number
        this.scene.tweens.add({
            targets: textObj,
            y: y + config.yOffset,
            duration: config.duration,
            ease: 'Power2.Out'
        });
        
        this.scene.tweens.add({
            targets: textObj,
            alpha: 0,
            duration: config.duration - config.fadeStartTime,
            delay: config.fadeStartTime,
            ease: 'Power2.In',
            onComplete: () => {
                textObj.destroy();
                const index = this.activeElements.floatingNumbers.indexOf(textObj);
                if (index > -1) {
                    this.activeElements.floatingNumbers.splice(index, 1);
                }
            }
        });
        
        // Scale punch effect
        textObj.setScale(0.1);
        this.scene.tweens.add({
            targets: textObj,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.Out'
        });
        
        this.activeElements.floatingNumbers.push(textObj);
    }
    
    /**
     * Show notification message
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Type for styling
     * @param {Object} options - Additional options
     */
    showNotification(title, message, type = 'neutral', options = {}) {
        if (!this.scene || !this.notificationContainer) return;
        
        const config = { ...this.config.notifications, ...options };
        const color = this.colors[type] || this.colors.neutral;
        
        // Calculate position (stack notifications)
        const yOffset = this.activeElements.notifications.length * config.spacing;
        const x = this.scene.scale.width - 20;
        const y = 80 + yOffset;
        
        // Create notification background
        const bg = this.scene.add.rectangle(0, 0, 350, 70, 0x000000, 0.8)
            .setStrokeStyle(2, color)
            .setOrigin(1, 0);
        
        // Create title text
        const titleText = this.scene.add.text(-10, 5, title, {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: `#${color.toString(16).padStart(6, '0')}`
        }).setOrigin(1, 0);
        
        // Create message text
        const messageText = this.scene.add.text(-10, 30, message, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 330 }
        }).setOrigin(1, 0);
        
        // Create notification container
        const notification = this.scene.add.container(x, y, [bg, titleText, messageText]);
        this.notificationContainer.add(notification);
        
        // Slide in animation
        notification.x = this.scene.scale.width + 50;
        this.scene.tweens.add({
            targets: notification,
            x: x,
            duration: config.slideInTime,
            ease: 'Power2.Out'
        });
        
        // Auto-dismiss after duration
        this.scene.time.delayedCall(config.duration, () => {
            this.dismissNotification(notification);
        });
        
        this.activeElements.notifications.push(notification);
        
        // Remove excess notifications
        if (this.activeElements.notifications.length > config.maxVisible) {
            const oldest = this.activeElements.notifications.shift();
            this.dismissNotification(oldest);
        }
    }
    
    /**
     * Dismiss notification with slide out animation
     * @param {Phaser.GameObjects.Container} notification 
     */
    dismissNotification(notification) {
        if (!notification || notification.destroyed) return;
        
        const config = this.config.notifications;
        
        this.scene.tweens.add({
            targets: notification,
            x: this.scene.scale.width + 50,
            alpha: 0,
            duration: config.slideOutTime,
            ease: 'Power2.In',
            onComplete: () => {
                notification.destroy();
                const index = this.activeElements.notifications.indexOf(notification);
                if (index > -1) {
                    this.activeElements.notifications.splice(index, 1);
                }
                
                // Reposition remaining notifications
                this.repositionNotifications();
            }
        });
    }
    
    /**
     * Reposition notifications after dismissal
     */
    repositionNotifications() {
        const config = this.config.notifications;
        
        this.activeElements.notifications.forEach((notification, index) => {
            const targetY = 80 + (index * config.spacing);
            
            this.scene.tweens.add({
                targets: notification,
                y: targetY,
                duration: 300,
                ease: 'Power2.Out'
            });
        });
    }
    
    /**
     * Create or update progress bar
     * @param {string} id - Progress bar identifier
     * @param {number} current - Current value
     * @param {number} max - Maximum value
     * @param {Object} options - Styling options
     */
    showProgressBar(id, current, max, options = {}) {
        if (!this.scene || !this.progressContainer) return;
        
        const config = { ...this.config.progressBars, ...options };
        const progress = Math.max(0, Math.min(1, current / max));
        
        let progressBar = this.activeElements.progressBars.get(id);
        
        if (!progressBar) {
            // Create new progress bar
            const x = options.x || this.scene.scale.width / 2;
            const y = options.y || this.scene.scale.height - 100;
            const width = options.width || 300;
            const height = options.height || 20;
            
            const bg = this.scene.add.rectangle(0, 0, width, height, 0x333333)
                .setStrokeStyle(2, 0x666666);
            
            const fill = this.scene.add.rectangle(-width/2, 0, 0, height - 4, 0x44ff44)
                .setOrigin(0, 0.5);
            
            const text = this.scene.add.text(0, 0, '', {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setOrigin(0.5);
            
            progressBar = {
                container: this.scene.add.container(x, y, [bg, fill, text]),
                fill,
                text,
                width,
                height,
                lastProgress: 0
            };
            
            this.progressContainer.add(progressBar.container);
            this.activeElements.progressBars.set(id, progressBar);
        }
        
        // Update progress bar
        const targetWidth = progressBar.width * progress;
        const percentage = Math.round(progress * 100);
        
        // Color based on progress
        let fillColor = 0x44ff44; // Green
        if (progress < 0.3) {
            fillColor = 0xff4444; // Red
        } else if (progress < 0.6) {
            fillColor = 0xffaa44; // Orange
        }
        
        // Animate progress
        this.scene.tweens.add({
            targets: progressBar.fill,
            width: targetWidth,
            duration: config.animationDuration,
            ease: 'Power2.Out'
        });
        
        if (config.colorLerp && progressBar.lastProgress !== progress) {
            progressBar.fill.setFillStyle(fillColor);
        }
        
        if (config.showPercentage) {
            progressBar.text.setText(`${current}/${max} (${percentage}%)`);
        }
        
        progressBar.lastProgress = progress;
    }
    
    /**
     * Remove progress bar
     * @param {string} id - Progress bar identifier
     */
    hideProgressBar(id) {
        const progressBar = this.activeElements.progressBars.get(id);
        if (!progressBar) return;
        
        this.scene.tweens.add({
            targets: progressBar.container,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                progressBar.container.destroy();
                this.activeElements.progressBars.delete(id);
            }
        });
    }
    
    /**
     * Screen shake effect
     * @param {number} intensity - Shake intensity (0-10)
     * @param {number} duration - Duration in ms
     */
    screenShake(intensity = 5, duration = null) {
        if (!this.scene || !this.scene.cameras.main) return;
        
        const shakeDuration = duration || this.config.screenEffects.shakeDuration;
        this.scene.cameras.main.shake(shakeDuration, intensity * 0.01);
    }
    
    /**
     * Screen flash effect
     * @param {number} color - Flash color (hex)
     * @param {number} alpha - Flash alpha (0-1)
     * @param {number} duration - Duration in ms
     */
    screenFlash(color = 0xffffff, alpha = 0.3, duration = null) {
        if (!this.scene || !this.effectsContainer) return;
        
        const flashDuration = duration || this.config.screenEffects.flashDuration;
        
        const flash = this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            color,
            alpha
        );
        
        this.effectsContainer.add(flash);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: flashDuration,
            onComplete: () => {
                flash.destroy();
            }
        });
    }
    
    /**
     * Event Handlers
     */
    handlePlayerDamage(data) {
        if (data.position) {
            this.showFloatingNumber(data.position.x, data.position.y, `-${data.damage}`, 'damage');
            this.screenShake(3);
        }
    }
    
    handleBossDefeated(data) {
        this.showNotification('Boss Defeated!', `${data.bossId} has been vanquished!`, 'success');
        this.screenFlash(0xffdd44, 0.4, 300);
        this.screenShake(8, 400);
    }
    
    handleResourceGained(data) {
        if (data.position && data.amount > 0) {
            this.showFloatingNumber(
                data.position.x, 
                data.position.y, 
                `+${data.amount} ${data.type}`, 
                'energy'
            );
        }
    }
    
    handleCollectibleCollected(data) {
        if (data.position) {
            this.showFloatingNumber(data.position.x, data.position.y, data.type || 'Item', 'bonus');
        }
    }
    
    handleBossFirstClear(data) {
        this.showNotification(
            'First Victory!',
            `First time defeating ${data.bossName}! Special rewards unlocked!`,
            'success'
        );
    }
    
    handleCloneForged(data) {
        this.showNotification('Clone Forged!', `New clone lane created with ${data.rate}/s production`, 'success');
    }
    
    handleMovementUnlocked(data) {
        this.showNotification(
            'Movement Unlocked!',
            `New ability: ${data.tech}`,
            'combo'
        );
    }
    
    handlePerformanceWarning(data) {
        if (data.type === 'fps_critical') {
            this.showNotification('Performance Warning', `Low FPS detected: ${data.value}`, 'warning');
        }
    }
    
    handleComboIncrease(data) {
        if (data.position) {
            this.showFloatingNumber(
                data.position.x, 
                data.position.y + 30, 
                `${data.combo}x COMBO!`, 
                'combo'
            );
        }
    }
    
    handleComboBreak(data) {
        if (data.position) {
            this.showFloatingNumber(data.position.x, data.position.y, 'COMBO BREAK', 'error');
        }
    }
    
    /**
     * Clean up all active feedback elements
     */
    cleanup() {
        // Clean up floating numbers
        this.activeElements.floatingNumbers.forEach(element => {
            if (element && !element.destroyed) {
                element.destroy();
            }
        });
        this.activeElements.floatingNumbers = [];
        
        // Clean up notifications
        this.activeElements.notifications.forEach(notification => {
            if (notification && !notification.destroyed) {
                notification.destroy();
            }
        });
        this.activeElements.notifications = [];
        
        // Clean up progress bars
        this.activeElements.progressBars.forEach(progressBar => {
            if (progressBar.container && !progressBar.container.destroyed) {
                progressBar.container.destroy();
            }
        });
        this.activeElements.progressBars.clear();
        
        // Clean up containers
        if (this.floatingContainer && !this.floatingContainer.destroyed) {
            this.floatingContainer.destroy();
        }
        if (this.notificationContainer && !this.notificationContainer.destroyed) {
            this.notificationContainer.destroy();
        }
        if (this.progressContainer && !this.progressContainer.destroyed) {
            this.progressContainer.destroy();
        }
        if (this.effectsContainer && !this.effectsContainer.destroyed) {
            this.effectsContainer.destroy();
        }
    }
    
    /**
     * Update method (called each frame)
     * @param {number} time - Current time
     * @param {number} delta - Delta time
     */
    update(time, delta) {
        // Update any time-based feedback animations
        // This method can be expanded for complex feedback systems
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        this.cleanup();
        
        // Remove event listeners
        const eventBus = EventBus;
        eventBus.off(EventNames.PLAYER_TAKE_DAMAGE, this.handlePlayerDamage);
        eventBus.off(EventNames.BOSS_DEFEATED, this.handleBossDefeated);
        eventBus.off(EventNames.RESOURCE_GAINED, this.handleResourceGained);
        eventBus.off(EventNames.COLLECTIBLE_COLLECTED, this.handleCollectibleCollected);
        eventBus.off(EventNames.BOSS_FIRST_CLEAR, this.handleBossFirstClear);
        eventBus.off(EventNames.CLONE_FORGE_COMPLETE, this.handleCloneForged);
        eventBus.off(EventNames.MOVEMENT_UNLOCKED, this.handleMovementUnlocked);
        eventBus.off(EventNames.PERFORMANCE_METRIC_RECORDED, this.handlePerformanceWarning);
        eventBus.off(EventNames.COMBO_INCREASE, this.handleComboIncrease);
        eventBus.off(EventNames.COMBO_BREAK, this.handleComboBreak);
        
        this.scene = null;
        super.destroy();
    }
}
