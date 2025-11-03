# Actual Level Design Implementation - WynIsBuff2

**Date**: November 2, 2025  
**Status**: Current Implementation (Code Analysis)  
**Purpose**: Document how levels are ACTUALLY implemented, not how they're planned

---

## Overview

This document describes the **actual, working implementation** of level design in WynIsBuff2, based on code analysis rather than design documentation. The implementation is simpler and more focused than the extensive design documents suggest.

---

## Current Implementation Status

### ✅ Fully Implemented
- **Level 1** ("First Steps") - Complete with boss, collectibles, platforms
- **Level 1 Scene 2** ("Victory Lap") - Post-boss celebration scene
- **Character Selection** - 3 playable characters
- **PulsatingBoss** - Level 1's unique obstacle-based boss

### 📝 Defined But Not Implemented
- Level 2, 3, 4, 5 - Data exists in `LevelData.js` but not tested/used
- Generic `BossController` - Code exists but not used
- Generic `EnemyController` - Code exists but not spawned in level 1

---

## Architecture: How Levels Actually Work

### **Scene Flow**
```
Preloader → WelcomeScene → CharacterSelect → MainMenu → Game Scene
                                                          ↓
                                                    LevelManager loads level data
```

### **Component Hierarchy**

```
Game.js (Scene)
  ├─ LevelManager (Facade for all level systems)
  │   ├─ LevelLoader (Loads level data, spawns entities)
  │   ├─ GroundFactory (Creates static ground)
  │   ├─ PlatformFactory (Creates static platforms)
  │   ├─ MovingPlatformController (Creates/updates moving platforms)
  │   ├─ CollectibleManager (Spawns/manages collectibles)
  │   ├─ LevelCompletionManager (Handles level completion triggers)
  │   └─ LevelTransitionController (Handles scene transitions)
  │
  ├─ PlayerController (Player character with KinematicCharacterController)
  ├─ PhysicsManager (Rapier physics world)
  ├─ EventSystem (Event-driven communication)
  ├─ UIManager (HUD, health, score)
  ├─ ParticleManager (Visual effects)
  ├─ CameraManager (Camera effects, shake, zoom)
  └─ ColorManager (Accessibility color palettes)
```

---

## Level Data Structure

### **Location**: `src/constants/LevelData.js`

All levels are defined as **static configuration objects**, not procedurally generated or loaded from external files.

### **Level Configuration Schema**

```javascript
{
    id: 'level1',                    // Unique identifier
    name: 'First Steps',             // Display name
    description: 'Learn basic...',   // Description
    
    // Player spawn point
    playerStart: { x: 100, y: 580 },
    
    // Static ground
    ground: { 
        width: 1024, 
        height: 50, 
        y: 700 
    },
    
    // Static platforms (array of platform configs)
    platforms: [
        { x, y, width, height, color }
    ],
    
    // Moving platforms (array of moving platform configs)
    movingPlatforms: [
        { 
            x, y, width, height, color,
            movement: { 
                type: 'horizontal'|'vertical', 
                distance, 
                speed 
            }
        }
    ],
    
    // Collectibles (proteins, dumbbells)
    collectibles: [
        { x, y, type: 'protein'|'dumbbell', value }
    ],
    
    // Boss configuration
    boss: {
        type: 'pulsating',  // Only type implemented
        x, y, size
    },
    
    // Regular enemies (not used in level 1)
    enemies: [],
    
    // Decorative elements
    decorations: [
        { x, y, type: 'text'|'emoji'|'rect', ... }
    ],
    
    // Level completion trigger zone
    completionTrigger: {
        x, y, width, height,
        requireAllCollectibles: boolean
    },
    
    // Background configuration
    background: {
        color: 0xHEXCOLOR,
        image: 'assetKey',
        layers: [
            { key: 'parallax-sky', scrollFactor: 0.2 }
        ]
    },
    
    // UI configuration
    ui: {
        instructionText: 'Get Buff! Use WASD...',
        themeColor: 0xHEXCOLOR
    }
}
```

---

## Level 1: "First Steps" - Detailed Analysis

### **Theme**: Gym/Buff Training
### **Goal**: Navigate platforms, avoid pulsating boss, reach completion trigger

### **Playable Characters** (3 options)
1. **Ila** (`ilaSprite`) - "Favorite Sister" - Swift and agile
2. **Axel** (`axelSprite`) - "Not Buff Axel" - Balanced fighter
3. **Wyn** (`wynSprite`) - "Wyn the Buff" - Maximum power

All characters use the **same PlayerController** with identical physics. Character selection is **cosmetic only** (different sprites).

