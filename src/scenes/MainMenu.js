import { Scene } from 'phaser';
import { GameStateManager, AudioManager } from '@features/core';
import { UIConfig } from '../constants/UIConfig';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets, AudioAssets } from '../constants/Assets.js';
import { createPrimaryButton, createSecondaryButton } from '../ui/UIButton.js';

export class MainMenu extends Scene {
    constructor() {
        super(SceneKeys.MAIN_MENU);
        
        // Game state manager for level progress
        this.gameStateManager = null;
    }

    create() {
        // Initialize game state manager
        this.gameStateManager = new GameStateManager();
        // Play title screen music only if audio is unlocked
        const audio = AudioManager.getInstance();
        if (this.sound.locked === false) {
            audio.playMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);
        } else {
            // Will play once user interacts with the menu
            this.sound.once('unlocked', () => {
                audio.playMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);
            });
        }
        // Enhanced gradient background for consistency
        const { width, height } = this.cameras.main;
        const gradientBg = this.add.graphics();
        gradientBg.fillGradientStyle(0x0f1b2b, 0x1a1a2e, 0x16213e, 0x0f3460, 1);
        gradientBg.fillRect(0, 0, width, height);
        
        // Fade in camera
        this.cameras.main.fadeIn(UIConfig.animations.fadeInDuration);
        
        // Enhanced main title
        const mainTitle = this.add.text(width / 2, 180, 'WYN IS BUFF 2', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: '64px',
            color: '#FFE66D',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 8, fill: true }
        }).setOrigin(0.5);
        
        // Skill to automation subtitle
        const subtitle = this.add.text(width / 2, 230, 'SKILL TO AUTOMATION', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            color: '#4ECDC4',
            letterSpacing: '4px'
        }).setOrigin(0.5);
        
        // Add logo if available (smaller, positioned above title)
        if (this.textures.exists(ImageAssets.LOGO)) {
            this.add.image(width / 2, 120, ImageAssets.LOGO)
                .setOrigin(0.5)
                .setScale(0.4);
        }
        
        // Create a more dynamic background panel with gradient effect
        const panelCfg = UIConfig.panel;
        const levelPanel = this.add.graphics();
        levelPanel.fillStyle(panelCfg.backgroundColor, panelCfg.backgroundAlpha);
        levelPanel.fillRoundedRect(262, 350, 500, 350, panelCfg.borderRadius);
        levelPanel.lineStyle(panelCfg.borderWidth, panelCfg.borderColor);
        levelPanel.strokeRoundedRect(262, 350, 500, 350, panelCfg.borderRadius);
        
        // Add section title
        this.add.text(512, 380, 'Select Level', {
            ...UIConfig.text.heading,
            fontSize: '36px'
        }).setOrigin(0.5);
        
        // Create level selection UI
        this.createLevelSelection();
        // Add birthday minigame button - special for Wyn's 9th!
        this.createBirthdayButton();
        // Add reset progress button
        this.createResetButton();
    }

    update (time, delta)
    {
        // Placeholder update method for MainMenu scene
    }
    
    /**
     * Create level selection buttons with WynIsBuff2 skill-to-automation theming
     */
    createLevelSelection() {
        const levels = [
            { 
                id: 'level1', 
                name: 'Protein Plant', 
                description: 'Master basic movements\n& build strength foundation',
                biome: '🏭 INDUSTRIAL',
                color: '#4ECDC4',
                gradient: ['#4ECDC4', '#44A08D'],
                difficulty: 'BEGINNER',
                skillFocus: 'Movement Mastery'
            },
            { 
                id: 'level2', 
                name: 'Metronome Mines', 
                description: 'Perfect timing drills\n& rhythm coordination',
                biome: '⛏️ UNDERGROUND',
                color: '#FFE66D',
                gradient: ['#FFE66D', '#F09819'],
                difficulty: 'INTERMEDIATE',
                skillFocus: 'Timing Precision',
                locked: true
            },
            { 
                id: 'level3', 
                name: 'Automation Apex', 
                description: 'Ultimate muscle memory\n& peak performance',
                biome: '🚀 FUTURISTIC',
                color: '#FF6B9D',
                gradient: ['#FF6B9D', '#C73E1D'],
                difficulty: 'MASTER',
                skillFocus: 'Full Automation',
                locked: true
            }
        ];
        
        // Get completed levels
        const completedLevels = this.gameStateManager.getCompletedLevels();
        
        // Create level cards
        const cardWidth = 140;
        const cardHeight = 180;
        const spacing = 20;
        const startX = 512 - (levels.length * (cardWidth + spacing) - spacing) / 2 + cardWidth / 2;
        
        levels.forEach((level, index) => {
            const x = startX + index * (cardWidth + spacing);
            const y = 490;
            
            // Determine if level is unlocked
            const isUnlocked = index === 0 || completedLevels.includes(`level${index}`);
            
            // Create card container
            const cardContainer = this.add.container(x, y);
            
            // Enhanced card background with gradient
            const cardBg = this.add.graphics();
            
            if (isUnlocked) {
                // Create gradient background for unlocked levels
                const startColor = Phaser.Display.Color.HexStringToColor(level.gradient[0]).color;
                const endColor = Phaser.Display.Color.HexStringToColor(level.gradient[1]).color;
                
                cardBg.fillGradientStyle(startColor, endColor, startColor, endColor, 0.15);
                cardBg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15);
                
                // Glowing border effect
                cardBg.lineStyle(3, Phaser.Display.Color.HexStringToColor(level.color).color, 0.8);
                cardBg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15);
                
                // Inner glow
                cardBg.lineStyle(1, 0xFFFFFF, 0.4);
                cardBg.strokeRoundedRect(-cardWidth/2 + 2, -cardHeight/2 + 2, cardWidth - 4, cardHeight - 4, 13);
            } else {
                // Locked card styling
                cardBg.fillStyle(0x1a1a1a, 0.8);
                cardBg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15);
                cardBg.lineStyle(2, 0x444444, 0.6);
                cardBg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15);
            }
            
            // Biome badge at top
            const biomeBadge = this.add.text(0, -cardHeight/2 + 20, level.biome, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: isUnlocked ? '#FFFFFF' : '#666666',
                backgroundColor: isUnlocked ? '#000000' : '#333333',
                backgroundAlpha: 0.7,
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5);
            
            // Level name with enhanced styling
            const levelName = this.add.text(0, -cardHeight/2 + 50, level.name, {
                fontFamily: 'Impact, Arial Black, sans-serif',
                fontSize: '22px',
                color: isUnlocked ? level.color : '#666666',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2,
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5);
            
            // Skill focus label
            const skillLabel = this.add.text(0, -5, level.skillFocus, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                color: isUnlocked ? '#FFE66D' : '#555555',
                fontStyle: 'italic',
                align: 'center'
            }).setOrigin(0.5);
            
            // Description with better formatting
            const description = this.add.text(0, 25, level.description, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: isUnlocked ? '#E0E0E0' : '#555555',
                align: 'center',
                lineSpacing: 2,
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5);
            
            // Difficulty badge at bottom
            const difficultyBadge = this.add.text(0, cardHeight/2 - 45, level.difficulty, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#000000',
                backgroundColor: isUnlocked ? level.color : '#666666',
                backgroundAlpha: 0.9,
                padding: { x: 6, y: 2 }
            }).setOrigin(0.5);
            
            // Progress or lock icon
            if (isUnlocked) {
                const progress = this.gameStateManager.getLevelProgress(level.id);
                if (progress) {
                    // Progress bar
                    const barWidth = cardWidth - 40;
                    const barHeight = 8;
                    const barY = cardHeight/2 - 25;
                    
                    // Background bar
                    cardBg.fillStyle(0x000000, 0.5);
                    cardBg.fillRoundedRect(-barWidth/2, barY - barHeight/2, barWidth, barHeight, 4);
                    
                    // Progress fill
                    const progressPercent = progress.totalCollectibles > 0 
                        ? progress.collectiblesCollected / progress.totalCollectibles 
                        : 0;
                    if (progressPercent > 0) {
                        cardBg.fillStyle(0x00FF00, 0.8);
                        cardBg.fillRoundedRect(-barWidth/2, barY - barHeight/2, barWidth * progressPercent, barHeight, 4);
                    }
                    
                    // Progress text
                    const progressText = this.add.text(0, barY, 
                        `${progress.collectiblesCollected}/${progress.totalCollectibles}`, {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '12px',
                        color: '#FFFFFF'
                    }).setOrigin(0.5);
                    cardContainer.add(progressText);
                }
            } else {
                // Lock icon
                const lockIcon = this.add.text(0, cardHeight/2 - 25, '🔒', {
                    fontSize: '24px'
                }).setOrigin(0.5);
                cardContainer.add(lockIcon);
            }
            
            // Completion checkmark
            if (completedLevels.includes(level.id)) {
                const checkmark = this.add.text(cardWidth/2 - 15, -cardHeight/2 + 15, '✓', {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#00FF00',
                    stroke: '#000000',
                    strokeThickness: 3
                }).setOrigin(0.5);
                cardContainer.add(checkmark);
            }
            
            // Add all elements to container
            cardContainer.add([cardBg, biomeBadge, levelName, skillLabel, description, difficultyBadge]);
            
            // Interactive hitbox
            const hitArea = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0)
                .setInteractive({ useHandCursor: isUnlocked });
            cardContainer.add(hitArea);
            
            // Animate entrance
            cardContainer.setAlpha(0).setScale(0.8);
            this.tweens.add({
                targets: cardContainer,
                alpha: 1,
                scale: 1,
                duration: UIConfig.animations.scaleIn.duration,
                ease: UIConfig.animations.scaleIn.ease,
                delay: index * 100
            });
            
            // Make interactive if unlocked
            if (isUnlocked) {
                hitArea.on('pointerover', () => {
                    AudioManager.getInstance().playSFX('hover');
                    this.tweens.add({
                        targets: cardContainer,
                        scale: 1.05,
                        duration: 200,
                        ease: 'Power2.easeOut'
                    });
                });
                
                hitArea.on('pointerout', () => {
                    this.tweens.add({
                        targets: cardContainer,
                        scale: 1,
                        duration: 200,
                        ease: 'Power2.easeOut'
                    });
                });
                
                hitArea.on('pointerdown', () => {
                    AudioManager.getInstance().playSFX('click');
                    this.tweens.add({
                        targets: cardContainer,
                        scale: 0.95,
                        duration: 100,
                        ease: 'Power2.easeOut',
                        yoyo: true,
                        onComplete: () => {
                            this.cameras.main.fadeOut(300);
                            this.time.delayedCall(300, () => {
                                this.scene.start(SceneKeys.GAME, { levelId: level.id });
                            });
                        }
                    });
                });
            }
        });
    }
    
    /**
     * Create special birthday minigame button
     */
    createBirthdayButton() {
        // Birthday button with special animation - positioned BELOW the level cards to avoid overlap
        const birthdayContainer = this.add.container(512, 640);
        
        // Glowing background
        const buttonBg = this.add.rectangle(0, 0, 300, 80, 0xFFD700)
            .setStrokeStyle(4, 0xFF00FF);
        
        // Birthday text
        const birthdayText = this.add.text(0, -10, '🎂 WYN\'S 9TH BIRTHDAY RUSH! 🎂', {
            fontFamily: 'Impact',
            fontSize: '22px',
            color: '#000000',
            stroke: '#FFFFFF',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        
        const subText = this.add.text(0, 15, 'Special Birthday Minigame!', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        
        birthdayContainer.add([buttonBg, birthdayText, subText]);
        
        // Make it interactive
        buttonBg.setInteractive({ useHandCursor: true });
        
        // Constant celebration animation
        this.tweens.add({
            targets: birthdayContainer,
            scale: { from: 0.95, to: 1.05 },
            duration: 1000,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.InOut'
        });
        
        // Rainbow color animation
        let hue = 0;
        this.time.addEvent({
            delay: 100,
            callback: () => {
                hue = (hue + 10) % 360;
                const color = Phaser.Display.Color.HSVToRGB(hue / 360, 1, 1);
                buttonBg.setFillStyle(color.color);
            },
            loop: true
        });
        
        // Hover effects
        buttonBg.on('pointerover', () => {
            AudioManager.getInstance().playSFX('hover');
            this.tweens.add({
                targets: birthdayContainer,
                scale: 1.15,
                duration: 200,
                ease: 'Power2.easeOut'
            });
        });
        
        buttonBg.on('pointerout', () => {
            this.tweens.add({
                targets: birthdayContainer,
                scale: 1,
                duration: 200,
                ease: 'Power2.easeOut'
            });
        });
        
        buttonBg.on('pointerdown', () => {
            // Unlock audio on click (browser autoplay policy)
            if (this.sound.context && this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }
            if (window.Howler && window.Howler.ctx && window.Howler.ctx.state === 'suspended') {
                window.Howler.ctx.resume();
            }
            
            AudioManager.getInstance().playSFX('click');
            // Add click animation
            this.tweens.add({
                targets: birthdayContainer,
                scale: 0.9,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    // Fade out and start the birthday minigame
                    this.cameras.main.fadeOut(300);
                    this.time.delayedCall(300, () => {
                        this.scene.start(SceneKeys.BIRTHDAY_MINIGAME);
                    });
                }
            });
        });
        
        // Add floating 9s around the button
        for (let i = 0; i < 3; i++) {
            const floatingNine = this.add.text(
                512 + Phaser.Math.Between(-200, 200),
                620 + Phaser.Math.Between(-60, 60),
                '9',
                {
                    fontSize: '24px',
                    color: '#FFD700',
                    fontFamily: 'Impact',
                    alpha: 0.3
                }
            );
            
            this.tweens.add({
                targets: floatingNine,
                y: '-=30',
                alpha: 0,
                duration: 3000,
                delay: i * 1000,
                repeat: -1,
                ease: 'Sine.Out'
            });
        }
    }
    
    /**
     * Create reset progress button
     */
    createResetButton() {
        const { btn } = createSecondaryButton(this, 512, 720, 'Reset Progress', () => {
            AudioManager.getInstance().playSFX('click');
            // Create confirmation dialog
            const confirmBg = this.add.rectangle(512, 384, 400, 200, 0x000000, 0.8);
            
            const confirmText = this.add.text(512, 350, 'Reset all progress?', {
                fontFamily: 'Arial',
                fontSize: 24,
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            
            const yes = createPrimaryButton(this, 450, 400, 'Yes', () => {
                AudioManager.getInstance().playSFX('click');
                this.gameStateManager.resetProgress();
                this.scene.restart();
            }, { scale: 0.3 });
            const no = createSecondaryButton(this, 550, 400, 'No', () => {
                AudioManager.getInstance().playSFX('click');
                confirmBg.destroy();
                confirmText.destroy();
                yes.btn.destroy(); yes.txt.destroy();
                no.btn.destroy(); no.txt.destroy();
            }, { scale: 0.3 });
        });
    }
}
