import { Scene } from 'phaser';
import { GameStateManager } from '../modules/GameStateManager';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
        
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
        
        // Add title
        this.add.text(512, 200, 'Game Complete!', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);
        
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
        
        // Create stats text
        const statsStyle = {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        };
        
        // Show levels completed
        this.add.text(512, 300, `Levels Completed: ${completedLevels.length} / 5`, statsStyle)
            .setOrigin(0.5);
        
        // Show collectibles collected
        this.add.text(512, 350, `Collectibles: ${collectibles.collected} / ${collectibles.total}`, statsStyle)
            .setOrigin(0.5);
        
        // Show completion percentage
        const completionPercentage = Math.round(
            (completedLevels.length / 5 + collectibles.collected / collectibles.total) * 50
        );
        
        this.add.text(512, 400, `Completion: ${completionPercentage}%`, statsStyle)
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
        
        this.add.text(512, 470, message, {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
    }
    
    /**
     * Create navigation buttons
     */
    createButtons() {
        const buttonStyle = {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        };
        
        // Create main menu button
        const menuButton = this.add.text(512, 550, 'Main Menu', buttonStyle)
            .setOrigin(0.5)
            .setInteractive();
        
        menuButton.on('pointerover', () => {
            menuButton.setTint(0xffff00);
        });
        
        menuButton.on('pointerout', () => {
            menuButton.clearTint();
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
        
        // Create play again button
        const playAgainButton = this.add.text(512, 620, 'Play Again', buttonStyle)
            .setOrigin(0.5)
            .setInteractive();
        
        playAgainButton.on('pointerover', () => {
            playAgainButton.setTint(0xffff00);
        });
        
        playAgainButton.on('pointerout', () => {
            playAgainButton.clearTint();
        });
        
        playAgainButton.on('pointerdown', () => {
            this.scene.start('Game', { levelId: 'level1' });
        });
    }

    update (time, delta)
    {
        // Placeholder update method for GameOver scene
    }
}
