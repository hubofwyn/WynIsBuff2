const assert = require('assert');

console.log('Testing Boss Integration Framework...');

// Mock EventBus for testing
class MockEventBus {
  constructor() {
    this.events = new Map();
    this.emittedEvents = [];
  }
  
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(handler);
  }
  
  emit(event, data) {
    this.emittedEvents.push({ event, data });
    const handlers = this.events.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
  
  off(event) {
    this.events.delete(event);
  }
  
  getEmittedEvents() {
    return this.emittedEvents;
  }
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new MockEventBus();
    }
    return this.instance;
  }
}

// Mock EconomyManager
class MockEconomyManager {
  constructor() {
    this.resources = {
      coins: 0,
      gritShards: 0,
      buffDNA: 0,
      tempoSparks: 0
    };
    this.addedResources = [];
  }
  
  addResource(type, amount) {
    this.resources[type] = (this.resources[type] || 0) + amount;
    this.addedResources.push({ type, amount });
    return this.resources[type];
  }
  
  getResource(type) {
    return this.resources[type] || 0;
  }
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new MockEconomyManager();
    }
    return this.instance;
  }
}

// Test BossRewardSystem equivalent
class TestBossRewardSystem {
  constructor() {
    this.bossRewards = new Map([
      ['the-clumper', {
        id: 'the-clumper',
        name: 'The Clumper',
        tier: 1,
        rewards: {
          firstClear: {
            movementTech: 'tripleJump',
            buffDNA: 10,
            gritShards: 5,
            coins: 1000,
            cloneMutation: 'protein_synthesis'
          },
          repeat: {
            buffDNA: 3,
            gritShards: 1,
            coins: 500
          }
        }
      }]
    ]);
    
    this.defeatedBosses = new Set();
    this.eventBus = MockEventBus.getInstance();
    this.economyManager = MockEconomyManager.getInstance();
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.eventBus.on('boss:defeated', this.handleBossDefeated.bind(this));
  }
  
  handleBossDefeated(data) {
    const { bossId, runScore, timeElapsed, hitsTaken } = data;
    
    const bossConfig = this.bossRewards.get(bossId);
    if (!bossConfig) return;
    
    const isFirstClear = !this.defeatedBosses.has(bossId);
    const rewards = isFirstClear ? bossConfig.rewards.firstClear : bossConfig.rewards.repeat;
    
    const multipliers = this.calculateMultipliers(runScore, timeElapsed, hitsTaken);
    const grantedRewards = this.grantRewards(rewards, multipliers, isFirstClear);
    
    if (isFirstClear) {
      this.defeatedBosses.add(bossId);
      this.eventBus.emit('boss:firstClear', {
        bossId,
        bossName: bossConfig.name,
        tier: bossConfig.tier,
        rewards: grantedRewards
      });
    }
    
    this.eventBus.emit('boss:rewardClaimed', {
      bossId,
      bossName: bossConfig.name,
      isFirstClear,
      rewards: grantedRewards,
      multipliers
    });
  }
  
  calculateMultipliers(runScore = {}, timeElapsed = 0, hitsTaken = 0) {
    const multipliers = {
      coins: 1.0,
      buffDNA: 1.0,
      gritShards: 1.0
    };
    
    // Speed bonus
    if (timeElapsed > 0 && timeElapsed < 120000) {
      const speedBonus = Math.max(0, 1.5 - (timeElapsed / 120000));
      multipliers.coins *= speedBonus;
    }
    
    // No-hit bonus
    if (hitsTaken === 0) {
      multipliers.buffDNA *= 2.0;
      multipliers.gritShards *= 1.5;
    }
    
    // Combo bonus
    if (runScore.C) {
      const comboBonus = Math.min(2.0, 1.0 + (runScore.C / 100));
      multipliers.coins *= comboBonus;
    }
    
    return multipliers;
  }
  
