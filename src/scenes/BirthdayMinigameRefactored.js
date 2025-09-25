import { Scene } from 'phaser';
import { SceneKeys } from '../constants/SceneKeys.js';
import { AudioAssets } from '../constants/Assets.js';
import { AudioManager } from '@features/core';
import {
    BirthdayConfig,
    BirthdayEvents,
    BirthdayGameManager,
    BirthdayLaneManager,
    BirthdaySpawnManager,
    BirthdayCollisionManager,
    BirthdayUIManager,
    BirthdayPlayer
} from '../modules/birthday';

/**
 * BirthdayMinigame - Refactored Scene
 * Now ~300 lines instead of 2217 lines!
 * All logic delegated to specialized managers
 */
export class BirthdayMinigameRefactored extends Scene {
    constructor() {
        super(SceneKeys.BIRTHDAY_MINIGAME);
        
        // Managers
        this.gameManager = null;
        this.laneManager = null;
        this.spawnManager = null;
        this.collisionManager = null;
        this.uiManager = null;
        
        // Game objects
        this.player = null;
        this.deliveryZone = null;
        
        // Input
        this.cursors = null;
        this.keys = null;
    }
    
    create() {
        // Ensure camera is properly reset and faded in
        this.cameras.main.fadeIn(300);
        
        // Initialize audio
        this.initAudio();
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, 1024, 768);
        
        // Create managers
        this.createManagers();
        
        // Create game world
        this.createGameWorld();
        
