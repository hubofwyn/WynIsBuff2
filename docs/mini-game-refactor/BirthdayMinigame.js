/**
 * BirthdayMinigame - Refactored Scene
 * Now acts as a simple orchestrator that delegates to specialized managers
 * From 1900+ lines down to ~300 lines!
 */
import { Scene } from 'phaser';
import { SceneKeys } from '../constants/SceneKeys.js';
import { AudioAssets } from '../constants/Assets.js';
import { AudioManager } from '@features/core';

// Import our refactored components
import { BdayConfig } from '../game/BdayConfig.js';
import { BdayGameManager, BdayEvents } from '../game/BdayGameManager.js';
import { BdayUIManager } from '../game/BdayUIManager.js';
import { BdayObjectManager } from '../game/BdayObjectManager.js';
import { Player } from '../entities/Player.js';

export class BirthdayMinigame extends Scene {
    constructor() {
        super(SceneKeys.BIRTHDAY_MINIGAME);
        
        // Manager references
        this.gameManager = null;
        this.uiManager = null;
        this.objectManager = null;
        this.player = null;
        this.audioManager = null;
        
        // Scene elements
        this.deliveryZone = null;
    }
    
    create() {
        // Ensure camera is ready
        this.cameras.main.fadeIn(300);
        
        // Initialize audio
        this.audioManager = AudioManager.getInstance();
        console.log('[BirthdayMinigame] AudioManager initialized:', this.audioManager);
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, 1024, 768);
        
        // Create visual elements
        this.createBackground();
        this.createLanes();
        this.createDeliveryZone();
        
        // Initialize managers (in dependency order)
        this.gameManager = new BdayGameManager(this);
        this.objectManager = new BdayObjectManager(this, this.gameManager);
        this.uiManager = new BdayUIManager(this, this.gameManager);
        
        // Create player
        this.player = new Player(
            this,
            BdayConfig.Player.StartXPx,
            BdayConfig.Lanes.Positions[BdayConfig.Player.StartLane]
        );
        
        // Setup collisions
        this.setupCollisions();
        
        // Setup game event listeners
        this.setupGameEvents();
        
