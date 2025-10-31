# Observability Integration Workflow Guide

**Purpose**: Step-by-step workflow instructions for agents implementing the observability system.
**Status File**: [STATUS_OBSERVABILITY.json](STATUS_OBSERVABILITY.json)
**Master Plan**: [OBSERVABILITY_IMPLEMENTATION.md](OBSERVABILITY_IMPLEMENTATION.md)

---

## 🎯 Current Status Check

Before starting any work, ALWAYS:

1. **Read the status file**:

```bash
cat STATUS_OBSERVABILITY.json | jq '.implementation'
```

2. **Identify current phase**:

```bash
cat STATUS_OBSERVABILITY.json | jq '.phases."'$(cat STATUS_OBSERVABILITY.json | jq -r '.implementation.currentPhase')'"'
```

3. **Check for blockers**:

```bash
cat STATUS_OBSERVABILITY.json | jq '.implementation.blockers'
```

---

## 📋 Phase Workflow Template

Each phase follows this **STRICT** workflow:

### 1. Phase Entry Validation

```javascript
// Check dependencies
const currentPhase = status.implementation.currentPhase;
const phaseDeps = status.phases[currentPhase].dependencies;
for (const dep of phaseDeps) {
    if (status.phases[dep].status !== 'complete') {
        throw new Error(`Dependency ${dep} not complete`);
    }
}
```

### 2. Phase Execution Steps

#### Step A: Preparation

- [ ] Update status to "in_progress"
- [ ] Create required directories
- [ ] Back up affected files
- [ ] Document start time

#### Step B: Implementation

- [ ] Create new files per specification
- [ ] Modify existing files incrementally
- [ ] Add comprehensive comments
- [ ] Ensure backwards compatibility

#### Step C: Testing

- [ ] Unit test new components
- [ ] Integration test with existing code
- [ ] Performance profiling
- [ ] Error scenario testing

#### Step D: Validation

- [ ] All validation criteria met
- [ ] No regression in existing functionality
- [ ] Performance within budget
- [ ] Documentation updated

#### Step E: Completion

- [ ] Update status to "complete"
- [ ] Set completion to 100
- [ ] Update validation flags
- [ ] Commit changes

### 3. Phase Exit Protocol

```javascript
// Update status file
status.phases[currentPhase].status = 'complete';
status.phases[currentPhase].completion = 100;
status.completedPhases.push(currentPhase);
status.implementation.currentPhase++;
status.implementation.nextAction = getNextAction(status.implementation.currentPhase);
```

---

## 🚀 Phase-Specific Workflows

### Phase 0: Foundation & Planning

```bash
# 1. Create feature branch
git checkout -b feature/observability-integration
git add -A && git commit -m "CHECKPOINT: Pre-observability baseline"

# 2. Create directory structure
mkdir -p src/observability/{core,context,providers,utils}
mkdir -p docs/observability
mkdir -p tests/observability

# 3. Update status
# Set phase 0 completion to 100
# Move to phase 1
```

### Phase 1: Core Infrastructure

```javascript
// 1. Create LogSystem.js
export class LogSystem extends BaseManager {
    constructor() {
        super();
        if (this.isInitialized()) return;
        this.init();
    }

    init() {
        this.buffer = new BoundedBuffer(2000);
        this.levels = LogLevels;
        this.config = this.loadConfig();
        this.setInitialized();
    }
}

// 2. Create BoundedBuffer.js
export class BoundedBuffer {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.buffer = [];
        this.pointer = 0;
    }

    add(entry) {
        if (this.buffer.length < this.maxSize) {
            this.buffer.push(entry);
        } else {
            this.buffer[this.pointer] = entry;
            this.pointer = (this.pointer + 1) % this.maxSize;
        }
    }
}

// 3. Test and validate
npm test tests/observability/core.test.js
```

### Phase 2: Context System

```javascript
// 1. Create DebugContext.js
export class DebugContext {
    constructor() {
        this.frame = 0;
        this.providers = new Map();
        this.context = {};
    }

    registerProvider(name, provider) {
        this.providers.set(name, provider);
    }

    captureSnapshot() {
        const snapshot = { frame: this.frame };
        for (const [name, provider] of this.providers) {
            snapshot[name] = provider.getState();
        }
        return snapshot;
    }
}

// 2. Integrate with Game.js
// In create():
this.debugContext = new DebugContext();
this.debugContext.registerProvider('player', new PlayerStateProvider(this.player));
this.debugContext.registerProvider('physics', new PhysicsStateProvider(this.physics));
```

### Phase 3: Logging Migration

**Migration Priority Order**:

1. PhysicsManager.js (17 console.\* calls)
2. PlayerController.js (12 console.\* calls)
3. InputManager.js (8 console.\* calls)
4. Game.js (15 console.\* calls)
5. All scenes (remaining)

**Migration Pattern**:

```javascript
// BEFORE:
console.log('Player jumped');
console.error('Physics error:', e);
console.warn('Input conflict');

// AFTER:
LOG.dev('PLAYER_JUMP', { height, velocity });
LOG.error('PHYSICS_ERROR', {
    error: e,
    hint: 'Check body initialization',
    subsystem: 'physics',
});
LOG.warn('INPUT_CONFLICT', {
    keys: conflictingKeys,
    hint: 'User pressed conflicting keys',
});
```

### Phase 4: Performance Optimization

