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
        
        // TRIAGE FIX: Patch WebGL context to prevent mipmap generation
        // This must be done early, before any textures are loaded
        if (this.sys.game.renderer && this.sys.game.renderer.gl) {
            const gl = this.sys.game.renderer.gl;
            
            // Override generateMipmap to be a no-op
            gl.generateMipmap = function(_target) {
                // Do nothing - prevents mipmap generation errors
                // This is safe because we're using LINEAR filtering everywhere
            };
            
            LOG.info('BOOT_WEBGL_MIPMAP_DISABLED', {
                subsystem: 'scene',
                scene: 'Boot',
                message: 'WebGL mipmap generation disabled globally',
                hint: 'Prevents GL_INVALID_OPERATION errors for non-POT textures',
            });
        }
        
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
