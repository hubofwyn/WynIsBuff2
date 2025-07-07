import { Scene } from 'phaser';
import { PlayerController } from '@features/player';
import { ParticleManager, CameraManager, ColorManager } from '@features/effects';
import { LevelManager, PhysicsManager, EventSystem, InputManager, UIManager, GameStateManager, AudioManager } from '@features/core';
import { EventNames } from '../constants/EventNames';
import { SceneKeys } from '../constants/SceneKeys.js';
import { AudioAssets } from '../constants/Assets.js';

export class Game extends Scene {
    constructor() {
        super(SceneKeys.GAME);
        console.log('[Game] Constructor called');
        
        // Game managers
        this.eventSystem = null;
        this.physicsManager = null;
        this.levelManager = null;
        this.playerController = null;
        this.uiManager = null;
        this.gameStateManager = null;
        
        // Effect managers
        this.particleManager = null;
        this.cameraManager = null;
        this.colorManager = null;
        
        // Level data
        this.currentLevelId = 'level1';
    }

    init(data) {
        console.log('[Game] Init called with data:', data);
        
        // If a level ID is provided, use it
        if (data && data.levelId) {
            this.currentLevelId = data.levelId;
        }
    }

    preload() {
        console.log('[Game] Preload called');
    }

    async create() {
            console.log('[Game] Create method started');
            // Play in-level music
            const audio = AudioManager.getInstance();
            audio.stopMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);
            audio.playMusic(AudioAssets.HYPER_BUFF_BLITZ);
        