### **Physics System**
- **Engine**: Rapier (via PhysicsManager)
- **Player**: KinematicCharacterController (advanced movement, not basic RigidBody)
- **Gravity**: Defined in `PhysicsConfig` (default: 9.8 m/s²)
- **Platforms**: Static RigidBodies with box colliders
- **Boss**: Fixed RigidBody with ball collider (sensor = true, no physics response)

### **Level Layout**

**Dimensions**: 1024px wide × 768px tall viewport

**Ground**: 
- Position: y=700
- Width: 1024px
- Height: 50px
- Type: Static platform

**Static Platforms**: 10 platforms
```javascript
// Starting section
{ x: 200, y: 640, width: 150, height: 20 }  // First jump
{ x: 400, y: 580, width: 120, height: 20 }  // Higher jump

// Mid section
{ x: 600, y: 520, width: 100, height: 20 }  // Smaller platform
{ x: 750, y: 460, width: 80, height: 20 }   // Even smaller

// Challenge section (boss area)
{ x: 900, y: 400, width: 120, height: 20 }  // Boss platform
{ x: 1050, y: 350, width: 100, height: 20 } // Victory platform

// Bonus platforms
{ x: 300, y: 500, width: 60, height: 15 }   // Optional collectible
{ x: 850, y: 550, width: 60, height: 15 }   // Another optional

// Post-boss area
{ x: 1250, y: 450, width: 80, height: 20 }  // Bonus area
{ x: 1400, y: 400, width: 100, height: 20 } // Final stretch
```

**Moving Platforms**: None in level 1

### **Collectibles**: 8 items

**Proteins** (6 items, 10-25 points each):
- On main path platforms (4 items)
- On bonus platforms (2 items)

**Dumbbells** (2 items, 50-100 points):
- Victory platform (50 points)
- Secret high jump reward (100 points)

**Collection Mechanic**:
- Managed by `CollectibleManager`
- Sensor colliders detect player overlap
- Emits `COLLECTIBLE_COLLECTED` event
- Updates score via EventSystem
- Visual/audio feedback on collection

### **Boss: PulsatingBoss**

**Type**: Obstacle-based (not combat-based)
**Goal**: Avoid it, don't fight it

**Implementation** (`src/modules/enemy/PulsatingBoss.js`):
```javascript
class PulsatingBoss {
    // Visual
    - Red circle sprite with glow effect
    - Menacing face emoji (👹)
    - "DANGER!" warning text (pulsating)
    
    // Physics
    - Fixed RigidBody (doesn't move)
    - Ball collider (radius: 80px)
    - Sensor: true (detects collision, no physics response)
    
    // Behavior
    - Pulsates between 0.8x - 1.3x scale
    - Cycle duration: 2000ms
    - Position: x=900, y=370 (above boss platform)
    
    // Collision
    - Detects player overlap via sensor
    - Emits SCENE_TRANSITION event when player passes
    - Tracks playerPassed state
}
```

**Boss Mechanics**:
1. Player must navigate around the boss
2. Touching boss triggers scene transition (not death)
3. Transition goes to `level1_scene2` (Victory Lap)
4. Boss is purely visual threat with pulsating animation

### **Decorations**: 14 elements

**Text Signs** (4 items):
- "GET BUFF!" at start
- "KEEP GOING!" mid-level
- "DANGER AHEAD!" before boss
- "VICTORY!" at end

**Emojis** (4 items):
- 🏋️ Weight lifter
- 💪 Flex
- 🥤 Protein shake
- 🏆 Trophy (at victory area)

**Background Props** (2 items):
- Weight rack (gray rectangle)
- Bench (gray rectangle)

**Note**: Decorations are **visual only**, no physics or interaction.

### **Background Layers**

**Parallax Scrolling** (3 layers):
1. Sky layer (scrollFactor: 0.2) - Slowest
2. Mountains layer (scrollFactor: 0.5) - Medium
3. Foreground layer (scrollFactor: 0.8) - Fastest

**Fallback**: Sky blue color (0x87ceeb) if images not loaded

### **Level Completion**

**Trigger Zone**:
- Position: x=1150, y=400
- Size: 60px × 100px
- Type: Sensor collider
- Requirement: `requireAllCollectibles: false` (can skip collectibles)

**Completion Flow**:
1. Player enters trigger zone
2. `LevelCompletionManager` detects overlap
3. Emits `LEVEL_COMPLETE` event
4. Saves progress to `GameStateManager`
5. Transitions to next level or main menu

### **UI Elements**

**HUD** (managed by UIManager):
- Score display
- Health/lives (if implemented)
- Instruction text: "Get Buff! Use WASD or Arrow Keys to pump up and SPACE to jump!"

**Theme Color**: Yellow (0xFFFF00) for UI accents