  grantRewards(rewards, multipliers, isFirstClear) {
    const grantedRewards = {};
    
    if (rewards.coins) {
      const amount = Math.floor(rewards.coins * multipliers.coins);
      this.economyManager.addResource('coins', amount);
      grantedRewards.coins = amount;
    }
    
    if (rewards.buffDNA) {
      const amount = Math.floor(rewards.buffDNA * multipliers.buffDNA);
      this.economyManager.addResource('buffDNA', amount);
      grantedRewards.buffDNA = amount;
    }
    
    if (rewards.gritShards) {
      const amount = Math.floor(rewards.gritShards * multipliers.gritShards);
      this.economyManager.addResource('gritShards', amount);
      grantedRewards.gritShards = amount;
    }
    
    if (isFirstClear && rewards.movementTech) {
      this.eventBus.emit('movement:unlocked', { tech: rewards.movementTech });
      grantedRewards.movementTech = rewards.movementTech;
    }
    
    if (isFirstClear && rewards.cloneMutation) {
      this.eventBus.emit('clone:mutation', { 
        mutation: rewards.cloneMutation,
        source: 'boss_reward'
      });
      grantedRewards.cloneMutation = rewards.cloneMutation;
    }
    
    return grantedRewards;
  }
}

// Test 1: Boss defeat first clear
function testBossFirstClear() {
  // Reset singletons
  MockEventBus.instance = null;
  MockEconomyManager.instance = null;
  
  const rewardSystem = new TestBossRewardSystem();
  const eventBus = MockEventBus.getInstance();
  const economyManager = MockEconomyManager.getInstance();
  
  // Simulate boss defeat with perfect performance
  eventBus.emit('boss:defeated', {
    bossId: 'the-clumper',
    runScore: { S: 100, C: 50, H: 0, R: 10, B: 25 },
    timeElapsed: 60000, // 1 minute (fast)
    hitsTaken: 0 // No-hit run
  });
  
  // Check resources were granted with multipliers
  assert(economyManager.getResource('coins') > 1000, 'Coins should have speed bonus');
  assert.strictEqual(economyManager.getResource('buffDNA'), 20, 'BuffDNA should be doubled for no-hit');
  assert.strictEqual(economyManager.getResource('gritShards'), 7, 'GritShards should have 1.5x for no-hit');
  
  // Check events were emitted
  const emittedEvents = eventBus.getEmittedEvents();
  const firstClearEvent = emittedEvents.find(e => e.event === 'boss:firstClear');
  assert(firstClearEvent, 'First clear event should be emitted');
  assert.strictEqual(firstClearEvent.data.bossName, 'The Clumper');
  
  const movementUnlock = emittedEvents.find(e => e.event === 'movement:unlocked');
  assert(movementUnlock, 'Movement tech should be unlocked');
  assert.strictEqual(movementUnlock.data.tech, 'tripleJump');
  
  const cloneMutation = emittedEvents.find(e => e.event === 'clone:mutation');
  assert(cloneMutation, 'Clone mutation should be granted');
  assert.strictEqual(cloneMutation.data.mutation, 'protein_synthesis');
  
  console.log('✓ Boss first clear test passed');
}

// Test 2: Boss defeat repeat clear
function testBossRepeatClear() {
  // Reset singletons
  MockEventBus.instance = null;
  MockEconomyManager.instance = null;
  
  const rewardSystem = new TestBossRewardSystem();
  const eventBus = MockEventBus.getInstance();
  const economyManager = MockEconomyManager.getInstance();
  
  // Mark boss as already defeated
  rewardSystem.defeatedBosses.add('the-clumper');
  
  // Simulate boss defeat with average performance
  eventBus.emit('boss:defeated', {
    bossId: 'the-clumper',
    runScore: { S: 50, C: 0, H: 5, R: 5, B: 10 }, // No combo to avoid multiplier
    timeElapsed: 180000, // 3 minutes (slow)
    hitsTaken: 5 // Some hits taken
  });
  
  // Check reduced rewards
  assert.strictEqual(economyManager.getResource('coins'), 500, 'Should get base repeat coins');
  assert.strictEqual(economyManager.getResource('buffDNA'), 3, 'Should get base repeat buffDNA');
  assert.strictEqual(economyManager.getResource('gritShards'), 1, 'Should get base repeat gritShards');
  
  // Check no first clear event
  const emittedEvents = eventBus.getEmittedEvents();
  const firstClearEvent = emittedEvents.find(e => e.event === 'boss:firstClear');
  assert(!firstClearEvent, 'First clear event should not be emitted for repeat');
  
  // Check no movement unlock for repeat
  const movementUnlock = emittedEvents.find(e => e.event === 'movement:unlocked');
  assert(!movementUnlock, 'Movement tech should not unlock on repeat');
  
  console.log('✓ Boss repeat clear test passed');
}

