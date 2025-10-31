# AI Asset Generation System - Migration & Integration Plan

**Date**: 2025-10-30
**Status**: 🚧 Planning Phase
**Branch Source**: `origin/get-more-buff` (asset-generation/ directory)
**Target**: `main` branch with full architectural integration
**Scope**: Multi-modal asset generation (Images, Audio, Music, SFX)

---

## Executive Summary

**DISCOVERY**: A complete OpenAI DALL-E image generation system exists in the `origin/get-more-buff` branch (`asset-generation/` directory) that was not in the main branch.

**CHALLENGE**: The system needs architectural integration and expansion:
- ✅ **Found**: Image generation (DALL-E, budget-controlled, 45+ predefined shots)
- ❌ **Missing**: Audio generation (SFX, music, ambiance)
- ❌ **Missing**: Integration with existing manifest.json workflow
- ❌ **Missing**: Documentation following project standards
- ❌ **Missing**: Architectural alignment with CLAUDE.md principles

**STRATEGIC DECISION**: Rather than direct cherry-pick, migrate the valuable patterns into a **comprehensive, multi-modal asset generation architecture** that becomes a major system component.

---

## Table of Contents

1. [What Was Found](#1-what-was-found)
2. [Gap Analysis](#2-gap-analysis)
3. [Architectural Vision](#3-architectural-vision)
4. [Migration Strategy](#4-migration-strategy)
5. [Phase 1: Foundation & Image Migration](#5-phase-1-foundation--image-migration)
6. [Phase 2: Audio Generation Integration](#6-phase-2-audio-generation-integration)
7. [Phase 3: Multi-Modal Orchestration](#7-phase-3-multi-modal-orchestration)
8. [Documentation & Standards](#8-documentation--standards)
9. [Risk Assessment](#9-risk-assessment)
10. [Success Criteria](#10-success-criteria)

---

## 1. What Was Found

### 1.1 Complete Image Generation System

**Location**: `origin/get-more-buff:asset-generation/`

**Core Components**:
```
asset-generation/
├── tools/
│   ├── wyn-gfx.mjs              # Main CLI (7 commands)
│   ├── validate-shots.mjs       # Shot validation
│   ├── audit-images.mjs         # Quality assurance
│   ├── integrate-winners.mjs    # Winner selection
│   ├── make-preview.mjs         # Preview generation
│   └── lock-manifest.mjs        # Manifest locking
├── shots.json                    # 45+ predefined asset specs
├── style.md                      # Global art direction
├── package.json                  # Bun-based scripts
├── .env.example                  # OPENAI_API_KEY template
└── masks/                        # Inpainting masks
```

**Capabilities**:
- ✅ **Image Generation**: DALL-E 3 via OpenAI API
- ✅ **Budget Control**: $20 soft cap with cost tracking
- ✅ **Multi-Stage Pipeline**: Thumbnails (512px) → Scoring → Finals (1024px)
- ✅ **Quality Validation**: Dimension checks, alpha channel validation, POT compliance
- ✅ **Inpainting/Editing**: Mask-based refinement using DALL-E edit API
- ✅ **Automated Ranking**: GPT-4o-mini scores thumbnails for quality
- ✅ **Dry-Run Mode**: Cost estimation without API calls

**Workflow**:
```bash
npm run gfx:init      # Initialize shots + style
npm run gfx:thumbs    # Generate 512px variations (cheap: gpt-image-1)
npm run gfx:score     # AI ranks thumbnails (GPT-4o-mini vision)
npm run gfx:final     # Generate 1024px winners (quality:high)
npm run gfx:all       # Full pipeline with budget guard
npm run gfx:audit     # Validate outputs
npm run gfx:edit      # Inpaint/edit with masks
```

**Asset Coverage** (45+ shots defined):
- **Backdrops** (16): 4 biomes × 4 parallax layers (sky/mid/fore/fg)
  - Protein Plant, Metronome Mines, Factory Floor, Sky Gym
- **Boss Sprites** (3): The Clumper, Pulsar, The Bulk
- **Hero Sprites** (3): Wyn idle, run, jump
- **Environment** (7): Platforms, pipes, crates, signs
- **Collectibles** (4): Coins, DNA, grit, boss emblems
- **Hazards** (4): Spikes, lasers, crushers, shock grids
- **Particles** (3): Flares, dust, sparks
- **UI Elements** (5): Icons, buttons, badges

**Technology Stack**:
- **Runtime**: Node.js (uses `bun` but works with `node`)
- **API**: OpenAI DALL-E 3 (`gpt-image-1` for thumbnails, `dall-e-3` for finals)
- **Dependencies**: `dotenv` only (minimal)
- **Pricing Model**: Built-in cost estimation

### 1.2 What It Does Well

✅ **Cost Control**: BudgetGuard prevents runaway spending
✅ **Quality Assurance**: Multi-stage validation (shots → thumbnails → scoring → finals)
✅ **Artistic Consistency**: Centralized `style.md` for all prompts
✅ **Power-of-Two Compliance**: 1024×1024 PNG for all outputs
✅ **Alpha Channel Rules**: Sprites (transparent) vs. Backdrops (solid)
✅ **Batch Processing**: Generate multiple variations, pick winners
✅ **Audit Trail**: JSON reports for all operations

### 1.3 What It's Missing

❌ **No Audio Generation**: Only images, no SFX/music/ambiance
❌ **No Manifest Integration**: Doesn't update `assets/manifest.json`
❌ **No Constant Generation**: Doesn't trigger `npm run generate-assets`
❌ **Isolated Workflow**: Parallel to existing asset system
❌ **Bun Dependency**: Scripts use `bun` (not standard `node`)
❌ **No Documentation**: Missing architectural docs
❌ **No Testing**: No validation tests
❌ **Monolithic CLI**: Single 800+ line file (`wyn-gfx.mjs`)

---

## 2. Gap Analysis

### 2.1 Current Asset System (Main Branch)

**What Exists**:
```
scripts/
├── generate-assets.js          # Manifest → Constants
├── validate-assets.js          # Integrity checks
└── create-placeholder-assets.cjs  # Basic Canvas placeholders

assets/
└── manifest.json               # Central asset manifest

src/constants/
└── Assets.js                   # AUTO-GENERATED constants
```

**Workflow**:
```
Manual sourcing → Add to assets/ → Update manifest.json →
npm run generate-assets → Use ImageAssets.* in code
```

**Strengths**:
- ✅ Manifest-driven (single source of truth)
- ✅ Generated constants (no magic strings)
- ✅ Validated integrity
- ✅ Integrated with game code

**Limitations**:
- ❌ Manual asset sourcing (time-consuming)
- ❌ No AI generation
- ❌ No quality variation testing

### 2.2 Found System (get-more-buff Branch)

**What Exists**:
```
asset-generation/
├── tools/wyn-gfx.mjs           # All-in-one CLI
├── shots.json                   # Asset specifications
├── style.md                     # Art direction
└── [various utilities]

.reports/assets/
├── audit.json
├── thumb-scores.json
└── usage-audit.json
```

**Workflow**:
```
Define shots.json → npm run gfx:all →
Review generated/ → Accept/Reject → ???
(No manifest integration)
```

**Strengths**:
- ✅ AI-powered generation
- ✅ Cost control
- ✅ Quality assurance
- ✅ Batch processing

**Limitations**:
- ❌ Disconnected from main asset system
- ❌ No audio generation
- ❌ No manifest.json updates
- ❌ No constant generation
- ❌ Bun-specific scripts

### 2.3 Integration Challenges

| Challenge | Current System | Found System | Target State |
|-----------|---------------|--------------|--------------|
| **Image Generation** | Manual sourcing | ✅ AI (DALL-E) | ✅ AI (multiple services) |
| **Audio Generation** | Manual sourcing | ❌ None | ✅ AI (Bark, MusicGen, etc.) |
| **Manifest Integration** | ✅ Central | ❌ Isolated | ✅ Unified |
| **Constant Generation** | ✅ Automated | ❌ Manual | ✅ Automated |
| **Cost Control** | N/A | ✅ Budget guard | ✅ Multi-service budget |
| **Quality Assurance** | ✅ Validation | ✅ Multi-stage | ✅ Enhanced |
| **Documentation** | ✅ README.md | ❌ Minimal | ✅ Comprehensive |
| **Runtime** | Node.js | Bun | Node.js (portable) |

---

## 3. Architectural Vision

### 3.1 System Goals

**Primary Objectives**:
1. **Multi-Modal Generation**: Images, audio, music, SFX from AI services
2. **Unified Workflow**: Single pipeline from specification to game integration
3. **Cost Optimization**: Budget controls across all services
4. **Quality Assurance**: Validation, review, approval gates
5. **Architectural Alignment**: Follows CLAUDE.md principles (manifest-driven, constants)
6. **Extensibility**: Easy to add new generation services

**Non-Goals** (Deferred):
- Real-time generation (generation is pre-production)
- In-game asset streaming (assets are committed to repo)
- Procedural runtime generation (all assets baked)

### 3.2 Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Asset Generation System                                    │
│  (New major system - peer to observability, physics, etc.)  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────┴──────────────────┐
        │                                      │
        ↓                                      ↓
┌───────────────────┐              ┌───────────────────┐
│ Image Generation  │              │ Audio Generation  │
│                   │              │                   │
│ - DALL-E 3        │              │ - Bark (SFX)      │
│ - Stable Diff XL  │              │ - MusicGen       │
│ - Midjourney (?)  │              │ - ElevenLabs     │
└────────┬──────────┘              └────────┬──────────┘
         │                                  │
         └─────────────┬────────────────────┘
                       ↓
         ┌──────────────────────────┐
         │  Generation Orchestrator │
         │  - Unified CLI           │
         │  - Cost tracking         │
         │  - Quality gates         │
         │  - Batch processing      │
         └────────┬─────────────────┘
                  │
                  ↓
         ┌──────────────────────────┐
         │  Asset Integration       │
         │  - Update manifest.json  │
         │  - Trigger generate-     │
         │    assets.js             │
         │  - Validate integrity    │
         └────────┬─────────────────┘
                  │
                  ↓
         ┌──────────────────────────┐
         │  Game Asset System       │
         │  (Existing)              │
         │  - src/constants/        │
         │    Assets.js             │
         │  - Phaser loading        │
         └──────────────────────────┘
```

### 3.3 Directory Structure (Target)

```
WynIsBuff2/
├── scripts/
│   ├── generate-assets.js         # EXISTING: Manifest → Constants
│   ├── validate-assets.js         # EXISTING: Integrity checks
│   └── asset-generation/          # NEW: AI Generation System
│       ├── README.md              # Main documentation
│       ├── package.json           # Dependencies (dotenv, openai, etc.)
│       ├── config/
│       │   ├── services.js        # API service configs
│       │   ├── budget.js          # Cost limits per service
│       │   └── quality.js         # Validation rules
│       ├── specifications/
│       │   ├── images.json        # Image asset specs
│       │   ├── audio.json         # Audio asset specs
│       │   ├── music.json         # Music asset specs
│       │   └── style.md           # Art direction (migrated)
│       ├── cli/
│       │   ├── orchestrator.js    # Main CLI entry point
│       │   ├── commands/          # Command modules
│       │   │   ├── generate.js
│       │   │   ├── validate.js
│       │   │   ├── review.js
│       │   │   └── integrate.js
│       │   └── utils/             # Shared utilities
│       ├── generators/
│       │   ├── image/
│       │   │   ├── dalle.js       # DALL-E 3 generator
│       │   │   └── stable-diff.js # Stable Diffusion (future)
│       │   └── audio/
│       │       ├── bark.js        # Bark SFX generator (NEW)
│       │       └── musicgen.js    # MusicGen (NEW)
│       ├── validators/
│       │   ├── image-validator.js
│       │   └── audio-validator.js
│       ├── integrators/
│       │   └── manifest-updater.js
│       └── reports/               # Generation reports
│           ├── cost-tracking.json
│           ├── quality-audit.json
│           └── generation-log.json
├── assets/
│   ├── manifest.json              # EXISTING: Updated by integration
│   └── ai-generated/              # NEW: Staging for review
│       ├── images/
│       └── audio/
├── docs/
│   └── systems/
│       └── AssetGeneration.md     # NEW: System documentation
└── package.json                   # Add generation scripts
```

---

## 4. Migration Strategy

### 4.1 Migration Principles

**Guiding Principles** (from CLAUDE.md):
1. **Barrel Exports** - Modular structure with clean imports
2. **Generated Constants** - All assets via `ImageAssets.*`, `AudioAssets.*`
3. **Manifest-Driven** - `manifest.json` is single source of truth
4. **Event-Driven** - Communication via EventBus where appropriate
5. **Separation of Concerns** - Generation ≠ Integration ≠ Game Logic

**Migration Rules**:
- ✅ **Preserve**: Budget control, quality assurance, multi-stage pipeline
- ✅ **Adapt**: Convert Bun → Node.js, integrate with manifest.json
- ✅ **Expand**: Add audio generation, multi-service support
- ✅ **Document**: Follow existing documentation patterns
- ❌ **Don't Cherry-Pick**: Migrate patterns, not raw files

### 4.2 Three-Phase Approach

**Phase 1: Foundation & Image Migration** (Weeks 1-2)
- Migrate image generation patterns
- Integrate with manifest.json workflow
- Convert Bun → Node.js
- Document architecture

**Phase 2: Audio Generation Integration** (Weeks 3-4)
- Add Bark for SFX generation
- Add MusicGen for background music
- Unified cost tracking
- Audio validation

**Phase 3: Multi-Modal Orchestration** (Weeks 5-6)
- Single CLI for all generation types
- Batch processing across modalities
- Quality gate system
- Production deployment

### 4.3 Backward Compatibility

**Existing Workflows Must Continue Working**:
```bash
# EXISTING (manual workflow) - MUST WORK
npm run generate-assets     # Manifest → Constants
npm run validate-assets     # Integrity checks

# NEW (AI generation workflow) - ADDITIVE
npm run ai:generate         # Generate assets via AI
npm run ai:review           # Review generated assets
npm run ai:integrate        # Integrate approved assets
npm run ai:all              # Full pipeline
```

**File Changes**:
- ✅ **Add** new files in `scripts/asset-generation/`
- ✅ **Extend** `package.json` with new scripts
- ✅ **Update** `assets/manifest.json` with generated assets
- ❌ **Don't Break** existing manual workflow

---

## 5. Phase 1: Foundation & Image Migration

### 5.1 Goals

- ✅ Extract image generation patterns from `origin/get-more-buff`
- ✅ Integrate with existing manifest.json workflow
- ✅ Convert Bun → Node.js for portability
- ✅ Document architecture following project standards

### 5.2 Tasks

#### Task 1.1: Directory Setup

**Create structure**:
```bash
mkdir -p scripts/asset-generation/{config,specifications,cli,generators/image,validators,integrators,reports}
```

**Files to create**:
```
scripts/asset-generation/
├── README.md                  # System overview
├── package.json               # Dependencies
├── .env.example               # API key template
└── .gitignore                 # Ignore reports/, .env
```

#### Task 1.2: Migrate Core Concepts

**From**: `asset-generation/tools/wyn-gfx.mjs` (monolithic)
**To**: Modular architecture

**Extract**:
1. **Budget Control** → `config/budget.js`
   ```javascript
   export const BUDGET_LIMITS = {
     dalle3: { daily: 10, monthly: 50 },
     bark: { daily: 0, monthly: 0 }, // Free, local
     musicgen: { daily: 0, monthly: 0 }
   };
   ```

2. **Shot Specifications** → `specifications/images.json`
   - Migrate 45+ shots from `shots.json`
   - Add metadata: priority, category, dependencies

3. **API Integration** → `generators/image/dalle.js`
   - Extract DALL-E API calls
   - Add error handling, retries
   - Cost tracking

4. **Validation** → `validators/image-validator.js`
   - Dimension checks (1024×1024, POT)
   - Alpha channel rules (sprites vs. backdrops)
   - File size limits

5. **Manifest Integration** → `integrators/manifest-updater.js`
   - Read current `assets/manifest.json`
   - Add generated asset entries
   - Preserve manual entries
   - Trigger `npm run generate-assets`

#### Task 1.3: CLI Redesign

**From**: Single 800-line file
**To**: Command-based architecture

```javascript
// scripts/asset-generation/cli/orchestrator.js
import { Command } from 'commander'; // Or custom minimal CLI

const program = new Command();

program
  .name('ai-generate')
  .description('AI Asset Generation System')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize specifications')
  .action(require('./commands/init'));

program
  .command('generate')
  .description('Generate assets')
  .option('--type <image|audio|music>', 'Asset type')
  .option('--budget <amount>', 'Budget limit')
  .option('--dry-run', 'Estimate costs only')
  .action(require('./commands/generate'));

program
  .command('review')
  .description('Review generated assets')
  .action(require('./commands/review'));

program
  .command('integrate')
  .description('Integrate approved assets')
  .action(require('./commands/integrate'));

program
  .command('validate')
  .description('Validate asset integrity')
  .action(require('./commands/validate'));

program.parse();
```

#### Task 1.4: Integration with Existing System

**Modify**: `package.json` (root)

```json
{
  "scripts": {
    "generate-assets": "node scripts/generate-assets.js",
    "validate-assets": "node scripts/validate-assets.js",

    "ai:init": "node scripts/asset-generation/cli/orchestrator.js init",
    "ai:generate": "node scripts/asset-generation/cli/orchestrator.js generate",
    "ai:review": "node scripts/asset-generation/cli/orchestrator.js review",
    "ai:integrate": "node scripts/asset-generation/cli/orchestrator.js integrate",
    "ai:validate": "node scripts/asset-generation/cli/orchestrator.js validate",
    "ai:all": "npm run ai:generate && npm run ai:review && npm run ai:integrate"
  }
}
```

**Workflow**:
```bash
# 1. Generate images via AI
npm run ai:generate -- --type=image --budget=10

# 2. Review in staging (assets/ai-generated/images/)
ls assets/ai-generated/images/

# 3. Approve and integrate
npm run ai:integrate

# 4. Trigger constant generation (automatic)
# npm run generate-assets (called internally)

# 5. Use in game
import { ImageAssets } from '../constants/Assets.js';
this.load.image(ImageAssets.SPRITE_WYN_IDLE, '...');
```

### 5.3 Deliverables

- [ ] Directory structure created
- [ ] Core modules extracted and refactored
- [ ] CLI commands implemented
- [ ] Integration with manifest.json working
- [ ] Documentation written (README.md, AssetGeneration.md)
- [ ] Tests for validation and integration
- [ ] Budget tracking functional
- [ ] Dry-run mode working

### 5.4 Success Criteria (Phase 1)

✅ Can generate 1 image via AI
✅ Generated image validates (dimensions, alpha, POT)
✅ `manifest.json` updated automatically
✅ `npm run generate-assets` triggered
✅ `ImageAssets.SPRITE_WYN_IDLE` available in code
✅ Budget tracking shows cost
✅ Dry-run estimates cost accurately
✅ Documentation complete

---

## 6. Phase 2: Audio Generation Integration

### 6.1 Goals

- ✅ Add audio generation (SFX, music, ambiance)
- ✅ Support multiple audio services (Bark, MusicGen, ElevenLabs)
- ✅ Unified cost tracking across image + audio
- ✅ Audio validation (duration, bitrate, format)

### 6.2 Audio Services Evaluation

| Service | Type | Cost | Quality | Local/API | Priority |
|---------|------|------|---------|-----------|----------|
| **Bark** (Suno AI) | SFX, Voice | Free | Medium | Local | 🥇 High |
| **MusicGen** (Meta) | Music | Free | High | Local | 🥇 High |
| **ElevenLabs** | SFX, Voice | $0.18/min | Very High | API | 🥈 Medium |
| **Audiocraft** (Meta) | SFX | Free | Medium | Local | 🥉 Low |
| **Riffusion** | Music | Free | Low | Local | ❌ Skip |

**Recommended Stack**:
- **Primary**: Bark (SFX), MusicGen (music) - Free, local, good quality
- **Premium**: ElevenLabs (if Bark quality insufficient)

### 6.3 Audio Specifications

**Create**: `scripts/asset-generation/specifications/audio.json`

```json
{
  "jumpSFX": {
    "type": "sfx",
    "service": "bark",
    "variants": 4,
    "specs": [
      {
        "key": "sfxJump1A",
        "prompt": "Soft landing whoosh sound, dust cloud impact, 0.3 seconds, platformer game",
        "duration": 0.3,
        "priority": "high",
        "tags": ["jump", "dust", "soft"]
      },
      {
        "key": "sfxJump1B",
        "prompt": "Soft landing whoosh sound, dust cloud impact, slightly higher pitch, 0.3 seconds",
        "duration": 0.3,
        "priority": "high",
        "tags": ["jump", "dust", "soft"]
      }
      // ... 10 more variants (3 types × 4 each)
    ]
  },
  "backgroundMusic": {
    "type": "music",
    "service": "musicgen",
    "specs": [
      {
        "key": "musicProteinPlant",
        "prompt": "Upbeat electronic platformer music, bio-tech ambiance, 120 BPM, loop-ready",
        "duration": 60,
        "priority": "medium",
        "tags": ["music", "biome", "loop"]
      }
      // ... more tracks
    ]
  }
}
```

### 6.4 Audio Generator Implementation

**Create**: `scripts/asset-generation/generators/audio/bark.js`

```javascript
/**
 * Bark Audio Generator
 * Generates SFX using Bark (Suno AI)
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class BarkGenerator {
  constructor(config) {
    this.config = config;
    this.modelPath = config.barkModelPath || './models/bark';
  }

  async generate(spec) {
    // 1. Validate Bark is installed
    await this.validateBark();

    // 2. Generate audio
    const outputPath = path.join(
      this.config.outputDir,
      `${spec.key}.mp3`
    );

    // 3. Call Bark via Python script or Node.js wrapper
    await this.runBark(spec.prompt, outputPath, spec.duration);

    // 4. Validate output
    await this.validate(outputPath, spec);

    return {
      key: spec.key,
      path: outputPath,
      service: 'bark',
      cost: 0, // Free
      metadata: {
        duration: spec.duration,
        prompt: spec.prompt
      }
    };
  }

  async validateBark() {
    try {
      // Check if Bark Python package is available
      await execAsync('python -c "import bark"');
    } catch (error) {
      throw new Error('Bark not installed. Run: pip install bark-audio');
    }
  }

  async runBark(prompt, outputPath, duration) {
    // Implementation: Call Bark Python script
    const command = `python -m bark.generate --prompt "${prompt}" --duration ${duration} --output "${outputPath}"`;

    try {
      const { stdout, stderr } = await execAsync(command);
      console.log('Bark output:', stdout);
      if (stderr) console.warn('Bark warnings:', stderr);
    } catch (error) {
      throw new Error(`Bark generation failed: ${error.message}`);
    }
  }

  async validate(filePath, spec) {
    // 1. Check file exists
    const stats = await fs.stat(filePath);
    if (stats.size === 0) {
      throw new Error(`Generated audio is empty: ${filePath}`);
    }

    // 2. Check format (MP3)
    if (!filePath.endsWith('.mp3')) {
      throw new Error(`Invalid format: ${filePath}`);
    }

    // 3. Check duration (approximate)
    // Use ffprobe or similar to check actual duration
    // ... implementation

    return true;
  }
}
```

**Create**: `scripts/asset-generation/generators/audio/musicgen.js`

Similar structure for MusicGen (music generation).

### 6.5 Audio Validation

**Create**: `scripts/asset-generation/validators/audio-validator.js`

```javascript
export class AudioValidator {
  validate(audioFile, spec) {
    const checks = [
      this.checkFormat(audioFile),       // MP3, 44.1kHz
      this.checkDuration(audioFile, spec), // Matches spec
      this.checkBitrate(audioFile),      // 128-192 kbps
      this.checkSize(audioFile),         // Reasonable file size
      this.checkSilence(audioFile)       // Not silent
    ];

    return {
      valid: checks.every(c => c.passed),
      checks
    };
  }

  // ... implementation
}
```

### 6.6 Cost Tracking (Multi-Service)

**Update**: `scripts/asset-generation/config/budget.js`

```javascript
export class BudgetTracker {
  constructor() {
    this.spent = {
      dalle3: 0,
      elevenlabs: 0,
      // bark: 0, (free, no tracking needed)
      // musicgen: 0 (free)
    };
    this.limits = {
      daily: 20,
      monthly: 100
    };
  }

  canAfford(service, estimatedCost) {
    const totalSpent = Object.values(this.spent).reduce((a, b) => a + b, 0);
    return (totalSpent + estimatedCost) <= this.limits.daily;
  }

  charge(service, cost) {
    this.spent[service] += cost;
    this.save();
  }

  // ... implementation
}
```

### 6.7 Deliverables

- [ ] Bark audio generator implemented
- [ ] MusicGen music generator implemented
- [ ] Audio specifications created (jump SFX, background music)
- [ ] Audio validator implemented
- [ ] Cost tracking updated for multi-service
- [ ] CLI commands support `--type=audio`
- [ ] Integration with manifest.json for audio assets
- [ ] Documentation updated

### 6.8 Success Criteria (Phase 2)

✅ Can generate 1 SFX via Bark
✅ Can generate 1 music track via MusicGen
✅ Audio validates (duration, format, bitrate)
✅ `manifest.json` updated with audio entries
✅ `AudioAssets.SFX_JUMP1A` available in code
✅ Cost tracking shows $0 for free services
✅ Jump SFX from Bug #4 generated

---

## 7. Phase 3: Multi-Modal Orchestration

### 7.1 Goals

- ✅ Single unified CLI for all asset types
- ✅ Batch processing (generate all assets for a feature)
- ✅ Quality gate system (review before integration)
- ✅ Production-ready deployment

### 7.2 Unified CLI Enhancement

**Update**: `scripts/asset-generation/cli/orchestrator.js`

```bash
# Generate all assets for Protein Plant biome
npm run ai:generate -- --feature=proteinPlant

# This generates:
# - 4 parallax backdrops (sky, mid, fore, fg)
# - Enemy sprites
# - Collectible sprites
# - Biome-specific SFX
# - Background music track
```

### 7.3 Feature-Based Generation

**Create**: `scripts/asset-generation/specifications/features.json`

```json
{
  "proteinPlant": {
    "name": "Protein Plant Biome",
    "images": [
      "backdrop_protein_sky",
      "backdrop_protein_mid",
      "backdrop_protein_fore",
      "backdrop_protein_fg",
      "sprite_plant_enemy_1",
      "sprite_protein_collectible"
    ],
    "audio": [
      "sfxPlantRustle",
      "sfxNutrientFlow",
      "musicProteinPlant"
    ],
    "budget": {
      "images": 5,
      "audio": 2
    },
    "priority": "high"
  },
  "jumpMechanics": {
    "name": "Jump Mechanics (Bug #4)",
    "images": [
      "particle_dust",
      "particle_spark",
      "particle_flare_small"
    ],
    "audio": [
      "sfxJump1A", "sfxJump1B", "sfxJump1C", "sfxJump1D",
      "sfxJump2A", "sfxJump2B", "sfxJump2C", "sfxJump2D",
      "sfxJump3A", "sfxJump3B", "sfxJump3C", "sfxJump3D"
    ],
    "budget": {
      "images": 1,
      "audio": 0
    },
    "priority": "critical"
  }
}
```

### 7.4 Quality Gate System

**Create**: `scripts/asset-generation/cli/commands/review.js`

```javascript
/**
 * Interactive review system
 * Shows generated assets, allows approve/reject/regenerate
 */
export async function review() {
  const staged = await getStagedAssets();

  for (const asset of staged) {
    await displayAsset(asset);
    const action = await prompt(`Approve ${asset.key}? (y/n/r[egenerate])`);

    switch (action) {
      case 'y':
        await approveAsset(asset);
        break;
      case 'n':
        await rejectAsset(asset);
        break;
      case 'r':
        await regenerateAsset(asset);
        break;
    }
  }
}
```

### 7.5 Batch Processing

```bash
# Generate all critical assets
npm run ai:generate -- --priority=critical --budget=10

# Generate all assets for MVP
npm run ai:generate -- --milestone=mvp --budget=50

# Dry-run to estimate costs
npm run ai:generate -- --milestone=mvp --dry-run
```

### 7.6 Deliverables

- [ ] Feature-based generation implemented
- [ ] Interactive review system
- [ ] Batch processing with priority queues
- [ ] Milestone-based generation
- [ ] Production deployment documentation
- [ ] CI/CD integration (optional)

### 7.7 Success Criteria (Phase 3)

✅ Can generate all assets for one feature
✅ Review system works (approve/reject/regenerate)
✅ Batch processing respects budget limits
✅ Milestone generation produces usable asset pack
✅ System is production-ready
✅ Documentation complete

---

## 8. Documentation & Standards

### 8.1 Documentation Structure

**Create**:
```
docs/systems/
└── AssetGeneration.md         # Main system documentation

scripts/asset-generation/
├── README.md                   # Quick start guide
└── ARCHITECTURE.md             # Detailed architecture

AI_ASSET_GENERATION_FRAMEWORK_REPORT.md  # UPDATE with findings
```

**AssetGeneration.md** (System Docs):
```markdown
# Asset Generation System

## Overview
Multi-modal AI asset generation system for WynIsBuff2.

## Architecture
- Generators: DALL-E 3, Bark, MusicGen
- Budget Control: Daily/monthly limits
- Quality Assurance: Multi-stage validation
- Integration: Manifest-driven, constant-based

## Usage
### Generate Images
### Generate Audio
### Feature-Based Generation
### Review and Integration

## Cost Management
## Quality Standards
## Troubleshooting
```

### 8.2 Code Standards

**Follows CLAUDE.md Principles**:
- ✅ Modular architecture with barrel exports
- ✅ No magic strings (use constants)
- ✅ Event-driven where appropriate
- ✅ Comprehensive error handling
- ✅ Logging via observability system
- ✅ Tests for all critical paths

### 8.3 Asset Naming Conventions

**Images**:
```
backdrop_<biome>_<layer>.png     # backdrop_protein_sky.png
sprite_<entity>_<action>.png     # sprite_wyn_idle.png
particle_<type>.png              # particle_dust.png
ui_<element>.png                 # ui_button_primary.png
```

**Audio**:
```
sfx<Type><Variant>.mp3           # sfxJump1A.mp3
music<Biome>.mp3                 # musicProteinPlant.mp3
ambiance<Location>.mp3           # ambianceFactoryFloor.mp3
```

---

## 9. Risk Assessment

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **API Cost Overruns** | Medium | High | Budget guards, dry-run mode, alerts |
| **Quality Issues** | Medium | Medium | Multi-stage validation, review gates |
| **Service Downtime** | Low | Medium | Retry logic, fallback services |
| **Local Model Setup** | High | Low | Clear documentation, optional feature |
| **Breaking Existing Workflow** | Low | High | Backward compatibility tests |
| **Bun → Node.js Issues** | Low | Low | Thorough conversion testing |

### 9.2 Schedule Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Scope Creep** | High | Medium | Strict phase boundaries |
| **Audio Quality** | Medium | Medium | Start with free services, upgrade if needed |
| **Integration Complexity** | Medium | High | Incremental testing, rollback plan |

### 9.3 Mitigation Strategies

1. **Budget Overruns**:
   - Hard cap at $50/month
   - Alert at $40
   - Require approval for >$10 single operation

2. **Quality Issues**:
   - Always generate multiple variations
   - AI scoring before finals
   - Manual review gate before integration

3. **Breaking Changes**:
   - Feature flag system
   - Keep manual workflow as fallback
   - Comprehensive integration tests

---

## 10. Success Criteria

### 10.1 Phase 1 Success

✅ **Technical**:
- Image generation working
- Manifest integration automatic
- Budget tracking functional
- Documentation complete

✅ **Workflow**:
- Can generate 1 sprite end-to-end
- Asset usable in game code
- Cost tracked accurately

### 10.2 Phase 2 Success

✅ **Technical**:
- Audio generation working (Bark, MusicGen)
- Multi-service cost tracking
- Audio validation functional

✅ **Workflow**:
- Can generate jump SFX (Bug #4 resolution)
- Audio assets usable in game
- $0 cost for free services

### 10.3 Phase 3 Success

✅ **Technical**:
- Feature-based generation working
- Review system functional
- Batch processing with priority

✅ **Workflow**:
- Can generate full biome asset pack
- Quality gate system prevents bad assets
- Production-ready deployment

### 10.4 Overall Success Metrics

**Quantitative**:
- ✅ Cost < $20 for first full asset pack
- ✅ Quality score > 80% (AI + manual review)
- ✅ Generation time < 2 hours for 50 assets
- ✅ 0 breaking changes to existing workflow

**Qualitative**:
- ✅ System is documented and maintainable
- ✅ New developers can use it within 30 minutes
- ✅ Follows all CLAUDE.md architectural principles
- ✅ Asset quality meets game standards

---

## Next Steps

### Immediate Actions

1. ✅ **Complete this migration plan** (DONE)
2. ✅ **Update AI_ASSET_GENERATION_FRAMEWORK_REPORT.md** with findings (PENDING)
3. 🔄 **Create GitHub issue** for Phase 1 work (PENDING)
4. 🔄 **Set up project branch** for migration (PENDING)
5. 🔄 **Begin Phase 1 Task 1.1** (Directory setup) (PENDING)

### Decision Points

**User must decide**:
1. ✅ Approve migration approach (vs. direct cherry-pick)
2. ✅ Set budget limits (suggested: $20 initial, $50 monthly)
3. ✅ Choose audio services (suggested: Bark + MusicGen)
4. ✅ Prioritize features (suggested: Jump SFX first per Bug #4)
5. ✅ Assign timeline (suggested: 6 weeks for all 3 phases)

---

**Report Status**: ✅ Complete
**Next Document**: Update AI_ASSET_GENERATION_FRAMEWORK_REPORT.md
**Branch Strategy**: Feature branch `feature/asset-generation-migration`
**First Commit**: Directory structure setup
**First Deliverable**: Working image generation (Phase 1)

---

*This migration plan follows WynIsBuff2 architectural principles (CLAUDE.md) and integrates with existing observability, manifest-driven asset management, and development paradigms.*
