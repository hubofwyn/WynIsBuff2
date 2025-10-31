import { BaseManager } from '../../core/BaseManager.js';
import { LOG } from '../core/LogSystem.js';

/**
 * DebugContext - Manages debug context and state providers
 *
 * Provides automatic context injection for logging system.
 * Captures state snapshots from registered providers on demand.
 *
 * Features:
 * - Frame tracking
 * - Multiple state providers
 * - Automatic snapshot capture
 * - Performance optimization (cached snapshots per frame)
 *
 * Usage:
 *   const context = DebugContext.getInstance();
 *   context.registerProvider(new PlayerStateProvider(player));
 *   const snapshot = context.captureSnapshot();
 */
export class DebugContext extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }

    init() {
        // State providers
        this.providers = new Map();

        // Frame tracking
        this.currentFrame = 0;
        this.deltaTime = 0;
        this.lastFrameTime = performance.now();

        // Cached snapshot for current frame
        this.cachedSnapshot = null;
        this.cacheFrame = -1;

        // Statistics
        this.stats = {
            totalSnapshots: 0,
            cacheHits: 0,
            cacheMisses: 0,
            providerErrors: 0,
        };

        this.setInitialized();
    }

    /**
     * Register a state provider
     * @param {StateProvider} provider - State provider instance
     */
    registerProvider(provider) {
        const name = provider.getName();
        if (this.providers.has(name)) {
            LOG.warn('DEBUGCONTEXT_PROVIDER_REPLACED', {
                subsystem: 'observability',
                message: `Provider '${name}' already registered, replacing`,
                providerName: name,
            });
        }
        this.providers.set(name, provider);
    }

    /**
     * Unregister a state provider
     * @param {string} name - Provider name
     */
    unregisterProvider(name) {
        return this.providers.delete(name);
    }

    /**
     * Get a registered provider
     * @param {string} name - Provider name
     */
    getProvider(name) {
        return this.providers.get(name);
    }

    /**
     * Update frame information (call from game loop)
     * @param {number} frameNumber - Current frame number
     * @param {number} dt - Delta time in seconds
     */
    updateFrame(frameNumber, dt) {
        this.currentFrame = frameNumber;
        this.deltaTime = dt;
        this.lastFrameTime = performance.now();

        // Invalidate cache on new frame
        if (frameNumber !== this.cacheFrame) {
            this.cachedSnapshot = null;
            this.cacheFrame = -1;
        }
    }

    /**
     * Capture current state snapshot from all providers
     * @param {boolean} skipCache - Force fresh capture even if cached
     * @returns {Object} Context snapshot
     */
    captureSnapshot(skipCache = false) {
        // Use cached snapshot if available for this frame
        if (!skipCache && this.cacheFrame === this.currentFrame && this.cachedSnapshot) {
            this.stats.cacheHits++;
            return this.cachedSnapshot;
        }

        this.stats.cacheMisses++;
        this.stats.totalSnapshots++;

        const snapshot = {
            frame: this.currentFrame,
            deltaTime: this.deltaTime,
            timestamp: Date.now(),
            performance: {
                fps: this.deltaTime > 0 ? Math.round(1 / this.deltaTime) : 0,
                frameTime: this.deltaTime * 1000,
            },
        };

        // Capture state from all enabled providers
        for (const [name, provider] of this.providers) {
            if (!provider.isEnabled()) {
                continue;
            }

            try {
                const state = provider.capture();
                if (state !== null) {
                    snapshot[name] = state;
                }
            } catch (error) {
                LOG.error('DEBUGCONTEXT_PROVIDER_CAPTURE_ERROR', {
                    subsystem: 'observability',
                    message: `Error capturing ${name}`,
                    providerName: name,
                    error,
                    errorMessage: error.message,
                    stack: error.stack,
                });
                snapshot[name] = {
                    _error: error.message,
                    _errorStack: error.stack,
                };
                this.stats.providerErrors++;
            }
        }

        // Cache for this frame
        this.cachedSnapshot = snapshot;
        this.cacheFrame = this.currentFrame;

        return snapshot;
    }

    /**
     * Capture minimal snapshot (only specified providers)
     * @param {string[]} providerNames - Names of providers to capture
     * @returns {Object} Minimal snapshot
     */
    captureMinimal(providerNames) {
        const snapshot = {
            frame: this.currentFrame,
            timestamp: Date.now(),
        };

        for (const name of providerNames) {
            const provider = this.providers.get(name);
            if (provider && provider.isEnabled()) {
                try {
                    snapshot[name] = provider.capture();
                } catch (error) {
                    snapshot[name] = { _error: error.message };
                }
            }
        }

        return snapshot;
    }

    /**
     * Get statistics about context system
     */
    getStats() {
        const providerStats = {};
        for (const [name, provider] of this.providers) {
            providerStats[name] = provider.getStats();
        }

        return {
            ...this.stats,
            providers: providerStats,
            registeredProviders: this.providers.size,
            currentFrame: this.currentFrame,
            cacheEfficiency:
                this.stats.totalSnapshots > 0
                    ? ((this.stats.cacheHits / this.stats.totalSnapshots) * 100).toFixed(1) + '%'
                    : '0%',
        };
    }

    /**
     * Reset all statistics
     */
    resetStats() {
        this.stats = {
            totalSnapshots: 0,
            cacheHits: 0,
            cacheMisses: 0,
            providerErrors: 0,
        };

        for (const provider of this.providers.values()) {
            provider.reset();
        }
    }

    /**
     * Clear cached snapshot
     */
    clearCache() {
        this.cachedSnapshot = null;
        this.cacheFrame = -1;
    }

    /**
     * Enable all providers
     */
    enableAll() {
        for (const provider of this.providers.values()) {
            provider.enable();
        }
    }

    /**
     * Disable all providers
     */
    disableAll() {
        for (const provider of this.providers.values()) {
            provider.disable();
        }
    }

    /**
     * Get current frame number
     */
    getCurrentFrame() {
        return this.currentFrame;
    }

    /**
     * Get current delta time
     */
    getDeltaTime() {
        return this.deltaTime;
    }
}
