import RAPIER from '@dimforge/rapier2d-compat';

import { EventNames } from '../../constants/EventNames.js';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * WallDashController - Advanced wall interaction and dash mechanics
 * integrated with Rapier collision detection.
 *
 * Features:
 * - Wall slide with proper friction
 * - Wall jump with angle control
 * - Wall dash for horizontal/diagonal movement
 * - Collision-based wall detection
 * - Momentum preservation through transitions
 */
export class WallDashController {
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;

        // Wall detection state
        this.wallState = {
            touchingLeft: false,
            touchingRight: false,
            slideActive: false,
            lastWallNormal: { x: 0, y: 0 },
            contactPoint: { x: 0, y: 0 },
            gripStrength: 1.0,
            slideTime: 0,
        };

        // Dash state
        this.dashState = {
            available: true,
            active: false,
            direction: { x: 0, y: 0 },
            startTime: 0,
            dashCount: 0,
            maxDashes: 2,
            cooldownTimer: null,
        };

        // Wall mechanics parameters
        this.wallParams = {
            // Detection
            detection: {
                rayLength: 35, // Pixels for wall detection
                rayCount: 3, // Number of rays for detection
                angleSpread: 15, // Degrees between rays
                minContactForce: 0.1, // Minimum force to register contact
            },

            // Sliding
            slide: {
                maxSpeed: 180, // Maximum slide velocity
                acceleration: 1200, // Slide acceleration (gravity)
                friction: 0.85, // Wall friction coefficient
                minVelocityToStick: 50, // Min velocity to stick to wall
                detachVelocity: 600, // Velocity to detach from wall
            },

            // Wall jump
            wallJump: {
                horizontalForce: 420, // Push off force
                verticalForce: -580, // Upward force
                angleControl: 0.3, // How much input affects angle
                momentumTransfer: 0.7, // Momentum preservation
            },

            // Wall dash
            wallDash: {
                speed: 720, // Dash speed
                duration: 200, // Dash duration in ms
                cooldown: 800, // Cooldown between dashes
                angleOptions: [
                    // Available dash angles
                    { x: 1, y: 0 }, // Horizontal
                    { x: 0.707, y: -0.707 }, // Diagonal up
                    { x: 0.707, y: 0.707 }, // Diagonal down
                ],
                cancelGravity: true, // Cancel gravity during dash
                preserveMomentum: 0.3, // Momentum after dash
            },
        };

        // Collision shapes for optimization
        this.collisionShapes = {
            wallSensor: null,
            dashCollider: null,
        };

        // Visual effects
        this.effects = {
            wallSlideParticles: null,
            dashTrail: null,
            impactEffect: null,
        };

