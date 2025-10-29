/**
 * Log level constants for structured logging system
 *
 * Priority order (highest to lowest):
 * FATAL > ERROR > WARN > INFO > DEV
 */

export const LogLevel = {
    FATAL: 'fatal',  // System-critical errors requiring immediate attention
    ERROR: 'error',  // Errors that affect functionality but don't crash the system
    WARN: 'warn',    // Warning conditions that should be investigated
    INFO: 'info',    // Informational messages about system state
    DEV: 'dev'       // Development/debug information (high volume)
};

export const LogLevelPriority = {
    [LogLevel.FATAL]: 5,
    [LogLevel.ERROR]: 4,
    [LogLevel.WARN]: 3,
    [LogLevel.INFO]: 2,
    [LogLevel.DEV]: 1
};

/**
 * Default sampling rates by log level
 * - FATAL/ERROR: Always log (100%)
 * - WARN: 50% sampling
 * - INFO: 10% sampling
 * - DEV: 1% sampling (development only)
 */
export const DefaultSamplingRates = {
    [LogLevel.FATAL]: 1.0,
    [LogLevel.ERROR]: 1.0,
    [LogLevel.WARN]: 0.5,
    [LogLevel.INFO]: 0.1,
    [LogLevel.DEV]: 0.01
};

/**
 * Check if a log level should be captured based on current filter level
 */
export function shouldLog(level, filterLevel) {
    const levelPriority = LogLevelPriority[level] || 0;
    const filterPriority = LogLevelPriority[filterLevel] || 0;
    return levelPriority >= filterPriority;
}

/**
 * Get log level from string, with validation
 */
export function parseLogLevel(levelStr) {
    const normalized = levelStr?.toLowerCase();
    return Object.values(LogLevel).includes(normalized) ? normalized : LogLevel.INFO;
}
