import { Scene } from 'phaser';
import { GameStateManager, EventSystem, AudioManager } from '@features/core';
import { ImageAssets } from '../constants/Assets.js';
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
        
        // Enhanced gradient background matching the WelcomeScene
        const gradientBg = this.add.graphics();
        gradientBg.fillGradientStyle(0x0f1b2b, 0x1a1a2e, 0x16213e, 0x0f3460, 1);
        gradientBg.fillRect(0, 0, width, height);
        
        // Fade in the camera
        this.cameras.main.fadeIn(600, 0, 0, 0);
        
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

        // Character options with colors and descriptions
        const options = [
            { 
                key: ImageAssets.GEN_SPRITE_CLUMPER_BOSS, 
                label: 'Favorite Sister', 
                color: '#FF6B9D',
                description: 'Swift and agile\nMaster of precision'
            },
            { 
                key: ImageAssets.GEN_SPRITE_PULSAR_BOSS, 
                label: 'Not Buff Axel', 
                color: '#4ECDC4',
                description: 'Balanced fighter\nJack of all trades'
            },
            { 
                key: ImageAssets.GEN_SPRITE_WYN_IDLE, 
                label: 'Wyn the Buff', 
                color: '#FFE66D',
                description: 'Maximum power\nUnstoppable force'
            }
        ];

        const cardConfig = UIConfig.characterSelect;
        // Responsive card sizing to avoid overlap on narrow viewports
        const margin = 40;
        const available = Math.max(100, width - margin * 2);
        let cardWidth = cardConfig.cardWidth;
        let cardHeight = cardConfig.cardHeight;
        const needed = cardConfig.cardWidth * options.length + cardConfig.cardPadding * (options.length - 1);
        if (needed > available) {
            const per = Math.floor((available - cardConfig.cardPadding * (options.length - 1)) / options.length);
            cardWidth = Math.max(120, per);
            // maintain aspect ratio approximately
            cardHeight = Math.floor(cardWidth * (cardConfig.cardHeight / cardConfig.cardWidth));
        }
        const totalWidth = (cardWidth + cardConfig.cardPadding) * options.length - cardConfig.cardPadding;
        const startX = (width - totalWidth) / 2 + cardWidth / 2;

        // Track selected card for visual feedback
        let selectedCard = null;

        // Create description area at the bottom
        const descriptionBg = this.add.graphics()
            .fillStyle(0x16213e, 0.8)
            .fillRoundedRect(width/2 - 200, height - 180, 400, 80, 15)
            .setAlpha(0);
            
        const descriptionText = this.add.text(width/2, height - 140, '', {
            ...UIConfig.text.subtitle,
            fontSize: '20px',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5).setAlpha(0);

        options.forEach((opt, idx) => {
            const x = startX + idx * (cardConfig.cardWidth + cardConfig.cardPadding);
            const y = height / 2;

            // Create container for the entire card
            const cardContainer = this.add.container(x, y);

            // Create character card background
            const cardBg = this.add.graphics();
            const drawCard = (borderColor = cardConfig.cardBorderColor, borderWidth = cardConfig.cardBorderWidth, fillAlpha = cardConfig.cardBackgroundAlpha) => {
                cardBg.clear()
                    .fillStyle(cardConfig.cardBackgroundColor, fillAlpha)
                    .fillRoundedRect(
                        -cardWidth / 2, 
                        -cardHeight / 2, 
                        cardWidth, 
                        cardHeight, 
                        cardConfig.cardBorderRadius
                    )
                    .lineStyle(borderWidth, borderColor)
                    .strokeRoundedRect(
                        -cardWidth / 2, 
                        -cardHeight / 2, 
                        cardWidth, 
                        cardHeight, 
                        cardConfig.cardBorderRadius
                    );
            };
            drawCard();

            // Add glow effect behind the card
            const glow = this.add.graphics()
                .fillStyle(Phaser.Display.Color.HexStringToColor(opt.color).color, 0.3)
                .fillRoundedRect(
                    -cardWidth / 2 - 10, 
                    -cardHeight / 2 - 10, 
                    cardWidth + 20, 
                    cardHeight + 20, 
                    cardConfig.cardBorderRadius + 5
                );
            glow.setVisible(false);

            // Character sprite
            let sprite;
            if (this.textures.exists(opt.key)) {
                sprite = this.add.image(0, -30, opt.key).setOrigin(0.5);
                // Fit portrait to card while preserving aspect ratio
                const maxW = Math.floor(cardWidth * 0.6);
                const maxH = Math.floor(cardHeight * 0.6);
                const tx = this.textures.get(opt.key);
                const base = tx?.getSourceImage ? tx.getSourceImage() : null;
                const naturalW = (base && base.width) || sprite.width;
                const naturalH = (base && base.height) || sprite.height;
                const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
                sprite.setDisplaySize(Math.floor(naturalW * scale), Math.floor(naturalH * scale));
            } else {
                const maxW = Math.floor(cardWidth * 0.6);
                const maxH = Math.floor(cardHeight * 0.6);
                sprite = this.add.rectangle(0, -30, maxW, maxH, 0x666699)
                    .setOrigin(0.5);
            }

            // Character label with accent color
            const label = this.add.text(0, 70, opt.label, {
                ...UIConfig.text.label,
                color: opt.color,
                fontSize: '18px'
            }).setOrigin(0.5);

            // Interactive area
            const hitArea = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0)
                .setInteractive({ useHandCursor: true });

            // Add all elements to container
            cardContainer.add([glow, cardBg, sprite, label, hitArea]);

            // Mark selected character if it matches
            if (opt.key === this.selection) {
                selectedCard = cardContainer;
                drawCard(Phaser.Display.Color.HexStringToColor(opt.color).color, cardConfig.selectedBorderWidth, 1);
                // Don't scale the selected card anymore
                glow.setVisible(true);
                
                // Show description for selected character
                descriptionText.setText(opt.description);
                descriptionText.setColor(opt.color);
                this.time.delayedCall(800, () => {
                    this.tweens.add({
                        targets: [descriptionBg, descriptionText],
                        alpha: 1,
                        duration: 300,
                        ease: 'Power2.easeOut'
                    });
                });
            }
            
            // Add "BEST" indicator for Wyn
            if (opt.key === 'wynSprite') {
                // Create BEST text
                const bestText = this.add.text(0, -cardConfig.cardHeight/2 - 60, 'BEST', {
                    fontFamily: 'Impact, Arial Black',
                    fontSize: '36px',
                    color: '#FFD700',
                    stroke: '#FF0000',
                    strokeThickness: 4
                }).setOrigin(0.5);
                
                // Create pointing hand emoji
                const pointer = this.add.text(0, -cardConfig.cardHeight/2 - 30, '👇', {
                    fontSize: '32px'
                }).setOrigin(0.5);
                
                // Add them to the container
                cardContainer.add([bestText, pointer]);
                
                // Animate the BEST text
                this.tweens.add({
                    targets: bestText,
                    scale: { from: 0.9, to: 1.1 },
                    duration: 1000,
                    ease: 'Sine.InOut',
                    repeat: -1,
                    yoyo: true
                });
                
                // Animate the pointer
                this.tweens.add({
                    targets: pointer,
                    y: `-=${10}`,
                    duration: 500,
                    ease: 'Sine.InOut',
                    repeat: -1,
                    yoyo: true
                });
            }

            // Enhanced hover effects
            hitArea.on('pointerover', () => {
                if (cardContainer === selectedCard) return; // Don't hover effect the selected card
                
                AudioManager.getInstance().playSFX('hover');
                
                // Scale the container, not individual elements
                this.tweens.add({
                    targets: cardContainer,
                    scaleX: cardConfig.hoverScale,
                    scaleY: cardConfig.hoverScale,
                    duration: UIConfig.animations.buttonHover.duration,
                    ease: UIConfig.animations.buttonHover.ease
                });
                
                // Show glow effect
                glow.setVisible(true);
                this.tweens.add({
                    targets: glow,
                    alpha: 0.5,
                    duration: UIConfig.animations.buttonHover.duration,
                    ease: UIConfig.animations.buttonHover.ease
                });
                
                // Update border color
                drawCard(Phaser.Display.Color.HexStringToColor(opt.color).color, cardConfig.cardBorderWidth + 2, cardConfig.cardBackgroundAlpha);
                
                // Show description
                descriptionText.setText(opt.description);
                descriptionText.setColor(opt.color);
                this.tweens.add({
                    targets: [descriptionBg, descriptionText],
                    alpha: 1,
                    duration: 200,
                    ease: 'Power2.easeOut'
                });
            });

            hitArea.on('pointerout', () => {
                if (cardContainer === selectedCard) return; // Don't change the selected card
                
                // Reset scale
                this.tweens.add({
                    targets: cardContainer,
                    scaleX: 1,
                    scaleY: 1,
                    duration: UIConfig.animations.buttonHover.duration,
                    ease: UIConfig.animations.buttonHover.ease
                });
                
                // Hide glow effect
                this.tweens.add({
                    targets: glow,
                    alpha: 0,
                    duration: UIConfig.animations.buttonHover.duration,
                    ease: UIConfig.animations.buttonHover.ease,
                    onComplete: () => glow.setVisible(false)
                });
                
                // Reset border
                drawCard();
                
                // Hide description
                this.tweens.add({
                    targets: [descriptionBg, descriptionText],
                    alpha: 0,
                    duration: 200,
                    ease: 'Power2.easeOut'
                });
            });

            hitArea.on('pointerdown', () => {
                AudioManager.getInstance().playSFX('click');
                
                // Deselect previous card
                if (selectedCard && selectedCard !== cardContainer) {
                    this.tweens.add({
                        targets: selectedCard,
                        scaleX: 1,
                        scaleY: 1,
                        duration: UIConfig.animations.buttonPress.duration,
                        ease: UIConfig.animations.buttonPress.ease
                    });
                    // Reset the previous selected card's visuals
                    const prevGlow = selectedCard.getAt(0);
                    prevGlow.setVisible(false);
                }
                
                // Select this card
                selectedCard = cardContainer;
                
                this.tweens.add({
                    targets: cardContainer,
                    scaleX: UIConfig.animations.buttonPress.scale,
                    scaleY: UIConfig.animations.buttonPress.scale,
                    duration: UIConfig.animations.buttonPress.duration,
                    ease: UIConfig.animations.buttonPress.ease,
                    yoyo: true,
                    onComplete: () => {
                        // Apply selected state without scaling
                        drawCard(Phaser.Display.Color.HexStringToColor(opt.color).color, cardConfig.selectedBorderWidth, 1);
                        glow.setVisible(true);
                        
                        this.selection = opt.key;
                        this.gameState.setSelectedCharacter(opt.key);
                        this.eventSystem.emit(EventNames.SELECT_CHARACTER, { key: opt.key });
                        
                        // Add a slight delay before transitioning
                        this.time.delayedCall(500, () => {
                            this.cameras.main.fadeOut(UIConfig.animations.fadeOutDuration);
                            this.time.delayedCall(UIConfig.animations.fadeOutDuration, () => {
                                this.scene.start(SceneKeys.MAIN_MENU);
                            });
                        });
                    }
                });
            });

            // Animate card entrance with stagger
            cardContainer.setAlpha(0).setY(cardContainer.y + 100);

            this.tweens.add({
                targets: cardContainer,
                alpha: 1,
                y: `-=100`,
                duration: 700,
                ease: 'Back.easeOut',
                delay: idx * 150
            });
        });

        // Add instruction text (moved up to avoid overlap with description)
        const instructionText = this.add.text(width / 2, height - 220, 'Click to select your champion', {
            ...UIConfig.text.subtitle,
            fontSize: '22px'
        })
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
