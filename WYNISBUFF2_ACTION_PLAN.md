# WynIsBuff2: Consolidated Action Plan

## Vision
A **skill-to-automation platformer** where mastery manufactures value. Your performance literally forges Buff Clones that idle-earn based on how well you played. Think Celeste precision meets Idle Slayer compulsion with a unique "your skill becomes your workforce" twist.

## Key Innovations (From Design Agent)

### 1. Flow State Multiplier System
- Perfect chains build 1x → 50x multipliers
- Clones inherit your peak Flow from their creation run
- Retroactive buffing: Beat your record, ALL clones from that biome get upgraded

### 2. DNA Splice Mechanics
- Each run extracts 3 DNA traits (Speed Gene, Precision Gene, Explorer Gene, Berserker Gene)
- Combine 3 clones → Super Clone with inherited traits
- Mutation chance creates unique behaviors ("Backwards Runner", "Glass Cannon")

### 3. Time Echo System
- Clones exist in "time echoes" of your runs
- Your decisions during runs affect clone behavior while idle
- Watch idle runs in fast-forward to see consequences compound

### 4. Tempo Spark Corruption
- Level 1: 10% faster time
- Level 2: Bouncy gravity
- Level 3: Random phase shifting
- Level 4: Reverse controls (10x earnings!)
- Level 5: Shadow Self mirror (instant death if touched)

### 5. The Pulsar Boss Design
- Phase 1: Metronome (4/4 time attacks)
- Phase 2: Polyrhythm Chaos (3/4, 4/4, 5/4 simultaneous)
- Phase 3: The Remix (samples YOUR movement patterns)
- Phase 4: Temporal Collapse (secret phase with time manipulation)

## Architecture Requirements (From Architecture Guardian)

