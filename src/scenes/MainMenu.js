import { Scene } from 'phaser';
import { GameStateManager, AudioManager } from '@features/core';
import { UIConfig } from '../constants/UIConfig';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets, AudioAssets } from '../constants/Assets.js';

export class MainMenu extends Scene {
    constructor() {
        super(SceneKeys.MAIN_MENU);
        
        // Game state manager for level progress
        this.gameStateManager = null;
    }

    create() {
        // Initialize game state manager
        this.gameStateManager = new GameStateManager();
        // Play title screen music
        AudioManager.getInstance().playMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);
        // Fade in camera
        this.cameras.main.fadeIn(UIConfig.animations.fadeInDuration);
        
        // Set background
        this.add.image(512, 384, ImageAssets.BACKGROUND);
        
        // Add logo if available
        if (this.textures.exists(ImageAssets.LOGO)) {
            this.add.image(512, 200, ImageAssets.LOGO)
                .setOrigin(0.5);
        }
        
        // Add title
        this.add.text(512, 300, 'WynIsBuff2', UIConfig.text.heading)
            .setOrigin(0.5);
        
        // Create a more dynamic background panel with gradient effect
        const panelCfg = UIConfig.panel;
        const levelPanel = this.add.graphics();
        levelPanel.fillStyle(panelCfg.backgroundColor, panelCfg.backgroundAlpha);
        levelPanel.fillRoundedRect(262, 350, 500, 350, panelCfg.borderRadius);
        levelPanel.lineStyle(panelCfg.borderWidth, panelCfg.borderColor);
        levelPanel.strokeRoundedRect(262, 350, 500, 350, panelCfg.borderRadius);
        
        // Add section title
        this.add.text(512, 380, 'Select Level', {
            ...UIConfig.text.heading,
            fontSize: '36px'
        }).setOrigin(0.5);
        
