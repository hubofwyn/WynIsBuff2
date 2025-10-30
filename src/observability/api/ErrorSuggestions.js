/**
 * ErrorSuggestions - Knowledge Base for Error Resolution
 *
 * Provides heuristic-based suggestions for common error codes.
 * Can be extended with machine learning or external knowledge bases.
 *
 * @example
 * const suggestions = new ErrorSuggestions();
 * const fixes = suggestions.getSuggestions('PHYSICS_UPDATE_ERROR');
 */

/**
 * Knowledge base of error codes and their solutions
 */
const ERROR_KNOWLEDGE_BASE = {
    // Physics errors
    'PHYSICS_INIT_ERROR': {
        category: 'physics',
        severity: 'high',
        suggestions: [
            'Verify Rapier WASM files are accessible and loaded correctly',
            'Check if gravity values are valid finite numbers',
            'Ensure physics engine is initialized before creating bodies',
            'Review browser console for Rapier-specific error messages'
        ],
        documentation: 'docs/systems/ERROR_HANDLING_LOGGING.md#6-critical-systems-analysis'
    },

    'PHYSICS_UPDATE_ERROR': {
        category: 'physics',
        severity: 'high',
        suggestions: [
            'Check if all physics bodies have valid handles',
            'Verify no bodies were deleted while still referenced',
            'Check for NaN in body positions or velocities',
            'Review recent Rapier 0.19+ API changes',
            'Verify world.step() is receiving correct parameters',
            'Check for invalid body configurations or constraints'
        ],
        relatedCodes: ['PHYSICS_CIRCUIT_BREAKER', 'PHYSICS_UPDATE_GAMEOBJECTS_ERROR'],
        documentation: 'docs/technology/RapierPhysics.md'
    },

    'PHYSICS_CIRCUIT_BREAKER': {
        category: 'physics',
        severity: 'critical',
        suggestions: [
            'Review crash dump for detailed error state',
            'Check recent PHYSICS_UPDATE_ERROR logs for root cause',
            'Verify physics body initialization sequence',
            'Consider restarting the scene or game',
            'Check for memory leaks or resource exhaustion'
        ],
        relatedCodes: ['PHYSICS_UPDATE_ERROR'],
        documentation: 'docs/systems/ERROR_HANDLING_LOGGING.md#3-circuit-breaker-systems'
    },

    'PHYSICS_FRAME_BUDGET_EXCEEDED': {
        category: 'physics',
        severity: 'medium',
        suggestions: [
            'Reduce number of physics bodies in scene',
            'Optimize collision shapes (use simpler shapes)',
            'Increase maxStepsPerFrame if acceptable',
            'Review frame rate - may indicate performance issues',
            'Consider spatial partitioning for collision detection'
        ],
        documentation: 'docs/PERFORMANCE_OPTIMIZATION.md'
    },

    // Player errors
    'PLAYER_UPDATE_ERROR': {
        category: 'player',
        severity: 'high',
        suggestions: [
            'Verify player physics body exists and is valid',
            'Check character controller initialization',
            'Validate input manager state',
            'Check for NaN in movement calculations',
            'Verify collider is properly configured',
            'Ensure player is not being updated after destruction'
        ],
        relatedCodes: ['PLAYER_CIRCUIT_BREAKER', 'INPUT_MANAGER_ERROR'],
        documentation: 'docs/systems/MovementSystem.md'
    },

    'PLAYER_CIRCUIT_BREAKER': {
        category: 'player',
        severity: 'critical',
        suggestions: [
            'Review crash dump for player state at failure',
            'Check recent PLAYER_UPDATE_ERROR logs',
            'Verify physics manager is functioning',
            'Check input manager initialization',
            'Consider scene restart or player respawn'
        ],
        relatedCodes: ['PLAYER_UPDATE_ERROR', 'PHYSICS_UPDATE_ERROR'],
        documentation: 'docs/systems/ERROR_HANDLING_LOGGING.md#3-circuit-breaker-systems'
    },

    'PLAYER_MOVEMENT_NAN': {
        category: 'player',
        severity: 'high',
        suggestions: [
            'Check velocity calculations for division by zero',
            'Verify deltaTime is a valid finite number',
            'Check input values are normalized correctly',
            'Verify physics body translation is valid',
            'Add NaN guards in movement calculation code'
        ]
    },

    // Input errors
    'INPUT_MANAGER_ERROR': {
        category: 'input',
        severity: 'medium',
        suggestions: [
            'Verify Phaser input system is initialized',
            'Check if keyboard is available in browser',
            'Ensure input manager init() was called',
            'Verify scene context is valid',
            'Check for input polling before initialization'
        ],
        documentation: 'docs/systems/ERROR_HANDLING_LOGGING.md#63-inputmanager-error-handling'
    },

    // Level/Scene errors
    'LEVEL_LOAD_ERROR': {
        category: 'level',
        severity: 'high',
        suggestions: [
            'Verify level configuration JSON is valid',
            'Check all referenced assets exist',
            'Ensure scene is properly initialized',
            'Review level loader initialization sequence',
            'Check for missing or malformed platform/entity configs'
        ],
        documentation: 'docs/features/LevelImplementationArchitecture.md'
    },

    'LEVEL_LOAD_PLATFORM_ERROR': {
        category: 'level',
        severity: 'medium',
        suggestions: [
            'Check platform configuration format',
            'Verify sprite keys exist in asset manifest',
            'Ensure physics manager is initialized',
            'Check platform factory initialization',
            'Review platform position and size values'
        ]
    },

    // Game state errors
    'GAMESTATE_SAVE_PROGRESS_ERROR': {
        category: 'persistence',
        severity: 'low',
        suggestions: [
            'Check if localStorage is available',
            'Verify storage quota is not exceeded',
            'Check for private browsing mode restrictions',
            'Ensure data being saved is serializable',
            'Consider fallback to in-memory storage'
        ],
        documentation: 'docs/systems/ERROR_HANDLING_LOGGING.md#625-storage-access-guard'
    },

    // Audio errors
    'AUDIO_MANAGER_ERROR': {
        category: 'audio',
        severity: 'low',
        suggestions: [
            'Check if audio context is unlocked (requires user interaction)',
            'Verify audio files are loaded correctly',
            'Check browser audio autoplay policies',
            'Ensure Howler.js is loaded',
            'Try calling audioManager.init() after user gesture'
        ],
        documentation: 'docs/systems/ERROR_HANDLING_LOGGING.md#audio-context-resume'
    },

    // Generic patterns
    'INIT_ERROR': {
        category: 'initialization',
        severity: 'high',
        suggestions: [
            'Check initialization order - dependencies may not be ready',
            'Verify all required parameters are provided',
            'Check for async initialization race conditions',
            'Review constructor and init() method logs',
            'Ensure parent initialization completed successfully'
        ]
    }
};

