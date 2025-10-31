# Phase 8: Testing & Validation Plan

**Estimated Time**: 2 hours
**Dependencies**: Phase 7 (Agent Tools & API)
**Status**: In Progress
**Start Time**: 2025-10-29T22:30:00Z

---

## Objectives

1. Validate all observability components work correctly
2. Test integration points with game systems
3. Verify performance meets targets
4. Validate browser console API accessibility
5. Test export formats and error suggestions
6. Ensure circuit breakers and crash dumps work correctly

---

## Test Scenarios

### Scenario 1: Basic Logging Functionality

**Test**: Verify logs are captured and queryable

**Steps**:

1. Start development server
2. Load game in browser
3. Execute test commands in console:

    ```javascript
    // Generate test logs
    LOG.dev('TEST_DEV', { subsystem: 'test', message: 'Dev log test' });
    LOG.info('TEST_INFO', { subsystem: 'test', message: 'Info log test' });
    LOG.warn('TEST_WARN', { subsystem: 'test', message: 'Warn log test' });
    LOG.error('TEST_ERROR', { subsystem: 'test', message: 'Error log test' });

    // Query logs
    const logs = LOG.getAll();
    console.log('Total logs:', logs.length);

    // Get by level
    const errors = LOG.getByLevel('error');
    console.log('Error logs:', errors.length);

    // Get by subsystem
    const testLogs = LOG.getBySubsystem('test');
    console.log('Test subsystem logs:', testLogs.length);
    ```

**Expected Result**:

- ✅ All 4 log levels captured
- ✅ Logs queryable by level and subsystem
- ✅ Logs include context (frame, player state, physics state)

---

### Scenario 2: DebugAPI Functionality

**Test**: Verify window.debugAPI is accessible and functional

**Steps**:

1. Open browser console
2. Test each DebugAPI method:

    ```javascript
    // Test 1: getSummary
    const summary = window.debugAPI.getSummary();
    console.log('System summary:', summary);
    console.assert(summary.overallHealth !== undefined, 'Summary has health score');

    // Test 2: getRecentLogs
    const recentLogs = window.debugAPI.getRecentLogs(60000);
    console.log('Recent logs (last 60s):', recentLogs.length);

    // Test 3: analyzeSubsystem
    const physicsAnalysis = window.debugAPI.analyzeSubsystem('physics', 60000);
    console.log('Physics health:', physicsAnalysis.health);
    console.assert(physicsAnalysis.health >= 0 && physicsAnalysis.health <= 100);

    // Test 4: getSuggestions
    const suggestions = window.debugAPI.getSuggestions('PHYSICS_UPDATE_ERROR');
    console.log('Suggestions:', suggestions);
    console.assert(suggestions.suggestions.length > 0, 'Suggestions provided');
    ```

**Expected Result**:

- ✅ window.debugAPI is defined
- ✅ All methods return expected data structures
- ✅ Health scores are 0-100
- ✅ Suggestions include actionable advice

---

### Scenario 3: QueryBuilder Fluent API

**Test**: Verify QueryBuilder method chaining works

**Steps**:

```javascript
import { QueryBuilder, LOG } from '@observability';

// Test 1: Multi-filter query
const query1 = new QueryBuilder(LOG)
    .level('error')
    .subsystem('physics')
    .inLastMinutes(5)
    .withContext()
    .limit(10)
    .execute();

console.log('Physics errors (last 5 min):', query1.length);
console.assert(query1.every((log) => log.level === 'error'));
console.assert(query1.every((log) => log.subsystem === 'physics'));

// Test 2: Count method
const errorCount = new QueryBuilder(LOG).errorsOnly().inLastMinutes(10).count();

console.log('Total errors (last 10 min):', errorCount);
console.assert(typeof errorCount === 'number');

// Test 3: first() and last()
const firstError = new QueryBuilder(LOG).errorsOnly().first();

const lastError = new QueryBuilder(LOG).errorsOnly().last();

console.log('First error:', firstError);
console.log('Last error:', lastError);
```

**Expected Result**:

