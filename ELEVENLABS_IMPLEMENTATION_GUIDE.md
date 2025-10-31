# ElevenLabs Audio Generation Implementation Guide

**Date**: 2025-10-30
**Version**: 1.0
**Status**: 🚀 Ready for Implementation

---

## Overview

This guide provides step-by-step instructions for implementing the automated audio generation system for WynIsBuff2 using the ElevenLabs API. It combines the artistic specifications from **AUDIO_DESIGN_SPECIFICATION.md** with the technical framework outlined in **elevenlabs_info.md** to create a production-ready, automated asset pipeline.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [Directory Structure](#directory-structure)
4. [Configuration Files](#configuration-files)
5. [Implementation: Master Script](#implementation-master-script)
6. [Phase 1 Implementation (Bug #4 Fix)](#phase-1-implementation-bug-4-fix)
7. [Testing & Validation](#testing--validation)
8. [Cost Tracking & Budget Management](#cost-tracking--budget-management)

---

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Audio Generation System                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────────┐                │
│  │ assets.json  │─────▶│ generate_assets  │                │
│  │  (Manifest)  │      │      .py         │                │
│  └──────────────┘      │   (Orchestrator) │                │
│                        └─────────┬────────┘                 │
│                                  │                           │
│                    ┌─────────────┼─────────────┐            │
│                    │             │             │            │
│              ┌─────▼────┐  ┌────▼─────┐  ┌───▼──────┐     │
│              │ ElevenLabs│  │  Budget  │  │   Post   │     │
│              │    API    │  │  Guard   │  │ Process  │     │
│              └─────┬────┘  └──────────┘  └───┬──────┘     │
│                    │                          │            │
│              ┌─────▼────┐              ┌─────▼──────┐     │
│              │ Raw Audio│              │ Game-Ready │     │
│              │   (MP3)  │──────────────▶│ Assets     │     │
│              └──────────┘   Convert    │  (OGG)     │     │
│                              Normalize  └────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Update manifest.json (game engine asset manifest)  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Workflow

1. **Input**: `assets.json` (machine-readable version of AUDIO_DESIGN_SPECIFICATION.md)
2. **Budget Check**: Verify sufficient credits before generation
3. **API Call**: Generate audio via ElevenLabs (SFX or Music API)
4. **Download**: Save raw MP3 to temporary directory
5. **Post-Process**:
   - Convert MP3 → OGG Vorbis
   - Normalize (peak for SFX, LUFS for music)
   - Trim silence
6. **Output**: Save to `assets/audio/` with proper naming
7. **Manifest Update**: Update `manifest.json` for game engine

---

## Prerequisites & Setup

### 1. Python Environment

Create isolated virtual environment:

```bash
# Navigate to project root
cd /Users/verlyn13/Projects/hubofwyn/WynIsBuff2

# Create Python virtual environment
python3 -m venv audio-generation-venv

# Activate environment
source audio-generation-venv/bin/activate  # macOS/Linux
# OR
audio-generation-venv\Scripts\activate  # Windows
```

### 2. Install Dependencies

Create `requirements.txt`:

```txt
elevenlabs>=1.0.0
python-dotenv>=1.0.0
pydub>=0.25.1
pyloudnorm>=0.1.1
ffmpeg-normalize>=1.28.3
requests>=2.31.0
```

Install:

```bash
pip install -r requirements.txt
```

### 3. Install FFmpeg

**macOS**:
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows**:
- Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- Add to PATH

**Verify installation**:
```bash
ffmpeg -version
```

### 4. ElevenLabs API Setup

#### a) Create Account & Get API Key

1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up/Login
3. Navigate to **Profile** → **API Keys**
4. Create **Project-Specific Key**:
   - Name: `WynIsBuff2-Audio-Gen`
   - Set hard limit: **$50** (safety backstop)
   - Permissions: Enable "Sound Effects" and "Music" endpoints
5. Copy the API key

#### b) Secure API Key Storage

Create `.env` file in project root:

```bash
# In project root (/Users/verlyn13/Projects/hubofwyn/WynIsBuff2)
touch .env
```

Add to `.env`:
```
ELEVENLABS_API_KEY="sk_your_actual_api_key_here"
```

**Important**: Verify `.env` is in `.gitignore`:

```bash
# Check if .env is ignored
git check-ignore .env
# Should output: .env

# If not, add to .gitignore:
echo ".env" >> .gitignore
```

---

## Directory Structure

Create the following structure:

```
WynIsBuff2/
├── scripts/
│   └── audio-generation/
│       ├── generate_assets.py       # Master orchestrator script
│       ├── budget_guard.py          # Budget control class
│       ├── post_process.py          # Audio processing pipeline
│       ├── assets.json              # Master asset manifest
│       ├── requirements.txt         # Python dependencies
│       ├── .env                     # API key (gitignored)
│       ├── _raw_output/             # Temporary raw MP3s
│       └── _logs/                   # Generation logs
│
├── assets/
│   └── audio/
│       ├── sfx/
│       │   ├── player/              # Player movement sounds
│       │   ├── collectible/         # Pickup sounds
│       │   ├── enemy/               # Enemy sounds
│       │   ├── boss/                # Boss sounds
│       │   └── ui/                  # UI/menu sounds
│       └── music/
│           ├── menu/                # Menu themes
│           ├── level/               # Level music
│           ├── boss/                # Boss battle music
│           └── victory/             # Victory jingles
│
├── audio-generation-venv/           # Python virtual environment
│
└── manifest.json                    # Game engine asset manifest
```

Create directories:

```bash
mkdir -p scripts/audio-generation/{_raw_output,_logs}
mkdir -p assets/audio/{sfx/{player,collectible,enemy,boss,ui},music/{menu,level,boss,victory}}
```

---

## Configuration Files

### 1. assets.json (Master Manifest)

Create `scripts/audio-generation/assets.json`:

```json
{
  "project": "WynIsBuff2",
  "version": "1.0",
  "budget": {
    "daily_limit_usd": 20,
    "monthly_limit_usd": 50,
    "safety_margin_credits": 5000
  },
  "technical_standards": {
    "format": "ogg",
    "sample_rate": 44100,
    "bit_depth": 16,
    "sfx_bitrate_kbps": 192,
    "music_bitrate_kbps": 256,
    "sfx_peak_normalization_dbfs": -3.0,
    "music_loudness_normalization_lufs": -16.0
  },
  "assets": [
    {
      "id": "sfx_player_jump1_01",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 1 - Variant A",
      "prompt": "A short, punchy platform game jump sound. Soft fabric whoosh with a quick puff of air, like a character pushing off the ground. Clean, not harsh. Mid-range frequencies, slightly muffled, organic feel. 0.3 seconds maximum. No echo or reverb.",
      "duration_seconds": 0.3,
      "prompt_influence": 0.35,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump1_01.ogg",
      "manifest_key": "sfxJump1A"
    },
    {
      "id": "sfx_player_jump1_02",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 1 - Variant B",
      "prompt": "A short, punchy platform game jump sound. Soft fabric whoosh with a quick puff of air, like a character pushing off the ground. Clean, not harsh. Mid-range frequencies, slightly muffled, organic feel. 0.3 seconds maximum. Slightly sharper attack. No echo or reverb.",
      "duration_seconds": 0.3,
      "prompt_influence": 0.35,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump1_02.ogg",
      "manifest_key": "sfxJump1B"
    },
    {
      "id": "sfx_player_jump1_03",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 1 - Variant C",
      "prompt": "A short, punchy platform game jump sound. Soft fabric whoosh with a quick puff of air, like a character pushing off the ground. Clean, not harsh. Mid-range frequencies, with more high-frequency air. Slightly muffled, organic feel. 0.3 seconds maximum. No echo or reverb.",
      "duration_seconds": 0.3,
      "prompt_influence": 0.35,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump1_03.ogg",
      "manifest_key": "sfxJump1C"
    },
    {
      "id": "sfx_player_jump1_04",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 1 - Variant D",
      "prompt": "A short, punchy platform game jump sound. Soft fabric whoosh with a quick puff of air, like a character pushing off the ground. Clean, not harsh. Mid-range frequencies, a bit deeper. Slightly muffled, organic feel. 0.3 seconds maximum. No echo or reverb.",
      "duration_seconds": 0.3,
      "prompt_influence": 0.35,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump1_04.ogg",
      "manifest_key": "sfxJump1D"
    },
    {
      "id": "sfx_player_jump2_01",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 2 - Variant A",
      "prompt": "A medium-energy platform game double jump sound. Enhanced whoosh with magical sparkle, like activating a special ability mid-air. Include subtle energy charge-up (tiny reverse whoosh), then explosive release. Brighter and more energetic than a regular jump. High-frequency shimmer. 0.4 seconds. Light airy tail.",
      "duration_seconds": 0.4,
      "prompt_influence": 0.4,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump2_01.ogg",
      "manifest_key": "sfxJump2A"
    },
    {
      "id": "sfx_player_jump2_02",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 2 - Variant B",
      "prompt": "A medium-energy platform game double jump sound. Enhanced whoosh with magical sparkle, like activating a special ability mid-air. Include subtle energy charge-up (tiny reverse whoosh), then explosive release. Brighter and more energetic than a regular jump. High-frequency shimmer. 0.4 seconds. Light airy tail. Slightly more sparkle.",
      "duration_seconds": 0.4,
      "prompt_influence": 0.4,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump2_02.ogg",
      "manifest_key": "sfxJump2B"
    },
    {
      "id": "sfx_player_jump2_03",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 2 - Variant C",
      "prompt": "A medium-energy platform game double jump sound. Enhanced whoosh with magical sparkle, like activating a special ability mid-air. Include subtle energy charge-up (tiny reverse whoosh), then explosive release. Brighter and more energetic than a regular jump. High-frequency shimmer. 0.4 seconds. Longer airy tail.",
      "duration_seconds": 0.4,
      "prompt_influence": 0.4,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump2_03.ogg",
      "manifest_key": "sfxJump2C"
    },
    {
      "id": "sfx_player_jump2_04",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 2 - Variant D",
      "prompt": "A medium-energy platform game double jump sound. Enhanced whoosh with magical sparkle, like activating a special ability mid-air. Include subtle energy charge-up (tiny reverse whoosh), then explosive release. Brighter and more energetic than a regular jump. High-frequency shimmer. 0.4 seconds. Light airy tail. Higher pitch.",
      "duration_seconds": 0.4,
      "prompt_influence": 0.4,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump2_04.ogg",
      "manifest_key": "sfxJump2D"
    },
    {
      "id": "sfx_player_jump3_01",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 3 - MEGA BUFF - Variant A",
      "prompt": "An EPIC, explosive triple jump sound for a platform game - the ultimate movement ability. MASSIVE energy burst with cinematic impact. Combine: rocket boost ignition, super smash explosion, energy beam charge-up. Full frequency spectrum - deep sub-bass rumble, punchy midrange impact, brilliant high-frequency sparkles. Include ascending pitch sweep for power-up feel. Dramatic long tail with reverb. 0.7 seconds. Hero moment. BUFF.",
      "duration_seconds": 0.7,
      "prompt_influence": 0.4,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump3_01.ogg",
      "manifest_key": "sfxJump3A"
    },
    {
      "id": "sfx_player_jump3_02",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 3 - MEGA BUFF - Variant B",
      "prompt": "An EPIC, explosive triple jump sound for a platform game - the ultimate movement ability. MASSIVE energy burst with cinematic impact. Combine: rocket boost ignition, super smash explosion, energy beam charge-up. Full frequency spectrum - deep sub-bass rumble, punchy midrange impact, brilliant high-frequency sparkles. Include ascending pitch sweep for power-up feel. Dramatic long tail with reverb. 0.7 seconds. Hero moment. BUFF. More explosive impact.",
      "duration_seconds": 0.7,
      "prompt_influence": 0.4,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump3_02.ogg",
      "manifest_key": "sfxJump3B"
    },
    {
      "id": "sfx_player_jump3_03",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 3 - MEGA BUFF - Variant C",
      "prompt": "An EPIC, explosive triple jump sound for a platform game - the ultimate movement ability. MASSIVE energy burst with cinematic impact. Combine: rocket boost ignition, super smash explosion, energy beam charge-up. Full frequency spectrum - deep sub-bass rumble, punchy midrange impact, brilliant high-frequency sparkles. Include ascending pitch sweep for power-up feel. Dramatic long tail with reverb. 0.7 seconds. Hero moment. BUFF. Longer reverb tail.",
      "duration_seconds": 0.7,
      "prompt_influence": 0.4,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump3_03.ogg",
      "manifest_key": "sfxJump3C"
    },
    {
      "id": "sfx_player_jump3_04",
      "phase": 1,
      "type": "sfx",
      "category": "player",
      "name": "Jump 3 - MEGA BUFF - Variant D",
      "prompt": "An EPIC, explosive triple jump sound for a platform game - the ultimate movement ability. MASSIVE energy burst with cinematic impact. Combine: rocket boost ignition, super smash explosion, energy beam charge-up. Full frequency spectrum - deep sub-bass rumble, punchy midrange impact, brilliant high-frequency sparkles. Include ascending pitch sweep for power-up feel. Dramatic long tail with reverb. 0.7 seconds. Hero moment. BUFF. More sparkles.",
      "duration_seconds": 0.7,
      "prompt_influence": 0.4,
      "loop": false,
      "output_path": "assets/audio/sfx/player/sfx_player_jump3_04.ogg",
      "manifest_key": "sfxJump3D"
    }
  ]
}
```

### 2. requirements.txt

Already created above. Place in `scripts/audio-generation/requirements.txt`.

---

## Implementation: Master Script

### File Structure

```
scripts/audio-generation/
├── generate_assets.py      # Main orchestrator
├── budget_guard.py         # Budget control
├── post_process.py         # Audio processing
├── assets.json             # Asset manifest
├── requirements.txt        # Dependencies
└── .env                    # API key
```

### 1. budget_guard.py

Create `scripts/audio-generation/budget_guard.py`:

```python
"""
Budget Guard for ElevenLabs API
Prevents accidental overspending by checking credits before generation.
"""

import os
import requests


class BudgetGuard:
    """Monitors and controls ElevenLabs API credit usage."""

    def __init__(self, api_key, safety_margin_credits=5000):
        self.api_key = api_key
        self.safety_margin = safety_margin_credits
        self.user_info_url = "https://api.elevenlabs.io/v1/user"
        self.headers = {"xi-api-key": self.api_key}
        self.total_estimated_cost = 0

    def get_remaining_credits(self):
        """Fetches remaining credits from the ElevenLabs API."""
        try:
            response = requests.get(self.user_info_url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            subscription = data.get("subscription", {})
            used = subscription.get("character_count", 0)
            limit = subscription.get("character_limit", 0)
            remaining = limit - used

            print(f"[BudgetGuard] Credits used: {used:,} | Limit: {limit:,} | Remaining: {remaining:,}")
            return remaining
        except requests.exceptions.RequestException as e:
            print(f"[BudgetGuard] Error fetching user info: {e}")
            return 0

    def estimate_cost(self, duration_seconds, asset_type="sfx"):
        """
        Estimates credit cost for audio generation.
        Note: This is a conservative heuristic estimate.

        Args:
            duration_seconds: Length of audio to generate
            asset_type: "sfx" or "music"

        Returns:
            Estimated credit cost (integer)
        """
        # Conservative estimates based on duration
        # SFX: ~200 credits per second
        # Music: ~300 credits per second (more complex)
        rate = 300 if asset_type == "music" else 200
        return int(duration_seconds * rate)

    def check_budget(self, duration_seconds, asset_type="sfx", asset_id="unknown"):
        """
        Checks if generation is within budget constraints.

        Args:
            duration_seconds: Length of audio to generate
            asset_type: "sfx" or "music"
            asset_id: Asset identifier for logging

        Returns:
            bool: True if budget allows, False otherwise
        """
        estimated_cost = self.estimate_cost(duration_seconds, asset_type)
        self.total_estimated_cost += estimated_cost
        remaining_credits = self.get_remaining_credits()

        if (remaining_credits - estimated_cost) > self.safety_margin:
            print(f"[BudgetGuard] ✓ PASS for '{asset_id}' | Cost: {estimated_cost:,} | After: {remaining_credits - estimated_cost:,}")
            return True
        else:
            print(f"[BudgetGuard] ✗ FAIL for '{asset_id}' | Cost: {estimated_cost:,} | After: {remaining_credits - estimated_cost:,}")
            print(f"[BudgetGuard] HALT: Insufficient credits. Safety margin: {self.safety_margin:,}")
            return False

    def summary(self):
        """Prints generation session summary."""
        print(f"\n[BudgetGuard] === Session Summary ===")
        print(f"Total estimated cost: {self.total_estimated_cost:,} credits")
        print(f"Remaining credits: {self.get_remaining_credits():,}")
```

### 2. post_process.py

Create `scripts/audio-generation/post_process.py`:

```python
"""
Post-Processing Pipeline for Audio Assets
Converts, normalizes, and prepares audio for game engine.
"""

import os
from pydub import AudioSegment
from pydub.effects import normalize as peak_normalize
import pyloudnorm as pyln
import numpy as np


def convert_to_ogg(input_path, output_path, bitrate_kbps):
    """
    Converts audio file to OGG Vorbis format.

    Args:
        input_path: Path to source audio file (MP3)
        output_path: Path to save OGG file
        bitrate_kbps: Bitrate in kbps (e.g., 192)

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        audio = AudioSegment.from_file(input_path)
        audio.export(
            output_path,
            format="ogg",
            codec="libvorbis",
            bitrate=f"{bitrate_kbps}k"
        )
        print(f"[PostProcess] ✓ Converted to OGG: {os.path.basename(output_path)}")
        return True
    except Exception as e:
        print(f"[PostProcess] ✗ Error converting {input_path}: {e}")
        return False


def normalize_sfx_peak(file_path, target_dbfs=-3.0):
    """
    Peak normalizes SFX to target dBFS.

    Args:
        file_path: Path to OGG file
        target_dbfs: Target peak level (default: -3.0 dBFS)

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        audio = AudioSegment.from_file(file_path)

        # Calculate current peak
        current_peak_dbfs = audio.max_dBFS

        # Calculate gain needed
        gain_needed = target_dbfs - current_peak_dbfs

        # Apply gain
        normalized = audio + gain_needed

        # Export
        normalized.export(file_path, format="ogg", codec="libvorbis")

        print(f"[PostProcess] ✓ Peak normalized: {os.path.basename(file_path)} ({current_peak_dbfs:.1f} → {target_dbfs:.1f} dBFS)")
        return True
    except Exception as e:
        print(f"[PostProcess] ✗ Error normalizing {file_path}: {e}")
        return False


def normalize_music_lufs(file_path, target_lufs=-16.0):
    """
    Loudness normalizes music to target LUFS.

    Args:
        file_path: Path to OGG file
        target_lufs: Target loudness level (default: -16.0 LUFS)

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Load audio
        audio = AudioSegment.from_file(file_path)

        # Convert to numpy array for pyloudnorm
        samples = np.array(audio.get_array_of_samples())

        # Reshape for stereo (if applicable)
        if audio.channels == 2:
            samples = samples.reshape((-1, 2))

        # Convert to float32
        samples = samples.astype(np.float32) / (2**15)  # Normalize to -1.0 to 1.0

        # Measure current loudness
        meter = pyln.Meter(audio.frame_rate)
        current_lufs = meter.integrated_loudness(samples)

        # Calculate gain
        gain_db = target_lufs - current_lufs

        # Apply gain to original audio
        normalized = audio + gain_db

        # Export
        normalized.export(file_path, format="ogg", codec="libvorbis")

        print(f"[PostProcess] ✓ LUFS normalized: {os.path.basename(file_path)} ({current_lufs:.1f} → {target_lufs:.1f} LUFS)")
        return True
    except Exception as e:
        print(f"[PostProcess] ✗ Error LUFS normalizing {file_path}: {e}")
        return False


def post_process_audio(raw_mp3_path, output_ogg_path, asset_type, bitrate_kbps, normalize_target):
    """
    Complete post-processing pipeline.

    Args:
        raw_mp3_path: Path to raw MP3 from API
        output_ogg_path: Final output path
        asset_type: "sfx" or "music"
        bitrate_kbps: Bitrate for OGG
        normalize_target: Target level (dBFS for SFX, LUFS for music)

    Returns:
        bool: True if all steps successful
    """
    # Step 1: Convert to OGG
    if not convert_to_ogg(raw_mp3_path, output_ogg_path, bitrate_kbps):
        return False

    # Step 2: Normalize
    if asset_type == "sfx":
        success = normalize_sfx_peak(output_ogg_path, normalize_target)
    else:  # music
        success = normalize_music_lufs(output_ogg_path, normalize_target)

    if success:
        print(f"[PostProcess] ✓ Complete: {os.path.basename(output_ogg_path)}")

    return success
```

### 3. generate_assets.py (Master Script)

Create `scripts/audio-generation/generate_assets.py`:

```python
"""
WynIsBuff2 Audio Asset Generator
Master orchestrator for automated audio generation via ElevenLabs API.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

# Import our modules
from budget_guard import BudgetGuard
from post_process import post_process_audio


# Load environment variables
load_dotenv()

# Configuration
API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not API_KEY:
    print("ERROR: ELEVENLABS_API_KEY not found in .env file!")
    sys.exit(1)

# Paths
SCRIPT_DIR = Path(__file__).parent
ASSETS_JSON = SCRIPT_DIR / "assets.json"
RAW_OUTPUT_DIR = SCRIPT_DIR / "_raw_output"
LOG_DIR = SCRIPT_DIR / "_logs"

# Ensure directories exist
RAW_OUTPUT_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)


class AudioGenerator:
    """Main orchestrator for audio generation."""

    def __init__(self, api_key, assets_manifest_path):
        self.client = ElevenLabs(api_key=api_key)

        # Load manifest
        with open(assets_manifest_path, 'r') as f:
            self.manifest = json.load(f)

        # Initialize budget guard
        safety_margin = self.manifest["budget"]["safety_margin_credits"]
        self.budget_guard = BudgetGuard(api_key, safety_margin)

        # Technical standards
        self.standards = self.manifest["technical_standards"]

        # Results tracking
        self.results = {
            "generated": [],
            "failed": [],
            "skipped": []
        }

    def generate_sfx(self, asset):
        """Generate a single SFX asset."""
        asset_id = asset["id"]

        print(f"\n[Generate] Starting: {asset_id}")
        print(f"           Prompt: {asset['prompt'][:80]}...")

        # Budget check
        if not self.budget_guard.check_budget(
            asset["duration_seconds"],
            asset["type"],
            asset_id
        ):
            self.results["skipped"].append(asset_id)
            return False

        try:
            # API call
            print(f"[Generate] Calling ElevenLabs API...")
            audio_bytes = self.client.text_to_sound_effects.convert(
                text=asset["prompt"],
                duration_seconds=asset.get("duration_seconds"),
                prompt_influence=asset.get("prompt_influence", 0.3)
            )

            # Save raw MP3
            raw_filename = f"{asset_id}_raw.mp3"
            raw_path = RAW_OUTPUT_DIR / raw_filename

            with open(raw_path, "wb") as f:
                for chunk in audio_bytes:
                    f.write(chunk)

            print(f"[Generate] ✓ Raw audio downloaded: {raw_filename}")

            # Post-process
            output_path = Path(asset["output_path"])
            output_path.parent.mkdir(parents=True, exist_ok=True)

            success = post_process_audio(
                raw_mp3_path=str(raw_path),
                output_ogg_path=str(output_path),
                asset_type=asset["type"],
                bitrate_kbps=self.standards["sfx_bitrate_kbps"],
                normalize_target=self.standards["sfx_peak_normalization_dbfs"]
            )

            if success:
                self.results["generated"].append({
                    "id": asset_id,
                    "manifest_key": asset["manifest_key"],
                    "path": str(output_path)
                })
                print(f"[Generate] ✓ SUCCESS: {asset_id}\n")
                return True
            else:
                self.results["failed"].append(asset_id)
                return False

        except Exception as e:
            print(f"[Generate] ✗ ERROR generating {asset_id}: {e}")
            self.results["failed"].append(asset_id)
            return False

    def generate_music(self, asset):
        """Generate a single music track."""
        # TODO: Implement music generation with composition_plan
        # This will use the /v1/music/plan and /v1/music/compose endpoints
        print(f"[Generate] Music generation not yet implemented: {asset['id']}")
        self.results["skipped"].append(asset["id"])
        return False

    def generate_assets(self, phase_filter=None, asset_id_filter=None):
        """
        Generate assets based on filters.

        Args:
            phase_filter: Only generate assets in this phase (e.g., 1)
            asset_id_filter: Only generate this specific asset ID
        """
        assets_to_generate = []

        # Filter assets
        for asset in self.manifest["assets"]:
            if asset_id_filter and asset["id"] != asset_id_filter:
                continue
            if phase_filter and asset.get("phase") != phase_filter:
                continue
            assets_to_generate.append(asset)

        if not assets_to_generate:
            print("No assets match the filter criteria.")
            return

        print(f"\n{'='*70}")
        print(f"WynIsBuff2 Audio Generator - Starting Generation")
        print(f"{'='*70}")
        print(f"Assets to generate: {len(assets_to_generate)}")
        print(f"Phase filter: {phase_filter or 'All'}")
        print(f"Asset filter: {asset_id_filter or 'All'}")
        print(f"{'='*70}\n")

        # Generate each asset
        for i, asset in enumerate(assets_to_generate, 1):
            print(f"\n>>> Asset {i}/{len(assets_to_generate)}")

            if asset["type"] == "sfx":
                self.generate_sfx(asset)
            elif asset["type"] == "music":
                self.generate_music(asset)

        # Print summary
        self.print_summary()

        # Save results log
        self.save_results_log()

    def print_summary(self):
        """Print generation summary."""
        print(f"\n{'='*70}")
        print("Generation Summary")
        print(f"{'='*70}")
        print(f"✓ Generated: {len(self.results['generated'])}")
        print(f"✗ Failed: {len(self.results['failed'])}")
        print(f"- Skipped: {len(self.results['skipped'])}")

        if self.results["failed"]:
            print(f"\nFailed assets:")
            for asset_id in self.results["failed"]:
                print(f"  - {asset_id}")

        self.budget_guard.summary()
        print(f"{'='*70}\n")

    def save_results_log(self):
        """Save generation results to log file."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = LOG_DIR / f"generation_log_{timestamp}.json"

        with open(log_file, 'w') as f:
            json.dump(self.results, f, indent=2)

        print(f"[Log] Results saved to: {log_file}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="WynIsBuff2 Audio Asset Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python generate_assets.py --phase 1                    # Generate all Phase 1 assets (Bug #4 fix)
  python generate_assets.py --asset sfx_player_jump3_01  # Generate single asset
  python generate_assets.py                              # Generate all assets
        """
    )

    parser.add_argument(
        '--phase',
        type=int,
        help='Generate only assets in this phase (e.g., 1 for Bug #4 fix)'
    )

    parser.add_argument(
        '--asset',
        type=str,
        help='Generate only this specific asset ID'
    )

    args = parser.parse_args()

    # Create generator
    generator = AudioGenerator(API_KEY, ASSETS_JSON)

    # Run generation
    generator.generate_assets(
        phase_filter=args.phase,
        asset_id_filter=args.asset
    )


if __name__ == "__main__":
    main()
```

---

## Phase 1 Implementation (Bug #4 Fix)

### Quick Start: Generate Jump Sounds

Now that everything is set up, generate the Phase 1 assets (all jump sounds for Bug #4 fix):

```bash
# Activate virtual environment
cd scripts/audio-generation
source ../../audio-generation-venv/bin/activate

# Generate Phase 1 assets (12 jump sounds)
python generate_assets.py --phase 1
```

**Expected Output**:
```
======================================================================
WynIsBuff2 Audio Generator - Starting Generation
======================================================================
Assets to generate: 12
Phase filter: 1
Asset filter: All
======================================================================

>>> Asset 1/12

[Generate] Starting: sfx_player_jump1_01
           Prompt: A short, punchy platform game jump sound. Soft fabric whoosh with a quick...
[BudgetGuard] Credits used: 50,000 | Limit: 100,000 | Remaining: 50,000
[BudgetGuard] ✓ PASS for 'sfx_player_jump1_01' | Cost: 60 | After: 49,940
[Generate] Calling ElevenLabs API...
[Generate] ✓ Raw audio downloaded: sfx_player_jump1_01_raw.mp3
[PostProcess] ✓ Converted to OGG: sfx_player_jump1_01.ogg
[PostProcess] ✓ Peak normalized: sfx_player_jump1_01.ogg (-1.2 → -3.0 dBFS)
[PostProcess] ✓ Complete: sfx_player_jump1_01.ogg
[Generate] ✓ SUCCESS: sfx_player_jump1_01

... (continues for all 12 sounds) ...

======================================================================
Generation Summary
======================================================================
✓ Generated: 12
✗ Failed: 0
- Skipped: 0

[BudgetGuard] === Session Summary ===
Total estimated cost: 720 credits
Remaining credits: 49,280
======================================================================
```

### Verify Output

Check generated files:

```bash
ls -lh ../../assets/audio/sfx/player/
```

Should see:
```
sfx_player_jump1_01.ogg
sfx_player_jump1_02.ogg
sfx_player_jump1_03.ogg
sfx_player_jump1_04.ogg
sfx_player_jump2_01.ogg
sfx_player_jump2_02.ogg
sfx_player_jump2_03.ogg
sfx_player_jump2_04.ogg
sfx_player_jump3_01.ogg
sfx_player_jump3_02.ogg
sfx_player_jump3_03.ogg
sfx_player_jump3_04.ogg
```

### Test Single Asset

To test a single sound before batch generation:

```bash
python generate_assets.py --asset sfx_player_jump3_01
```

---

## Testing & Validation

### 1. Audio Quality Check

Listen to generated files and verify:
- [ ] Correct duration (Jump 1: ~0.3s, Jump 2: ~0.4s, Jump 3: ~0.7s)
- [ ] No clipping or distortion
- [ ] Clean start/end (no pops or clicks)
- [ ] Appropriate volume levels
- [ ] Variants are similar but distinct

### 2. Technical Validation

Check file properties:

```bash
# Install mediainfo (if not already)
brew install mediainfo  # macOS

# Check file
mediainfo assets/audio/sfx/player/sfx_player_jump1_01.ogg
```

Verify:
- Format: Ogg Vorbis
- Sample rate: 44.1 kHz
- Bit depth: 16-bit (from source)
- Bitrate: ~192 kbps

### 3. Integration Test

Update `manifest.json` to reference new audio files:

```json
{
  "type": "audio",
  "key": "sfxJump1A",
  "path": "audio/sfx/player/sfx_player_jump1_01.ogg"
},
{
  "type": "audio",
  "key": "sfxJump1B",
  "path": "audio/sfx/player/sfx_player_jump1_02.ogg"
}
```

Then run:
```bash
npm run generate-assets
```

Test in-game by running dev server and performing jumps.

---

## Cost Tracking & Budget Management

### Budget Breakdown (Phase 1)

**12 Jump Sounds**:
- Jump 1 (4 variants): 4 × 0.3s = 1.2s × 200 credits/s = 240 credits
- Jump 2 (4 variants): 4 × 0.4s = 1.6s × 200 credits/s = 320 credits
- Jump 3 (4 variants): 4 × 0.7s = 2.8s × 200 credits/s = 560 credits
- **Total**: ~1,120 credits

**Cost Estimate**:
- ElevenLabs Creator plan: 100,000 credits/month
- Phase 1 uses: ~1.1% of monthly credits
- Estimated USD: ~$0.50-1.00

### Monitor Usage

Check remaining credits:

```bash
python -c "from budget_guard import BudgetGuard; import os; from dotenv import load_dotenv; load_dotenv(); guard = BudgetGuard(os.getenv('ELEVENLABS_API_KEY')); guard.get_remaining_credits()"
```

### Hard Limits

Remember the **project-specific API key** has a hard limit of $50. If approaching:
1. Stop generation
2. Review results
3. Adjust budget in `assets.json`
4. Request increased limit or create new key

---

## Next Steps

After Phase 1 success:

1. **Expand assets.json**: Add landing sounds, collectibles, etc.
2. **Implement Music Generation**: Add `generate_music()` logic with composition_plan
3. **Batch Process**: Generate all phases sequentially
4. **Automate Integration**: Update manifest.json automatically
5. **Quality Assurance**: Implement automated audio validation

---

## Troubleshooting

### Issue: API Key Error

**Error**: `ELEVENLABS_API_KEY not found`

**Solution**:
```bash
# Verify .env exists
ls -la scripts/audio-generation/.env

# Check contents (don't commit!)
cat scripts/audio-generation/.env

# Should see:
ELEVENLABS_API_KEY="sk_..."
```

### Issue: FFmpeg Not Found

**Error**: `FileNotFoundError: ffmpeg`

**Solution**:
```bash
# Verify FFmpeg installed
ffmpeg -version

# If not installed:
brew install ffmpeg  # macOS
```

### Issue: Budget Check Fails

**Error**: `Budget check FAILED`

**Solution**:
- Check remaining credits via ElevenLabs dashboard
- Adjust `safety_margin_credits` in `assets.json`
- Consider upgrading plan or creating new project key

### Issue: Poor Audio Quality

**Symptoms**: Sounds don't match specification

**Solution**:
- Adjust `prompt_influence` (higher = more faithful to prompt)
- Refine prompts with more detail
- Regenerate with different variants
- Check normalization levels

---

## Related Documentation

- **AUDIO_DESIGN_SPECIFICATION.md**: Artistic specifications and prompts
- **elevenlabs_info.md**: Technical framework and API details
- **ASSET_GENERATION_MIGRATION_PLAN.md**: Long-term migration strategy
- **BUG_INVESTIGATION_REPORT.md**: Bug #4 details (missing audio)

---

**Status**: ✅ Ready for Production Use
**Last Updated**: 2025-10-30
**Version**: 1.0
**Maintainer**: Claude Code AI Assistant

---

**Next Actions**:
1. Set up Python environment
2. Install dependencies
3. Configure .env with API key
4. Run Phase 1 generation
5. Test jump sounds in-game
6. Expand to remaining phases
