#!/usr/bin/env node
/**
 * OpenAI DALL-E Image Generation Adapter
 * Adapts YAML specs to OpenAI DALL-E 3 API
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { LOG } from '../../../src/observability/index.js';

// DALL-E 3 pricing (as of 2024-2025, verify current rates)
const PRICING = {
    'standard-1024': 0.04, // $0.040 per image (1024x1024 standard)
    'standard-1792': 0.08, // $0.080 per image (1024x1792 or 1792x1024 standard)
    'hd-1024': 0.08, // $0.080 per image (1024x1024 HD)
    'hd-1792': 0.12, // $0.120 per image (1024x1792 or 1792x1024 HD)
};

export class BudgetGuard {
    constructor(options = {}) {
        this.dailyLimit = options.dailyLimit || 20.0; // USD
        this.monthlyLimit = options.monthlyLimit || 50.0; // USD
        this.safetyMargin = options.safetyMargin || 5.0; // USD
        this.spent = 0;
    }

    /**
     * Estimate cost for operation
     * @param {string} size - Image size (1024x1024, 1024x1792, etc.)
     * @param {string} quality - Quality level (standard, hd)
     * @param {number} n - Number of images
     * @returns {number} Estimated cost in USD
     */
    estimateCost(size, quality, n = 1) {
        const key = `${quality}-${size.split('x')[0]}`;
        const pricePerImage = PRICING[key] || PRICING['standard-1024'];
        return pricePerImage * n;
    }

    /**
     * Check if cost would exceed budget
     * @param {number} cost - Cost in USD
     * @returns {boolean} True if within budget
     */
    canAfford(cost) {
        return this.spent + cost + this.safetyMargin <= this.dailyLimit;
    }

    /**
     * Record spending
     * @param {number} cost - Cost in USD
     * @param {string} reason - Reason for spending
     */
    charge(cost, reason) {
        this.spent += cost;

        LOG.info('BUDGET_CHARGE', {
            subsystem: 'openai-image-adapter',
            message: 'Budget charge recorded',
            cost,
            reason,
            totalSpent: this.spent,
            dailyLimit: this.dailyLimit,
            remaining: this.dailyLimit - this.spent,
        });

        if (this.spent > this.dailyLimit) {
            LOG.error('BUDGET_EXCEEDED', {
                subsystem: 'openai-image-adapter',
                message: 'Daily budget limit exceeded',
                spent: this.spent,
                limit: this.dailyLimit,
                hint: 'Increase dailyLimit or wait until next day',
            });
            throw new Error(
                `Budget exceeded: $${this.spent.toFixed(2)} > $${this.dailyLimit.toFixed(2)}`
            );
        }

        if (!this.canAfford(0)) {
            LOG.warn('BUDGET_WARNING', {
                subsystem: 'openai-image-adapter',
                message: 'Approaching budget limit (within safety margin)',
                spent: this.spent,
                limit: this.dailyLimit,
                safetyMargin: this.safetyMargin,
            });
        }
    }

    /**
     * Get budget summary
     * @returns {Object} Budget status
     */
    getSummary() {
        return {
            spent: this.spent,
            dailyLimit: this.dailyLimit,
            monthlyLimit: this.monthlyLimit,
            remaining: this.dailyLimit - this.spent,
            safetyMargin: this.safetyMargin,
            withinBudget: this.spent <= this.dailyLimit,
        };
    }
}

export class OpenAIImageAdapter {
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
        this.dryRun = options.dryRun || false;
        this.budget = new BudgetGuard({
            dailyLimit: options.dailyLimit || 20.0,
            monthlyLimit: options.monthlyLimit || 50.0,
            safetyMargin: options.safetyMargin || 5.0,
        });