```javascript
// Add frame throttling
class FrameThrottle {
    constructor(maxPerFrame = 50) {
        this.maxPerFrame = maxPerFrame;
        this.frameCount = 0;
        this.currentFrame = 0;
    }

    shouldLog(frameNumber) {
        if (frameNumber !== this.currentFrame) {
            this.currentFrame = frameNumber;
            this.frameCount = 0;
        }
        return ++this.frameCount <= this.maxPerFrame;
    }
}

// Profile and validate
// Target: <0.5ms per frame overhead
```

### Phase 5: Error Integration

```javascript
// Enhance circuit breakers
class PhysicsManager {
    handleError(error) {
        this.errorCount++;

        // New structured logging
        LOG.error('PHYSICS_CIRCUIT_BREAKER', {
            error,
            errorCount: this.errorCount,
            threshold: this.errorThreshold,
            willDisable: this.errorCount >= this.errorThreshold,
            hint: 'Physics system experiencing repeated failures',
            crashDump: this.errorCount >= this.errorThreshold ? this.generateCrashDump() : null,
        });

        if (this.errorCount >= this.errorThreshold) {
            this.disable();
        }
    }
}
```

---

## 🔄 Status Update Protocol

After **EVERY** significant change:

```javascript
// 1. Load current status
const status = JSON.parse(fs.readFileSync('STATUS_OBSERVABILITY.json'));

// 2. Update relevant fields
status.implementation.lastUpdated = new Date().toISOString();
status.phases[currentPhase].completion = percentComplete;
status.metrics.consoleLogsRemaining = countRemainingConsoleLogs();
status.files.modified.push(modifiedFile);

// 3. Save status
fs.writeFileSync('STATUS_OBSERVABILITY.json', JSON.stringify(status, null, 2));

// 4. Commit status update
git add STATUS_OBSERVABILITY.json
git commit -m "chore: Update observability status - Phase X at Y%"
```

---

## 🚨 Blocker Resolution

When encountering a blocker:

1. **Document immediately**:

```javascript
status.implementation.blockers.push({
    phase: currentPhase,
    description: 'Detailed description',
    impact: 'high|medium|low',
    suggestedResolution: 'Proposed solution',
    timestamp: new Date().toISOString(),
});
```

2. **Attempt resolution**:

- Try suggested resolution
- If fails, try alternative approach
- If still blocked, escalate

3. **Clear when resolved**:

```javascript
status.implementation.blockers = status.implementation.blockers.filter(
    (b) => b.phase !== currentPhase
);
```

---

## ✅ Validation Checklists

### Per-Phase Validation

Each phase has specific validation criteria in [OBSERVABILITY_IMPLEMENTATION.md](OBSERVABILITY_IMPLEMENTATION.md#validation-criteria).

### Global Validation

Before marking any phase complete:

- [ ] All tests pass: `npm test`
- [ ] No console.\* in new code
- [ ] Documentation updated
- [ ] Status file current
- [ ] Performance profiled
- [ ] Backwards compatible

### Final Validation (Phase 9)

- [ ] All phases complete
- [ ] All validation flags true
- [ ] Performance <0.5ms/frame
- [ ] 100% error capture
- [ ] Agent queries functional
- [ ] Documentation complete

---

## 📊 Progress Tracking

Monitor overall progress:

```bash
# Check overall completion
cat STATUS_OBSERVABILITY.json | jq '[.phases[].completion] | add / length'

# Check validation status
cat STATUS_OBSERVABILITY.json | jq '.validation'

# Check remaining work
cat STATUS_OBSERVABILITY.json | jq '.metrics.consoleLogsRemaining'
```

---

## 🤖 Agent Collaboration

When multiple agents work on this:

1. **Claim phase ownership**:

```javascript
status.implementation.activeAgent = 'agent-name';
status.phases[phase].assignedTo = 'agent-name';
```

2. **Regular sync**:

- Push status updates every 30 minutes
- Check for conflicts before starting work
- Coordinate on shared files

3. **Handoff protocol**:

- Complete current phase or checkpoint
- Update status with detailed notes
- Clear activeAgent field
- Commit and push all changes

---

## 📚 Quick Reference

### File Locations

- **Status**: `STATUS_OBSERVABILITY.json`
- **Plan**: `OBSERVABILITY_IMPLEMENTATION.md`
- **Workflow**: `OBSERVABILITY_WORKFLOW.md` (this file)
- **Architecture**: `docs/architecture/Observability.md`
- **Current Error Handling**: `docs/systems/ERROR_HANDLING_LOGGING.md`

### Key Commands

```bash
# Check status
cat STATUS_OBSERVABILITY.json | jq '.implementation'

# Count console.log remaining
grep -r "console\." src/ | wc -l

# Run tests
npm test tests/observability/

# Profile performance
npm run profile

# Generate documentation
npm run docs:generate
```

### Critical Paths

1. **Fastest MVP**: Phases 0→1→3 (basic logging)
2. **Full System**: All phases in sequence
3. **Rollback**: `git checkout main -- src/`

---

## ⚡ Emergency Procedures

### If build breaks:

```bash
git stash
git checkout main -- package.json src/
npm install
npm test
```

### If performance degrades:

1. Disable sampling temporarily
2. Reduce buffer size to 500
3. Profile with Chrome DevTools
4. Identify bottleneck
5. Fix or rollback

### If tests fail:

1. Check STATUS_OBSERVABILITY.json for last change
2. Review modified files list
3. Run isolated test
4. Fix or revert specific change

---

This workflow guide ensures consistent, high-quality implementation of the observability system. Follow it precisely for best results.
