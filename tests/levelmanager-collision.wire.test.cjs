'use strict';

const assert = require('assert');

console.log('Running LevelManager collision wiring test...');

const { LevelManager } = require('../src/modules/level/LevelManager.js');

// Use the prototype method directly with a stubbed context to avoid heavy setup.
const handleCollision = LevelManager.prototype.handleCollision;

const ctx = {
  scene: {
    playerController: {
      getBody() { return { handle: 1001 }; },
      getPosition() { return { x: 123, y: 456 }; }
    }
  },
  collectibleManager: {
    calledWith: null,
    handleCollectibleCollision(h) { this.calledWith = h; }
  },
  completionManager: {
    calledWith: null,
    pos: null,
    handleTriggerCollision(h, pos) { this.calledWith = h; this.pos = pos; }
  }
};

// Simulate a collision where player is A and other body is B
const data = { bodyHandleA: 1001, bodyHandleB: 2002 };
handleCollision.call(ctx, data);

assert.strictEqual(ctx.collectibleManager.calledWith, 2002, 'Collectible collision should receive other body handle');
assert.strictEqual(ctx.completionManager.calledWith, 2002, 'Completion trigger should receive other body handle');
assert.deepStrictEqual(ctx.completionManager.pos, { x: 123, y: 456 }, 'Completion should receive player position');

console.log('LevelManager collision wiring test passed.');

