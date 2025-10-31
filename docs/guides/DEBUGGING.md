# Debugging with WynIsBuff2 Observability System

**Quick Reference Guide for Developers and AI Agents**

**Last Updated**: October 29, 2025
**System Version**: Phases 0-7 Complete

---

## Quick Start

### Basic Logging

```javascript
import { LOG } from '@observability';

// Simple log
LOG.info('PLAYER_SPAWN', {
    subsystem: 'player',
    message: 'Player spawned successfully',
});

// Error with diagnostic data
LOG.error('PHYSICS_UPDATE_ERROR', {
    subsystem: 'physics',
    error,
    message: 'Failed to update physics world',
    state: {
        bodyCount: this.world.bodies.length,
        accumulator: this.accumulator,
    },
    hint: 'Check if physics world is initialized',
});
```

### Querying Logs

```javascript
// Get recent errors
const errors = LOG.getByLevel('error', 10);
console.log('Last 10 errors:', errors);

// Get specific error code
const physicsErrors = LOG.getByCode('PHYSICS_UPDATE_ERROR');

// Get all logs from subsystem
const playerLogs = LOG.getBySubsystem('player', 50);
```

---

## Common Debugging Scenarios

### Scenario 1: Player Not Moving

**Symptoms**: Player sprite frozen, no response to input

**Diagnosis Steps**:

1. **Check console for circuit breaker**:

    ```
    [PlayerController] Too many errors, player disabled
    ```

2. **Query recent player errors**:

    ```javascript
    const errors = LOG.getBySubsystem('player');
    console.log('Player errors:', errors);
    ```

3. **Check common causes**:
    - Physics body missing
    - Input manager not initialized
    - Movement calculation returning NaN

**Solution Pattern**:

```javascript
// Check player state
if (!this.body || !this.characterController) {
    LOG.error('PLAYER_MISSING_COMPONENTS', {
        subsystem: 'player',
        message: 'Essential components missing',
        state: {
            hasBody: !!this.body,
            hasController: !!this.characterController,
            hasSprite: !!this.sprite,
        },
        hint: 'Verify player initialization completed',
    });
    return;
}
```

### Scenario 2: Physics Simulation Stopped

**Symptoms**: All entities frozen, physics disabled message

**Diagnosis Steps**:

1. **Check circuit breaker status**:

    ```javascript
    // In console or debug code
    const physicsErrors = LOG.getByCode('PHYSICS_CIRCUIT_BREAKER');
    if (physicsErrors.length > 0) {
        console.log('Circuit breaker triggered:', physicsErrors[0]);
    }
    ```

2. **Check crash dump** (if circuit breaker triggered):

    ```javascript
    const crashLogs = LOG.getByLevel('fatal');
    if (crashLogs.length > 0) {
        const dump = crashLogs[0].crashDump;
        console.log('Crash dump:', dump);
        console.log('Summary:', CrashDumpGenerator.generateSummary(dump));
    }
    ```

3. **Analyze error patterns**:
    ```javascript
    import { ErrorPatternDetector } from '@observability';
    const detector = new ErrorPatternDetector(LOG);
    const patterns = detector.analyzeRecent(10000);
    console.log('Error patterns:', patterns);
    ```

**Common Causes**:

- Invalid Rapier API usage
- Body handles pointing to deleted bodies
- Frame rate drop causing accumulator overflow

### Scenario 3: Repeating Errors

**Symptoms**: Same error appearing multiple times per second

**Diagnosis**:

```javascript
import { ErrorPatternDetector } from '@observability';

const detector = new ErrorPatternDetector(LOG);
const patterns = detector.analyzeRecent(5000);

if (patterns.repeatingErrors.length > 0) {
    console.log('Repeating errors detected:');
    patterns.repeatingErrors.forEach((pattern) => {
        console.log(`- ${pattern.code}: ${pattern.count} times`);
        console.log(`  First: ${pattern.first.message}`);
        console.log(`  Last: ${pattern.last.message}`);
    });
}
```

