import { Scene } from 'phaser';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets, ImagePaths } from '../constants/Assets.js';
import * as RAPIER from '@dimforge/rapier2d-compat';

export class Boot extends Scene
{
    constructor ()
    {
        super(SceneKeys.BOOT);
    }

    preload ()
    {
        console.log('[Boot] Boot scene preload started');
        // Skip asset loading for now to test scene flow
        // this.load.image(ImageAssets.BACKGROUND, 'assets/' + ImagePaths.BACKGROUND);
    }

    async create ()
    {
        console.log('[Boot] Boot scene created');
        
        // CRITICAL: Initialize RAPIER before anything else
        console.log('[Boot] Initializing RAPIER physics engine...');
        try {
            // Prefer modern init signature; fall back if needed
            try {
                await RAPIER.init({});
            } catch (e) {
                await RAPIER.init();
            }
            console.log('[Boot] ✅ RAPIER initialized successfully');
            
            // Store RAPIER in registry for all scenes to access
            this.registry.set('RAPIER', RAPIER);
            console.log('[Boot] RAPIER stored in registry');
            
            // Boot scene should transition to Preloader
            console.log('[Boot] Transitioning to Preloader scene...');
            this.scene.start(SceneKeys.PRELOADER);
        } catch (error) {
            console.error('[Boot] ❌ Failed to initialize RAPIER:', error);
            // Show error to user
            this.add.text(512, 384, 'Failed to initialize physics engine', {
                fontSize: '32px',
                color: '#ff0000'
            }).setOrigin(0.5);
        }
    }
    
    update (time, delta)
    {
        // Placeholder update method for Boot scene
    }
}
