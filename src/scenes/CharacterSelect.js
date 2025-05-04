import { Scene } from 'phaser';
import { GameStateManager } from '../modules/GameStateManager';
import { EventSystem } from '../modules/EventSystem';
import { EventNames } from '../constants/EventNames';

/**
 * CharacterSelectScene allows the player to choose their character before gameplay.
 */
export class CharacterSelect extends Scene {
    constructor() {
        super('CharacterSelect');
        this.gameState = new GameStateManager();
        this.eventSystem = new EventSystem();
        this.selection = this.gameState.getSelectedCharacter() || 'axelface';
    }

    preload() {
        // Ensure character assets are loaded (Preloader has already loaded these)
    }

    create() {
        const { width, height } = this.cameras.main;
        // Title
        this.add.text(width / 2, 100, 'Select Your Champion', {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Character options
        const options = [
            { key: 'axelface', label: 'Axel Face' },
            { key: 'wynface', label: 'Wyn Face' }
        ];

        options.forEach((opt, idx) => {
            const x = width * (0.3 + idx * 0.4);
            const y = height / 2;

            // Display sprite
            let sprite;
            if (this.textures.exists(opt.key)) {
                sprite = this.add.image(x, y, opt.key).setDisplaySize(128, 128);
            } else {
                sprite = this.add.rectangle(x, y, 128, 128, 0x888888);
            }
            sprite.setInteractive({ useHandCursor: true });

            // Label
            this.add.text(x, y + 80, opt.label, {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            // Pointer events
            sprite.on('pointerover', () => {
                sprite.setScale(1.2);
            });
            sprite.on('pointerout', () => {
                sprite.setScale(1);
            });
            sprite.on('pointerdown', () => {
                this.selection = opt.key;
                this.gameState.setSelectedCharacter(opt.key);
                this.eventSystem.emit(EventNames.SELECT_CHARACTER, { key: opt.key });
                this.scene.start('MainMenu');
            });
        });
    }

    update(time, delta) {
        // No per-frame logic needed
    }
}