- ✅ Method chaining works correctly
- ✅ Filters are applied properly
- ✅ count(), first(), last() work correctly
- ✅ Shorthand methods (errorsOnly, warningsOnly) work

---

### Scenario 4: LogAnalyzer Statistics

**Test**: Verify statistical analysis works

**Steps**:

```javascript
import { LogAnalyzer, QueryBuilder, LOG } from '@observability';

const analyzer = new LogAnalyzer();

// Get errors from last 5 minutes
const errors = new QueryBuilder(LOG).errorsOnly().inLastMinutes(5).execute();

// Test 1: getStatistics
const stats = analyzer.getStatistics(errors);
console.log('Statistics:', stats);
console.assert(stats.byLevel, 'Has level breakdown');
console.assert(stats.bySubsystem, 'Has subsystem breakdown');
console.assert(stats.topSubsystems, 'Has top subsystems');

// Test 2: findCausalRelationships
const relationships = analyzer.findCausalRelationships(errors);
console.log('Causal relationships:', relationships);

// Test 3: getSubsystemHealth
const health = analyzer.getSubsystemHealth('physics', errors, 60000);
console.log('Physics health:', health);
console.assert(health.health >= 0 && health.health <= 100);
console.assert(['healthy', 'warning', 'critical'].includes(health.status));

// Test 4: getTrends
const trends = analyzer.getTrends(errors, 10000);
console.log('Trends:', trends);
console.assert(['improving', 'degrading', 'stable'].includes(trends.trend));
```

**Expected Result**:

- ✅ Statistics calculated correctly
- ✅ Causal relationships detected
- ✅ Health scoring works (0-100)
- ✅ Trend analysis provides valid results

---

### Scenario 5: Export Formats

**Test**: Verify all export formats work

**Steps**:

```javascript
import { ExportFormatter, QueryBuilder, LOG } from '@observability';

const formatter = new ExportFormatter();

// Get sample logs
const logs = new QueryBuilder(LOG).errorsOnly().inLastMinutes(10).withContext().execute();

// Test 1: JSON export
const jsonExport = formatter.toJSON(logs, {
    includeStatistics: true,
    includeAnalysis: true,
});
console.log('JSON export keys:', Object.keys(jsonExport));
console.assert(jsonExport.logs, 'Has logs');
console.assert(jsonExport.metadata, 'Has metadata');

// Test 2: Markdown export
const markdown = formatter.toMarkdown(logs);
console.log('Markdown length:', markdown.length);
console.assert(markdown.includes('##'), 'Has markdown headers');

// Test 3: CSV export
const csv = formatter.toCSV(logs);
console.log('CSV lines:', csv.split('\n').length);
console.assert(csv.includes('timestamp,level'), 'Has CSV header');

// Test 4: Summary
const summary = formatter.toSummary(logs);
console.log('Summary:', summary);
console.assert(summary.overallHealth !== undefined);

// Test 5: Console output (visual inspection)
formatter.toConsole(logs, 5);
```

**Expected Result**:

- ✅ JSON export has correct structure
- ✅ Markdown export is properly formatted
- ✅ CSV export has correct headers
- ✅ Summary provides overview
- ✅ Console output is readable

---

### Scenario 6: Error Suggestions Knowledge Base

**Test**: Verify error suggestions work for common errors

**Steps**:

```javascript
import { ErrorSuggestions } from '@observability';

const suggestions = new ErrorSuggestions();

// Test 1: Known error codes
const testCodes = [
    'PHYSICS_UPDATE_ERROR',
    'PHYSICS_INIT_ERROR',
    'PLAYER_UPDATE_ERROR',
    'INPUT_MANAGER_ERROR',
    'LEVEL_LOAD_ERROR',
];

testCodes.forEach((code) => {
    const help = suggestions.getSuggestions(code);
    console.log(`${code}:`, help);
    console.assert(help.suggestions.length > 0, `${code} has suggestions`);
    console.assert(help.category, `${code} has category`);
    console.assert(help.severity, `${code} has severity`);
});

// Test 2: Pattern-based suggestions
const repeatingPattern = { type: 'repeating', code: 'TEST_ERROR', count: 20 };
const patternHelp = suggestions.getSuggestionsForPattern(repeatingPattern);
console.log('Pattern suggestions:', patternHelp);
console.assert(patternHelp.suggestions.length > 0);

// Test 3: Search knowledge base
const searchResults = suggestions.search('rapier');
console.log('Search results for "rapier":', searchResults.length);
console.assert(searchResults.length > 0);

// Test 4: Get all categories
const categories = suggestions.getCategories();
console.log('Categories:', categories);
console.assert(categories.includes('physics'));
console.assert(categories.includes('player'));
```

