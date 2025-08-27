import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../../constants/EventNames';

/**
 * EnhancedJumpController - Advanced jump system with proper buffering,
 * coyote time, variable height, and triple jump mechanics.
 * 
 * Features:
 * - 8-12ms input buffering that feels responsive
 * - Forgiving but not exploitable coyote time
 * - Proper velocity curves for variable jump height
 * - Triple jump with escalating parameters
 * - Frame-perfect combo system integration
 */
export class EnhancedJumpController {
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        
        // Jump state machine
        this.jumpState = {
            phase: 'grounded',  // grounded, rising, apex, falling
            jumpCount: 0,
            maxJumps: 3,
            lastGroundTime: 0,
            lastJumpTime: 0,
            holdTime: 0,
            comboWindow: false
        };
        
        // Input buffering (responsive but not exploitable)
        this.inputBuffer = {
            jump: false,
            bufferTime: 10,  // 10ms buffer (0.6 frames at 60fps)
            lastPress: 0,
            consumed: false
        };
        
        // Coyote time (forgiving but fair)
        this.coyoteTime = {
            duration: 100,  // 100ms (6 frames at 60fps)
            active: false,
            graceUsed: false
        };
        
        // Jump physics with proper curves
        this.jumpCurves = {
            // Base jump (first jump)
            base: {
                initialVelocity: -680,
                holdBonus: -120,        // Extra velocity while holding
                holdDuration: 200,      // Max hold time in ms
                releaseMultiplier: 0.6, // Velocity reduction on release
                gravity: 2400,          // Gravity during this jump
                apex: {
                    threshold: 50,      // Velocity threshold for apex
                    gravityMultiplier: 0.5  // Reduced gravity at apex
                }
            },
            
            // Double jump (second jump)
            double: {
                initialVelocity: -740,
                holdBonus: -140,
                holdDuration: 250,
                releaseMultiplier: 0.65,
                gravity: 2200,
                horizontalBoost: 1.15,  // 15% horizontal speed boost
                apex: {
                    threshold: 60,
                    gravityMultiplier: 0.45
                }
            },
            
            // Triple jump (third jump)
            triple: {
                initialVelocity: -860,
                holdBonus: -180,
                holdDuration: 300,
                releaseMultiplier: 0.7,
                gravity: 2000,
                horizontalBoost: 1.3,   // 30% horizontal speed boost
                rotationSpeed: 720,     // Spin during triple jump
                apex: {
                    threshold: 80,
                    gravityMultiplier: 0.4
                }
            }
        };
        
        // Combo system integration
        this.comboSystem = {
            enabled: true,
            multiplier: 1.0,
            perfectTiming: 50,     // Ms window for perfect jump
            goodTiming: 150,       // Ms window for good jump
            bonusVelocity: {
                perfect: 1.2,      // 20% bonus for perfect timing
                good: 1.1          // 10% bonus for good timing
            }
        };
        
        // Visual feedback parameters
        this.visualFeedback = {
            squashStretch: {
                1: { squash: { x: 1.15, y: 0.85 }, stretch: { x: 0.9, y: 1.2 } },
                2: { squash: { x: 1.2, y: 0.8 }, stretch: { x: 0.85, y: 1.25 } },
                3: { squash: { x: 1.25, y: 0.75 }, stretch: { x: 0.8, y: 1.3 } }
            },
            particleCount: { 1: 5, 2: 10, 3: 20 },
            screenShake: { 1: 0, 2: 2, 3: 5 }
        };
        
        // Performance optimization
        this.optimization = {
            velocityPrediction: true,  // Predict landing for smoother transitions
            earlyGroundDetection: 2,   // Pixels before actual ground contact
            interpolation: true        // Smooth visual interpolation
        };
        
