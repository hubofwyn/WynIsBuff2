import { BaseScene, AudioManager, GameStateManager, LoadingScreenManager } from '@features/core';

import { SceneKeys } from '../constants/SceneKeys.js';
import {
    ImageAssets,
    ImagePaths,
    AudioAssets,
    AudioPaths,
    SpritesheetConfigs,
} from '../constants/Assets.js';
import { LOG } from '../observability/core/LogSystem.js';
import { LogoLoader } from '../utils/LogoLoader.js';

export class Preloader extends BaseScene {
    constructor() {
        super(SceneKeys.PRELOADER);
    }

    init() {
        // Initialize unified loading screen
        this.loadingManager = LoadingScreenManager.getInstance();

        LOG.info('PRELOADER_INIT', {
            subsystem: 'scene',
            scene: SceneKeys.PRELOADER,
            message: 'Preloader scene initialized with LoadingScreenManager',
        });
    }

    preload() {
        // Show unified loading screen
        this.loadingManager.show(this, {
            title: 'WYN IS BUFF 2',
            showLogo: true,
            showProgress: true,
            message: 'Initializing systems...',
        });

        // Loading stages for status updates
        const loadingStages = [
            'Initializing systems...',
            'Loading audio assets...',
            'Preparing graphics...',
            'Calibrating physics...',
            'Ready for buff training!',
        ];

        // Update progress and status as assets load
        this.load.on('progress', (progress) => {
            // Update progress bar
            this.loadingManager.updateProgress(progress);

            // Update status message based on progress
            const stageIndex = Math.min(
                Math.floor(progress * loadingStages.length),
                loadingStages.length - 1
            );
            this.loadingManager.updateStatus(loadingStages[stageIndex]);
        });

        // Update status on individual file loads
        this.load.on('fileprogress', (file) => {
            const fileName = file.key || 'unknown';
            this.loadingManager.updateStatus(`Loading: ${fileName}`);
        });

        //  Load the assets for the game
        this.load.setPath('assets');

        // TRIAGE FIX: Configure loader to prevent OUT_OF_MEMORY errors
        this.load.maxParallelDownloads = 2; // Reduce concurrent downloads

        // TRIAGE FIX: Add error handlers for asset loading
        this.load.on('loaderror', (fileObj) => {
            LOG.error('PRELOADER_ASSET_LOAD_ERROR', {
                subsystem: 'assets',
                scene: SceneKeys.PRELOADER,
                error: fileObj,
                message: 'Failed to load asset',
                assetKey: fileObj.key,
                assetSrc: fileObj.src,
                assetType: fileObj.type,
                hint: 'Check asset path and file existence. Verify manifest.json configuration.',
            });
        });

        // NOTE: WebGL texture upload warnings (INVALID_VALUE: texImage2D) are expected
        // during asset loading. These are non-critical browser warnings that Phaser
        // handles internally. See docs/systems/KNOWN_WEBGL_ISSUES.md for details.

        this.load.on('filecomplete', (key, type) => {
            // AGENTIC DEBUG: Log asset loading completion
            LOG.dev('PRELOADER_ASSET_LOADED', {
                subsystem: 'assets',
                scene: SceneKeys.PRELOADER,
                key,
                type,
                message: `Asset loaded: ${key}`,
            });
        });

        // Load the custom game logo with smart resolution and format selection
        // LogoLoader automatically chooses optimal variant based on:
        // - Device pixel ratio (1x=512px, 2x=1024px)
        // - WebP support (92-97% smaller than PNG)
        const logoPath = LogoLoader.getOptimalPath(this.sys.game);
        this.load.image(ImageAssets.LOGO, logoPath);

        // Also load legacy path for backward compatibility
        // this.load.image(ImageAssets.LOGO, ImagePaths.LOGO);

        // Load player character sprite
        // IMPORTANT: For character animations, we need to load as a spritesheet
        // For single frame use, we'll still load the full image
        this.load.image(ImageAssets.PLAYER_FULL, ImagePaths.PLAYER_FULL);

        // Load character sprite for animation - we'll extract frames from it
        this.load.spritesheet(ImageAssets.PLAYER, ImagePaths.PLAYER, SpritesheetConfigs.PLAYER);

        // If you have separate animation frames in your spritesheets directory, load those instead
        // Example for player idle animation (adjust path as needed):
        // this.load.spritesheet('player-idle', 'spritesheets/animations/characters/player/idle/player_idle.png', {
        //     frameWidth: 32,
        //     frameHeight: 32
        // });

        // Load tileset for potential use in level design
        this.load.image(ImageAssets.DUNGEON_TILES, ImagePaths.DUNGEON_TILES);

        // Load UI elements
        this.load.image(ImageAssets.ARROW1, ImagePaths.ARROW1);
        this.load.image(ImageAssets.ARROW2, ImagePaths.ARROW2);
        this.load.image(ImageAssets.ARROW3, ImagePaths.ARROW3);
        this.load.image(ImageAssets.ARROW4, ImagePaths.ARROW4);

        // Load item sprites that might be useful
        this.load.image(ImageAssets.COIN, ImagePaths.COIN);
        this.load.image(ImageAssets.CHEST, ImagePaths.CHEST);
        // Themed collectible icons for level1
        this.load.image(ImageAssets.COLLECTIBLE_PROTEIN, ImagePaths.COLLECTIBLE_PROTEIN);
        this.load.image(ImageAssets.COLLECTIBLE_DUMBBELL, ImagePaths.COLLECTIBLE_DUMBBELL);

        // Load torch effect for potential environment enhancement
        this.load.image(ImageAssets.TORCH, ImagePaths.TORCH);
        // Buff-themed boss placeholder
        this.load.image(ImageAssets.AXELFACE, ImagePaths.AXELFACE);
        // Secondary character: Wyn face placeholder
        this.load.image(ImageAssets.WYNFACE, ImagePaths.WYNFACE);
        // Preload additional character sprites
        this.load.image(ImageAssets.ILA_SPRITE, ImagePaths.ILA_SPRITE);
        this.load.image(ImageAssets.AXEL_SPRITE, ImagePaths.AXEL_SPRITE);
        this.load.image(ImageAssets.WYN_SPRITE, ImagePaths.WYN_SPRITE);
        // Buff-themed background for level1
        this.load.image(ImageAssets.BUFF_BG, ImagePaths.BUFF_BG);

        // Load particle assets
        this.load.image(ImageAssets.PARTICLE_FLARE, ImagePaths.PARTICLE_FLARE);
        this.load.image(ImageAssets.PARTICLE_WHITE, ImagePaths.PARTICLE_WHITE);

        // Load parallax backgrounds
        this.load.image(ImageAssets.PARALLAX_SKY, ImagePaths.PARALLAX_SKY);
        this.load.image(ImageAssets.PARALLAX_MOUNTAINS, ImagePaths.PARALLAX_MOUNTAINS);
        this.load.image(ImageAssets.PARALLAX_FOREGROUND, ImagePaths.PARALLAX_FOREGROUND);

        // Load level backgrounds
        this.load.image(ImageAssets.SCENE1_BACKGROUND, ImagePaths.SCENE1_BACKGROUND);

        // Load audio assets (MP3 only; OGG fallback later)
        this.load.audio(AudioAssets.PROTEIN_PIXEL_ANTHEM, [AudioPaths.PROTEIN_PIXEL_ANTHEM]);
        this.load.audio(AudioAssets.HYPER_BUFF_BLITZ, [AudioPaths.HYPER_BUFF_BLITZ]);
        this.load.audio(AudioAssets.BIRTHDAY_SONG, [AudioPaths.BIRTHDAY_SONG]);
        // Land effects variants
        this.load.audio(AudioAssets.SFX_LAND1, [AudioPaths.SFX_LAND1]);
        this.load.audio(AudioAssets.SFX_LAND2, [AudioPaths.SFX_LAND2]);
        this.load.audio(AudioAssets.SFX_LAND3, [AudioPaths.SFX_LAND3]);
        this.load.audio(AudioAssets.SFX_LAND4, [AudioPaths.SFX_LAND4]);
        // Pickup effects variants
        this.load.audio(AudioAssets.SFX_PICKUP1, [AudioPaths.SFX_PICKUP1]);
        this.load.audio(AudioAssets.SFX_PICKUP2, [AudioPaths.SFX_PICKUP2]);
        this.load.audio(AudioAssets.SFX_PICKUP3, [AudioPaths.SFX_PICKUP3]);
        this.load.audio(AudioAssets.SFX_PICKUP4, [AudioPaths.SFX_PICKUP4]);
        // UI click / hover variants
        this.load.audio(AudioAssets.SFX_CLICK1, [AudioPaths.SFX_CLICK1]);
        this.load.audio(AudioAssets.SFX_CLICK2, [AudioPaths.SFX_CLICK2]);
        this.load.audio(AudioAssets.SFX_CLICK3, [AudioPaths.SFX_CLICK3]);
        this.load.audio(AudioAssets.SFX_CLICK4, [AudioPaths.SFX_CLICK4]);
        this.load.audio(AudioAssets.SFX_HOVER1, [AudioPaths.SFX_HOVER1]);
        this.load.audio(AudioAssets.SFX_HOVER2, [AudioPaths.SFX_HOVER2]);
        this.load.audio(AudioAssets.SFX_HOVER3, [AudioPaths.SFX_HOVER3]);
        this.load.audio(AudioAssets.SFX_HOVER4, [AudioPaths.SFX_HOVER4]);
        // Special sound effects
        this.load.audio(AudioAssets.SFX_FART, [AudioPaths.SFX_FART]);
        // Parallax background layers for level1
        this.load.image(ImageAssets.PARALLAX_SKY, ImagePaths.PARALLAX_SKY);
        this.load.image(ImageAssets.PARALLAX_MOUNTAINS, ImagePaths.PARALLAX_MOUNTAINS);
        this.load.image(ImageAssets.PARALLAX_FOREGROUND, ImagePaths.PARALLAX_FOREGROUND);
    }

