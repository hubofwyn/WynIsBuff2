import { Scene } from 'phaser';
import { SceneKeys } from '../constants/SceneKeys.js';
import { EventNames } from '../constants/EventNames.js';
import { UIConfig } from '../constants/UIConfig.js';
import { AudioAssets } from '../constants/Assets.js';
import { AudioManager } from '@features/core';

/**
 * Birthday Minigame: "Wyn's 9th Birthday Shake Rush!"
 * Deliver exactly 9 special Shake Shakes for Wyn's birthday!
 */
export class BirthdayMinigame extends Scene {
    constructor() {
        super(SceneKeys.BIRTHDAY_MINIGAME);
        
        // Game config
        this.laneHeight = 80;
        this.numLanes = 5;
        this.slideSpeed = 280;
        this.dashSpeed = 600;
        this.baseObstacleSpeed = 150;
        this.speedMultiplier = 1.0;
        
        // Movement feel
        this.acceleration = 1800;
        this.deceleration = 2400;
        this.maxSpeed = 320;
        this.targetVelocityX = 0;
        
        // Player state
        this.currentLane = 2;
        this.isHopping = false;
        this.isCarrying = false; // Start without carrying anything
        this.isInvulnerable = false;
        this.canDash = true;
        this.isStunned = false;
        this.carryIndicator = null;
        
        // Movement smoothing
        this.movementTween = null;
        this.bobTween = null;
        
        // Game state
        this.score = 0;
        this.totalPoints = 0;
        this.combo = 0;
        this.missStreak = 0;
        this.gameOver = false;
        this.deliveryTimer = 0;
        this.maxDeliveryTime = 10000; // 10 seconds
        this.difficultyLevel = 1;
        this.highScore = parseInt(localStorage.getItem('birthdayHighScore') || '0');
        this.perfectDeliveries = 0;
        this.speedBonus = 0;
        
        // Leaderboard
        this.leaderboard = this.loadLeaderboard();
        
        // Objects
        this.player = null;
        this.parcel = null;
        this.obstacles = null;
        this.deliveryZone = null;
        this.powerUps = null;
        
        // UI
        this.scoreText = null;
        this.pointsText = null;
        this.comboText = null;
        this.timerText = null;
        this.streakText = null;
    }
    
    create() {
        // Ensure camera is properly reset and faded in
        this.cameras.main.fadeIn(300);
        
        // Initialize audio manager if needed
        const audioManager = AudioManager.getInstance();
        console.log('[BirthdayMinigame] AudioManager initialized:', audioManager);
        
        // Set world bounds to match screen
        this.physics.world.setBounds(0, 0, 1024, 768);
        
        // Create gradient background
        this.createBackground();
        
        // Create lanes
        this.createLanes();
        
        // Create player
        this.createPlayer();
        
        // Create parcel spawning system
        this.parcels = this.physics.add.group();
        
        // Create delivery zone
        this.createDeliveryZone();
        
        // Create obstacle groups
        this.obstacles = this.physics.add.group();
        this.powerUps = this.physics.add.group();
        
        // Fixed camera - no scrolling, show entire play area
        this.cameras.main.setBackgroundColor('#2C3E50');
        this.cameras.main.setBounds(0, 0, 1024, 768);
        this.cameras.main.setZoom(1);
        
        // Set up input - both arrow keys and WASD
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Create UI
        this.createUI();
        
        // Start spawning obstacles
        this.startObstacleSpawning();
        
        // Set up collisions
        this.setupCollisions();
        
        // Grace period
        this.setInvulnerable(1500);
        
        // Show instructions (music will start after user presses SPACE)
        this.showInstructions();
    }
    
    createBackground() {
        // Create static gradient background
        const graphics = this.add.graphics();
        
        // Draw gradient background
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
        
        // Add subtle grid pattern for depth
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
        // Visual lane indicators - make them clear and visible
        const laneGraphics = this.add.graphics();
        
        // Draw lane backgrounds alternating colors
        for (let i = 0; i < this.numLanes; i++) {
            const y = 300 + i * this.laneHeight;
            const color = i % 2 === 0 ? 0x3E5266 : 0x2C3E50;
            
            // Draw lane background
            laneGraphics.fillStyle(color, 0.3);
            laneGraphics.fillRect(0, y, 1024, this.laneHeight);
        }
        
        // Draw lane divider lines
        laneGraphics.lineStyle(3, 0xFFFFFF, 0.3);
        for (let i = 0; i <= this.numLanes; i++) {
            const y = 300 + i * this.laneHeight;
            laneGraphics.moveTo(0, y);
            laneGraphics.lineTo(1024, y);
        }
        
        // Add lane numbers on the left
        for (let i = 0; i < this.numLanes; i++) {
            const y = 300 + i * this.laneHeight + this.laneHeight / 2;
            this.add.text(30, y, `${i + 1}`, {
                fontSize: '24px',
                color: '#FFFFFF',
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 3,
                alpha: 0.5
            }).setOrigin(0.5);
        }
    }
    
    createPlayer() {
        // Create Wyn sprite as the delivery courier
        const startY = 300 + this.currentLane * this.laneHeight + this.laneHeight / 2;
        
        // Use the correct Wyn sprite key
        const wynTexture = 'wynSprite';
        
        if (this.textures.exists(wynTexture)) {
            this.player = this.add.sprite(0, 0, wynTexture);
            this.player.setScale(0.2); // Even smaller scale
        } else {
            // Fallback: create a simple Wyn representation
            console.warn('[BirthdayMinigame] wynSprite texture not found, using fallback');
            this.player = this.add.rectangle(0, 0, 30, 40, 0xFFD700);
        }
        
        // Create player container at correct position
        this.playerContainer = this.add.container(400, startY);
        this.playerContainer.add(this.player);
        
        // Add physics with smaller hitbox to match smaller sprite
        this.physics.add.existing(this.playerContainer);
        this.playerContainer.body.setSize(30, 40);
        this.playerContainer.body.setCollideWorldBounds(true);
        this.playerContainer.body.setDrag(100, 0); // Add some drag for smoother stops
        
        // Add idle breathing animation
        if (this.player.type === 'Sprite') {
            this.tweens.add({
                targets: this.player,
                scaleY: 0.19,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });
        }
    }
    