**Solutions**:

- **NaN propagation**: Add validation before calculations
- **Missing initialization**: Check component lifecycle
- **API misuse**: Review Rapier/Phaser documentation

### Scenario 4: Error Cascades

**Symptoms**: Multiple different errors in quick succession

**Diagnosis**:

```javascript
const patterns = detector.analyzeRecent(5000);

if (patterns.cascades.length > 0) {
    console.log('Error cascades detected:');
    patterns.cascades.forEach((cascade) => {
        console.log(`Cascade: ${cascade.errors.length} errors in ${cascade.duration}ms`);
        cascade.errors.forEach((err) => {
            console.log(`  - [${err.subsystem}] ${err.code}: ${err.message}`);
        });
    });
}
```

**Common Cause**: One system failure causing dependent systems to fail

**Solution Pattern**:

1. Fix the first error in the cascade
2. Other errors often resolve automatically
3. Add defensive checks in dependent systems

---

## Understanding Log Context

### Automatic Context Injection

When DebugContext is initialized (automatically in Game scene), all logs include:

```javascript
{
    code: 'ERROR_CODE',
    level: 'error',
    subsystem: 'physics',
    message: 'Your message',
    // ... your data

    // AUTOMATICALLY ADDED:
    context: {
        frame: 1234,               // Current frame number
        frameTime: 0.016,          // Frame delta in seconds

        player: {
            position: { x: 100, y: 200 },
            velocity: { x: 0, y: 9.8 },
            isGrounded: true,
            isJumping: false
        },

        physics: {
            bodyCount: 45,
            worldGravity: { x: 0, y: 9.8 },
            worldTimestep: 0.0166
        },

        input: {
            left: false,
            right: true,
            jump: true,
            mouse: { x: 512, y: 384 }
        }
    }
}
```

**Why This Matters**:

- Frame-accurate debugging
- Understand exact game state when error occurred
- Correlate errors across subsystems

### Reading Context

```javascript
const errors = LOG.getByCode('PHYSICS_UPDATE_ERROR');
if (errors.length > 0) {
    const error = errors[0];

    // Check when it happened
    console.log('Frame:', error.context.frame);

    // Check player state at time of error
    console.log('Player position:', error.context.player.position);
    console.log('Player grounded:', error.context.player.isGrounded);

    // Check physics state
    console.log('Body count:', error.context.physics.bodyCount);
}
```

---

## Performance Debugging

### Checking Log System Performance

```javascript
// Get performance metrics
const allLogs = LOG.getAll();
console.log('Total logs:', allLogs.length);
console.log('Buffer size:', 2000);
console.log('Buffer utilization:', ((allLogs.length / 2000) * 100).toFixed(1) + '%');

// Check subsystem distribution
const subsystems = {};
allLogs.forEach((log) => {
    subsystems[log.subsystem] = (subsystems[log.subsystem] || 0) + 1;
});
console.log('Logs by subsystem:', subsystems);
```

### Identifying Hot Paths

```javascript
// Find most frequently logged codes
const codes = {};
allLogs.forEach((log) => {
    codes[log.code] = (codes[log.code] || 0) + 1;
});

const sortedCodes = Object.entries(codes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

console.log('Top 10 most frequent log codes:');
sortedCodes.forEach(([code, count]) => {
    console.log(`${count}x ${code}`);
});
```

---

## Circuit Breaker Debugging

### Understanding Circuit Breakers

**PhysicsManager**: 10 errors → disabled
**PlayerController**: 5 errors → disabled

### Checking Circuit Breaker Status

```javascript
// Manual check (in browser console)
const game = window.game;
const scene = game.scene.scenes[0];

console.log('Physics error count:', scene.physicsManager.errorCount);
console.log('Player error count:', scene.playerController.errorCount);

// Check if circuit breaker triggered
const fatalLogs = LOG.getByLevel('fatal');
console.log('Circuit breaker triggers:', fatalLogs);
```

### Crash Dump Analysis

