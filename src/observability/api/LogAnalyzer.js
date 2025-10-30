/**
 * LogAnalyzer - Advanced Log Analysis and Statistics
 *
 * Provides statistical analysis, correlation detection, and health metrics
 * for observability data.
 *
 * @example
 * const analyzer = new LogAnalyzer();
 * const stats = analyzer.getStatistics(logs);
 * const health = analyzer.getSubsystemHealth('physics', logs);
 */

export class LogAnalyzer {
    constructor() {
        // Can be extended with configuration options
    }

    /**
     * Get comprehensive statistics for logs
     * @param {Array} logs - Log entries to analyze
     * @returns {Object} Statistics
     */
    getStatistics(logs) {
        if (!logs || logs.length === 0) {
            return {
                total: 0,
                byLevel: {},
                bySubsystem: {},
                byCode: {},
                timeRange: null
            };
        }

        // Count by level
        const byLevel = {
            dev: 0,
            info: 0,
            warn: 0,
            error: 0,
            fatal: 0
        };

        // Count by subsystem
        const bySubsystem = {};

        // Count by error code
        const byCode = {};

        // Track time range
        let minTime = Infinity;
        let maxTime = -Infinity;

        logs.forEach(log => {
            // Level
            if (byLevel[log.level] !== undefined) {
                byLevel[log.level]++;
            }

            // Subsystem
            if (log.subsystem) {
                bySubsystem[log.subsystem] = (bySubsystem[log.subsystem] || 0) + 1;
            }

            // Code
            if (log.code) {
                byCode[log.code] = (byCode[log.code] || 0) + 1;
            }

            // Time range
            const logTime = new Date(log.timestamp).getTime();
            minTime = Math.min(minTime, logTime);
            maxTime = Math.max(maxTime, logTime);
        });

        // Sort subsystems and codes by frequency
        const topSubsystems = Object.entries(bySubsystem)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([subsystem, count]) => ({ subsystem, count }));

