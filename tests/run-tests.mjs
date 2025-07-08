#!/usr/bin/env node
// ESM test runner using Node's built-in test runner
import { spec } from 'node:test/reporters';
import { run } from 'node:test';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Test files to run
const testFiles = [
    './test-eventbus.mjs',
    './test-basemanager.mjs',
    './test-gamestatemanager.mjs',
    './test-core-systems.mjs',
    './test-subtitle-integration.mjs',
    './test-player-controller.mjs',
    './test-level-loader.mjs'
];

console.log('🧪 Running WynIsBuff2 Test Suite...\n');

// Run tests with nice output
const stream = run({
    files: testFiles.map(file => resolve(__dirname, file)),
    concurrency: true
});

stream.compose(spec).pipe(process.stdout);

// Handle test completion
stream.on('test:fail', () => {
    process.exitCode = 1;
});

stream.on('test:complete', () => {
    if (process.exitCode !== 1) {
        console.log('\n✅ All tests passed!');
    }
});