When a circuit breaker triggers, it generates a comprehensive crash dump:

```javascript
import { CrashDumpGenerator } from '@observability';

const fatalLogs = LOG.getByLevel('fatal');
if (fatalLogs.length > 0) {
    const lastFatal = fatalLogs[fatalLogs.length - 1];

    if (lastFatal.crashDump) {
        // Human-readable summary
        const summary = CrashDumpGenerator.generateSummary(lastFatal.crashDump);
        console.log('Crash Summary:\n', summary);

        // Full dump (for detailed analysis)
        console.log('Full crash dump:', lastFatal.crashDump);

        // Export for external analysis
        const dumpJSON = JSON.stringify(lastFatal.crashDump, null, 2);
        // Copy to clipboard or save to file
    }
}
```

**Crash Dump Contents**:

- Error details and stack trace
- Recent 50 log entries
- Complete game state (player, physics, input)
- Performance metrics (FPS, memory)
- Environment info (browser, platform)

---

## Export and Analysis

### Exporting Logs for Analysis

```javascript
// Export all logs
const allLogs = LOG.getAll();
const json = JSON.stringify(allLogs, null, 2);

// In browser console:
copy(json); // Copies to clipboard

// In Node.js:
fs.writeFileSync('logs.json', json);
```

### Filtering for Specific Analysis

```javascript
// Get errors from last 100 frames
const recentErrors = LOG.getAll()
    .filter((log) => log.level === 'error')
    .filter((log) => log.context && log.context.frame > currentFrame - 100);

// Group by subsystem
const bySubsystem = recentErrors.reduce((acc, log) => {
    acc[log.subsystem] = acc[log.subsystem] || [];
    acc[log.subsystem].push(log);
    return acc;
}, {});

console.log('Recent errors by subsystem:', bySubsystem);
```

---

## Phase 7: Agent-Friendly Debugging API

**New in Phase 7**: Advanced debugging tools designed for both developers and AI agents.

### Quick Access (Browser Console)

The DebugAPI is globally available in the browser console:

```javascript
// Get system health summary
window.debugAPI.getSummary();

// Query recent errors
window.debugAPI.getRecentLogs(60000); // Last 60 seconds

// Analyze a specific subsystem
window.debugAPI.analyzeSubsystem('physics');

// Get suggestions for an error
window.debugAPI.getSuggestions('PHYSICS_UPDATE_ERROR');
```

### Advanced Querying with QueryBuilder

Build complex queries using a fluent API:

```javascript
import { QueryBuilder, LOG } from '@observability';

// Get physics errors from last 5 minutes with context
const recentPhysicsErrors = new QueryBuilder(LOG)
    .level('error')
    .subsystem('physics')
    .inLastMinutes(5)
    .withContext()
    .sortByTimeDesc()
    .limit(10)
    .execute();

// Count warnings in last 30 seconds
const warningCount = new QueryBuilder(LOG).level('warn').inLastSeconds(30).count();

// Get most recent player circuit breaker event
const circuitBreaker = new QueryBuilder(LOG).code('PLAYER_CIRCUIT_BREAKER').withContext().last();

// Get all critical errors with context
const critical = new QueryBuilder(LOG).criticalOnly().withContext().sortByTimeDesc().execute();
```

**Available Query Methods**:

- `level(level)` - Filter by log level
- `subsystem(subsystem)` - Filter by subsystem
- `code(code)` - Filter by error code
- `inLast(milliseconds)` - Time window filter
- `inLastSeconds(seconds)` - Shorthand for seconds
- `inLastMinutes(minutes)` - Shorthand for minutes
- `withContext()` - Include game state context
- `withoutContext()` - Exclude context (smaller output)
- `errorsOnly()` - Shorthand for level('error')
- `warningsOnly()` - Shorthand for level('warn')
- `criticalOnly()` - Shorthand for level('fatal')
- `limit(count)` - Limit results
- `sortByTimeAsc()` / `sortByTimeDesc()` - Sort by timestamp

**Execution Methods**:

