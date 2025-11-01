#!/usr/bin/env node

/**
 * Validate asset integrity between manifest.json and file system
 *
 * This script ensures:
 * 1. All assets in manifest.json exist on disk
 * 2. Assets.js is up-to-date with manifest.json
 * 3. No orphaned asset files (files not in manifest)
 *
 * Usage: node scripts/validate-assets.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, '../assets/manifest.json');
const ASSETS_PATH = path.join(__dirname, '../assets');
const GENERATED_PATH = path.join(__dirname, '../src/constants/Assets.js');

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function validateAssets() {
    console.log(`${colors.blue}🔍 Validating asset system integrity...${colors.reset}\n`);

    let hasErrors = false;
    let hasWarnings = false;

    try {
        // Read the manifest
        const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
        const manifest = JSON.parse(manifestData);

        // Track all referenced asset paths
        const referencedPaths = new Set();
        const errors = [];
        const warnings = [];

        // Check images (supports simple path and multiResolution variants)
        console.log(`${colors.blue}Checking image assets...${colors.reset}`);
        Object.entries(manifest.assets.images).forEach(([key, asset]) => {
            // Simple image-like entries with a direct path
            if (typeof asset.path === 'string') {
                const assetPath = path.join(ASSETS_PATH, asset.path);
                referencedPaths.add(asset.path);

                if (!fs.existsSync(assetPath)) {
                    errors.push(`❌ Missing image: ${key} - ${asset.path}`);
                    hasErrors = true;
                }
            } else if (
                asset.type === 'multiResolution' &&
                asset.variants &&
                typeof asset.variants === 'object'
            ) {
                // Multi-resolution entries: validate all listed variants (png/webp)
                Object.entries(asset.variants).forEach(([variantKey, variantVal]) => {
                    if (variantVal && typeof variantVal === 'object') {
                        ['png', 'webp'].forEach((fmt) => {
                            const p = variantVal[fmt];
                            if (typeof p === 'string') {
                                const full = path.join(ASSETS_PATH, p);
                                referencedPaths.add(p);
                                if (!fs.existsSync(full)) {
                                    errors.push(
                                        `❌ Missing image variant: ${key}[${variantKey}].${fmt} - ${p}`
                                    );
                                    hasErrors = true;
                                }
                            }
                        });
                    }
                });
            } else {
                // Unknown shape; warn but don't fail validation
                warnings.push(
                    `⚠️  Unrecognized image asset shape for '${key}', skipping direct path check`
                );
                hasWarnings = true;
            }

            // Check for placeholder assets
            if (asset.description && asset.description.includes('TODO')) {
                warnings.push(`⚠️  Placeholder asset: ${key} - ${asset.description}`);
                hasWarnings = true;
            }
        });

        // Check audio - music
        console.log(`${colors.blue}Checking music assets...${colors.reset}`);
        Object.entries(manifest.assets.audio.music).forEach(([key, asset]) => {
            const assetPath = path.join(ASSETS_PATH, asset.path);
            referencedPaths.add(asset.path);

            if (!fs.existsSync(assetPath)) {
                errors.push(`❌ Missing music: ${key} - ${asset.path}`);
                hasErrors = true;
            }
        });

        // Check audio - SFX
        console.log(`${colors.blue}Checking sound effect assets...${colors.reset}`);
        const sfx = manifest.assets.audio.sfx;

        // Check standard SFX categories
        ['land', 'pickup'].forEach((category) => {
            if (sfx[category]) {
                sfx[category].forEach((sound) => {
                    const assetPath = path.join(ASSETS_PATH, sound.path);
                    referencedPaths.add(sound.path);

                    if (!fs.existsSync(assetPath)) {
                        errors.push(`❌ Missing SFX: ${sound.key} - ${sound.path}`);
                        hasErrors = true;
                    }
                });
            }
        });

        // Check UI SFX
        if (sfx.ui) {
            ['click', 'hover'].forEach((category) => {
                if (sfx.ui[category]) {
                    sfx.ui[category].forEach((sound) => {
                        const assetPath = path.join(ASSETS_PATH, sound.path);
                        referencedPaths.add(sound.path);

                        if (!fs.existsSync(assetPath)) {
                            errors.push(`❌ Missing UI SFX: ${sound.key} - ${sound.path}`);
                            hasErrors = true;
                        }
                    });
                }
            });
        }

        // Check special SFX
        if (sfx.special) {
            sfx.special.forEach((sound) => {
                const assetPath = path.join(ASSETS_PATH, sound.path);
                referencedPaths.add(sound.path);

                if (!fs.existsSync(assetPath)) {
                    errors.push(`❌ Missing Special SFX: ${sound.key} - ${sound.path}`);
                    hasErrors = true;
                }
            });
        }

        // Check if Assets.js is up to date
        console.log(`${colors.blue}Checking generated constants...${colors.reset}`);
        const generatedContent = fs.readFileSync(GENERATED_PATH, 'utf8');
        const firstLine = generatedContent.split('\n')[0];

        if (!firstLine.includes('AUTO-GENERATED FILE')) {
            warnings.push('⚠️  Assets.js may have been manually edited');
            hasWarnings = true;
        }

        // Find orphaned assets (files not in manifest)
        console.log(`${colors.blue}Checking for orphaned assets...${colors.reset}`);
        const assetDirs = ['images', 'sounds', 'spritesheets', 'audio'];

        const orphanedFiles = [];

        function findOrphans(dir, basePath = '') {
            const fullPath = path.join(ASSETS_PATH, basePath, dir);

            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
                const files = fs.readdirSync(fullPath);

                files.forEach((file) => {
                    const filePath = path.join(basePath, dir, file);
                    const fullFilePath = path.join(ASSETS_PATH, filePath);

                    if (fs.statSync(fullFilePath).isDirectory()) {
                        // Recursively check subdirectories
                        findOrphans(file, path.join(basePath, dir));
                    } else if (!file.endsWith('.aseprite') && !file.endsWith('.zsh')) {
                        // Check if this file is referenced in manifest
                        if (!referencedPaths.has(filePath)) {
                            orphanedFiles.push(filePath);
                        }
                    }
                });
            }
        }

        assetDirs.forEach((dir) => findOrphans(dir));

        if (orphanedFiles.length > 0) {
            console.log(
                `\n${colors.yellow}Found ${orphanedFiles.length} orphaned asset files not in manifest:${colors.reset}`
            );
            orphanedFiles.slice(0, 10).forEach((file) => {
                console.log(`  📁 ${file}`);
            });
            if (orphanedFiles.length > 10) {
                console.log(`  ... and ${orphanedFiles.length - 10} more`);
            }
            hasWarnings = true;
        }

        // Print results
        console.log('\n' + '='.repeat(60));

        if (errors.length > 0) {
            console.log(`\n${colors.red}ERRORS:${colors.reset}`);
            errors.forEach((error) => console.log(error));
        }

        if (warnings.length > 0) {
            console.log(`\n${colors.yellow}WARNINGS:${colors.reset}`);
            warnings.forEach((warning) => console.log(warning));
        }

        console.log('\n' + '='.repeat(60));

        if (hasErrors) {
            console.log(`\n${colors.red}❌ Asset validation failed with errors${colors.reset}`);
            console.log('Fix the errors above and run "bun run generate-assets" to rebuild');
            process.exit(1);
        } else if (hasWarnings) {
            console.log(
                `\n${colors.yellow}⚠️  Asset validation completed with warnings${colors.reset}`
            );
            console.log('Consider addressing the warnings above');
        } else {
            console.log(`\n${colors.green}✅ Asset system is valid and complete!${colors.reset}`);
        }

        // Summary stats
        console.log(`\n${colors.blue}📊 Asset Statistics:${colors.reset}`);
        console.log(`  Images: ${Object.keys(manifest.assets.images).length}`);
        console.log(`  Music: ${Object.keys(manifest.assets.audio.music).length}`);

        let sfxCount = 0;
        if (sfx.land) sfxCount += sfx.land.length;
        if (sfx.pickup) sfxCount += sfx.pickup.length;
        if (sfx.ui?.click) sfxCount += sfx.ui.click.length;
        if (sfx.ui?.hover) sfxCount += sfx.ui.hover.length;
        if (sfx.special) sfxCount += sfx.special.length;

        console.log(`  Sound Effects: ${sfxCount}`);
        console.log(
            `  Total Assets: ${Object.keys(manifest.assets.images).length + Object.keys(manifest.assets.audio.music).length + sfxCount}`
        );

        if (orphanedFiles.length > 0) {
            console.log(`  Orphaned Files: ${orphanedFiles.length} (not in manifest)`);
        }
    } catch (error) {
        console.error(`${colors.red}❌ Error validating assets:${colors.reset}`, error.message);
        process.exit(1);
    }
}

// Run the validator
validateAssets();
