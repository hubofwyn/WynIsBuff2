import { Scene } from 'phaser';
import { UIConfig } from '../constants/UIConfig';
import { AudioManager } from '@features/core';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets, AudioAssets } from '../constants/Assets.js';
import { createPrimaryButton, createSecondaryButton } from '../ui/UIButton.js';

/**
 * WelcomeScene: shows the game title and prompts player to start.
 */
export class WelcomeScene extends Scene {
    constructor() {
        super(SceneKeys.WELCOME);
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Enhanced gradient background
        const gradientBg = this.add.graphics();
        gradientBg.fillGradientStyle(0x0f1b2b, 0x1a1a2e, 0x16213e, 0x0f3460, 1);
        gradientBg.fillRect(0, 0, width, height);
        
        // Play title screen music with user interaction unlock
        const audio = AudioManager.getInstance();
        
        // Create title with enhanced styling and animation
        const mainTitle = this.add.text(width / 2, height * 0.25, 'WYN IS BUFF 2', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '84px',
            color: '#FFE66D',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { offsetX: 6, offsetY: 6, color: '#000000', blur: 12, fill: true }
        }).setOrigin(0.5);
        
        // Skill to automation subtitle
        const subtitle = this.add.text(width / 2, height * 0.35, 'SKILL TO AUTOMATION', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '28px',
            color: '#4ECDC4',
            letterSpacing: '6px'
        }).setOrigin(0.5);
        
        // Generated UI button (primary)
        const { btn: startBtn } = createPrimaryButton(this, width / 2, height * 0.65, 'START', () => startGame(), { scale: 0.5 });

        // Interactive prompt with animation (overlay on button)
        const promptText = this.add.text(width / 2, height * 0.65, 'CLICK TO START YOUR TRAINING', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Subtitle with more context
        const contextText = this.add.text(width / 2, height * 0.75, 'Transform your skills into unstoppable automation', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#CCCCCC',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        
        // Animate title entrance
        mainTitle.setScale(0).setAlpha(0);
        this.tweens.add({
            targets: mainTitle,
            scale: 1,
            alpha: 1,
            duration: 1000,
            ease: 'Back.easeOut',
            delay: 200
        });
        
        // Animate subtitle entrance
        subtitle.setX(width + 200).setAlpha(0);
        this.tweens.add({
            targets: subtitle,
            x: width / 2,
            alpha: 1,
            duration: 800,
            ease: 'Power2.easeOut',
            delay: 800
        });
        
        // Animate prompt entrance
        promptText.setY(promptText.y + 50).setAlpha(0);
        this.tweens.add({
            targets: promptText,
            y: promptText.y - 50,
            alpha: 1,
            duration: 600,
            ease: 'Power2.easeOut',
            delay: 1400
        });
        
        // Animate context text
        contextText.setAlpha(0);
        this.tweens.add({
            targets: contextText,
            alpha: 1,
            duration: 600,
            delay: 1800
        });
        
        // Pulsing animation for prompt
        this.tweens.add({
            targets: promptText,
            alpha: 0.7,
            scale: { from: 1, to: 1.05 },
            duration: 1500,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut',
            delay: 2000
        });
        
        // Handle user interaction
        const startGame = (levelOverride) => {
            // Try to unlock audio context
            if (window.Howler && window.Howler.ctx && window.Howler.ctx.state === 'suspended') {
                window.Howler.ctx.resume();
            }
            
            audio.playSFX('click');
            audio.playMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);
            
            // Smooth transition
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.time.delayedCall(800, () => {
                if (levelOverride) {
                    this.scene.start(SceneKeys.RUN, { level: levelOverride });
                } else {
                    this.scene.start(SceneKeys.CHARACTER_SELECT);
                }
            });
        };
        
        // Start on SPACE key
        this.input.keyboard.once('keydown-SPACE', () => startGame());
        
        // Or start on pointer down
        this.input.once('pointerdown', () => startGame());

        // Start on button click
        // startBtn pointerdown handled by UIButton

        // Quick biome hotkeys for direct run (1/2/3)
        this.input.keyboard.on('keydown-ONE', () => startGame('protein-plant'));
        this.input.keyboard.on('keydown-TWO', () => startGame('metronome-mines'));
        this.input.keyboard.on('keydown-THREE', () => startGame('factory-floor'));

        // Simple biome select panel (generated buttons)
        const panelY = height * 0.52;
        const makeBiomeButton = (x, label, levelKey) => {
            const { btn } = createSecondaryButton(this, x, panelY, label, () => startGame(levelKey), { scale: 0.35 });
        };
        makeBiomeButton(width/2 - 180, 'Protein Plant', 'protein-plant');
        makeBiomeButton(width/2,       'Metronome Mines', 'metronome-mines');
        makeBiomeButton(width/2 + 180, 'Factory Floor', 'factory-floor');

        // Show three generated UI icons as examples
        const iconY = height * 0.85;
        this.add.image(width / 2 - 100, iconY, ImageAssets.GEN_UI_ICON_COIN).setScale(0.25);
        this.add.image(width / 2,       iconY, ImageAssets.GEN_UI_ICON_DNA).setScale(0.25);
        this.add.image(width / 2 + 100, iconY, ImageAssets.GEN_UI_ICON_GRIT).setScale(0.25);
        
        // Fade in the camera
        this.cameras.main.fadeIn(1000, 0, 0, 0);
    }

    update(time, delta) {
        // no-op
    }
}
