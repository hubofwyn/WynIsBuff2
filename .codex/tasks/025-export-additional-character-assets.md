Status: READY
Owner: phaser-coder
Scope: chore
Estimate: 1

# Export Additional Character Assets

Task: Ensure the following character sprite assets are exported and available under `assets/images/characters/`:
  - `ila_sprite.png` (Favorite Sister)
  - `axel_sprite.png` (Not Buff Axel)
  - `wyn_sprite.png` (Wyn the Buff)
  - `axelface.png` (Boss placeholder)
  
Steps:
  • Export from corresponding `.aseprite` files using Aseprite CLI or editor:
      aseprite -b ila_sprite.aseprite --save-as ila_sprite.png
      aseprite -b axel_sprite.aseprite --save-as axel_sprite.png
      aseprite -b wyn_sprite.aseprite --save-as wyn_sprite.png
  • Optimize PNGs (e.g., pngquant) and copy to `assets/images/characters/`.