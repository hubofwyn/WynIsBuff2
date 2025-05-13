// Simple test runner (CommonJS)
try {
    require('./test-gamestatemanager.cjs');
    console.log('All tests passed.');
} catch (err) {
    console.error('Tests failed:', err);
    process.exit(1);
}