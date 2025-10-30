# Phase 5: Error Integration Enhancement Plan

**Phase**: 5 (Error Integration)
**Status**: 🔵 In Progress
**Estimated Time**: 2-3 hours
**Dependencies**: Phase 3, Phase 3.5 complete

---

## Executive Summary

Phase 5 enhances our error handling by integrating the observability system with circuit breakers, adding crash dump generation, implementing error pattern detection, and improving error recovery strategies.

### Current State Assessment

✅ **Already Complete (Phase 3)**:
- Circuit breakers in PhysicsManager and PlayerController
- Structured logging with LOG.fatal() on circuit breaker trips
- Error counts tracked
- Helpful hints included

✅ **Recently Complete (Phase 3.5)**:
- DebugContext integrated in Game scene
- Automatic context injection enabled
- State providers registered (Player, Physics, Input)

⚠️ **Phase 5 Enhancements Needed**:
1. Crash dump generation on fatal errors
2. Error pattern detection
3. Enhanced error recovery with context
4. Additional circuit breaker integrations

---

## Phase 5 Objectives

### 1. Crash Dump Generation
**Goal**: Capture complete game state on fatal errors

**Implementation Strategy**:
- Create `CrashDumpGenerator` utility class
- Generate crash dumps that include:
  - Full LogSystem export (recent logs, stats)
  - DebugContext snapshot (player, physics, input state)
  - Browser/environment information
  - Performance metrics
  - Error stack trace
- Integrate with circuit breakers
- Add to Game scene error handlers

### 2. Error Pattern Detection
**Goal**: Identify recurring error patterns automatically

**Implementation Strategy**:
- Create `ErrorPatternDetector` utility class
- Track error frequency by code
- Detect error cascades (multiple errors in short time)
- Identify error cycles (same error repeating)
- Generate pattern reports

### 3. Enhanced Error Recovery
**Goal**: Use context to make smarter recovery decisions

**Implementation Strategy**:
- Analyze circuit breaker errors with context
- Implement recovery strategies based on state
- Add recovery hints based on context
- Document recovery patterns

### 4. Error Visibility Improvements
**Goal**: Make errors more discoverable and actionable

**Implementation Strategy**:
- Enhanced error messages with context
- Error summaries in console
- Visual error indicators (optional)
- Agent-friendly error reports

---

## Implementation Plan

### Task 1: Create CrashDumpGenerator

**File**: `src/observability/utils/CrashDumpGenerator.js`

**Responsibilities**:
- Generate comprehensive crash dumps
- Include all relevant system state
- Format for human and agent readability
- Export to JSON for analysis

**API**:
```javascript
class CrashDumpGenerator {
    static generate(error, additionalContext = {}) {
        return {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            logs: LOG.getRecent(50),
            context: debugContext.captureSnapshot(),
            performance: {
                fps: game.loop.actualFps,
                frame: game.loop.frame,
                memory: performance.memory
            },
            environment: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            },
            additionalContext
        };
    }
}
```

### Task 2: Create ErrorPatternDetector

**File**: `src/observability/utils/ErrorPatternDetector.js`

**Responsibilities**:
- Track error frequencies
- Detect patterns and cascades
- Generate pattern reports
- Suggest fixes based on patterns

**API**:
```javascript
class ErrorPatternDetector {
    constructor(logSystem) {
        this.logSystem = logSystem;
        this.patterns = new Map();
    }

    analyzeRecent(timeWindowMs = 5000) {
        // Analyze recent errors for patterns
        const recentErrors = this.logSystem.getByLevel('error', 100);
        return {
            repeatingErrors: this.findRepeating(recentErrors),
            cascades: this.findCascades(recentErrors),
            mostCommon: this.getMostCommon(recentErrors)
        };
    }

    findRepeating(errors) {
        // Detect same error code repeating
    }

    findCascades(errors) {
        // Detect multiple different errors in short time
    }

    getMostCommon(errors) {
        // Get most frequently occurring errors
    }
}
```

### Task 3: Enhance Circuit Breakers with Crash Dumps

**Files to Modify**:
- `src/core/PhysicsManager.js`
- `src/modules/player/PlayerController.js`