### Critical Must-Haves
1. **All managers extend BaseManager** - Non-negotiable
2. **Add event constants to EventNames.js** - No magic strings
3. **Use existing GameStateManager** for persistence
4. **Create feature module at src/features/idle/**
5. **Follow singleton pattern** for manager dependencies

### New Event Constants
```javascript
// Add to EventNames.js
CLONE_SPAWN: 'clone:spawn',
CLONE_PRODUCE: 'clone:produce',
RESOURCE_GAIN: 'economy:resourceGain',
PRESTIGE_TRIGGER: 'prestige:trigger',
PCG_GENERATE: 'pcg:generate',
TEMPO_SPARK_ACTIVATE: 'boost:tempoSpark',
FLOW_STATE_CHANGE: 'player:flowState'
```

## Physics Implementation (From Physics Expert)

### Enhanced Movement System
- **8-12ms input buffering** with circular buffer
- **100ms coyote time** (6 frames at 60fps)
- **Variable jump** with proper velocity curves
- **Triple jump** with escalating forces:
  - Jump 1: -680 velocity
  - Jump 2: -740 velocity + 15% horizontal
  - Jump 3: -860 velocity + 30% horizontal
- **Wall-dash** at 720 px/s with 70% momentum transfer
- **Fixed timestep** physics for deterministic behavior

### Performance Optimizations
- Spatial hashing for collision detection
- Object pooling for obstacles (50 pre-allocated)
- Sleep threshold at 0.1 px/s
- Interpolation between physics updates
- Max 10 collision checks per frame

## Implementation Roadmap

### Week 1: Core Systems

#### Day 1-2: Enhanced Movement
1. Implement EnhancedMovementController with state machine
2. Add input buffering and coyote time
3. Create triple jump with escalating VFX
4. Integrate wall-dash mechanics

#### Day 3: Scoring System
1. Create performance tracking (S, C, H, R, B metrics)
2. Build Flow State multiplier system
3. Implement combo detection
4. Add DNA trait extraction

#### Day 4-5: Clone Forging
1. Create CloneManager extending BaseManager
2. Implement performance → clone attribute mapping
3. Build Time Echo recording system
4. Add clone breeding mechanics

### Week 2: Idle & Progression

#### Day 6-7: Boss & Rewards
1. Implement The Pulsar with 4 phases
2. Create rhythm-based attack patterns
3. Add movement tech rewards
4. Build Tempo Spark system

#### Day 8-9: Economy & Hub
1. Create multi-resource economy
2. Build Hub scene with 4 sections
3. Implement upgrade gating
4. Add generator unlocking

#### Day 10-11: Prestige System
1. Create Bulk Cycle mechanics
2. Implement world re-seeding
3. Build PCG with DNA parameters
4. Add movement tech persistence

### Week 3: Polish & Ship

#### Day 12-14: Game Feel
1. Add particle effects for all actions
2. Implement damage clarity system
3. Create Protein Plant biome
4. Add fast-retry mechanics
5. Implement save/load with IndexedDB

## Data Structures

### Clone Data Model
```javascript
{
  id: "clone_12345",
  dna: {
    speed: 0.8,
    precision: 0.6,
    explorer: 0.4,
    berserker: 0.2
  },
  performance: {
    baseRate: 1.0,
    multiplier: 2.4,
    stability: 0.85,
    specialty: "tempo"
  },
  timeEcho: {
    decisions: [...],
    route: [...],
    flowPeaks: [...]
  },
  mutations: ["backwards_runner"],
  generation: 1,
  parent_ids: []
}
```

### Resource Types
- **Muscle**: Basic currency from idle
- **Grit Shards**: Active-only, unlocks content
- **Tempo Sparks**: Temporary boosts
- **Buff DNA**: PCG fuel and clone breeding
- **Flow Points**: Skill currency for tech upgrades

## File Structure

```
src/
├── core/
│   ├── CloneManager.js (NEW)
│   ├── EconomyManager.js (NEW)
│   ├── PrestigeManager.js (NEW)
│   ├── PCGManager.js (NEW)
│   └── FlowStateManager.js (NEW)
├── features/
│   ├── idle/ (NEW)
│   │   └── index.js
│   └── boss/ (NEW)
│       └── index.js
├── modules/
│   ├── player/
│   │   ├── EnhancedMovementController.js (NEW)
│   │   ├── EnhancedJumpController.js (NEW)
│   │   └── WallDashController.js (NEW)
│   ├── boss/
│   │   └── PulsarController.js (NEW)
│   └── idle/
│       ├── CloneRenderer.js (NEW)
│       ├── TimeEchoRecorder.js (NEW)
│       └── DNAExtractor.js (NEW)
└── scenes/
    ├── HubScene.js (NEW)
    ├── RunScene.js (ENHANCED Game.js)
    ├── ResultsScene.js (NEW)
    ├── FactoryScene.js (NEW)
    └── LabScene.js (NEW)
```

## Quality Gates

### Pre-Implementation
- [ ] Manager extends BaseManager
- [ ] Events in EventNames.js
- [ ] Barrel exports configured
- [ ] No magic strings

### Post-Implementation
- [ ] 60 FPS maintained
- [ ] Input buffer < 12ms
- [ ] Offline calc < 50ms
- [ ] Save/load < 100ms

## Success Metrics

### Technical
- 60 FPS during active play
- < 2MB idle state memory
- < 100ms scene transitions
- Zero frame drops during boss fights

### Gameplay
- Average session: 10-15 minutes active
- Clone production visible within first run
- Prestige achievable in 2-3 hours
- Boss defeatable in 3-5 attempts

## Next Immediate Actions

1. **Create branch**: `feature/skill-to-automation`
2. **Add event constants**: Update EventNames.js
3. **Implement EnhancedMovementController**: Start with input buffering
4. **Create CloneManager**: Basic forging logic
5. **Test integration**: Ensure 60 FPS maintained

## Risk Mitigations

### Performance
- Use throttled updates for idle calculations
- Implement visibility culling for Factory scene
- Pool all particle effects
- Lazy-load biome assets

### Complexity
- Start with single clone type
- Implement basic DNA before mutations
- Launch with 1 boss, 2 biomes
- Add PCG in post-launch update

## The Hook

"Every jump you nail, every combo you chain, every boss you defeat - it all becomes permanent value. Your clones aren't just numbers going up; they're echoes of your mastery, performing YOUR moves while you're away. The better you play, the better your future becomes. Literally."

---

Ready to start? Let's begin with the EnhancedMovementController to nail that perfect game feel!