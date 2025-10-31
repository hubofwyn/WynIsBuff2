Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 3

# Level 1 Parallax Background

Task: Implement a multi-layer parallax background for level1 to enhance the “Wyn is Buff” environment.

- In the LevelLoader (`src/modules/level/LevelLoader.js`), extend `initializeLevel()` to load and position multiple background layers.
- Create or reference buff-themed background images in `assets/images/backgrounds/` (e.g., `layer1-sky.png`, `layer2-mountains.png`, `layer3-forests.png`).
- Add these layers to the scene with different scroll factors (e.g., 0.2, 0.5, 0.8).
- Ensure the Game scene’s camera follows the player while the parallax layers move appropriately.
- Test scrolling to verify depth illusion.

## Change Log

- Added parallax layers support:
    - Preloaded layer images in Preloader
    - Extended LevelData with background.layers config
    - Rendered layers with scrollFactor in LevelLoader.setupBackground