    async create() {
        // Update loading screen to show completion
        this.loadingManager.updateProgress(1.0, 'Systems ready!');

        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        // TRIAGE FIX: Configure all loaded textures to prevent mipmap errors
        this.configureTextureFilters();

        // Define player animations that can be used across scenes
        this.createPlayerAnimations();

        // Initialize AudioManager (loads Howler sounds) and apply persisted audio settings
        const audio = AudioManager.getInstance();

        // Load persisted settings and apply volumes
        const gs = new GameStateManager();
        const settings = gs.settings || {};
        if (settings.volumes) {
            audio.setMasterVolume(settings.volumes.master || 0.8);
            audio.setMusicVolume(settings.volumes.music || 0.7);
            audio.setSFXVolume(settings.volumes.sfx || 0.9);
        }
        LOG.dev('PRELOADER_AUDIO_SETTINGS_APPLIED', {
            subsystem: 'scene',
            scene: SceneKeys.PRELOADER,
            message: 'AudioManager initialized with persisted settings',
            volumes: settings.volumes || 'default',
        });

        // Brief pause to show completion, then hide loading screen
        await new Promise((resolve) => this.time.delayedCall(500, resolve));

        // Hide loading screen with fade
        await this.loadingManager.hide(600);

        // Transition to next scene
        LOG.info('PRELOADER_COMPLETE', {
            subsystem: 'scene',
            scene: SceneKeys.PRELOADER,
            message: 'Asset loading complete, transitioning to Welcome scene',
        });

        this.scene.start(SceneKeys.WELCOME);
    }

