/**
 * MainMenu Scene - Level Select Screen
 *
 * ARCHITECTURE:
 * - Extends BaseScene (vendor abstraction)
 * - Uses DesignTokens for all styling
 * - Uses LevelCardComponent for reusable cards
 * - Responsive design (mobile/tablet/desktop)
 * - Accessible (keyboard navigation, ARIA labels)
 * - Observable (LOG system, no console.*)
 *
 * LAYOUT (4 sections):
 * 1. Hero Section: Logo + Title
 * 2. Level Grid: Adaptive cards (1-3 columns)
 * 3. Special Event Banner: Birthday minigame
 * 4. Footer: Reset progress
 */

import { BaseScene, GameStateManager, AudioManager } from '@features/core';
import { LevelCardComponent } from '@features/level';

import { LOG } from '../observability/core/LogSystem.js';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets, AudioAssets } from '../constants/Assets.js';
import { DesignTokens } from '../constants/DesignTokens.js';

export class MainMenu extends BaseScene {
    constructor() {
        super(SceneKeys.MAIN_MENU);

        // Game state manager for level progress
        this.gameStateManager = null;

        // UI state
        this.levelCards = [];
        this.focusedCardIndex = 0;
        this.keyboardEnabled = true;
    }

    async create() {
        // Initialize game state manager
        this.gameStateManager = new GameStateManager();

        // Ensure audio context is ready before playing music
        await this.initializeAudio();

        // Get viewport dimensions
        const { width, height } = this.cameras.main;

        // Determine breakpoint for responsive layout with height constraints
        this.updateBreakpoint(width, height);

        LOG.info('MAIN_MENU_INIT', {
            subsystem: 'scene',
            scene: SceneKeys.MAIN_MENU,
            message: 'MainMenu scene initialized',
            viewport: { width, height },
            breakpoint: this.breakpoint,
        });

        // Calculate layout positions for all sections
        this.calculateLayout();

        // Create 4-section layout with calculated positions
        this.createBackground();
        this.createHeroSection();
        this.createLevelGrid();
        this.createEventBanner();
        this.createFooter();

        // Setup keyboard navigation
        this.setupKeyboardNavigation();

        // Setup resize handler
        this.setupResizeHandler();

        // Fade in camera
        this.cameras.main.fadeIn(500);
    }

    /**
     * Determine responsive breakpoint with aggressive scaling for viewport constraints
     */
    updateBreakpoint(width, height) {
        // Determine base breakpoint with more generous scaling
        if (width < DesignTokens.breakpoints.mobile) {
            this.breakpoint = 'mobile';
            this.gridColumns = 1;
            this.logoScale = 0.3; // Larger base logo
        } else if (width < DesignTokens.breakpoints.tablet) {
            this.breakpoint = 'tablet';
            this.gridColumns = 2;
            this.logoScale = 0.4; // Larger base logo
        } else {
            this.breakpoint = 'desktop';
            this.gridColumns = 3;
            this.logoScale = 0.5; // Larger base logo
        }

        // Scale based on viewport height - but keep elements larger
        if (height < 800) {
            this.logoScale *= 0.7; // Less aggressive scaling
            this.cardHeightScale = 1.0; // Keep cards full size
        } else if (height < 900) {
            this.logoScale *= 0.85; // Less aggressive scaling
            this.cardHeightScale = 1.0; // Keep cards full size
        } else {
            this.cardHeightScale = 1.1; // Even larger on big screens
        }

        LOG.dev('MAIN_MENU_BREAKPOINT', {
            subsystem: 'scene',
            breakpoint: this.breakpoint,
            gridColumns: this.gridColumns,
            logoScale: this.logoScale,
            cardHeightScale: this.cardHeightScale,
        });
    }

