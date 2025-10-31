import Phaser from 'phaser';

import { EventNames } from '../constants/EventNames.js';
import { createEmptyInputState } from '../types/InputState.js';
import { LOG } from '../observability/core/LogSystem.js';

import { GameStateManager } from './GameStateManager.js';
import { BaseManager } from './BaseManager.js';

/**
 * InputManager handles mapping of keyboard inputs to game events.
 * Follows the singleton pattern via BaseManager.
 */
export class InputManager extends BaseManager {
    /**
     * Construct InputManager as a singleton
     */
    constructor() {
        super();
        if (this.isInitialized()) return;

        this.scene = null;
        this.eventSystem = null;
        this.keys = {};
    }

    /**
     * Initialize key mappings and listeners
     * @param {Phaser.Scene} scene - The scene to register input on
     * @param {EventSystem} eventSystem - The central event bus
     */
    init(scene, eventSystem) {
        LOG.dev('INPUT_INIT_START', {
            subsystem: 'input',
            message: 'Initializing InputManager',
        });
        this.scene = scene;
        this.eventSystem = eventSystem;
        const { keyboard } = this.scene.input;

        // Arrow keys
        this.keys.cursors = keyboard.createCursorKeys();
        LOG.dev('INPUT_CURSOR_KEYS_CREATED', {
            subsystem: 'input',
            message: 'Created cursor keys',
        });

        // WASD and SPACE keys for movement and jumping
        ['W', 'A', 'S', 'D', 'SPACE'].forEach((keyName) => {
            this.keys[keyName] = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[keyName]);
        });
        LOG.dev('INPUT_WASD_KEYS_CREATED', {
            subsystem: 'input',
            message: 'Created WASD and SPACE keys',
            keys: ['W', 'A', 'S', 'D', 'SPACE'],
        });

        // Reset key (R)
        this.keys.R = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        // Duck key (C)
        this.keys.C = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        LOG.dev('INPUT_ACTION_KEYS_CREATED', {
            subsystem: 'input',
            message: 'Created R and C keys',
            keys: ['R', 'C'],
        });

        // Arrow key events
        this.keys.cursors.left.on('down', () => this.eventSystem.emit(EventNames.MOVE_LEFT));
        this.keys.cursors.right.on('down', () => this.eventSystem.emit(EventNames.MOVE_RIGHT));
        this.keys.cursors.up.on('down', () => this.eventSystem.emit(EventNames.MOVE_UP));
        this.keys.cursors.down.on('down', () => this.eventSystem.emit(EventNames.MOVE_DOWN));

        // Dynamic keybindings (Jump, Move Left/Right, Pause)
        const gs = new GameStateManager();
        const bindings = gs.settings.keybindings;
        const actionMap = {
            jump: EventNames.JUMP,
            left: EventNames.MOVE_LEFT,
            right: EventNames.MOVE_RIGHT,
            pause: EventNames.PAUSE,
        };
        Object.entries(actionMap).forEach(([action, eventName]) => {
            const keyName = bindings[action];
            const keyCode = Phaser.Input.Keyboard.KeyCodes[keyName];
            if (keyCode) {
                const keyObj = keyboard.addKey(keyCode);
                keyObj.on('down', () => this.eventSystem.emit(eventName));
                this.keys[action] = keyObj;
            }
        });

        // Level reset (R)
        this.keys.R.on('down', () => this.eventSystem.emit(EventNames.LEVEL_RESET));

        LOG.dev('INPUT_KEYS_INITIALIZED', {
            subsystem: 'input',
            message: 'All keys initialized',
            keyCount: Object.keys(this.keys).length,
            keys: Object.keys(this.keys),
        });

        // Mark as initialized
        this.setInitialized();
        LOG.dev('INPUT_INIT_COMPLETE', {
            subsystem: 'input',
            message: 'InputManager initialization complete',
        });
    }

    /**
     * Get a snapshot of the current input state for this frame
     * @returns {InputState} Immutable input state snapshot
     */
    getSnapshot() {
        // Debug: Log occasionally
        if (Math.random() < 0.005) {
            LOG.dev('INPUT_SNAPSHOT_SAMPLE', {
                subsystem: 'input',
                message: 'getSnapshot called (sampled)',
                state: {
                    hasCursors: !!this.keys.cursors,
                    hasSpace: !!this.keys.SPACE,
                },
            });
        }

        if (!this.keys.cursors || !this.keys.SPACE) {
            LOG.warn('INPUT_KEYS_NOT_INITIALIZED', {
                subsystem: 'input',
                message: 'Keys not initialized, returning empty state',
                hint: 'Ensure InputManager.init() is called before getSnapshot()',
                state: {
                    hasCursors: !!this.keys.cursors,
                    hasSpace: !!this.keys.SPACE,
                },
            });
            return createEmptyInputState();
        }

        const justDown = Phaser.Input.Keyboard.JustDown;
        const justUp = Phaser.Input.Keyboard.JustUp;

        return {
            left: this.keys.cursors.left.isDown || this.keys.A.isDown,
            right: this.keys.cursors.right.isDown || this.keys.D.isDown,
            up: this.keys.cursors.up.isDown || this.keys.W.isDown,
            down: this.keys.cursors.down.isDown || this.keys.S.isDown,
            jump: this.keys.SPACE.isDown || this.keys.cursors.up.isDown,
            jumpPressed: justDown(this.keys.SPACE) || justDown(this.keys.cursors.up),
            jumpReleased: justUp(this.keys.SPACE) || justUp(this.keys.cursors.up),
            duck: this.keys.C.isDown || this.keys.cursors.down.isDown,
        };
    }

    /**
     * Remove listeners (cleanup)
     */
    destroy() {
        Object.values(this.keys).forEach((key) => {
            if (key && key.off) {
                key.removeAllListeners?.();
            }
        });
        this.keys = {};
        this.scene = null;
        this.eventSystem = null;

        // Call parent destroy
        super.destroy();
    }
}