        // Setup input
        this.setupInput();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start game after short delay
        this.time.delayedCall(500, () => {
            this.gameManager.startGame();
        });
    }
    
    /**
     * Initialize audio
     */
    initAudio() {
        const audioManager = AudioManager.getInstance();
        
        // Stop any playing music
        audioManager.stopAllMusic();
        
        // Play birthday music after delay
        this.time.delayedCall(BirthdayConfig.Audio.MusicStartDelayMs, () => {
            if (audioManager.isMusicEnabled()) {
                audioManager.playMusic(AudioAssets.BIRTHDAY_THEME, {
                    volume: BirthdayConfig.Audio.MusicVolume,
                    loop: true
                });
            }
        });
    }
    
    /**
     * Create all manager instances
     */
    createManagers() {
        // Game state manager
        this.gameManager = new BirthdayGameManager(this);
        
        // Lane manager
        this.laneManager = new BirthdayLaneManager(this);
        
        // Spawn manager
        this.spawnManager = new BirthdaySpawnManager(this, this.laneManager);
        
        // Collision manager
        this.collisionManager = new BirthdayCollisionManager(this, this.gameManager);
        
        // UI manager
        this.uiManager = new BirthdayUIManager(this);
    }
    
    /**
     * Create the game world
     */
    createGameWorld() {
        // Create lanes
        this.laneManager.createLanes();
        
        // Create player
        this.createPlayer();
        
        // Create delivery zone
        this.createDeliveryZone();
        
        // Initialize spawn manager
        this.spawnManager.init();
        
        // Create UI
        this.uiManager.create();
    }
    
    /**
     * Create player
     */
    createPlayer() {
        const { Player, Lanes } = BirthdayConfig;
        
        this.player = new BirthdayPlayer(
            this,
            Player.StartXPx,
            Lanes.Positions[Player.StartLane]
        );
    }
    
    /**
     * Create delivery zone
     */
    createDeliveryZone() {
        const { DeliveryZone } = BirthdayConfig;
        
        // Visual delivery zone
        this.deliveryZone = this.add.rectangle(
            DeliveryZone.XPosition,
            DeliveryZone.YPosition,
            DeliveryZone.WidthPx,
            DeliveryZone.HeightPx,
            0x00FF00, 0.2
        );
        
        // Add border
        const border = this.add.graphics();
        border.lineStyle(3, 0x00FF00, 0.8);
        border.strokeRect(
            DeliveryZone.XPosition - DeliveryZone.WidthPx/2,
            DeliveryZone.YPosition - DeliveryZone.HeightPx/2,
            DeliveryZone.WidthPx,
            DeliveryZone.HeightPx
        );
        
        // Add label
        this.add.text(
            DeliveryZone.XPosition,
            DeliveryZone.YPosition - DeliveryZone.HeightPx/2 - 20,
            'DELIVERY',
            {
                fontFamily: 'Arial Black',
                fontSize: '20px',
                color: '#00FF00',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // Pulse effect
        this.tweens.add({
            targets: this.deliveryZone,
            alpha: { from: 0.2, to: 0.4 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }
    
    /**
     * Setup input controls
     */
    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            r: Phaser.Input.Keyboard.KeyCodes.R,
            esc: Phaser.Input.Keyboard.KeyCodes.ESC
        });
        
        // Restart key
        this.keys.r.on('down', () => {
            if (this.gameManager.gameOver) {
                this.scene.restart();
            }
        });
        
        // Pause key
        this.keys.esc.on('down', () => {
            if (this.gameManager.gameStarted && !this.gameManager.gameOver) {
                this.gameManager.paused = !this.gameManager.paused;
            }
        });
    }
    
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Object removal
        this.events.on('removeObject', (object) => {
            this.spawnManager.removeObject(object);
        });
        
        // Parcel pickup
        this.events.on(BirthdayEvents.PARCEL_PICKUP, () => {
            this.player.pickUpParcel();
            AudioManager.getInstance().playSFX('pickup');
        });
        
        // Delivery made
        this.events.on(BirthdayEvents.DELIVERY_MADE, (data) => {
            this.player.deliverParcel();
            AudioManager.getInstance().playSFX('delivery');
            
            // Screen flash for perfect delivery
            if (data.isPerfect) {
                this.cameras.main.flash(200, 255, 215, 0);
            }
        });
        
        // Obstacle hit
        this.events.on(BirthdayEvents.OBSTACLE_HIT, (data) => {
            if (!data.blocked) {
                this.player.takeDamage();
                AudioManager.getInstance().playSFX('hit');
            } else {
                AudioManager.getInstance().playSFX('shield');
            }
        });
        
        // Power-up collected
        this.events.on(BirthdayEvents.POWERUP_COLLECTED, (data) => {
            AudioManager.getInstance().playSFX('powerup');
            
            // Apply visual effects based on type
            switch(data.type) {
                case 'Shield':
                    this.player.activateShield();
                    break;
                case 'Speed':
                    this.player.applySpeedBoost();
                    break;
            }
        });
        
        // Speed increase
        this.events.on(BirthdayEvents.SPEED_INCREASE, () => {
            // Visual feedback for speed increase
            this.cameras.main.flash(100, 255, 255, 0, false);
        });
        
        // Game complete
        this.events.on(BirthdayEvents.GAME_COMPLETE, () => {
            this.player.celebrate();
            AudioManager.getInstance().playSFX('victory');
            AudioManager.getInstance().stopMusic(AudioAssets.BIRTHDAY_THEME);
        });
        
        // Game over
        this.events.on(BirthdayEvents.GAME_OVER, () => {
            AudioManager.getInstance().playSFX('gameover');
            AudioManager.getInstance().stopMusic(AudioAssets.BIRTHDAY_THEME);
        });
    }
    
    update(time, delta) {
        // Don't update if game hasn't started or is over
        if (!this.gameManager.gameStarted || this.gameManager.gameOver) {
            return;
        }
        
        // Handle pause
        if (this.gameManager.paused) {
            return;
        }
        
        // Update game time
        this.gameManager.updateTime(delta);
        
        // Handle input
        this.handleInput();
        
        // Update player
        this.player.update(delta);
        
        // Update spawning
        this.spawnManager.update(time, delta, {
            gameStarted: this.gameManager.gameStarted,
            gameOver: this.gameManager.gameOver,
            paused: this.gameManager.paused,
            isCarrying: this.player.isCarrying,
            difficultyLevel: this.gameManager.difficultyLevel,
            speedMultiplier: this.gameManager.speedMultiplier
        });
        
        // Update collisions
        this.collisionManager.update(delta);
        
        // Check collisions
        const activeObjects = this.spawnManager.getActiveObjects();
        this.collisionManager.checkCollisions(
            this.player,
            activeObjects,
            this.player.isCarrying
        );
        
        // Check delivery zone
        if (this.player.isCarrying) {
            if (this.collisionManager.checkDeliveryZone(
                this.player,
                this.deliveryZone,
                this.player.isCarrying
            )) {
                this.gameManager.makeDelivery();
            }
        }
        
        // Update UI timer
        this.uiManager.updateTimer(this.gameManager.gameTime);
        
        // Update power-up states
        if (!this.gameManager.shieldActive) {
            this.player.deactivateShield();
        }
        if (!this.gameManager.speedBoostActive) {
            this.player.removeSpeedBoost();
        }
    }
    
    /**
     * Handle player input
     */
    handleInput() {
        // Vertical movement (lane changes)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (this.laneManager.moveUp(this.player)) {
                AudioManager.getInstance().playSFX('move');
            }
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            if (this.laneManager.moveDown(this.player)) {
                AudioManager.getInstance().playSFX('move');
            }
        }
        
        // Horizontal movement
        if (this.cursors.left.isDown) {
            this.player.moveHorizontal(-1);
        } else if (this.cursors.right.isDown) {
            this.player.moveHorizontal(1);
        } else {
            this.player.moveHorizontal(0);
        }
        
        // Dash
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            let dashDirection = 0;
            if (this.cursors.left.isDown) dashDirection = -1;
            else if (this.cursors.right.isDown) dashDirection = 1;
            else dashDirection = 1; // Default forward dash
            
            if (this.player.dash(dashDirection)) {
                AudioManager.getInstance().playSFX('dash');
            }
        }
    }
    
    /**
     * Clean up on scene shutdown
     */
    shutdown() {
        // Stop music
        AudioManager.getInstance().stopMusic(AudioAssets.BIRTHDAY_THEME);
        
        // Destroy managers
        this.gameManager?.destroy();
        this.laneManager?.destroy();
        this.spawnManager?.destroy();
        this.uiManager?.destroy();
        
        // Destroy player
        this.player?.destroy();
        
        // Remove event listeners
        this.events.off('removeObject');
        this.events.off(BirthdayEvents.PARCEL_PICKUP);
        this.events.off(BirthdayEvents.DELIVERY_MADE);
        this.events.off(BirthdayEvents.OBSTACLE_HIT);
        this.events.off(BirthdayEvents.POWERUP_COLLECTED);
        this.events.off(BirthdayEvents.SPEED_INCREASE);
        this.events.off(BirthdayEvents.GAME_COMPLETE);
        this.events.off(BirthdayEvents.GAME_OVER);
    }
}