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
    require('./collision-groups.test.cjs');
    require('./kcc-adapter.test.cjs');
    require('./compat-eventbus.test.cjs');
    require('./physics-contacts.test.cjs');
    require('./prerun.smoke.cjs');
    require('./leveldata.parallax.smoke.cjs');
    require('./levelmanager-collision.wire.test.cjs');
    require('./levelloader.load.smoke.cjs');
    require('./physics-intersection.smoke.cjs');

    console.log('All tests passed.');
} catch (err) {
    console.error('Tests failed:', err);
    process.exitCode = 1;
} finally {
    // Agentic smokes should run regardless of pass/fail to surface a summary in CI.
    try { require('./agentic/boot.smoke.cjs'); } catch (e) { console.warn('[agentic] boot smoke failed:', e?.message || e); }
    try { require('./agentic/phaser4-smoke.cjs'); } catch (e) { console.warn('[agentic] phaser4 smoke failed:', e?.message || e); }
    try { require('./agentic/ray-filter-smoke.cjs'); } catch (e) { console.warn('[agentic] ray-filter smoke failed:', e?.message || e); }
    try { require('./agentic/assets-logo-smoke.cjs'); } catch (e) { console.warn('[agentic] assets-logo smoke failed:', e?.message || e); }
    try { require('./agentic/boot-game.smoke.cjs'); } catch (e) { console.warn('[agentic] boot-game smoke failed:', e?.message || e); }
}
