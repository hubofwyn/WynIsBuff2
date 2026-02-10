import { LOG } from '../observability/core/LogSystem.js';
import { DesignTokens } from '../constants/DesignTokens.js';

import { BaseManager } from './BaseManager.js';

/**
 * LoadingScreenManager - Unified loading screen architecture
 *
 * ARCHITECTURE:
 * - Extends BaseManager for singleton pattern
 * - Provides consistent loading UX across all screens
 * - Responsive design with proper proportions
 * - Accessible with ARIA labels
 * - Integrates with observability system
 *
 * USAGE:
 * ```javascript
 * const loadingManager = LoadingScreenManager.getInstance();
 *
 * // Show loading screen
 * loadingManager.show(scene, {
 *     title: 'Loading Level 1',
 *     showLogo: true,
 *     showProgress: true
 * });
 *
 * // Update progress
 * loadingManager.updateProgress(0.5, 'Loading assets...');
 *
 * // Hide loading screen
 * loadingManager.hide();
 * ```
 */
export class LoadingScreenManager extends BaseManager {
    constructor() {
        super();
        this.scene = null;
        this.container = null;
        this.progressBar = null;
        this.progressText = null;
        this.statusText = null;
        this.visible = false;
    }

    /**
     * Show loading screen
     * @param {Phaser.Scene} scene - The scene to show loading screen in
     * @param {Object} options - Loading screen options
     * @param {string} options.title - Loading screen title
     * @param {boolean} options.showLogo - Show game logo
     * @param {boolean} options.showProgress - Show progress bar
     * @param {string} options.message - Initial message
     */
    show(scene, options = {}) {
        const {
            title = 'Loading...',
            showLogo = true,
            showProgress = true,
            message = 'Preparing game...',
        } = options;

        this.scene = scene;
        const { width, height } = scene.cameras.main;

        LOG.info('LOADING_SCREEN_SHOW', {
            subsystem: 'ui',
            message: 'Showing loading screen',
            title,
            showLogo,
            showProgress,
        });

        // Create container for all loading elements
        this.container = scene.add.container(0, 0);
        this.container.setDepth(DesignTokens.zIndex.overlay);

        // Background overlay
        const overlay = scene.add.graphics();
        overlay.fillStyle(0x000000, 0.95);
        overlay.fillRect(0, 0, width, height);
        this.container.add(overlay);

        // Logo (if enabled)
        if (showLogo) {
            this._createLogo(width, height);
        }

        // Title
        const titleY = showLogo ? height * 0.4 : height * 0.3;
        const titleText = scene.add.text(width / 2, titleY, title, {
            fontFamily: DesignTokens.fontFamily.display,
            fontSize: DesignTokens.fontSize.displayMedium,
            color: DesignTokens.colors.primary,
            stroke: '#000000',
            strokeThickness: 4,
            shadow: DesignTokens.shadow.md,
        });
        titleText.setOrigin(0.5);
        this.container.add(titleText);

        // Progress bar (if enabled)
        if (showProgress) {
            this._createProgressBar(width, height);
        }

        // Status message
        const statusY = showProgress ? height * 0.65 : height * 0.5;
        this.statusText = scene.add.text(width / 2, statusY, message, {
            fontFamily: DesignTokens.fontFamily.body,
            fontSize: DesignTokens.fontSize.bodyMedium,
            color: DesignTokens.colors.textSecondary,
            align: 'center',
        });
        this.statusText.setOrigin(0.5);
        this.container.add(this.statusText);

        // Spinner animation
        this._createSpinner(width, height);

        this.visible = true;
    }

    /**
     * Create logo
     * @private
     */
    _createLogo(width, height) {
        const logoY = height * 0.25;

        // Try to use actual logo texture
        if (this.scene.textures.exists('logo')) {
            const logo = this.scene.add.image(width / 2, logoY, 'logo');
            logo.setOrigin(0.5);

            // Responsive scaling
            const scale =
                width < DesignTokens.breakpoints.mobile
                    ? DesignTokens.loading.logoScale.mobile
                    : width < DesignTokens.breakpoints.tablet
                      ? DesignTokens.loading.logoScale.tablet
                      : DesignTokens.loading.logoScale.desktop;

            logo.setScale(scale);
            this.container.add(logo);

            // Pulse animation
            this.scene.tweens.add({
                targets: logo,
                scale: scale * 1.05,
                duration: DesignTokens.duration.slow,
                yoyo: true,
                repeat: -1,
                ease: DesignTokens.easing.easeInOut,
            });
        } else {
            // Fallback: Text logo
            const logoText = this.scene.add.text(width / 2, logoY, '🎮', {
                fontSize: '64px',
            });
            logoText.setOrigin(0.5);
            this.container.add(logoText);
        }
    }

