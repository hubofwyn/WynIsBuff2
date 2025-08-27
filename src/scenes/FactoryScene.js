import { Scene } from 'phaser';
import { SceneKeys } from '../constants/SceneKeys.js';
import { EventNames } from '../constants/EventNames.js';
import { GameStateManager, EventBus } from '@features/core';
import { EnhancedCloneManager } from '@features/idle';

/**
 * FactoryScene - Production and automation management
 * 
 * Where players set up and manage their automated production lines,
 * upgrade factory components, and optimize resource generation.
 */
export class FactoryScene extends Scene {
    constructor() {
        super({ key: SceneKeys.FACTORY });
    }

    init() {
        // Initialize managers
        this.gameStateManager = GameStateManager.getInstance();
        this.cloneManager = EnhancedCloneManager.getInstance();
        this.eventBus = EventBus.getInstance();
        
        // Load factory state
        this.factoryState = this.gameStateManager.loadFactory();
        
        // Production lines (from clone lanes)
        this.productionLines = [];
        this.selectedLine = null;
        
        // UI containers
        this.laneContainers = new Map();
    }

    create() {
        console.log('[FactoryScene] Creating factory scene');
        
        // Emit factory entered event
        this.events.emit(EventNames.FACTORY_ENTERED);
        
        // Create factory UI
        this.createBackground();
        this.createFactoryLayout();
        this.createProductionLines();
        this.createControlPanel();
        this.createResourceDisplay();
        this.createNavigationButtons();
        
        // Start production tick
        this.startProductionTick();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    createBackground() {
        // Industrial themed background
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x2c3e50)
            .setOrigin(0, 0);
        
        // Grid pattern for factory floor
        this.createFactoryGrid();
    }

    createFactoryGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x34495e, 0.3);
        
        const gridSize = 40;
        
        // Draw vertical lines
        for (let x = 0; x <= this.scale.width; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.scale.height);
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.scale.height; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.scale.width, y);
        }
        
        graphics.strokePath();
    }

    createFactoryLayout() {
        // Title
        this.add.text(this.scale.width / 2, 30, 'BUFF FACTORY', {
            fontSize: '42px',
            fontFamily: 'Arial Black',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(this.scale.width / 2, 70, 'Automated Production Facility', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#95a5a6'
        }).setOrigin(0.5);
    }

    createProductionLines() {
        const startX = 100;
        const startY = 150;
        const lineHeight = 100;
        const maxLines = 5;
        
        // Create production line slots
        for (let i = 0; i < maxLines; i++) {
            const y = startY + (i * lineHeight);
            
            if (i < this.getUnlockedLineCount()) {
                // Create active production line
                this.createProductionLine(i, startX, y);
            } else {
                // Create locked production line slot
                this.createLockedLine(i, startX, y);
            }
        }
    }

    createProductionLine(index, x, y) {
        const lineData = this.factoryState.lines ? this.factoryState.lines[index] : null;
        
        // Production line background
        const bg = this.add.rectangle(x, y, 600, 80, 0x27ae60, 0.3)
            .setOrigin(0, 0.5)
            .setStrokeStyle(2, 0x27ae60)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setFillStyle(0x27ae60, 0.5);
            })
            .on('pointerout', () => {
                bg.setFillStyle(0x27ae60, 0.3);
            })
            .on('pointerup', () => {
                this.selectProductionLine(index);
            });
        
        // Line number
        this.add.text(x + 20, y, `LINE ${index + 1}`, {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: '#FFFFFF'
        }).setOrigin(0, 0.5);
        
        // Production type
        const productType = lineData?.type || 'Buff Coins';
        this.add.text(x + 120, y - 15, productType, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFD700'
        }).setOrigin(0, 0.5);
        
        // Production rate
        const rate = lineData?.rate || 1;
        const rateText = this.add.text(x + 120, y + 15, `${rate}/sec`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        }).setOrigin(0, 0.5);
        
        // Progress bar
        const progressBarWidth = 200;
        const progressBarHeight = 10;
        const progressX = x + 300;
        
        // Progress bar background
        this.add.rectangle(progressX, y, progressBarWidth, progressBarHeight, 0x000000, 0.5)
            .setOrigin(0, 0.5);
        
        // Progress bar fill
        const progressFill = this.add.rectangle(progressX, y, 0, progressBarHeight, 0x27ae60)
            .setOrigin(0, 0.5);
        
        // Upgrade button
        const upgradeButton = this.add.text(x + 520, y, '[UPGRADE]', {
            fontSize: '14px',
            fontFamily: 'Arial Black',
            color: '#00FF00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
            this.upgradeProductionLine(index);
        });
        
        // Store line data
        this.productionLines.push({
            index,
            bg,
            rateText,
            progressFill,
            progressBarWidth,
            upgradeButton,
            data: lineData || { type: 'Buff Coins', rate: 1, level: 1 }
        });
    }

    createLockedLine(index, x, y) {
        // Locked line background
        const bg = this.add.rectangle(x, y, 600, 80, 0x7f8c8d, 0.2)
            .setOrigin(0, 0.5)
            .setStrokeStyle(2, 0x7f8c8d, 0.5);
        
        // Lock icon
        this.add.text(x + 250, y, '🔒', {
            fontSize: '32px'
        }).setOrigin(0.5);
        
        // Unlock requirements
        const unlockCost = this.getUnlockCost(index);
        this.add.text(x + 300, y, `Unlock: ${this.formatNumber(unlockCost)} Buff Coins`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#95a5a6'
        }).setOrigin(0, 0.5);
        
        // Make clickable if player can afford
        bg.setInteractive({ useHandCursor: true })
            .on('pointerup', () => {
                this.attemptUnlockLine(index);
            });
    }

    createControlPanel() {
        const panelX = this.scale.width - 250;
        const panelY = 150;
        const panelWidth = 220;
        const panelHeight = 300;
        
        // Panel background
        this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x34495e, 0.8)
            .setOrigin(0.5, 0)
            .setStrokeStyle(2, 0x95a5a6);
        
        // Panel title
        this.add.text(panelX, panelY + 20, 'CONTROL PANEL', {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        
        // Production stats
        this.totalProductionText = this.add.text(panelX, panelY + 60, 
            'Total Production:\n0/sec', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);
        
        // Efficiency
        this.efficiencyText = this.add.text(panelX, panelY + 110, 
            'Efficiency: 100%', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#27ae60'
        }).setOrigin(0.5);
        
        // Boost button
        this.boostButton = this.add.text(panelX, panelY + 160, '[BOOST x2]', {
            fontSize: '16px',
            fontFamily: 'Arial Black',
            color: '#FFD700',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
            this.activateProductionBoost();
        });
        
        // Collect all button
        this.collectButton = this.add.text(panelX, panelY + 210, '[COLLECT ALL]', {
            fontSize: '16px',
            fontFamily: 'Arial Black',
            color: '#00FF00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
            this.collectAllProduction();
        });
        
        // Auto-collect toggle
        this.autoCollectText = this.add.text(panelX, panelY + 260, 
            '⬜ Auto-Collect', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
            this.toggleAutoCollect();
        });
    }

    createResourceDisplay() {
        // Resource panel at top right
        const panelX = this.scale.width - 20;
        const panelY = 20;
        
        const resources = this.gameStateManager.loadResources();
        
        this.resourceTexts = {};
        
        // Buff Coins
        this.resourceTexts.buffCoins = this.add.text(panelX, panelY, 
            `🪙 ${this.formatNumber(resources.buffCoins || 0)}`, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#FFD700'
        }).setOrigin(1, 0);
        
        // Buff Gems
        this.resourceTexts.buffGems = this.add.text(panelX, panelY + 25, 
            `💎 ${this.formatNumber(resources.buffGems || 0)}`, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#FF69B4'
        }).setOrigin(1, 0);
    }

    createNavigationButtons() {
        const centerX = this.scale.width / 2;
        const buttonY = this.scale.height - 50;
        
        // Back to Hub button
        this.createNavButton(
            centerX,
            buttonY,
            'BACK TO HUB',
            0x0080FF,
            () => this.returnToHub()
        );
    }

    createNavButton(x, y, text, color, callback) {
        const button = this.add.rectangle(x, y, 150, 40, color)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                button.setScale(1.1);
            })
            .on('pointerout', () => {
                button.setScale(1);
            })
            .on('pointerup', () => {
                callback();
            });
        
        this.add.text(x, y, text, {
            fontSize: '16px',
            fontFamily: 'Arial Black',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    startProductionTick() {
        // Production tick every 100ms for smooth progress bars
        this.productionTimer = this.time.addEvent({
            delay: 100,
            callback: this.onProductionTick,
            callbackScope: this,
            loop: true
        });
    }

    onProductionTick() {
        let totalProduction = 0;
        
        // Update each production line
        this.productionLines.forEach(line => {
            if (line.data) {
                // Update progress bar
                const progress = (this.time.now % 1000) / 1000;
                const fillWidth = progress * line.progressBarWidth;
                line.progressFill.setSize(fillWidth, 10);
                
                // Calculate production
                totalProduction += line.data.rate;
                
                // Check for production completion
                if (progress > 0.95 && !line.collected) {
                    line.collected = true;
                    this.onProductionComplete(line);
                } else if (progress < 0.05) {
                    line.collected = false;
                }
            }
        });
        
        // Update total production display
        if (this.totalProductionText) {
            this.totalProductionText.setText(
                `Total Production:\n${totalProduction.toFixed(1)}/sec`
            );
        }
    }

    onProductionComplete(line) {
        // Emit production complete event
        this.events.emit(EventNames.PRODUCTION_COMPLETE, {
            lineIndex: line.index,
            product: line.data.type,
            amount: line.data.rate
        });
        
        // Visual feedback
        this.tweens.add({
            targets: line.bg,
            alpha: 0.5,
            duration: 100,
            yoyo: true
        });
    }

    selectProductionLine(index) {
        this.selectedLine = index;
        console.log('[FactoryScene] Selected production line:', index);
        
        // Visual feedback
        this.productionLines.forEach((line, i) => {
            if (i === index) {
                line.bg.setStrokeStyle(3, 0xFFD700);
            } else {
                line.bg.setStrokeStyle(2, 0x27ae60);
            }
        });
    }

    upgradeProductionLine(index) {
        const line = this.productionLines[index];
        if (!line || !line.data) return;
        
        const upgradeCost = this.getUpgradeCost(line.data.level);
        const resources = this.gameStateManager.loadResources();
        
        if (resources.buffCoins >= upgradeCost) {
            // Deduct cost
            resources.buffCoins -= upgradeCost;
            this.gameStateManager.saveResources(resources);
            
            // Upgrade line
            line.data.level++;
            line.data.rate *= 1.5;
            
            // Update display
            line.rateText.setText(`${line.data.rate.toFixed(1)}/sec`);
            this.updateResourceDisplay();
            
            // Save factory state
            this.saveFactoryState();
            
            // Emit upgrade event
            this.events.emit(EventNames.FACTORY_UPGRADE, {
                lineIndex: index,
                newLevel: line.data.level,
                newRate: line.data.rate
            });
            
            console.log('[FactoryScene] Upgraded line', index, 'to level', line.data.level);
        } else {
            // Not enough resources
            this.showInsufficientFunds();
        }
    }

    attemptUnlockLine(index) {
        const unlockCost = this.getUnlockCost(index);
        const resources = this.gameStateManager.loadResources();
        
        if (resources.buffCoins >= unlockCost) {
            // Deduct cost
            resources.buffCoins -= unlockCost;
            this.gameStateManager.saveResources(resources);
            
            // Unlock line
            this.events.emit(EventNames.FACTORY_UNLOCK, { lineIndex: index });
            
            // Refresh scene to show new line
            this.scene.restart();
        } else {
            this.showInsufficientFunds();
        }
    }

    activateProductionBoost() {
        console.log('[FactoryScene] Production boost activated');
        
        // Emit boost event
        this.events.emit(EventNames.PRODUCTION_BOOST_ACTIVE, {
            multiplier: 2,
            duration: 30000 // 30 seconds
        });
        
        // Visual feedback
        this.boostButton.setAlpha(0.5);
        this.time.delayedCall(30000, () => {
            this.boostButton.setAlpha(1);
        });
    }

    collectAllProduction() {
        let totalCollected = { buffCoins: 0, buffGems: 0 };
        
        // Collect from all lines
        this.productionLines.forEach(line => {
            if (line.data) {
                const amount = line.data.rate * 10; // Collect 10 seconds worth
                
                if (line.data.type === 'Buff Coins') {
                    totalCollected.buffCoins += amount;
                } else if (line.data.type === 'Buff Gems') {
                    totalCollected.buffGems += amount;
                }
            }
        });
        
        // Add to resources
        const resources = this.gameStateManager.loadResources();
        resources.buffCoins += totalCollected.buffCoins;
        resources.buffGems += totalCollected.buffGems;
        this.gameStateManager.saveResources(resources);
        
        // Update display
        this.updateResourceDisplay();
        
        // Emit collect event
        this.events.emit(EventNames.FACTORY_COLLECT, totalCollected);
        
        console.log('[FactoryScene] Collected:', totalCollected);
    }

    toggleAutoCollect() {
        this.autoCollectEnabled = !this.autoCollectEnabled;
        
        this.autoCollectText.setText(
            this.autoCollectEnabled ? '✅ Auto-Collect' : '⬜ Auto-Collect'
        );
        
        console.log('[FactoryScene] Auto-collect:', this.autoCollectEnabled);
    }

    updateResourceDisplay() {
        const resources = this.gameStateManager.loadResources();
        
        this.resourceTexts.buffCoins.setText(`🪙 ${this.formatNumber(resources.buffCoins || 0)}`);
        this.resourceTexts.buffGems.setText(`💎 ${this.formatNumber(resources.buffGems || 0)}`);
    }

    showInsufficientFunds() {
        const text = this.add.text(this.scale.width / 2, this.scale.height / 2, 
            'Insufficient Buff Coins!', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#FF0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 50,
            duration: 1500,
            onComplete: () => text.destroy()
        });
    }

    getUnlockedLineCount() {
        // Start with 1 line unlocked, unlock more as player progresses
        return this.factoryState.unlockedLines || 1;
    }

    getUnlockCost(index) {
        return Math.pow(10, index + 1) * 100;
    }

    getUpgradeCost(level) {
        return Math.pow(2, level) * 50;
    }

    saveFactoryState() {
        const state = {
            unlockedLines: this.getUnlockedLineCount(),
            lines: this.productionLines.map(line => line.data)
        };
        
        this.gameStateManager.saveFactory(state);
    }

    setupEventListeners() {
        // Clean up on scene shutdown
        this.events.once('shutdown', this.cleanup, this);
    }

    returnToHub() {
        // Save factory state
        this.saveFactoryState();
        
        // Emit factory exited event
        this.events.emit(EventNames.FACTORY_EXITED);
        
        // Return to hub
        this.scene.start(SceneKeys.HUB);
    }

    cleanup() {
        // Stop timers
        if (this.productionTimer) {
            this.productionTimer.destroy();
        }
        
        // Save state
        this.saveFactoryState();
    }

    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toFixed(0);
    }
}