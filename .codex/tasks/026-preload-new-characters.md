Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 1

# Preload New Character Sprites

Task: Update `src/scenes/Preloader.js` to load the additional character sprite assets:
  • `ila_sprite`
  • `axel_sprite`
  • `wyn_sprite`
  • `axelface` (already loaded)
  
Ensure paths match `assets/images/characters/<file>.png` and use `this.load.image(key, url)`.

## Change Log
- Added `ila_sprite`, `axel_sprite`, and `wyn_sprite` image loads in `Preloader.js` (assets/images/characters).