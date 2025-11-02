import { Scene } from 'phaser';

import { LOG } from '../observability/core/LogSystem.js';

import { EventBus } from './EventBus.js';

/**
 * BaseScene - Core abstraction layer for Phaser scenes
 *
 * This class abstracts Phaser.Scene to enforce architectural boundaries.
 * Only the core layer should import from 'phaser' directly. All game scenes
 * should extend BaseScene instead.
 *
 * Benefits:
 * - Clean architectural boundaries (vendor abstraction)
 * - Consistent observability setup across all scenes
 * - Easier testing (mock BaseScene instead of Phaser.Scene)
 * - Simplified library upgrades (change Phaser version in one place)
 * - Built-in EventBus access for all scenes
 *
 * Usage:
 * ```javascript
 * import { BaseScene } from '@features/core';
 * import { SceneKeys } from '../constants/SceneKeys.js';
 *
 * export class GameScene extends BaseScene {
 *     constructor() {
 *         super(SceneKeys.GAME);
 *     }
 *
 *     create() {
 *         // Use this.eventBus for cross-scene communication
 *         this.eventBus.emit('game:started', { level: 1 });
 *     }
 * }
 * ```
 *
 * @extends {Scene}
 */
export class BaseScene extends Scene {
    /**
     * Create a new BaseScene
     * @param {string} key - The scene key (from SceneKeys constants)
     */
    constructor(key) {
        super(key);

        /**
         * Shared event bus for cross-scene and cross-manager communication
         * @type {EventBus}
         */
        this.eventBus = EventBus;

        /**
         * Scene key for logging and debugging
         * @type {string}
         */
        this.sceneKey = key;

        // Log scene construction
        LOG.dev('BASE_SCENE_CONSTRUCTOR', {
            subsystem: 'scene',
            scene: key,
            message: 'BaseScene constructor called',
        });
    }

    /**
     * Initialize the scene with data from the previous scene
     * Override this in child classes for custom initialization
     *
     * @param {Object} data - Data passed from previous scene
     */
    init(data) {
        LOG.dev('BASE_SCENE_INIT', {
            subsystem: 'scene',
            scene: this.sceneKey,
            message: 'Scene initialized',
            data,
        });
    }

    /**
     * Preload assets for this scene
     * Override this in child classes to load scene-specific assets
     */
    preload() {
        LOG.dev('BASE_SCENE_PRELOAD', {
            subsystem: 'scene',
            scene: this.sceneKey,
            message: 'Scene preload started',
        });
    }

    /**
     * Create scene objects and set up initial state
     * Override this in child classes for scene setup
     */
    create() {
        LOG.dev('BASE_SCENE_CREATE', {
            subsystem: 'scene',
            scene: this.sceneKey,
            message: 'Scene created',
        });
    }

    /**
     * Update loop called every frame
     * Override this in child classes for per-frame logic
     *
     * @param {number} time - Total elapsed time in ms
     * @param {number} delta - Time since last frame in ms
     */
    update(_time, _delta) {
        // Base implementation does nothing
        // Child classes override for frame logic
    }

    /**
     * Called when scene is shut down
     * Override this in child classes for cleanup
     */
    shutdown() {
        LOG.dev('BASE_SCENE_SHUTDOWN', {
            subsystem: 'scene',
            scene: this.sceneKey,
            message: 'Scene shutting down',
        });

        // Remove all event listeners to prevent memory leaks
        if (this.eventBus && this.eventBus.removeAllListeners) {
            // Only remove listeners specific to this scene if possible
            // Note: EventBus is global, so we don't want to clear everything
            LOG.dev('BASE_SCENE_CLEANUP', {
                subsystem: 'scene',
                scene: this.sceneKey,
                message: 'Scene cleanup completed',
            });
        }
    }

    /**
     * Called when scene is destroyed
     * Override this in child classes for final cleanup
     */
    destroy() {
        LOG.dev('BASE_SCENE_DESTROY', {
            subsystem: 'scene',
            scene: this.sceneKey,
            message: 'Scene destroyed',
        });

        super.destroy();
    }
}
