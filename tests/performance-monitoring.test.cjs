const assert = require('assert');

/**
 * Performance Monitoring Test Suite
 * 
 * Tests the enhanced PerformanceMonitor functionality:
 * - Comprehensive metrics collection
 * - Game-specific metrics tracking
 * - Performance threshold warnings
 * - Historical data management
 * - Serialization/deserialization
 */

// Mock EventBus for testing
class MockEventBus {
    constructor() {
        this.events = new Map();
        this.emittedEvents = [];
    }
    
    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
    }
    
    emit(eventName, data) {
        this.emittedEvents.push({ eventName, data, timestamp: Date.now() });
        if (this.events.has(eventName)) {
            this.events.get(eventName).forEach(callback => callback(data));
        }
    }
    
    off(eventName, callback) {
        if (this.events.has(eventName)) {
            const callbacks = this.events.get(eventName);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    getInstance() { return this; }
}

// Mock BaseManager
class MockBaseManager {
    constructor() {
        this._initialized = false;
    }
    
    isInitialized() {
        return this._initialized;
    }
    
    setInitialized() {
        this._initialized = true;
    }
    
    destroy() {
        // Mock cleanup
    }
}

// Mock EventNames
const EventNames = {
    LEVEL_COMPLETE: 'level:complete',
    BOSS_DEFEATED: 'boss:defeated',
    CLONE_FORGE_COMPLETE: 'clone:forgeComplete',
    PERFORMANCE_METRIC_RECORDED: 'performance:metricRecorded'
};

// Enhanced PerformanceMonitor (simplified for testing)
class TestablePerformanceMonitor extends MockBaseManager {
    constructor(mockEventBus) {
        super();
        if (this.isInitialized()) return;
        this.init(mockEventBus);
    }
    
    init(mockEventBus) {
        this.debug = true;
        this.eventBus = mockEventBus;
        
        // Basic performance metrics
        this.fps = 60;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.timeAccumulator = 0;
        
        // Physics metrics
        this.physicsSteps = 0;
        this.physicsTime = 0;
        this.physicsObjects = 0;
        
        // Memory usage
        this.memoryUsage = 0;
        this.memoryPeak = 0;
        
        // Game-specific metrics
        this.gameMetrics = {
            runsCompleted: 0,
            bossesDefeated: 0,
            clonesForged: 0,
            averageRunTime: 0,
            bestRunScore: { S: 0, C: 0, H: 0, R: 0, B: 0 },
            totalPlayTime: 0,
            performanceWarnings: 0
        };
        
        // Historical data
        this.fpsHistory = [];
        this.deltaHistory = [];
        this.physicsHistory = [];
        
        // Performance thresholds
        this.thresholds = {
            fpsCritical: 20,
            fpsWarning: 40,
            deltaWarning: 33.33,
            memoryWarning: 512,
            physicsWarning: 16.67
        };
        
        // Metrics collection
        this.metricsCollection = {
            enabled: true,
            interval: 5000,
            lastCollection: Date.now(),
            samples: []
        };
        
        this.playTimeStart = Date.now();
        this.setupEventListeners();
        this.setInitialized();
    }
    
    setupEventListeners() {
        this.eventBus.on(EventNames.LEVEL_COMPLETE, this.handleRunComplete.bind(this));
        this.eventBus.on(EventNames.BOSS_DEFEATED, this.handleBossDefeated.bind(this));
        this.eventBus.on(EventNames.CLONE_FORGE_COMPLETE, this.handleCloneForged.bind(this));
        this.eventBus.on(EventNames.PERFORMANCE_METRIC_RECORDED, this.handlePerformanceWarning.bind(this));
    }
    
    handleRunComplete(data) {
        this.gameMetrics.runsCompleted++;
        
        if (data.runTime) {
            const totalTime = this.gameMetrics.averageRunTime * (this.gameMetrics.runsCompleted - 1) + data.runTime;
            this.gameMetrics.averageRunTime = totalTime / this.gameMetrics.runsCompleted;
        }
        
        if (data.runScore) {
            const current = this.gameMetrics.bestRunScore;
            const newScore = data.runScore;
            
            if ((newScore.S + newScore.C + newScore.H + newScore.R + newScore.B) > 
                (current.S + current.C + current.H + current.R + current.B)) {
                this.gameMetrics.bestRunScore = { ...newScore };
            }
        }
    }
    
    handleBossDefeated(data) {
        this.gameMetrics.bossesDefeated++;
    }
    
    handleCloneForged(data) {
        this.gameMetrics.clonesForged++;
    }
    
    handlePerformanceWarning(data) {
        // Performance warning handler
    }
    
    update(time, delta) {
        this.deltaTime = delta;
        
        // Add to historical data
        this.deltaHistory.push(delta);
        if (this.deltaHistory.length > 100) {
            this.deltaHistory.shift();
        }
        
        // Calculate FPS
        this.frameCount++;
        this.timeAccumulator += delta;
        
        if (this.timeAccumulator >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / this.timeAccumulator);
            this.frameCount = 0;
            this.timeAccumulator = 0;
            
            this.fpsHistory.push(this.fps);
            if (this.fpsHistory.length > 100) {
                this.fpsHistory.shift();
            }
            
            this.checkPerformanceThresholds();
        }
        
        if (this.playTimeStart) {
            this.gameMetrics.totalPlayTime = Date.now() - this.playTimeStart;
        }
    }
    
    checkPerformanceThresholds() {
        if (this.fps <= this.thresholds.fpsCritical) {
            this.gameMetrics.performanceWarnings++;
            this.eventBus.emit(EventNames.PERFORMANCE_METRIC_RECORDED, {
                type: 'fps_critical',
                value: this.fps,
                threshold: this.thresholds.fpsCritical,
                timestamp: Date.now()
            });
        } else if (this.fps <= this.thresholds.fpsWarning) {
            this.eventBus.emit(EventNames.PERFORMANCE_METRIC_RECORDED, {
                type: 'fps_warning',
                value: this.fps,
                threshold: this.thresholds.fpsWarning,
                timestamp: Date.now()
            });
        }
    }
    
    recordPhysicsMetrics(steps, time, objects = 0) {
        this.physicsSteps = steps;
        this.physicsTime = time;
        this.physicsObjects = objects;
        
        this.physicsHistory.push({ steps, time, objects, timestamp: Date.now() });
        if (this.physicsHistory.length > 100) {
            this.physicsHistory.shift();
        }
    }
    
    getAverageFPS() {
        if (this.fpsHistory.length === 0) return this.fps;
        
        const sum = this.fpsHistory.reduce((total, fps) => total + fps, 0);
        return Math.round(sum / this.fpsHistory.length);
    }
    
    getPerformanceStats() {
        return {
            current: {
                fps: this.fps,
                deltaTime: this.deltaTime,
                memoryUsage: this.memoryUsage,
                physicsTime: this.physicsTime
            },
            averages: {
                fps: this.getAverageFPS(),
                deltaTime: this.deltaHistory.length > 0 ? 
                    this.deltaHistory.reduce((sum, delta) => sum + delta, 0) / this.deltaHistory.length : 0
            },
            peaks: {
                memoryPeak: this.memoryPeak,
                worstFPS: this.fpsHistory.length > 0 ? Math.min(...this.fpsHistory) : this.fps,
                worstDelta: this.deltaHistory.length > 0 ? Math.max(...this.deltaHistory) : this.deltaTime
            },
            gameMetrics: { ...this.gameMetrics },
            warnings: this.gameMetrics.performanceWarnings
        };
    }
    
    serialize() {
        return {
            gameMetrics: { ...this.gameMetrics },
            memoryPeak: this.memoryPeak,
            thresholds: { ...this.thresholds },
            metricsCollection: {
                enabled: this.metricsCollection.enabled,
                interval: this.metricsCollection.interval,
                samples: this.metricsCollection.samples.slice(-10)
            }
        };
    }
    
    deserialize(state) {
        if (state.gameMetrics) {
            this.gameMetrics = { ...this.gameMetrics, ...state.gameMetrics };
        }
        
        if (state.memoryPeak) {
            this.memoryPeak = state.memoryPeak;
        }
        
        if (state.thresholds) {
            this.thresholds = { ...this.thresholds, ...state.thresholds };
        }
        
        if (state.metricsCollection) {
            this.metricsCollection = { 
                ...this.metricsCollection, 
                ...state.metricsCollection,
                lastCollection: Date.now()
            };
        }
        
        this.playTimeStart = Date.now();
    }
    
    resetGameMetrics() {
        this.gameMetrics = {
            runsCompleted: 0,
            bossesDefeated: 0,
            clonesForged: 0,
            averageRunTime: 0,
            bestRunScore: { S: 0, C: 0, H: 0, R: 0, B: 0 },
            totalPlayTime: 0,
            performanceWarnings: 0
        };
        
        this.playTimeStart = Date.now();
    }
}

