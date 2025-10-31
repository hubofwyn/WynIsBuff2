import { EventNames } from '../../constants/EventNames.js';
import { SceneKeys } from '../../constants/SceneKeys';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * JumpController class handles all jump-related functionality for the player
 * including jump physics, buffering, variable height, and state tracking.
 */
export class JumpController {
    /**
     * Create a new JumpController
     * @param {Phaser.Scene} scene - The scene this controller belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;

        // Jump state
        this.jumpsUsed = 0;
        this.maxJumps = 3;
        this.jumpState = 'grounded'; // 'grounded', 'rising', 'peak', 'falling'
        this.isOnGround = false;

        // Jump tracking variables
        this._jumpBufferTimer = null;
        this._jumpKeyHeld = false;
        this._jumpReleased = false;
        this._currentJumpNumber = 0;
        this._lastVelocityY = 0;
        this._landingRecoveryTimer = null;
        this._isInLandingRecovery = false;
        this._coyoteTimer = null;
        this._lastOnGround = false;

        // Triple jump cooldown tracking
        this.tripleJumpCooldown = false;
        this.cooldownTimer = null;
        this.cooldownDuration = 2000; // 2 seconds cooldown after triple jump
        this.explosionTriggered = false;

        // Jump physics parameters (EXTREME BUFFNESS)
        this.jumpParams = {
            baseForce: -65, // Stronger base jump for buff characters
            // Jump forces for each jump - buff progression
            forces: {
                1: -65, // First jump - strong foundation
                2: -75, // Second jump - noticeable boost
                3: -90, // Third jump - massive buff leap
            },
            releaseMultiplier: 0.5, // Better variable jump control
            minJumpTime: 100, // Slightly longer minimum
            bufferTime: 150, // Forgiving input buffer
            coyoteTime: 120, // Classic coyote time
            landingRecoveryTime: 80, // Quicker recovery for action
            // Horizontal boost parameters
            horizontalBoost: {
                threshold: 0.3,
                multiplier: 1.3, // More horizontal momentum
            },
            // Additional impulse parameters - buff feel
            additionalImpulse: {
                x: 0,
                y: -15, // Extra pop for satisfying jumps
            },
            // Squash and stretch parameters for each jump - very subtle
            squashStretch: {
                1: { squashX: 1.05, squashY: 0.95, duration: 120 },
                2: { squashX: 1.08, squashY: 0.92, duration: 150 },
                3: { squashX: 1.12, squashY: 0.88, duration: 200 },
            },
        };

        LOG.dev('JUMPCONTROLLER_INITIALIZED', {
            subsystem: 'player',
            message: 'JumpController initialized with triple-jump and coyote time',
        });
    }

    /**
     * Update method called every frame
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     * @param {object} input - Input state object with jump key states
     */
    update(body, sprite, input) {
        if (!body) return;

        // Update jump state based on velocity
        this.updateJumpState(body, sprite);

        // Track jump key state
        this.trackJumpKeyState(input);

        // Handle jump input
        this.handleJumpInput(body, sprite, input);
    }

    /**
     * Set ground state
     * @param {boolean} isOnGround - Whether the player is on the ground
     */
    setGroundState(isOnGround) {
        // Store previous ground state
        const wasOnGround = this._lastOnGround;

        // Update ground state
        this.isOnGround = isOnGround;

        // Handle coyote time
        this.handleCoyoteTime();

        // Handle landing
        if (!wasOnGround && this.isOnGround) {
            this.handleLanding();
        }

        // Reset jump count when on ground
        if (this.isOnGround) {
            this.jumpsUsed = 0;
        }

        // Store ground state for next frame
        this._lastOnGround = this.isOnGround;
    }

    /**
     * Handle coyote time (grace period after leaving platform)
     */
    handleCoyoteTime() {
        // Add a small coyote time (grace period after leaving platform)
        if (!this.isOnGround && this._lastOnGround) {
            if (!this._coyoteTimer) {
                this._coyoteTimer = this.scene.time.addEvent({
                    delay: this.jumpParams.coyoteTime,
                    callback: () => {
                        this._coyoteTimer = null;
                    },
                });
                // Still considered on ground during coyote time
                this.isOnGround = true;
            }
        } else if (this.isOnGround) {
            // Reset coyote timer when on ground
            if (this._coyoteTimer) {
                this._coyoteTimer.remove();
                this._coyoteTimer = null;
            }

            // Execute buffered jump if there is one
            if (this._jumpBufferTimer && !this._isInLandingRecovery) {
                this.executeJump();
                this._jumpBufferTimer.remove();
                this._jumpBufferTimer = null;
            }
        }
    }

