import { Scene } from 'phaser';
import { SceneKeys } from '../constants/SceneKeys.js';
import { EventNames } from '../constants/EventNames.js';
import { ImageAssets, AudioAssets } from '../constants/Assets.js';
import { 
    EventBus,
    AudioManager,
    GameStateManager
} from '@features/core';
import {
    CloneManager,
    EconomyManager
} from '@features/idle';

export class ResultsScene extends Scene {
    constructor() {
        super(SceneKeys.RESULTS);
    }

    init(data) {
        this.score = data.score || { S: 0, C: 0, H: 0, R: 0, B: 1.0 };
        this.dna = data.dna || {};
        this.timeEcho = data.timeEcho || null;
        this.level = data.level || 'protein-plant';
        this.flowPeak = data.score?.flowPeak || 1.0;
        this.runTime = data.score?.runTime || 0;
    }

    create() {
        // Initialize systems
        this.eventBus = EventBus.getInstance();
        this.audioManager = AudioManager.getInstance();
        this.gameStateManager = GameStateManager.getInstance();
        this.cloneManager = CloneManager.getInstance();
        this.economyManager = EconomyManager.getInstance();
        
        // Create background
        this.createBackground();
        
        // Display results header
        this.createHeader();
        
        // Show performance breakdown
        this.createPerformanceDisplay();
        
        // Show clone forging animation
        this.createCloneForge();
        
        // Create action buttons
        this.createActionButtons();
        
        // Calculate and award resources
        this.calculateRewards();
        
        // Start forge animation after delay
        this.time.delayedCall(1000, () => {
            this.startForgeAnimation();
        });
    }

    createBackground() {
        // Dark overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        
        // Animated particles
        const particles = this.add.particles(400, 300, ImageAssets.PARTICLE_WHITE, {
            color: [0xffffff, 0xffdd00, 0xff00ff],
            colorEase: 'quad.out',
            lifespan: 2000,
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            speed: { min: 50, max: 150 },
            quantity: 1,
            frequency: 100,
            alpha: { start: 0.6, end: 0 }
        });
    }

    createHeader() {
        // Title
        const title = this.add.text(400, 50, 'RUN COMPLETE!', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        });
        title.setOrigin(0.5);
        
