const assert = require('assert');

/**
 * Full Game Loop Integration Test Suite
 * 
 * Tests the complete game flow from start to finish:
 * - Player runs a level
 * - Performance analysis
 * - Boss encounter and defeat
 * - Reward distribution
 * - Clone forging
 * - Factory production
 * - Resource accumulation
 * - Save/load persistence
 * - UI feedback coordination
 */

// Mock EventBus
class MockEventBus {
    constructor() {
        this.events = new Map();
        this.eventLog = [];
    }
    
    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
    }
    
    emit(eventName, data) {
        this.eventLog.push({ eventName, data, timestamp: Date.now() });
        if (this.events.has(eventName)) {
            this.events.get(eventName).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                }
            });
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
    
    getEventLog() { return [...this.eventLog]; }
    clearLog() { this.eventLog = []; }
}

// Mock BaseManager
class MockBaseManager {
    constructor() {
        this._initialized = false;
    }
    
    isInitialized() { return this._initialized; }
    setInitialized() { this._initialized = true; }
    
    static getInstance() {
        if (!this._instance) {
            this._instance = new this();
        }
        return this._instance;
    }
}

// EventNames constants
const EventNames = {
    // Run events
    LEVEL_COMPLETE: 'level:complete',
    RUN_STATISTICS_COMPLETE: 'run:statisticsComplete',
    
    // Boss events
    BOSS_DEFEATED: 'boss:defeated',
    BOSS_REWARD_CLAIMED: 'boss:rewardClaimed',
    BOSS_FIRST_CLEAR: 'boss:firstClear',
    
    // Clone events
    CLONE_FORGE_START: 'clone:forgeStart',
    CLONE_FORGE_COMPLETE: 'clone:forgeComplete',
    
    // Resource events
    RESOURCE_GAINED: 'economy:resourceGained',
    
    // Performance events
    PERFORMANCE_METRIC_RECORDED: 'performance:metricRecorded',
    
    // Offline events
    OFFLINE_CALCULATED: 'offline:calculated'
};

// Game Loop Components
class TestPerformanceAnalyzer extends MockBaseManager {
    constructor(eventBus) {
        super();
        this.eventBus = eventBus;
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        this.debug = true;
        this.eventBus.on(EventNames.LEVEL_COMPLETE, this.handleLevelComplete.bind(this));
        this.setInitialized();
    }
    
    handleLevelComplete(data) {
        const stats = this.analyzeRunPerformance(data.runData);
        
        this.eventBus.emit(EventNames.RUN_STATISTICS_COMPLETE, {
            routeId: data.routeId || 'test-route',
            performance: stats.performance,
            stats: stats.cloneStats,
            grade: stats.grade
        });
    }
    
    analyzeRunPerformance(runData) {
        const performance = {
            S: runData.score || 75,
            C: runData.combos || 20,
            H: runData.hits || 3,
            R: runData.rarity || 5,
            B: runData.bosses || 1
        };
        
        const cloneStats = {
            rate: Math.max(5, performance.S / 10 + performance.C / 5),
            stability: Math.max(0.1, Math.min(1.0, 1.0 - (performance.H * 0.1))),
            specialty: this.determineSpecialty(performance)
        };
        
        const totalScore = performance.S + performance.C + performance.H + performance.R + performance.B;
        let grade = 'F';
        if (totalScore >= 90) grade = 'S';
        else if (totalScore >= 75) grade = 'A';
        else if (totalScore >= 60) grade = 'B';
        else if (totalScore >= 45) grade = 'C';
        else if (totalScore >= 30) grade = 'D';
        
        return { performance, cloneStats, grade };
    }
    
    determineSpecialty(performance) {
        if (performance.S > performance.C && performance.S > 60) return 'speedster';
        if (performance.C > 30) return 'comboist';
        if (performance.H < 5) return 'survivor';
        if (performance.R > 10) return 'explorer';
        if (performance.B > 0) return 'warrior';
        return 'balanced';
    }
}

