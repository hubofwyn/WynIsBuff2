# Birthday Minigame Documentation

## Overview
"Wyn's 9th Birthday Shake Rush!" is a special minigame celebrating Wyn's birthday. Players must deliver exactly 9 S² Shake Shakes while avoiding obstacles in a fast-paced, side-scrolling challenge.

## Game Mechanics

### Core Gameplay Loop
1. **Pick up** - Run into S² Shake parcels (🧨) to collect them
2. **Avoid** - Dodge obstacles (💩 poop, 🚧 cones, 🦆 birds)  
3. **Deliver** - Move right to the green delivery zone while carrying
4. **Chain** - Build combos by delivering quickly without missing

### Controls
- **W/S or ↑/↓** - Change lanes (3 lanes total)
- **A/D or ← →** - Move left/right
- **SPACE** - Dash forward (3-second cooldown)

### Scoring System
- **Base points**: 100 per delivery
- **Time bonus**: 20 points per second remaining
- **Combo multiplier**: Exponential growth (1.5x per combo)
- **Speed bonus**: 2x for fast delivery, 3x for perfect
- **Perfect streak**: 100 bonus points per perfect delivery after 2

### Lives & Failure
- Start with 3 lives (❤️)
- Lose a life when:
  - Hitting an obstacle
  - Missing a parcel (goes off-screen)
  - Taking too long to deliver (10 seconds)
- Game ends when all lives are lost

### Progressive Difficulty
- Speed increases by 15% per delivery
- More obstacles spawn after 5 deliveries
- Spawn intervals decrease progressively
- Visual difficulty indicator (turns red at high levels)

## Technical Implementation

### Recent Bug Fixes

#### 1. Invisible Spawn Bug (Fixed)
**Root cause**: Delta time calculation error
```javascript
// Before (incorrect - treated delta as frame units)
const scrollSpeed = this.baseScrollSpeed * this.speedMultiplier * (delta / 16.67);

// After (correct - converts ms to seconds)
const scrollSpeed = this.baseScrollSpeed * this.speedMultiplier * (delta / 1000);
```

#### 2. Collision Timing Misalignment (Fixed)
**Root cause**: Using static player position instead of dynamic
```javascript
// Before (static position)
const collisionX = this.playerX; // Always 200

// After (dynamic position)
const collisionX = this.playerContainer?.x ?? this.playerX;
```

### Object Properties
- **Parcels**: Spawn from right at x=1100, scroll left at base speed
- **Obstacles**: 
  - Poop (💩): Standard speed, plays fart sound on hit
  - Cone (🚧): 30% faster, wobbles vertically
  - Bird (🦆): 20% slower, flaps wings
- **Delivery Zone**: Right side at x=900+, green pulsing area

### Special Features
- **Birthday Celebration**: Special animation at 9 deliveries with:
  - Animated cake with 9 candles
  - 90 pieces of confetti (9 x 10)
  - Floating 9s and shake bottles
  - Giant pulsing "9" in background
- **Leaderboard**: Top 10 scores saved locally
- **Audio**: Birthday-themed music, sound effects for all actions

## Code Structure

### Scene: `BirthdayMinigame` (`src/scenes/BirthdayMinigame.js`)

Key methods:
- `create()` - Initialize game elements
- `update()` - Main game loop
- `spawnParcel()` - Create collectible items
- `spawnObstacle()` - Create hazards
- `checkCollisions()` - Handle player interactions
- `makeDelivery()` - Process successful deliveries
- `showBirthdaySurprise()` - 9th delivery celebration

### State Management
- `gameStarted` - Prevents update before player starts
- `isCarrying` - Tracks if player has a parcel
- `deliveries` - Count towards goal of 9
- `combo` - Current delivery streak
- `lives` - Remaining attempts
- `speedMultiplier` - Difficulty scaling

## Future Enhancements
- Power-ups (speed boost, invincibility)
- Different parcel types with varying point values
- Seasonal themes (Halloween, Christmas)
- Multiplayer racing mode
- Global leaderboards