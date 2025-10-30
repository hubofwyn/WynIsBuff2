# Phase 7: Agent Tools & API Implementation Plan

**Goal**: Enhance observability system with advanced agent-friendly query, analysis, and export capabilities.

**Estimated Time**: 3 hours
**Status**: In Progress
**Phase**: 7 of 10

---

## Objectives

1. **Enhanced Query API**: Build on existing LogSystem queries with advanced filtering
2. **Pattern Matching**: Expand pattern detection beyond repeating errors
3. **JSON Export**: Structured export with rich metadata for agent analysis
4. **Analysis Tools**: Helper utilities for common debugging workflows
5. **Agent Integration**: Easy-to-use API for AI-assisted debugging

---

## Current State Analysis

### Existing Capabilities (Phases 0-5)

**LogSystem Query API**:
- `getByLevel(level, limit)` - Filter by log level
- `getByCode(code)` - Filter by error code
- `getBySubsystem(subsystem, limit)` - Filter by subsystem
- `getAll()` - Get all logs in buffer

**Error Analysis**:
- `ErrorPatternDetector.analyzeRecent(timeWindow)` - Detect patterns
  - Repeating errors (same code 3+ times)
  - Error cascades (5+ errors in 1 second)
  - Error rates and severity

**Utilities**:
- `CrashDumpGenerator.generate()` - Comprehensive crash dumps
- `DebugContext.captureState()` - Game state snapshots

### Gaps to Address

1. **Complex Queries**: No way to combine multiple filters
2. **Time-Based Queries**: Can't filter by time range easily
3. **Correlation**: No built-in correlation between related errors
4. **Metadata**: Export lacks rich context for agents
5. **Recommendations**: No automated fix suggestions

---

## Phase 7 Components

### Component 1: DebugAPI Class

**Purpose**: Unified interface for agent-friendly debugging operations

**Location**: `src/observability/api/DebugAPI.js`

**Key Methods**:
```javascript
class DebugAPI {
    constructor(logSystem, debugContext, errorPatternDetector) {
        this.logSystem = logSystem;
        this.debugContext = debugContext;
        this.patternDetector = errorPatternDetector;
    }

    // Advanced queries
    query(filters) {
        // Filter logs by multiple criteria:
        // - level, subsystem, code, timeRange, hasError, frameRange
    }

    // Time-based queries
    getLogsInTimeRange(startTime, endTime) { }
    getRecentLogs(milliseconds) { }

    // Correlation
    getRelatedLogs(log, options) {
        // Find logs related to given log:
        // - Same frame
        // - Same subsystem
        // - Within time window
        // - Causally related (error cascade)
    }

    // Analysis
    analyzeSubsystem(subsystem) {
        // Comprehensive subsystem health check
    }

    analyzeTimeWindow(startTime, endTime) {
        // Analyze all activity in time window
    }

    // Export with metadata
    exportForAnalysis(options) {
        // Rich JSON export with metadata
    }

    // Recommendations (simple heuristics)
    getSuggestions(errorCode) {
        // Get common fixes for error codes
    }

    // Summary
    getSummary() {
        // Overall system health summary
    }
}
```

**Benefits**:
- Single entry point for agents
- Combines multiple data sources
- Higher-level abstractions
- Metadata-rich responses

### Component 2: QueryBuilder

**Purpose**: Fluent API for building complex queries

**Location**: `src/observability/api/QueryBuilder.js`

**Example Usage**:
```javascript
const results = new QueryBuilder(LOG)
    .level('error')
    .subsystem('physics')
    .inTimeRange(Date.now() - 5000, Date.now())
    .withContext()
    .limit(20)
    .execute();
```

**Features**:
- Method chaining
- Type-safe filters
- Composable queries
- Optimized execution

### Component 3: LogAnalyzer

**Purpose**: Advanced log analysis utilities

**Location**: `src/observability/api/LogAnalyzer.js`