        console.log('[EnhancedJumpController] Initialized with advanced jump physics');
    }
    
    /**
     * Update jump system with proper timing
     * @param {RAPIER.RigidBody} body - Physics body
     * @param {object} sprite - Visual sprite
     * @param {object} input - Input state
     * @param {boolean} isGrounded - Ground contact
     * @param {number} deltaTime - Frame time in seconds
     */
    update(body, sprite, input, isGrounded, deltaTime) {
        if (!body) return;
        
        const now = performance.now();
        const velocity = body.linvel();
        
        // Update ground state with early detection
        this.updateGroundState(isGrounded, now, velocity.y);
        
        // Process jump input with buffering
        this.processJumpInput(input.jump, now);
        
        // Update jump state machine
        this.updateJumpPhase(velocity.y, now);
        
        // Handle jump execution
        if (this.shouldJump(now)) {
            this.executeJump(body, sprite, velocity, now);
        }
        
        // Apply variable jump height
        if (this.jumpState.phase === 'rising') {
            this.applyVariableHeight(body, input.jump, now, deltaTime);
        }
        
        // Apply custom gravity based on jump phase
        this.applyCustomGravity(body, deltaTime);
        
        // Update visual feedback
        this.updateVisualFeedback(sprite, velocity);
    }
    
    /**
     * Update ground state with coyote time
     */
    updateGroundState(isGrounded, now, velocityY) {
        const wasGrounded = this.jumpState.phase === 'grounded';
        
        // Early ground detection for smoother landing
        const effectivelyGrounded = isGrounded || 
            (velocityY > 0 && this.predictGroundContact(velocityY));
        
        if (effectivelyGrounded) {
            if (!wasGrounded) {
                // Just landed
                this.handleLanding(now);
            }
            this.jumpState.phase = 'grounded';
            this.jumpState.jumpCount = 0;
            this.jumpState.lastGroundTime = now;
            this.coyoteTime.active = false;
            this.coyoteTime.graceUsed = false;
        } else if (wasGrounded) {
            // Just left ground - activate coyote time
            this.coyoteTime.active = true;
            this.jumpState.phase = 'falling';
        }
        
        // Check coyote time expiration
        if (this.coyoteTime.active && 
            now - this.jumpState.lastGroundTime > this.coyoteTime.duration) {
            this.coyoteTime.active = false;
            if (!this.coyoteTime.graceUsed && this.jumpState.jumpCount === 0) {
                this.jumpState.jumpCount = 1;  // Lose first jump after coyote time
            }
        }
    }
    
    /**
     * Process jump input with buffering
     */
    processJumpInput(jumpPressed, now) {
        if (jumpPressed && !this.inputBuffer.jump) {
            // New jump press
            this.inputBuffer.jump = true;
            this.inputBuffer.lastPress = now;
            this.inputBuffer.consumed = false;
        } else if (!jumpPressed) {
            this.inputBuffer.jump = false;
        }
        
        // Clear buffer if expired
        if (now - this.inputBuffer.lastPress > this.inputBuffer.bufferTime) {
            this.inputBuffer.consumed = true;
        }
    }
    
    /**
     * Determine if jump should execute
     */
    shouldJump(now) {
        // Check if we have a buffered jump input
        if (this.inputBuffer.consumed || !this.inputBuffer.jump) {
            return false;
        }
        
        // Check if within buffer window
        if (now - this.inputBuffer.lastPress > this.inputBuffer.bufferTime) {
            return false;
        }
        
        // Can jump if grounded, in coyote time, or have jumps remaining
        const canJump = this.jumpState.phase === 'grounded' ||
                       this.coyoteTime.active ||
                       this.jumpState.jumpCount < this.jumpState.maxJumps;
        
        return canJump;
    }
    
    /**
     * Execute jump with proper physics
     */
    executeJump(body, sprite, currentVelocity, now) {
        // Consume the buffered input
        this.inputBuffer.consumed = true;
        
        // Determine jump number and parameters
        let jumpNum = this.jumpState.jumpCount + 1;
        if (this.coyoteTime.active && !this.coyoteTime.graceUsed) {
            jumpNum = 1;  // Coyote jump counts as first jump
            this.coyoteTime.graceUsed = true;
        }
        
        // Get jump curve for this jump
        const curve = this.getJumpCurve(jumpNum);
        
        // Calculate timing bonus
        const timingBonus = this.calculateTimingBonus(now);
        
        // Calculate initial velocity
        let jumpVelocity = curve.initialVelocity * timingBonus;
        
        // Apply horizontal boost for double/triple jumps
        let horizontalVelocity = currentVelocity.x;
        if (curve.horizontalBoost) {
            horizontalVelocity *= curve.horizontalBoost;
        }
        
        // Set velocity
        body.setLinvel({ 
            x: horizontalVelocity, 
            y: jumpVelocity 
        }, true);
        
        // Update state
        this.jumpState.phase = 'rising';
        this.jumpState.jumpCount = jumpNum;
        this.jumpState.lastJumpTime = now;
        this.jumpState.holdTime = 0;
        
        // Apply visual feedback
        this.applyJumpVisuals(sprite, jumpNum);
        
        // Emit jump event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_JUMP, {
                jumpNumber: jumpNum,
                velocity: { x: horizontalVelocity, y: jumpVelocity },
                timingBonus: timingBonus,
                position: body.translation()
            });
        }
    }
    
    /**
     * Apply variable jump height based on button hold
     */
    applyVariableHeight(body, jumpHeld, now, deltaTime) {
        const timeSinceJump = now - this.jumpState.lastJumpTime;
        const curve = this.getJumpCurve(this.jumpState.jumpCount);
        
        if (jumpHeld && timeSinceJump < curve.holdDuration) {
            // Apply hold bonus
            const holdForce = curve.holdBonus * deltaTime;
            const currentVel = body.linvel();
            body.setLinvel({ 
                x: currentVel.x, 
                y: currentVel.y + holdForce 
            }, true);
            
            this.jumpState.holdTime = timeSinceJump;
        } else if (!jumpHeld && this.jumpState.holdTime < curve.holdDuration) {
            // Early release - reduce velocity
            const currentVel = body.linvel();
            if (currentVel.y < 0) {
                body.setLinvel({ 
                    x: currentVel.x, 
                    y: currentVel.y * curve.releaseMultiplier 
                }, true);
            }
            this.jumpState.holdTime = curve.holdDuration;  // Prevent re-application
        }
    }
    
    /**
     * Apply custom gravity based on jump phase
     */
    applyCustomGravity(body, deltaTime) {
        const velocity = body.linvel();
        const curve = this.getJumpCurve(this.jumpState.jumpCount || 1);
        
        let gravityMultiplier = 1.0;
        
        // Reduce gravity at jump apex for floaty feel
        if (this.jumpState.phase === 'apex' || 
            (this.jumpState.phase === 'rising' && Math.abs(velocity.y) < curve.apex.threshold)) {
            gravityMultiplier = curve.apex.gravityMultiplier;
        }
        
        // Apply gravity
        const gravityForce = curve.gravity * gravityMultiplier * deltaTime;
        body.applyImpulse({ x: 0, y: gravityForce * body.mass() }, true);
    }
    
    /**
     * Update jump phase based on velocity
     */
    updateJumpPhase(velocityY, now) {
        const previousPhase = this.jumpState.phase;
        
        if (this.jumpState.phase === 'rising' && velocityY >= -50) {
            this.jumpState.phase = 'apex';
        } else if (this.jumpState.phase === 'apex' && velocityY > 50) {
            this.jumpState.phase = 'falling';
        }
        
        // Emit phase change events
        if (previousPhase !== this.jumpState.phase && this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_JUMP_PHASE, {
                phase: this.jumpState.phase,
                jumpNumber: this.jumpState.jumpCount
            });
        }
    }
    
    /**
     * Get jump curve parameters for specific jump number
     */
    getJumpCurve(jumpNumber) {
        switch (jumpNumber) {
            case 1: return this.jumpCurves.base;
            case 2: return this.jumpCurves.double;
            case 3: return this.jumpCurves.triple;
            default: return this.jumpCurves.base;
        }
    }
    
    /**
     * Calculate timing bonus for combo system
     */
    calculateTimingBonus(now) {
        if (!this.comboSystem.enabled || this.jumpState.jumpCount === 0) {
            return 1.0;
        }
        
        const timeSinceLastJump = now - this.jumpState.lastJumpTime;
        
        if (timeSinceLastJump < this.comboSystem.perfectTiming) {
            return this.comboSystem.bonusVelocity.perfect;
        } else if (timeSinceLastJump < this.comboSystem.goodTiming) {
            return this.comboSystem.bonusVelocity.good;
        }
        
        return 1.0;
    }
    
    /**
     * Predict ground contact for early detection
     */
    predictGroundContact(velocityY) {
        if (!this.optimization.velocityPrediction) return false;
        
        // Simple prediction: will we hit ground in next frame?
        const nextFrameDistance = velocityY * (1/60);
        return nextFrameDistance < this.optimization.earlyGroundDetection;
    }
    
    /**
     * Apply visual feedback for jumps
     */
    applyJumpVisuals(sprite, jumpNumber) {
        if (!sprite) return;
        
        const visuals = this.visualFeedback.squashStretch[jumpNumber];
        if (!visuals) return;
        
        // Apply squash on takeoff
        sprite.setScale(visuals.squash.x, visuals.squash.y);
        
        // Animate to stretch
        this.scene.tweens.add({
            targets: sprite,
            scaleX: visuals.stretch.x,
            scaleY: visuals.stretch.y,
            duration: 150,
            ease: 'Power2',
            yoyo: true,
            onComplete: () => {
                sprite.setScale(1, 1);
            }
        });
        
        // Screen shake for triple jump
        const shakeIntensity = this.visualFeedback.screenShake[jumpNumber];
        if (shakeIntensity > 0 && this.scene.cameras.main) {
            this.scene.cameras.main.shake(200, shakeIntensity * 0.01);
        }
        
        // Rotation for triple jump
        if (jumpNumber === 3) {
            this.scene.tweens.add({
                targets: sprite,
                angle: 360,
                duration: 500,
                ease: 'Linear'
            });
        }
    }
    
    /**
     * Update continuous visual feedback
     */
    updateVisualFeedback(sprite, velocity) {
        if (!sprite || !this.optimization.interpolation) return;
        
        // Subtle rotation based on horizontal velocity
        const targetRotation = velocity.x * 0.0001;
        sprite.rotation = Phaser.Math.Linear(sprite.rotation, targetRotation, 0.1);
    }
    
    /**
     * Handle landing with proper feedback
     */
    handleLanding(now) {
        // Reset combo window
        this.jumpState.comboWindow = true;
        
        // Schedule combo window close
        this.scene.time.delayedCall(this.comboSystem.goodTiming, () => {
            this.jumpState.comboWindow = false;
        });
        
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_LAND, {
                jumpCount: this.jumpState.jumpCount,
                landTime: now
            });
        }
    }
}