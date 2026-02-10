import { EventNames } from '../../constants/EventNames.js';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * MovementController class handles all movement-related functionality for the player
 * including horizontal movement, air control, and physics interactions.
 */
export class MovementController {
    /**
     * Create a new MovementController
     * @param {Phaser.Scene} scene - The scene this controller belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;

        // Movement state
        this._lastMoveDir = 'none';
        this.isOnGround = false;
        this._isInLandingRecovery = false;

        // BUFF MOMENTUM SYSTEM - Enhanced physics for powerful, weighted movement
        this.groundParams = {
            moveSpeed: 45, // Stronger ground speed for buff characters
            acceleration: 45, // High acceleration for responsive input
            snapFactor: 0.92, // Very responsive ground acceleration
            stopSnapFactor: 0.85, // Quick stopping with slight momentum slide
            directionChangeFactor: 1.4, // Snappy direction changes for skilled play
            startBoostFactor: 0.4, // Strong initial acceleration burst
            momentumPreservation: 0.95, // High momentum preservation
        };

        // Air control parameters - Enhanced for skilled aerial gameplay
        this.airParams = {
            moveSpeed: 42, // Slightly slower than ground for balance
            acceleration: 25, // More realistic air acceleration
            snapFactor: 0.75, // Good air control for precise landings
            stopSnapFactor: 0.15, // Limited air braking for realism
            directionChangeFactor: 0.8, // Solid air control without being overpowered
            startBoostFactor: 0.25, // Moderate air acceleration from stop
            momentumPreservation: 0.98, // Very high air momentum preservation
        };

        // Landing recovery parameters - Quicker recovery for action gameplay
        this.recoveryParams = {
            speedMultiplier: 0.85, // 85% of normal speed during recovery (improved)
            snapFactorMultiplier: 0.85, // 85% of normal acceleration (improved)
            recoveryTime: 80, // Slightly faster recovery time
        };

        // Buff system parameters for weighted, powerful movement
        this.buffParams = {
            weightedFeel: 1.15, // Adds sense of mass and power
            impactMultiplier: 1.2, // Stronger impact effects
            momentumThreshold: 8, // Velocity threshold for momentum effects
            powerBoostFactor: 1.1, // Small power boost when at high momentum
        };

        // Enhanced falling parameters for buff characters
        this.fallingParams = {
            accelerationCurve: true, // Curved acceleration for natural feel
            baseAcceleration: 1.02, // Slightly faster initial fall
            maxAcceleration: 1.15, // Builds up to faster fall
            maxFallSpeed: 85, // Higher terminal velocity for buff characters
            fastFallMultiplier: 1.4, // Fast fall option for skilled players
        };

        // Enhanced self-balancing for buff characters
        this.balanceParams = {
            threshold: 0.08, // Lower threshold for tighter control
            torqueFactor: 0.08, // Stronger self-balancing for stability
            landingStabilization: 0.12, // Extra stabilization on landing
        };

        // Momentum tracking for visual and audio feedback
        this.momentumState = {
            currentMomentum: 0,
            peakMomentum: 0,
            momentumDecayRate: 0.95,
            lastSignificantMove: 0,
        };

        LOG.dev('MOVEMENTCONTROLLER_INITIALIZED', {
            subsystem: 'player',
            message: 'MovementController initialized with BUFF momentum system',
            params: {
                groundMoveSpeed: this.groundParams.moveSpeed,
                airMoveSpeed: this.airParams.moveSpeed,
                maxFallSpeed: this.fallingParams.maxFallSpeed,
                weightedFeel: this.buffParams.weightedFeel,
            },
        });
    }

    /**
     * Update method called every frame
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     * @param {object} input - Input state object with movement key states
     * @param {boolean} isOnGround - Whether the player is on the ground
     * @param {boolean} isInLandingRecovery - Whether the player is in landing recovery
     */
    update(body, sprite, input, isOnGround, isInLandingRecovery) {
        if (!body) return;

        // Update state
        this.isOnGround = isOnGround;
        this._isInLandingRecovery = isInLandingRecovery;

        // Update momentum tracking
        this.updateMomentumState(body);

        // Handle horizontal movement with buff momentum system
        this.handleBuffMovement(body, input);

        // Apply enhanced self-balancing
        this.applySelfBalancing(body);

        // Handle fast falling
        this.handleFastFall(body, input);

        // Emit move event for particle effects if moving significantly
        if (Math.abs(body.linvel().x) > 5) {
            this.emitMoveEvent(body, sprite);
        }

        // Emit momentum events for visual/audio feedback
        this.emitMomentumEvents(body, sprite);
    }

