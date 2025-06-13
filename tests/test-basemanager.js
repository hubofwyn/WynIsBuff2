// Tests for core/BaseManager
const assert = require('assert');

const { BaseManager } = require('../src/core/BaseManager');

console.log('Running BaseManager tests...');

class DummyManager extends BaseManager {
  constructor() {
    super();
    this.value = 0;
  }

  init() {
    this.value = 42;
    this._initialized = true;
  }
}

// Ensure singleton behaviour
const dm1 = DummyManager.getInstance();
const dm2 = DummyManager.getInstance();
assert.strictEqual(dm1, dm2, 'getInstance should return the same object');

// Test lifecycle
assert.strictEqual(dm1.isInitialized(), false, 'Should not be initialized before init');
dm1.init();
assert.strictEqual(dm1.isInitialized(), true, 'Should report initialized after init');
assert.strictEqual(dm1.value, 42, 'init should mutate internal state');

dm1.destroy();
assert.strictEqual(dm1.isInitialized(), false, 'destroy should reset initialized flag');

console.log('BaseManager tests passed.');

