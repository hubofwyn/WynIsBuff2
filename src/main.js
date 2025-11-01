import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { PauseScene } from './scenes/PauseScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Preloader } from './scenes/Preloader.js';
import { CharacterSelect } from './scenes/CharacterSelect.js';
import { WelcomeScene } from './scenes/WelcomeScene.js';
import { BirthdayMinigame } from './scenes/BirthdayMinigame.js';
import { TestScene } from './scenes/TestScene.js';
import { RunScene } from './scenes/RunScene.js';
import { ResultsScene } from './scenes/ResultsScene.js';
import { HubScene } from './scenes/HubScene.js';
import { FactoryScene } from './scenes/FactoryScene.js';
import { LOG } from './observability/core/LogSystem.js';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
LOG.info('MAIN_PHASER_INITIALIZING', {
    subsystem: 'bootstrap',
    message: 'Initializing Phaser game',
});

const config = {
    type: Phaser.WEBGL,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    // Performance optimizations
    fps: {
        target: 60,
        forceSetTimeOut: false,
        smoothStep: false,
    },
    render: {
        // TRIAGE FIX: Disable mipmaps to prevent OUT_OF_MEMORY and GL_INVALID_OPERATION
        mipmapFilter: 'LINEAR', // Never use *_MIPMAP_* unless we guarantee POT textures
        antialias: false, // Disable anti-aliasing to reduce VRAM usage
        antialiasGL: false, // Explicitly disable WebGL anti-aliasing
        pixelArt: false,
        roundPixels: true, // Reduce sub-pixel rendering overhead
        transparent: false,
        clearBeforeRender: true,
        powerPreference: 'high-performance', // Request dedicated GPU if available
        // Additional safety settings
        failIfMajorPerformanceCaveat: false, // Don't fail on slower hardware
        premultipliedAlpha: false, // Reduce texture complexity
        preserveDrawingBuffer: false, // Don't preserve buffer (saves memory)
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
        TestScene,
    ],
};

const game = new Phaser.Game(config);

// Add game event listeners for debugging
game.events.on('ready', () => {
    LOG.info('MAIN_PHASER_READY', {
        subsystem: 'bootstrap',
        message: 'Phaser game is ready',
        sceneCount: game.scene.scenes.length,
    });
});

// TRIAGE FIX: Handle WebGL context loss gracefully
game.events.on('contextlost', (event) => {
    LOG.warn('MAIN_WEBGL_CONTEXT_LOST', {
        subsystem: 'bootstrap',
        message: 'WebGL context lost - pausing game',
        activeScenes: game.scene.scenes.filter((s) => s.scene.isActive()).length,
        hint: 'Context loss may be due to GPU issues, browser tab management, or system memory pressure. Game will attempt to recover.',
    });
    event.preventDefault(); // Prevent default browser behavior
    // Pause all scenes
    game.scene.scenes.forEach((scene) => {
        if (scene.scene.isActive()) {
            scene.scene.pause();
        }
    });
});

game.events.on('contextrestored', () => {
    LOG.info('MAIN_WEBGL_CONTEXT_RESTORED', {
        subsystem: 'bootstrap',
        message: 'WebGL context restored - resuming game',
        pausedScenes: game.scene.scenes.filter((s) => s.scene.isPaused()).length,
    });
    // Resume all paused scenes
    game.scene.scenes.forEach((scene) => {
        if (scene.scene.isPaused()) {
            scene.scene.resume();
        }
    });
});

LOG.info('MAIN_PHASER_INSTANCE_CREATED', {
    subsystem: 'bootstrap',
    message: 'Phaser game instance created',
    config: {
        width: config.width,
        height: config.height,
        type: config.type === Phaser.WEBGL ? 'WEBGL' : 'CANVAS',
        sceneCount: config.scene.length,
    },
});

export default game;
