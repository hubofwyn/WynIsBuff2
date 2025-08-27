import { Scene } from 'phaser';
import { AudioManager, GameStateManager } from '@features/core';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets, ImagePaths, AudioAssets, AudioPaths, SpritesheetConfigs } from '../constants/Assets.js';

export class Preloader extends Scene
{
    constructor ()
    {
        super(SceneKeys.PRELOADER);
    }

    init ()
    {
        const { width, height } = this.cameras.main;
        
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

        // Load the custom game logo
        this.load.image(ImageAssets.LOGO, ImagePaths.LOGO);
        
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

    create ()
    {
        // Clean up loading timer
        if (this.loadingDotsTimer) {
            this.loadingDotsTimer.destroy();
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
