import Phaser from 'phaser';

/**
 * EnemyController handles a single enemy's creation and behavior.
 */
export class EnemyController {
    /**
     * @param {Phaser.Scene} scene
     * @param {RAPIER.World} world
     * @param {EventSystem} eventSystem
     * @param {number} x - spawn x position
     * @param {number} y - spawn y position
     * @param {string} key - texture key for the enemy sprite
     */
    constructor(scene, world, eventSystem, x, y, key) {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;
        this.x = x;
        this.y = y;
        this.key = key;
        this.sprite = null;
        this.body = null;
        this.create();
    }

    /**
     * Create the enemy sprite and placeholder behavior
     */
    create() {
        // Create visual representation
        if (this.scene.textures.exists(this.key)) {
            this.sprite = this.scene.add.sprite(this.x, this.y, this.key);
            this.sprite.setOrigin(0.5);
        } else {
            // Fallback placeholder rectangle
            this.sprite = this.scene.add.rectangle(this.x, this.y, 64, 64, 0xff0000);
        }
        
        // Enable Arcade physics body if needed (optional)
        // Placeholder: no physics body
    }

    /**
     * Update called each frame
     */
    update() {
        // Placeholder behavior: idle or simple animation
    }
}