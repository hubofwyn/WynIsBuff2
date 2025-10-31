import { Scene } from 'phaser';
import { AudioManager } from '@features/core';

import { UIConfig } from '../constants/UIConfig';
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
        this.add
            .rectangle(
                width / 2,
                height / 2,
                width * 0.5,
                height * 0.6,
                panelCfg.backgroundColor,
                panelCfg.backgroundAlpha
            )
            .setOrigin(0.5);

        // Title text
        this.add.text(width / 2, height / 2 - 100, 'Paused', UIConfig.text.title).setOrigin(0.5);

        // Lower music volume
        const audio = AudioManager.getInstance();
        audio._prePauseMusicVolume = audio.settings.musicVolume;
        audio.setMusicVolume(audio.settings.musicVolume / 2);

        // Menu buttons
        const buttons = [
            { key: 'resume', label: 'Resume', yOffset: -20 },
            { key: 'mainMenu', label: 'Main Menu', yOffset: 60 },
            { key: 'settings', label: 'Settings', yOffset: 140 },
        ];
        buttons.forEach((btnCfg) => {
            const btn = this.add
                .text(width / 2, height / 2 + btnCfg.yOffset, btnCfg.label, UIConfig.menuButton)
                .setOrigin(0.5)
                .setInteractive();

            btn.on('pointerover', () => {
                btn.setTint(UIConfig.menuButton.hoverTint);
                AudioManager.getInstance().playSFX('hover');
            });
            btn.on('pointerout', () => btn.clearTint());
            btn.on('pointerdown', () => {
                AudioManager.getInstance().playSFX('click');
                if (btnCfg.key === 'resume') {
                    // Restore music volume
                    audio.setMusicVolume(audio._prePauseMusicVolume);
                    this.scene.stop();
                    this.scene.resume(SceneKeys.GAME);
                } else if (btnCfg.key === 'mainMenu') {
                    // Restore music volume
                    audio.setMusicVolume(audio._prePauseMusicVolume);
                    this.scene.stop(SceneKeys.GAME);
                    this.scene.start(SceneKeys.MAIN_MENU);
                    this.scene.stop();
                } else if (btnCfg.key === 'settings') {
                    // Launch Settings scene and pause this scene
                    this.scene.launch(SceneKeys.SETTINGS);
                    this.scene.pause();
                }
            });
        });

        // ESC key resumes
        this.input.keyboard.once('keydown-ESC', () => {
            AudioManager.getInstance().playSFX('click');
            audio.setMusicVolume(audio._prePauseMusicVolume);
            this.scene.stop();
            this.scene.resume(SceneKeys.GAME);
        });
    }
}
