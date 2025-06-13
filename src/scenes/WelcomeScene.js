import { Scene } from 'phaser';
import { UIConfig } from '../constants/UIConfig';
import { AudioManager } from '@features/core';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets } from '../constants/Assets.js';

/**
 * WelcomeScene: shows the game title and prompts player to start.
 */
export class WelcomeScene extends Scene {
    constructor() {
        super(SceneKeys.WELCOME);
    }

    create() {
        const { width, height } = this.cameras.main;
        // Play title screen music
        const audio = AudioManager.getInstance();
        audio.playMusic('proteinPixelAnthem');
        // Background
        if (this.textures.exists(ImageAssets.BUFF_BG)) {
            this.add.image(0, 0, ImageAssets.BUFF_BG).setOrigin(0, 0).setScrollFactor(0);
        } else {
            this.cameras.main.setBackgroundColor('#000000');
        }
        // Logo or title
        if (this.textures.exists(ImageAssets.LOGO)) {
            this.add.image(width / 2, height * 0.25, ImageAssets.LOGO)
                .setOrigin(0.5)
                .setScale(0.75);
        }
        // Game title
        this.add.text(width / 2, height * 0.45, 'Wyn Is Buff 2', UIConfig.text.title)
            .setOrigin(0.5);
        // Subtitle / prompt
        this.add.text(width / 2, height * 0.65, 'Press SPACE to Begin', UIConfig.text.subtitle)
            .setOrigin(0.5);
        // Start on SPACE key
        this.input.keyboard.once('keydown-SPACE', () => {
            audio.playSFX('click');
            this.scene.start(SceneKeys.CHARACTER_SELECT);
        });
        // Or start on pointer down
        this.input.once('pointerdown', () => {
            audio.playSFX('click');
            this.scene.start(SceneKeys.CHARACTER_SELECT);
        });
    }

    update(time, delta) {
        // no-op
    }
}
