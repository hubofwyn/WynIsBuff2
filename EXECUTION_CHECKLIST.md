# WynIsBuff2 - Execution Checklist
## Immediate Actions for Core Loop Integration

**Sprint Start**: 2025-01-27  
**Target**: Playable core loop in 7 days

---

## 🚀 Day 1-2: Event Architecture & Performance Analysis

### Morning Session (Parallel Work)

#### Task 1A: Lock Event Contracts
```javascript
// Add to src/constants/EventNames.js
export const EventNames = {
  // ... existing events ...
  
  // Run lifecycle (NEW)
  RUN_START: 'run:start',
  RUN_END: 'run:end',
  RUN_PAUSE: 'run:pause',
  RUN_RESUME: 'run:resume',
  
  // Clone forging (NEW)
  FORGE_REQUEST: 'forge:request',
  FORGE_CREATED: 'forge:created',
  FORGE_FAILED: 'forge:failed',
  
  // Boss rewards (NEW)
  BOSS_DEFEATED: 'boss:defeated',
  REWARD_GRANTED: 'reward:granted',
  MOVEMENT_UNLOCKED: 'movement:unlocked',
  
  // Offline/Idle (NEW)
  OFFLINE_CALCULATED: 'offline:calculated',
  IDLE_BOOST_APPLIED: 'idle:boost:applied',
  IDLE_DECAY_APPLIED: 'idle:decay:applied'
};
```

**Verification**:
- [ ] All events added to EventNames.js
- [ ] No naming conflicts
- [ ] Namespace consistency maintained

#### Task 1B: Create Performance Analyzer
```javascript
// Create src/modules/analytics/PerformanceAnalyzer.js
import { BaseManager } from '@features/core';

export class PerformanceAnalyzer extends BaseManager {
  constructor() {
    super();
    if (this.isInitialized()) return;
    this.init();
  }
  
  init() {
    this.performanceWeights = {
      speed: 0.12,
      combo: 0.03,
      hitless: 0.15,
      rarity: 0.05,
      boss: 1.0
    };
    this.setInitialized();
  }
  
  analyzeRun(runData) {
    // Implementation here
  }
  
  mapToCloneStats(performance, routeTier) {
    // Implementation here
  }
}
```

**Verification**:
- [ ] Extends BaseManager properly
- [ ] Singleton pattern works
- [ ] Calculations are deterministic

---

### Afternoon Session (Integration)

#### Task 2: Wire Results Scene
```javascript
// Update src/scenes/ResultsScene.js
import { PerformanceAnalyzer } from '@features/analytics';
import { CloneManager } from '@features/idle';
import { EventNames } from '../constants/EventNames.js';

export class ResultsScene extends Phaser.Scene {
  create(runData) {
    // Display run stats
    this.displayRunStats(runData);
    
    // Analyze performance
    const analyzer = PerformanceAnalyzer.getInstance();
    const performance = analyzer.analyzeRun(runData);
    const cloneStats = analyzer.mapToCloneStats(performance, runData.routeTier);
    
    // Show performance breakdown
    this.displayPerformance(performance);
    
    // Forge clone button
    this.createForgeButton(() => {
      this.eventSystem.emit(EventNames.FORGE_REQUEST, {
        performance,
        routeId: runData.routeId,
        stats: cloneStats
      });
      
      this.scene.start(SceneKeys.FACTORY);
    });
  }
}
```

**Verification**:
- [ ] Scene receives run data correctly
- [ ] Performance calculation works
- [ ] Event emission verified
- [ ] Scene transition smooth

---

## 🚀 Day 3-4: Determinism Framework

### Morning Session