        const topCodes = Object.entries(byCode)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([code, count]) => ({ code, count }));

        return {
            total: logs.length,
            byLevel,
            bySubsystem,
            byCode,
            topSubsystems,
            topCodes,
            timeRange: minTime !== Infinity ? {
                start: new Date(minTime).toISOString(),
                end: new Date(maxTime).toISOString(),
                duration: maxTime - minTime
            } : null
        };
    }

    /**
     * Find causal relationships between errors
     * @param {Array} logs - Log entries to analyze
     * @returns {Array} Potential causal relationships
     */
    findCausalRelationships(logs) {
        if (!logs || logs.length === 0) {
            return [];
        }

        const relationships = [];
        const errors = logs.filter(log => log.level === 'error' || log.level === 'fatal');

        // Look for errors that happen in sequence within same subsystem
        for (let i = 0; i < errors.length - 1; i++) {
            const current = errors[i];
            const next = errors[i + 1];

            const currentTime = new Date(current.timestamp).getTime();
            const nextTime = new Date(next.timestamp).getTime();
            const timeDiff = nextTime - currentTime;

            // If errors are within 100ms and same subsystem, likely related
            if (timeDiff < 100 && current.subsystem === next.subsystem) {
                relationships.push({
                    cause: {
                        code: current.code,
                        subsystem: current.subsystem,
                        timestamp: current.timestamp
                    },
                    effect: {
                        code: next.code,
                        subsystem: next.subsystem,
                        timestamp: next.timestamp
                    },
                    timeDiff
                });
            }
        }

        return relationships;
    }

    /**
     * Calculate health score for subsystem
     * @param {string} subsystem - Subsystem name
     * @param {Array} logs - Log entries to analyze
     * @param {number} [timeWindow=60000] - Time window for analysis (ms)
     * @returns {Object} Health metrics
     */
    getSubsystemHealth(subsystem, logs, timeWindow = 60000) {
        const now = Date.now();
        const cutoff = now - timeWindow;

        // Filter to subsystem and time window
        const subsystemLogs = logs.filter(log => {
            if (log.subsystem !== subsystem) return false;
            const logTime = new Date(log.timestamp).getTime();
            return logTime >= cutoff;
        });

        if (subsystemLogs.length === 0) {
            return {
                subsystem,
                health: 100,
                status: 'healthy',
                errorCount: 0,
                warnCount: 0,
                totalLogs: 0,
                errorRate: 0,
                trend: 'stable'
            };
        }

        const errorCount = subsystemLogs.filter(log => log.level === 'error' || log.level === 'fatal').length;
        const warnCount = subsystemLogs.filter(log => log.level === 'warn').length;
        const totalLogs = subsystemLogs.length;

        // Calculate health score (0-100)
        const errorRate = errorCount / totalLogs;
        const warnRate = warnCount / totalLogs;
        const health = Math.max(0, 100 - (errorRate * 100) - (warnRate * 25));

        // Determine status
        let status;
        if (health >= 90) status = 'healthy';
        else if (health >= 70) status = 'degraded';
        else if (health >= 50) status = 'unhealthy';
        else status = 'critical';

        // Simple trend analysis (compare first half to second half)
        const midpoint = Math.floor(subsystemLogs.length / 2);
        const firstHalf = subsystemLogs.slice(0, midpoint);
        const secondHalf = subsystemLogs.slice(midpoint);

        const firstHalfErrors = firstHalf.filter(log => log.level === 'error' || log.level === 'fatal').length;
        const secondHalfErrors = secondHalf.filter(log => log.level === 'error' || log.level === 'fatal').length;

        let trend;
        if (secondHalfErrors < firstHalfErrors) trend = 'improving';
        else if (secondHalfErrors > firstHalfErrors) trend = 'degrading';
        else trend = 'stable';

        return {
            subsystem,
            health: Math.round(health),
            status,
            errorCount,
            warnCount,
            totalLogs,
            errorRate: (errorRate * 100).toFixed(2) + '%',
            trend,
            timeWindow
        };
    }

    /**
     * Analyze trends over time
     * @param {Array} logs - Log entries to analyze
     * @param {number} [bucketSize=60000] - Time bucket size in ms
     * @returns {Object} Trend analysis
     */
    getTrends(logs, bucketSize = 60000) {
        if (!logs || logs.length === 0) {
            return {
                buckets: [],
                trend: 'unknown'
            };
        }

        // Create time buckets
        const minTime = Math.min(...logs.map(log => new Date(log.timestamp).getTime()));
        const maxTime = Math.max(...logs.map(log => new Date(log.timestamp).getTime()));
        const numBuckets = Math.ceil((maxTime - minTime) / bucketSize);

        const buckets = [];
        for (let i = 0; i < numBuckets; i++) {
            const bucketStart = minTime + (i * bucketSize);
            const bucketEnd = bucketStart + bucketSize;

            const bucketLogs = logs.filter(log => {
                const logTime = new Date(log.timestamp).getTime();
                return logTime >= bucketStart && logTime < bucketEnd;
            });

            const errors = bucketLogs.filter(log => log.level === 'error' || log.level === 'fatal').length;
            const warns = bucketLogs.filter(log => log.level === 'warn').length;

            buckets.push({
                start: new Date(bucketStart).toISOString(),
                end: new Date(bucketEnd).toISOString(),
                total: bucketLogs.length,
                errors,
                warns,
                errorRate: bucketLogs.length > 0 ? (errors / bucketLogs.length * 100).toFixed(2) + '%' : '0%'
            });
        }

        // Determine overall trend
        let trend = 'stable';
        if (buckets.length >= 2) {
            const firstBucket = buckets[0];
            const lastBucket = buckets[buckets.length - 1];

            if (lastBucket.errors > firstBucket.errors * 1.5) {
                trend = 'degrading';
            } else if (lastBucket.errors < firstBucket.errors * 0.5) {
                trend = 'improving';
            }
        }

        return {
            buckets,
            bucketSize,
            trend
        };
    }

    /**
     * Generate recommendations based on analysis
     * @param {Object} analysis - Analysis results
     * @returns {Array} Recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        // Check error rate
        if (analysis.stats && analysis.stats.errorCount > 10) {
            recommendations.push({
                priority: 'high',
                category: 'errors',
                message: `High error count detected (${analysis.stats.errorCount}). Investigate recent errors.`,
                action: 'Review error logs and patterns'
            });
        }

        // Check subsystem health
        if (analysis.subsystemHealth) {
            Object.entries(analysis.subsystemHealth).forEach(([subsystem, health]) => {
                if (health.status === 'critical' || health.status === 'unhealthy') {
                    recommendations.push({
                        priority: health.status === 'critical' ? 'high' : 'medium',
                        category: 'subsystem',
                        message: `Subsystem '${subsystem}' is ${health.status} (health: ${health.health})`,
                        action: `Investigate ${subsystem} errors and warnings`
                    });
                }
            });
        }

        // Check trends
        if (analysis.trend === 'degrading') {
            recommendations.push({
                priority: 'medium',
                category: 'trend',
                message: 'Error rate is increasing over time',
                action: 'Monitor system closely and identify root cause'
            });
        }

        // Check patterns
        if (analysis.patterns) {
            if (analysis.patterns.repeating && analysis.patterns.repeating.length > 0) {
                recommendations.push({
                    priority: 'high',
                    category: 'pattern',
                    message: `${analysis.patterns.repeating.length} repeating error patterns detected`,
                    action: 'Fix repeating errors to prevent error loops'
                });
            }

            if (analysis.patterns.cascades && analysis.patterns.cascades.length > 0) {
                recommendations.push({
                    priority: 'high',
                    category: 'pattern',
                    message: `${analysis.patterns.cascades.length} error cascades detected`,
                    action: 'Fix root cause of cascading errors'
                });
            }
        }

        // Sort by priority
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        return recommendations;
    }

    /**
     * Get error frequency distribution
     * @param {Array} logs - Log entries
     * @returns {Object} Frequency distribution
     */
    getErrorFrequency(logs) {
        const errors = logs.filter(log => log.level === 'error' || log.level === 'fatal');

        if (errors.length === 0) {
            return {
                total: 0,
                perMinute: 0,
                perSecond: 0,
                distribution: []
            };
        }

        // Calculate time span
        const times = errors.map(log => new Date(log.timestamp).getTime());
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const duration = maxTime - minTime;

        const perSecond = duration > 0 ? (errors.length / (duration / 1000)) : 0;
        const perMinute = perSecond * 60;

        // Group by code
        const distribution = {};
        errors.forEach(log => {
            distribution[log.code] = (distribution[log.code] || 0) + 1;
        });

        const sortedDistribution = Object.entries(distribution)
            .sort((a, b) => b[1] - a[1])
            .map(([code, count]) => ({
                code,
                count,
                percentage: ((count / errors.length) * 100).toFixed(2) + '%'
            }));

        return {
            total: errors.length,
            perMinute: perMinute.toFixed(2),
            perSecond: perSecond.toFixed(3),
            distribution: sortedDistribution,
            timeSpan: duration
        };
    }
}
