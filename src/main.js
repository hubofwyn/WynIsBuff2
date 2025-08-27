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
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
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
        antialias: true,
        pixelArt: false,
        roundPixels: false,
        transparent: false,
        clearBeforeRender: true,
        powerPreference: 'default' // 'high-performance', 'low-power', or 'default'
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

console.log('[Main] Phaser game instance created:', game);

export default game;
