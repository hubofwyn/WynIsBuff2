import { Scene } from 'phaser';
import { PlayerController } from '../modules/player/PlayerController';
import { LevelManager } from '../modules/LevelManager';
import { PhysicsManager } from '../modules/PhysicsManager';
import { EventSystem } from '../modules/EventSystem';
import { EventNames } from '../constants/EventNames';
import { UIManager } from '../modules/UIManager';
import { ParticleManager } from '../modules/effects/ParticleManager';
import { CameraManager } from '../modules/effects/CameraManager';
import { ColorManager } from '../modules/effects/ColorManager';

export class Game extends Scene {
    constructor() {
        super('Game');
        console.log('[Game] Constructor called');
        
        // Game managers
        this.eventSystem = null;
        this.physicsManager = null;
        this.levelManager = null;
        this.playerController = null;
        this.uiManager = null;
        
        // Effect managers
        this.particleManager = null;
        this.cameraManager = null;
        this.colorManager = null;
    }

    preload() {
        console.log('[Game] Preload called');
    }

    async create() {
        console.log('[Game] Create method started');
        
        try {
            // Initialize event system
            this.eventSystem = new EventSystem();
            this.eventSystem.setDebugMode(true);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize physics
            this.physicsManager = new PhysicsManager(this, this.eventSystem);
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

            // Initialize UI Manager
            this.uiManager = new UIManager(this, this.eventSystem);
            
            // Create UI elements
            const instructionsStyle = {
                fontFamily: 'Arial Black',
                fontSize: 20,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            };
            
            // Add instructions text
            this.uiManager.createText(
                'instructions',
                512, 100,
                'WASD or Arrows to Move, SPACE to Jump (Triple Jump!)',
                instructionsStyle,
                true
            ).setOrigin(0.5);
            console.log('[Game] Instructions text added');
            
            // Display jump counter
            this.uiManager.createText(
                'jumpCounter',
                512, 150,
                'Jumps Used: 0 / 3',
                instructionsStyle,
                true
            ).setOrigin(0.5);
            console.log('[Game] Jump counter text added');

            // Create level manager and initialize level
            this.levelManager = new LevelManager(this, this.physicsManager.getWorld(), this.eventSystem);
            this.levelManager.createGround();
            this.levelManager.createPlatforms();
            
            // Register level body-sprite mappings with physics manager
            this.physicsManager.registerBodySpriteMap(this.levelManager.getBodyToSpriteMap());
            
            // Create player controller
            this.playerController = new PlayerController(
                this,
                this.physicsManager.getWorld(),
                this.eventSystem,
                512, // x position
                300  // y position
            );
            
            // Register player body-sprite with physics manager
            this.physicsManager.registerBodySprite(
                this.playerController.getBody(),
                this.playerController.getSprite()
            );
            
            // Initialize effect managers
            this.particleManager = new ParticleManager(this, this.eventSystem);
            this.cameraManager = new CameraManager(this, this.eventSystem);
            this.colorManager = new ColorManager(this, this.eventSystem);
            
            console.log('[Game] Effect managers initialized');
            
            // Add ESC key for scene transition
            this.input.keyboard.once('keydown-ESC', () => {
                console.log('[Game] ESC pressed, transitioning to GameOver scene');
                this.scene.start('GameOver');
            });
            
            // Emit game init event
            this.eventSystem.emit(EventNames.GAME_INIT, { scene: 'Game' });
            
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
    
    /**
     * Set up event listeners for the game
     */
    setupEventListeners() {
        // Listen for player land events
        this.eventSystem.on(EventNames.PLAYER_LAND, (data) => {
            // Screen shake is now handled by CameraManager
            if (this.cameraManager) {
                // The CameraManager listens for these events directly
                console.log('[Game] Player landed, CameraManager handling effects');
            }
        });
        
        // Listen for player jump events
        this.eventSystem.on(EventNames.PLAYER_JUMP, (data) => {
            console.log('[Game] Player jumped, effect managers handling feedback');
            // Visual and audio feedback is handled by the effect managers
        });
        
        // Note: UI updates are handled by the UIManager
        // Note: Particle effects are handled by the ParticleManager
        // Note: Color transitions are handled by the ColorManager
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
                this.playerController.update(this.levelManager.getPlatforms());
            }
        } catch (error) {
            console.error('[Game] Error in update:', error);
        }
    }
}