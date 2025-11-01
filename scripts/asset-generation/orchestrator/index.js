#!/usr/bin/env node
/**
 * Asset Generation Orchestrator
 * Unified CLI for generating images and audio assets
 */

import { resolve } from 'path';
import { SpecLoader } from '../utils/spec-loader.js';
import { PythonAudioAdapter } from '../adapters/python-audio-adapter.js';

class AssetOrchestrator {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;

    // Initialize components
    this.specLoader = new SpecLoader();
    this.audioAdapter = new PythonAudioAdapter({ dryRun: this.dryRun });

    // Stats
    this.stats = {
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0
    };
  }

  /**
   * Generate asset from specification
   * @param {string} specPath - Path to YAML spec file
   * @returns {Promise<Object>} Generation result
   */
  async generate(specPath) {
    console.log('\n🎨 Asset Generation Orchestrator');
    console.log('================================\n');

    const startTime = Date.now();

    try {
      // Load and validate spec
      console.log('📋 Loading specification...');
      const spec = this.specLoader.load(specPath);
      console.log(`   ✅ Loaded: ${spec.id || spec.template}`);
      console.log(`   Type: ${spec.generation.type}`);
      console.log(`   Provider: ${spec.generation.provider}`);

      if (this.dryRun) {
        console.log('\n🏜️  DRY RUN MODE - No actual generation will occur\n');
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
        console.log('\n✅ Asset generation completed successfully');
      } else {
        this.stats.failed++;
        console.log('\n❌ Asset generation failed');
      }

      // Print summary
      const duration = Date.now() - startTime;
      this.printSummary(duration, result);

      return result;

    } catch (error) {
      this.stats.failed++;
      console.error('\n❌ Error:', error.message);

      if (this.verbose) {
        console.error(error.stack);
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
    console.log('\n🎵 Audio Generation');
    console.log('─────────────────');

    // Check Python environment
    const available = await this.audioAdapter.checkAvailability();
    if (!available) {
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
    console.log('\n🖼️  Image Generation');
    console.log('─────────────────');

    // TODO: Implement DALL-E generation
    console.log('⚠️  Image generation not yet implemented');
    console.log('   This will be added in Phase 2');

    if (this.dryRun) {
      return {
        success: true,
        dryRun: true,
        message: 'Image generation placeholder'
      };
    }

    throw new Error('Image generation not yet implemented');
  }

  /**
   * Print generation summary
   * @param {number} duration - Total duration in ms
   * @param {Object} result - Generation result
   */
  printSummary(duration, result) {
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
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
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
  --dry-run             Preview generation without executing
  --verbose, -v         Enable verbose logging
  --help, -h            Show this help message

Examples:
  # Generate audio asset
  node orchestrator/index.js specs/audio/jump-sfx.yaml

  # Dry run (preview only)
  node orchestrator/index.js --dry-run specs/audio/jump-sfx.yaml

  # Verbose output
  node orchestrator/index.js --verbose specs/image/particle.yaml

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
    console.error('❌ Error: No spec file provided\n');
    printHelp();
    process.exit(1);
  }

  const orchestrator = new AssetOrchestrator({
    dryRun: options.dryRun,
    verbose: options.verbose
  });

  orchestrator.generate(options.specPath)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error.message);
      process.exit(1);
    });
}

export { AssetOrchestrator };
