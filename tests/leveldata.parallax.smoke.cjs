'use strict';

const assert = require('assert');

console.log('Running LevelData + Parallax smoke...');

const { getLevelById } = require('../src/constants/LevelData.js');
const { parallaxKeysFor } = require('../src/modules/level/ParallaxMap.js');

// Default entry level should exist
const level = getLevelById('level1');
assert.ok(level && level.playerStart && level.ground && Array.isArray(level.platforms), 'level1 missing required fields');

// Parallax keys should resolve for known biomes
const proteins = parallaxKeysFor('protein-plant');
assert.ok(Array.isArray(proteins) && proteins.length === 4, 'protein-plant parallax keys missing');

const mines = parallaxKeysFor('metronome-mines');
assert.ok(Array.isArray(mines) && mines.length === 4, 'metronome-mines parallax keys missing');

const factory = parallaxKeysFor('factory-floor');
assert.ok(Array.isArray(factory) && factory.length === 4, 'factory-floor parallax keys missing');

console.log('LevelData + Parallax smoke passed.');

