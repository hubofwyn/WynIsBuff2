import { Scene } from 'phaser';
import { PlayerController } from '../modules/PlayerController';
import { LevelManager } from '../modules/LevelManager';
import { PhysicsManager } from '../modules/PhysicsManager';

export class Game extends Scene {
    constructor() {
        super('Game');
        console.log('[Game] Constructor called');
        
        // Game managers
        this.physicsManager = null;
        this.levelManager = null;
        this.playerController = null;
        
        // UI elements
        this.jumpText = null;
    }

    preload() {
        console.log('[Game] Preload called');
    }

    async create() {
        console.log('[Game] Create method started');
        
        try {
            // Initialize physics
            this.physicsManager = new PhysicsManager(this);
            const physicsInitialized = await this.physicsManager.initialize(0.0, 20.0);
            
            if (!physicsInitialized) {
                throw new Error('Failed to initialize physics');
            }
            
            // Set the background
            this.cameras.main.setBackgroundColor(0x87CEEB); // Sky blue
            if (this.textures.exists('background')) {
                this.add.image(512, 384, 'background').setAlpha(0.5);
                console.log('[Game] Background image added');
            } else {
                console.warn('[Game] Background texture not found');
            }

            // Add instructions text
            this.add.text(512, 100, 'WASD or Arrows to Move, SPACE to Jump (Triple Jump!)', {
                fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff',
                stroke: '#000000', strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5);
            console.log('[Game] Instructions text added');
            
            // Display jump counter
            this.jumpText = this.add.text(512, 150, 'Jumps Used: 0 / 3', {
                fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff',
                stroke: '#000000', strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5);
            console.log('[Game] Jump counter text added');

            // Create level manager and initialize level
            this.levelManager = new LevelManager(this, this.physicsManager.getWorld());
            this.levelManager.createGround();
            this.levelManager.createPlatforms();
            
            // Register level body-sprite mappings with physics manager
            this.physicsManager.registerBodySpriteMap(this.levelManager.getBodyToSpriteMap());
            
            // Create player controller
            this.playerController = new PlayerController(
                this,
                this.physicsManager.getWorld(),
                512, // x position
                300  // y position
            );
            
            // Register player body-sprite with physics manager
            this.physicsManager.registerBodySprite(
                this.playerController.getBody(),
                this.playerController.getSprite()
            );
            
            // Add ESC key for scene transition
            this.input.keyboard.once('keydown-ESC', () => {
                console.log('[Game] ESC pressed, transitioning to GameOver scene');
                this.scene.start('GameOver');
            });
            
            console.log('[Game] Create method completed successfully');
        } catch (error) {
            console.error('[Game] Error in create method:', error);
            // Display error on screen for easier debugging
            this.add.text(512, 400, 'ERROR: ' + error.message, {
                fontFamily: 'Arial', fontSize: 16, color: '#ff0000',
                align: 'center'
            }).setOrigin(0.5);
        }
    }

    update() {
        // Only proceed if physics is initialized
        if (!this.physicsManager || !this.physicsManager.isInitialized()) {
            return;
        }
        
        try {
            // Update physics (steps the world and updates sprites)
            this.physicsManager.update();
            
            // Update level elements
            if (this.levelManager) {
                this.levelManager.update();
            }
            
            // Update player
            if (this.playerController) {
                this.playerController.update(this.levelManager.getPlatforms(), this.jumpText);
            }
        } catch (error) {
            console.error('[Game] Error in update:', error);
        }
    }
}