        try {
            // Initialize event system
            this.eventSystem = new EventSystem();
            this.eventSystem.setDebugMode(true);
            
            // Initialize game state manager
            this.gameStateManager = GameStateManager.getInstance();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize input manager
            this.inputManager = InputManager.getInstance();
            this.inputManager.init(this, this.eventSystem);
            
            // Initialize physics with classic action game feel (like Mario/Sonic)
            this.physicsManager = PhysicsManager.getInstance();
            const physicsInitialized = await this.physicsManager.init(this, this.eventSystem, 0.0, 35.0);
            
            if (!physicsInitialized) {
                throw new Error('Failed to initialize physics');
            }
            
            // Initialize UI Manager
            this.uiManager = UIManager.getInstance();
            this.uiManager.init(this, this.eventSystem);
            
            // Create UI elements
            this.createUIElements();
            
            // Initialize effect managers
            this.particleManager = new ParticleManager(this, this.eventSystem);
            this.cameraManager = new CameraManager(this, this.eventSystem);
            this.colorManager = new ColorManager(this, this.eventSystem);
            console.log('[Game] Effect managers initialized');
            // Apply persisted graphics and accessibility settings
            const settings = this.gameStateManager.settings || {};
            // Graphics quality
            if (settings.graphicsQuality) {
                this.particleManager.setQuality(settings.graphicsQuality);
                this.cameraManager.setQuality(settings.graphicsQuality);
            }
            // Accessibility settings
            const acc = settings.accessibility || {};
            if (acc.palette) {
                this.colorManager.applyPalette(acc.palette);
            }
            if (acc.highContrast && this.uiManager) {
                this.uiManager.applyHighContrast(acc.highContrast);
            }
            if (acc.subtitles && this.uiManager) {
                this.uiManager.showSubtitles(acc.subtitles);
            }
            
            // Create level manager and load the specified level
            this.levelManager = new LevelManager(this, this.physicsManager.getWorld(), this.eventSystem);
            this.levelManager.loadLevel(this.currentLevelId);
            
            // Register level body-sprite mappings with physics manager
            this.physicsManager.registerBodySpriteMap(this.levelManager.getBodyToSpriteMap());
            
            // Create player controller at the level's start position with selected character
            const levelConfig = this.levelManager.getCurrentLevelConfig();
            const startX = levelConfig && levelConfig.playerStart ? levelConfig.playerStart.x : 512;
            const startY = levelConfig && levelConfig.playerStart ? levelConfig.playerStart.y : 300;
            const selectedKey = this.gameStateManager.getSelectedCharacter();
            console.log('[Game] Creating player with character key:', selectedKey);
            console.log('[Game] Available textures:', Object.keys(this.textures.list));
            this.playerController = new PlayerController(
                this,
                this.physicsManager.getWorld(),
                this.eventSystem,
                startX,
                startY,
                selectedKey
            );
            
            // Register player body-sprite with physics manager
            this.physicsManager.registerBodySprite(
                this.playerController.getBody(),
                this.playerController.getSprite()
            );
            
            // Listen for Pause events via InputManager (ESC key)
            this.eventSystem.on(EventNames.PAUSE, () => {
                console.log('[Game] Pause event received, launching PauseScene');
                // Pause the game and show pause overlay
                this.scene.launch(SceneKeys.PAUSE);
                this.scene.pause();
            });
            // Listen for Level Reset events via InputManager (R key)
            this.eventSystem.on(EventNames.LEVEL_RESET, () => {
                console.log('[Game] Level reset event received, resetting level');
                this.levelManager.resetLevel();
            });
            
            // Emit game init event
            this.eventSystem.emit(EventNames.GAME_INIT, {
                scene: 'Game',
                levelId: this.currentLevelId
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
    
    /**
     * Create UI elements for the game
     */
    createUIElements() {
        const instructionsStyle = {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        };
        
        const smallTextStyle = {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'left'
        };
        
        // Create UI groups
        this.uiManager.createGroup('gameUI');
        this.uiManager.createGroup('levelCompleteUI');
        
        // Hide level complete UI initially
        this.uiManager.hideGroup('levelCompleteUI');
        
        // Add instructions text
        this.uiManager.createText(
            'instructions',
            512, 100,
            'WASD or Arrows to Move, SPACE to Jump (Triple Jump!)',
            instructionsStyle,
            true
        ).setOrigin(0.5);
        this.uiManager.addToGroup('gameUI', 'instructions');
        
        // Display jump counter
        this.uiManager.createText(
            'jumpCounter',
            512, 150,
            'Jumps Used: 0 / 3',
            instructionsStyle,
            true
        ).setOrigin(0.5);
        this.uiManager.addToGroup('gameUI', 'jumpCounter');
        
        // Display level name
        this.uiManager.createText(
            'levelName',
            20, 20,
            'Level: 1',
            smallTextStyle,
            false
        );
        this.uiManager.addToGroup('gameUI', 'levelName');
        
        // Display collectibles counter
        this.uiManager.createText(
            'collectiblesCounter',
            20, 50,
            'Collectibles: 0/0',
            smallTextStyle,
            false
        );
        this.uiManager.addToGroup('gameUI', 'collectiblesCounter');
        
        // Create level complete UI
        const levelCompleteText = this.uiManager.createText(
            'levelCompleteText',
            512, 300,
            'Level Complete!',
            {
                fontFamily: 'Arial Black',
                fontSize: 48,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            },
            true
        ).setOrigin(0.5);
        this.uiManager.addToGroup('levelCompleteUI', 'levelCompleteText');
        
        // Add stats text
        this.uiManager.createText(
            'levelCompleteStats',
            512, 380,
            'Collectibles: 0/0',
            {
                fontFamily: 'Arial',
                fontSize: 24,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            },
            true
        ).setOrigin(0.5);
        this.uiManager.addToGroup('levelCompleteUI', 'levelCompleteStats');
        
        // Add continue button
        const continueButton = this.uiManager.createText(
            'continueButton',
            512, 450,
            'Continue',
            {
                fontFamily: 'Arial Black',
                fontSize: 32,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            },
            true
        ).setOrigin(0.5).setInteractive();
        
        continueButton.on('pointerdown', () => {
            AudioManager.getInstance().playSFX('click');
            this.levelManager.nextLevel();
        });
        
        continueButton.on('pointerover', () => {
            continueButton.setTint(0xffff00);
            AudioManager.getInstance().playSFX('hover');
        });
        
        continueButton.on('pointerout', () => {
            continueButton.clearTint();
        });
        
        this.uiManager.addToGroup('levelCompleteUI', 'continueButton');
        
        console.log('[Game] UI elements created');
    }
    
    /**
     * Set up event listeners for the game
     */
    setupEventListeners() {
        // Listen for player land events
        this.eventSystem.on(EventNames.PLAYER_LAND, (data) => {
            // Screen shake is now handled by CameraManager
            if (this.cameraManager) {
                console.log('[Game] Player landed, CameraManager handling effects');
            }
            // Play landing sound
            AudioManager.getInstance().playSFX('land');
        });
        
        // Listen for player jump events
        this.eventSystem.on(EventNames.PLAYER_JUMP, (data) => {
            console.log('[Game] Player jumped, effect managers handling feedback');
            // Play jump sound effect
            AudioManager.getInstance().playSFX('jump');
        });
        
        // Listen for collectible collected events
        this.eventSystem.on(EventNames.COLLECTIBLE_COLLECTED, (data) => {
            console.log('[Game] Collectible collected:', data);
            // Play pickup sound effect
            AudioManager.getInstance().playSFX('pickup');
            
            // Update collectibles counter
            this.uiManager.updateText(
                'collectiblesCounter',
                `Collectibles: ${data.totalCollected}/${data.totalCollectibles}`
            );
            
            // Create particle effect at collection position
            if (this.particleManager) {
                this.particleManager.createParticles(
                    data.position.x,
                    data.position.y,
                    'collectible',
                    {
                        speed: 100,
                        scale: { start: 0.5, end: 0 },
                        quantity: 10,
                        lifespan: 500
                    }
                );
            }
        });
        
        // Listen for level complete events
        this.eventSystem.on(EventNames.LEVEL_COMPLETE, (data) => {
            console.log('[Game] Level complete:', data);
            
            // Save progress
            if (this.gameStateManager) {
                this.gameStateManager.saveProgress(
                    data.levelId,
                    data.collectiblesCollected,
                    data.totalCollectibles
                );
            }
            
            // Update level complete UI
            this.uiManager.updateText(
                'levelCompleteText',
                `Level ${data.levelId.replace('level', '')} Complete!`
            );
            
            this.uiManager.updateText(
                'levelCompleteStats',
                `Collectibles: ${data.collectiblesCollected}/${data.totalCollectibles}`
            );
            
            // Show level complete UI
            this.uiManager.hideGroup('gameUI');
            this.uiManager.showGroup('levelCompleteUI');
        });
        
        // Listen for level loaded events
        this.eventSystem.on(EventNames.LEVEL_LOADED, (data) => {
            console.log('[Game] Level loaded:', data);
            
            // Update level name
            this.uiManager.updateText(
                'levelName',
                `Level: ${data.name}`
            );
            
            // Reset collectibles counter
            this.uiManager.updateText(
                'collectiblesCounter',
                'Collectibles: 0/0'
            );
            
            // Show game UI, hide level complete UI
            this.uiManager.showGroup('gameUI');
            this.uiManager.hideGroup('levelCompleteUI');
        });
        
        // Listen for collision events
        this.eventSystem.on(EventNames.COLLISION_START, (data) => {
            // Handled by the level manager
        });
    }

    update(time, delta) {
        // Only proceed if physics is initialized
        if (!this.physicsManager || !this.physicsManager.isInitialized()) {
            return;
        }
        
        try {
            // Update physics (steps the world and updates sprites)
            this.physicsManager.update();
            
            // Update level elements with delta time
            if (this.levelManager) {
                this.levelManager.update(delta);
            }
            
            // Update player
            if (this.playerController) {
                this.playerController.update(this.levelManager.getPlatforms());
            }
            // Update enemies
            if (this.enemies) {
                this.enemies.forEach(enemy => {
                    try {
                        enemy.update(time, delta);
                    } catch (err) {
                        console.error('[Game] Error updating enemy:', err);
                    }
                });
            }
            
            // Update boss
            if (this.boss) {
                try {
                    this.boss.update(time, delta);
                } catch (err) {
                    console.error('[Game] Error updating boss:', err);
                }
            }
        } catch (error) {
            console.error('[Game] Error in update:', error);
        }
    }
}
