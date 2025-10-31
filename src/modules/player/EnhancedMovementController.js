import { EventNames } from '../../constants/EventNames.js';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * EnhancedMovementController - A Celeste-inspired movement system with precise physics
 *
 * Features:
 * - Circular buffer for input buffering (8-12ms window)
 * - State machine for ground/air/wall-slide/dash states
 * - Momentum preservation (85% between state transitions)
 * - Fixed timestep physics for 60 FPS consistency
 * - Coyote time (100ms) with perfect edge detection
 *
 * This controller extends the existing movement system with advanced platformer mechanics
 * inspired by the tight, responsive feel of games like Celeste.
 */
export class EnhancedMovementController {
    /**
     * Create a new EnhancedMovementController
     * @param {Phaser.Scene} scene - The scene this controller belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     * @param {PlayerController} playerController - Reference to the main player controller
     */
    constructor(scene, eventSystem, playerController) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        this.playerController = playerController;

        // State machine
        this.state = 'grounded'; // grounded, airborne, wall_slide, dashing, wall_jump
        this.previousState = 'grounded';
        this.stateTimer = 0;

        // Input buffering system - Circular buffer implementation
        this.inputBuffer = {
            size: 12, // 12ms buffer window at 60fps (0.72 frames)
            buffer: new Array(12).fill(null),
            head: 0,
            tail: 0,
            timestamp: 0,
        };

        // Fixed timestep accumulator for deterministic physics
        this.fixedTimestep = 1000 / 60; // 60 FPS target
        this.accumulator = 0;
        this.lastUpdateTime = 0;

        // Momentum preservation system
        this.momentum = {
            x: 0,
            y: 0,
            preservationFactor: 0.85, // 85% momentum preservation
            decayRate: 0.98, // Natural decay when no input
        };

        // Coyote time tracking
        this.coyoteTime = {
            active: false,
            remaining: 0,
            duration: 100, // 100ms window
            lastGroundPosition: { x: 0, y: 0 },
        };

        // Wall detection and interaction
        this.wallDetection = {
            left: false,
            right: false,
            slideSpeed: 30, // Controlled wall slide speed
            slideGravityMultiplier: 0.4, // 40% gravity during wall slide
            detectionRange: 3, // Pixels from player edge
            lastWallNormal: { x: 0, y: 0 },
        };

        // Dash mechanics
        this.dash = {
            available: true,
            duration: 200, // 200ms dash duration
            speed: 80, // Dash speed multiplier
            cooldown: 400, // 400ms cooldown
            direction: { x: 0, y: 0 },
            timer: 0,
            afterimageInterval: 30, // Create afterimage every 30ms
            lastAfterimage: 0,
        };

        // Advanced movement parameters - Celeste-like feel
        this.movementParams = {
            // Ground movement
            ground: {
                maxSpeed: 42,
                acceleration: 0.92, // Near-instant acceleration
                deceleration: 0.89, // Quick stop
                turnAroundBoost: 1.35, // Extra force when changing direction
                friction: 0.88,
            },
            // Air movement
            air: {
                maxSpeed: 45,
                acceleration: 0.65, // Good air control
                deceleration: 0.15, // Limited air braking
                turnAroundBoost: 0.8, // Reduced turn power in air
                dragCoefficient: 0.99, // Minimal air resistance
            },
            // Wall slide parameters
            wallSlide: {
                maxSpeed: 30,
                gravityScale: 0.4,
                pushOffForce: 55, // Horizontal force when wall jumping
                wallJumpUpForce: -70, // Vertical force for wall jump
                minSlideSpeed: 10, // Minimum slide speed
            },
            // Jump feel parameters
            jump: {
                variableHeightWindow: 150, // ms to hold for full jump
                earlyReleaseMultiplier: 0.5, // Velocity multiplier on early release
                apexGravityMultiplier: 0.65, // Reduced gravity at jump apex
                apexSpeedThreshold: 15, // Velocity threshold for apex detection
            },
        };

        // Velocity curves for different states
        this.velocityCurves = {
            acceleration: this.createAccelerationCurve(),
            deceleration: this.createDecelerationCurve(),
            turning: this.createTurningCurve(),
        };