---

## Level 1 Scene 2: "Victory Lap"

### **Purpose**: Celebration scene after avoiding boss

**Differences from Level 1**:
- Wider (1600px vs 1024px)
- Gold-colored platforms (0xFFD700)
- 1 moving platform (vertical, 150px distance)
- More valuable collectibles (dumbbells worth 50-500 points)
- Celebratory decorations (🎉🏆💪🎊🥳🏅)
- No boss, no enemies
- Festive background (bright blue 0x1E90FF)

**Completion**: Leads to next level or main menu

---

## Player Controller Details

### **Movement System**: KinematicCharacterController

**Not** a simple RigidBody - uses Rapier's advanced character controller for:
- Smooth movement
- Proper ground detection
- Coyote time (grace period after leaving platform)
- Jump buffering (press jump slightly before landing)
- Variable jump height (hold jump for higher)

### **Controls**:
- **Movement**: WASD or Arrow Keys
- **Jump**: SPACE
- **Abilities**: (Not implemented in level 1)

### **Physics Properties** (from PlayerController):
```javascript
// Movement
maxSpeed: 5.0 m/s (horizontal)
acceleration: 20.0 m/s²
friction: 15.0 m/s²

// Jumping
jumpForce: 8.0 m/s (upward velocity)
maxJumps: 1 (single jump in level 1)
coyoteTime: 0.1s (grace period)
jumpBufferTime: 0.1s (early jump input)

// Gravity
gravity: 9.8 m/s² (from PhysicsConfig)
```

### **Player Sprite**:
- Selected character sprite (ilaSprite, axelSprite, or wynSprite)
- Animations: idle, walk, jump (if defined in Preloader)
- Scale: Adjusted for larger sprites
- Depth: Above platforms, below UI

---

## Enemy System (Partially Implemented)

### **EnemyController** (`src/modules/enemy/EnemyController.js`)
- Generic enemy class
- **Not used in level 1** (enemies array is empty)
- Would support basic AI and physics
- Designed for future levels

### **BossController** (`src/modules/enemy/BossController.js`)
- Generic boss class
- **Not used** (level 1 uses PulsatingBoss instead)
- Would support more complex boss fights
- Designed for future levels

### **PulsatingBoss** (Level 1 specific)
- **Only implemented boss type**
- Obstacle-based, not combat-based
- See detailed description above

---

## Level Loading Process

### **Flow** (from `LevelLoader.js`):

```javascript
1. Game.create() calls LevelManager.loadLevel('level1')
2. LevelLoader.loadLevel(levelId)
   ├─ Get level config from LevelData.js
   ├─ Clear existing level elements
   └─ Initialize level:
       ├─ Setup background (color, parallax layers)
       ├─ Create ground (GroundFactory)
       ├─ Create platforms (PlatformFactory)
       ├─ Create moving platforms (MovingPlatformController)
       ├─ Create collectibles (CollectibleManager)
       ├─ Create completion trigger (LevelCompletionManager)
       ├─ Update UI (instruction text, theme)
       ├─ Spawn enemies (if any - none in level 1)
       └─ Spawn boss (PulsatingBoss via dynamic import)
3. Emit LEVEL_LOADED event
4. PlayerController spawns at playerStart position
5. Game loop begins
```

### **Dynamic Imports**:
Boss classes are loaded dynamically to avoid loading unused code:
```javascript
// In LevelLoader.js
if (levelConfig.boss.type === 'pulsating') {
    import('../enemy/PulsatingBoss.js').then(module => {
        const boss = new module.PulsatingBoss(...);
    });
}
```

---

## Event-Driven Architecture

### **Key Events** (from `EventNames.js`):

**Level Events**:
- `LEVEL_LOADED` - Level initialization complete
- `LEVEL_COMPLETE` - Player reached completion trigger
- `SCENE_TRANSITION` - Transition to different scene (e.g., boss passed)

**Player Events**:
- `PLAYER_SPAWN` - Player created
- `PLAYER_JUMP` - Player jumped
- `PLAYER_LAND` - Player landed on ground
- `PLAYER_DAMAGE` - Player took damage
- `PLAYER_DEATH` - Player died

**Collectible Events**:
- `COLLECTIBLE_COLLECTED` - Player collected item

**Collision Events**:
- `COLLISION_START` - Physics collision began
- `COLLISION_END` - Physics collision ended

### **Event Flow Example** (Collectible):
```
1. Player overlaps collectible sensor
2. PhysicsManager detects collision
3. Emits COLLISION_START event
4. CollectibleManager listens, checks if collectible
5. Emits COLLECTIBLE_COLLECTED event
6. UIManager updates score display
7. AudioManager plays collection sound
8. ParticleManager spawns collection effect
9. Collectible sprite destroyed
```