    /**
     * Create progress bar
     * @private
     */
    _createProgressBar(width, height) {
        const progressY = height * 0.55;
        const barConfig = DesignTokens.loading.progressBar;

        // Center the progress bar
        const barX = (width - barConfig.width) / 2;

        // Background bar
        const bgBar = this.scene.add.graphics();
        bgBar.fillStyle(barConfig.backgroundColor, 1);
        bgBar.fillRoundedRect(
            barX,
            progressY,
            barConfig.width,
            barConfig.height,
            barConfig.borderRadius
        );
        bgBar.lineStyle(barConfig.borderWidth, barConfig.borderColor);
        bgBar.strokeRoundedRect(
            barX,
            progressY,
            barConfig.width,
            barConfig.height,
            barConfig.borderRadius
        );
        this.container.add(bgBar);

        // Progress fill
        this.progressBar = this.scene.add.graphics();
        this.container.add(this.progressBar);

        // Progress percentage text
        this.progressText = this.scene.add.text(width / 2, progressY + barConfig.height / 2, '0%', {
            fontFamily: DesignTokens.fontFamily.mono,
            fontSize: DesignTokens.fontSize.caption,
            color: DesignTokens.colors.textPrimary,
            fontStyle: 'bold',
        });
        this.progressText.setOrigin(0.5);
        this.container.add(this.progressText);

        // Store bar config for updates
        this._barConfig = {
            x: barX,
            y: progressY,
            width: barConfig.width,
            height: barConfig.height,
            radius: barConfig.borderRadius,
            color: barConfig.fillColor,
        };
    }

    /**
     * Create spinner animation
     * @private
     */
    _createSpinner(width, height) {
        const spinnerY = height * 0.75;
        const config = DesignTokens.loading.spinner;

        this.spinner = this.scene.add.graphics();
        this.container.add(this.spinner);

        // Animate spinner
        this.scene.time.addEvent({
            delay: 16, // ~60fps
            callback: () => {
                if (!this.visible) return;

                this.spinner.clear();
                this.spinner.lineStyle(config.lineWidth, config.color);

                const angle = (this.scene.time.now * config.speed) % (Math.PI * 2);
                this.spinner.beginPath();
                this.spinner.arc(
                    width / 2,
                    spinnerY,
                    config.radius,
                    angle,
                    angle + Math.PI * 1.5,
                    false
                );
                this.spinner.strokePath();
            },
            loop: true,
        });
    }

    /**
     * Update progress
     * @param {number} progress - Progress value 0-1
     * @param {string} message - Optional status message
     */
    updateProgress(progress, message = null) {
        if (!this.visible || !this.progressBar) return;

        // Clamp progress between 0 and 1
        progress = Math.max(0, Math.min(1, progress));

        // Update progress bar
        const config = this._barConfig;
        const fillWidth = config.width * progress;

        this.progressBar.clear();
        this.progressBar.fillStyle(config.color, 1);
        this.progressBar.fillRoundedRect(
            config.x,
            config.y,
            fillWidth,
            config.height,
            config.radius
        );

        // Update percentage text
        if (this.progressText) {
            this.progressText.setText(`${Math.round(progress * 100)}%`);
        }

        // Update status message
        if (message && this.statusText) {
            this.statusText.setText(message);
        }

        LOG.dev('LOADING_SCREEN_PROGRESS', {
            subsystem: 'ui',
            message: 'Loading progress updated',
            progress: Math.round(progress * 100),
            statusMessage: message,
        });
    }

    /**
     * Update status message
     * @param {string} message - Status message
     */
    updateStatus(message) {
        if (!this.visible || !this.statusText) return;

        this.statusText.setText(message);

        LOG.dev('LOADING_SCREEN_STATUS', {
            subsystem: 'ui',
            message: 'Loading status updated',
            statusMessage: message,
        });
    }

    /**
     * Hide loading screen with fade out
     * @param {number} duration - Fade duration in ms
     * @returns {Promise<void>}
     */
    hide(duration = DesignTokens.duration.normal) {
        if (!this.visible || !this.container) {
            return Promise.resolve();
        }

        LOG.info('LOADING_SCREEN_HIDE', {
            subsystem: 'ui',
            message: 'Hiding loading screen',
            duration,
        });

        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: this.container,
                alpha: 0,
                duration,
                ease: DesignTokens.easing.easeOut,
                onComplete: () => {
                    this.container.destroy();
                    this.container = null;
                    this.progressBar = null;
                    this.progressText = null;
                    this.statusText = null;
                    this.spinner = null;
                    this.visible = false;

                    LOG.dev('LOADING_SCREEN_HIDDEN', {
                        subsystem: 'ui',
                        message: 'Loading screen hidden and destroyed',
                    });

                    resolve();
                },
            });
        });
    }

    /**
     * Check if loading screen is visible
     * @returns {boolean}
     */
    isVisible() {
        return this.visible;
    }

    /**
     * Destroy loading screen immediately
     */
    destroy() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.progressBar = null;
        this.progressText = null;
        this.statusText = null;
        this.spinner = null;
        this.visible = false;

        LOG.dev('LOADING_SCREEN_DESTROYED', {
            subsystem: 'ui',
            message: 'Loading screen destroyed',
        });
    }
}