        // Show instructions
        this.showInstructions();
    }
    
    createBackground() {
        const graphics = this.add.graphics();
        
        // Gradient background
        for (let i = 0; i < 16; i++) {
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 44, g: 62, b: 80 },
                { r: 52, g: 73, b: 94 },
                16,
                i
            );
            graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            graphics.fillRect(0, i * 50, 1024, 50);
        }
        
        // Grid pattern
        graphics.lineStyle(1, 0xFFFFFF, 0.05);
        for (let x = 0; x < 1024; x += 50) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, 768);
        }
        for (let y = 0; y < 768; y += 50) {
            graphics.moveTo(0, y);
            graphics.lineTo(1024, y);
        }
    }
    
    createLanes() {
        const laneGraphics = this.add.graphics();
        const startY = BdayConfig.Lanes.StartY;
        const laneHeight = BdayConfig.Lanes.HeightPx;
        const numLanes = BdayConfig.Lanes.Count;
        
        // Road background
        laneGraphics.fillStyle(0x333333, 1);
        laneGraphics.fillRect(0, startY, 1024, laneHeight * numLanes);
        
        // Lane dividers
        laneGraphics.lineStyle(4, 0xFFFFFF, 0.8);
        for (let i = 1; i < numLanes; i++) {
            const y = startY + i * laneHeight;
            for (let x = 0; x < 1024; x += 40) {
                laneGraphics.moveTo(x, y);
                laneGraphics.lineTo(x + 20, y);
            }
        }
        
        // Road edges
        laneGraphics.lineStyle(6, 0xFFD700, 1);
        laneGraphics.moveTo(0, startY);
        laneGraphics.lineTo(1024, startY);
        laneGraphics.moveTo(0, startY + laneHeight * numLanes);
        laneGraphics.lineTo(1024, startY + laneHeight * numLanes);
    }
    
    createDeliveryZone() {
        const config = BdayConfig.DeliveryZone;
        
        // Zone background
        const zoneBg = this.add.rectangle(
            config.XPosition,
            config.YPosition,
            config.WidthPx,
            config.HeightPx,
            0x00FF00, 0.2
        );
        
        // Zone border
        this.deliveryZone = this.add.rectangle(
            config.XPosition,
            config.YPosition,
            config.WidthPx,
            config.HeightPx,
            0x00FF00, 0.3
        );
        this.deliveryZone.setStrokeStyle(4, 0x00FF00);
        this.physics.add.existing(this.deliveryZone, true);
        
        // Pulse animation
        this.tweens.add({
            targets: zoneBg,
            alpha: { from: 0.2, to: 0.5 },
            scale: { from: 1, to: 1.05 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
        
        // Zone label
        const zoneLabel = this.add.container(config.XPosition, 100);
        
        const textBg = this.add.rectangle(0, 0, 140, 80, 0x000000, 0.7);
        textBg.setStrokeStyle(3, 0x00FF00);
        
        const deliveryText = this.add.text(0, -15, 'DELIVERY', {
            fontSize: '24px',
            color: '#00FF00',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        
        const zoneText = this.add.text(0, 10, 'ZONE', {
            fontSize: '28px',
            color: '#00FF00',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        
        zoneLabel.add([textBg, deliveryText, zoneText]);
    }
    
    setupCollisions() {
        // Player vs scrolling objects
        this.physics.add.overlap(
            this.player,
            this.objectManager.getScrollingObjects(),
            this.handleCollision,
            null,
            this
        );
    }
    
    handleCollision(player, object) {
        // Check lane alignment
        const playerLane = player.currentLane;
        const objectLane = object.lane;
        
        // Check proximity
        const distance = Math.abs(player.x - object.x);
        const pickupThreshold = BdayConfig.Collision.PickupThresholdPx;
        const nearMissThreshold = BdayConfig.Collision.NearMissThresholdPx;
        
        if (distance < pickupThreshold && objectLane === playerLane) {
            if (object.isParcel && !this.gameManager.isCarrying && !object.pickedUp) {
                // Pickup parcel
                object.pickedUp = true;
                this.gameManager.pickupParcel(object.itemType, object.points);
                player.pickupParcel(object.itemType, object.points);
                this.objectManager.recycleObject(object);
                this.audioManager.playSFX('pickup');
                
            } else if (object.isObstacle && !object.hit) {
                // Hit obstacle
                object.hit = true;
                
                if (object.isPoop) {
                    this.audioManager.playSFX('fart');
                    this.showFloatingText(player.x, player.y - 60, '💩 EWWW! 💩', '#8B4513');
                } else {
                    this.audioManager.playSFX('land');
                    this.showFloatingText(player.x, player.y - 60, 'Ouch!', '#FF0000');
                }
                
                player.hit();
                this.gameManager.dropParcel();
                player.respawn();
            }
        } else if (distance < nearMissThreshold && objectLane !== playerLane) {
            // Near miss
            if (object.isObstacle && !object.nearMissed) {
                object.nearMissed = true;
                this.gameManager.registerNearMiss();
            }
        }
    }
    
    setupGameEvents() {
        // Listen for game events that need scene-level handling
        this.events.on(BdayEvents.GAME_STARTED, () => {
            this.startMusic();
        });
        
        this.events.on(BdayEvents.GAME_OVER, () => {
            this.physics.pause();
            this.audioManager.stopMusic(AudioAssets.BIRTHDAY_SONG);
        });
        
        this.events.on(BdayEvents.BIRTHDAY_COMPLETE, () => {
            this.physics.pause();
            this.audioManager.playSFX('pickup');
            this.saveAchievements();
        });
    }
    
    showInstructions() {
        // Simplified instructions display
        const overlay = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.85)
            .setScrollFactor(0)
            .setInteractive();
        
        const instructionText = this.add.text(512, 384, 
            '🎂 WYN\'S 9TH BIRTHDAY RUSH! 🎂\n\n' +
            'Deliver 9 Shakes for Wyn\'s Birthday!\n\n' +
            'CONTROLS:\n' +
            'W/S or ↑/↓: Change Lanes\n' +
            'A/D or ← →: Move Left/Right\n' +
            'SPACE: Dash\n\n' +
            'Press SPACE to START!',
            {
                fontSize: '28px',
                color: '#FFD700',
                fontFamily: 'Impact',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0);
        
        // Wait for space to start
        this.input.keyboard.once('keydown-SPACE', () => {
            overlay.destroy();
            instructionText.destroy();
            this.gameManager.startGame();
        });
    }
    
    startMusic() {
        // Resume audio context and start music
        if (this.sound.context?.state === 'suspended') {
            this.sound.context.resume();
        }
        
        this.time.delayedCall(BdayConfig.Audio.MusicStartDelayMs, () => {
            this.audioManager.playMusic(AudioAssets.BIRTHDAY_SONG);
            console.log('[BirthdayMinigame] Birthday music started');
        });
    }
    
    saveAchievements() {
        // Save to main game state if available
        const gameState = this.scene.get(SceneKeys.GAME)?.gameStateManager;
        if (gameState) {
            gameState.unlockAchievement('birthday_champion');
            gameState.saveProgress('birthdayMinigame', 9, 9);
        }
    }
    
    showFloatingText(x, y, text, color) {
        const floatingText = this.add.text(x, y, text, {
            fontSize: '24px',
            color: color,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: floatingText,
            y: '-=30',
            alpha: 0,
            duration: 800,
            onComplete: () => floatingText.destroy()
        });
    }
    
    update(time, delta) {
        if (!this.gameManager || this.gameManager.gameOver) return;
        
        // Update object manager (handles spawning and scrolling)
        this.objectManager.update(time, delta);
        
        // Check for delivery zone
        if (this.gameManager.isCarrying && this.player.x > BdayConfig.DeliveryZone.TriggerXPx) {
            if (this.gameManager.makeDelivery()) {
                this.player.deliverParcel();
                this.player.respawn();
                this.audioManager.playSFX('pickup');
            }
        }
    }
    
    shutdown() {
        // Clean up managers
        if (this.gameManager) this.gameManager.destroy();
        if (this.uiManager) this.uiManager.destroy();
        if (this.objectManager) this.objectManager.destroy();
        if (this.player) this.player.destroy();
        
        // Stop music
        this.audioManager.stopMusic(AudioAssets.BIRTHDAY_SONG);
        
        // Remove event listeners
        this.events.removeAllListeners();
    }
}