#### Task 3A: Fixed Timestep Implementation
```javascript
// Update src/core/PhysicsManager.js
export class PhysicsManager extends BaseManager {
  constructor() {
    super();
    if (this.isInitialized()) return;
    this.initDeterministic();
  }
  
  initDeterministic() {
    this.fixedTimestep = 1/120; // 120Hz
    this.accumulator = 0;
    this.maxSubsteps = 8;
    this.interpolation = true;
    
    // Initialize Rapier with deterministic settings
    this.world = new RAPIER.World({ x: 0, y: 9.81 });
    this.world.maxVelocityIterations = 8;
    this.world.maxPositionIterations = 3;
    
    this.setInitialized();
  }
  
  update(deltaTime) {
    // Cap delta to prevent spiral of death
    deltaTime = Math.min(deltaTime, 0.25);
    this.accumulator += deltaTime;
    
    let substeps = 0;
    while (this.accumulator >= this.fixedTimestep && substeps < this.maxSubsteps) {
      this.fixedUpdate(this.fixedTimestep);
      this.accumulator -= this.fixedTimestep;
      substeps++;
    }
    
    // Calculate interpolation alpha for rendering
    this.alpha = this.accumulator / this.fixedTimestep;
  }
}
```

**Verification**:
- [ ] Fixed timestep stable at different frame rates
- [ ] No physics explosions
- [ ] Interpolation smooth
- [ ] Deterministic across runs

#### Task 3B: Deterministic RNG
```javascript
// Create src/core/DeterministicRNG.js
export class DeterministicRNG {
  constructor(seed = 1138) {
    this.seed = seed;
    this.streams = new Map();
    this.createStream('main', seed);
    this.createStream('level', seed + 1);
    this.createStream('ai', seed + 2);
    this.createStream('particles', seed + 3);
  }
  
  createStream(name, seed) {
    this.streams.set(name, {
      seed: seed,
      state: seed
    });
  }
  
  next(stream = 'main') {
    const s = this.streams.get(stream);
    s.state = (s.state * 1103515245 + 12345) & 0x7fffffff;
    return s.state / 0x7fffffff;
  }
  
  range(min, max, stream = 'main') {
    return min + this.next(stream) * (max - min);
  }
  
  int(min, max, stream = 'main') {
    return Math.floor(this.range(min, max + 1, stream));
  }
}
```

**Verification**:
- [ ] Same seed produces same sequence
- [ ] Streams are independent
- [ ] Range functions work correctly
- [ ] State serializable

---

### Afternoon Session

#### Task 4: Golden Seed Testing
```javascript
// Create tests/determinism.test.cjs
const assert = require('assert');

function testDeterminism() {
  console.log('Testing determinism with golden seed 1138...');
  
  // Run game with seed 1138
  const run1 = runGameWithSeed(1138);
  const snapshot1 = captureSnapshot(run1);
  
  // Run again with same seed
  const run2 = runGameWithSeed(1138);
  const snapshot2 = captureSnapshot(run2);
  
  // Compare snapshots
  assert.deepEqual(snapshot1.positions, snapshot2.positions, 'Positions must match');
  assert.deepEqual(snapshot1.velocities, snapshot2.velocities, 'Velocities must match');
  assert.deepEqual(snapshot1.events, snapshot2.events, 'Events must match');
  
  console.log('✅ Determinism test passed!');
}

function captureSnapshot(gameState) {
  return {
    positions: gameState.entities.map(e => ({ x: e.x, y: e.y })),
    velocities: gameState.entities.map(e => ({ vx: e.vx, vy: e.vy })),
    events: gameState.eventLog
  };
}
```

**Verification**:
- [ ] Test passes consistently
- [ ] Cross-platform validation
- [ ] Different frame rates produce same result
- [ ] Save/load preserves determinism

---

## 🚀 Day 5-6: Clone System Integration

### Morning Session

