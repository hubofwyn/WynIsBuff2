import { StateProvider } from '../context/StateProvider.js';

/**
 * Player state provider for debugging
 *
 * Captures current player state including position, velocity, grounded status, etc.
 */
export class PlayerStateProvider extends StateProvider {
    /**
     * @param {PlayerController} player - Player controller instance
     */
    constructor(player) {
        super(player);
    }

    getName() {
        return 'player';
    }

    getState() {
        const player = this.target;

        if (!player || !player.body) {
            return { available: false };
        }

        const state = {
            available: true,
        };

        // Position
        try {
            const translation = player.body.translation();
            state.position = {
                x: Math.round(translation.x * 100) / 100,
                y: Math.round(translation.y * 100) / 100,
            };
        } catch (e) {
            state.position = { error: e.message };
        }

        // Velocity
        try {
            const linvel = player.body.linvel();
            state.velocity = {
                x: Math.round(linvel.x * 100) / 100,
                y: Math.round(linvel.y * 100) / 100,
                speed: Math.round(Math.sqrt(linvel.x * linvel.x + linvel.y * linvel.y) * 100) / 100,
            };
        } catch (e) {
            state.velocity = { error: e.message };
        }

        // Grounded status
        if (player.isGrounded !== undefined) {
            state.isGrounded =
                typeof player.isGrounded === 'function' ? player.isGrounded() : player.isGrounded;
        }

        // Jump state
        if (player.jumpController) {
            state.jump = {
                canJump: player.jumpController.canJump || false,
                isJumping: player.jumpController.isJumping || false,
                jumpCount: player.jumpController.jumpCount || 0,
            };
        }

        // Movement state
        if (player.movementController) {
            state.movement = {
                direction: player.movementController.direction || 0,
                isMoving: player.movementController.isMoving || false,
            };
        }

        // Health/status (if available)
        if (player.health !== undefined) {
            state.health = player.health;
        }

        // Sprite state (if available)
        if (player.sprite) {
            state.sprite = {
                x: Math.round(player.sprite.x),
                y: Math.round(player.sprite.y),
                visible: player.sprite.visible,
                flipX: player.sprite.flipX,
            };
        }

        // Circuit breaker state (if exists)
        if (player.errorCount !== undefined) {
            state.errors = {
                count: player.errorCount,
                disabled: player.disabled || false,
            };
        }

        return state;
    }
}
