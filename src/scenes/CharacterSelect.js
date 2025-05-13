import { Scene } from 'phaser';
import { GameStateManager } from '../modules/GameStateManager';
import { EventSystem } from '../modules/EventSystem';
import { AudioManager } from '../modules/AudioManager';
import { EventNames } from '../constants/EventNames';
import { UIConfig } from '../constants/UIConfig';

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
        this.add.text(width / 2, 100, 'Select Your Champion', UIConfig.text.heading)
            .setOrigin(0.5);

        // Character options
        const options = [
            { key: 'ila_sprite', label: 'Favorite Sister' },
            { key: 'axel_sprite', label: 'Not Buff Axel' },
            { key: 'wyn_sprite', label: 'Wyn the Buff' }
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
            this.add.text(x, y + 80, opt.label, UIConfig.text.label)
                .setOrigin(0.5);

            // Pointer events
            sprite.on('pointerover', () => {
                sprite.setScale(1.2);
                AudioManager.getInstance().playSFX('hover');
            });
            sprite.on('pointerout', () => {
                sprite.setScale(1);
            });
            sprite.on('pointerdown', () => {
                AudioManager.getInstance().playSFX('click');
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