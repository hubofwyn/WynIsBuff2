import { EventNames } from '../constants/EventNames.js';
import { LOG } from '../observability/core/LogSystem.js';

import { BaseManager } from './BaseManager.js';
import { EconomyManager } from './EconomyManager.js';
import { EventBus } from './EventBus.js';

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
                LOG.warn('GAMESTATE_NO_LOCALSTORAGE', {
                    subsystem: 'gamestate',
                    message: 'localStorage not available, progress will not be saved',
                    hint: 'Check browser environment. localStorage may be disabled or unavailable in this context.',
                });
                this.initialized = false;
                this._initialized = false;
                // Default character selection
                this.selectedCharacter = 'axelSprite';
                return;
            }

            // Try to access localStorage to make sure it's working
            localStorage.getItem('test');

            LOG.dev('GAMESTATE_INIT_SUCCESS', {
                subsystem: 'gamestate',
                message: 'GameStateManager initialized successfully',
                defaultCharacter: 'axelSprite',
            });
            this.initialized = true;
            this._initialized = true;
            // Load selected character if present
            const stored = localStorage.getItem(this.charKey);
            this.selectedCharacter = stored || 'axelSprite';
        } catch (error) {
            LOG.error('GAMESTATE_INIT_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error initializing GameStateManager',
                hint: 'Check localStorage permissions. Browser may block localStorage access.',
            });
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
                completedAt: new Date().toISOString(),
            };

            // Save progress
            localStorage.setItem(this.storageKey, JSON.stringify(progress));

            LOG.dev('GAMESTATE_PROGRESS_SAVED', {
                subsystem: 'gamestate',
                message: 'Level progress saved',
                levelId,
                collectiblesCollected,
                totalCollectibles,
            });
            return true;
        } catch (error) {
            LOG.error('GAMESTATE_SAVE_PROGRESS_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error saving level progress',
                levelId,
                hint: 'Check localStorage quota. Storage may be full.',
            });
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
            LOG.error('GAMESTATE_LOAD_PROGRESS_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error loading game progress',
                hint: 'Check localStorage data integrity. Data may be corrupted.',
            });
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
            LOG.error('GAMESTATE_CHECK_COMPLETION_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error checking level completion',
                levelId,
                hint: 'Check progress data integrity.',
            });
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
            LOG.error('GAMESTATE_GET_LEVEL_PROGRESS_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error getting level progress',
                levelId,
                hint: 'Check progress data structure.',
            });
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
            return Object.keys(progress).filter(
                (levelId) => progress[levelId] && progress[levelId].completed
            );
        } catch (error) {
            LOG.error('GAMESTATE_GET_COMPLETED_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error getting completed levels',
                hint: 'Check progress data structure.',
            });
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

            Object.values(progress).forEach((levelProgress) => {
                if (levelProgress) {
                    collected += levelProgress.collectiblesCollected || 0;
                    total += levelProgress.totalCollectibles || 0;
                }
            });

            return { collected, total };
        } catch (error) {
            LOG.error('GAMESTATE_GET_COLLECTIBLES_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error getting total collectibles',
                hint: 'Check progress data structure.',
            });
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
            LOG.dev('GAMESTATE_PROGRESS_RESET', {
                subsystem: 'gamestate',
                message: 'All progress reset',
            });
            return true;
        } catch (error) {
            LOG.error('GAMESTATE_RESET_PROGRESS_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error resetting progress',
                hint: 'Check localStorage access permissions.',
            });
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
                LOG.error('GAMESTATE_PERSIST_CHARACTER_ERROR', {
                    subsystem: 'gamestate',
                    error,
                    message: 'Error persisting character selection',
                    character: key,
                    hint: 'Check localStorage quota and permissions.',
                });
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
                settings,
            };
            localStorage.setItem(this.settingsKey, JSON.stringify(payload));
            this.settings = settings;
            return true;
        } catch (error) {
            LOG.error('GAMESTATE_SAVE_SETTINGS_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error saving settings',
                hint: 'Check localStorage quota and permissions.',
            });
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
            accessibility: { palette: 'Off', highContrast: false, subtitles: false },
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
                LOG.warn('GAMESTATE_SETTINGS_VERSION_MISMATCH', {
                    subsystem: 'gamestate',
                    message: 'Settings schema version mismatch, resetting to defaults',
                    foundVersion: parsed.schemaVersion,
                    expectedVersion: GameStateManager.SETTINGS_SCHEMA_VERSION,
                    hint: 'Settings schema was updated. User settings have been reset.',
                });
                this.resetSettings();
                return defaults;
            }
            // Legacy unversioned settings
            LOG.info('GAMESTATE_LEGACY_SETTINGS_UPGRADE', {
                subsystem: 'gamestate',
                message: 'Loading legacy settings and upgrading schema',
            });
            this.saveSettings(parsed);
            return parsed;
        } catch (error) {
            LOG.error('GAMESTATE_LOAD_SETTINGS_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error loading settings',
                hint: 'Check localStorage data integrity. Settings may be corrupted.',
            });
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
            LOG.dev('GAMESTATE_SETTINGS_RESET', {
                subsystem: 'gamestate',
                message: 'Settings reset to defaults',
            });
            return true;
        } catch (error) {
            LOG.error('GAMESTATE_RESET_SETTINGS_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error resetting settings',
                hint: 'Check localStorage access permissions.',
            });
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
                version: 1,
            };

            localStorage.setItem(this.idleStateKey, JSON.stringify(saveData));
            localStorage.setItem(this.lastSaveKey, Date.now().toString());

            LOG.dev('GAMESTATE_IDLE_STATE_SAVED', {
                subsystem: 'gamestate',
                message: 'Idle state saved',
                timestamp: saveData.timestamp,
            });
            return true;
        } catch (error) {
            LOG.error('GAMESTATE_SAVE_IDLE_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error saving idle state',
                hint: 'Check localStorage quota and permissions.',
            });
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
            LOG.error('GAMESTATE_LOAD_IDLE_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error loading idle state',
                hint: 'Check localStorage data integrity.',
            });
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
            LOG.error('GAMESTATE_SAVE_RESOURCES_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error saving resources',
                hint: 'Check localStorage quota and permissions.',
            });
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
            return resourcesJson
                ? JSON.parse(resourcesJson)
                : { buffCoins: 0, buffGems: 0, dna: 0, timeEchoes: 0 };
        } catch (error) {
            LOG.error('GAMESTATE_LOAD_RESOURCES_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error loading resources',
                hint: 'Check localStorage data integrity.',
            });
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
            LOG.error('GAMESTATE_SAVE_UPGRADES_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error saving upgrades',
                hint: 'Check localStorage quota and permissions.',
            });
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
            LOG.error('GAMESTATE_LOAD_UPGRADES_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error loading upgrades',
                hint: 'Check localStorage data integrity.',
            });
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
            LOG.error('GAMESTATE_SAVE_AUTOMATION_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error saving automation',
                hint: 'Check localStorage quota and permissions.',
            });
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
            LOG.error('GAMESTATE_LOAD_AUTOMATION_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error loading automation',
                hint: 'Check localStorage data integrity.',
            });
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
            LOG.error('GAMESTATE_SAVE_FACTORY_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error saving factory',
                hint: 'Check localStorage quota and permissions.',
            });
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
            LOG.error('GAMESTATE_LOAD_FACTORY_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error loading factory',
                hint: 'Check localStorage data integrity.',
            });
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
            LOG.error('GAMESTATE_SAVE_PRESTIGE_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error saving prestige',
                hint: 'Check localStorage quota and permissions.',
            });
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
            return prestigeJson
                ? JSON.parse(prestigeJson)
                : { prestigePoints: 0, totalPrestiges: 0, bonuses: {} };
        } catch (error) {
            LOG.error('GAMESTATE_LOAD_PRESTIGE_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error loading prestige',
                hint: 'Check localStorage data integrity.',
            });
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
            LOG.error('GAMESTATE_SAVE_ACHIEVEMENTS_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error saving achievements',
                hint: 'Check localStorage quota and permissions.',
            });
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
            LOG.error('GAMESTATE_LOAD_ACHIEVEMENTS_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error loading achievements',
                hint: 'Check localStorage data integrity.',
            });
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
            LOG.error('GAMESTATE_GET_LAST_SAVE_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error getting last save time',
                hint: 'Check localStorage data integrity.',
            });
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
            offlineTime: this.getOfflineTime(),
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

            LOG.dev('GAMESTATE_IDLE_RESET', {
                subsystem: 'gamestate',
                message: 'Idle progress reset',
            });
            return true;
        } catch (error) {
            LOG.error('GAMESTATE_RESET_IDLE_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error resetting idle progress',
                hint: 'Check localStorage access permissions.',
            });
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
            EventBus.getInstance().emit(EventNames.custom('save', 'complete'), {
                timestamp: Date.now(),
                managers: Object.keys(saveData),
            });

            return true;
        } catch (error) {
            LOG.error('GAMESTATE_CENTRAL_SAVE_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error in central save',
                hint: 'Check localStorage quota and permissions. Manager serialization may have failed.',
            });
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
                LOG.dev('GAMESTATE_NO_SAVE_DATA', {
                    subsystem: 'gamestate',
                    message: 'No save data found for managers',
                });
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
            EventBus.getInstance().emit(EventNames.custom('load', 'complete'), {
                timestamp: Date.now(),
                managers: Object.keys(saveData),
            });

            return true;
        } catch (error) {
            LOG.error('GAMESTATE_CENTRAL_LOAD_ERROR', {
                subsystem: 'gamestate',
                error,
                message: 'Error in central load',
                hint: 'Check localStorage data integrity. Manager deserialization may have failed.',
            });
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
                LOG.dev('GAMESTATE_MANAGERS_UNAVAILABLE', {
                    subsystem: 'gamestate',
                    message: 'Some managers not available for save/load',
                    error: e.message,
                });
            }
        }

        return managers;
    }
}
