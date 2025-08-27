// Simple test runner (CommonJS)
try {
    require('./test-gamestatemanager.cjs');
    require('./test-eventbus.cjs');
    require('./test-basemanager.cjs');
    require('./test-core-systems.cjs');
    require('./test-subtitle-integration.cjs');
    require('./PerformanceAnalyzer-simple.test.cjs');
    console.log('All tests passed.');
} catch (err) {
    console.error('Tests failed:', err);
    process.exit(1);
}
