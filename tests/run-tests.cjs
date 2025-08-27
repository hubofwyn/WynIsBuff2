// Simple test runner (CommonJS)
try {
    console.log('Running core tests...');
    require('./test-gamestatemanager.cjs');
    require('./test-eventbus.cjs');
    require('./test-basemanager.cjs');
    require('./test-core-systems.cjs');
    require('./test-subtitle-integration.cjs');
    require('./PerformanceAnalyzer-simple.test.cjs');
    require('./determinism.test.cjs');
    require('./boss-integration.test.cjs');
    
    console.log('Running Day 4 enhanced tests...');
    require('./performance-monitoring.test.cjs');
    require('./save-load-integration.test.cjs');
    require('./full-game-loop.test.cjs');
    
    console.log('All tests passed.');
} catch (err) {
    console.error('Tests failed:', err);
    process.exit(1);
}