    update(_time, _delta) {
        // Placeholder update method for Preloader scene
    }

    configureTextureFilters() {
        // Configure all loaded textures to use LINEAR filtering (no mipmaps)
        // This prevents WebGL errors with non-power-of-two textures
        let configuredCount = 0;
        const textureManager = this.textures;

        textureManager.each((texture) => {
            if (texture.key !== '__DEFAULT' && texture.key !== '__MISSING') {
                // Set LINEAR filter for all texture sources
                if (texture.setFilter) {
                    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
                    configuredCount++;
                }
            }
        });

        LOG.info('PRELOADER_TEXTURES_CONFIGURED', {
            subsystem: 'assets',
            scene: SceneKeys.PRELOADER,
            message: 'All textures configured with LINEAR filtering',
            texturesConfigured: configuredCount,
            hint: 'This prevents mipmap generation errors for non-power-of-two textures',
        });
    }

    createPlayerAnimations() {
        // Only create animations if the spritesheet is loaded
        if (this.textures.exists('player')) {
            // Idle animation - using the first row of frames (assuming character sheet layout)
            this.anims.create({
                key: 'player-idle',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1,
            });

            // Walking animation - using the second row of frames
            this.anims.create({
                key: 'player-walk',
                frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
                frameRate: 10,
                repeat: -1,
            });

            // Jumping animation - single frame or sequence as needed
            this.anims.create({
                key: 'player-jump',
                frames: this.anims.generateFrameNumbers('player', { start: 8, end: 8 }),
                frameRate: 10,
                repeat: 0,
            });

            // Additional animations can be defined here
        }
    }
}
