# Game Diagnostics Guide - WynIsBuff2

**Last Updated**: November 2, 2025  
**Purpose**: Systematic approach to diagnosing gameplay issues

---

## Quick Diagnostic Commands

Use these in the browser console during gameplay:

### System Health Check

```javascript
// Overall system health
window.debugAPI?.getSummary()

// Recent errors (last 5 minutes)
window.getRecentLogs(300000).filter(l => l.level === 'error')

// Subsystem analysis
window.debugAPI?.analyzeSubsystem('level', 60000)
window.debugAPI?.analyzeSubsystem('audio', 60000)
window.debugAPI?.analyzeSubsystem('physics', 60000)
```

### Event System Diagnostics

```javascript
// Check event listener counts (if EventBus is exposed)
// This helps identify event listener leaks
window.game?.scene?.scenes[0]?.eventBus?.listenerCount()

// Check for duplicate listeners
window.LOG.export().logs.filter(l => 
    l.subsystem === 'events' || 
    l.code?.includes('EVENT')
)
```

### Audio System Diagnostics

```javascript
// Check Howler state
console.log('Howler State:', {
    muted: Howler._muted,
    volume: Howler.volume(),
    codecs: Howler.codecs,
    html5PoolSize: Howler.html5PoolSize
})

// Check active sounds
Howler._howls.forEach((howl, i) => {
    console.log(`Sound ${i}:`, {
        playing: howl.playing(),
        volume: howl.volume(),
        loop: howl.loop(),
        state: howl.state()
    })
})
```

### Physics Diagnostics

```javascript
// Check physics body count
window.LOG.export().logs
    .filter(l => l.context?.physics?.bodyCount)
    .slice(-5)
    .map(l => ({
        frame: l.context.frame,
        bodies: l.context.physics.bodyCount
    }))
```

---

## Common Issues & Diagnostics

### Issue: Runaway Sound Effects

**Symptoms:**
- Sound effects playing repeatedly
- Multiple instances of same sound
- Audio overlapping excessively

**Diagnostic Steps:**

1. **Check Event Listener Count**
   ```javascript
   // Count how many times events are registered
   window.LOG.export().logs.filter(l => 
       l.message?.includes('event listener') ||
       l.code?.includes('EVENT_REGISTERED')
   ).length
   ```

2. **Check for Multiple Scene Instances**
   ```javascript
   // Should only have active scenes
   window.game.scene.scenes.filter(s => s.scene.isActive())
   ```

3. **Check Audio Play Frequency**
   ```javascript
   // Count audio plays in last minute
   window.LOG.export().logs.filter(l => 
       l.subsystem === 'audio' && 
       l.code?.includes('PLAY') &&
       Date.now() - new Date(l.timestamp).getTime() < 60000
   ).length
   ```

**Common Causes:**
- Event listeners not cleaned up on scene restart
- Multiple event bus instances
- Scene not properly destroyed before reload
- Audio triggered in update loop instead of events

**Fixes:**
- Add `this.events.off()` in scene `shutdown()`
- Use `once()` instead of `on()` for one-time events
- Ensure scene cleanup in `shutdown()` method
- Move audio triggers to event handlers, not update loops

### Issue: Collectible Errors

**Symptoms:**
- `Cannot read properties of undefined (reading 'type')`
- Collectibles not appearing
- Collectibles not being collected

**Diagnostic Steps:**

1. **Check Collectible Configuration**
   ```javascript
   // View level collectible config
   import { LevelData } from './src/constants/LevelData.js'
   console.log(LevelData.level1.collectibles)
   ```

2. **Check Recent Collectible Errors**
   ```javascript
   window.LOG.export().logs.filter(l => 
       l.subsystem === 'level' && 
       l.code?.includes('COLLECTIBLE')
   )
   ```

3. **Check Physics World State**
   ```javascript
   window.LOG.export().logs
       .filter(l => l.context?.physics)
       .slice(-1)[0]?.context?.physics
   ```