**Expected Result**:

- ✅ All known error codes have suggestions
- ✅ Pattern-based suggestions work
- ✅ Search functionality works
- ✅ Categories are correct

---

### Scenario 7: Context Injection

**Test**: Verify DebugContext automatically injects game state

**Steps**:

1. Play game for 30 seconds
2. Query logs with context:

    ```javascript
    const logsWithContext = new QueryBuilder(LOG).withContext().inLastMinutes(1).execute();

    // Check context is present
    logsWithContext.forEach((log) => {
        console.assert(log.context, 'Log has context');
        console.assert(log.context.frame !== undefined, 'Has frame number');
        console.assert(log.context.player, 'Has player state');
        console.assert(log.context.physics, 'Has physics state');
        console.assert(log.context.input, 'Has input state');

        console.log('Frame:', log.context.frame);
        console.log('Player position:', log.context.player.position);
        console.log('Physics bodies:', log.context.physics.bodyCount);
    });
    ```

**Expected Result**:

- ✅ All logs include context
- ✅ Context includes frame, player, physics, input
- ✅ Context data is accurate

---

### Scenario 8: Circuit Breaker Integration

**Test**: Verify circuit breakers generate crash dumps

**Manual Test** (requires triggering errors):

1. Artificially trigger physics errors (e.g., invalid body operation)
2. Wait for circuit breaker to trip (10 errors)
3. Check for crash dump:

    ```javascript
    const fatalLogs = LOG.getByLevel('fatal');
    console.log('Fatal logs:', fatalLogs.length);

    if (fatalLogs.length > 0) {
        const lastFatal = fatalLogs[fatalLogs.length - 1];
        console.log('Crash dump:', lastFatal.crashDump);
        console.assert(lastFatal.crashDump, 'Has crash dump');
        console.assert(lastFatal.crashDump.recentLogs, 'Has recent logs');
        console.assert(lastFatal.crashDump.gameState, 'Has game state');
    }
    ```

**Expected Result**:

- ✅ Circuit breaker triggers at threshold
- ✅ Crash dump is generated
- ✅ Crash dump includes recent logs and game state

---

### Scenario 9: Performance Validation

**Test**: Verify observability system meets performance targets

**Steps**:

```javascript
// Test 1: Buffer operation time
const startBuffer = performance.now();
for (let i = 0; i < 1000; i++) {
    LOG.dev(`PERF_TEST_${i}`, { subsystem: 'test', message: `Test ${i}` });
}
const endBuffer = performance.now();
const avgBufferTime = (endBuffer - startBuffer) / 1000;
console.log('Average buffer operation time:', avgBufferTime, 'ms');
console.assert(avgBufferTime < 0.001, 'Buffer operation under 1µs');

// Test 2: Query performance
const startQuery = performance.now();
const queryResult = new QueryBuilder(LOG)
    .level('error')
    .subsystem('physics')
    .inLastMinutes(5)
    .execute();
const endQuery = performance.now();
console.log('Query time:', endQuery - startQuery, 'ms');
console.assert(endQuery - startQuery < 5, 'Query under 5ms');

// Test 3: Analysis performance
const analyzer = new LogAnalyzer();
const logs = LOG.getAll();
const startAnalysis = performance.now();
const stats = analyzer.getStatistics(logs);
const endAnalysis = performance.now();
console.log('Analysis time:', endAnalysis - startAnalysis, 'ms');
console.assert(endAnalysis - startAnalysis < 10, 'Analysis under 10ms');
```

