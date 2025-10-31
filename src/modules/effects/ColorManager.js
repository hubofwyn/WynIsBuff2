import { EventNames } from '../../constants/EventNames';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * ColorManager class handles color transitions and effects for game objects,
 * particularly for the player character based on jump state.
 */
export class ColorManager {
    /**
     * Create a new ColorManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;

        // Color configurations for different states
        this.colorConfigs = {
            ground: 0x0000ff, // Blue
            jump1: 0x00ff00, // Green
            jump2: 0xffff00, // Yellow
            jump3: 0xff0000, // Red
            landing: 0x0000ff, // Blue (same as ground)
        };

        // Active color transitions
        this.activeTransitions = new Map();

        // Set up event listeners
        this.setupEventListeners();

        LOG.dev('COLORMANAGER_INITIALIZED', {
            subsystem: 'effects',
            message: 'ColorManager initialized with color transition and accessibility features',
            colorConfigs: this.colorConfigs,
        });
    }

    /**
     * Set up event listeners for color effects
     */
    setupEventListeners() {
        if (!this.eventSystem) return;

        // Listen for jump events
        this.eventSystem.on(EventNames.PLAYER_JUMP, this.handleJump.bind(this));

        // Listen for land events
        this.eventSystem.on(EventNames.PLAYER_LAND, this.handleLand.bind(this));

        // Listen for jump state events
        this.eventSystem.on(EventNames.PLAYER_JUMP_PEAK, this.handleJumpPeak.bind(this));
        this.eventSystem.on(EventNames.PLAYER_JUMP_FALL, this.handleJumpFall.bind(this));
    }

    /**
     * Handle jump events
     * @param {object} data - Jump event data
     */
    handleJump(data) {
        const jumpNumber = data.jumpNumber;
        const sprite = data.sprite || this.findPlayerSprite();

        if (!sprite) return;

        // Determine target color based on jump number
        let targetColor;
        switch (jumpNumber) {
            case 1:
                targetColor = this.colorConfigs.jump1;
                break;
            case 2:
                targetColor = this.colorConfigs.jump2;
                break;
            case 3:
                targetColor = this.colorConfigs.jump3;
                break;
            default:
                targetColor = this.colorConfigs.jump1;
        }

        // Apply color transition
        this.transitionColor(sprite, targetColor, 200);

        // Add a pulse effect
        this.pulseEffect(sprite, 1.1, 100);
    }

    /**
     * Handle land events
     * @param {object} data - Land event data
     */
    handleLand(data) {
        const sprite = data.sprite || this.findPlayerSprite();
        const velocity = data.velocity;

        if (!sprite) return;

        // Transition back to ground color
        this.transitionColor(sprite, this.colorConfigs.ground, 300);

        // Add landing pulse effect based on impact velocity
        const impactForce = Math.min(Math.abs(velocity.y) / 20, 2); // Cap at 2x
        if (impactForce > 0.5) {
            this.pulseEffect(sprite, 1 + impactForce * 0.1, 150);
        }
    }

    /**
     * Handle jump peak events
     * @param {object} data - Jump peak event data
     */
    handleJumpPeak(data) {
        const sprite = data.sprite || this.findPlayerSprite();
        const jumpNumber = data.jumpNumber;

        if (!sprite) return;

        // Brighten the color at the peak of the jump
        let baseColor;
        switch (jumpNumber) {
            case 1:
                baseColor = this.colorConfigs.jump1;
                break;
            case 2:
                baseColor = this.colorConfigs.jump2;
                break;
            case 3:
                baseColor = this.colorConfigs.jump3;
                break;
            default:
                baseColor = this.colorConfigs.jump1;
        }

        // Convert to a brighter version
        const brighterColor = this.brightenColor(baseColor, 0.2);

        // Apply a quick pulse with the brighter color
        this.transitionColor(sprite, brighterColor, 100);
        setTimeout(() => {
            this.transitionColor(sprite, baseColor, 300);
        }, 100);
    }

    /**
     * Handle jump fall events
     * @param {object} data - Jump fall event data
     */
    handleJumpFall(data) {
        const sprite = data.sprite || this.findPlayerSprite();
        const jumpNumber = data.jumpNumber;

        if (!sprite) return;

        // Slightly dim the color during fall
        let baseColor;
        switch (jumpNumber) {
            case 1:
                baseColor = this.colorConfigs.jump1;
                break;
            case 2:
                baseColor = this.colorConfigs.jump2;
                break;
            case 3:
                baseColor = this.colorConfigs.jump3;
                break;
            default:
                baseColor = this.colorConfigs.jump1;
        }

        // Convert to a slightly dimmer version
        const dimmerColor = this.dimColor(baseColor, 0.1);

        // Apply a gradual transition to the dimmer color
        this.transitionColor(sprite, dimmerColor, 200);
    }

