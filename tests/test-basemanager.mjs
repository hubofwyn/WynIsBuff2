import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { BaseManager } from '../src/core/BaseManager.js';

describe('BaseManager', () => {
    class TestManager extends BaseManager {
        constructor() {
            super();
            this.value = 0;
            this.initCount = 0;
        }

        init() {
            this.value = 42;
            this.initCount++;
            this._initialized = true;
        }

        reset() {
            this.value = 0;
            this.initCount = 0;
        }
    }

    class AnotherTestManager extends BaseManager {
        constructor() {
            super();
            this.name = 'another';
        }

        init() {
            this._initialized = true;
        }
    }

    afterEach(() => {
        // Clean up singleton instances
        TestManager._instance = null;
        AnotherTestManager._instance = null;
    });

    it('should implement singleton pattern correctly', () => {
        const instance1 = TestManager.getInstance();
        const instance2 = TestManager.getInstance();
        
        assert.strictEqual(instance1, instance2, 'getInstance should return same instance');
        assert(instance1 instanceof TestManager, 'instance should be of correct type');
    });

    it('should handle initialization state', () => {
        const manager = TestManager.getInstance();
        
        assert.strictEqual(manager.isInitialized(), false, 'should not be initialized by default');
        assert.strictEqual(manager.value, 0, 'value should be 0 before init');
        
        manager.init();
        
        assert.strictEqual(manager.isInitialized(), true, 'should be initialized after init()');
        assert.strictEqual(manager.value, 42, 'init() should set value to 42');
        assert.strictEqual(manager.initCount, 1, 'init should be called once');
    });

    it('should handle destroy correctly', () => {
        const manager = TestManager.getInstance();
        manager.init();
        
        assert.strictEqual(manager.isInitialized(), true, 'should be initialized');
        
        manager.destroy();
        
        assert.strictEqual(manager.isInitialized(), false, 'should not be initialized after destroy');
    });

    it('should maintain separate instances for different classes', () => {
        const testManager = TestManager.getInstance();
        const anotherManager = AnotherTestManager.getInstance();
        
        assert.notStrictEqual(testManager, anotherManager, 'different classes should have different instances');
        assert(testManager instanceof TestManager, 'first should be TestManager');
        assert(anotherManager instanceof AnotherTestManager, 'second should be AnotherTestManager');
    });

    it('should allow init() even if not overridden', () => {
        class NoInitManager extends BaseManager {}
        
        const manager = NoInitManager.getInstance();
        // Should not throw - BaseManager has a default init implementation
        assert.doesNotThrow(
            () => manager.init(),
            'should not throw when init() called'
        );
        assert.strictEqual(manager.isInitialized(), true, 'should be initialized after init()');
    });

    it('should persist state across getInstance calls', () => {
        const manager1 = TestManager.getInstance();
        manager1.init();
        manager1.value = 99;
        
        const manager2 = TestManager.getInstance();
        assert.strictEqual(manager2.value, 99, 'state should persist');
        assert.strictEqual(manager2.isInitialized(), true, 'initialized state should persist');
    });
});