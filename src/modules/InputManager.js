import Phaser from 'phaser';
import { EventNames } from '../constants/EventNames';

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
        // WASD
        this.keys.W = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keys.A = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keys.S = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keys.D = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        // Space and Escape
        this.keys.SPACE = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keys.ESC = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        // Reset key (R)
        this.keys.R = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        // Arrow key events
        this.keys.cursors.left.on('down', () => this.eventSystem.emit(EventNames.MOVE_LEFT));
        this.keys.cursors.right.on('down', () => this.eventSystem.emit(EventNames.MOVE_RIGHT));
        this.keys.cursors.up.on('down', () => this.eventSystem.emit(EventNames.MOVE_UP));
        this.keys.cursors.down.on('down', () => this.eventSystem.emit(EventNames.MOVE_DOWN));
        // WASD key events
        this.keys.A.on('down', () => this.eventSystem.emit(EventNames.MOVE_LEFT));
        this.keys.D.on('down', () => this.eventSystem.emit(EventNames.MOVE_RIGHT));
        this.keys.W.on('down', () => this.eventSystem.emit(EventNames.MOVE_UP));
        this.keys.S.on('down', () => this.eventSystem.emit(EventNames.MOVE_DOWN));
        // Jump and pause
        this.keys.SPACE.on('down', () => this.eventSystem.emit(EventNames.JUMP));
        this.keys.ESC.on('down', () => this.eventSystem.emit(EventNames.PAUSE));
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