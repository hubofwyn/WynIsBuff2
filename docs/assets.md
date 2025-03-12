# WynIsBuff2 Asset Structure Guide

## Overview
This document outlines the asset structure for the WynIsBuff2 game project. Understanding this organization is crucial for efficient development and asset management.

## Main Asset Directory Structure

```
assets/
├── 2D Pixel Dungeon Asset Pack v2.0/  # Original dungeon tileset assets
├── Enemy_Animations_Set/              # Original enemy animation spritesheets
├── images/                            # Static images organized by type
├── spritesheets/                      # Animation frames and sprite collections
```

## Detailed Asset Organization

### 1. Images Directory (`assets/images/`)

Static images organized by asset type:

```
images/
├── characters/                        # Character sprites
├── items/                             # Game items
├── tilesets/                          # Level design tiles
│   └── Dungeon_Tileset.png            # Main tileset for level design
└── ui/
    └── interface/                     # UI elements (arrows, squares for controls)
```

### 2. Spritesheets Directory (`assets/spritesheets/`)

Contains animation frames and organized sprite collections:

```
spritesheets/
├── animations/
│   └── characters/
│       ├── enemies/                   # Enemy character animations
│       │   ├── skeleton1/             # Skeleton type 1
│       │   │   ├── attack/            # Attack animation frames
│       │   │   ├── death/             # Death animation frames
│       │   │   ├── idle/              # Idle animation frames
│       │   │   ├── movement/          # Movement animation frames
│       │   │   └── take_damage/       # Damage reaction animation frames
│       │   ├── skeleton2/             # Skeleton type 2 (same structure)
│       │   └── vampire/               # Vampire enemy (same structure)
│       ├── monsters_idle/             # Monster idle animations with variations
│       ├── player/                    # Player character sprites
│       └── priests_idle/              # Priest character idle animations
├── effects/
│   ├── torch/                         # Torch and lighting animations
│   │   └── torch/                     # Individual torch animation frames
│   └── traps/                         # Trap animations
│       └── flamethrower/              # Flamethrower trap animation frames
└── items/                             # Various game items
    ├── arrow.png                      # Composite arrow sprite
    ├── box_1.png                      # Composite box sprite
    ├── chest.png                      # Composite chest sprite
    ├── coin.png                       # Composite coin sprite
    ├── flag.png                       # Composite flag sprite
    ├── flasks_1.png                   # Composite flask sprite
    ├── keys_1.png                     # Composite key sprite
    ├── arrow/                         # Individual arrow animation frames
    ├── box_1/                         # Individual box animation frames
    ├── chest/                         # Individual chest animation frames
    ├── coin/                          # Individual coin animation frames
    └── ... (other item animations)
```

## Animation Frame Naming Convention

Animation frames follow a consistent naming pattern:

- Character animations: `[character_type]_[animation_state]_v[variation]_[frame_number].png`
  - Example: `skeleton1_attack_v1_1.png`

- Item animations: `[item_name]_[variation]_[frame_number].png`
  - Example: `chest_1_1.png`

## Asset Processing

The project includes a script (`assets/spritesheets/move_enemy_animations.zsh`) that demonstrates how the original assets from the Enemy Animations Set were processed and organized into the structured animation directories.

## Usage Guidelines

### Loading Assets in Phaser

When loading assets in your game scenes:

1. Use the `this.load.setPath('assets')` method to set the base path
2. Load images using relative paths from the assets directory
3. For animations, use the spritesheets directory structure

Example:
```javascript
// In your preload method
this.load.setPath('assets');

// Load a tileset
this.load.image('dungeon-tiles', 'images/tilesets/Dungeon_Tileset.png');

// Load a character spritesheet
this.load.spritesheet('skeleton1-attack', 
    'spritesheets/animations/characters/enemies/skeleton1/attack/skeleton1_attack_v1.png',
    { frameWidth: 32, frameHeight: 32 }
);
```

### Adding New Assets

When adding new assets to the project:

1. Place original asset packs in their respective directories
2. Process and organize assets following the established structure
3. For new enemy types, create appropriate subdirectories following the pattern
4. For new animation states, ensure consistent naming conventions

## Best Practices

1. **Maintain Hierarchy**: Keep the hierarchical organization intact
2. **Follow Naming Conventions**: Use consistent naming patterns for new assets
3. **Update Documentation**: Document any new asset categories or significant changes
4. **Optimize Assets**: Ensure sprites and images are optimized for web/game use
5. **Version Control**: Commit processed assets rather than just raw source files