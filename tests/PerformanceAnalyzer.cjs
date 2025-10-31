// Excluded from bun test; not part of legacy runner
const assert = require('assert');

// Mock the dependencies
global.window = {};

// Mock EventBus
class MockEventBus {
    static instance = null;
    static getInstance() {
        if (!this.instance) {
            this.instance = new MockEventBus();
        }
        return this.instance;
    }
    emit() {}
    on() {}
    off() {}
}

// Set up module mocks
require.cache[require.resolve('../src/core/EventBus.js')] = {
    exports: { EventBus: MockEventBus }
};

// Import after mocking
const { PerformanceAnalyzer } = require('../src/modules/analytics/PerformanceAnalyzer.js');

function testPerformanceAnalyzer() {
    console.log('Testing PerformanceAnalyzer...');
    
    // Test singleton pattern
    const analyzer1 = PerformanceAnalyzer.getInstance();
    const analyzer2 = PerformanceAnalyzer.getInstance();
    assert.strictEqual(analyzer1, analyzer2, 'Should return same instance');
    console.log('✓ Singleton pattern works');
    
    // Test performance analysis with perfect run
    const perfectRun = {
        runId: 'test_001',
        time: 60,      // 60 seconds (half of par time)
        parTime: 120,  // 2 minutes par
        deaths: 0,     // No deaths
        maxCombo: 80,  // 80% of possible
        possibleCombo: 100,
        pickups: { coin: 10, grit: 5, relics: ['relic1', 'relic2'] },
        bosses: { pulsar: true },
        routeLength: 1000,
        routeTier: 'normal'
    };
    
    const perfectPerf = analyzer1.analyzeRun(perfectRun);
    assert.strictEqual(perfectPerf.S, 1.0, 'Perfect speed should be 1.0');
    assert.strictEqual(perfectPerf.C, 0.8, 'Combo should be 0.8');
    assert.strictEqual(perfectPerf.H, 0, 'No deaths should be 0');
    assert.strictEqual(perfectPerf.R, 2, 'Should have 2 relics');
    assert.strictEqual(perfectPerf.B, 0.2, 'One boss should give 0.2 bonus');
    console.log('✓ Perfect run analysis correct');
    
    // Test performance analysis with average run
    const averageRun = {
        runId: 'test_002',
        time: 150,     // 25% over par
        parTime: 120,
        deaths: 2,     // Some deaths
        maxCombo: 40,  // 40% of possible
        possibleCombo: 100,
        pickups: { coin: 5, grit: 2, relics: ['relic1'] },
        bosses: { pulsar: false },
        routeLength: 1000,
        routeTier: 'normal'
    };
    
    const avgPerf = analyzer1.analyzeRun(averageRun);
    assert.strictEqual(avgPerf.S, 0.5, 'Average speed should be 0.5');
    assert.strictEqual(avgPerf.C, 0.4, 'Combo should be 0.4');
    assert.strictEqual(avgPerf.H, 2, 'Deaths should be 2');
    assert.strictEqual(avgPerf.R, 1, 'Should have 1 relic');
    assert.strictEqual(avgPerf.B, 0, 'No boss bonus');
    console.log('✓ Average run analysis correct');
    
    // Test clone stats mapping
    const cloneStats = analyzer1.mapToCloneStats(perfectPerf, 'normal');
    assert(cloneStats.rate > 40, 'Clone rate should be above base');
    assert(cloneStats.stability >= 0.5 && cloneStats.stability <= 0.95, 'Stability in valid range');
    assert(cloneStats.specialty, 'Should have a specialty');
    console.log('✓ Clone stats mapping works');
    
    // Test grade calculation
    const perfectGrade = analyzer1.calculateGrade(perfectPerf);
    assert.strictEqual(perfectGrade, 'S', 'Perfect performance should be S grade');
    
    const avgGrade = analyzer1.calculateGrade(avgPerf);
    assert(['C', 'D'].includes(avgGrade), 'Average performance should be C or D grade');
    console.log('✓ Grade calculation works');
    
    // Test specialty determination
    const speedRun = { S: 1.0, C: 0.2, H: 1, R: 0, B: 0 };
    const speedSpecialty = analyzer1.determineSpecialty(speedRun);
    assert.strictEqual(speedSpecialty, 'speedster', 'High speed should be speedster');
    
    const comboRun = { S: 0.2, C: 1.0, H: 0, R: 0, B: 0 };
    const comboSpecialty = analyzer1.determineSpecialty(comboRun);
    assert.strictEqual(comboSpecialty, 'comboist', 'High combo should be comboist');
    
    const survivorRun = { S: 0.5, C: 0.5, H: 0, R: 0, B: 0 };
    const survivorSpecialty = analyzer1.determineSpecialty(survivorRun);
    assert.strictEqual(survivorSpecialty, 'survivor', 'No hits should be survivor');
    console.log('✓ Specialty determination works');
    
    // Test report generation
    const report = analyzer1.generateReport(perfectRun);
    assert(report.runId === 'test_001', 'Report should have run ID');
    assert(report.timestamp, 'Report should have timestamp');
    assert(report.performance, 'Report should have performance');
    assert(report.cloneStats, 'Report should have clone stats');
    assert(report.grade, 'Report should have grade');
    assert(report.summary, 'Report should have summary');
    console.log('✓ Report generation works');
    
    console.log('✅ PerformanceAnalyzer tests passed!');
}

// Run the tests
testPerformanceAnalyzer();
