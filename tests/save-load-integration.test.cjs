const assert = require('assert');

/**
 * Save/Load Integration Test Suite
 * 
 * Tests complete save/load functionality across all managers:
 * - GameStateManager coordination
 * - Manager serialization/deserialization
 * - Data integrity verification
 * - Cross-system state consistency
 * - Error handling and recovery
 */

// Mock localStorage for testing
class MockLocalStorage {
    constructor() {
        this.storage = new Map();
    }
    
    getItem(key) {
        return this.storage.get(key) || null;
    }
    
    setItem(key, value) {
        this.storage.set(key, value);
    }
    
    removeItem(key) {
        this.storage.delete(key);
    }
    
    clear() {
        this.storage.clear();
    }
}

// Mock EventBus
class MockEventBus {
    constructor() {
        this.events = new Map();
    }
    
    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
    }
    
    emit(eventName, data) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).forEach(callback => callback(data));
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
    
    static getInstance() {
        if (!this._instance) {
            this._instance = new this();
        }
        return this._instance;
    }
}

// Test Manager Classes
class TestEconomyManager extends MockBaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        this.resources = {
            energy: 1000,
            matter: 500,
            timeCrystals: 50,
            essence: 25
        };
        
        this.multipliers = {
            energy: 1.0,
            matter: 1.0,
            timeCrystals: 1.0,
            essence: 1.0
        };
        
        this.setInitialized();
    }
    
    addResource(type, amount) {
        if (this.resources.hasOwnProperty(type)) {
            this.resources[type] += amount;
        }
    }
    
    serialize() {
        return {
            resources: { ...this.resources },
            multipliers: { ...this.multipliers }
        };
    }
    
    deserialize(state) {
        if (state.resources) {
            this.resources = { ...this.resources, ...state.resources };
        }
        if (state.multipliers) {
            this.multipliers = { ...this.multipliers, ...state.multipliers };
        }
    }
}

class TestBossRewardSystem extends MockBaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        this.defeatedBosses = new Set();
        this.setInitialized();
    }
    
    defeatBoss(bossId) {
        this.defeatedBosses.add(bossId);
    }
    
    serialize() {
        return {
            defeatedBosses: Array.from(this.defeatedBosses)
        };
    }
    
    deserialize(state) {
        if (state.defeatedBosses) {
            this.defeatedBosses = new Set(state.defeatedBosses);
        }
    }
}

class TestEnhancedCloneManager extends MockBaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        this.lanes = new Map();
        this.nextLaneId = 1;
        this.setInitialized();
    }
    
    createCloneLane(data) {
        const lane = {
            id: this.nextLaneId++,
            baseRate: data.rate || 10,
            currentRate: data.rate || 10,
            stability: data.stability || 0.7,
            specialty: data.specialty || 'balanced',
            createdAt: Date.now(),
            totalProduced: { coins: 0, grit: 0, sparks: 0 }
        };
        
        this.lanes.set(lane.id, lane);
        return lane;
    }
    
    serialize() {
        return {
            lanes: Array.from(this.lanes.entries()),
            nextLaneId: this.nextLaneId
        };
    }
    
    deserialize(state) {
        if (state.lanes) {
            this.lanes = new Map(state.lanes);
        }
        if (state.nextLaneId) {
            this.nextLaneId = state.nextLaneId;
        }
    }
}

class TestPerformanceMonitor extends MockBaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        this.gameMetrics = {
            runsCompleted: 0,
            bossesDefeated: 0,
            clonesForged: 0,
            averageRunTime: 0,
            bestRunScore: { S: 0, C: 0, H: 0, R: 0, B: 0 },
            totalPlayTime: 0,
            performanceWarnings: 0
        };
        
        this.memoryPeak = 0;
        this.setInitialized();
    }
    
    recordRun(runTime, score) {
        this.gameMetrics.runsCompleted++;
        
        if (runTime) {
            const totalTime = this.gameMetrics.averageRunTime * (this.gameMetrics.runsCompleted - 1) + runTime;
            this.gameMetrics.averageRunTime = totalTime / this.gameMetrics.runsCompleted;
        }
        
        if (score) {
            const current = this.gameMetrics.bestRunScore;
            const newScore = score;
            
            if ((newScore.S + newScore.C + newScore.H + newScore.R + newScore.B) > 
                (current.S + current.C + current.H + current.R + current.B)) {
                this.gameMetrics.bestRunScore = { ...newScore };
            }
        }
    }
    
    serialize() {
        return {
            gameMetrics: { ...this.gameMetrics },
            memoryPeak: this.memoryPeak
        };
    }
    
    deserialize(state) {
        if (state.gameMetrics) {
            this.gameMetrics = { ...this.gameMetrics, ...state.gameMetrics };
        }
        if (state.memoryPeak) {
            this.memoryPeak = state.memoryPeak;
        }
    }
}

