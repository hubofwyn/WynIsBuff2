import Phaser from 'phaser';
import RAPIER from '@dimforge/rapier2d-compat';

import { EventNames } from '../../constants/EventNames';

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
        // Patrol parameters
        this.startX = x;
        this.patrolRange = 100;
        this.patrolSpeed = 50;
        this.patrolDir = 1;
        this.create();
    }

    /**
     * Create the enemy sprite, physics body, and patrol behavior
     */
    create() {
        // Create visual representation
        if (this.scene.textures.exists(this.key)) {
            this.sprite = this.scene.add.sprite(this.x, this.y, this.key);
        } else {
            // Fallback placeholder rectangle
            this.sprite = this.scene.add.rectangle(this.x, this.y, 64, 64, 0xff0000);
        }
        // Normalize display size
        this.sprite.setOrigin(0.5);
        this.sprite.setDisplaySize(64, 64);
        // Create kinematic physics body
        const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositioned({ x: this.x, y: this.y });
        this.body = this.world.createRigidBody(bodyDesc);
        // Create collider sized to sprite
        const colliderDesc = RAPIER.ColliderDesc.cuboid(32, 32);
        this.world.createCollider(colliderDesc, this.body);
        // Register with PhysicsManager for sprite sync
        if (this.scene.physicsManager) {
            this.scene.physicsManager.registerBodySprite(this.body, this.sprite);
        }
    }

    /**
     * Update called each frame - handles patrol movement
     * @param {number} time
     * @param {number} delta
     */
    update(time, delta) {
        if (!this.body) return;
        // Patrol logic: move horizontally and reverse at range limits
        const pos = this.body.translation();
        if (pos.x >= this.startX + this.patrolRange) {
            this.patrolDir = -1;
        } else if (pos.x <= this.startX - this.patrolRange) {
            this.patrolDir = 1;
        }
        // Apply velocity
        this.body.setLinvel({ x: this.patrolSpeed * this.patrolDir, y: 0 }, true);
    }
}