        // Create level selection UI
        this.createLevelSelection();
        // Add reset progress button
        this.createResetButton();
    }

    update (time, delta)
    {
        // Placeholder update method for MainMenu scene
    }
    
    /**
     * Create level selection buttons with improved card-based design
     */
    createLevelSelection() {
        const levels = [
            { 
                id: 'level1', 
                name: 'First Steps', 
                description: 'Learn the basics',
                color: '#4ECDC4',
                difficulty: 1
            },
            { 
                id: 'level2', 
                name: 'Double Trouble', 
                description: 'Master double jumps',
                color: '#FFE66D',
                difficulty: 2,
                locked: true
            },
            { 
                id: 'level3', 
                name: 'Triple Threat', 
                description: 'Ultimate challenge',
                color: '#FF6B9D',
                difficulty: 3,
                locked: true
            }
        ];
        
        // Get completed levels
        const completedLevels = this.gameStateManager.getCompletedLevels();
        
        // Create level cards
        const cardWidth = 140;
        const cardHeight = 180;
        const spacing = 20;
        const startX = 512 - (levels.length * (cardWidth + spacing) - spacing) / 2 + cardWidth / 2;
        
        levels.forEach((level, index) => {
            const x = startX + index * (cardWidth + spacing);
            const y = 490;
            
            // Determine if level is unlocked
            const isUnlocked = index === 0 || completedLevels.includes(`level${index}`);
            
            // Create card container
            const cardContainer = this.add.container(x, y);
            
            // Card background
            const cardBg = this.add.graphics();
            const bgColor = isUnlocked ? Phaser.Display.Color.HexStringToColor(level.color).color : 0x333333;
            const bgAlpha = isUnlocked ? 0.9 : 0.5;
            
            cardBg.fillStyle(bgColor, bgAlpha);
            cardBg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 12);
            cardBg.lineStyle(3, isUnlocked ? 0xFFFFFF : 0x666666, isUnlocked ? 0.8 : 0.3);
            cardBg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 12);
            
            // Level number
            const levelNumber = this.add.text(0, -cardHeight/2 + 25, `${index + 1}`, {
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: '48px',
                color: isUnlocked ? '#FFFFFF' : '#666666',
                stroke: isUnlocked ? '#000000' : '#333333',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            // Level name
            const levelName = this.add.text(0, -10, level.name, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '18px',
                color: isUnlocked ? '#FFFFFF' : '#666666',
                align: 'center',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5);
            
            // Description
            const description = this.add.text(0, 25, level.description, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: isUnlocked ? '#E0E0E0' : '#555555',
                align: 'center',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5);
            
            // Progress or lock icon
            if (isUnlocked) {
                const progress = this.gameStateManager.getLevelProgress(level.id);
                if (progress) {
                    // Progress bar
                    const barWidth = cardWidth - 40;
                    const barHeight = 8;
                    const barY = cardHeight/2 - 25;
                    
                    // Background bar
                    cardBg.fillStyle(0x000000, 0.5);
                    cardBg.fillRoundedRect(-barWidth/2, barY - barHeight/2, barWidth, barHeight, 4);
                    
                    // Progress fill
                    const progressPercent = progress.totalCollectibles > 0 
                        ? progress.collectiblesCollected / progress.totalCollectibles 
                        : 0;
                    if (progressPercent > 0) {
                        cardBg.fillStyle(0x00FF00, 0.8);
                        cardBg.fillRoundedRect(-barWidth/2, barY - barHeight/2, barWidth * progressPercent, barHeight, 4);
                    }
                    
                    // Progress text
                    const progressText = this.add.text(0, barY, 
                        `${progress.collectiblesCollected}/${progress.totalCollectibles}`, {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '12px',
                        color: '#FFFFFF'
                    }).setOrigin(0.5);
                    cardContainer.add(progressText);
                }
            } else {
                // Lock icon
                const lockIcon = this.add.text(0, cardHeight/2 - 25, '🔒', {
                    fontSize: '24px'
                }).setOrigin(0.5);
                cardContainer.add(lockIcon);
            }
            
            // Completion checkmark
            if (completedLevels.includes(level.id)) {
                const checkmark = this.add.text(cardWidth/2 - 15, -cardHeight/2 + 15, '✓', {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#00FF00',
                    stroke: '#000000',
                    strokeThickness: 3
                }).setOrigin(0.5);
                cardContainer.add(checkmark);
            }
            
            // Add all elements to container
            cardContainer.add([cardBg, levelNumber, levelName, description]);
            
            // Interactive hitbox
            const hitArea = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0)
                .setInteractive({ useHandCursor: isUnlocked });
            cardContainer.add(hitArea);
            
            // Animate entrance
            cardContainer.setAlpha(0).setScale(0.8);
            this.tweens.add({
                targets: cardContainer,
                alpha: 1,
                scale: 1,
                duration: UIConfig.animations.scaleIn.duration,
                ease: UIConfig.animations.scaleIn.ease,
                delay: index * 100
            });
            
            // Make interactive if unlocked
            if (isUnlocked) {
                hitArea.on('pointerover', () => {
                    AudioManager.getInstance().playSFX('hover');
                    this.tweens.add({
                        targets: cardContainer,
                        scale: 1.05,
                        duration: 200,
                        ease: 'Power2.easeOut'
                    });
                });
                
                hitArea.on('pointerout', () => {
                    this.tweens.add({
                        targets: cardContainer,
                        scale: 1,
                        duration: 200,
                        ease: 'Power2.easeOut'
                    });
                });
                
                hitArea.on('pointerdown', () => {
                    AudioManager.getInstance().playSFX('click');
                    this.tweens.add({
                        targets: cardContainer,
                        scale: 0.95,
                        duration: 100,
                        ease: 'Power2.easeOut',
                        yoyo: true,
                        onComplete: () => {
                            this.cameras.main.fadeOut(300);
                            this.time.delayedCall(300, () => {
                                this.scene.start(SceneKeys.GAME, { levelId: level.id });
                            });
                        }
                    });
                });
            }
        });
    }
    
    /**
     * Create reset progress button
     */
    createResetButton() {
        const resetButton = this.add.text(512, 670, 'Reset Progress', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setInteractive();
        
        resetButton.on('pointerover', () => {
            resetButton.setTint(0xffff00);
            AudioManager.getInstance().playSFX('hover');
        });
        
        resetButton.on('pointerout', () => {
            resetButton.clearTint();
        });
        
        resetButton.on('pointerdown', () => {
            AudioManager.getInstance().playSFX('click');
            // Create confirmation dialog
            const confirmBg = this.add.rectangle(512, 384, 400, 200, 0x000000, 0.8);
            
            const confirmText = this.add.text(512, 350, 'Reset all progress?', {
                fontFamily: 'Arial',
                fontSize: 24,
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            
            const yesButton = this.add.text(450, 400, 'Yes', {
                fontFamily: 'Arial',
                fontSize: 20,
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5).setInteractive();
            
            const noButton = this.add.text(550, 400, 'No', {
                fontFamily: 'Arial',
                fontSize: 20,
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5).setInteractive();
            
            // Yes button
            yesButton.on('pointerover', () => {
                yesButton.setTint(0xffff00);
                AudioManager.getInstance().playSFX('hover');
            });
            yesButton.on('pointerout', () => yesButton.clearTint());
            yesButton.on('pointerdown', () => {
                AudioManager.getInstance().playSFX('click');
                this.gameStateManager.resetProgress();
                this.scene.restart();
            });
            
            // No button
            noButton.on('pointerover', () => {
                noButton.setTint(0xffff00);
                AudioManager.getInstance().playSFX('hover');
            });
            noButton.on('pointerout', () => noButton.clearTint());
            noButton.on('pointerdown', () => {
                AudioManager.getInstance().playSFX('click');
                confirmBg.destroy();
                confirmText.destroy();
                yesButton.destroy();
                noButton.destroy();
            });
        });
    }
}
