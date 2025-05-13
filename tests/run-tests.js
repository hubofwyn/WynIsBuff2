// Simple test runner
try {
    require('./test-gamestatemanager');
    console.log('All tests passed.');
} catch (err) {
    console.error('Tests failed:', err);
    process.exit(1);
}