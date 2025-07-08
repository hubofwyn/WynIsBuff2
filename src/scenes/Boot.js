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
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image(ImageAssets.BACKGROUND, ImagePaths.BACKGROUND);
    }

    create ()
    {
        this.scene.start(SceneKeys.PRELOADER);
    }
    
    update (time, delta)
    {
        // Placeholder update method for Boot scene
    }
}
