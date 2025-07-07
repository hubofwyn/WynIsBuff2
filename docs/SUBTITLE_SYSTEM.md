# Subtitle System Documentation

## Overview
The subtitle system in WynIsBuff2 provides accessibility support by displaying text captions for audio events. This system is integrated into the UIManager and can be enabled/disabled through game settings.

## Features
- **Dynamic subtitle display** - Shows text captions at the bottom of the screen
- **Queue management** - Handles multiple subtitles in sequence
- **Responsive design** - Adapts to screen size changes
- **Configurable duration** - Each subtitle can have custom display time
- **Settings integration** - Persists user preference for subtitles

## API Reference

### UIManager Methods

#### `showSubtitles(enabled)`
Enable or disable the subtitle system.
```javascript
this.uiManager.showSubtitles(true); // Enable subtitles
this.uiManager.showSubtitles(false); // Disable subtitles
```

#### `displaySubtitle(text, duration)`
Display a subtitle immediately.
- `text` (string) - The subtitle text to display
- `duration` (number) - How long to show the subtitle in milliseconds (default: 3000)
```javascript
this.uiManager.displaySubtitle("Wyn jumps!", 2000);
```

#### `queueSubtitle(text, duration)`
Add a subtitle to the queue. If no subtitle is currently showing, it displays immediately.
```javascript
this.uiManager.queueSubtitle("Great job!", 3000);
this.uiManager.queueSubtitle("Keep going!", 2500);
```

## Integration Examples

### With Audio Events
```javascript
// In Game.js or any scene
this.eventSystem.on(EventNames.PLAYER_JUMP, (data) => {
    AudioManager.getInstance().playSFX('jump');
    
    // Show subtitle if enabled
    if (this.uiManager.subtitlesEnabled) {
        this.uiManager.displaySubtitle("*Jump*", 1000);
    }
});
```

### With AudioManager
```javascript
// Extend AudioManager to support subtitles
playSFXWithSubtitle(key, subtitle, duration = 2000) {
    this.playSFX(key);
    
    const uiManager = UIManager.getInstance();
    if (uiManager && uiManager.subtitlesEnabled) {
        uiManager.displaySubtitle(subtitle, duration);
    }
}

// Usage
AudioManager.getInstance().playSFXWithSubtitle('pickup', "*Collected protein shake*");
```

### In Settings Menu
```javascript
// Add subtitle toggle in SettingsScene
const subtitleToggle = this.add.text(x, y, 'Subtitles: ON', style)
    .setInteractive()
    .on('pointerdown', () => {
        const enabled = !this.gameStateManager.settings.accessibility.subtitles;
        this.gameStateManager.saveSettings({
            ...this.gameStateManager.settings,
            accessibility: {
                ...this.gameStateManager.settings.accessibility,
                subtitles: enabled
            }
        });
        
        subtitleToggle.setText(`Subtitles: ${enabled ? 'ON' : 'OFF'}`);
        this.uiManager.showSubtitles(enabled);
    });
```

## Visual Design
- **Position**: Bottom of screen, 100px from bottom edge
- **Background**: Semi-transparent black (80% opacity) with rounded corners
- **Text**: White, 20px Arial, centered
- **Width**: 80% of screen width
- **Z-order**: Always on top (depth: 9999)
- **Camera**: Fixed to screen (scrollFactor: 0)

## Best Practices
1. **Keep subtitles concise** - Use short, clear descriptions
2. **Include sound effects** - Not just dialogue (e.g., "*Door opens*", "*Explosion*")
3. **Use appropriate timing** - Match subtitle duration to audio length
4. **Format consistently** - Use asterisks for sound effects: `*Jump*`
5. **Test with audio off** - Ensure game is playable with subtitles alone

## Accessibility Compliance
This subtitle system helps meet WCAG 2.1 Level A guidelines:
- **1.2.1 Audio-only and Video-only (Prerecorded)** - Provides text alternatives for audio
- **1.2.2 Captions (Prerecorded)** - Offers synchronized captions for audio content

## Future Enhancements
- [ ] Different subtitle styles (size, color) for different audio types
- [ ] Speaker identification for dialogue
- [ ] Subtitle history/log
- [ ] Directional indicators for off-screen sounds
- [ ] Language support for internationalization