---

## Factory Pattern for Level Elements

### **GroundFactory**
- Creates static ground platform
- Single large rectangle at bottom of level
- Fixed RigidBody with box collider

### **PlatformFactory**
- Creates static platforms from array
- Each platform: position, size, color
- Fixed RigidBody with box collider
- Stores body-to-sprite mapping for rendering

### **MovingPlatformController**
- Creates kinematic platforms (not in level 1)
- Supports horizontal/vertical movement
- Updates platform positions each frame
- Syncs physics body with sprite

### **CollectibleManager**
- Spawns collectibles from array
- Creates sensor colliders (no physics response)
- Tracks collected items
- Handles collection events

---

## Differences from Design Documents

### **What's Actually Implemented**:
✅ Level 1 with platforms, collectibles, boss  
✅ Level 1 Scene 2 (victory lap)  
✅ Character selection (3 characters)  
✅ PulsatingBoss (obstacle-based)  
✅ Event-driven architecture  
✅ Factory pattern for level elements  
✅ Parallax backgrounds  
✅ Collectible system  

### **What's Planned But Not Implemented**:
❌ Levels 2-5 (data exists, not tested)  
❌ Generic enemy spawning (code exists, not used)  
❌ Combat-based bosses (BossController not used)  
❌ Advanced level features (hazards, triggers, etc.)  
❌ Procedural generation  
❌ External level file loading  
❌ Level editor  

### **Architectural Simplifications**:
- **No modular level chunks** - Levels are monolithic configs
- **No level streaming** - Entire level loads at once
- **No dynamic difficulty** - Static configurations
- **No procedural content** - All hand-authored
- **No save/checkpoint system** - Progress tracked per level only

---

## Level Design Workflow (Current)

### **To Add a New Level**:

1. **Add level data** to `src/constants/LevelData.js`:
   ```javascript
   export const LevelData = {
       level2: {
           id: 'level2',
           name: 'My Level',
           // ... configuration
       }
   };
   ```

2. **Update level list** in `getLevelIds()`:
   ```javascript
   export function getLevelIds() {
       return ['level1', 'level1_scene2', 'level2'];
   }
   ```

3. **Create assets** (if needed):
   - Background images
   - Platform textures
   - Enemy sprites
   - Add to `manifest.json`
   - Run `bun run generate-assets`

4. **Test level**:
   ```javascript
   // In MainMenu or Game scene
   this.scene.start(SceneKeys.GAME, { levelId: 'level2' });
   ```

5. **No code changes needed** - LevelLoader handles everything

---

## Performance Considerations

### **Optimizations**:
- Static platforms use shared textures
- Physics bodies reuse collider shapes
- Decorations are visual only (no physics)
- Boss uses dynamic import (lazy loading)
- Parallax layers use sprite reuse

### **Limitations**:
- All level data in memory (not streamed)
- No object pooling for collectibles
- No spatial partitioning for collisions
- Single physics world for entire level

---

## Testing & Debugging

### **Observability**:
- All level events logged via `LOG` system
- Debug mode shows physics bodies
- Error pattern detection for crashes
- State providers for player/physics debugging

### **Debug Commands** (in browser console):
```javascript
// View level data
window.debugAPI.getLevelConfig('level1')

// View player state
window.debugAPI.getPlayerState()

// View physics state
window.debugAPI.getPhysicsState()

// Export logs
window.LOG.export()
```

---

## Summary

### **Current Reality**:
- **1 fully implemented level** (level 1 + victory lap)
- **Simple, data-driven architecture** (no complex systems)
- **Event-driven communication** (clean separation of concerns)
- **Factory pattern** for level elements (reusable, testable)
- **Obstacle-based boss** (avoid, not fight)
- **3 cosmetic character choices** (same physics)

### **Architecture Strengths**:
- ✅ Clean separation (LevelManager facade)
- ✅ Event-driven (loose coupling)
- ✅ Factory pattern (reusable)
- ✅ Observable (comprehensive logging)
- ✅ Extensible (easy to add levels)

### **Architecture Gaps**:
- ❌ No modular level system
- ❌ No advanced enemy AI
- ❌ No combat mechanics
- ❌ No checkpoint/save system
- ❌ No level editor

### **Recommendation**:
The current implementation is **solid for a simple platformer**. Before adding complexity (modular chunks, procedural generation, advanced AI), **complete and test levels 2-5** using the existing system. The architecture can scale to 5-10 levels without major changes.

---

**Last Updated**: November 2, 2025  
**Next Review**: After implementing level 2  
**Maintainer**: Architecture Team