    /**
     * Calculate dynamic layout positions for all sections
     * Uses ACTUAL measured heights and SCALES to fit viewport
     */
    calculateLayout() {
        const { width, height } = this.cameras.main;

        // Adaptive spacing based on viewport height - more generous
        const spacingScale = height < 800 ? 0.8 : height < 900 ? 0.9 : 1.2;
        const getSpacing = (size) => Math.floor(size * spacingScale);

        this.layout = {
            hero: {},
            grid: {},
            banner: {},
            footer: {},
        };

        // FIRST PASS: Calculate positions relative to Y=0 to get total height
        let currentY = 0;

        // 1. Logo - measure actual height and scale down if needed
        let logoHeight = 0;
        if (this.textures.exists(ImageAssets.LOGO)) {
            const logoTexture = this.textures.get(ImageAssets.LOGO);
            logoHeight = logoTexture.source[0].height * this.logoScale;
        }

        this.layout.hero.logoY = currentY + logoHeight / 2;
        currentY = this.layout.hero.logoY + logoHeight / 2 + getSpacing(DesignTokens.spacing.xs);

        // 2. Title - measure actual bounds with height-scaled font
        const titleFontSize = height < 800 ? DesignTokens.fontSize.h2 : DesignTokens.fontSize.displayMedium;
        const tempTitle = this.add.text(0, 0, 'WYN IS BUFF 2', {
            fontFamily: DesignTokens.fontFamily.heading,
            fontSize: titleFontSize,
            stroke: DesignTokens.colors.bgDark,
            strokeThickness: height < 800 ? 4 : 6,
        });
        const titleBounds = tempTitle.getBounds();
        const titleHeight = titleBounds.height;
        tempTitle.destroy();
        this.titleFontSize = titleFontSize; // Store for later use
        this.titleStrokeThickness = height < 800 ? 4 : 6;

        this.layout.hero.titleY = currentY + titleHeight / 2;
        currentY = this.layout.hero.titleY + titleHeight / 2 + getSpacing(DesignTokens.spacing.xs);

        // 3. Subtitle - measure actual bounds with height-scaled font
        const subtitleFontSize = height < 800 ? DesignTokens.fontSize.body : DesignTokens.fontSize.h3;
        const tempSubtitle = this.add.text(0, 0, 'Select Your Challenge', {
            fontFamily: DesignTokens.fontFamily.primary,
            fontSize: subtitleFontSize,
            letterSpacing: height < 800 ? '2px' : '4px',
        });
        const subtitleBounds = tempSubtitle.getBounds();
        const subtitleHeight = subtitleBounds.height;
        tempSubtitle.destroy();
        this.subtitleFontSize = subtitleFontSize; // Store for later use
        this.subtitleLetterSpacing = height < 800 ? '2px' : '4px';

        this.layout.hero.subtitleY = currentY + subtitleHeight / 2;
        currentY = this.layout.hero.subtitleY + subtitleHeight / 2 + getSpacing(DesignTokens.spacing.xl);

        // 4. Level Grid - calculate based on SCALED card dimensions
        const baseCardHeight = DesignTokens.card.level.height;
        const cardHeight = Math.floor(baseCardHeight * this.cardHeightScale);
        const cardSpacing = getSpacing(DesignTokens.spacing.md);
        const levels = 3;
        const rows = Math.ceil(levels / this.gridColumns);
        const gridHeight = rows * cardHeight + (rows - 1) * cardSpacing;

        // CRITICAL: Cards are positioned by their CENTER, so add half card height
        // currentY is at the bottom of subtitle + spacing (where card TOP should be)
        // Card center needs to be at: cardTop + (cardHeight / 2)
        this.layout.grid.startY = currentY + (cardHeight / 2);

        // Calculate where the grid ENDS (bottom of last row + spacing)
        // Last row center = startY + (rows-1) * (cardHeight + spacing)
        // Last row bottom = last row center + cardHeight/2
        const lastRowCenterY = this.layout.grid.startY + (rows - 1) * (cardHeight + cardSpacing);
        const gridBottomY = lastRowCenterY + (cardHeight / 2);
        currentY = gridBottomY + getSpacing(DesignTokens.spacing.xl);

        // 5. Event Banner - fixed 80px height
        const bannerHeight = 80;
        this.layout.banner.y = currentY + bannerHeight / 2;
        currentY = this.layout.banner.y + bannerHeight / 2 + getSpacing(DesignTokens.spacing.md);

        // 6. Footer - measure text bounds
        const tempFooter = this.add.text(0, 0, 'Reset Progress', {
            fontFamily: DesignTokens.fontFamily.primary,
            fontSize: DesignTokens.fontSize.body,
            stroke: DesignTokens.colors.bgDark,
            strokeThickness: 3,
        });
        const footerBounds = tempFooter.getBounds();
        const footerHeight = footerBounds.height;
        tempFooter.destroy();

        this.layout.footer.y = currentY + footerHeight / 2;
        currentY = this.layout.footer.y + footerHeight / 2 + getSpacing(DesignTokens.spacing.md);

        // Calculate total content height and vertical centering offset
        const totalHeight = currentY;
        const contentFits = totalHeight <= height;

        // SECOND PASS: Apply vertical centering offset
        let verticalOffset = 0;
        if (contentFits) {
            // Center the content vertically - put equal space top and bottom
            const availableSpace = height - totalHeight;
            verticalOffset = Math.floor(availableSpace / 2); // True vertical centering

            LOG.info('MAIN_MENU_VERTICALLY_CENTERED', {
                subsystem: 'scene',
                message: 'Content centered vertically',
                totalHeight,
                viewportHeight: height,
                availableSpace,
                verticalOffset,
                topMargin: `${Math.floor((verticalOffset / height) * 100)}%`,
                bottomMargin: `${Math.floor((verticalOffset / height) * 100)}%`,
            });
        } else {
            LOG.warn('MAIN_MENU_LAYOUT_OVERFLOW', {
                subsystem: 'scene',
                message: 'Layout exceeds viewport height - content will scroll',
                totalHeight,
                viewportHeight: height,
                overflow: totalHeight - height,
                spacingScale,
                hint: 'Content is too tall for viewport. Consider scrolling or reducing elements.',
            });
        }

        // Apply vertical offset to all calculated positions
        this.layout.hero.logoY += verticalOffset;
        this.layout.hero.titleY += verticalOffset;
        this.layout.hero.subtitleY += verticalOffset;
        this.layout.grid.startY += verticalOffset;
        this.layout.banner.y += verticalOffset;
        this.layout.footer.y += verticalOffset;

        LOG.info('MAIN_MENU_LAYOUT_CALCULATED', {
            subsystem: 'scene',
            message: 'Layout positions calculated using actual measurements',
            viewport: { width, height },
            totalHeight,
            contentFits,
            spacingScale,
            cardHeightScale: this.cardHeightScale,
            verticalOffset,
            measurements: {
                logoHeight,
                titleHeight,
                subtitleHeight,
                gridHeight,
                cardHeight,
                bannerHeight,
                footerHeight,
            },
            layout: this.layout,
        });
    }