        // Input tracking
        this.currentInput = {
            left: false,
            right: false,
            jump: false,
            dash: false,
            direction: 0, // -1 left, 0 none, 1 right
        };

        // Performance metrics
        this.metrics = {
            frameTime: 0,
            physicsSteps: 0,
            inputLatency: 0,
        };

        // Initialize state machine transitions
        this.initializeStateTransitions();

        LOG.dev('ENHANCEDMOVEMENTCONTROLLER_INITIALIZED', {
            subsystem: 'player',
            message: 'EnhancedMovementController initialized with Celeste-like physics',
            features: {
                inputBufferMs: this.inputBuffer.size,
                fixedTimestepFps: 60,
                momentumPreservation: this.momentum.preservationFactor,
                coyoteTimeDuration: this.coyoteTime.duration,
                dashDuration: this.dash.duration,
                groundMaxSpeed: this.movementParams.ground.maxSpeed,
                airMaxSpeed: this.movementParams.air.maxSpeed,
            },
        });
    }

    /**
     * Initialize state machine transition rules
     */
    initializeStateTransitions() {
        this.stateTransitions = {
            grounded: {
                canTransitionTo: ['airborne', 'dashing', 'wall_slide'],
                onEnter: () => this.onEnterGrounded(),
                onExit: () => this.onExitGrounded(),
            },
            airborne: {
                canTransitionTo: ['grounded', 'wall_slide', 'dashing', 'wall_jump'],
                onEnter: () => this.onEnterAirborne(),
                onExit: () => this.onExitAirborne(),
            },
            wall_slide: {
                canTransitionTo: ['grounded', 'airborne', 'wall_jump', 'dashing'],
                onEnter: () => this.onEnterWallSlide(),
                onExit: () => this.onExitWallSlide(),
            },
            wall_jump: {
                canTransitionTo: ['airborne', 'wall_slide', 'grounded', 'dashing'],
                onEnter: () => this.onEnterWallJump(),
                onExit: () => this.onExitWallJump(),
            },
            dashing: {
                canTransitionTo: ['grounded', 'airborne', 'wall_slide'],
                onEnter: () => this.onEnterDash(),
                onExit: () => this.onExitDash(),
            },
        };
    }

    /**
     * Update the enhanced movement controller
     * @param {number} time - Current time in milliseconds
     * @param {number} delta - Delta time since last update
     * @param {RAPIER.RigidBody} body - Player's physics body
     * @param {Phaser.GameObjects.Sprite} sprite - Player's sprite
     * @param {object} input - Input state
     * @param {boolean} isOnGround - Ground contact state
     */
    update(time, delta, body, sprite, input, isOnGround) {
        if (!body || !sprite) return;

        // Update metrics
        this.metrics.frameTime = delta;

        // Process input with buffering
        this.processInput(input, time);

        // Fixed timestep physics update
        this.accumulator += delta;
        let physicsSteps = 0;

        while (this.accumulator >= this.fixedTimestep) {
            this.fixedUpdate(body, sprite, isOnGround);
            this.accumulator -= this.fixedTimestep;
            physicsSteps++;

            // Prevent spiral of death
            if (physicsSteps > 3) {
                this.accumulator = 0;
                break;
            }
        }

        this.metrics.physicsSteps = physicsSteps;

        // Interpolate visual position
        const alpha = this.accumulator / this.fixedTimestep;
        this.interpolateVisuals(sprite, body, alpha);

        // Update coyote time
        this.updateCoyoteTime(isOnGround, body);

        // Check for state transitions
        this.updateStateTransitions(body, isOnGround);

        // Update dash afterimages
        if (this.state === 'dashing') {
            this.createDashAfterimage(sprite, time);
        }
    }

    /**
     * Fixed timestep physics update
     * @param {RAPIER.RigidBody} body - Player's physics body
     * @param {Phaser.GameObjects.Sprite} sprite - Player's sprite
     * @param {boolean} isOnGround - Ground contact state
     */
    fixedUpdate(body, _sprite, _isOnGround) {
        const currentVel = body.linvel();
        let newVelX = currentVel.x;
        let newVelY = currentVel.y;

        // State-specific physics
        switch (this.state) {
            case 'grounded':
                newVelX = this.calculateGroundMovement(currentVel.x);
                break;

            case 'airborne':
                newVelX = this.calculateAirMovement(currentVel.x);
                newVelY = this.applyAirPhysics(currentVel.y);
                break;

            case 'wall_slide':
                newVelX = this.calculateWallSlideMovement(currentVel.x);
                newVelY = this.calculateWallSlideGravity(currentVel.y);
                break;

            case 'wall_jump':
                // Wall jump physics handled in state transition
                newVelX = this.calculateAirMovement(currentVel.x);
                newVelY = this.applyAirPhysics(currentVel.y);
                break;

            case 'dashing': {
                const dashVel = this.calculateDashVelocity();
                newVelX = dashVel.x;
                newVelY = dashVel.y;
                break;
            }
        }

        // Apply momentum preservation
        newVelX = this.applyMomentumPreservation(newVelX, currentVel.x);

        // Apply velocity with physics engine
        body.setLinvel({ x: newVelX, y: newVelY }, true);

        // Update momentum tracking
        this.updateMomentum(newVelX, newVelY);

        // Update state timer
        this.stateTimer += this.fixedTimestep;
    }

    /**
     * Process input with buffering system
     * @param {object} input - Raw input state
     * @param {number} time - Current timestamp
     */
    processInput(input, time) {
        // Read current input state
        const left = input.wasd.left.isDown || input.cursors.left.isDown;
        const right = input.wasd.right.isDown || input.cursors.right.isDown;
        const jump = input.spaceKey.isDown || input.wasd.up.isDown || input.cursors.up.isDown;
        const dash = input.wasd.down && Phaser.Input.Keyboard.JustDown(input.wasd.down);

        // Buffer the input
        this.bufferInput({
            left,
            right,
            jump,
            dash,
            timestamp: time,
        });

        // Process buffered input
        const bufferedInput = this.getBufferedInput(time);
        if (bufferedInput) {
            this.currentInput = {
                left: bufferedInput.left,
                right: bufferedInput.right,
                jump: bufferedInput.jump,
                dash: bufferedInput.dash,
                direction: bufferedInput.left ? -1 : bufferedInput.right ? 1 : 0,
            };

            // Calculate input latency
            this.metrics.inputLatency = time - bufferedInput.timestamp;
        }
    }

    /**
     * Buffer an input in the circular buffer
     * @param {object} input - Input to buffer
     */
    bufferInput(input) {
        this.inputBuffer.buffer[this.inputBuffer.head] = input;
        this.inputBuffer.head = (this.inputBuffer.head + 1) % this.inputBuffer.size;

        // Handle buffer overflow
        if (this.inputBuffer.head === this.inputBuffer.tail) {
            this.inputBuffer.tail = (this.inputBuffer.tail + 1) % this.inputBuffer.size;
        }
    }

    /**
     * Get the most recent valid buffered input
     * @param {number} currentTime - Current timestamp
     * @returns {object|null} Buffered input or null
     */
    getBufferedInput(currentTime) {
        let index = (this.inputBuffer.head - 1 + this.inputBuffer.size) % this.inputBuffer.size;

        while (index !== this.inputBuffer.tail) {
            const input = this.inputBuffer.buffer[index];
            if (input && currentTime - input.timestamp <= this.inputBuffer.size) {
                return input;
            }
            index = (index - 1 + this.inputBuffer.size) % this.inputBuffer.size;
        }

        return null;
    }

    /**
     * Calculate ground movement with precise control
     * @param {number} currentVelX - Current X velocity
     * @returns {number} New X velocity
     */
    calculateGroundMovement(currentVelX) {
        const params = this.movementParams.ground;
        const targetSpeed = this.currentInput.direction * params.maxSpeed;

        if (this.currentInput.direction !== 0) {
            // Check for direction change
            const changingDirection =
                (currentVelX > 0 && this.currentInput.direction < 0) ||
                (currentVelX < 0 && this.currentInput.direction > 0);

            if (changingDirection) {
                // Apply turn-around boost
                const curve = this.velocityCurves.turning;
                const t = Math.abs(currentVelX) / params.maxSpeed;
                const curveMultiplier = this.evaluateCurve(curve, t);
                return targetSpeed * params.turnAroundBoost * curveMultiplier;
            } else {
                // Normal acceleration
                const curve = this.velocityCurves.acceleration;
                const t = Math.abs(currentVelX) / params.maxSpeed;
                const curveMultiplier = this.evaluateCurve(curve, t);
                const acceleration = params.acceleration * curveMultiplier;
                return currentVelX + (targetSpeed - currentVelX) * acceleration;
            }
        } else {
            // Deceleration
            const curve = this.velocityCurves.deceleration;
            const t = Math.abs(currentVelX) / params.maxSpeed;
            const curveMultiplier = this.evaluateCurve(curve, t);
            return currentVelX * (1 - params.deceleration * curveMultiplier);
        }
    }

    /**
     * Calculate air movement with momentum
     * @param {number} currentVelX - Current X velocity
     * @returns {number} New X velocity
     */
    calculateAirMovement(currentVelX) {
        const params = this.movementParams.air;
        const targetSpeed = this.currentInput.direction * params.maxSpeed;

        if (this.currentInput.direction !== 0) {
            // Air control with momentum preservation
            const changingDirection =
                (currentVelX > 0 && this.currentInput.direction < 0) ||
                (currentVelX < 0 && this.currentInput.direction > 0);

            if (changingDirection) {
                // Reduced turn power in air
                return (
                    currentVelX +
                    (targetSpeed - currentVelX) * params.acceleration * params.turnAroundBoost
                );
            } else {
                // Normal air acceleration
                return currentVelX + (targetSpeed - currentVelX) * params.acceleration;
            }
        } else {
            // Limited air braking
            return currentVelX * (1 - params.deceleration);
        }
    }

    /**
     * Apply air physics including variable gravity
     * @param {number} currentVelY - Current Y velocity
     * @returns {number} New Y velocity
     */
    applyAirPhysics(currentVelY) {
        // Check for jump apex (reduced gravity for floatier feel)
        if (Math.abs(currentVelY) < this.movementParams.jump.apexSpeedThreshold) {
            // Apply reduced gravity at apex
            return currentVelY * this.movementParams.jump.apexGravityMultiplier;
        }

        // Apply air drag
        return currentVelY * this.movementParams.air.dragCoefficient;
    }

    /**
     * Calculate wall slide movement
     * @param {number} currentVelX - Current X velocity
     * @returns {number} New X velocity
     */
    calculateWallSlideMovement(_currentVelX) {
        // Stick to wall with slight push-off capability
        const wallDir = this.wallDetection.left ? -1 : 1;
        const inputDir = this.currentInput.direction;

        // If pushing away from wall, allow slight movement
        if (inputDir !== 0 && inputDir !== wallDir) {
            return inputDir * 10; // Small push-off speed
        }

        // Otherwise, stick to wall
        return wallDir * 2; // Slight wall attraction
    }

    /**
     * Calculate wall slide gravity
     * @param {number} currentVelY - Current Y velocity
     * @returns {number} New Y velocity
     */
    calculateWallSlideGravity(currentVelY) {
        const params = this.movementParams.wallSlide;

        // Cap downward speed
        if (currentVelY > params.maxSpeed) {
            return params.maxSpeed;
        }

        // Apply reduced gravity
        return currentVelY + (params.maxSpeed - currentVelY) * params.gravityScale;
    }

    /**
     * Calculate dash velocity
     * @returns {object} Dash velocity vector
     */
    calculateDashVelocity() {
        return {
            x: this.dash.direction.x * this.dash.speed,
            y: this.dash.direction.y * this.dash.speed,
        };
    }

    /**
     * Apply momentum preservation between states
     * @param {number} newVel - New velocity
     * @param {number} oldVel - Previous velocity
     * @returns {number} Velocity with momentum preserved
     */
    applyMomentumPreservation(newVel, _oldVel) {
        // Preserve momentum during state transitions
        if (this.state !== this.previousState) {
            const preservedMomentum = this.momentum.x * this.momentum.preservationFactor;
            return newVel + preservedMomentum;
        }

        return newVel;
    }

    /**
     * Update momentum tracking
     * @param {number} velX - X velocity
     * @param {number} velY - Y velocity
     */
    updateMomentum(velX, velY) {
        this.momentum.x = velX;
        this.momentum.y = velY;

        // Apply natural decay when no input
        if (this.currentInput.direction === 0) {
            this.momentum.x *= this.momentum.decayRate;
        }
    }

    /**
     * Update coyote time
     * @param {boolean} isOnGround - Ground contact state
     * @param {RAPIER.RigidBody} body - Player's physics body
     */
    updateCoyoteTime(isOnGround, body) {
        if (isOnGround) {
            // Reset coyote time when on ground
            this.coyoteTime.active = false;
            this.coyoteTime.remaining = this.coyoteTime.duration;

            // Store last ground position
            const pos = body.translation();
            this.coyoteTime.lastGroundPosition = { x: pos.x, y: pos.y };
        } else if (this.state === 'grounded' && !this.coyoteTime.active) {
            // Just left ground, activate coyote time
            this.coyoteTime.active = true;
        } else if (this.coyoteTime.active) {
            // Count down coyote time
            this.coyoteTime.remaining -= this.fixedTimestep;
            if (this.coyoteTime.remaining <= 0) {
                this.coyoteTime.active = false;
                // Force transition to airborne if still grounded
                if (this.state === 'grounded') {
                    this.transitionToState('airborne');
                }
            }
        }
    }

    /**
     * Update state transitions based on conditions
     * @param {RAPIER.RigidBody} body - Player's physics body
     * @param {boolean} isOnGround - Ground contact state
     */
    updateStateTransitions(body, isOnGround) {
        // Detect walls for wall slide
        this.detectWalls(body);

        // Handle dash input
        if (this.currentInput.dash && this.dash.available) {
            this.initiateDash();
            return;
        }

        // Handle dash timer
        if (this.state === 'dashing') {
            this.dash.timer -= this.fixedTimestep;
            if (this.dash.timer <= 0) {
                this.transitionToState(isOnGround ? 'grounded' : 'airborne');
            }
            return;
        }

        // State-specific transition logic
        switch (this.state) {
            case 'grounded':
                if (!isOnGround && !this.coyoteTime.active) {
                    this.transitionToState('airborne');
                }
                break;

            case 'airborne':
                if (isOnGround) {
                    this.transitionToState('grounded');
                } else if (this.wallDetection.left || this.wallDetection.right) {
                    const vel = body.linvel();
                    if (vel.y > 0) {
                        // Only slide when falling
                        this.transitionToState('wall_slide');
                    }
                }
                break;

            case 'wall_slide':
                if (isOnGround) {
                    this.transitionToState('grounded');
                } else if (!this.wallDetection.left && !this.wallDetection.right) {
                    this.transitionToState('airborne');
                } else if (this.currentInput.jump) {
                    this.performWallJump(body);
                }
                break;

            case 'wall_jump':
                // Wall jump automatically transitions to airborne after a brief moment
                if (this.stateTimer > 150) {
                    this.transitionToState('airborne');
                }
                break;
        }
    }

    /**
     * Detect walls for wall sliding
     * @param {RAPIER.RigidBody} body - Player's physics body
     */
    detectWalls(body) {
        // Simple wall detection - in production, use raycasts
        // const pos = body.translation();
        const vel = body.linvel();

        // Reset wall detection
        this.wallDetection.left = false;
        this.wallDetection.right = false;

        // Only detect walls when moving towards them
        if (vel.x < 0) {
            // Check left wall - would use raycast in production
            this.wallDetection.left = this.checkWallCollision(body, -1);
        } else if (vel.x > 0) {
            // Check right wall
            this.wallDetection.right = this.checkWallCollision(body, 1);
        }
    }

    /**
     * Check for wall collision (simplified - use raycasts in production)
     * @param {RAPIER.RigidBody} body - Player's physics body
     * @param {number} direction - Direction to check (-1 left, 1 right)
     * @returns {boolean} True if wall detected
     */
    checkWallCollision(_body, _direction) {
        // In production, cast a ray from player center in the direction
        // For now, return false (would integrate with Rapier's ray casting)
        return false;
    }

    /**
     * Perform a wall jump
     * @param {RAPIER.RigidBody} body - Player's physics body
     */
    performWallJump(body) {
        const wallDir = this.wallDetection.left ? 1 : -1; // Jump away from wall
        const params = this.movementParams.wallSlide;

        // Apply wall jump velocity
        body.setLinvel(
            {
                x: wallDir * params.pushOffForce,
                y: params.wallJumpUpForce,
            },
            true
        );

        // Transition to wall jump state
        this.transitionToState('wall_jump');

        // Emit wall jump event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.WALL_JUMP, {
                position: body.translation(),
                direction: wallDir,
                velocity: body.linvel(),
            });
        }
    }

    /**
     * Initiate a dash
     */
    initiateDash() {
        // Determine dash direction
        let dashX = this.currentInput.direction;
        let dashY = 0;

        // If no horizontal input, dash in facing direction
        if (dashX === 0) {
            dashX = this.momentum.x > 0 ? 1 : -1;
        }

        // Allow diagonal dashing with up/down input
        if (this.currentInput.jump) {
            dashY = -0.7; // Upward dash
            dashX *= 0.7; // Normalize diagonal
        }

        this.dash.direction = { x: dashX, y: dashY };
        this.dash.timer = this.dash.duration;
        this.dash.available = false;
        this.dash.lastAfterimage = 0;

        // Start cooldown
        this.scene.time.delayedCall(this.dash.cooldown, () => {
            this.dash.available = true;
        });

        // Transition to dash state
        this.transitionToState('dashing');

        // Emit dash event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_DASH, {
                direction: this.dash.direction,
                position: this.playerController.getBody().translation(),
            });
        }
    }

    /**
     * Create dash afterimage effect
     * @param {Phaser.GameObjects.Sprite} sprite - Player sprite
     * @param {number} time - Current time
     */
    createDashAfterimage(sprite, time) {
        if (time - this.dash.lastAfterimage > this.dash.afterimageInterval) {
            this.dash.lastAfterimage = time;

            // Create afterimage sprite
            const afterimage = this.scene.add.sprite(sprite.x, sprite.y, sprite.texture.key);

            afterimage.setAlpha(0.5);
            afterimage.setTint(0x00ffff);
            afterimage.setScale(sprite.scaleX, sprite.scaleY);
            afterimage.setRotation(sprite.rotation);

            // Fade out and destroy
            this.scene.tweens.add({
                targets: afterimage,
                alpha: 0,
                scale: 0.8,
                duration: 300,
                onComplete: () => afterimage.destroy(),
            });
        }
    }

    /**
     * Transition to a new state
     * @param {string} newState - State to transition to
     */
    transitionToState(newState) {
        // Check if transition is valid
        const currentStateConfig = this.stateTransitions[this.state];
        if (!currentStateConfig || !currentStateConfig.canTransitionTo.includes(newState)) {
            LOG.warn('ENHANCEDMOVEMENTCONTROLLER_INVALID_STATE_TRANSITION', {
                subsystem: 'player',
                message: 'Invalid state transition attempted',
                currentState: this.state,
                attemptedState: newState,
                allowedTransitions: currentStateConfig?.canTransitionTo || [],
                hint: 'Review state machine transition rules or fix state transition logic',
            });
            return;
        }

        // Call exit handler for current state
        if (currentStateConfig.onExit) {
            currentStateConfig.onExit();
        }

        // Store previous state
        this.previousState = this.state;

        // Update state
        this.state = newState;
        this.stateTimer = 0;

        // Call enter handler for new state
        const newStateConfig = this.stateTransitions[newState];
        if (newStateConfig && newStateConfig.onEnter) {
            newStateConfig.onEnter();
        }

        // Emit state change event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_STATE_CHANGE, {
                previousState: this.previousState,
                currentState: this.state,
                momentum: { ...this.momentum },
            });
        }
    }

    /**
     * Interpolate visual position for smooth rendering
     * @param {Phaser.GameObjects.Sprite} sprite - Player sprite
     * @param {RAPIER.RigidBody} body - Physics body
     * @param {number} alpha - Interpolation factor
     */
    interpolateVisuals(sprite, body, alpha) {
        // Store previous position if not exists
        if (!this.previousPosition) {
            const pos = body.translation();
            this.previousPosition = { x: pos.x, y: pos.y };
        }

        const currentPos = body.translation();

        // Interpolate between previous and current position
        const interpolatedX =
            this.previousPosition.x + (currentPos.x - this.previousPosition.x) * alpha;
        const interpolatedY =
            this.previousPosition.y + (currentPos.y - this.previousPosition.y) * alpha;

        sprite.setPosition(interpolatedX, interpolatedY);

        // Update previous position for next frame
        this.previousPosition = { x: currentPos.x, y: currentPos.y };
    }

    // State transition handlers
    onEnterGrounded() {
        // Reset dash on ground
        this.dash.available = true;
    }

    onExitGrounded() {
        // Store last ground momentum
        this.momentum.preservationFactor = 0.85;
    }

    onEnterAirborne() {
        // Preserve momentum from ground
    }

    onExitAirborne() {
        // Nothing special
    }

    onEnterWallSlide() {
        // Emit wall slide start event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.WALL_SLIDE_START, {
                wall: this.wallDetection.left ? 'left' : 'right',
            });
        }
    }

    onExitWallSlide() {
        // Emit wall slide end event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.WALL_SLIDE_END);
        }
    }

    onEnterWallJump() {
        // Reset dash after wall jump
        this.dash.available = true;
    }

    onExitWallJump() {
        // Nothing special
    }

    onEnterDash() {
        // Dash particles handled by effects system
    }

    onExitDash() {
        // Emit dash end event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_DASH_END);
        }
    }

    /**
     * Create acceleration curve for smooth movement
     * @returns {Array} Curve points
     */
    createAccelerationCurve() {
        // Exponential curve for snappy acceleration
        return [
            { t: 0, value: 1.0 },
            { t: 0.2, value: 0.95 },
            { t: 0.5, value: 0.85 },
            { t: 0.8, value: 0.7 },
            { t: 1.0, value: 0.5 },
        ];
    }

    /**
     * Create deceleration curve for stopping
     * @returns {Array} Curve points
     */
    createDecelerationCurve() {
        // Sharp curve for quick stops
        return [
            { t: 0, value: 0.5 },
            { t: 0.3, value: 0.7 },
            { t: 0.6, value: 0.85 },
            { t: 0.8, value: 0.95 },
            { t: 1.0, value: 1.0 },
        ];
    }

    /**
     * Create turning curve for direction changes
     * @returns {Array} Curve points
     */
    createTurningCurve() {
        // Aggressive curve for responsive turns
        return [
            { t: 0, value: 1.5 },
            { t: 0.3, value: 1.3 },
            { t: 0.6, value: 1.1 },
            { t: 0.8, value: 1.0 },
            { t: 1.0, value: 0.9 },
        ];
    }

    /**
     * Evaluate a curve at a given t value
     * @param {Array} curve - Curve points
     * @param {number} t - Time value (0-1)
     * @returns {number} Interpolated value
     */
    evaluateCurve(curve, t) {
        t = Math.max(0, Math.min(1, t));

        // Find surrounding points
        let i = 0;
        while (i < curve.length - 1 && curve[i + 1].t < t) {
            i++;
        }

        if (i === curve.length - 1) {
            return curve[i].value;
        }

        // Linear interpolation between points
        const p1 = curve[i];
        const p2 = curve[i + 1];
        const localT = (t - p1.t) / (p2.t - p1.t);

        return p1.value + (p2.value - p1.value) * localT;
    }

    /**
     * Get current state information
     * @returns {object} State info
     */
    getStateInfo() {
        return {
            state: this.state,
            previousState: this.previousState,
            stateTimer: this.stateTimer,
            momentum: { ...this.momentum },
            coyoteTime: {
                active: this.coyoteTime.active,
                remaining: this.coyoteTime.remaining,
            },
            dash: {
                available: this.dash.available,
                timer: this.dash.timer,
            },
            wallDetection: {
                left: this.wallDetection.left,
                right: this.wallDetection.right,
            },
            metrics: { ...this.metrics },
        };
    }

    /**
     * Clean up resources
     */
    shutdown() {
        // Clear any timers or tweens
        this.inputBuffer.buffer.fill(null);
        this.accumulator = 0;
    }
}
