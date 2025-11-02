import { BaseController } from '../../core/BaseController.js';
import { DeterministicRNG } from '../../core/DeterministicRNG.js';
import { EventNames } from '../../constants/EventNames.js';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * BossController: Controls the jumping boss enemy at the top of levels
 * The boss jumps up and down stochastically, acting as an obstacle to overcome
 */
export class BossController extends BaseController {
    constructor(scene, world, eventSystem, x, y, spriteKey = 'axelface') {
        super();

        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;
        this.x = x;
        this.y = y;
        this.spriteKey = spriteKey;

        // Boss state
        this.isActive = true;
        this.isJumping = false;
        this.onGround = false;
        this.groundY = y; // Original ground position for the boss

        // Boss physics parameters
        this.bossParams = {
            jumpForceMin: -45, // Minimum jump force
            jumpForceMax: -75, // Maximum jump force
            jumpIntervalMin: 800, // Minimum time between jumps (ms)
            jumpIntervalMax: 2500, // Maximum time between jumps (ms)
            horizontalDrift: 15, // Small horizontal movement while jumping
            landingRecoveryTime: 200, // Time before next jump after landing
            size: 80, // Boss sprite size
            density: 3.0, // Heavier than player
            friction: 0.8, // Good ground contact
            restitution: 0.1, // Slight bounce on landing
        };

        // Jump timing
        this.nextJumpTime = 0;
        this.lastLandTime = 0;

        this.init();
    }

    init() {
        // Initialize deterministic RNG for boss behavior
        this.rng = DeterministicRNG.getInstance();

        this.createSprite();
        this.createPhysicsBody();
        this.scheduleNextJump();

        LOG.dev('BOSSCONTROLLER_INITIALIZED', {
            subsystem: 'enemy',
            message: 'Boss controller initialized',
            position: { x: this.x, y: this.y },
            spriteKey: this.spriteKey,
            size: this.bossParams.size,
        });
    }