export class ErrorSuggestions {
    constructor() {
        this.knowledgeBase = ERROR_KNOWLEDGE_BASE;
    }

    /**
     * Get suggestions for specific error code
     * @param {string} errorCode - Error code
     * @param {Object} context - Optional context (recent logs, game state)
     * @returns {Object} Suggestions with metadata
     */
    getSuggestions(errorCode, context = {}) {
        // Direct match
        if (this.knowledgeBase[errorCode]) {
            return {
                errorCode,
                ...this.knowledgeBase[errorCode],
                confidence: 'high'
            };
        }

        // Partial match
        const partialMatch = this._findPartialMatch(errorCode);
        if (partialMatch) {
            return {
                errorCode,
                ...partialMatch,
                confidence: 'medium',
                note: 'Suggestions based on similar error pattern'
            };
        }

        // Generic suggestions
        return {
            errorCode,
            category: 'unknown',
            severity: 'unknown',
            confidence: 'low',
            suggestions: [
                'Check the error message and context for specific details',
                'Review recent logs for related errors using LOG.getByCode()',
                'Consult ERROR_HANDLING_LOGGING.md documentation',
                'Check if error is repeating - may indicate systematic issue',
                'Export logs for detailed analysis'
            ],
            documentation: 'docs/systems/ERROR_HANDLING_LOGGING.md'
        };
    }

