#!/usr/bin/env node

/**
 * Architecture Health Dashboard
 *
 * Provides a quick overview of the project's architectural health by running
 * all validation checks and presenting a summary.
 *
 * Usage:
 *   bun run arch:health
 *   npm run arch:health
 *
 * Exit code: 0 if all checks pass, 1 if any fail
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function colorize(text, color) {
    return `${COLORS[color]}${text}${COLORS.reset}`;
}

function runCheck(name, command, options = {}) {
    const { allowFailure = false, silent = false } = options;

    try {
        const output = execSync(command, {
            stdio: silent ? 'pipe' : 'inherit',
            encoding: 'utf8'
        });

        if (silent) {
            return { success: true, output };
        }
        return { success: true };
    } catch (error) {
        if (allowFailure) {
            return { success: false, error };
        }
        return { success: false, error };
    }
}

console.log(colorize('\n🏗️  WynIsBuff2 Architecture Health Report\n', 'cyan'));
console.log('='.repeat(60) + '\n');

// Track results
const results = [];

// Check 1: A-Spec Validation
console.log(colorize('1. A-Spec Schema Validation', 'blue'));
const aspecResult = runCheck(
    'A-Spec Validation',
    'bun run arch:validate',
    { silent: true }
);
results.push({ name: 'A-Spec Validation', ...aspecResult });
console.log(aspecResult.success ?
    colorize('   ✅ A-Spec schema valid\n', 'green') :
    colorize('   ❌ A-Spec validation failed\n', 'red')
);

// Check 2: Layer Boundaries
console.log(colorize('2. Layer Boundary Compliance', 'blue'));
const boundariesResult = runCheck(
    'Layer Boundaries',
    'bun run lint:boundaries --max-warnings=1',
    { silent: true }
);
results.push({ name: 'Layer Boundaries', ...boundariesResult });

// Parse boundary results to show warning count
let warningCount = 0;
if (boundariesResult.output) {
    const match = boundariesResult.output.match(/(\d+) problem/);
    if (match) {
        warningCount = parseInt(match[1]);
    }
}

console.log(boundariesResult.success ?
    colorize(`   ✅ Boundaries valid (${warningCount} warning allowed)\n`, 'green') :
    colorize(`   ❌ Boundary violations detected (${warningCount} issues)\n`, 'red')
);

// Check 3: Dependency Graph
console.log(colorize('3. Dependency Graph Validation', 'blue'));
const depsResult = runCheck(
    'Dependency Graph',
    'bun run deps:check',
    { silent: true }
);
results.push({ name: 'Dependency Graph', ...depsResult });
console.log(depsResult.success ?
    colorize('   ✅ No circular or forbidden dependencies\n', 'green') :
    colorize('   ❌ Dependency issues detected\n', 'red')
);

// Check 4: Test Suite
console.log(colorize('4. Test Suite', 'blue'));
const testResult = runCheck(
    'Test Suite',
    'bun test',
    { silent: true }
);
results.push({ name: 'Test Suite', ...testResult });
console.log(testResult.success ?
    colorize('   ✅ All tests passing\n', 'green') :
    colorize('   ❌ Tests failing\n', 'red')
);

// Calculate health score
const passed = results.filter(r => r.success).length;
const total = results.length;
const score = Math.round((passed / total) * 100);

// Display summary
console.log('='.repeat(60));
console.log(colorize(`\n📊 Health Score: ${passed}/${total} (${score}%)`, score === 100 ? 'green' : 'yellow'));

if (score === 100) {
    console.log(colorize('🎉 Perfect architectural health!\n', 'green'));
} else {
    console.log(colorize('\n💡 Issues detected. Run individual checks for details:\n', 'yellow'));

    results.forEach(result => {
        if (!result.success) {
            console.log(colorize(`   • ${result.name}`, 'red'));
        }
    });

    console.log('\n' + colorize('Commands:', 'cyan'));
    console.log('   bun run arch:validate  - Check A-Spec schema');
    console.log('   bun run lint:boundaries - Check layer boundaries');
    console.log('   bun run deps:check     - Check dependencies');
    console.log('   bun test               - Run test suite\n');
}

// Read STATUS-ARCHITECTURE.json for context
try {
    const status = JSON.parse(readFileSync('./STATUS-ARCHITECTURE.json', 'utf8'));
    console.log(colorize('📋 Current Phase: ', 'cyan') + status.currentPhase);
    console.log(colorize('📈 Completion: ', 'cyan') + status.completionPercentage + '%');

    if (status.violationStatus?.current) {
        const violations = status.violationStatus.current;
        console.log(colorize('\n⚠️  Known Issues:', 'cyan'));
        if (violations.dependencyCruiser) {
            console.log(`   • Dependency: ${violations.dependencyCruiser.errors} errors, ${violations.dependencyCruiser.warnings} warnings`);
        }
        if (violations.eslintBoundaries) {
            console.log(`   • Boundaries: ${violations.eslintBoundaries.errors} errors, ${violations.eslintBoundaries.warnings} warnings`);
        }
    }
} catch (e) {
    // Ignore if file doesn't exist
}

console.log('\n' + '='.repeat(60) + '\n');

// Exit with appropriate code
process.exit(score === 100 ? 0 : 1);