// Test GameStateManager
class TestGameStateManager extends MockBaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        this.localStorage = new MockLocalStorage();
        this.eventBus = new MockEventBus();
        this.setInitialized();
    }
    
    getManagerInstances() {
        return {
            economyManager: TestEconomyManager.getInstance(),
            bossRewardSystem: TestBossRewardSystem.getInstance(),
            enhancedCloneManager: TestEnhancedCloneManager.getInstance(),
            performanceMonitor: TestPerformanceMonitor.getInstance()
        };
    }
    
    saveAllManagers() {
        const saveData = {
            timestamp: Date.now(),
            version: '2.0.0'
        };
        
        const managers = this.getManagerInstances();
        
        for (const [name, manager] of Object.entries(managers)) {
            if (manager && typeof manager.serialize === 'function') {
                try {
                    saveData[name] = manager.serialize();
                } catch (error) {
                    console.error(`Failed to serialize ${name}:`, error);
                    return false;
                }
            }
        }
        
        try {
            this.localStorage.setItem('wynisbuff2_managers', JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }
    
    loadAllManagers() {
        try {
            const savedData = this.localStorage.getItem('wynisbuff2_managers');
            if (!savedData) {
                return false;
            }
            
            const saveData = JSON.parse(savedData);
            const managers = this.getManagerInstances();
            
            for (const [name, manager] of Object.entries(managers)) {
                if (manager && typeof manager.deserialize === 'function' && saveData[name]) {
                    try {
                        manager.deserialize(saveData[name]);
                    } catch (error) {
                        console.error(`Failed to deserialize ${name}:`, error);
                        return false;
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return false;
        }
    }
    
    verifyDataIntegrity() {
        const managers = this.getManagerInstances();
        const issues = [];
        
        // Check EconomyManager
        const economy = managers.economyManager;
        if (economy.resources.energy < 0 || economy.resources.matter < 0) {
            issues.push('Negative resource values detected');
        }
        
        // Check BossRewardSystem
        const bossReward = managers.bossRewardSystem;
        if (bossReward.defeatedBosses.size < 0) {
            issues.push('Invalid defeated bosses count');
        }
        
        // Check EnhancedCloneManager
        const cloneManager = managers.enhancedCloneManager;
        if (cloneManager.nextLaneId < 1) {
            issues.push('Invalid next lane ID');
        }
        
        // Check PerformanceMonitor
        const perfMon = managers.performanceMonitor;
        if (perfMon.gameMetrics.runsCompleted < 0 || perfMon.gameMetrics.averageRunTime < 0) {
            issues.push('Invalid performance metrics');
        }
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }
    
    // Test-specific method to corrupt data
    corruptSaveData() {
        this.localStorage.setItem('wynisbuff2_managers', '{"invalid": json}');
    }
}

// Test Runner
function runSaveLoadIntegrationTests() {
    console.log('Testing Save/Load Integration...');
    
    // Reset singleton instances for clean testing
    TestEconomyManager._instance = null;
    TestBossRewardSystem._instance = null;
    TestEnhancedCloneManager._instance = null;
    TestPerformanceMonitor._instance = null;
    TestGameStateManager._instance = null;
    
    // Test 1: Basic Save/Load Functionality
    const gameStateManager = TestGameStateManager.getInstance();
    const economyManager = TestEconomyManager.getInstance();
    const bossRewardSystem = TestBossRewardSystem.getInstance();
    const cloneManager = TestEnhancedCloneManager.getInstance();
    const performanceMonitor = TestPerformanceMonitor.getInstance();
    
    // Modify some initial state
    economyManager.addResource('energy', 500);
    economyManager.addResource('essence', 75);
    bossRewardSystem.defeatBoss('the-pulsar');
    bossRewardSystem.defeatBoss('the-clumper');
    
    const lane1 = cloneManager.createCloneLane({ rate: 15, specialty: 'speedster' });
    const lane2 = cloneManager.createCloneLane({ rate: 12, specialty: 'comboist' });
    
    performanceMonitor.recordRun(90000, { S: 85, C: 70, H: 5, R: 8, B: 12 });
    performanceMonitor.recordRun(105000, { S: 92, C: 65, H: 3, R: 10, B: 15 });
    
    // Save state
    const saveSuccess = gameStateManager.saveAllManagers();
    assert(saveSuccess, 'Save operation should succeed');
    console.log('✓ Basic save functionality test passed');
    
    // Test 2: Data Integrity Verification
    const integrityCheck = gameStateManager.verifyDataIntegrity();
    assert(integrityCheck.isValid, `Data should be valid: ${integrityCheck.issues.join(', ')}`);
    console.log('✓ Data integrity verification test passed');
    
    // Test 3: Load and Verify State Restoration
    // Reset managers to default state
    TestEconomyManager._instance = null;
    TestBossRewardSystem._instance = null;
    TestEnhancedCloneManager._instance = null;
    TestPerformanceMonitor._instance = null;
    
    const newEconomyManager = TestEconomyManager.getInstance();
    const newBossRewardSystem = TestBossRewardSystem.getInstance();
    const newCloneManager = TestEnhancedCloneManager.getInstance();
    const newPerformanceMonitor = TestPerformanceMonitor.getInstance();
    
    // Verify initial state is default
    assert.strictEqual(newEconomyManager.resources.energy, 1000, 'Should start with default energy');
    assert.strictEqual(newBossRewardSystem.defeatedBosses.size, 0, 'Should start with no defeated bosses');
    assert.strictEqual(newCloneManager.lanes.size, 0, 'Should start with no lanes');
    assert.strictEqual(newPerformanceMonitor.gameMetrics.runsCompleted, 0, 'Should start with no runs');
    
    // Load state
    const loadSuccess = gameStateManager.loadAllManagers();
    assert(loadSuccess, 'Load operation should succeed');
    
    // Verify state restoration
    assert.strictEqual(newEconomyManager.resources.energy, 1500, 'Should restore energy (1000 + 500)');
    assert.strictEqual(newEconomyManager.resources.essence, 100, 'Should restore essence (25 + 75)');
    assert(newBossRewardSystem.defeatedBosses.has('the-pulsar'), 'Should restore defeated boss: the-pulsar');
    assert(newBossRewardSystem.defeatedBosses.has('the-clumper'), 'Should restore defeated boss: the-clumper');
    assert.strictEqual(newCloneManager.lanes.size, 2, 'Should restore clone lanes');
    assert.strictEqual(newCloneManager.nextLaneId, 3, 'Should restore next lane ID');
    assert.strictEqual(newPerformanceMonitor.gameMetrics.runsCompleted, 2, 'Should restore run count');
    assert.strictEqual(newPerformanceMonitor.gameMetrics.averageRunTime, 97500, 'Should restore average run time');
    assert.strictEqual(newPerformanceMonitor.gameMetrics.bestRunScore.S, 92, 'Should restore best score');
    
    console.log('✓ State restoration test passed');
    
    // Test 4: Cross-System State Consistency
    const restoredLane = newCloneManager.lanes.get(1);
    assert(restoredLane, 'Lane 1 should be restored');
    assert.strictEqual(restoredLane.specialty, 'speedster', 'Lane specialty should be preserved');
    assert.strictEqual(restoredLane.baseRate, 15, 'Lane base rate should be preserved');
    
    const restoredLane2 = newCloneManager.lanes.get(2);
    assert(restoredLane2, 'Lane 2 should be restored');
    assert.strictEqual(restoredLane2.specialty, 'comboist', 'Lane 2 specialty should be preserved');
    console.log('✓ Cross-system state consistency test passed');
    
    // Test 5: Error Handling - Corrupt Save Data
    gameStateManager.corruptSaveData();
    
    // Reset managers again
    TestEconomyManager._instance = null;
    TestBossRewardSystem._instance = null;
    TestEnhancedCloneManager._instance = null;
    TestPerformanceMonitor._instance = null;
    
    const corruptTestEconomy = TestEconomyManager.getInstance();
    const corruptLoadSuccess = gameStateManager.loadAllManagers();
    
    assert(!corruptLoadSuccess, 'Load should fail with corrupt data');
    assert.strictEqual(corruptTestEconomy.resources.energy, 1000, 'Should maintain default state on load failure');
    console.log('✓ Error handling for corrupt save data test passed');
    
    // Test 6: Save Data Version and Timestamp
    TestEconomyManager._instance = null;
    TestBossRewardSystem._instance = null;
    TestEnhancedCloneManager._instance = null;
    TestPerformanceMonitor._instance = null;
    TestGameStateManager._instance = null;
    
    const freshGameState = TestGameStateManager.getInstance();
    const freshEconomy = TestEconomyManager.getInstance();
    
    freshEconomy.addResource('energy', 250);
    const saveResult = freshGameState.saveAllManagers();
    assert(saveResult, 'Fresh save should succeed');
    
    const savedDataString = freshGameState.localStorage.getItem('wynisbuff2_managers');
    const savedData = JSON.parse(savedDataString);
    
    assert(savedData.timestamp, 'Save data should include timestamp');
    assert.strictEqual(savedData.version, '2.0.0', 'Save data should include version');
    assert(savedData.economyManager, 'Save data should include economy manager data');
    assert.strictEqual(savedData.economyManager.resources.energy, 1250, 'Save data should contain correct values');
    console.log('✓ Save data structure and metadata test passed');
    
    // Test 7: Partial Save/Load (missing manager)
    // Simulate a scenario where one manager fails to serialize
    const partialSaveEconomy = TestEconomyManager.getInstance();
    partialSaveEconomy.serialize = function() {
        throw new Error('Serialization failed');
    };
    
    const partialSaveResult = freshGameState.saveAllManagers();
    assert(!partialSaveResult, 'Save should fail if any manager fails to serialize');
    console.log('✓ Partial save failure handling test passed');
    
    // Test 8: Load with Missing Data Fields
    freshGameState.localStorage.setItem('wynisbuff2_managers', JSON.stringify({
        timestamp: Date.now(),
        version: '2.0.0',
        economyManager: {
            resources: { energy: 2000 }
            // Missing multipliers field
        }
    }));
    
    TestEconomyManager._instance = null;
    const partialLoadEconomy = TestEconomyManager.getInstance();
    const partialLoadResult = freshGameState.loadAllManagers();
    
    assert(partialLoadResult, 'Load should succeed with partial data');
    assert.strictEqual(partialLoadEconomy.resources.energy, 2000, 'Should load available data');
    assert.strictEqual(partialLoadEconomy.multipliers.energy, 1.0, 'Should maintain default for missing data');
    console.log('✓ Partial load handling test passed');
    
    // Test 9: Data Integrity After Multiple Save/Load Cycles
    TestEconomyManager._instance = null;
    TestBossRewardSystem._instance = null;
    TestEnhancedCloneManager._instance = null;
    TestPerformanceMonitor._instance = null;
    TestGameStateManager._instance = null;
    
    const cycleGameState = TestGameStateManager.getInstance();
    const cycleEconomy = TestEconomyManager.getInstance();
    const cycleBoss = TestBossRewardSystem.getInstance();
    
    // Perform multiple save/load cycles
    for (let i = 0; i < 5; i++) {
        cycleEconomy.addResource('energy', 100);
        cycleBoss.defeatBoss(`boss-${i}`);
        
        const cyclesSave = cycleGameState.saveAllManagers();
        assert(cyclesSave, `Save cycle ${i + 1} should succeed`);
        
        const cyclesLoad = cycleGameState.loadAllManagers();
        assert(cyclesLoad, `Load cycle ${i + 1} should succeed`);
    }
    
    assert.strictEqual(cycleEconomy.resources.energy, 1500, 'Should accumulate energy correctly (1000 + 5*100)');
    assert.strictEqual(cycleBoss.defeatedBosses.size, 5, 'Should have 5 defeated bosses');
    
    const finalIntegrityCheck = cycleGameState.verifyDataIntegrity();
    assert(finalIntegrityCheck.isValid, `Data integrity should be maintained after cycles: ${finalIntegrityCheck.issues.join(', ')}`);
    console.log('✓ Multiple save/load cycles test passed');
    
    // Test 10: Large Data Handling
    TestEnhancedCloneManager._instance = null;
    const largeClonesManager = TestEnhancedCloneManager.getInstance();
    
    // Create many clone lanes
    for (let i = 0; i < 100; i++) {
        largeClonesManager.createCloneLane({
            rate: 10 + (i % 20),
            specialty: ['speedster', 'comboist', 'survivor', 'explorer', 'warrior'][i % 5]
        });
    }
    
    const largeSave = cycleGameState.saveAllManagers();
    assert(largeSave, 'Should handle large datasets');
    
    TestEnhancedCloneManager._instance = null;
    const restoredLargeClonesManager = TestEnhancedCloneManager.getInstance();
    const largeLoad = cycleGameState.loadAllManagers();
    
    assert(largeLoad, 'Should load large datasets');
    assert.strictEqual(restoredLargeClonesManager.lanes.size, 100, 'Should restore all 100 lanes');
    assert.strictEqual(restoredLargeClonesManager.nextLaneId, 101, 'Should maintain correct next ID');
    console.log('✓ Large data handling test passed');
    
    console.log('✅ All Save/Load Integration tests passed!');
}

module.exports = {
    runSaveLoadIntegrationTests
};

// Run if called directly
if (require.main === module) {
    runSaveLoadIntegrationTests();
}