// Simple test suite for GameStateManager (CommonJS)
const assert = require('assert');
// Shim localStorage for Node environment
class LocalStorageMock {
    constructor() { this.store = {}; }
    getItem(key) { return this.store[key] === undefined ? null : this.store[key]; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock();

const { GameStateManager } = require('../src/core/GameStateManager');

console.log('Running GameStateManager tests...');

// Test default settings load
const gsm = new GameStateManager();
assert.strictEqual(gsm.isInitialized(), true, 'GameStateManager should initialize');
const defaults = gsm.loadSettings();
assert.deepStrictEqual(defaults.volumes, { master: 0.8, music: 0.7, sfx: 0.9 }, 'Default volumes mismatch');
assert.deepStrictEqual(defaults.keybindings, { jump: 'SPACE', left: 'A', right: 'D', pause: 'ESC' }, 'Default keybindings mismatch');
assert.strictEqual(defaults.graphicsQuality, 'Medium', 'Default graphicsQuality mismatch');
assert.deepStrictEqual(defaults.accessibility, { palette: 'Off', highContrast: false, subtitles: false }, 'Default accessibility mismatch');

// Test saveSettings and loadSettings
const newSettings = {
    volumes: { master: 0.5, music: 0.6, sfx: 0.7 },
    keybindings: { jump: 'Z', left: 'Q', right: 'E', pause: 'P' },
    graphicsQuality: 'Low',
    accessibility: { palette: 'Protanopia', highContrast: true, subtitles: true }
};
assert.strictEqual(gsm.saveSettings(newSettings), true, 'saveSettings should return true');
const loaded = gsm.loadSettings();
assert.deepStrictEqual(loaded, newSettings, 'Loaded settings should match saved settings');

// Test resetSettings
assert.strictEqual(gsm.resetSettings(), true, 'resetSettings should return true');
const reset = gsm.loadSettings();
assert.deepStrictEqual(reset.volumes, defaults.volumes, 'Volumes should reset to defaults');
assert.deepStrictEqual(reset.keybindings, defaults.keybindings, 'Keybindings should reset to defaults');

console.log('GameStateManager tests passed.');