        // Animate title
        this.tweens.add({
            targets: title,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // Level name
        const levelText = this.add.text(400, 100, this.getLevelName(), {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        });
        levelText.setOrigin(0.5);
        
        // Run time
        const minutes = Math.floor(this.runTime / 60000);
        const seconds = Math.floor((this.runTime % 60000) / 1000);
        const timeText = this.add.text(400, 130, 
            `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, {
            fontSize: '20px',
            fontFamily: 'Courier',
            color: '#FFFFFF'
        });
        timeText.setOrigin(0.5);
    }

    getLevelName() {
        const names = {
            'protein-plant': 'PROTEIN PLANT',
            'metronome-mines': 'METRONOME MINES',
            'isometric-icebox': 'ISOMETRIC ICEBOX',
            'vascular-vault': 'VASCULAR VAULT'
        };
        return names[this.level] || 'UNKNOWN ZONE';
    }

    createPerformanceDisplay() {
        // Performance container
        const perfContainer = this.add.container(200, 200);
        
        // Performance metrics
        const metrics = [
            { label: 'SPEED', value: this.score.S, max: 10, color: 0x00FF00 },
            { label: 'COMBO', value: this.score.C, max: 50, color: 0xFFD700 },
            { label: 'HITS', value: this.score.H, max: 10, color: 0xFF0000, inverse: true },
            { label: 'RARES', value: this.score.R, max: 5, color: 0x00FFFF },
            { label: 'BOSS', value: this.score.B, max: 2, color: 0xFF00FF }
        ];
        
        metrics.forEach((metric, index) => {
            const y = index * 40;
            
            // Label
            const label = this.add.text(0, y, metric.label, {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            });
            perfContainer.add(label);
            
            // Value
            const value = this.add.text(100, y, metric.value.toString(), {
                fontSize: '18px',
                fontFamily: 'Arial Bold',
                color: Phaser.Display.Color.IntegerToColor(metric.color).rgba
            });
            perfContainer.add(value);
            
            // Bar
            const barBg = this.add.rectangle(180, y + 10, 150, 20, 0x333333);
            barBg.setOrigin(0, 0.5);
            perfContainer.add(barBg);
            
            const barFill = this.add.rectangle(180, y + 10, 
                150 * (metric.inverse ? (1 - metric.value/metric.max) : (metric.value/metric.max)), 
                20, metric.color);
            barFill.setOrigin(0, 0.5);
            perfContainer.add(barFill);
            
            // Animate bar fill
            barFill.scaleX = 0;
            this.tweens.add({
                targets: barFill,
                scaleX: metric.inverse ? (1 - metric.value/metric.max) : (metric.value/metric.max),
                duration: 500,
                delay: 500 + index * 100,
                ease: 'Power2'
            });
        });
        
        // Flow peak display
        const flowLabel = this.add.text(200, 420, 'FLOW PEAK', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#FFD700'
        });
        flowLabel.setOrigin(0.5);
        
        const flowValue = this.add.text(200, 450, `${this.flowPeak.toFixed(1)}x`, {
            fontSize: '36px',
            fontFamily: 'Arial Black',
            color: '#FFFFFF',
            stroke: '#FFD700',
            strokeThickness: 4
        });
        flowValue.setOrigin(0.5);
        
        // Pulse flow value
        this.tweens.add({
            targets: flowValue,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    createCloneForge() {
        // Clone forge container
        this.forgeContainer = this.add.container(600, 250);
        
        // Forge circle
        this.forgeCircle = this.add.circle(0, 0, 80, 0x4444FF, 0.3);
        this.forgeContainer.add(this.forgeCircle);
        
        // DNA strands visual
        const graphics = this.add.graphics();
        this.forgeContainer.add(graphics);
        
        // Draw DNA double helix
        this.drawDNAHelix(graphics);
        
        // Clone preview (initially hidden)
        this.cloneSprite = this.add.sprite(0, 0, ImageAssets.PLAYER_SPRITE);
        this.cloneSprite.setScale(2);
        this.cloneSprite.setAlpha(0);
        this.cloneSprite.setTint(0x8888FF);
        this.forgeContainer.add(this.cloneSprite);
        
        // Stats display (initially hidden)
        this.cloneStatsContainer = this.add.container(0, 120);
        this.cloneStatsContainer.setAlpha(0);
        this.forgeContainer.add(this.cloneStatsContainer);
        
        // "FORGING..." text
        this.forgingText = this.add.text(0, -120, 'ANALYZING DNA...', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });
        this.forgingText.setOrigin(0.5);
        this.forgeContainer.add(this.forgingText);
    }

    drawDNAHelix(graphics) {
        graphics.lineStyle(2, 0x00FF00, 0.8);
        
        for (let i = 0; i < 20; i++) {
            const y = -60 + i * 6;
            const x1 = Math.sin(i * 0.5) * 30;
            const x2 = Math.sin(i * 0.5 + Math.PI) * 30;
            
            // DNA backbone
            graphics.strokeCircle(x1, y, 3);
            graphics.strokeCircle(x2, y, 3);
            
            // Base pairs
            if (i % 2 === 0) {
                graphics.lineStyle(1, 0xFFFFFF, 0.5);
                graphics.lineBetween(x1, y, x2, y);
                graphics.lineStyle(2, 0x00FF00, 0.8);
            }
        }
    }

    startForgeAnimation() {
        // Update text
        this.forgingText.setText('FORGING CLONE...');
        
        // Spin the forge circle
        this.tweens.add({
            targets: this.forgeCircle,
            rotation: Math.PI * 2,
            duration: 2000,
            repeat: -1
        });
        
        // Pulse the circle
        this.tweens.add({
            targets: this.forgeCircle,
            scale: 1.2,
            alpha: 0.6,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        // After 2 seconds, reveal the clone
        this.time.delayedCall(2000, () => {
            this.revealClone();
        });
    }

    revealClone() {
        // Forge the clone using CloneManager
        const clone = this.cloneManager.forgeClone(this.score, this.dna);
        this.forgedClone = clone;
        
        // Update text
        this.forgingText.setText('CLONE FORGED!');
        
        // Fade in clone sprite
        this.tweens.add({
            targets: this.cloneSprite,
            alpha: 1,
            duration: 1000
        });
        
        // Add rotation animation to clone
        this.tweens.add({
            targets: this.cloneSprite,
            rotation: Math.PI * 2,
            duration: 3000,
            repeat: -1
        });
        
        // Display clone stats
        this.displayCloneStats(clone);
        
        // Emit clone forged event
        this.eventBus.emit(EventNames.CLONE_FORGE_COMPLETE, { clone });
    }

    displayCloneStats(clone) {
        // Clear existing stats
        this.cloneStatsContainer.removeAll(true);
        
        // Clone name/type
        const nameText = this.add.text(0, 0, 
            `${this.getCloneSpecialty(clone.specialization)} CLONE`, {
            fontSize: '16px',
            fontFamily: 'Arial Bold',
            color: '#FFFF00'
        });
        nameText.setOrigin(0.5);
        this.cloneStatsContainer.add(nameText);
        
        // Production rate
        const rateText = this.add.text(0, 20, 
            `Rate: ${clone.productionRate.toFixed(1)}/sec`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#00FF00'
        });
        rateText.setOrigin(0.5);
        this.cloneStatsContainer.add(rateText);
        
        // Stability
        const stabilityText = this.add.text(0, 40, 
            `Stability: ${Math.floor(clone.stability * 100)}%`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#00FFFF'
        });
        stabilityText.setOrigin(0.5);
        this.cloneStatsContainer.add(stabilityText);
        
        // Traits
        if (clone.traits && clone.traits.length > 0) {
            const traitsText = this.add.text(0, 60, 
                `Traits: ${clone.traits.join(', ')}`, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#FF00FF'
            });
            traitsText.setOrigin(0.5);
            this.cloneStatsContainer.add(traitsText);
        }
        
        // Fade in stats
        this.tweens.add({
            targets: this.cloneStatsContainer,
            alpha: 1,
            duration: 500
        });
    }

    getCloneSpecialty(specialization) {
        const specialties = {
            'speed': 'SPEEDSTER',
            'combat': 'WARRIOR',
            'height': 'JUMPER',
            'resource': 'GATHERER',
            'buff': 'ENHANCER'
        };
        return specialties[specialization] || 'STANDARD';
    }

    createActionButtons() {
        // Button container
        const buttonContainer = this.add.container(400, 520);
        
        // Deploy button
        const deployBtn = this.createButton(
            -120, 0, 'DEPLOY', 
            () => this.deployClone()
        );
        buttonContainer.add(deployBtn);
        
        // Factory button
        const factoryBtn = this.createButton(
            0, 0, 'FACTORY', 
            () => this.goToFactory()
        );
        buttonContainer.add(factoryBtn);
        
        // Run Again button
        const runBtn = this.createButton(
            120, 0, 'RUN AGAIN', 
            () => this.runAgain()
        );
        buttonContainer.add(runBtn);
    }

    createButton(x, y, text, callback) {
        const container = this.add.container(x, y);
        
        // Button background
        const bg = this.add.rectangle(0, 0, 100, 40, 0x4444FF);
        bg.setInteractive({ useHandCursor: true });
        container.add(bg);
        
        // Button text
        const btnText = this.add.text(0, 0, text, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });
        btnText.setOrigin(0.5);
        container.add(btnText);
        
        // Hover effects
        bg.on('pointerover', () => {
            bg.setFillStyle(0x6666FF);
            this.tweens.add({
                targets: container,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x4444FF);
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        bg.on('pointerdown', callback);
        
        return container;
    }

    calculateRewards() {
        // Base rewards
        const baseCoins = 100;
        const baseEnergy = 50;
        
        // Calculate multipliers
        const performanceMultiplier = 
            (1 + this.score.S * 0.1) * 
            (1 + this.score.C * 0.02) * 
            (this.score.H === 0 ? 1.5 : 1) * 
            (1 + this.score.R * 0.2) * 
            this.score.B;
            
        const flowMultiplier = Math.sqrt(this.flowPeak);
        
        // Final rewards
        const coins = Math.floor(baseCoins * performanceMultiplier * flowMultiplier);
        const energy = Math.floor(baseEnergy * performanceMultiplier);
        
        // Grant rewards
        this.economyManager.addResource('coins', coins);
        this.economyManager.addResource('energy', energy);
        
        // Display rewards
        this.time.delayedCall(3000, () => {
            this.displayRewards(coins, energy);
        });
    }

    displayRewards(coins, energy) {
        // Rewards container
        const rewardsContainer = this.add.container(400, 380);
        
        // Background
        const bg = this.add.rectangle(0, 0, 300, 80, 0x000000, 0.7);
        bg.setStrokeStyle(2, 0xFFD700);
        rewardsContainer.add(bg);
        
        // Title
        const title = this.add.text(0, -25, 'REWARDS', {
            fontSize: '18px',
            fontFamily: 'Arial Bold',
            color: '#FFD700'
        });
        title.setOrigin(0.5);
        rewardsContainer.add(title);
        
        // Coins
        const coinsText = this.add.text(-50, 5, `+${coins} Coins`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFF00'
        });
        coinsText.setOrigin(0.5);
        rewardsContainer.add(coinsText);
        
        // Energy
        const energyText = this.add.text(50, 5, `+${energy} Energy`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#00FF00'
        });
        energyText.setOrigin(0.5);
        rewardsContainer.add(energyText);
        
        // Scale in animation
        rewardsContainer.setScale(0);
        this.tweens.add({
            targets: rewardsContainer,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.out'
        });
    }

    deployClone() {
        if (this.forgedClone) {
            // Deploy the clone
            this.cloneManager.deployClone(this.forgedClone);
            
            // Visual feedback
            this.cameras.main.flash(500, 0, 255, 0);
            
            // Go to factory
            this.time.delayedCall(500, () => {
                this.scene.start(SceneKeys.FACTORY);
            });
        }
    }

    goToFactory() {
        this.scene.start(SceneKeys.FACTORY);
    }

    runAgain() {
        this.scene.start(SceneKeys.RUN, { level: this.level });
    }
}