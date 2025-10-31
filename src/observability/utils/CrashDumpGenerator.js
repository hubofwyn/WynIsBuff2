import { LOG } from '../core/LogSystem.js';
import { DebugContext } from '../context/DebugContext.js';

/**
 * CrashDumpGenerator - Generates comprehensive crash dumps for fatal errors
 *
 * Captures complete game state including:
 * - Error details and stack trace
 * - Recent logs from LogSystem
 * - Game state from DebugContext
 * - Performance metrics
 * - Environment information
 *
 * Usage:
 *   const crashDump = CrashDumpGenerator.generate(error, {
 *       subsystem: 'physics',
 *       additionalInfo: 'Custom data'
 *   });
 *   LOG.fatal('SYSTEM_CRASH', { crashDump });
 */
export class CrashDumpGenerator {
    /**
     * Generate a comprehensive crash dump
     * @param {Error} error - The error that triggered the crash
     * @param {Object} additionalContext - Additional context to include
     * @returns {Object} Comprehensive crash dump
     */
    static generate(error, additionalContext = {}) {
        const timestamp = new Date().toISOString();

        try {
            const dump = {
                timestamp,
                version: '1.0.0',

                // Error information
                error: this.captureErrorDetails(error),

                // Recent logs (last 50 entries)
                logs: this.captureRecentLogs(50),

                // Game state from DebugContext
                gameState: this.captureGameState(),

                // Performance metrics
                performance: this.capturePerformanceMetrics(),

                // Environment information
                environment: this.captureEnvironment(),

                // Log system statistics
                logStats: this.captureLogStats(),

                // Additional context provided by caller
                additionalContext,
            };

            return dump;
        } catch (dumpError) {
            // If crash dump generation itself fails, return minimal dump
            return {
                timestamp,
                version: '1.0.0',
                error: {
                    message: error?.message || 'Unknown error',
                    stack: error?.stack || 'No stack trace',
                    dumpGenerationError: dumpError.message,
                },
                additionalContext,
            };
        }
    }

    /**
     * Capture detailed error information
     * @private
     */
    static captureErrorDetails(error) {
        if (!error) {
            return {
                message: 'No error object provided',
                stack: 'No stack trace available',
            };
        }

        return {
            message: error.message,
            stack: error.stack,
            name: error.name,
            type: error.constructor?.name || 'Error',
        };
    }

    /**
     * Capture recent logs from LogSystem
     * @private
     */
    static captureRecentLogs(count = 50) {
        try {
            const logSystem = LOG;
            return {
                recent: logSystem.getRecent(count),
                errors: logSystem.getByLevel('error', 20),
                warnings: logSystem.getByLevel('warn', 10),
                fatal: logSystem.getByLevel('fatal', 5),
            };
        } catch (err) {
            return {
                error: 'Failed to capture logs',
                message: err.message,
            };
        }
    }

    /**
     * Capture game state from DebugContext
     * @private
     */
    static captureGameState() {
        try {
            const debugContext = DebugContext.getInstance();
            return debugContext.captureSnapshot();
        } catch (err) {
            return {
                error: 'Failed to capture game state',
                message: err.message,
            };
        }
    }

    /**
     * Capture performance metrics
     * @private
     */
    static capturePerformanceMetrics() {
        try {
            const metrics = {};

            // Game loop metrics (if available via global)
            if (typeof window !== 'undefined' && window.game) {
                metrics.fps = window.game.loop?.actualFps || 0;
                metrics.targetFps = window.game.loop?.targetFps || 60;
                metrics.frame = window.game.loop?.frame || 0;
                metrics.time = window.game.loop?.time || 0;
            }

            // Memory metrics (if available)
            if (typeof performance !== 'undefined' && performance.memory) {
                metrics.memory = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                    usedPercentage: (
                        (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) *
                        100
                    ).toFixed(2),
                };
            }

            // Performance timing
            if (typeof performance !== 'undefined' && performance.timing) {
                metrics.loadTime =
                    performance.timing.loadEventEnd - performance.timing.navigationStart;
                metrics.domContentLoaded =
                    performance.timing.domContentLoadedEventEnd -
                    performance.timing.navigationStart;
            }

            return metrics;
        } catch (err) {
            return {
                error: 'Failed to capture performance metrics',
                message: err.message,
            };
        }
    }

    /**
     * Capture environment information
     * @private
     */
    static captureEnvironment() {
        try {
            const env = {};

            if (typeof navigator !== 'undefined') {
                env.userAgent = navigator.userAgent;
                env.platform = navigator.platform;
                env.language = navigator.language;
                env.onLine = navigator.onLine;
                env.cookieEnabled = navigator.cookieEnabled;
                env.hardwareConcurrency = navigator.hardwareConcurrency;
                env.maxTouchPoints = navigator.maxTouchPoints;
            }

            if (typeof window !== 'undefined') {
                env.windowSize = {
                    width: window.innerWidth,
                    height: window.innerHeight,
                };
                env.screenSize = {
                    width: window.screen?.width,
                    height: window.screen?.height,
                };
                env.devicePixelRatio = window.devicePixelRatio;
            }

            // Add node environment info if available
            if (typeof process !== 'undefined') {
                env.nodeVersion = process.version;
                env.platform = process.platform;
                env.arch = process.arch;
            }

            return env;
        } catch (err) {
            return {
                error: 'Failed to capture environment',
                message: err.message,
            };
        }
    }

    /**
     * Capture LogSystem statistics
     * @private
     */
    static captureLogStats() {
        try {
            const logSystem = LOG;
            return logSystem.getStats();
        } catch (err) {
            return {
                error: 'Failed to capture log stats',
                message: err.message,
            };
        }
    }

    /**
     * Generate a human-readable crash dump summary
     * @param {Object} crashDump - The crash dump to summarize
     * @returns {string} Human-readable summary
     */
    static generateSummary(crashDump) {
        const lines = [];
        lines.push('='.repeat(80));
        lines.push('CRASH DUMP SUMMARY');
        lines.push('='.repeat(80));
        lines.push(`Timestamp: ${crashDump.timestamp}`);
        lines.push(`Error: ${crashDump.error?.message || 'Unknown'}`);
        lines.push('');

        // Performance summary
        if (crashDump.performance) {
            lines.push('Performance:');
            lines.push(`  FPS: ${crashDump.performance.fps || 'N/A'}`);
            lines.push(`  Frame: ${crashDump.performance.frame || 'N/A'}`);
            if (crashDump.performance.memory) {
                lines.push(`  Memory: ${crashDump.performance.memory.usedPercentage}% used`);
            }
            lines.push('');
        }

        // Game state summary
        if (crashDump.gameState) {
            lines.push('Game State:');
            if (crashDump.gameState.player) {
                lines.push(
                    `  Player: pos=(${crashDump.gameState.player.position?.x},${crashDump.gameState.player.position?.y})`
                );
            }
            if (crashDump.gameState.physics) {
                lines.push(
                    `  Physics: ${crashDump.gameState.physics.bodyCount || 0} bodies, ${crashDump.gameState.physics.errorCount || 0} errors`
                );
            }
            lines.push('');
        }

        // Recent errors
        if (crashDump.logs?.errors) {
            lines.push(`Recent Errors (${crashDump.logs.errors.length}):`);
            crashDump.logs.errors.slice(0, 5).forEach((log) => {
                lines.push(`  - ${log.code}: ${log.message}`);
            });
            lines.push('');
        }

        lines.push('Full crash dump available in structured format');
        lines.push('='.repeat(80));

        return lines.join('\n');
    }
}
