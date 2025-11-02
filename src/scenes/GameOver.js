import { BaseScene, GameStateManager, AudioManager } from '@features/core';

import { UIConfig } from '../constants/UIConfig.js';
import { SceneKeys } from '../constants/SceneKeys.js';

export class GameOver extends BaseScene {
    constructor() {
        super(SceneKeys.GAME_OVER);

        // Game state manager for level progress
        this.gameStateManager = null;
    }

    init(data) {
        // Store any data passed from the previous scene
        this.sceneData = data || {};
    }

    create() {
        // Initialize game state manager
        this.gameStateManager = new GameStateManager();

        // Check if this is a dramatic explosion game over
        if (this.sceneData.dramatic) {
            this.createDramaticGameOver();
        } else {
            this.createNormalGameOver();
        }
    }

    createDramaticGameOver() {
        // EXTREME DRAMATIC GAME OVER!

        // Black background with red tint
        this.cameras.main.setBackgroundColor(0x000000);

        // Flash effect
        this.cameras.main.flash(1000, 255, 0, 0);

        // Shake effect
        this.cameras.main.shake(2000, 0.02);

        // Add dramatic red overlay
        const overlay = this.add.rectangle(512, 384, 1024, 768, 0xff0000, 0.3);

        // Pulsing effect
        this.tweens.add({
            targets: overlay,
            alpha: { from: 0.1, to: 0.5 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
        });

        // MASSIVE GAME OVER TEXT
        const gameOverText = this.add
            .text(512, 300, 'GAME OVER', {
                fontFamily: 'Impact, Arial Black',
                fontSize: '120px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 10,
                shadow: {
                    offsetX: 0,
                    offsetY: 0,
                    color: '#ff0000',
                    blur: 20,
                    stroke: true,
                    fill: true,
                },
            })
            .setOrigin(0.5)
            .setScale(0);

        // Dramatic entrance animation
        this.tweens.add({
            targets: gameOverText,
            scale: { from: 0, to: 1.5 },
            angle: { from: -720, to: 0 },
            duration: 1000,
            ease: 'Back.Out',
            onComplete: () => {
                // Add shake to text
                this.tweens.add({
                    targets: gameOverText,
                    x: '+=10',
                    y: '+=10',
                    duration: 50,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Power0',
                });
            },
        });

        // Explosion message
        const explosionText = this.add
            .text(512, 450, 'YOU EXPLODED!!!', {
                fontFamily: 'Arial Black',
                fontSize: '48px',
                color: '#ffff00',
                stroke: '#ff0000',
                strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setAlpha(0);

        this.time.delayedCall(1000, () => {
            this.tweens.add({
                targets: explosionText,
                alpha: 1,
                scale: { from: 0.5, to: 1.2 },
                duration: 500,
                ease: 'Power2',
                yoyo: true,
                repeat: -1,
            });
        });

        // Warning message
        const warningText = this.add
            .text(512, 550, 'NEVER ATTEMPT A FOURTH JUMP DURING COOLDOWN!', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center',
            })
            .setOrigin(0.5)
            .setAlpha(0);

        this.time.delayedCall(1500, () => {
            this.tweens.add({
                targets: warningText,
                alpha: 1,
                duration: 1000,
            });
        });

        // Add explosion particles in background
        this.time.addEvent({
            delay: 100,
            callback: () => {
                const x = Phaser.Math.Between(0, 1024);
                const y = Phaser.Math.Between(0, 768);
                const particle = this.add.circle(
                    x,
                    y,
                    Phaser.Math.Between(5, 20),
                    Phaser.Math.Between(0xff0000, 0xffff00)
                );

                this.tweens.add({
                    targets: particle,
                    scale: 0,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => particle.destroy(),
                });
            },
            repeat: -1,
        });

        // Dramatic buttons
        this.time.delayedCall(2000, () => {
            this.createDramaticButtons();
        });
    }

    createNormalGameOver() {
        // Set background
        this.cameras.main.setBackgroundColor(0x000000);
        this.add.image(512, 384, 'background').setAlpha(0.3);

        // Add game completion overlay
        this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.7);

        // Add game logo if available
        if (this.textures.exists('logo')) {
            this.add.image(512, 120, 'logo').setOrigin(0.5).setScale(0.5);
        }

        // Add title
        this.add.text(512, 200, 'Game Complete!', UIConfig.text.title).setOrigin(0.5);

        // Show game stats
        this.showGameStats();

        // Add buttons
        this.createButtons();
    }

    /**
     * Show game statistics
     */
    showGameStats() {
        // Get total collectibles
        const collectibles = this.gameStateManager.getTotalCollectibles();

        // Get completed levels
        const completedLevels = this.gameStateManager.getCompletedLevels();

        // Show levels completed
        this.add
            .text(512, 300, `Levels Completed: ${completedLevels.length} / 5`, UIConfig.text.stats)
            .setOrigin(0.5);

        // Show collectibles collected
        this.add
            .text(
                512,
                350,
                `Collectibles: ${collectibles.collected} / ${collectibles.total}`,
                UIConfig.text.stats
            )
            .setOrigin(0.5);

        // Show completion percentage
        const completionPercentage = Math.round(
            (completedLevels.length / 5 + collectibles.collected / collectibles.total) * 50
        );
        this.add
            .text(512, 400, `Completion: ${completionPercentage}%`, UIConfig.text.stats)
            .setOrigin(0.5);

        // Add congratulatory message
        let message = 'You completed the game!';

        if (completionPercentage < 50) {
            message = 'Good effort! Try to collect more items.';
        } else if (completionPercentage < 80) {
            message = 'Well done! Can you find all the collectibles?';
        } else if (completionPercentage < 100) {
            message = "Amazing! You're almost at 100% completion!";
        } else {
            message = 'Perfect! You found everything!';
        }

        this.add.text(512, 470, message, UIConfig.text.message).setOrigin(0.5);
    }

    /**
     * Create navigation buttons
     */
    createButtons() {
        // Create main menu button
        const menuButton = this.add
            .text(512, 550, 'Main Menu', UIConfig.text.button)
            .setOrigin(0.5)
            .setInteractive();

        menuButton.on('pointerover', () => {
            menuButton.setTint(0xffff00);
            AudioManager.getInstance().playSFX('hover');
        });

        menuButton.on('pointerout', () => {
            menuButton.clearTint();
        });

        menuButton.on('pointerdown', () => {
            AudioManager.getInstance().playSFX('click');
            this.scene.start(SceneKeys.MAIN_MENU);
        });

        // Create play again button
        const playAgainButton = this.add
            .text(512, 620, 'Play Again', UIConfig.text.button)
            .setOrigin(0.5)
            .setInteractive();

        playAgainButton.on('pointerover', () => {
            playAgainButton.setTint(0xffff00);
            AudioManager.getInstance().playSFX('hover');
        });

        playAgainButton.on('pointerout', () => {
            playAgainButton.clearTint();
        });

        playAgainButton.on('pointerdown', () => {
            AudioManager.getInstance().playSFX('click');
            this.scene.start(SceneKeys.GAME, { levelId: 'level1' });
        });
    }

    /**
     * Create dramatic buttons for explosion game over
     */
    createDramaticButtons() {
        // Try again button with warning
        const tryAgainButton = this.add
            .text(512, 650, 'TRY AGAIN (IF YOU DARE)', {
                fontFamily: 'Arial Black',
                fontSize: '32px',
                color: '#ff0000',
                stroke: '#ffffff',
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setInteractive()
            .setScale(0);

        // Entrance animation
        this.tweens.add({
            targets: tryAgainButton,
            scale: 1,
            duration: 500,
            ease: 'Back.Out',
        });

        // Hover effects
        tryAgainButton.on('pointerover', () => {
            tryAgainButton.setScale(1.2);
            tryAgainButton.setColor('#ffff00');
            AudioManager.getInstance().playSFX('hover');

            // Add warning shake
            this.tweens.add({
                targets: tryAgainButton,
                angle: { from: -5, to: 5 },
                duration: 100,
                yoyo: true,
                repeat: 2,
            });
        });

        tryAgainButton.on('pointerout', () => {
            tryAgainButton.setScale(1);
            tryAgainButton.setColor('#ff0000');
        });

        tryAgainButton.on('pointerdown', () => {
            AudioManager.getInstance().playSFX('click');
            // Flash before restart
            this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(500, () => {
                this.scene.start(SceneKeys.GAME, { levelId: 'level1' });
            });
        });

        // Main menu button
        const menuButton = this.add
            .text(512, 720, 'FLEE TO MAIN MENU', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setInteractive()
            .setAlpha(0);

        this.time.delayedCall(500, () => {
            this.tweens.add({
                targets: menuButton,
                alpha: 1,
                duration: 500,
            });
        });

        menuButton.on('pointerover', () => {
            menuButton.setTint(0xffff00);
            AudioManager.getInstance().playSFX('hover');
        });

        menuButton.on('pointerout', () => {
            menuButton.clearTint();
        });

        menuButton.on('pointerdown', () => {
            AudioManager.getInstance().playSFX('click');
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start(SceneKeys.MAIN_MENU);
            });
        });
    }

    update(_time, _delta) {
        // Placeholder update method for GameOver scene
    }
}
