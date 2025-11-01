# Asset Generation Migration 2025 - Spec-Driven Hybrid Architecture

**Date**: 2025-11-01
**Branch**: `refactor/architectural-improvements`
**Status**: 🎯 Implementation Ready
**Approach**: Migrate DALL-E system + 2025 best practices + WynIsBuff2 architecture

---

## Executive Summary

**Goal**: Unify existing asset generation systems (DALL-E from `origin/get-more-buff` + ElevenLabs audio from `scripts/audio-generation/`) into a modern **spec-driven, multi-modal asset generation architecture** that integrates seamlessly with WynIsBuff2's observability, manifest system, and layered architecture.

**Current State Discovery**:
- ✅ **Image Generation**: Complete DALL-E system exists in `origin/get-more-buff` branch (needs migration)
- ✅ **Audio Generation**: Complete ElevenLabs system exists in `scripts/audio-generation/` (production-ready!)
- ❌ **Unified Architecture**: Systems are separate, need orchestration layer

**Philosophy**: Build a brilliant implementation that won't need rollbacks by incorporating 2025 best practices from the start.

**Key Innovations**:
- ✅ **Spec-as-Code**: YAML specifications for reproducible asset generation
- ✅ **Orchestration Layer**: Route requests to optimal generation engines
- ✅ **Multi-Modal**: Images (DALL-E) + Audio (ElevenLabs) with unified interface
- ✅ **Observability-First**: Structured logging with cost/quality tracking
- ✅ **Architectural Integration**: Fits into layered A-Spec architecture
- ✅ **Hybrid Runtime**: Node.js/Bun for images, Python for audio (pragmatic approach)

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Unified System Architecture](#2-unified-system-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Spec-Driven Pipeline](#4-spec-driven-pipeline)
5. [Orchestration Layer](#5-orchestration-layer)
6. [Generation Providers](#6-generation-providers)
7. [Processing & Validation](#7-processing--validation)
8. [Manifest Integration](#8-manifest-integration)
9. [Observability Integration](#9-observability-integration)
10. [Implementation Plan](#10-implementation-plan)
11. [Migration Steps](#11-migration-steps)

---

## 1. Current State Analysis

### 1.1 Existing Audio Generation System (Production-Ready!)

**Location**: `scripts/audio-generation/`

**Status**: ✅ Complete, documented, production-ready Python system

**Key Components**:
```
scripts/audio-generation/
├── README.md                    # Complete documentation
├── assets.json                  # 12 jump SFX fully specified
├── generate_assets.py           # Main orchestrator (Python)
├── budget_guard.py              # Credit tracking & safety
├── post_process.py              # MP3 → OGG conversion, normalization
├── requirements.txt             # Python dependencies
├── .env.example                 # ElevenLabs API key template
└── audio-generation-venv/       # Isolated Python environment
```

**Capabilities**:
- ✅ ElevenLabs API integration
- ✅ Budget control with safety margins (5,000 credit buffer)
- ✅ Phase-based generation (Phase 1 = 12 jump SFX)
- ✅ Post-processing pipeline (MP3 → OGG, peak/LUFS normalization)
- ✅ Cost tracking (generation_results_*.json timestamped logs)
- ✅ Manifest-driven (assets.json single source of truth)
- ✅ Comprehensive documentation (3 docs: README, AUDIO_DESIGN_SPECIFICATION, ELEVENLABS_IMPLEMENTATION_GUIDE)

**Integration with Game**:
```javascript
// Already working flow:
1. Run: python generate_assets.py --phase 1
2. Outputs: assets/audio/sfx/player/*.ogg
3. Update: assets/manifest.json (manual)
4. Run: npm run generate-assets
5. Use: AudioAssets.SFX_JUMP_1
```

**Why It Works**:
- Phase-based approach aligns with Bug #4 fix priority
- Python + FFmpeg ideal for audio processing
- Budget guard prevents cost overruns
- Already used to generate assets (potentially)

**What It Needs**:
- ❌ No automatic manifest.json integration
- ❌ No observability integration (LOG system)
- ❌ No unified orchestration with image generation
- ❌ No spec-driven YAML format (uses JSON assets.json)

### 1.2 Existing Image Generation System (Orphaned Branch)

**Location**: `origin/get-more-buff:asset-generation/`

**Status**: ⚠️ Complete but isolated, needs migration

**Key Components**:
```
asset-generation/
├── tools/wyn-gfx.mjs            # Main CLI (Bun/Node)
├── shots.json                   # 45+ asset specifications
├── style.md                     # Global art direction
├── package.json                 # Bun scripts
└── [various utilities]
```

**Capabilities**:
- ✅ DALL-E 3 integration
- ✅ Budget control ($20 soft cap)
- ✅ Multi-stage pipeline (512px thumbs → scoring → 1024px finals)
- ✅ Quality validation
- ✅ 45+ predefined shots (backdrops, sprites, particles)

**What It Needs**:
- ❌ Migration from orphaned branch
- ❌ Architectural alignment with A-Spec
- ❌ Integration with manifest.json workflow
- ❌ Observability integration
- ❌ Spec-driven YAML format

### 1.3 What's Missing: Unified Orchestration

**Current Problem**: Two separate, excellent systems with no coordination

**What We Need**:
```
┌──────────────────────────────────────────────────────────┐
│         Unified Asset Generation Interface               │
│         npm run asset:generate <spec>                    │
└────────────────────┬─────────────────────────────────────┘
                     ↓
         ┌───────────┴───────────┐
         ↓                       ↓
    ┌─────────┐           ┌──────────┐
    │ Image   │           │ Audio    │
    │ (Node)  │           │ (Python) │
    │ DALL-E  │           │ ElevenLbs│
    └─────────┘           └──────────┘
         │                       │
         └───────────┬───────────┘
                     ↓
            Unified manifest.json
            Unified observability
            Unified cost tracking
```

### 1.4 Integration Strategy

**Pragmatic Approach**: Keep what works, add orchestration layer

1. **Keep Existing Audio System**: Python/ElevenLabs is production-ready
2. **Migrate DALL-E Patterns**: Bring valuable patterns from get-more-buff
3. **Add Orchestration**: Unified CLI that calls both systems
4. **Spec-Driven**: Convert both to YAML spec format
5. **Unified Observability**: LOG system for both
6. **Automatic Integration**: Both update manifest.json automatically

---

## 2. Unified System Architecture

### 2.1 The Hybrid Modular Stack

```
┌─────────────────────────────────────────────────────────┐
│  Developer Interface (CLI + Scripts)                    │
│  npm run asset:generate <spec-file>                     │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Spec Layer (YAML/JSON)                                 │
│  - Asset specifications with versioning                 │
│  - Prompt templates and parameters                      │
│  - Provider preferences and fallbacks                   │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Orchestrator (Node.js/Bun)                             │
│  - Parse specs and route to providers                   │
│  - Budget tracking and cost control                     │
│  - Batch processing and retry logic                     │
│  - Observability logging (LOG system)                   │
└────────────────────┬────────────────────────────────────┘
                     ↓
      ┌──────────────┴──────────────┐
      ↓                              ↓
┌──────────────┐            ┌────────────────┐
│ Image        │            │ Audio          │
│ Providers    │            │ Providers      │
│              │            │                │
│ - DALL-E 3   │            │ - ElevenLabs   │
│ - SD 3.5     │            │ - Bark         │
│ - Firefly    │            │ - MusicGen     │
└──────┬───────┘            └────────┬───────┘
       │                             │
       └─────────┬───────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│  Processing Layer (Node.js + Canvas/Sharp)              │
│  - Post-processing and compositing                      │
│  - Format conversion (PNG/WebP)                         │
│  - Quality validation                                   │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Integration Layer                                      │
│  - Save to assets/ directory                            │
│  - Update manifest.json                                 │
│  - Trigger generate-assets.js                           │
│  - Create observability reports                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Architectural Principles

**1. Spec-Driven**: Every asset generation is defined by a versioned YAML spec
**2. Provider-Agnostic**: Orchestrator routes to best provider for each task
**3. Observable**: Every operation logged with cost, quality, and performance metrics
**4. Integrated**: Seamlessly fits into existing manifest.json workflow
**5. Extensible**: Easy to add new providers or asset types

---

## 2. Directory Structure

```
scripts/
├── asset-generation/
│   ├── orchestrator/
│   │   ├── index.js                 # Main CLI entry point
│   │   ├── router.js                # Route specs to providers
│   │   ├── budget-guard.js          # Cost tracking and limits
│   │   └── batch-processor.js       # Parallel generation
│   │
│   ├── providers/
│   │   ├── base-provider.js         # Abstract base class
│   │   ├── image/
│   │   │   ├── dalle-provider.js    # OpenAI DALL-E 3
│   │   │   ├── sd-provider.js       # Stable Diffusion
│   │   │   └── firefly-provider.js  # Adobe Firefly
│   │   └── audio/
│   │       ├── elevenlabs-provider.js
│   │       ├── bark-provider.js
│   │       └── musicgen-provider.js
│   │
│   ├── processors/
│   │   ├── image-processor.js       # Canvas/Sharp post-processing
│   │   ├── audio-processor.js       # Audio normalization
│   │   └── validator.js             # Quality validation
│   │
│   ├── integrators/
│   │   ├── manifest-updater.js      # Update manifest.json
│   │   └── constant-generator.js    # Trigger generate-assets.js
│   │
│   ├── specs/
│   │   ├── schema.json              # JSON schema for validation
│   │   ├── templates/
│   │   │   ├── image-templates.yaml
│   │   │   └── audio-templates.yaml
│   │   └── shots/
│   │       ├── backdrops.yaml       # Migrated from shots.json
│   │       ├── sprites.yaml
│   │       ├── particles.yaml
│   │       └── sfx.yaml
│   │
│   ├── utils/
│   │   ├── logger.js                # Observability integration
│   │   ├── cost-tracker.js          # SQLite cost database
│   │   └── cache-manager.js         # Avoid regeneration
│   │
│   └── package.json                 # Dependencies
│
├── generate-assets.js               # EXISTING: Constants generation
├── validate-assets.js               # EXISTING: Asset validation
└── validate-architecture-simple.js  # EXISTING: Architecture validation
```

---

## 3. Spec-Driven Pipeline

### 3.1 Asset Specification Format

**Example**: `scripts/asset-generation/specs/shots/particle-white.yaml`

```yaml
version: "1.0"
id: particle-white
metadata:
  created: 2025-11-01
  author: asset-generation
  category: particles
  tags: [effect, impact, visual-feedback]

generation:
  type: image
  provider: dalle-3
  fallback: stable-diffusion

prompt:
  base: >
    32x32 soft white gradient circle particle for game effects,
    centered, transparent background, high contrast edges,
    suitable for bloom effects
  style: |
    - Flat stylized 2D art
    - Clean gradient falloff
    - No photorealism
    - Crisp edges for scaling
  parameters:
    size: 1024x1024        # Generate high-res, downscale in post-processing
    quality: high
    n_variations: 4        # Generate 4 variants

post_processing:
  - action: resize
    dimensions: 32x32
    method: lanczos
  - action: validate
    checks:
      - has_alpha
      - dimensions_match
      - file_size_reasonable
  - action: convert
    formats: [png, webp]

integration:
  manifest_key: particleWhite
  manifest_path: images/particles/white.png
  manifest_type: image
  description: "White particle for visual effects"

observability:
  track_cost: true
  track_quality: true
  log_level: info
```

### 3.2 Migrating Existing Shots

**From** `origin/get-more-buff:asset-generation/shots.json`:
```json
{
  "key": "sprite_coin",
  "kind": "sprite",
  "prompt": "Glowing coin with buff arm emblem, neon rim light, high readability..."
}
```

**To** `scripts/asset-generation/specs/shots/coin.yaml`:
```yaml
version: "1.0"
id: sprite-coin
generation:
  type: image
  provider: dalle-3
prompt:
  base: "Glowing coin with buff arm emblem, neon rim light, high readability..."
  style: "bold outline, centered object, transparent background, flat stylized 2D sprite"
integration:
  manifest_key: coin
  manifest_path: images/collectibles/coin.png
```

### 3.3 Template-Based Generation

**Template**: `scripts/asset-generation/specs/templates/sfx-jump.yaml`

```yaml
version: "1.0"
template: jump-sfx
parameters:
  - name: jump_type
    type: enum
    values: [dust-cloud, energy-burst, mega-explosion]
  - name: variant
    type: string
    description: "Descriptive variation (e.g., 'light', 'heavy', 'crisp')"

generation:
  type: audio
  provider: elevenlabs
  fallback: bark

prompt:
  base: |
    Platformer game jump sound effect, {{jump_type}} style,
    {{variant}} variation, 0.3-0.5 seconds duration,
    suitable for player feedback

  templates:
    dust-cloud: "soft landing whoosh, dust cloud impact, light and airy"
    energy-burst: "electric energy burst, powerful whoosh, crisp attack"
    mega-explosion: "mega explosion boom, bass-heavy, dramatic cinematic impact"

post_processing:
  - action: normalize
    peak: -1.0 dB
  - action: trim_silence
    threshold: -40 dB
  - action: validate
    checks:
      - duration_range: [0.2, 0.6]
      - format: mp3
      - bitrate: 192k

integration:
  manifest_section: audio.sfx.jump
  naming_pattern: "sfxJump{{type_number}}{{variant_letter}}.mp3"
```

**Usage**:
```bash
# Generate jump SFX using template
npm run asset:generate -- \
  --template sfx-jump \
  --jump_type energy-burst \
  --variant crisp \
  --output-name sfxJump2A
```

---

## 4. Orchestration Layer

### 4.1 Main CLI: `scripts/asset-generation/orchestrator/index.js`

```javascript
#!/usr/bin/env node
/**
 * Asset Generation Orchestrator
 * Routes specs to appropriate providers with budget control and observability
 */

import { LOG } from '../../../src/observability/index.js';
import { Router } from './router.js';
import { BudgetGuard } from './budget-guard.js';
import { BatchProcessor } from './batch-processor.js';
import { SpecLoader } from './spec-loader.js';

export class AssetOrchestrator {
  constructor(options = {}) {
    this.budget = options.budget || 100; // Monthly budget in USD
    this.dryRun = options.dryRun || false;

    this.router = new Router();
    this.budgetGuard = new BudgetGuard(this.budget);
    this.batchProcessor = new BatchProcessor();
    this.specLoader = new SpecLoader();

    LOG.info('ASSET_ORCHESTRATOR_INIT', {
      subsystem: 'asset-generation',
      budget: this.budget,
      dryRun: this.dryRun
    });
  }

  async generate(specPath) {
    const startTime = performance.now();

    try {
      // Load and validate spec
      const spec = await this.specLoader.load(specPath);

      LOG.info('ASSET_GENERATION_START', {
        subsystem: 'asset-generation',
        spec_id: spec.id,
        type: spec.generation.type,
        provider: spec.generation.provider
      });

      // Check budget
      const estimatedCost = await this.budgetGuard.estimateCost(spec);
      if (!await this.budgetGuard.checkBudget(estimatedCost)) {
        throw new Error('Monthly budget exceeded');
      }

      // Route to provider
      const provider = await this.router.getProvider(spec);

      // Generate asset
      const result = await provider.generate(spec, {
        dryRun: this.dryRun
      });

      // Post-process
      if (spec.post_processing) {
        await this.processAsset(result, spec.post_processing);
      }

      // Integrate with manifest
      if (!this.dryRun && spec.integration) {
        await this.integrateAsset(result, spec.integration);
      }

      // Track costs
      await this.budgetGuard.recordCost(spec.id, result.cost);

      const duration = performance.now() - startTime;

      LOG.info('ASSET_GENERATION_SUCCESS', {
        subsystem: 'asset-generation',
        spec_id: spec.id,
        provider: result.provider,
        cost: result.cost,
        duration,
        output_path: result.path
      });

      return result;

    } catch (error) {
      LOG.error('ASSET_GENERATION_FAILED', {
        subsystem: 'asset-generation',
        error,
        message: 'Asset generation failed',
        hint: 'Check provider API keys and budget limits',
        duration: performance.now() - startTime
      });
      throw error;
    }
  }

  async processAsset(result, processing) {
    // Post-processing pipeline
    for (const step of processing) {
      LOG.dev('ASSET_PROCESSING_STEP', {
        subsystem: 'asset-generation',
        action: step.action,
        asset: result.path
      });

      // Apply processing step...
    }
  }

  async integrateAsset(result, integration) {
    // Update manifest.json
    // Trigger generate-assets.js
    // Create observability report
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  // Parse args and run orchestrator...
}
```

### 4.2 Provider Router: `scripts/asset-generation/orchestrator/router.js`

```javascript
/**
 * Provider Router
 * Routes generation requests to optimal provider based on spec and availability
 */

import { LOG } from '../../../src/observability/index.js';
import { DalleProvider } from '../providers/image/dalle-provider.js';
import { ElevenLabsProvider } from '../providers/audio/elevenlabs-provider.js';

export class Router {
  constructor() {
    this.providers = {
      image: {
        'dalle-3': new DalleProvider(),
        'stable-diffusion': null, // To be implemented
        'firefly': null
      },
      audio: {
        'elevenlabs': new ElevenLabsProvider(),
        'bark': null,
        'musicgen': null
      }
    };
  }

  async getProvider(spec) {
    const { type, provider, fallback } = spec.generation;

    // Try primary provider
    const primaryProvider = this.providers[type]?.[provider];
    if (primaryProvider && await primaryProvider.isAvailable()) {
      LOG.info('PROVIDER_SELECTED', {
        subsystem: 'asset-generation',
        type,
        provider,
        selection: 'primary'
      });
      return primaryProvider;
    }

    // Try fallback provider
    if (fallback) {
      const fallbackProvider = this.providers[type]?.[fallback];
      if (fallbackProvider && await fallbackProvider.isAvailable()) {
        LOG.warn('PROVIDER_FALLBACK', {
          subsystem: 'asset-generation',
          type,
          requested: provider,
          fallback,
          message: 'Primary provider unavailable, using fallback'
        });
        return fallbackProvider;
      }
    }

    throw new Error(`No available provider for ${type}:${provider}`);
  }
}
```

---

## 5. Generation Providers

### 5.1 Base Provider Interface

```javascript
/**
 * Base Provider Interface
 * All generation providers must implement this interface
 */

export class BaseProvider {
  constructor(config = {}) {
    this.config = config;
    this.type = null; // 'image' or 'audio'
    this.name = null; // 'dalle-3', 'elevenlabs', etc.
  }

  /**
   * Check if provider is available (API key valid, service up)
   */
  async isAvailable() {
    throw new Error('isAvailable() must be implemented');
  }

  /**
   * Estimate cost for generation
   */
  async estimateCost(spec) {
    throw new Error('estimateCost() must be implemented');
  }

  /**
   * Generate asset from spec
   */
  async generate(spec, options = {}) {
    throw new Error('generate() must be implemented');
  }

  /**
   * Validate generated output
   */
  async validate(result, spec) {
    throw new Error('validate() must be implemented');
  }
}
```

### 5.2 DALL-E Provider (Migrated from get-more-buff)

```javascript
/**
 * DALL-E 3 Provider
 * Migrated from origin/get-more-buff with 2025 enhancements
 */

import OpenAI from 'openai';
import { BaseProvider } from '../base-provider.js';
import { LOG } from '../../../../src/observability/index.js';

export class DalleProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.type = 'image';
    this.name = 'dalle-3';
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async isAvailable() {
    try {
      // Quick API key validation
      return !!process.env.OPENAI_API_KEY;
    } catch (error) {
      return false;
    }
  }

  async estimateCost(spec) {
    const { size, quality, n_variations } = spec.prompt.parameters;

    // DALL-E 3 pricing (as of 2025)
    const costPerImage = {
      '1024x1024': quality === 'hd' ? 0.08 : 0.04,
      '1024x1792': quality === 'hd' ? 0.12 : 0.08,
      '1792x1024': quality === 'hd' ? 0.12 : 0.08
    };

    const unitCost = costPerImage[size] || 0.04;
    return unitCost * n_variations;
  }

  async generate(spec, options = {}) {
    const startTime = performance.now();
    const { base, style, parameters } = spec.prompt;
    const fullPrompt = `${base}\n${style}`;

    LOG.info('DALLE_GENERATION_START', {
      subsystem: 'asset-generation',
      provider: 'dalle-3',
      spec_id: spec.id,
      prompt_length: fullPrompt.length,
      size: parameters.size,
      quality: parameters.quality
    });

    try {
      if (options.dryRun) {
        const cost = await this.estimateCost(spec);
        return {
          provider: 'dalle-3',
          dryRun: true,
          estimated_cost: cost
        };
      }

      // Generate image
      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt: fullPrompt,
        size: parameters.size,
        quality: parameters.quality || 'standard',
        n: 1 // DALL-E 3 only supports n=1, handle variations in loop
      });

      const duration = performance.now() - startTime;
      const cost = await this.estimateCost(spec);

      LOG.info('DALLE_GENERATION_SUCCESS', {
        subsystem: 'asset-generation',
        provider: 'dalle-3',
        spec_id: spec.id,
        duration,
        cost,
        revised_prompt: response.data[0].revised_prompt
      });

      return {
        provider: 'dalle-3',
        url: response.data[0].url,
        revised_prompt: response.data[0].revised_prompt,
        cost,
        duration
      };

    } catch (error) {
      LOG.error('DALLE_GENERATION_FAILED', {
        subsystem: 'asset-generation',
        provider: 'dalle-3',
        spec_id: spec.id,
        error,
        message: 'DALL-E generation failed',
        hint: 'Check API key and rate limits'
      });
      throw error;
    }
  }
}
```

### 5.3 ElevenLabs Provider (New)

```javascript
/**
 * ElevenLabs Audio Generation Provider
 * For high-quality game SFX and music
 */

import { BaseProvider } from '../base-provider.js';
import { LOG } from '../../../../src/observability/index.js';

export class ElevenLabsProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.type = 'audio';
    this.name = 'elevenlabs';
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  async isAvailable() {
    return !!this.apiKey;
  }

  async estimateCost(spec) {
    // ElevenLabs pricing: ~$0.05 per SFX
    return 0.05;
  }

  async generate(spec, options = {}) {
    const startTime = performance.now();
    const { base } = spec.prompt;

    LOG.info('ELEVENLABS_GENERATION_START', {
      subsystem: 'asset-generation',
      provider: 'elevenlabs',
      spec_id: spec.id,
      prompt_length: base.length
    });

    try {
      if (options.dryRun) {
        const cost = await this.estimateCost(spec);
        return {
          provider: 'elevenlabs',
          dryRun: true,
          estimated_cost: cost
        };
      }

      // Generate audio using ElevenLabs sound effects API
      const response = await fetch(`${this.baseUrl}/sound-generation`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: base,
          duration_seconds: 0.5,
          prompt_influence: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const duration = performance.now() - startTime;
      const cost = await this.estimateCost(spec);

      LOG.info('ELEVENLABS_GENERATION_SUCCESS', {
        subsystem: 'asset-generation',
        provider: 'elevenlabs',
        spec_id: spec.id,
        duration,
        cost,
        audio_size: audioBuffer.byteLength
      });

      return {
        provider: 'elevenlabs',
        buffer: audioBuffer,
        format: 'mp3',
        cost,
        duration
      };

    } catch (error) {
      LOG.error('ELEVENLABS_GENERATION_FAILED', {
        subsystem: 'asset-generation',
        provider: 'elevenlabs',
        spec_id: spec.id,
        error,
        message: 'ElevenLabs generation failed',
        hint: 'Check API key and credits'
      });
      throw error;
    }
  }
}
```

---

## 6. Processing & Validation

### 6.1 Image Processing

```javascript
/**
 * Image Processor
 * Post-processing pipeline for generated images
 */

import sharp from 'sharp';
import { LOG } from '../../../src/observability/index.js';

export class ImageProcessor {
  async process(buffer, steps) {
    let image = sharp(buffer);

    for (const step of steps) {
      LOG.dev('IMAGE_PROCESSING_STEP', {
        subsystem: 'asset-generation',
        action: step.action
      });

      switch (step.action) {
        case 'resize':
          image = image.resize(
            step.dimensions.split('x')[0],
            step.dimensions.split('x')[1],
            { kernel: step.method || 'lanczos3' }
          );
          break;

        case 'convert':
          // Generate multiple formats (PNG, WebP)
          const outputs = {};
          for (const format of step.formats) {
            outputs[format] = await image
              .clone()
              [format]({ quality: 90 })
              .toBuffer();
          }
          return outputs;

        case 'validate':
          await this.validate(image, step.checks);
          break;
      }
    }

    return { png: await image.png().toBuffer() };
  }

  async validate(image, checks) {
    const metadata = await image.metadata();

    for (const check of checks) {
      switch (check) {
        case 'has_alpha':
          if (!metadata.hasAlpha) {
            throw new Error('Image must have alpha channel');
          }
          break;

        case 'dimensions_match':
          // Validate dimensions...
          break;

        case 'file_size_reasonable':
          // Check file size...
          break;
      }
    }
  }
}
```

---

## 7. Manifest Integration

### 7.1 Manifest Updater

```javascript
/**
 * Manifest Updater
 * Integrates generated assets into manifest.json and triggers constant generation
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { LOG } from '../../../src/observability/index.js';

export class ManifestUpdater {
  constructor(manifestPath = 'assets/manifest.json') {
    this.manifestPath = manifestPath;
  }

  async update(result, integration) {
    const startTime = performance.now();

    try {
      // Load manifest
      const manifestData = await fs.readFile(this.manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestData);

      // Update manifest based on asset type
      if (integration.manifest_section === 'images') {
        manifest.assets.images[integration.manifest_key] = {
          type: integration.manifest_type || 'image',
          path: integration.manifest_path,
          description: integration.description,
          aiGenerated: true,
          aiProvider: result.provider,
          aiCost: result.cost,
          generatedDate: new Date().toISOString()
        };
      } else if (integration.manifest_section.startsWith('audio')) {
        // Handle audio manifest updates...
      }

      // Write updated manifest
      await fs.writeFile(
        this.manifestPath,
        JSON.stringify(manifest, null, 2),
        'utf-8'
      );

      // Trigger constant generation
      execSync('bun run generate-assets', { stdio: 'inherit' });

      const duration = performance.now() - startTime;

      LOG.info('MANIFEST_UPDATED', {
        subsystem: 'asset-generation',
        asset_key: integration.manifest_key,
        duration
      });

    } catch (error) {
      LOG.error('MANIFEST_UPDATE_FAILED', {
        subsystem: 'asset-generation',
        error,
        message: 'Failed to update manifest',
        hint: 'Check manifest.json syntax'
      });
      throw error;
    }
  }
}
```

---

## 8. Observability Integration

### 8.1 Cost Tracking Database

```javascript
/**
 * Cost Tracker
 * SQLite database for tracking generation costs and budget
 */

import Database from 'better-sqlite3';
import { LOG } from '../../../src/observability/index.js';

export class CostTracker {
  constructor(dbPath = 'scripts/asset-generation/.cost-tracking.db') {
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS generations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        spec_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        type TEXT NOT NULL,
        cost REAL NOT NULL,
        success INTEGER NOT NULL,
        duration REAL,
        month TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_month ON generations(month);
      CREATE INDEX IF NOT EXISTS idx_provider ON generations(provider);
    `);
  }

  recordGeneration(spec_id, provider, type, cost, success, duration) {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    this.db.prepare(`
      INSERT INTO generations (timestamp, spec_id, provider, type, cost, success, duration, month)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      new Date().toISOString(),
      spec_id,
      provider,
      type,
      cost,
      success ? 1 : 0,
      duration,
      month
    );

    LOG.info('COST_TRACKED', {
      subsystem: 'asset-generation',
      spec_id,
      provider,
      cost,
      month
    });
  }

  getMonthlySpend(month = new Date().toISOString().slice(0, 7)) {
    const result = this.db.prepare(`
      SELECT SUM(cost) as total FROM generations WHERE month = ? AND success = 1
    `).get(month);

    return result?.total || 0;
  }

  getProviderStats() {
    const results = this.db.prepare(`
      SELECT
        provider,
        COUNT(*) as count,
        SUM(cost) as total_cost,
        AVG(cost) as avg_cost,
        SUM(success) as success_count
      FROM generations
      GROUP BY provider
    `).all();

    return results;
  }
}
```

### 8.2 Observability Dashboard

Add to `window.debugAPI` for runtime inspection:

```javascript
// In src/observability/public-api/DebugAPI.js

getAssetGenerationHealth() {
  const snapshot = {
    timestamp: new Date().toISOString(),
    budget: {
      monthly_limit: 100,
      current_spend: this.costTracker.getMonthlySpend(),
      remaining: 100 - this.costTracker.getMonthlySpend()
    },
    providers: this.costTracker.getProviderStats(),
    recent_generations: this.getRecentGenerations(10),
    health_score: this.calculateGenerationHealth()
  };

  return snapshot;
}
```

---

## 10. Implementation Plan (Updated for Existing Systems)

### Phase 1: Unified Orchestration (Week 1)

**Goal**: Create orchestration layer that coordinates existing systems

**Tasks**:
1. Create orchestrator CLI (`scripts/asset-generation/orchestrator/`)
2. Implement spec loader and validator (YAML → internal format)
3. Build adapter for existing Python audio system
4. Create unified cost tracking (SQLite database)
5. Add observability integration (LOG system)
6. Implement manifest auto-updater

**Deliverable**: `npm run asset:generate <spec>` routes to Python or Node based on type

**Note**: Audio generation already works via Python, we're just adding orchestration!

### Phase 2: DALL-E Migration (Week 2)

**Goal**: Migrate DALL-E patterns from get-more-buff into new structure

**Tasks**:
1. Extract BudgetGuard patterns from get-more-buff
2. Implement DalleProvider class (Node.js)
3. Convert shots.json → YAML specs (45+ assets)
4. Migrate quality validation logic
5. Add image post-processing (Sharp)
6. Test full image generation pipeline

**Deliverable**: Generate first DALL-E image via unified orchestrator

### Phase 3: Integration & Testing (Week 3)

**Goal**: Ensure both systems work together seamlessly

**Tasks**:
1. Test audio generation via orchestrator
2. Test image generation via orchestrator
3. Verify manifest.json auto-update for both
4. Test cost tracking across both systems
5. Verify observability logs for both types
6. Create batch processing workflows

**Deliverable**: Generate mixed assets (images + audio) in single workflow

### Phase 4: Documentation & Polish (Week 4)

**Goal**: Complete documentation and production readiness

**Tasks**:
1. Update all documentation for unified system
2. Create migration guide from old workflows
3. Add debugAPI.getAssetGenerationHealth()
4. Create usage examples and guides
5. Update A-Spec with final architecture
6. Performance benchmarking
7. Write "Getting Started" guide

**Deliverable**: Production-ready unified asset generation system

---

## Simplified Timeline (Acknowledging Existing Work)

**Week 1**: Orchestration layer + observability
**Week 2**: DALL-E migration
**Week 3**: Integration testing
**Week 4**: Documentation

**Key Insight**: Audio generation is DONE. We're mainly adding:
1. Unified interface (orchestrator)
2. DALL-E migration from get-more-buff
3. Observability integration
4. Spec-driven format for both

---

## 11. Migration Steps

### Step 1: Prepare Branch

```bash
# Already on refactor/architectural-improvements
git status  # Ensure clean state
```

### Step 2: Create Directory Structure

```bash
mkdir -p scripts/asset-generation/{orchestrator,providers/{image,audio},processors,integrators,specs/{templates,shots},utils}
```

### Step 3: Migrate Patterns from get-more-buff

```bash
# Extract valuable patterns (don't copy directly)
git show origin/get-more-buff:asset-generation/tools/wyn-gfx.mjs > /tmp/wyn-gfx-reference.mjs

# Review and extract:
# - BudgetGuard logic
# - OpenAI client setup
# - Quality validation checks
# - Shot specification format
```

### Step 4: Implement Core Components

```bash
# Create package.json
cat > scripts/asset-generation/package.json << 'EOF'
{
  "name": "wynisbuff2-asset-generation",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "generate": "node orchestrator/index.js",
    "dry-run": "node orchestrator/index.js --dry-run",
    "batch": "node orchestrator/batch-processor.js"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "openai": "^4.70.0",
    "sharp": "^0.33.0",
    "better-sqlite3": "^11.0.0",
    "yaml": "^2.6.0"
  }
}
EOF

# Install dependencies
cd scripts/asset-generation && bun install && cd ../..
```

### Step 5: Create Spec Schema

```bash
# Create JSON schema for spec validation
# scripts/asset-generation/specs/schema.json
```

### Step 6: Implement Providers

```bash
# Start with DALL-E provider
# scripts/asset-generation/providers/image/dalle-provider.js
```

### Step 7: Update A-Spec

```javascript
// architecture/a-spec.json - Already updated in v2.0.0!
{
  "layers": {
    "asset-generation": {
      "pattern": "scripts/asset-generation/**",
      "canImport": ["external-services", "observability", "constants"],
      "vendors": ["dotenv", "sharp"],
      "description": "AI-powered asset generation pipeline"
    }
  }
}
```

### Step 8: Integrate Observability

```javascript
// Ensure all generation operations use LOG system
import { LOG } from '../../../src/observability/index.js';

// Add debugAPI methods for monitoring
window.debugAPI.getAssetGenerationHealth();
```

---

## Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Migration Complete** | 100% | All get-more-buff patterns migrated |
| **Spec Coverage** | 45+ assets | All shots.json → YAML specs |
| **Audio Support** | ElevenLabs + Bark | Both providers implemented |
| **Cost Tracking** | Real-time | SQLite database logging all API calls |
| **Observability** | Full integration | All operations logged with LOG |
| **Manifest Integration** | Automatic | Generated assets → manifest.json → constants |
| **Documentation** | Complete | Usage guides, API docs, examples |
| **Architecture Compliance** | 100% | Passes validate-architecture-simple.js |

---

## Next Steps

1. **Review this plan** - Ensure it aligns with project goals
2. **Set budget** - Confirm monthly spend limits ($100 suggested)
3. **Get API keys** - OpenAI (required), ElevenLabs (recommended)
4. **Begin Phase 1** - Core infrastructure implementation
5. **Test incrementally** - Each phase produces working deliverable

---

**Document Status**: ✅ Ready for Implementation
**Estimated Timeline**: 4 weeks
**Risk Level**: Low (well-defined patterns, clear integration points)
**Maintainer**: Claude Code AI Assistant
**Last Updated**: 2025-11-01
