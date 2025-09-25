import { BaseManager } from './BaseManager.js';
import { EconomyManager } from './EconomyManager.js';
import { EventBus } from './EventBus.js';
import { EventNames } from '../constants/EventNames.js';

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
        
        this.storageKey = 'wynIsBuff2Progress';
        this.charKey = 'wynIsBuff2SelectedCharacter';
        this.settingsKey = 'wynIsBuff2Settings';
        
        // Idle/Automation System Storage Keys
        this.idleStateKey = 'wynIsBuff2IdleState';
        this.resourcesKey = 'wynIsBuff2Resources';
        this.upgradesKey = 'wynIsBuff2Upgrades';
        this.automationKey = 'wynIsBuff2Automation';
        this.factoryKey = 'wynIsBuff2Factory';
        this.prestigeKey = 'wynIsBuff2Prestige';
        this.achievementsKey = 'wynIsBuff2Achievements';
        this.lastSaveKey = 'wynIsBuff2LastSave';
        
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
                console.warn('[GameStateManager] localStorage is not available, progress will not be saved');
                this.initialized = false;
                this._initialized = false;
                // Default character selection
                this.selectedCharacter = 'axelSprite';
                return;
            }
            
            // Try to access localStorage to make sure it's working
            localStorage.getItem('test');
            
            console.log('[GameStateManager] Initialized successfully');
            this.initialized = true;
            this._initialized = true;
            // Load selected character if present
            const stored = localStorage.getItem(this.charKey);
            this.selectedCharacter = stored || 'axelSprite';
        } catch (error) {
            console.error('[GameStateManager] Error initializing:', error);
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
            console.error('[GameStateManager] Error saving settings:', error);
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
                console.warn(`[GameStateManager] Settings schema mismatch: found ${parsed.schemaVersion}, expected ${GameStateManager.SETTINGS_SCHEMA_VERSION}. Resetting to defaults.`);
                this.resetSettings();
                return defaults;
            }
            // Legacy unversioned settings
            console.info('[GameStateManager] Loading legacy settings, upgrading schema');
            this.saveSettings(parsed);
            return parsed;
        } catch (error) {
            console.error('[GameStateManager] Error loading settings:', error);
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
            console.log('[GameStateManager] Settings reset to defaults');
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error resetting settings:', error);
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
    
    // ========================================
    // Idle/Automation System State Management
    // ========================================
    
    /**
     * Save idle game state
     * @param {Object} idleState - Complete idle state object
     * @returns {boolean} Whether the save was successful
     */
    saveIdleState(idleState) {
        if (!this.initialized) {
            return false;
        }
        
        try {
            const saveData = {
                ...idleState,
                timestamp: Date.now(),
                version: 1
            };
            
            localStorage.setItem(this.idleStateKey, JSON.stringify(saveData));
            localStorage.setItem(this.lastSaveKey, Date.now().toString());
            
            console.log('[GameStateManager] Idle state saved');
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error saving idle state:', error);
            return false;
        }
    }
    
    /**
     * Load idle game state
     * @returns {Object|null} Idle state object or null if not found
     */
    loadIdleState() {
        if (!this.initialized) {
            return null;
        }
        
        try {
            const stateJson = localStorage.getItem(this.idleStateKey);
            return stateJson ? JSON.parse(stateJson) : null;
        } catch (error) {
            console.error('[GameStateManager] Error loading idle state:', error);
            return null;
        }
    }
    
    /**
     * Save resources state
     * @param {Object} resources - Resources object with buffCoins, buffGems, etc.
     * @returns {boolean} Whether the save was successful
     */
    saveResources(resources) {
        if (!this.initialized) {
            return false;
        }
        
        try {
            localStorage.setItem(this.resourcesKey, JSON.stringify(resources));
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error saving resources:', error);
            return false;
        }
    }
    
    /**
     * Load resources state
     * @returns {Object} Resources object with default values if not found
     */
    loadResources() {
        if (!this.initialized) {
            return { buffCoins: 0, buffGems: 0, dna: 0, timeEchoes: 0 };
        }
        
        try {
            const resourcesJson = localStorage.getItem(this.resourcesKey);
            return resourcesJson ? JSON.parse(resourcesJson) : { buffCoins: 0, buffGems: 0, dna: 0, timeEchoes: 0 };
        } catch (error) {
            console.error('[GameStateManager] Error loading resources:', error);
            return { buffCoins: 0, buffGems: 0, dna: 0, timeEchoes: 0 };
        }
    }
    
    /**
     * Save upgrades state
     * @param {Object} upgrades - Upgrades purchased and levels
     * @returns {boolean} Whether the save was successful
     */
    saveUpgrades(upgrades) {
        if (!this.initialized) {
            return false;
        }
        
        try {
            localStorage.setItem(this.upgradesKey, JSON.stringify(upgrades));
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error saving upgrades:', error);
            return false;
        }
    }
    
    /**
     * Load upgrades state
     * @returns {Object} Upgrades object or empty object if not found
     */
    loadUpgrades() {
        if (!this.initialized) {
            return {};
        }
        
        try {
            const upgradesJson = localStorage.getItem(this.upgradesKey);
            return upgradesJson ? JSON.parse(upgradesJson) : {};
        } catch (error) {
            console.error('[GameStateManager] Error loading upgrades:', error);
            return {};
        }
    }
    
    /**
     * Save automation state
     * @param {Object} automation - Automation settings and active automations
     * @returns {boolean} Whether the save was successful
     */
    saveAutomation(automation) {
        if (!this.initialized) {
            return false;
        }
        
        try {
            localStorage.setItem(this.automationKey, JSON.stringify(automation));
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error saving automation:', error);
            return false;
        }
    }
    
    /**
     * Load automation state
     * @returns {Object} Automation object or empty object if not found
     */
    loadAutomation() {
        if (!this.initialized) {
            return {};
        }
        
        try {
            const automationJson = localStorage.getItem(this.automationKey);
            return automationJson ? JSON.parse(automationJson) : {};
        } catch (error) {
            console.error('[GameStateManager] Error loading automation:', error);
            return {};
        }
    }
    
    /**
     * Save factory state
     * @param {Object} factory - Factory production lines and upgrades
     * @returns {boolean} Whether the save was successful
     */
    saveFactory(factory) {
        if (!this.initialized) {
            return false;
        }
        
        try {
            localStorage.setItem(this.factoryKey, JSON.stringify(factory));
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error saving factory:', error);
            return false;
        }
    }
    
    /**
     * Load factory state
     * @returns {Object} Factory object or empty object if not found
     */
    loadFactory() {
        if (!this.initialized) {
            return {};
        }
        
        try {
            const factoryJson = localStorage.getItem(this.factoryKey);
            return factoryJson ? JSON.parse(factoryJson) : {};
        } catch (error) {
            console.error('[GameStateManager] Error loading factory:', error);
            return {};
        }
    }
    
    /**
     * Save prestige state
     * @param {Object} prestige - Prestige currency and bonuses
     * @returns {boolean} Whether the save was successful
     */
    savePrestige(prestige) {
        if (!this.initialized) {
            return false;
        }
        
        try {
            localStorage.setItem(this.prestigeKey, JSON.stringify(prestige));
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error saving prestige:', error);
            return false;
        }
    }
    
    /**
     * Load prestige state
     * @returns {Object} Prestige object or default values if not found
     */
    loadPrestige() {
        if (!this.initialized) {
            return { prestigePoints: 0, totalPrestiges: 0, bonuses: {} };
        }
        
        try {
            const prestigeJson = localStorage.getItem(this.prestigeKey);
            return prestigeJson ? JSON.parse(prestigeJson) : { prestigePoints: 0, totalPrestiges: 0, bonuses: {} };
        } catch (error) {
            console.error('[GameStateManager] Error loading prestige:', error);
            return { prestigePoints: 0, totalPrestiges: 0, bonuses: {} };
        }
    }
    
    /**
     * Save achievements state
     * @param {Object} achievements - Unlocked achievements and progress
     * @returns {boolean} Whether the save was successful
     */
    saveAchievements(achievements) {
        if (!this.initialized) {
            return false;
        }
        
        try {
            localStorage.setItem(this.achievementsKey, JSON.stringify(achievements));
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error saving achievements:', error);
            return false;
        }
    }
    
    /**
     * Load achievements state
     * @returns {Object} Achievements object or empty object if not found
     */
    loadAchievements() {
        if (!this.initialized) {
            return { unlocked: [], progress: {} };
        }
        
        try {
            const achievementsJson = localStorage.getItem(this.achievementsKey);
            return achievementsJson ? JSON.parse(achievementsJson) : { unlocked: [], progress: {} };
        } catch (error) {
            console.error('[GameStateManager] Error loading achievements:', error);
            return { unlocked: [], progress: {} };
        }
    }
    
    /**
     * Get last save timestamp
     * @returns {number|null} Timestamp in milliseconds or null if not found
     */
    getLastSaveTime() {
        if (!this.initialized) {
            return null;
        }
        
        try {
            const timestamp = localStorage.getItem(this.lastSaveKey);
            return timestamp ? parseInt(timestamp, 10) : null;
        } catch (error) {
            console.error('[GameStateManager] Error getting last save time:', error);
            return null;
        }
    }
    
    /**
     * Calculate offline time since last save
     * @returns {number} Milliseconds since last save, or 0 if no save found
     */
    getOfflineTime() {
        const lastSave = this.getLastSaveTime();
        if (!lastSave) {
            return 0;
        }
        
        const now = Date.now();
        return Math.max(0, now - lastSave);
    }
    
    /**
     * Save all idle-related state at once
     * @param {Object} fullState - Complete idle game state
     * @returns {boolean} Whether all saves were successful
     */
    saveFullIdleState(fullState) {
        if (!this.initialized) {
            return false;
        }
        
        let success = true;
        
        if (fullState.resources) {
            success = this.saveResources(fullState.resources) && success;
        }
        if (fullState.upgrades) {
            success = this.saveUpgrades(fullState.upgrades) && success;
        }
        if (fullState.automation) {
            success = this.saveAutomation(fullState.automation) && success;
        }
        if (fullState.factory) {
            success = this.saveFactory(fullState.factory) && success;
        }
        if (fullState.prestige) {
            success = this.savePrestige(fullState.prestige) && success;
        }
        if (fullState.achievements) {
            success = this.saveAchievements(fullState.achievements) && success;
        }
        
        // Save the main idle state
        success = this.saveIdleState(fullState.idle || {}) && success;
        
        return success;
    }
    
    /**
     * Load all idle-related state at once
     * @returns {Object} Complete idle game state
     */
    loadFullIdleState() {
        return {
            idle: this.loadIdleState(),
            resources: this.loadResources(),
            upgrades: this.loadUpgrades(),
            automation: this.loadAutomation(),
            factory: this.loadFactory(),
            prestige: this.loadPrestige(),
            achievements: this.loadAchievements(),
            offlineTime: this.getOfflineTime()
        };
    }
    
    /**
     * Reset all idle-related progress
     * @returns {boolean} Whether the reset was successful
     */
    resetIdleProgress() {
        if (!this.initialized) {
            return false;
        }
        
        try {
            localStorage.removeItem(this.idleStateKey);
            localStorage.removeItem(this.resourcesKey);
            localStorage.removeItem(this.upgradesKey);
            localStorage.removeItem(this.automationKey);
            localStorage.removeItem(this.factoryKey);
            // Note: We might want to keep prestige between resets
            // localStorage.removeItem(this.prestigeKey);
            localStorage.removeItem(this.achievementsKey);
            localStorage.removeItem(this.lastSaveKey);
            
            console.log('[GameStateManager] Idle progress reset');
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error resetting idle progress:', error);
            return false;
        }
    }
    
    /**
     * Central save method - coordinates all manager saves
     * @returns {boolean} Success status
     */
    saveAllManagers() {
        try {
            // Get all manager instances (lazy loading pattern)
            const managers = this.getManagerInstances();
            const saveData = {};
            
            // Collect serialized data from each manager
            for (const [name, manager] of Object.entries(managers)) {
                if (manager && typeof manager.serialize === 'function') {
                    saveData[name] = manager.serialize();
                }
            }
            
            // Save to a central key
            localStorage.setItem('wynisbuff2_managers', JSON.stringify(saveData));
            
            // Update last save time
            localStorage.setItem(this.lastSaveKey, Date.now().toString());
            
            // Emit save complete event
            EventBus.emit(EventNames.custom('save', 'complete'), {
                timestamp: Date.now(),
                managers: Object.keys(saveData)
            });
            
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error in central save:', error);
            return false;
        }
    }
    
    /**
     * Central load method - coordinates all manager loads
     * @returns {boolean} Success status
     */
    loadAllManagers() {
        try {
            const saveDataJson = localStorage.getItem('wynisbuff2_managers');
            if (!saveDataJson) {
                console.log('[GameStateManager] No save data found');
                return false;
            }
            
            const saveData = JSON.parse(saveDataJson);
            const managers = this.getManagerInstances();
            
            // Deserialize data for each manager
            for (const [name, manager] of Object.entries(managers)) {
                if (manager && typeof manager.deserialize === 'function' && saveData[name]) {
                    manager.deserialize(saveData[name]);
                }
            }
            
            // Emit load complete event
            EventBus.emit(EventNames.custom('load', 'complete'), {
                timestamp: Date.now(),
                managers: Object.keys(saveData)
            });
            
            return true;
        } catch (error) {
            console.error('[GameStateManager] Error in central load:', error);
            return false;
        }
    }
    
    /**
     * Get instances of all managers that need saving
     * Uses lazy loading to avoid circular dependencies
     * @returns {Object} Manager instances
     */
    getManagerInstances() {
        const managers = {};
        
        // Dynamically import to avoid circular dependencies
        try {
            // Core managers
            managers.economy = EconomyManager.getInstance();
            
            // Lazy load optional managers
            if (typeof BossRewardSystem !== 'undefined') {
                const { BossRewardSystem } = require('@features/boss');
                managers.bossRewards = BossRewardSystem.getInstance();
            }
            
            if (typeof EnhancedCloneManager !== 'undefined') {
                const { EnhancedCloneManager } = require('@features/idle');
                managers.clones = EnhancedCloneManager.getInstance();
            }
            
            if (typeof DeterministicRNG !== 'undefined') {
                const { DeterministicRNG } = require('@features/core');
                managers.rng = DeterministicRNG.getInstance();
            }
        } catch (e) {
            // Some managers may not be available yet
            if (process.env.NODE_ENV !== 'production') {
                console.log('[GameStateManager] Some managers not available for save/load:', e.message);
            }
        }
        
        return managers;
    }
}