#### Task 5A: Enhanced Clone Manager
```javascript
// Update src/core/CloneManager.js
export class CloneManager extends BaseManager {
  constructor() {
    super();
    if (this.isInitialized()) return;
    this.initEnhanced();
  }
  
  initEnhanced() {
    this.lanes = new Map();
    this.decayRate = 0.02; // 2% per hour
    this.decayFloor = 0.6;
    this.boostQueue = [];
    this.offlineCapHours = 10;
    
    // Listen for forge requests
    this.eventSystem.on(EventNames.FORGE_REQUEST, this.handleForgeRequest.bind(this));
    
    this.setInitialized();
  }
  
  handleForgeRequest(data) {
    const lane = this.createCloneLane(data.stats);
    
    this.eventSystem.emit(EventNames.FORGE_CREATED, {
      cloneId: lane.id,
      rate: lane.baseRate,
      stability: lane.stability,
      specialty: lane.specialty
    });
    
    // Save state
    this.saveState();
  }
  
  calculateOfflineProduction(lastSaveTime) {
    const now = Date.now();
    const deltaMs = now - lastSaveTime;
    const cappedMs = Math.min(deltaMs, this.offlineCapHours * 3600000);
    
    let totalProduction = { coins: 0, grit: 0, sparks: 0 };
    
    this.lanes.forEach(lane => {
      const production = this.calculateLaneOfflineProduction(lane, cappedMs);
      totalProduction.coins += production.coins;
      totalProduction.grit += production.grit;
      totalProduction.sparks += production.sparks;
    });
    
    return {
      ...totalProduction,
      timeElapsed: deltaMs,
      timeCapped: cappedMs,
      wasLimited: deltaMs > cappedMs
    };
  }
}
```

**Verification**:
- [ ] Forge request creates lane
- [ ] Offline calculation accurate
- [ ] Decay applied correctly
- [ ] State persists properly

#### Task 5B: Factory Scene Update
```javascript
// Update src/scenes/FactoryScene.js
export class FactoryScene extends Phaser.Scene {
  create() {
    this.cloneManager = CloneManager.getInstance();
    
    // Check for offline production
    const lastSave = GameStateManager.getInstance().getLastSaveTime();
    if (lastSave) {
      const offline = this.cloneManager.calculateOfflineProduction(lastSave);
      if (offline.coins > 0 || offline.grit > 0) {
        this.showOfflineModal(offline);
      }
    }
    
    this.createFactoryUI();
    this.startProductionLoop();
  }
  
  createFactoryUI() {
    const lanes = this.cloneManager.getAllLanes();
    
    if (lanes.length === 0) {
      this.showEmptyFactoryMessage();
      return;
    }
    
    lanes.forEach((lane, index) => {
      this.createLaneDisplay(lane, index);
    });
    
    this.createResourceDisplay();
    this.createBoostControls();
  }
}
```

**Verification**:
- [ ] Factory displays all lanes
- [ ] Offline modal shows correctly
- [ ] Production updates in real-time
- [ ] UI responsive to interactions

---

## 🚀 Day 7: Boss Rewards & Integration

### Morning Session

#### Task 6A: Boss Reward System
```javascript
// Create src/modules/boss/BossRewardSystem.js
import { BaseManager } from '@features/core';
import { GameStateManager } from '@features/core';
import { CloneManager } from '@features/idle';
import { EventNames } from '../../constants/EventNames.js';

export class BossRewardSystem extends BaseManager {
  constructor() {
    super();
    if (this.isInitialized()) return;
    this.initRewards();
  }
  
  initRewards() {
    this.setupRewardDefinitions();
    this.listenForBossDefeats();
    this.setInitialized();
  }
  
  setupRewardDefinitions() {
    this.rewards = new Map([
      ['pulsar', {
        movement: ['wallDash'],
        idleBoost: {
          duration: 1800000, // 30 minutes
          multiplier: 1.25
        },
        permanent: {
          cloneStability: 0.02
        },
        resources: {
          coins: 100,
          grit: 50,
          sparks: 1
        }
      }]
    ]);
  }
  
  listenForBossDefeats() {
    this.eventSystem.on(EventNames.BOSS_DEFEATED, this.processBossDefeat.bind(this));
  }
  
  processBossDefeat(data) {
    const reward = this.rewards.get(data.bossId);
    if (!reward) return;
    
    // Grant all rewards
    this.grantMovementTech(reward.movement);
    this.applyIdleBoost(reward.idleBoost);
    this.applyPermanentUpgrades(reward.permanent);
    this.grantResources(reward.resources);
    
    // Emit reward granted event
    this.eventSystem.emit(EventNames.REWARD_GRANTED, {
      bossId: data.bossId,
      rewards: reward
    });
  }
}
```