**Key Methods**:
```javascript
class LogAnalyzer {
    // Statistical analysis
    getStatistics(logs) {
        // Count by level, subsystem, code
        // Time distribution
        // Error rates
    }

    // Correlation analysis
    findCausalRelationships(logs) {
        // Identify which errors caused others
        // Build error dependency graph
    }

    // Health metrics
    getSubsystemHealth(subsystem, timeWindow) {
        // Health score (0-100)
        // Error rate
        // Recent issues
    }

    // Trend analysis
    getTrends(logs, windowSize) {
        // Error rate over time
        // Subsystem stability trends
    }

    // Recommendations
    generateRecommendations(analysis) {
        // Based on patterns, suggest fixes
    }
}
```

### Component 4: ExportFormatter

**Purpose**: Structured export formats for agents

**Location**: `src/observability/api/ExportFormatter.js`

**Export Formats**:
```javascript
class ExportFormatter {
    // Rich JSON with metadata
    toJSON(logs, options = {}) {
        return {
            metadata: {
                exportTime: Date.now(),
                logCount: logs.length,
                timeRange: { start, end },
                bufferSize: 2000,
                version: '1.0.0'
            },
            summary: {
                byLevel: { error: 10, warn: 5, ... },
                bySubsystem: { physics: 20, player: 15, ... },
                errorCodes: { PHYSICS_UPDATE_ERROR: 8, ... }
            },
            patterns: patternDetector.analyzeRecent(),
            logs: logs.map(enrichLog),
            relatedData: {
                gameState: debugContext.captureState(),
                performance: performanceMetrics
            }
        };
    }

    // Markdown report
    toMarkdown(logs, analysis) {
        // Human-readable report
    }

    // CSV for spreadsheet analysis
    toCSV(logs) {
        // Tabular format
    }
}
```

### Component 5: ErrorSuggestions

**Purpose**: Heuristic-based fix suggestions

**Location**: `src/observability/api/ErrorSuggestions.js`

**Knowledge Base**:
```javascript
const ERROR_SUGGESTIONS = {
    'PHYSICS_UPDATE_ERROR': [
        'Check if physics world is initialized',
        'Verify all bodies have valid handles',
        'Check for NaN in body positions or velocities',
        'Review recent Rapier API changes'
    ],
    'PLAYER_UPDATE_ERROR': [
        'Verify player body exists',
        'Check character controller initialization',
        'Validate input manager state',
        'Check for NaN in movement calculations'
    ],
    // ... more error codes
};

class ErrorSuggestions {
    getSuggestions(errorCode, context) {
        // Return relevant suggestions
        // Consider context (recent logs, game state)
    }

    getCommonSolutions(pattern) {
        // For error patterns, suggest solutions
    }
}
```

---

## Implementation Plan

### Step 1: Create Base DebugAPI (30 min)
- Create `src/observability/api/` directory
- Implement DebugAPI class with basic methods
- Connect to existing LogSystem, DebugContext, ErrorPatternDetector
- Add to barrel export

### Step 2: Implement QueryBuilder (30 min)
- Create QueryBuilder class
- Implement method chaining
- Add filter methods (level, subsystem, code, timeRange, etc.)
- Add execution logic

### Step 3: Create LogAnalyzer (45 min)
- Implement statistical analysis
- Add correlation detection
- Create health metrics
- Add trend analysis

### Step 4: Build ExportFormatter (30 min)
- Implement rich JSON export
- Add metadata generation
- Create summary statistics
- Add Markdown formatter

### Step 5: Add ErrorSuggestions (30 min)
- Create knowledge base
- Implement suggestion retrieval
- Add context-aware filtering
- Integrate with DebugAPI

### Step 6: Testing & Integration (30 min)
- Unit tests for new components
- Integration test with Game scene
- Performance validation
- Documentation updates