class TestBossRewardSystem extends MockBaseManager {
    constructor(eventBus) {
        super();
        this.eventBus = eventBus;
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        this.defeatedBosses = new Set();
        this.bossRewards = new Map([
            ['test-boss', {
                id: 'test-boss',
                name: 'Test Boss',
                rewards: {
                    firstClear: { energy: 1000, essence: 10, movementTech: 'testJump' },
                    repeat: { energy: 500, essence: 3 }
                }
            }]
        ]);
        
        this.eventBus.on(EventNames.BOSS_DEFEATED, this.handleBossDefeated.bind(this));
        this.setInitialized();
    }
    
    handleBossDefeated(data) {
        const bossConfig = this.bossRewards.get(data.bossId);
        if (!bossConfig) return;
        
        const isFirstClear = !this.defeatedBosses.has(data.bossId);
        const rewards = isFirstClear ? bossConfig.rewards.firstClear : bossConfig.rewards.repeat;
        
        // Calculate multipliers
        const multipliers = this.calculateMultipliers(data.runScore, data.timeElapsed, data.hitsTaken);
        
        // Grant rewards
        const grantedRewards = {};
        Object.keys(rewards).forEach(key => {
            if (typeof rewards[key] === 'number' && multipliers[key]) {
                grantedRewards[key] = Math.floor(rewards[key] * multipliers[key]);
            } else {
                grantedRewards[key] = rewards[key];
            }
        });
        
        if (isFirstClear) {
            this.defeatedBosses.add(data.bossId);
            this.eventBus.emit(EventNames.BOSS_FIRST_CLEAR, {
                bossId: data.bossId,
                bossName: bossConfig.name,
                rewards: grantedRewards
            });
        }
        
        this.eventBus.emit(EventNames.BOSS_REWARD_CLAIMED, {
            bossId: data.bossId,
            isFirstClear,
            rewards: grantedRewards,
            multipliers
        });
    }
    
    calculateMultipliers(runScore = {}, timeElapsed = 0, hitsTaken = 0) {
        const multipliers = { energy: 1.0, essence: 1.0 };
        
        // Speed bonus
        if (timeElapsed > 0 && timeElapsed < 120000) {
            const speedBonus = Math.max(0, 1.5 - (timeElapsed / 120000));
            multipliers.energy *= speedBonus;
        }
        
        // No-hit bonus
        if (hitsTaken === 0) {
            multipliers.essence *= 2.0;
        }
        
        return multipliers;
    }
    
    serialize() {
        return { defeatedBosses: Array.from(this.defeatedBosses) };
    }
    
    deserialize(state) {
        if (state.defeatedBosses) {
            this.defeatedBosses = new Set(state.defeatedBosses);
        }
    }
}

class TestEnhancedCloneManager extends MockBaseManager {
    constructor(eventBus) {
        super();
        this.eventBus = eventBus;
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        this.debug = true;
        this.lanes = new Map();
        this.nextLaneId = 1;
        this.lastUpdateTime = Date.now();
        
        this.eventBus.on(EventNames.CLONE_FORGE_START, this.handleForgeRequest.bind(this));
        this.setInitialized();
    }
    
    handleForgeRequest(data) {
        const lane = this.createCloneLane({
            rate: data.stats.rate,
            stability: data.stats.stability,
            specialty: data.stats.specialty,
            performance: data.performance,
            routeId: data.routeId
        });
        
        this.eventBus.emit(EventNames.CLONE_FORGE_COMPLETE, {
            laneId: lane.id,
            rate: lane.currentRate,
            stability: lane.stability,
            specialty: lane.specialty
        });
        
        return lane;
    }
    
    createCloneLane(cloneData) {
        const lane = {
            id: this.nextLaneId++,
            baseRate: cloneData.rate || 10,
            currentRate: cloneData.rate || 10,
            stability: cloneData.stability || 0.7,
            specialty: cloneData.specialty || 'balanced',
            createdAt: Date.now(),
            lastProduction: Date.now(),
            totalProduced: { coins: 0, grit: 0, sparks: 0 },
            performance: cloneData.performance,
            routeId: cloneData.routeId
        };
        
        this.lanes.set(lane.id, lane);
        return lane;
    }
    
