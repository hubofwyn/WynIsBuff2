/**
 * Bounded circular buffer for log entries
 *
 * Features:
 * - Fixed size to prevent memory leaks
 * - O(1) add and get operations
 * - Automatic overwrite of oldest entries
 * - Query capabilities for recent entries
 */

export class BoundedBuffer {
    /**
     * @param {number} maxSize - Maximum number of entries to store
     */
    constructor(maxSize = 2000) {
        this.maxSize = maxSize;
        this.buffer = [];
        this.writePointer = 0;
        this.totalWritten = 0;
        this.overflowCount = 0;
    }

    /**
     * Add an entry to the buffer
     * @param {Object} entry - Log entry to add
     */
    add(entry) {
        // Add metadata
        const enrichedEntry = {
            ...entry,
            _bufferIndex: this.totalWritten,
            _timestamp: Date.now(),
        };

        if (this.buffer.length < this.maxSize) {
            // Still growing to max size
            this.buffer.push(enrichedEntry);
        } else {
            // Overwrite oldest entry
            this.buffer[this.writePointer] = enrichedEntry;
            this.writePointer = (this.writePointer + 1) % this.maxSize;
            this.overflowCount++;
        }

        this.totalWritten++;
    }

    /**
     * Get the most recent N entries
     * @param {number} count - Number of entries to retrieve
     * @returns {Array} Recent entries, newest first
     */
    getLast(count = 10) {
        const actualCount = Math.min(count, this.buffer.length);
        if (actualCount === 0) return [];

        const result = [];
        let idx =
            this.buffer.length < this.maxSize
                ? this.buffer.length - 1
                : (this.writePointer - 1 + this.maxSize) % this.maxSize;

        for (let i = 0; i < actualCount; i++) {
            result.push(this.buffer[idx]);
            idx = (idx - 1 + this.maxSize) % this.maxSize;
        }

        return result;
    }

    /**
     * Get all entries matching a filter function
     * @param {Function} filterFn - Filter function (entry) => boolean
     * @param {number} maxResults - Maximum results to return
     * @returns {Array} Matching entries
     */
    filter(filterFn, maxResults = 100) {
        const results = [];
        const len = this.buffer.length;

        // Start from most recent
        let idx =
            len < this.maxSize ? len - 1 : (this.writePointer - 1 + this.maxSize) % this.maxSize;

        for (let i = 0; i < len && results.length < maxResults; i++) {
            const entry = this.buffer[idx];
            if (filterFn(entry)) {
                results.push(entry);
            }
            idx = (idx - 1 + this.maxSize) % this.maxSize;
        }

        return results;
    }

    /**
     * Get entries by log level
     * @param {string} level - Log level to filter by
     * @param {number} count - Maximum number to return
     */
    getByLevel(level, count = 10) {
        return this.filter((entry) => entry.level === level, count);
    }

    /**
     * Get entries by error code
     * @param {string} code - Error code to search for
     * @param {number} count - Maximum number to return
     */
    getByCode(code, count = 10) {
        return this.filter((entry) => entry.code === code, count);
    }

    /**
     * Get all entries (for export/debugging)
     * @returns {Array} All entries in chronological order
     */
    getAll() {
        if (this.buffer.length < this.maxSize) {
            return [...this.buffer];
        }

        // Reconstruct chronological order from circular buffer
        const result = [];
        for (let i = 0; i < this.maxSize; i++) {
            const idx = (this.writePointer + i) % this.maxSize;
            result.push(this.buffer[idx]);
        }
        return result;
    }

    /**
     * Clear all entries
     */
    clear() {
        this.buffer = [];
        this.writePointer = 0;
        this.totalWritten = 0;
        this.overflowCount = 0;
    }

    /**
     * Get buffer statistics
     */
    getStats() {
        return {
            size: this.buffer.length,
            maxSize: this.maxSize,
            totalWritten: this.totalWritten,
            overflowCount: this.overflowCount,
            utilizationPercent: (this.buffer.length / this.maxSize) * 100,
        };
    }

    /**
     * Check if buffer is full
     */
    isFull() {
        return this.buffer.length >= this.maxSize;
    }

    /**
     * Get current buffer usage
     */
    getUsage() {
        return this.buffer.length;
    }
}
