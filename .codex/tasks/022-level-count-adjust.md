Status: READY
Owner: phaser-coder
Scope: chore
Estimate: 1

# Adjust Level Count

Task: Limit the initial game to the first 3 levels for a concise experience:
  - Update `LevelData` in `src/constants/LevelData.js` to include only `level1`, `level2`, and `level3`; remove or comment out beyond.
  - Update `MainMenu` level selection UI to display only available levels.
  - Ensure level progress and next-level logic (`LevelManager.nextLevel()`) handles end-of-game appropriately (transition to `GameOver`).