import { BaseManager } from './BaseManager.js';
import { getLogger } from './Logger.js';

/**
 * GameStateManager class handles game state persistence,
 * including level progress, collectibles, and settings.
 */
export class GameStateManager extends BaseManager {
    /**
     * Create a new GameStateManager
     */
    // Current settings schema version
    static SETTINGS_SCHEMA_VERSION = 1;

    constructor() {
        super();
        
        // Return early if already initialized (singleton pattern)
        if (this.isInitialized()) {
            return;
        }
        
        this.logger = getLogger('GameStateManager');
        this.storageKey = 'wynIsBuff2Progress';
        this.charKey = 'wynIsBuff2SelectedCharacter';
        this.settingsKey = 'wynIsBuff2Settings';
        this.initialized = false;
        // Initialize storage and load persisted data
        this.initialize();
        this.settings = this.loadSettings();
    }
    
    /**
     * Initialize the game state manager
     */
    initialize() {
        try {
            // Check if localStorage is available
            if (typeof localStorage === 'undefined') {
                this.logger.warn('localStorage is not available, progress will not be saved');
                this.initialized = false;
                this._initialized = false;
                // Default character selection
                this.selectedCharacter = 'axelSprite';
                return;
            }
            
            // Try to access localStorage to make sure it's working
            localStorage.getItem('test');
            
            this.logger.info('Initialized successfully');
            this.initialized = true;
            this._initialized = true;
            // Load selected character if present
            const stored = localStorage.getItem(this.charKey);
            this.selectedCharacter = stored || 'axelSprite';
        } catch (error) {
            this.logger.error('Error initializing:', error);
            this.initialized = false;
            this._initialized = false;
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
            
            this.logger.info(`Progress saved for level ${levelId}`);
            return true;
        } catch (error) {
            this.logger.error('Error saving progress:', error);
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
            this.logger.error('Error loading progress:', error);
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
            this.logger.error('Error checking level completion:', error);
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
            this.logger.error('Error getting level progress:', error);
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
            this.logger.error('Error getting completed levels:', error);
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
            this.logger.error('Error getting total collectibles:', error);
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
            this.logger.info('Progress reset');
            return true;
        } catch (error) {
            this.logger.error('Error resetting progress:', error);
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
                this.logger.error('Error persisting character selection:', error);
            }
        }
    }
    
    /**
     * Get the selected character key
     * @returns {string} The selected character key
     */
    getSelectedCharacter() {
        return this.selectedCharacter || 'axelSprite';
    }
    /**
     * Save settings object to localStorage with schema version
     * @param {Object} settings - Settings payload to persist
     * @returns {boolean} Whether save succeeded
     */
    saveSettings(settings) {
        if (!this.initialized) {
            return false;
        }
        try {
            const payload = {
                schemaVersion: GameStateManager.SETTINGS_SCHEMA_VERSION,
                settings
            };
            localStorage.setItem(this.settingsKey, JSON.stringify(payload));
            this.settings = settings;
            return true;
        } catch (error) {
            this.logger.error('Error saving settings:', error);
            return false;
        }
    }
    /**
     * Load settings object from localStorage
     * @returns {Object} Persisted settings, or defaults if none
     */
    loadSettings() {
        const defaults = {
            volumes: { master: 0.8, music: 0.7, sfx: 0.9 },
            keybindings: { jump: 'SPACE', left: 'A', right: 'D', pause: 'ESC' },
            graphicsQuality: 'Medium',
            accessibility: { palette: 'Off', highContrast: false, subtitles: false }
        };
        if (!this.initialized) {
            return defaults;
        }
        try {
            const raw = localStorage.getItem(this.settingsKey);
            if (!raw) {
                return defaults;
            }
            const parsed = JSON.parse(raw);
            // Versioned payload
            if (parsed.schemaVersion !== undefined) {
                if (parsed.schemaVersion === GameStateManager.SETTINGS_SCHEMA_VERSION) {
                    return parsed.settings;
                }
                // Migrate or reset on version mismatch
                this.logger.warn(`Settings schema mismatch: found ${parsed.schemaVersion}, expected ${GameStateManager.SETTINGS_SCHEMA_VERSION}. Resetting to defaults.`);
                this.resetSettings();
                return defaults;
            }
            // Legacy unversioned settings
            this.logger.info('Loading legacy settings, upgrading schema');
            this.saveSettings(parsed);
            return parsed;
        } catch (error) {
            this.logger.error('Error loading settings:', error);
            return defaults;
        }
    }
    
    /**
     * Reset all persisted settings to defaults
     * @returns {boolean} Whether the reset was successful
     */
    resetSettings() {
        if (!this.initialized) {
            return false;
        }
        try {
            localStorage.removeItem(this.settingsKey);
            this.settings = this.loadSettings();
            this.logger.info('Settings reset to defaults');
            return true;
        } catch (error) {
            this.logger.error('Error resetting settings:', error);
            return false;
        }
    }
    /**
     * Check if the game state manager is initialized
     * @returns {boolean} Whether the game state manager is initialized
     */
    isInitialized() {
        return this.initialized;
    }
}