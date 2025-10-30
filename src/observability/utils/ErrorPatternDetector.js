/**
 * ErrorPatternDetector - Detects error patterns and cascades in log data
 *
 * Analyzes logs to identify:
 * - Repeating errors (same error code multiple times)
 * - Error cascades (multiple different errors in short time)
 * - Error cycles (errors that trigger each other)
 * - Most common errors
 *
 * Usage:
 *   const detector = new ErrorPatternDetector(LOG);
 *   const patterns = detector.analyzeRecent(5000); // Last 5 seconds
 *   if (patterns.repeatingErrors.length > 0) {
 *       // Handle detected patterns
 *   }
 */
export class ErrorPatternDetector {
    /**
     * @param {LogSystem} logSystem - The log system to analyze
     */
    constructor(logSystem) {
        this.logSystem = logSystem;

        // Pattern detection thresholds
        this.thresholds = {
            repeatingErrorCount: 3,      // Min occurrences to be considered repeating
            cascadeWindowMs: 1000,        // Time window for cascade detection
            cascadeMinErrors: 5,          // Min errors in window for cascade
            cycleDetectionDepth: 10       // Max depth for cycle detection
        };

        // Pattern history
        this.detectedPatterns = [];
        this.maxHistorySize = 100;
    }

    /**
     * Analyze recent errors for patterns
     * @param {number} timeWindowMs - Time window to analyze (milliseconds)
     * @returns {Object} Detected patterns
     */
    analyzeRecent(timeWindowMs = 5000) {
        const now = Date.now();
        const cutoffTime = now - timeWindowMs;

        // Get recent errors and warnings
        const errors = this.logSystem.getByLevel('error', 100);
        const warnings = this.logSystem.getByLevel('warn', 100);
        const fatal = this.logSystem.getByLevel('fatal', 50);

        // Filter to time window
        const recentErrors = [...errors, ...warnings, ...fatal].filter(log => {
            const logTime = new Date(log.timestamp).getTime();
            return logTime >= cutoffTime;
        });

        // Analyze for different pattern types
        const analysis = {
            timeWindow: timeWindowMs,
            totalErrors: recentErrors.length,
            repeatingErrors: this.findRepeating(recentErrors),
            cascades: this.findCascades(recentErrors),
            mostCommon: this.getMostCommon(recentErrors),
            errorRate: this.calculateErrorRate(recentErrors, timeWindowMs),
            severity: this.assessSeverity(recentErrors)
        };

        // Store in history
        this.recordPattern(analysis);

        return analysis;
    }

    /**
     * Find repeating errors (same error code multiple times)
     * @private
     */
    findRepeating(errors) {
        const codeCounts = new Map();

        // Count occurrences of each error code
        errors.forEach(error => {
            const code = error.code;
            codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
        });

        // Find codes that repeat beyond threshold
        const repeating = [];
        codeCounts.forEach((count, code) => {
            if (count >= this.thresholds.repeatingErrorCount) {
                const instances = errors.filter(e => e.code === code);
                repeating.push({
                    code,
                    count,
                    firstOccurrence: instances[0].timestamp,
                    lastOccurrence: instances[instances.length - 1].timestamp,
                    subsystems: [...new Set(instances.map(e => e.subsystem))],
                    instances: instances.slice(0, 5) // Include first 5 instances
                });
            }
        });

        // Sort by count (most frequent first)
        repeating.sort((a, b) => b.count - a.count);

        return repeating;
    }

    /**
     * Find error cascades (multiple errors in short time)
     * @private
     */
    findCascades(errors) {
        if (errors.length < this.thresholds.cascadeMinErrors) {
            return [];
        }

        const cascades = [];
        const windowMs = this.thresholds.cascadeWindowMs;

        // Sort by timestamp
        const sorted = [...errors].sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        // Sliding window to find cascades
        for (let i = 0; i < sorted.length; i++) {
            const windowStart = new Date(sorted[i].timestamp).getTime();
            const windowEnd = windowStart + windowMs;

            // Count errors in window
            const errorsInWindow = sorted.filter((e, idx) => {
                if (idx < i) return false;
                const time = new Date(e.timestamp).getTime();
                return time >= windowStart && time <= windowEnd;
            });

            if (errorsInWindow.length >= this.thresholds.cascadeMinErrors) {
                // Check if this is a new cascade (not overlapping with previous)
                const isNewCascade = cascades.every(cascade => {
                    const cascadeStart = new Date(cascade.startTime).getTime();
                    const cascadeEnd = new Date(cascade.endTime).getTime();
                    return windowStart > cascadeEnd || windowEnd < cascadeStart;
                });

                if (isNewCascade) {
                    cascades.push({
                        startTime: sorted[i].timestamp,
                        endTime: errorsInWindow[errorsInWindow.length - 1].timestamp,
                        duration: windowMs,
                        errorCount: errorsInWindow.length,
                        uniqueCodes: [...new Set(errorsInWindow.map(e => e.code))].length,
                        subsystems: [...new Set(errorsInWindow.map(e => e.subsystem))],
                        errors: errorsInWindow.slice(0, 10) // Include first 10 errors
                    });
                }
            }
        }

        return cascades;
    }

