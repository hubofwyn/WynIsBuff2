#!/usr/bin/env node
/**
 * Python Audio Generation Adapter
 * Adapts YAML specs to existing Python/ElevenLabs system
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { LOG } from '../../../src/observability/index.js';

export class PythonAudioAdapter {
    constructor(options = {}) {
        this.audioGenPath =
            options.audioGenPath || resolve(process.cwd(), 'scripts/audio-generation');
        this.pythonCmd = options.pythonCmd || 'python3';
        this.dryRun = options.dryRun || false;
    }

    /**
     * Convert YAML spec to Python assets.json format
     * @param {Object} spec - YAML specification
     * @returns {Object} Python-compatible asset definition
     */
    specToAssetDefinition(spec) {
        // Map YAML spec to Python assets.json format
        const asset = {
            id: spec.id,
            phase: spec.metadata?.phase || 1,
            priority: spec.metadata?.priority || 1,
            type: 'sfx', // Could be 'music' for longer audio
            category: spec.metadata?.category || 'player_movement',
            name: spec.metadata?.name || spec.id,
            description: spec.prompt.base.substring(0, 100),
            prompt: this.buildPrompt(spec),
            duration_seconds: spec.prompt.parameters?.duration_seconds || 0.5,
            prompt_influence: spec.prompt.parameters?.prompt_influence || 0.35,
            output_path: spec.integration?.output_path || `assets/audio/sfx/${spec.id}.ogg`,
            manifest_key: spec.integration?.manifest_key || spec.id,
            tags: spec.metadata?.tags || [],
        };

        return asset;
    }

    /**
     * Build complete prompt from spec
     * @param {Object} spec - YAML specification
     * @returns {string} Complete prompt string
     */
    buildPrompt(spec) {
        let prompt = spec.prompt.base;

        if (spec.prompt.style) {
            prompt += ' ' + spec.prompt.style;
        }

        if (spec.prompt.negative) {
            prompt += ' Avoid: ' + spec.prompt.negative;
        }

        return prompt;
    }

    /**
     * Generate audio asset using existing Python system
     * @param {Object} spec - YAML specification
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generation result
     */
    async generate(spec, options = {}) {
        const startTime = Date.now();

        try {
            LOG.info('AUDIO_ADAPTER_START', {
                subsystem: 'python-audio-adapter',
                message: 'Starting audio generation via Python adapter',
                specId: spec.id,
                provider: spec.generation.provider,
                type: spec.generation.type,
            });

            // Convert spec to Python format
            const assetDef = this.specToAssetDefinition(spec);

            // Create temporary assets.json file
            const tempAssetsFile = this.createTempAssetsJson([assetDef]);

            LOG.dev('AUDIO_ADAPTER_TEMP_FILE', {
                subsystem: 'python-audio-adapter',
                message: 'Created temporary assets file',
                tempFile: tempAssetsFile,
            });

            if (this.dryRun || options.dryRun) {
                LOG.info('AUDIO_ADAPTER_DRY_RUN', {
                    subsystem: 'python-audio-adapter',
                    message: 'Dry run mode - skipping actual generation',
                    command: `python generate_assets.py --asset ${assetDef.id}`,
                    assetDef,
                });

                console.log('   🏜️  DRY RUN - Would execute:');
                console.log(`   python generate_assets.py --asset ${assetDef.id}`);
                console.log(`   Asset definition:`, JSON.stringify(assetDef, null, 2));

                return {
                    success: true,
                    dryRun: true,
                    asset: assetDef,
                    estimatedCost: this.estimateCost(assetDef),
                    duration: Date.now() - startTime,
                };
            }

            // Call Python script
            const result = await this.callPythonGeneration(assetDef.id, tempAssetsFile);

            const duration = Date.now() - startTime;

            LOG.info('AUDIO_ADAPTER_SUCCESS', {
                subsystem: 'python-audio-adapter',
                message: 'Audio generation completed successfully',
                specId: spec.id,
                duration,
                cost: result.cost,
            });

            return {
                success: true,
                asset: assetDef,
                output: result.output,
                cost: result.cost,
                duration,
            };
        } catch (error) {
            LOG.error('AUDIO_ADAPTER_ERROR', {
                subsystem: 'python-audio-adapter',
                error,
                message: 'Audio generation failed',
                specId: spec.id,
                duration: Date.now() - startTime,
                hint: 'Check Python environment and ElevenLabs API credentials',
            });

            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Create temporary assets.json file for Python script
     * @param {Array} assets - Array of asset definitions
     * @returns {string} Path to temporary file
     */
    createTempAssetsJson(assets) {
        const tempDir = tmpdir();
        const tempFile = resolve(
            tempDir,
            `wynisbuff2-assets-${randomBytes(8).toString('hex')}.json`
        );

        const assetsJson = {
            project: 'WynIsBuff2',
            description: 'Temporary assets file generated by orchestrator',
            version: '2.0.0',
            budget: {
                daily_limit_usd: 20,
                monthly_limit_usd: 50,
                safety_margin_credits: 5000,
            },
            assets: assets,
        };

        writeFileSync(tempFile, JSON.stringify(assetsJson, null, 2), 'utf-8');

        return tempFile;
    }

    /**
     * Call Python generation script
     * @param {string} assetId - Asset ID to generate
     * @param {string} assetsFile - Path to assets.json file
     * @returns {Promise<Object>} Generation result
     */
    callPythonGeneration(assetId, assetsFile) {
        return new Promise((resolve, reject) => {
            const args = [
                resolve(this.audioGenPath, 'generate_assets.py'),
                '--asset',
                assetId,
                '--assets-file',
                assetsFile,
            ];

            LOG.info('PYTHON_CALL', {
                subsystem: 'python-audio-adapter',
                message: 'Calling Python generation script',
                command: `${this.pythonCmd} ${args.join(' ')}`,
                assetId,
            });

            console.log(`   📞 Calling: ${this.pythonCmd} ${args.join(' ')}`);

            const proc = spawn(this.pythonCmd, args, {
                cwd: this.audioGenPath,
                env: process.env,
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
                process.stdout.write(data);
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                process.stderr.write(data);
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    LOG.info('PYTHON_SUCCESS', {
                        subsystem: 'python-audio-adapter',
                        message: 'Python script completed successfully',
                        assetId,
                        cost: this.extractCostFromOutput(stdout),
                    });
                    resolve({
                        output: stdout,
                        cost: this.extractCostFromOutput(stdout),
                    });
                } else {
                    LOG.error('PYTHON_EXIT_ERROR', {
                        subsystem: 'python-audio-adapter',
                        message: 'Python script exited with error code',
                        assetId,
                        exitCode: code,
                        stderr,
                        hint: 'Check Python dependencies and ElevenLabs API credentials',
                    });
                    reject(new Error(`Python script exited with code ${code}\n${stderr}`));
                }
            });

            proc.on('error', (error) => {
                LOG.error('PYTHON_SPAWN_ERROR', {
                    subsystem: 'python-audio-adapter',
                    error,
                    message: 'Failed to spawn Python process',
                    pythonCmd: this.pythonCmd,
                    hint: 'Ensure Python 3 is installed and accessible in PATH',
                });
                reject(new Error(`Failed to spawn Python process: ${error.message}`));
            });
        });
    }

    /**
     * Extract cost from Python script output
     * @param {string} output - Script output
     * @returns {number} Cost in credits
     */
    extractCostFromOutput(output) {
        // Look for cost patterns in output
        // Example: "Cost: 110 credits"
        const match = output.match(/cost:\s*(\d+)\s*credits/i);
        if (match) {
            return parseInt(match[1]);
        }
        return 0;
    }

    /**
     * Estimate generation cost
     * @param {Object} assetDef - Asset definition
     * @returns {number} Estimated cost in credits
     */
    estimateCost(assetDef) {
        // ElevenLabs rough estimate: ~200 credits per second
        return Math.ceil(assetDef.duration_seconds * 200);
    }

    /**
     * Check if Python environment is available
     * @returns {Promise<boolean>} True if Python and dependencies are available
     */
    async checkAvailability() {
        try {
            LOG.dev('CHECKING_PYTHON_AVAILABILITY', {
                subsystem: 'python-audio-adapter',
                message: 'Checking Python environment availability',
            });

            // Check if Python is available
            const pythonCheck = await this.runCommand(this.pythonCmd, ['--version']);

            // Check if audio generation script exists
            const scriptPath = resolve(this.audioGenPath, 'generate_assets.py');
            if (!existsSync(scriptPath)) {
                LOG.warn('PYTHON_SCRIPT_MISSING', {
                    subsystem: 'python-audio-adapter',
                    message: 'Python generation script not found',
                    scriptPath,
                    hint: 'Ensure scripts/audio-generation/generate_assets.py exists',
                });
                return false;
            }

            // Check if venv exists (optional)
            const venvPath = resolve(this.audioGenPath, 'audio-generation-venv');
            // Don't require venv, just log if missing
            if (!existsSync(venvPath)) {
                LOG.warn('PYTHON_VENV_MISSING', {
                    subsystem: 'python-audio-adapter',
                    message: 'Virtual environment not found - using system Python',
                    venvPath,
                });
                console.warn('⚠️  Audio generation virtual environment not found');
            }

            LOG.info('PYTHON_AVAILABLE', {
                subsystem: 'python-audio-adapter',
                message: 'Python environment available',
                pythonVersion: pythonCheck.trim(),
            });

            return true;
        } catch (error) {
            LOG.error('PYTHON_CHECK_FAILED', {
                subsystem: 'python-audio-adapter',
                error,
                message: 'Python availability check failed',
                hint: 'Ensure Python 3 is installed',
            });
            return false;
        }
    }

    /**
     * Run a command and return output
     * @param {string} cmd - Command to run
     * @param {Array} args - Command arguments
     * @returns {Promise<string>} Command output
     */
    runCommand(cmd, args) {
        return new Promise((resolve, reject) => {
            const proc = spawn(cmd, args);
            let output = '';

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`Command failed with code ${code}`));
                }
            });

            proc.on('error', (error) => {
                reject(error);
            });
        });
    }
}

// CLI testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const adapter = new PythonAudioAdapter({ dryRun: true });

    console.log('🧪 Testing Python Audio Adapter\n');

    // Test spec
    const testSpec = {
        id: 'test-jump-sfx',
        metadata: {
            category: 'player_movement',
            name: 'Test Jump SFX',
        },
        generation: {
            type: 'audio',
            provider: 'elevenlabs',
        },
        prompt: {
            base: 'A short, punchy jump sound for a platform game',
            style: 'Clean, responsive, satisfying',
        },
        integration: {
            manifest_key: 'testJumpSfx',
        },
    };

    adapter
        .generate(testSpec, { dryRun: true })
        .then((result) => {
            console.log('\n✅ Test completed:');
            console.log(JSON.stringify(result, null, 2));
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
        });
}
