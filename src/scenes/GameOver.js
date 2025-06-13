import { Scene } from 'phaser';
import { GameStateManager, AudioManager } from '@features/core';
import { UIConfig } from '../constants/UIConfig';
import { SceneKeys } from '../constants/SceneKeys.js';

export class GameOver extends Scene {
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
        
        // Set background
        this.cameras.main.setBackgroundColor(0x000000);
        this.add.image(512, 384, 'background').setAlpha(0.3);
        
        // Add game completion overlay
        this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.7);

        // Add game logo if available
        if (this.textures.exists('logo')) {
            this.add.image(512, 120, 'logo')
                .setOrigin(0.5)
                .setScale(0.5);
        }
        
        // Add title
        this.add.text(512, 200, 'Game Complete!', UIConfig.text.title)
            .setOrigin(0.5);
        
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
        this.add.text(512, 300, `Levels Completed: ${completedLevels.length} / 5`, UIConfig.text.stats)
            .setOrigin(0.5);
        
        // Show collectibles collected
        this.add.text(512, 350, `Collectibles: ${collectibles.collected} / ${collectibles.total}`, UIConfig.text.stats)
            .setOrigin(0.5);
        
        // Show completion percentage
        const completionPercentage = Math.round(
            (completedLevels.length / 5 + collectibles.collected / collectibles.total) * 50
        );
        this.add.text(512, 400, `Completion: ${completionPercentage}%`, UIConfig.text.stats)
            .setOrigin(0.5);
        
        // Add congratulatory message
        let message = 'You completed the game!';
        
        if (completionPercentage < 50) {
            message = 'Good effort! Try to collect more items.';
        } else if (completionPercentage < 80) {
            message = 'Well done! Can you find all the collectibles?';
        } else if (completionPercentage < 100) {
            message = 'Amazing! You\'re almost at 100% completion!';
        } else {
            message = 'Perfect! You found everything!';
        }
        
        this.add.text(512, 470, message, UIConfig.text.message)
            .setOrigin(0.5);
    }
    
    /**
     * Create navigation buttons
     */
    createButtons() {
        // Create main menu button
        const menuButton = this.add.text(512, 550, 'Main Menu', UIConfig.text.button)
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
        const playAgainButton = this.add.text(512, 620, 'Play Again', UIConfig.text.button)
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

    update (time, delta)
    {
        // Placeholder update method for GameOver scene
    }
}
