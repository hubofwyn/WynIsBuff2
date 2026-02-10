/**
 * Design Tokens - WynIsBuff2
 *
 * Centralized design system for consistent UI across all screens
 *
 * ARCHITECTURE:
 * - Single source of truth for spacing, colors, typography
 * - Responsive values using clamp() for fluid scaling
 * - Semantic naming for easy theming
 * - Follows CSS custom properties pattern
 *
 * USAGE:
 * ```javascript
 * import { DesignTokens } from '../constants/DesignTokens.js';
 *
 * // Use in Phaser scenes
 * this.add.text(x, y, 'Title', {
 *     fontSize: DesignTokens.fontSize.heading,
 *     color: DesignTokens.colors.accent
 * });
 * ```
 */

export const DesignTokens = {
    /**
     * Spacing Scale (8px base unit)
     * Use for margins, padding, gaps
     */
    spacing: {
        xs: 4, // 0.5 units
        sm: 8, // 1 unit
        md: 16, // 2 units
        lg: 24, // 3 units
        xl: 32, // 4 units
        xxl: 48, // 6 units
        xxxl: 64, // 8 units
    },

    /**
     * Color Palette
     * Primary brand colors and semantic colors
     */
    colors: {
        // Brand Colors
        primary: '#4ECDC4', // Teal - main brand color
        secondary: '#FFE66D', // Yellow - accent
        tertiary: '#FF6B9D', // Pink - highlights

        // Background Colors
        bgDark: '#0f1b2b', // Dark blue-black
        bgMedium: '#1a1a2e', // Medium dark
        bgLight: '#16213e', // Lighter dark
        bgAccent: '#0f3460', // Accent dark

        // Text Colors
        textPrimary: '#FFFFFF', // White
        textSecondary: '#E0E0E0', // Light gray
        textMuted: '#999999', // Muted gray
        textDisabled: '#555555', // Disabled gray

        // Semantic Colors
        success: '#44A08D', // Green
        warning: '#F09819', // Orange
        error: '#C73E1D', // Red
        info: '#4ECDC4', // Teal

        // Difficulty Colors
        beginner: '#44A08D', // Green
        intermediate: '#FFE66D', // Yellow
        master: '#FF6B9D', // Pink/Red

        // UI Elements
        border: '#444444',
        borderLight: '#666666',
        borderAccent: '#4ECDC4',
        overlay: 'rgba(0, 0, 0, 0.8)',
        overlayLight: 'rgba(0, 0, 0, 0.6)',

        // Gradients (as arrays for Phaser)
        gradientPrimary: ['#4ECDC4', '#44A08D'],
        gradientSecondary: ['#FFE66D', '#F09819'],
        gradientTertiary: ['#FF6B9D', '#C73E1D'],
        gradientBackground: ['#0f1b2b', '#1a1a2e', '#16213e', '#0f3460'],
    },

    /**
     * Typography Scale
     * Font sizes for responsive text
     */
    fontSize: {
        // Display (large titles)
        displayLarge: '64px', // Main title
        displayMedium: '48px', // Section titles
        displaySmall: '36px', // Subsection titles

        // Headings
        h1: '32px',
        h2: '28px',
        h3: '24px',
        h4: '20px',
        h5: '18px',
        h6: '16px',

        // Body
        bodyLarge: '18px',
        bodyMedium: '16px',
        bodySmall: '14px',

        // UI Elements
        button: '16px',
        label: '14px',
        caption: '12px',
        tiny: '10px',
    },

    /**
     * Font Weights
     */
    fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
    },

    /**
     * Font Families
     */
    fontFamily: {
        display: 'Impact, Arial Black, sans-serif', // Titles
        heading: 'Arial Black, sans-serif', // Headings
        body: 'Arial, sans-serif', // Body text
        mono: 'Courier New, monospace', // Code/stats
    },

    /**
     * Border Radius
     */
    borderRadius: {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        xxl: 24,
        full: 9999, // Pill shape
    },

    /**
     * Shadows
     */
    shadow: {
        sm: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true },
        md: { offsetX: 4, offsetY: 4, color: '#000000', blur: 8, fill: true },
        lg: { offsetX: 6, offsetY: 6, color: '#000000', blur: 12, fill: true },
        xl: { offsetX: 8, offsetY: 8, color: '#000000', blur: 16, fill: true },
    },

    /**
     * Z-Index Layers
     */
    zIndex: {
        background: 0,
        content: 100,
        ui: 200,
        overlay: 300,
        modal: 400,
        toast: 500,
        tooltip: 600,
    },

    /**
     * Animation Durations (milliseconds)
     */
    duration: {
        instant: 0,
        fast: 150,
        normal: 300,
        slow: 500,
        slower: 800,
        slowest: 1000,
    },

    /**
     * Animation Easings
     */
    easing: {
        linear: 'Linear',
        easeIn: 'Power1.easeIn',
        easeOut: 'Power1.easeOut',
        easeInOut: 'Power1.easeInOut',
        bounce: 'Bounce.easeOut',
        elastic: 'Elastic.easeOut',
        back: 'Back.easeOut',
    },

    /**
     * Breakpoints (for reference - Phaser uses fixed canvas)
     * Use these for responsive logic in code
     */
    breakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024,
        wide: 1440,
    },

    /**
     * Card Dimensions
     */
    card: {
        // Level selection cards
        level: {
            width: 140,
            height: 180,
            spacing: 20,
            borderRadius: 15,
            borderWidth: 3,
        },

        // Feature cards (larger)
        feature: {
            width: 280,
            height: 320,
            spacing: 24,
            borderRadius: 20,
            borderWidth: 4,
        },

        // Compact cards (smaller)
        compact: {
            width: 100,
            height: 120,
            spacing: 12,
            borderRadius: 10,
            borderWidth: 2,
        },
    },

    /**
     * Button Styles
     */
    button: {
        primary: {
            backgroundColor: '#4ECDC4',
            textColor: '#000000',
            borderColor: '#44A08D',
            hoverScale: 1.05,
            activeScale: 0.98,
        },
        secondary: {
            backgroundColor: '#FFE66D',
            textColor: '#000000',
            borderColor: '#F09819',
            hoverScale: 1.05,
            activeScale: 0.98,
        },
        danger: {
            backgroundColor: '#FF6B9D',
            textColor: '#FFFFFF',
            borderColor: '#C73E1D',
            hoverScale: 1.05,
            activeScale: 0.98,
        },
        ghost: {
            backgroundColor: 'transparent',
            textColor: '#FFFFFF',
            borderColor: '#666666',
            hoverScale: 1.02,
            activeScale: 0.98,
        },
    },

    /**
     * Panel Styles
     */
    panel: {
        default: {
            backgroundColor: 0x000000,
            backgroundAlpha: 0.7,
            borderColor: 0x4ecdc4,
            borderWidth: 2,
            borderRadius: 16,
        },
        accent: {
            backgroundColor: 0x0f3460,
            backgroundAlpha: 0.9,
            borderColor: 0xffe66d,
            borderWidth: 3,
            borderRadius: 20,
        },
        subtle: {
            backgroundColor: 0x1a1a2e,
            backgroundAlpha: 0.5,
            borderColor: 0x444444,
            borderWidth: 1,
            borderRadius: 12,
        },
    },

    /**
     * Loading Screen Specific
     */
    loading: {
        logoScale: {
            mobile: 0.3,
            tablet: 0.4,
            desktop: 0.5,
        },
        progressBar: {
            width: 400,
            height: 20,
            borderRadius: 10,
            backgroundColor: 0x1a1a2e,
            fillColor: 0x4ecdc4,
            borderColor: 0x444444,
            borderWidth: 2,
        },
        spinner: {
            radius: 30,
            lineWidth: 4,
            color: 0x4ecdc4,
            speed: 0.05, // Rotation speed
        },
    },

    /**
     * Accessibility
     */
    accessibility: {
        minContrastRatio: 4.5, // WCAG AA standard
        focusOutlineWidth: 3,
        focusOutlineColor: '#4ECDC4',
        touchTargetMinSize: 44, // Minimum touch target (px)
    },
};