    /**
     * Handle horizontal movement with buff momentum system
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {object} input - Input state object with movement key states
     */
    handleBuffMovement(body, input) {
        try {
            // Get movement parameters based on ground state
            const params = this.getMovementParams();

            // Track movement direction changes
            const wasMovingLeft = this._lastMoveDir === 'left';
            const wasMovingRight = this._lastMoveDir === 'right';
            let isMovingLeft = false;
            let isMovingRight = false;
            let vx = 0;

            // Check WASD keys first
            if (input.wasd.left.isDown) {
                vx = -params.moveSpeed;
                isMovingLeft = true;
            } else if (input.wasd.right.isDown) {
                vx = params.moveSpeed;
                isMovingRight = true;
            }

            // If WASD isn't pressed, check arrow keys
            if (vx === 0) {
                if (input.cursors.left.isDown) {
                    vx = -params.moveSpeed;
                    isMovingLeft = true;
                } else if (input.cursors.right.isDown) {
                    vx = params.moveSpeed;
                    isMovingRight = true;
                }
            }

            // Get current velocity
            const currentVel = body.linvel();

            // Apply falling acceleration with improved feel
            const newVelY = this.calculateFallingVelocity(currentVel.y);

            // Calculate new X velocity with buff momentum system
            let newVelX = this.calculateBuffHorizontalVelocity(
                currentVel.x,
                vx,
                params,
                isMovingLeft,
                isMovingRight,
                wasMovingLeft,
                wasMovingRight
            );

            // Apply buff system power boost at high momentum
            if (this.momentumState.currentMomentum > this.buffParams.momentumThreshold) {
                newVelX *= this.buffParams.powerBoostFactor;
            }

            // Store movement direction for next frame
            if (isMovingLeft) {
                this._lastMoveDir = 'left';
            } else if (isMovingRight) {
                this._lastMoveDir = 'right';
            } else {
                this._lastMoveDir = 'none';
            }

            // Apply the new velocity
            body.setLinvel({ x: newVelX, y: newVelY }, true);
        } catch (error) {
            LOG.error('MOVEMENTCONTROLLER_BUFF_MOVEMENT_ERROR', {
                subsystem: 'player',
                error,
                message: 'Error during buff movement calculation',
                state: {
                    isOnGround: this.isOnGround,
                    isInLandingRecovery: this._isInLandingRecovery,
                    currentMomentum: this.momentumState.currentMomentum,
                },
                hint: 'Check player body state and physics parameters',
            });
        }
    }

    /**
     * Calculate falling velocity with improved feel
     * @param {number} currentVelY - Current Y velocity
     * @returns {number} New Y velocity
     */
    calculateFallingVelocity(currentVelY) {
        // Only apply falling acceleration if moving downward and not on ground
        if (currentVelY > 0 && !this.isOnGround) {
            let newVelY;

            if (this.fallingParams.accelerationCurve) {
                // Accelerate falling speed with a curve for better feel
                // Slower acceleration at first, then faster as player falls
                const fallProgress = Math.min(currentVelY / 20, 1); // 0-1 based on fall speed
                const accelerationFactor =
                    this.fallingParams.baseAcceleration +
                    (this.fallingParams.maxAcceleration - this.fallingParams.baseAcceleration) *
                        fallProgress;

                newVelY = currentVelY * accelerationFactor;
            } else {
                // Simple constant acceleration
                newVelY = currentVelY * this.fallingParams.baseAcceleration;
            }

            // Cap maximum fall speed
            if (newVelY > this.fallingParams.maxFallSpeed) {
                newVelY = this.fallingParams.maxFallSpeed;
            }

            return newVelY;
        }

        // If not falling or on ground, return current velocity unchanged
        return currentVelY;
    }

