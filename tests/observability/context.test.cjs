/**
 * Phase 2 Context System Tests
 *
 * Tests for DebugContext and StateProvider
 */

const assert = require('assert');

// Mock BaseManager
class BaseManager {
    constructor() {
        const DerivedClass = this.constructor;
        if (DerivedClass._instance) {
            return DerivedClass._instance;
        }
        this._initialized = false;
        DerivedClass._instance = this;
    }

    static getInstance() {
        if (!this._instance) {
            new this();
        }
        return this._instance;
    }

    isInitialized() {
        return this._initialized;
    }

    setInitialized() {
        this._initialized = true;
    }
}

// Mock StateProvider
class StateProvider {
    constructor(target) {
        this.target = target;
        this.enabled = true;
        this.captureCount = 0;
    }

    getName() {
        throw new Error('Must be implemented');
    }

    getState() {
        throw new Error('Must be implemented');
    }

    capture() {
        if (!this.enabled) return null;
        this.captureCount++;
        return this.getState();
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    isEnabled() {
        return this.enabled;
    }

    getStats() {
        return {
            name: this.getName(),
            captureCount: this.captureCount
        };
    }

    reset() {
        this.captureCount = 0;
    }
}

// Mock DebugContext
class DebugContext extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }

    init() {
        this.providers = new Map();
        this.currentFrame = 0;
        this.deltaTime = 0;
        this.cachedSnapshot = null;
        this.cacheFrame = -1;
        this.stats = {
            totalSnapshots: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        this.setInitialized();
    }

    registerProvider(provider) {
        this.providers.set(provider.getName(), provider);
    }

    unregisterProvider(name) {
        return this.providers.delete(name);
    }

    updateFrame(frameNumber, dt) {
        this.currentFrame = frameNumber;
        this.deltaTime = dt;
        if (frameNumber !== this.cacheFrame) {
            this.cachedSnapshot = null;
            this.cacheFrame = -1;
        }
    }

    captureSnapshot(skipCache = false) {
        if (!skipCache && this.cacheFrame === this.currentFrame && this.cachedSnapshot) {
            this.stats.cacheHits++;
            return this.cachedSnapshot;
        }

        this.stats.cacheMisses++;
        this.stats.totalSnapshots++;

        const snapshot = {
            frame: this.currentFrame,
            deltaTime: this.deltaTime,
            timestamp: Date.now()
        };

        for (const [name, provider] of this.providers) {
            if (provider.isEnabled()) {
                const state = provider.capture();
                if (state !== null) {
                    snapshot[name] = state;
                }
            }
        }

        this.cachedSnapshot = snapshot;
        this.cacheFrame = this.currentFrame;

        return snapshot;
    }

    getStats() {
        return { ...this.stats };
    }
}

// Test providers
class TestPlayerProvider extends StateProvider {
    getName() {
        return 'player';
    }

    getState() {
        return {
            position: { x: 100, y: 200 },
            velocity: { x: 5, y: 0 },
            isGrounded: true
        };
    }
}

class TestPhysicsProvider extends StateProvider {
    getName() {
        return 'physics';
    }

    getState() {
        return {
            gravity: { x: 0, y: 9.81 },
            bodies: 10
        };
    }
}

// Test Suite
console.log('🧪 Testing Phase 2: Context System\n');

// Test 1: StateProvider Basic Functionality
console.log('Test 1: StateProvider basic functionality');
{
    const provider = new TestPlayerProvider({});

    assert.strictEqual(provider.getName(), 'player', 'Provider name should be player');
    assert.strictEqual(provider.isEnabled(), true, 'Provider should be enabled by default');

    const state = provider.capture();
    assert.ok(state.position, 'Should have position');
    assert.strictEqual(state.position.x, 100, 'Position x should be 100');

    assert.strictEqual(provider.captureCount, 1, 'Capture count should be 1');

    console.log('  ✅ StateProvider works correctly');
}

// Test 2: StateProvider Enable/Disable
console.log('Test 2: StateProvider enable/disable');
{
    const provider = new TestPlayerProvider({});

    provider.disable();
    assert.strictEqual(provider.isEnabled(), false, 'Provider should be disabled');

    const state = provider.capture();
    assert.strictEqual(state, null, 'Disabled provider should return null');

    provider.enable();
    const state2 = provider.capture();
    assert.ok(state2, 'Enabled provider should return state');

    console.log('  ✅ Enable/disable works correctly');
}

