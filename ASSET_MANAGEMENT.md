# WynIsBuff2 Asset Management System

## Overview

The WynIsBuff2 project uses a **centralized, auto-generated asset management system** that ensures all assets are properly tracked, typed, and accessible without magic strings.

## Architecture

```
assets/
├── manifest.json          # Single source of truth
├── images/               # Image assets
│   └── characters/       # Custom character sprites (family photos)
├── kenney/               # Kenney Platformer Pack Redux
│   ├── spritesheets/     # Texture atlases (XML-based)
│   ├── enemies/          # Enemy sprites (57 files)
│   ├── items/            # Collectibles (24 files)
│   ├── tiles/            # Platform tiles (72 files)
│   ├── backgrounds/      # Background elements
│   ├── particles/        # Particle effects
│   ├── ground/           # Ground terrain
│   └── hud/              # UI elements
├── sounds/               # Sound effects
├── audio/                # Music tracks
└── spritesheets/         # Sprite animations

src/constants/
└── Assets.js             # Auto-generated constants (DO NOT EDIT)
    ├── ImageAssets       # Image asset keys
    ├── ImagePaths        # Image file paths
    ├── AtlasXMLPaths     # XML atlas paths (for Kenney atlases)
    ├── AudioAssets       # Audio asset keys
    └── AudioPaths        # Audio file paths

scripts/
├── generate-assets.js    # Generates Assets.js from manifest
├── validate-assets.js    # Validates asset integrity
└── create-simple-placeholders.cjs  # Creates placeholder assets
```

## Key Principles

1. **Single Source of Truth**: `manifest.json` defines all assets
2. **No Magic Strings**: All assets referenced via generated constants
3. **Auto-Generation**: `Assets.js` is generated, never manually edited
4. **Validation**: Built-in tools to ensure asset integrity

## Quick Start for Local Development

### 1. Clone and Setup

```bash
git clone [repository]
cd WynIsBuff2
npm install
```

### 2. Generate Assets

```bash
npm run generate-assets   # Generate constants from manifest
npm run validate-assets   # Check asset integrity
```

### 3. Create Placeholders (if needed)

```bash
node scripts/create-simple-placeholders.cjs  # Creates minimal PNG placeholders
```

### 4. Start Development

```bash
npm run dev   # Starts at http://localhost:8080/
```

## Asset Workflow

### Adding New Assets

1. **Place asset file** in appropriate directory:

    ```
    assets/
    ├── images/         # UI, backgrounds, static images
    ├── sounds/         # Sound effects
    ├── audio/music/    # Background music
    └── spritesheets/   # Animated sprites
    ```

2. **Add to manifest.json**:

    ```json
    {
        "assets": {
            "images": {
                "myNewAsset": {
                    "type": "image",
                    "path": "images/subfolder/my-asset.png",
                    "description": "Description of the asset"
                }
            }
        }
    }
    ```

3. **Regenerate constants**:

    ```bash
    npm run generate-assets
    ```

4. **Use in code**:

    ```javascript
    import { ImageAssets, ImagePaths, AtlasXMLPaths } from '../constants/Assets.js';

    // Standard image in Preloader
    this.load.image(ImageAssets.MY_NEW_ASSET, ImagePaths.MY_NEW_ASSET);

    // XML atlas in Preloader
    this.load.atlasXML(
        ImageAssets.KENNEY_ITEMS,
        ImagePaths.KENNEY_ITEMS,
        AtlasXMLPaths.KENNEY_ITEMS
    );

    // Use in Scene
    this.add.image(400, 300, ImageAssets.MY_NEW_ASSET);

    // Use atlas frame in Scene
    this.add.image(400, 300, ImageAssets.KENNEY_ITEMS, 'coinGold.png');
    ```

## Asset Types

### Images

- Standard images: PNG, JPG
- Used for: backgrounds, UI elements, static sprites
- Manifest type: `"image"`
- Example: Custom character sprites (Wyn, Axel, Ila)

### Spritesheets

- Multi-frame images for animation
- Requires: `frameWidth`, `frameHeight` in manifest
- Manifest type: `"spritesheet"`
- Example: Player character animations

### XML Atlases

- Texture atlases with XML descriptor files
- Used for: Kenney Platformer Pack assets
- Requires: `atlasXML` path in manifest
- Manifest type: `"atlasXML"`
- Exported via: `AtlasXMLPaths` constant
- Example: Kenney enemies, items, tiles

