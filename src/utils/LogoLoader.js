import { LOG } from '../observability/core/LogSystem.js';

/**
 * LogoLoader - Smart multi-resolution logo loading utility
 *
 * Automatically selects optimal logo variant based on:
 * - Device pixel ratio (DPR)
 * - WebP support
 * - Network conditions (optional)
 *
 * Performance optimizations:
 * - 92-97% smaller files with WebP
 * - Resolution matching for DPR 1x, 2x, 3x
 * - Graceful PNG fallback for older browsers
 *
 * @example
 * // In Preloader.js
 * const logoPath = LogoLoader.getOptimalPath(this.sys.game);
 * this.load.image('logo', logoPath);
 */
export class LogoLoader {
    /**
     * Base path for logo assets (relative to assets/ directory)
     * Note: Phaser automatically prepends 'assets/' to load paths
     */
    static BASE_PATH = 'images/ui/logo/';

    /**
     * Logo file configurations
     */
    static VARIANTS = {
        '1x': {
            dimensions: '512x512',
            webp: 'mainlogo@1x.webp',
            png: 'mainlogo@1x.png',
            size: { webp: 39, png: 325 }, // KB
        },
        '2x': {
            dimensions: '1024x1024',
            webp: 'mainlogo@2x.webp',
            png: 'mainlogo@2x.png',
            size: { webp: 128, png: 1740 }, // KB
        },
        fallback: {
            dimensions: '256x256',
            webp: 'mainlogo-fallback.webp',
            png: 'mainlogo-fallback.png',
            size: { webp: 16, png: 84 }, // KB
        },
    };

    /**
     * Detect if browser supports WebP format
     * Uses Phaser's built-in browser detection when available
     *
     * @param {Phaser.Game} [game] - Phaser game instance
     * @returns {boolean} True if WebP is supported
     */
    static supportsWebP(game) {
        // Use Phaser's built-in WebP detection if available
        if (game?.device?.browser?.webp !== undefined) {
            return game.device.browser.webp;
        }

        // Fallback: Check for WebP support via canvas
        if (typeof document !== 'undefined') {
            const canvas = document.createElement('canvas');
            if (canvas.getContext && canvas.getContext('2d')) {
                // Check for webp support
                return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
            }
        }

        // Default to false for safety
        return false;
    }

    /**
     * Get device pixel ratio with bounds checking
     *
     * @returns {number} Device pixel ratio (1.0 - 3.0)
     */
    static getDevicePixelRatio() {
        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

        // Clamp DPR between 1 and 3 for practical use
        return Math.min(Math.max(dpr, 1), 3);
    }

    /**
     * Select resolution tier based on device pixel ratio
     *
     * @param {number} [dpr] - Device pixel ratio (auto-detected if not provided)
     * @returns {'1x'|'2x'|'fallback'} Resolution tier
     */
    static selectResolution(dpr) {
        if (dpr === undefined) {
            dpr = LogoLoader.getDevicePixelRatio();
        }

        // Resolution selection logic:
        // - DPR >= 1.5: Use 2x (1024×1024)
        // - DPR < 1.5:  Use 1x (512×512)
        // - Fallback:   Use fallback (256×256) for error recovery
        if (dpr >= 1.5) {
            return '2x';
        }
        return '1x';
    }

    /**
     * Get optimal logo path based on device capabilities
     *
     * @param {Phaser.Game} [game] - Phaser game instance for browser detection
     * @param {Object} [options] - Optional overrides
     * @param {number} [options.dpr] - Force specific device pixel ratio
     * @param {boolean} [options.forceFormat] - Force 'webp' or 'png'
     * @param {boolean} [options.useFallback] - Force fallback resolution
     * @returns {string} Optimal logo file path
     */
    static getOptimalPath(game, options = {}) {
        const {
            dpr = LogoLoader.getDevicePixelRatio(),
            forceFormat = null,
            useFallback = false,
        } = options;

        // Determine resolution
        const resolution = useFallback ? 'fallback' : LogoLoader.selectResolution(dpr);
        const variant = LogoLoader.VARIANTS[resolution];

        // Determine format (WebP if supported, PNG otherwise)
        const webpSupported =
            forceFormat === 'webp' || (forceFormat !== 'png' && LogoLoader.supportsWebP(game));
        const format = webpSupported ? 'webp' : 'png';
        const filename = variant[format];

        // Construct full path
        const path = `${LogoLoader.BASE_PATH}${filename}`;

        // Log selection for observability
        LOG.info('LOGO_LOADER_SELECTED', {
            subsystem: 'assets',
            message: 'Optimal logo variant selected',
            selection: {
                resolution,
                dimensions: variant.dimensions,
                format,
                path,
                estimatedSize: `${variant.size[format]}KB`,
            },
            deviceInfo: {
                dpr,
                webpSupported,
            },
            performance: {
                savings: webpSupported
                    ? `${Math.round((1 - variant.size.webp / variant.size.png) * 100)}% smaller vs PNG`
                    : 'Using PNG (WebP not supported)',
            },
        });

        return path;
    }

    /**
     * Preload all logo variants (for critical assets)
     * Use this if you want to preload multiple resolutions
     *
     * @param {Phaser.Scene} scene - Phaser scene with loader
     * @param {string} [keyPrefix='logo'] - Key prefix for loaded assets
     */
    static preloadAllVariants(scene, keyPrefix = 'logo') {
        const webpSupported = LogoLoader.supportsWebP(scene.sys.game);
        const format = webpSupported ? 'webp' : 'png';

        Object.entries(LogoLoader.VARIANTS).forEach(([resolution, variant]) => {
            const key = `${keyPrefix}_${resolution}`;
            const path = `${LogoLoader.BASE_PATH}${variant[format]}`;

            scene.load.image(key, path);

            LOG.dev('LOGO_PRELOAD_VARIANT', {
                subsystem: 'assets',
                message: 'Preloading logo variant',
                key,
                resolution,
                format,
                path,
            });
        });
    }

    /**
     * Get logo metadata for a specific resolution
     *
     * @param {'1x'|'2x'|'fallback'} resolution - Resolution tier
     * @returns {Object} Logo variant metadata
     */
    static getVariantInfo(resolution) {
        return LogoLoader.VARIANTS[resolution] || LogoLoader.VARIANTS['1x'];
    }

    /**
     * Calculate expected load time based on connection speed
     *
     * @param {'1x'|'2x'|'fallback'} resolution - Resolution tier
     * @param {string} format - 'webp' or 'png'
     * @param {number} [speedMbps=5] - Connection speed in Mbps (default: 5 Mbps / 4G)
     * @returns {number} Estimated load time in milliseconds
     */
    static estimateLoadTime(resolution, format, speedMbps = 5) {
        const variant = LogoLoader.getVariantInfo(resolution);
        const sizeKB = variant.size[format];
        const sizeMb = sizeKB / 1024;

        // Load time = (file size in Mb / speed in Mbps) * 1000
        const loadTimeMs = (sizeMb / speedMbps) * 1000;

        return Math.round(loadTimeMs);
    }
}
