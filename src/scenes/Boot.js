import { BaseScene } from '@features/core';

import { SceneKeys } from '../constants/SceneKeys.js';
import { LOG } from '../observability/core/LogSystem.js';

export class Boot extends BaseScene {
    constructor() {
        super(SceneKeys.BOOT);
    }

    preload() {
        LOG.dev('BOOT_PRELOAD_STARTED', {
            subsystem: 'scene',
            scene: SceneKeys.BOOT,
            message: 'Boot scene preload started',
        });
        // Skip asset loading for now to test scene flow
        // this.load.image(ImageAssets.BACKGROUND, 'assets/' + ImagePaths.BACKGROUND);
    }

    create() {
        LOG.dev('BOOT_CREATED', {
            subsystem: 'scene',
            scene: SceneKeys.BOOT,
            message: 'Boot scene created',
        });

        // Boot scene should transition to Preloader
        LOG.dev('BOOT_TRANSITION_PRELOADER', {
            subsystem: 'scene',
            scene: SceneKeys.BOOT,
            message: 'Transitioning to Preloader scene',
            nextScene: SceneKeys.PRELOADER,
        });
        this.scene.start(SceneKeys.PRELOADER);
    }

    update(_time, _delta) {
        // Placeholder update method for Boot scene
    }
}