    calculateOfflineProduction(lastSaveTime) {
        const now = Date.now();
        const deltaMs = now - lastSaveTime;
        const cappedMs = Math.min(deltaMs, 10 * 3600000); // 10 hour cap
        
        const totalProduction = { coins: 0, grit: 0, sparks: 0 };
        const laneProductions = [];
        
        for (const [laneId, lane] of this.lanes) {
            const production = this.calculateLaneProduction(laneId, cappedMs);
            
            totalProduction.coins += production.coins;
            totalProduction.grit += production.grit;
            totalProduction.sparks += production.sparks;
            
            laneProductions.push({ laneId, specialty: lane.specialty, production });
            
            lane.totalProduced.coins += production.coins;
            lane.totalProduced.grit += production.grit;
            lane.totalProduced.sparks += production.sparks;
        }
        
        this.eventBus.emit(EventNames.OFFLINE_CALCULATED, {
            timeElapsed: deltaMs,
            timeCapped: cappedMs,
            wasLimited: deltaMs > cappedMs,
            production: totalProduction,
            laneCount: this.lanes.size
        });
        
        return {
            timeElapsed: deltaMs,
            production: totalProduction,
            laneProductions
        };
    }
    
    calculateLaneProduction(laneId, deltaMs) {
        const lane = this.lanes.get(laneId);
        if (!lane) return { coins: 0, grit: 0, sparks: 0 };
        
        const rate = lane.currentRate;
        const seconds = deltaMs / 1000;
        const production = { coins: 0, grit: 0, sparks: 0 };
        
        switch (lane.specialty) {
            case 'speedster':
                production.coins = rate * seconds * 1.2;
                production.grit = rate * seconds * 0.3;
                break;
            case 'comboist':
                production.coins = rate * seconds * 0.8;
                production.grit = rate * seconds * 0.8;
                break;
            default:
                production.coins = rate * seconds * 0.7;
                production.grit = rate * seconds * 0.7;
                production.sparks = rate * seconds * 0.05;
        }
        
        return production;
    }
    
    getAllLaneStats() {
        const stats = [];
        for (const [laneId, lane] of this.lanes) {
            stats.push({
                id: laneId,
                specialty: lane.specialty,
                baseRate: lane.baseRate,
                currentRate: lane.currentRate,
                stability: lane.stability,
                totalProduced: { ...lane.totalProduced },
                age: Date.now() - lane.createdAt
            });
        }
        return stats;
    }
    
    serialize() {
        return {
            lanes: Array.from(this.lanes.entries()),
            nextLaneId: this.nextLaneId,
            lastUpdateTime: this.lastUpdateTime
        };
    }
    
    deserialize(state) {
        if (state.lanes) {
            this.lanes = new Map(state.lanes);
        }
        if (state.nextLaneId) {
            this.nextLaneId = state.nextLaneId;
        }
        if (state.lastUpdateTime) {
            this.lastUpdateTime = state.lastUpdateTime;
        }
    }
}

class TestEconomyManager extends MockBaseManager {
    constructor(eventBus) {
        super();
        this.eventBus = eventBus;
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        this.resources = {
            energy: 1000,
            matter: 500,
            timeCrystals: 25,
            essence: 10
        };
        
        this.eventBus.on(EventNames.BOSS_REWARD_CLAIMED, this.handleBossReward.bind(this));
        this.eventBus.on(EventNames.OFFLINE_CALCULATED, this.handleOfflineProduction.bind(this));
        this.setInitialized();
    }
    
    handleBossReward(data) {
        if (data.rewards.energy) {
            this.addResource('energy', data.rewards.energy);
        }
        if (data.rewards.essence) {
            this.addResource('essence', data.rewards.essence);
        }
    }
    
