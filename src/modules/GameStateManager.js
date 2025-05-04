/**
 * GameStateManager class handles game state persistence,
 * including level progress, collectibles, and settings.
 */
export class GameStateManager {
    /**
     * Create a new GameStateManager
     */
    constructor() {
        this.storageKey = 'wynIsBuff2Progress';
        this.charKey = 'wynIsBuff2SelectedCharacter';
        this.initialized = false;
        
        // Initialize storage
        this.initialize();
    }
    
    /**
     * Initialize the game state manager
     */
    initialize() {
        try {
            // Check if localStorage is available
            if (typeof localStorage === 'undefined') {
                console.warn('[GameStateManager] localStorage is not available, progress will not be saved');
                this.initialized = false;
            // Default character selection
            this.selectedCharacter = 'axelface';
                return;
            }
            
            // Try to access localStorage to make sure it's working
            localStorage.getItem('test');
            
            console.log('[GameStateManager] Initialized successfully');
            this.initialized = true;
            // Load selected character if present
            const stored = localStorage.getItem(this.charKey);
            this.selectedCharacter = stored || 'axelface';
        } catch (error) {
            console.error('[GameStateManager] Error initializing:', error);
            this.initialized = false;
        }
    }
    
    /**
     * Save level progress
     * @param {string} levelId - The level ID
     * @param {number} collectiblesCollected - Number of collectibles collected
     * @param {number} totalCollectibles - Total number of collectibles in the level
     * @returns {boolean} Whether the save was successful
     */
    saveProgress(levelId, collectiblesCollected, totalCollectibles) {
        if (!this.initialized) {
            return false;
        }
        
        try {
            // Load existing progress
            const progress = this.loadProgress();
            
            // Update or add level progress
            progress[levelId] = {
                completed: true,
                collectiblesCollected,
                totalCollectibles,
                completedAt: new Date().toISOString()
            };
            
            // Save progress
            localStorage.setItem(this.storageKey, JSON.stringify(progress));
            
            console.log(`[GameStateManager] Progress saved for level ${levelId}`);
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error saving progress:', error);
            return false;
        }
    }
    
    /**
     * Load game progress
     * @returns {Object} Game progress object
     */
    loadProgress() {
        if (!this.initialized) {
            return {};
        }
        
        try {
            // Get progress from localStorage
            const progressJson = localStorage.getItem(this.storageKey);
            
            // Parse progress or return empty object if not found
            return progressJson ? JSON.parse(progressJson) : {};
        } catch (error) {
            console.error('[GameStateManager] Error loading progress:', error);
            return {};
        }
    }
    
    /**
     * Check if a level is completed
     * @param {string} levelId - The level ID
     * @returns {boolean} Whether the level is completed
     */
    isLevelCompleted(levelId) {
        if (!this.initialized) {
            return false;
        }
        
        try {
            const progress = this.loadProgress();
            return progress[levelId] && progress[levelId].completed;
        } catch (error) {
            console.error('[GameStateManager] Error checking level completion:', error);
            return false;
        }
    }
    
    /**
     * Get level progress
     * @param {string} levelId - The level ID
     * @returns {Object|null} Level progress object or null if not found
     */
    getLevelProgress(levelId) {
        if (!this.initialized) {
            return null;
        }
        
        try {
            const progress = this.loadProgress();
            return progress[levelId] || null;
        } catch (error) {
            console.error('[GameStateManager] Error getting level progress:', error);
            return null;
        }
    }
    
    /**
     * Get all completed levels
     * @returns {Array} Array of completed level IDs
     */
    getCompletedLevels() {
        if (!this.initialized) {
            return [];
        }
        
        try {
            const progress = this.loadProgress();
            return Object.keys(progress).filter(levelId => 
                progress[levelId] && progress[levelId].completed
            );
        } catch (error) {
            console.error('[GameStateManager] Error getting completed levels:', error);
            return [];
        }
    }
    
    /**
     * Get total collectibles collected across all levels
     * @returns {Object} Object with collected and total counts
     */
    getTotalCollectibles() {
        if (!this.initialized) {
            return { collected: 0, total: 0 };
        }
        
        try {
            const progress = this.loadProgress();
            let collected = 0;
            let total = 0;
            
            Object.values(progress).forEach(levelProgress => {
                if (levelProgress) {
                    collected += levelProgress.collectiblesCollected || 0;
                    total += levelProgress.totalCollectibles || 0;
                }
            });
            
            return { collected, total };
        } catch (error) {
            console.error('[GameStateManager] Error getting total collectibles:', error);
            return { collected: 0, total: 0 };
        }
    }
    
    /**
     * Reset all progress
     * @returns {boolean} Whether the reset was successful
     */
    resetProgress() {
        if (!this.initialized) {
            return false;
        }
        
        try {
            localStorage.removeItem(this.storageKey);
            // Reset character selection as well
            localStorage.removeItem(this.charKey);
            console.log('[GameStateManager] Progress reset');
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error resetting progress:', error);
            return false;
        }
    }
    
    /**
     * Set the selected character key
     * @param {string} key - Character texture key
     */
    setSelectedCharacter(key) {
        this.selectedCharacter = key;
        if (this.initialized) {
            try {
                localStorage.setItem(this.charKey, key);
            } catch (error) {
                console.error('[GameStateManager] Error persisting character selection:', error);
            }
        }
    }
    
    /**
     * Get the selected character key
     * @returns {string} The selected character key
     */
    getSelectedCharacter() {
        return this.selectedCharacter || 'axelface';
    }
    
    /**
     * Check if the game state manager is initialized
     * @returns {boolean} Whether the game state manager is initialized
     */
    isInitialized() {
        return this.initialized;
    }
}