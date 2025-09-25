import Phaser from 'phaser';
import { EventNames } from '../constants/EventNames';
import { GameStateManager } from './GameStateManager';
import { BaseManager } from './BaseManager';

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
        console.log('[InputManager] Initializing...');
        this.scene = scene;
        this.eventSystem = eventSystem;
        const { keyboard } = this.scene.input;
        
        // Arrow keys
        this.keys.cursors = keyboard.createCursorKeys();
        console.log('[InputManager] Created cursor keys');
        
        // WASD and SPACE keys for movement and jumping
        ['W', 'A', 'S', 'D', 'SPACE'].forEach(keyName => {
            this.keys[keyName] = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[keyName]);
        });
        console.log('[InputManager] Created WASD and SPACE keys');
        
        // Reset key (R)
        this.keys.R = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        // Duck key (C)
        this.keys.C = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        console.log('[InputManager] Created R and C keys');

        // Arrow key events (with proper payloads)
        this.keys.cursors.left.on('down', () => this.eventSystem.emit(EventNames.MOVE_LEFT, { pressed: true }));
        this.keys.cursors.right.on('down', () => this.eventSystem.emit(EventNames.MOVE_RIGHT, { pressed: true }));
        this.keys.cursors.up.on('down', () => this.eventSystem.emit(EventNames.MOVE_UP, { pressed: true }));
        this.keys.cursors.down.on('down', () => this.eventSystem.emit(EventNames.MOVE_DOWN, { pressed: true }));
        
        // Arrow key release events (optional for better control)
        this.keys.cursors.left.on('up', () => this.eventSystem.emit(EventNames.MOVE_LEFT, { pressed: false }));
        this.keys.cursors.right.on('up', () => this.eventSystem.emit(EventNames.MOVE_RIGHT, { pressed: false }));
        this.keys.cursors.up.on('up', () => this.eventSystem.emit(EventNames.MOVE_UP, { pressed: false }));
        this.keys.cursors.down.on('up', () => this.eventSystem.emit(EventNames.MOVE_DOWN, { pressed: false }));
        
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
                keyObj.on('down', () => this.eventSystem.emit(eventName, { pressed: true }));
                keyObj.on('up', () => this.eventSystem.emit(eventName, { pressed: false }));
                this.keys[action] = keyObj;
            }
        });
        
        // Level reset (R)
        this.keys.R.on('down', () => this.eventSystem.emit(EventNames.LEVEL_RESET));
        
        console.log('[InputManager] All keys initialized:', Object.keys(this.keys));
        
        // Mark as initialized
        this.setInitialized();
        console.log('[InputManager] Initialization complete');
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
        this.scene = null;
        this.eventSystem = null;
        
        // Call parent destroy
        super.destroy();
    }
}