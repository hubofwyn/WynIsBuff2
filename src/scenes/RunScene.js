import {
    PlayerController,
    EnhancedMovementController,
    EnhancedJumpController,
    WallDashController,
} from '@features/player';
import { LevelManager, PlatformFactory } from '@features/level';
import { BaseScene, EventBus, AudioManager, GameStateManager } from '@features/core';
import { DNAExtractor, TimeEchoRecorder } from '@features/idle';

import { ImageAssets } from '../constants/Assets.js';
import { EventNames } from '../constants/EventNames.js';
import { SceneKeys } from '../constants/SceneKeys.js';

export class RunScene extends BaseScene {
    constructor() {
        super(SceneKeys.RUN);
    }

    init(data) {
        this.levelData = data.level || 'protein-plant';
        this.runStartTime = Date.now();
        this.performanceScore = { S: 0, C: 0, H: 0, R: 0, B: 0 };
        this.combo = 0;
        this.maxCombo = 0;
        this.hitsThaken = 0;
        this.rarePickups = [];
        this.flowMultiplier = 1.0;
        this.checkpointTimes = [];
    }

    create() {
        // Initialize systems
        this.eventBus = EventBus.getInstance();
        this.audioManager = AudioManager.getInstance();
        this.gameStateManager = GameStateManager.getInstance();

        // Initialize performance tracking
        this.dnaExtractor = new DNAExtractor(this, this.eventBus);
        this.timeEchoRecorder = new TimeEchoRecorder(this, this.eventBus);

        // Start recording
        this.timeEchoRecorder.startRecording();
        this.eventBus.emit(EventNames.RUN_STARTED, {
            level: this.levelData,
            timestamp: this.runStartTime,
        });

        // Create world background
        this.createBackground();

        // Set up physics world bounds
        this.physics.world.setBounds(0, 0, 3200, 600);

        // Initialize level systems
        this.levelManager = new LevelManager(this, this.eventBus);
        this.platformFactory = new PlatformFactory(this, this.physics.world);

        // Load level data
        this.levelManager.loadLevel(this.levelData);

        // Create player
        this.createPlayer();

        // Initialize enhanced movement systems
        this.enhancedMovement = new EnhancedMovementController(
            this,
            this.eventBus,
            this.playerController
        );
        this.enhancedJump = new EnhancedJumpController(this, this.eventBus);
        this.wallDash = new WallDashController(this, this.eventBus);

        // Set up camera
        this.setupCamera();

        // Create UI overlay
        this.createUI();

        // Set up input
        this.setupInput();

        // Subscribe to events
        this.setupEventListeners();

        // Start idle systems
        this.eventBus.emit(EventNames.IDLE_TICK);
    }

    createBackground() {
        // Dynamic gradient background
        const graphics = this.add.graphics();
        const colors = this.getBiomeColors();

        // Create gradient
        for (let i = 0; i < 600; i++) {
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(colors.top),
                Phaser.Display.Color.ValueToColor(colors.bottom),
                600,
                i
            );
            graphics.fillStyle(color.color, 1);
            graphics.fillRect(0, i, 3200, 1);
        }

