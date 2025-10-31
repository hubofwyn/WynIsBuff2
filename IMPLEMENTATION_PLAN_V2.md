# WynIsBuff2 - Orchestrated Implementation Plan

## Quality-First, Parallel-Capable, Fully Verified

**Generated**: 2025-01-27  
**Target**: Feature-complete Beta in 14 days  
**Philosophy**: Quality over speed, thorough verification at each step

---

## 🎯 Strategic Overview

### Core Principle

Every task can be worked in parallel, but MUST pass individual verification before integration. We optimize for **quality of result**, not time spent.

### Orchestration Strategy

- **Parallel Streams**: 3-4 concurrent work threads
- **Verification Gates**: Each task has explicit acceptance criteria
- **Quality Checks**: Linting, formatting, testing at every step
- **Documentation**: Updated inline with code changes

---

## 📋 Sprint A: Core Loop Integration (Days 1-7)

### Goal

Complete the Run→Results→Clone→Factory pipeline with full determinism and verification.

### Parallel Work Streams

#### Stream 1: Event Architecture & Contracts

**Agent**: architecture-guardian  
**Duration**: 4-6 hours

```typescript
// Event Contract Definition
interface GameEvents {
    // Run lifecycle
    'run:start': { routeId: string; seed: number; character: string };
    'run:end': {
        time: number;
        deaths: number;
        maxCombo: number;
        pickups: { coin: number; grit: number; relics: string[] };
        bosses: { [id: string]: boolean };
    };

    // Clone forging
    'forge:request': {
        performance: PerformanceVector;
        routeId: string;
    };
    'forge:created': {
        cloneId: string;
        rate: number;
        stability: number;
        specialty: string;
    };

    // Boss rewards
    'boss:defeated': {
        bossId: string;
        rewards: {
            movement?: string[];
            idleBoost?: { duration: number; multiplier: number };
        };
    };
}
```

**Verification**:

- [ ] All events documented in EventNames.js
- [ ] TypeScript interfaces generated
- [ ] Event flow diagram created
- [ ] Test harness for event emission/reception

---

#### Stream 2: Performance Analysis System

**Agent**: game-physics-expert  
**Duration**: 6-8 hours

```javascript
// Performance Vector Calculation
class PerformanceAnalyzer extends BaseManager {
    analyzeRun(runData) {
        const S = this.calculateSpeed(runData.time, runData.routeLength);
        const C = this.calculateCombo(runData.maxCombo, runData.possibleCombo);
        const H = this.calculateHitAvoidance(runData.deaths);
        const R = this.calculateRarity(runData.pickups.relics);
        const B = this.calculateBossBonus(runData.bosses);

        return { S, C, H, R, B };
    }

    mapToCloneStats(performance, routeTier) {
        const base = this.getGeneratorBase(routeTier);
        const rate =
            base *
            (1 + 0.12 * performance.S) *
            (1 + 0.03 * performance.C) *
            (performance.H === 0 ? 1.15 : 1) *
            (1 + 0.05 * performance.R) *
            (1 + performance.B);

        const stability = Math.min(
            0.95,
            Math.max(0.5, 0.6 + 0.08 * performance.S + 0.02 * performance.C - 0.05 * performance.H)
        );

        return { rate, stability };
    }
}
```

**Verification**:

- [ ] Unit tests for each calculation method
- [ ] Integration test with sample run data
- [ ] Boundary condition testing
- [ ] Performance benchmarks (< 10ms per analysis)

---

#### Stream 3: Determinism Framework

**Agent**: game-physics-expert  
**Duration**: 8-10 hours

```javascript
// Deterministic Game Loop
class DeterministicEngine {
    constructor() {
        this.fixedTimestep = 1 / 120; // 120Hz simulation
        this.accumulator = 0;
        this.currentTime = 0;
        this.rng = new DeterministicRNG();
    }

    update(deltaTime) {
        deltaTime = Math.min(deltaTime, 0.25); // Cap at 250ms
        this.accumulator += deltaTime;

        while (this.accumulator >= this.fixedTimestep) {
            this.fixedUpdate(this.fixedTimestep);
            this.accumulator -= this.fixedTimestep;
            this.currentTime += this.fixedTimestep;
        }

        // Interpolation for rendering
        const alpha = this.accumulator / this.fixedTimestep;
        this.render(alpha);
    }

    fixedUpdate(dt) {
        // All physics and game logic here
        this.physics.step(dt);
        this.updateGameLogic(dt);
        this.recordState();
    }
}
```

