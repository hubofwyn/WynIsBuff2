import { LOG } from './observability/core/LogSystem.js';
import { AudioUnlockManager } from './core/AudioUnlockManager.js';
import { createAudioUnlockOverlay } from './core/AudioUnlockUI.js';
import { BirthdayMinigame } from './scenes/BirthdayMinigame.js';
import { Boot } from './scenes/Boot.js';
import { CharacterSelect } from './scenes/CharacterSelect.js';
import { FactoryScene } from './scenes/FactoryScene.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { HubScene } from './scenes/HubScene.js';
import { MainMenu } from './scenes/MainMenu.js';
import { PauseScene } from './scenes/PauseScene.js';
import { Preloader } from './scenes/Preloader.js';
import { ResultsScene } from './scenes/ResultsScene.js';
import { RunScene } from './scenes/RunScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { TestScene } from './scenes/TestScene.js';
import { WelcomeScene } from './scenes/WelcomeScene.js';

/**
 * Initialize game with audio unlock handling
 * This ensures audio works properly across all browsers
 */
async function initGame() {
    LOG.info('MAIN_INIT_START', {
        subsystem: 'bootstrap',
        message: 'Starting game initialization',
    });

    // Step 1: Check if audio unlock is needed
    const unlockManager = AudioUnlockManager.getInstance();

    if (unlockManager.shouldShowPrompt()) {
        LOG.info('MAIN_AUDIO_UNLOCK_REQUIRED', {
            subsystem: 'bootstrap',
            message: 'Audio unlock required - showing prompt',
        });

        // Show unlock overlay
        createAudioUnlockOverlay();

        // Wait for user gesture
        await unlockManager.waitForUnlock();

        LOG.info('MAIN_AUDIO_UNLOCKED', {
            subsystem: 'bootstrap',
            message: 'Audio unlocked - proceeding with Phaser boot',
        });
    } else {
        LOG.info('MAIN_AUDIO_UNLOCK_SKIP', {
            subsystem: 'bootstrap',
            message: 'Audio unlock not needed - proceeding with Phaser boot',
        });
    }

    // Step 2: Boot Phaser (audio is now ready)
    bootPhaser();
}

/**
 * Boot Phaser game
 * Called after audio is unlocked
 */
function bootPhaser() {
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
            // TRIAGE FIX: Completely disable mipmaps to prevent WebGL errors
            // Setting mipmapFilter to undefined/null prevents Phaser from generating mipmaps
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

    // AGENTIC DEBUGGING: Expose LOG system to window for browser console access
    // This allows AI agents to query logs via window.LOG.export() or window.LOG.getRecent()
    if (typeof window !== 'undefined') {
        window.LOG = LOG;
        window.game = game;
        window.getGameLogs = () => LOG.export();
        window.getRecentLogs = (count = 20) => LOG.getRecent(count);
        window.getLogStats = () => LOG.getStats();

        // eslint-disable-next-line no-console
        console.log(
            '%c[WynIsBuff2] Observability System Ready',
            'color: #4ECDC4; font-weight: bold'
        );
        // eslint-disable-next-line no-console
        console.log(
            '%cAccess logs via: window.LOG.export(), window.getRecentLogs(), window.getLogStats()',
            'color: #FFE66D'
        );
    }

    return game;
}

// Start game initialization
// This will show audio unlock overlay if needed, then boot Phaser
initGame();