    /**
     * Transition a sprite's color from current to target
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The sprite to color
     * @param {number} targetColor - The target color in hex format
     * @param {number} duration - Transition duration in ms
     */
    transitionColor(sprite, targetColor, duration = 200) {
        // Stop any active transition for this sprite
        this.stopTransition(sprite);

        // Get current color
        let currentColor;
        if (sprite.tintTopLeft !== undefined) {
            // For sprites with tint
            currentColor = sprite.tintTopLeft;
        } else if (sprite.fillColor !== undefined) {
            // For rectangles with fillColor
            currentColor = sprite.fillColor;
        } else {
            // If we can't determine current color, just set the target color directly
            this.setColor(sprite, targetColor);
            return;
        }

        // Extract RGB components
        const startRed = (currentColor >> 16) & 0xff;
        const startGreen = (currentColor >> 8) & 0xff;
        const startBlue = currentColor & 0xff;

        const endRed = (targetColor >> 16) & 0xff;
        const endGreen = (targetColor >> 8) & 0xff;
        const endBlue = targetColor & 0xff;

        // Create a tween for smooth color transition
        const tween = this.scene.tweens.add({
            targets: { progress: 0 },
            progress: 1,
            duration,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const progress = tween.getValue();

                // Interpolate RGB values
                const red = Math.floor(startRed + (endRed - startRed) * progress);
                const green = Math.floor(startGreen + (endGreen - startGreen) * progress);
                const blue = Math.floor(startBlue + (endBlue - startBlue) * progress);

                // Combine into hex color
                const color = (red << 16) | (green << 8) | blue;

                // Apply the color
                this.setColor(sprite, color);
            },
        });

        // Store the active transition
        this.activeTransitions.set(sprite, tween);
    }

    /**
     * Stop an active color transition
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The sprite
     */
    stopTransition(sprite) {
        if (this.activeTransitions.has(sprite)) {
            const tween = this.activeTransitions.get(sprite);
            tween.stop();
            this.activeTransitions.delete(sprite);
        }
    }

    /**
     * Apply a pulse effect to a sprite
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The sprite
     * @param {number} scale - Maximum scale factor
     * @param {number} duration - Pulse duration in ms
     */
    pulseEffect(sprite, scale = 1.1, duration = 100) {
        // Store original scale
        const originalScaleX = sprite.scaleX || 1;
        const originalScaleY = sprite.scaleY || 1;

        // Create pulse tween
        this.scene.tweens.add({
            targets: sprite,
            scaleX: originalScaleX * scale,
            scaleY: originalScaleY * scale,
            duration: duration / 2,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // Ensure scale is reset to original
                sprite.setScale(originalScaleX, originalScaleY);
            },
        });
    }

    /**
     * Set a sprite's color
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The sprite
     * @param {number} color - The color in hex format
     */
    setColor(sprite, color) {
        if (sprite.setTint) {
            // For sprites with setTint method
            sprite.setTint(color);
        } else if (sprite.fillColor !== undefined) {
            // For rectangles with fillColor property
            sprite.fillColor = color;
        }
    }

    /**
     * Brighten a color by a percentage
     * @param {number} color - The color in hex format
     * @param {number} percent - Percentage to brighten (0-1)
     * @returns {number} The brightened color
     */
    brightenColor(color, percent) {
        const red = Math.min(255, ((color >> 16) & 0xff) + 255 * percent);
        const green = Math.min(255, ((color >> 8) & 0xff) + 255 * percent);
        const blue = Math.min(255, (color & 0xff) + 255 * percent);

        return (Math.floor(red) << 16) | (Math.floor(green) << 8) | Math.floor(blue);
    }

    /**
     * Dim a color by a percentage
     * @param {number} color - The color in hex format
     * @param {number} percent - Percentage to dim (0-1)
     * @returns {number} The dimmed color
     */
    dimColor(color, percent) {
        const red = ((color >> 16) & 0xff) * (1 - percent);
        const green = ((color >> 8) & 0xff) * (1 - percent);
        const blue = (color & 0xff) * (1 - percent);

        return (Math.floor(red) << 16) | (Math.floor(green) << 8) | Math.floor(blue);
    }

    /**
     * Find the player sprite in the scene
     * @returns {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} The player sprite
     */
    findPlayerSprite() {
        // This is a fallback method if the sprite isn't provided in the event data
        // In a real implementation, you might want to have a more reliable way to get the player sprite

        // Try to get the player controller from the scene
        if (this.scene.playerController && this.scene.playerController.getSprite) {
            return this.scene.playerController.getSprite();
        }

        return null;
    }

    /**
     * Clean up resources when scene is shut down
     */
    shutdown() {
        // Remove event listeners
        if (this.eventSystem) {
            this.eventSystem.off(EventNames.PLAYER_JUMP, this.handleJump);
            this.eventSystem.off(EventNames.PLAYER_LAND, this.handleLand);
            this.eventSystem.off(EventNames.PLAYER_JUMP_PEAK, this.handleJumpPeak);
            this.eventSystem.off(EventNames.PLAYER_JUMP_FALL, this.handleJumpFall);
        }

        // Stop all active transitions
        this.activeTransitions.forEach((tween) => {
            tween.stop();
        });
        this.activeTransitions.clear();
    }
    /**
     * Apply a color-blind palette to the scene
     * @param {string} palette - One of 'Off', 'Deuteranopia', 'Protanopia', 'Tritanopia'
     */
    applyPalette(palette) {
        this.currentPalette = palette;
        LOG.dev('COLORMANAGER_PALETTE_APPLIED', {
            subsystem: 'effects',
            message: 'Color-blind accessibility palette applied',
            palette,
            previousPalette: this.currentPalette,
        });
        // Apply CSS-based filter on game canvas as a simple palette simulation
        const canvas = this.scene.sys.game.canvas;
        if (canvas && canvas.style) {
            switch (palette) {
                case 'Deuteranopia':
                    canvas.style.filter = 'grayscale(100%)';
                    break;
                case 'Protanopia':
                    canvas.style.filter = 'sepia(60%)';
                    break;
                case 'Tritanopia':
                    canvas.style.filter = 'hue-rotate(90deg)';
                    break;
                default:
                    canvas.style.filter = 'none';
            }
        }
    }
}
