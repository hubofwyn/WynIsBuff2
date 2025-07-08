import { Scene } from 'phaser';
import { SceneKeys } from '../constants/SceneKeys.js';
import { EventNames } from '../constants/EventNames.js';
import { UIConfig } from '../constants/UIConfig.js';
import { AudioAssets } from '../constants/Assets.js';
import { AudioManager, getLogger } from '@features/core';

/**
 * Birthday Minigame: "Wyn's 9th Birthday Shake Rush!"
 * Deliver exactly 9 special Shake Shakes for Wyn's birthday!
 */
export class BirthdayMinigame extends Scene {
    constructor() {
        super(SceneKeys.BIRTHDAY_MINIGAME);
        
        this.logger = getLogger('BirthdayMinigame');
        
        // Game config - simplified 3-lane system
        this.laneHeight = 120;
        this.numLanes = 3;
        this.runSpeed = 250; // Constant forward movement
        this.laneChangeSpeed = 200; // Quick lane changes
        this.baseScrollSpeed = 300;
        this.speedMultiplier = 1.0;
        
        // Player state - simplified
        this.currentLane = 1; // Middle lane (0, 1, 2)
        this.isChangingLanes = false;
        this.carriedItems = []; // Array to hold multiple items
        this.maxCarryCapacity = 5;
        this.carryIndicators = []; // Array of visual indicators
        this.playerX = 200; // Fixed X position on screen
        
        // Streak system
        this.deliveryStreak = 0;
        this.nearMissStreak = 0;
        
        // Game state - simplified scoring
        this.score = 0;
        this.deliveries = 0;
        this.lives = 3;
        this.gameOver = false;
        this.gameStarted = false; // Track if game has started
        this.speedLevel = 1;
        this.highScore = parseInt(localStorage.getItem('birthdayHighScore') || '0');
        
        // Timing windows
        this.perfectWindow = 2000; // 2 seconds for perfect delivery
        this.goodWindow = 5000; // 5 seconds for good delivery
        this.maxDeliveryTime = 10000; // 10 seconds max delivery time
        this.deliveryTimer = this.maxDeliveryTime;
        
        // Obstacle spawning
        this.baseObstacleSpeed = 200;
        
        // Additional game state
        this.totalPoints = 0;
        this.combo = 0;
        this.perfectDeliveries = 0;
        this.speedBonus = 1;
        this.pickupTime = 0;
        this.leaderboard = [];
        this.missStreak = 0;
        this.difficultyLevel = 1;
        
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

    /**
     * Phaser automatically invokes `init` every time a scene is started or
     * restarted.  Because Phaser *re-uses* the same scene instance (the
     * constructor only runs once), any flags that were mutated during a prior
     * round – for example `this.gameOver = true` – persist into the next
     * session.  That was the root cause of the “second play has no movement”
     * bug:  `this.gameOver` was still `true`, so the `update()` early-return
     * halted all gameplay.
     *
     * Here we reset every runtime flag and transient collection that needs to
     * start fresh each run.  Only long-term data (high-score, leaderboard)
     * survives across rounds.
     */
    init() {
        // Core run-state flags
        this.gameOver = false;
        this.gameStarted = false;

        // Player state
        this.currentLane = 1;
        this.isChangingLanes = false;
        this.carriedItems = [];

        // Scoring
        this.score = 0;
        this.totalPoints = 0;
        this.deliveries = 0;
        this.combo = 0;
        this.perfectDeliveries = 0;
        this.speedBonus = 1;
        this.missStreak = 0;

        // Lives
        this.lives = 3;

        // Difficulty / pacing
        this.speedMultiplier = 1.0;
        this.speedLevel = 1;
        this.difficultyLevel = 1;

        // Timers
        this.deliveryTimer = this.maxDeliveryTime;

        // Groups & containers – will be (re)created in `create`
        this.scrollingObjects = null;
        this.obstacles = null;

        // Make sure physics world is active if it had been paused in a
        // previous round (Phaser keeps the same Physics.World instance when
        // a scene restarts).
        if (this.physics && this.physics.world && this.physics.world.isPaused) {
            this.physics.resume();
        }
    }
    
    create() {
        // Clear lingering keyboard listeners from prior rounds (they can
        // accumulate when the scene is restarted).
        if (this.input && this.input.keyboard) {
            this.input.keyboard.removeAllListeners();
        }

        // Ensure camera is properly reset and faded in
        this.cameras.main.fadeIn(300);
        
        // Initialize audio manager if needed
        const audioManager = AudioManager.getInstance();
        this.logger.debug('AudioManager initialized:', audioManager);
        
        // Set world bounds to match screen
        this.physics.world.setBounds(0, 0, 1024, 768);
        
        // Create gradient background
        this.createBackground();
        
        // Create lanes
        this.createLanes();
        
        // Create player
        this.createPlayer();
        
        // Initialize game state
        this.speedLevel = 1;
        this.speedMultiplier = 1.0;
        
        // Create delivery zone
        this.createDeliveryZone();
        
        // Create object groups
        this.obstacles = this.physics.add.group();
        this.scrollingObjects = this.physics.add.group();
        
        // Fixed camera - no scrolling, show entire play area
        this.cameras.main.setBackgroundColor('#2C3E50');
        this.cameras.main.setBounds(0, 0, 1024, 768);
        this.cameras.main.setZoom(1);
        
        // Full directional input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Dash cooldown
        this.canDash = true;
        this.dashCooldown = 3000; // 3 seconds
        this.dashSpeed = 500;
        
        // Create UI
        this.createUI();
        
        // Start spawning obstacles
        this.startObstacleSpawning();
        
        // Set up collisions
        this.setupCollisions();
        
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
        // 3-lane highway design
        const laneGraphics = this.add.graphics();
        const startY = 350;
        
        // Road background
        laneGraphics.fillStyle(0x333333, 1);
        laneGraphics.fillRect(0, startY, 1024, this.laneHeight * 3);
        
        // Lane dividers (dashed lines)
        laneGraphics.lineStyle(4, 0xFFFFFF, 0.8);
        for (let i = 1; i < this.numLanes; i++) {
            const y = startY + i * this.laneHeight;
            // Dashed line effect
            for (let x = 0; x < 1024; x += 40) {
                laneGraphics.moveTo(x, y);
                laneGraphics.lineTo(x + 20, y);
            }
        }
        
        // Road edges
        laneGraphics.lineStyle(6, 0xFFD700, 1);
        laneGraphics.moveTo(0, startY);
        laneGraphics.lineTo(1024, startY);
        laneGraphics.moveTo(0, startY + this.laneHeight * 3);
        laneGraphics.lineTo(1024, startY + this.laneHeight * 3);
        
        // Store lane positions for reference
        this.lanePositions = [];
        for (let i = 0; i < this.numLanes; i++) {
            this.lanePositions[i] = startY + i * this.laneHeight + this.laneHeight / 2;
        }
        
        this.logger.debug('Lane positions:', this.lanePositions);
    }
    
    createPlayer() {
        // Fixed position player
        const startY = this.lanePositions[this.currentLane];
        
        // Use the correct Wyn sprite key
        const wynTexture = 'wynSprite';
        
        if (this.textures.exists(wynTexture)) {
            this.player = this.add.sprite(0, 0, wynTexture);
            this.player.setScale(0.25);
        } else {
            // Fallback: create a simple Wyn representation
            this.logger.warn('wynSprite texture not found, using fallback');
            this.player = this.add.rectangle(0, 0, 40, 50, 0xFFD700);
        }
        
        // Create player container at fixed X position
        this.playerContainer = this.add.container(this.playerX, startY);
        this.playerContainer.add(this.player);
        
        // Add shadow for depth
        const shadow = this.add.ellipse(0, 25, 30, 10, 0x000000, 0.3);
        this.playerContainer.addAt(shadow, 0);
        
        // Ensure player container is properly initialized
        this.playerContainer.setDepth(100);
        
        // Running animation
        this.tweens.add({
            targets: this.player,
            scaleY: this.player.scaleY * 0.9,
            y: '-=5',
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
        
        // Removed collision indicator - was causing visual issues
    }
    
    spawnProteinShake() {
        // Regular protein shake - worth 100 points
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = this.lanePositions[lane];
        const x = 1100;
        
        const shakeContainer = this.add.container(x, y);
        
        // Background circle for visibility
        const bgCircle = this.add.circle(0, 0, 35, 0x000000, 0.5);
        bgCircle.setStrokeStyle(2, 0x00FF00);
        
        // Simple protein shake visual
        const shake = this.add.text(0, 0, '🥤', {
            fontSize: '36px'
        }).setOrigin(0.5);
        
        // Green glow
        const glow = this.add.circle(0, 0, 38, 0x00FF00, 0.3);
        
        // Add pickup hint
        const pickupHint = this.add.text(0, 28, '100 pts', {
            fontSize: '12px',
            color: '#00FF00',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        shakeContainer.add([glow, bgCircle, shake, pickupHint]);
        
        // Track data using Phaser's data manager
        shakeContainer.setData('isParcel', true);
        shakeContainer.setData('itemType', 'protein');
        shakeContainer.setData('points', 100);
        shakeContainer.setData('lane', lane);
        shakeContainer.setData('spawnTime', this.time.now);
        
        this.scrollingObjects.add(shakeContainer);
        
        // Simple entrance
        shakeContainer.setScale(0);
        this.tweens.add({
            targets: shakeContainer,
            scale: 1,
            duration: 200,
            ease: 'Back.Out'
        });
        
        // Pulse effect
        this.tweens.add({
            targets: glow,
            alpha: { from: 0.3, to: 0.6 },
            scale: { from: 1, to: 1.1 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });
        
        shakeContainer.pickupZoneX = (this.playerContainer?.x ?? this.playerX) + 50;
        
        this.logger.debug('[Spawn] Protein shake in lane', lane, 'at y:', y, 'isParcel:', shakeContainer.getData('isParcel'));
    }
    
    spawnShakeShake() {
        // Special S² Shake - elaborate sundae, worth 500 points
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = this.lanePositions[lane];
        const x = 1100;
        
        const shakeContainer = this.add.container(x, y);
        
        // Background circle for emphasis
        const bgCircle = this.add.circle(0, 0, 40, 0x000000, 0.7);
        bgCircle.setStrokeStyle(3, 0xFFD700);
        
        // Ice cream sundae visual
        const sundae = this.add.text(0, 0, '🍨', {
            fontSize: '42px'
        }).setOrigin(0.5);
        
        // S² label
        const labelBg = this.add.rectangle(0, -40, 60, 25, 0x000000, 0.9);
        labelBg.setStrokeStyle(2, 0xFFD700);
        
        const label = this.add.text(0, -40, 'S²', {
            fontSize: '20px',
            color: '#FFD700',
            fontFamily: 'Arial Black',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Golden glow effect
        const glow = this.add.circle(0, 0, 45, 0xFFD700, 0.4);
        
        // Special indicator
        const special = this.add.text(0, 35, '★ SPECIAL ★', {
            fontSize: '12px',
            color: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        shakeContainer.add([glow, bgCircle, sundae, labelBg, label, special]);
        
        // Track data using Phaser's data manager
        shakeContainer.setData('isParcel', true);
        shakeContainer.setData('itemType', 'shakeshake');
        shakeContainer.setData('points', 500);
        shakeContainer.setData('lane', lane);
        shakeContainer.setData('spawnTime', this.time.now);
        this.scrollingObjects.add(shakeContainer);
        
        // Grand entrance
        shakeContainer.setScale(0);
        this.tweens.add({
            targets: shakeContainer,
            scale: 1,
            duration: 400,
            ease: 'Back.Out'
        });
        
        // Sparkle effect
        this.tweens.add({
            targets: [glow, special],
            alpha: { from: 0.4, to: 0.9 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });
        
        shakeContainer.pickupZoneX = (this.playerContainer?.x ?? this.playerX) + 50;
    }
    
    spawnDynamite() {
        // Dynamite - collectible weapon for cakes
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = this.lanePositions[lane];
        const x = 1100;
        
        const dynamiteContainer = this.add.container(x, y);
        
        // Dynamite visual
        const dynamite = this.add.text(0, 0, '🧨', {
            fontSize: '38px'
        }).setOrigin(0.5);
        
        // Red danger glow
        const glow = this.add.circle(0, 0, 35, 0xFF0000, 0.3);
        
        // Weapon indicator
        const weaponText = this.add.text(0, 30, 'WEAPON', {
            fontSize: '10px',
            color: '#FF0000',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        dynamiteContainer.add([glow, dynamite, weaponText]);
        
        // Track data using Phaser's data manager
        dynamiteContainer.setData('isParcel', true);
        dynamiteContainer.setData('itemType', 'dynamite');
        dynamiteContainer.setData('points', 0); // No points, it's a weapon
        dynamiteContainer.setData('lane', lane);
        dynamiteContainer.setData('spawnTime', this.time.now);
        this.scrollingObjects.add(dynamiteContainer);
        
        // Entrance with shake
        dynamiteContainer.setScale(0);
        this.tweens.add({
            targets: dynamiteContainer,
            scale: 1,
            duration: 300,
            ease: 'Back.Out'
        });
        
        // Pulse danger effect
        this.tweens.add({
            targets: glow,
            alpha: { from: 0.3, to: 0.6 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        dynamiteContainer.pickupZoneX = (this.playerContainer?.x ?? this.playerX) + 50;
    }
    
    spawnCake() {
        // Birthday cake - obstacle that can be blown up with dynamite
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = this.lanePositions[lane];
        const x = 1100;
        
        const cakeContainer = this.add.container(x, y);
        
        // Cake visual
        const cake = this.add.text(0, 0, '🎂', {
            fontSize: '40px'
        }).setOrigin(0.5);
        
        // Bonus points indicator
        const bonusText = this.add.text(0, -35, '💥 = +250', {
            fontSize: '14px',
            color: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        cakeContainer.add([cake, bonusText]);
        
        // Track data using Phaser's data manager
        cakeContainer.setData('isObstacle', true);
        cakeContainer.setData('isCake', true);
        cakeContainer.setData('bonusPoints', 250);
        cakeContainer.setData('lane', lane);
        this.scrollingObjects.add(cakeContainer);
        
        // Wobble animation
        this.tweens.add({
            targets: cake,
            angle: { from: -5, to: 5 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
    }
    
    spawnParcel() {
        // Backwards compatibility - just spawn a random item
        const roll = Phaser.Math.Between(0, 100);
        if (roll < 10) {
            this.spawnShakeShake();
        } else if (roll < 25) {
            this.spawnDynamite();
        } else {
            this.spawnProteinShake();
        }
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
        // Clean, minimal UI
        const uiPanel = this.add.graphics();
        uiPanel.fillStyle(0x000000, 0.8);
        uiPanel.fillRoundedRect(10, 10, 300, 120, 10);
        
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
        this.add.text(512, 740, '↑/↓ or W/S: Change Lanes', {
            fontSize: '18px',
            color: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
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
            const heart = this.add.text(60 + i * 25, 0, i < this.lives ? '❤️' : '💔', {
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
            'Deliver 9 Shakes (Protein or S²) for Wyn\'s Birthday!',
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
        const rulesTitle = this.add.text(centerX, centerY + 80, 'RULES', {
            fontSize: '28px',
            color: '#FFFFFF',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0);
        instructionElements.push(rulesTitle);
        
        const rules = [
            '🥤 Protein Shakes = 100 points',
            '✨ S² Shakes (Special) = 500 points!',
            '🧨 Dynamite + 🎂 Cake = Bonus points!',
            '💩 Poop = Lose a Life + Fart Sound!',
            '❤️ 3 Lives - Lose on hit or missed delivery',
            '⚡ Combo System: Chain deliveries!'
        ];
        
        rules.forEach((rule, i) => {
            const ruleText = this.add.text(centerX, centerY + 115 + (i * 25), rule, {
                fontSize: '18px',
                color: '#FFFFFF',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setScrollFactor(0);
            instructionElements.push(ruleText);
        });
        
        // Start button
        const startButton = this.add.rectangle(centerX, centerY + 240, 250, 60, 0x00FF00)
            .setStrokeStyle(4, 0xFFFFFF)
            .setScrollFactor(0);
        instructionElements.push(startButton);
            
        const startText = this.add.text(centerX, centerY + 240, 'PRESS SPACE TO START!', {
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
        // Mark game as started
        this.gameStarted = true;
        
        // Start music after user interaction
        try {
            const audioManager = AudioManager.getInstance();
            
            // Resume Web Audio context if suspended (browser autoplay policy)
            if (this.sound.context && this.sound.context.state === 'suspended') {
                this.sound.context.resume().then(() => {
                    this.logger.debug('Audio context resumed');
                });
            }
            
            // Also try to unlock Howler audio
            if (window.Howler && window.Howler.ctx && window.Howler.ctx.state === 'suspended') {
                window.Howler.ctx.resume().then(() => {
                    this.logger.debug('Howler context resumed');
                });
            }
            
            // Stop any currently playing music first
            audioManager.stopMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);
            audioManager.stopMusic(AudioAssets.HYPER_BUFF_BLITZ);
            audioManager.stopMusic(AudioAssets.BIRTHDAY_SONG);
            
            // Small delay to ensure audio context is ready
            this.time.delayedCall(100, () => {
                audioManager.playMusic(AudioAssets.BIRTHDAY_SONG);
                this.logger.info('Birthday music started');
                
                // Check if music is actually playing
                const musicTrack = audioManager.music[AudioAssets.BIRTHDAY_SONG];
                if (musicTrack && !musicTrack.playing()) {
                    this.logger.warn('Music failed to start - showing audio hint');
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
            this.logger.error('Failed to start music:', error);
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
                        this.timerText.setText('Time Out! -1 ❤️');
                        this.timerText.setColor('#FF0000');
                        this.time.delayedCall(1000, () => {
                            this.timerText.setText('Find S² Shake!');
                            this.timerText.setColor('#00FF00');
                        });
                    }
                }
            },
            loop: true
        });
    }
    
    startObstacleSpawning() {
        // Rhythmic spawning handled in update loop
        this.lastSpawnTime = 0;
    }
    
    spawnObstacle(type) {
        if (this.gameOver) return;
        
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = this.lanePositions[lane];
        
        // Spawn from right side, scrolling left (consistent with parcels)
        const x = 1100;
        
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
        
        // Add to scrolling objects for movement
        obstacleContainer.setData('isObstacle', true);
        obstacleContainer.setData('lane', lane);
        if (obstacleContainer.isPoop) obstacleContainer.setData('isPoop', true);
        if (obstacleContainer.isDrone) obstacleContainer.setData('isDrone', true);
        if (obstacleContainer.wobble) obstacleContainer.setData('wobble', true);
        this.scrollingObjects.add(obstacleContainer);
        
        // Setup for wobble effect if needed
        if (obstacleContainer.wobble) {
            this.tweens.add({
                targets: obstacleContainer,
                y: obstacleContainer.y + 10,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });
        }
    }
    
    // Removed complex powerups - focusing on core gameplay
    
    // Removed birthday powerup - keeping game simple
    
    // Removed easter eggs - focusing on core mechanics
    
    setupCollisions() {
        // Simplified collision system handled in update loop
    }
    
    update(time, delta) {
        if (this.gameOver || !this.gameStarted) return;
        
        // Handle input
        this.handleInput();
        
        // Scroll all objects
        this.updateScrolling(delta);
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
        
        // Spawn rhythm
        this.updateSpawning();
        
    }
    
    updateScrolling(delta) {
        if (!this.scrollingObjects) return;
        
        // `delta` is provided in **milliseconds**.  Our `baseScrollSpeed` is
        // expressed in **pixels per second**, so we have to convert the frame
        // delta to seconds before applying it.  Using the magic number 16.67
        // (the ms of a 60 fps frame) accidentally scaled the speed ~60×,
        // causing objects to zip across the screen in just a few frames and
        // appear to be invisible.  We convert properly by dividing by 1000.

        const scrollSpeed = this.baseScrollSpeed * this.speedMultiplier * (delta / 1000);
        
        this.scrollingObjects.children.entries.forEach(obj => {
            if (obj && obj.active) {
                obj.x -= scrollSpeed;
                
                // Ensure visibility
                if (obj.visible === false) {
                    obj.setVisible(true);
                }
                
                // Remove if off screen
                if (obj.x < -100) {
                    // Check if it was a parcel that wasn't picked up
                    // NOTE: we now rely exclusively on Phaser's data manager
                    // for runtime flags to avoid property-access mismatches
                    // (`setData` / `getData`).  Direct property access broke
                    // after objects were wrapped in Phaser containers, which
                    // is the root cause of the missing pickup / miss logic.
                    // Due to the possibility of this object having been
                    // destroyed mid-frame we guard against the method being
                    // undefined.
                    const isParcel = typeof obj.getData === 'function' ? obj.getData('isParcel') : false;
                    const wasPickedUp = typeof obj.getData === 'function' ? obj.getData('pickedUp') : false;

                    if (isParcel && !wasPickedUp) {
                        this.missParcel();
                    }
                    this.scrollingObjects.remove(obj);
                    obj.destroy();
                }
            }
        });
    }
    
    checkCollisions() {
        if (!this.scrollingObjects || !this.playerContainer) {
            return;
        }
        
        const playerLane = this.currentLane;
        const playerY = this.lanePositions[playerLane];
        const collisionX = this.playerContainer.x;
        const collisionThreshold = 60; // Increased threshold
        
        // Debug player position occasionally
        if (Math.random() < 0.01) {
            this.logger.trace('[Player] Lane:', playerLane, 'Y:', playerY, 'X:', collisionX, 'Objects:', this.scrollingObjects.children.entries.length);
        }
        
        this.scrollingObjects.children.entries.forEach(container => {
            if (container && container.active) {
                const distance = Math.abs(container.x - collisionX);
                
                const isParcel = container.getData('isParcel');
                const itemType = container.getData('itemType');
                const pickedUp = container.getData('pickedUp');
                
                if (distance < collisionThreshold) {
                    // Check Y position match (lanes)
                    const yDistance = Math.abs(container.y - playerY);
                    const laneMatch = yDistance < 20; // Allow some Y tolerance
                    
                    if (laneMatch) {
                        if (isParcel && this.carriedItems.length < this.maxCarryCapacity && !pickedUp) {
                            this.logger.debug('[Pickup!] Type:', itemType, 'distance:', distance);
                            container.setData('pickedUp', true);
                            this.pickupParcel(container);
                        } else if (container.getData('isObstacle') && !container.getData('hit')) {
                            // Check if it's a cake and we have dynamite
                            const hasDynamite = this.carriedItems.some(item => item.type === 'dynamite');
                            if (container.getData('isCake') && hasDynamite) {
                                container.setData('hit', true);
                                this.blowUpCake(container);
                            } else {
                                container.setData('hit', true);
                                this.hitObstacle(container);
                            }
                        }
                    } else if (Math.abs(container.x - collisionX) < 30) {
                        // Near miss!
                        if (container.getData('isObstacle') && !container.getData('nearMissed')) {
                            container.setData('nearMissed', true);
                            this.registerNearMiss();
                        }
                    }
                }
            }
        });
        
        // Check delivery zone  
        if (this.carriedItems.length > 0 && this.playerContainer.x > 900) {
            this.makeDelivery();
        }
    }
    
    updateUI() {
        // Simplified UI updates
        this.scoreText.setText(`Deliveries: ${this.deliveries}/9`);
        this.pointsText.setText(`Score: ${this.score}`);
        
        if (this.deliveryStreak > 2) {
            this.comboText.setText(`${this.deliveryStreak}x Streak!`);
            this.comboText.setColor('#FFD700');
        } else {
            this.comboText.setText('');
        }
        
        // Update lives display
        this.updateLivesDisplay();
    }
    
    updateSpawning() {
        // Progressive difficulty spawning
        const now = this.time.now;
        if (!this.lastSpawnTime) {
            this.lastSpawnTime = now;
            this.logger.info('[Spawning] Started spawning system');
        }
        
        // Start slow, speed up over time
        const baseInterval = 3000; // 3 seconds initially
        const minInterval = 1200; // 1.2 seconds at max speed
        const timeElapsed = now / 1000; // Convert to seconds
        const speedupFactor = Math.min(timeElapsed / 60, 1); // Max speed after 60 seconds
        const spawnInterval = baseInterval - (baseInterval - minInterval) * speedupFactor;
        
        if (now - this.lastSpawnTime > spawnInterval) {
            this.lastSpawnTime = now;
            
            // Progressive spawn patterns
            const pattern = Phaser.Math.Between(0, 100);
            
            if (this.deliveries < 3) {
                // Early game - mostly protein shakes, some obstacles
                if (pattern < 20) {
                    this.logger.trace('[Spawn] Obstacle type:', Phaser.Math.Between(0, 2));
                    this.spawnObstacle(Phaser.Math.Between(0, 2)); // No cakes yet
                } else if (pattern < 80) {
                    this.logger.trace('[Spawn] Attempting protein shake spawn');
                    this.spawnProteinShake();
                }
            } else if (this.deliveries < 6) {
                // Mid game - introduce cakes and dynamite
                if (pattern < 15) {
                    this.spawnCake(); // Birthday cakes!
                } else if (pattern < 30) {
                    this.spawnObstacle(Phaser.Math.Between(0, 2));
                } else if (pattern < 45) {
                    this.spawnDynamite();
                } else if (pattern < 55) {
                    this.spawnShakeShake(); // Rare S² shakes
                } else if (pattern < 90) {
                    this.spawnProteinShake();
                }
            } else {
                // Late game - more cakes, more chaos
                if (pattern < 20) {
                    this.spawnCake();
                } else if (pattern < 35) {
                    this.spawnObstacle(Phaser.Math.Between(0, 2));
                } else if (pattern < 45) {
                    this.spawnDynamite();
                } else if (pattern < 60) {
                    this.spawnShakeShake();
                } else if (pattern < 95) {
                    this.spawnProteinShake();
                }
            }
            
            // Increase speed level gradually
            if (this.deliveries > 0 && this.deliveries % 3 === 0) {
                this.speedLevel = Math.min(this.speedLevel + 1, 5);
                this.speedMultiplier = 1 + (this.speedLevel - 1) * 0.2;
            }
        }
    }
    
    handleInput() {
        // Lane switching (up/down)
        if ((Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.W)) && !this.isChangingLanes) {
            this.changeLane(-1); // Move up
        } else if ((Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasd.S)) && !this.isChangingLanes) {
            this.changeLane(1); // Move down
        }
        
        // Horizontal movement (left/right)
        const moveSpeed = 5;
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            // Move left, but don't go off screen
            this.playerContainer.x = Math.max(50, this.playerContainer.x - moveSpeed);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            // Move right, but don't go past delivery zone
            this.playerContainer.x = Math.min(924, this.playerContainer.x + moveSpeed);
        }
        
        // Dash mechanic
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.canDash && !this.isChangingLanes) {
            this.performDash();
        }
    }
    
    performDash() {
        if (!this.canDash) return;
        
        this.canDash = false;
        
        // Visual dash effect
        const dashGhost = this.add.rectangle(
            this.playerContainer.x, 
            this.playerContainer.y, 
            40, 50, 
            0xFFD700, 0.5
        );
        
        // Dash forward
        this.tweens.add({
            targets: this.playerContainer,
            x: Math.min(924, this.playerContainer.x + 200),
            duration: 300,
            ease: 'Power3.Out'
        });
        
        // Fade out ghost
        this.tweens.add({
            targets: dashGhost,
            alpha: 0,
            scaleX: 2,
            duration: 500,
            onComplete: () => dashGhost.destroy()
        });
        
        // Dash particles
        for (let i = 0; i < 5; i++) {
            const particle = this.add.circle(
                this.playerContainer.x - i * 20,
                this.playerContainer.y,
                3,
                0xFFFFFF
            );
            
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: particle.x - 50,
                duration: 500,
                delay: i * 50,
                onComplete: () => particle.destroy()
            });
        }
        
        // Cooldown timer
        this.time.delayedCall(this.dashCooldown, () => {
            this.canDash = true;
            // Visual indicator that dash is ready
            this.tweens.add({
                targets: this.playerContainer,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Power1'
            });
        });
    }
    
    changeLane(direction) {
        const newLane = this.currentLane + direction;
        
        // Check bounds
        if (newLane >= 0 && newLane < this.numLanes) {
            this.isChangingLanes = true;
            this.currentLane = newLane;
            
            const newY = this.lanePositions[this.currentLane];
            
            // Quick snappy lane change
            this.tweens.add({
                targets: this.playerContainer,
                y: newY,
                duration: this.laneChangeSpeed,
                ease: 'Power2.Out',
                onComplete: () => {
                    this.isChangingLanes = false;
                }
            });
            
            // Tilt effect
            this.tweens.add({
                targets: this.player,
                angle: direction * -15,
                duration: 100,
                yoyo: true,
                ease: 'Sine.InOut'
            });
            
            AudioManager.getInstance().playSFX('click');
        }
    }
    
    // Removed dash function - simplifying gameplay
    
    blowUpCake(cake) {
        // Use dynamite on cake for bonus points!
        // Remove one dynamite from inventory
        const dynamiteIndex = this.carriedItems.findIndex(item => item.type === 'dynamite');
        if (dynamiteIndex !== -1) {
            this.carriedItems.splice(dynamiteIndex, 1);
            this.updateCarryIndicators();
        }
        
        // Explosion effect
        const explosion = this.add.text(cake.x, cake.y, '💥', {
            fontSize: '64px'
        }).setOrigin(0.5);
        
        // Points popup
        const bonusPoints = cake.getData('bonusPoints');
        const pointsText = this.add.text(cake.x, cake.y - 40, `+${bonusPoints}!`, {
            fontSize: '32px',
            color: '#FFD700',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Add points
        this.totalPoints += bonusPoints;
        this.score = this.totalPoints;
        this.updateUI();
        
        // Animate explosion
        this.tweens.add({
            targets: explosion,
            scale: { from: 0, to: 2 },
            alpha: { from: 1, to: 0 },
            duration: 500,
            onComplete: () => explosion.destroy()
        });
        
        this.tweens.add({
            targets: pointsText,
            y: '-=60',
            alpha: { from: 1, to: 0 },
            duration: 800,
            onComplete: () => pointsText.destroy()
        });
        
        // Remove cake
        this.scrollingObjects.remove(cake);
        cake.destroy();
        
        // Sound effect
        AudioManager.getInstance().playSFX('pickup');
        
        // Screen shake for impact
        this.cameras.main.shake(200, 0.02);
        
        // Combo for cake destruction!
        this.combo++;
        this.updateComboDisplay();
    }
    
    hitObstacle(obstacle) {
        this.dropParcel();
        
        // Check if it's a poop obstacle
        if (obstacle.getData('isPoop')) {
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
        // Add to carried items
        this.carriedItems.push({
            type: parcel.getData('itemType'),
            points: parcel.getData('points'),
            pickupTime: this.time.now
        });
        
        // Destroy the parcel
        parcel.destroy();
        
        // Update visual indicators
        this.updateCarryIndicators();
        
        // Satisfying pickup feedback
        this.cameras.main.flash(100, 255, 255, 0, true);
        AudioManager.getInstance().playSFX('pickup');
        
        // Show pickup message
        const messages = [
            'Nice!', 'Got it!', 'Sweet!', 'Awesome!', 'Great!'
        ];
        const message = this.carriedItems.length === this.maxCarryCapacity ? 'MAX LOAD!' : messages[Math.floor(Math.random() * messages.length)];
        
        const pickupText = this.add.text(this.playerContainer.x, this.playerContainer.y - 80, message, {
            fontSize: '24px',
            color: this.carriedItems.length === this.maxCarryCapacity ? '#FFD700' : '#00FF00',
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
    
    updateCarryIndicators() {
        // Clear existing indicators
        this.carryIndicators.forEach(indicator => indicator.destroy());
        this.carryIndicators = [];
        
        // Create indicators for each carried item
        this.carriedItems.forEach((item, index) => {
            const yOffset = -40 - (index * 25);
            const xOffset = (index - (this.carriedItems.length - 1) / 2) * 30;
            
            const indicatorContainer = this.add.container(xOffset, yOffset);
            
            // Background glow
            let glowColor = 0x00FF00; // Default green for protein
            if (item.type === 'shakeshake') {
                glowColor = 0xFFD700; // Gold for S²
            } else if (item.type === 'dynamite') {
                glowColor = 0xFF0000; // Red for dynamite
            }
            
            const glow = this.add.circle(0, 0, 15, glowColor, 0.5);
            indicatorContainer.add(glow);
            
            // Show appropriate icon
            let indicatorText = '';
            let fontSize = '20px';
            if (item.type === 'shakeshake') {
                indicatorText = 'S²';
                fontSize = '14px';
            } else if (item.type === 'dynamite') {
                indicatorText = '🧨';
            } else {
                indicatorText = '🥤';
            }
            
            const indicator = this.add.text(0, 0, indicatorText, {
                fontSize: fontSize,
                fontFamily: item.type === 'shakeshake' ? 'Arial Black' : 'Arial',
                color: item.type === 'shakeshake' ? '#FFD700' : '#FFFFFF'
            }).setOrigin(0.5);
            indicatorContainer.add(indicator);
            
            // Pulse effect
            this.tweens.add({
                targets: glow,
                scale: { from: 1, to: 1.3 },
                alpha: { from: 0.5, to: 0.2 },
                duration: 500,
                yoyo: true,
                repeat: -1,
                delay: index * 100
            });
            
            this.playerContainer.add(indicatorContainer);
            this.carryIndicators.push(indicatorContainer);
        });
        
        // Update carry count display
        if (this.carriedItems.length > 0) {
            const countText = this.add.text(0, -20, `${this.carriedItems.length}/${this.maxCarryCapacity}`, {
                fontSize: '16px',
                color: '#FFFFFF',
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            
            const countContainer = this.add.container(0, 0);
            countContainer.add(countText);
            this.playerContainer.add(countContainer);
            this.carryIndicators.push(countContainer);
        }
    }
    
    dropParcel() {
        if (this.carriedItems.length === 0) return;
        
        // Drop all items
        this.carriedItems = [];
        
        // Clear indicators
        this.carryIndicators.forEach(indicator => indicator.destroy());
        this.carryIndicators = [];
        
        // Reset streaks
        this.deliveryStreak = 0;
        this.nearMissStreak = 0;
        
        // Lose a life
        this.lives--;
        this.updateLivesDisplay();
        
        if (this.lives <= 0) {
            this.endGame();
        }
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
        // Only deliver if carrying items
        if (this.carriedItems.length === 0) return;
        
        // Separate deliverable items from dynamite
        const deliverableItems = this.carriedItems.filter(item => item.type !== 'dynamite');
        const dynamiteItems = this.carriedItems.filter(item => item.type === 'dynamite');
        
        if (deliverableItems.length === 0 && dynamiteItems.length > 0) {
            // Only carrying dynamite - show hint
            const hintText = this.add.text(512, 300, 'Use dynamite on cakes! 💥🎂', {
                fontSize: '28px',
                color: '#FF0000',
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setScrollFactor(0);
            
            this.tweens.add({
                targets: hintText,
                y: '-=30',
                alpha: 0,
                duration: 1500,
                onComplete: () => hintText.destroy()
            });
            
            return;
        }
        
        // Deliver all deliverable items
        let totalPoints = 0;
        let totalBasePoints = 0;
        
        deliverableItems.forEach(item => {
            this.deliveries++;
            totalBasePoints += item.points;
        });
        
        this.scoreText.setText(`Deliveries: ${this.deliveries}/9`);
        
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
        const multiDeliveryBonus = deliverableItems.length > 1 ? (deliverableItems.length - 1) * 50 : 0;
        const timeBonus = Math.floor(timeLeft * 20); // 20 points per second left
        const comboBonus = Math.pow(this.combo, 1.5) * 50; // Exponential combo growth
        const perfectBonus = this.perfectDeliveries > 2 ? this.perfectDeliveries * 100 : 0;
        const speedBonusPoints = (speedBonusMultiplier - 1) * 50;
        const earnedPoints = Math.floor(totalBasePoints + multiDeliveryBonus + timeBonus + comboBonus + perfectBonus + speedBonusPoints);
        this.totalPoints += earnedPoints;
        
        // Update score
        this.score = this.totalPoints;
        
        // Update UI
        this.pointsText.setText(`Points: ${this.score}`);
        this.updateComboDisplay();
        
        // Check for new high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
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
            base: totalBasePoints,
            multi: multiDeliveryBonus,
            time: timeBonus,
            combo: Math.floor(comboBonus),
            perfect: perfectBonus,
            speed: speedBonusPoints
        });
        
        // Clear all carried items (delivered + kept dynamite)
        this.carriedItems = dynamiteItems; // Keep only dynamite
        this.updateCarryIndicators();
        
        // Increase difficulty
        this.speedMultiplier += 0.05;
        this.difficultyLevel = Math.min(5, Math.floor(this.score / 2) + 1);
        
        // Success effect with item count
        let deliveryMessage = '';
        if (deliverableItems.length > 1) {
            deliveryMessage = `MULTI DELIVERY! x${deliverableItems.length}`;
        } else {
            const item = deliverableItems[0];
            deliveryMessage = item.type === 'shakeshake' ? '✨ SPECIAL S² SHAKE! ✨' : 'PROTEIN SHAKE!';
        }
        
        if (this.deliveries >= 9) {
            deliveryMessage = '9TH DELIVERY! 🎉';
        } else if (speedBonusMultiplier > 2) {
            deliveryMessage += ` SUPER FAST!`;
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
        if (this.deliveries >= 9) {
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
        if (breakdown.multi > 0) addLine('Multi!', breakdown.multi, '#FF00FF');
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
        this.currentLane = 1; // Middle lane
        const newY = this.lanePositions[this.currentLane];
        this.playerContainer.setPosition(this.playerX, newY);
        
        // Reset timer
        this.deliveryTimer = this.maxDeliveryTime;
        
        // Simple invulnerability period
        this.playerContainer.alpha = 0.5;
        this.time.delayedCall(1000, () => {
            this.playerContainer.alpha = 1;
        });
    }
    
    // Removed collectPowerUp - focusing on core mechanics
    
    // Removed easter egg effects - keeping it simple
    
    // Removed invulnerability - keeping consequences clear
    
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
        
        // Return to menu with rewards OR play again

        const endPrompt = this.add.text(512, 650, 'Press R to play again  |  ENTER for menu', {
            fontSize: '24px',
            color: '#FFD700',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0);

        this.tweens.add({
            targets: endPrompt,
            alpha: { from: 0.7, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Menu route
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

        // Play again route
        this.input.keyboard.once('keydown-R', () => {
            AudioManager.getInstance().stopMusic(AudioAssets.BIRTHDAY_SONG);
            this.scene.restart();
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
        
        const finalScore = this.add.text(512, 220, `Deliveries: ${this.deliveries}/9`, {
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
        
        const restartText = this.add.text(512, 660, 'Press R to play again  |  ENTER for menu', {
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
        
        // Menu return
        this.input.keyboard.once('keydown-ENTER', () => {
            AudioManager.getInstance().stopMusic(AudioAssets.BIRTHDAY_SONG);
            this.scene.start(SceneKeys.MAIN_MENU);
        });

        // Play again (restart scene in-place)
        this.input.keyboard.once('keydown-R', () => {
            AudioManager.getInstance().stopMusic(AudioAssets.BIRTHDAY_SONG);
            this.scene.restart();
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
            deliveries: this.deliveries,
            combo: this.combo,
            date: new Date().toLocaleDateString()
        };
        
        // Load existing leaderboard first
        this.leaderboard = this.loadLeaderboard();
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
    
    registerNearMiss() {
        this.nearMissStreak++;
        
        // Show near miss feedback
        const nearMissText = this.add.text(this.playerX, this.playerContainer.y - 50, 'CLOSE CALL!', {
            fontSize: '20px',
            color: '#FFFF00',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: nearMissText,
            y: '-=20',
            alpha: 0,
            duration: 800,
            onComplete: () => nearMissText.destroy()
        });
        
        // Bonus points for near misses
        if (this.nearMissStreak >= 3) {
            this.score += 50 * this.nearMissStreak;
            this.cameras.main.flash(100, 255, 255, 0);
        }
    }
    
    pickupDynamite(dynamite) {
        if (this.hasDynamite) return; // Already have one
        
        this.hasDynamite = true;
        dynamite.destroy();
        
        // Show dynamite indicator on player
        const dynamiteIndicator = this.add.container(20, -30);
        
        const bg = this.add.circle(0, 0, 15, 0xFF0000, 0.3);
        const icon = this.add.text(0, 0, '🧨', {
            fontSize: '20px'
        }).setOrigin(0.5);
        
        dynamiteIndicator.add([bg, icon]);
        this.playerContainer.add(dynamiteIndicator);
        this.dynamiteIndicator = dynamiteIndicator;
        
        // Flash effect
        this.tweens.add({
            targets: bg,
            alpha: { from: 0.3, to: 0.7 },
            duration: 400,
            repeat: -1,
            yoyo: true
        });
        
        // Feedback
        const pickupText = this.add.text(this.playerContainer.x, this.playerContainer.y - 80, 'DYNAMITE!', {
            fontSize: '24px',
            color: '#FF0000',
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
        
        AudioManager.getInstance().playSFX('pickup');
    }
    
    blowUpCake(cake) {
        // Use dynamite on cake
        this.hasDynamite = false;
        if (this.dynamiteIndicator) {
            this.dynamiteIndicator.destroy();
            this.dynamiteIndicator = null;
        }
        
        // Create explosion effect
        const explosion = this.add.container(cake.x, cake.y);
        
        // Explosion circles
        for (let i = 0; i < 3; i++) {
            const circle = this.add.circle(0, 0, 20 + i * 10, 0xFF6600, 0.8 - i * 0.2);
            explosion.add(circle);
            
            this.tweens.add({
                targets: circle,
                scale: 3,
                alpha: 0,
                duration: 500 + i * 100,
                onComplete: () => circle.destroy()
            });
        }
        
        // Cake pieces flying
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const piece = this.add.text(0, 0, '🍰', {
                fontSize: '20px'
            }).setOrigin(0.5);
            explosion.add(piece);
            
            this.tweens.add({
                targets: piece,
                x: Math.cos(angle) * 100,
                y: Math.sin(angle) * 100,
                angle: 360,
                alpha: 0,
                duration: 800,
                onComplete: () => piece.destroy()
            });
        }
        
        // Bonus points!
        const bonusPoints = 250;
        this.totalPoints += bonusPoints;
        
        const bonusText = this.add.text(cake.x, cake.y, `+${bonusPoints} CAKE BONUS!`, {
            fontSize: '28px',
            color: '#FFD700',
            fontFamily: 'Impact',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: bonusText,
            y: cake.y - 60,
            scale: 1.5,
            alpha: 0,
            duration: 1000,
            onComplete: () => bonusText.destroy()
        });
        
        // Remove the cake
        this.scrollingObjects.remove(cake);
        cake.destroy();
        
        // Effects
        this.cameras.main.shake(200, 0.02);
        this.cameras.main.flash(200, 255, 100, 0);
        AudioManager.getInstance().playSFX('pickup');
        
        // Clean up explosion container after effects
        this.time.delayedCall(1000, () => explosion.destroy());
    }
    
    createGameplayIndicators() {
        // Create tutorial arrows and hints
        const tutorialContainer = this.add.container(512, 600);
        
        // Background for tutorial
        const tutorialBg = this.add.graphics();
        tutorialBg.fillStyle(0x000000, 0.7);
        tutorialBg.fillRoundedRect(-300, -40, 600, 80, 10);
        tutorialContainer.add(tutorialBg);
        
        // Gameplay flow visualization
        const flowText = this.add.text(-250, 0, '1. Pick up 🧨', {
            fontSize: '20px',
            color: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5);
        tutorialContainer.add(flowText);
        
        const arrow1 = this.add.text(-100, 0, '→', {
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        tutorialContainer.add(arrow1);
        
        const flowText2 = this.add.text(-50, 0, '2. Avoid 💩', {
            fontSize: '20px',
            color: '#FF6B6B',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5);
        tutorialContainer.add(flowText2);
        
        const arrow2 = this.add.text(80, 0, '→', {
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        tutorialContainer.add(arrow2);
        
        const flowText3 = this.add.text(130, 0, '3. Deliver! 🎯', {
            fontSize: '20px',
            color: '#00FF00',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5);
        tutorialContainer.add(flowText3);
        
        // Fade out tutorial after 10 seconds
        this.time.delayedCall(10000, () => {
            this.tweens.add({
                targets: tutorialContainer,
                alpha: 0,
                duration: 1000,
                onComplete: () => tutorialContainer.destroy()
            });
        });
        
        // Add combo indicator
        const comboIndicator = this.add.container(850, 200);
        const comboBg = this.add.graphics();
        comboBg.fillStyle(0x000000, 0.7);
        comboBg.fillRoundedRect(-80, -30, 160, 60, 10);
        comboIndicator.add(comboBg);
        
        const comboHint = this.add.text(0, -10, 'COMBO TIP:', {
            fontSize: '16px',
            color: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        comboIndicator.add(comboHint);
        
        const comboTip = this.add.text(0, 10, 'Chain deliveries!', {
            fontSize: '14px',
            color: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        comboIndicator.add(comboTip);
        
        // Pulse the combo indicator
        this.tweens.add({
            targets: comboIndicator,
            scale: { from: 0.9, to: 1.1 },
            duration: 1000,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.tweens.add({
                    targets: comboIndicator,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => comboIndicator.destroy()
                });
            }
        });
    }
    
    spawnProteinShake() {
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = this.lanePositions[lane];
        const x = 1100;
        
        const shakeContainer = this.add.container(x, y);
        
        // Simple protein shake visual
        const shakeBg = this.add.rectangle(0, 0, 30, 45, 0x8B4513, 1);
        shakeBg.setStrokeStyle(2, 0x654321);
        
        // Lid
        const lid = this.add.rectangle(0, -22, 25, 8, 0x333333);
        
        // Straw
        const straw = this.add.rectangle(5, -25, 3, 20, 0xFF0000);
        
        // Label
        const label = this.add.text(0, 0, 'P', {
            fontSize: '16px',
            color: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);
        
        shakeContainer.add([shakeBg, lid, straw, label]);
        
        // Track data using Phaser's data manager
        shakeContainer.setData('isParcel', true);
        shakeContainer.setData('itemType', 'protein');
        shakeContainer.setData('points', 100);
        shakeContainer.setData('lane', lane);
        
        this.scrollingObjects.add(shakeContainer);
        
        this.logger.trace('[Spawn] Protein shake created with data:', {
            isParcel: shakeContainer.getData('isParcel'),
            itemType: shakeContainer.getData('itemType'),
            points: shakeContainer.getData('points'),
            lane: shakeContainer.getData('lane')
        });
        
        // Entrance animation
        this.tweens.add({
            targets: shakeContainer,
            scale: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.Out'
        });
    }
    
    spawnShakeShake() {
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = this.lanePositions[lane];
        const x = 1100;
        
        const shakeContainer = this.add.container(x, y);
        
        // Elaborate S² Shake sundae visual
        const glass = this.add.graphics();
        glass.fillStyle(0xCCCCCC, 0.3);
        glass.fillRect(-20, -10, 40, 40);
        
        // Ice cream scoops
        const scoop1 = this.add.circle(-10, -15, 12, 0xFFFFFF);
        const scoop2 = this.add.circle(10, -15, 12, 0xFFC0CB);
        const scoop3 = this.add.circle(0, -25, 12, 0x8B4513);
        
        // Cherry on top
        const cherry = this.add.circle(0, -35, 5, 0xFF0000);
        
        // Whipped cream
        const cream = this.add.ellipse(0, -20, 30, 15, 0xFFFFFF);
        
        // S² label
        const labelBg = this.add.rectangle(0, 20, 40, 20, 0xFFD700);
        const label = this.add.text(0, 20, 'S²', {
            fontSize: '16px',
            color: '#000000',
            fontFamily: 'Arial Black',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Sparkle effects
        const sparkle1 = this.add.star(-15, -30, 4, 2, 8, 0xFFFF00);
        const sparkle2 = this.add.star(15, -25, 4, 2, 8, 0xFFFF00);
        
        shakeContainer.add([glass, scoop1, scoop2, scoop3, cream, cherry, labelBg, label, sparkle1, sparkle2]);
        
        // Track data using Phaser's data manager
        shakeContainer.setData('isParcel', true);
        shakeContainer.setData('itemType', 'shakeshake');
        shakeContainer.setData('points', 500);
        shakeContainer.setData('lane', lane);
        
        this.scrollingObjects.add(shakeContainer);
        
        // Special entrance with rotation
        this.tweens.add({
            targets: shakeContainer,
            scale: { from: 0, to: 1 },
            rotation: { from: -0.5, to: 0 },
            duration: 500,
            ease: 'Back.Out'
        });
        
        // Sparkle animation
        this.tweens.add({
            targets: [sparkle1, sparkle2],
            scale: { from: 1, to: 1.5 },
            alpha: { from: 1, to: 0.3 },
            duration: 400,
            repeat: -1,
            yoyo: true
        });
    }
    
    spawnDynamite() {
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = this.lanePositions[lane];
        const x = 1100;
        
        const dynamiteContainer = this.add.container(x, y);
        
        // Dynamite stick visual
        const stick = this.add.rectangle(0, 0, 40, 15, 0xCC0000);
        stick.setStrokeStyle(2, 0x660000);
        
        // Fuse
        const fuse = this.add.rectangle(20, -5, 2, 10, 0x333333);
        
        // Spark
        const spark = this.add.star(20, -10, 5, 3, 6, 0xFFFF00);
        
        // Label
        const label = this.add.text(0, 0, 'TNT', {
            fontSize: '10px',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        dynamiteContainer.add([stick, fuse, spark, label]);
        
        // Track data using Phaser's data manager
        dynamiteContainer.setData('isParcel', true);
        dynamiteContainer.setData('itemType', 'dynamite');
        dynamiteContainer.setData('lane', lane);
        
        this.scrollingObjects.add(dynamiteContainer);
        
        // Spark animation
        this.tweens.add({
            targets: spark,
            scale: { from: 1, to: 0.5 },
            alpha: { from: 1, to: 0.3 },
            duration: 100,
            repeat: -1,
            yoyo: true
        });
    }
    
    spawnCake() {
        const lane = Phaser.Math.Between(0, this.numLanes - 1);
        const y = this.lanePositions[lane];
        const x = 1100;
        
        const cakeContainer = this.add.container(x, y);
        
        // Cake layers
        const bottom = this.add.rectangle(0, 10, 50, 20, 0x8B4513);
        const middle = this.add.rectangle(0, 0, 45, 15, 0xD2691E);
        const top = this.add.rectangle(0, -10, 40, 15, 0xFFC0CB);
        
        // Candles
        const candles = [];
        for (let i = -15; i <= 15; i += 10) {
            const candle = this.add.rectangle(i, -20, 3, 10, 0xFFFFFF);
            const flame = this.add.circle(i, -25, 3, 0xFFFF00);
            candles.push(candle, flame);
        }
        
        // "CAKE" label
        const label = this.add.text(0, 0, '🎂', {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        cakeContainer.add([bottom, middle, top, ...candles, label]);
        
        // Track data using Phaser's data manager
        cakeContainer.setData('isObstacle', true); // Cakes are obstacles until blown up
        cakeContainer.setData('isCake', true);
        cakeContainer.setData('itemType', 'cake');
        cakeContainer.setData('lane', lane);
        
        this.scrollingObjects.add(cakeContainer);
        
        // Candle flicker
        candles.forEach((obj, idx) => {
            if (idx % 2 === 1) { // Only animate flames
                this.tweens.add({
                    targets: obj,
                    scale: { from: 1, to: 0.7 },
                    duration: 200 + Math.random() * 200,
                    repeat: -1,
                    yoyo: true
                });
            }
        });
    }
}