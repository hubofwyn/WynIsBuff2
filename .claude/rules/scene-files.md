---
globs: src/scenes/**/*.js
---

# Scene Files Rules

All scenes MUST extend `BaseScene` from `@features/core`, never `Phaser.Scene` directly.

```javascript
import { BaseScene } from '@features/core';
import { SceneKeys } from '../constants/SceneKeys.js';

export class MyScene extends BaseScene {
    constructor() {
        super(SceneKeys.MY_SCENE);
    }
}
```

**Strict rules:**
- Use `SceneKeys.*` constants for all scene references (constructor, transitions)
- Use `ImageAssets.*` / `AudioAssets.*` for asset loading
- Use `EventNames.*` for event emission
- Clean up resources in `shutdown()` method
- Use `LOG` from `@observability` for logging, never `console.*`
- NO direct imports from `phaser`, `@dimforge/rapier2d-compat`, or `howler`
