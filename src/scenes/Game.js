import { Scene } from 'phaser';
import { PlayerController } from '@features/player';
import { ParticleManager, CameraManager, ColorManager } from '@features/effects';
import { PhysicsManager, EventSystem, InputManager, UIManager, GameStateManager, AudioManager } from '@features/core';
import { LevelManager } from '@features/level';
import { EventNames } from '../constants/EventNames';
import { SceneKeys } from '../constants/SceneKeys.js';
import { AudioAssets, ImageAssets } from '../constants/Assets.js';
import { PhysicsConfig } from '../constants/PhysicsConfig.js';
import { LOG } from '../observability/core/LogSystem.js';
import { DebugContext } from '../observability/context/DebugContext.js';
import {
    PlayerStateProvider,
    PhysicsStateProvider,
    InputStateProvider
} from '../observability/providers/index.js';
import { ErrorPatternDetector } from '../observability/utils/ErrorPatternDetector.js';

export class Game extends Scene {
    constructor() {
        super(SceneKeys.GAME);
        LOG.dev('GAME_SCENE_CONSTRUCTOR', {
            subsystem: 'scene',
            scene: SceneKeys.GAME,
            message: 'Game scene constructor called'
        });

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

        // Observability
        this.debugContext = null;
        this.errorPatternDetector = null;

        // Level data
        this.currentLevelId = 'level1';
    }

    init(data) {
        LOG.info('GAME_SCENE_INIT', {
            subsystem: 'scene',
            scene: SceneKeys.GAME,
            message: 'Game scene initialized',
            data
        });

        // If a level ID is provided, use it
        if (data && data.levelId) {
            this.currentLevelId = data.levelId;
        }
    }

    preload() {
        LOG.dev('GAME_SCENE_PRELOAD', {
            subsystem: 'scene',
            scene: SceneKeys.GAME,
            message: 'Game scene preload called'
        });
    }

    async create() {
            LOG.info('GAME_SCENE_CREATE_START', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                message: 'Game scene create started',
                levelId: this.currentLevelId
            });
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
            
            // Initialize physics with BUFF action game feel
            this.physicsManager = PhysicsManager.getInstance();
            const physicsInitialized = await this.physicsManager.init(
                this, 
                this.eventSystem, 
                PhysicsConfig.gravityX, 
                PhysicsConfig.gravityY
            );
            
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
            LOG.dev('GAME_EFFECT_MANAGERS_READY', { subsystem: 'scene', scene: SceneKeys.GAME, message: 'Effect managers initialized' });

            // Initialize DebugContext for automatic context injection
            // This happens after core systems ready but before player creation
            LOG.info('GAME_DEBUGCONTEXT_INIT', {
                subsystem: 'observability',
                message: 'Initializing DebugContext for automatic state capture'
            });
            this.debugContext = DebugContext.getInstance();

            // Initialize ErrorPatternDetector for automatic error pattern detection
            this.errorPatternDetector = new ErrorPatternDetector(LOG);
            LOG.dev('GAME_ERROR_PATTERN_DETECTOR_INIT', {
                subsystem: 'observability',
                message: 'ErrorPatternDetector initialized for pattern analysis'
            });

