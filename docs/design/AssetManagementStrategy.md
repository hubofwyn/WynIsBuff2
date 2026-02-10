# Asset Management Strategy

## Table of Contents

- [Overview](#overview)
- [Asset Organization](#asset-organization)
- [Asset Loading Strategy](#asset-loading-strategy)
- [Asset Manager Implementation](#asset-manager-implementation)
- [Asset Types and Handling](#asset-types-and-handling)
- [Optimization Techniques](#optimization-techniques)
- [Asset Creation Guidelines](#asset-creation-guidelines)

## Overview

Effective asset management is crucial for game performance, maintainability, and development workflow. This document outlines the asset management strategy for WynIsBuff2, covering organization, loading, and optimization of game assets.

### Goals

- Organize assets in a logical, maintainable structure
- Optimize asset loading for performance
- Provide a consistent interface for accessing assets
- Support progressive loading for larger assets
- Implement proper asset cleanup to prevent memory leaks

## Asset Organization

### Directory Structure

```text
assets/
├── images/
│   ├── characters/
│   │   ├── player/
│   │   │   ├── idle.png
│   │   │   ├── run.png
│   │   │   └── jump.png
│   │   └── enemies/
│   │       ├── skeleton/
│   │       └── vampire/
│   ├── tilesets/
│   │   └── dungeon_tileset.png
│   ├── items/
│   │   ├── collectibles/
│   │   └── powerups/
│   ├── ui/
│   │   ├── buttons/
│   │   ├── icons/
│   │   └── interface/
│   └── backgrounds/
│       ├── parallax/
│       └── static/
├── audio/
│   ├── music/
│   │   ├── menu.mp3
│   │   ├── gameplay.mp3
│   │   └── boss.mp3
│   └── sfx/
│       ├── player/
│       ├── enemies/
│       ├── environment/
│       └── ui/
├── fonts/
│   ├── bitmap/
│   └── web/
└── data/
    ├── levels/
    ├── animations/
    └── configs/
```

### Naming Conventions

1. **Use lowercase**: All filenames should be lowercase to avoid case-sensitivity issues
2. **Use hyphens**: Use hyphens instead of spaces or underscores (e.g., `player-idle.png`)
3. **Be descriptive**: Names should clearly indicate the asset's purpose
4. **Include dimensions**: For sprites with different sizes, include dimensions (e.g., `button-play-200x50.png`)
5. **Include state**: For UI elements, include state (e.g., `button-play-normal.png`, `button-play-hover.png`)
6. **Include frame count**: For spritesheets, include frame count (e.g., `player-run-8frames.png`)

### Asset Manifest

Create a manifest file that catalogs all assets with their metadata:

```javascript
// src/data/asset-manifest.js
export const AssetManifest = {
    images: {
        characters: {
            player: [
                {
                    key: 'player-idle',
                    path: 'images/characters/player/idle.png',
                    type: 'spritesheet',
                    frameConfig: { frameWidth: 32, frameHeight: 32 },
                },
                {
                    key: 'player-run',
                    path: 'images/characters/player/run.png',
                    type: 'spritesheet',
                    frameConfig: { frameWidth: 32, frameHeight: 32 },
                },
                {
                    key: 'player-jump',
                    path: 'images/characters/player/jump.png',
                    type: 'spritesheet',
                    frameConfig: { frameWidth: 32, frameHeight: 32 },
                },
            ],
            enemies: {
                skeleton: [
                    {
                        key: 'skeleton-idle',
                        path: 'images/characters/enemies/skeleton/idle.png',
                        type: 'spritesheet',
                        frameConfig: { frameWidth: 32, frameHeight: 32 },
                    },
                    // More skeleton assets...
                ],
                // More enemy types...
            },
        },
        tilesets: [
            { key: 'dungeon-tileset', path: 'images/tilesets/dungeon_tileset.png', type: 'image' },
        ],
        ui: {
            buttons: [
                { key: 'button-play', path: 'images/ui/buttons/play.png', type: 'image' },
                { key: 'button-settings', path: 'images/ui/buttons/settings.png', type: 'image' },
            ],
            // More UI assets...
        },
        // More image categories...
    },
    audio: {
        music: [
            { key: 'music-menu', path: 'audio/music/menu.mp3', type: 'audio' },
            { key: 'music-gameplay', path: 'audio/music/gameplay.mp3', type: 'audio' },
        ],
        sfx: {
            player: [
                { key: 'sfx-player-jump', path: 'audio/sfx/player/jump.mp3', type: 'audio' },
                { key: 'sfx-player-land', path: 'audio/sfx/player/land.mp3', type: 'audio' },
            ],
            // More SFX categories...
        },
    },
    fonts: [{ key: 'font-main', path: 'fonts/web/main.ttf', type: 'font' }],
    data: {
        levels: [{ key: 'level-1', path: 'data/levels/level1.json', type: 'json' }],
        // More data categories...
    },
};

// Group assets by scene for easier loading
export const SceneAssets = {
    Boot: [
        // Minimal assets needed for boot scene
        { key: 'logo', path: 'images/ui/logo.png', type: 'image' },
        { key: 'loading-bar', path: 'images/ui/loading-bar.png', type: 'image' },
    ],
    Preloader: [
        // Assets needed for preloader scene
    ],
    MainMenu: [
        // Assets needed for main menu
        'button-play',
        'button-settings',
        'music-menu',
    ],
    Game: [
        // Core gameplay assets
        'player-idle',
        'player-run',
        'player-jump',
        'dungeon-tileset',
        'music-gameplay',
        'sfx-player-jump',
        'sfx-player-land',
    ],
    // More scenes...
};
```

## Asset Loading Strategy

### Progressive Loading

Implement a progressive loading strategy to minimize initial load times:

1. **Essential First**: Load only essential assets during boot
2. **Scene-Specific**: Load assets specific to each scene when entering
3. **Background Loading**: Load non-critical assets in the background
4. **Unload Unused**: Unload assets no longer needed to free memory

### Loading Sequence

1. **Boot Scene**:
    - Load minimal assets needed for loading screen
    - Display loading screen

2. **Preloader Scene**:
    - Load common assets used across multiple scenes
    - Load main menu assets
    - Show loading progress

3. **Scene Transitions**:
    - Preload next scene's assets during transition
    - Show transition animation to mask loading time
    - Unload previous scene's unique assets when safe

### Loading Indicators

Provide clear visual feedback during loading:

1. **Progress Bar**: Show overall loading progress
2. **Asset Count**: Display "Loading X/Y assets"
3. **Tips/Hints**: Show gameplay tips during longer loads
4. **Interactive Elements**: Add simple interactive elements during loading (where appropriate)

## Asset Manager Implementation

```javascript
// src/modules/AssetManager.js
export class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.loadedAssets = new Map();
        this.loadingQueue = [];
        this.isLoading = false;
        this.progressCallbacks = [];
        this.completeCallbacks = [];
    }

    /**
     * Preload assets based on keys from the manifest
     * @param {Array} assetKeys - Array of asset keys to load
     * @param {Function} progressCallback - Callback for loading progress
     * @param {Function} completeCallback - Callback when loading completes
     */
    preload(assetKeys, progressCallback, completeCallback) {
        if (progressCallback) {
            this.progressCallbacks.push(progressCallback);
        }

        if (completeCallback) {
            this.completeCallbacks.push(completeCallback);
        }

        // Find assets in manifest by key
        const assetsToLoad = this.getAssetsFromKeys(assetKeys);

        // Add to loading queue
        this.loadingQueue.push(...assetsToLoad);

        // Start loading if not already in progress
        if (!this.isLoading) {
            this.startLoading();
        }
    }

    /**
     * Get assets from the manifest by keys
     * @param {Array} keys - Array of asset keys
     * @returns {Array} Array of asset objects
     */
    getAssetsFromKeys(keys) {
        const assets = [];

        // Flatten the manifest to find assets by key
        const flattenedManifest = this.flattenManifest(AssetManifest);

        keys.forEach((key) => {
            const asset = flattenedManifest.find((a) => a.key === key);
            if (asset && !this.loadedAssets.has(asset.key)) {
                assets.push(asset);
            }
        });

        return assets;
    }

    /**
     * Flatten the nested manifest into a single array
     * @param {Object} obj - The manifest object or portion of it
     * @param {Array} result - The result array
     * @returns {Array} Flattened array of asset objects
     */
    flattenManifest(obj, result = []) {
        if (Array.isArray(obj)) {
            obj.forEach((item) => {
                if (item.key && item.path && item.type) {
                    result.push(item);
                }
            });
        } else if (typeof obj === 'object') {
            Object.values(obj).forEach((value) => {
                this.flattenManifest(value, result);
            });
        }

        return result;
    }

    /**
     * Start the loading process
     */
    startLoading() {
        if (this.loadingQueue.length === 0) {
            this.completeLoading();
            return;
        }

        this.isLoading = true;

        // Set up loading events
        this.scene.load.on('progress', this.updateProgress, this);
        this.scene.load.on('complete', this.completeLoading, this);

        // Process each asset in the queue
        this.loadingQueue.forEach((asset) => {
            this.loadAsset(asset);
        });

        // Start the load
        this.scene.load.start();
    }

    /**
     * Load a single asset based on its type
     * @param {Object} asset - The asset to load
     */
    loadAsset(asset) {
        switch (asset.type) {
            case 'image':
                this.scene.load.image(asset.key, asset.path);
                break;

            case 'spritesheet':
                this.scene.load.spritesheet(asset.key, asset.path, asset.frameConfig);
                break;

            case 'audio':
                this.scene.load.audio(asset.key, asset.path);
                break;

            case 'json':
                this.scene.load.json(asset.key, asset.path);
                break;

            case 'font':
                // For web fonts, we might need a different approach
                // This is a simplified example
                this.scene.load.bitmapFont(asset.key, asset.path);
                break;

            default:
                console.warn(`Unknown asset type: ${asset.type} for ${asset.key}`);
        }
    }

    /**
     * Update loading progress
     * @param {number} progress - Progress value (0-1)
     */
    updateProgress(progress) {
        this.progressCallbacks.forEach((callback) => {
            callback(progress);
        });
    }

    /**
     * Complete the loading process
     */
    completeLoading() {
        this.isLoading = false;

        // Mark all queued assets as loaded
        this.loadingQueue.forEach((asset) => {
            this.loadedAssets.set(asset.key, asset);
        });

        // Clear the queue
        this.loadingQueue = [];

        // Remove event listeners
        this.scene.load.off('progress', this.updateProgress, this);
        this.scene.load.off('complete', this.completeLoading, this);

        // Call complete callbacks
        this.completeCallbacks.forEach((callback) => {
            callback();
        });

        // Clear callbacks
        this.progressCallbacks = [];
        this.completeCallbacks = [];
    }

    /**
     * Get a loaded asset
     * @param {string} key - The asset key
     * @returns {Object} The asset object
     */
    getAsset(key) {
        return this.loadedAssets.get(key);
    }

    /**
     * Check if an asset is loaded
     * @param {string} key - The asset key
     * @returns {boolean} Whether the asset is loaded
     */
    isAssetLoaded(key) {
        return this.loadedAssets.has(key);
    }

    /**
     * Unload assets that are no longer needed
     * @param {Array} keys - Array of asset keys to unload
     */
    unloadAssets(keys) {
        keys.forEach((key) => {
            if (this.loadedAssets.has(key)) {
                // Remove from Phaser cache based on type
                const asset = this.loadedAssets.get(key);

                switch (asset.type) {
                    case 'image':
                    case 'spritesheet':
                        this.scene.textures.remove(key);
                        break;

                    case 'audio':
                        this.scene.sound.remove(key);
                        break;

                    case 'json':
                        this.scene.cache.json.remove(key);
                        break;

                    case 'font':
                        this.scene.cache.bitmapFont.remove(key);
                        break;
                }

                // Remove from loaded assets
                this.loadedAssets.delete(key);
            }
        });
    }

    /**
     * Create an animation from a spritesheet
     * @param {string} key - The animation key
     * @param {Object} config - The animation config
     */
    createAnimation(key, config) {
        if (!this.scene.anims.exists(key)) {
            this.scene.anims.create({
                key,
                ...config,
            });
        }
    }
}
```

## Asset Types and Handling

### Images and Spritesheets

- **Format**: Use PNG for transparency, JPEG for backgrounds without transparency
- **Optimization**: Compress images appropriately, use texture atlases for related sprites
- **Dimensions**: Keep power-of-two dimensions where possible (256x256, 512x512, etc.)
- **Spritesheets**: Organize frames in a grid, document frame dimensions

### Audio

- **Format**: Use MP3 for broad compatibility, OGG as fallback
- **Music**: Stream longer music tracks rather than loading entirely into memory
- **SFX**: Keep sound effects short and optimized
- **Pooling**: Implement sound pooling for frequently used effects

### Fonts

- **Web Fonts**: Use web fonts for UI text
- **Bitmap Fonts**: Use bitmap fonts for performance-critical text
- **Fallbacks**: Provide fallback fonts in case primary fonts fail to load

### Data Files

- **Format**: Use JSON for level data, configurations, and other structured data
- **Validation**: Validate data files against schemas
- **Compression**: Consider compressing larger data files

## Optimization Techniques

### Texture Atlases

Combine multiple related textures into a single atlas to reduce draw calls:

```javascript
// Example atlas configuration
{
    "frames": {
        "player-idle-1": {
            "frame": {"x": 0, "y": 0, "w": 32, "h": 32},
            "rotated": false,
            "trimmed": false,
            "spriteSourceSize": {"x": 0, "y": 0, "w": 32, "h": 32},
            "sourceSize": {"w": 32, "h": 32}
        },
        "player-idle-2": {
            "frame": {"x": 32, "y": 0, "w": 32, "h": 32},
            "rotated": false,
            "trimmed": false,
            "spriteSourceSize": {"x": 0, "y": 0, "w": 32, "h": 32},
            "sourceSize": {"w": 32, "h": 32}
        }
        // More frames...
    }
}
```

### Mipmap Generation

Enable mipmaps for textures that will be scaled:

```javascript
this.scene.load.image(asset.key, asset.path, { generateMipmap: true });
```

### Audio Sprites

Combine multiple sound effects into a single audio sprite:

```javascript
this.scene.load.audioSprite('sfx', 'audio/sfx/sfx.json', [
    'audio/sfx/sfx.ogg',
    'audio/sfx/sfx.mp3',
]);
```

### Lazy Loading

Load assets only when needed:

```javascript
// Load level-specific assets when entering a level
enterLevel(levelId) {
    const levelAssets = this.getLevelAssets(levelId);
    this.assetManager.preload(levelAssets,
        progress => this.updateLevelLoadProgress(progress),
        () => this.startLevel(levelId)
    );
}
```

## Asset Creation Guidelines

### Pixel Art Guidelines

- **Consistent Scale**: Maintain consistent pixel size across similar assets
- **Limited Palette**: Use a consistent color palette
- **Avoid Anti-Aliasing**: Keep pixel art crisp without anti-aliasing
- **Animation Frames**: Keep animation frame counts consistent for similar actions

### Audio Guidelines

- **Consistent Volume**: Normalize audio to consistent levels
- **Length**: Keep sound effects brief (under 2 seconds where possible)
- **Variety**: Provide slight variations of common sounds to avoid repetition
- **Looping**: Ensure music tracks loop seamlessly

### UI Guidelines

- **Scalable Design**: Design UI elements that scale well to different resolutions
- **State Variations**: Create variations for different states (normal, hover, pressed)
- **Consistent Style**: Maintain consistent visual style across UI elements
- **Accessibility**: Ensure sufficient contrast and readability

By following this asset management strategy, WynIsBuff2 will benefit from organized, optimized assets that load efficiently and contribute to a smooth player experience.
