/**
 * LevelCardComponent - Reusable level selection card
 *
 * ARCHITECTURE:
 * - Uses DesignTokens for all styling (no magic numbers)
 * - Phaser Container-based component
 * - Responsive design (adapts to card size)
 * - Accessibility support (ARIA labels, keyboard focus)
 * - Observable (uses LOG system)
 *
 * USAGE:
 * ```javascript
 * const card = new LevelCardComponent(scene, {
 *     x: 100,
 *     y: 100,
 *     levelData: {
 *         id: 'level1',
 *         name: 'Protein Plant',
 *         difficulty: 'beginner',
 *         biome: '🏭 INDUSTRIAL',
 *         skillFocus: 'Movement Mastery',
 *         description: 'Master basic movements & build strength foundation'
 *     },
 *     isUnlocked: true,
 *     isCompleted: false,
 *     progress: { collectiblesCollected: 5, totalCollectibles: 10 },
 *     onClick: () => scene.startLevel('level1')
 * });
 * scene.add.existing(card);
 * ```
 */

import { DesignTokens } from '../../constants/DesignTokens.js';
import { LOG } from '../../observability/core/LogSystem.js';

export class LevelCardComponent extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene - Parent scene
     * @param {Object} config - Card configuration
     * @param {number} config.x - X position
     * @param {number} config.y - Y position
     * @param {Object} config.levelData - Level metadata
     * @param {string} config.levelData.id - Level ID
     * @param {string} config.levelData.name - Level name
     * @param {string} config.levelData.difficulty - 'beginner', 'intermediate', 'master'
     * @param {string} config.levelData.biome - Biome emoji + name
     * @param {string} config.levelData.skillFocus - Skill focus label
     * @param {string} config.levelData.description - Level description
     * @param {boolean} config.isUnlocked - Whether level is unlocked
     * @param {boolean} config.isCompleted - Whether level is completed
     * @param {Object} [config.progress] - Level progress (optional)
     * @param {Function} config.onClick - Click handler
     * @param {number} [config.width] - Card width (default: DesignTokens.card.level.width)
     * @param {number} [config.height] - Card height (default: DesignTokens.card.level.height)
     */
    constructor(scene, config) {
        super(scene, config.x, config.y);

        this.config = config;
        this.levelData = config.levelData;
        this.isUnlocked = config.isUnlocked;
        this.isCompleted = config.isCompleted;
        this.progress = config.progress;
        this.onClick = config.onClick;

        // Card dimensions from DesignTokens
        this.cardWidth = config.width || DesignTokens.card.level.width;
        this.cardHeight = config.height || DesignTokens.card.level.height;

        // Calculate scale factor for compact mode (when card is smaller than default)
        const defaultWidth = DesignTokens.card.level.width;
        const defaultHeight = DesignTokens.card.level.height;
        this.scaleFactorWidth = this.cardWidth / defaultWidth;
        this.scaleFactorHeight = this.cardHeight / defaultHeight;
        this.isCompact = this.scaleFactorHeight < 1.0;

        // Difficulty colors (directly from DesignTokens.colors)
        this.difficultyColors = {
            beginner: DesignTokens.colors.beginner,
            intermediate: DesignTokens.colors.intermediate,
            master: DesignTokens.colors.master,
        };

        // Create card elements
        this.createBackground();
        this.createContent();
        this.createInteractivity();

        // Accessibility
        this.setAccessibilityData();

        LOG.dev('LEVEL_CARD_CREATED', {
            subsystem: 'ui',
            levelId: this.levelData.id,
            isUnlocked: this.isUnlocked,
            cardSize: { width: this.cardWidth, height: this.cardHeight },
            isCompact: this.isCompact,
            scaleFactor: this.scaleFactorHeight,
        });
    }

    /**
     * Create card background with gradient/locked styling
     */
    createBackground() {
        const graphics = this.scene.add.graphics();
        const halfWidth = this.cardWidth / 2;
        const halfHeight = this.cardHeight / 2;

        if (this.isUnlocked) {
            // Get difficulty color
            const difficultyColor =
                this.difficultyColors[this.levelData.difficulty] || DesignTokens.colors.primary;
            const color = Phaser.Display.Color.HexStringToColor(difficultyColor);

            // Gradient background
            graphics.fillGradientStyle(
                color.color,
                color.darken(20).color,
                color.color,
                color.darken(20).color,
                0.15
            );
            graphics.fillRoundedRect(
                -halfWidth,
                -halfHeight,
                this.cardWidth,
                this.cardHeight,
                DesignTokens.card.level.borderRadius
            );

            // Glowing border
            graphics.lineStyle(DesignTokens.card.level.borderWidth, color.color, 0.8);
            graphics.strokeRoundedRect(
                -halfWidth,
                -halfHeight,
                this.cardWidth,
                this.cardHeight,
                DesignTokens.card.level.borderRadius
            );

            // Inner glow
            graphics.lineStyle(1, 0xffffff, 0.4);
            graphics.strokeRoundedRect(
                -halfWidth + 2,
                -halfHeight + 2,
                this.cardWidth - 4,
                this.cardHeight - 4,
                DesignTokens.card.level.borderRadius - 2
            );
        } else {
            // Locked card styling
            const bgColor = Phaser.Display.Color.HexStringToColor(DesignTokens.colors.bgDark);
            graphics.fillStyle(bgColor.color, 0.8);
            graphics.fillRoundedRect(
                -halfWidth,
                -halfHeight,
                this.cardWidth,
                this.cardHeight,
                DesignTokens.card.level.borderRadius
            );

            const borderColor = Phaser.Display.Color.HexStringToColor(DesignTokens.colors.border);
            graphics.lineStyle(2, borderColor.color, 0.6);
            graphics.strokeRoundedRect(
                -halfWidth,
                -halfHeight,
                this.cardWidth,
                this.cardHeight,
                DesignTokens.card.level.borderRadius
            );
        }

        this.add(graphics);
        this.backgroundGraphics = graphics;
    }

    /**
     * Create card content with intelligent vertical layout (no overlapping)
     */
    createContent() {
        const halfHeight = this.cardHeight / 2;

        // Scale font sizes for compact cards
        const fontScale = this.isCompact ? this.scaleFactorHeight : 1.0;
        const getFontSize = (size) => `${Math.floor(parseInt(size) * fontScale)}px`;
        const getSpacing = (size) => Math.floor(size * fontScale);

        // DYNAMIC LAYOUT: Position elements from top to bottom, measuring as we go
        let currentY = -halfHeight + getSpacing(DesignTokens.spacing.sm);

        // 1. Biome badge at top
        const biomeBadge = this.scene.add
            .text(
                0,
                0, // Will reposition after measuring
                this.levelData.biome,
                {
                    fontFamily: DesignTokens.fontFamily.primary,
                    fontSize: getFontSize(DesignTokens.fontSize.tiny),
                    color: this.isUnlocked
                        ? DesignTokens.colors.textPrimary
                        : DesignTokens.colors.textDisabled,
                    backgroundColor: this.isUnlocked
                        ? DesignTokens.colors.bgDark
                        : DesignTokens.colors.bgMedium,
                    padding: {
                        x: getSpacing(DesignTokens.spacing.xs),
                        y: getSpacing(DesignTokens.spacing.xs),
                    },
                }
            )
            .setOrigin(0.5);
        const biomeBounds = biomeBadge.getBounds();
        biomeBadge.setY(currentY + biomeBounds.height / 2);
        currentY += biomeBounds.height + getSpacing(DesignTokens.spacing.xs);
        this.add(biomeBadge);

        // 2. Level name
        const levelName = this.scene.add
            .text(0, 0, this.levelData.name, {
                fontFamily: DesignTokens.fontFamily.heading,
                fontSize: getFontSize(DesignTokens.fontSize.h4),
                color: this.isUnlocked
                    ? this.difficultyColors[this.levelData.difficulty]
                    : DesignTokens.colors.textDisabled,
                align: 'center',
                stroke: DesignTokens.colors.bgDark,
                strokeThickness: this.isCompact ? 1 : 2,
                wordWrap: { width: this.cardWidth - getSpacing(DesignTokens.spacing.md) },
            })
            .setOrigin(0.5);
        const levelNameBounds = levelName.getBounds();
        levelName.setY(currentY + levelNameBounds.height / 2);
        currentY += levelNameBounds.height + getSpacing(DesignTokens.spacing.xs);
        this.add(levelName);

        // 3. Skill focus label
        const skillLabel = this.scene.add
            .text(0, 0, this.levelData.skillFocus, {
                fontFamily: DesignTokens.fontFamily.primary,
                fontSize: getFontSize(DesignTokens.fontSize.tiny),
                color: this.isUnlocked
                    ? DesignTokens.colors.secondary
                    : DesignTokens.colors.textMuted,
                fontStyle: 'italic',
                align: 'center',
            })
            .setOrigin(0.5);
        const skillLabelBounds = skillLabel.getBounds();
        skillLabel.setY(currentY + skillLabelBounds.height / 2);
        currentY += skillLabelBounds.height + getSpacing(DesignTokens.spacing.xs);
        this.add(skillLabel);

        // 4. Description
        const description = this.scene.add
            .text(0, 0, this.levelData.description, {
                fontFamily: DesignTokens.fontFamily.primary,
                fontSize: getFontSize(DesignTokens.fontSize.tiny),
                color: this.isUnlocked
                    ? DesignTokens.colors.textSecondary
                    : DesignTokens.colors.textMuted,
                align: 'center',
                lineSpacing: 0,
                wordWrap: { width: this.cardWidth - getSpacing(DesignTokens.spacing.md) },
            })
            .setOrigin(0.5);
        const descriptionBounds = description.getBounds();
        description.setY(currentY + descriptionBounds.height / 2);
        this.add(description);

        // 5. Difficulty badge (work from bottom up to ensure it fits)
        const difficultyText = this.levelData.difficulty.toUpperCase();
        const difficultyBadge = this.scene.add
            .text(0, halfHeight - getSpacing(DesignTokens.spacing.sm), difficultyText, {
                fontFamily: DesignTokens.fontFamily.primary,
                fontSize: getFontSize(DesignTokens.fontSize.tiny),
                color: DesignTokens.colors.bgDark,
                backgroundColor: this.isUnlocked
                    ? this.difficultyColors[this.levelData.difficulty]
                    : DesignTokens.colors.textMuted,
                padding: {
                    x: getSpacing(DesignTokens.spacing.xs),
                    y: this.isCompact ? 1 : 2,
                },
            })
            .setOrigin(0.5, 1); // Bottom-aligned
        this.add(difficultyBadge);

        // Progress or lock icon
        if (this.isUnlocked && this.progress) {
            this.createProgressBar(halfHeight);
        } else if (!this.isUnlocked) {
            this.createLockIcon(halfHeight);
        }

        // Completion checkmark
        if (this.isCompleted) {
            this.createCompletionCheckmark(halfHeight);
        }
    }

    /**
     * Create progress bar with responsive sizing (positioned from bottom)
     */
    createProgressBar(halfHeight) {
        const fontScale = this.isCompact ? this.scaleFactorHeight : 1.0;
        const getSpacing = (size) => Math.floor(size * fontScale);
        const getFontSize = (size) => `${Math.floor(parseInt(size) * fontScale)}px`;

        const barWidth = this.cardWidth - getSpacing(DesignTokens.spacing.xl);
        const barHeight = this.isCompact ? 4 : 6;
        // Position above difficulty badge
        const barY = halfHeight - getSpacing(DesignTokens.spacing.lg);

        // Background bar
        this.backgroundGraphics.fillStyle(
            Phaser.Display.Color.HexStringToColor(DesignTokens.colors.bgDark).color,
            0.5
        );
        this.backgroundGraphics.fillRoundedRect(
            -barWidth / 2,
            barY - barHeight / 2,
            barWidth,
            barHeight,
            4
        );

        // Progress fill
        const progressPercent =
            this.progress.totalCollectibles > 0
                ? this.progress.collectiblesCollected / this.progress.totalCollectibles
                : 0;

        if (progressPercent > 0) {
            const progressColor = Phaser.Display.Color.HexStringToColor(
                DesignTokens.colors.success
            );
            this.backgroundGraphics.fillStyle(progressColor.color, 0.8);
            this.backgroundGraphics.fillRoundedRect(
                -barWidth / 2,
                barY - barHeight / 2,
                barWidth * progressPercent,
                barHeight,
                4
            );
        }

        // Progress text with responsive sizing
        const progressText = this.scene.add
            .text(
                0,
                barY,
                `${this.progress.collectiblesCollected}/${this.progress.totalCollectibles}`,
                {
                    fontFamily: DesignTokens.fontFamily.primary,
                    fontSize: getFontSize(DesignTokens.fontSize.tiny),
                    color: DesignTokens.colors.textPrimary,
                }
            )
            .setOrigin(0.5);
        this.add(progressText);
    }

    /**
     * Create lock icon for locked levels with responsive sizing (positioned from bottom)
     */
    createLockIcon(halfHeight) {
        const fontScale = this.isCompact ? this.scaleFactorHeight : 1.0;
        const getFontSize = (size) => `${Math.floor(parseInt(size) * fontScale)}px`;
        const getSpacing = (size) => Math.floor(size * fontScale);

        const lockIcon = this.scene.add
            .text(0, halfHeight - getSpacing(DesignTokens.spacing.xl), '🔒', {
                fontSize: getFontSize(DesignTokens.fontSize.h2),
            })
            .setOrigin(0.5, 1); // Bottom-aligned
        this.add(lockIcon);
    }

    /**
     * Create completion checkmark with responsive sizing (top-right corner)
     */
    createCompletionCheckmark(halfHeight) {
        const fontScale = this.isCompact ? this.scaleFactorHeight : 1.0;
        const getFontSize = (size) => `${Math.floor(parseInt(size) * fontScale)}px`;
        const getSpacing = (size) => Math.floor(size * fontScale);

        const checkmark = this.scene.add
            .text(
                this.cardWidth / 2 - getSpacing(DesignTokens.spacing.sm),
                -halfHeight + getSpacing(DesignTokens.spacing.sm),
                '✓',
                {
                    fontFamily: DesignTokens.fontFamily.primary,
                    fontSize: getFontSize(DesignTokens.fontSize.h4),
                    color: DesignTokens.colors.success,
                    stroke: DesignTokens.colors.bgDark,
                    strokeThickness: this.isCompact ? 2 : 3,
                }
            )
            .setOrigin(1, 0); // Top-right aligned
        this.add(checkmark);
    }

    /**
     * Create interactive hitbox and hover effects
     */
    createInteractivity() {
        // Interactive hitbox
        const hitArea = this.scene.add
            .rectangle(0, 0, this.cardWidth, this.cardHeight, 0x000000, 0)
            .setInteractive({ useHandCursor: this.isUnlocked });

        this.add(hitArea);
        this.hitArea = hitArea;

        if (this.isUnlocked) {
            // Hover effects
            hitArea.on('pointerover', () => {
                this.onHover();
            });

            hitArea.on('pointerout', () => {
                this.onHoverEnd();
            });

            hitArea.on('pointerdown', () => {
                this.onClickHandler();
            });
        }
    }

    /**
     * Hover effect
     */
    onHover() {
        this.scene.tweens.add({
            targets: this,
            scale: 1.05,
            duration: 200,
            ease: 'Power2.easeOut',
        });

        LOG.dev('LEVEL_CARD_HOVER', {
            subsystem: 'ui',
            levelId: this.levelData.id,
        });
    }

    /**
     * Hover end effect
     */
    onHoverEnd() {
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 200,
            ease: 'Power2.easeOut',
        });
    }

    /**
     * Click handler with animation
     */
    onClickHandler() {
        this.scene.tweens.add({
            targets: this,
            scale: 0.95,
            duration: 100,
            ease: 'Power2.easeOut',
            yoyo: true,
            onComplete: () => {
                if (this.onClick) {
                    this.onClick(this.levelData);
                }
            },
        });

        LOG.info('LEVEL_CARD_CLICKED', {
            subsystem: 'ui',
            levelId: this.levelData.id,
            levelName: this.levelData.name,
        });
    }

    /**
     * Set accessibility data for screen readers and keyboard navigation
     */
    setAccessibilityData() {
        const ariaLabel = this.isUnlocked
            ? `Select ${this.levelData.name} - ${this.levelData.difficulty} difficulty`
            : `${this.levelData.name} - Locked`;

        this.setData('ariaLabel', ariaLabel);
        this.setData('ariaRole', 'button');
        this.setData('levelId', this.levelData.id);
        this.setData('isUnlocked', this.isUnlocked);
    }

    /**
     * Show focus indicator for keyboard navigation
     */
    showFocus() {
        // Add glowing border for keyboard focus
        const halfWidth = this.cardWidth / 2;
        const halfHeight = this.cardHeight / 2;

        if (!this.focusGraphics) {
            this.focusGraphics = this.scene.add.graphics();
            this.add(this.focusGraphics);
        }

        this.focusGraphics.clear();
        this.focusGraphics.lineStyle(
            4,
            Phaser.Display.Color.HexStringToColor(DesignTokens.colors.primary).color,
            1
        );
        this.focusGraphics.strokeRoundedRect(
            -halfWidth - 4,
            -halfHeight - 4,
            this.cardWidth + 8,
            this.cardHeight + 8,
            DesignTokens.card.level.borderRadius
        );

        LOG.dev('LEVEL_CARD_FOCUSED', {
            subsystem: 'ui',
            levelId: this.levelData.id,
        });
    }

    /**
     * Hide focus indicator
     */
    hideFocus() {
        if (this.focusGraphics) {
            this.focusGraphics.clear();
        }
    }

    /**
     * Animate entrance (staggered)
     */
    animateEntrance(delay = 0) {
        this.setAlpha(0).setScale(0.8);
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Power2.easeOut',
            delay,
        });
    }

    /**
     * Cleanup
     */
    destroy(fromScene) {
        if (this.focusGraphics) {
            this.focusGraphics.destroy();
        }
        super.destroy(fromScene);
    }
}
