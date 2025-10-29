/**
 * Base class for state providers
 *
 * State providers capture snapshot of subsystem state for debugging and logging.
 * Each subsystem (Player, Physics, Input, etc.) should implement a provider.
 *
 * Usage:
 *   class PlayerStateProvider extends StateProvider {
 *       getName() { return 'player'; }
 *       getState() {
 *           return {
 *               position: this.player.getPosition(),
 *               velocity: this.player.getVelocity(),
 *               isGrounded: this.player.isGrounded()
 *           };
 *       }
 *   }
 */
export class StateProvider {
    /**
     * @param {Object} target - Target object to capture state from
     */
    constructor(target) {
        this.target = target;
        this.enabled = true;
        this.lastCapture = null;
        this.captureCount = 0;
    }

    /**
     * Get provider name (must be implemented by subclass)
     * @returns {string} Provider name
     */
    getName() {
        throw new Error('StateProvider.getName() must be implemented by subclass');
    }

    /**
     * Get current state snapshot (must be implemented by subclass)
     * @returns {Object} State snapshot
     */
    getState() {
        throw new Error('StateProvider.getState() must be implemented by subclass');
    }

    /**
     * Capture state snapshot with error handling
     * @returns {Object|null} State snapshot or null if error
     */
    capture() {
        if (!this.enabled) {
            return null;
        }

        try {
            const state = this.getState();
            this.lastCapture = {
                timestamp: Date.now(),
                state
            };
            this.captureCount++;
            return state;
        } catch (error) {
            console.error(`[StateProvider] Error capturing ${this.getName()}:`, error);
            return {
                _error: error.message,
                _errorStack: error.stack
            };
        }
    }

    /**
     * Enable state capture
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable state capture
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Check if provider is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Get statistics about this provider
     */
    getStats() {
        return {
            name: this.getName(),
            enabled: this.enabled,
            captureCount: this.captureCount,
            lastCaptureTime: this.lastCapture?.timestamp || null
        };
    }

    /**
     * Reset statistics
     */
    reset() {
        this.captureCount = 0;
        this.lastCapture = null;
    }
}
