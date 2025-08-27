import { Scene } from 'phaser';
import { SceneKeys } from '../constants/SceneKeys.js';
import { ImageAssets, ImagePaths } from '../constants/Assets.js';

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

    create ()
    {
        console.log('[Boot] Boot scene created');
        
        // Boot scene should transition to Preloader
        console.log('[Boot] Transitioning to Preloader scene...');
        this.scene.start(SceneKeys.PRELOADER);
    }
    
    update (time, delta)
    {
        // Placeholder update method for Boot scene
    }
}
