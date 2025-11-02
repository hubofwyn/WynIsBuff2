import { DeterministicRNG } from '../../core/DeterministicRNG.js';
import { EventNames } from '../../constants/EventNames.js';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * WallJumpController class handles wall detection and wall jump mechanics
 * for enhanced platforming gameplay with precise physics.
 */
export class WallJumpController {
    /**
     * Create a new WallJumpController
     * @param {Phaser.Scene} scene - The scene this controller belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;

        // Initialize deterministic RNG for particle effects
        this.rng = DeterministicRNG.getInstance();

        // Wall detection state
        this.wallContactLeft = false;
        this.wallContactRight = false;
        this.isWallSliding = false;
        this.wallSlideDirection = 0; // -1 for left wall, 1 for right wall

        // Wall jump timing and buffer
        this.wallJumpBuffer = 0;
        this.wallJumpBufferTime = 150; // ms to buffer wall jumps
        this.lastWallContact = 0;
        this.wallCoyoteTime = 100; // ms grace period after leaving wall

        // Wall jump physics parameters
        this.wallJumpParams = {
            // Force applied when wall jumping
            horizontalForce: 55, // Strong horizontal push off wall
            verticalForce: -60, // Upward force (negative Y)
            wallSlideSpeed: 25, // Maximum wall slide speed
            wallSlideFriction: 0.8, // How much the wall slows you down
            wallStickTime: 200, // How long you "stick" to wall on contact
            minWallJumpSpeed: 30, // Minimum horizontal speed for wall jump

            // Wall jump direction lock (prevents immediate direction change)
            directionLockTime: 300, // ms player can't move back toward wall
            directionLockStrength: 0.7, // How much input is reduced during lock
        };

        // Wall detection parameters
        this.wallDetection = {
            rayLength: 35, // How far to cast wall detection rays
            rayOffset: 20, // Vertical offset for ray casting
            minContactVelocity: 5, // Minimum velocity needed to stick to wall
            wallAngleTolerance: 0.2, // Tolerance for wall surface angle
        };

        // State tracking
        this.wallJumpDirectionLock = 0;
        this.wallJumpLockTimer = 0;
        this.lastWallJumpTime = 0;

        LOG.dev('WALLJUMPCONTROLLER_INITIALIZED', {
            subsystem: 'player',
            message: 'WallJumpController initialized with enhanced wall jump physics',
            params: {
                horizontalForce: this.wallJumpParams.horizontalForce,
                verticalForce: this.wallJumpParams.verticalForce,
                wallSlideSpeed: this.wallJumpParams.wallSlideSpeed,
                directionLockTime: this.wallJumpParams.directionLockTime,
            },
        });
    }

    /**
     * Update wall jump controller every frame
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite} sprite - The player's sprite
     * @param {object} input - Input state object
     * @param {Array} platforms - Array of platforms for wall detection
     * @param {boolean} isOnGround - Whether player is on ground
     */
    update(body, sprite, input, platforms, _isOnGround) {
        if (!body) return;

        // Update wall detection
        this.detectWalls(body, platforms);

        // Handle wall sliding physics
        this.handleWallSlide(body);

        // Handle wall jump input
        this.handleWallJumpInput(body, sprite, input);

        // Update direction lock timer
        this.updateDirectionLock(body, input);

        // Update wall jump buffer
        this.updateWallJumpBuffer();

        // Emit wall state events
        this.emitWallEvents(body, sprite);
    }

    /**
     * Detect walls using raycasting from the player's position
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Array} platforms - Array of platforms to check for walls
     */
    detectWalls(body, platforms) {
        if (!body) return;

        const position = body.translation();
        const velocity = body.linvel();

        // Reset wall contact flags
        const wasWallContactLeft = this.wallContactLeft;
        const wasWallContactRight = this.wallContactRight;
        this.wallContactLeft = false;
        this.wallContactRight = false;

        // Only check for walls when moving horizontally or falling
        if (Math.abs(velocity.x) < 2 && velocity.y < 2) return;

        // Cast rays to detect walls on both sides
        const rayTop = { x: position.x, y: position.y - this.wallDetection.rayOffset };
        const rayBottom = { x: position.x, y: position.y + this.wallDetection.rayOffset };

        // Check left wall
        const _leftRayTop = { x: rayTop.x - this.wallDetection.rayLength, y: rayTop.y };
        const _leftRayBottom = { x: rayBottom.x - this.wallDetection.rayLength, y: rayBottom.y };

        // Check right wall
        const _rightRayTop = { x: rayTop.x + this.wallDetection.rayLength, y: rayTop.y };
        const _rightRayBottom = { x: rayBottom.x + this.wallDetection.rayLength, y: rayBottom.y };

        // Simplified wall detection using platform bounds
        // In a full implementation, this would use proper physics raycasting
        platforms.forEach((platform) => {
            if (!platform.body) return;

            const _platformPos = platform.body.translation();
            const bounds = this.getPlatformBounds(platform);

            // Check if player is at wall height and close enough horizontally
            if (position.y > bounds.top && position.y < bounds.bottom) {
                const distToLeftEdge = Math.abs(position.x - bounds.left);
                const distToRightEdge = Math.abs(position.x - bounds.right);

                // Left wall detection
                if (
                    distToLeftEdge < this.wallDetection.rayLength &&
                    velocity.x < -this.wallDetection.minContactVelocity
                ) {
                    this.wallContactLeft = true;
                }

                // Right wall detection
                if (
                    distToRightEdge < this.wallDetection.rayLength &&
                    velocity.x > this.wallDetection.minContactVelocity
                ) {
                    this.wallContactRight = true;
                }
            }
        });

        // Update wall slide state
        const nowWallContact = this.wallContactLeft || this.wallContactRight;
        if (nowWallContact && !this.isOnGround) {
            if (!this.isWallSliding) {
                this.startWallSlide();
            }
            this.wallSlideDirection = this.wallContactLeft ? -1 : 1;
            this.lastWallContact = Date.now();
        } else {
            if (this.isWallSliding) {
                this.endWallSlide();
            }
        }

        // Emit wall contact events
        if (this.wallContactLeft && !wasWallContactLeft) {
            this.emitWallContactEvent('left', body, position);
        }
        if (this.wallContactRight && !wasWallContactRight) {
            this.emitWallContactEvent('right', body, position);
        }
    }