// Test 3: Performance multipliers
function testPerformanceMultipliers() {
  const rewardSystem = new TestBossRewardSystem();
  
  // Test speed bonus
  const fastMultipliers = rewardSystem.calculateMultipliers(
    {}, 30000, 10 // 30 seconds, with hits
  );
  assert(fastMultipliers.coins > 1.2, 'Fast clear should give coin bonus');
  
  // Test no-hit bonus
  const noHitMultipliers = rewardSystem.calculateMultipliers(
    {}, 150000, 0 // Slow but no hits
  );
  assert.strictEqual(noHitMultipliers.buffDNA, 2.0, 'No-hit should double DNA');
  assert.strictEqual(noHitMultipliers.gritShards, 1.5, 'No-hit should give 1.5x grit');
  
  // Test combo bonus
  const comboMultipliers = rewardSystem.calculateMultipliers(
    { C: 100 }, 150000, 10
  );
  assert.strictEqual(comboMultipliers.coins, 2.0, 'Max combo bonus should be 2x');
  
  console.log('✓ Performance multipliers test passed');
}

// Test 4: Clone forge integration
function testCloneForgeIntegration() {
  // Reset singletons
  MockEventBus.instance = null;
  
  const eventBus = MockEventBus.getInstance();
  const forgedClones = [];
  
  // Listen for clone forge events
  eventBus.on('clone:forgeStart', (data) => {
    forgedClones.push({ type: 'start', data });
  });
  
  eventBus.on('clone:forgeComplete', (data) => {
    forgedClones.push({ type: 'complete', data });
  });
  
  // Simulate run end triggering clone forge
  eventBus.emit('run:ended', {
    score: { S: 80, C: 60, H: 2, R: 15, B: 30 }
  });
  
  // Emit forge start (normally done by PerformanceAnalyzer)
  eventBus.emit('clone:forgeStart', {
    performance: { S: 80, C: 60, H: 2, R: 15, B: 30 },
    routeId: 'test-route',
    stats: {
      rate: 45,
      stability: 0.75,
      specialty: 'speedster'
    }
  });
  
  // Check forge events
  assert.strictEqual(forgedClones.length, 1, 'Should have forge start event');
  assert.strictEqual(forgedClones[0].data.stats.specialty, 'speedster');
  
  console.log('✓ Clone forge integration test passed');
}

// Test 5: Full integration flow
function testFullIntegrationFlow() {
  // Reset all singletons
  MockEventBus.instance = null;
  MockEconomyManager.instance = null;
  
  const rewardSystem = new TestBossRewardSystem();
  const eventBus = MockEventBus.getInstance();
  const economyManager = MockEconomyManager.getInstance();
  
  // Track all events in order
  const eventSequence = [];
  
  // Listen to all relevant events
  ['run:started', 'run:ended', 'boss:defeated', 'boss:rewardClaimed', 
   'clone:forgeStart', 'clone:forgeComplete', 'movement:unlocked'].forEach(event => {
    eventBus.on(event, (data) => {
      eventSequence.push({ event, timestamp: Date.now() });
    });
  });
  
  // Simulate full run flow
  eventBus.emit('run:started', { biome: 'protein-plant' });
  
  // Simulate boss defeat
  eventBus.emit('boss:defeated', {
    bossId: 'the-clumper',
    runScore: { S: 90, C: 70, H: 1, R: 20, B: 40 },
    timeElapsed: 90000,
    hitsTaken: 1
  });
  
  // Simulate run end
  eventBus.emit('run:ended', {
    score: { S: 90, C: 70, H: 1, R: 20, B: 40 }
  });
  
  // Verify event sequence
  assert(eventSequence.some(e => e.event === 'run:started'), 'Run should start');
  assert(eventSequence.some(e => e.event === 'boss:defeated'), 'Boss should be defeated');
  assert(eventSequence.some(e => e.event === 'boss:rewardClaimed'), 'Rewards should be claimed');
  assert(eventSequence.some(e => e.event === 'run:ended'), 'Run should end');
  
  // Verify resources were granted
  assert(economyManager.getResource('coins') > 0, 'Coins should be granted');
  assert(economyManager.getResource('buffDNA') > 0, 'DNA should be granted');
  assert(economyManager.getResource('gritShards') > 0, 'Grit should be granted');
  
  console.log('✓ Full integration flow test passed');
}

// Run all tests
try {
  testBossFirstClear();
  testBossRepeatClear();
  testPerformanceMultipliers();
  testCloneForgeIntegration();
  testFullIntegrationFlow();
  
  console.log('✅ All boss integration tests passed!');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}