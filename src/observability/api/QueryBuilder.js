/**
 * QueryBuilder - Fluent API for Building Log Queries
 *
 * Provides a chainable interface for constructing complex log queries.
 *
 * @example
 * const results = new QueryBuilder(LOG)
 *     .level('error')
 *     .subsystem('physics')
 *     .inLastSeconds(60)
 *     .withContext()
 *     .limit(10)
 *     .execute();
 */

export class QueryBuilder {
    /**
     * Create QueryBuilder instance
     * @param {LogSystem} logSystem - LogSystem instance
     */
    constructor(logSystem) {
        this.logSystem = logSystem;
        this.filters = {};
        this._limit = 100;
        this._includeContext = false;
        this._sortBy = null;
        this._sortOrder = 'asc';
    }

    /**
     * Filter by log level
     * @param {string} level - Log level ('dev', 'info', 'warn', 'error', 'fatal')
     * @returns {QueryBuilder} this
     */
    level(level) {
        this.filters.level = level;
        return this;
    }

    /**
     * Filter by subsystem
     * @param {string} subsystem - Subsystem name
     * @returns {QueryBuilder} this
     */
    subsystem(subsystem) {
        this.filters.subsystem = subsystem;
        return this;
    }

    /**
     * Filter by error code
     * @param {string} code - Error code
     * @returns {QueryBuilder} this
     */
    code(code) {
        this.filters.code = code;
        return this;
    }

    /**
     * Filter logs from last N milliseconds
     * @param {number} milliseconds - Time window
     * @returns {QueryBuilder} this
     */
    inLast(milliseconds) {
        this.filters.timeRange = { last: milliseconds };
        return this;
    }

    /**
     * Filter logs from last N seconds
     * @param {number} seconds - Time window in seconds
     * @returns {QueryBuilder} this
     */
    inLastSeconds(seconds) {
        return this.inLast(seconds * 1000);
    }

    /**
     * Filter logs from last N minutes
     * @param {number} minutes - Time window in minutes
     * @returns {QueryBuilder} this
     */
    inLastMinutes(minutes) {
        return this.inLast(minutes * 60 * 1000);
    }

    /**
     * Filter logs in specific time range
     * @param {number} startTime - Start timestamp
     * @param {number} endTime - End timestamp
     * @returns {QueryBuilder} this
     */
    inTimeRange(startTime, endTime) {
        this.filters.timeRange = { start: startTime, end: endTime };
        return this;
    }

    /**
     * Include full context in results
     * @returns {QueryBuilder} this
     */
    withContext() {
        this._includeContext = true;
        return this;
    }

    /**
     * Exclude context from results
     * @returns {QueryBuilder} this
     */
    withoutContext() {
        this._includeContext = false;
        return this;
    }

    /**
     * Set maximum number of results
     * @param {number} count - Maximum results
     * @returns {QueryBuilder} this
     */
    limit(count) {
        this._limit = count;
        return this;
    }

    /**
     * Sort results by field
     * @param {string} field - Field to sort by ('timestamp', 'level', 'code', 'subsystem')
     * @param {string} [order='asc'] - Sort order ('asc' or 'desc')
     * @returns {QueryBuilder} this
     */
    sortBy(field, order = 'asc') {
        this._sortBy = field;
        this._sortOrder = order;
        return this;
    }

    /**
     * Sort by timestamp descending (most recent first)
     * @returns {QueryBuilder} this
     */
    sortByTimeDesc() {
        return this.sortBy('timestamp', 'desc');
    }

    /**
     * Sort by timestamp ascending (oldest first)
     * @returns {QueryBuilder} this
     */
    sortByTimeAsc() {
        return this.sortBy('timestamp', 'asc');
    }

    /**
     * Filter to only errors
     * @returns {QueryBuilder} this
     */
    errorsOnly() {
        return this.level('error');
    }

    /**
     * Filter to only warnings
     * @returns {QueryBuilder} this
     */
    warningsOnly() {
        return this.level('warn');
    }

    /**
     * Filter to errors and fatals
     * @returns {QueryBuilder} this
     */
    criticalOnly() {
        this._criticalFilter = true;
        return this;
    }

    /**
     * Execute the query
     * @returns {Array} Filtered and sorted log entries
     */
    execute() {
        // Start with all logs
        let results = this.logSystem.buffer.getAll();

        // Apply filters
        if (this.filters.level) {
            results = results.filter(log => log.level === this.filters.level);
        }

        if (this.filters.subsystem) {
            results = results.filter(log => log.subsystem === this.filters.subsystem);
        }

        if (this.filters.code) {
            results = results.filter(log => log.code === this.filters.code);
        }

        // Apply critical filter (errors + fatals)
        if (this._criticalFilter) {
            results = results.filter(log => log.level === 'error' || log.level === 'fatal');
        }

        // Apply time range filter
        if (this.filters.timeRange) {
            const now = Date.now();
            let startTime, endTime;

            if (this.filters.timeRange.last) {
                startTime = now - this.filters.timeRange.last;
                endTime = now;
            } else {
                startTime = this.filters.timeRange.start || 0;
                endTime = this.filters.timeRange.end || now;
            }

            results = results.filter(log => {
                const logTime = new Date(log.timestamp).getTime();
                return logTime >= startTime && logTime <= endTime;
            });
        }

        // Apply sorting
        if (this._sortBy) {
            results.sort((a, b) => {
                let aVal, bVal;

                if (this._sortBy === 'timestamp') {
                    aVal = new Date(a.timestamp).getTime();
                    bVal = new Date(b.timestamp).getTime();
                } else {
                    aVal = a[this._sortBy];
                    bVal = b[this._sortBy];
                }

                if (this._sortOrder === 'desc') {
                    return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
                } else {
                    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                }
            });
        }

        // Apply limit
        results = results.slice(-this._limit);

        // Handle context inclusion
        if (!this._includeContext) {
            results = results.map(log => ({
                ...log,
                context: log.context ? { frame: log.context.frame } : null
            }));
        }

        return results;
    }

    /**
     * Execute and return count only
     * @returns {number} Number of matching logs
     */
    count() {
        return this.execute().length;
    }

    /**
     * Execute and return first result
     * @returns {Object|null} First matching log or null
     */
    first() {
        const results = this.limit(1).execute();
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Execute and return last result
     * @returns {Object|null} Last matching log or null
     */
    last() {
        const results = this.sortByTimeDesc().limit(1).execute();
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Reset all filters and options
     * @returns {QueryBuilder} this
     */
    reset() {
        this.filters = {};
        this._limit = 100;
        this._includeContext = false;
        this._sortBy = null;
        this._sortOrder = 'asc';
        this._criticalFilter = false;
        return this;
    }
}
