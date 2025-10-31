# UI Manager

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Implementation Details](#implementation-details)
- [Usage Examples](#usage-examples)
- [Integration with Event System](#integration-with-event-system)
- [Responsive UI](#responsive-ui)

## Overview

The UI Manager is a core architectural component of the WynIsBuff2 game that centralizes all UI-related functionality. It provides a structured approach to creating, organizing, and updating UI elements, ensuring consistent behavior and appearance across the game.

## Features

- **Text Creation and Management**: Create and update text elements with consistent styling
- **Button Handling**: Create interactive buttons with hover effects and callbacks
- **UI Element Positioning**: Position elements relative to screen edges or center
- **UI Element Grouping**: Organize related UI elements into logical groups
- **Event-Based Updates**: Update UI elements based on game events
- **Responsive Positioning**: Automatically adjust UI element positions for different screen sizes
- **Visibility Control**: Show/hide UI elements based on game state

## Implementation Details

The UI Manager is implemented as a class in `src/modules/UIManager.js`. It maintains internal maps of UI elements and groups, and provides methods for creating, updating, and managing these elements.

### Core Methods

- `createText(key, x, y, text, style, responsive)`: Create a text element
- `createButton(key, x, y, texture, callback, responsive)`: Create an interactive button
- `createGroup(key)`: Create a group to organize related UI elements
- `addToGroup(groupKey, elementKey)`: Add an element to a group
- `updateText(key, text)`: Update the text content of a text element
- `showElement(key)` / `hideElement(key)`: Control element visibility
- `showGroup(groupKey)` / `hideGroup(groupKey)`: Control group visibility
- `positionRelativeToScreen(key, position, offsetX, offsetY)`: Position elements relative to screen edges

### Event Handling

The UI Manager listens for specific events to update UI elements:

- `EventNames.UI_UPDATE`: General UI update event
- `EventNames.PLAYER_JUMP`: Updates jump counter when player jumps

## Usage Examples

### Creating UI Elements

```javascript
// Initialize UI Manager
this.uiManager = new UIManager(this, this.eventSystem);

// Create text
const jumpCounter = this.uiManager
    .createText(
        'jumpCounter',
        512,
        150,
        'Jumps Used: 0 / 3',
        {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
        },
        true // responsive
    )
    .setOrigin(0.5);

// Create button
const menuButton = this.uiManager.createButton(
    'menuButton',
    50,
    50,
    'button_texture',
    () => this.scene.start('MainMenu'),
    true // responsive
);
```

### Organizing UI Elements

```javascript
// Create a group for HUD elements
this.uiManager.createGroup('hud');

// Add elements to the group
this.uiManager.addToGroup('hud', 'jumpCounter');
this.uiManager.addToGroup('hud', 'scoreText');

// Show/hide the entire group
this.uiManager.hideGroup('hud');
this.uiManager.showGroup('hud');
```

### Responsive Positioning

```javascript
// Position element relative to screen edges
this.uiManager.positionRelativeToScreen('pauseButton', 'top-right', 20, 20);
this.uiManager.positionRelativeToScreen('gameTitle', 'center', 0, -100);
```

## Integration with Event System

The UI Manager integrates with the Event System to update UI elements based on game events:

```javascript
// Emit UI update event from anywhere in the game
this.eventSystem.emit(EventNames.UI_UPDATE, {
    type: 'text',
    key: 'scoreText',
    value: `Score: ${score}`,
});

// Emit visibility update
this.eventSystem.emit(EventNames.UI_UPDATE, {
    type: 'visibility',
    key: 'gameOverText',
    visible: true,
});
```

## Responsive UI

The UI Manager includes built-in support for responsive UI that adjusts to different screen sizes:

1. Elements created with the `responsive` parameter set to `true` will automatically adjust their positions when the screen size changes.
2. The `positionRelativeToScreen` method allows positioning elements relative to screen edges or center, which automatically adjusts when the screen size changes.
3. The UI Manager listens for the Phaser `resize` event and updates all responsive elements accordingly.

This ensures that the UI remains properly positioned and usable across different devices and screen resolutions.