    /**
     * Calculate horizontal velocity with buff momentum system
     * @param {number} currentVelX - Current X velocity
     * @param {number} targetVelX - Target X velocity based on input
     * @param {object} params - Movement parameters
     * @param {boolean} isMovingLeft - Whether moving left
     * @param {boolean} isMovingRight - Whether moving right
     * @param {boolean} wasMovingLeft - Whether was moving left last frame
     * @param {boolean} wasMovingRight - Whether was moving right last frame
     * @returns {number} New X velocity
     */
    calculateBuffHorizontalVelocity(
        currentVelX,
        targetVelX,
        params,
        isMovingLeft,
        isMovingRight,
        wasMovingLeft,
        wasMovingRight
    ) {
        let newVelX;

        if (targetVelX !== 0) {
            // Direction change detection for buff momentum system
            const isChangingDirection =
                (targetVelX < 0 && currentVelX > 0) || (targetVelX > 0 && currentVelX < 0);

            if (isChangingDirection) {
                // Enhanced direction change with weighted feel
                const momentumFactor = Math.min(Math.abs(currentVelX) / params.moveSpeed, 1.0);
                const weightedChangeFactor =
                    params.directionChangeFactor * (1 + momentumFactor * 0.2);
                newVelX = targetVelX * 0.6 + currentVelX * (1 - weightedChangeFactor);

                // Apply weighted feel to direction changes
                newVelX *= this.buffParams.weightedFeel;
            } else {
                // Enhanced normal movement with acceleration-based calculation
                const accelerationFactor = params.acceleration / 60; // Convert to per-frame
                const velocityDifference = targetVelX - currentVelX;
                const accelerationStep =
                    Math.sign(velocityDifference) *
                    Math.min(Math.abs(velocityDifference), accelerationFactor);

                newVelX = currentVelX + accelerationStep;

                // Apply momentum preservation
                if (Math.abs(newVelX) > Math.abs(targetVelX)) {
                    newVelX =
                        currentVelX * params.momentumPreservation +
                        targetVelX * (1 - params.momentumPreservation);
                }
            }

            // Enhanced start boost with buff system
            if ((isMovingLeft && !wasMovingLeft) || (isMovingRight && !wasMovingRight)) {
                const buffedStartBoost = params.startBoostFactor * this.buffParams.weightedFeel;
                newVelX = targetVelX * buffedStartBoost + newVelX * (1 - buffedStartBoost);
            }
        } else {
            // Enhanced stopping with momentum preservation
            const stopFactor = params.stopSnapFactor * (this.isOnGround ? 1.0 : 0.3);
            newVelX = currentVelX * (1 - stopFactor);

            // Apply slight momentum preservation when stopping
            if (Math.abs(newVelX) < 0.5) {
                newVelX = 0; // Full stop when very slow
            }
        }

        return newVelX;
    }

    /**
     * Apply self-balancing to keep player upright
     * @param {RAPIER.RigidBody} body - The player's physics body
     */
    applySelfBalancing(body) {
        if (!body) return;

        // Self-balancing mechanism - gradually return to upright position
        const currentRotation = body.rotation();
        if (Math.abs(currentRotation) > this.balanceParams.threshold) {
            // Apply a gentle torque in the opposite direction of rotation
            const balanceForce = -currentRotation * this.balanceParams.torqueFactor;
            body.applyTorqueImpulse(balanceForce);
        }
    }

