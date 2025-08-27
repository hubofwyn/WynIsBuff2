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
        
        // Add visible test element
        this.add.text(400, 300, 'BOOT SCENE', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // TEMPORARY: Skip directly to Game scene to test movement
        this.time.delayedCall(1000, () => {
            console.log('[Boot] TEMPORARY: Bypassing to Game scene for movement testing...');
            this.scene.start(SceneKeys.GAME, { levelId: 'level1' });
        });
    }
    
    update (time, delta)
    {
        // Placeholder update method for Boot scene
    }
}