**Verification**:

- [ ] Golden seed test (seed 1138 produces identical results)
- [ ] Cross-platform determinism test
- [ ] Save/load state preservation
- [ ] Replay system validation

---

#### Stream 4: Clone Management Enhancement

**Agent**: game-design-innovator  
**Duration**: 6-8 hours

```javascript
// Clone Production System
class EnhancedCloneManager extends CloneManager {
    constructor() {
        super();
        this.lanes = new Map();
        this.decayRate = 0.02; // 2% per hour
        this.decayFloor = 0.6; // 60% minimum
        this.boostQueue = [];
    }

    createCloneLane(cloneData) {
        const lane = {
            id: this.generateId(),
            baseRate: cloneData.rate,
            currentRate: cloneData.rate,
            stability: cloneData.stability,
            specialty: cloneData.specialty,
            createdAt: Date.now(),
            lastDecay: Date.now(),
            totalProduced: 0,
        };

        this.lanes.set(lane.id, lane);
        this.startProduction(lane.id);
        return lane.id;
    }

    applyDecay(laneId) {
        const lane = this.lanes.get(laneId);
        const hoursElapsed = (Date.now() - lane.lastDecay) / 3600000;
        const decayFactor = Math.max(this.decayFloor, 1 - this.decayRate * hoursElapsed);
        lane.currentRate = lane.baseRate * decayFactor * lane.stability;
        lane.lastDecay = Date.now();
    }

    calculateOfflineProduction(timeDelta) {
        const maxHours = 10;
        const cappedDelta = Math.min(timeDelta, maxHours * 3600000);

        let totalCoins = 0;
        let totalGrit = 0;

        for (const lane of this.lanes.values()) {
            const production = this.calculateLaneProduction(lane, cappedDelta);
            totalCoins += production.coins;
            totalGrit += production.grit;
        }

        return { coins: totalCoins, grit: totalGrit, timeCapped: cappedDelta };
    }
}
```

**Verification**:

- [ ] Decay calculation tests
- [ ] Offline production cap validation
- [ ] Boost queue processing tests
- [ ] State persistence validation

---

### Verification Checkpoint A1

**Before proceeding to Stream Integration:**

1. **Code Quality Checks**

    ```bash
    npm run lint:fix        # Auto-fix all linting issues
    npm run format          # Prettier formatting
    npm run typecheck       # TypeScript validation
    ```

2. **Test Suite Execution**

    ```bash
    npm test                # Unit tests
    npm run test:integration # Integration tests
    npm run test:determinism # Determinism validation
    ```

3. **Documentation Updates**
    - [ ] CLAUDE.md updated with new systems
    - [ ] API documentation generated
    - [ ] Event flow diagrams created

---

## 📋 Sprint B: Boss System & UI Polish (Days 8-14)

### Parallel Work Streams

#### Stream 5: Boss Reward System

**Agent**: game-design-innovator  
**Duration**: 4-6 hours

```javascript
// Boss Reward Implementation
class BossRewardSystem extends BaseManager {
    constructor() {
        super();
        this.rewards = new Map([
            [
                'pulsar',
                {
                    movement: ['wallDash'],
                    idleBoost: { duration: 1800000, multiplier: 1.25 }, // 30 min, +25%
                    permanent: { cloneStability: 0.02 },
                },
            ],
            [
                'titan',
                {
                    movement: ['tripleDash', 'airDash'],
                    idleBoost: { duration: 3600000, multiplier: 1.5 },
                    permanent: { cloneRate: 0.1 },
                },
            ],
        ]);
    }

    processBossDefeat(bossId) {
        const reward = this.rewards.get(bossId);
        if (!reward) return;

        // Grant movement tech
        if (reward.movement) {
            reward.movement.forEach((tech) => {
                this.eventSystem.emit(EventNames.MOVEMENT_UNLOCK, { tech });
                GameStateManager.getInstance().unlockMovement(tech);
            });
        }

        // Apply idle boost
        if (reward.idleBoost) {
            CloneManager.getInstance().applyGlobalBoost(
                reward.idleBoost.multiplier,
                reward.idleBoost.duration
            );
        }

        // Apply permanent upgrades
        if (reward.permanent) {
            GameStateManager.getInstance().applyPermanentUpgrade(reward.permanent);
        }
    }
}
```

