import { Scene } from 'phaser';
import { AudioManager } from '@features/core';
import { UIConfig } from '../constants/UIConfig';
import { createPrimaryButton, createSecondaryButton } from '../ui/UIButton.js';
import { SceneKeys } from '../constants/SceneKeys.js';

/**
 * PauseScene: overlays the game with a pause menu.
 */
export class PauseScene extends Scene {
    constructor() {
        super(SceneKeys.PAUSE);
    }

    create() {
        const { width, height } = this.cameras.main;
        // Semi-transparent overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);

        // Panel background
        const panelCfg = UIConfig.panel;
        this.add.rectangle(
            width / 2,
            height / 2,
            width * 0.5,
            height * 0.6,
            panelCfg.backgroundColor,
            panelCfg.backgroundAlpha
        ).setOrigin(0.5);

        // Title text
        this.add.text(
            width / 2,
            height / 2 - 100,
            'Paused',
            UIConfig.text.title
        ).setOrigin(0.5);

        // Lower music volume
        const audio = AudioManager.getInstance();
        audio._prePauseMusicVolume = audio.settings.musicVolume;
        audio.setMusicVolume(audio.settings.musicVolume / 2);

        // Menu buttons
        const resume = createPrimaryButton(this, width / 2, height / 2 - 20, 'Resume', () => {
            AudioManager.getInstance().playSFX('click');
            audio.setMusicVolume(audio._prePauseMusicVolume);
            this.scene.stop();
            this.scene.resume(SceneKeys.GAME);
        }, { scale: 0.35 });
        const settings = createSecondaryButton(this, width / 2, height / 2 + 60, 'Settings', () => {
            AudioManager.getInstance().playSFX('click');
            this.scene.launch(SceneKeys.SETTINGS);
            this.scene.pause();
        }, { scale: 0.35 });
        const mainMenu = createSecondaryButton(this, width / 2, height / 2 + 140, 'Main Menu', () => {
            AudioManager.getInstance().playSFX('click');
            audio.setMusicVolume(audio._prePauseMusicVolume);
            this.scene.stop(SceneKeys.GAME);
            this.scene.start(SceneKeys.MAIN_MENU);
            this.scene.stop();
        }, { scale: 0.35 });

        // ESC key resumes
        this.input.keyboard.once('keydown-ESC', () => {
            AudioManager.getInstance().playSFX('click');
            audio.setMusicVolume(audio._prePauseMusicVolume);
            this.scene.stop();
            this.scene.resume(SceneKeys.GAME);
        });
    }
}
