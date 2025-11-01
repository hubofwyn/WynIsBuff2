/**
 * ExportFormatter - Structured Export Formats for Analysis
 *
 * Provides multiple export formats for logs with rich metadata.
 *
 * @example
 * const formatter = new ExportFormatter();
 * const json = formatter.toJSON(logs, { includeStats: true });
 * const markdown = formatter.toMarkdown(logs, analysis);
 */

import { LogAnalyzer } from './LogAnalyzer.js';

export class ExportFormatter {
    constructor() {
        this.analyzer = new LogAnalyzer();
    }

    /**
     * Export logs to rich JSON format
     * @param {Array} logs - Log entries
     * @param {Object} options - Export options
     * @param {boolean} [options.includeStats=true] - Include statistics
     * @param {boolean} [options.includeAnalysis=true] - Include analysis
     * @param {Object} [options.gameState] - Game state snapshot
     * @param {Object} [options.patterns] - Error patterns
     * @returns {Object} Rich JSON export
     */
    toJSON(logs, options = {}) {
        const {
            includeStats = true,
            includeAnalysis = true,
            gameState = null,
            patterns = null,
        } = options;

        const exportData = {
            metadata: {
                exportTime: new Date().toISOString(),
                version: '1.0.0',
                logCount: logs.length,
                format: 'json',
            },
            logs,
        };

        // Add statistics
        if (includeStats) {
            exportData.statistics = this.analyzer.getStatistics(logs);
            exportData.errorFrequency = this.analyzer.getErrorFrequency(logs);
        }

        // Add analysis
        if (includeAnalysis) {
            exportData.analysis = {
                causalRelationships: this.analyzer.findCausalRelationships(logs),
                trends: this.analyzer.getTrends(logs),
            };

            // Analyze subsystems
            const stats = this.analyzer.getStatistics(logs);
            const subsystems = Object.keys(stats.bySubsystem);
            exportData.analysis.subsystemHealth = {};

            subsystems.forEach((subsystem) => {
                exportData.analysis.subsystemHealth[subsystem] = this.analyzer.getSubsystemHealth(
                    subsystem,
                    logs
                );
            });

            // Generate recommendations
            exportData.recommendations = this.analyzer.generateRecommendations({
                stats: exportData.statistics,
                subsystemHealth: exportData.analysis.subsystemHealth,
                trend: exportData.analysis.trends.trend,
                patterns,
            });
        }

        // Add game state if provided
        if (gameState) {
            exportData.gameState = gameState;
        }

        // Add patterns if provided
        if (patterns) {
            exportData.patterns = patterns;
        }

        return exportData;
    }

    /**
     * Export logs to Markdown format
     * @param {Array} logs - Log entries
     * @param {Object} analysis - Analysis results
     * @returns {string} Markdown formatted report
     */
    toMarkdown(logs, analysis = null) {
        let markdown = '# Observability Report\n\n';
        markdown += `**Generated**: ${new Date().toISOString()}\n\n`;
        markdown += `**Total Logs**: ${logs.length}\n\n`;

        markdown += '---\n\n';

        // Statistics section
        const stats = this.analyzer.getStatistics(logs);
        markdown += '## Statistics\n\n';

        markdown += '### By Level\n\n';
        markdown += '| Level | Count |\n';
        markdown += '|-------|-------|\n';
        Object.entries(stats.byLevel).forEach(([level, count]) => {
            markdown += `| ${level} | ${count} |\n`;
        });
        markdown += '\n';

        markdown += '### Top Subsystems\n\n';
        markdown += '| Subsystem | Count |\n';
        markdown += '|-----------|-------|\n';
        stats.topSubsystems.forEach(({ subsystem, count }) => {
            markdown += `| ${subsystem} | ${count} |\n`;
        });
        markdown += '\n';

        markdown += '### Top Error Codes\n\n';
        markdown += '| Code | Count |\n';
        markdown += '|------|-------|\n';
        stats.topCodes.forEach(({ code, count }) => {
            markdown += `| ${code} | ${count} |\n`;
        });
        markdown += '\n';

        // Error frequency
        const errorFreq = this.analyzer.getErrorFrequency(logs);
        markdown += '## Error Frequency\n\n';
        markdown += `- **Total Errors**: ${errorFreq.total}\n`;
        markdown += `- **Per Second**: ${errorFreq.perSecond}\n`;
        markdown += `- **Per Minute**: ${errorFreq.perMinute}\n\n`;

        // Analysis section
        if (analysis) {
            markdown += '## Analysis\n\n';

            if (analysis.subsystemHealth) {
                markdown += '### Subsystem Health\n\n';
                markdown += '| Subsystem | Health | Status | Errors | Trend |\n';
                markdown += '|-----------|--------|--------|--------|-------|\n';
                Object.entries(analysis.subsystemHealth).forEach(([subsystem, health]) => {
                    markdown += `| ${subsystem} | ${health.health} | ${health.status} | ${health.errorCount} | ${health.trend} |\n`;
                });
                markdown += '\n';
            }

            if (analysis.recommendations && analysis.recommendations.length > 0) {
                markdown += '### Recommendations\n\n';
                analysis.recommendations.forEach((rec, i) => {
                    markdown += `${i + 1}. **[${rec.priority.toUpperCase()}]** ${rec.message}\n`;
                    markdown += `   - *Action*: ${rec.action}\n\n`;
                });
            }
        }

        // Recent errors
        const recentErrors = logs
            .filter((log) => log.level === 'error' || log.level === 'fatal')
            .slice(-10)
            .reverse();

        if (recentErrors.length > 0) {
            markdown += '## Recent Errors (Last 10)\n\n';
            recentErrors.forEach((log, i) => {
                markdown += `### ${i + 1}. ${log.code}\n\n`;
                markdown += `- **Subsystem**: ${log.subsystem}\n`;
                markdown += `- **Level**: ${log.level}\n`;
                markdown += `- **Time**: ${log.timestamp}\n`;
                markdown += `- **Message**: ${log.message}\n`;
                if (log.hint) {
                    markdown += `- **Hint**: ${log.hint}\n`;
                }
                markdown += '\n';
            });
        }

        return markdown;
    }

