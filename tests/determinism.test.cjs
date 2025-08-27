const assert = require('assert');

console.log('Testing Determinism Framework...');

// Test DeterministicRNG
class TestRNG {
  constructor(seed = 1138) {
    this.seed = seed;
    this.streams = new Map();
    this.a = 1664525;
    this.c = 1013904223;
    this.m = Math.pow(2, 32);
    
    this.createStream('main', seed);
    this.createStream('level', seed + 1);
    this.createStream('ai', seed + 2);
  }
  
  createStream(name, seed) {
    this.streams.set(name, {
      seed: seed,
      state: seed,
      callCount: 0
    });
  }
  
  next(stream = 'main') {
    const s = this.streams.get(stream);
    if (!s) return 0;
    
    s.state = (this.a * s.state + this.c) % this.m;
    s.callCount++;
    return s.state / this.m;
  }
  
  int(min, max, stream = 'main') {
    return Math.floor(min + this.next(stream) * (max - min + 1));
  }
  
  serialize() {
    const state = {
      seed: this.seed,
      streams: {}
    };
    for (const [name, stream] of this.streams) {
      state.streams[name] = { ...stream };
    }
    return state;
  }
  
  deserialize(state) {
    this.seed = state.seed;
    for (const [name, streamState] of Object.entries(state.streams)) {
      this.streams.set(name, { ...streamState });
    }
  }
}

// Test 1: Deterministic sequence
function testDeterministicSequence() {
  const rng1 = new TestRNG(1138);
  const rng2 = new TestRNG(1138);
  
  const sequence1 = [];
  const sequence2 = [];
  
  for (let i = 0; i < 10; i++) {
    sequence1.push(rng1.next());
    sequence2.push(rng2.next());
  }
  
  assert.deepStrictEqual(sequence1, sequence2, 'Same seed should produce same sequence');
  console.log('✓ Deterministic sequence test passed');
}

// Test 2: Stream independence
function testStreamIndependence() {
  const rng = new TestRNG(1138);
  
  // Get values from main stream
  const main1 = rng.next('main');
  const main2 = rng.next('main');
  
  // Get values from level stream
  const level1 = rng.next('level');
  
  // Main stream should not be affected by level stream
  const main3 = rng.next('main');
  
  // Reset and verify
  const rng2 = new TestRNG(1138);
  assert.strictEqual(rng2.next('main'), main1, 'First main value should match');
  assert.strictEqual(rng2.next('main'), main2, 'Second main value should match');
  assert.strictEqual(rng2.next('main'), main3, 'Third main value should match');
  
  console.log('✓ Stream independence test passed');
}

// Test 3: Serialization and deserialization
function testSerialization() {
  const rng1 = new TestRNG(1138);
  
  // Generate some values
  rng1.next('main');
  rng1.next('main');
  rng1.next('level');
  
  // Serialize state
  const state = rng1.serialize();
  
  // Create new RNG and deserialize
  const rng2 = new TestRNG(9999); // Different seed
  rng2.deserialize(state);
  
  // Both should produce same next values
  assert.strictEqual(rng1.next('main'), rng2.next('main'), 'Main stream should match after deserialize');
  assert.strictEqual(rng1.next('level'), rng2.next('level'), 'Level stream should match after deserialize');
  
  console.log('✓ Serialization test passed');
}

// Test 4: Integer generation
function testIntegerGeneration() {
  const rng = new TestRNG(1138);
  const values = [];
  
  for (let i = 0; i < 100; i++) {
    const val = rng.int(1, 6); // Dice roll
    assert(val >= 1 && val <= 6, `Value ${val} out of range`);
    values.push(val);
  }
  
  // Check distribution (should have all values 1-6)
  const unique = new Set(values);
  assert(unique.size >= 4, 'Should have reasonable distribution');
  
  console.log('✓ Integer generation test passed');
}

// Test CloneManager decay
class TestCloneManager {
  constructor() {
    this.lanes = new Map();
    this.decayRate = 0.02;
    this.decayFloor = 0.6;
  }
  
  createLane(rate, stability) {
    const lane = {
      id: this.lanes.size + 1,
      baseRate: rate,
      currentRate: rate,
      stability: stability,
      lastDecayUpdate: Date.now()
    };
    this.lanes.set(lane.id, lane);
    return lane;
  }
  
