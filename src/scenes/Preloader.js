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
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - paths already include 'assets/' prefix

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
        
        // Load tileset as spritesheet for platform tiles
        this.load.spritesheet('dungeon-tiles', ImagePaths.DUNGEON_TILES, {
            frameWidth: 16,
            frameHeight: 16
        });
        
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
        // Parallax background layers for level1
        this.load.image(ImageAssets.PARALLAX_SKY, ImagePaths.PARALLAX_SKY);
        this.load.image(ImageAssets.PARALLAX_MOUNTAINS, ImagePaths.PARALLAX_MOUNTAINS);
        this.load.image(ImageAssets.PARALLAX_FOREGROUND, ImagePaths.PARALLAX_FOREGROUND);
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.
        
        // Define player animations that can be used across scenes
        this.createPlayerAnimations();
        
        // Initialize AudioManager (loads Howler sounds) and apply persisted audio settings
        const audio = AudioManager.getInstance();
        // Load persisted settings and apply volumes
        // Initialize and apply persisted settings via GameStateManager
        const gs = new GameStateManager();
        const settings = gs.settings || {};
        if (settings.volumes) {
            audio.setMasterVolume(settings.volumes.master);
            audio.setMusicVolume(settings.volumes.music);
            audio.setSFXVolume(settings.volumes.sfx);
        }
        console.log('[Preloader] AudioManager initialized with persisted settings', settings.volumes);
        // Move to Welcome Screen
        this.scene.start(SceneKeys.WELCOME);
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