    /**
     * Get suggestions based on error pattern
     * @param {Object} pattern - Error pattern from ErrorPatternDetector
     * @returns {Object} Pattern-specific suggestions
     */
    getSuggestionsForPattern(pattern) {
        if (pattern.type === 'repeating') {
            return {
                pattern: 'repeating',
                severity: 'high',
                suggestions: [
                    'Fix the root cause to prevent error loop',
                    'Add guards to prevent repeated execution',
                    'Consider adding cooldown or rate limiting',
                    'Review code path that triggers this error',
                    'Check if circuit breaker threshold is appropriate'
                ]
            };
        }

        if (pattern.type === 'cascade') {
            return {
                pattern: 'cascade',
                severity: 'critical',
                suggestions: [
                    'Fix the first error in the cascade - others may resolve automatically',
                    'Add defensive checks in dependent systems',
                    'Review initialization order',
                    'Consider adding error boundaries',
                    'Check for proper cleanup on error'
                ]
            };
        }

        return {
            pattern: pattern.type,
            suggestions: [
                'Analyze the pattern in detail',
                'Export logs for comprehensive review'
            ]
        };
    }

    /**
     * Get all suggestions for subsystem
     * @param {string} subsystem - Subsystem name
     * @returns {Array} All error suggestions for subsystem
     */
    getSuggestionsForSubsystem(subsystem) {
        const suggestions = [];

        Object.entries(this.knowledgeBase).forEach(([code, data]) => {
            if (data.category === subsystem) {
                suggestions.push({
                    errorCode: code,
                    ...data
                });
            }
        });

        return suggestions;
    }

    /**
     * Get related error codes
     * @param {string} errorCode - Error code
     * @returns {Array} Related error codes
     */
    getRelatedCodes(errorCode) {
        const entry = this.knowledgeBase[errorCode];
        if (entry && entry.relatedCodes) {
            return entry.relatedCodes.map(code => ({
                code,
                ...this.knowledgeBase[code]
            }));
        }
        return [];
    }

    /**
     * Search knowledge base
     * @param {string} query - Search query
     * @returns {Array} Matching entries
     */
    search(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        Object.entries(this.knowledgeBase).forEach(([code, data]) => {
            // Check code
            if (code.toLowerCase().includes(lowerQuery)) {
                results.push({ errorCode: code, ...data, matchType: 'code' });
                return;
            }

            // Check category
            if (data.category && data.category.toLowerCase().includes(lowerQuery)) {
                results.push({ errorCode: code, ...data, matchType: 'category' });
                return;
            }

            // Check suggestions
            const suggestionsText = data.suggestions.join(' ').toLowerCase();
            if (suggestionsText.includes(lowerQuery)) {
                results.push({ errorCode: code, ...data, matchType: 'suggestion' });
            }
        });

        return results;
    }

    /**
     * Add custom suggestion to knowledge base
     * @param {string} errorCode - Error code
     * @param {Object} suggestionData - Suggestion data
     */
    addSuggestion(errorCode, suggestionData) {
        this.knowledgeBase[errorCode] = {
            category: suggestionData.category || 'custom',
            severity: suggestionData.severity || 'medium',
            suggestions: suggestionData.suggestions || [],
            ...suggestionData
        };
    }

    /**
     * Get all categories
     * @returns {Array} List of categories
     */
    getCategories() {
        const categories = new Set();
        Object.values(this.knowledgeBase).forEach(data => {
            if (data.category) {
                categories.add(data.category);
            }
        });
        return Array.from(categories).sort();
    }

    /**
     * Find partial match for error code
     * @param {string} errorCode - Error code
     * @returns {Object|null} Best match or null
     * @private
     */
    _findPartialMatch(errorCode) {
        const codeUpper = errorCode.toUpperCase();

        // Try to extract subsystem from code (e.g., PHYSICS_SOMETHING)
        const parts = codeUpper.split('_');
        if (parts.length > 1) {
            const subsystem = parts[0].toLowerCase();

            // Find generic pattern for subsystem
            for (const [key, data] of Object.entries(this.knowledgeBase)) {
                if (data.category === subsystem && key.endsWith('_ERROR')) {
                    return data;
                }
            }
        }

        return null;
    }
}