**Enhancement**:
```javascript
// Before (current):
if (this.errorCount > 10) {
    LOG.fatal('PHYSICS_CIRCUIT_BREAKER', {
        subsystem: 'physics',
        message: 'Circuit breaker triggered',
        errorCount: this.errorCount,
        threshold: 10,
        hint: 'Check recent physics errors'
    });
    this.isActive = false;
}

// After (Phase 5):
if (this.errorCount > 10) {
    const crashDump = CrashDumpGenerator.generate(
        new Error('Physics circuit breaker triggered'),
        {
            subsystem: 'physics',
            errorCount: this.errorCount,
            threshold: 10,
            recentErrors: LOG.getByCode('PHYSICS_UPDATE_ERROR', 10)
        }
    );

    LOG.fatal('PHYSICS_CIRCUIT_BREAKER', {
        subsystem: 'physics',
        message: 'Circuit breaker triggered: too many errors, physics disabled',
        errorCount: this.errorCount,
        threshold: 10,
        hint: 'Check recent physics errors. May indicate Rapier API issues.',
        crashDump,
        recoveryStrategy: this.getRecoveryStrategy(crashDump)
    });

    this.isActive = false;
    this.triggerRecovery(crashDump);
}
```

### Task 4: Add Error Recovery Strategies

**Method to Add**:
```javascript
getRecoveryStrategy(crashDump) {
    // Analyze crash dump and suggest recovery
    const context = crashDump.context;

    if (context.physics.bodyCount > 1000) {
        return {
            strategy: 'reduce_bodies',
            action: 'Clear non-essential physics bodies',
            priority: 'high'
        };
    }

    if (this.errorCount > 20) {
        return {
            strategy: 'full_reset',
            action: 'Restart scene or return to main menu',
            priority: 'critical'
        };
    }

    return {
        strategy: 'retry',
        action: 'Wait and retry physics initialization',
        priority: 'medium'
    };
}

triggerRecovery(crashDump) {
    const strategy = this.getRecoveryStrategy(crashDump);

    LOG.warn('PHYSICS_RECOVERY_ATTEMPT', {
        subsystem: 'physics',
        message: `Attempting recovery: ${strategy.action}`,
        strategy
    });

    // Implement recovery based on strategy
    switch (strategy.strategy) {
        case 'reduce_bodies':
            this.cleanupBodies();
            break;
        case 'full_reset':
            this.requestSceneRestart();
            break;
        case 'retry':
            setTimeout(() => this.retryInitialization(), 1000);
            break;
    }
}
```

### Task 5: Integrate Pattern Detection in Game Scene

**Add to Game.js**:
```javascript
// In create() after DebugContext initialization
this.errorPatternDetector = new ErrorPatternDetector(LOG);

// In update() - periodic pattern check (every 5 seconds)
if (this.game.loop.frame % 300 === 0) {
    const patterns = this.errorPatternDetector.analyzeRecent(5000);

    if (patterns.repeatingErrors.length > 0 || patterns.cascades.length > 0) {
        LOG.warn('ERROR_PATTERNS_DETECTED', {
            subsystem: 'observability',
            message: 'Error patterns detected',
            patterns,
            hint: 'Multiple errors occurring. Check logs for details.'
        });
    }
}
```

---

## Files to Create

1. **`src/observability/utils/CrashDumpGenerator.js`**
   - Crash dump generation
   - State collection
   - Export formatting

2. **`src/observability/utils/ErrorPatternDetector.js`**
   - Pattern detection
   - Cascade analysis
   - Frequency tracking

3. **`src/observability/utils/index.js`**
   - Barrel exports for utilities

4. **`PHASE5_ERROR_INTEGRATION_PLAN.md`** (this file)
   - Implementation guide

---

## Files to Modify

1. **`src/core/PhysicsManager.js`**
   - Import CrashDumpGenerator
   - Enhance circuit breaker with crash dump
   - Add recovery strategies
   - Add triggerRecovery() method

2. **`src/modules/player/PlayerController.js`**
   - Import CrashDumpGenerator
   - Enhance circuit breaker with crash dump
   - Add recovery strategies
   - Add triggerRecovery() method

3. **`src/scenes/Game.js`**
   - Import ErrorPatternDetector
   - Initialize pattern detector
   - Add periodic pattern checking
   - Enhance error handlers with crash dumps

