# Logger Migration Guide

This guide shows how to migrate from `console.log` to the new Logger system.

## Benefits of Using Logger

1. **Log Levels** - Control verbosity (ERROR, WARN, INFO, DEBUG, TRACE)
2. **Module Filtering** - Only see logs from specific modules
3. **Production Ready** - Automatically reduces logging in production
4. **Log History** - Access previous logs for debugging
5. **Colored Output** - Better visibility in development
6. **Consistent Format** - Timestamps and module names

## Basic Migration

### Before (console.log)
```javascript
console.log('[PlayerController] Initialized with modular architecture');
console.error('[PlayerController] Failed to create physics body:', error);
console.warn('[PlayerController] Player health low:', health);
```

### After (Logger)
```javascript
import { getLogger } from '@features/core';

const logger = getLogger('PlayerController');

logger.info('Initialized with modular architecture');
logger.error('Failed to create physics body:', error);
logger.warn('Player health low:', health);
```

## Module Examples

### AudioManager
```javascript
// Before
console.log('[AudioManager] Initialized with settings', this.settings);
console.log(`[AudioManager] playMusic called for: ${key}`, track);

// After
import { getLogger } from '@features/core';
const logger = getLogger('AudioManager');

logger.info('Initialized with settings', this.settings);
logger.debug(`playMusic called for: ${key}`, track);
```

### GameStateManager
```javascript
// Before
console.log('[GameStateManager] Progress saved for level', levelId);
console.error('[GameStateManager] Error saving settings:', error);

// After
const logger = getLogger('GameStateManager');

logger.info('Progress saved for level', levelId);
logger.error('Error saving settings:', error);
```

### LevelLoader
```javascript
// Before
console.log('[LevelLoader] Loading level:', levelId);
console.log('[LevelLoader] Created platform at', x, y);

// After
const logger = getLogger('LevelLoader');

logger.info('Loading level:', levelId);
logger.debug('Created platform at', x, y);
```

## Log Levels Guide

- **ERROR** - Critical errors that need immediate attention
- **WARN** - Warning conditions that might cause problems
- **INFO** - Important information about application flow
- **DEBUG** - Detailed information for debugging
- **TRACE** - Very detailed information (rarely used)

### Examples:
```javascript
logger.error('Failed to load asset:', assetPath);      // ERROR
logger.warn('Performance degradation detected');        // WARN
logger.info('Level completed in', time, 'seconds');   // INFO
logger.debug('Spawn position calculated:', x, y);      // DEBUG
logger.trace('Physics step:', deltaTime);              // TRACE
```

## Configuration

### Development
```javascript
// In main.js or boot scene
import { Logger, LogLevel } from '@features/core';

const logger = Logger.getInstance();
logger.setLevel(LogLevel.DEBUG);
```

### Production
```javascript
// Automatically set to WARN level when NODE_ENV=production
// Or manually:
logger.setLevel(LogLevel.WARN);
```

### Module Filtering
```javascript
// Only show logs from specific modules
logger.setModuleFilter(['PlayerController', 'LevelLoader']);

// Show all modules
logger.setModuleFilter(null);
```

### Disable Console Output
```javascript
// Useful for tests or specific scenarios
logger.setConsoleEnabled(false);
```

## Best Practices

1. **Use Appropriate Levels**
   - ERROR for failures that affect gameplay
   - WARN for recoverable issues
   - INFO for important state changes
   - DEBUG for development details

2. **Module Names**
   - Use the class name for consistency
   - Be specific: 'PlayerController' not 'Player'

3. **Message Format**
   - Start with action: "Loading level" not "Level is being loaded"
   - Include relevant data as parameters, not string concatenation

4. **Performance**
   - DEBUG and TRACE logs are automatically removed in production
   - No need for `if (DEBUG)` checks

## Migration Checklist

- [ ] Import getLogger from @features/core
- [ ] Create logger instance at top of class/module
- [ ] Replace console.log with logger.info or logger.debug
- [ ] Replace console.error with logger.error
- [ ] Replace console.warn with logger.warn
- [ ] Remove module prefix from messages (Logger adds it automatically)
- [ ] Test that logs appear correctly
- [ ] Consider adding more debug logs now that they're filterable