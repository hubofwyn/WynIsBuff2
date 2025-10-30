# Enemy Assets Catalog

Purpose: Keep enemy animation assets organized and discoverable so they can be integrated quickly when needed.

## Location

All enemy animations are under:

```
assets/spritesheets/animations/characters/enemies/
  skeleton1/
    attack/
    death/
    idle/
    movement/
    take_damage/
  skeleton2/
  skeleton3/
  ...
```

## Integration (when needed)

1) Add spritesheets to `assets/manifest.json` with frame dimensions

Example entry:

```json
{
  "assets": {
    "spritesheets": {
      "skeleton1_move": {
        "type": "spritesheet",
        "path": "spritesheets/animations/characters/enemies/skeleton1/movement/skeleton1_movement_v1.png",
        "frameWidth": 64,
        "frameHeight": 64,
        "description": "Skeleton 1 movement"
      }
    }
  }
}
```

2) Regenerate constants

```
npm run generate-assets
```

3) Load in Preloader

```javascript
import { SpritesheetAssets, SpritesheetPaths } from '../constants/Assets.js';

this.load.spritesheet(
  SpritesheetAssets.SKELETON1_MOVE,
  SpritesheetPaths.SKELETON1_MOVE,
  { frameWidth: 64, frameHeight: 64 }
);
```

4) Create animations in a scene or animation factory

```javascript
this.anims.create({
  key: 'skeleton1_move',
  frames: this.anims.generateFrameNumbers(SpritesheetAssets.SKELETON1_MOVE, { start: 0, end: 7 }),
  frameRate: 10,
  repeat: -1
});
```

## Naming conventions

- Use lowercase with underscores in manifest keys: `skeleton1_move`, `skeleton1_attack`
- Keep per-enemy folders consistent (`attack`, `death`, `idle`, `movement`, `take_damage`)

## Notes

- If enemies move onto the near-term roadmap, prefer adding them to the manifest rather than archiving.
- If you later decide to archive, move entire enemy folders to `assets/archive/` to keep validation clean.