    /**
     * Create gradient background
     */
    createBackground() {
        const { width, height } = this.cameras.main;
        const gradientBg = this.add.graphics();

        // Use DesignTokens gradient colors
        const colors = DesignTokens.colors.gradientBackground.map((hex) =>
            Phaser.Display.Color.HexStringToColor(hex).color
        );

        gradientBg.fillGradientStyle(colors[0], colors[1], colors[2], colors[3], 1);
        gradientBg.fillRect(0, 0, width, height);

        LOG.dev('MAIN_MENU_BACKGROUND', {
            subsystem: 'scene',
            message: 'Background created with DesignTokens gradient',
        });
    }

    /**
     * Create hero section (Section 1)
     * Logo + Title - using calculated layout positions
     */
    createHeroSection() {
        const { width } = this.cameras.main;
        const centerX = width / 2;

        // Hero section container
        this.heroSection = this.add.container(0, 0);

        // Add logo if available (using calculated position)
        if (this.textures.exists(ImageAssets.LOGO)) {
            const logo = this.add
                .image(centerX, this.layout.hero.logoY, ImageAssets.LOGO)
                .setOrigin(0.5)
                .setScale(this.logoScale);
            this.heroSection.add(logo);
            this.logo = logo;

            LOG.dev('MAIN_MENU_LOGO', {
                subsystem: 'scene',
                message: 'Logo added',
                scale: this.logoScale,
                y: this.layout.hero.logoY,
            });
        }

        // Main title (using calculated position and scaled font)
        const mainTitle = this.add
            .text(centerX, this.layout.hero.titleY, 'WYN IS BUFF 2', {
                fontFamily: DesignTokens.fontFamily.heading,
                fontSize: this.titleFontSize,
                color: DesignTokens.colors.secondary,
                stroke: DesignTokens.colors.bgDark,
                strokeThickness: this.titleStrokeThickness,
            })
            .setOrigin(0.5);
        this.heroSection.add(mainTitle);

        // Subtitle (using calculated position and scaled font)
        const subtitle = this.add
            .text(centerX, this.layout.hero.subtitleY, 'Select Your Challenge', {
                fontFamily: DesignTokens.fontFamily.primary,
                fontSize: this.subtitleFontSize,
                color: DesignTokens.colors.primary,
                letterSpacing: this.subtitleLetterSpacing,
            })
            .setOrigin(0.5);
        this.heroSection.add(subtitle);

        LOG.info('MAIN_MENU_HERO', {
            subsystem: 'scene',
            message: 'Hero section created',
            positions: this.layout.hero,
        });
    }