    /**
     * Get simplified bounds for a platform (for wall detection)
     * @param {object} platform - Platform object
     * @returns {object} Bounds with top, bottom, left, right
     */
    getPlatformBounds(platform) {
        const pos = platform.body.translation();
        // Simplified bounds - in real implementation would get collider bounds
        return {
            left: pos.x - 32,
            right: pos.x + 32,
            top: pos.y - 16,
            bottom: pos.y + 16,
        };
    }

    /**
     * Handle wall sliding physics
     * @param {RAPIER.RigidBody} body - The player's physics body
     */
    handleWallSlide(body) {
        if (!this.isWallSliding || !body) return;

        const velocity = body.linvel();

        // Apply wall slide friction - limit downward velocity
        if (velocity.y > this.wallJumpParams.wallSlideSpeed) {
            body.setLinvel(
                {
                    x: velocity.x * this.wallJumpParams.wallSlideFriction,
                    y: this.wallJumpParams.wallSlideSpeed,
                },
                true
            );
        }

        // Apply slight horizontal force toward wall for "sticking" effect
        const stickForce = this.wallSlideDirection * -0.5;
        body.applyImpulse({ x: stickForce, y: 0 }, true);
    }

    /**
     * Handle wall jump input
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite} sprite - The player's sprite
     * @param {object} input - Input state object
     */
    handleWallJumpInput(body, sprite, input) {
        if (!body) return;

        // Check for jump input
        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(input.spaceKey) ||
            Phaser.Input.Keyboard.JustDown(input.wasd.up) ||
            Phaser.Input.Keyboard.JustDown(input.cursors.up);

        if (!jumpPressed) return;

        const now = Date.now();

        // Check if we can wall jump (on wall or within coyote time)
        const canWallJump = this.isWallSliding || now - this.lastWallContact < this.wallCoyoteTime;

        if (!canWallJump) return;

        // Determine wall jump direction
        let jumpDirection = 0;
        if (
            this.wallContactLeft ||
            (this.wallSlideDirection === -1 && now - this.lastWallContact < this.wallCoyoteTime)
        ) {
            jumpDirection = 1; // Jump right from left wall
        } else if (
            this.wallContactRight ||
            (this.wallSlideDirection === 1 && now - this.lastWallContact < this.wallCoyoteTime)
        ) {
            jumpDirection = -1; // Jump left from right wall
        }

        if (jumpDirection === 0) return;

        // Execute wall jump
        this.executeWallJump(body, sprite, jumpDirection);
    }

