import { Scene } from 'phaser';
import { AudioManager, GameStateManager, AssetHealthManager, EventSystem } from '@features/core';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets, ImagePaths, AudioAssets, AudioPaths, SpritesheetConfigs } from '../constants/Assets.js';
import { EventNames } from '../constants/EventNames.js';

export class Preloader extends Scene
{
    constructor ()
    {
        super(SceneKeys.PRELOADER);
    }

    init ()
    {
        const { width, height } = this.cameras.main;
        
        // Initialize asset health monitoring
        this.eventSystem = new EventSystem();
        this.assetHealthManager = AssetHealthManager.getInstance();
        this.assetHealthManager.init(this, this.eventSystem);
        
        // Set up asset health monitoring listeners
        this.eventSystem.on(EventNames.ASSET_CORRUPTED, (data) => {
            console.warn('[Preloader] Asset corrupted:', data);
            this.updateLoadingText(`Asset corrupted: ${data.key}, applying fallback...`);
        });
        
        this.eventSystem.on(EventNames.ASSET_FALLBACK_APPLIED, (data) => {
            console.log('[Preloader] Fallback applied:', data);
            this.updateLoadingText(`Fallback applied for ${data.originalKey}`);
        });
        
        this.eventSystem.on(EventNames.ASSET_RECOVERED, (data) => {
            console.log('[Preloader] Asset recovered:', data);
            this.updateLoadingText(`Asset recovered: ${data.key}`);
        });
        
        // Create a professional gradient background
        this.cameras.main.setBackgroundColor('#0F1B2B');
        
        // Add animated gradient overlay
        const gradientBg = this.add.graphics();
        gradientBg.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x16213e, 1);
        gradientBg.fillRect(0, 0, width, height);
        
