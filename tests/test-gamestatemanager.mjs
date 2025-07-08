import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Mock localStorage for Node environment
class LocalStorageMock {
    constructor() { 
        this.store = {}; 
    }
    getItem(key) { 
        return this.store[key] === undefined ? null : this.store[key]; 
    }
    setItem(key, value) { 
        this.store[key] = String(value); 
    }
    removeItem(key) { 
        delete this.store[key]; 
    }
    clear() {
        this.store = {};
    }
}

global.localStorage = new LocalStorageMock();

import { GameStateManager } from '../src/core/GameStateManager.js';

describe('GameStateManager', () => {
    let gsm;

    beforeEach(() => {
        // Clear localStorage and reset singleton
        global.localStorage.clear();
        GameStateManager._instance = null;
        gsm = GameStateManager.getInstance();
    });

    afterEach(() => {
        // Clean up
        if (gsm) {
            gsm.destroy();
        }
        // Ensure singleton is reset
        GameStateManager._instance = null;
        // Clear localStorage
        global.localStorage.clear();
    });

    it('should initialize with default settings', () => {
        assert.strictEqual(gsm.isInitialized(), true, 'should be initialized');
        
        const defaults = gsm.loadSettings();
        assert.deepStrictEqual(defaults.volumes, {
            master: 0.8,
            music: 0.7,
            sfx: 0.9
        }, 'should have default volumes');
        
        assert.deepStrictEqual(defaults.keybindings, {
            jump: 'SPACE',
            left: 'A',
            right: 'D',
            pause: 'ESC'
        }, 'should have default keybindings');
        
        assert.strictEqual(defaults.graphicsQuality, 'Medium', 'should have default graphics quality');
        
        assert.deepStrictEqual(defaults.accessibility, {
            palette: 'Off',
            highContrast: false,
            subtitles: false
        }, 'should have default accessibility settings');
    });

    it('should save and load settings correctly', () => {
        const newSettings = {
            volumes: { master: 0.5, music: 0.6, sfx: 0.7 },
            keybindings: { jump: 'Z', left: 'Q', right: 'E', pause: 'P' },
            graphicsQuality: 'Low',
            accessibility: { palette: 'Protanopia', highContrast: true, subtitles: true }
        };
        
        const saveResult = gsm.saveSettings(newSettings);
        assert.strictEqual(saveResult, true, 'saveSettings should return true');
        
        const loaded = gsm.loadSettings();
        assert.deepStrictEqual(loaded, newSettings, 'loaded settings should match saved');
    });

    it('should reset settings to defaults', () => {
        // First save custom settings
        const customSettings = {
            volumes: { master: 0.1, music: 0.2, sfx: 0.3 },
            keybindings: { jump: 'X', left: 'J', right: 'L', pause: 'O' },
            graphicsQuality: 'High',
            accessibility: { palette: 'Deuteranopia', highContrast: false, subtitles: true }
        };
        
        gsm.saveSettings(customSettings);
        
        // Reset
        const resetResult = gsm.resetSettings();
        assert.strictEqual(resetResult, true, 'resetSettings should return true');
        
        // Check if back to defaults
        const reset = gsm.loadSettings();
        
        // Check default values
        assert.strictEqual(reset.volumes.master, 0.8, 'master volume should reset');
        assert.strictEqual(reset.volumes.music, 0.7, 'music volume should reset');
        assert.strictEqual(reset.volumes.sfx, 0.9, 'sfx volume should reset');
        assert.strictEqual(reset.graphicsQuality, 'Medium', 'graphics should reset');
        assert.strictEqual(reset.accessibility.palette, 'Off', 'palette should reset');
    });

    it('should handle save/load progress', () => {
        const levelId = 'level1';
        const collected = 5;
        const total = 10;
        
        gsm.saveProgress(levelId, collected, total);
        
        const progress = gsm.loadProgress();
        assert(progress[levelId], 'should have level progress');
        assert.strictEqual(progress[levelId].collectiblesCollected, collected, 'should save collected count');
        assert.strictEqual(progress[levelId].totalCollectibles, total, 'should save total count');
        assert(progress[levelId].completedAt || progress[levelId].timestamp, 'should have timestamp');
    });

    it('should check level completion', () => {
        // No progress yet
        assert.strictEqual(!!gsm.isLevelCompleted('level1'), false, 'uncompleted level should return falsy');
        
        // Save progress - NOTE: current implementation always marks as completed
        gsm.saveProgress('level1', 5, 5);
        assert.strictEqual(gsm.isLevelCompleted('level1'), true, 'saved level should return true');
        
        // Even partial progress is marked as completed in current implementation
        gsm.saveProgress('level2', 3, 5);
        assert.strictEqual(gsm.isLevelCompleted('level2'), true, 'saved progress is marked as completed');
    });

    it('should track completed levels', () => {
        // Test getting completed levels
        const completed = gsm.getCompletedLevels();
        assert(Array.isArray(completed), 'should return array of completed levels');
        assert.strictEqual(completed.length, 0, 'should have no completed levels initially');
        
        // Complete a level
        gsm.saveProgress('level1', 5, 5);
        
        // Check completed levels
        const newCompleted = gsm.getCompletedLevels();
        assert.strictEqual(newCompleted.length, 1, 'should have one completed level');
        assert(newCompleted.includes('level1'), 'should include level1');
    });

    it('should track total collectibles', () => {
        // Initially no collectibles
        const totals = gsm.getTotalCollectibles();
        assert.strictEqual(totals.collected, 0, 'should have 0 collected initially');
        assert.strictEqual(totals.total, 0, 'should have 0 total initially');
        
        // Add some progress
        gsm.saveProgress('level1', 3, 5);
        gsm.saveProgress('level2', 2, 4);
        
        // Check totals
        const newTotals = gsm.getTotalCollectibles();
        assert.strictEqual(newTotals.collected, 5, 'should sum collected');
        assert.strictEqual(newTotals.total, 9, 'should sum total');
    });

    it('should handle localStorage errors gracefully', () => {
        // Mock localStorage to throw
        const originalSetItem = global.localStorage.setItem;
        global.localStorage.setItem = () => {
            throw new Error('Storage full');
        };
        
        // Should not throw, but return false
        const result = gsm.saveSettings({ volumes: { master: 0.5 } });
        assert.strictEqual(result, false, 'should return false on storage error');
        
        // Restore
        global.localStorage.setItem = originalSetItem;
    });

    it('should handle character selection', () => {
        // Default character
        assert.strictEqual(gsm.getSelectedCharacter(), 'axelSprite', 'should have default character');
        
        // Select new character
        gsm.setSelectedCharacter('wynGreenSprite');
        assert.strictEqual(gsm.getSelectedCharacter(), 'wynGreenSprite', 'should update character');
        
        // Clean up and create new instance
        gsm.destroy();
        GameStateManager._instance = null;
        
        // Persist across reload
        const newGsm = GameStateManager.getInstance();
        assert.strictEqual(newGsm.getSelectedCharacter(), 'wynGreenSprite', 'should persist character');
        
        // Clean up the new instance
        newGsm.destroy();
    });
});