    handleOfflineProduction(data) {
        // Convert clone production to resources
        const production = data.production;
        
        this.addResource('energy', Math.floor(production.coins));
        this.addResource('matter', Math.floor(production.grit));
        
        if (production.sparks > 0) {
            this.addResource('timeCrystals', Math.floor(production.sparks));
        }
    }
    
    addResource(type, amount) {
        if (this.resources.hasOwnProperty(type) && amount > 0) {
            this.resources[type] += amount;
            
            this.eventBus.emit(EventNames.RESOURCE_GAINED, {
                type,
                amount,
                total: this.resources[type]
            });
        }
    }
    
    getResource(type) {
        return this.resources[type] || 0;
    }
    
    getAllResources() {
        return { ...this.resources };
    }
    
    serialize() {
        return { resources: { ...this.resources } };
    }
    
    deserialize(state) {
        if (state.resources) {
            this.resources = { ...this.resources, ...state.resources };
        }
    }
}

class TestGameStateManager extends MockBaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }
    
    init() {
        this.saveData = new Map();
        this.setInitialized();
    }
    
    getManagerInstances(eventBus) {
        return {
            economyManager: new TestEconomyManager(eventBus),
            bossRewardSystem: new TestBossRewardSystem(eventBus),
            enhancedCloneManager: new TestEnhancedCloneManager(eventBus),
            performanceAnalyzer: new TestPerformanceAnalyzer(eventBus)
        };
    }
    
    saveAllManagers(managers) {
        const saveData = { timestamp: Date.now(), version: '2.0.0' };
        
        for (const [name, manager] of Object.entries(managers)) {
            if (manager && typeof manager.serialize === 'function') {
                saveData[name] = manager.serialize();
            }
        }
        
        this.saveData.set('managers', saveData);
        return true;
    }
    
    loadAllManagers(managers) {
        const saveData = this.saveData.get('managers');
        if (!saveData) return false;
        
        for (const [name, manager] of Object.entries(managers)) {
            if (manager && typeof manager.deserialize === 'function' && saveData[name]) {
                manager.deserialize(saveData[name]);
            }
        }
        
        return true;
    }
}