**Common Causes:**
- Data structure mismatch (accessing `config.type` instead of `type`)
- Physics world not initialized before collectible creation
- Collectible sprites created before textures loaded

**Fixes:**
- Verify data structure matches level config
- Ensure physics world exists before creating collectibles
- Wait for texture loading before sprite creation

### Issue: Physics Instability

**Symptoms:**
- Player falling through platforms
- Erratic movement
- Circuit breaker triggered

**Diagnostic Steps:**

1. **Check Physics Errors**
   ```javascript
   window.LOG.export().logs.filter(l => 
       l.subsystem === 'physics' && 
       l.level === 'error'
   )
   ```

2. **Check Player State**
   ```javascript
   window.LOG.export().logs
       .filter(l => l.context?.player)
       .slice(-5)
       .map(l => l.context.player)
   ```

3. **Check Circuit Breaker Status**
   ```javascript
   window.LOG.export().logs.filter(l => 
       l.code?.includes('CIRCUIT_BREAKER')
   )
   ```

---

## Systematic Debugging Workflow

### Step 1: Capture Initial State

```javascript
// Before reproducing issue
const beforeState = {
    summary: window.debugAPI?.getSummary(),
    logs: window.LOG.export(),
    timestamp: Date.now()
}
```

### Step 2: Reproduce Issue

Play the game and trigger the issue.

### Step 3: Capture After State

```javascript
// After issue occurs
const afterState = {
    summary: window.debugAPI?.getSummary(),
    logs: window.LOG.export(),
    timestamp: Date.now()
}

// Compare
console.log('New errors:', 
    afterState.logs.logs.filter(l => 
        l.level === 'error' && 
        new Date(l.timestamp).getTime() > beforeState.timestamp
    )
)
```

### Step 4: Export for Analysis

```javascript
// Export comprehensive report
const report = window.debugAPI?.exportForAnalysis({
    format: 'markdown',
    timeWindow: 300000, // Last 5 minutes
    includePatterns: true,
    includeRecommendations: true
})

// Copy to clipboard
copy(report)
```

### Step 5: Create Issue Report

Use the exported report to create a detailed issue report with:
- Error messages and stack traces
- System state before/after
- Steps to reproduce
- Relevant log entries

---

## Performance Diagnostics

### Frame Rate Monitoring

```javascript
// Check frame rate from logs
window.LOG.export().logs
    .filter(l => l.context?.frame)
    .slice(-60) // Last 60 logged frames
    .map(l => ({
        frame: l.context.frame,
        timestamp: l.timestamp
    }))
```

### Memory Usage

```javascript
// Check log buffer utilization
window.getLogStats()

// Check physics body count trend
window.LOG.export().logs
    .filter(l => l.context?.physics?.bodyCount)
    .map(l => l.context.physics.bodyCount)
```

---

## Creating Diagnostic Sessions

For complex issues, create a diagnostic session:

```javascript
// Start diagnostic session
const session = {
    id: `diag-${Date.now()}`,
    start: Date.now(),
    issue: 'Describe the issue here',
    logs: []
}

// Capture logs periodically
const captureInterval = setInterval(() => {
    session.logs.push({
        timestamp: Date.now(),
        summary: window.debugAPI?.getSummary(),
        recentErrors: window.getRecentLogs(5000).filter(l => l.level === 'error')
    })
}, 5000) // Every 5 seconds

// Stop session
function stopDiagnostic() {
    clearInterval(captureInterval)
    session.end = Date.now()
    session.duration = session.end - session.start
    console.log('Diagnostic Session:', session)
    copy(JSON.stringify(session, null, 2))
}

// Call stopDiagnostic() when done
```

---

## See Also

- [ERROR_HANDLING_LOGGING.md](../systems/ERROR_HANDLING_LOGGING.md) - Logging system documentation
- [DEBUGGING.md](DEBUGGING.md) - General debugging guide
- [KNOWN_WEBGL_ISSUES.md](../systems/KNOWN_WEBGL_ISSUES.md) - Known WebGL issues

---

**Maintained by**: Development team  
**Review frequency**: When new diagnostic patterns emerge
