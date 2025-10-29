import Phaser from 'phaser';
import { EventNames } from '../constants/EventNames';
import { GameStateManager } from './GameStateManager';
import { BaseManager } from './BaseManager';
import { createEmptyInputState } from '../types/InputState.js';

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
        
        // Level reset (R)
        this.keys.R.on('down', () => this.eventSystem.emit(EventNames.LEVEL_RESET));
        
        console.log('[InputManager] All keys initialized:', Object.keys(this.keys));
        
        // Mark as initialized
        this.setInitialized();
        console.log('[InputManager] Initialization complete');
    }

    /**
     * Get a snapshot of the current input state for this frame
     * @returns {InputState} Immutable input state snapshot
     */
    getSnapshot() {
        // Debug: Log occasionally
        if (Math.random() < 0.005) {
            console.log('[InputManager] getSnapshot called, cursors:', !!this.keys.cursors, 'SPACE:', !!this.keys.SPACE);
        }

        if (!this.keys.cursors || !this.keys.SPACE) {
            console.warn('[InputManager] Keys not initialized, returning empty state');
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