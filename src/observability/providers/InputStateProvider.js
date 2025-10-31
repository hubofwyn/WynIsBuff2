import { StateProvider } from '../context/StateProvider.js';

/**
 * Input state provider for debugging
 *
 * Captures current input state (keyboard, mouse, gamepad)
 */
export class InputStateProvider extends StateProvider {
    /**
     * @param {InputManager} inputManager - Input manager instance
     */
    constructor(inputManager) {
        super(inputManager);
    }

    getName() {
        return 'input';
    }

    getState() {
        const input = this.target;

        if (!input) {
            return { available: false };
        }

        const state = {
            available: true,
            initialized: input.isInitialized ? input.isInitialized() : false,
        };

        // Current action states
        if (input.actions) {
            state.actions = {};
            for (const [action, isPressed] of Object.entries(input.actions)) {
                if (isPressed) {
                    state.actions[action] = true;
                }
            }
        }

        // Keyboard state
        if (input.keyboard) {
            const keys = [];
            // Common game keys
            const commonKeys = [
                'left',
                'right',
                'up',
                'down',
                'space',
                'shift',
                'w',
                'a',
                's',
                'd',
            ];
            for (const key of commonKeys) {
                if (input.keyboard[key]?.isDown) {
                    keys.push(key);
                }
            }
            if (keys.length > 0) {
                state.keyboard = { pressed: keys };
            }
        }

        // Mouse state (if available)
        if (input.pointer || input.mouse) {
            const pointer = input.pointer || input.mouse;
            if (pointer) {
                state.mouse = {
                    x: Math.round(pointer.x || 0),
                    y: Math.round(pointer.y || 0),
                    isDown: pointer.isDown || false,
                };
            }
        }

        // Gamepad state (if available)
        if (input.gamepad) {
            state.gamepad = {
                connected: input.gamepad.connected || false,
                buttons: input.gamepad.buttons?.filter((b) => b)?.length || 0,
            };
        }

        // Circuit breaker state
        if (input.errorCount !== undefined) {
            state.errors = {
                count: input.errorCount,
                disabled: input.disabled || false,
            };
        }

        return state;
    }
}
