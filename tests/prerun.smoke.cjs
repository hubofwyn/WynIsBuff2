'use strict';

// Pre-run smoke: validate critical assets, constants, and level config exist
// without booting a browser or Phaser runtime.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running pre-run smoke checks...');

const { ImageAssets, ImagePaths, SpritesheetConfigs } = require('../src/constants/Assets.js');
const { SceneKeys } = require('../src/constants/SceneKeys.js');
const { LevelData } = require('../src/constants/LevelData.js');

// 1) Critical files exist on disk (logo, player spritesheet)
const logoPath = path.join(process.cwd(), 'assets', ImagePaths.LOGO);
assert.ok(fs.existsSync(logoPath), `Logo file missing at assets/${ImagePaths.LOGO}`);

const playerSheetPath = path.join(process.cwd(), 'assets', ImagePaths.PLAYER);
assert.ok(fs.existsSync(playerSheetPath), `Player spritesheet missing at assets/${ImagePaths.PLAYER}`);

// 2) Spritesheet config sanity
assert.ok(SpritesheetConfigs && SpritesheetConfigs.PLAYER, 'SpritesheetConfigs.PLAYER must exist');
assert.strictEqual(typeof SpritesheetConfigs.PLAYER.frameWidth, 'number');
assert.strictEqual(typeof SpritesheetConfigs.PLAYER.frameHeight, 'number');

// 3) Scene keys include the boot path and gameplay path
const requiredScenes = ['BOOT', 'PRELOADER', 'WELCOME', 'CHARACTER_SELECT', 'RUN'];
requiredScenes.forEach((k) => {
  assert.ok(SceneKeys[k], `SceneKeys.${k} is missing`);
});

// 4) Levels provide minimum config (playerStart + ground + platforms)
const levelIds = Object.keys(LevelData || {});
assert.ok(levelIds.length > 0, 'LevelData must define at least one level');

const firstLevel = LevelData[levelIds[0]];
assert.ok(firstLevel.playerStart && typeof firstLevel.playerStart.x === 'number' && typeof firstLevel.playerStart.y === 'number', 'playerStart missing or invalid');
assert.ok(firstLevel.ground && typeof firstLevel.ground.width === 'number', 'ground config missing or invalid');
assert.ok(Array.isArray(firstLevel.platforms), 'platforms array missing');

console.log('Pre-run smoke checks passed.');

