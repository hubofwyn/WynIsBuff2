/**
 * InputState - Pure data snapshot of input state for a single frame
 *
 * DESIGN PRINCIPLES:
 * ──────────────────
 * 1. No Phaser types - pure data object
 * 2. Immutable per frame - never mutate after creation
 * 3. Testable - can mock for unit tests
 * 4. Multi-source ready - merge keyboard + gamepad + touch
 * 5. Replay-able - serialize for debugging/recording
 *
 * This is the ONLY interface between InputManager and game logic.
 */

/**
 * @typedef {Object} InputState
 * @property {boolean} left - Moving left
 * @property {boolean} right - Moving right
 * @property {boolean} up - Looking/aiming up
 * @property {boolean} down - Fast fall or duck
 * @property {boolean} jump - Holding jump button
 * @property {boolean} jumpPressed - Just pressed THIS frame
 * @property {boolean} jumpReleased - Just released THIS frame
 * @property {boolean} duck - Ducking action
 */

/**
 * Create a default/empty input state (for testing/fallback)
 * @returns {InputState}
 */
export function createEmptyInputState() {
    return {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        jumpPressed: false,
        jumpReleased: false,
        duck: false,
    };
}
