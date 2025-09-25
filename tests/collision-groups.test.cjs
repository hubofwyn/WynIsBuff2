'use strict';

const assert = require('assert');
const { CollisionGroups } = require('../src/constants/CollisionGroups.js');

console.log('Running CollisionGroups tests...');

// membership: PLAYER (bit 2), mask: STATIC|DYNAMIC
const membership = CollisionGroups.PLAYER;
const mask = CollisionGroups.STATIC | CollisionGroups.DYNAMIC;
const groups = CollisionGroups.createMask(membership, mask);

// High 16 bits should be membership; low 16 bits should be mask
const high = (groups >>> 16) & 0xffff;
const low = groups & 0xffff;

assert.strictEqual(high, membership, 'High 16 bits should equal membership');
assert.strictEqual(low, mask, 'Low 16 bits should equal mask');

console.log('CollisionGroups tests passed.');

