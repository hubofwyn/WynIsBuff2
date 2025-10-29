Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 5

# Audio Manager & Preload Audio Assets

Task: Integrate central AudioManager using Howler.js and preload all background music and sound effects according to audio requirements.
  - Create `src/modules/AudioManager.js` wrapping Howler.js: support MP3 + OGG fallback, stream BGM, decode-on-load SFX, and 2D stereo pan API.
  - Standardize asset keys and file paths:
      • `proteinPixelAnthem` → `assets/sounds/opener/protein-pixel-anthem.mp3` (+ `.ogg` fallback)
      • `hyperBuffBlitz` → `assets/sounds/background/hyper-buff-blitz.mp3` (+ `.ogg` fallback)
      • `sfxJump` → appropriate jump variant (e.g., `jump.mp3`)
      • `sfxLand` → random pick from `assets/sounds/land-effects/land*.mp3`
      • `sfxPickup` → random pick from `assets/sounds/pickup-effects/pickup*.mp3`
      • `sfxClick` → random pick from `assets/sounds/primary-click/click*.mp3`
      • `sfxHover` → random pick from `assets/sounds/ui-hover/hover*.mp3`
  - Update `Preloader.js` to load all sound assets with `this.load.audio(key, [mp3Path, oggPath])`.
  - Ensure BGM assets are streamed (e.g., `stream: true`) and SFX are fully decoded on load.
  - Add initial tests or logs to verify sounds are loaded and AudioManager initialization succeeds.

# Change Log
- Implemented `AudioManager` singleton with Howler.js in `src/modules/AudioManager.js`.
- Updated `Preloader.js` to load all BGM and SFX assets using `this.load.audio`.
- Verified audio assets are preloaded and `AudioManager.getInstance()` initializes without errors.