    /**
     * Export logs to CSV format
     * @param {Array} logs - Log entries
     * @returns {string} CSV formatted data
     */
    toCSV(logs) {
        if (!logs || logs.length === 0) {
            return 'timestamp,level,subsystem,code,message\n';
        }

        let csv = 'timestamp,level,subsystem,code,message,frame\n';

        logs.forEach((log) => {
            const frame = log.context && log.context.frame ? log.context.frame : '';
            const message = (log.message || '').replace(/"/g, '""'); // Escape quotes
            csv += `"${log.timestamp}","${log.level}","${log.subsystem}","${log.code}","${message}","${frame}"\n`;
        });

        return csv;
    }

    /**
     * Export to compact JSON (minimal format)
     * @param {Array} logs - Log entries
     * @returns {Object} Compact JSON
     */
    toCompactJSON(logs) {
        return {
            meta: {
                time: new Date().toISOString(),
                count: logs.length,
            },
            logs: logs.map((log) => ({
                t: log.timestamp,
                l: log.level,
                s: log.subsystem,
                c: log.code,
                m: log.message,
                f: log.context?.frame,
            })),
        };
    }

    /**
     * Export summary only (no individual logs)
     * @param {Array} logs - Log entries
     * @param {Object} options - Options
     * @returns {Object} Summary export
     */
    toSummary(logs, options = {}) {
        const { includePatterns = false, patterns = null } = options;

        const stats = this.analyzer.getStatistics(logs);
        const errorFreq = this.analyzer.getErrorFrequency(logs);
        const trends = this.analyzer.getTrends(logs);

        const summary = {
            metadata: {
                exportTime: new Date().toISOString(),
                totalLogs: logs.length,
            },
            statistics: stats,
            errorFrequency: errorFreq,
            trends,
        };

        // Analyze all subsystems
        const subsystems = Object.keys(stats.bySubsystem);
        summary.subsystemHealth = {};

        subsystems.forEach((subsystem) => {
            summary.subsystemHealth[subsystem] = this.analyzer.getSubsystemHealth(subsystem, logs);
        });

        // Overall health score
        const totalErrors = errorFreq.total;
        const totalLogs = logs.length;
        const errorRate = totalLogs > 0 ? totalErrors / totalLogs : 0;
        summary.overallHealth = Math.max(0, Math.round(100 - errorRate * 100));

        // Add patterns if requested
        if (includePatterns && patterns) {
            summary.patterns = patterns;
        }

        // Generate recommendations
        summary.recommendations = this.analyzer.generateRecommendations({
            stats,
            subsystemHealth: summary.subsystemHealth,
            trend: trends.trend,
            patterns,
        });

        return summary;
    }

    /**
     * Format for console display (human-readable)
     * @param {Array} logs - Log entries
     * @param {number} [limit=20] - Number of logs to display
     * @returns {string} Formatted console output
     */
    toConsole(logs, limit = 20) {
        if (!logs || logs.length === 0) {
            return 'No logs to display';
        }

        const display = logs.slice(-limit);
        let output = `\n=== Showing last ${display.length} of ${logs.length} logs ===\n\n`;

        display.forEach((log, _i) => {
            const frame = log.context && log.context.frame ? `[F${log.context.frame}]` : '[F?]';
            const level = log.level.toUpperCase().padEnd(5);
            const subsystem = log.subsystem.padEnd(10);

            output += `${frame} ${level} [${subsystem}] ${log.code}: ${log.message}\n`;

            if (log.hint && (log.level === 'error' || log.level === 'fatal')) {
                output += `      💡 ${log.hint}\n`;
            }
        });

        output += '\n';
        return output;
    }
}