**Verification**:
- [ ] Boss defeat triggers rewards
- [ ] Movement tech unlocks
- [ ] Idle boost applies
- [ ] Rewards persist

#### Task 6B: Complete Integration Test
```javascript
// Create tests/integration.test.cjs
async function testCoreLoop() {
  console.log('Testing complete core loop...');
  
  // 1. Start a run
  const game = await startGame();
  await game.startRun('gym-trial-1', 1138);
  
  // 2. Simulate gameplay
  await game.simulateGameplay({
    collectCoins: 10,
    deaths: 1,
    maxCombo: 15
  });
  
  // 3. Defeat boss
  await game.defeatBoss('pulsar');
  
  // 4. End run
  const runData = await game.endRun();
  
  // 5. Check results scene
  assert(game.currentScene === 'ResultsScene');
  assert(runData.performance.S > 0);
  
  // 6. Forge clone
  await game.forgeClone();
  
  // 7. Check factory
  assert(game.currentScene === 'FactoryScene');
  assert(game.cloneManager.lanes.size === 1);
  
  // 8. Verify rewards
  assert(game.hasMovementTech('wallDash'));
  assert(game.idleBoostActive());
  
  console.log('✅ Core loop test passed!');
}
```

**Verification**:
- [ ] Full flow works end-to-end
- [ ] No errors or warnings
- [ ] State persists correctly
- [ ] Performance acceptable

---

## 📊 Final Verification Checklist

### Code Quality
- [ ] All linting errors fixed (`npm run lint:fix`)
- [ ] Code formatted (`npm run format`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] No console errors/warnings

### Testing
- [ ] Unit tests pass (`npm test`)
- [ ] Integration tests pass (`npm run test:integration`)
- [ ] Determinism test passes (`npm run test:determinism`)
- [ ] Manual testing checklist complete

### Documentation
- [ ] CLAUDE.md updated
- [ ] New events documented
- [ ] API changes documented
- [ ] README current

### Performance
- [ ] 60 FPS maintained
- [ ] Memory stable
- [ ] Load time < 3s
- [ ] Bundle size < 3MB

### Git/Version Control
- [ ] All changes committed
- [ ] Branch up to date
- [ ] No merge conflicts
- [ ] CI/CD passing

---

## 🎯 Success Criteria

By end of Day 7, we must have:

1. ✅ **Working Core Loop**
   - Start run → Play → End run → Results → Forge clone → See in Factory

2. ✅ **Boss Rewards Active**
   - Defeat Pulsar → Get wall-dash + idle boost

3. ✅ **Determinism Proven**
   - Seed 1138 produces identical results every time

4. ✅ **Offline Progress Working**
   - Close game → Wait → Return → See accumulated resources

5. ✅ **Save/Load Functional**
   - All progress persists across sessions

---

## 🚦 Go/No-Go Decision Point

After Day 7, evaluate:

- **GO**: If all 5 success criteria met → Proceed to Polish Sprint
- **PAUSE**: If 3-4 criteria met → Fix remaining issues (1-2 days)
- **STOP**: If <3 criteria met → Re-evaluate approach

---

## 📝 Daily Standup Template

Each day at start:
1. What was completed yesterday?
2. What will be done today?
3. Any blockers?
4. Any help needed?

Each day at end:
1. What actually got done?
2. What tests passed?
3. What's broken?
4. Tomorrow's priority?

---

## 🔄 Continuous Integration

After each task:
```bash
# Quick validation
npm run lint:fix && npm run format && npm test

# Full validation
npm run validate:all

# Commit with confidence
git add . && git commit -m "feat: [description]"
```

---

**Ready to execute! Let's build this core loop! 🚀**