/**
 * Helper function to get responsive font size
 * @param {string} size - Size key from fontSize
 * @param {number} scale - Scale factor (default 1)
 * @returns {string} Font size with px unit
 */
export function getResponsiveFontSize(size, scale = 1) {
    const baseSize = parseInt(DesignTokens.fontSize[size]);
    return `${Math.round(baseSize * scale)}px`;
}

/**
 * Helper function to get color with alpha
 * @param {string} colorKey - Color key from colors
 * @param {number} alpha - Alpha value 0-1
 * @returns {number} Phaser color with alpha
 */
export function getColorWithAlpha(colorKey, alpha = 1) {
    const color = DesignTokens.colors[colorKey];
    if (typeof color === 'string' && color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return Phaser.Display.Color.GetColor32(Math.round(alpha * 255), r, g, b);
    }
    return color;
}

/**
 * Helper function to create gradient style
 * @param {Phaser.GameObjects.Graphics} graphics - Phaser graphics object
 * @param {string} gradientKey - Gradient key from colors
 * @param {number} alpha - Alpha value 0-1
 */
export function applyGradient(graphics, gradientKey, alpha = 1) {
    const gradient = DesignTokens.colors[gradientKey];
    if (Array.isArray(gradient) && gradient.length >= 2) {
        const colors = gradient.map((hex) => Phaser.Display.Color.HexStringToColor(hex).color);
        graphics.fillGradientStyle(colors[0], colors[1], colors[0], colors[1], alpha);
    }
}
