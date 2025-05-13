import Phaser from 'phaser';
import { EventNames } from '../constants/EventNames';
import { GameStateManager } from './GameStateManager';

/**
 * InputManager handles mapping of keyboard inputs to game events.
 */
export class InputManager {
    /**
     * Construct InputManager
     * @param {Phaser.Scene} scene - The scene to register input on
     * @param {EventSystem} eventSystem - The central event bus
     */
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        this.keys = {};
    }

    /**
     * Initialize key mappings and listeners
     */
    init() {
        const { keyboard } = this.scene.input;
        // Arrow keys
        this.keys.cursors = keyboard.createCursorKeys();
        // Reset key (R)
        this.keys.R = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

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
            pause: EventNames.PAUSE
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
        // Reset key (R)
        this.keys.R.on('down', () => this.eventSystem.emit(EventNames.LEVEL_RESET));
    }

    /**
     * Remove listeners (cleanup)
     */
    destroy() {
        Object.values(this.keys).forEach(key => {
            if (key && key.off) {
                key.removeAllListeners?.();
            }
        });
        this.keys = {};
    }
}