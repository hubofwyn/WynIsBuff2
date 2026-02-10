# WynIsBuff2 Audio Generation

Automated audio asset generation using ElevenLabs API for WynIsBuff2 platformer game.

## Overview

This system generates high-quality game audio assets (SFX and music) using ElevenLabs AI with:

- **Budget Control**: Automatic credit tracking and safety margins
- **Post-Processing**: MP3 → OGG conversion, peak/LUFS normalization
- **Manifest-Driven**: Single source of truth in `assets.json`
- **Phase Management**: Organized by development phases (Bug #4 = Phase 1)

## Quick Start

### 1. Prerequisites

- Python 3.9+ with venv
- FFmpeg for audio processing
- ElevenLabs API key ([get one here](https://elevenlabs.io/app/settings/api-keys))

### 2. Initial Setup

```bash
# Navigate to this directory
cd scripts/audio-generation

# Create virtual environment
python3 -m venv audio-generation-venv

# Activate virtual environment
source audio-generation-venv/bin/activate  # macOS/Linux
# OR
audio-generation-venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Install FFmpeg (if not already installed)
brew install ffmpeg  # macOS
# sudo apt-get install ffmpeg  # Ubuntu
# Download from https://ffmpeg.org/download.html  # Windows

# Configure API key
cp .env.example .env
# Edit .env and replace placeholder with your actual API key
```

### 3. Generate Phase 1 Assets (Bug #4 Fix)

```bash
# Generate all 12 jump sounds for Bug #4
python generate_assets.py --phase 1

# Or preview without generating (dry run)
python generate_assets.py --phase 1 --dry-run
```

## File Structure

```text
scripts/audio-generation/
├── README.md                    # This file
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment template
├── .env                         # Your API key (git-ignored)
│
├── assets.json                  # Asset manifest (single source of truth)
│
├── generate_assets.py           # Main orchestrator
├── budget_guard.py              # Credit tracking & safety
├── post_process.py              # Audio conversion & normalization
│
└── audio-generation-venv/       # Python virtual env (git-ignored)

assets/audio/                    # Generated assets output
├── sfx/
│   ├── player/                  # Phase 1 output (12 jump sounds)
│   ├── collectibles/
│   ├── combat/
│   └── ...
└── music/
```

## Usage

### Generate Assets

```bash
# Phase-based generation (recommended)
python generate_assets.py --phase 1    # Phase 1 (Bug #4 - jump sounds)
python generate_assets.py --phase 2    # Phase 2 (core gameplay SFX)

# Specific asset
python generate_assets.py --asset sfx_player_jump1_01

# All assets (use with caution - expensive!)
python generate_assets.py --all

# Dry run (preview without generating)
python generate_assets.py --phase 1 --dry-run
```

### Test Budget Guard

```bash
# Check current credit balance and test estimates
python budget_guard.py
```

### Manual Post-Processing

```bash
# Process single file
python post_process.py input.mp3 output.ogg --type sfx

# Batch process directory
python post_process.py input_dir/ output_dir/ --type sfx --batch
```

## Asset Manifest (`assets.json`)

The manifest defines all audio assets with:

```json
{
    "id": "sfx_player_jump1_01",
    "phase": 1,
    "type": "sfx",
    "name": "Jump 1 Variant A",
    "prompt": "A short, punchy platform game jump sound...",
    "duration_seconds": 0.3,
    "prompt_influence": 0.35,
    "output_path": "assets/audio/sfx/player/sfx_player_jump1_01.ogg",
    "manifest_key": "sfxJump1A"
}
```

### Adding New Assets

1. Add entry to `assets.json`
2. Set appropriate `phase`, `type`, and `priority`
3. Write detailed `prompt` (see AUDIO_DESIGN_SPECIFICATION.md for guidance)
4. Run `python generate_assets.py --phase X`

## Budget Management

### Safety Features

- **Credit Tracking**: Fetches current balance before each generation
- **Safety Margin**: Keeps 5,000 credit buffer (configurable)
- **Cost Estimation**: Conservative estimates before API calls
- **Automatic Blocking**: Prevents generation if insufficient credits

### Cost Estimates

| Asset Type | Duration | Estimated Cost |
| ---------- | -------- | -------------- |
| SFX        | 0.3s     | ~100 credits   |
| SFX        | 0.7s     | ~190 credits   |
| Music      | 30s      | ~9,000 credits |

**Phase 1 Total**: ~1,120 credits ($0.50-1.00 USD)

### Checking Budget

```bash
# Run self-test to check current credits
python budget_guard.py
```

Output:

```text
✅ Current credits: 142,350
   User tier: starter

🧮 Cost Estimates:
   0.3s SFX: ~110 credits
   0.7s SFX: ~190 credits
   30s Music: ~9,050 credits
```

## Post-Processing Pipeline

All generated audio goes through:

1. **MP3 → OGG Vorbis Conversion**
    - SFX: 192 kbps
    - Music: 256 kbps

2. **Normalization**
    - **SFX**: Peak normalization to -3 dBFS
    - **Music**: Loudness normalization to -16 LUFS

3. **Output**
    - Processed files saved to `assets/audio/`
    - Raw MP3s kept temporarily (can be cleaned up)

## Development Phases

### Phase 1: Bug #4 Fix (CURRENT)

**Priority**: Critical
**Assets**: 12 jump sounds (4 variants × 3 jump types)
**Cost**: ~1,120 credits ($0.50-1.00)
**Timeline**: 1 day

Generate with:

```bash
python generate_assets.py --phase 1
```

### Phase 2: Core Gameplay SFX

**Priority**: High
**Assets**: Collectibles, combat, movement
**Cost**: ~3,500 credits ($1.50-2.50)
**Timeline**: 2-3 days

### Phase 3: Enemy & Boss SFX

**Priority**: Medium
**Assets**: Enemy sounds, boss battle SFX
**Cost**: ~4,000 credits ($2.00-3.00)
**Timeline**: 2-3 days

### Phase 4: UI & Menu SFX

**Priority**: Medium
**Assets**: Menu navigation, UI interactions
**Cost**: ~2,000 credits ($1.00-1.50)
**Timeline**: 1-2 days

### Phase 5: Music Foundation

**Priority**: Low
**Assets**: Main menu, first level theme
**Cost**: ~30,000 credits ($15.00-20.00)
**Timeline**: 1 week

### Phase 6: Complete Music Library

**Priority**: Low
**Assets**: All biome themes, boss battles
**Cost**: ~100,000+ credits ($50.00-75.00)
**Timeline**: 2-3 weeks

## Troubleshooting

### "ELEVENLABS_API_KEY not found"

**Solution**: Create `.env` file with your API key:

```bash
cp .env.example .env
# Edit .env and add: ELEVENLABS_API_KEY=sk_your_key_here
```

### "FFmpeg not found"

**Solution**: Install FFmpeg for your platform:

```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### "Insufficient credits"

**Solution**:

1. Check balance: `python budget_guard.py`
2. Top up at <https://elevenlabs.io/pricing>
3. Reduce safety margin: `--safety-margin 1000`

### Generation Fails for Specific Asset

**Solution**:

1. Check logs for error message
2. Test prompt with smaller duration
3. Verify output path is writable
4. Try regenerating: `python generate_assets.py --asset <id>`

### Virtual Environment Issues

**Solution**: Recreate environment:

```bash
deactivate
rm -rf audio-generation-venv
python3 -m venv audio-generation-venv
source audio-generation-venv/bin/activate
pip install -r requirements.txt
```

## Integration with Game

After generation:

1. **Update Main Manifest**: Add generated assets to `/assets/manifest.json`:

```json
{
    "type": "audio",
    "key": "sfx-jump-1",
    "path": "audio/sfx/player/sfx_player_jump1_01.ogg"
}
```

1. **Regenerate Constants**:

```bash
npm run generate-assets
```

1. **Use in Code**:

```javascript
import { AudioAssets } from '../constants/Assets.js';

// In scene
this.sound.play(AudioAssets.SFX_JUMP_1);
```

## Cost Tracking

Generation results are automatically saved to timestamped JSON files:

```bash
# View latest results
ls -lt generation_results_*.json | head -1
cat generation_results_20241030_143022.json
```

Example output:

```json
{
  "timestamp": "2024-10-30T14:30:22",
  "total_attempted": 12,
  "total_successful": 12,
  "total_failed": 0,
  "total_skipped": 0,
  "total_credits_used": 1120,
  "assets": [...]
}
```

## Related Documentation

- [ELEVENLABS_IMPLEMENTATION_GUIDE.md](../../ELEVENLABS_IMPLEMENTATION_GUIDE.md) - Complete technical guide
- [AUDIO_DESIGN_SPECIFICATION.md](../../AUDIO_DESIGN_SPECIFICATION.md) - Artistic specifications
- [elevenlabs_info.md](../../elevenlabs_info.md) - API technical framework

## Support

- ElevenLabs API Docs: <https://elevenlabs.io/docs>
- ElevenLabs Discord: <https://discord.gg/elevenlabs>
- Project Issues: File in WynIsBuff2 repository

## License

Part of WynIsBuff2 project. All generated assets are owned by the project.