// Test Runner
function runPerformanceMonitoringTests() {
    console.log('Testing Enhanced Performance Monitoring...');
    
    // Test 1: Basic Initialization
    const mockEventBus = new MockEventBus();
    const monitor = new TestablePerformanceMonitor(mockEventBus);
    
    assert(monitor.isInitialized(), 'Performance monitor should initialize');
    assert.strictEqual(monitor.gameMetrics.runsCompleted, 0, 'Should start with 0 runs');
    assert.strictEqual(monitor.fps, 60, 'Should start with 60 FPS');
    console.log('✓ Basic initialization test passed');
    
    // Test 2: Game Metrics Tracking
    mockEventBus.emit(EventNames.LEVEL_COMPLETE, {
        runTime: 120000, // 2 minutes
        runScore: { S: 80, C: 65, H: 10, R: 5, B: 15 }
    });
    
    assert.strictEqual(monitor.gameMetrics.runsCompleted, 1, 'Should track run completion');
    assert.strictEqual(monitor.gameMetrics.averageRunTime, 120000, 'Should track average run time');
    assert.strictEqual(monitor.gameMetrics.bestRunScore.S, 80, 'Should track best score');
    console.log('✓ Game metrics tracking test passed');
    
    // Test 3: Boss Defeat Tracking
    mockEventBus.emit(EventNames.BOSS_DEFEATED, { bossId: 'the-pulsar' });
    mockEventBus.emit(EventNames.BOSS_DEFEATED, { bossId: 'the-clumper' });
    
    assert.strictEqual(monitor.gameMetrics.bossesDefeated, 2, 'Should track boss defeats');
    console.log('✓ Boss defeat tracking test passed');
    
    // Test 4: Clone Forging Tracking
    mockEventBus.emit(EventNames.CLONE_FORGE_COMPLETE, { laneId: 1 });
    mockEventBus.emit(EventNames.CLONE_FORGE_COMPLETE, { laneId: 2 });
    mockEventBus.emit(EventNames.CLONE_FORGE_COMPLETE, { laneId: 3 });
    
    assert.strictEqual(monitor.gameMetrics.clonesForged, 3, 'Should track clone forging');
    console.log('✓ Clone forging tracking test passed');
    
    // Test 5: Performance Threshold Warnings
    monitor.fps = 15; // Below critical threshold (20)
    monitor.checkPerformanceThresholds();
    
    assert.strictEqual(monitor.gameMetrics.performanceWarnings, 1, 'Should increment warning count');
    
    const criticalWarning = mockEventBus.emittedEvents.find(e => 
        e.eventName === EventNames.PERFORMANCE_METRIC_RECORDED && 
        e.data.type === 'fps_critical'
    );
    assert(criticalWarning, 'Should emit critical FPS warning');
    assert.strictEqual(criticalWarning.data.value, 15, 'Should report correct FPS value');
    console.log('✓ Performance threshold warnings test passed');
    
    // Test 6: Historical Data Management
    // Simulate frame updates
    for (let i = 0; i < 50; i++) {
        monitor.update(i * 16.67, 16.67); // 60 FPS simulation
    }
    
    assert(monitor.deltaHistory.length > 0, 'Should collect delta history');
    assert(monitor.deltaHistory.length <= 100, 'Should limit history to 100 entries');
    console.log('✓ Historical data management test passed');
    
    // Test 7: Physics Metrics Recording
    monitor.recordPhysicsMetrics(2, 8.5, 42);
    
    assert.strictEqual(monitor.physicsSteps, 2, 'Should record physics steps');
    assert.strictEqual(monitor.physicsTime, 8.5, 'Should record physics time');
    assert.strictEqual(monitor.physicsObjects, 42, 'Should record physics objects');
    assert.strictEqual(monitor.physicsHistory.length, 1, 'Should add to physics history');
    console.log('✓ Physics metrics recording test passed');
    
    // Test 8: Performance Statistics
    const stats = monitor.getPerformanceStats();
    
    assert(typeof stats.current === 'object', 'Should provide current metrics');
    assert(typeof stats.averages === 'object', 'Should provide averages');
    assert(typeof stats.peaks === 'object', 'Should provide peaks');
    assert(typeof stats.gameMetrics === 'object', 'Should provide game metrics');
    assert.strictEqual(stats.warnings, 1, 'Should report warning count');
    console.log('✓ Performance statistics test passed');
    
    // Test 9: Serialization/Deserialization
    const serialized = monitor.serialize();
    
    assert(typeof serialized === 'object', 'Should serialize to object');
    assert(serialized.gameMetrics, 'Should serialize game metrics');
    assert(serialized.thresholds, 'Should serialize thresholds');
    
    const newMonitor = new TestablePerformanceMonitor(mockEventBus);
    newMonitor.deserialize(serialized);
    
    assert.strictEqual(newMonitor.gameMetrics.runsCompleted, 1, 'Should restore run count');
    assert.strictEqual(newMonitor.gameMetrics.bossesDefeated, 2, 'Should restore boss count');
    assert.strictEqual(newMonitor.gameMetrics.clonesForged, 3, 'Should restore clone count');
    console.log('✓ Serialization/deserialization test passed');
    
    // Test 10: Metrics Reset
    monitor.resetGameMetrics();
    
    assert.strictEqual(monitor.gameMetrics.runsCompleted, 0, 'Should reset runs');
    assert.strictEqual(monitor.gameMetrics.bossesDefeated, 0, 'Should reset bosses');
    assert.strictEqual(monitor.gameMetrics.clonesForged, 0, 'Should reset clones');
    assert(monitor.playTimeStart > 0, 'Should reset play time start');
    console.log('✓ Metrics reset test passed');
    
    // Test 11: Average Run Time Calculation
    mockEventBus.emit(EventNames.LEVEL_COMPLETE, { runTime: 90000 }); // 1.5 minutes
    mockEventBus.emit(EventNames.LEVEL_COMPLETE, { runTime: 150000 }); // 2.5 minutes
    
    const expectedAverage = (90000 + 150000) / 2; // 120000ms
    assert.strictEqual(monitor.gameMetrics.averageRunTime, expectedAverage, 'Should calculate correct average run time');
    console.log('✓ Average run time calculation test passed');
    
    // Test 12: Best Score Tracking
    mockEventBus.emit(EventNames.LEVEL_COMPLETE, {
        runScore: { S: 100, C: 80, H: 5, R: 10, B: 20 } // Total: 215
    });
    mockEventBus.emit(EventNames.LEVEL_COMPLETE, {
        runScore: { S: 90, C: 85, H: 8, R: 12, B: 25 } // Total: 220 (higher)
    });
    
    const bestScore = monitor.gameMetrics.bestRunScore;
    assert.strictEqual(bestScore.S, 90, 'Should update to better score');
    assert.strictEqual(bestScore.B, 25, 'Should update all components of better score');
    console.log('✓ Best score tracking test passed');
    
    console.log('✅ All Enhanced Performance Monitoring tests passed!');
}

module.exports = {
    runPerformanceMonitoringTests
};

// Run if called directly
if (require.main === module) {
    runPerformanceMonitoringTests();
}