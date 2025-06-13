import { Scene } from 'phaser';
import { GameStateManager, EventSystem, AudioManager } from '@features/core';
import { EventNames } from '../constants/EventNames';
import { UIConfig } from '../constants/UIConfig';
import { SceneKeys } from '../constants/SceneKeys.js';

/**
 * CharacterSelectScene allows the player to choose their character before gameplay.
 */
export class CharacterSelect extends Scene {
    constructor() {
        super(SceneKeys.CHARACTER_SELECT);
        this.gameState = new GameStateManager();
        this.eventSystem = new EventSystem();
        this.selection = null; // Will be set in create()
    }

    preload() {
        // Ensure character assets are loaded (Preloader has already loaded these)
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Initialize selection after GameStateManager is fully ready
        this.selection = this.gameState.getSelectedCharacter();
        console.log('[CharacterSelect] Current selection:', this.selection);
        
        // Add dark gradient background
        this.cameras.main.setBackgroundColor('#0F1B2B');
        
        // Title with modern styling and animation
        const title = this.add.text(width / 2, 120, 'Select Your Champion', UIConfig.text.heading)
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(UIConfig.animations.scaleIn.start);
            
        // Animate title entrance
        this.tweens.add({
            targets: title,
            alpha: 1,
            scale: UIConfig.animations.scaleIn.end,
            duration: UIConfig.animations.scaleIn.duration,
            ease: UIConfig.animations.scaleIn.ease
        });

        // Character options with colors
        const options = [
            { key: 'ilaSprite', label: 'Favorite Sister', color: '#FF6B9D' },
            { key: 'axelSprite', label: 'Not Buff Axel', color: '#4ECDC4' },
            { key: 'wynSprite', label: 'Wyn the Buff', color: '#FFE66D' }
        ];

        const cardConfig = UIConfig.characterSelect;
        const totalWidth = (cardConfig.cardWidth + cardConfig.cardPadding) * options.length - cardConfig.cardPadding;
        const startX = (width - totalWidth) / 2 + cardConfig.cardWidth / 2;

        options.forEach((opt, idx) => {
            const x = startX + idx * (cardConfig.cardWidth + cardConfig.cardPadding);
            const y = height / 2;

            // Create character card background
            const cardBg = this.add.graphics()
                .fillStyle(cardConfig.cardBackgroundColor, cardConfig.cardBackgroundAlpha)
                .fillRoundedRect(
                    x - cardConfig.cardWidth / 2, 
                    y - cardConfig.cardHeight / 2, 
                    cardConfig.cardWidth, 
                    cardConfig.cardHeight, 
                    cardConfig.cardBorderRadius
                )
                .lineStyle(cardConfig.cardBorderWidth, cardConfig.cardBorderColor)
                .strokeRoundedRect(
                    x - cardConfig.cardWidth / 2, 
                    y - cardConfig.cardHeight / 2, 
                    cardConfig.cardWidth, 
                    cardConfig.cardHeight, 
                    cardConfig.cardBorderRadius
                );

            // Character sprite
            let sprite;
            if (this.textures.exists(opt.key)) {
                sprite = this.add.image(x, y - 30, opt.key)
                    .setDisplaySize(120, 120)
                    .setOrigin(0.5);
            } else {
                sprite = this.add.rectangle(x, y - 30, 120, 120, 0x666699)
                    .setOrigin(0.5);
            }

            // Character label with accent color
            const label = this.add.text(x, y + 70, opt.label, {
                ...UIConfig.text.label,
                color: opt.color,
                fontSize: '18px'
            }).setOrigin(0.5);

            // Interactive area
            const hitArea = this.add.rectangle(x, y, cardConfig.cardWidth, cardConfig.cardHeight, 0x000000, 0)
                .setInteractive({ useHandCursor: true });

            // Enhanced hover effects
            hitArea.on('pointerover', () => {
                AudioManager.getInstance().playSFX('hover');
                
                this.tweens.add({
                    targets: [cardBg, sprite, label],
                    scaleX: cardConfig.hoverScale,
                    scaleY: cardConfig.hoverScale,
                    duration: UIConfig.animations.buttonHover.duration,
                    ease: UIConfig.animations.buttonHover.ease
                });
                
                // Update border color
                cardBg.clear()
                    .fillStyle(cardConfig.cardBackgroundColor, cardConfig.cardBackgroundAlpha)
                    .fillRoundedRect(
                        x - cardConfig.cardWidth / 2, 
                        y - cardConfig.cardHeight / 2, 
                        cardConfig.cardWidth, 
                        cardConfig.cardHeight, 
                        cardConfig.cardBorderRadius
                    )
                    .lineStyle(cardConfig.cardBorderWidth + 2, Phaser.Display.Color.HexStringToColor(opt.color).color)
                    .strokeRoundedRect(
                        x - cardConfig.cardWidth / 2, 
                        y - cardConfig.cardHeight / 2, 
                        cardConfig.cardWidth, 
                        cardConfig.cardHeight, 
                        cardConfig.cardBorderRadius
                    );
            });

            hitArea.on('pointerout', () => {
                this.tweens.add({
                    targets: [cardBg, sprite, label],
                    scaleX: 1,
                    scaleY: 1,
                    duration: UIConfig.animations.buttonHover.duration,
                    ease: UIConfig.animations.buttonHover.ease
                });
                
                // Reset border
                cardBg.clear()
                    .fillStyle(cardConfig.cardBackgroundColor, cardConfig.cardBackgroundAlpha)
                    .fillRoundedRect(
                        x - cardConfig.cardWidth / 2, 
                        y - cardConfig.cardHeight / 2, 
                        cardConfig.cardWidth, 
                        cardConfig.cardHeight, 
                        cardConfig.cardBorderRadius
                    )
                    .lineStyle(cardConfig.cardBorderWidth, cardConfig.cardBorderColor)
                    .strokeRoundedRect(
                        x - cardConfig.cardWidth / 2, 
                        y - cardConfig.cardHeight / 2, 
                        cardConfig.cardWidth, 
                        cardConfig.cardHeight, 
                        cardConfig.cardBorderRadius
                    );
            });

            hitArea.on('pointerdown', () => {
                AudioManager.getInstance().playSFX('click');
                
                this.tweens.add({
                    targets: [cardBg, sprite, label],
                    scaleX: UIConfig.animations.buttonPress.scale,
                    scaleY: UIConfig.animations.buttonPress.scale,
                    duration: UIConfig.animations.buttonPress.duration,
                    ease: UIConfig.animations.buttonPress.ease,
                    yoyo: true,
                    onComplete: () => {
                        this.selection = opt.key;
                        this.gameState.setSelectedCharacter(opt.key);
                        this.eventSystem.emit(EventNames.SELECT_CHARACTER, { key: opt.key });
                        
                        this.cameras.main.fadeOut(UIConfig.animations.fadeOutDuration);
                        this.time.delayedCall(UIConfig.animations.fadeOutDuration, () => {
                            this.scene.start(SceneKeys.MAIN_MENU);
                        });
                    }
                });
            });

            // Animate card entrance with stagger
            [cardBg, sprite, label].forEach(element => {
                element.setAlpha(0).setY(element.y + 100);
            });

            this.tweens.add({
                targets: [cardBg, sprite, label],
                alpha: 1,
                y: `-=100`,
                duration: 700,
                ease: 'Back.easeOut',
                delay: idx * 150
            });
        });

        // Add instruction text
        const instructionText = this.add.text(width / 2, height - 80, 'Click to select your character', UIConfig.text.subtitle)
            .setOrigin(0.5)
            .setAlpha(0);
            
        this.tweens.add({
            targets: instructionText,
            alpha: 1,
            duration: 500,
            delay: 800
        });
        
        this.tweens.add({
            targets: instructionText,
            alpha: 0.7,
            duration: 1500,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true
        });
    }

    update(time, delta) {
        // No per-frame logic needed
    }
}
