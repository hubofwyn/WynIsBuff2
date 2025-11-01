#!/usr/bin/env bun
/**
 * Simple Architecture validation script for WynIsBuff2
 * Works without external dependencies
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

class SimpleArchitectureValidator {
    constructor() {
        this.projectRoot = process.cwd();
        this.srcPath = join(this.projectRoot, 'src');
        this.specPath = join(this.projectRoot, 'architecture', 'a-spec.json');
        this.snapshotPath = join(this.projectRoot, 'architecture', 'snapshot.json');

        this.stats = {
            totalFiles: 0,
            totalDirs: 0,
            layerCounts: {},
            violations: [],
        };
    }

    run() {
        console.log('🏗️  WynIsBuff2 Architecture Validator (Simple)\n');

        // Step 1: Load A-Spec if it exists
        let spec = null;
        if (existsSync(this.specPath)) {
            console.log('📋 Loading A-Spec...');
            spec = JSON.parse(readFileSync(this.specPath, 'utf-8'));
            console.log(`✅ A-Spec v${spec.version} loaded`);
            console.log(`   Runtime: ${spec.meta.runtime}`);
            console.log(
                `   Stack: Vite ${spec.meta.vite}, Phaser ${spec.meta.phaser}, Rapier ${spec.meta.rapier}`
            );
        }

        // Step 2: Scan project structure
        console.log('\n🔍 Scanning project structure...');
        const structure = this.scanProjectStructure();

        // Step 3: Analyze imports
        console.log('\n🔗 Analyzing module dependencies...');
        const violations = this.analyzeImports(structure, spec);

        // Step 4: Generate snapshot
        console.log('\n📸 Generating architecture snapshot...');
        const snapshot = this.generateSnapshot(structure, violations);

        // Step 5: Report findings
        console.log('\n📊 Architecture Report:\n');
        this.generateReport(snapshot);

        // Return exit code based on violations
        const hasViolations = violations.length > 0;
        if (hasViolations) {
            console.log('\n⚠️  Architecture validation completed with warnings');
            process.exit(0); // Don't fail in early development
        } else {
            console.log('\n✨ Architecture validation passed!');
            process.exit(0);
        }
    }

    scanProjectStructure() {
        const structure = {
            files: [],
            dirs: [],
            layers: {},
        };

        const scan = (dir, depth = 0) => {
            if (depth > 10) return; // Prevent infinite recursion

            try {
                const items = readdirSync(dir);

                for (const item of items) {
                    // Skip node_modules, dist, etc
                    if (item.startsWith('.') || item === 'node_modules' || item === 'dist') {
                        continue;
                    }

                    const fullPath = join(dir, item);
                    const relPath = relative(this.srcPath, fullPath);
                    const stat = statSync(fullPath);

                    if (stat.isDirectory()) {
                        this.stats.totalDirs++;
                        structure.dirs.push(relPath);
                        scan(fullPath, depth + 1);
                    } else if (item.endsWith('.js') || item.endsWith('.mjs')) {
                        this.stats.totalFiles++;
                        const layer = this.determineLayer(relPath);

                        structure.files.push({
                            path: relPath,
                            layer: layer,
                            name: item,
                        });

                        // Count by layer
                        if (!structure.layers[layer]) {
                            structure.layers[layer] = [];
                        }
                        structure.layers[layer].push(relPath);

                        if (!this.stats.layerCounts[layer]) {
                            this.stats.layerCounts[layer] = 0;
                        }
                        this.stats.layerCounts[layer]++;
                    }
                }
            } catch (error) {
                console.error(`Error scanning ${dir}: ${error.message}`);
            }
        };

        scan(this.srcPath);
        return structure;
    }

    determineLayer(path) {
        if (path.startsWith('core/')) return 'core';
        if (path.startsWith('scenes/')) return 'scenes';
        if (path.startsWith('modules/player/')) return 'player-agent';
        if (path.startsWith('modules/enemy/')) return 'enemy-agent';
        if (path.startsWith('modules/')) return 'game-systems';
        if (path.startsWith('features/')) return 'public-api';
        if (path.startsWith('constants/')) return 'constants';
        if (path.startsWith('observability/')) return 'observability';
        if (path.startsWith('utils/')) return 'utils';
        if (path.startsWith('types/')) return 'types';
        return 'other';
    }

    analyzeImports(structure, spec) {
        const violations = [];

        for (const file of structure.files) {
            const fullPath = join(this.srcPath, file.path);

            try {
                const content = readFileSync(fullPath, 'utf-8');

                // Simple import detection
                const importRegex =
                    /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
                let match;

                while ((match = importRegex.exec(content)) !== null) {
                    const importPath = match[1];

                    // Check for obvious violations
                    const violation = this.checkViolation(file, importPath, spec);
                    if (violation) {
                        violations.push(violation);
                        this.stats.violations.push(violation);
                    }
                }
            } catch (error) {
                // Silently skip files we can't read
            }
        }

        return violations;
    }

    checkViolation(file, importPath, spec) {
        const layer = file.layer;

        // Simple violation rules

        // 1. Constants should not import anything (except maybe types)
        if (layer === 'constants' && !importPath.startsWith('.') && !importPath.includes('type')) {
            return {
                file: file.path,
                layer: layer,
                import: importPath,
                rule: 'Constants should not have dependencies',
            };
        }

        // 2. Observability should only import from itself
        if (
            layer === 'observability' &&
            !importPath.includes('observability') &&
            !importPath.startsWith('.')
        ) {
            return {
                file: file.path,
                layer: layer,
                import: importPath,
                rule: 'Observability should be self-contained',
            };
        }

        // 3. Game systems shouldn't import vendors directly
        if (
            (layer === 'game-systems' || layer === 'player-agent' || layer === 'enemy-agent') &&
            (importPath === 'phaser' ||
                importPath.includes('@dimforge/rapier') ||
                importPath === 'howler')
        ) {
            return {
                file: file.path,
                layer: layer,
                import: importPath,
                rule: 'Gameplay code should use manager facades, not vendors directly',
            };
        }

        // 4. Check for Math.random usage (not an import, but worth checking)
        if (layer !== 'core' && layer !== 'observability') {
            const filePath = join(this.srcPath, file.path);
            try {
                const content = readFileSync(filePath, 'utf-8');
                if (content.includes('Math.random()')) {
                    return {
                        file: file.path,
                        layer: layer,
                        import: 'Math.random()',
                        rule: 'Use DeterministicRNG instead of Math.random()',
                    };
                }
            } catch (error) {
                // Skip
            }
        }

        return null;
    }

    generateSnapshot(structure, violations) {
        const snapshot = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            stats: {
                totalFiles: this.stats.totalFiles,
                totalDirs: this.stats.totalDirs,
                layerCounts: this.stats.layerCounts,
                violationCount: violations.length,
            },
            layers: {},
            violations: violations.slice(0, 20), // First 20 violations
            summary: {
                healthScore: this.calculateHealthScore(violations.length),
                recommendation: this.getRecommendation(violations.length),
            },
        };

        // Organize files by layer
        for (const [layer, files] of Object.entries(structure.layers)) {
            snapshot.layers[layer] = {
                fileCount: files.length,
                examples: files.slice(0, 3), // Show first 3 files as examples
            };
        }

        // Write snapshot
        try {
            const dir = join(this.projectRoot, 'architecture');
            if (!existsSync(dir)) {
                require('fs').mkdirSync(dir, { recursive: true });
            }
            writeFileSync(this.snapshotPath, JSON.stringify(snapshot, null, 2));
            console.log(`✅ Snapshot saved to ${relative(this.projectRoot, this.snapshotPath)}`);
        } catch (error) {
            console.error(`❌ Failed to save snapshot: ${error.message}`);
        }

        return snapshot;
    }

    calculateHealthScore(violationCount) {
        if (violationCount === 0) return 100;
        if (violationCount <= 5) return 90;
        if (violationCount <= 10) return 75;
        if (violationCount <= 20) return 60;
        return Math.max(0, 50 - violationCount);
    }

    getRecommendation(violationCount) {
        if (violationCount === 0) return 'Excellent! Architecture is clean.';
        if (violationCount <= 5) return 'Good. Minor violations to address.';
        if (violationCount <= 15) return 'Fair. Consider addressing violations soon.';
        return 'Needs attention. Review and fix violations.';
    }

    generateReport(snapshot) {
        // Basic stats
        console.log(`📁 Total Files: ${snapshot.stats.totalFiles}`);
        console.log(`📂 Total Directories: ${snapshot.stats.totalDirs}`);
        console.log(`🏗️  Health Score: ${snapshot.summary.healthScore}/100`);
        console.log(`💡 ${snapshot.summary.recommendation}`);

        // Layer distribution
        console.log('\n📐 Layer Distribution:');
        const layers = Object.entries(snapshot.stats.layerCounts).sort((a, b) => b[1] - a[1]);

        for (const [layer, count] of layers) {
            const percentage = ((count / snapshot.stats.totalFiles) * 100).toFixed(1);
            console.log(
                `  ${layer.padEnd(20)} ${count.toString().padStart(4)} files (${percentage}%)`
            );
        }

        // Violations
        if (snapshot.violations.length > 0) {
            console.log(`\n⚠️  Found ${snapshot.stats.violationCount} architecture violations:`);
            console.log('   (Showing first 10)\n');

            for (const violation of snapshot.violations.slice(0, 10)) {
                console.log(`  📍 ${violation.file}`);
                console.log(`     Layer: ${violation.layer}`);
                console.log(`     Import: ${violation.import}`);
                console.log(`     Rule: ${violation.rule}\n`);
            }

            if (snapshot.stats.violationCount > 10) {
                console.log(`   ... and ${snapshot.stats.violationCount - 10} more violations`);
            }
        } else {
            console.log('\n✅ No architecture violations detected!');
        }

        // Recommendations
        console.log('\n🎯 Next Steps:');
        if (snapshot.stats.violationCount === 0) {
            console.log('  1. Consider enabling strict enforcement (enforcement: "error")');
            console.log('  2. Add more sophisticated layer rules');
            console.log('  3. Set up CI/CD integration');
        } else {
            console.log('  1. Review and fix the violations listed above');
            console.log('  2. Update A-Spec with any necessary exceptions');
            console.log('  3. Run validation again to verify fixes');
        }
    }
}

// Run the validator
const validator = new SimpleArchitectureValidator();
validator.run();