### Step 7: Documentation (15 min)
- Update ERROR_HANDLING_LOGGING.md
- Update DEBUGGING.md guide
- Add API examples
- Update STATUS_OBSERVABILITY.json

---

## Usage Examples

### Example 1: Advanced Query

```javascript
import { DebugAPI } from '@observability';

const api = new DebugAPI(LOG, debugContext, errorPatternDetector);

// Find all physics errors in last 5 seconds with context
const results = api.query({
    subsystem: 'physics',
    level: 'error',
    timeRange: { last: 5000 },
    includeContext: true
});

console.log('Physics errors:', results);
```

### Example 2: Subsystem Analysis

```javascript
// Analyze physics subsystem health
const analysis = api.analyzeSubsystem('physics');

console.log('Physics health:', analysis);
// {
//   health: 85,  // 0-100 score
//   errorRate: 0.5,  // errors per second
//   recentIssues: [...],
//   trends: { improving: true },
//   suggestions: [...]
// }
```

### Example 3: Export for Analysis

```javascript
// Export logs with rich metadata for AI analysis
const exportData = api.exportForAnalysis({
    format: 'json',
    includePatterns: true,
    includeGameState: true,
    includePerformance: true
});

// Save or send to AI agent
console.log(JSON.stringify(exportData, null, 2));
```

### Example 4: Get Recommendations

```javascript
// Get suggestions for specific error
const suggestions = api.getSuggestions('PHYSICS_UPDATE_ERROR');
console.log('Try these fixes:', suggestions);

// Get overall system summary
const summary = api.getSummary();
console.log('System health:', summary);
```

### Example 5: Query Builder

```javascript
import { QueryBuilder } from '@observability';

const errors = new QueryBuilder(LOG)
    .level('error')
    .subsystem('physics')
    .inLastMinutes(5)
    .withContext()
    .sortByTime('desc')
    .limit(10)
    .execute();

console.log('Recent physics errors:', errors);
```

---

## Integration Points

### Game Scene Integration

```javascript
// In Game.js create()
import { DebugAPI } from '@observability';

this.debugAPI = new DebugAPI(
    LOG,
    this.debugContext,
    this.errorPatternDetector
);

// Make available globally for console debugging
if (typeof window !== 'undefined') {
    window.debugAPI = this.debugAPI;
}
```

### Console Access (for development)

```javascript
// In browser console:
debugAPI.getSummary();
debugAPI.analyzeSubsystem('physics');
debugAPI.query({ level: 'error', last: 10000 });
```

---

## Performance Considerations

**Query Optimization**:
- Index logs by subsystem and level
- Cache query results (5-second TTL)
- Lazy evaluation where possible
- Limit default result sets

**Memory Management**:
- Export generation doesn't duplicate data
- Streaming export for large datasets
- Respect buffer limits (2000 entries)

**Target Performance**:
- Simple queries: <1ms
- Complex queries: <5ms
- Export generation: <10ms
- Zero impact on frame rate

---

## Success Criteria

1. **API Completeness**:
   - ✅ All planned methods implemented
   - ✅ Query builder functional
   - ✅ Export formats working

2. **Performance**:
   - ✅ Queries complete within targets
   - ✅ No frame rate impact
   - ✅ Memory usage stable

3. **Usability**:
   - ✅ Clear, consistent API
   - ✅ Good error messages
   - ✅ Comprehensive examples

4. **Documentation**:
   - ✅ API reference complete
   - ✅ Usage examples provided
   - ✅ Integration guide updated

5. **Testing**:
   - ✅ Unit tests pass
   - ✅ Integration tests pass
   - ✅ Build successful

---

## Future Enhancements (Phase 8+)

- Natural language query interface
- Machine learning-based pattern detection
- Automated fix application
- Real-time monitoring dashboard
- Integration with external monitoring tools

---

**Phase 7 Start**: 2025-10-29T21:30:00Z
**Phase 7 Target**: 2025-10-29T24:30:00Z (3 hours)
