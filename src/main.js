import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { PauseScene } from './scenes/PauseScene';
import { SettingsScene } from './scenes/SettingsScene';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { CharacterSelect } from './scenes/CharacterSelect';
import { WelcomeScene } from './scenes/WelcomeScene';
import { BirthdayMinigame } from './scenes/BirthdayMinigame';
import { TestScene } from './scenes/TestScene';
import { RunScene } from './scenes/RunScene';
import { ResultsScene } from './scenes/ResultsScene';
import { HubScene } from './scenes/HubScene';
import { FactoryScene } from './scenes/FactoryScene';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
console.log('[Main] Initializing Phaser game...');

const config = {
    type: Phaser.WEBGL,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    // Performance optimizations
    fps: {
        target: 60,
        forceSetTimeOut: false,
        smoothStep: false
    },
    render: {
        // TRIAGE FIX: Disable mipmaps to prevent OUT_OF_MEMORY and GL_INVALID_OPERATION
        mipmapFilter: 'LINEAR',      // Never use *_MIPMAP_* unless we guarantee POT textures
        antialias: false,            // Disable anti-aliasing to reduce VRAM usage
        antialiasGL: false,          // Explicitly disable WebGL anti-aliasing
        pixelArt: false,
        roundPixels: true,           // Reduce sub-pixel rendering overhead
        transparent: false,
        clearBeforeRender: true,
        powerPreference: 'high-performance',  // Request dedicated GPU if available
        // Additional safety settings
        failIfMajorPerformanceCaveat: false,  // Don't fail on slower hardware
        premultipliedAlpha: false,            // Reduce texture complexity
        preserveDrawingBuffer: false          // Don't preserve buffer (saves memory)
    },
    scene: [
        Boot,
        Preloader,
        WelcomeScene,
        CharacterSelect,
        MainMenu,
        Game,
        RunScene,
        ResultsScene,
        HubScene,
        FactoryScene,
        PauseScene,
        SettingsScene,
        GameOver,
        BirthdayMinigame,
        TestScene
    ]
};

const game = new Phaser.Game(config);

// Add game event listeners for debugging
game.events.on('ready', () => {
    console.log('[Main] Phaser game is ready!');
});

// TRIAGE FIX: Handle WebGL context loss gracefully
game.events.on('contextlost', (event) => {
    console.warn('[Main] WebGL context lost - pausing game');
    event.preventDefault(); // Prevent default browser behavior
    // Pause all scenes
    game.scene.scenes.forEach(scene => {
        if (scene.scene.isActive()) {
            scene.scene.pause();
        }
    });
});

game.events.on('contextrestored', () => {
    console.log('[Main] WebGL context restored - resuming game');
    // Resume all paused scenes
    game.scene.scenes.forEach(scene => {
        if (scene.scene.isPaused()) {
            scene.scene.resume();
        }
    });
});

console.log('[Main] Phaser game instance created:', game);

export default game;
