# Phaser Framework Documentation

## Table of Contents

- [Overview](#overview)
- [Version Information](#version-information)
- [Core Concepts](#core-concepts)
    - [Game Configuration](#game-configuration)
    - [Scene System](#scene-system)
    - [Game Objects](#game-objects)
    - [Asset Loading](#asset-loading)
    - [Input Handling](#input-handling)
    - [Animation System](#animation-system)
- [Implementation in WynIsBuff2](#implementation-in-wynisbuff2)
    - [Game Configuration](#game-configuration-1)
    - [Scene Structure](#scene-structure)
    - [Asset Management](#asset-management)
    - [Game Loop](#game-loop)
- [Best Practices](#best-practices)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Resources](#resources)

## Overview

Phaser is a fast, free, and open-source HTML5 game framework that offers WebGL and Canvas rendering across desktop and mobile web browsers. It provides a comprehensive set of tools for creating 2D games, including physics, animations, input handling, and asset management.

## Version Information

- **Package**: phaser
- **Version**: 3.88.0
- **Official Documentation**: https://newdocs.phaser.io/docs/3.88.0
- **GitHub Repository**: https://github.com/photonstorm/phaser

## Core Concepts

### Game Configuration

The Phaser.Game instance is the main entry point, configured with options for rendering, dimensions, scenes, and more:

```javascript
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    scene: [Boot, Preloader, MainMenu, Game, GameOver],
};

const game = new Phaser.Game(config);
```

### Scene System

Scenes are the building blocks of Phaser games, representing distinct states like menus, levels, or game over screens:

```javascript
class MyScene extends Phaser.Scene {
    constructor() {
        super('MyScene');
    }

    preload() {
        // Load assets
    }

    create() {
        // Set up the scene
    }

    update() {
        // Run game logic
    }
}
```

### Game Objects

Phaser provides various game objects for rendering and interaction:

- **Sprites**: Image-based objects that can be animated
- **Images**: Static image objects
- **Text**: Text rendering with various styles
- **Graphics**: Vector graphics drawing
- **Containers**: Group objects together
- **Particles**: Particle effect systems

```javascript
// Create a sprite
this.player = this.add.sprite(400, 300, 'player');

// Create text
this.scoreText = this.add.text(20, 20, 'Score: 0', {
    fontFamily: 'Arial',
    fontSize: 24,
});
```

### Asset Loading

Assets are loaded in the preload method of a scene:

```javascript
preload() {
    this.load.image('logo', 'assets/logo.png');
    this.load.spritesheet('player', 'assets/player.png', {
        frameWidth: 32,
        frameHeight: 48
    });
    this.load.audio('music', 'assets/music.mp3');
}
```

### Input Handling

Phaser provides systems for keyboard, mouse, touch, and gamepad input:

```javascript
// Keyboard input
this.cursors = this.input.keyboard.createCursorKeys();

// Custom key
this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

// Mouse/touch input
this.input.on('pointerdown', (pointer) => {
    // Handle click/tap
});
```

### Animation System

Phaser includes a powerful animation system for sprite animations:

```javascript
// Create an animation
this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
});

// Play the animation
this.player.play('walk');
```

## Implementation in WynIsBuff2

### Game Configuration

WynIsBuff2 uses the following configuration:

```javascript
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [Boot, Preloader, MainMenu, Game, GameOver],
};
```

### Scene Structure

The game is organized into five scenes:

1. **Boot**: Loads minimal assets needed for the preloader
2. **Preloader**: Loads all game assets and displays a loading bar
3. **MainMenu**: Displays the main menu
4. **Game**: The main gameplay scene with Rapier physics integration
5. **GameOver**: Displayed when the game ends

### Asset Management

Assets are loaded in the Preloader scene:

```javascript
preload() {
    this.load.setPath('assets');

    // Load player character sprite
    this.load.spritesheet('player', '2D Pixel Dungeon Asset Pack v2.0/2D Pixel Dungeon Asset Pack/character and tileset/Dungeon_Character.png', {
        frameWidth: 16,
        frameHeight: 16
    });

    // Load tileset
    this.load.image('dungeon-tiles', 'images/tilesets/Dungeon_Tileset.png');

    // Load UI elements
    this.load.image('arrow-1', 'images/ui/interface/arrow_1.png');

    // Load item sprites
    this.load.image('coin', 'spritesheets/items/coin.png');
}
```

### Game Loop

The game loop is implemented in the update method of the Game scene:

```javascript
update() {
    // Step the physics world
    this.rapierWorld.step();

    // Update game objects
    this.updateGameObjects();

    // Process collisions
    this.processCollisions();

    // Handle player input
    this.handlePlayerMovement();
    this.handleJumping();
}
```

## Best Practices

1. **Scene Organization**: Divide your game into logical scenes for better organization.

2. **Asset Preloading**: Always preload assets before using them.

3. **Performance Optimization**:
    - Use sprite sheets for animations
    - Implement object pooling for frequently created/destroyed objects
    - Use appropriate rendering settings (WebGL for complex games)

4. **Responsive Design**: Use Phaser's scale manager for responsive layouts.

5. **Error Handling**: Implement error handling for asset loading and game logic.

6. **Game Loop Implementation**:
    - Structure your update method with clear, modular functions
    - Separate physics updates, input handling, and game logic
    - Use consistent time steps for physics simulation

7. **Input Handling**:
    - Use Phaser.Input.Keyboard.JustDown for one-time actions like jumping
    - Support multiple input methods (keyboard, gamepad, touch) when possible
    - Implement smooth movement with acceleration rather than binary on/off

8. **Game Feel Improvements**:
    - Add "juice" to player actions with visual and audio feedback
    - Implement forgiveness mechanics like coyote time for jumping
    - Use variable forces for more dynamic gameplay

## Common Issues and Solutions

1. **Assets Not Loading**:
    - Check file paths and case sensitivity
    - Ensure assets are in the correct directory
    - Use the load error event to debug: `this.load.on('loaderror', (file) => console.error(file))`

2. **Performance Issues**:
    - Reduce the number of game objects
    - Use sprite sheets instead of individual images
    - Implement object pooling
    - Enable WebGL rendering

3. **Input Problems**:
    - Ensure input is enabled: `this.input.enabled = true`
    - Check if the game has focus
    - Verify input event listeners are properly set up

4. **Movement Feels Unresponsive**:
    - Implement acceleration-based movement instead of direct position changes
    - Add visual feedback for player actions
    - Ensure consistent frame rate with `this.physics.world.setFPS(60)`

5. **Collision Detection Issues**:
    - Use Phaser's built-in collision systems when possible
    - For custom physics (like Rapier), implement precise collision checks
    - Add debug visualization for collision bodies during development

## Resources

- [Phaser Official Documentation](https://newdocs.phaser.io/docs/3.88.0)
- [Phaser Examples](https://labs.phaser.io)
- [Phaser GitHub Repository](https://github.com/photonstorm/phaser)
- [Phaser Discord](https://discord.gg/phaser)
- [Phaser Forum](https://phaser.discourse.group/)