        // Game logo/title with enhanced styling
        const titleText = this.add.text(width / 2, height * 0.3, 'WYN IS BUFF 2', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '64px',
            color: '#FFE66D',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 8, fill: true }
        }).setOrigin(0.5);
        
        // Subtitle with skill-to-automation theme
        const subtitleText = this.add.text(width / 2, height * 0.4, 'SKILL TO AUTOMATION', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#4ECDC4',
            letterSpacing: '4px'
        }).setOrigin(0.5);
        
        // Modern progress bar container
        const progressBarBg = this.add.graphics();
        const barWidth = 400;
        const barHeight = 20;
        const barX = width / 2 - barWidth / 2;
        const barY = height * 0.6;
        
        // Progress bar background with rounded corners and glow
        progressBarBg.fillStyle(0x000000, 0.5);
        progressBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 10);
        progressBarBg.lineStyle(2, 0x4ECDC4, 0.8);
        progressBarBg.strokeRoundedRect(barX, barY, barWidth, barHeight, 10);
        
        // Animated progress bar fill
        const progressBar = this.add.graphics();
        
        // Loading text with animation
        const loadingText = this.add.text(width / 2, barY + 50, 'INITIALIZING SYSTEMS...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#FFFFFF',
            alpha: 0.8
        }).setOrigin(0.5);
        
        // Percentage text
        const percentText = this.add.text(width / 2, barY - 30, '0%', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '22px',
            color: '#FFE66D',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Loading stages
        const loadingStages = [
            'INITIALIZING SYSTEMS...',
            'LOADING AUDIO ASSETS...',
            'PREPARING GRAPHICS...',
            'CALIBRATING PHYSICS...',
            'READY FOR BUFF TRAINING!'
        ];
        
        let currentStage = 0;
        
        // Animate title entrance
        titleText.setScale(0).setAlpha(0);
        this.tweens.add({
            targets: titleText,
            scale: 1,
            alpha: 1,
            duration: 800,
            ease: 'Back.easeOut'
        });
        
        // Animate subtitle entrance
        subtitleText.setY(subtitleText.y + 50).setAlpha(0);
        this.tweens.add({
            targets: subtitleText,
            y: subtitleText.y - 50,
            alpha: 1,
            duration: 600,
            delay: 400,
            ease: 'Power2.easeOut'
        });
        
        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {
            // Clear and redraw progress bar
            progressBar.clear();
            
            // Calculate progress width
            const fillWidth = (barWidth - 4) * progress;
            
            // Create gradient fill based on progress
            const startColor = progress < 0.5 ? 0xFF6B9D : 0x4ECDC4;
            const endColor = progress < 0.5 ? 0xFFE66D : 0x00FF88;
            
            progressBar.fillGradientStyle(startColor, endColor, startColor, endColor, 1);
            progressBar.fillRoundedRect(barX + 2, barY + 2, fillWidth, barHeight - 4, 8);
            
            // Update percentage text
            const percent = Math.floor(progress * 100);
            percentText.setText(`${percent}%`);
            
            // Update loading stage text
            const newStage = Math.floor(progress * loadingStages.length);
            if (newStage !== currentStage && newStage < loadingStages.length) {
                currentStage = newStage;
                loadingText.setText(loadingStages[currentStage]);
                
                // Animate text change
                this.tweens.add({
                    targets: loadingText,
                    alpha: 0.4,
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2.easeInOut'
                });
            }
        });
        
        // Add loading dots animation
        this.loadingDotsTimer = this.time.addEvent({
            delay: 500,
            callback: () => {
                const currentText = loadingText.text;
                const baseText = currentText.replace(/\.+$/, '');
                const dots = currentText.match(/\.+$/)?.[0] || '';
                const newDots = dots.length >= 3 ? '' : dots + '.';
                loadingText.setText(baseText + newDots);
            },
            loop: true
        });
    }

    preload ()
    {
        //  Load the assets for the game
        this.load.setPath('assets');
        
        // TRIAGE FIX: Configure loader to prevent OUT_OF_MEMORY errors
        this.load.maxParallelDownloads = 2; // Reduce concurrent downloads
        
        // TRIAGE FIX: Add error handlers for asset loading
        this.load.on('loaderror', (fileObj) => {
            console.error('[Preloader] Failed to load asset:', fileObj.key, fileObj.src);
            // If logo fails, keep scene flow by drawing a placeholder later.
            if (fileObj.key === ImageAssets.LOGO) {
                this._logoLoadFailed = true;
            }
        });
        
        this.load.on('filecomplete', (key) => {
            // TRIAGE FIX: Set safe texture filters to prevent mipmap errors
            if (this.textures.exists(key)) {
                const texture = this.textures.get(key);
                if (texture && texture.setFilter) {
                    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
                }
            }
        });

        // Minimal golden-path image loads (select GEN_* loaded explicitly)
        this.load.image(ImageAssets.LOGO, ImagePaths.LOGO);
        this.load.spritesheet(ImageAssets.PLAYER, ImagePaths.PLAYER, SpritesheetConfigs.PLAYER);
        // CharacterSelect portraits (use generated assets to ensure consistency)
        this.load.image(ImageAssets.GEN_SPRITE_WYN_IDLE, ImagePaths.GEN_SPRITE_WYN_IDLE);
        this.load.image(ImageAssets.GEN_SPRITE_PULSAR_BOSS, ImagePaths.GEN_SPRITE_PULSAR_BOSS);
        this.load.image(ImageAssets.GEN_SPRITE_CLUMPER_BOSS, ImagePaths.GEN_SPRITE_CLUMPER_BOSS);
        
        // If you have separate animation frames in your spritesheets directory, load those instead
        // Example for player idle animation (adjust path as needed):
        // this.load.spritesheet('player-idle', 'spritesheets/animations/characters/player/idle/player_idle.png', {
        //     frameWidth: 32,
        //     frameHeight: 32
        // });
        
        // (Pruned legacy UI/tiles/placeholder images)
        
        // Load particle assets
        this.load.image(ImageAssets.PARTICLE_WHITE, ImagePaths.PARTICLE_WHITE);
        // (Generated parallax backdrops autoloaded below)
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


        // Auto-load all generated images from manifest (keys prefixed with GEN_)
        try {
            Object.entries(ImageAssets).forEach(([constName, assetKey]) => {
                if (constName.startsWith('GEN_')) {
                    const p = ImagePaths[constName];
                    if (p) {
                        this.load.image(assetKey, p);
                    }
                }
            });
        } catch (e) {
            console.warn('[Preloader] Skipped autoload of generated images:', e?.message || e);
        }
    }

    create ()
    {
        // Clean up loading timer
        if (this.loadingDotsTimer) {
            this.loadingDotsTimer.destroy();
        }

        // If logo failed to load, create a simple placeholder texture so scenes can continue
        try {
            if (this._logoLoadFailed && this.textures && typeof this.textures.addCanvas === 'function') {
                const canvas = document.createElement('canvas');
                canvas.width = 256; canvas.height = 128;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#0F1B2B';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#00FF88';
                ctx.font = 'bold 28px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('WYN IS BUFF 2', canvas.width/2, canvas.height/2);
                this.textures.addCanvas(ImageAssets.LOGO, canvas);
                console.warn('[Preloader] Logo missing; added placeholder texture for LOGO');
            }
        } catch (e) {
            console.warn('[Preloader] Failed to add placeholder logo texture:', e?.message || e);
        }
        
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.
        
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
        console.log('[Preloader] AudioManager initialized with persisted settings', settings.volumes);
        
        // Get asset health report
        if (this.assetHealthManager) {
            const healthReport = this.assetHealthManager.getHealthReport();
            console.log('[Preloader] Asset health report:', healthReport);
            
            // Show warning if there are corrupted assets
            if (healthReport.corruptedAssets.length > 0) {
                console.warn(`[Preloader] ${healthReport.corruptedAssets.length} corrupted assets detected:`, healthReport.corruptedAssets);
            }
        }
        
        // Show completion animation before transitioning
        const { width, height } = this.cameras.main;
        
        const completedText = this.add.text(width / 2, height * 0.75, 'SYSTEMS READY!', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '32px',
            color: '#00FF88',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setAlpha(0);
        
        // Animate completion
        this.tweens.add({
            targets: completedText,
            alpha: 1,
            scale: { from: 0.8, to: 1.2 },
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Brief pause then transition
                this.time.delayedCall(800, () => {
                    this.cameras.main.fadeOut(600, 0, 0, 0);
                    this.time.delayedCall(600, () => {
                        this.scene.start(SceneKeys.WELCOME);
                    });
                });
            }
        });
    }

    update (time, delta)
    {
        // Placeholder update method for Preloader scene
    }
    
    /**
     * Update loading text with asset health information
     * @param {string} message - Status message to display
     */
    updateLoadingText(message) {
        if (this.loadingText) {
            this.loadingText.setText(message);
            
            // Add a subtle flash animation for notifications
            this.tweens.add({
                targets: this.loadingText,
                alpha: 0.5,
                duration: 200,
                yoyo: true,
                ease: 'Power2.easeInOut'
            });
        }
    }
    
    createPlayerAnimations() {
        // Only create animations if the spritesheet is loaded
        if (this.textures.exists('player')) {
            // Idle animation - using the first row of frames (assuming character sheet layout)
            this.anims.create({
                key: 'player-idle',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
            
            // Walking animation - using the second row of frames
            this.anims.create({
                key: 'player-walk',
                frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
            
            // Jumping animation - single frame or sequence as needed
            this.anims.create({
                key: 'player-jump',
                frames: this.anims.generateFrameNumbers('player', { start: 8, end: 8 }),
                frameRate: 10,
                repeat: 0
            });
            
            // Additional animations can be defined here
        }
    }
}