    /**
     * Get movement parameters based on ground state
     * @returns {object} Movement parameters
     */
    getMovementParams() {
        // If in air, use air parameters
        if (!this.isOnGround) {
            return this.airParams;
        }

        // If in landing recovery, modify ground parameters
        if (this._isInLandingRecovery) {
            return {
                moveSpeed: this.groundParams.moveSpeed * this.recoveryParams.speedMultiplier,
                snapFactor: this.groundParams.snapFactor * this.recoveryParams.snapFactorMultiplier,
                stopSnapFactor: this.groundParams.stopSnapFactor,
                directionChangeFactor: this.groundParams.directionChangeFactor,
                startBoostFactor:
                    this.groundParams.startBoostFactor * this.recoveryParams.snapFactorMultiplier,
            };
        }

        // Otherwise, use normal ground parameters
        return this.groundParams;
    }

    /**
     * Emit move event for particle effects
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     */
    emitMoveEvent(body, sprite) {
        if (!this.eventSystem || !body || !sprite) return;

        this.eventSystem.emit(EventNames.PLAYER_MOVE, {
            position: {
                x: body.translation().x,
                y: body.translation().y,
            },
            velocity: body.linvel(),
            isOnGround: this.isOnGround,
            sprite,
        });
    }

    /**
     * Update momentum tracking for visual and audio feedback
     * @param {RAPIER.RigidBody} body - The player's physics body
     */
    updateMomentumState(body) {
        if (!body) return;

        const velocity = body.linvel();
        this.momentumState.currentMomentum = Math.sqrt(
            velocity.x * velocity.x + velocity.y * velocity.y
        );

        // Track peak momentum for effects
        if (this.momentumState.currentMomentum > this.momentumState.peakMomentum) {
            this.momentumState.peakMomentum = this.momentumState.currentMomentum;
        }

        // Decay peak momentum over time
        this.momentumState.peakMomentum *= this.momentumState.momentumDecayRate;

        // Track last significant movement
        if (this.momentumState.currentMomentum > 5) {
            this.momentumState.lastSignificantMove = Date.now();
        }
    }

    /**
     * Handle fast falling mechanics
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {object} input - Input state object
     */
    handleFastFall(body, input) {
        if (!body || this.isOnGround) return;

        const velocity = body.linvel();

        // Check if down key is pressed for fast fall
        const downPressed = input.wasd.down.isDown || input.cursors.down.isDown;

        if (downPressed && velocity.y > 0) {
            // Apply fast fall multiplier
            const fastFallSpeed = velocity.y * this.fallingParams.fastFallMultiplier;

            // Cap at maximum fall speed
            const cappedSpeed = Math.min(fastFallSpeed, this.fallingParams.maxFallSpeed * 1.2);

            body.setLinvel({ x: velocity.x, y: cappedSpeed }, true);

            // Emit fast fall event for effects
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.PLAYER_FAST_FALL, {
                    position: body.translation(),
                    velocity: body.linvel(),
                });
            }
        }
    }

    /**
     * Emit momentum-based events for visual and audio feedback
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     */
    emitMomentumEvents(body, sprite) {
        if (!this.eventSystem || !body || !sprite) return;

        // High momentum event
        if (this.momentumState.currentMomentum > this.buffParams.momentumThreshold) {
            this.eventSystem.emit(EventNames.PLAYER_HIGH_MOMENTUM, {
                position: body.translation(),
                momentum: this.momentumState.currentMomentum,
                peakMomentum: this.momentumState.peakMomentum,
                sprite,
            });
        }

        // Momentum change event (for audio pitch changes, etc.)
        const timeSinceLastMove = Date.now() - this.momentumState.lastSignificantMove;
        if (timeSinceLastMove < 100) {
            // Only emit if recently moved
            this.eventSystem.emit(EventNames.PLAYER_MOMENTUM_CHANGE, {
                currentMomentum: this.momentumState.currentMomentum,
                peakMomentum: this.momentumState.peakMomentum,
                isOnGround: this.isOnGround,
            });
        }
    }

    /**
     * Get the current movement state
     * @returns {object} Movement state information
     */
    getMovementState() {
        return {
            lastMoveDir: this._lastMoveDir,
            isOnGround: this.isOnGround,
            isInLandingRecovery: this._isInLandingRecovery,
            momentumState: { ...this.momentumState },
        };
    }
}