4. **`src/observability/core/index.js`**
   - Export utilities

---

## Testing Strategy

### Unit Tests

**File**: `tests/observability/utils.test.cjs`

**Test Cases**:
1. CrashDumpGenerator.generate() produces valid dumps
2. Crash dumps include all required sections
3. ErrorPatternDetector finds repeating errors
4. ErrorPatternDetector finds cascades
5. Pattern detection handles empty log buffer

### Integration Tests

**Scenarios**:
1. Trigger physics circuit breaker → verify crash dump generated
2. Trigger player circuit breaker → verify crash dump generated
3. Generate multiple errors → verify patterns detected
4. Circuit breaker with recovery → verify recovery attempted

### Manual Testing

**Test Plan**:
1. Start game
2. Intentionally trigger physics error
3. Verify crash dump in console
4. Verify recovery attempted
5. Check pattern detection warnings

---

## Performance Considerations

### Crash Dump Generation
- **Overhead**: ~2-5ms per crash dump
- **Frequency**: Only on fatal errors (very rare)
- **Impact**: Negligible (only happens on crashes)

### Pattern Detection
- **Overhead**: ~0.5ms per analysis
- **Frequency**: Every 5 seconds (300 frames)
- **Impact**: 0.0001ms per frame average

### Total Phase 5 Overhead
- **Normal operation**: ~0.0001ms per frame (pattern detection)
- **On fatal error**: ~5ms (crash dump generation)
- **Status**: Well within performance budget ✅

---

## Success Criteria

- [ ] CrashDumpGenerator creates comprehensive dumps
- [ ] Crash dumps include logs, context, performance, environment
- [ ] ErrorPatternDetector identifies patterns correctly
- [ ] Circuit breakers generate crash dumps on trip
- [ ] Recovery strategies implemented and tested
- [ ] Game scene integrates pattern detection
- [ ] All tests passing
- [ ] Build successful
- [ ] Performance targets met
- [ ] Documentation updated

---

## Implementation Checklist

### Phase 1: Utilities (1 hour)
- [ ] Create CrashDumpGenerator.js
- [ ] Create ErrorPatternDetector.js
- [ ] Create utils/index.js barrel export
- [ ] Write unit tests for utilities
- [ ] Verify tests pass

### Phase 2: Circuit Breaker Enhancement (45 min)
- [ ] Enhance PhysicsManager circuit breaker
- [ ] Add recovery strategies to PhysicsManager
- [ ] Enhance PlayerController circuit breaker
- [ ] Add recovery strategies to PlayerController
- [ ] Test circuit breakers with crash dumps

### Phase 3: Game Scene Integration (30 min)
- [ ] Add ErrorPatternDetector to Game scene
- [ ] Add periodic pattern checking
- [ ] Enhance Game scene error handlers
- [ ] Test pattern detection in running game

### Phase 4: Testing & Validation (45 min)
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Manual testing of circuit breakers
- [ ] Manual testing of pattern detection
- [ ] Performance validation

### Phase 5: Documentation (30 min)
- [ ] Update STATUS_OBSERVABILITY.json
- [ ] Update OBSERVABILITY_EVALUATION.md
- [ ] Document recovery strategies
- [ ] Commit Phase 5 completion

---

## Risk Mitigation

### Risk: Crash Dumps Too Large
**Mitigation**: Limit log buffer size, compress if needed

### Risk: Pattern Detection False Positives
**Mitigation**: Tune thresholds, require multiple occurrences

### Risk: Recovery Strategies Fail
**Mitigation**: Graceful degradation, fallback to scene restart

### Risk: Performance Impact
**Mitigation**: Minimal checks, only on fatal errors or periodic

---

## Next Steps After Phase 5

### Phase 6: Documentation Consolidation
- Update ERROR_HANDLING_LOGGING.md
- Create unified debugging guide
- Update INDEX.md

### Phase 7: Agent Tools & API
- Implement query API
- Add automated analysis
- Create debugging helpers

---

**Plan Created**: 2025-10-29
**Estimated Completion**: Same day (2-3 hours)
**Quality Standard**: A+ (same as Phase 3 and 3.5)
