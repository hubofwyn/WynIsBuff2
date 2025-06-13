// CommonJS tests for BaseManager
const assert = require('assert');

const { BaseManager } = require('../src/core/BaseManager.js');

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

const dm1 = DummyManager.getInstance();
const dm2 = DummyManager.getInstance();
assert.strictEqual(dm1, dm2, 'Singleton instances should be identical');

assert.strictEqual(dm1.isInitialized(), false, 'Not initialized by default');
dm1.init();
assert.strictEqual(dm1.isInitialized(), true, 'Should be initialized after init');
assert.strictEqual(dm1.value, 42, 'Init should set value');

dm1.destroy();
assert.strictEqual(dm1.isInitialized(), false, 'Destroy should reset flag');

console.log('BaseManager tests passed.');