**Expected Result**:

- ✅ Buffer operations < 1ms (target: 0.0003ms)
- ✅ Simple queries < 5ms
- ✅ Analysis < 10ms
- ✅ No frame rate impact (<0.5ms per frame)

---

### Scenario 10: Integration Test - Complete Workflow

**Test**: Full workflow from error to resolution

**Steps**:

1. Start game
2. Trigger an error (e.g., invalid physics operation)
3. Detect error using observability:

    ```javascript
    // Step 1: Check system health
    const summary = window.debugAPI.getSummary();
    console.log('Overall health:', summary.overallHealth);

    // Step 2: Identify problem subsystem
    const criticalSystems = summary.subsystems.filter((s) => s.status === 'critical');
    console.log('Critical systems:', criticalSystems);

    // Step 3: Analyze the problematic subsystem
    if (criticalSystems.length > 0) {
        const subsystem = criticalSystems[0].name;
        const analysis = window.debugAPI.analyzeSubsystem(subsystem, 120000);
        console.log(`${subsystem} analysis:`, analysis);

        // Step 4: Get error suggestions
        if (analysis.patterns.repeatingErrors.length > 0) {
            const topError = analysis.patterns.repeatingErrors[0];
            const suggestions = window.debugAPI.getSuggestions(topError.code);
            console.log('How to fix:', suggestions.suggestions);
        }

        // Step 5: Export for bug report
        const report = window.debugAPI.exportForAnalysis({
            format: 'markdown',
            timeWindow: 300000,
        });
        console.log('Bug report generated:', report.length, 'characters');
    }
    ```

**Expected Result**:

- ✅ Error detected and categorized
- ✅ Health score reflects issue
- ✅ Suggestions provided
- ✅ Export generates useful report
- ✅ Complete workflow takes < 5 seconds

---

## Validation Checklist

### Core Functionality

- [ ] LogSystem captures logs at all levels
- [ ] BoundedBuffer maintains 2000-entry limit
- [ ] DebugContext injects game state
- [ ] StateProviders (Player, Physics, Input) work correctly

### API Components

- [ ] DebugAPI accessible via window.debugAPI
- [ ] QueryBuilder fluent API chains correctly
- [ ] LogAnalyzer provides accurate statistics
- [ ] ExportFormatter generates all formats
- [ ] ErrorSuggestions knowledge base is complete

### Integration

- [ ] Game scene initializes all observability components
- [ ] Circuit breakers trigger crash dumps
- [ ] ErrorPatternDetector identifies patterns
- [ ] CrashDumpGenerator captures full state

### Performance

- [ ] Buffer operations < 1ms
- [ ] Simple queries < 5ms
- [ ] Complex analysis < 10ms
- [ ] No perceptible frame rate impact

### Documentation

- [ ] All API methods documented
- [ ] DEBUGGING.md guide is complete
- [ ] ERROR_HANDLING_LOGGING.md is updated
- [ ] STATUS_OBSERVABILITY.json is accurate

---

## Success Criteria

Phase 8 is complete when:

1. ✅ All 10 test scenarios pass
2. ✅ All validation checklist items checked
3. ✅ Performance targets met
4. ✅ No critical bugs found
5. ✅ Documentation is accurate and complete

---

## Known Limitations

1. **Sampling**: Dev logs are sampled at 1% - not all dev logs will appear
2. **Buffer Size**: Only 2000 most recent logs retained
3. **Context Overhead**: Context injection adds ~0.1ms per log
4. **Browser Console**: window.debugAPI only available in browser, not Node.js

---

## Next Steps After Phase 8

1. **Phase 9**: Production Deployment
    - Final checklist
    - Merge to main branch
    - Update production configuration
    - Monitor in production

2. **Future Enhancements** (Post-MVP):
    - Remote log shipping
    - Machine learning error prediction
    - Visual debugging dashboard
    - Performance profiling integration

---

**Test Execution Time**: ~30 minutes (manual testing)
**Automated Test Time**: ~5 minutes (unit tests)
**Total Phase 8 Time**: 2 hours (including documentation)
