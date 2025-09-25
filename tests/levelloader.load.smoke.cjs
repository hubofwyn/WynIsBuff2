'use strict';

const assert = require('assert');

console.log('Running LevelLoader load smoke...');

const { LevelLoader } = require('../src/modules/level/LevelLoader.js');

// Minimal stubs for scene and managers so loadLevel() can run without Phaser.
const sceneStub = {
  cameras: { main: { setBackgroundColor() {} } },
  add: { rectangle() { return { setDepth() {}, destroy() {}, setAlpha() {}, setOrigin() {} }; }, text() { return { setOrigin() {}, setAlpha() {}, destroy() {} }; } },
  tweens: { add() {} },
};
const eventSystemStub = { emit() {} };
const worldStub = {}; // not used by this smoke (level1 has no enemies)
const managersStub = {
  groundFactory: { createGround() {} },
  platformFactory: { createPlatforms() {}, getBodyToSpriteMap() { return new Map(); } },
  movingPlatformController: { createMovingPlatforms() {}, getMovingPlatforms() { return []; } },
  collectibleManager: { createCollectibles() {}, getBodyToSpriteMap() { return new Map(); } },
  completionManager: { setCurrentLevelId() {}, createCompletionTrigger() {}, getBodyToSpriteMap() { return new Map(); } },
  world: worldStub,
};

const loader = new LevelLoader(sceneStub, eventSystemStub, managersStub);
// Avoid side-effects we don't need here
loader.clearLevel = function () {};
loader.setupBackground = function () {};
loader.updateUI = function () {};
loader.positionPlayerAtStart = function () {};

// Should succeed for level1
const ok = loader.loadLevel('level1');
assert.strictEqual(ok, true, 'loadLevel(level1) should return true');
assert.strictEqual(loader.getCurrentLevelId(), 'level1', 'currentLevelId should be level1 after load');

// Should fail for unknown level
const bad = loader.loadLevel('___nonexistent___');
assert.strictEqual(bad, false, 'loadLevel(nonexistent) should return false');

console.log('LevelLoader load smoke passed.');