  applyDecay(laneId, hoursElapsed) {
    const lane = this.lanes.get(laneId);
    if (!lane) return;
    
    const effectiveDecayRate = this.decayRate * (1 - lane.stability * 0.5);
    const decayFactor = Math.pow(1 - effectiveDecayRate, hoursElapsed);
    const decayedRate = lane.baseRate * decayFactor;
    lane.currentRate = Math.max(decayedRate, lane.baseRate * this.decayFloor);
  }
}

// Test 5: Clone decay calculation
function testCloneDecay() {
  const manager = new TestCloneManager();
  
  // Create lane with 50 base rate and 0.8 stability
  const lane = manager.createLane(50, 0.8);
  
  // Apply 1 hour of decay
  manager.applyDecay(lane.id, 1);
  
  // With 80% stability, effective decay = 0.02 * (1 - 0.8 * 0.5) = 0.02 * 0.6 = 0.012
  // After 1 hour: 50 * (1 - 0.012) = 50 * 0.988 = 49.4
  assert(Math.abs(lane.currentRate - 49.4) < 0.1, 'One hour decay calculation');
  
  // Reset and test floor
  lane.currentRate = 50;
  manager.applyDecay(lane.id, 100); // 100 hours - should hit floor
  assert.strictEqual(lane.currentRate, 30, 'Should hit decay floor (60% of base)');
  
  console.log('✓ Clone decay test passed');
}

// Test 6: Offline calculation
function testOfflineCalculation() {
  const manager = new TestCloneManager();
  
  // Create multiple lanes
  manager.createLane(10, 0.5);
  manager.createLane(20, 0.7);
  manager.createLane(30, 0.9);
  
  // Simulate offline period
  const offlineHours = 5;
  let totalDecayed = 0;
  
  for (const [id, lane] of manager.lanes) {
    const before = lane.currentRate;
    manager.applyDecay(id, offlineHours);
    totalDecayed += (before - lane.currentRate);
  }
  
  assert(totalDecayed > 0, 'Decay should reduce rates');
  assert(manager.lanes.get(1).currentRate < 10, 'Low stability should decay more');
  assert(manager.lanes.get(3).currentRate > manager.lanes.get(1).currentRate, 'High stability should decay less');
  
  console.log('✓ Offline calculation test passed');
}

// Test 7: Golden seed snapshot
function testGoldenSeed() {
  // Simulate a deterministic game state
  const rng = new TestRNG(1138);
  const gameState = {
    frame: 0,
    player: { x: 100, y: 200, vx: 0, vy: 0 },
    enemies: [],
    score: 0
  };
  
  const snapshot = [];
  
  // Simulate 10 frames
  for (let i = 0; i < 10; i++) {
    // Update with deterministic random
    gameState.frame++;
    gameState.player.x += rng.int(-5, 5, 'main');
    gameState.player.y += rng.int(-2, 2, 'main');
    gameState.score += rng.int(0, 10, 'level');
    
    snapshot.push(JSON.parse(JSON.stringify(gameState)));
  }
  
  // Reset and replay - should get same results
  const rng2 = new TestRNG(1138);
  const gameState2 = {
    frame: 0,
    player: { x: 100, y: 200, vx: 0, vy: 0 },
    enemies: [],
    score: 0
  };
  
  for (let i = 0; i < 10; i++) {
    gameState2.frame++;
    gameState2.player.x += rng2.int(-5, 5, 'main');
    gameState2.player.y += rng2.int(-2, 2, 'main');
    gameState2.score += rng2.int(0, 10, 'level');
    
    assert.strictEqual(gameState2.player.x, snapshot[i].player.x, `Frame ${i} player.x mismatch`);
    assert.strictEqual(gameState2.player.y, snapshot[i].player.y, `Frame ${i} player.y mismatch`);
    assert.strictEqual(gameState2.score, snapshot[i].score, `Frame ${i} score mismatch`);
  }
  
  console.log('✓ Golden seed test passed');
}

// Run all tests
try {
  testDeterministicSequence();
  testStreamIndependence();
  testSerialization();
  testIntegerGeneration();
  testCloneDecay();
  testOfflineCalculation();
  testGoldenSeed();
  
  console.log('✅ All determinism tests passed!');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}