// Simple test runner
try {
    require('./test-gamestatemanager');
    require('./test-eventbus');
    require('./test-basemanager');
    console.log('All tests passed.');
} catch (err) {
    console.error('Tests failed:', err);
    process.exit(1);
}