    /**
     * Handle landing event
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     */
    handleLanding(body, sprite) {
        if (!body || !sprite) return;

        // Start landing recovery timer
        this._isInLandingRecovery = true;
        this._landingRecoveryTimer = this.scene.time.delayedCall(
            this.jumpParams.landingRecoveryTime,
            () => {
                this._isInLandingRecovery = false;
                this._landingRecoveryTimer = null;
            }
        );

        // Apply a small squash effect on landing
        this.applySquashEffect(sprite, 1.2, 0.8, 100);

        // Get position and velocity for event data
        const position = body.translation();
        const velocity = body.linvel();

        // Emit the land event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_LAND, {
                position: {
                    x: position.x,
                    y: position.y,
                },
                velocity: {
                    x: velocity.x,
                    y: velocity.y,
                },
                sprite,
            });

            // Also emit the land impact event for effects
            this.eventSystem.emit(EventNames.PLAYER_LAND_IMPACT, {
                position: {
                    x: position.x,
                    y: position.y,
                },
                velocity: {
                    x: velocity.x,
                    y: velocity.y,
                },
                impactForce: Math.min(Math.abs(velocity.y) / 20, 2), // Cap at 2x
                sprite,
            });
        }

        // Reset jump state
        this.jumpState = 'grounded';
        this._currentJumpNumber = 0;
    }

    /**
     * Track jump key state for variable jump height
     * @param {object} input - Input state object with jump key states
     */
    trackJumpKeyState(input) {
        // Check if any jump key is held
        const jumpKeyDown =
            input.spaceKey.isDown || input.wasd.up.isDown || input.cursors.up.isDown;

        // Track when jump key is released during a jump
        if (this._jumpKeyHeld && !jumpKeyDown && this.jumpState === 'rising') {
            this._jumpReleased = true;

            // Apply variable jump height by cutting the upward velocity
            if (this.body && this._jumpReleased) {
                const currentVel = this.body.linvel();
                if (currentVel.y < 0) {
                    // Only reduce velocity if still moving upward
                    this.body.setLinvel(
                        {
                            x: currentVel.x,
                            y: currentVel.y * this.jumpParams.releaseMultiplier,
                        },
                        true
                    );
                }
            }
        }

        // Update jump key held state
        this._jumpKeyHeld = jumpKeyDown;
    }

    /**
     * Handle jump input
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     * @param {object} input - Input state object with jump key states
     */
    handleJumpInput(body, sprite, input) {
        if (!body) return;

        // Check for jump input from SPACE, W, or UP arrow
        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(input.spaceKey) ||
            Phaser.Input.Keyboard.JustDown(input.wasd.up) ||
            Phaser.Input.Keyboard.JustDown(input.cursors.up);

        if (jumpPressed) {
            // If on ground or have jumps left, execute jump immediately
            if (this.isOnGround || this.jumpsUsed < this.maxJumps) {
                this.executeJump(body, sprite);
            } else {
                // Otherwise, buffer the jump for a short time
                this.bufferJump();
            }
        }
    }

    /**
     * Buffer a jump for a short time
     */
    bufferJump() {
        // Clear any existing buffer timer
        if (this._jumpBufferTimer) {
            this._jumpBufferTimer.remove();
        }

        // Create a new buffer timer
        this._jumpBufferTimer = this.scene.time.delayedCall(this.jumpParams.bufferTime, () => {
            this._jumpBufferTimer = null;
        });
    }

    /**
     * Execute a jump
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     */
    executeJump(body, sprite) {
        if (!body || !sprite) return;

        const currentVel = body.linvel();

        // Determine which jump this is (first, second, or third)
        const jumpNumber = this.isOnGround ? 1 : this.jumpsUsed + 1;

        // Check for fourth jump attempt during cooldown
        if (jumpNumber > 3 && this.tripleJumpCooldown && !this.explosionTriggered) {
            this.triggerExplosion(body, sprite);
            return;
        }

        // Prevent jumping beyond triple jump
        if (jumpNumber > 3) {
            return;
        }

        // Get the appropriate jump force
        const jumpForce = this.jumpParams.forces[jumpNumber] || this.jumpParams.baseForce;

        // Add horizontal boost when jumping while moving
        let jumpBoostX = currentVel.x;
        if (Math.abs(currentVel.x) > this.jumpParams.horizontalBoost.threshold) {
            // Boost in the direction of movement
            jumpBoostX = currentVel.x * this.jumpParams.horizontalBoost.multiplier;
        }

        // Apply the jump force with horizontal boost
        body.setLinvel({ x: jumpBoostX, y: jumpForce }, true);

        // Add a stronger upward impulse for extra "pop" feeling
        body.applyImpulse(
            {
                x: this.jumpParams.additionalImpulse.x,
                y: this.jumpParams.additionalImpulse.y,
            },
            true
        );

        // Apply jump-specific squash effect and enhanced particle effects
        const squashParams =
            this.jumpParams.squashStretch[jumpNumber] || this.jumpParams.squashStretch[1];
        this.applySquashEffect(
            sprite,
            squashParams.squashX,
            squashParams.squashY,
            squashParams.duration
        );

        // Enhanced visual feedback with particles instead of scaling
        this.createJumpParticles(body, sprite, jumpNumber);
        this.enhancePlayerGlow(sprite, jumpNumber);

        // Start cooldown after triple jump
        if (jumpNumber === 3) {
            this.startTripleJumpCooldown();
        }

        // Update jump state
        this.jumpsUsed = jumpNumber;
        this._currentJumpNumber = jumpNumber;
        this.jumpState = 'rising';
        this._jumpKeyHeld = true;
        this._jumpReleased = false;

        // Emit jump event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_JUMP, {
                jumpsUsed: this.jumpsUsed,
                maxJumps: this.maxJumps,
                position: {
                    x: body.translation().x,
                    y: body.translation().y,
                },
                velocity: {
                    x: jumpBoostX,
                    y: jumpForce,
                },
                jumpNumber: this.jumpsUsed,
                sprite,
            });

            // Also emit jump start event
            this.eventSystem.emit(EventNames.PLAYER_JUMP_START, {
                position: {
                    x: body.translation().x,
                    y: body.translation().y,
                },
                jumpNumber: this._currentJumpNumber,
                velocity: {
                    x: jumpBoostX,
                    y: jumpForce,
                },
                sprite,
            });
        }
    }

    /**
     * Update jump state based on velocity changes
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     */
    updateJumpState(body, sprite) {
        if (!body || !sprite) return;

        const currentVel = body.linvel();
        // const previousVel = this._lastVelocityY;

        // Only track jump state if we're in the air and have used jumps
        if (!this.isOnGround && this._currentJumpNumber > 0) {
            // Detect rising to peak transition
            if (this.jumpState === 'rising' && currentVel.y >= -2 && currentVel.y <= 2) {
                this.jumpState = 'peak';

                // Emit jump peak event
                if (this.eventSystem) {
                    this.eventSystem.emit(EventNames.PLAYER_JUMP_PEAK, {
                        position: {
                            x: body.translation().x,
                            y: body.translation().y,
                        },
                        jumpNumber: this._currentJumpNumber,
                        sprite,
                    });
                }
            }
            // Detect peak to falling transition
            else if (this.jumpState === 'peak' && currentVel.y > 2) {
                this.jumpState = 'falling';

                // Emit jump fall event
                if (this.eventSystem) {
                    this.eventSystem.emit(EventNames.PLAYER_JUMP_FALL, {
                        position: {
                            x: body.translation().x,
                            y: body.translation().y,
                        },
                        jumpNumber: this._currentJumpNumber,
                        velocity: {
                            x: currentVel.x,
                            y: currentVel.y,
                        },
                        sprite,
                    });
                }
            }
            // Detect rising state if velocity is significantly upward
            else if (this.jumpState === 'grounded' && currentVel.y < -5) {
                this.jumpState = 'rising';
            }
        }

        // Store current velocity for next frame
        this._lastVelocityY = currentVel.y;
    }

    /**
     * Apply a squash and stretch effect to the sprite
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The sprite
     * @param {number} squashX - X scale factor for squash
     * @param {number} squashY - Y scale factor for squash
     * @param {number} duration - Effect duration in ms
     */
    applySquashEffect(sprite, squashX, squashY, duration) {
        if (!sprite) return;

        // Store original scale
        const originalScaleX = sprite.scaleX || 1;
        const originalScaleY = sprite.scaleY || 1;

        // Apply squash
        sprite.setScale(originalScaleX * squashX, originalScaleY * squashY);

        // Return to normal over duration
        this.scene.tweens.add({
            targets: sprite,
            scaleX: originalScaleX,
            scaleY: originalScaleY,
            duration,
            ease: 'Elastic.Out',
        });
    }

    /**
     * Get the current jump state
     * @returns {object} Jump state information
     */
    getJumpState() {
        return {
            jumpsUsed: this.jumpsUsed,
            maxJumps: this.maxJumps,
            jumpState: this.jumpState,
            isOnGround: this.isOnGround,
            isInLandingRecovery: this._isInLandingRecovery,
            currentJumpNumber: this._currentJumpNumber,
        };
    }

    /**
     * Create jump particles for enhanced visual feedback
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The sprite
     * @param {number} jumpNumber - Which jump (1, 2, or 3)
     */
    createJumpParticles(body, sprite, jumpNumber) {
        if (!sprite || !body) return;

        const position = body.translation();

        // Particle configurations for each jump level
        const particleConfigs = {
            1: { count: 8, color: 0x44ff44, size: 4, speed: 80 },
            2: { count: 12, color: 0x44ddff, size: 6, speed: 120 },
            3: { count: 20, color: 0xff4444, size: 8, speed: 160 },
        };

        const config = particleConfigs[jumpNumber] || particleConfigs[1];

        // Create jump burst particles
        for (let i = 0; i < config.count; i++) {
            const angle = (Math.PI * 2 * i) / config.count + Math.random() * 0.3;
            const distance = config.speed + Math.random() * 40;

            const particle = this.scene.add.circle(
                position.x,
                position.y + 20, // Start from bottom of player
                config.size,
                config.color,
                0.8
            );

            particle.setDepth(95); // Behind player but above background

            // Animate particle outward and fade
            this.scene.tweens.add({
                targets: particle,
                x: position.x + Math.cos(angle) * distance,
                y: position.y + Math.sin(angle) * distance + 20,
                alpha: 0,
                scale: 0.2,
                duration: 400 + Math.random() * 200,
                ease: 'Power2.Out',
                onComplete: () => particle.destroy(),
            });
        }

        // Create trailing effect for triple jump
        if (jumpNumber === 3) {
            this.createTripleJumpTrail(body, sprite);
        }
    }

    /**
     * Enhance player glow based on jump number
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The sprite
     * @param {number} jumpNumber - Which jump (1, 2, or 3)
     */
    enhancePlayerGlow(sprite, jumpNumber) {
        if (!sprite) return;

        // Get player controller for glow access
        const playerController = this.scene.playerController;
        if (!playerController || !playerController.glowGraphics) return;

        const glowGraphics = playerController.glowGraphics;

        // Glow enhancement configurations
        const glowConfigs = {
            1: { intensity: 0.6, color: 0x44ff44, duration: 200, pulseCount: 1 },
            2: { intensity: 0.8, color: 0x44ddff, duration: 300, pulseCount: 2 },
            3: { intensity: 1.2, color: 0xff4444, duration: 500, pulseCount: 3 },
        };

        const config = glowConfigs[jumpNumber] || glowConfigs[1];

        // Create pulsing glow effect
        let pulseIndex = 0;
        const createPulse = () => {
            if (pulseIndex >= config.pulseCount) return;

            // Temporarily override glow with jump-specific effect
            const jumpColors = [config.color, config.color, config.color];

            // Create temporary bright pulse
            this.scene.tweens.add({
                targets: { intensity: 0.4 },
                intensity: config.intensity,
                duration: config.duration / 2,
                yoyo: true,
                ease: 'Power2.InOut',
                onUpdate: (tween) => {
                    const intensity = tween.getValue();

                    glowGraphics.clear();
                    const sizes = [50, 35, 20];

                    jumpColors.forEach((color, i) => {
                        glowGraphics.fillStyle(color, intensity * (0.4 - i * 0.1));
                        glowGraphics.fillCircle(sprite.x, sprite.y, sizes[i]);
                    });
                },
                onComplete: () => {
                    pulseIndex++;
                    if (pulseIndex < config.pulseCount) {
                        setTimeout(createPulse, 100);
                    }
                },
            });
        };

        createPulse();
    }

    /**
     * Create special triple jump trail effect
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The sprite
     */
    createTripleJumpTrail(body, sprite) {
        if (!sprite || !body) return;

        const position = body.translation();

        // Create a temporary trail following the player
        const trailSprite = this.scene.add.sprite(position.x, position.y, sprite.texture.key);
        trailSprite.setTint(0xff4444);
        trailSprite.setAlpha(0.5);
        trailSprite.setScale(sprite.scaleX, sprite.scaleY);
        trailSprite.setDepth(90); // Behind player

        // Animate trail to fade and scale down
        this.scene.tweens.add({
            targets: trailSprite,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 800,
            ease: 'Power2.Out',
            onComplete: () => trailSprite.destroy(),
        });

        // Create energy rings for triple jump
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ring = this.scene.add.circle(position.x, position.y, 10, 0xff4444, 0);
                ring.setStrokeStyle(3, 0xff4444, 0.8);
                ring.setDepth(92);

                this.scene.tweens.add({
                    targets: ring,
                    radius: 60,
                    alpha: 0,
                    duration: 600,
                    ease: 'Power2.Out',
                    onComplete: () => ring.destroy(),
                });
            }, i * 100);
        }
    }

    /**
     * Start the cooldown timer after triple jump
     */
    startTripleJumpCooldown() {
        this.tripleJumpCooldown = true;

        // Clear any existing timer
        if (this.cooldownTimer) {
            this.cooldownTimer.remove();
        }

        // Visual indicator - pulsing effect during cooldown
        if (this.scene.playerController && this.scene.playerController.sprite) {
            const sprite = this.scene.playerController.sprite;

            // Add pulsing tint effect
            this.scene.tweens.add({
                targets: sprite,
                tint: { from: 0xffffff, to: 0xff9999 },
                duration: 500,
                yoyo: true,
                repeat: 3,
                ease: 'Sine.InOut',
            });
        }

        // Start cooldown timer
        this.cooldownTimer = this.scene.time.delayedCall(this.cooldownDuration, () => {
            this.tripleJumpCooldown = false;
            this.cooldownTimer = null;

            // Reset sprite to normal size
            if (this.scene.playerController && this.scene.playerController.sprite) {
                this.scene.tweens.add({
                    targets: this.scene.playerController.sprite,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 500,
                    ease: 'Power2',
                });
            }
        });
    }

    /**
     * Trigger dramatic explosion when attempting fourth jump
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Rectangle} sprite - The player's sprite
     */
    triggerExplosion(body, sprite) {
        if (this.explosionTriggered) return;

        this.explosionTriggered = true;

        // Get explosion position
        const pos = body.translation();

        // Create dramatic explosion effect
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_EXPLODE, {
                position: { x: pos.x, y: pos.y },
                sprite,
            });
        }

        // Massive screen shake
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(1000, 0.05);
        }

        // Create explosion particles
        for (let i = 0; i < 50; i++) {
            const particle = this.scene.add.circle(
                pos.x + Phaser.Math.Between(-20, 20),
                pos.y + Phaser.Math.Between(-20, 20),
                Phaser.Math.Between(5, 15),
                Phaser.Math.Between(0xff0000, 0xffff00)
            );

            // Explode particles outward
            this.scene.tweens.add({
                targets: particle,
                x: pos.x + Phaser.Math.Between(-200, 200),
                y: pos.y + Phaser.Math.Between(-200, 200),
                alpha: 0,
                scale: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => particle.destroy(),
            });
        }

        // Hide sprite with dramatic effect
        this.scene.tweens.add({
            targets: sprite,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            angle: 720,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Trigger game over
                this.scene.time.delayedCall(500, () => {
                    this.scene.scene.start(SceneKeys.GAME_OVER, { dramatic: true });
                });
            },
        });

        // Stop physics body
        body.setLinvel({ x: 0, y: 0 }, true);
        body.setEnabled(false);
    }

    /**
     * Clean up resources when scene is shut down
     */
    shutdown() {
        // Clear any active timers
        if (this._jumpBufferTimer) {
            this._jumpBufferTimer.remove();
            this._jumpBufferTimer = null;
        }

        if (this._landingRecoveryTimer) {
            this._landingRecoveryTimer.remove();
            this._landingRecoveryTimer = null;
        }

        if (this._coyoteTimer) {
            this._coyoteTimer.remove();
            this._coyoteTimer = null;
        }

        if (this.cooldownTimer) {
            this.cooldownTimer.remove();
            this.cooldownTimer = null;
        }
    }
}