    /**
     * Create level selection grid (Section 2)
     * Adaptive 1-3 column grid - using calculated layout positions
     */
    createLevelGrid() {
        const { width } = this.cameras.main;
        const centerX = width / 2;
        const gridY = this.layout.grid.startY;

        // Level data
        const levels = [
            {
                id: 'level1',
                name: 'Protein Plant',
                description: 'Master basic movements\n& build strength foundation',
                biome: '🏭 INDUSTRIAL',
                difficulty: 'beginner',
                skillFocus: 'Movement Mastery',
            },
            {
                id: 'level2',
                name: 'Metronome Mines',
                description: 'Perfect timing drills\n& rhythm coordination',
                biome: '⛏️ UNDERGROUND',
                difficulty: 'intermediate',
                skillFocus: 'Timing Precision',
            },
            {
                id: 'level3',
                name: 'Automation Apex',
                description: 'Ultimate muscle memory\n& peak performance',
                biome: '🚀 FUTURISTIC',
                difficulty: 'master',
                skillFocus: 'Full Automation',
            },
        ];

        // Get completed levels
        const completedLevels = this.gameStateManager.getCompletedLevels();

        // Calculate card layout with scaled dimensions
        const baseCardWidth = DesignTokens.card.level.width;
        const baseCardHeight = DesignTokens.card.level.height;
        const scaledCardWidth = Math.floor(baseCardWidth * this.cardHeightScale);
        const scaledCardHeight = Math.floor(baseCardHeight * this.cardHeightScale);
        const cardSpacing = DesignTokens.spacing.md;
        const totalWidth = this.gridColumns * scaledCardWidth + (this.gridColumns - 1) * cardSpacing;
        const startX = centerX - totalWidth / 2 + scaledCardWidth / 2;

        // Create level cards
        this.levelCards = [];
        levels.forEach((levelData, index) => {
            // Determine position based on grid
            const row = Math.floor(index / this.gridColumns);
            const col = index % this.gridColumns;
            const x = startX + col * (scaledCardWidth + cardSpacing);
            const y = gridY + row * (scaledCardHeight + cardSpacing);

            // Determine unlock state
            const isUnlocked = index === 0 || completedLevels.includes(`level${index}`);
            const isCompleted = completedLevels.includes(levelData.id);

            // Get progress
            const progress = this.gameStateManager.getLevelProgress(levelData.id);

            // Create card with scaled dimensions
            const card = new LevelCardComponent(this, {
                x,
                y,
                levelData,
                isUnlocked,
                isCompleted,
                progress,
                onClick: (data) => this.onLevelSelected(data),
                width: scaledCardWidth,
                height: scaledCardHeight,
            });

            this.add.existing(card);
            this.levelCards.push(card);

            // Animate entrance with stagger
            card.animateEntrance(index * 100);
        });

        LOG.info('MAIN_MENU_GRID', {
            subsystem: 'scene',
            message: 'Level grid created',
            levels: levels.length,
            columns: this.gridColumns,
            unlocked: this.levelCards.filter((c) => c.isUnlocked).length,
        });
    }

