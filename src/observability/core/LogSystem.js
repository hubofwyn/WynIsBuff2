import { BaseManager } from '../../core/BaseManager.js';

import { BoundedBuffer } from './BoundedBuffer.js';
import { LogLevel, DefaultSamplingRates, shouldLog } from './LogLevel.js';

/**
 * LogSystem V2 - Agent-ready structured logging system
 *
 * Features:
 * - Structured JSON logging with error codes
 * - Automatic context injection (when DebugContext available)
 * - Frame throttling to prevent log storms
 * - Intelligent sampling by log level
 * - Bounded buffer prevents memory leaks
 * - Backward compatible console wrapper
 *
 * Usage:
 *   const LOG = LogSystem.getInstance();
 *   LOG.dev('PLAYER_JUMP', { height: 100 });
 *   LOG.error('PHYSICS_ERROR', { error: e, hint: 'Check body init' });
 */
export class LogSystem extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }

    init() {
        // Core components
        this.buffer = new BoundedBuffer(2000);
        this.levels = LogLevel;

        // Configuration
        this.config = {
            minLevel: LogLevel.DEV,
            consoleEnabled: true,
            samplingRates: { ...DefaultSamplingRates },
            frameThrottleMax: 50,
        };

        // Frame throttling state
        this.currentFrame = 0;
        this.frameLogCount = 0;

        // Context (will be set by DebugContext when available)
        this.contextProvider = null;

        // Performance tracking
        this.stats = {
            totalLogs: 0,
            droppedLogs: 0,
            throttledLogs: 0,
            sampledOutLogs: 0,
            logsByLevel: {
                [LogLevel.DEV]: 0,
                [LogLevel.INFO]: 0,
                [LogLevel.WARN]: 0,
                [LogLevel.ERROR]: 0,
                [LogLevel.FATAL]: 0,
            },
        };

        this.setInitialized();
    }

    /**
     * Set context provider for automatic context injection
     * @param {Object} provider - Object with captureSnapshot() method
     */
    setContextProvider(provider) {
        this.contextProvider = provider;
    }

    /**
     * Update frame counter (call from game loop)
     * @param {number} frameNumber - Current frame number
     */
    setFrame(frameNumber) {
        if (frameNumber !== this.currentFrame) {
            this.currentFrame = frameNumber;
            this.frameLogCount = 0;
        }
    }

    /**
     * Update configuration at runtime
     * @param {Object} updates - Configuration updates
     */
    configure(updates) {
        this.config = { ...this.config, ...updates };
    }

    /**
     * Main logging method - used by all public log methods
     * @private
     */
    _log(level, code, data = {}) {
        const startTime = performance.now();

        // Check if level should be logged
        if (!shouldLog(level, this.config.minLevel)) {
            return;
        }

        // Frame throttling
        if (this.frameLogCount >= this.config.frameThrottleMax) {
            this.stats.throttledLogs++;
            return;
        }

        // Sampling (always log errors and fatal)
        if (level !== LogLevel.ERROR && level !== LogLevel.FATAL) {
            const samplingRate = this.config.samplingRates[level];
            if (Math.random() > samplingRate) {
                this.stats.sampledOutLogs++;
                return;
            }
        }

        // Build log entry
        const entry = {
            level,
            code,
            timestamp: new Date().toISOString(),
            frame: this.currentFrame,
            message: data.message || code,
            subsystem: data.subsystem || 'unknown',
            ...data,
        };

        // Inject context if available
        if (this.contextProvider) {
            try {
                entry.context = this.contextProvider.captureSnapshot();
            } catch (e) {
                entry._contextError = e.message;
            }
        }

        // Add to buffer
        this.buffer.add(entry);

        // Update stats
        this.stats.totalLogs++;
        this.stats.logsByLevel[level]++;
        this.frameLogCount++;

        // Console output (if enabled)
        if (this.config.consoleEnabled) {
            this._outputToConsole(level, entry);
        }

        // Performance tracking
        const duration = performance.now() - startTime;
        if (duration > 1.0) {
            // eslint-disable-next-line no-console
            console.warn(`[LogSystem] Slow log operation: ${duration.toFixed(2)}ms`);
        }
    }

    /**
     * Output to console with appropriate styling
     * @private
     */
    _outputToConsole(level, entry) {
        const prefix = `[${level.toUpperCase()}] ${entry.code}`;
        const message = entry.message;
        const data = { ...entry };
        delete data.level;
        delete data.code;
        delete data.message;
        delete data.timestamp;

        /* eslint-disable no-console */
        switch (level) {
            case LogLevel.FATAL:
            case LogLevel.ERROR:
                console.error(prefix, message, data);
                break;
            case LogLevel.WARN:
                console.warn(prefix, message, data);
                break;
            case LogLevel.INFO:
                console.info(prefix, message, data);
                break;
            case LogLevel.DEV:
                console.log(prefix, message, data);
                break;
            default:
                console.log(prefix, message, data);
        }
        /* eslint-enable no-console */
    }

    /**
     * Development/debug logs (high volume, low sampling)
     * @param {string} code - Error code (e.g., 'PLAYER_JUMP')
     * @param {Object} data - Structured data
     */
    dev(code, data = {}) {
        this._log(LogLevel.DEV, code, data);
    }

    /**
     * Informational logs
     * @param {string} code - Error code
     * @param {Object} data - Structured data
     */
    info(code, data = {}) {
        this._log(LogLevel.INFO, code, data);
    }

    /**
     * Warning logs
     * @param {string} code - Error code
     * @param {Object} data - Structured data
     */
    warn(code, data = {}) {
        this._log(LogLevel.WARN, code, data);
    }

    /**
     * Error logs (always captured, never sampled)
     * @param {string} code - Error code
     * @param {Object} data - Structured data with error, hint, etc.
     */
    error(code, data = {}) {
        // Ensure stack trace is captured
        if (data.error && data.error instanceof Error) {
            data.stack = data.error.stack;
            data.errorMessage = data.error.message;
        }
        this._log(LogLevel.ERROR, code, data);
    }

    /**
     * Fatal errors (system-critical, always captured)
     * @param {string} code - Error code
     * @param {Object} data - Structured data including crash dump
     */
    fatal(code, data = {}) {
        // Ensure crash dump is included
        if (data.error && data.error instanceof Error) {
            data.stack = data.error.stack;
            data.errorMessage = data.error.message;
        }
        this._log(LogLevel.FATAL, code, data);
    }

    /**
     * Get recent log entries
     * @param {number} count - Number of entries
     * @returns {Array} Recent log entries
     */
    getRecent(count = 10) {
        return this.buffer.getLast(count);
    }

    /**
     * Get logs by level
     * @param {string} level - Log level
     * @param {number} count - Number of entries
     */
    getByLevel(level, count = 10) {
        return this.buffer.getByLevel(level, count);
    }

    /**
     * Get logs by error code
     * @param {string} code - Error code
     * @param {number} count - Number of entries
     */
    getByCode(code, count = 10) {
        return this.buffer.getByCode(code, count);
    }

    /**
     * Export all logs (for agent consumption)
     * @returns {Object} Complete log export with metadata
     */
    export() {
        return {
            metadata: {
                exportTime: new Date().toISOString(),
                totalLogs: this.stats.totalLogs,
                bufferSize: this.buffer.getUsage(),
                stats: this.stats,
            },
            logs: this.buffer.getAll(),
            config: this.config,
        };
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            buffer: this.buffer.getStats(),
        };
    }

    /**
     * Clear all logs (use with caution)
     */
    clear() {
        this.buffer.clear();
        this.stats = {
            totalLogs: 0,
            droppedLogs: 0,
            throttledLogs: 0,
            sampledOutLogs: 0,
            logsByLevel: {
                [LogLevel.DEV]: 0,
                [LogLevel.INFO]: 0,
                [LogLevel.WARN]: 0,
                [LogLevel.ERROR]: 0,
                [LogLevel.FATAL]: 0,
            },
        };
    }

    /**
     * LEGACY SUPPORT: Console wrapper for backward compatibility
     * Allows existing console.log/warn/error to work during migration
     */
    static wrapConsole() {
        const LOG = LogSystem.getInstance();
        /* eslint-disable no-console */
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
        };

        console.log = (...args) => {
            LOG.dev('CONSOLE_LOG', { message: args[0], args: args.slice(1) });
            originalConsole.log(...args);
        };

        console.warn = (...args) => {
            LOG.warn('CONSOLE_WARN', { message: args[0], args: args.slice(1) });
            originalConsole.warn(...args);
        };

        console.error = (...args) => {
            LOG.error('CONSOLE_ERROR', { message: args[0], args: args.slice(1) });
            originalConsole.error(...args);
        };

        console.info = (...args) => {
            LOG.info('CONSOLE_INFO', { message: args[0], args: args.slice(1) });
            originalConsole.info(...args);
        };
        /* eslint-enable no-console */

        return originalConsole;
    }
}

// Convenience export for common usage
export const LOG = LogSystem.getInstance();
