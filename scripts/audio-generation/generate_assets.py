#!/usr/bin/env python3
"""
ElevenLabs Audio Asset Generator for WynIsBuff2

Main orchestration script for generating game audio assets using ElevenLabs API.
Supports SFX (Sound Generation API) and Music (Music API) generation with
budget control, post-processing, and manifest-driven workflow.

Usage:
    python generate_assets.py --phase 1              # Generate Phase 1 assets
    python generate_assets.py --asset sfx_jump1_01   # Generate specific asset
    python generate_assets.py --all                  # Generate all assets
    python generate_assets.py --dry-run --phase 1    # Preview without generating
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from dotenv import load_dotenv

# Import ElevenLabs SDK
try:
    from elevenlabs.client import ElevenLabs
except ImportError:
    print("❌ ElevenLabs SDK not installed. Run: pip install elevenlabs")
    sys.exit(1)

# Import local modules
from budget_guard import BudgetGuard
from post_process import post_process_audio


class AudioGenerator:
    """
    Main orchestrator for ElevenLabs audio asset generation.

    Handles:
    - Loading asset manifest
    - Budget checking
    - API calls (SFX and Music)
    - Post-processing pipeline
    - Result tracking
    """

    def __init__(
        self,
        api_key: str,
        assets_manifest_path: str,
        safety_margin_credits: int = 5000,
        dry_run: bool = False
    ):
        """
        Initialize AudioGenerator.

        Args:
            api_key: ElevenLabs API key
            assets_manifest_path: Path to assets.json manifest
            safety_margin_credits: Minimum credits to keep as buffer
            dry_run: If True, preview actions without executing
        """
        self.api_key = api_key
        self.dry_run = dry_run
        self.client = ElevenLabs(api_key=api_key) if not dry_run else None
        self.budget_guard = BudgetGuard(api_key, safety_margin_credits)

        # Load manifest
        with open(assets_manifest_path, 'r') as f:
            self.manifest = json.load(f)

        self.assets = self.manifest.get("assets", [])
        self.technical_standards = self.manifest.get("technical_standards", {})

        # Results tracking
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "total_attempted": 0,
            "total_successful": 0,
            "total_failed": 0,
            "total_skipped": 0,
            "total_credits_used": 0,
            "assets": []
        }

    def generate_sfx(self, asset: Dict) -> bool:
        """
        Generate a single SFX asset using Sound Generation API.

        Args:
            asset: Asset definition from manifest

        Returns:
            True if successful, False otherwise
        """
        asset_id = asset["id"]
        prompt = asset["prompt"]
        duration = asset["duration_seconds"]
        prompt_influence = asset.get("prompt_influence", 0.3)
        output_path = asset["output_path"]

        print(f"\n🎵 Generating SFX: {asset_id}")
        print(f"   Name: {asset.get('name', 'N/A')}")
        print(f"   Duration: {duration}s")
        print(f"   Prompt influence: {prompt_influence}")

        # Budget check
        can_proceed, budget_msg, remaining, estimated_cost = self.budget_guard.check_budget(
            duration, "sfx", asset_id
        )
        print(f"   {budget_msg}")

        if not can_proceed:
            return False

        if self.dry_run:
            print(f"   🔍 DRY RUN: Would generate {asset_id}")
            return True

        try:
            # Call ElevenLabs Sound Generation API
            print(f"   🌐 Calling ElevenLabs API...")
            audio_bytes = self.client.text_to_sound_effects.convert(
                text=prompt,
                duration_seconds=duration,
                prompt_influence=prompt_influence
            )

            # Save raw MP3
            raw_mp3_path = output_path.replace(".ogg", "_raw.mp3")
            Path(raw_mp3_path).parent.mkdir(parents=True, exist_ok=True)

            with open(raw_mp3_path, "wb") as f:
                f.write(audio_bytes)

            print(f"   ✅ Generated raw audio: {raw_mp3_path}")

            # Post-process (convert to OGG + normalize)
            bitrate = self.technical_standards.get("sfx_bitrate_kbps", 192)
            normalize_target = self.technical_standards.get("sfx_peak_normalization_dbfs", -3.0)

            success = post_process_audio(
                raw_mp3_path,
                output_path,
                asset_type="sfx",
                bitrate_kbps=bitrate,
                normalize_target=normalize_target
            )

            if success:
                self.results["total_credits_used"] += estimated_cost
                return True
            else:
                return False

        except Exception as e:
            print(f"   ❌ Generation failed: {e}")
            return False

    def generate_music(self, asset: Dict) -> bool:
        """
        Generate a single music asset using Music API.

        Args:
            asset: Asset definition from manifest

        Returns:
            True if successful, False otherwise
        """
        asset_id = asset["id"]
        prompt = asset["prompt"]
        duration = asset["duration_seconds"]
        output_path = asset["output_path"]

        print(f"\n🎼 Generating Music: {asset_id}")
        print(f"   Name: {asset.get('name', 'N/A')}")
        print(f"   Duration: {duration}s")

        # Budget check
        can_proceed, budget_msg, remaining, estimated_cost = self.budget_guard.check_budget(
            duration, "music", asset_id
        )
        print(f"   {budget_msg}")

        if not can_proceed:
            return False

        if self.dry_run:
            print(f"   🔍 DRY RUN: Would generate {asset_id}")
            return True

        try:
            # Step 1: Plan composition
            print(f"   🎹 Planning composition...")
            composition_plan = self.client.music.plan(
                prompt=prompt,
                duration_seconds=duration
            )

            # Step 2: Compose music
            print(f"   🌐 Composing music...")
            audio_bytes = self.client.music.compose(
                composition_plan=composition_plan
            )

            # Save raw MP3
            raw_mp3_path = output_path.replace(".ogg", "_raw.mp3")
            Path(raw_mp3_path).parent.mkdir(parents=True, exist_ok=True)

            with open(raw_mp3_path, "wb") as f:
                f.write(audio_bytes)

            print(f"   ✅ Generated raw audio: {raw_mp3_path}")

            # Post-process (convert to OGG + normalize)
            bitrate = self.technical_standards.get("music_bitrate_kbps", 256)
            normalize_target = self.technical_standards.get("music_loudness_normalization_lufs", -16.0)

            success = post_process_audio(
                raw_mp3_path,
                output_path,
                asset_type="music",
                bitrate_kbps=bitrate,
                normalize_target=normalize_target
            )

            if success:
                self.results["total_credits_used"] += estimated_cost
                return True
            else:
                return False

        except Exception as e:
            print(f"   ❌ Generation failed: {e}")
            return False

    def generate_assets(
        self,
        phase_filter: Optional[int] = None,
        asset_id_filter: Optional[str] = None,
        generate_all: bool = False
    ) -> Dict:
        """
        Main generation loop with filtering options.

        Args:
            phase_filter: Only generate assets from this phase
            asset_id_filter: Only generate this specific asset ID
            generate_all: Generate all assets (ignores other filters)

        Returns:
            Results dictionary with generation statistics
        """
        # Filter assets
        assets_to_generate = []

        for asset in self.assets:
            if generate_all:
                assets_to_generate.append(asset)
            elif asset_id_filter and asset["id"] == asset_id_filter:
                assets_to_generate.append(asset)
            elif phase_filter and asset.get("phase") == phase_filter:
                assets_to_generate.append(asset)

        if not assets_to_generate:
            print("⚠️  No assets matched the filter criteria")
            return self.results

        # Summary
        print("=" * 70)
        print(f"🎮 WynIsBuff2 Audio Generation")
        print(f"   Assets to generate: {len(assets_to_generate)}")
        if phase_filter:
            print(f"   Phase filter: {phase_filter}")
        if asset_id_filter:
            print(f"   Asset filter: {asset_id_filter}")
        if self.dry_run:
            print(f"   Mode: DRY RUN (preview only)")
        print("=" * 70)

        # Generate each asset
        for asset in assets_to_generate:
            self.results["total_attempted"] += 1
            asset_type = asset.get("type", "sfx")

            # Check if already exists
            output_path = asset["output_path"]
            if Path(output_path).exists():
                print(f"\n⏭️  Skipping {asset['id']}: Already exists at {output_path}")
                self.results["total_skipped"] += 1
                continue

            # Generate based on type
            if asset_type == "music":
                success = self.generate_music(asset)
            else:  # sfx
                success = self.generate_sfx(asset)

            # Track result
            asset_result = {
                "id": asset["id"],
                "success": success,
                "timestamp": datetime.now().isoformat()
            }
            self.results["assets"].append(asset_result)

            if success:
                self.results["total_successful"] += 1
            else:
                self.results["total_failed"] += 1

        # Final summary
        print("\n" + "=" * 70)
        print("📊 Generation Summary")
        print(f"   Total attempted: {self.results['total_attempted']}")
        print(f"   ✅ Successful: {self.results['total_successful']}")
        print(f"   ❌ Failed: {self.results['total_failed']}")
        print(f"   ⏭️  Skipped: {self.results['total_skipped']}")
        if not self.dry_run:
            print(f"   💰 Credits used: ~{self.results['total_credits_used']:,}")
        print("=" * 70)

        # Save results
        if not self.dry_run:
            results_file = f"generation_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(results_file, 'w') as f:
                json.dump(self.results, f, indent=2)
            print(f"\n📄 Results saved to: {results_file}")

        return self.results


def main():
    """Command-line interface."""
    parser = argparse.ArgumentParser(
        description="Generate audio assets for WynIsBuff2 using ElevenLabs"
    )

    # Generation filters
    filter_group = parser.add_mutually_exclusive_group(required=True)
    filter_group.add_argument(
        "--phase",
        type=int,
        help="Generate all assets for a specific phase (e.g., --phase 1)"
    )
    filter_group.add_argument(
        "--asset",
        type=str,
        help="Generate a specific asset by ID (e.g., --asset sfx_jump1_01)"
    )
    filter_group.add_argument(
        "--all",
        action="store_true",
        help="Generate all assets in manifest"
    )

    # Options
    parser.add_argument(
        "--manifest",
        type=str,
        default="assets.json",
        help="Path to assets manifest (default: assets.json)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview generation without actually calling API"
    )
    parser.add_argument(
        "--safety-margin",
        type=int,
        default=5000,
        help="Credit safety margin (default: 5000)"
    )

    args = parser.parse_args()

    # Load environment
    load_dotenv()
    api_key = os.getenv("ELEVENLABS_API_KEY")

    if not api_key:
        print("❌ Error: ELEVENLABS_API_KEY not found in environment")
        print("   Create a .env file with: ELEVENLABS_API_KEY=sk_your_key_here")
        sys.exit(1)

    # Initialize generator
    generator = AudioGenerator(
        api_key=api_key,
        assets_manifest_path=args.manifest,
        safety_margin_credits=args.safety_margin,
        dry_run=args.dry_run
    )

    # Generate
    generator.generate_assets(
        phase_filter=args.phase,
        asset_id_filter=args.asset,
        generate_all=args.all
    )


if __name__ == "__main__":
    main()
