#!/usr/bin/env bun
/**
 * Architecture validation script for WynIsBuff2
 * Validates A-Spec compliance and generates architecture snapshots
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Use a simple console logger for scripts (not the game's LOG system)
const log = {
    info: (msg, data = {}) => console.log(`✅ ${msg}`, data),
    warn: (msg, data = {}) => console.warn(`⚠️  ${msg}`, data),
    error: (msg, data = {}) => console.error(`❌ ${msg}`, data),
};

class ArchitectureValidator {
    constructor() {
        this.projectRoot = process.cwd();
        this.specPath = join(this.projectRoot, 'architecture', 'a-spec.json');
        this.schemaPath = join(this.projectRoot, 'architecture', 'a-spec.schema.json');
        this.snapshotPath = join(this.projectRoot, 'architecture', 'snapshot.json');

        this.ajv = new Ajv({ allErrors: true, verbose: true });
        addFormats(this.ajv);

        this.stats = {
            totalFiles: 0,
            totalModules: 0,
            layerCounts: {},
            importCounts: {},
        };
    }

    async run() {
        console.log('🏗️  WynIsBuff2 Architecture Validator\n');

        // Step 1: Validate A-Spec if it exists
        if (existsSync(this.specPath) && existsSync(this.schemaPath)) {
            console.log('📋 Validating A-Spec...');
            const specValid = this.validateSpec();
            if (!specValid) {
                process.exit(1);
            }
        } else {
            log.warn('A-Spec or schema not found, skipping validation');
        }

        // Step 2: Scan project structure
        console.log('\n🔍 Scanning project structure...');
        const structure = this.scanProjectStructure();

        // Step 3: Analyze imports
        console.log('\n🔗 Analyzing module dependencies...');
        const dependencies = await this.analyzeDependencies(structure);

        // Step 4: Generate snapshot
        console.log('\n📸 Generating architecture snapshot...');
        this.generateSnapshot(structure, dependencies);

        // Step 5: Report findings
        console.log('\n📊 Architecture Report:\n');
        this.generateReport();

        console.log('\n✨ Architecture validation complete!');
    }

    validateSpec() {
        try {
            const schema = JSON.parse(readFileSync(this.schemaPath, 'utf-8'));
            const spec = JSON.parse(readFileSync(this.specPath, 'utf-8'));

            const validate = this.ajv.compile(schema);
            const valid = validate(spec);

            if (!valid) {
                log.error('A-Spec validation failed:', validate.errors);
                return false;
            }

            log.info(`A-Spec v${spec.version} is valid`);
            return true;
        } catch (error) {
            log.error('Failed to validate A-Spec:', error.message);
            return false;
        }
    }

    scanProjectStructure() {
        const srcPath = join(this.projectRoot, 'src');
        const structure = {
            modules: [],
            layers: {
                core: [],
                scenes: [],
                modules: {},
                features: [],
                constants: [],
                observability: [],
            },
        };

        // Scan each top-level directory
        const scanDir = (dir, layer = null) => {
            const items = readdirSync(dir);

            for (const item of items) {
                const itemPath = join(dir, item);
                const stat = statSync(itemPath);

                if (stat.isDirectory()) {
                    const relPath = relative(srcPath, itemPath);

                    // Categorize by layer
                    if (relPath.startsWith('core/')) {
                        structure.layers.core.push(relPath);
                    } else if (relPath.startsWith('scenes/')) {
                        structure.layers.scenes.push(relPath);
                    } else if (relPath.startsWith('modules/')) {
                        const moduleName = relPath.split('/')[1];
                        if (!structure.layers.modules[moduleName]) {
                            structure.layers.modules[moduleName] = [];
                        }
                        structure.layers.modules[moduleName].push(relPath);
                    } else if (relPath.startsWith('features/')) {
                        structure.layers.features.push(relPath);
                    } else if (relPath.startsWith('constants/')) {
                        structure.layers.constants.push(relPath);
                    } else if (relPath.startsWith('observability/')) {
                        structure.layers.observability.push(relPath);
                    }

                    // Recurse
                    scanDir(itemPath, layer);
                } else if (item.endsWith('.js') || item.endsWith('.mjs')) {
                    this.stats.totalFiles++;

                    const relPath = relative(srcPath, itemPath);
                    structure.modules.push({
                        path: relPath,
                        layer: this.determineLayer(relPath),
                        file: item,
                    });
                }
            }
        };

        scanDir(srcPath);
        this.stats.totalModules = structure.modules.length;

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
        return 'unknown';
    }

    async analyzeDependencies(structure) {
        const dependencies = {
            imports: [],
            exports: [],
            circular: [],
            violations: [],
        };

        // Simple import analysis (for more complex analysis, use madge or dependency-cruiser)
        for (const module of structure.modules) {
            const filePath = join(this.projectRoot, 'src', module.path);

            try {
                const content = readFileSync(filePath, 'utf-8');

                // Find imports
                const importRegex =
                    /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
                let match;

                while ((match = importRegex.exec(content)) !== null) {
                    const importPath = match[1];

                    dependencies.imports.push({
                        from: module.path,
                        to: importPath,
                        layer: module.layer,
                    });

                    // Check for potential violations
                    if (this.isViolation(module.layer, importPath)) {
                        dependencies.violations.push({
                            from: module.path,
                            to: importPath,
                            reason: `Layer ${module.layer} should not import from ${importPath}`,
                        });
                    }
                }

                // Count imports by layer
                if (!this.stats.importCounts[module.layer]) {
                    this.stats.importCounts[module.layer] = 0;
                }
                this.stats.importCounts[module.layer]++;
            } catch (error) {
                log.warn(`Failed to analyze ${module.path}:`, error.message);
            }
        }

        return dependencies;
    }

    isViolation(fromLayer, importPath) {
        // Simple violation detection
        // In production, use the full ESLint boundaries rules

        // Constants should import nothing
        if (fromLayer === 'constants' && !importPath.startsWith('.')) {
            return true;
        }

        // Observability should only import from itself
        if (
            fromLayer === 'observability' &&
            !importPath.includes('observability') &&
            !importPath.startsWith('.')
        ) {
            return true;
        }

        // Game systems shouldn't import vendors directly
        if (
            fromLayer === 'game-systems' &&
            (importPath.includes('phaser') ||
                importPath.includes('rapier') ||
                importPath.includes('howler'))
        ) {
            return true;
        }

        return false;
    }

    generateSnapshot(structure, dependencies) {
        const snapshot = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            stats: this.stats,
            structure: {
                layerCounts: {},
            },
            dependencies: {
                totalImports: dependencies.imports.length,
                violations: dependencies.violations.length,
                violationDetails: dependencies.violations.slice(0, 10), // First 10 violations
            },
            metrics: {
                filesPerModule: (this.stats.totalFiles / this.stats.totalModules).toFixed(2),
                avgImportsPerLayer: {},
            },
        };

        // Count modules per layer
        for (const [layer, paths] of Object.entries(structure.layers)) {
            if (Array.isArray(paths)) {
                snapshot.structure.layerCounts[layer] = paths.length;
            } else {
                // Handle modules sub-object
                snapshot.structure.layerCounts[layer] = Object.keys(paths).length;
            }
        }

        // Calculate average imports per layer
        for (const [layer, count] of Object.entries(this.stats.importCounts)) {
            const moduleCount = snapshot.structure.layerCounts[layer] || 1;
            snapshot.metrics.avgImportsPerLayer[layer] = (count / moduleCount).toFixed(2);
        }

        // Write snapshot
        const snapshotDir = join(this.projectRoot, 'architecture');
        if (!existsSync(snapshotDir)) {
            log.warn('Creating architecture directory...');
            require('fs').mkdirSync(snapshotDir, { recursive: true });
        }

        writeFileSync(this.snapshotPath, JSON.stringify(snapshot, null, 2));
        log.info(`Snapshot saved to ${relative(this.projectRoot, this.snapshotPath)}`);
    }

    generateReport() {
        console.log(`📁 Total Files: ${this.stats.totalFiles}`);
        console.log(`📦 Total Modules: ${this.stats.totalModules}`);
        console.log(
            `📊 Files per Module: ${(this.stats.totalFiles / this.stats.totalModules).toFixed(2)}`
        );

        console.log('\n📐 Layer Distribution:');
        for (const [layer, count] of Object.entries(this.stats.importCounts)) {
            console.log(`  ${layer}: ${count} imports`);
        }

        if (existsSync(this.snapshotPath)) {
            const snapshot = JSON.parse(readFileSync(this.snapshotPath, 'utf-8'));

            if (snapshot.dependencies.violations > 0) {
                console.log(
                    `\n⚠️  Found ${snapshot.dependencies.violations} potential violations:`
                );
                for (const violation of snapshot.dependencies.violationDetails) {
                    console.log(`  - ${violation.from} → ${violation.to}`);
                    console.log(`    Reason: ${violation.reason}`);
                }
            } else {
                console.log('\n✅ No architecture violations detected!');
            }
        }
    }
}

// Run if called directly
if (import.meta.main) {
    const validator = new ArchitectureValidator();
    validator.run().catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { ArchitectureValidator };
