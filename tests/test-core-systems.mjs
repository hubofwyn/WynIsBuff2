import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Mock localStorage
class LocalStorageMock {
    constructor() { this.store = {}; }
    getItem(key) { return this.store[key] === undefined ? null : this.store[key]; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
    clear() { this.store = {}; }
}
global.localStorage = new LocalStorageMock();

describe('Core Systems Integration', () => {
    beforeEach(() => {
        global.localStorage.clear();
    });

    describe('Manager Integration', () => {
        it('should allow managers to communicate via EventBus', async () => {
            const { EventBus } = await import('../src/core/EventBus.js');
            const { GameStateManager } = await import('../src/core/GameStateManager.js');
            
            // Clean up
            EventBus.removeAllListeners();
            GameStateManager._instance = null;
            
            const gsm = GameStateManager.getInstance();
            let eventReceived = false;
            let eventData = null;
            
            // Listen for a custom event
            EventBus.on('test.integration', (data) => {
                eventReceived = true;
                eventData = data;
            });
            
            // Emit event
            EventBus.emit('test.integration', { value: 123 });
            
            assert.strictEqual(eventReceived, true, 'event should be received');
            assert.deepStrictEqual(eventData, { value: 123 }, 'event data should match');
            
            // Clean up
            EventBus.removeAllListeners();
            gsm.destroy();
            GameStateManager._instance = null;
        });
    });

    describe('GameStateManager Integration', () => {
        it('should handle full game state lifecycle', async () => {
            const { GameStateManager } = await import('../src/core/GameStateManager.js');
            
            GameStateManager._instance = null;
            const gsm = GameStateManager.getInstance();
            
            // Test initial state
            assert.strictEqual(gsm.getSelectedCharacter(), 'axelSprite', 'should have default character');
            
            // Play through a level
            gsm.setSelectedCharacter('wynGreenSprite');
            gsm.saveProgress('level1', 3, 5);
            gsm.saveProgress('level1', 5, 5); // Complete the level
            
            // Check completion
            assert.strictEqual(gsm.isLevelCompleted('level1'), true, 'level should be completed');
            
            // Get total collectibles
            const totals = gsm.getTotalCollectibles();
            assert.strictEqual(totals.collected, 5, 'should track total collectibles');
            assert.strictEqual(totals.total, 5, 'should track total available');
            
            // Save custom settings
            const customSettings = {
                volumes: { master: 0.5, music: 0.6, sfx: 0.7 },
                keybindings: { jump: 'W', left: 'A', right: 'D', pause: 'ESC' },
                graphicsQuality: 'High',
                accessibility: { palette: 'Off', highContrast: false, subtitles: true }
            };
            gsm.saveSettings(customSettings);
            
            // Simulate game restart - create new instance
            GameStateManager._instance = null;
            const gsm2 = GameStateManager.getInstance();
            
            // Verify everything persisted
            assert.strictEqual(gsm2.getSelectedCharacter(), 'wynGreenSprite', 'character should persist');
            assert.strictEqual(gsm2.isLevelCompleted('level1'), true, 'level completion should persist');
            const totals2 = gsm2.getTotalCollectibles();
            assert.strictEqual(totals2.collected, 5, 'collectibles should persist');
            
            const loadedSettings = gsm2.loadSettings();
            assert.deepStrictEqual(loadedSettings.volumes, customSettings.volumes, 'volumes should persist');
            assert.strictEqual(loadedSettings.accessibility.subtitles, true, 'subtitles setting should persist');
            
            // Clean up
            gsm2.destroy();
            GameStateManager._instance = null;
        });
    });

    describe('Constants Usage', () => {
        it('should use EventNames constants consistently', async () => {
            const { EventNames } = await import('../src/constants/EventNames.js');
            const { EventBus } = await import('../src/core/EventBus.js');
            
            EventBus.removeAllListeners();
            
            const events = [];
            
            // Listen to various game events
            EventBus.on(EventNames.GAME_START, () => events.push('game_start'));
            EventBus.on(EventNames.LEVEL_COMPLETE, () => events.push('level_complete'));
            EventBus.on(EventNames.PLAYER_JUMP, () => events.push('player_jump'));
            
            // Simulate game flow
            EventBus.emit(EventNames.GAME_START);
            EventBus.emit(EventNames.PLAYER_JUMP);
            EventBus.emit(EventNames.LEVEL_COMPLETE);
            
            assert.deepStrictEqual(events, ['game_start', 'player_jump', 'level_complete'], 'events should fire in order');
            
            EventBus.removeAllListeners();
        });
    });

    describe('Error Handling', () => {
        it('should handle localStorage failures gracefully', async () => {
            const { GameStateManager } = await import('../src/core/GameStateManager.js');
            
            GameStateManager._instance = null;
            const gsm = GameStateManager.getInstance();
            
            // Mock localStorage to fail
            const originalSetItem = global.localStorage.setItem;
            global.localStorage.setItem = () => {
                throw new Error('QuotaExceededError');
            };
            
            // Should not throw
            const saveResult = gsm.saveProgress('level1', 1, 1);
            assert.strictEqual(saveResult, false, 'saveProgress should return false on error');
            
            const settingsResult = gsm.saveSettings({ volumes: { master: 0.5 } });
            assert.strictEqual(settingsResult, false, 'saveSettings should return false on error');
            
            // Restore
            global.localStorage.setItem = originalSetItem;
            gsm.destroy();
            GameStateManager._instance = null;
        });
    });

    describe('Manager Lifecycle', () => {
        it('should properly initialize and destroy managers', async () => {
            const { BaseManager } = await import('../src/core/BaseManager.js');
            
            class LifecycleTestManager extends BaseManager {
                constructor() {
                    super();
                    this.initCalls = 0;
                    this.destroyCalls = 0;
                }
                
                init() {
                    this.initCalls++;
                    this._initialized = true;
                }
                
                destroy() {
                    this.destroyCalls++;
                    super.destroy();
                }
            }
            
            const manager = LifecycleTestManager.getInstance();
            assert.strictEqual(manager.isInitialized(), false, 'should not be initialized');
            
            manager.init();
            assert.strictEqual(manager.isInitialized(), true, 'should be initialized');
            assert.strictEqual(manager.initCalls, 1, 'init should be called once');
            
            manager.destroy();
            assert.strictEqual(manager.isInitialized(), false, 'should not be initialized after destroy');
            assert.strictEqual(manager.destroyCalls, 1, 'destroy should be called once');
            
            // Clean up
            LifecycleTestManager._instance = null;
        });
    });
});