import { EventNames } from '../../constants/EventNames';
import { getLevelById } from '../../constants/LevelData';
// Enemy controller for spawning buff-themed enemies
import { EnemyController } from '@features/enemy';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * LevelLoader class is responsible for loading level data and initializing level elements
 */
export class LevelLoader {
    /**
     * Create a new LevelLoader
     * @param {Phaser.Scene} scene - The scene this loader belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     * @param {Object} managers - Object containing all level-related managers
     * @param {GroundFactory} managers.groundFactory - The ground factory
     * @param {PlatformFactory} managers.platformFactory - The platform factory
     * @param {MovingPlatformController} managers.movingPlatformController - The moving platform controller
     * @param {CollectibleManager} managers.collectibleManager - The collectible manager
     * @param {LevelCompletionManager} managers.completionManager - The level completion manager
     */
    constructor(scene, eventSystem, managers) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        this.managers = managers;
        // Capture physics world for enemy spawning
        this.world = managers.world;
        
        // Current level data
        this.currentLevelId = null;
        this.currentLevelConfig = null;
        
        // Debug mode
        this.debugMode = false;
    }
    
    /**
     * Set debug mode
     * @param {boolean} enabled - Whether debug mode is enabled
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    /**
     * Log a message if debug mode is enabled
     * @param {string} message - The message to log
     */
    log(message) {
        if (this.debugMode) {
            LOG.dev('LEVELLOADER_DEBUG', {
                subsystem: 'level',
                message,
                levelId: this.currentLevelId
            });
        }
    }
    
    /**
     * Load a level by ID
     * @param {string} levelId - The ID of the level to load
     * @returns {boolean} Whether the level was loaded successfully
     */
    loadLevel(levelId) {
        try {
            this.log(`Loading level: ${levelId}`);
            
            // Get level configuration
            const levelConfig = getLevelById(levelId);
            if (!levelConfig) {
                LOG.error('LEVELLOADER_LEVEL_NOT_FOUND', {
                    subsystem: 'level',
                    message: 'Level not found',
                    levelId,
                    hint: 'Check if levelId exists in LevelData.js'
                });
                return false;
            }
            
            // Store current level info
            this.currentLevelId = levelId;
            this.currentLevelConfig = levelConfig;
            
            // Clear any existing level elements
            this.clearLevel();
            
            // Initialize the level
            this.initializeLevel(levelConfig);
            
            // Emit level loaded event
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.LEVEL_LOADED, { 
                    levelId,
                    name: levelConfig.name,
                    description: levelConfig.description
                });
            }
            
            this.log(`Level ${levelId} loaded successfully`);
            return true;
        } catch (error) {
            LOG.error('LEVELLOADER_LOAD_ERROR', {
                subsystem: 'level',
                error,
                message: 'Error loading level',
                levelId,
                hint: 'Check level configuration and factory initialization'
            });
            return false;
        }
    }
    
    /**
     * Initialize a level from configuration
     * @param {Object} levelConfig - The level configuration
     */
    initializeLevel(levelConfig) {
        this.log('Initializing level elements');
        
        // Set background
        this.setupBackground(levelConfig.background);
        
        // Create ground
        if (this.managers.groundFactory && levelConfig.ground) {
            this.managers.groundFactory.createGround(levelConfig.ground);
        }
        
        // Create platforms
        if (this.managers.platformFactory && levelConfig.platforms) {
            this.managers.platformFactory.createPlatforms(levelConfig.platforms);
        }
        
        // Create moving platforms
        if (this.managers.movingPlatformController && levelConfig.movingPlatforms) {
            this.managers.movingPlatformController.createMovingPlatforms(levelConfig.movingPlatforms);
        }
        
        // Create collectibles
        if (this.managers.collectibleManager && levelConfig.collectibles) {
            this.managers.collectibleManager.createCollectibles(levelConfig.collectibles);
        }
        
        // Create level completion trigger
        if (this.managers.completionManager && levelConfig.completionTrigger) {
            this.managers.completionManager.setCurrentLevelId(this.currentLevelId);
            this.managers.completionManager.createCompletionTrigger(levelConfig.completionTrigger);
        }
        
        // Update UI with level-specific text
        this.updateUI(levelConfig.ui);
        
        // Position player at start position if available
        this.positionPlayerAtStart(levelConfig.playerStart);
        // Spawn enemies for this level
        if (levelConfig.enemies) {
            levelConfig.enemies.forEach(cfg => {
                try {
                    const enemy = new EnemyController(
                        this.scene,
                        this.world,
                        this.eventSystem,
                        cfg.x,
                        cfg.y,
                        cfg.key
                    );
                    if (!this.scene.enemies) {
                        this.scene.enemies = [];
                    }
                    this.scene.enemies.push(enemy);
                } catch (error) {
                    LOG.error('LEVELLOADER_ENEMY_SPAWN_ERROR', {
                        subsystem: 'level',
                        error,
                        message: 'Error spawning enemy',
                        enemyConfig: cfg,
                        hint: 'Check enemy configuration and EnemyController initialization'
                    });
                }
            });
        }
        
        // Spawn boss for this level if configured
        if (levelConfig.boss) {
            try {
                if (levelConfig.boss.type === 'pulsating') {
                    // Import PulsatingBoss for level 1
                    import('../enemy/PulsatingBoss.js').then(module => {
                        const { PulsatingBoss } = module;
                        const boss = new PulsatingBoss(
                            this.scene,
                            this.world,
                            levelConfig.boss.x,
                            levelConfig.boss.y,
                            this.eventSystem
                        );
                        
                        // Store boss reference for updates and cleanup
                        this.scene.pulsatingBoss = boss;

                        LOG.dev('LEVELLOADER_PULSATING_BOSS_SPAWNED', {
                            subsystem: 'level',
                            message: 'Pulsating boss spawned',
                            position: { x: levelConfig.boss.x, y: levelConfig.boss.y },
                            levelId: this.currentLevelId
                        });
                    }).catch(error => {
                        LOG.error('LEVELLOADER_PULSATING_BOSS_IMPORT_ERROR', {
                            subsystem: 'level',
                            error,
                            message: 'Error importing PulsatingBoss',
                            levelId: this.currentLevelId,
                            hint: 'Check if PulsatingBoss.js exists and exports PulsatingBoss class'
                        });
                    });
                } else if (levelConfig.boss.active) {
                    // Original boss logic for other levels
                    import('../enemy/BossController.js').then(module => {
                        const { BossController } = module;
                        const boss = new BossController(
                            this.scene,
                            this.world,
                            this.eventSystem,
                            levelConfig.boss.x,
                            levelConfig.boss.y,
                            levelConfig.boss.key
                        );
                        
                        // Store boss reference for updates and cleanup
                        this.scene.boss = boss;

                        LOG.dev('LEVELLOADER_BOSS_SPAWNED', {
                            subsystem: 'level',
                            message: 'Boss spawned',
                            position: { x: levelConfig.boss.x, y: levelConfig.boss.y },
                            key: levelConfig.boss.key,
                            levelId: this.currentLevelId
                        });
                    }).catch(error => {
                        LOG.error('LEVELLOADER_BOSS_IMPORT_ERROR', {
                            subsystem: 'level',
                            error,
                            message: 'Error importing BossController',
                            levelId: this.currentLevelId,
                            hint: 'Check if BossController.js exists and exports BossController class'
                        });
                    });
                }
            } catch (error) {
                LOG.error('LEVELLOADER_BOSS_SPAWN_ERROR', {
                    subsystem: 'level',
                    error,
                    message: 'Error spawning boss',
                    bossConfig: levelConfig.boss,
                    levelId: this.currentLevelId,
                    hint: 'Check boss configuration and initialization'
                });
            }
        }
        
        // Create decorations if configured
        if (levelConfig.decorations) {
            this.createDecorations(levelConfig.decorations);
        }
    }
    
    /**
     * Set up the background for the level
     * @param {Object} backgroundConfig - The background configuration
     */
    setupBackground(backgroundConfig) {
        if (!backgroundConfig) {
            return;
        }
        
        // Set background color if specified
        if (backgroundConfig.color) {
            this.scene.cameras.main.setBackgroundColor(backgroundConfig.color);
        }
        // Add static background image if specified
        if (backgroundConfig.image) {
            this.scene.add.image(0, 0, backgroundConfig.image)
                .setOrigin(0, 0)
                .setScrollFactor(0);
        }
        // Add parallax layers if specified
        if (backgroundConfig.layers) {
            backgroundConfig.layers.forEach(({ key, scrollFactor }) => {
                this.scene.add.image(0, 0, key)
                    .setOrigin(0, 0)
                    .setScrollFactor(scrollFactor);
            });
        }
        // Add additional background elements if any
        if (backgroundConfig.elements && backgroundConfig.elements.length > 0) {
            backgroundConfig.elements.forEach(element => {
                if (element.type === 'image' && this.scene.textures.exists(element.key)) {
                    this.scene.add.image(element.x, element.y, element.key)
                        .setAlpha(element.alpha || 1.0);
                }
            });
        }
    }
    
    /**
     * Update UI with level-specific text
     * @param {Object} uiConfig - The UI configuration
     */
    updateUI(uiConfig) {
        if (!uiConfig || !this.scene.uiManager) {
            return;
        }
        
        // Update instruction text if provided
        if (uiConfig.instructionText) {
            this.scene.uiManager.updateText('instructions', uiConfig.instructionText);
        }
        
        // Update level name if provided
        if (this.currentLevelConfig && this.currentLevelConfig.name) {
            this.scene.uiManager.updateText('levelName', `Level: ${this.currentLevelConfig.name}`);
        }
    }
    
    /**
     * Position the player at the start position
     * @param {Object} startPosition - The start position configuration
     */
    positionPlayerAtStart(startPosition) {
        if (!startPosition || !this.scene.playerController) {
            return;
        }
        
        this.log(`Positioning player at start: x=${startPosition.x}, y=${startPosition.y}`);
        
        // Set player position
        this.scene.playerController.setPosition(startPosition.x, startPosition.y);
        
        // Reset player state
        this.scene.playerController.reset();
        
        // Emit player spawn event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_SPAWN, {
                position: startPosition,
                levelId: this.currentLevelId
            });
        }
    }
    
    /**
     * Create decorative elements for the level
     * @param {Array} decorations - Array of decoration configurations
     */
    createDecorations(decorations) {
        if (!decorations || !Array.isArray(decorations)) return;
        
        decorations.forEach(deco => {
            try {
                switch (deco.type) {
                    case 'text':
                        const textStyle = {
                            fontFamily: 'Arial Black',
                            fontSize: deco.style.fontSize || '20px',
                            color: deco.style.color || '#ffffff',
                            stroke: '#000000',
                            strokeThickness: 3
                        };
                        const text = this.scene.add.text(deco.x, deco.y, deco.text, textStyle)
                            .setOrigin(0.5)
                            .setDepth(10);
                        break;
                        
                    case 'emoji':
                        const emoji = this.scene.add.text(deco.x, deco.y, deco.emoji, {
                            fontSize: `${32 * (deco.scale || 1)}px`
                        }).setOrigin(0.5).setDepth(10);
                        break;
                        
                    case 'rect':
                        const rect = this.scene.add.rectangle(
                            deco.x, 
                            deco.y, 
                            deco.width, 
                            deco.height, 
                            deco.color
                        ).setDepth(5);
                        break;
                }
            } catch (error) {
                LOG.error('LEVELLOADER_DECORATION_ERROR', {
                    subsystem: 'level',
                    error,
                    message: 'Error creating decoration',
                    decoration: deco,
                    levelId: this.currentLevelId,
                    hint: 'Check decoration configuration and asset availability'
                });
            }
        });
    }
    
    /**
     * Clear the current level
     */
    clearLevel() {
        this.log('Clearing current level');
        
        // Clear ground
        if (this.managers.groundFactory) {
            this.managers.groundFactory.removeGround();
        }
        
        // Clear platforms
        if (this.managers.platformFactory) {
            this.managers.platformFactory.removePlatforms();
        }
        
        // Clear moving platforms
        if (this.managers.movingPlatformController) {
            this.managers.movingPlatformController.removeMovingPlatforms();
        }
        
        // Clear collectibles
        if (this.managers.collectibleManager) {
            this.managers.collectibleManager.removeCollectibles();
        }
        
        // Clear completion trigger
        if (this.managers.completionManager) {
            this.managers.completionManager.removeCompletionTrigger();
        }
    }
    
    /**
     * Get the current level ID
     * @returns {string} The current level ID
     */
    getCurrentLevelId() {
        return this.currentLevelId;
    }
    
    /**
     * Get the current level configuration
     * @returns {Object} The current level configuration
     */
    getCurrentLevelConfig() {
        return this.currentLevelConfig;
    }
}