    /**
     * Execute a wall jump
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite} sprite - The player's sprite
     * @param {number} direction - Jump direction (-1 for left, 1 for right)
     */
    executeWallJump(body, sprite, direction) {
        if (!body || !sprite) return;

        // Apply wall jump forces
        body.setLinvel(
            {
                x: direction * this.wallJumpParams.horizontalForce,
                y: this.wallJumpParams.verticalForce,
            },
            true
        );

        // Set direction lock to prevent immediate direction change
        this.wallJumpDirectionLock = direction;
        this.wallJumpLockTimer = this.wallJumpParams.directionLockTime;
        this.lastWallJumpTime = Date.now();

        // End wall slide
        if (this.isWallSliding) {
            this.endWallSlide();
        }

        // Create wall jump particle effects
        this.createWallJumpParticles(body, sprite, direction);

        // Emit wall jump event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.WALL_JUMP, {
                direction,
                position: body.translation(),
                velocity: body.linvel(),
                wallSide: direction > 0 ? 'left' : 'right', // Which wall we jumped from
                sprite,
            });
        }

        LOG.dev('WALLJUMPCONTROLLER_WALL_JUMP_EXECUTED', {
            subsystem: 'player',
            message: 'Wall jump executed',
            direction,
            wallSide: direction > 0 ? 'left' : 'right',
            position: body.translation(),
            velocity: body.linvel(),
        });
    }

    /**
     * Update direction lock timer and apply movement restriction
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {object} input - Input state object
     */
    updateDirectionLock(body, input) {
        if (this.wallJumpLockTimer <= 0) return;

        this.wallJumpLockTimer -= 16; // Assuming 60fps (16ms per frame)

        if (this.wallJumpLockTimer <= 0) {
            this.wallJumpDirectionLock = 0;
            return;
        }

        // Apply movement restriction during direction lock
        const velocity = body.linvel();
        const oppositeInput =
            this.wallJumpDirectionLock > 0
                ? input.wasd.left.isDown || input.cursors.left.isDown
                : input.wasd.right.isDown || input.cursors.right.isDown;

        if (oppositeInput) {
            // Reduce movement in opposite direction
            const lockStrength = this.wallJumpParams.directionLockStrength;
            const newVelX = velocity.x * lockStrength;
            body.setLinvel({ x: newVelX, y: velocity.y }, true);
        }
    }

    /**
     * Update wall jump buffer timer
     */
    updateWallJumpBuffer() {
        if (this.wallJumpBuffer > 0) {
            this.wallJumpBuffer -= 16; // Assuming 60fps
        }
    }

    /**
     * Start wall sliding state
     */
    startWallSlide() {
        this.isWallSliding = true;

        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.WALL_SLIDE_START, {
                direction: this.wallSlideDirection,
                timestamp: Date.now(),
            });
        }
    }

    /**
     * End wall sliding state
     */
    endWallSlide() {
        this.isWallSliding = false;

        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.WALL_SLIDE_END, {
                direction: this.wallSlideDirection,
                timestamp: Date.now(),
            });
        }
    }

    /**
     * Create particle effects for wall jump
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite} sprite - The player's sprite
     * @param {number} direction - Jump direction
     */
    createWallJumpParticles(body, sprite, direction) {
        if (!sprite || !body) return;

        const position = body.translation();
        const particleCount = 15;
        const wallColor = 0x888888;
        const energyColor = 0x44ffff;

        // Create particles at wall contact point
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.PI * 0.5 + (this.rng.next('main') - 0.5) * Math.PI * 0.8;
            const speed = 60 + this.rng.next('main') * 40;

            const particle = this.scene.add.circle(
                position.x - direction * 25, // Offset to wall side
                position.y + this.rng.next('main') * 20 - 10,
                3 + this.rng.next('main') * 2,
                i < 8 ? wallColor : energyColor,
                0.8
            );

            particle.setDepth(95);

            // Animate particles
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * speed * direction,
                y: particle.y - Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.3,
                duration: 500 + this.rng.next('main') * 200,
                ease: 'Power2.Out',
                onComplete: () => particle.destroy(),
            });
        }

        // Create wall impact line effect
        const impactLine = this.scene.add.line(
            position.x - direction * 25,
            position.y,
            0,
            -15,
            0,
            15,
            energyColor,
            0.9
        );
        impactLine.setLineWidth(4);
        impactLine.setDepth(96);

        this.scene.tweens.add({
            targets: impactLine,
            alpha: 0,
            scaleY: 0.1,
            duration: 200,
            ease: 'Power2.Out',
            onComplete: () => impactLine.destroy(),
        });
    }

    /**
     * Emit wall contact event
     * @param {string} side - 'left' or 'right'
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {object} position - Player position
     */
    emitWallContactEvent(side, body, position) {
        if (!this.eventSystem) return;

        this.eventSystem.emit('player:wallContact', {
            side,
            position,
            velocity: body.linvel(),
            timestamp: Date.now(),
        });
    }

    /**
     * Emit wall-related events for visual effects
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite} sprite - The player's sprite
     */
    emitWallEvents(body, sprite) {
        if (!this.eventSystem || !body) return;

        // Emit wall slide event for continuous effects
        if (this.isWallSliding) {
            this.eventSystem.emit('player:wallSlideActive', {
                direction: this.wallSlideDirection,
                velocity: body.linvel(),
                position: body.translation(),
                sprite,
            });
        }
    }

    /**
     * Get current wall jump state
     * @returns {object} Wall jump state information
     */
    getWallJumpState() {
        return {
            wallContactLeft: this.wallContactLeft,
            wallContactRight: this.wallContactRight,
            isWallSliding: this.isWallSliding,
            wallSlideDirection: this.wallSlideDirection,
            canWallJump:
                this.isWallSliding || Date.now() - this.lastWallContact < this.wallCoyoteTime,
            directionLock: this.wallJumpDirectionLock,
            lockTimeRemaining: this.wallJumpLockTimer,
        };
    }

    /**
     * Check if player can wall jump right now
     * @returns {boolean} Whether wall jump is available
     */
    canWallJump() {
        const now = Date.now();
        return this.isWallSliding || now - this.lastWallContact < this.wallCoyoteTime;
    }

    /**
     * Clean up resources when scene is shut down
     */
    shutdown() {
        // Reset all state
        this.wallContactLeft = false;
        this.wallContactRight = false;
        this.isWallSliding = false;
        this.wallJumpDirectionLock = 0;
        this.wallJumpLockTimer = 0;
    }
}
