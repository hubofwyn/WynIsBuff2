# Add Scene

Step-by-step workflow for adding a new scene to WynIsBuff2.

## Usage

`/add-scene "Scene name and purpose"`

## Steps

1. **Add scene key** to `src/constants/SceneKeys.js`

   ```javascript
   export const SceneKeys = {
       // ... existing keys
       YOUR_SCENE: 'YourScene',
   };
   ```

2. **Create scene class** in `src/scenes/YourScene.js`

   ```javascript
   import { BaseScene } from '@features/core';
   import { SceneKeys } from '../constants/SceneKeys.js';
   import { LOG } from '@observability';

   export class YourScene extends BaseScene {
       constructor() {
           super(SceneKeys.YOUR_SCENE);
       }

       preload() {
           // Load assets using ImageAssets.* constants
       }

       create() {
           LOG.info('SCENE_CREATE', { subsystem: 'scene', message: 'YourScene created' });
           // Scene setup
       }

       shutdown() {
           // Clean up resources
       }
   }
   ```

3. **Register scene** in the game config (usually `src/main.js` or game config file)

4. **Add events** to `src/constants/EventNames.js` if needed

5. **Verify**
   - Run `bun test`
   - Run `bun run arch:health`
   - Test scene transitions with `this.scene.start(SceneKeys.YOUR_SCENE)`

## Rules

- Extend `BaseScene` from `@features/core`, never `Phaser.Scene`
- Use `SceneKeys.*` constant in constructor
- Use structured logging (LOG), never console.*
- Clean up in `shutdown()` method