- `execute()` - Returns array of matching logs
- `count()` - Returns count only
- `first()` - Returns first match or null
- `last()` - Returns last match or null

### Statistical Analysis with LogAnalyzer

Analyze log patterns and trends:

```javascript
import { LogAnalyzer, QueryBuilder, LOG } from '@observability';

const analyzer = new LogAnalyzer();

// Get recent errors
const errors = new QueryBuilder(LOG).errorsOnly().inLastMinutes(10).execute();

// Get statistics
const stats = analyzer.getStatistics(errors);
console.log('Error breakdown:', stats.byLevel);
console.log('Top subsystems:', stats.topSubsystems);
console.log('Top error codes:', stats.topCodes);

// Find causal relationships
const relationships = analyzer.findCausalRelationships(errors);
relationships.forEach((rel) => {
    console.log(`${rel.cause.code} may cause ${rel.effect.code} (${rel.timeDiff}ms apart)`);
});

// Check subsystem health (0-100 score)
const health = analyzer.getSubsystemHealth('physics', errors, 60000);
console.log(`Physics health: ${health.health}/100 (${health.status})`);
console.log(`Error rate: ${health.errorRate} errors/minute`);
console.log(`Trend: ${health.trend}`);

// Analyze trends over time
const trends = analyzer.getTrends(errors, 10000); // 10-second buckets
console.log(`Trend: ${trends.trend}`); // 'improving', 'degrading', or 'stable'

// Get recommendations
const recommendations = analyzer.generateRecommendations({
    statistics: stats,
    health: health,
    trends: trends,
});
console.log('Recommendations:', recommendations);
```

**Health Scoring**:

- **90-100**: Healthy (green status)
- **70-89**: Warning (yellow status)
- **0-69**: Critical (red status)

Health calculated as: `100 - (errorRate × 100) - (warningRate × 25)`

### Exporting with ExportFormatter

Generate reports in multiple formats:

```javascript
import { ExportFormatter, QueryBuilder, LOG } from '@observability';

const formatter = new ExportFormatter();

// Get errors to export
const errors = new QueryBuilder(LOG).errorsOnly().inLastMinutes(10).withContext().execute();

// Rich JSON export with metadata
const json = formatter.toJSON(errors, {
    includeStatistics: true,
    includeAnalysis: true,
    includeRecommendations: true,
});
console.log(json);

// Human-readable Markdown report
const markdown = formatter.toMarkdown(errors, {
    statistics: analyzer.getStatistics(errors),
    health: analyzer.getSubsystemHealth('physics', errors),
});
console.log(markdown);
// Copy to clipboard: copy(markdown);

// CSV for spreadsheet analysis
const csv = formatter.toCSV(errors);
// timestamp,level,subsystem,code,message,frame

// Compact JSON (no context, smaller)
const compact = formatter.toCompactJSON(errors);

// Summary only (no individual logs)
const summary = formatter.toSummary(errors, {
    includePatterns: true,
    includeRecommendations: true,
});

// Console-friendly output
formatter.toConsole(errors, 20); // Print last 20 to console
```

**Export Use Cases**:

- **JSON**: Automated analysis, long-term storage
- **Markdown**: Bug reports, documentation, team sharing
- **CSV**: Excel/Google Sheets analysis, charting
- **Compact**: Quick exports, minimal data
- **Summary**: Executive overview, health dashboards
- **Console**: Quick debug output, testing

### Error Resolution with ErrorSuggestions

Get instant help for common errors:

```javascript
import { ErrorSuggestions } from '@observability';

const suggestions = new ErrorSuggestions();

// Get suggestions for specific error
const help = suggestions.getSuggestions('PHYSICS_UPDATE_ERROR');
console.log('Category:', help.category); // 'physics'
console.log('Severity:', help.severity); // 'high'
console.log('Confidence:', help.confidence); // 'high'
console.log('Suggestions:', help.suggestions);
console.log('Related errors:', help.relatedCodes);
console.log('Documentation:', help.documentation);

// Get suggestions for error pattern
const pattern = { type: 'repeating', code: 'PLAYER_UPDATE_ERROR', count: 15 };
const patternHelp = suggestions.getSuggestionsForPattern(pattern);

// Get all suggestions for subsystem
const physicsHelp = suggestions.getSuggestionsForSubsystem('physics');

// Search knowledge base
const results = suggestions.search('rapier');

// Get all available categories
const categories = suggestions.getCategories();
// ['physics', 'player', 'input', 'level', 'persistence', 'audio', 'initialization']
```

**Known Error Codes** (15+ in knowledge base):

- **Physics**: `PHYSICS_INIT_ERROR`, `PHYSICS_UPDATE_ERROR`, `PHYSICS_CIRCUIT_BREAKER`, `PHYSICS_FRAME_BUDGET_EXCEEDED`
- **Player**: `PLAYER_UPDATE_ERROR`, `PLAYER_CIRCUIT_BREAKER`, `PLAYER_MOVEMENT_NAN`
- **Input**: `INPUT_MANAGER_ERROR`
- **Level**: `LEVEL_LOAD_ERROR`, `LEVEL_LOAD_PLATFORM_ERROR`
- **Storage**: `GAMESTATE_SAVE_PROGRESS_ERROR`
- **Audio**: `AUDIO_MANAGER_ERROR`
- **Generic**: `INIT_ERROR`

### Complete Debugging Workflow (Phase 7)

**Scenario**: Physics issues reported, need comprehensive analysis

```javascript
// Step 1: Get system health overview
const summary = window.debugAPI.getSummary();
console.log('Overall health:', summary.overallHealth);
console.log(
    'Critical subsystems:',
    summary.subsystems.filter((s) => s.status === 'critical')
);

// Step 2: Analyze physics subsystem in detail
const physicsAnalysis = window.debugAPI.analyzeSubsystem('physics', 120000);
console.log('Physics health:', physicsAnalysis.health);
console.log('Error count:', physicsAnalysis.errorCount);
console.log('Detected patterns:', physicsAnalysis.patterns);

// Step 3: Get specific recommendations
if (physicsAnalysis.errorCount > 0) {
    const topError = physicsAnalysis.patterns.repeatingErrors[0];
    const suggestions = window.debugAPI.getSuggestions(topError.code);
    console.log('How to fix:', suggestions.suggestions);
}

// Step 4: Export comprehensive report
const report = window.debugAPI.exportForAnalysis({
    format: 'markdown',
    timeWindow: 300000, // Last 5 minutes
    includePatterns: true,
    includeRecommendations: true,
});

// Step 5: Copy to clipboard for bug report
copy(report);
```

### Browser Console Quick Reference

Common commands you can run directly in the browser console:

```javascript
// Health check
window.debugAPI.getSummary();

// Recent errors
window.debugAPI.getRecentLogs(60000);

// Subsystem analysis
window.debugAPI.analyzeSubsystem('physics');
window.debugAPI.analyzeSubsystem('player');

// Get help
window.debugAPI.getSuggestions('PHYSICS_UPDATE_ERROR');

// Export report
copy(window.debugAPI.exportForAnalysis({ format: 'markdown', timeWindow: 300000 }));

// Time-range analysis
window.debugAPI.analyzeTimeWindow(120000); // Last 2 minutes

// Related logs
const error = window.debugAPI.query({ code: 'PHYSICS_CIRCUIT_BREAKER' })[0];
window.debugAPI.getRelatedLogs(error, { timeWindow: 5000 });
```

---

## Best Practices

### DO:

✅ **Use appropriate log levels**:

- `LOG.dev()` - Normal flow, verbose debugging (1% sampling)
- `LOG.info()` - Important state changes
- `LOG.warn()` - Unexpected but handled situations
- `LOG.error()` - Failures that impact functionality
- `LOG.fatal()` - Critical failures, crash dumps

✅ **Include diagnostic context**:

```javascript
LOG.error('PLATFORM_CREATE_ERROR', {
    subsystem: 'level',
    error,
    message: 'Failed to create platform',
    state: {
        platformIndex: i,
        totalPlatforms: config.platforms.length,
        platformConfig: config.platforms[i],
    },
    hint: 'Check sprite key exists in assets',
});
```

✅ **Use error codes consistently**:

- Format: `SUBSYSTEM_DESCRIPTION`
- Examples: `PHYSICS_INIT_ERROR`, `PLAYER_MOVEMENT_NAN`, `LEVEL_LOAD_TIMEOUT`

✅ **Provide hints for resolution**:

```javascript
hint: 'Check if physics world is initialized. Verify Rapier loaded correctly.';
```

### DON'T:

❌ **Don't use console.\* in new code**:

```javascript
console.log('Player moved');  // ❌ No structure, no query, lost in console
LOG.dev('PLAYER_MOVED', { subsystem: 'player', ... });  // ✅
```

❌ **Don't log sensitive data**:

```javascript
LOG.info('USER_LOGIN', { password: 'secret123' }); // ❌ NEVER
```

❌ **Don't log in tight loops without sampling**:

```javascript
// ❌ Logs 60 times per second
update() {
    LOG.dev('UPDATE', { frame: this.frame });
}

// ✅ Logs ~0.6 times per second
update() {
    if (Math.random() < 0.01) {  // 1% sampling
        LOG.dev('UPDATE', { subsystem: 'player', frame: this.frame });
    }
}
```

---

## Troubleshooting the Observability System

### Logs Not Appearing

**Check 1**: LogSystem initialized?

```javascript
import { LOG } from '@observability';
console.log('LogSystem:', LOG);
```

**Check 2**: Correct import path?

```javascript
// ✅ Correct
import { LOG } from '@observability';
import { LOG } from '../observability/core/LogSystem.js';

// ❌ Incorrect
import { LOG } from './LogSystem.js'; // Wrong path
```

### Context Not Injecting

**Check 1**: DebugContext initialized in Game.js?

```javascript
// Should see this in logs during game start:
// GAME_DEBUGCONTEXT_INIT
// GAME_STATE_PROVIDERS_REGISTERED
```

**Check 2**: StateProviders registered?

```javascript
const scene = game.scene.scenes[0];
console.log('DebugContext:', scene.debugContext);
console.log('Providers:', scene.debugContext?.providers);
```

### Buffer Full / Logs Disappearing

**Cause**: Circular buffer (2000 entries) is full, oldest logs evicted

**Solution**: Export logs before buffer fills

```javascript
// Check buffer status
const logs = LOG.getAll();
console.log('Buffer:', logs.length, '/ 2000');

// Export if near full
if (logs.length > 1800) {
    const json = JSON.stringify(logs, null, 2);
    // Save or copy
}
```

---

## Reference

**Documentation**:

- [ERROR_HANDLING_LOGGING.md](../systems/ERROR_HANDLING_LOGGING.md) - Complete system guide
- [OBSERVABILITY_IMPLEMENTATION.md](../../OBSERVABILITY_IMPLEMENTATION.md) - Implementation details
- [STATUS_OBSERVABILITY.json](../../STATUS_OBSERVABILITY.json) - Current status

**Code**:

- `src/observability/core/LogSystem.js` - Main logging system
- `src/observability/context/DebugContext.js` - Context injection
- `src/observability/utils/CrashDumpGenerator.js` - Crash dumps
- `src/observability/utils/ErrorPatternDetector.js` - Pattern detection

**Support**:

- Check [Known Issues](../systems/ERROR_HANDLING_LOGGING.md#7-known-issues)
- Review [Debugging Procedures](../systems/ERROR_HANDLING_LOGGING.md#9-debugging-procedures)
- Consult [Best Practices](../systems/ERROR_HANDLING_LOGGING.md#8-development-guidelines)

---

**Guide Maintained By**: Development team
**Last Updated**: October 29, 2025
**Phase 7**: Agent Tools & API Complete