**Verification**:

- [ ] Each boss reward triggers correctly
- [ ] Persistence across sessions
- [ ] UI feedback for rewards
- [ ] Balance testing

---

#### Stream 6: Factory UI Implementation

**Agent**: architecture-guardian  
**Duration**: 8-10 hours

```javascript
// Factory Scene UI
class FactoryScene extends Phaser.Scene {
    create() {
        this.cloneManager = CloneManager.getInstance();
        this.createUI();
        this.startUpdateLoop();
    }

    createUI() {
        // Lane visualization
        this.laneContainers = [];
        const lanes = this.cloneManager.getAllLanes();

        lanes.forEach((lane, index) => {
            const container = this.createLaneUI(lane, index);
            this.laneContainers.push(container);
        });

        // Resource display
        this.resourceDisplay = this.createResourceDisplay();

        // Boost controls
        this.boostControls = this.createBoostControls();
    }

    createLaneUI(lane, index) {
        const y = 100 + index * 120;

        const container = this.add.container(100, y);

        // Lane background
        const bg = this.add.rectangle(0, 0, 600, 100, 0x2a2a2a);

        // Clone sprite
        const sprite = this.add.sprite(-250, 0, 'clone', lane.specialty);

        // Production rate
        const rateText = this.add.text(-100, -20, `Rate: ${lane.currentRate.toFixed(2)}/s`, {
            fontSize: '16px',
            color: '#00ff00',
        });

        // Stability bar
        const stabilityBar = this.add.rectangle(-100, 20, 200 * lane.stability, 10, 0x00aaff);

        // Decay indicator
        const decayText = this.add.text(
            100,
            -20,
            `Decay: ${((lane.currentRate / lane.baseRate) * 100).toFixed(0)}%`,
            { fontSize: '14px', color: '#ffaa00' }
        );

        // Action buttons
        const sparButton = this.add
            .text(200, 0, '[SPAR]', { fontSize: '18px', color: '#ffffff' })
            .setInteractive();

        sparButton.on('pointerdown', () => this.startSparRun(lane.id));

        container.add([bg, sprite, rateText, stabilityBar, decayText, sparButton]);
        return container;
    }
}
```

**Verification**:

- [ ] All lanes display correctly
- [ ] Real-time updates work
- [ ] Interaction responsiveness
- [ ] Mobile-friendly layout

---

#### Stream 7: Scene Flow Integration

**Agent**: architecture-guardian  
**Duration**: 6-8 hours

```javascript
// Scene Transition Manager
class SceneFlowManager extends BaseManager {
    constructor() {
        super();
        this.setupTransitions();
    }

    setupTransitions() {
        this.transitions = new Map([
            ['MainMenu', ['CharacterSelect', 'Settings', 'Factory']],
            ['CharacterSelect', ['Game', 'MainMenu']],
            ['Game', ['Results', 'MainMenu']],
            ['Results', ['Factory', 'Game', 'MainMenu']],
            ['Factory', ['Game', 'MainMenu', 'Shop']],
            ['Shop', ['Factory', 'MainMenu']],
        ]);

        this.transitionEffects = {
            fade: { duration: 300, ease: 'Power2' },
            slide: { duration: 400, ease: 'Back.easeOut' },
            zoom: { duration: 500, ease: 'Expo.easeInOut' },
        };
    }

    transition(from, to, data = {}, effect = 'fade') {
        if (!this.canTransition(from, to)) {
            console.error(`Invalid transition: ${from} → ${to}`);
            return;
        }

        const fx = this.transitionEffects[effect];

        this.eventSystem.emit(EventNames.SCENE_TRANSITION_START, { from, to });

        from.cameras.main.fadeOut(fx.duration / 2);

        from.time.delayedCall(fx.duration / 2, () => {
            from.scene.start(to, data);
            to.cameras.main.fadeIn(fx.duration / 2);

            this.eventSystem.emit(EventNames.SCENE_TRANSITION_END, { from, to });
        });
    }
}
```

