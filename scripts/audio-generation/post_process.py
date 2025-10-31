#!/usr/bin/env python3
"""
Audio Post-Processing Pipeline

Handles conversion and normalization of generated audio assets:
1. Convert MP3 to OGG Vorbis format
2. Apply peak normalization for SFX (-3 dBFS)
3. Apply loudness normalization for music (-16 LUFS)
"""

import os
import subprocess
from pathlib import Path
from pydub import AudioSegment
import pyloudnorm as pyln
import soundfile as sf
import numpy as np


def convert_to_ogg(
    input_path: str,
    output_path: str,
    bitrate_kbps: int = 192
) -> bool:
    """
    Convert audio file to OGG Vorbis format.

    Args:
        input_path: Path to input audio file (any format supported by pydub)
        output_path: Path for output OGG file
        bitrate_kbps: Target bitrate in kbps (default 192)

    Returns:
        True if successful, False otherwise
    """
    try:
        audio = AudioSegment.from_file(input_path)
        audio.export(
            output_path,
            format="ogg",
            codec="libvorbis",
            bitrate=f"{bitrate_kbps}k"
        )
        print(f"   ✅ Converted to OGG: {output_path}")
        return True
    except Exception as e:
        print(f"   ❌ Conversion failed: {e}")
        return False


def normalize_sfx_peak(file_path: str, target_dbfs: float = -3.0) -> bool:
    """
    Apply peak normalization to SFX file.

    Peak normalization adjusts the audio so the loudest peak reaches the target level.
    Suitable for SFX where dynamic range preservation is important.

    Args:
        file_path: Path to audio file (will be modified in place)
        target_dbfs: Target peak level in dBFS (default -3.0)

    Returns:
        True if successful, False otherwise
    """
    try:
        audio = AudioSegment.from_file(file_path)

        # Calculate current peak and required adjustment
        current_peak_db = audio.max_dBFS
        adjustment_db = target_dbfs - current_peak_db

        # Apply gain adjustment
        normalized = audio.apply_gain(adjustment_db)

        # Export back to same file
        normalized.export(
            file_path,
            format="ogg",
            codec="libvorbis"
        )

        print(f"   ✅ Peak normalized: {current_peak_db:.1f} dBFS → {target_dbfs:.1f} dBFS")
        return True
    except Exception as e:
        print(f"   ❌ Peak normalization failed: {e}")
        return False


def normalize_music_lufs(file_path: str, target_lufs: float = -16.0) -> bool:
    """
    Apply loudness normalization (LUFS) to music file.

    LUFS (Loudness Units Full Scale) normalization maintains perceived loudness
    across different tracks. Suitable for music where consistent volume matters.

    Args:
        file_path: Path to audio file (will be modified in place)
        target_lufs: Target loudness in LUFS (default -16.0)

    Returns:
        True if successful, False otherwise
    """
    try:
        # Read audio file
        data, rate = sf.read(file_path)

        # Ensure stereo (pyloudnorm expects stereo)
        if len(data.shape) == 1:
            data = np.column_stack((data, data))

        # Create loudness meter
        meter = pyln.Meter(rate)

        # Measure current loudness
        current_loudness = meter.integrated_loudness(data)

        # Normalize to target
        normalized_data = pyln.normalize.loudness(data, current_loudness, target_lufs)

        # Write back
        sf.write(file_path, normalized_data, rate, format='OGG', subtype='VORBIS')

        print(f"   ✅ LUFS normalized: {current_loudness:.1f} LUFS → {target_lufs:.1f} LUFS")
        return True
    except Exception as e:
        print(f"   ❌ LUFS normalization failed: {e}")
        return False


def post_process_audio(
    raw_mp3_path: str,
    output_ogg_path: str,
    asset_type: str,
    bitrate_kbps: int = 192,
    normalize_target: float = None
) -> bool:
    """
    Complete post-processing pipeline for generated audio.

    Workflow:
    1. Convert MP3 to OGG Vorbis
    2. Apply appropriate normalization (peak for SFX, LUFS for music)
    3. Clean up intermediate files

    Args:
        raw_mp3_path: Path to raw MP3 from ElevenLabs
        output_ogg_path: Path for final processed OGG file
        asset_type: "sfx" or "music"
        bitrate_kbps: OGG bitrate (default 192 for SFX, use 256 for music)
        normalize_target: Override default normalization target

    Returns:
        True if entire pipeline succeeded, False otherwise
    """
    print(f"🔧 Post-processing: {Path(output_ogg_path).name}")

    # Ensure output directory exists
    output_dir = Path(output_ogg_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: Convert to OGG
    success = convert_to_ogg(raw_mp3_path, output_ogg_path, bitrate_kbps)
    if not success:
        return False

    # Step 2: Normalize based on asset type
    if asset_type == "music":
        target = normalize_target if normalize_target else -16.0
        success = normalize_music_lufs(output_ogg_path, target)
    else:  # sfx
        target = normalize_target if normalize_target else -3.0
        success = normalize_sfx_peak(output_ogg_path, target)

    if not success:
        return False

    # Step 3: Clean up raw MP3 (optional - comment out to keep originals)
    # try:
    #     os.remove(raw_mp3_path)
    #     print(f"   🗑️  Removed raw MP3")
    # except Exception as e:
    #     print(f"   ⚠️  Could not remove raw MP3: {e}")

    print(f"   ✨ Post-processing complete\n")
    return True


def batch_post_process(
    input_dir: str,
    output_dir: str,
    asset_type: str = "sfx",
    bitrate_kbps: int = 192
) -> int:
    """
    Post-process all MP3 files in a directory.

    Args:
        input_dir: Directory containing raw MP3 files
        output_dir: Directory for processed OGG files
        asset_type: "sfx" or "music"
        bitrate_kbps: Target bitrate

    Returns:
        Number of successfully processed files
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    output_path.mkdir(parents=True, exist_ok=True)

    mp3_files = list(input_path.glob("*.mp3"))
    success_count = 0

    print(f"📦 Batch processing {len(mp3_files)} MP3 files...")
    print(f"   Input: {input_dir}")
    print(f"   Output: {output_dir}\n")

    for mp3_file in mp3_files:
        ogg_file = output_path / (mp3_file.stem + ".ogg")

        if post_process_audio(
            str(mp3_file),
            str(ogg_file),
            asset_type,
            bitrate_kbps
        ):
            success_count += 1

    print(f"✅ Batch complete: {success_count}/{len(mp3_files)} files processed")
    return success_count


if __name__ == "__main__":
    # Self-test with command-line interface
    import argparse

    parser = argparse.ArgumentParser(
        description="Post-process audio files (convert and normalize)"
    )
    parser.add_argument(
        "input",
        help="Input MP3 file or directory"
    )
    parser.add_argument(
        "output",
        help="Output OGG file or directory"
    )
    parser.add_argument(
        "--type",
        choices=["sfx", "music"],
        default="sfx",
        help="Asset type (default: sfx)"
    )
    parser.add_argument(
        "--bitrate",
        type=int,
        default=192,
        help="OGG bitrate in kbps (default: 192)"
    )
    parser.add_argument(
        "--batch",
        action="store_true",
        help="Batch process directory"
    )

    args = parser.parse_args()

    if args.batch:
        batch_post_process(args.input, args.output, args.type, args.bitrate)
    else:
        post_process_audio(args.input, args.output, args.type, args.bitrate)