        if (!this.apiKey && !this.dryRun) {
            LOG.warn('OPENAI_API_KEY_MISSING', {
                subsystem: 'openai-image-adapter',
                message: 'OPENAI_API_KEY not set in environment',
                hint: 'Set OPENAI_API_KEY in .env or pass as option',
            });
        }
    }

    /**
     * Convert YAML spec to OpenAI image generation parameters
     * @param {Object} spec - YAML specification
     * @returns {Object} OpenAI API parameters
     */
    specToGenerationParams(spec) {
        const prompt = this.buildPrompt(spec);
        const size = spec.prompt.parameters?.size || '1024x1024';
        const quality = spec.prompt.parameters?.quality || 'standard';
        const style = spec.prompt.parameters?.style || 'vivid'; // vivid or natural
        const n = spec.prompt.parameters?.n || 1;

        // Validate size
        const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
        if (!validSizes.includes(size)) {
            LOG.warn('INVALID_SIZE', {
                subsystem: 'openai-image-adapter',
                message: 'Invalid size, using 1024x1024',
                requestedSize: size,
                validSizes,
            });
        }

        return {
            model: 'dall-e-3',
            prompt,
            size: validSizes.includes(size) ? size : '1024x1024',
            quality,
            style,
            n: Math.min(n, 1), // DALL-E 3 only supports n=1
            response_format: 'b64_json', // Get base64 to avoid download issues
        };
    }

    /**
     * Build complete prompt from spec
     * @param {Object} spec - YAML specification
     * @returns {string} Complete prompt string
     */
    buildPrompt(spec) {
        let prompt = spec.prompt.base;

        if (spec.prompt.style) {
            prompt += `\n\nStyle: ${spec.prompt.style}`;
        }

        if (spec.prompt.details) {
            prompt += `\n\nDetails: ${spec.prompt.details}`;
        }

        if (spec.prompt.negative) {
            prompt += `\n\nAvoid: ${spec.prompt.negative}`;
        }

        // Add game context if specified
        if (spec.metadata?.gameContext) {
            prompt += `\n\nGame Context: This is for a ${spec.metadata.gameContext} video game.`;
        }

        return prompt;
    }

    /**
     * Generate image asset using OpenAI DALL-E 3
     * @param {Object} spec - YAML specification
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generation result
     */
    async generate(spec, options = {}) {
        const startTime = Date.now();

        try {
            LOG.info('IMAGE_ADAPTER_START', {
                subsystem: 'openai-image-adapter',
                message: 'Starting image generation via OpenAI DALL-E 3',
                specId: spec.id,
                provider: spec.generation.provider,
            });

            // Convert spec to OpenAI parameters
            const params = this.specToGenerationParams(spec);

            // Estimate cost
            const estimatedCost = this.budget.estimateCost(params.size, params.quality, params.n);

            LOG.dev('IMAGE_GENERATION_PARAMS', {
                subsystem: 'openai-image-adapter',
                message: 'Image generation parameters prepared',
                params,
                estimatedCost,
            });

            if (this.dryRun || options.dryRun) {
                LOG.info('IMAGE_ADAPTER_DRY_RUN', {
                    subsystem: 'openai-image-adapter',
                    message: 'Dry run mode - skipping actual generation',
                    params,
                    estimatedCost,
                });

                console.log('   🏜️  DRY RUN - Would generate image with:');
                console.log(`   Model: ${params.model}`);
                console.log(`   Size: ${params.size}`);
                console.log(`   Quality: ${params.quality}`);
                console.log(`   Style: ${params.style}`);
                console.log(`   Prompt: ${params.prompt.substring(0, 100)}...`);

                return {
                    success: true,
                    dryRun: true,
                    params,
                    estimatedCost,
                    duration: Date.now() - startTime,
                };
            }

            // Check budget before proceeding
            if (!this.budget.canAfford(estimatedCost)) {
                throw new Error(
                    `Insufficient budget: Need $${estimatedCost.toFixed(2)}, ` +
                        `but only $${this.budget.getSummary().remaining.toFixed(2)} remaining ` +
                        `(with $${this.budget.safetyMargin.toFixed(2)} safety margin)`
                );
            }

            // Call OpenAI API
            const result = await this.callOpenAI(params, spec);

            // Charge budget
            this.budget.charge(estimatedCost, `Generated ${spec.id}`);

            const duration = Date.now() - startTime;

            LOG.info('IMAGE_ADAPTER_SUCCESS', {
                subsystem: 'openai-image-adapter',
                message: 'Image generation completed successfully',
                specId: spec.id,
                duration,
                cost: estimatedCost,
                outputPath: result.outputPath,
            });

            return {
                success: true,
                outputPath: result.outputPath,
                revisedPrompt: result.revisedPrompt,
                cost: estimatedCost,
                budgetSummary: this.budget.getSummary(),
                duration,
            };
        } catch (error) {
            LOG.error('IMAGE_ADAPTER_ERROR', {
                subsystem: 'openai-image-adapter',
                error,
                message: 'Image generation failed',
                specId: spec.id,
                duration: Date.now() - startTime,
                hint: 'Check OpenAI API key and quota limits',
            });

            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Call OpenAI DALL-E API
     * @param {Object} params - Generation parameters
     * @param {Object} spec - Original spec for context
     * @returns {Promise<Object>} API result with saved file path
     */
    async callOpenAI(params, spec) {
        LOG.info('OPENAI_API_CALL', {
            subsystem: 'openai-image-adapter',
            message: 'Calling OpenAI DALL-E API',
            model: params.model,
            size: params.size,
            quality: params.quality,
        });

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const errorText = await response.text();
            LOG.error('OPENAI_API_ERROR', {
                subsystem: 'openai-image-adapter',
                message: 'OpenAI API request failed',
                status: response.status,
                statusText: response.statusText,
                error: errorText,
                hint: 'Check API key validity and quota limits',
            });
            throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // Extract image data
        const imageData = data.data?.[0];
        if (!imageData?.b64_json) {
            throw new Error('No image data returned from OpenAI API');
        }

        // Save image to disk
        const outputPath = spec.integration?.output_path || this.getDefaultOutputPath(spec);
        const outputDir = dirname(resolve(outputPath));

        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
            LOG.dev('OUTPUT_DIR_CREATED', {
                subsystem: 'openai-image-adapter',
                message: 'Created output directory',
                directory: outputDir,
            });
        }

        const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
        writeFileSync(resolve(outputPath), imageBuffer);

        LOG.info('IMAGE_SAVED', {
            subsystem: 'openai-image-adapter',
            message: 'Image saved to disk',
            outputPath,
            size: `${(imageBuffer.length / 1024).toFixed(2)} KB`,
        });

        return {
            outputPath,
            revisedPrompt: imageData.revised_prompt || params.prompt,
        };
    }

    /**
     * Get default output path if not specified in spec
     * @param {Object} spec - Asset specification
     * @returns {string} Default output path
     */
    getDefaultOutputPath(spec) {
        const category = spec.metadata?.category || 'generated';
        const filename = `${spec.id}.png`;
        return `assets/images/${category}/${filename}`;
    }

    /**
     * Check if OpenAI API is available
     * @returns {Promise<boolean>} True if API is available
     */
    async checkAvailability() {
        try {
            LOG.dev('CHECKING_OPENAI_AVAILABILITY', {
                subsystem: 'openai-image-adapter',
                message: 'Checking OpenAI API availability',
            });

            if (!this.apiKey) {
                LOG.warn('OPENAI_API_KEY_NOT_SET', {
                    subsystem: 'openai-image-adapter',
                    message: 'OPENAI_API_KEY not set',
                    hint: 'Set OPENAI_API_KEY environment variable',
                });
                return false;
            }

            // Simple API check - list models endpoint (no cost)
            const response = await fetch('https://api.openai.com/v1/models?limit=1', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });

            if (!response.ok) {
                LOG.warn('OPENAI_API_CHECK_FAILED', {
                    subsystem: 'openai-image-adapter',
                    message: 'OpenAI API check failed',
                    status: response.status,
                    hint: 'Check API key validity',
                });
                return false;
            }

            const data = await response.json();
            const firstModel = data.data?.[0]?.id || 'unknown';

            LOG.info('OPENAI_AVAILABLE', {
                subsystem: 'openai-image-adapter',
                message: 'OpenAI API available',
                exampleModel: firstModel,
            });

            return true;
        } catch (error) {
            LOG.error('OPENAI_CHECK_ERROR', {
                subsystem: 'openai-image-adapter',
                error,
                message: 'Failed to check OpenAI availability',
                hint: 'Check network connectivity',
            });
            return false;
        }
    }
}

// CLI testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const adapter = new OpenAIImageAdapter({ dryRun: true });

    console.log('🧪 Testing OpenAI Image Adapter\n');

    // Test spec
    const testSpec = {
        id: 'test-backdrop-sky',
        metadata: {
            category: 'backgrounds',
            name: 'Test Sky Backdrop',
            gameContext: '2D platformer',
        },
        generation: {
            type: 'image',
            provider: 'dalle-3',
        },
        prompt: {
            base: 'A vibrant pixel art sky backdrop with fluffy clouds and gradient colors',
            style: 'Retro 16-bit pixel art style',
            parameters: {
                size: '1024x1024',
                quality: 'standard',
                style: 'vivid',
            },
        },
        integration: {
            manifest_key: 'backdropSky',
            output_path: 'assets/images/backgrounds/sky_backdrop.png',
        },
    };

    adapter
        .generate(testSpec, { dryRun: true })
        .then((result) => {
            console.log('\n✅ Test completed:');
            console.log(JSON.stringify(result, null, 2));
            console.log('\nBudget summary:', adapter.budget.getSummary());
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
        });
}