        LOG.dev('WALLDASHCONTROLLER_INITIALIZED', {
            subsystem: 'player',
            message: 'WallDashController initialized with Rapier collision integration',
        });
    }

    /**
     * Update wall dash system
     * @param {RAPIER.RigidBody} body - Player physics body
     * @param {object} sprite - Player sprite
     * @param {object} input - Input state
     * @param {number} deltaTime - Frame time
     */
    update(body, sprite, input, deltaTime) {
        if (!body) return;

        const velocity = body.linvel();
        const position = body.translation();

        // Update wall detection
        this.updateWallDetection(body, position, velocity);

        // Handle wall sliding
        if (this.wallState.slideActive) {
            this.handleWallSlide(body, velocity, deltaTime);
        }

        // Handle dash input and execution
        if (input.dash && this.canDash()) {
            this.initiateDash(body, input, velocity);
        }

        // Update active dash
        if (this.dashState.active) {
            this.updateDash(body, deltaTime);
        }

        // Handle wall jump
        if (input.jump && this.canWallJump()) {
            this.executeWallJump(body, input, velocity);
        }

        // Update visual effects
        this.updateEffects(sprite, position, velocity);
    }

    /**
     * Update wall detection using Rapier collision queries
     */
    updateWallDetection(body, position, velocity) {
        const world = body.world();
        const params = this.wallParams.detection;

        // Reset wall state
        this.wallState.touchingLeft = false;
        this.wallState.touchingRight = false;

        // Cast multiple rays for robust detection
        for (let i = 0; i < params.rayCount; i++) {
            const angleOffset = ((i - 1) * params.angleSpread * Math.PI) / 180;

            // Left wall detection
            const leftRay = new RAPIER.Ray(
                { x: position.x, y: position.y },
                { x: -Math.cos(angleOffset), y: Math.sin(angleOffset) }
            );

            const leftHit = world.castRay(
                leftRay,
                params.rayLength,
                true, // Include solid bodies
                RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,
                null,
                body // Exclude self
            );

            if (leftHit && leftHit.toi < params.rayLength) {
                this.wallState.touchingLeft = true;
                this.wallState.lastWallNormal = { x: 1, y: 0 };
                this.wallState.contactPoint = {
                    x: position.x - leftHit.toi,
                    y: position.y,
                };
            }

            // Right wall detection
            const rightRay = new RAPIER.Ray(
                { x: position.x, y: position.y },
                { x: Math.cos(angleOffset), y: Math.sin(angleOffset) }
            );

            const rightHit = world.castRay(
                rightRay,
                params.rayLength,
                true,
                RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,
                null,
                body
            );

            if (rightHit && rightHit.toi < params.rayLength) {
                this.wallState.touchingRight = true;
                this.wallState.lastWallNormal = { x: -1, y: 0 };
                this.wallState.contactPoint = {
                    x: position.x + rightHit.toi,
                    y: position.y,
                };
            }
        }

        // Determine if sliding should be active
        const onWall = this.wallState.touchingLeft || this.wallState.touchingRight;
        const fallingTowardWall = velocity.y > 0 && onWall;
        const sufficientVelocity = Math.abs(velocity.y) > this.wallParams.slide.minVelocityToStick;

        if (fallingTowardWall && sufficientVelocity && !this.dashState.active) {
            if (!this.wallState.slideActive) {
                this.startWallSlide(body);
            }
        } else if (this.wallState.slideActive && !onWall) {
            this.endWallSlide();
        }
    }

    /**
     * Start wall slide
     */
    startWallSlide(body) {
        this.wallState.slideActive = true;
        this.wallState.slideTime = 0;
        this.wallState.gripStrength = 1.0;

        // Reduce horizontal velocity for stick effect
        const vel = body.linvel();
        body.setLinvel({ x: vel.x * 0.5, y: vel.y }, true);

        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.WALL_SLIDE_START, {
                position: body.translation(),
                wallSide: this.wallState.touchingLeft ? 'left' : 'right',
            });
        }
    }

    /**
     * Handle wall sliding physics
     */
    handleWallSlide(body, velocity, deltaTime) {
        this.wallState.slideTime += deltaTime;

        // Calculate slide velocity with friction
        const slideParams = this.wallParams.slide;
        let targetVelY = velocity.y + slideParams.acceleration * deltaTime;

        // Apply friction
        targetVelY *= slideParams.friction;

        // Cap at max slide speed
        if (targetVelY > slideParams.maxSpeed) {
            targetVelY = slideParams.maxSpeed;
        }

        // Reduce grip strength over time
        this.wallState.gripStrength = Math.max(0.3, 1.0 - this.wallState.slideTime * 0.2);

        // Apply horizontal force to stick to wall
        const wallDir = this.wallState.touchingLeft ? -1 : 1;
        const stickForce = wallDir * 100 * this.wallState.gripStrength;

        body.setLinvel(
            {
                x: velocity.x + stickForce * deltaTime,
                y: targetVelY,
            },
            true
        );

        // Check for detach condition
        if (Math.abs(velocity.x) > slideParams.detachVelocity) {
            this.endWallSlide();
        }
    }

    /**
     * End wall slide
     */
    endWallSlide() {
        this.wallState.slideActive = false;
        this.wallState.slideTime = 0;

        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.WALL_SLIDE_END, {
                slideDuration: this.wallState.slideTime,
            });
        }
    }

    /**
     * Check if dash is available
     */
    canDash() {
        return (
            this.dashState.available &&
            !this.dashState.active &&
            (this.wallState.slideActive || this.dashState.dashCount < this.dashState.maxDashes)
        );
    }

    /**
     * Initiate dash
     */
    initiateDash(body, input, velocity) {
        const params = this.wallParams.wallDash;

        // Determine dash direction
        const dashDir = this.calculateDashDirection(input, velocity);

        // Start dash
        this.dashState.active = true;
        this.dashState.direction = dashDir;
        this.dashState.startTime = performance.now();
        this.dashState.dashCount++;

        // Set dash velocity
        const dashVel = {
            x: dashDir.x * params.speed,
            y: dashDir.y * params.speed,
        };

        // Add momentum preservation
        if (params.preserveMomentum > 0) {
            dashVel.x += velocity.x * params.preserveMomentum;
            dashVel.y += velocity.y * params.preserveMomentum;
        }

        body.setLinvel(dashVel, true);

        // Cancel gravity if specified
        if (params.cancelGravity) {
            body.setGravityScale(0, true);
        }

        // End wall slide if active
        if (this.wallState.slideActive) {
            this.endWallSlide();
        }

        // Start cooldown
        this.startDashCooldown();

        // Emit dash event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_DASH, {
                position: body.translation(),
                direction: dashDir,
                dashNumber: this.dashState.dashCount,
                fromWall: this.wallState.slideActive,
            });
        }
    }

    /**
     * Calculate dash direction based on input
     */
    calculateDashDirection(input, velocity) {
        const _options = this.wallParams.wallDash.angleOptions;

        // Default to horizontal dash away from wall
        const baseDir = { x: 1, y: 0 };
        if (this.wallState.touchingLeft) {
            baseDir.x = 1;
        } else if (this.wallState.touchingRight) {
            baseDir.x = -1;
        } else {
            // Air dash - use velocity direction
            baseDir.x = Math.sign(velocity.x) || 1;
        }

        // Modify based on input
        if (input.up) {
            return { x: baseDir.x * 0.707, y: -0.707 };
        } else if (input.down) {
            return { x: baseDir.x * 0.707, y: 0.707 };
        }

        return baseDir;
    }

    /**
     * Update active dash
     */
    updateDash(body, _deltaTime) {
        const now = performance.now();
        const dashTime = now - this.dashState.startTime;

        if (dashTime > this.wallParams.wallDash.duration) {
            this.endDash(body);
        }
    }

    /**
     * End dash
     */
    endDash(body) {
        this.dashState.active = false;

        // Restore gravity
        body.setGravityScale(1, true);

        // Apply momentum preservation
        const vel = body.linvel();
        const preserveFactor = this.wallParams.wallDash.preserveMomentum;
        body.setLinvel(
            {
                x: vel.x * preserveFactor,
                y: vel.y * preserveFactor,
            },
            true
        );

        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_DASH_END, {
                position: body.translation(),
            });
        }
    }

    /**
     * Start dash cooldown
     */
    startDashCooldown() {
        this.dashState.available = false;

        if (this.dashState.cooldownTimer) {
            this.dashState.cooldownTimer.remove();
        }

        this.dashState.cooldownTimer = this.scene.time.delayedCall(
            this.wallParams.wallDash.cooldown,
            () => {
                this.dashState.available = true;
                this.dashState.dashCount = 0;
                this.dashState.cooldownTimer = null;
            }
        );
    }

    /**
     * Check if wall jump is available
     */
    canWallJump() {
        return (
            this.wallState.slideActive ||
            this.wallState.touchingLeft ||
            this.wallState.touchingRight
        );
    }

    /**
     * Execute wall jump
     */
    executeWallJump(body, input, velocity) {
        const params = this.wallParams.wallJump;

        // Calculate jump direction
        const wallNormal = this.wallState.lastWallNormal;
        const jumpDir = {
            x: wallNormal.x * params.horizontalForce,
            y: params.verticalForce,
        };

        // Allow angle control with input
        if (input.up) {
            jumpDir.y *= 1.2; // Higher jump
        }
        if (input.left || input.right) {
            const inputDir = input.left ? -1 : 1;
            jumpDir.x += inputDir * params.horizontalForce * params.angleControl;
        }

        // Preserve some momentum
        jumpDir.x += velocity.x * params.momentumTransfer;

        // Apply jump velocity
        body.setLinvel(jumpDir, true);

        // End wall slide
        if (this.wallState.slideActive) {
            this.endWallSlide();
        }

        // Reset dash count for wall jumps
        this.dashState.dashCount = 0;

        // Emit wall jump event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.WALL_JUMP, {
                position: body.translation(),
                jumpVelocity: jumpDir,
                wallSide: this.wallState.touchingLeft ? 'left' : 'right',
            });
        }
    }

    /**
     * Update visual effects
     */
    updateEffects(sprite, position, velocity) {
        if (!sprite) return;

        // Wall slide particles
        if (this.wallState.slideActive) {
            this.createWallSlideParticles(position, velocity);
        }

        // Dash trail
        if (this.dashState.active) {
            this.createDashTrail(sprite, position);
        }
    }

    /**
     * Create wall slide particle effects
     */
    createWallSlideParticles(_position, _velocity) {
        const side = this.wallState.touchingLeft ? -1 : 1;

        // Create sparks at contact point
        if (Math.random() < 0.3) {
            // 30% chance per frame
            const particle = this.scene.add.circle(
                this.wallState.contactPoint.x,
                this.wallState.contactPoint.y,
                2,
                0xffaa00
            );

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + side * 20,
                y: particle.y + 30,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => particle.destroy(),
            });
        }
    }

    /**
     * Create dash trail effect
     */
    createDashTrail(sprite, position) {
        // Create afterimage
        const afterimage = this.scene.add.sprite(position.x, position.y, sprite.texture.key);
        afterimage.setAlpha(0.5);
        afterimage.setTint(0x00ffff);
        afterimage.setScale(sprite.scaleX, sprite.scaleY);
        afterimage.setRotation(sprite.rotation);

        this.scene.tweens.add({
            targets: afterimage,
            alpha: 0,
            scale: 0.8,
            duration: 200,
            onComplete: () => afterimage.destroy(),
        });
    }
}
