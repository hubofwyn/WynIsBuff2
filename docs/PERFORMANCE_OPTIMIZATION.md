# Performance Optimization Guide

## Overview

This document explains the performance optimizations implemented in WynIsBuff2 to ensure consistent gameplay across different systems.

## Physics Performance Improvements

### Fixed Timestep with Accumulator

The physics system now uses a fixed timestep approach to ensure deterministic behavior across all systems:

```javascript
// Physics runs at fixed 60 Hz regardless of frame rate
const fixedTimeStep = 1 / 60;
this.accumulator += deltaTime;

while (this.accumulator >= fixedTimeStep) {
    this.world.step();
    this.accumulator -= fixedTimeStep;
}
```

### Key Features

1. **Frame Rate Independence** - Physics runs at consistent 60 Hz regardless of display refresh rate
2. **Catch-up Mechanism** - Slower systems can run multiple physics steps per frame to stay synchronized
3. **Spiral of Death Prevention** - Maximum 3 physics steps per frame prevents freezing
4. **Interpolation** - Smooth visual rendering between physics steps

### Benefits

- Consistent jump heights and movement speeds on all systems
- No "slow motion" effect on lower-end hardware
- Smooth visual appearance even with variable frame rates

## Render Optimizations

### Phaser Configuration

```javascript
fps: {
    target: 60,
    forceSetTimeOut: false,
    smoothStep: false
},
render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
    powerPreference: 'default'
}
```

### Performance Monitoring

Use the PerformanceMonitor to diagnose issues:

```javascript
import { PerformanceMonitor } from '@features/core';

// In your scene
create() {
    this.perfMonitor = PerformanceMonitor.getInstance();
    this.perfMonitor.init(this, true); // true = show on-screen display
}

update(time, delta) {
    this.perfMonitor.update(time, delta);

    // Check performance
    if (this.perfMonitor.isPerformanceLow(30)) {
        // Reduce quality settings
    }
}
```

## Debugging Performance Issues

### Enable Performance Display

Press `P` key in-game to toggle performance metrics:

- FPS (Frames Per Second)
- Delta time between frames
- Physics steps per frame
- Physics computation time
- Memory usage (if available)

### Common Issues and Solutions

#### Issue: Game runs in "slow motion"

**Cause**: Physics not compensating for low frame rate
**Solution**: Implemented with fixed timestep system

#### Issue: Choppy movement

**Cause**: Variable frame timing
**Solution**: Added interpolation between physics steps

#### Issue: Input lag

**Cause**: Too many physics steps per frame
**Solution**: Capped at 3 steps maximum with accumulator reset

## System Requirements

### Minimum Requirements

- Any system capable of running modern web browser
- 30+ FPS for playable experience
- 2GB RAM recommended

### Recommended Requirements

- 60+ FPS capable system
- Hardware accelerated graphics
- 4GB+ RAM for smooth performance

## Testing Different Systems

### Simulating Low Performance

1. Open browser developer tools (F12)
2. Go to Performance tab
3. Enable CPU throttling (4x or 6x slowdown)
4. Monitor physics behavior - should remain consistent

### Performance Metrics to Monitor

- Physics steps should average 1 per frame at 60 FPS
- Physics time should be < 5ms per frame
- Accumulator should stay near 0 on capable systems
- FPS should gracefully degrade without affecting game speed

## Future Optimizations

### Planned Improvements

1. **Quality Presets** - Auto-adjust effects based on performance
2. **WebWorker Physics** - Run physics in separate thread
3. **Spatial Optimization** - Only update visible objects
4. **Asset Optimization** - Compressed textures and audio

### Performance Budget

Target performance metrics:

- Physics: < 5ms per frame
- Rendering: < 10ms per frame
- Total frame time: < 16.67ms (60 FPS)

## Conclusion

These optimizations ensure WynIsBuff2 provides a consistent experience across all reasonably capable systems. The fixed timestep physics system is the key improvement that prevents the "slow motion" effect on lower-end hardware while maintaining smooth visuals through interpolation.