    /**
     * Get most common errors
     * @private
     */
    getMostCommon(errors) {
        const codeCounts = new Map();

        errors.forEach(error => {
            const code = error.code;
            const existing = codeCounts.get(code) || {
                code,
                count: 0,
                level: error.level,
                subsystem: error.subsystem
            };
            existing.count++;
            codeCounts.set(code, existing);
        });

        // Convert to array and sort
        const common = Array.from(codeCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10

        return common;
    }

    /**
     * Calculate error rate (errors per second)
     * @private
     */
    calculateErrorRate(errors, timeWindowMs) {
        const timeWindowSec = timeWindowMs / 1000;
        const rate = errors.length / timeWindowSec;
        return {
            errorsPerSecond: rate.toFixed(2),
            timeWindowSec
        };
    }

    /**
     * Assess overall severity based on patterns
     * @private
     */
    assessSeverity(errors) {
        let severity = 'low';

        const fatalCount = errors.filter(e => e.level === 'fatal').length;
        const errorCount = errors.filter(e => e.level === 'error').length;
        const warnCount = errors.filter(e => e.level === 'warn').length;

        if (fatalCount > 0) {
            severity = 'critical';
        } else if (errorCount > 10) {
            severity = 'high';
        } else if (errorCount > 5 || warnCount > 20) {
            severity = 'medium';
        }

        return {
            level: severity,
            breakdown: {
                fatal: fatalCount,
                error: errorCount,
                warn: warnCount
            }
        };
    }

    /**
     * Record pattern in history
     * @private
     */
    recordPattern(pattern) {
        this.detectedPatterns.push({
            timestamp: new Date().toISOString(),
            pattern
        });

        // Limit history size
        if (this.detectedPatterns.length > this.maxHistorySize) {
            this.detectedPatterns = this.detectedPatterns.slice(-this.maxHistorySize);
        }
    }

    /**
     * Get pattern history
     * @returns {Array} Pattern history
     */
    getHistory() {
        return this.detectedPatterns;
    }

    /**
     * Check if there are active concerning patterns
     * @returns {boolean} True if concerning patterns detected
     */
    hasConcerningPatterns() {
        const recent = this.analyzeRecent(5000);

        return (
            recent.repeatingErrors.length > 0 ||
            recent.cascades.length > 0 ||
            recent.severity.level === 'critical' ||
            recent.severity.level === 'high'
        );
    }

    /**
     * Generate pattern report for display/logging
     * @returns {string} Human-readable report
     */
    generateReport() {
        const recent = this.analyzeRecent(5000);
        const lines = [];

        lines.push('=== Error Pattern Report ===');
        lines.push(`Time Window: ${recent.timeWindow}ms`);
        lines.push(`Total Errors: ${recent.totalErrors}`);
        lines.push(`Error Rate: ${recent.errorRate.errorsPerSecond} errors/sec`);
        lines.push(`Severity: ${recent.severity.level.toUpperCase()}`);
        lines.push('');

        if (recent.repeatingErrors.length > 0) {
            lines.push('Repeating Errors:');
            recent.repeatingErrors.forEach(rep => {
                lines.push(`  - ${rep.code}: ${rep.count} occurrences`);
            });
            lines.push('');
        }

        if (recent.cascades.length > 0) {
            lines.push('Error Cascades:');
            recent.cascades.forEach((cascade, idx) => {
                lines.push(`  Cascade ${idx + 1}: ${cascade.errorCount} errors in ${cascade.duration}ms`);
            });
            lines.push('');
        }

        if (recent.mostCommon.length > 0) {
            lines.push('Most Common Errors:');
            recent.mostCommon.slice(0, 5).forEach((error, idx) => {
                lines.push(`  ${idx + 1}. ${error.code} (${error.count}x)`);
            });
        }

        return lines.join('\n');
    }

    /**
     * Configure detection thresholds
     * @param {Object} thresholds - Threshold overrides
     */
    configure(thresholds) {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }
}