    createSprite() {
        // Create boss sprite - larger and more imposing
        if (this.scene.textures.exists(this.spriteKey)) {
            this.sprite = this.scene.add
                .image(this.x, this.y, this.spriteKey)
                .setDisplaySize(this.bossParams.size, this.bossParams.size)
                .setOrigin(0.5, 1) // Bottom-center origin for ground contact
                .setDepth(10); // Render above other elements
        } else {
            // Fallback to colored rectangle if sprite doesn't exist
            this.sprite = this.scene.add
                .rectangle(this.x, this.y, this.bossParams.size, this.bossParams.size, 0xff4444)
                .setOrigin(0.5, 1)
                .setDepth(10);
        }

        // Add intimidating scale pulsing effect
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1500,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true,
        });
    }

    createPhysicsBody() {
        // Create kinematic physics body for the boss
        const bodyDesc = {
            type: 'kinematicPosition', // Boss moves programmatically
            translation: { x: this.x, y: this.y - this.bossParams.size / 2 },
            rotation: 0,
            canSleep: false,
        };

        this.body = this.world.createRigidBody(bodyDesc);

        // Create collider shape
        const colliderDesc = {
            shape: 'cuboid',
            hx: this.bossParams.size / 2,
            hy: this.bossParams.size / 2,
            density: this.bossParams.density,
            friction: this.bossParams.friction,
            restitution: this.bossParams.restitution,
        };

        this.collider = this.world.createCollider(colliderDesc, this.body);

        // Set up collision groups (boss should collide with player and ground)
        this.collider.setCollisionGroups(0x00020002); // Enemy collision group
    }

    scheduleNextJump() {
        // Schedule next jump with random timing
        const minInterval = this.bossParams.jumpIntervalMin;
        const maxInterval = this.bossParams.jumpIntervalMax;
        const interval = minInterval + this.rng.next('main') * (maxInterval - minInterval);

        this.nextJumpTime = Date.now() + interval;

        LOG.dev('BOSSCONTROLLER_JUMP_SCHEDULED', {
            subsystem: 'enemy',
            message: 'Next boss jump scheduled',
            intervalMs: Math.round(interval),
            nextJumpTime: this.nextJumpTime,
        });
    }

    performJump() {
        if (this.isJumping || !this.isActive) return;

        this.isJumping = true;
        this.onGround = false;

        // Random jump force between min and max
        const jumpForce =
            this.bossParams.jumpForceMin +
            this.rng.next('main') * (this.bossParams.jumpForceMax - this.bossParams.jumpForceMin);

        // Optional small horizontal drift
        const horizontalDrift = (this.rng.next('main') - 0.5) * this.bossParams.horizontalDrift;

        // Apply jump impulse
        this.body.setLinvel({ x: horizontalDrift, y: jumpForce }, true);

        // Visual jump effect - boss gets "buffer" during jump
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.3,
            scaleY: 0.9,
            duration: 150,
            ease: 'Power2.easeOut',
            yoyo: true,
        });

        // Emit boss jump event for potential sound effects
        this.eventSystem.emit(EventNames.BOSS_JUMP, {
            x: this.x,
            y: this.y,
            force: jumpForce,
        });

        LOG.dev('BOSSCONTROLLER_JUMPED', {
            subsystem: 'enemy',
            message: 'Boss performed jump',
            jumpForce,
            horizontalDrift,
            position: { x: this.x, y: this.y },
        });
    }

    checkGroundContact() {
        // Simple ground detection - if boss is near its original ground level
        const currentY = this.body.translation().y + this.bossParams.size / 2;
        const groundThreshold = 5; // Tolerance for ground detection

        if (Math.abs(currentY - this.groundY) < groundThreshold && this.body.linvel().y >= -0.1) {
            if (this.isJumping) {
                // Boss just landed
                this.onLanding();
            }
            this.onGround = true;
            this.isJumping = false;
        } else {
            this.onGround = false;
        }
    }

    onLanding() {
        this.lastLandTime = Date.now();
        this.scheduleNextJump();

        // Landing visual effect - boss gets squashed briefly
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.4,
            scaleY: 0.7,
            duration: 100,
            ease: 'Power2.easeOut',
            yoyo: true,
        });

        // Emit landing event
        this.eventSystem.emit(EventNames.BOSS_LAND, {
            x: this.x,
            y: this.y,
        });

        LOG.dev('BOSSCONTROLLER_LANDED', {
            subsystem: 'enemy',
            message: 'Boss landed',
            position: { x: this.x, y: this.y },
            groundY: this.groundY,
        });
    }

    update(_time, _delta) {
        if (!this.isActive || !this.body) return;

        // Update sprite position to match physics body
        const position = this.body.translation();
        this.sprite.setPosition(position.x, position.y + this.bossParams.size / 2);

        // Check ground contact
        this.checkGroundContact();

        // Check if it's time to jump
        const now = Date.now();
        if (
            now >= this.nextJumpTime &&
            this.onGround &&
            now - this.lastLandTime >= this.bossParams.landingRecoveryTime
        ) {
            this.performJump();
        }

        // Keep boss from drifting too far horizontally
        const currentX = position.x;
        if (Math.abs(currentX - this.x) > 30) {
            // Gradually pull boss back to original X position
            const pullForce = (this.x - currentX) * 0.1;
            const currentVel = this.body.linvel();
            this.body.setLinvel({ x: currentVel.x + pullForce, y: currentVel.y }, true);
        }
    }

    /**
     * Get the boss's current bounding box for collision detection
     */
    getBounds() {
        if (!this.sprite) return null;

        return {
            x: this.sprite.x - this.bossParams.size / 2,
            y: this.sprite.y - this.bossParams.size,
            width: this.bossParams.size,
            height: this.bossParams.size,
        };
    }

    /**
     * Check if boss is blocking the player's path
     */
    isBlockingPlayer(playerX, playerY) {
        if (!this.isActive) return false;

        const bounds = this.getBounds();
        if (!bounds) return false;

        // Check if player is trying to pass through boss area
        const horizontalOverlap =
            playerX >= bounds.x - 20 && playerX <= bounds.x + bounds.width + 20;
        const verticalOverlap =
            playerY >= bounds.y - 20 && playerY <= bounds.y + bounds.height + 20;

        return horizontalOverlap && verticalOverlap;
    }

    /**
     * Activate or deactivate the boss
     */
    setActive(active) {
        this.isActive = active;
        if (this.sprite) {
            this.sprite.setVisible(active);
        }
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.body) {
            this.world.removeRigidBody(this.body);
        }

        LOG.dev('BOSSCONTROLLER_DESTROYED', {
            subsystem: 'enemy',
            message: 'Boss controller destroyed',
        });
    }
}
