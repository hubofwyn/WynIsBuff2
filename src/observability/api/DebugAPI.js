/**
 * DebugAPI - Agent-Friendly Debugging Interface
 *
 * High-level API for AI agents and developers to query, analyze,
 * and export observability data.
 *
 * @example
 * const api = new DebugAPI(LOG, debugContext, errorPatternDetector);
 * const results = api.query({ subsystem: 'physics', level: 'error' });
 */

export class DebugAPI {
    /**
     * Create DebugAPI instance
     * @param {LogSystem} logSystem - LogSystem instance
     * @param {DebugContext} debugContext - DebugContext instance
     * @param {ErrorPatternDetector} patternDetector - ErrorPatternDetector instance
     */
    constructor(logSystem, debugContext, patternDetector) {
        this.logSystem = logSystem;
        this.debugContext = debugContext;
        this.patternDetector = patternDetector;
    }

    /**
     * Advanced query with multiple filters
     * @param {Object} filters - Query filters
     * @param {string} [filters.level] - Log level ('dev', 'info', 'warn', 'error', 'fatal')
     * @param {string} [filters.subsystem] - Subsystem name
     * @param {string} [filters.code] - Error code
     * @param {Object} [filters.timeRange] - Time range filter
     * @param {number} [filters.timeRange.last] - Last N milliseconds
     * @param {number} [filters.timeRange.start] - Start timestamp
     * @param {number} [filters.timeRange.end] - End timestamp
     * @param {boolean} [filters.includeContext] - Include full context in results
     * @param {number} [filters.limit] - Maximum results
     * @returns {Array} Filtered log entries
     */
    query(filters = {}) {
        const { level, subsystem, code, timeRange, includeContext = false, limit = 100 } = filters;

        // Start with all logs
        let results = this.logSystem.buffer.getAll();

        // Apply filters
        if (level) {
            results = results.filter((log) => log.level === level);
        }

        if (subsystem) {
            results = results.filter((log) => log.subsystem === subsystem);
        }

        if (code) {
            results = results.filter((log) => log.code === code);
        }

        if (timeRange) {
            const now = Date.now();
            let startTime, endTime;

            if (timeRange.last) {
                startTime = now - timeRange.last;
                endTime = now;
            } else {
                startTime = timeRange.start || 0;
                endTime = timeRange.end || now;
            }

            results = results.filter((log) => {
                const logTime = new Date(log.timestamp).getTime();
                return logTime >= startTime && logTime <= endTime;
            });
        }

        // Apply limit
        results = results.slice(-limit);

        // Optionally include full context
        if (!includeContext) {
            results = results.map((log) => ({
                ...log,
                context: log.context ? { frame: log.context.frame } : null,
            }));
        }

        return results;
    }

    /**
     * Get logs from last N milliseconds
     * @param {number} milliseconds - Time window in milliseconds
     * @param {Object} options - Additional options
     * @returns {Array} Recent logs
     */
    getRecentLogs(milliseconds, options = {}) {
        return this.query({
            timeRange: { last: milliseconds },
            ...options,
        });
    }

    /**
     * Get logs in specific time range
     * @param {number} startTime - Start timestamp
     * @param {number} endTime - End timestamp
     * @param {Object} options - Additional options
     * @returns {Array} Logs in range
     */
    getLogsInTimeRange(startTime, endTime, options = {}) {
        return this.query({
            timeRange: { start: startTime, end: endTime },
            ...options,
        });
    }

    /**
     * Find logs related to a given log
     * @param {Object} log - Source log entry
     * @param {Object} options - Relation options
     * @param {boolean} [options.sameFrame] - Include logs from same frame
     * @param {boolean} [options.sameSubsystem] - Include logs from same subsystem
     * @param {number} [options.timeWindow] - Time window around log (ms)
     * @returns {Array} Related logs
     */
    getRelatedLogs(log, options = {}) {
        const { sameFrame = true, sameSubsystem = true, timeWindow = 1000 } = options;

        const logTime = new Date(log.timestamp).getTime();
        const allLogs = this.logSystem.buffer.getAll();

        return allLogs.filter((other) => {
            if (other.timestamp === log.timestamp) return false; // Skip self

            // Check frame match
            if (sameFrame && log.context && other.context) {
                if (log.context.frame === other.context.frame) {
                    return true;
                }
            }

            // Check subsystem match
            if (sameSubsystem && log.subsystem === other.subsystem) {
                const otherTime = new Date(other.timestamp).getTime();
                if (Math.abs(otherTime - logTime) <= timeWindow) {
                    return true;
                }
            }

            return false;
        });
    }

    /**
     * Analyze specific subsystem health
     * @param {string} subsystem - Subsystem name
     * @param {number} [timeWindow=60000] - Time window to analyze (ms)
     * @returns {Object} Subsystem analysis
     */
    analyzeSubsystem(subsystem, timeWindow = 60000) {
        const logs = this.getRecentLogs(timeWindow, { subsystem });

        const errorCount = logs.filter(
            (log) => log.level === 'error' || log.level === 'fatal'
        ).length;
        const warnCount = logs.filter((log) => log.level === 'warn').length;
        const totalLogs = logs.length;

        // Calculate health score (0-100)
        const errorRate = totalLogs > 0 ? errorCount / totalLogs : 0;
        const warnRate = totalLogs > 0 ? warnCount / totalLogs : 0;
        const health = Math.max(0, 100 - errorRate * 100 - warnRate * 25);

        // Get error patterns
        const patterns = this.patternDetector
            ? this.patternDetector.analyzeRecent(timeWindow)
            : { repeatingErrors: [], cascades: [] };

        // Get recent issues
        const recentIssues = logs
            .filter((log) => log.level === 'error' || log.level === 'fatal')
            .slice(-5)
            .map((log) => ({
                code: log.code,
                message: log.message,
                timestamp: log.timestamp,
            }));

        return {
            subsystem,
            timeWindow,
            health: Math.round(health),
            stats: {
                totalLogs,
                errorCount,
                warnCount,
                errorRate: (errorRate * 100).toFixed(2) + '%',
            },
            patterns: {
                repeating: patterns.repeatingErrors.length,
                cascades: patterns.cascades.length,
            },
            recentIssues,
            status:
                health >= 90
                    ? 'healthy'
                    : health >= 70
                      ? 'degraded'
                      : health >= 50
                        ? 'unhealthy'
                        : 'critical',
        };
    }

