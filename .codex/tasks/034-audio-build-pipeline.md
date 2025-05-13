Status: READY
Owner: phaser-coder
Scope: chore
Estimate: 2

# Audio Asset Build Pipeline

Task: Automate audio format generation and enforce LFS for large source assets.
  - Add FFmpeg-based npm script (`npm run build:audio`) to transcode WAV sources in `assets/audio_src/` to 320kbps MP3 and OGG (q=5) in `assets/sounds/`.
  - Update `.gitignore` / `.gitattributes` to track raw WAV, RPP, PSD/ASE, and spritesheet binaries via Git LFS.
  - Integrate audio build step into CI (e.g., via `prebuild` in `package.json`).
  - Add basic automation test to verify presence and integrity of built audio files.

# Change Log
*TBD after implementation.*