### Audio

- Music: MP3/WAV in `audio/music/`
- Sound Effects: MP3/WAV in `sounds/`
- Categories: `land`, `pickup`, `click`, `hover`, `special`

## Commands

| Command                                       | Description                           |
| --------------------------------------------- | ------------------------------------- |
| `npm run generate-assets`                     | Generate Assets.js from manifest.json |
| `npm run validate-assets`                     | Check all assets exist and are valid  |
| `node scripts/create-simple-placeholders.cjs` | Create placeholder PNG files          |

## Validation Output

```bash
npm run validate-assets
```

Shows:

- ✅ Valid assets (exist on disk)
- ⚠️ Placeholder assets (need replacement)
- ❌ Missing assets (referenced but not found)
- 📁 Orphaned files (exist but not in manifest)

## Common Issues & Solutions

### Issue: Asset not loading

**Solution**: Check manifest.json path matches file location exactly

### Issue: "Cannot find ImageAssets.MY_ASSET"

**Solution**: Run `npm run generate-assets` after adding to manifest

### Issue: Build fails with missing asset

**Solution**: Run validation and create placeholders:

```bash
npm run validate-assets
node scripts/create-simple-placeholders.cjs
```

### Issue: Assets work locally but not in production

**Solution**: Ensure all assets are in manifest and committed to git

## Placeholder Assets

The project includes placeholder assets for quick development:

| Asset            | Purpose          | Replace With           |
| ---------------- | ---------------- | ---------------------- |
| `dumbbell.png`   | Collectible item | Actual dumbbell sprite |
| `buff-bg.png`    | Level background | Themed background art  |
| `parallax-*.png` | Parallax layers  | Proper parallax art    |
| `flares.png`     | Particle effects | Particle atlas         |

## Best Practices

1. **Always use constants**: Never hardcode asset paths
2. **Run validation**: Before commits, run `npm run validate-assets`
3. **Document assets**: Add clear descriptions in manifest.json
4. **Organize by type**: Keep similar assets in same directories
5. **Optimize files**: Compress images before adding (PNG/JPG)
6. **Version control**: Commit both assets and manifest together

## Orphaned Assets Policy

When `npm run validate-assets` reports orphaned files, handle them deliberately:

- Keep (in use soon):
    - Add entries to `assets/manifest.json`
    - Run `npm run generate-assets`
    - Reference via `ImageAssets/*`, `ImagePaths/*`, or audio equivalents

- Archive (not in use):
    - Move under `assets/archive/` preserving structure
    - Add a note in `assets/archive/README.md` if context is useful

- Remove (accidental/temporary):
    - Delete from the repo if clearly unused

Guidelines:

- Prefer adding to manifest if the asset is intended for near-term use
- Prefer archiving if uncertain — keeps the working set small and validation clean
- Never reference raw paths in code; always use generated constants

## Kenney Platformer Pack

Professional 2D platformer assets from Kenney.nl for all non-character game elements:

- 57 enemy sprites (barnacle, bee, fish, slime, snail, worm variants)
- 24 collectibles (coins, gems, keys, flags, star)
- 72 platform tiles (boxes, bricks, bridges, dirt, metal, planks, sand, stone, snow)
- Backgrounds, particles, ground terrain, HUD elements

**Custom character sprites (Wyn, Axel, Ila) remain the main playable characters.**

See [assets/KENNEY_ASSETS.md](assets/KENNEY_ASSETS.md) for complete reference and usage examples.

## Related Documentation

- [assets/KENNEY_ASSETS.md](assets/KENNEY_ASSETS.md) — Complete Kenney asset reference and usage guide
- [assets/ENEMY_ASSETS.md](assets/ENEMY_ASSETS.md) — Catalog and integration guide for enemy animations

## Support

For issues with assets:

1. Run `npm run validate-assets` first
2. Check console for loading errors
3. Verify manifest.json entries
4. Ensure files exist at specified paths

The asset system is designed to be **bulletproof for local development** - if validation passes, the game will run!

## Scope

This document covers the asset pipeline (manifest, generation, validation) and how to work with assets safely and consistently. For general onboarding and development workflow, see CONTRIBUTING.md. For system design, see docs/ARCHITECTURE.md.