        // Add parallax layers if available
        if (ImageAssets[`${this.levelData.toUpperCase()}_BG`]) {
            this.add
                .tileSprite(0, 0, 3200, 600, ImageAssets[`${this.levelData.toUpperCase()}_BG`])
                .setOrigin(0, 0)
                .setScrollFactor(0.5);
        }
    }

    getBiomeColors() {
        const biomeColors = {
            'protein-plant': { top: 0x2e7d32, bottom: 0x81c784 },
            'metronome-mines': { top: 0x1a237e, bottom: 0x7986cb },
            'isometric-icebox': { top: 0x006064, bottom: 0x80deea },
            'vascular-vault': { top: 0x8e0000, bottom: 0xef5350 },
        };
        return biomeColors[this.levelData] || { top: 0x1976d2, bottom: 0x64b5f6 };
    }

    createPlayer() {
        // Create player at spawn point
        const spawnPoint = this.levelManager.getSpawnPoint();
        this.playerController = new PlayerController(
            this,
            spawnPoint.x,
            spawnPoint.y,
            this.eventBus
        );

        // Initialize player sprite and physics
        this.player = this.playerController.getSprite();
        this.playerBody = this.playerController.getBody();
    }

    setupCamera() {
        // Configure main camera
        this.cameras.main.setBounds(0, 0, 3200, 600);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.2);

        // Add subtle camera shake on landing
        this.eventBus.on(EventNames.PLAYER_LAND_IMPACT, () => {
            this.cameras.main.shake(50, 0.002);
        });
    }

    createUI() {
        // Create fixed UI container
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);

        // Combo display
        this.comboText = this.add.text(400, 20, 'COMBO: 0', {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
        });
        this.comboText.setOrigin(0.5, 0);
        this.uiContainer.add(this.comboText);

        // Flow multiplier
        this.flowText = this.add.text(400, 60, 'FLOW: 1.0x', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3,
        });
        this.flowText.setOrigin(0.5, 0);
        this.uiContainer.add(this.flowText);

        // Timer
        this.timerText = this.add.text(750, 20, '00:00', {
            fontSize: '28px',
            fontFamily: 'Courier',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3,
        });
        this.timerText.setOrigin(1, 0);
        this.uiContainer.add(this.timerText);

        // Performance indicators
        this.createPerformanceIndicators();
    }

    createPerformanceIndicators() {
        const indicators = ['S', 'C', 'H', 'R', 'B'];
        const colors = ['#00FF00', '#FFD700', '#FF0000', '#00FFFF', '#FF00FF'];

        indicators.forEach((indicator, index) => {
            const x = 20 + index * 40;
            const text = this.add.text(x, 20, `${indicator}:0`, {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: colors[index],
                stroke: '#000000',
                strokeThickness: 2,
            });
            this.uiContainer.add(text);
            this[`${indicator.toLowerCase()}Indicator`] = text;
        });
    }

    setupInput() {
        // Create input handlers
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.jumpKey = this.input.keyboard.addKey('SPACE');
        this.dashKey = this.input.keyboard.addKey('SHIFT');
        this.duckKey = this.input.keyboard.addKey('C');

        // Mobile touch controls if needed
        if (this.game.device.input.touch) {
            this.createTouchControls();
        }
    }

    createTouchControls() {
        // Left/Right zones
        const _leftZone = this.add
            .zone(100, 400, 200, 200)
            .setInteractive()
            .on('pointerdown', () => (this.touchLeft = true))
            .on('pointerup', () => (this.touchLeft = false));

        const _rightZone = this.add
            .zone(700, 400, 200, 200)
            .setInteractive()
            .on('pointerdown', () => (this.touchRight = true))
            .on('pointerup', () => (this.touchRight = false));

        // Jump zone
        const _jumpZone = this.add
            .zone(400, 300, 400, 300)
            .setInteractive()
            .on('pointerdown', () => (this.touchJump = true))
            .on('pointerup', () => (this.touchJump = false));
    }

    setupEventListeners() {
        // Collectible events
        this.eventBus.on(EventNames.COLLECTIBLE_COLLECTED, (data) => {
            this.handleCollectible(data);
        });

        // Combo events
        this.eventBus.on(EventNames.COMBO_INCREASE, () => {
            this.updateCombo(this.combo + 1);
        });

        this.eventBus.on(EventNames.COMBO_BREAK, () => {
            this.updateCombo(0);
        });

        // Damage events
        this.eventBus.on(EventNames.PLAYER_EXPLODE, () => {
            this.hitsThaken++;
            this.performanceScore.H = this.hitsThaken;
            this.updateCombo(0);
        });

        // Level completion
        this.eventBus.on(EventNames.LEVEL_COMPLETE, () => {
            this.completeRun();
        });

        // Boss events
        this.eventBus.on(EventNames.BOSS_DEFEATED, (data) => {
            this.performanceScore.B = data.rating || 1.0;
        });
    }

    handleCollectible(data) {
        const { type, value } = data;

        switch (type) {
            case 'coin':
                this.gameStateManager.addCoins(value);
                break;
            case 'rare':
                this.rarePickups.push(data);
                this.performanceScore.R = this.rarePickups.length;
                break;
            case 'speed':
                this.checkpointTimes.push(Date.now() - this.runStartTime);
                this.performanceScore.S = Math.max(
                    this.performanceScore.S,
                    this.calculateSpeedRating()
                );
                break;
        }

        // Update flow state
        this.updateFlowState(0.1);
    }

    updateCombo(newCombo) {
        this.combo = newCombo;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.performanceScore.C = this.maxCombo;

        // Update UI
        this.comboText.setText(`COMBO: ${this.combo}`);

        // Scale effect on combo
        if (this.combo > 0) {
            this.tweens.add({
                targets: this.comboText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
            });
        }

        // Update flow state based on combo
        if (this.combo > 0) {
            this.updateFlowState(this.combo * 0.05);
        }
    }

    updateFlowState(delta) {
        this.flowMultiplier = Math.min(50, this.flowMultiplier + delta);
        this.flowText.setText(`FLOW: ${this.flowMultiplier.toFixed(1)}x`);

        // Color change based on flow level
        const flowLevel = Math.floor(this.flowMultiplier / 5);
        const colors = [
            '#FFFFFF',
            '#FFD700',
            '#FFA500',
            '#FF4500',
            '#FF0000',
            '#FF00FF',
            '#00FFFF',
            '#00FF00',
            '#FFFF00',
            '#FF1493',
            '#00BFFF',
        ];
        this.flowText.setColor(colors[Math.min(flowLevel, colors.length - 1)]);

        // Emit flow state change
        this.eventBus.emit(EventNames.FLOW_STATE_CHANGED, {
            multiplier: this.flowMultiplier,
            level: flowLevel,
        });
    }

    calculateSpeedRating() {
        // Calculate speed rating based on checkpoint times
        const parTime = 60000; // 60 seconds par time
        const currentTime = Date.now() - this.runStartTime;
        const ratio = parTime / currentTime;
        return Math.floor(Math.min(10, ratio * 10));
    }

    processInput() {
        const input = {
            left: this.cursors.left.isDown || this.wasd.A.isDown || this.touchLeft,
            right: this.cursors.right.isDown || this.wasd.D.isDown || this.touchRight,
            jump: this.jumpKey.isDown || this.wasd.W.isDown || this.touchJump,
            dash: this.dashKey.isDown,
            duck: this.duckKey.isDown || this.wasd.S.isDown,
        };

        // Record input for time echo
        this.timeEchoRecorder.recordInput(input);

        return input;
    }

    update(time, delta) {
        // Update timer
        const elapsed = Math.floor((Date.now() - this.runStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.timerText.setText(
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );

        // Process input
        const input = this.processInput();

        // Update player with enhanced movement
        const dt = delta / 1000;
        const isGrounded = this.playerController.isGrounded();

        // Update movement systems
        this.enhancedMovement.update(time, delta, this.playerBody, this.player, input, isGrounded);

        this.enhancedJump.update(this.playerBody, this.player, input, isGrounded, dt);

        this.wallDash.update(this.playerBody, this.player, input, dt);

        // Update player controller
        this.playerController.update(delta);

        // Update level systems
        this.levelManager.update(delta);

        // Update performance tracking
        this.dnaExtractor.update(delta);

        // Update UI indicators
        this.updateIndicators();

        // Check for run completion
        if (this.playerController.getSprite().x > 3000) {
            this.completeRun();
        }
    }

    updateIndicators() {
        this.sIndicator.setText(`S:${this.performanceScore.S}`);
        this.cIndicator.setText(`C:${this.performanceScore.C}`);
        this.hIndicator.setText(`H:${this.performanceScore.H}`);
        this.rIndicator.setText(`R:${this.performanceScore.R}`);
        this.bIndicator.setText(`B:${this.performanceScore.B.toFixed(1)}`);
    }

    completeRun() {
        // Stop recording
        this.timeEchoRecorder.stopRecording();

        // Calculate final performance
        const runTime = Date.now() - this.runStartTime;
        const finalScore = {
            S: this.performanceScore.S,
            C: this.performanceScore.C,
            H: this.performanceScore.H,
            R: this.performanceScore.R,
            B: this.performanceScore.B || 1.0,
            flowPeak: this.flowMultiplier,
            runTime,
        };

        // Extract DNA
        const dna = this.dnaExtractor.extractDNA();

        // Get time echo
        const timeEcho = this.timeEchoRecorder.getRecording();

        // Emit run complete event
        this.eventBus.emit(EventNames.RUN_ENDED, {
            score: finalScore,
            dna,
            timeEcho,
            level: this.levelData,
        });

        // Transition to results
        this.scene.start(SceneKeys.RESULTS, {
            score: finalScore,
            dna,
            timeEcho,
            level: this.levelData,
        });
    }

    shutdown() {
        // Clean up event listeners
        this.eventBus.off(EventNames.COLLECTIBLE_COLLECTED);
        this.eventBus.off(EventNames.COMBO_INCREASE);
        this.eventBus.off(EventNames.COMBO_BREAK);
        this.eventBus.off(EventNames.PLAYER_EXPLODE);
        this.eventBus.off(EventNames.LEVEL_COMPLETE);
        this.eventBus.off(EventNames.BOSS_DEFEATED);
        this.eventBus.off(EventNames.PLAYER_LAND_IMPACT);
    }
}
