import { BaseManager } from './BaseManager.js';

/**
 * Logger levels
 */
export const LogLevel = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
};

/**
 * Logger configuration
 */
const DEFAULT_CONFIG = {
    level: LogLevel.INFO,
    enableTimestamp: true,
    enableColors: true,
    moduleFilter: null, // null means log all modules
    logToConsole: true,
    logHistory: [],
    maxHistorySize: 1000
};

/**
 * ANSI color codes for terminal output
 */
const Colors = {
    Reset: '\x1b[0m',
    Red: '\x1b[31m',
    Yellow: '\x1b[33m',
    Blue: '\x1b[34m',
    Cyan: '\x1b[36m',
    Gray: '\x1b[90m',
    Green: '\x1b[32m',
    Magenta: '\x1b[35m'
};

/**
 * Logger class - Centralized logging system
 * 
 * Features:
 * - Multiple log levels (ERROR, WARN, INFO, DEBUG, TRACE)
 * - Module-based filtering
 * - Colored console output
 * - Log history for debugging
 * - Production-ready (can be disabled)
 */
export class Logger extends BaseManager {
    constructor() {
        super();
        
        if (this.isInitialized()) {
            return Logger.getInstance();
        }
        
        this.config = { ...DEFAULT_CONFIG };
        this.modules = new Map();
        
        // Set log level based on environment
        if (typeof process !== 'undefined' && process.env) {
            if (process.env.NODE_ENV === 'production') {
                this.config.level = LogLevel.WARN;
            } else if (process.env.DEBUG) {
                this.config.level = LogLevel.DEBUG;
            }
        }
        
        // Disable colors in CI environments
        if (typeof process !== 'undefined' && process.env && process.env.CI === 'true') {
            this.config.enableColors = false;
        }
        
        this._initialized = true;
    }
    
    /**
     * Get logger instance for a specific module
     * @param {string} moduleName - Name of the module
     * @returns {ModuleLogger}
     */
    getModule(moduleName) {
        if (!this.modules.has(moduleName)) {
            this.modules.set(moduleName, new ModuleLogger(moduleName, this));
        }
        return this.modules.get(moduleName);
    }
    
    /**
     * Set global log level
     * @param {number} level - LogLevel value
     */
    setLevel(level) {
        this.config.level = level;
    }
    
    /**
     * Enable/disable console logging
     * @param {boolean} enabled
     */
    setConsoleEnabled(enabled) {
        this.config.logToConsole = enabled;
    }
    
    /**
     * Set module filter (only log specific modules)
     * @param {string[]|null} modules - Array of module names or null for all
     */
    setModuleFilter(modules) {
        this.config.moduleFilter = modules;
    }
    
    /**
     * Get log history
     * @returns {Array}
     */
    getHistory() {
        return [...this.config.logHistory];
    }
    
    /**
     * Clear log history
     */
    clearHistory() {
        this.config.logHistory = [];
    }
    
    /**
     * Internal log method
     * @private
     */
    _log(level, moduleName, message, ...args) {
        // Check if we should log this level
        if (level > this.config.level) return;
        
        // Check module filter
        if (this.config.moduleFilter && !this.config.moduleFilter.includes(moduleName)) {
            return;
        }
        
        // Create log entry
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            module: moduleName,
            message,
            args
        };
        
        // Add to history
        this.config.logHistory.push(logEntry);
        if (this.config.logHistory.length > this.config.maxHistorySize) {
            this.config.logHistory.shift();
        }
        
        // Log to console if enabled
        if (this.config.logToConsole) {
            this._logToConsole(level, moduleName, message, args, timestamp);
        }
    }
    
    /**
     * Log to console with formatting
     * @private
     */
    _logToConsole(level, moduleName, message, args, timestamp) {
        const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
        const levelName = levelNames[level];
        
        let prefix = '';
        let color = '';
        let resetColor = '';
        
        if (this.config.enableColors) {
            resetColor = Colors.Reset;
            switch (level) {
                case LogLevel.ERROR:
                    color = Colors.Red;
                    break;
                case LogLevel.WARN:
                    color = Colors.Yellow;
                    break;
                case LogLevel.INFO:
                    color = Colors.Blue;
                    break;
                case LogLevel.DEBUG:
                    color = Colors.Cyan;
                    break;
                case LogLevel.TRACE:
                    color = Colors.Gray;
                    break;
            }
        }
        
        if (this.config.enableTimestamp) {
            prefix += `${Colors.Gray}${timestamp.split('T')[1].split('.')[0]}${resetColor} `;
        }
        
        prefix += `${color}[${levelName}]${resetColor} `;
        prefix += `${Colors.Magenta}[${moduleName}]${resetColor} `;
        
        // Use appropriate console method
        const consoleMethod = level === LogLevel.ERROR ? 'error' : 
                            level === LogLevel.WARN ? 'warn' : 
                            'log';
        
        console[consoleMethod](prefix + message, ...args);
    }
}

/**
 * Module-specific logger
 */
class ModuleLogger {
    constructor(moduleName, logger) {
        this.moduleName = moduleName;
        this.logger = logger;
    }
    
    error(message, ...args) {
        this.logger._log(LogLevel.ERROR, this.moduleName, message, ...args);
    }
    
    warn(message, ...args) {
        this.logger._log(LogLevel.WARN, this.moduleName, message, ...args);
    }
    
    info(message, ...args) {
        this.logger._log(LogLevel.INFO, this.moduleName, message, ...args);
    }
    
    debug(message, ...args) {
        this.logger._log(LogLevel.DEBUG, this.moduleName, message, ...args);
    }
    
    trace(message, ...args) {
        this.logger._log(LogLevel.TRACE, this.moduleName, message, ...args);
    }
    
    // Convenience method for backward compatibility
    log(message, ...args) {
        this.info(message, ...args);
    }
}

// Create and export a default logger instance
const logger = Logger.getInstance();

// Export convenience function
export function getLogger(moduleName) {
    return logger.getModule(moduleName);
}