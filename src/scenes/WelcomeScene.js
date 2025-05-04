import { Scene } from 'phaser';

/**
 * WelcomeScene: shows the game title and prompts player to start.
 */
export class WelcomeScene extends Scene {
    constructor() {
        super('Welcome');
    }

    create() {
        const { width, height } = this.cameras.main;
        // Background
        if (this.textures.exists('buff-bg')) {
            this.add.image(0, 0, 'buff-bg').setOrigin(0, 0).setScrollFactor(0);
        } else {
            this.cameras.main.setBackgroundColor('#000000');
        }
        // Logo or title
        if (this.textures.exists('logo')) {
            this.add.image(width / 2, height * 0.25, 'logo')
                .setOrigin(0.5)
                .setScale(0.75);
        }
        // Game title
        this.add.text(width / 2, height * 0.45, 'Wyn Is Buff 2', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);
        // Subtitle / prompt
        this.add.text(width / 2, height * 0.65, 'Press SPACE to Begin', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);
        // Start on SPACE key
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('CharacterSelect');
        });
        // Or start on pointer down
        this.input.once('pointerdown', () => {
            this.scene.start('CharacterSelect');
        });
    }

    update(time, delta) {
        // no-op
    }
}