**Verification**:

- [ ] All transitions work smoothly
- [ ] Data passes correctly between scenes
- [ ] No memory leaks during transitions
- [ ] Transition history tracking

---

### Verification Checkpoint B1

**Mid-Sprint Quality Gates:**

1. **Integration Testing**

    ```bash
    npm run test:e2e        # End-to-end flow tests
    npm run test:ui         # UI interaction tests
    npm run test:performance # Performance benchmarks
    ```

2. **Visual Regression Testing**
    - [ ] Screenshot comparisons for each scene
    - [ ] Animation smoothness validation
    - [ ] Mobile viewport testing

3. **Accessibility Audit**
    - [ ] Keyboard navigation works
    - [ ] Screen reader compatibility
    - [ ] Color contrast validation

---

## 📋 Sprint C: Polish & Testing (Days 15-21)

### Parallel Polish Streams

#### Stream 8: Performance Optimization

**Agent**: game-physics-expert  
**Duration**: 8-10 hours

**Tasks**:

- Object pooling for particles and projectiles
- Texture atlas optimization
- Audio sprite consolidation
- Bundle size reduction
- Memory leak detection and fixes

**Verification**:

- [ ] Maintain 60 FPS on mid-range devices
- [ ] Bundle size < 3MB
- [ ] Memory usage < 2MB steady state
- [ ] Load time < 3 seconds

---

#### Stream 9: Save System Robustness

**Agent**: architecture-guardian  
**Duration**: 6-8 hours

**Tasks**:

- Multi-slot save system
- Cloud save integration prep
- Save corruption recovery
- Migration system for updates
- Export/import functionality

**Verification**:

- [ ] Save/load cycle < 100ms
- [ ] Corruption recovery works
- [ ] Migration from v1 to v2 saves
- [ ] No data loss scenarios

---

#### Stream 10: Content Pipeline

**Agent**: game-design-innovator  
**Duration**: 10-12 hours

**Tasks**:

- Level variety (5 new rooms minimum)
- Boss pattern variations
- Power-up distribution tuning
- Difficulty curve validation
- Tutorial flow implementation

**Verification**:

- [ ] Each room playable in < 2 minutes
- [ ] No impossible jumps
- [ ] Power-up spacing feels good
- [ ] Difficulty ramps smoothly

---

## 🔧 Quality Assurance Framework

### Automated Testing Pipeline

```yaml
# .github/workflows/quality.yml
name: Quality Assurance

on: [push, pull_request]

jobs:
    quality:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3

            - name: Install dependencies
              run: npm ci

            - name: Lint check
              run: npm run lint

            - name: Format check
              run: npm run format:check

            - name: Type check
              run: npm run typecheck

            - name: Unit tests
              run: npm test

            - name: Integration tests
              run: npm run test:integration

            - name: Determinism tests
              run: npm run test:determinism

            - name: Build
              run: npm run build

            - name: Bundle size check
              run: npm run size-limit
```

### Manual Testing Checklist

#### Core Loop Testing

- [ ] Start game → Complete run → See results
- [ ] Results → Forge clone → See in factory
- [ ] Factory shows production ticking
- [ ] Offline progress calculated correctly
- [ ] Boss defeat grants rewards

#### Persistence Testing

- [ ] Save mid-run → Reload → Continue exactly
- [ ] Settings persist
- [ ] Unlocks persist
- [ ] Clone lanes persist
- [ ] Offline time tracked

#### Performance Testing