// Full Game Loop Test Runner
function runFullGameLoopTests() {
    console.log('Testing Full Game Loop Integration...');
    
    // Initialize system
    const eventBus = new MockEventBus();
    const gameStateManager = new TestGameStateManager();
    const managers = gameStateManager.getManagerInstances(eventBus);
    
    // Test 1: Complete Run → Boss → Reward → Clone → Production Flow
    console.log('Starting full game loop test...');
    
    // Step 1: Player completes a level
    const runData = {
        score: 85,
        combos: 25,
        hits: 2,
        rarity: 8,
        bosses: 1,
        timeElapsed: 95000,
        routeId: 'test-route-1'
    };
    
    eventBus.emit(EventNames.LEVEL_COMPLETE, { runData, routeId: 'test-route-1' });
    
    // Verify performance analysis occurred
    const perfEvents = eventBus.getEventLog().filter(e => e.eventName === EventNames.RUN_STATISTICS_COMPLETE);
    assert.strictEqual(perfEvents.length, 1, 'Should emit run statistics');
    
    const perfData = perfEvents[0].data;
    assert(perfData.stats, 'Should include clone stats');
    assert(perfData.performance, 'Should include performance data');
    assert.strictEqual(perfData.routeId, 'test-route-1', 'Should preserve route ID');
    console.log('✓ Performance analysis step completed');
    
    // Step 2: Boss encounter and defeat
    eventBus.emit(EventNames.BOSS_DEFEATED, {
        bossId: 'test-boss',
        runScore: perfData.performance,
        timeElapsed: runData.timeElapsed,
        hitsTaken: runData.hits
    });
    
    // Verify boss rewards
    const bossRewardEvents = eventBus.getEventLog().filter(e => e.eventName === EventNames.BOSS_REWARD_CLAIMED);
    assert.strictEqual(bossRewardEvents.length, 1, 'Should emit boss reward claimed');
    
    const bossReward = bossRewardEvents[0].data;
    assert(bossReward.rewards, 'Should include granted rewards');
    assert(bossReward.isFirstClear, 'Should be first clear');
    assert(bossReward.multipliers, 'Should include performance multipliers');
    console.log('✓ Boss defeat and reward step completed');
    
    // Step 3: Clone forging from performance
    eventBus.emit(EventNames.CLONE_FORGE_START, {
        performance: perfData.performance,
        routeId: perfData.routeId,
        stats: perfData.stats
    });
    
    // Verify clone creation
    const cloneEvents = eventBus.getEventLog().filter(e => e.eventName === EventNames.CLONE_FORGE_COMPLETE);
    assert.strictEqual(cloneEvents.length, 1, 'Should emit clone forge complete');
    
    const cloneData = cloneEvents[0].data;
    assert(cloneData.laneId, 'Should have lane ID');
    assert(cloneData.rate > 0, 'Should have production rate');
    assert.strictEqual(cloneData.specialty, perfData.stats.specialty, 'Should preserve specialty');
    console.log('✓ Clone forging step completed');
    
    // Step 4: Verify resource accumulation
    const resourceEvents = eventBus.getEventLog().filter(e => e.eventName === EventNames.RESOURCE_GAINED);
    assert(resourceEvents.length > 0, 'Should generate resource events');
    
    const energyGains = resourceEvents.filter(e => e.data.type === 'energy');
    assert(energyGains.length > 0, 'Should gain energy from boss rewards');
    console.log('✓ Resource accumulation step completed');
    
    // Test 2: Offline Production Calculation
    const originalSaveTime = Date.now() - 3600000; // 1 hour ago
    const offlineResult = managers.enhancedCloneManager.calculateOfflineProduction(originalSaveTime);
    
    assert(offlineResult.production, 'Should calculate offline production');
    assert(offlineResult.production.coins > 0, 'Should produce coins offline');
    assert(offlineResult.laneProductions.length > 0, 'Should track per-lane production');
    
    const offlineEvents = eventBus.getEventLog().filter(e => e.eventName === EventNames.OFFLINE_CALCULATED);
    assert.strictEqual(offlineEvents.length, 1, 'Should emit offline calculation event');
    console.log('✓ Offline production calculation completed');
    
    // Test 3: Save/Load Persistence
    const initialEnergy = managers.economyManager.getResource('energy');
    const initialLanes = managers.enhancedCloneManager.getAllLaneStats().length;
    const initialBosses = managers.bossRewardSystem.defeatedBosses.size;
    
    // Save current state
    const saveResult = gameStateManager.saveAllManagers(managers);
    assert(saveResult, 'Should save game state successfully');
    
    // Create new managers (simulate game restart)
    const newManagers = gameStateManager.getManagerInstances(eventBus);
    
    // Verify initial state is different
    assert.strictEqual(newManagers.economyManager.getResource('energy'), 1000, 'New managers should have default energy');
    assert.strictEqual(newManagers.enhancedCloneManager.getAllLaneStats().length, 0, 'New managers should have no lanes');
    assert.strictEqual(newManagers.bossRewardSystem.defeatedBosses.size, 0, 'New managers should have no defeated bosses');
    
    // Load saved state
    const loadResult = gameStateManager.loadAllManagers(newManagers);
    assert(loadResult, 'Should load game state successfully');
    
    // Verify state restoration
    assert.strictEqual(newManagers.economyManager.getResource('energy'), initialEnergy, 'Should restore energy');
    assert.strictEqual(newManagers.enhancedCloneManager.getAllLaneStats().length, initialLanes, 'Should restore lanes');
    assert.strictEqual(newManagers.bossRewardSystem.defeatedBosses.size, initialBosses, 'Should restore defeated bosses');
    console.log('✓ Save/load persistence completed');
    
    // Test 4: Multi-Run Progression
    // Create fresh eventBus for clean test
    const multiRunEventBus = new MockEventBus();
    const multiRunManagers = gameStateManager.getManagerInstances(multiRunEventBus);
    
    // Copy state from previous test
    multiRunManagers.economyManager.deserialize(newManagers.economyManager.serialize());
    multiRunManagers.bossRewardSystem.deserialize(newManagers.bossRewardSystem.serialize());
    multiRunManagers.enhancedCloneManager.deserialize(newManagers.enhancedCloneManager.serialize());
    
    const initialLaneCount = multiRunManagers.enhancedCloneManager.getAllLaneStats().length;
    
    // Run multiple game loops
    for (let i = 0; i < 3; i++) {
        const multiRunData = {
            score: 70 + i * 10,
            combos: 15 + i * 5,
            hits: 3 - i,
            rarity: 5 + i * 2,
            bosses: 1,
            timeElapsed: 100000 - i * 5000,
            routeId: `multi-route-${i}`
        };
        
        // Complete level
        multiRunEventBus.emit(EventNames.LEVEL_COMPLETE, { runData: multiRunData, routeId: multiRunData.routeId });
        
        // Defeat boss (repeat defeats)
        multiRunEventBus.emit(EventNames.BOSS_DEFEATED, {
            bossId: 'test-boss',
            runScore: { S: multiRunData.score, C: multiRunData.combos, H: multiRunData.hits, R: multiRunData.rarity, B: multiRunData.bosses },
            timeElapsed: multiRunData.timeElapsed,
            hitsTaken: multiRunData.hits
        });
        
        // Forge clone
        const perfEvent = multiRunEventBus.getEventLog().filter(e => 
            e.eventName === EventNames.RUN_STATISTICS_COMPLETE && 
            e.data.routeId === multiRunData.routeId
        ).pop();
        
        if (perfEvent) {
            multiRunEventBus.emit(EventNames.CLONE_FORGE_START, {
                performance: perfEvent.data.performance,
                routeId: perfEvent.data.routeId,
                stats: perfEvent.data.stats
            });
        }
    }
    
    // Verify progression (count events from the multi-run test only)
    const multiRunCloneEvents = multiRunEventBus.getEventLog().filter(e => e.eventName === EventNames.CLONE_FORGE_COMPLETE);
    assert.strictEqual(multiRunCloneEvents.length, 3, 'Should create 3 additional clones');
    
    const finalLanes = multiRunManagers.enhancedCloneManager.getAllLaneStats();
    assert.strictEqual(finalLanes.length, initialLaneCount + 3, `Should have ${initialLaneCount + 3} total lanes (${initialLaneCount} + 3)`); // Original + 3 new
    
    // Verify each lane has different stats based on performance
    const lanes = finalLanes.slice(-3); // Get the 3 new lanes
    assert(lanes[0].baseRate !== lanes[1].baseRate || lanes[1].baseRate !== lanes[2].baseRate, 
           'Lanes should have different rates based on performance');
    console.log('✓ Multi-run progression completed');
    
    // Test 5: Resource Economy Balance
    const finalResources = multiRunManagers.economyManager.getAllResources();
    
    assert(finalResources.energy > 1000, 'Should have accumulated energy from boss rewards');
    assert(finalResources.matter >= 500, 'Should have accumulated matter from production');
    
    // Verify resource gains are proportional to performance
    const energyEvents = multiRunEventBus.getEventLog().filter(e => 
        e.eventName === EventNames.RESOURCE_GAINED && e.data.type === 'energy'
    );
    
    const totalEnergyGained = energyEvents.reduce((sum, event) => sum + event.data.amount, 0);
    assert(totalEnergyGained > 0, 'Should have gained energy from various sources');
    console.log('✓ Resource economy balance verified');
    
    // Test 6: Event Flow Integrity
    const eventLog = multiRunEventBus.getEventLog();
    const eventTypes = [...new Set(eventLog.map(e => e.eventName))];
    
    // Verify all expected event types were fired
    const expectedEvents = [
        EventNames.LEVEL_COMPLETE,
        EventNames.RUN_STATISTICS_COMPLETE,
        EventNames.BOSS_DEFEATED,
        EventNames.BOSS_REWARD_CLAIMED,
        EventNames.CLONE_FORGE_START,
        EventNames.CLONE_FORGE_COMPLETE,
        EventNames.RESOURCE_GAINED
    ];
    
    expectedEvents.forEach(eventName => {
        assert(eventTypes.includes(eventName), `Should include ${eventName} events`);
    });
    
    // Verify event ordering makes sense
    const levelCompleteIndex = eventLog.findIndex(e => e.eventName === EventNames.LEVEL_COMPLETE);
    const statisticsCompleteIndex = eventLog.findIndex(e => e.eventName === EventNames.RUN_STATISTICS_COMPLETE);
    const bossDefeatedIndex = eventLog.findIndex(e => e.eventName === EventNames.BOSS_DEFEATED);
    const rewardClaimedIndex = eventLog.findIndex(e => e.eventName === EventNames.BOSS_REWARD_CLAIMED);
    
    assert(levelCompleteIndex < statisticsCompleteIndex, 'Level complete should come before statistics');
    assert(bossDefeatedIndex < rewardClaimedIndex, 'Boss defeated should come before reward claimed');
    console.log('✓ Event flow integrity verified');
    
    // Test 7: Performance Impact Analysis
    const performanceEvents = eventLog.filter(e => e.eventName === EventNames.RUN_STATISTICS_COMPLETE);
    
    performanceEvents.forEach((event, index) => {
        const stats = event.data.stats;
        const performance = event.data.performance;
        
        // Verify performance impacts clone stats correctly
        assert(stats.rate > 0, 'Clone rate should be positive');
        assert(stats.stability >= 0 && stats.stability <= 1, 'Stability should be between 0 and 1');
        assert(['speedster', 'comboist', 'survivor', 'explorer', 'warrior', 'balanced'].includes(stats.specialty), 
               'Specialty should be valid');
        
        // Verify better performance leads to better stats
        if (index > 0) {
            const prevStats = performanceEvents[index - 1].data.stats;
            const prevPerf = performanceEvents[index - 1].data.performance;
            
            const currentTotal = performance.S + performance.C + performance.R + performance.B - performance.H;
            const prevTotal = prevPerf.S + prevPerf.C + prevPerf.R + prevPerf.B - prevPerf.H;
            
            if (currentTotal > prevTotal) {
                assert(stats.rate >= prevStats.rate * 0.8, 'Better performance should generally lead to better clone stats');
            }
        }
    });
    console.log('✓ Performance impact analysis completed');
    
    // Test 8: System Recovery and Error Handling
    // Simulate event handler errors
    let errorHandled = false;
    multiRunEventBus.on('test:error', () => {
        throw new Error('Test error');
    });
    
    // This should not crash the system
    multiRunEventBus.emit('test:error');
    errorHandled = true;
    
    assert(errorHandled, 'System should handle event handler errors gracefully');
    console.log('✓ System recovery and error handling verified');
    
    console.log('✅ All Full Game Loop Integration tests passed!');
    
    // Summary statistics
    console.log('\n📊 Game Loop Test Summary:');
    console.log(`- Total events processed: ${eventLog.length}`);
    console.log(`- Unique event types: ${eventTypes.length}`);
    console.log(`- Final lanes created: ${finalLanes.length}`);
    console.log(`- Final energy: ${finalResources.energy}`);
    console.log(`- Bosses defeated: ${multiRunManagers.bossRewardSystem.defeatedBosses.size}`);
    console.log(`- Test duration: ${Date.now() - eventLog[0]?.timestamp || 0}ms`);
}

module.exports = {
    runFullGameLoopTests
};

// Run if called directly
if (require.main === module) {
    runFullGameLoopTests();
}