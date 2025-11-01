#!/usr/bin/env node
/**
 * Asset Generation Orchestrator
 * Unified CLI for generating images and audio assets
 */

import { resolve } from 'path';
import { SpecLoader } from '../utils/spec-loader.js';
import { PythonAudioAdapter } from '../adapters/python-audio-adapter.js';
import { OpenAIImageAdapter } from '../adapters/openai-image-adapter.js';
import { ManifestUpdater } from '../utils/manifest-updater.js';
import { LOG } from '../../../src/observability/index.js';

class AssetOrchestrator {
    constructor(options = {}) {
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
        this.updateManifest = options.updateManifest !== false; // Default true

        // Initialize components
        this.specLoader = new SpecLoader();
        this.audioAdapter = new PythonAudioAdapter({ dryRun: this.dryRun });
        this.imageAdapter = new OpenAIImageAdapter({
            dryRun: this.dryRun,
            dailyLimit: options.dailyLimit || 20.0,
            monthlyLimit: options.monthlyLimit || 50.0,
        });
        this.manifestUpdater = new ManifestUpdater();

        // Stats
        this.stats = {
            attempted: 0,
            succeeded: 0,
            failed: 0,
            skipped: 0,
        };
    }

    /**
     * Generate asset from specification
     * @param {string} specPath - Path to YAML spec file
     * @returns {Promise<Object>} Generation result
     */
    async generate(specPath) {
        LOG.info('ORCHESTRATOR_START', {
            subsystem: 'asset-orchestrator',
            message: 'Asset Generation Orchestrator started',
        });

        const startTime = Date.now();

        try {
            // Load and validate spec
            LOG.info('SPEC_LOADING', {
                subsystem: 'asset-orchestrator',
                message: 'Loading specification',
                specPath,
            });

            const spec = this.specLoader.load(specPath);

            LOG.info('SPEC_LOADED', {
                subsystem: 'asset-orchestrator',
                message: 'Specification loaded successfully',
                spec: {
                    id: spec.id || spec.template,
                    type: spec.generation.type,
                    provider: spec.generation.provider,
                },
            });

            if (this.dryRun) {
                LOG.info('DRY_RUN_MODE', {
                    subsystem: 'asset-orchestrator',
                    message: 'DRY RUN MODE - No actual generation will occur',
                });
            }

            // Route to appropriate generator
            let result;
            this.stats.attempted++;

            if (spec.generation.type === 'audio') {
                result = await this.generateAudio(spec);
            } else if (spec.generation.type === 'image') {
                result = await this.generateImage(spec);
            } else {
                throw new Error(`Unsupported generation type: ${spec.generation.type}`);
            }

            if (result.success) {
                this.stats.succeeded++;
                LOG.info('GENERATION_SUCCESS', {
                    subsystem: 'asset-orchestrator',
                    message: 'Asset generation completed successfully',
                    specId: spec.id || spec.template,
                    duration: Date.now() - startTime,
                });

                // Update manifest if not in dry run and updateManifest is enabled
                if (!this.dryRun && !result.dryRun && this.updateManifest) {
                    try {
                        this.manifestUpdater.updateManifest(spec, result);
                        LOG.info('MANIFEST_AUTO_UPDATE', {
                            subsystem: 'asset-orchestrator',
                            message: 'Manifest automatically updated',
                            specId: spec.id || spec.template,
                        });
                    } catch (manifestError) {
                        LOG.warn('MANIFEST_UPDATE_FAILED', {
                            subsystem: 'asset-orchestrator',
                            error: manifestError,
                            message: 'Failed to update manifest, but asset generation succeeded',
                            specId: spec.id || spec.template,
                            hint: 'You may need to manually add asset to manifest.json',
                        });
                        // Don't fail the generation if manifest update fails
                        console.warn('⚠️  Warning: Failed to update manifest automatically');
                        console.warn(`   ${manifestError.message}`);
                    }
                }
            } else {
                this.stats.failed++;
                LOG.error('GENERATION_FAILED', {
                    subsystem: 'asset-orchestrator',
                    message: 'Asset generation failed',
                    specId: spec.id || spec.template,
                    error: result.error,
                });
            }

            // Print summary
            const duration = Date.now() - startTime;
            this.printSummary(duration, result);

            return result;
        } catch (error) {
            this.stats.failed++;
            LOG.error('GENERATION_ERROR', {
                subsystem: 'asset-orchestrator',
                error,
                message: error.message,
                specPath,
                hint: 'Check spec file format and generation system availability',
            });

            if (this.verbose) {
                LOG.dev('GENERATION_ERROR_STACK', {
                    subsystem: 'asset-orchestrator',
                    message: 'Verbose error stack trace',
                    stack: error.stack,
                });
            }

            const duration = Date.now() - startTime;
            this.printSummary(duration, { success: false, error: error.message });

            throw error;
        }
    }

