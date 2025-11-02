import { BaseScene, GameStateManager, EventBus, EconomyManager, DeterministicRNG } from '@features/core';
import { BossRewardSystem } from '@features/boss';
import { EnhancedCloneManager } from '@features/idle';

import { EventNames } from '../constants/EventNames.js';
import { SceneKeys } from '../constants/SceneKeys.js';
import { LOG } from '../observability/core/LogSystem.js';

/**
 * HubScene - Central hub for the idle/automation game
 *
 * The main scene where players manage their idle empire, access different game modes,
 * and view their overall progression. Acts as the central navigation point between
 * the platformer runs, factory management, and upgrade systems.
 */
export class HubScene extends BaseScene {
    constructor() {
        super(SceneKeys.HUB);
    }

    init() {
        // Initialize managers (singletons)
        this.gameStateManager = GameStateManager.getInstance();
        this.economyManager = EconomyManager.getInstance();
        this.eventBus = EventBus.getInstance();
        this.rng = DeterministicRNG.getInstance();

        // Initialize game systems (ensure they're listening to events)
        this.bossRewardSystem = BossRewardSystem.getInstance();
        this.cloneManager = EnhancedCloneManager.getInstance();

        // Scene state
        this.isTransitioning = false;

        // Load saved state
        this.idleState = this.gameStateManager.loadFullIdleState();
    }

    create() {
        LOG.dev('HUBSCENE_CREATED', {
            subsystem: 'scene',
            scene: SceneKeys.HUB,
            message: 'Hub scene created - central hub for idle/automation game',
        });

        // Emit hub entered event via EventBus
        this.eventBus.emit(EventNames.HUB_ENTERED);

        // Set up the hub UI
        this.createBackground();
        this.createHubLayout();
        this.createResourceDisplay();
        this.createNavigationButtons();
        this.createIdleProgressDisplay();

        // Start idle tick timer
        this.startIdleTick();

        // Calculate offline progress if applicable
        this.calculateOfflineProgress();

        // Set up auto-save
        this.setupAutoSave();

        // Listen for scene events
        this.setupEventListeners();
    }

    createBackground() {
        // Create an animated gradient background
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x1a1a2e).setOrigin(0, 0);

        // Add subtle particle effects for atmosphere
        // TODO: Implement particle system
    }

    createHubLayout() {
        const centerX = this.scale.width / 2;
        const _centerY = this.scale.height / 2;

        // Hub title
        this.add
            .text(centerX, 50, 'BUFF CENTRAL HUB', {
                fontSize: '48px',
                fontFamily: 'Arial Black',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 6,
            })
            .setOrigin(0.5);

        // Welcome message with dynamic content
        const welcomeText = this.getWelcomeMessage();
        this.welcomeText = this.add
            .text(centerX, 100, welcomeText, {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                align: 'center',
            })
            .setOrigin(0.5);
    }

    createResourceDisplay() {
        // Resource panel background
        const panelX = 20;
        const panelY = 20;
        const panelWidth = 300;
        const panelHeight = 150;

        this.add
            .rectangle(panelX, panelY, panelWidth, panelHeight, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0xffd700);

        // Resource labels
        const resources = this.idleState.resources || {};

        this.buffCoinsText = this.add.text(
            panelX + 10,
            panelY + 20,
            `Buff Coins: ${this.formatNumber(resources.buffCoins || 0)}`,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#FFD700',
            }
        );

        this.buffGemsText = this.add.text(
            panelX + 10,
            panelY + 50,
            `Buff Gems: ${this.formatNumber(resources.buffGems || 0)}`,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#FF69B4',
            }
        );

        this.dnaText = this.add.text(
            panelX + 10,
            panelY + 80,
            `DNA: ${this.formatNumber(resources.dna || 0)}`,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#00FF00',
            }
        );

        this.timeEchoesText = this.add.text(
            panelX + 10,
            panelY + 110,
            `Time Echoes: ${this.formatNumber(resources.timeEchoes || 0)}`,
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#00FFFF',
            }
        );
    }

    createNavigationButtons() {
        const centerX = this.scale.width / 2;
        const buttonY = 250;
        const buttonSpacing = 150;

        // Start Run button
        this.createNavigationButton(
            centerX - buttonSpacing * 1.5,
            buttonY,
            'START RUN',
            0x00ff00,
            () => this.startRun()
        );

        // Factory button
        this.createNavigationButton(
            centerX - buttonSpacing * 0.5,
            buttonY,
            'FACTORY',
            0x0080ff,
            () => this.openFactory()
        );

        // Upgrades button
        this.createNavigationButton(
            centerX + buttonSpacing * 0.5,
            buttonY,
            'UPGRADES',
            0xffff00,
            () => this.openUpgrades()
        );

        // Prestige button
        this.createNavigationButton(
            centerX + buttonSpacing * 1.5,
            buttonY,
            'PRESTIGE',
            0xff00ff,
            () => this.openPrestige()
        );

        // Settings button (top right)
        this.createNavigationButton(
            this.scale.width - 100,
            50,
            'SETTINGS',
            0x808080,
            () => this.openSettings(),
            100,
            40
        );

        // Return to Main Menu button (bottom)
        this.createNavigationButton(
            centerX,
            this.scale.height - 50,
            'MAIN MENU',
            0xff0000,
            () => this.returnToMainMenu(),
            150,
            40
        );
    }

    createNavigationButton(x, y, text, color, callback, width = 120, height = 60) {
        const button = this.add
            .rectangle(x, y, width, height, color)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                button.setScale(1.1);
                button.setFillStyle(color, 0.8);
            })
            .on('pointerout', () => {
                button.setScale(1);
                button.setFillStyle(color);
            })
            .on('pointerdown', () => {
                button.setScale(0.95);
            })
            .on('pointerup', () => {
                button.setScale(1.1);
                if (!this.isTransitioning) {
                    callback();
                }
            });

        // Button text
        this.add
            .text(x, y, text, {
                fontSize: '16px',
                fontFamily: 'Arial Black',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 4,
            })
            .setOrigin(0.5);

        return button;
    }

    createIdleProgressDisplay() {
        const centerX = this.scale.width / 2;
        const progressY = 400;

        // Idle progress panel
        const panelWidth = 600;
        const panelHeight = 200;

        this.add
            .rectangle(centerX, progressY, panelWidth, panelHeight, 0x000000, 0.7)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x00ff00);

        // Title
        this.add
            .text(centerX, progressY - 80, 'IDLE PROGRESS', {
                fontSize: '24px',
                fontFamily: 'Arial Black',
                color: '#00FF00',
            })
            .setOrigin(0.5);

        // Progress indicators
        this.idleProgressText = this.add
            .text(centerX, progressY - 30, 'Generating resources...', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
            })
            .setOrigin(0.5);

        // Active automation count
        this.automationText = this.add
            .text(centerX, progressY, 'Active Automations: 0', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#00FFFF',
            })
            .setOrigin(0.5);

        // Production rate
        this.productionRateText = this.add
            .text(centerX, progressY + 30, 'Production Rate: 0/sec', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#FFD700',
            })
            .setOrigin(0.5);

        // Time until next milestone
        this.milestoneText = this.add
            .text(centerX, progressY + 60, 'Next Milestone: --:--', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#FF69B4',
            })
            .setOrigin(0.5);
    }

    startIdleTick() {
        // Create idle tick timer
        this.idleTimer = this.time.addEvent({
            delay: 1000, // Tick every second
            callback: this.onIdleTick,
            callbackScope: this,
            loop: true,
        });
    }

    onIdleTick() {
        // Emit idle tick event for other systems to respond
        this.events.emit(EventNames.IDLE_TICK);

        // Update displays
        this.updateResourceDisplay();
        this.updateProgressDisplay();
    }

    calculateOfflineProgress() {
        const offlineTime = this.idleState.offlineTime;

        if (offlineTime > 0) {
            // Calculate offline earnings
            const offlineSeconds = Math.floor(offlineTime / 1000);
            const maxOfflineHours = 24; // Cap at 24 hours
            const cappedSeconds = Math.min(offlineSeconds, maxOfflineHours * 3600);

            if (cappedSeconds > 60) {
                // Show offline progress popup
                this.showOfflineProgressPopup(cappedSeconds);

                // Emit offline progress event
                this.events.emit(EventNames.OFFLINE_PROGRESS_CALCULATED, {
                    seconds: cappedSeconds,
                    resources: {}, // Will be calculated by ResourceManager
                });
            }
        }
    }

    showOfflineProgressPopup(seconds) {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // Create popup background
        const popup = this.add
            .rectangle(centerX, centerY, 400, 300, 0x000000, 0.9)
            .setStrokeStyle(3, 0xffd700);

        // Title
        const title = this.add
            .text(centerX, centerY - 100, 'OFFLINE PROGRESS', {
                fontSize: '24px',
                fontFamily: 'Arial Black',
                color: '#FFD700',
            })
            .setOrigin(0.5);

        // Time away
        const timeText = this.formatTime(seconds);
        const timeAway = this.add
            .text(centerX, centerY - 50, `You were away for: ${timeText}`, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
            })
            .setOrigin(0.5);

        // Rewards earned (placeholder)
        const rewards = this.add
            .text(centerX, centerY, 'Calculating rewards...', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#00FF00',
                align: 'center',
            })
            .setOrigin(0.5);

        // Close button
        const closeButton = this.add
            .text(centerX, centerY + 100, '[COLLECT]', {
                fontSize: '20px',
                fontFamily: 'Arial Black',
                color: '#00FF00',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => {
                popup.destroy();
                title.destroy();
                timeAway.destroy();
                rewards.destroy();
                closeButton.destroy();
            });
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveTimer = this.time.addEvent({
            delay: 30000,
            callback: this.autoSave,
            callbackScope: this,
            loop: true,
        });
    }

    autoSave() {
        LOG.dev('HUBSCENE_AUTOSAVE', {
            subsystem: 'scene',
            scene: SceneKeys.HUB,
            message: 'Performing auto-save of idle game state',
        });
        // Will be implemented when managers are ready
        // this.gameStateManager.saveFullIdleState(this.getCurrentState());
    }

    setupEventListeners() {
        // Listen for resource updates
        this.events.on(EventNames.RESOURCE_GAINED, this.onResourceGained, this);
        this.events.on(EventNames.RESOURCE_SPENT, this.onResourceSpent, this);

        // Listen for upgrade events
        this.events.on(EventNames.UPGRADE_PURCHASED, this.onUpgradePurchased, this);

        // Listen for automation events
        this.events.on(EventNames.AUTOMATION_STARTED, this.onAutomationStarted, this);

        // Clean up on scene shutdown
        this.events.once('shutdown', this.cleanup, this);
    }

    // Navigation methods
    startRun() {
        this.isTransitioning = true;
        this.events.emit(EventNames.HUB_EXITED);
        this.scene.start(SceneKeys.RUN);
    }

    openFactory() {
        this.isTransitioning = true;
        this.events.emit(EventNames.HUB_EXITED);
        this.scene.start(SceneKeys.FACTORY);
    }

    openUpgrades() {
        this.isTransitioning = true;
        this.scene.start(SceneKeys.UPGRADES);
    }

    openPrestige() {
        this.isTransitioning = true;
        this.scene.start(SceneKeys.PRESTIGE);
    }

    openSettings() {
        this.scene.pause();
        this.scene.launch(SceneKeys.SETTINGS);
    }

    returnToMainMenu() {
        this.isTransitioning = true;
        this.events.emit(EventNames.HUB_EXITED);
        this.cleanup();
        this.scene.start(SceneKeys.MAIN_MENU);
    }

    // Event handlers
    onResourceGained(_data) {
        // Update resource display
        this.updateResourceDisplay();
    }

    onResourceSpent(_data) {
        // Update resource display
        this.updateResourceDisplay();
    }

    onUpgradePurchased(_data) {
        // Update progress display
        this.updateProgressDisplay();
    }

    onAutomationStarted(_data) {
        // Update automation count
        this.updateProgressDisplay();
    }

    // Update methods
    updateResourceDisplay() {
        // Will be implemented when ResourceManager is ready
    }

    updateProgressDisplay() {
        // Will be implemented when managers are ready
    }

    // Utility methods
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(0);
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    getWelcomeMessage() {
        const messages = [
            'Welcome back, Buff Master!',
            'Ready to get even more buff?',
            'Your empire awaits!',
            'Time to maximize those gains!',
            'The grind never stops!',
        ];
        return messages[this.rng.int(0, messages.length - 1, 'main')];
    }

    cleanup() {
        // Stop timers
        if (this.idleTimer) {
            this.idleTimer.destroy();
        }
        if (this.autoSaveTimer) {
            this.autoSaveTimer.destroy();
        }

        // Remove event listeners
        this.events.off(EventNames.RESOURCE_GAINED);
        this.events.off(EventNames.RESOURCE_SPENT);
        this.events.off(EventNames.UPGRADE_PURCHASED);
        this.events.off(EventNames.AUTOMATION_STARTED);

        // Save current state
        this.autoSave();
    }

    update(_time, _delta) {
        // Update animations and visual effects
    }
}
