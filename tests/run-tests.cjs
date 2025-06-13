// Simple test runner (CommonJS)
try {
    require('./test-gamestatemanager.cjs');
    require('./test-eventbus.cjs');
    require('./test-basemanager.cjs');
    console.log('All tests passed.');
} catch (err) {
    console.error('Tests failed:', err);
    process.exit(1);
}
