Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 2

# Level 1 Theme Configuration

Task: Update the LevelData for the first level (level1) to reflect the “Wyn is Buff” theme.
  - Open `src/constants/LevelData.js` (or equivalent) and locate the config for level1.
  - Set `background.color` or `background.image` to the buff-themed background (e.g., `assets/images/backgrounds/buff-bg.png`).
  - Update `ui.instructionText` and `ui.themeColor` fields to use bold, vibrant colors (e.g., neon green or yellow).
  - Add a new `environment` section in the config for level1 with theme metadata (e.g., `theme: 'wyn-is-buff'`).
  - Ensure LevelLoader picks up these new config fields when initializing.
  
## Change Log
- Added `background.image` key (`buff-bg`), `ui.themeColor`, and `environment.theme` fields to level1 in LevelData.