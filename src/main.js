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

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
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
        PauseScene,
        SettingsScene,
        GameOver,
        BirthdayMinigame
    ]
};

export default new Phaser.Game(config);
