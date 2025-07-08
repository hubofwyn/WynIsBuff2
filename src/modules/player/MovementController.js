import { EventNames } from '../../constants/EventNames.js';

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
        
        // Movement parameters - Classic action game feel
        this.groundParams = {
            moveSpeed: 35,         // Balanced ground speed like classic platformers
            snapFactor: 0.85,      // Quick but not instant acceleration
            stopSnapFactor: 0.8,   // Quick stopping but with slight slide
            directionChangeFactor: 1.2, // Responsive direction changes
            startBoostFactor: 0.3  // Gradual acceleration start
        };
        
        // Air control parameters - Classic platformer air physics
        this.airParams = {
            moveSpeed: 40,         // Slightly faster than ground for momentum conservation
            snapFactor: 0.6,       // Moderate air acceleration
            stopSnapFactor: 0.1,   // Limited air braking (realistic)
            directionChangeFactor: 0.7, // Good air control but not overpowered
            startBoostFactor: 0.2  // Minimal air acceleration from stop
        };
        
        // Landing recovery parameters
        this.recoveryParams = {
            speedMultiplier: 0.8,  // 80% of normal speed during recovery
            snapFactorMultiplier: 0.8 // 80% of normal acceleration
        };
        
        // Falling parameters - Natural feeling fall physics
        this.fallingParams = {
            accelerationCurve: false,  // Linear falling for predictable physics
            baseAcceleration: 1.0,     // Natural fall acceleration
            maxAcceleration: 1.0,      // Consistent fall rate
            maxFallSpeed: 80           // Reasonable terminal velocity
        };
        
        // Self-balancing parameters
        this.balanceParams = {
            threshold: 0.1,        // Rotation threshold to apply balancing
            torqueFactor: 0.05     // Torque factor for self-balancing
        };
        
        console.log('[MovementController] Initialized');
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
        
        // Handle horizontal movement
        this.handleMovement(body, input);
        
        // Apply self-balancing
        this.applySelfBalancing(body);
        
        // Emit move event for particle effects if moving significantly
        if (Math.abs(body.linvel().x) > 5) {
            this.emitMoveEvent(body, sprite);
        }
    }
    
    /**
     * Handle horizontal movement based on input
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {object} input - Input state object with movement key states
     */
    handleMovement(body, input) {
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
            let newVelY = this.calculateFallingVelocity(currentVel.y);
            
            // Calculate new X velocity with snappy movement
            let newVelX = this.calculateHorizontalVelocity(
                currentVel.x, 
                vx, 
                params, 
                isMovingLeft, 
                isMovingRight, 
                wasMovingLeft, 
                wasMovingRight
            );
            
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
            console.error('[MovementController] Error in handleMovement:', error);
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
            let newVelY = currentVelY;
            
            if (this.fallingParams.accelerationCurve) {
                // Accelerate falling speed with a curve for better feel
                // Slower acceleration at first, then faster as player falls
                const fallProgress = Math.min(currentVelY / 20, 1); // 0-1 based on fall speed
                const accelerationFactor = this.fallingParams.baseAcceleration + 
                    (this.fallingParams.maxAcceleration - this.fallingParams.baseAcceleration) * fallProgress;
                
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
     * Calculate horizontal velocity with snappy movement
     * @param {number} currentVelX - Current X velocity
     * @param {number} targetVelX - Target X velocity based on input
     * @param {object} params - Movement parameters
     * @param {boolean} isMovingLeft - Whether moving left
     * @param {boolean} isMovingRight - Whether moving right
     * @param {boolean} wasMovingLeft - Whether was moving left last frame
     * @param {boolean} wasMovingRight - Whether was moving right last frame
     * @returns {number} New X velocity
     */
    calculateHorizontalVelocity(
        currentVelX, 
        targetVelX, 
        params, 
        isMovingLeft, 
        isMovingRight, 
        wasMovingLeft, 
        wasMovingRight
    ) {
        let newVelX = currentVelX;
        
        if (targetVelX !== 0) {
            // Direction change detection for snappier response
            const isChangingDirection = (targetVelX < 0 && currentVelX > 0) || (targetVelX > 0 && currentVelX < 0);
            
            if (isChangingDirection) {
                // When changing direction, apply a stronger snap factor
                newVelX = targetVelX * 0.5 + currentVelX * (1 - params.directionChangeFactor);
            } else {
                // Normal movement - snap quickly to target velocity
                newVelX = targetVelX * params.snapFactor + currentVelX * (1 - params.snapFactor);
            }
            
            // Add a small immediate boost when starting to move
            if ((isMovingLeft && !wasMovingLeft) || (isMovingRight && !wasMovingRight)) {
                newVelX = targetVelX * params.startBoostFactor;
            }
        } else {
            // No movement keys pressed - snap quickly to zero
            newVelX = currentVelX * (1 - params.stopSnapFactor);
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
                startBoostFactor: this.groundParams.startBoostFactor * this.recoveryParams.snapFactorMultiplier
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
                y: body.translation().y
            },
            velocity: body.linvel(),
            isOnGround: this.isOnGround,
            sprite: sprite
        });
    }
    
    /**
     * Get the current movement state
     * @returns {object} Movement state information
     */
    getMovementState() {
        return {
            lastMoveDir: this._lastMoveDir,
            isOnGround: this.isOnGround,
            isInLandingRecovery: this._isInLandingRecovery
        };
    }
}