    spawnParcel() {
        // Spawn parcels from the left side, moving right
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = 300 + lane * this.laneHeight + this.laneHeight / 2;
        const x = -50; // Start off-screen left
        
        // Create parcel container
        const parcelContainer = this.add.container(x, y);
        
        // Background circle for better visibility
        const bgCircle = this.add.circle(0, 0, 35, 0x000000, 0.5);
        bgCircle.setStrokeStyle(3, 0xFFD700);
        
        // Dynamite emoji is the main visual
        const dynamiteEmoji = this.add.text(0, 0, '🧨', {
            fontSize: '40px'
        }).setOrigin(0.5);
        
        // S² Shake label with better visibility
        const labelBg = this.add.rectangle(0, -35, 80, 25, 0x000000, 0.8);
        labelBg.setStrokeStyle(2, 0xFFD700);
        
        const label = this.add.text(0, -35, 'S² SHAKE', {
            fontSize: '14px',
            color: '#FFD700',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Add glow effect
        const glow = this.add.circle(0, 0, 40, 0xFFD700, 0.3);
        
        // Add pickup arrow indicator
        const arrow = this.add.text(0, 35, '⬆ PICKUP', {
            fontSize: '12px',
            color: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        parcelContainer.add([glow, bgCircle, dynamiteEmoji, labelBg, label, arrow]);
        
        // Add physics
        this.physics.add.existing(parcelContainer);
        parcelContainer.body.setSize(70, 70);
        parcelContainer.body.velocity.x = 100; // Move right slowly
        this.parcels.add(parcelContainer);
        
        // Entrance animation
        parcelContainer.setScale(0);
        this.tweens.add({
            targets: parcelContainer,
            scale: 1,
            duration: 300,
            ease: 'Back.Out'
        });
        
        // Pulse effect
        this.tweens.add({
            targets: [glow, arrow],
            alpha: { from: 0.3, to: 0.8 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Auto-destroy if not picked up after crossing screen
        this.time.delayedCall(15000, () => {
            if (parcelContainer.active) {
                this.tweens.add({
                    targets: parcelContainer,
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    onComplete: () => parcelContainer.destroy()
                });
            }
        });
    }
    
    createDeliveryZone() {
        // Create the delivery zone at the right side of screen with better visibility
        const zoneWidth = 120;
        const zoneX = 1024 - zoneWidth/2 - 20;
        
        // Pulsing green zone background
        this.deliveryZoneBg = this.add.rectangle(zoneX, 400, zoneWidth, 500, 0x00FF00, 0.2);
        this.deliveryZone = this.add.rectangle(zoneX, 400, zoneWidth, 500, 0x00FF00, 0.3);
        this.deliveryZone.setStrokeStyle(4, 0x00FF00);
        this.physics.add.existing(this.deliveryZone, true);
        
        // Pulse animation for zone
        this.tweens.add({
            targets: this.deliveryZoneBg,
            alpha: { from: 0.2, to: 0.5 },
            scale: { from: 1, to: 1.05 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
        
        // Add clear "DELIVERY ZONE" text with icon
        const zoneLabel = this.add.container(zoneX, 100);
        
        // Background for text
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
        
        // Add arrow pointing down
        const arrow = this.add.text(0, 35, '⬇', {
            fontSize: '32px',
            color: '#00FF00'
        }).setOrigin(0.5);
        
        zoneLabel.add([textBg, deliveryText, zoneText, arrow]);
        
        // Animate the arrow
        this.tweens.add({
            targets: arrow,
            y: '+=10',
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
    }
    
    createUI() {
        // UI Panel background for better visibility
        const uiPanel = this.add.graphics();
        uiPanel.fillStyle(0x000000, 0.7);
        uiPanel.fillRoundedRect(10, 10, 350, 180, 10);
        uiPanel.lineStyle(3, 0xFFD700);
        uiPanel.strokeRoundedRect(10, 10, 350, 180, 10);
        
        // Deliveries count (main objective) with icon
        this.scoreText = this.add.text(70, 30, 'Deliveries: 0/9', {
            fontSize: '28px',
            color: '#FFD700',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0);
        
        // Add dynamite icon next to deliveries
        this.add.text(35, 30, '🧨', {
            fontSize: '24px'
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Points display with high score
        this.pointsText = this.add.text(35, 65, 'Points: 0', {
            fontSize: '22px',
            color: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0);
        
        // High score display
        this.highScoreText = this.add.text(35, 90, `High Score: ${this.highScore}`, {
            fontSize: '18px',
            color: '#FFD700',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0);
        
        // Combo display
        this.comboText = this.add.text(35, 115, '', {
            fontSize: '20px',
            color: '#00FF00',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0);
        
        // Speed bonus indicator
        this.speedBonusText = this.add.text(35, 140, '', {
            fontSize: '18px',
            color: '#00FFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0);
        
        // Timer with better visibility
        const timerBg = this.add.rectangle(512, 45, 200, 50, 0x000000, 0.7);
        timerBg.setStrokeStyle(3, 0xFFFFFF).setScrollFactor(0);
        
        this.timerText = this.add.text(512, 45, 'Find S² Shake!', {
            fontSize: '24px',
            color: '#00FF00',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Lives/Misses display with hearts
        this.livesContainer = this.add.container(900, 30).setScrollFactor(0);
        this.updateLivesDisplay();
        
        // Perfect delivery streak
        this.perfectStreakText = this.add.text(35, 165, '', {
            fontSize: '16px',
            color: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0);
        
        // Instructions hint at bottom
        this.add.text(512, 740, 'W/S: Change Lanes | A/D: Move | SPACE: Dash', {
            fontSize: '16px',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2,
            alpha: 0.7
        }).setOrigin(0.5).setScrollFactor(0);
    }
    
    updateLivesDisplay() {
        this.livesContainer.removeAll(true);
        
        const livesText = this.add.text(0, 0, 'Lives: ', {
            fontSize: '20px',
            color: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.livesContainer.add(livesText);
        
        // Show hearts for remaining lives
        for (let i = 0; i < 3; i++) {
            const heart = this.add.text(60 + i * 25, 0, i < (3 - this.missStreak) ? '❤️' : '💔', {
                fontSize: '20px'
            }).setOrigin(0.5);
            this.livesContainer.add(heart);
        }
    }
    
    showInstructions() {
        // Center of screen
        const centerX = 512;
        const centerY = 384;
        
        // Array to track all instruction elements
        const instructionElements = [];
        
        // Dark background overlay
        const overlay = this.add.rectangle(centerX, centerY, 1024, 768, 0x000000, 0.85)
            .setScrollFactor(0);
        instructionElements.push(overlay);
        
        // Instruction panel with border
        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.fillRoundedRect(centerX - 350, centerY - 250, 700, 500, 20);
        panel.lineStyle(4, 0xFFD700, 1);
        panel.strokeRoundedRect(centerX - 350, centerY - 250, 700, 500, 20);
        panel.setScrollFactor(0);
        instructionElements.push(panel);
        
        // Title with better positioning
        const title = this.add.text(centerX, centerY - 200, '🎂 WYN\'S 9TH BIRTHDAY RUSH! 🎂', {
            fontSize: '42px',
            color: '#FFD700',
            fontFamily: 'Impact',
            stroke: '#FF0000',
            strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0);
        instructionElements.push(title);
        
        // Mission text
        const mission = this.add.text(centerX, centerY - 140, 
            'Deliver 9 S² Shake Shakes for Wyn\'s Birthday!',
            {
                fontSize: '24px',
                color: '#00FF00',
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setScrollFactor(0);
        instructionElements.push(mission);
        
        // Controls section with icons
        const controlsTitle = this.add.text(centerX, centerY - 80, 'CONTROLS', {
            fontSize: '28px',
            color: '#FFFFFF',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0);
        instructionElements.push(controlsTitle);
        
        const controls = [
            { keys: 'W/S or ↑/↓', action: 'Change Lanes', icon: '🏃' },
            { keys: 'A/D or ← →', action: 'Move Left/Right', icon: '↔️' },
            { keys: 'SPACE', action: 'Dash (3s cooldown)', icon: '💨' }
        ];
        
        controls.forEach((control, i) => {
            const y = centerY - 20 + (i * 35);
            
            // Icon
            const icon = this.add.text(centerX - 150, y, control.icon, {
                fontSize: '24px'
            }).setOrigin(0.5).setScrollFactor(0);
            instructionElements.push(icon);
            
            // Keys
            const keys = this.add.text(centerX - 50, y, control.keys, {
                fontSize: '20px',
                color: '#FFD700',
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0, 0.5).setScrollFactor(0);
            instructionElements.push(keys);
            
            // Action
            const action = this.add.text(centerX + 100, y, control.action, {
                fontSize: '18px',
                color: '#FFFFFF',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0, 0.5).setScrollFactor(0);
            instructionElements.push(action);
        });
        
        // Rules section
        const rulesTitle = this.add.text(centerX, centerY + 90, 'RULES', {
            fontSize: '28px',
            color: '#FFFFFF',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0);
        instructionElements.push(rulesTitle);
        
        const rules = [
            '💩 Poop = Instant Respawn + Fart Sound!',
            '🧨 Pick up S² Dynamite Parcels',
            '✅ Deliver to Green Zone',
            '❌ 3 Drops = Game Over',
            '🌟 Collect Easter Eggs for Bonus Points!'
        ];
        
        rules.forEach((rule, i) => {
            const ruleText = this.add.text(centerX, centerY + 125 + (i * 25), rule, {
                fontSize: '18px',
                color: '#FFFFFF',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setScrollFactor(0);
            instructionElements.push(ruleText);
        });
        
        // Start button
        const startButton = this.add.rectangle(centerX, centerY + 280, 250, 60, 0x00FF00)
            .setStrokeStyle(4, 0xFFFFFF)
            .setScrollFactor(0);
        instructionElements.push(startButton);
            
        const startText = this.add.text(centerX, centerY + 280, 'PRESS SPACE TO START!', {
            fontSize: '24px',
            color: '#000000',
            fontFamily: 'Impact'
        }).setOrigin(0.5).setScrollFactor(0);
        instructionElements.push(startText);
        
        // Pulse animation for start button
        const pulseTween = this.tweens.add({
            targets: [startButton, startText],
            scale: { from: 0.95, to: 1.05 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
        
        // Wait for space to start
        const startGame = () => {
            // Stop the pulse animation
            pulseTween.stop();
            
            // Destroy all instruction elements
            instructionElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            
            this.startGame();
        };
        
        this.input.keyboard.once('keydown-SPACE', startGame);
    }
    
    startGame() {
        // Start music after user interaction
        try {
            const audioManager = AudioManager.getInstance();
            
            // Resume Web Audio context if suspended (browser autoplay policy)
            if (this.sound.context && this.sound.context.state === 'suspended') {
                this.sound.context.resume().then(() => {
                    console.log('[BirthdayMinigame] Audio context resumed');
                });
            }
            
            // Also try to unlock Howler audio
            if (window.Howler && window.Howler.ctx && window.Howler.ctx.state === 'suspended') {
                window.Howler.ctx.resume().then(() => {
                    console.log('[BirthdayMinigame] Howler context resumed');
                });
            }
            
            // Stop any currently playing music first
            audioManager.stopMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);
            audioManager.stopMusic(AudioAssets.HYPER_BUFF_BLITZ);
            audioManager.stopMusic(AudioAssets.BIRTHDAY_SONG);
            
            // Small delay to ensure audio context is ready
            this.time.delayedCall(100, () => {
                audioManager.playMusic(AudioAssets.BIRTHDAY_SONG);
                console.log('[BirthdayMinigame] Birthday music started');
                
                // Check if music is actually playing
                const musicTrack = audioManager.music[AudioAssets.BIRTHDAY_SONG];
                if (musicTrack && !musicTrack.playing()) {
                    console.warn('[BirthdayMinigame] Music failed to start - showing audio hint');
                    // Show audio permission hint
                    const audioHint = this.add.text(512, 50, '🔇 Click anywhere to enable audio', {
                        fontSize: '18px',
                        color: '#FFFF00',
                        stroke: '#000000',
                        strokeThickness: 3
                    }).setOrigin(0.5).setScrollFactor(0);
                    
                    // Remove hint after click
                    this.input.once('pointerdown', () => {
                        audioHint.destroy();
                        audioManager.playMusic(AudioAssets.BIRTHDAY_SONG);
                    });
                }
            });
        } catch (error) {
            console.error('[BirthdayMinigame] Failed to start music:', error);
        }
        
        this.deliveryTimer = this.maxDeliveryTime;
        
        // Start delivery timer
        this.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.gameOver && this.isCarrying) {
                    this.deliveryTimer -= 100;
                    if (this.deliveryTimer <= 0) {
                        this.dropParcel();
                        this.missStreak++;
                        this.streakText.setText(`Misses: ${this.missStreak}/3`);
                        if (this.missStreak >= 3) {
                            this.endGame();
                        }
                    }
                }
            },
            loop: true
        });
    }
    
    startObstacleSpawning() {
        // Dynamic spawn rates based on difficulty
        this.time.addEvent({
            delay: () => Math.max(1500, 2500 - (this.difficultyLevel * 150)),
            callback: () => this.spawnObstacle(0), // Poop
            loop: true
        });
        
        this.time.addEvent({
            delay: () => Math.max(1200, 2000 - (this.difficultyLevel * 100)),
            callback: () => this.spawnObstacle(1), // Traffic cones
            loop: true
        });
        
        this.time.addEvent({
            delay: () => Math.max(2500, 3500 - (this.difficultyLevel * 200)),
            callback: () => this.spawnObstacle(2), // Ducks
            loop: true
        });
        
        // Spawn power-ups more frequently
        this.time.addEvent({
            delay: 4000,
            callback: () => this.spawnPowerUp(),
            loop: true
        });
        
        // Special birthday power-ups every 9 seconds
        this.time.addEvent({
            delay: 9000,
            callback: () => this.spawnBirthdayPowerUp(),
            loop: true
        });
        
        // Easter egg spawns
        this.time.addEvent({
            delay: 12000,
            callback: () => this.spawnEasterEgg(),
            loop: true
        });
        
        // Continuous parcel spawning
        this.time.addEvent({
            delay: () => Math.max(3000, 5000 - (this.difficultyLevel * 300)),
            callback: () => {
                if (this.parcels.countActive() < 3 && !this.gameOver) {
                    this.spawnParcel();
                }
            },
            loop: true
        });
    }
    
    spawnObstacle(type) {
        if (this.gameOver) return;
        
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = 300 + lane * this.laneHeight + this.laneHeight / 2;
        
        // Always spawn from left side, moving right for simplicity
        const x = -80;
        const direction = 1;
        
        let obstacleContainer = this.add.container(x, y);
        let speed;
        
        switch(type) {
            case 0: // Poop emoji obstacle!
                const poopEmoji = this.add.text(0, 0, '💩', {
                    fontSize: '36px'
                }).setOrigin(0.5);
                
                // Stink lines
                const stink1 = this.add.text(-10, -20, '~', {
                    fontSize: '16px',
                    color: '#88FF88'
                }).setOrigin(0.5);
                const stink2 = this.add.text(10, -20, '~', {
                    fontSize: '16px',
                    color: '#88FF88'
                }).setOrigin(0.5);
                
                obstacleContainer.add([poopEmoji, stink1, stink2]);
                obstacleContainer.isPoop = true; // Tag poop obstacles
                speed = this.baseObstacleSpeed * this.speedMultiplier;
                
                // Animate stink lines
                this.tweens.add({
                    targets: [stink1, stink2],
                    y: '-=5',
                    alpha: { from: 0.8, to: 0.2 },
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
                break;
                
            case 1: // Traffic cone
                const coneEmoji = this.add.text(0, 0, '🚧', {
                    fontSize: '32px'
                }).setOrigin(0.5);
                
                obstacleContainer.add(coneEmoji);
                speed = this.baseObstacleSpeed * 1.3 * this.speedMultiplier;
                obstacleContainer.wobble = true;
                break;
                
            case 2: // Flying bird/drone
                const birdEmoji = this.add.text(0, 0, '🦆', {
                    fontSize: '32px'
                }).setOrigin(0.5);
                
                // Wing flap effect
                this.tweens.add({
                    targets: birdEmoji,
                    scaleX: { from: 1, to: 0.8 },
                    duration: 200,
                    yoyo: true,
                    repeat: -1
                });
                
                obstacleContainer.add(birdEmoji);
                speed = this.baseObstacleSpeed * 0.8 * this.speedMultiplier;
                obstacleContainer.isDrone = true;
                break;
        }
        
        this.physics.add.existing(obstacleContainer);
        obstacleContainer.body.setSize(50, 40);
        obstacleContainer.body.velocity.x = speed * direction;
        obstacleContainer.speed = speed;
        obstacleContainer.direction = direction;
        this.obstacles.add(obstacleContainer);
    }
    
    spawnPowerUp() {
        if (this.gameOver || Phaser.Math.Between(0, 100) > 40) return;
        
        const types = ['magnet', 'slowmo', 'jetpack', 'shield'];
        const type = Phaser.Utils.Array.GetRandom(types);
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = 300 + lane * this.laneHeight + this.laneHeight / 2;
        const x = Phaser.Math.Between(200, 800);
        
        const powerUpContainer = this.add.container(x, y);
        
        // Glowing background circle
        const glow = this.add.circle(0, 0, 30, 0xFFFF00, 0.3);
        const ring = this.add.circle(0, 0, 25, 0xFFFF00);
        ring.setStrokeStyle(3, 0xFFFF00);
        
        const icon = this.add.text(0, 0, 
            type === 'magnet' ? '🧲' : type === 'slowmo' ? '⏱️' : type === 'jetpack' ? '🚀' : '🛡️',
            { fontSize: '28px' }
        ).setOrigin(0.5);
        
        powerUpContainer.add([glow, ring, icon]);
        powerUpContainer.type = type;
        
        this.physics.add.existing(powerUpContainer);
        powerUpContainer.body.setSize(50, 50);
        this.powerUps.add(powerUpContainer);
        
        // Pulse and rotate effect
        this.tweens.add({
            targets: powerUpContainer,
            scale: { from: 0.9, to: 1.1 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });
        
        this.tweens.add({
            targets: glow,
            scale: { from: 1, to: 1.3 },
            alpha: { from: 0.3, to: 0.1 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Auto-destroy after 5 seconds
        this.time.delayedCall(5000, () => {
            powerUpContainer.destroy();
        });
    }
    
    spawnBirthdayPowerUp() {
        if (this.gameOver) return;
        
        const lane = 2; // Middle lane for special power-up
        const y = 300 + lane * this.laneHeight + this.laneHeight / 2;
        const x = Phaser.Math.Between(300, 700);
        
        const birthdayContainer = this.add.container(x, y);
        
        // Special star shape
        const birthdayPowerUp = this.add.star(0, 0, 8, 20, 30, 0xFFD700);
        birthdayPowerUp.setStrokeStyle(3, 0xFF00FF);
        
        // Birthday cake emoji in center
        const icon = this.add.text(0, 0, '🎂', {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        // 9 text
        const nineText = this.add.text(0, -40, '9', {
            fontSize: '20px',
            fontFamily: 'Impact',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        birthdayContainer.add([birthdayPowerUp, icon, nineText]);
        birthdayContainer.type = 'birthday';
        
        this.physics.add.existing(birthdayContainer);
        birthdayContainer.body.setSize(60, 60);
        this.powerUps.add(birthdayContainer);
        
        // Special rainbow effect
        this.tweens.add({
            targets: birthdayContainer,
            scale: { from: 1, to: 1.3 },
            rotation: Math.PI * 2,
            duration: 1500,
            repeat: -1
        });
        
        // Rainbow color animation
        let hue = 0;
        this.time.addEvent({
            delay: 100,
            callback: () => {
                hue = (hue + 20) % 360;
                const color = Phaser.Display.Color.HSVToRGB(hue / 360, 1, 1);
                birthdayPowerUp.setFillStyle(color.color);
            },
            loop: true
        });
        
        // Auto-destroy after 9 seconds
        this.time.delayedCall(9000, () => {
            birthdayContainer.destroy();
        });
    }
    
    spawnEasterEgg() {
        if (this.gameOver || Phaser.Math.Between(0, 100) > 30) return;
        
        const easterEggs = [
            { emoji: '🦄', name: 'Unicorn Power', points: 500, effect: 'rainbow' },
            { emoji: '💎', name: 'Diamond Rush', points: 1000, effect: 'sparkle' },
            { emoji: '🌟', name: 'Star Power', points: 300, effect: 'invincible' },
            { emoji: '🍕', name: 'Pizza Time', points: 200, effect: 'slowmo' },
            { emoji: '🚀', name: 'Rocket Boost', points: 400, effect: 'speed' }
        ];
        
        const egg = Phaser.Utils.Array.GetRandom(easterEggs);
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = 300 + lane * this.laneHeight + this.laneHeight / 2;
        const x = Phaser.Math.Between(200, 800);
        
        const eggContainer = this.add.container(x, y);
        
        // Easter egg emoji
        const eggEmoji = this.add.text(0, 0, egg.emoji, {
            fontSize: '40px'
        }).setOrigin(0.5);
        
        // Sparkle effect
        const sparkle = this.add.star(0, 0, 6, 15, 25, 0xFFFFFF, 0.6);
        
        // Name label
        const label = this.add.text(0, 30, egg.name, {
            fontSize: '14px',
            color: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        eggContainer.add([sparkle, eggEmoji, label]);
        eggContainer.easterEgg = egg;
        
        this.physics.add.existing(eggContainer);
        eggContainer.body.setSize(60, 60);
        this.powerUps.add(eggContainer);
        
        // Floating animation
        this.tweens.add({
            targets: eggContainer,
            y: '-=20',
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
        
        // Sparkle rotation
        this.tweens.add({
            targets: sparkle,
            rotation: Math.PI * 2,
            duration: 3000,
            repeat: -1
        });
        
        // Auto-destroy after 7 seconds
        this.time.delayedCall(7000, () => {
            this.tweens.add({
                targets: eggContainer,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => eggContainer.destroy()
            });
        });
    }
    
    setupCollisions() {
        // Player vs Obstacles
        this.physics.add.overlap(this.playerContainer, this.obstacles, (player, obstacle) => {
            if (!this.isInvulnerable && !this.gameOver) {
                this.hitObstacle(obstacle);
            }
        });
        
        // Player vs Parcels (pickup)
        this.physics.add.overlap(this.playerContainer, this.parcels, (player, parcel) => {
            if (!this.isCarrying && !this.gameOver) {
                this.pickupParcel(parcel);
            }
        });
        
        // Player vs Delivery Zone
        this.physics.add.overlap(this.playerContainer, this.deliveryZone, () => {
            if (this.isCarrying && !this.gameOver) {
                this.makeDelivery();
            }
        });
        
        // Player vs Power-ups
        this.physics.add.overlap(this.playerContainer, this.powerUps, (player, powerUp) => {
            this.collectPowerUp(powerUp);
        });
    }
    
    update(time, delta) {
        if (this.gameOver) return;
        
        // Update timer display with urgency indicators
        if (this.isCarrying) {
            const timeLeft = Math.max(0, this.deliveryTimer / 1000);
            this.timerText.setText(`Time: ${timeLeft.toFixed(1)}s`);
            
            // Color-coded urgency
            if (timeLeft < 3) {
                this.timerText.setColor('#FF0000');
                // Flash timer when critical
                if (Math.floor(time / 200) % 2 === 0) {
                    this.timerText.setScale(1.1);
                } else {
                    this.timerText.setScale(1);
                }
            } else if (timeLeft < 5) {
                this.timerText.setColor('#FFFF00');
                this.timerText.setScale(1);
            } else {
                this.timerText.setColor('#00FF00');
                this.timerText.setScale(1);
            }
        } else {
            this.timerText.setText('Find S² Shake Shake!');
            this.timerText.setColor('#00FF00');
            this.timerText.setScale(1);
        }
        
        // Handle input
        this.handleInput();
        
        // Safety check: Ensure player stays within bounds
        if (this.playerContainer.x < 50) {
            this.playerContainer.x = 50;
            this.playerContainer.body.velocity.x = 0;
        } else if (this.playerContainer.x > 850) {
            this.playerContainer.x = 850;
            this.playerContainer.body.velocity.x = 0;
        }
        
        // Update obstacles
        this.updateObstacles();
        
        // Update parcels - remove if they go off screen
        this.parcels.children.entries.forEach(parcel => {
            if (parcel.x > 1100) {
                parcel.destroy();
            }
        });
        
        // Visual feedback when approaching delivery zone
        if (this.isCarrying && this.playerContainer.x > 700) {
            if (!this.deliveryZoneBg.glowing) {
                this.deliveryZoneBg.glowing = true;
                this.tweens.add({
                    targets: this.deliveryZoneBg,
                    alpha: 0.8,
                    scale: 1.1,
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });
            }
        } else if (this.deliveryZoneBg.glowing) {
            this.deliveryZoneBg.glowing = false;
            this.tweens.killTweensOf(this.deliveryZoneBg);
            this.deliveryZoneBg.setAlpha(0.2).setScale(1);
        }
    }
    
    handleInput() {
        if (this.isStunned) return;
        
        // Smooth horizontal movement with acceleration
        const leftPressed = this.cursors.left.isDown || this.wasd.A.isDown;
        const rightPressed = this.cursors.right.isDown || this.wasd.D.isDown;
        
        if (leftPressed) {
            this.targetVelocityX = -this.maxSpeed;
            // Flip Wyn sprite to face left
            if (this.player && this.player.setFlipX) this.player.setFlipX(true);
            this.addMovementEffects();
        } else if (rightPressed) {
            this.targetVelocityX = this.maxSpeed;
            // Face right (normal)
            if (this.player && this.player.setFlipX) this.player.setFlipX(false);
            this.addMovementEffects();
        } else {
            this.targetVelocityX = 0;
            this.removeMovementEffects();
        }
        
        // Apply acceleration/deceleration
        const currentVelX = this.playerContainer.body.velocity.x;
        const velDiff = this.targetVelocityX - currentVelX;
        const acceleration = this.targetVelocityX === 0 ? this.deceleration : this.acceleration;
        
        if (Math.abs(velDiff) > 5) {
            const deltaVel = Math.sign(velDiff) * acceleration * (1/60); // Assuming 60 FPS
            const newVelX = currentVelX + deltaVel;
            
            // Clamp to target velocity
            if (this.targetVelocityX === 0) {
                this.playerContainer.body.velocity.x = Math.abs(newVelX) < 5 ? 0 : newVelX;
            } else {
                this.playerContainer.body.velocity.x = Math.sign(velDiff) === Math.sign(newVelX - this.targetVelocityX) 
                    ? this.targetVelocityX 
                    : newVelX;
            }
        }
        
        // Lane hopping (W/S or Up/Down)
        if ((Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.W)) && !this.isHopping) {
            this.hopLane(-1); // Move up
        } else if ((Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasd.S)) && !this.isHopping) {
            this.hopLane(1); // Move down
        }
        
        // Dash (Space)
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.canDash) {
            this.dash();
        }
    }
    
    hopLane(direction) {
        const newLane = this.currentLane + direction;
        
        // Check bounds (0 to numLanes-1)
        if (newLane >= 0 && newLane < this.numLanes) {
            this.isHopping = true;
            this.currentLane = newLane;
            
            const oldY = this.playerContainer.y;
            const newY = 300 + this.currentLane * this.laneHeight + this.laneHeight / 2;
            
            // Add jump squash/stretch effect
            this.tweens.add({
                targets: this.player,
                scaleY: 0.7,
                scaleX: 1.3,
                duration: 60,
                yoyo: true,
                ease: 'Power2.Out'
            });
            
            // Smooth lane transition with a slight arc
            this.tweens.add({
                targets: this.playerContainer,
                y: newY,
                duration: 150,
                ease: 'Back.Out',
                onUpdate: (tween) => {
                    // Add slight arc motion
                    const progress = tween.progress;
                    const arcHeight = 10;
                    const arc = Math.sin(progress * Math.PI) * arcHeight;
                    this.playerContainer.setScale(1 + arc * 0.01);
                },
                onComplete: () => {
                    this.isHopping = false;
                    this.playerContainer.setScale(1);
                }
            });
            
            // Add dust particles
            this.createDustParticles(this.playerContainer.x, oldY);
            
            AudioManager.getInstance().playSFX('click');
        }
    }
    
    dash() {
        this.canDash = false;
        this.setInvulnerable(200);
        
        // Determine dash direction
        const dashDir = this.playerContainer.body.velocity.x > 0 ? 1 : 
                       this.playerContainer.body.velocity.x < 0 ? -1 : 
                       this.player.flipX ? -1 : 1; // Use facing direction if stationary
        
        // Create multiple afterimages
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 50, () => {
                const afterimage = this.add.sprite(
                    this.playerContainer.x - (i * 30 * dashDir),
                    this.playerContainer.y,
                    'wynSprite'
                );
                afterimage.setScale(0.2);
                afterimage.setAlpha(0.5 - i * 0.15);
                afterimage.setTint(0xFFD700);
                afterimage.setFlipX(this.player.flipX);
                
                this.tweens.add({
                    targets: afterimage,
                    alpha: 0,
                    scaleX: 0.3,
                    duration: 400,
                    onComplete: () => afterimage.destroy()
                });
            });
        }
        
        // Screen shake on dash
        this.cameras.main.shake(100, 0.005);
        
        // Dash movement with burst effect
        this.playerContainer.body.velocity.x = this.dashSpeed * dashDir;
        
        // Add dash trail particles
        this.createDashTrail(dashDir);
        
        // Smooth deceleration after dash
        this.time.delayedCall(200, () => {
            this.tweens.add({
                targets: this.playerContainer.body.velocity,
                x: this.targetVelocityX,
                duration: 300,
                ease: 'Power2.Out'
            });
        });
        
        // Visual feedback - flash effect
        this.player.setTint(0xFFFFFF);
        this.time.delayedCall(100, () => {
            this.player.clearTint();
        });
        
        // Cooldown with visual indicator
        this.time.delayedCall(3000, () => {
            this.canDash = true;
            // Flash to indicate dash ready
            this.player.setTint(0x00FF00);
            this.time.delayedCall(100, () => {
                this.player.clearTint();
            });
        });
        
        AudioManager.getInstance().playSFX('pickup');
    }
    
    hitObstacle(obstacle) {
        this.dropParcel();
        
        // Check if it's a poop obstacle
        if (obstacle.isPoop) {
            // Play fart sound for poop
            AudioManager.getInstance().playSFX('fart');
            
            // Show special poop hit message
            const poopText = this.add.text(
                this.playerContainer.x,
                this.playerContainer.y - 60,
                '💩 EWWW! 💩',
                {
                    fontSize: '28px',
                    color: '#8B4513',
                    fontFamily: 'Arial Black',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5);
            
            this.tweens.add({
                targets: poopText,
                y: '-=40',
                alpha: 0,
                scale: 1.5,
                duration: 1000,
                onComplete: () => poopText.destroy()
            });
            
            // Respawn immediately for poop
            this.respawn();
        } else {
            // Normal obstacle behavior
            // Flash effect
            this.tweens.add({
                targets: this.playerContainer,
                alpha: 0,
                duration: 100,
                yoyo: true,
                repeat: 5,
                onComplete: () => {
                    this.playerContainer.alpha = 1;
                }
            });
            
            // Wyn says "Ouch!" when hit
            const ouchText = this.add.text(
                this.playerContainer.x,
                this.playerContainer.y - 60,
                'Ouch!',
                {
                    fontSize: '24px',
                    color: '#FF0000',
                    fontFamily: 'Arial Black',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5);
            
            this.tweens.add({
                targets: ouchText,
                y: '-=30',
                alpha: 0,
                duration: 800,
                onComplete: () => ouchText.destroy()
            });
            
            AudioManager.getInstance().playSFX('land');
        }
        
        // Screen shake on hit
        this.cameras.main.shake(100, 0.01);
    }
    
    pickupParcel(parcel) {
        this.isCarrying = true;
        this.carriedParcel = parcel;
        parcel.destroy();
        
        // Reset timer when picking up
        this.deliveryTimer = this.maxDeliveryTime;
        
        // Show carrying indicator - dynamite with urgency!
        const indicatorContainer = this.add.container(0, -40);
        
        // Background glow
        const glow = this.add.circle(0, 0, 20, 0xFFD700, 0.5);
        indicatorContainer.add(glow);
        
        // Dynamite emoji
        const indicator = this.add.text(0, 0, '🧨', {
            fontSize: '24px'
        }).setOrigin(0.5);
        indicatorContainer.add(indicator);
        
        // Urgency pulse
        this.tweens.add({
            targets: glow,
            scale: { from: 1, to: 1.3 },
            alpha: { from: 0.5, to: 0.2 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        this.playerContainer.add(indicatorContainer);
        this.carryIndicator = indicatorContainer;
        
        // Satisfying pickup feedback
        this.cameras.main.flash(100, 255, 255, 0, true);
        AudioManager.getInstance().playSFX('pickup');
        
        // Show pickup message
        const pickupText = this.add.text(this.playerContainer.x, this.playerContainer.y - 80, 'GO GO GO!', {
            fontSize: '24px',
            color: '#00FF00',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: pickupText,
            y: '-=20',
            alpha: 0,
            duration: 800,
            onComplete: () => pickupText.destroy()
        });
    }
    
    dropParcel() {
        if (!this.isCarrying) return;
        
        this.isCarrying = false;
        if (this.carryIndicator) {
            this.carryIndicator.destroy();
            this.carryIndicator = null;
        }
        
        // Reset combo and perfect streak
        this.combo = 0;
        this.perfectDeliveries = 0;
        this.updateComboDisplay();
        
        // Spawn new parcel at random location
        this.time.delayedCall(1000, () => {
            this.spawnParcel();
        });
    }
    
    // Remove old recoverParcel function as we don't need it anymore
    
    missParcel() {
        this.missStreak++;
        this.updateLivesDisplay();
        
        // Reset combo and perfect streak on miss
        this.combo = 0;
        this.perfectDeliveries = 0;
        this.updateComboDisplay();
        this.perfectStreakText.setText('');
        
        // Show miss message
        const missText = this.add.text(512, 300, 'DELIVERY MISSED!', {
            fontSize: '36px',
            color: '#FF0000',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);
        
        this.tweens.add({
            targets: missText,
            scale: 1.5,
            alpha: 0,
            duration: 1000,
            onComplete: () => missText.destroy()
        });
        
        if (this.missStreak >= 3) {
            this.endGame();
        } else {
            // Just respawn, a new parcel will be spawned
            this.respawn();
        }
    }
    
    showPointsPopup(points, x, y) {
        const pointsText = this.add.text(x, y, `+${points}`, {
            fontSize: '32px',
            color: '#FFD700',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: pointsText,
            y: y - 60,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            ease: 'Power2.Out',
            onComplete: () => pointsText.destroy()
        });
    }
    
    makeDelivery() {
        // Only count if actually carrying a parcel
        if (!this.isCarrying) return;
        
        this.score++;
        this.scoreText.setText(`Deliveries: ${this.score}/9`);
        this.missStreak = 0;
        this.updateLivesDisplay();
        
        // Calculate time left for speed bonus
        const timeLeft = this.deliveryTimer / 1000;
        const speedBonusMultiplier = timeLeft > 7 ? 3 : timeLeft > 5 ? 2 : 1;
        this.speedBonus = speedBonusMultiplier;
        
        // Perfect delivery tracking
        if (timeLeft > 7) {
            this.perfectDeliveries++;
            if (this.perfectDeliveries > 2) {
                this.perfectStreakText.setText(`Perfect Streak: ${this.perfectDeliveries}!`);
            }
        }
        
        // Calculate points with enhanced system
        this.combo++;
        const basePoints = 100;
        const timeBonus = Math.floor(timeLeft * 20); // 20 points per second left
        const comboBonus = Math.pow(this.combo, 1.5) * 50; // Exponential combo growth
        const perfectBonus = this.perfectDeliveries > 2 ? this.perfectDeliveries * 100 : 0;
        const speedBonusPoints = (speedBonusMultiplier - 1) * 50;
        const earnedPoints = Math.floor(basePoints + timeBonus + comboBonus + perfectBonus + speedBonusPoints);
        this.totalPoints += earnedPoints;
        
        // Update UI
        this.pointsText.setText(`Points: ${this.totalPoints}`);
        this.updateComboDisplay();
        
        // Check for new high score
        if (this.totalPoints > this.highScore) {
            this.highScore = this.totalPoints;
            localStorage.setItem('birthdayHighScore', this.highScore.toString());
            this.highScoreText.setText(`High Score: ${this.highScore}`);
            this.highScoreText.setColor('#00FF00');
            
            // Flash high score
            this.tweens.add({
                targets: this.highScoreText,
                scale: 1.2,
                duration: 200,
                yoyo: true,
                repeat: 2
            });
        }
        
        // Show detailed points popup
        this.showDetailedPointsPopup(earnedPoints, {
            base: basePoints,
            time: timeBonus,
            combo: Math.floor(comboBonus),
            perfect: perfectBonus,
            speed: speedBonusPoints
        });
        
        // Remove the carrying indicator
        this.isCarrying = false;
        if (this.carryIndicator) {
            this.carryIndicator.destroy();
            this.carryIndicator = null;
        }
        
        // Increase difficulty
        this.speedMultiplier += 0.05;
        this.difficultyLevel = Math.min(5, Math.floor(this.score / 2) + 1);
        
        // Success effect with speed indicator
        let deliveryMessage = speedBonusMultiplier > 1 ? `FAST DELIVERY! x${speedBonusMultiplier}` : '+1 SHAKE SHAKE!';
        if (this.score === 9) {
            deliveryMessage = '9TH SHAKE SHAKE! 🎉';
        } else if (this.score > 5) {
            deliveryMessage = `${this.score}/9 SHAKE SHAKES!`;
        }
        
        const successText = this.add.text(512, 200, deliveryMessage, {
            fontSize: '48px',
            color: speedBonusMultiplier > 2 ? '#FFD700' : speedBonusMultiplier > 1 ? '#00FFFF' : '#00FF00',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);
        
        this.tweens.add({
            targets: successText,
            y: 100,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            onComplete: () => successText.destroy()
        });
        
        // Play different sounds based on performance
        if (speedBonusMultiplier > 2) {
            AudioManager.getInstance().playSFX('pickup');
            AudioManager.getInstance().playSFX('click');
        } else {
            AudioManager.getInstance().playSFX('pickup');
        }
        
        // Check for birthday surprise - special 9th birthday at 9 deliveries!
        if (this.score >= 9) {
            this.showBirthdaySurprise();
        } else {
            // Spawn a new parcel and respawn
            this.spawnParcel();
            this.respawn();
        }
    }
    
    updateComboDisplay() {
        if (this.combo > 1) {
            this.comboText.setText(`${this.combo}x COMBO!`);
            const color = this.combo > 5 ? '#FFD700' : this.combo > 3 ? '#00FFFF' : '#00FF00';
            this.comboText.setColor(color);
            
            // Animate combo text
            this.tweens.add({
                targets: this.comboText,
                scale: { from: 1.2, to: 1 },
                duration: 300,
                ease: 'Back.Out'
            });
        } else {
            this.comboText.setText('');
        }
        
        // Update speed bonus display
        if (this.speedBonus > 1) {
            this.speedBonusText.setText(`Speed Bonus: x${this.speedBonus}`);
            this.speedBonusText.setAlpha(1);
            this.tweens.add({
                targets: this.speedBonusText,
                alpha: 0,
                duration: 2000,
                delay: 1000
            });
        }
    }
    
    showDetailedPointsPopup(total, breakdown) {
        const popupContainer = this.add.container(this.deliveryZone.x - 100, 400);
        
        // Background
        const bg = this.add.rectangle(0, 0, 200, 150, 0x000000, 0.8);
        bg.setStrokeStyle(3, 0xFFD700);
        popupContainer.add(bg);
        
        // Total points at top
        const totalText = this.add.text(0, -60, `+${total}`, {
            fontSize: '36px',
            color: '#FFD700',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        popupContainer.add(totalText);
        
        // Breakdown
        let y = -20;
        const addLine = (label, value, color = '#FFFFFF') => {
            if (value > 0) {
                const text = this.add.text(0, y, `${label}: +${value}`, {
                    fontSize: '16px',
                    color: color,
                    fontFamily: 'Arial',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);
                popupContainer.add(text);
                y += 20;
            }
        };
        
        addLine('Base', breakdown.base);
        addLine('Time', breakdown.time, '#00FFFF');
        if (breakdown.combo > 0) addLine('Combo', breakdown.combo, '#00FF00');
        if (breakdown.perfect > 0) addLine('Perfect!', breakdown.perfect, '#FFD700');
        if (breakdown.speed > 0) addLine('Speed', breakdown.speed, '#FF00FF');
        
        // Animate popup
        popupContainer.setScale(0);
        this.tweens.add({
            targets: popupContainer,
            scale: 1,
            duration: 300,
            ease: 'Back.Out',
            onComplete: () => {
                this.tweens.add({
                    targets: popupContainer,
                    y: '-=100',
                    alpha: 0,
                    duration: 1500,
                    delay: 500,
                    onComplete: () => popupContainer.destroy()
                });
            }
        });
    }
    
    // Remove createNewParcel as parcels are now spawned on the field
    
    respawn() {
        // Reset position
        this.currentLane = 2;
        const newY = 300 + this.currentLane * this.laneHeight + this.laneHeight / 2;
        this.playerContainer.setPosition(400, newY);
        
        // Reset velocity to prevent stuck movement
        this.playerContainer.body.velocity.x = 0;
        this.playerContainer.body.velocity.y = 0;
        
        // Reset timer
        this.deliveryTimer = this.maxDeliveryTime;
        
        // Grace period
        this.setInvulnerable(1000);
    }
    
    collectPowerUp(powerUp) {
        // Check if it's an easter egg
        if (powerUp.easterEgg) {
            const egg = powerUp.easterEgg;
            this.totalPoints += egg.points;
            this.pointsText.setText(`Points: ${this.totalPoints}`);
            this.showPointsPopup(egg.points, powerUp.x, powerUp.y);
            
            // Show easter egg message
            const eggText = this.add.text(512, 150, `${egg.emoji} ${egg.name}!`, {
                fontSize: '36px',
                color: '#FFD700',
                fontFamily: 'Impact',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setScrollFactor(0);
            
            this.tweens.add({
                targets: eggText,
                scale: 2,
                alpha: 0,
                duration: 1500,
                onComplete: () => eggText.destroy()
            });
            
            // Apply easter egg effect
            this.applyEasterEggEffect(egg.effect);
            powerUp.destroy();
            AudioManager.getInstance().playSFX('pickup');
            return;
        }
        
        const type = powerUp.type;
        powerUp.destroy();
        
        switch(type) {
            case 'magnet':
                // Attract parcel effect
                if (!this.isCarrying && this.parcel) {
                    this.tweens.add({
                        targets: this.parcel,
                        x: this.playerContainer.x,
                        y: this.playerContainer.y - 30,
                        duration: 500,
                        onComplete: () => this.recoverParcel()
                    });
                }
                break;
                
            case 'slowmo':
                // Slow down time
                this.speedMultiplier *= 0.6;
                this.time.delayedCall(5000, () => {
                    this.speedMultiplier /= 0.6;
                });
                break;
                
            case 'jetpack':
                // Super jump boost
                this.setInvulnerable(1000);
                this.playerContainer.body.velocity.y = -300;
                
                // Reset Y velocity after jump
                this.time.delayedCall(500, () => {
                    this.playerContainer.body.velocity.y = 0;
                });
                break;
                
            case 'shield':
                // Longer invulnerability
                this.setInvulnerable(3000);
                break;
                
            case 'birthday':
                // Birthday power - clear all obstacles and gain speed!
                this.obstacles.clear(true, true);
                this.speedMultiplier *= 0.5;
                this.setInvulnerable(2000);
                
                // Birthday message
                const birthdayText = this.add.text(400, 250, 'BIRTHDAY POWER!', {
                    fontSize: '36px',
                    color: '#FFD700',
                    fontFamily: 'Impact',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setOrigin(0.5).setScrollFactor(0);
                
                this.tweens.add({
                    targets: birthdayText,
                    scale: 2,
                    alpha: 0,
                    duration: 1500,
                    onComplete: () => birthdayText.destroy()
                });
                break;
        }
        
        AudioManager.getInstance().playSFX('pickup');
    }
    
    applyEasterEggEffect(effect) {
        switch(effect) {
            case 'rainbow':
                // Rainbow trail effect
                for (let i = 0; i < 7; i++) {
                    this.time.delayedCall(i * 100, () => {
                        const rainbow = this.add.rectangle(
                            this.playerContainer.x - i * 20,
                            this.playerContainer.y,
                            15, 40,
                            Phaser.Display.Color.HSVToRGB(i / 7, 1, 1).color
                        );
                        this.tweens.add({
                            targets: rainbow,
                            alpha: 0,
                            duration: 1000,
                            onComplete: () => rainbow.destroy()
                        });
                    });
                }
                this.setInvulnerable(3000);
                break;
                
            case 'sparkle':
                // Create sparkles around player
                for (let i = 0; i < 10; i++) {
                    const sparkle = this.add.star(
                        this.playerContainer.x + Phaser.Math.Between(-50, 50),
                        this.playerContainer.y + Phaser.Math.Between(-50, 50),
                        4, 3, 6, 0xFFFFFF
                    );
                    this.tweens.add({
                        targets: sparkle,
                        scale: { from: 0, to: 1.5 },
                        alpha: { from: 1, to: 0 },
                        duration: 1000,
                        onComplete: () => sparkle.destroy()
                    });
                }
                break;
                
            case 'invincible':
                this.setInvulnerable(5000);
                break;
                
            case 'slowmo':
                this.speedMultiplier *= 0.5;
                this.time.delayedCall(5000, () => {
                    this.speedMultiplier /= 0.5;
                });
                break;
                
            case 'speed':
                this.slideSpeed *= 1.5;
                this.dashSpeed *= 1.5;
                this.time.delayedCall(5000, () => {
                    this.slideSpeed /= 1.5;
                    this.dashSpeed /= 1.5;
                });
                break;
        }
    }
    
    setInvulnerable(duration) {
        this.isInvulnerable = true;
        this.playerContainer.setAlpha(0.5);
        
        this.time.delayedCall(duration, () => {
            this.isInvulnerable = false;
            this.playerContainer.setAlpha(1);
        });
    }
    
    addMovementEffects() {
        // Add running bob effect
        if (!this.bobTween) {
            this.bobTween = this.tweens.add({
                targets: this.player,
                y: '-=3',
                duration: 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });
        }
    }
    
    removeMovementEffects() {
        // Remove running bob effect
        if (this.bobTween) {
            this.bobTween.stop();
            this.bobTween = null;
            this.player.y = 0;
        }
    }
    
    createDustParticles(x, y) {
        // Create dust effect when jumping
        for (let i = 0; i < 5; i++) {
            const dust = this.add.circle(
                x + Phaser.Math.Between(-20, 20),
                y + 20,
                Phaser.Math.Between(2, 4),
                0xCCCCCC,
                0.7
            );
            
            this.tweens.add({
                targets: dust,
                y: y + 30,
                x: x + Phaser.Math.Between(-30, 30),
                alpha: 0,
                scale: 0,
                duration: 400,
                delay: i * 30,
                onComplete: () => dust.destroy()
            });
        }
    }
    
    createDashTrail(direction) {
        // Create energy trail effect during dash
        for (let i = 0; i < 8; i++) {
            this.time.delayedCall(i * 20, () => {
                const trail = this.add.rectangle(
                    this.playerContainer.x - (i * 15 * direction),
                    this.playerContainer.y,
                    30 - i * 2,
                    40 - i * 3,
                    0xFFD700,
                    0.6 - i * 0.07
                );
                
                this.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scaleX: 0,
                    duration: 300,
                    onComplete: () => trail.destroy()
                });
            });
        }
    }
    
    updateObstacles() {
        this.obstacles.children.entries.forEach(obstacle => {
            // Wobble effect for cones
            if (obstacle.wobble) {
                obstacle.y = obstacle.y + Math.sin(this.time.now * 0.005) * 2;
            }
            
            // Bird/drone hovering effect
            if (obstacle.isDrone) {
                obstacle.y = obstacle.y + Math.sin(this.time.now * 0.003) * 1.5;
            }
            
            // Remove if off screen
            if (obstacle.x > 1100) {
                obstacle.destroy();
            }
        });
    }
    
    showBirthdaySurprise() {
        this.gameOver = true;
        
        // Stop all physics
        this.physics.pause();
        
        // Save to leaderboard
        this.saveToLeaderboard();
        
        // Birthday celebration - enhanced for Wyn's 9th!
        const surpriseBg = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.9)
            .setScrollFactor(0);
        
        // Giant animated 9 in the background
        const bigNine = this.add.text(512, 384, '9', {
            fontSize: '400px',
            color: '#FFD700',
            fontFamily: 'Impact',
            alpha: 0.1
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Pulse the big 9
        this.tweens.add({
            targets: bigNine,
            alpha: { from: 0.1, to: 0.3 },
            scale: { from: 1, to: 1.1 },
            duration: 2000,
            repeat: -1,
            yoyo: true
        });
        
        // Animated cake with 9 candles!
        const cakeContainer = this.add.container(512, 250).setScrollFactor(0);
        const cake = this.add.text(0, 0, '🎂', {
            fontSize: '128px'
        }).setOrigin(0.5);
        cakeContainer.add(cake);
        
        // Add 9 candles around the cake
        for (let i = 0; i < 9; i++) {
            const angle = (i / 9) * Math.PI * 2;
            const candleX = Math.cos(angle) * 80;
            const candleY = Math.sin(angle) * 40 - 20;
            const candle = this.add.text(candleX, candleY, '🕯️', {
                fontSize: '24px'
            }).setOrigin(0.5);
            cakeContainer.add(candle);
            
            // Flicker the candles
            this.tweens.add({
                targets: candle,
                alpha: { from: 0.7, to: 1 },
                duration: 200 + i * 50,
                repeat: -1,
                yoyo: true
            });
        }
        
        // Animate the cake
        this.tweens.add({
            targets: cakeContainer,
            scale: { from: 0, to: 1 },
            rotation: { from: -0.1, to: 0.1 },
            duration: 800,
            ease: 'Bounce.Out',
            yoyo: true,
            repeat: -1,
            repeatDelay: 2000
        });
        
        // Special birthday message
        const message = this.add.text(512, 450, 
            '🎉 HAPPY 9TH BIRTHDAY WYN! 🎉\n\n' +
            `You delivered all 9 SHAKE SHAKES!\n` +
            `Final Score: ${this.totalPoints} points\n` +
            'You\'re the BUFFEST 9-year-old champion!\n\n' +
            'Press ENTER to see the leaderboard!',
            {
                fontSize: '28px',
                color: '#FFD700',
                fontFamily: 'Impact',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4,
                lineSpacing: 10
            }
        ).setOrigin(0.5).setScrollFactor(0);
        
        // Animate the message
        this.tweens.add({
            targets: message,
            scale: { from: 0.9, to: 1 },
            duration: 1000,
            repeat: -1,
            yoyo: true
        });
        
        // Extra special confetti effect with 90 pieces (9 x 10) plus floating 9s
        for (let i = 0; i < 90; i++) {
            const confetti = this.add.rectangle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(-100, 0),
                12, 24,
                Phaser.Utils.Array.GetRandom([0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFD700])
            ).setScrollFactor(0);
            
            this.tweens.add({
                targets: confetti,
                y: 700,
                x: `+=${Phaser.Math.Between(-150, 150)}`,
                angle: 720,
                duration: Phaser.Math.Between(3000, 5000),
                repeat: -1
            });
        }
        
        // Add floating 9s and shake bottles
        for (let i = 0; i < 9; i++) {
            const floatingNine = this.add.text(
                Phaser.Math.Between(100, 700),
                Phaser.Math.Between(100, 500),
                i % 2 === 0 ? '9' : '🥤',
                {
                    fontSize: `${Phaser.Math.Between(32, 64)}px`,
                    color: '#FFD700',
                    fontFamily: 'Impact',
                    alpha: 0
                }
            ).setScrollFactor(0);
            
            this.tweens.add({
                targets: floatingNine,
                alpha: { from: 0, to: 0.8 },
                y: '-=80',
                x: `+=${Phaser.Math.Between(-30, 30)}`,
                rotation: { from: -0.2, to: 0.2 },
                duration: 2000,
                delay: i * 200,
                ease: 'Sine.InOut',
                yoyo: true,
                repeat: -1
            });
        }
        
        // Play special birthday music/sound
        AudioManager.getInstance().playSFX('pickup');
        
        // Return to menu with rewards
        this.input.keyboard.once('keydown-ENTER', () => {
            // Save birthday achievement
            const gameState = this.scene.get(SceneKeys.GAME)?.gameStateManager;
            if (gameState) {
                gameState.unlockAchievement('birthday_champion');
                gameState.saveProgress('birthdayMinigame', 9, 9);
            }
            
            AudioManager.getInstance().stopMusic(AudioAssets.BIRTHDAY_SONG);
            this.scene.start(SceneKeys.MAIN_MENU);
        });
    }
    
    endGame() {
        this.gameOver = true;
        this.physics.pause();
        
        // Save to leaderboard
        this.saveToLeaderboard();
        
        const gameOverBg = this.add.rectangle(512, 384, 700, 600, 0x000000, 0.9)
            .setScrollFactor(0);
        gameOverBg.setStrokeStyle(4, 0xFF0000);
        
        const gameOverText = this.add.text(512, 150, 'DELIVERY FAILED!', {
            fontSize: '48px',
            color: '#FF0000',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);
        
        const finalScore = this.add.text(512, 220, `Deliveries: ${this.score}/9`, {
            fontSize: '32px',
            color: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setScrollFactor(0);
        
        const finalPoints = this.add.text(512, 260, `Total Points: ${this.totalPoints}`, {
            fontSize: '28px',
            color: '#FFD700',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Check for new high score
        let isNewHighScore = false;
        if (this.totalPoints > this.highScore) {
            isNewHighScore = true;
            this.highScore = this.totalPoints;
            localStorage.setItem('birthdayHighScore', this.highScore.toString());
            
            const newHighScore = this.add.text(512, 300, 'NEW HIGH SCORE!', {
                fontSize: '36px',
                color: '#00FF00',
                fontFamily: 'Impact',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setScrollFactor(0);
            
            this.tweens.add({
                targets: newHighScore,
                scale: 1.2,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
        
        // Show leaderboard
        this.showLeaderboard(isNewHighScore ? 350 : 320);
        
        const restartText = this.add.text(512, 660, 'Press ENTER to return', {
            fontSize: '24px',
            color: '#FFD700',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Pulse restart text
        this.tweens.add({
            targets: restartText,
            alpha: { from: 0.7, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        this.input.keyboard.once('keydown-ENTER', () => {
            AudioManager.getInstance().stopMusic(AudioAssets.BIRTHDAY_SONG);
            this.scene.start(SceneKeys.MAIN_MENU);
        });
    }
    
    loadLeaderboard() {
        const saved = localStorage.getItem('birthdayLeaderboard');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }
    
    saveToLeaderboard() {
        const entry = {
            score: this.totalPoints,
            deliveries: this.score,
            combo: this.combo,
            date: new Date().toLocaleDateString()
        };
        
        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10); // Keep top 10
        
        localStorage.setItem('birthdayLeaderboard', JSON.stringify(this.leaderboard));
    }
    
    showLeaderboard(startY) {
        const leaderboardTitle = this.add.text(512, startY, 'LEADERBOARD', {
            fontSize: '24px',
            color: '#FFD700',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Leaderboard background
        const lbBg = this.add.rectangle(512, startY + 130, 600, 250, 0x000000, 0.5);
        lbBg.setStrokeStyle(2, 0xFFD700).setScrollFactor(0);
        
        // Show top 5 entries
        const topEntries = this.leaderboard.slice(0, 5);
        topEntries.forEach((entry, index) => {
            const y = startY + 50 + (index * 35);
            const rank = index + 1;
            const color = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#FFFFFF';
            
            // Rank
            this.add.text(280, y, `${rank}.`, {
                fontSize: '20px',
                color: color,
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 2
            }).setScrollFactor(0);
            
            // Score
            this.add.text(320, y, `${entry.score} pts`, {
                fontSize: '20px',
                color: color,
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 2
            }).setScrollFactor(0);
            
            // Deliveries
            this.add.text(450, y, `${entry.deliveries}/9`, {
                fontSize: '18px',
                color: '#AAAAAA',
                fontFamily: 'Arial'
            }).setScrollFactor(0);
            
            // Date
            this.add.text(550, y, entry.date, {
                fontSize: '16px',
                color: '#888888',
                fontFamily: 'Arial'
            }).setScrollFactor(0);
        });
    }
}