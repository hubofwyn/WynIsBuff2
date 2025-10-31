import { StateProvider } from '../context/StateProvider.js';

/**
 * Physics state provider for debugging
 *
 * Captures Rapier physics world state
 */
export class PhysicsStateProvider extends StateProvider {
    /**
     * @param {PhysicsManager} physicsManager - Physics manager instance
     */
    constructor(physicsManager) {
        super(physicsManager);
    }

    getName() {
        return 'physics';
    }

    getState() {
        const physics = this.target;

        if (!physics) {
            return { available: false };
        }

        const state = {
            available: true,
            initialized: physics.isInitialized ? physics.isInitialized() : false,
        };

        // World state
        if (physics.world) {
            try {
                // Gravity
                const gravity = physics.world.gravity;
                state.gravity = {
                    x: gravity.x,
                    y: gravity.y,
                };

                // Body counts
                state.bodies = {
                    total: physics.world.bodies?.len?.() || 0,
                    dynamic: 0,
                    static: 0,
                    kinematic: 0,
                };

                // Collider count
                state.colliders = {
                    total: physics.world.colliders?.len?.() || 0,
                };
            } catch (e) {
                state.worldError = e.message;
            }
        }

        // Performance metrics
        if (physics.performanceMetrics) {
            state.performance = {
                lastUpdateTime: physics.performanceMetrics.lastUpdateTime,
                averageUpdateTime: physics.performanceMetrics.averageUpdateTime,
            };
        }

        // Circuit breaker state
        if (physics.errorCount !== undefined) {
            state.errors = {
                count: physics.errorCount,
                threshold: physics.errorThreshold || 10,
                disabled: physics.disabled || false,
            };
        }

        // Timestep info
        if (physics.timeStep !== undefined) {
            state.timeStep = physics.timeStep;
        }

        // Active game objects
        if (physics.gameObjects) {
            state.gameObjects = {
                count: physics.gameObjects.size || physics.gameObjects.length || 0,
            };
        }

        return state;
    }
}
