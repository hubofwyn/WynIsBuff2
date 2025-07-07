import { Scene } from 'phaser';
import { UIConfig } from '../constants/UIConfig';
import { AudioManager } from '@features/core';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets, AudioAssets } from '../constants/Assets.js';

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
        audio.playMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);
        // Background - use gradient instead of missing image
        this.cameras.main.setBackgroundColor('#1a1a2e');
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
