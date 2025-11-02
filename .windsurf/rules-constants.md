# Constants Files Rules

**Applies to:** `src/constants/**/*.js`

## Constants Directory Structure

```
src/constants/
├── Assets.js          # AUTO-GENERATED - Never edit manually
├── EventNames.js      # MANUAL - Event name constants
└── SceneKeys.js       # MANUAL - Scene key constants
```

## Critical Rules

### 1. Assets.js - AUTO-GENERATED (DO NOT EDIT)

**NEVER edit `Assets.js` manually.** It is generated from `/assets/manifest.json`.

**Workflow:**
1. Edit `/assets/manifest.json`
2. Run `bun run generate-assets`
3. Use generated constants

```javascript
// ✅ CORRECT - Use generated constants
import { ImageAssets, ImagePaths, AudioAssets, AudioPaths } from '../constants/Assets.js';

this.load.image(ImageAssets.PLAYER, ImagePaths.PLAYER);
this.load.audio(AudioAssets.JUMP, AudioPaths.JUMP);

// ❌ WRONG - Never edit Assets.js or use magic strings
this.load.image('player', 'sprites/player.png');
```

### 2. EventNames.js - MANUAL CURATION

Add all event names here with namespace:action format:

```javascript
// EventNames.js
export const EventNames = {
    // Player events
    PLAYER_SPAWN: 'player:spawn',
    PLAYER_JUMP: 'player:jump',
    PLAYER_LAND: 'player:land',
    PLAYER_DAMAGE: 'player:damage',
    PLAYER_DEATH: 'player:death',
    
    // Level events
    LEVEL_LOAD: 'level:load',
    LEVEL_COMPLETE: 'level:complete',
    LEVEL_RESET: 'level:reset',
    
    // Game events
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_OVER: 'game:over',
    
    // Scene events
    SCENE_READY: 'scene:ready',
    SCENE_SHUTDOWN: 'scene:shutdown',
    
    // Physics events
    PHYSICS_COLLISION: 'physics:collision',
    PHYSICS_TRIGGER: 'physics:trigger',
    
    // Audio events
    AUDIO_PLAY: 'audio:play',
    AUDIO_STOP: 'audio:stop',
};
```

**Naming Convention:**
- Constant name: `SCREAMING_SNAKE_CASE`
- Event value: `namespace:action` (lowercase)
- Group by namespace (player, level, game, etc.)

**When to Add:**
1. Creating new event-driven feature
2. Adding cross-module communication
3. Implementing new game mechanics

**Usage:**
```javascript
import { EventNames } from '../constants/EventNames.js';

// Emit
this.eventSystem.emit(EventNames.PLAYER_JUMP, { height: 100 });

// Listen
this.eventSystem.on(EventNames.PLAYER_JUMP, this.handleJump, this);
```

### 3. SceneKeys.js - MANUAL CURATION

Add all scene keys here:

```javascript
// SceneKeys.js
export const SceneKeys = {
    BOOT: 'Boot',
    PRELOADER: 'Preloader',
    MAIN_MENU: 'MainMenu',
    GAME: 'Game',
    BIRTHDAY_MINIGAME: 'BirthdayMinigame',
    PAUSE: 'Pause',
    GAME_OVER: 'GameOver',
};
```

**Naming Convention:**
- Constant name: `SCREAMING_SNAKE_CASE`
- Scene value: `PascalCase` (matches scene class name)

**When to Add:**
1. Creating new scene
2. Adding menu or UI overlay

**Usage:**
```javascript
import { SceneKeys } from '../constants/SceneKeys.js';

// Scene constructor
export class GameScene extends BaseScene {
    constructor() {
        super(SceneKeys.GAME);
    }
}

// Scene transitions
this.scene.start(SceneKeys.MAIN_MENU);
this.scene.launch(SceneKeys.PAUSE);
```

## Asset Management Workflow

### Adding New Assets

1. **Place asset file** in appropriate `/assets/` subdirectory:
   - Images: `/assets/images/`
   - Audio: `/assets/audio/`
   - Fonts: `/assets/fonts/`
   - Data: `/assets/data/`

2. **Update manifest.json**:
```json
{
    "images": [
        {
            "type": "image",
            "key": "new-sprite",
            "path": "images/sprites/new-sprite.png"
        }
    ],
    "audio": [
        {
            "type": "audio",
            "key": "new-sound",
            "path": "audio/sfx/new-sound.mp3"
        }
    ]
}
```

3. **Generate constants**:
```bash
bun run generate-assets
```

4. **Use in code**:
```javascript
import { ImageAssets, ImagePaths } from '../constants/Assets.js';
this.load.image(ImageAssets.NEW_SPRITE, ImagePaths.NEW_SPRITE);
```

### Validating Assets

```bash
bun run validate-assets  # Checks manifest integrity and file existence
```

## Constants Best Practices

1. **Never use magic strings** - Always use constants
2. **Keep constants organized** - Group by category/namespace
3. **Use descriptive names** - Make intent clear
4. **Follow naming conventions** - Consistency is key
5. **Document complex constants** - Add comments for clarity

## Testing Constants

Verify constants are used correctly:
- Check for magic strings in code review
- Run `bun run lint:boundaries` to check import boundaries
- Validate asset loading in Preloader scene

## Documentation

- Asset workflow: `ASSET_MANAGEMENT.md`
- Event system: `docs/systems/EVENT_SYSTEM.md`
- Scene management: `docs/systems/SCENE_MANAGEMENT.md`
