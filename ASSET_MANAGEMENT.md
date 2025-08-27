# WynIsBuff2 Asset Management System

## Overview

The WynIsBuff2 project uses a **centralized, auto-generated asset management system** that ensures all assets are properly tracked, typed, and accessible without magic strings.

## Architecture

```
assets/
├── manifest.json          # Single source of truth
├── images/               # Image assets
├── sounds/               # Sound effects
├── audio/                # Music tracks
└── spritesheets/         # Sprite animations

src/constants/
└── Assets.js             # Auto-generated constants (DO NOT EDIT)

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
   import { ImageAssets, ImagePaths } from '../constants/Assets.js';
   
   // In Preloader
   this.load.image(ImageAssets.MY_NEW_ASSET, ImagePaths.MY_NEW_ASSET);
   
   // In Scene
   this.add.image(400, 300, ImageAssets.MY_NEW_ASSET);
   ```

## Asset Types

### Images
- Standard images: PNG, JPG
- Used for: backgrounds, UI elements, static sprites
- Manifest type: `"image"`

### Spritesheets
- Multi-frame images for animation
- Requires: `frameWidth`, `frameHeight` in manifest
- Manifest type: `"spritesheet"`

### Audio
- Music: MP3/WAV in `audio/music/`
- Sound Effects: MP3/WAV in `sounds/`
- Categories: `land`, `pickup`, `click`, `hover`, `special`

## Commands

| Command | Description |
|---------|-------------|
| `npm run generate-assets` | Generate Assets.js from manifest.json |
| `npm run validate-assets` | Check all assets exist and are valid |
| `node scripts/create-simple-placeholders.cjs` | Create placeholder PNG files |

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

| Asset | Purpose | Replace With |
|-------|---------|--------------|
| `dumbbell.png` | Collectible item | Actual dumbbell sprite |
| `buff-bg.png` | Level background | Themed background art |
| `parallax-*.png` | Parallax layers | Proper parallax art |
| `flares.png` | Particle effects | Particle atlas |

## Best Practices

1. **Always use constants**: Never hardcode asset paths
2. **Run validation**: Before commits, run `npm run validate-assets`
3. **Document assets**: Add clear descriptions in manifest.json
4. **Organize by type**: Keep similar assets in same directories
5. **Optimize files**: Compress images before adding (PNG/JPG)
6. **Version control**: Commit both assets and manifest together

## Asset Statistics

Current project stats:
- **Total Assets**: 66
- **Images**: 46
- **Music**: 3
- **Sound Effects**: 17
- **Orphaned Files**: 196 (enemy animations not yet integrated)

## Architecture Benefits

- ✅ **Type Safety**: All assets have generated constants
- ✅ **No Typos**: Constants prevent string typos
- ✅ **Easy Refactoring**: Change paths in one place
- ✅ **Validation**: Know immediately if assets are missing
- ✅ **Documentation**: manifest.json self-documents all assets
- ✅ **Clean Imports**: Use barrel exports pattern

## Future Improvements

- [ ] Add asset compression pipeline
- [ ] Implement asset bundling for production
- [ ] Add sprite atlas generation
- [ ] Create asset preloading strategies
- [ ] Add WebP support with PNG fallback

## Support

For issues with assets:
1. Run `npm run validate-assets` first
2. Check console for loading errors
3. Verify manifest.json entries
4. Ensure files exist at specified paths

The asset system is designed to be **bulletproof for local development** - if validation passes, the game will run!