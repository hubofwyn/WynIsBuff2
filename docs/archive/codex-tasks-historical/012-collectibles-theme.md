Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 3

# Themed Collectibles for Level 1

# Task: Use buff-themed icons for collectibles in level1.
  - Updated `src/scenes/Preloader.js` to load `collectible-protein` and `collectible-dumbbell` textures.
  - Modified `CollectibleManager.createCollectibles()` to use sprite key `collectible-<type>` when available, otherwise fallback to colored circle.
  - Sized icons to 30×30 for consistency.
  - Particle effects remain color-based per type (gold for protein, silver for dumbbell).

## Change Log
- Loaded themed collectible sprites (`collectible-protein`, `collectible-dumbbell`) in Preloader.
- Enhanced `CollectibleManager` to detect and render icon sprites based on type.