    /**
     * Create special event banner (Section 3)
     * Birthday minigame promotion - using calculated layout position
     */
    createEventBanner() {
        const { width } = this.cameras.main;
        const centerX = width / 2;
        const bannerY = this.layout.banner.y;

        // Birthday button container
        const birthdayContainer = this.add.container(centerX, bannerY);

        // Glowing background
        const buttonBg = this.add
            .rectangle(0, 0, 300, 80, 0xffd700)
            .setStrokeStyle(
                4,
                Phaser.Display.Color.HexStringToColor(DesignTokens.colors.tertiary).color
            );

        // Birthday text
        const birthdayText = this.add
            .text(0, -10, "🎂 WYN'S 9TH BIRTHDAY RUSH! 🎂", {
                fontFamily: DesignTokens.fontFamily.heading,
                fontSize: DesignTokens.fontSize.h4,
                color: DesignTokens.colors.bgDark,
                stroke: DesignTokens.colors.textPrimary,
                strokeThickness: 3,
                align: 'center',
            })
            .setOrigin(0.5);

        const subText = this.add
            .text(0, 15, 'Special Birthday Minigame!', {
                fontFamily: DesignTokens.fontFamily.primary,
                fontSize: DesignTokens.fontSize.body,
                color: DesignTokens.colors.textPrimary,
                stroke: DesignTokens.colors.bgDark,
                strokeThickness: 2,
                align: 'center',
            })
            .setOrigin(0.5);

        birthdayContainer.add([buttonBg, birthdayText, subText]);

        // Make interactive
        buttonBg.setInteractive({ useHandCursor: true });

        // Celebration animation
        this.tweens.add({
            targets: birthdayContainer,
            scale: { from: 0.95, to: 1.05 },
            duration: 1000,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.InOut',
        });

        // Rainbow animation
        let hue = 0;
        this.time.addEvent({
            delay: 100,
            callback: () => {
                hue = (hue + 10) % 360;
                const color = Phaser.Display.Color.HSVToRGB(hue / 360, 1, 1);
                buttonBg.setFillStyle(color.color);
            },
            loop: true,
        });

        // Hover effects
        buttonBg.on('pointerover', () => {
            AudioManager.getInstance().playSFX(AudioAssets.UI_HOVER);
            this.tweens.add({
                targets: birthdayContainer,
                scale: 1.15,
                duration: 200,
                ease: 'Power2.easeOut',
            });
        });

        buttonBg.on('pointerout', () => {
            this.tweens.add({
                targets: birthdayContainer,
                scale: 1,
                duration: 200,
                ease: 'Power2.easeOut',
            });
        });

        buttonBg.on('pointerdown', () => {
            AudioManager.getInstance().playSFX(AudioAssets.UI_CLICK);
            this.tweens.add({
                targets: birthdayContainer,
                scale: 0.9,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.cameras.main.fadeOut(300);
                    this.time.delayedCall(300, () => {
                        this.scene.start(SceneKeys.BIRTHDAY_MINIGAME);
                    });
                },
            });
        });