            // Add visual enhancements
            this.createVisualEnhancements();
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
            LOG.dev('GAME_PLAYER_CREATE', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                message: 'Creating player with character',
                character: selectedKey,
                availableTextures: Object.keys(this.textures.list)
            });
            this.playerController = new PlayerController(
                this,
                this.physicsManager.getWorld(),
                this.eventSystem,
                startX,
                startY,
                selectedKey
            );
            
            // DON'T register player with physics manager - player manages own sprite position
            // because it uses KinematicCharacterController for advanced movement
            LOG.dev('GAME_PLAYER_CONTROLLER_MODE', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                message: 'Player uses KinematicCharacterController, managing own sprite position'
            });

            // Register state providers for automatic context injection
            // This provides rich debugging context in all logs
            LOG.dev('GAME_REGISTERING_STATE_PROVIDERS', {
                subsystem: 'observability',
                message: 'Registering state providers for context capture'
            });

            try {
                // Register player state provider
                if (this.playerController) {
                    const playerProvider = new PlayerStateProvider(this.playerController);
                    this.debugContext.registerProvider(playerProvider);
                }

                // Register physics state provider
                if (this.physicsManager) {
                    const physicsProvider = new PhysicsStateProvider(this.physicsManager);
                    this.debugContext.registerProvider(physicsProvider);
                }

                // Register input state provider
                if (this.inputManager) {
                    const inputProvider = new InputStateProvider(this.inputManager);
                    this.debugContext.registerProvider(inputProvider);
                }

                // Connect DebugContext to LogSystem for automatic injection
                LOG.setContextProvider(this.debugContext);

                LOG.info('GAME_STATE_PROVIDERS_REGISTERED', {
                    subsystem: 'observability',
                    message: 'State providers registered and connected to LogSystem',
                    providers: [
                        this.playerController ? 'player' : null,
                        this.physicsManager ? 'physics' : null,
                        this.inputManager ? 'input' : null
                    ].filter(Boolean)
                });
            } catch (error) {
                LOG.error('GAME_STATE_PROVIDER_REGISTRATION_ERROR', {
                    subsystem: 'observability',
                    error,
                    message: 'Error registering state providers',
                    hint: 'Context injection will be disabled, but logging will continue to work'
                });
            }

            // Listen for Pause events via InputManager (ESC key)
            this.eventSystem.on(EventNames.PAUSE, () => {
                LOG.dev('GAME_PAUSE_EVENT', {
                    subsystem: 'scene',
                    scene: SceneKeys.GAME,
                    message: 'Pause event received, launching PauseScene'
                });
                // Pause the game and show pause overlay
                this.scene.launch(SceneKeys.PAUSE);
                this.scene.pause();
            });
            // Listen for Level Reset events via InputManager (R key)
            this.eventSystem.on(EventNames.LEVEL_RESET, () => {
                LOG.dev('GAME_LEVEL_RESET_EVENT', {
                    subsystem: 'scene',
                    scene: SceneKeys.GAME,
                    message: 'Level reset event received, resetting level'
                });
                this.levelManager.resetLevel();
            });
            
            // Emit game init event
            this.eventSystem.emit(EventNames.GAME_INIT, {
                scene: 'Game',
                levelId: this.currentLevelId
            });
            
            LOG.info('GAME_SCENE_CREATE_COMPLETE', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                message: 'Game scene create completed successfully'
            });
        } catch (error) {
            LOG.error('GAME_SCENE_CREATE_ERROR', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                error,
                message: 'Error in Game scene create method',
                hint: 'Check manager initialization order. Verify all assets are loaded.'
            });
            // Display error on screen for easier debugging
            this.add.text(512, 400, 'ERROR: ' + error.message, {
                fontFamily: 'Arial', fontSize: 16, color: '#ff0000',
                align: 'center'
            }).setOrigin(0.5);
        }
    }
    
    /**
     * Create visual enhancements for better game feel
     */
    createVisualEnhancements() {
        // Add background image for first level
        if (this.currentLevelId === 'level1') {
            const bg = this.add.image(512, 384, ImageAssets.SCENE1_BACKGROUND);
            bg.setDepth(-100); // Behind everything

            // Scale to cover the scene if needed
            const scaleX = 1024 / bg.width;
            const scaleY = 768 / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale);
        }

        // Add gradient background overlay
        const graphics = this.add.graphics();

        // Create a subtle gradient from top to bottom
        const colors = [0x1a1a2e, 0x16213e, 0x0f3460];
        const alphas = [0.3, 0.2, 0.1];

        for (let i = 0; i < 3; i++) {
            graphics.fillStyle(colors[i], alphas[i]);
            graphics.fillRect(0, i * 250, 1024, 250);
        }
        
        // Add animated background particles for atmosphere
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                if (this.particleManager) {
                    const x = Phaser.Math.Between(0, 1024);
                    const particle = this.add.circle(x, -10, 3, 0xffffff, 0.2);
                    
                    this.tweens.add({
                        targets: particle,
                        y: 768,
                        x: x + Phaser.Math.Between(-50, 50),
                        alpha: 0,
                        duration: 8000,
                        onComplete: () => particle.destroy()
                    });
                }
            },
            loop: true
        });
        
        // Add subtle vignette effect
        const vignette = this.add.graphics();
        vignette.fillStyle(0x000000, 0);
        vignette.fillRect(0, 0, 1024, 768);
        vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);
        vignette.setDepth(999);
        
        // Create radial gradient for vignette
        const radius = 512;
        for (let i = 0; i < 20; i++) {
            const alpha = i / 20 * 0.3;
            vignette.lineStyle(20, 0x000000, alpha);
            vignette.strokeCircle(512, 384, radius + i * 30);
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
            'WASD/Arrows: Move | SPACE: Triple Jump! | C: Duck',
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

        LOG.dev('GAME_UI_CREATED', {
            subsystem: 'scene',
            scene: SceneKeys.GAME,
            message: 'UI elements created'
        });
    }
    
    /**
     * Set up event listeners for the game
     */
    setupEventListeners() {
        // Listen for player land events
        this.eventSystem.on(EventNames.PLAYER_LAND, (data) => {
            // Screen shake is now handled by CameraManager
            if (this.cameraManager) {
                LOG.dev('GAME_PLAYER_LAND', {
                    subsystem: 'scene',
                    scene: SceneKeys.GAME,
                    message: 'Player landed, CameraManager handling effects',
                    data
                });
            }
            // Play landing sound
            AudioManager.getInstance().playSFX('land');
        });
        
        // Listen for player jump events
        this.eventSystem.on(EventNames.PLAYER_JUMP, (data) => {
            LOG.dev('GAME_PLAYER_JUMP', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                message: 'Player jumped, effect managers handling feedback',
                data
            });
            // Play jump sound effect
            AudioManager.getInstance().playSFX('jump');
        });
        
        // Listen for collectible collected events
        this.eventSystem.on(EventNames.COLLECTIBLE_COLLECTED, (data) => {
            LOG.dev('GAME_COLLECTIBLE_COLLECTED', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                message: 'Collectible collected',
                totalCollected: data.totalCollected,
                totalCollectibles: data.totalCollectibles,
                position: data.position
            });
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
            LOG.dev('GAME_LEVEL_COMPLETE', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                message: 'Level complete',
                levelId: data.levelId,
                collectiblesCollected: data.collectiblesCollected,
                totalCollectibles: data.totalCollectibles
            });

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
            LOG.dev('GAME_LEVEL_LOADED', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                message: 'Level loaded',
                levelName: data.name,
                levelData: data
            });

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
        
        // Listen for player explode events
        this.eventSystem.on(EventNames.PLAYER_EXPLODE, (data) => {
            LOG.dev('GAME_PLAYER_EXPLODE', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                message: 'Player exploded',
                reason: data.reason || 'Unknown',
                data
            });

            // Stop all gameplay
            this.scene.pause();
            
            // Trigger dramatic game over
            this.time.delayedCall(1000, () => {
                this.scene.stop();
                this.scene.start(SceneKeys.GAME_OVER, { 
                    dramatic: true,
                    reason: data.reason || 'You exploded!'
                });
            });
        });
        
        // Listen for scene transition events
        this.eventSystem.on(EventNames.SCENE_TRANSITION, (data) => {
            LOG.dev('GAME_SCENE_TRANSITION', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                message: 'Scene transition event',
                targetScene: data.scene || 'unknown',
                data
            });

            // Fade out current scene
            this.cameras.main.fadeOut(500, 0, 0, 0);
            
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // Stop current scene
                this.scene.stop();
                
                // Start new scene
                this.scene.start(SceneKeys.GAME, {
                    levelId: data.toScene
                });
            });
        });
    }

    update(time, delta) {
        // Update DebugContext frame tracking
        // This enables frame-accurate context snapshots for all logs
        if (this.debugContext) {
            const frameNumber = this.game.loop.frame;
            const deltaSeconds = delta / 1000;
            this.debugContext.updateFrame(frameNumber, deltaSeconds);
        }

        // Periodic error pattern detection (every 5 seconds = 300 frames at 60 FPS)
        if (this.errorPatternDetector && this.game.loop.frame % 300 === 0) {
            const patterns = this.errorPatternDetector.analyzeRecent(5000);

            // Log if concerning patterns detected
            if (patterns.repeatingErrors.length > 0 || patterns.cascades.length > 0) {
                LOG.warn('ERROR_PATTERNS_DETECTED', {
                    subsystem: 'observability',
                    message: `Error patterns detected: ${patterns.repeatingErrors.length} repeating, ${patterns.cascades.length} cascades`,
                    patterns: {
                        repeatingCount: patterns.repeatingErrors.length,
                        cascadeCount: patterns.cascades.length,
                        severity: patterns.severity.level,
                        errorRate: patterns.errorRate.errorsPerSecond
                    },
                    hint: 'Multiple errors occurring. Check logs for details or investigate specific error codes.'
                });
            }
        }

        // Only proceed if physics is initialized
        if (!this.physicsManager || !this.physicsManager.isInitialized()) {
            return;
        }

        try{
            // Update physics (steps the world and updates sprites)
            this.physicsManager.update(delta);
            
            // Update level elements with delta time
            if (this.levelManager) {
                this.levelManager.update(delta);
            }
            
            // Update player with delta time
            if (this.playerController) {
                this.playerController.update(delta);
            }
            // Update enemies
            if (this.enemies) {
                this.enemies.forEach(enemy => {
                    try {
                        enemy.update(time, delta);
                    } catch (err) {
                        LOG.error('GAME_ENEMY_UPDATE_ERROR', {
                            subsystem: 'scene',
                            scene: SceneKeys.GAME,
                            error: err,
                            message: 'Error updating enemy',
                            hint: 'Check enemy controller update method'
                        });
                    }
                });
            }
            
            // Update boss
            if (this.boss) {
                try {
                    this.boss.update(time, delta);
                } catch (err) {
                    LOG.error('GAME_BOSS_UPDATE_ERROR', {
                        subsystem: 'scene',
                        scene: SceneKeys.GAME,
                        error: err,
                        message: 'Error updating boss',
                        hint: 'Check boss controller update method'
                    });
                }
            }
            
            // Update pulsating boss
            if (this.pulsatingBoss) {
                try {
                    this.pulsatingBoss.update();
                    
                    // Check collision with player
                    if (this.playerController) {
                        const playerBody = this.playerController.getBody();
                        if (this.pulsatingBoss.checkPlayerContact(playerBody)) {
                            this.pulsatingBoss.onPlayerHit();
                        }
                    }
                } catch (err) {
                    LOG.error('GAME_PULSATING_BOSS_UPDATE_ERROR', {
                        subsystem: 'scene',
                        scene: SceneKeys.GAME,
                        error: err,
                        message: 'Error updating pulsating boss',
                        hint: 'Check pulsating boss controller update method'
                    });
                }
            }
        } catch (error) {
            LOG.error('GAME_UPDATE_ERROR', {
                subsystem: 'scene',
                scene: SceneKeys.GAME,
                error,
                message: 'Error in Game scene update loop',
                hint: 'Check physics manager and entity updates'
            });
        }
    }
}