    /**
     * Generate audio asset
     * @param {Object} spec - Asset specification
     * @returns {Promise<Object>} Generation result
     */
    async generateAudio(spec) {
        LOG.info('AUDIO_GENERATION_START', {
            subsystem: 'asset-orchestrator',
            message: 'Starting audio generation',
            specId: spec.id || spec.template,
        });

        // Check Python environment
        const available = await this.audioAdapter.checkAvailability();
        if (!available) {
            LOG.error('AUDIO_ENV_UNAVAILABLE', {
                subsystem: 'asset-orchestrator',
                message: 'Python audio generation environment not available',
                hint: 'Ensure Python 3 and audio-generation dependencies are installed',
            });
            throw new Error('Python audio generation environment not available');
        }

        // Generate using Python adapter
        const result = await this.audioAdapter.generate(spec, { dryRun: this.dryRun });

        return result;
    }

    /**
     * Generate image asset
     * @param {Object} spec - Asset specification
     * @returns {Promise<Object>} Generation result
     */
    async generateImage(spec) {
        LOG.info('IMAGE_GENERATION_START', {
            subsystem: 'asset-orchestrator',
            message: 'Starting image generation',
            specId: spec.id || spec.template,
        });

        // Check OpenAI environment
        const available = await this.imageAdapter.checkAvailability();
        if (!available && !this.dryRun) {
            LOG.error('IMAGE_ENV_UNAVAILABLE', {
                subsystem: 'asset-orchestrator',
                message: 'OpenAI image generation environment not available',
                hint: 'Ensure OPENAI_API_KEY is set in environment',
            });
            throw new Error('OpenAI image generation environment not available');
        }

        // Generate using OpenAI adapter
        const result = await this.imageAdapter.generate(spec, { dryRun: this.dryRun });

        return result;
    }

    /**
     * Print generation summary
     * @param {number} duration - Total duration in ms
     * @param {Object} result - Generation result
     */
    printSummary(duration, result) {
        // Log for observability
        LOG.info('GENERATION_SUMMARY', {
            subsystem: 'asset-orchestrator',
            message: 'Generation summary',
            duration,
            success: result.success,
            dryRun: result.dryRun || false,
            cost: result.cost || result.estimatedCost || 0,
            stats: { ...this.stats },
        });

        // User-facing output (keep console for CLI UX)
        console.log('\n📊 Summary');
        console.log('==========');
        console.log(`Duration: ${duration}ms`);
        console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);

        if (result.dryRun) {
            console.log('Mode: 🏜️  Dry Run');
        }

        if (result.cost) {
            console.log(`Cost: ${result.cost} credits`);
        }

        if (result.estimatedCost) {
            console.log(`Estimated Cost: ${result.estimatedCost} credits`);
        }

        console.log('\nStats:');
        console.log(`  Attempted: ${this.stats.attempted}`);
        console.log(`  Succeeded: ${this.stats.succeeded}`);
        console.log(`  Failed: ${this.stats.failed}`);
        console.log(`  Skipped: ${this.stats.skipped}`);
    }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        specPath: null,
        dryRun: false,
        verbose: false,
        help: false,
        updateManifest: true, // Default to updating manifest
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        } else if (arg === '--no-manifest-update') {
            options.updateManifest = false;
        } else if (!arg.startsWith('--')) {
            options.specPath = arg;
        }
    }

    return options;
}

/**
 * Print usage information
 */
function printHelp() {
    console.log(`
🎨 WynIsBuff2 Asset Generation Orchestrator

Usage:
  node orchestrator/index.js [options] <spec-file>

Arguments:
  spec-file              Path to YAML asset specification file

Options:
  --dry-run              Preview generation without executing
  --verbose, -v          Enable verbose logging
  --no-manifest-update   Skip automatic manifest.json update
  --help, -h             Show this help message

Examples:
  # Generate audio asset
  node orchestrator/index.js specs/audio/jump-sfx.yaml

  # Dry run (preview only)
  node orchestrator/index.js --dry-run specs/audio/jump-sfx.yaml

  # Verbose output
  node orchestrator/index.js --verbose specs/image/particle.yaml

  # Generate without updating manifest
  node orchestrator/index.js --no-manifest-update specs/audio/jump-sfx.yaml

Spec File Format:
  See architecture/asset-spec.schema.json for complete schema
  See architecture/examples/asset-specs/ for examples

For more information:
  See docs/architecture/AssetGenerationMigration2025.md
`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const options = parseArgs();

    if (options.help) {
        printHelp();
        process.exit(0);
    }

    if (!options.specPath) {
        LOG.error('CLI_NO_SPEC', {
            subsystem: 'asset-orchestrator',
            message: 'No spec file provided to CLI',
            hint: 'Provide a spec file path as argument',
        });
        console.error('❌ Error: No spec file provided\n');
        printHelp();
        process.exit(1);
    }

    const orchestrator = new AssetOrchestrator({
        dryRun: options.dryRun,
        verbose: options.verbose,
        updateManifest: options.updateManifest,
    });

    orchestrator
        .generate(options.specPath)
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            LOG.fatal('CLI_FATAL_ERROR', {
                subsystem: 'asset-orchestrator',
                error,
                message: 'Fatal error in CLI execution',
                specPath: options.specPath,
            });
            console.error('\n💥 Fatal error:', error.message);
            process.exit(1);
        });
}

export { AssetOrchestrator };
