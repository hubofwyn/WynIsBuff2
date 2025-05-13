import { Scene } from 'phaser';
import { AudioManager } from '../modules/AudioManager';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
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
        //  Load the assets for the game
        this.load.setPath('assets');

        // Load the custom game logo
        // Points to assets/images/ui/wynisbuff2-logo.png
        this.load.image('logo', 'images/ui/wynisbuff2-logo.png');
        
        // Load player character sprite
        // IMPORTANT: For character animations, we need to load as a spritesheet
        // For single frame use, we'll still load the full image
        this.load.image('player-full', '2D Pixel Dungeon Asset Pack v2.0/2D Pixel Dungeon Asset Pack/character and tileset/Dungeon_Character.png');
        
        // Load character sprite for animation - we'll extract frames from it
        this.load.spritesheet('player', '2D Pixel Dungeon Asset Pack v2.0/2D Pixel Dungeon Asset Pack/character and tileset/Dungeon_Character.png', {
            frameWidth: 16,  // Adjust these values based on the actual sprite dimensions
            frameHeight: 16,
            margin: 0,
            spacing: 0
        });
        
        // If you have separate animation frames in your spritesheets directory, load those instead
        // Example for player idle animation (adjust path as needed):
        // this.load.spritesheet('player-idle', 'spritesheets/animations/characters/player/idle/player_idle.png', {
        //     frameWidth: 32,
        //     frameHeight: 32
        // });
        
        // Load tileset for potential use in level design
        this.load.image('dungeon-tiles', 'images/tilesets/Dungeon_Tileset.png');
        
        // Load UI elements
        this.load.image('arrow-1', 'images/ui/interface/arrow_1.png');
        this.load.image('arrow-2', 'images/ui/interface/arrow_2.png');
        this.load.image('arrow-3', 'images/ui/interface/arrow_3.png');
        this.load.image('arrow-4', 'images/ui/interface/arrow_4.png');
        
        // Load item sprites that might be useful
        this.load.image('coin', 'spritesheets/items/coin.png');
        this.load.image('chest', 'spritesheets/items/chest.png');
        // Themed collectible icons for level1
        this.load.image('collectible-protein', 'spritesheets/items/flasks/flasks_2.png');
        this.load.image('collectible-dumbbell', 'spritesheets/items/chest.png');
        
        // Load torch effect for potential environment enhancement
        this.load.image('torch', 'spritesheets/effects/torch/torch.png');
        // Buff-themed boss placeholder
        this.load.image('axelface', 'images/characters/axelface.png');
        // Secondary character: Wyn face placeholder
        this.load.image('wynface', 'images/characters/wynface.png');
        // Preload additional character sprites
        this.load.image('ila_sprite', 'images/characters/ila_sprite.png');
        this.load.image('axel_sprite', 'images/characters/axel_sprite.png');
        this.load.image('wyn_sprite', 'images/characters/wyn_sprite.png');
        // Buff-themed background for level1
        this.load.image('buff-bg', 'images/backgrounds/buff-bg.png');
        // Load audio assets (MP3 only; OGG fallback later)
        this.load.audio('proteinPixelAnthem', ['sounds/opener/protein-pixel-anthem.mp3']);
        this.load.audio('hyperBuffBlitz', ['sounds/background/hyper-buff-blitz.mp3']);
        // Land effects variants
        this.load.audio('sfxLand1', ['sounds/land-effects/land1.mp3']);
        this.load.audio('sfxLand2', ['sounds/land-effects/land2.mp3']);
        this.load.audio('sfxLand3', ['sounds/land-effects/land3.mp3']);
        this.load.audio('sfxLand4', ['sounds/land-effects/land4.mp3']);
        // Pickup effects variants
        this.load.audio('sfxPickup1', ['sounds/pickup-effects/pickup1.mp3']);
        this.load.audio('sfxPickup2', ['sounds/pickup-effects/pickup2.mp3']);
        this.load.audio('sfxPickup3', ['sounds/pickup-effects/pickup3.mp3']);
        this.load.audio('sfxPickup4', ['sounds/pickup-effects/pickup4.mp3']);
        // UI click / hover variants
        this.load.audio('sfxClick1', ['sounds/primary-click/click1.mp3']);
        this.load.audio('sfxClick2', ['sounds/primary-click/click2.mp3']);
        this.load.audio('sfxClick3', ['sounds/primary-click/click3.mp3']);
        this.load.audio('sfxClick4', ['sounds/primary-click/click4.mp3']);
        this.load.audio('sfxHover1', ['sounds/ui-hover/hover1.mp3']);
        this.load.audio('sfxHover2', ['sounds/ui-hover/hover2.mp3']);
        this.load.audio('sfxHover3', ['sounds/ui-hover/hover3.mp3']);
        this.load.audio('sfxHover4', ['sounds/ui-hover/hover4.mp3']);
        // Parallax background layers for level1
        this.load.image('parallax-sky', 'images/backgrounds/parallax-sky.png');
        this.load.image('parallax-mountains', 'images/backgrounds/parallax-mountains.png');
        this.load.image('parallax-foreground', 'images/backgrounds/parallax-foreground.png');
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
        const { GameStateManager } = require('../modules/GameStateManager');
        const gs = new GameStateManager();
        const settings = gs.settings || {};
        if (settings.volumes) {
            audio.setMasterVolume(settings.volumes.master);
            audio.setMusicVolume(settings.volumes.music);
            audio.setSFXVolume(settings.volumes.sfx);
        }
        console.log('[Preloader] AudioManager initialized with persisted settings', settings.volumes);
        // Move to Welcome Screen
        this.scene.start('Welcome');
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