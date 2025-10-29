# WynIsBuff2 - Technologies and Packages Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [Core Technologies](#core-technologies)
  - [Phaser](#phaser)
  - [Rapier Physics](#rapier-physics)
  - [Vite](#vite)
- [Project Dependencies](#project-dependencies)
  - [Production Dependencies](#production-dependencies)
  - [Development Dependencies](#development-dependencies)
- [Project Structure](#project-structure)
- [Build System](#build-system)
- [Asset Management](#asset-management)
- [Game Architecture](#game-architecture)

## Project Overview

**WynIsBuff2** is a 2D game built using Phaser 3 with Rapier physics integration. The project is based on the Phaser Rapier Template and uses Vite for bundling and development workflow.

- **Project Name**: WynIsBuff2
- **Version**: 1.0.1
- **Type**: ES Module (uses import/export syntax)
- **Repository**: Based on https://github.com/phaserjs/template-rapier

## Core Technologies

### Phaser

- **Version**: 3.88.0
- **Description**: Phaser is a fast, free, and fun open source HTML5 game framework that offers WebGL and Canvas rendering across desktop and mobile web browsers.
- **Official Documentation**: https://newdocs.phaser.io/docs/3.88.0
- **Usage in Project**: Provides the core game engine functionality including scene management, sprite handling, animation system, input handling, and rendering.

### Rapier Physics

- **Package**: @dimforge/rapier2d-compat
- **Version**: 0.14.0
- **Description**: Rapier is a set of 2D and 3D physics engines written in Rust, with JavaScript bindings. It's used for realistic physics simulations in games.
- **Official Documentation**: https://rapier.rs/docs/
- **Usage in Project**: Provides the physics simulation for the game, including rigid bodies, colliders, and physics-based movement.

### Vite

- **Version**: 5.3.1
- **Description**: Vite is a modern frontend build tool that provides a faster and leaner development experience.
- **Official Documentation**: https://vitejs.dev/
- **Usage in Project**: Used for bundling the game assets and code, providing a development server with hot module replacement, and building production-ready bundles.

## Project Dependencies

### Production Dependencies

| Package | Version | Description | Usage |
|---------|---------|-------------|-------|
| @dimforge/rapier2d-compat | 0.14.0 | 2D physics engine with JavaScript bindings | Provides physics simulation for the game |
| phaser | 3.88.0 | HTML5 game framework | Core game engine |

### Development Dependencies

| Package | Version | Description | Usage |
|---------|---------|-------------|-------|
| terser | 5.31.0 | JavaScript parser, mangler and compressor | Used for minifying JavaScript in production builds |
| vite | 5.3.1 | Frontend build tool | Used for development server and production builds |

## Project Structure

The project follows a standard structure for Phaser games:

```
/
├── assets/                  # Game assets (images, spritesheets, etc.)
│   ├── 2D Pixel Dungeon Asset Pack v2.0/  # Original dungeon tileset assets
│   ├── Enemy_Animations_Set/              # Enemy animation spritesheets
│   ├── images/                            # Static images organized by type
│   └── spritesheets/                      # Animation frames and sprite collections
├── docs/                    # Documentation files
├── public/                  # Static files served as-is
│   ├── assets/              # Public assets
│   ├── favicon.png          # Website favicon
│   └── style.css            # Global CSS styles
├── src/                     # Source code
│   ├── main.js              # Entry point
│   └── scenes/              # Phaser scenes
│       ├── Boot.js          # Boot scene
│       ├── Game.js          # Main game scene
│       ├── GameOver.js      # Game over scene
│       ├── MainMenu.js      # Main menu scene
│       └── Preloader.js     # Asset preloader scene
├── vite/                    # Vite configuration
│   ├── config.dev.mjs       # Development configuration
│   └── config.prod.mjs      # Production configuration
├── index.html               # HTML entry point
├── package.json             # Project metadata and dependencies
└── package-lock.json        # Locked dependencies
```

## Build System

The project uses Vite for its build system with the following npm scripts:

- **dev**: `node log.js dev & vite --config vite/config.dev.mjs`
  - Starts the development server with hot module replacement
  - Runs on http://localhost:8080 by default

- **build**: `node log.js build & vite build --config vite/config.prod.mjs`
  - Creates a production build in the `dist` folder
  - Optimizes and minifies the code using Terser

- **dev-nolog**: `vite --config vite/config.dev.mjs`
  - Same as `dev` but without sending anonymous usage data

- **build-nolog**: `vite build --config vite/config.prod.mjs`
  - Same as `build` but without sending anonymous usage data

### Vite Configuration

#### Development Configuration (config.dev.mjs)
- Sets the base path to './'
- Configures Rollup to separate Phaser into its own chunk
- Sets the development server port to 8080

#### Production Configuration (config.prod.mjs)
- Sets the base path to './'
- Configures Rollup to separate Phaser into its own chunk
- Enables minification with Terser
- Configures Terser for optimal compression
- Includes a custom plugin to display build messages

## Asset Management

Assets are organized in a structured manner as detailed in `docs/assets.md`:

### Main Asset Directory Structure
```
assets/
├── 2D Pixel Dungeon Asset Pack v2.0/  # Original dungeon tileset assets
├── Enemy_Animations_Set/              # Original enemy animation spritesheets
├── images/                            # Static images organized by type
└── spritesheets/                      # Animation frames and sprite collections
```

### Loading Assets in Phaser

Assets are loaded in the Preloader scene using Phaser's loader:

```javascript
// Set the base path
this.load.setPath('assets');

// Load images
this.load.image('logo', 'logo.png');
this.load.image('dungeon-tiles', 'images/tilesets/Dungeon_Tileset.png');

// Load spritesheets
this.load.spritesheet('player', '2D Pixel Dungeon Asset Pack v2.0/2D Pixel Dungeon Asset Pack/character and tileset/Dungeon_Character.png', {
    frameWidth: 16,
    frameHeight: 16
});
```

## Game Architecture

The game uses Phaser's scene system with the following scenes:

1. **Boot**: Initial scene that loads minimal assets needed for the preloader
2. **Preloader**: Loads all game assets and displays a loading bar
3. **MainMenu**: Displays the main menu
4. **Game**: The main gameplay scene
5. **GameOver**: Displayed when the game ends

### Physics Integration

The game integrates Rapier physics in the Game scene:

1. **Initialization**:
   ```javascript
   await RAPIER.init();
   this.rapierWorld = new RAPIER.World(new RAPIER.Vector2(0.0, 9.81));
   ```

2. **Creating Physics Bodies**:
   ```javascript
   const bodyDesc = RAPIER.RigidBodyDesc.dynamic();
   bodyDesc.setTranslation(x, y);
   const rigidBody = this.rapierWorld.createRigidBody(bodyDesc);
   ```

3. **Creating Colliders**:
   ```javascript
   const colliderDesc = RAPIER.ColliderDesc.cuboid(width/2, height/2);
   this.rapierWorld.createCollider(colliderDesc, rigidBody);
   ```

4. **Updating Physics**:
   ```javascript
   update() {
       this.rapierWorld.step();
       // Update game objects based on physics
   }
   ```

### Game Features

- **Triple Jump Mechanic**: Player can jump up to three times before needing to touch the ground
- **Platform Navigation**: Multiple platforms for the player to navigate
- **Visual Feedback**: Player color changes based on jump count
- **Controls**: WASD or Arrow keys for movement, Space for jumping