- [ ] 60 FPS during gameplay
- [ ] No frame drops during transitions
- [ ] Memory stable over 30 minutes
- [ ] No audio glitches
- [ ] Touch controls responsive

---

## 📊 Success Metrics

### Technical Metrics

| Metric        | Target | Measurement                |
| ------------- | ------ | -------------------------- |
| Frame Rate    | 60 FPS | Performance.now() sampling |
| Load Time     | < 3s   | Navigation Timing API      |
| Memory Usage  | < 2MB  | Chrome DevTools            |
| Bundle Size   | < 3MB  | Webpack Bundle Analyzer    |
| Test Coverage | > 80%  | Jest Coverage Report       |

### Gameplay Metrics

| Metric          | Target    | Measurement      |
| --------------- | --------- | ---------------- |
| First Clone     | < 5 min   | Analytics event  |
| Session Length  | 10-15 min | Session tracking |
| Retention D1    | > 40%     | Analytics        |
| Boss Clear Rate | 30-50%    | Event tracking   |
| Crash Rate      | < 0.1%    | Error reporting  |

---

## 🚀 Deployment Strategy

### Beta Release Checklist

- [ ] All P0 bugs fixed
- [ ] Core loop fully functional
- [ ] At least 10 playable rooms
- [ ] 2 bosses with rewards
- [ ] Save system bulletproof
- [ ] Performance targets met
- [ ] Analytics integrated
- [ ] Error reporting active

### Launch Requirements

- [ ] 20+ rooms available
- [ ] 4+ bosses implemented
- [ ] Clone breeding working
- [ ] Factory fully visual
- [ ] Tutorial complete
- [ ] Achievements system
- [ ] Social features ready

---

## 📝 Documentation Requirements

### Code Documentation

- [ ] All public APIs documented
- [ ] Complex algorithms explained
- [ ] Architecture decisions recorded
- [ ] Performance considerations noted

### Player Documentation

- [ ] Controls reference
- [ ] Strategy guide started
- [ ] FAQ prepared
- [ ] Known issues list

### Developer Documentation

- [ ] Setup instructions
- [ ] Architecture overview
- [ ] Contributing guidelines
- [ ] Release process

---

## 🎯 Definition of Done

### For Each Task

1. Code written and working
2. Tests written and passing
3. Documentation updated
4. Code review completed
5. Linting/formatting clean
6. Performance verified
7. Accessibility checked
8. Mobile tested

### For Each Sprint

1. All tasks complete
2. Integration tests passing
3. Performance benchmarks met
4. Documentation current
5. Deployment successful
6. Stakeholder approval

### For Beta Release

1. Core loop polished
2. No P0/P1 bugs
3. Performance smooth
4. Saves reliable
5. Content sufficient
6. Fun factor validated

---

## 🔄 Continuous Improvement

### Weekly Retrospectives

- What worked well?
- What needs improvement?
- What blockers exist?
- What can we automate?

### Metrics Review

- Velocity tracking
- Bug discovery rate
- Test coverage trend
- Performance trends

### Process Refinement

- Automate repetitive tasks
- Improve test coverage
- Optimize build times
- Enhance documentation

---

## 📅 Timeline Summary

### Week 1 (Days 1-7): Foundation

- Core loop integration
- Determinism framework
- Boss rewards
- Basic Factory UI

### Week 2 (Days 8-14): Enhancement

- UI polish
- Scene transitions
- Advanced Factory features
- Content creation

### Week 3 (Days 15-21): Polish

- Performance optimization
- Bug fixing
- Testing completion
- Beta preparation

### Target Milestones

- **Day 7**: Core loop playable
- **Day 14**: Beta-ready build
- **Day 21**: Public release candidate

---

## 🎮 Ready to Execute

This plan prioritizes:

1. **Quality** over speed
2. **Verification** at every step
3. **Parallel** work where possible
4. **Documentation** inline with development
5. **Testing** as first-class citizen

Each stream can be worked independently but must pass verification gates before integration. The orchestration system ensures architectural consistency while allowing creative freedom within defined boundaries.

**Let's build something exceptional! 🚀**