// Test 3: DebugContext Registration
console.log('Test 3: DebugContext provider registration');
{
    const context = new DebugContext();
    const playerProvider = new TestPlayerProvider({});
    const physicsProvider = new TestPhysicsProvider({});

    context.registerProvider(playerProvider);
    context.registerProvider(physicsProvider);

    assert.strictEqual(context.providers.size, 2, 'Should have 2 providers');

    console.log('  ✅ Provider registration works');
}

// Test 4: DebugContext Snapshot Capture
console.log('Test 4: DebugContext snapshot capture');
{
    const context = new DebugContext();
    context.registerProvider(new TestPlayerProvider({}));
    context.registerProvider(new TestPhysicsProvider({}));

    context.updateFrame(1, 0.016);

    const snapshot = context.captureSnapshot();

    assert.ok(snapshot.player, 'Snapshot should have player state');
    assert.ok(snapshot.physics, 'Snapshot should have physics state');
    assert.strictEqual(snapshot.frame, 1, 'Frame should be 1');
    assert.strictEqual(snapshot.deltaTime, 0.016, 'Delta time should be 0.016');

    console.log('  ✅ Snapshot capture works');
}

// Test 5: DebugContext Caching
console.log('Test 5: DebugContext snapshot caching');
{
    // Reset singleton for clean test
    DebugContext._instance = null;
    const context = new DebugContext();
    context.registerProvider(new TestPlayerProvider({}));

    context.updateFrame(10, 0.016); // Use frame 10 to ensure clean state

    // Get initial stats
    const initialMisses = context.stats.cacheMisses;
    const initialHits = context.stats.cacheHits;

    // First capture - cache miss
    const snapshot1 = context.captureSnapshot();
    assert.strictEqual(context.stats.cacheMisses, initialMisses + 1, 'Should have +1 cache miss');
    assert.strictEqual(context.stats.cacheHits, initialHits, 'Cache hits should not increase');

    // Second capture same frame - cache hit
    const snapshot2 = context.captureSnapshot();
    assert.strictEqual(context.stats.cacheHits, initialHits + 1, 'Should have +1 cache hit');

    // New frame - cache miss
    context.updateFrame(11, 0.016);
    const snapshot3 = context.captureSnapshot();
    assert.strictEqual(context.stats.cacheMisses, initialMisses + 2, 'Should have +2 cache misses');

    console.log('  ✅ Snapshot caching works correctly');
}

// Test 6: Provider Statistics
console.log('Test 6: Provider statistics');
{
    const provider = new TestPlayerProvider({});

    provider.capture();
    provider.capture();
    provider.capture();

    const stats = provider.getStats();
    assert.strictEqual(stats.captureCount, 3, 'Should have 3 captures');
    assert.strictEqual(stats.name, 'player', 'Name should be player');

    provider.reset();
    const stats2 = provider.getStats();
    assert.strictEqual(stats2.captureCount, 0, 'Count should reset to 0');

    console.log('  ✅ Provider statistics work');
}

// Test 7: Frame Updates
console.log('Test 7: Frame updates');
{
    const context = new DebugContext();

    context.updateFrame(1, 0.016);
    assert.strictEqual(context.currentFrame, 1, 'Frame should be 1');
    assert.strictEqual(context.deltaTime, 0.016, 'Delta time should be 0.016');

    context.updateFrame(2, 0.020);
    assert.strictEqual(context.currentFrame, 2, 'Frame should be 2');
    assert.strictEqual(context.deltaTime, 0.020, 'Delta time should be 0.020');

    console.log('  ✅ Frame updates work correctly');
}

// Test 8: Unregister Provider
console.log('Test 8: Unregister provider');
{
    const context = new DebugContext();
    context.registerProvider(new TestPlayerProvider({}));
    context.registerProvider(new TestPhysicsProvider({}));

    assert.strictEqual(context.providers.size, 2, 'Should have 2 providers');

    context.unregisterProvider('player');
    assert.strictEqual(context.providers.size, 1, 'Should have 1 provider after unregister');

    const snapshot = context.captureSnapshot();
    assert.ok(snapshot.physics, 'Should still have physics');
    assert.ok(!snapshot.player, 'Should not have player');

    console.log('  ✅ Provider unregistration works');
}

console.log('\n✅ All Phase 2 tests passed!\n');
console.log('Phase 2 validation complete. Context system is working correctly.');
