# Kenney Platformer Pack Redux - Asset Reference

## Overview

Professional 2D platformer assets from Kenney.nl integrated for all non-character game elements. Custom family character sprites (Wyn, Axel, Ila) remain the main playable characters.

## Organization

```
assets/kenney/
├── spritesheets/        # Texture atlases (optimized for performance)
│   ├── spritesheet_enemies.png/xml       (129KB, 57 enemy sprites)
│   ├── spritesheet_items.png/xml         (32KB, 24 collectibles)
│   ├── spritesheet_tiles.png/xml         (128KB, 72 platform tiles)
│   ├── spritesheet_ground.png/xml        (203KB, ground elements)
│   ├── spritesheet_hud.png/xml           (65KB, UI elements)
│   └── spritesheet_complete.png/xml      (944KB, all assets combined)
├── enemies/             # Individual enemy sprites (57 files)
├── items/               # Individual collectibles (24 files)
├── tiles/               # Individual platform tiles (72 files)
├── backgrounds/         # Background elements
├── particles/           # Particle effects
├── ground/              # Ground terrain variations
└── hud/                 # HUD/UI elements
```

## Usage Strategy

### Spritesheets (Recommended)
Use texture atlases for better performance:
```javascript
// In Preloader.js
this.load.atlasXML(
  'kenneyEnemies',
  'assets/kenney/spritesheets/spritesheet_enemies.png',
  'assets/kenney/spritesheets/spritesheet_enemies.xml'
);

// In game scene
this.add.image(x, y, 'kenneyEnemies', 'bee.png');
```

### Individual Assets (When Needed)
For specific one-off assets:
```javascript
// Add to manifest.json
"coinGold": {
  "type": "image",
  "path": "kenney/items/coinGold.png",
  "description": "Gold coin collectible"
}

// Use via generated constants
this.load.image(ImageAssets.COIN_GOLD, ImagePaths.COIN_GOLD);
```

## Asset Categories

### Enemies (57 sprites)
- Barnacle: `barnacle.png`, `barnacle_attack.png`, `barnacle_dead.png`
- Bee: `bee.png`, `bee_move.png`, `bee_dead.png`
- Fish (Blue/Green/Pink): Multiple states (idle, move, dead, fall)
- Fly: `fly.png`, `fly_move.png`, `fly_dead.png`
- Frog: `frog.png`, `frog_move.png`, `frog_dead.png`
- Slime (Blue/Green/Purple/Red): Multiple states
- Snail: `snail.png`, `snail_move.png`, `snail_dead.png`
- Worm (Green/Pink): Multiple states

### Items (24 collectibles)
- **Coins**: `coinBronze.png`, `coinSilver.png`, `coinGold.png`
- **Gems**: `gemBlue.png`, `gemGreen.png`, `gemRed.png`, `gemYellow.png`
- **Keys**: `keyBlue.png`, `keyGreen.png`, `keyRed.png`, `keyYellow.png`
- **Flags**: Multiple colors (Blue/Green/Red/Yellow) with states (down, 1, 2)
- **Star**: `star.png`

### Tiles (72 platform variations)
- **Boxes**: Crates, coin boxes, explosive boxes, item boxes
- **Bricks**: Brown, grey
- **Bridges**: Various types (A-H)
- **Dirt**: Grass variants, mud, center, edges
- **Metal**: Center, half variations
- **Planks**: Narrow, half variations
- **Sand**: Center, half, cliffs
- **Stone**: Center, half, cliffs
- **Snow**: Center, half, cliffs

### Backgrounds (8 elements)
Available in `backgrounds/` directory

### Particles (3 types)
Available in `particles/` directory

### Ground (6 variations)
Available in `ground/` directory

### HUD (36 UI elements)
Available in `hud/` directory

## Integration Examples

### Coins (Common Use Case)
```json
// In manifest.json
"kenneyCoins": {
  "type": "spritesheet",
  "path": "kenney/spritesheets/spritesheet_items.png",
  "atlas": "kenney/spritesheets/spritesheet_items.xml",
  "description": "Kenney items atlas including coins"
}
```

### Platform Tiles
```json
// In manifest.json
"kenneyTiles": {
  "type": "spritesheet",
  "path": "kenney/spritesheets/spritesheet_tiles.png",
  "atlas": "kenney/spritesheets/spritesheet_tiles.xml",
  "description": "Kenney platform tiles atlas"
}
```

### Enemy Sprites
```json
// In manifest.json
"kenneyEnemies": {
  "type": "spritesheet",
  "path": "kenney/spritesheets/spritesheet_enemies.png",
  "atlas": "kenney/spritesheets/spritesheet_enemies.xml",
  "description": "Kenney enemy sprites atlas"
}
```

## Performance Notes

- **Prefer spritesheets**: Reduces texture swaps, improves FPS
- **Complete atlas**: Use `spritesheet_complete.png` if using 20+ different sprites
- **Individual assets**: Only when using 1-3 specific sprites

## Adding Assets to Game

1. **Decide on approach**: Spritesheet (recommended) or individual
2. **Add to manifest.json**: Define in appropriate section
3. **Run generator**: `npm run generate-assets`
4. **Use constants**: Import from `Assets.js`
5. **Load in Preloader**: Reference via generated constants

## Character Assets (Separate)

Custom family character sprites remain in `assets/images/characters/`:
- `axel_sprite.png` - Axel (custom photo)
- `ila_sprite.png` - Ila (custom photo)
- `wyn_sprite.png` - Wyn (custom photo)

**Never replace these with Kenney player sprites.**

## License

Kenney assets are CC0 (public domain). Attribution appreciated but not required.
See: https://kenney.nl/assets/platformer-pack-redux

## Quick Reference

| Need | Use This | Type |
|------|----------|------|
| Enemies | `spritesheet_enemies.png/xml` | Atlas |
| Collectibles | `spritesheet_items.png/xml` | Atlas |
| Platforms | `spritesheet_tiles.png/xml` | Atlas |
| Everything | `spritesheet_complete.png/xml` | Atlas |
| Specific sprite | Individual PNG from subdirectory | Image |

## Next Steps

1. Add commonly used atlases to `manifest.json`
2. Generate constants: `npm run generate-assets`
3. Load in `Preloader.js`
4. Reference in game scenes via constants
5. Expand manifest as you add more sprites
