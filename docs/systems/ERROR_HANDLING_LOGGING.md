# WynIsBuff2 - Error Handling & Logging System

**Document Version**: 1.1
**Last Updated**: 2025-10-29
**Status**: 🟡 **LIVING DOCUMENT** - Evolves with system improvements
**Related**: [INPUT_MOVEMENT_AUDIT.md](./INPUT_MOVEMENT_AUDIT.md), [ARCHITECTURE.md](../ARCHITECTURE.md), [Observability.md](../architecture/Observability.md)

**⚠️ MIGRATION NOTICE**: Logging system is transitioning to structured observability. See Section 5 for current standards.

---

## Document Purpose

This document provides a comprehensive evaluation of WynIsBuff2's error handling and logging architecture as it exists today. It serves as:

1. **Current State Reference** - Complete catalog of error handling patterns in use
2. **Debugging Guide** - How to diagnose and fix common error scenarios
3. **Development Guide** - Best practices for adding error handling to new code
4. **Living System** - Updated as error handling evolves and improves

**Why This Matters for Agentic Programming:**
- AI assistants need to understand error recovery patterns
- Circuit breakers affect system behavior that agents must know about
- Logging conventions guide agents in adding debug output
- Error handling gaps are opportunities for improvement

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Error Handling Architecture](#2-error-handling-architecture)
3. [Circuit Breaker Systems](#3-circuit-breaker-systems)
4. [Try-Catch Patterns](#4-try-catch-patterns)
5. [Logging Standards](#5-logging-standards)
6. [Critical Systems Analysis](#6-critical-systems-analysis)
7. [Known Issues](#7-known-issues)
8. [Development Guidelines](#8-development-guidelines)
9. [Debugging Procedures](#9-debugging-procedures)
10. [Improvement Tracking](#10-improvement-tracking)

---

## 1. Executive Summary

### Current State (2025-10-29 - Updated Post-Rapier Migration)

WynIsBuff2 employs a **multi-layered error handling architecture** with defensive programming, circuit breakers, and fallback mechanisms. The system prioritizes graceful degradation over complete failure.

**Recent Major Fix (October 2025)**: Successfully resolved Rapier 0.19+ API compatibility issues that were causing circuit breaker triggers. See [Section 10.1](#101-october-2025-rapier-019-migration-fixes) for details.

**Architecture Philosophy:**
- ✅ **Resilient**: Multiple layers of error containment
- ✅ **Graceful Degradation**: Systems disable rather than crash
- ✅ **Improved**: Comprehensive error logging with state dumps (October 2025)
- ✅ **Documented**: Complete error handling patterns documented
- ⚠️ **Circuit Breakers**: Prevented catastrophic failures during Rapier migration

### Key Metrics

| Metric | Count | Status |
|--------|-------|--------|
| Try-catch blocks in src/ | 17 | ✅ Good coverage |
| Circuit breakers | 2 | ✅ **VALIDATED** - Prevented crashes during migration |
| Silent failure points | 3+ | 🟡 Lower priority (physics now stable) |
| **Structured logging migration** | **147/293 (50%)** | 🟡 **IN PROGRESS** - Core systems complete |
| Logging statements | 293 total | ✅ Extensive + migrating to structured format |
| Error handling documentation | 100% | ✅ **DOCUMENTED + VALIDATED** |
| **Rapier 0.19+ Migration** | **Complete** | ✅ **RESOLVED** - All physics errors fixed |

### Most Common Error Scenario (Historical - Now Resolved)

~~**"Too many errors, player disabled"** or **"Too many errors, physics disabled"**~~ **✅ FIXED**

**What this meant** (before Rapier 0.19+ fixes):
- Circuit breaker triggered after repeated errors (5 for player, 10 for physics)
- Root cause: Rapier 0.19+ API breaking changes
- **Resolution**: See [Section 10.1](#101-october-2025-rapier-019-migration-fixes)

**Current Status**: Physics stable, jumping works, ground detection operational

---

## 2. Error Handling Architecture

### 2.1 Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Game Scene (Game.js)                              │
│ - try-catch in create() - displays error on screen         │
│ - try-catch per component in update()                      │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ Layer 2: PhysicsManager (Singleton)                        │
│ - Circuit breaker: 10 errors → disable physics             │
│ - try-catch init(), update(), updateGameObjects()          │
│ - Fallback: Emergency sprite position updates              │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ Layer 3: PlayerController (Instance)                       │
│ - Circuit breaker: 5 errors → disable player updates       │
│ - try-catch create(), update()                             │
│ - Fallback: Input system, sprite position update           │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ Layer 4: Sub-Systems (Movement, Collision, etc.)           │
│ - try-catch for individual calculations                    │
│ - No circuit breakers (rely on parent layer)               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Error Containment Strategy

**Primary Goal**: Prevent single component failure from crashing entire game

**Strategy:**
1. **Containment**: Try-catch blocks isolate failures to specific systems
2. **Circuit Breakers**: Disable failing systems after threshold (5-10 errors)
3. **Fallbacks**: Emergency recovery paths (fallback input, sprite updates)
4. **Partial Failures**: Loop-based systems continue even if items fail (platforms, enemies)
5. **Silent Degradation**: Some features disable without user notification (localStorage)

### 2.3 Error Recovery Mechanisms

| Mechanism | Location | Purpose |
|-----------|----------|---------|
| **Input Fallback** | PlayerController.js:272-289 | Direct key polling if InputManager fails |
| **Sprite Position Fallback** | PlayerController.js:263-269 | Emergency render update if physics fails |
| **Physics Sprite Update** | PhysicsManager.js:269-276 | Update sprites even if stepping fails |
| **Audio Context Resume** | AudioManager.js:138-144 | Retry audio on autoplay failures |
| **localStorage Graceful Failure** | GameStateManager.js:49-73 | Silent disable if storage unavailable |

---

## 3. Circuit Breaker Systems

### 3.1 Overview

Circuit breakers disable systems after repeated failures to prevent:
- Infinite error loops
- Performance degradation from continuous exception handling
- Cascading failures affecting unrelated systems

### 3.2 PlayerController Circuit Breaker

**File**: `src/modules/player/PlayerController.js`
**Lines**: 183-186 (guard), 254-256 (reset), 259-260 (increment)

```javascript
// Guard (Line 183-186)
if (this.errorCount > 5) {
    console.warn('[PlayerController] Too many errors, player disabled');
    return;  // EXITS UPDATE LOOP - NO MOVEMENT/PHYSICS
}

// Success reset (Line 256)
this.errorCount = 0;

// Error increment (Line 259-260)
this.errorCount = (this.errorCount || 0) + 1;
console.error(`[PlayerController] Error (${this.errorCount}/5):`, error);
```

**Threshold**: 5 errors
**Behavior**: Returns early from `update()` - player stops responding to input
**Counter Reset**: On any successful update loop
**User Impact**: Player becomes unresponsive, "too many errors" in console

**Common Causes:**
- Physics body missing or invalid
- NaN in movement calculations
- Invalid collider state
- Rapier physics errors propagating up

### 3.3 PhysicsManager Circuit Breaker

**File**: `src/core/PhysicsManager.js`
**Lines**: 192-196 (guard), 263 (reset), 266-267 (increment)

```javascript
// Guard (Line 192-196)
if (this.errorCount > 10) {
    console.warn('[PhysicsManager] Too many errors, physics disabled');
    return;  // EXITS UPDATE - NO PHYSICS SIMULATION
}

// Success reset (Line 263)
this.errorCount = 0;

// Error increment (Line 266-267)
this.errorCount = (this.errorCount || 0) + 1;
console.error(`[PhysicsManager] Error (${this.errorCount}/10):`, error);
```

**Threshold**: 10 errors
**Behavior**: Returns early from `update()` - entire physics world stops
**Counter Reset**: On any successful physics step
**User Impact**: All physics-based entities freeze, players can't move

**Common Causes:**
- Rapier world.step() failures
- Invalid rigid body states
- Accumulator overflow
- Memory/performance issues

### 3.4 Circuit Breaker Analysis

**Threshold Evaluation:**

| Threshold | System | Aggressive? | Justification |
|-----------|--------|-------------|---------------|
| 5 errors | PlayerController | ⚠️ **Maybe** | 5 frames at 60fps = 83ms to disable |
| 10 errors | PhysicsManager | ✅ **Reasonable** | 10 frames = 166ms, affects entire game |

**Issue: Threshold May Be Too Low**
- Transient errors (e.g., one bad frame) can accumulate quickly
- No timeout-based reset - counter only resets on success
- If physics fails, player can't succeed → permanent disable

**Potential Improvement:**
```javascript
// Time-based circuit breaker (not currently implemented)
if (this.errorCount > 5 && (Date.now() - this.lastErrorTime) < 1000) {
    console.warn('[PlayerController] Too many errors in <1s, disabling');
    return;
}
```

---

## 4. Try-Catch Patterns

### 4.1 Pattern Catalog

**Pattern 1: Component Initialization**
```javascript
// Game.js:53-169, PlayerController.js:73-134
try {
    // Initialize manager/controller
    const result = await manager.init(...);
    if (!result) throw new Error('Initialization failed');
} catch (error) {
    console.error('[Component] Initialization error:', error);
    // Display error to user or return early
}
```
- **Used in**: Game scene create(), manager init() methods
- **Purpose**: Catch construction/initialization failures
- **Recovery**: Often terminal - display error, return early

**Pattern 2: Update Loop Protection**
```javascript
// PlayerController.js:188-270, PhysicsManager.js:187-277
try {
    // Critical update logic
    this.calculateMovement(dt);
    this.physicsManager.update(delta);

    this.errorCount = 0;  // Reset on success
} catch (error) {
    this.errorCount = (this.errorCount || 0) + 1;
    console.error(`[System] Error (${this.errorCount}/MAX):`, error);

    // Fallback: Try emergency recovery
    try {
        this.emergencyUpdate();
    } catch (fallbackError) {
        console.error('[System] Fallback also failed:', fallbackError);
    }
}
```
- **Used in**: All manager/controller update() methods
- **Purpose**: Prevent single frame error from crashing game
- **Recovery**: Increment error counter, try fallback

**Pattern 3: Loop with Per-Item Catch**
```javascript
// LevelLoader.js:141-156, PlatformFactory.js, CollectibleManager.js
platforms.forEach((cfg, index) => {
    try {
        this.createPlatform(cfg);
    } catch (error) {
        console.error(`[Factory] Error creating platform ${index+1}:`, error);
        // Continue to next item - partial failure OK
    }
});
```
- **Used in**: Level loading, entity spawning
- **Purpose**: Prevent one bad item from stopping entire level load
- **Recovery**: Log error, continue with remaining items

**Pattern 4: Async Import with Catch**
```javascript
// LevelLoader.js:165-181, 184-199
import('../enemy/PulsatingBoss.js')
    .then(module => {
        this.boss = new module.PulsatingBoss(...);
    })
    .catch(error => {
        console.error('[LevelLoader] Error importing boss:', error);
        // ⚠️ NO FALLBACK - boss simply doesn't spawn
    });
```
- **Used in**: Dynamic enemy/boss imports
- **Purpose**: Prevent import failure from blocking level load
- **Recovery**: ⚠️ **None** - entity missing, level continues (potentially unwinnable)

**Pattern 5: Storage Access Guard**
```javascript
// GameStateManager.js:49-73
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    this.initialized = true;
} catch (error) {
    console.warn('[GameStateManager] localStorage unavailable:', error);
    this.initialized = false;
    // ⚠️ Silent degradation - progress saving disabled
}
```
- **Used in**: GameStateManager, persistence features
- **Purpose**: Handle environments where localStorage is blocked
- **Recovery**: Silent degradation - feature disabled without user notification

### 4.2 Try-Catch Coverage by File

| File | Blocks | Critical? | Coverage |
|------|--------|-----------|----------|
| Game.js | 2 | ✅ Yes | 🟢 Good |
| PhysicsManager.js | 3 | ✅ Yes | 🟢 Good |
| PlayerController.js | 2 | ✅ Yes | 🟢 Good |
| LevelLoader.js | 6+ | ⚠️ Medium | 🟡 Partial |
| GameStateManager.js | 4 | ⚠️ Medium | 🟢 Good |
| InputManager.js | 0 | ⚠️ Medium | 🟡 Relies on Phaser |
| AudioManager.js | 0 | ⚠️ Medium | 🟡 Uses callbacks |
| EventBus.js | 1 | ✅ Yes | 🟢 Good |

---

## 5. Logging Standards

### 5.1 Structured Logging System (🟢 **ACTIVE MIGRATION** - October 2025)

**Status**: Migrating from console.* to structured LogSystem

**Progress**: 147/293 statements migrated (50%)
- ✅ PhysicsManager.js, PlayerController.js (complete)
- ✅ InputManager.js, AudioManager.js, GameStateManager.js (complete)
- 🟡 Game.js, LevelLoader.js, remaining utilities (in progress)

**Architecture**: Centralized LogSystem with bounded buffers
- Location: `src/observability/core/LogSystem.js`
- Buffer: 2000 entries max (circular buffer)
- Performance: <0.5ms overhead per frame
- Import: `import { LOG } from '../observability/core/LogSystem.js';`

### 5.2 Structured Logging API

**New Standard Format**:
```javascript
LOG.error('ERROR_CODE_NAME', {
    subsystem: 'physics',
    error,
    message: 'Human-readable description',
    state: { /* diagnostic data */ },
    hint: 'How to fix or debug this issue'
});
```

**Log Levels**:
| Level | Method | When to Use | Sampling |
|-------|--------|-------------|----------|
| ERROR | `LOG.error()` | Failures, exceptions, data loss | 100% |
| WARN | `LOG.warn()` | Degradation, fallbacks, unexpected states | 100% |
| INFO | `LOG.info()` | Important state changes | 100% |
| DEV | `LOG.dev()` | Normal flow, initialization, debug | 1% sampling |

**Error Code Naming**: `SUBSYSTEM_DESCRIPTION`
- Examples: `PHYSICS_INIT_ERROR`, `PLAYER_UPDATE_ERROR`, `GAMESTATE_SAVE_PROGRESS_ERROR`
- Machine-parsable for AI agent debugging
- Enables pattern matching and automated analysis

**Migrated Examples**:
```javascript
// OLD (deprecated):
console.error('[PhysicsManager] Error in update:', error);

// NEW (structured):
LOG.error('PHYSICS_UPDATE_ERROR', {
    subsystem: 'physics',
    error,
    message: 'Physics update error 5/10',
    errorCount: 5,
    threshold: 10,
    state: { hasWorld: !!this.world, bodyCount: this.bodyToSprite.size },
    hint: 'Check Rapier body state. May indicate invalid body configuration.'
});
```

### 5.3 Legacy Console Logging (🔴 **DEPRECATED**)

**DO NOT use console.* in new code** - use LOG.* methods instead

**Legacy Pattern** (being phased out):
```javascript
console.log('[ModuleName] Message');  // ❌ Deprecated
console.warn('[ModuleName] Warning'); // ❌ Deprecated
console.error('[ModuleName] Error:', error); // ❌ Deprecated
```

**Remaining Legacy Files** (not yet migrated):
- ~146 console statements across scene/utility files
- Migration ongoing - see STATUS_OBSERVABILITY.json for tracking

### 5.4 Conditional Logging

**Purpose**: Reduce console spam while maintaining diagnostic capability

**Pattern:**
```javascript
// Low-frequency sampling (0.5% - 1% of frames)
if (Math.random() < 0.01) {
    console.log('[PlayerController] InputState:', inputState);
}
```

**Locations:**
- InputManager.js:92-94 (0.5% chance per frame)
- PlayerController.js:209-211 (1% chance per frame)

**Performance Impact**: Negligible (~3 logs/sec worst case)

### 5.5 Initialization Logging

**All managers log during init** - GOOD for debugging, verbose but necessary

**Example (InputManager.js):**
```
Line 30: '[InputManager] Initializing...'
Line 37: '[InputManager] Created cursor keys'
Line 43: '[InputManager] Created WASD and SPACE keys'
Line 49: '[InputManager] Created R and C keys'
Line 79: '[InputManager] All keys initialized:'
Line 83: '[InputManager] Initialization complete'
```

**Status**: ✅ **Acceptable** - Initialization is one-time, verbose logging OK

### 5.6 Update Loop Logging

**Performance-Critical**: Runs 60 times per second

**Current Practice**: ✅ **Minimal logging in hot paths**
- PhysicsManager.update(): Only logs when frame budget exceeded
- PlayerController.update(): Only conditional debug logs
- Game.update(): No logging unless error

**Exception**: Some systems log every frame when debug mode enabled

---

## 6. Critical Systems Analysis

### 6.1 PhysicsManager Error Handling

**File**: `src/core/PhysicsManager.js`

**Error Handling Strategy:**

```javascript
// Update loop (Lines 187-277)
try {
    // TRIAGE FIX: Guard against error cascade
    if (this.errorCount > 10) {
        console.warn('[PhysicsManager] Too many errors, physics disabled');
        return;
    }

    // Physics stepping with fixed timestep accumulator
    this.accumulator += Math.min(delta / 1000, this.maxAccumulator);

    let steps = 0;
    while (this.accumulator >= this.fixedTimeStep && steps < this.maxStepsPerFrame) {
        this.world.step();  // ⚠️ CAN THROW
        this.accumulator -= this.fixedTimeStep;
        steps++;
    }

    // Success
    this.errorCount = 0;

} catch (error) {
    this.errorCount = (this.errorCount || 0) + 1;
    console.error(`[PhysicsManager] Error (${this.errorCount}/10):`, error);

    // Fallback: Try to update sprites at least
    try {
        this.updateGameObjects(0);  // Zero interpolation
    } catch (fallbackError) {
        console.error('[PhysicsManager] Fallback update failed:', fallbackError);
    }
}
```

**Vulnerabilities:**
1. **Accumulator not reset on error** (Line 252) - Could skip physics frames silently
2. **Root cause lost** - Only final exception logged, not what caused Rapier failure
3. **10 error threshold may be too high** - 166ms of failures before disable

**Strengths:**
- Emergency sprite update fallback prevents render freeze
- Circuit breaker prevents infinite error loops
- Error count included in messages

### 6.2 PlayerController Error Handling

**File**: `src/modules/player/PlayerController.js`

**Error Handling Strategy:**

```javascript
// Update loop (Lines 176-266)
try {
    // Multiple validation checkpoints
    if (!this.body || !this.characterController || !this.collider || !this.sprite) {
        console.warn('[PlayerController] Missing essential components');
        return;
    }

    if (this.errorCount > 5) {
        console.warn('[PlayerController] Too many errors, player disabled');
        return;
    }

    // Validate deltaTime
    if (!Number.isFinite(dt) || dt <= 0) {
        console.warn('[PlayerController] Invalid deltaTime:', deltaTime);
        return;
    }

    // Get input snapshot
    let inputState;
    if (this.inputManager && this.inputManager.getSnapshot) {
        inputState = this.inputManager.getSnapshot();
    } else {
        console.warn('[PlayerController] Using fallback input polling');
        inputState = this.createFallbackInputState();  // ✅ FALLBACK
    }

    // Calculate movement
    const desiredMovement = this.calculateMovementFromInput(inputState, dt);

    // Validate movement vector
    if (!desiredMovement || !Number.isFinite(desiredMovement.x) || !Number.isFinite(desiredMovement.y)) {
        console.warn('[PlayerController] Invalid movement vector');
        return;
    }

    // Physics integration
    this.characterController.computeColliderMovement(this.collider, desiredMovement);
    const correctedMovement = this.characterController.computedMovement();

    // More validation...

    this.errorCount = 0;  // Success

} catch (error) {
    this.errorCount = (this.errorCount || 0) + 1;
    console.error(`[PlayerController] Error (${this.errorCount}/5):`, error);

    // Emergency fallback: At least render the player
    try {
        if (this.body && this.sprite) {
            this.updateSpritePosition();
        }
    } catch (fallbackError) {
        console.error('[PlayerController] Fallback failed:', fallbackError);
    }
}
```

**Strengths:**
- ✅ Defensive programming with multiple validation checkpoints
- ✅ Fallback input system if InputManager unavailable
- ✅ Emergency sprite update if main update fails
- ✅ Clear error count in messages

**Vulnerabilities:**
1. **5 error threshold aggressive** - 83ms to disable at 60fps
2. **"Too many errors" message non-specific** - Doesn't indicate what failed
3. **No timeout-based reset** - Once disabled, stays disabled until restart

### 6.3 InputManager Error Handling

**File**: `src/core/InputManager.js`

**Error Handling Strategy:**

**NO try-catch blocks** - Relies on Phaser's input system

**Defensive Patterns:**
```javascript
// getSnapshot() (Lines 90-108)
getSnapshot() {
    // Guard against uninitialized keys
    if (!this.keys.cursors || !this.keys.SPACE) {
        console.warn('[InputManager] Keys not initialized, returning empty state');
        return createEmptyInputState();  // ✅ SAFE FALLBACK
    }

    // Create snapshot with edge detection
    return {
        left: this.keys.cursors.left.isDown || this.keys.A.isDown,
        // ...
    };
}
```

**Strengths:**
- ✅ Safe fallback (empty InputState) if keys not initialized
- ✅ No complex error handling needed (Phaser handles key events)

**Vulnerabilities:**
1. ⚠️ If Phaser key creation silently fails, InputManager won't catch it
2. ⚠️ No validation that keyboard actually exists in browser
3. ⚠️ Assumption that Phaser types are always valid

### 6.4 Game Scene Error Handling

**File**: `src/scenes/Game.js`

**Error Handling Strategy:**

```javascript
// Create method (Lines 53-169)
async create() {
    try {
        // Initialize all managers
        this.eventSystem = new EventSystem();
        this.inputManager = InputManager.getInstance();
        this.inputManager.init(this, this.eventSystem);

        const physicsInitialized = await this.physicsManager.init(...);
        if (!physicsInitialized) {
            throw new Error('Failed to initialize physics');
        }

        // ... more initialization

    } catch (error) {
        console.error('[Game] Error in create method:', error);

        // ✅ Display error on screen for debugging
        this.add.text(512, 400, 'ERROR: ' + error.message, {
            fontFamily: 'Arial', fontSize: 16, color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);
    }
}

// Update method (Lines 521-572)
update(time, delta) {
    try {
        this.physicsManager.update(delta);
        if (this.levelManager) this.levelManager.update(delta);
        if (this.playerController) this.playerController.update(delta);

        // Per-component try-catch for enemies/bosses
        if (this.enemies) {
            this.enemies.forEach(enemy => {
                try {
                    enemy.update(time, delta);
                } catch (err) {
                    console.error('[Game] Error updating enemy:', err);
                }
            });
        }
    } catch (error) {
        console.error('[Game] Error in update:', error);
    }
}
```

**Strengths:**
- ✅ Displays initialization errors on screen (user-visible)
- ✅ Per-enemy error handling prevents one bad enemy from breaking all
- ✅ Main managers (physics, level, player) have their own error handling

**Issue:**
- Main managers NOT wrapped in try-catch in update()
- Assumption: They handle their own errors (which they do)

---

## 7. Known Issues

### 7.1 Critical Issues (HIGH PRIORITY)

#### ISSUE #1: "Too Many Errors" Message Non-Informative

**Severity**: 🔴 **HIGH** - Affects debugging and user experience

**Location**:
- PlayerController.js:184
- PhysicsManager.js:194

**Problem**:
When circuit breaker triggers, users see generic "too many errors" message but actual error context is lost in previous frames.

**Example Scenario:**
```
Frame 1: Physics body missing → error 1
Frame 2: Movement calculation returns NaN → error 2
Frame 3: Collider state invalid → error 3
Frame 4: Sprite position fails → error 4
Frame 5: Another NaN → error 5
Frame 6: "Too many errors, player disabled" → NO INFO ABOUT ROOT CAUSE
```

**Impact**:
- Users can't self-diagnose issues
- Developers need to reproduce bug to see actual errors
- Support burden increases

**Recommended Fix**:
```javascript
// Track first error for context
if (!this.firstError && error) {
    this.firstError = error;
}

if (this.errorCount > 5) {
    console.error('[PlayerController] Too many errors, player disabled');
    console.error('[PlayerController] First error was:', this.firstError);
    return;
}
```

#### ISSUE #2: Silent Boss/Enemy Import Failures

**Severity**: 🔴 **HIGH** - Game-breaking

**Location**: LevelLoader.js:165-181, 184-199

**Problem**:
Dynamic imports fail silently - boss/enemy simply doesn't spawn. Level becomes unwinnable without indication.

**Example:**
```javascript
import('../enemy/PulsatingBoss.js')
    .catch(error => {
        console.error('[LevelLoader] Error importing boss:', error);
        // ⚠️ NO FALLBACK - Level continues without boss
    });
```

**Impact**:
- Network failures result in missing critical entities
- No retry mechanism
- No user notification

**Recommended Fix**:
```javascript
.catch(error => {
    console.error('[LevelLoader] Boss import failed, using fallback:', error);
    // Spawn generic boss or display error to user
    this.showLevelError('Failed to load level content');
});
```

#### ISSUE #3: Circuit Breaker Doesn't Reset on Timeout

**Severity**: 🟡 **MEDIUM** - Gameplay disruption

**Location**: PlayerController.js:183, PhysicsManager.js:192

**Problem**:
Once circuit breaker triggers, it never resets unless update succeeds. If physics permanently fails, player is permanently disabled.

**Example Cascade:**
```
Physics fails → Player can't move → Player errors accumulate
→ Player circuit breaker triggers → Player permanently disabled
→ Even if physics recovers, player stays disabled
```

**Recommended Fix**:
```javascript
// Time-based reset
const ERROR_RESET_TIMEOUT = 2000; // 2 seconds

if (this.errorCount > 5) {
    if (Date.now() - this.firstErrorTime > ERROR_RESET_TIMEOUT) {
        console.warn('[PlayerController] Resetting error count after timeout');
        this.errorCount = 0;
        this.firstErrorTime = null;
    } else {
        console.warn('[PlayerController] Too many errors in short time, disabling');
        return;
    }
}
```

### 7.2 Medium Priority Issues

#### ISSUE #4: localStorage Silent Degradation

**Severity**: 🟡 **MEDIUM** - Data loss risk

**Location**: GameStateManager.js:49-73

**Problem**:
If localStorage fails (blocked, quota exceeded), progress saving silently disables without user notification.

**Impact**: Players lose all progress without warning

**Recommended Fix**: Display warning to user if storage unavailable

#### ISSUE #5: No Error Aggregation

**Severity**: 🟡 **MEDIUM**

**Problem**: If multiple systems error simultaneously, only latest error visible in logs. Cascade failures masked.

**Recommended Fix**: Error aggregation service to track all errors in a frame

#### ISSUE #6: EventBus Listener Failures Silent

**Severity**: 🟡 **MEDIUM**

**Location**: EventBus.js:58-64

**Problem**: Event listeners throwing exceptions are caught and logged but not aggregated. State changes could be missed.

### 7.3 Low Priority Issues

#### ISSUE #7: Conditional Logging Rates Not Tunable

**Severity**: 🟢 **LOW**

**Problem**: Debug logging rates hardcoded (0.5%, 1%). Can't adjust without code changes.

**Recommended Fix**: Logging configuration object

#### ISSUE #8: No Error Metrics

**Severity**: 🟢 **LOW**

**Problem**: No tracking of which systems error most frequently

**Recommended Fix**: Error metrics collection for telemetry

---

## 8. Development Guidelines

### 8.1 Adding Error Handling to New Code

**When adding a new system, follow this checklist:**

1. ✅ **Wrap initialization in try-catch**
   ```javascript
   init() {
       try {
           // Initialize
           this.setInitialized();
       } catch (error) {
           console.error('[NewSystem] Initialization failed:', error);
           return false;
       }
   }
   ```

2. ✅ **Wrap update loops in try-catch**
   ```javascript
   update(delta) {
       try {
           // Update logic
           this.errorCount = 0;
       } catch (error) {
           this.errorCount = (this.errorCount || 0) + 1;
           console.error(`[NewSystem] Error (${this.errorCount}/MAX):`, error);
       }
   }
   ```

3. ✅ **Add circuit breaker if critical**
   ```javascript
   update(delta) {
       if (this.errorCount > THRESHOLD) {
           console.warn('[NewSystem] Too many errors, disabling');
           return;
       }
       // ... rest of update
   }
   ```

4. ✅ **Provide fallback mechanisms**
   ```javascript
   try {
       this.primaryMethod();
   } catch (error) {
       console.warn('[NewSystem] Primary method failed, using fallback');
       this.fallbackMethod();
   }
   ```

5. ✅ **Use consistent logging format**
   ```javascript
   console.log('[ModuleName] Initialization complete');
   console.warn('[ModuleName] Degraded mode: using fallback');
   console.error('[ModuleName] Critical failure:', error);
   ```

### 8.2 Error Handling Anti-Patterns

**❌ DON'T DO THIS:**

1. **Empty Catch Blocks**
   ```javascript
   try {
       dangerousOperation();
   } catch (error) {
       // Silent failure - NO! At minimum log the error
   }
   ```

2. **Catch Without Context**
   ```javascript
   catch (error) {
       console.error(error);  // Missing module prefix and context
   }
   ```

3. **No Recovery Strategy**
   ```javascript
   try {
       criticalOperation();
   } catch (error) {
       console.error('Failed');
       // No fallback, no circuit breaker, no graceful degradation
   }
   ```

4. **Swallowing Errors in Async**
   ```javascript
   async function loadData() {
       try {
           const data = await fetch('/api/data');
           return data;
       } catch (error) {
           return null;  // Silently returns null, caller doesn't know about error
       }
   }
   ```

### 8.3 Logging Best Practices

**✅ DO THIS:**

1. **Use Module Prefixes**
   ```javascript
   console.log('[PhysicsManager] World initialized at 60Hz');
   ```

2. **Include Error Counts**
   ```javascript
   console.error(`[System] Error (${this.errorCount}/${MAX}):`, error);
   ```

3. **Log State Transitions**
   ```javascript
   console.log('[Manager] Transitioning from LOADING → READY');
   ```

4. **Conditional Logging in Hot Paths**
   ```javascript
   if (Math.random() < 0.01) {  // 1% sampling
       console.log('[HotPath] Current state:', state);
   }
   ```

5. **Include Context**
   ```javascript
   console.error('[LevelLoader] Failed to create platform', {
       index: i,
       config: platformConfig,
       error: error.message
   });
   ```

---

## 9. Debugging Procedures

### 9.1 "Too Many Errors, Player Disabled"

**Symptom**: Player stops responding to input, console shows "Too many errors, player disabled"

**Root Cause Analysis:**

1. **Check Console for Previous Errors**
   - Look for errors BEFORE "too many errors" message
   - First error in sequence is usually the root cause

2. **Common Root Causes:**
   - ❌ Physics body missing/invalid
   - ❌ NaN in velocity/movement calculations
   - ❌ Invalid collider state
   - ❌ Rapier physics errors

3. **Diagnostic Steps:**

   **Step 1**: Enable temporary detailed logging
   ```javascript
   // In PlayerController.js update() - temporarily add:
   console.log('[DEBUG] errorCount:', this.errorCount);
   console.log('[DEBUG] body:', !!this.body);
   console.log('[DEBUG] characterController:', !!this.characterController);
   console.log('[DEBUG] velocity:', this.velocity);
   ```

   **Step 2**: Check for NaN propagation
   ```javascript
   // Add after movement calculation:
   if (!Number.isFinite(desiredMovement.x) || !Number.isFinite(desiredMovement.y)) {
       console.error('[DEBUG] Movement is NaN!', {
           velocity: this.velocity,
           dt: dt,
           input: inputState
       });
   }
   ```

   **Step 3**: Verify physics state
   ```javascript
   // Check if physics is also failing:
   console.log('[DEBUG] Physics errorCount:', this.physicsManager.errorCount);
   ```

4. **Recovery Options:**

   **Option A**: Reload the level
   - Press R key (level reset)
   - Circuit breaker will reset

   **Option B**: Restart scene
   ```javascript
   this.scene.restart();
   ```

   **Option C**: Hot reload (dev mode)
   - Save any file to trigger Vite HMR
   - Error counters reset

### 9.2 "Too Many Errors, Physics Disabled"

**Symptom**: Entire game freezes, all physics stops, console shows "Too many errors, physics disabled"

**Root Cause Analysis:**

1. **Check Rapier Initialization**
   ```javascript
   console.log('[DEBUG] Rapier initialized:', !!RAPIER);
   console.log('[DEBUG] World exists:', !!this.world);
   ```

2. **Check for Invalid Bodies**
   - Look for errors about "body removed" or "invalid handle"
   - Bodies deleted but still referenced

3. **Check Frame Rate**
   - If FPS drops, accumulator can overflow
   - `maxStepsPerFrame` exceeded

4. **Diagnostic Steps:**

   **Step 1**: Log physics state
   ```javascript
   // In PhysicsManager.js update():
   console.log('[DEBUG] Accumulator:', this.accumulator);
   console.log('[DEBUG] World.bodies count:', this.world.bodies.len());
   console.log('[DEBUG] ErrorCount:', this.errorCount);
   ```

   **Step 2**: Check for memory issues
   ```javascript
   console.log('[DEBUG] Performance memory:', performance.memory);
   ```

   **Step 3**: Try stepping physics manually
   ```javascript
   // In browser console:
   game.scene.scenes[0].physicsManager.world.step();
   ```

### 9.3 Silent Failures (Boss/Enemy Missing)

**Symptom**: Level loads but boss/enemy doesn't appear, no errors in console

**Root Cause**: Dynamic import failed silently

**Diagnostic Steps:**

1. **Check Network Tab**
   - Open DevTools → Network
   - Look for failed requests to .js files

2. **Check Console for Import Errors**
   - Search for "Error importing"

3. **Verify File Exists**
   ```bash
   ls src/enemy/PulsatingBoss.js
   ```

4. **Test Import Directly**
   ```javascript
   // In browser console:
   import('../enemy/PulsatingBoss.js')
       .then(m => console.log('Import success:', m))
       .catch(e => console.error('Import failed:', e));
   ```

---

## 10. Improvement Tracking

### 10.1 October 2025: Rapier 0.19+ Migration Fixes

**Status**: ✅ **COMPLETE** - All critical physics errors resolved
**Documentation**: See [RAPIER_019_MIGRATION.md](../technology/RAPIER_019_MIGRATION.md)

#### The Problem: Cascading Physics Errors

Circuit breakers were triggering with "too many errors" messages due to Rapier 0.19+ API breaking changes. The error handling system was working as designed, but the underlying cause was API incompatibility.

**Console Output (Before Fix)**:
```
[PhysicsManager] ERROR 1/10 in update loop
Error Type: Error
Error Message: expected instance of z
  - world: true
  - accumulator: 0.016

[PlayerController] ERROR 1/5 in update loop
Error Type: TypeError
Error Message: this.characterController.isGrounded is not a function
  - body: true
  - characterController: true
  - velocityY: 9.8

[PhysicsManager] Too many errors, physics disabled
[PlayerController] Too many errors, player disabled
```

#### Root Causes Identified

**1. EventQueue Requirement** (`Error: expected instance of z`)
- **Location**: PhysicsManager.js:231
- **Cause**: `world.step()` signature changed in Rapier 0.19+
- **Old API**: `world.step(integrationParameters)`
- **New API**: `world.step(eventQueue)`
- **Fix**: Created EventQueue and migrated integration parameters to world object

**2. Body Iteration API** (`world.bodies.forEach is not a function`)
- **Location**: PhysicsManager.js:287
- **Cause**: `world.bodies` collection removed in Rapier 0.19+
- **Old API**: `world.bodies.forEach(body => {...})`
- **New API**: `world.forEachRigidBody(body => {...})`
- **Fix**: Replaced all forEach calls with forEachRigidBody iterator

**3. Ground Detection API** (`isGrounded is not a function`, `numGroundedColliders is undefined`)
- **Location**: PlayerController.js:337
- **Cause**: Both `isGrounded()` and `numGroundedColliders` removed in Rapier 0.19+
- **Discovery**: Property introspection revealed APIs don't exist
- **Fix**: Implemented physics-based ground detection algorithm

**4. Landing Event Data Structure** (`Cannot read properties of undefined (reading 'y')`)
- **Location**: PlayerController.js:559, ParticleManager.js:209
- **Cause**: Event emitted incomplete data structure
- **Fix**: Structured event data with both position and velocity as plain objects

#### Solutions Implemented

**PhysicsManager.js Fixes**:
```javascript
// EventQueue creation (lines 55-57)
this.eventQueue = new RAPIER.EventQueue(true);

// Integration parameters migration (lines 226-229)
this.world.integrationParameters.dt = fixedTimeStep;
this.world.integrationParameters.numSolverIterations = 8;

// Physics step with EventQueue (line 234)
this.world.step(this.eventQueue);

// Collision event processing (lines 239-263)
this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
    if (started) this.handleCollision(handle1, handle2);
});

// Body iteration (line 329)
this.world.forEachRigidBody(body => {
    const sprite = this.bodyToSprite.get(body.handle);
    // ... update sprite
});
```

**PlayerController.js Fixes**:
```javascript
// Physics-based ground detection (lines 347-381)
updateGroundState(desiredMovement, correctedMovement) {
    const GROUND_THRESHOLD = 0.01;

    // Check if falling movement was blocked
    const isFalling = this.velocity.y > 0;
    const verticalBlocked = isFalling &&
        Math.abs(correctedMovement.y) < Math.abs(desiredMovement.y) - GROUND_THRESHOLD;

    // Check if at rest
    const atRest = Math.abs(this.velocity.y) < GROUND_THRESHOLD;

    this.isGrounded = verticalBlocked || atRest;
}

// Proper event data structure (lines 559-570)
const position = this.body.translation();
this.eventSystem.emit(EventNames.PLAYER_LAND, {
    position: { x: position.x, y: position.y },
    velocity: { x: this.velocity.x, y: this.velocity.y }
});
```

#### Error Handling Enhancements

**Enhanced State Dumps**:
```javascript
// PhysicsManager error logging (lines 295-306)
console.error(`[PhysicsManager] ═══════════════════════════════════════════`);
console.error(`[PhysicsManager] ERROR ${this.errorCount}/10 in update loop`);
console.error(`[PhysicsManager] Error Type: ${error.name}`);
console.error(`[PhysicsManager] Error Message: ${error.message}`);
console.error(`[PhysicsManager] Stack Trace:`);
console.error(error.stack);
console.error(`[PhysicsManager] State at error:`);
console.error(`  - world: ${!!this.world}`);
console.error(`  - accumulator: ${this.accumulator}`);
console.error(`  - bodyToSprite.size: ${this.bodyToSprite?.size || 'N/A'}`);
console.error(`  - delta: ${arguments[0]}`);
```

**Property Introspection for Debugging**:
```javascript
// Revealed actual available API
console.log('[PlayerController] CharacterController properties:',
    Object.keys(this.characterController));
// Output: ['params', 'bodies', 'colliders', 'queries', 'raw',
//          'rawCharacterCollision', '_applyImpulsesToDynamicBodies', '_characterMass']
// Notably missing: numGroundedColliders, isGrounded
```

#### Circuit Breaker Validation

**Result**: Circuit breakers functioned perfectly during migration
- **PhysicsManager**: Stopped at 10 errors, preventing infinite error loops
- **PlayerController**: Stopped at 5 errors, preserving system stability
- **Emergency Fallbacks**: Sprite updates continued even when physics failed
- **No Crashes**: System remained responsive throughout debugging

#### Debugging Methodology

1. **Comprehensive Logging**: State dumps revealed exact error conditions
2. **Property Introspection**: Discovered missing APIs through dynamic inspection
3. **Console Analysis**: User provided detailed technical summaries
4. **Iterative Fixes**: Fixed errors revealed next underlying issue
5. **Validation**: Ground detection logs confirmed fixes worked

#### Outcome

**Before**:
- ❌ Physics disabled after 10 errors
- ❌ Player disabled after 5 errors
- ❌ No jumping functionality
- ❌ Sprites frozen in place

**After**:
- ✅ Physics running at 60 FPS
- ✅ Player movement smooth
- ✅ Jumping fully functional
- ✅ Ground detection accurate
- ✅ Landing particles display correctly
- ✅ No errors in console

**Commits**:
- `dd1bcfe` - Implement EventQueue for Rapier 0.19+
- `fdcb0e9` - Use numGroundedColliders() API
- `4b6711b` - Access as property not method
- `5ceacaf` - Inspect available properties
- `1c24d46` - Add ground detection logging
- `a139ad7` - Implement physics-based ground detection
- `008439b` - Comprehensive Rapier documentation
- `fde4fb0` - Fix landing event handler TypeError
- `0379689` - Update INDEX.md with migration guide
- `e1f09e1` - Add Rapier API evolution research

#### Lessons Learned

1. **Circuit breakers worked**: Prevented system crash during migration
2. **State dumps essential**: Revealed exact error conditions and state
3. **Property introspection**: Critical for discovering actual available APIs
4. **User collaboration**: Technical console analysis accelerated debugging
5. **Documentation matters**: Breaking changes need comprehensive guides

**See Also**:
- [RAPIER_019_MIGRATION.md](../technology/RAPIER_019_MIGRATION.md) - Complete migration guide
- [RapierPhysics.md](../technology/RapierPhysics.md) - Updated Rapier integration patterns
- [MovementSystem.md](./MovementSystem.md) - Modern movement implementation
- [rapier-updated-api-research.md](../design/rapier-updated-api-research.md) - API evolution research

---

### 10.2 Improvement Roadmap

**Phase 1: Immediate (This Session)**
- ✅ Document current error handling architecture
- ✅ Create debugging procedures
- ✅ Establish logging standards
- ✅ **Validate error handling during Rapier migration** (October 2025)
- ✅ **Enhance state dump logging** (October 2025)

**Phase 2: Short Term (Next Session)**
- ⏳ Implement enhanced error context logging
- ⏳ Add timeout-based circuit breaker reset
- ⏳ Fix silent boss/enemy import failures

**Phase 3: Medium Term**
- ⏳ Implement error aggregation service
- ⏳ Add user-visible error notifications for critical failures
- ⏳ Create error metrics collection

**Phase 4: Long Term**
- ⏳ Centralized error handling service
- ⏳ Error recovery strategies documentation
- ⏳ Automated error testing

### 10.3 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-29 | Initial comprehensive audit and documentation |
| 1.1 | 2025-10-29 | Added Rapier 0.19+ migration fixes documentation, updated status |

### 10.4 Related Improvements

**When error handling improves, update:**
- This document (ERROR_HANDLING_LOGGING.md)
- CLAUDE.md (if patterns change)
- Individual system docs (if specific systems change)

---

## Summary

WynIsBuff2's error handling system is **resilient and validated**. The multi-layered architecture with circuit breakers prevents complete crashes and has been proven effective during the Rapier 0.19+ migration. This documentation provides:

1. ✅ **Complete catalog** of current error handling patterns
2. ✅ **Debugging procedures** for common error scenarios
3. ✅ **Development guidelines** for adding error handling to new code
4. ✅ **Improvement roadmap** for evolving the system
5. ✅ **Real-world validation** through Rapier migration (October 2025)

**Key Takeaways for Developers:**
- ✅ **Circuit breakers work**: Prevented system crash during Rapier migration
- ✅ **State dumps essential**: Enhanced logging revealed exact error conditions
- ✅ **Graceful degradation**: System remained responsive during debugging
- ⚠️ **"Too many errors" indicates earlier root cause** - check logs
- ✅ **Try-catch blocks**: Pervasive coverage prevents cascading failures
- ⚠️ **Some silent failures remain**: Imports, localStorage, event listeners
- ✅ **Extensive logging**: Now with enhanced state dumps

**October 2025 Validation:**
The error handling system successfully contained and exposed 4 critical Rapier 0.19+ API incompatibilities, allowing systematic debugging without system crashes. Circuit breakers prevented infinite error loops while comprehensive logging revealed root causes.

**This is a living document** - updated as the error handling system evolves.

---

**Document Maintained By**: Development team
**Last Comprehensive Review**: 2025-10-29 (Post-Rapier migration)
**Next Review**: After next major system change
