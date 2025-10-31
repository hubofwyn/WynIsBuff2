# Changelog

## [Unreleased]

### Added

- **Scene Transition System**: Implemented old-school scene transitions when player passes the pulsating boss in level 1
    - Added `SCENE_TRANSITION` event to EventNames.js
    - Created "Victory Lap" scene (level1_scene2) with celebratory elements
    - Gold platforms, victory messages, high-value collectibles
    - Festive decorations including emojis and confetti effects

- **Visual Enhancements**: Added multiple visual improvements for better game feel
    - Gradient background overlay with three color layers
    - Atmospheric particles that drift down like dust/snow
    - Subtle vignette effect for depth
    - Pulsing green glow effect around the player sprite
    - Visual feedback for all game mechanics

### Changed

- **Jump Scaling Adjustments**: Made jump size changes much more subtle
    - Jump 1: 1.0x (normal size)
    - Jump 2: 1.05x (5% bigger, reduced from 10%)
    - Jump 3: 1.1x (10% bigger, reduced from 20%)
    - Adjusted squash/stretch effects to be more refined

- **PulsatingBoss Behavior**: Boss now triggers scene transition instead of just showing success message
    - Emits `SCENE_TRANSITION` event when player successfully passes
    - Boss becomes friendly (changes to smiling emoji) after being passed

### Fixed

- **Broken Image Issue**: Fixed missing mainlogo.png causing broken image in upper left
    - Changed WelcomeScene to use solid color background (#1a1a2e)
    - Removed dependency on missing image asset

### Technical Improvements

- Updated LevelData.js to include level1_scene2 in level progression
- Enhanced getNextLevelId() function to handle scene transitions
- Added scene transition handling in Game.js with fade effects
- Improved player visual feedback with dynamic glow effects

## Previous Updates

### Birthday Minigame & Performance (Previous Release)

- Added Wyn's 9th Birthday Rush minigame
- Implemented frame-rate independent physics for consistent cross-platform performance
- Added duck mechanic (C key) and pulsating boss
- Implemented dramatic triple jump mechanics with explosion on cooldown violation
- Doubled player sprite size for better visibility