        LOG.info('MAIN_MENU_EVENT_BANNER', {
            subsystem: 'scene',
            message: 'Event banner created',
        });
    }

    /**
     * Create footer (Section 4)
     * Reset progress button - using calculated layout position
     */
    createFooter() {
        const { width } = this.cameras.main;
        const centerX = width / 2;
        const footerY = this.layout.footer.y;

        // Reset button
        const resetButton = this.add
            .text(centerX, footerY, 'Reset Progress', {
                fontFamily: DesignTokens.fontFamily.primary,
                fontSize: DesignTokens.fontSize.body,
                color: DesignTokens.colors.error,
                stroke: DesignTokens.colors.bgDark,
                strokeThickness: 3,
                align: 'center',
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Hover effects
        resetButton.on('pointerover', () => {
            resetButton.setColor(DesignTokens.colors.warning);
            AudioManager.getInstance().playSFX(AudioAssets.UI_HOVER);
        });

        resetButton.on('pointerout', () => {
            resetButton.setColor(DesignTokens.colors.error);
        });

        resetButton.on('pointerdown', () => {
            AudioManager.getInstance().playSFX(AudioAssets.UI_CLICK);
            this.showResetConfirmation();
        });

        LOG.info('MAIN_MENU_FOOTER', {
            subsystem: 'scene',
            message: 'Footer created',
        });
    }

    /**
     * Show reset progress confirmation dialog
     */
    showResetConfirmation() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Overlay
        const overlay = this.add.rectangle(
            0,
            0,
            width,
            height,
            Phaser.Display.Color.HexStringToColor(DesignTokens.colors.overlay).color,
            0.8
        ).setOrigin(0, 0);

        // Confirmation panel
        const confirmBg = this.add.rectangle(
            centerX,
            centerY,
            400,
            200,
            Phaser.Display.Color.HexStringToColor(DesignTokens.colors.bgMedium).color
        ).setStrokeStyle(
            2,
            Phaser.Display.Color.HexStringToColor(DesignTokens.colors.borderAccent).color
        );

        const confirmText = this.add
            .text(centerX, centerY - 30, 'Reset all progress?', {
                fontFamily: DesignTokens.fontFamily.primary,
                fontSize: DesignTokens.fontSize.h3,
                color: DesignTokens.colors.textPrimary,
                align: 'center',
            })
            .setOrigin(0.5);

        const yesButton = this.add
            .text(centerX - 60, centerY + 40, 'Yes', {
                fontFamily: DesignTokens.fontFamily.primary,
                fontSize: DesignTokens.fontSize.h4,
                color: DesignTokens.colors.textPrimary,
                backgroundColor: DesignTokens.colors.error,
                padding: { x: DesignTokens.spacing.lg, y: DesignTokens.spacing.sm },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const noButton = this.add
            .text(centerX + 60, centerY + 40, 'No', {
                fontFamily: DesignTokens.fontFamily.primary,
                fontSize: DesignTokens.fontSize.h4,
                color: DesignTokens.colors.textPrimary,
                backgroundColor: DesignTokens.colors.success,
                padding: { x: DesignTokens.spacing.lg, y: DesignTokens.spacing.sm },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Yes button logic
        yesButton.on('pointerover', () => {
            yesButton.setBackgroundColor(DesignTokens.colors.warning);
            AudioManager.getInstance().playSFX(AudioAssets.UI_HOVER);
        });
        yesButton.on('pointerout', () => {
            yesButton.setBackgroundColor(DesignTokens.colors.error);
        });
        yesButton.on('pointerdown', () => {
            AudioManager.getInstance().playSFX(AudioAssets.UI_CLICK);
            this.gameStateManager.resetProgress();
            this.scene.restart();
        });

        // No button logic
        noButton.on('pointerover', () => {
            noButton.setBackgroundColor(DesignTokens.colors.primary);
            AudioManager.getInstance().playSFX(AudioAssets.UI_HOVER);
        });
        noButton.on('pointerout', () => {
            noButton.setBackgroundColor(DesignTokens.colors.success);
        });
        noButton.on('pointerdown', () => {
            AudioManager.getInstance().playSFX(AudioAssets.UI_CLICK);
            overlay.destroy();
            confirmBg.destroy();
            confirmText.destroy();
            yesButton.destroy();
            noButton.destroy();
        });

        LOG.info('MAIN_MENU_RESET_CONFIRMATION', {
            subsystem: 'scene',
            message: 'Reset confirmation dialog shown',
        });
    }

    /**
     * Handle level selection
     */
    onLevelSelected(levelData) {
        LOG.info('MAIN_MENU_LEVEL_SELECTED', {
            subsystem: 'scene',
            levelId: levelData.id,
            levelName: levelData.name,
        });

        // Fade out and start level
        this.cameras.main.fadeOut(300);
        this.time.delayedCall(300, () => {
            this.scene.start(SceneKeys.GAME, { levelId: levelData.id });
        });
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        // TAB: cycle through cards
        this.input.keyboard.on('keydown-TAB', (event) => {
            event.preventDefault();

            // Hide current focus
            if (this.levelCards[this.focusedCardIndex]) {
                this.levelCards[this.focusedCardIndex].hideFocus();
            }

            // Move to next card
            this.focusedCardIndex = (this.focusedCardIndex + 1) % this.levelCards.length;

            // Show new focus
            if (this.levelCards[this.focusedCardIndex]) {
                this.levelCards[this.focusedCardIndex].showFocus();
            }

            AudioManager.getInstance().playSFX(AudioAssets.UI_HOVER);

            LOG.dev('MAIN_MENU_TAB_NAVIGATION', {
                subsystem: 'scene',
                focusedCardIndex: this.focusedCardIndex,
            });
        });

        // ENTER: select focused card
        this.input.keyboard.on('keydown-ENTER', () => {
            const card = this.levelCards[this.focusedCardIndex];
            if (card && card.isUnlocked) {
                card.onClickHandler();
            }
        });

        LOG.info('MAIN_MENU_KEYBOARD_NAV', {
            subsystem: 'scene',
            message: 'Keyboard navigation setup complete',
        });
    }

    /**
     * Setup resize handler for responsive layout
     */
    setupResizeHandler() {
        this.scale.on('resize', (gameSize) => {
            const { width } = gameSize;
            const { height } = gameSize;
            const previousBreakpoint = this.breakpoint;

            // Update breakpoint with height
            this.updateBreakpoint(width, height);

            // Recreate layout if breakpoint changed
            if (this.breakpoint !== previousBreakpoint) {
                LOG.info('MAIN_MENU_RESIZE', {
                    subsystem: 'scene',
                    message: 'Breakpoint changed, recreating layout',
                    from: previousBreakpoint,
                    to: this.breakpoint,
                });

                // Recreate scene
                this.scene.restart();
            }
        });
    }

    /**
     * Initialize audio and start music
     */
    async initializeAudio() {
        const audio = AudioManager.getInstance();

        // Ensure AudioContext is resumed (required after user interaction)
        if (window.Howler && window.Howler.ctx && window.Howler.ctx.state === 'suspended') {
            try {
                await window.Howler.ctx.resume();
                LOG.dev('MAIN_MENU_AUDIO_RESUMED', {
                    subsystem: 'scene',
                    scene: SceneKeys.MAIN_MENU,
                    message: 'AudioContext resumed successfully',
                });
            } catch (err) {
                LOG.warn('MAIN_MENU_AUDIO_RESUME_FAILED', {
                    subsystem: 'scene',
                    scene: SceneKeys.MAIN_MENU,
                    error: err,
                    message: 'Failed to resume AudioContext',
                });
            }
        }

        // Start title screen music
        audio.playMusic(AudioAssets.PROTEIN_PIXEL_ANTHEM);

        LOG.info('MAIN_MENU_MUSIC_STARTED', {
            subsystem: 'scene',
            scene: SceneKeys.MAIN_MENU,
            message: 'Title screen music playback initiated',
            track: AudioAssets.PROTEIN_PIXEL_ANTHEM,
        });
    }

    update(_time, _delta) {
        // Placeholder update method for MainMenu scene
    }
}