    /**
     * Analyze all activity in time window
     * @param {number} timeWindow - Time window in milliseconds
     * @returns {Object} Time window analysis
     */
    analyzeTimeWindow(timeWindow = 60000) {
        const logs = this.getRecentLogs(timeWindow);

        // Group by subsystem
        const bySubsystem = {};
        logs.forEach((log) => {
            if (!bySubsystem[log.subsystem]) {
                bySubsystem[log.subsystem] = { total: 0, errors: 0, warns: 0 };
            }
            bySubsystem[log.subsystem].total++;
            if (log.level === 'error' || log.level === 'fatal') {
                bySubsystem[log.subsystem].errors++;
            }
            if (log.level === 'warn') {
                bySubsystem[log.subsystem].warns++;
            }
        });

        // Group by level
        const byLevel = {
            dev: 0,
            info: 0,
            warn: 0,
            error: 0,
            fatal: 0,
        };
        logs.forEach((log) => {
            byLevel[log.level]++;
        });

        // Get patterns
        const patterns = this.patternDetector
            ? this.patternDetector.analyzeRecent(timeWindow)
            : null;

        return {
            timeWindow,
            totalLogs: logs.length,
            byLevel,
            bySubsystem,
            patterns: patterns
                ? {
                      repeating: patterns.repeatingErrors,
                      cascades: patterns.cascades,
                      severity: patterns.severity,
                  }
                : null,
        };
    }

    /**
     * Get system health summary
     * @returns {Object} Overall system health
     */
    getSummary() {
        const recentLogs = this.getRecentLogs(60000);
        const stats = this.logSystem.getStats();

        // Calculate overall health
        const errorCount = recentLogs.filter(
            (log) => log.level === 'error' || log.level === 'fatal'
        ).length;
        const totalRecent = recentLogs.length;
        const errorRate = totalRecent > 0 ? errorCount / totalRecent : 0;
        const overallHealth = Math.max(0, 100 - errorRate * 100);

        // Get subsystem breakdown
        const subsystems = {};
        recentLogs.forEach((log) => {
            if (!subsystems[log.subsystem]) {
                subsystems[log.subsystem] = 0;
            }
            if (log.level === 'error' || log.level === 'fatal') {
                subsystems[log.subsystem]++;
            }
        });

        // Get top error codes
        const errorCodes = {};
        recentLogs
            .filter((log) => log.level === 'error' || log.level === 'fatal')
            .forEach((log) => {
                errorCodes[log.code] = (errorCodes[log.code] || 0) + 1;
            });

        const topErrors = Object.entries(errorCodes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([code, count]) => ({ code, count }));

        return {
            overallHealth: Math.round(overallHealth),
            status:
                overallHealth >= 90
                    ? 'healthy'
                    : overallHealth >= 70
                      ? 'degraded'
                      : overallHealth >= 50
                        ? 'unhealthy'
                        : 'critical',
            stats: {
                totalLogs: stats.totalLogs,
                recentErrors: errorCount,
                bufferUsage: stats.buffer.usage,
                droppedLogs: stats.droppedLogs,
            },
            subsystemErrors: subsystems,
            topErrors,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Export logs with rich metadata for analysis
     * @param {Object} options - Export options
     * @param {string} [options.format='json'] - Export format ('json', 'minimal')
     * @param {boolean} [options.includePatterns=true] - Include error patterns
     * @param {boolean} [options.includeGameState=true] - Include game state
     * @param {boolean} [options.includeStats=true] - Include statistics
     * @param {Object} [options.filters] - Query filters (same as query())
     * @returns {Object} Export data
     */
    exportForAnalysis(options = {}) {
        const {
            format = 'json',
            includePatterns = true,
            includeGameState = true,
            includeStats = true,
            filters = {},
        } = options;

        // Get logs (filtered or all)
        const logs =
            Object.keys(filters).length > 0 ? this.query(filters) : this.logSystem.buffer.getAll();

        const exportData = {
            metadata: {
                exportTime: new Date().toISOString(),
                logCount: logs.length,
                bufferSize: this.logSystem.buffer.size,
                format,
                version: '1.0.0',
            },
            logs,
        };

        // Add patterns
        if (includePatterns && this.patternDetector) {
            exportData.patterns = this.patternDetector.analyzeRecent(60000);
        }

        // Add game state
        if (includeGameState && this.debugContext) {
            try {
                exportData.gameState = this.debugContext.captureState();
            } catch (_error) {
                exportData.gameState = { error: 'Failed to capture state' };
            }
        }

        // Add statistics
        if (includeStats) {
            exportData.stats = this.logSystem.getStats();
            exportData.summary = this.getSummary();
        }

        return exportData;
    }

    /**
     * Get suggestions for error code
     * @param {string} errorCode - Error code
     * @returns {Array} Suggestions
     */
    getSuggestions(_errorCode) {
        // Suggestions will be populated by ErrorSuggestions module
        // For now, return generic message
        return [
            'Check the error message and context for specific details',
            'Review recent logs for related errors',
            'Consult ERROR_HANDLING_LOGGING.md documentation',
        ];
    }
}
