import { Scene } from 'phaser';
import { GameStateManager } from '../modules/GameStateManager';
import { AudioManager } from '../modules/AudioManager';
import { UIConfig } from '../constants/UIConfig';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
        
        // Game state manager for level progress
        this.gameStateManager = null;
    }

    create() {
        // Initialize game state manager
        this.gameStateManager = new GameStateManager();
        // Play title screen music
        AudioManager.getInstance().playMusic('proteinPixelAnthem');
        // Fade in camera
        this.cameras.main.fadeIn(UIConfig.animations.fadeInDuration);
        
        // Set background
        this.add.image(512, 384, 'background');
        
        // Add logo if available
        if (this.textures.exists('logo')) {
            this.add.image(512, 200, 'logo')
                .setOrigin(0.5);
        }
        
        // Add title
        this.add.text(512, 300, 'WynIsBuff2', UIConfig.text.heading)
            .setOrigin(0.5);
        
        // Create background panel
        const panelCfg = UIConfig.panel;
        this.add.rectangle(
            512,
            500,
            400,
            300,
            panelCfg.backgroundColor,
            panelCfg.backgroundAlpha
        ).setOrigin(0.5);
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
     * Create level selection buttons
     */
    createLevelSelection() {
        const levels = [
            { id: 'level1', name: 'First Steps', x: 512, y: 400 },
            { id: 'level2', name: 'Double Trouble', x: 512, y: 450 },
            { id: 'level3', name: 'Triple Threat', x: 512, y: 500 }
        ];
        
        // Get completed levels
        const completedLevels = this.gameStateManager.getCompletedLevels();
        
        // Create a button for each level
        levels.forEach((level, index) => {
            // Determine if level is unlocked
            const isUnlocked = index === 0 || completedLevels.includes(`level${index}`);
            
            // Get level progress
            const progress = this.gameStateManager.getLevelProgress(level.id);
            
            // Create button text with completion status
            let buttonText = level.name;
            
            if (progress) {
                buttonText += ` (${progress.collectiblesCollected}/${progress.totalCollectibles})`;
            }
            
            // Create button with UIConfig styles
            const btnCfg = UIConfig.menuButton;
            const buttonStyle = {
                fontFamily: btnCfg.fontFamily,
                fontSize: btnCfg.fontSize,
                color: isUnlocked ? btnCfg.color : btnCfg.disabledColor,
                stroke: btnCfg.stroke,
                strokeThickness: btnCfg.strokeThickness,
                align: btnCfg.align
            };
            const button = this.add.text(level.x, level.y, buttonText, buttonStyle)
                .setOrigin(0.5)
                // start small and transparent for animation
                .setScale(UIConfig.animations.scaleIn.start)
                .setAlpha(0);
            // Animate button entrance
            this.tweens.add({
                targets: button,
                alpha: 1,
                scale: UIConfig.animations.scaleIn.end,
                ease: 'Power2',
                duration: UIConfig.animations.scaleIn.duration,
                delay: index * 100
            });
            
            // Add completed indicator if level is completed
            if (completedLevels.includes(level.id)) {
                this.add.text(level.x - 150, level.y, '✓', {
                    fontFamily: 'Arial',
                    fontSize: 24,
                    color: '#00ff00',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setOrigin(0.5);
            }
            
            // Make button interactive if unlocked
            if (isUnlocked) {
                button.setInteractive({ useHandCursor: true });
                button.on('pointerover', () => {
                    button.setTint(btnCfg.hoverTint);
                    AudioManager.getInstance().playSFX('hover');
                });
                button.on('pointerout', () => button.clearTint());
                button.on('pointerdown', () => {
                    AudioManager.getInstance().playSFX('click');
                    this.scene.start('Game', { levelId: level.id });
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
