const assert = require('assert');

console.log('Running core systems tests...');

// Test BaseManager singleton pattern
console.log('Testing BaseManager singleton pattern...');
const BaseManager = require('../src/core/BaseManager.js').BaseManager;

class TestManager extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.testValue = 42;
        this._initialized = true;
    }
}

const instance1 = TestManager.getInstance();
const instance2 = TestManager.getInstance();
assert.strictEqual(instance1, instance2, 'BaseManager should return same instance');
assert.strictEqual(instance1.testValue, 42, 'Instance should maintain state');

// EventBus is already tested in test-eventbus.cjs
console.log('EventBus functionality already tested in test-eventbus.cjs');

// Test GameStateManager
console.log('Testing GameStateManager...');
const GameStateManager = require('../src/core/GameStateManager.js').GameStateManager;

const gameState = GameStateManager.getInstance();

// Test character selection
gameState.setSelectedCharacter('wynSprite');
assert.strictEqual(gameState.getSelectedCharacter(), 'wynSprite', 'Character selection should persist');

// Test level progress
gameState.saveProgress('level1', 5, 10);
const progress = gameState.getLevelProgress('level1');
assert.strictEqual(progress.collectiblesCollected, 5, 'Collectibles collected should match');
assert.strictEqual(progress.totalCollectibles, 10, 'Total collectibles should match');

// Test completed levels
assert.strictEqual(gameState.isLevelCompleted('level1'), true, 'Level1 should be marked as completed');
const completedLevels = gameState.getCompletedLevels();
assert(completedLevels.includes('level1'), 'Completed levels should include level1');

// Test settings
gameState.saveSettings({
    volumes: {
        master: 0.8,
        music: 0.7,
        sfx: 0.6
    }
});
const settings = gameState.settings;
assert.strictEqual(settings.volumes.master, 0.8, 'Master volume should be updated');
assert.strictEqual(settings.volumes.music, 0.7, 'Music volume should be updated');
assert.strictEqual(settings.volumes.sfx, 0.6, 'SFX volume should be updated');

// Test UIManager subtitle functionality
console.log('Testing UIManager subtitle system...');
// Note: UIManager requires a Phaser scene context, so we'll just test the structure
const fs = require('fs');
const uiManagerSource = fs.readFileSync('./src/core/UIManager.js', 'utf8');
assert(uiManagerSource.includes('showSubtitles'), 'UIManager should have showSubtitles method');
assert(uiManagerSource.includes('displaySubtitle'), 'UIManager should have displaySubtitle method');
assert(uiManagerSource.includes('queueSubtitle'), 'UIManager should have queueSubtitle method');
assert(uiManagerSource.includes('createSubtitleUI'), 'UIManager should have createSubtitleUI method');

// Test constants
console.log('Testing constants...');
const SceneKeys = require('../src/constants/SceneKeys.js').SceneKeys;
const EventNames = require('../src/constants/EventNames.js').EventNames;

assert(typeof SceneKeys.MAIN_MENU === 'string', 'SceneKeys should have MAIN_MENU');
assert(typeof SceneKeys.GAME === 'string', 'SceneKeys should have GAME');
assert(typeof EventNames.PLAYER_JUMP === 'string', 'EventNames should have PLAYER_JUMP');
assert(typeof EventNames.LEVEL_COMPLETE === 'string', 'EventNames should have LEVEL_COMPLETE');

// Test asset constants exist
console.log('Testing asset constants...');
const Assets = require('../src/constants/Assets.js');
assert(typeof Assets.ImageAssets === 'object', 'Should have ImageAssets object');
assert(typeof Assets.AudioAssets === 'object', 'Should have AudioAssets object');
assert(typeof Assets.ImagePaths === 'object', 'Should have ImagePaths object');
assert(typeof Assets.AudioPaths === 'object', 'Should have AudioPaths object');

console.log('✅ All core systems tests passed!');