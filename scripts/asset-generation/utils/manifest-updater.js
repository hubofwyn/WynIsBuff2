#!/usr/bin/env node
/**
 * Manifest Auto-Updater
 * Automatically updates assets/manifest.json after successful asset generation
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { LOG } from '../../../src/observability/index.js';

export class ManifestUpdater {
    constructor(manifestPath = null) {
        this.manifestPath = manifestPath || resolve(process.cwd(), 'assets/manifest.json');
        this.manifest = null;
    }

    /**
     * Load the manifest file
     * @returns {Object} Parsed manifest
     */
    loadManifest() {
        try {
            if (!existsSync(this.manifestPath)) {
                LOG.warn('MANIFEST_NOT_FOUND', {
                    subsystem: 'manifest-updater',
                    message: 'Manifest file not found, will create new one',
                    manifestPath: this.manifestPath,
                });

                // Create default manifest structure
                return {
                    version: '1.0.0',
                    description: 'Asset manifest for WynIsBuff2 game',
                    assets: {
                        images: {},
                        audio: {
                            music: {},
                            sfx: {},
                        },
                    },
                };
            }

            const content = readFileSync(this.manifestPath, 'utf-8');
            this.manifest = JSON.parse(content);

            LOG.dev('MANIFEST_LOADED', {
                subsystem: 'manifest-updater',
                message: 'Manifest loaded successfully',
                manifestPath: this.manifestPath,
            });

            return this.manifest;
        } catch (error) {
            LOG.error('MANIFEST_LOAD_ERROR', {
                subsystem: 'manifest-updater',
                error,
                message: 'Failed to load manifest',
                manifestPath: this.manifestPath,
                hint: 'Check JSON syntax and file permissions',
            });
            throw error;
        }
    }

    /**
     * Update manifest with generated asset
     * @param {Object} spec - Asset specification
     * @param {Object} result - Generation result
     * @returns {boolean} True if manifest was updated
     */
    updateManifest(spec, result) {
        try {
            LOG.info('MANIFEST_UPDATE_START', {
                subsystem: 'manifest-updater',
                message: 'Updating manifest with generated asset',
                specId: spec.id,
                assetType: spec.generation.type,
            });

            // Load current manifest
            const manifest = this.loadManifest();

            // Determine where to add the asset
            if (spec.generation.type === 'audio') {
                this.updateAudioAsset(manifest, spec, result);
            } else if (spec.generation.type === 'image') {
                this.updateImageAsset(manifest, spec, result);
            } else {
                throw new Error(`Unsupported asset type: ${spec.generation.type}`);
            }

            // Write updated manifest
            this.saveManifest(manifest);

            LOG.info('MANIFEST_UPDATED', {
                subsystem: 'manifest-updater',
                message: 'Manifest updated successfully',
                specId: spec.id,
                manifestKey: spec.integration?.manifest_key,
            });

            return true;
        } catch (error) {
            LOG.error('MANIFEST_UPDATE_ERROR', {
                subsystem: 'manifest-updater',
                error,
                message: 'Failed to update manifest',
                specId: spec.id,
                hint: 'Check manifest structure and permissions',
            });
            throw error;
        }
    }

    /**
     * Update audio asset in manifest
     * @param {Object} manifest - Manifest object
     * @param {Object} spec - Asset specification
     * @param {Object} result - Generation result
     */
    updateAudioAsset(manifest, spec, result) {
        // Ensure audio.sfx structure exists
        if (!manifest.assets.audio) {
            manifest.assets.audio = { music: {}, sfx: {} };
        }
        if (!manifest.assets.audio.sfx) {
            manifest.assets.audio.sfx = {};
        }

        // Determine category from spec metadata or default to 'generated'
        const category = spec.metadata?.category || 'generated';

        // Extract the manifest key from integration section
        const manifestKey = spec.integration?.manifest_key || spec.id;
        const outputPath = spec.integration?.output_path || result.asset?.output_path;
        const description =
            spec.integration?.description || spec.metadata?.description || spec.prompt?.base;

        // Create asset entry
        const assetEntry = {
            key: manifestKey,
            type: 'audio',
            path: outputPath,
            description: description,
            generated: {
                timestamp: new Date().toISOString(),
                specId: spec.id,
                provider: spec.generation.provider,
                cost: result.cost || result.estimatedCost || 0,
            },
        };

        // Add to appropriate category
        if (!manifest.assets.audio.sfx[category]) {
            manifest.assets.audio.sfx[category] = [];
        }

        // Check if asset already exists and update it, or add new
        if (Array.isArray(manifest.assets.audio.sfx[category])) {
            const existingIndex = manifest.assets.audio.sfx[category].findIndex(
                (asset) => asset.key === manifestKey
            );

            if (existingIndex >= 0) {
                LOG.dev('MANIFEST_ASSET_UPDATE', {
                    subsystem: 'manifest-updater',
                    message: 'Updating existing asset entry',
                    manifestKey,
                    category,
                });
                manifest.assets.audio.sfx[category][existingIndex] = assetEntry;
            } else {
                LOG.dev('MANIFEST_ASSET_ADD', {
                    subsystem: 'manifest-updater',
                    message: 'Adding new asset entry',
                    manifestKey,
                    category,
                });
                manifest.assets.audio.sfx[category].push(assetEntry);
            }
        } else {
            // Convert object to array format
            manifest.assets.audio.sfx[category] = [assetEntry];
        }

        LOG.info('AUDIO_ASSET_UPDATED', {
            subsystem: 'manifest-updater',
            message: 'Audio asset added to manifest',
            category,
            manifestKey,
            path: outputPath,
        });
    }

    /**
     * Update image asset in manifest
     * @param {Object} manifest - Manifest object
     * @param {Object} spec - Asset specification
     * @param {Object} result - Generation result
     */
    updateImageAsset(manifest, spec, result) {
        // Ensure images structure exists
        if (!manifest.assets.images) {
            manifest.assets.images = {};
        }

        // Extract manifest key
        const manifestKey = spec.integration?.manifest_key || spec.id;
        const outputPath = spec.integration?.output_path || result.asset?.output_path;
        const description =
            spec.integration?.description || spec.metadata?.description || spec.prompt?.base;

        // Create asset entry
        const assetEntry = {
            type: 'image',
            path: outputPath,
            description: description,
            generated: {
                timestamp: new Date().toISOString(),
                specId: spec.id,
                provider: spec.generation.provider,
                cost: result.cost || result.estimatedCost || 0,
            },
        };

        // Add sprite sheet information if available
        if (spec.integration?.spritesheet) {
            assetEntry.type = 'spritesheet';
            assetEntry.frameWidth = spec.integration.spritesheet.frameWidth;
            assetEntry.frameHeight = spec.integration.spritesheet.frameHeight;
        }

        manifest.assets.images[manifestKey] = assetEntry;

        LOG.info('IMAGE_ASSET_UPDATED', {
            subsystem: 'manifest-updater',
            message: 'Image asset added to manifest',
            manifestKey,
            path: outputPath,
        });
    }

    /**
     * Save manifest to file
     * @param {Object} manifest - Manifest object to save
     */
    saveManifest(manifest) {
        try {
            // Pretty print with 2-space indentation
            const content = JSON.stringify(manifest, null, 2);
            writeFileSync(this.manifestPath, content, 'utf-8');

            LOG.info('MANIFEST_SAVED', {
                subsystem: 'manifest-updater',
                message: 'Manifest saved to disk',
                manifestPath: this.manifestPath,
            });
        } catch (error) {
            LOG.error('MANIFEST_SAVE_ERROR', {
                subsystem: 'manifest-updater',
                error,
                message: 'Failed to save manifest',
                manifestPath: this.manifestPath,
                hint: 'Check file permissions and disk space',
            });
            throw error;
        }
    }

    /**
     * Validate manifest structure
     * @param {Object} manifest - Manifest to validate
     * @returns {Object} Validation result { valid: boolean, errors: array }
     */
    validateManifest(manifest) {
        const errors = [];

        if (!manifest.version) {
            errors.push('Missing version field');
        }

        if (!manifest.assets) {
            errors.push('Missing assets field');
        } else {
            if (!manifest.assets.images && !manifest.assets.audio) {
                errors.push('Manifest must have either images or audio section');
            }
        }

        const valid = errors.length === 0;

        if (!valid) {
            LOG.warn('MANIFEST_VALIDATION_FAILED', {
                subsystem: 'manifest-updater',
                message: 'Manifest validation failed',
                errors,
            });
        }

        return { valid, errors };
    }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🧪 Testing Manifest Updater\n');

    const updater = new ManifestUpdater();

    // Test loading
    try {
        const manifest = updater.loadManifest();
        console.log('✅ Manifest loaded successfully');
        console.log(`   Assets: ${Object.keys(manifest.assets).length} categories`);

        // Validate
        const validation = updater.validateManifest(manifest);
        if (validation.valid) {
            console.log('✅ Manifest structure valid');
        } else {
            console.log('❌ Manifest validation errors:');
            validation.errors.forEach((err) => console.log(`   - ${err}`));
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}
