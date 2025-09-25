import { BaseController } from '../../core/BaseController.js';
import { EventNames } from '../../constants/EventNames.js';
import { metersToPixels } from '../../constants/PhysicsConstants.js';
import { ImageAssets } from '../../constants/Assets.js';
import RAPIER from '@dimforge/rapier2d-compat';

/**
 * BossController: Controls the jumping boss enemy at the top of levels
 * The boss jumps up and down stochastically, acting as an obstacle to overcome
 */
export class BossController extends BaseController {
    constructor(scene, world, eventSystem, x, y, spriteKey = 'axelface') {
        super();
        
        // Validate required parameters
        if (x === undefined || y === undefined) {
            console.error('[BossController] Invalid position provided:', { x, y });
            throw new Error('BossController requires valid x and y positions');
        }
        
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
        
        // Boss physics parameters (using proper physics units)
        this.bossParams = {
            jumpForceMin: -8,         // Minimum jump velocity (m/s) - was -45
            jumpForceMax: -12,        // Maximum jump velocity (m/s) - was -75
            jumpIntervalMin: 800,     // Minimum time between jumps (ms)
            jumpIntervalMax: 2500,    // Maximum time between jumps (ms)
            horizontalDrift: 0.5,     // Small horizontal movement while jumping (m/s)
            landingRecoveryTime: 200, // Time before next jump after landing
            size: 80,                 // Boss sprite size (pixels)
            density: 3.0,             // Heavier than player
            friction: 0.8,            // Good ground contact
            restitution: 0.1          // Slight bounce on landing
        };
        
        // Jump timing
        this.nextJumpTime = 0;
        this.lastLandTime = 0;
        
        this.init();
    }
    
    init() {
        this.createSprite();
        this.createPhysicsBody();
        this.scheduleNextJump();
        
        console.log('[BossController] Boss initialized at', this.x, this.y);
    }
    
    createSprite() {
        // Create boss sprite - larger and more imposing
        const resolvedKey = this.resolveSpriteKey(this.spriteKey);
        if (resolvedKey && this.scene.textures.exists(resolvedKey)) {
            this.sprite = this.scene.add.image(this.x, this.y, resolvedKey)
                .setDisplaySize(this.bossParams.size, this.bossParams.size)
                .setOrigin(0.5, 1) // Bottom-center origin for ground contact
                .setDepth(10);     // Render above other elements
        } else {
            // Fallback to colored rectangle if sprite doesn't exist
            this.sprite = this.scene.add.rectangle(this.x, this.y, this.bossParams.size, this.bossParams.size, 0xFF4444)
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
            yoyo: true
        });
    }
    
    resolveSpriteKey(raw) {
        const s = String(raw || '').toLowerCase();
        if (s.includes('pulsar')) return ImageAssets.GEN_SPRITE_PULSAR_BOSS;
        if (s.includes('clumper')) return ImageAssets.GEN_SPRITE_CLUMPER_BOSS;
        if (s.includes('bulk')) return ImageAssets.GEN_SPRITE_BULK_BOSS;
        // fall back to provided key if present
        return raw;
    }
    
    createPhysicsBody() {
        // Debug logging for spawn position
        console.log('[BossController] Creating physics body with position:', JSON.stringify({
            x: this.x,
            y: this.y,
            xType: typeof this.x,
            yType: typeof this.y,
            hasWorld: !!this.world,
            worldType: typeof this.world
        }));
        
        // Validate position before creating body
        if (this.x === undefined || this.y === undefined) {
            console.error('[BossController] Cannot create physics body - position undefined!', {
                x: this.x,
                y: this.y,
                bossParams: this.bossParams
            });
            return;
        }
        
        // Validate world exists
        if (!this.world || !this.world.createRigidBody) {
            console.error('[BossController] Physics world not properly initialized!', this.world);
            return;
        }
        
        // Create kinematic physics body for the boss using proper Rapier API
        console.log('[BossController] Creating body at position:', this.x, this.y);
        
        try {
            // CRITICAL: Boss must be DYNAMIC to respond to forces/impulses
            const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(this.x / 100, (this.y - this.bossParams.size / 2) / 100) // Convert pixels to meters
                .setCanSleep(false);
            
            console.log('[BossController] Created RigidBodyDesc, attempting to create body...');
            
            this.body = this.world.createRigidBody(bodyDesc);
        } catch (error) {
            console.error('[BossController] Failed to create rigid body:', error, bodyDesc);
            throw error;
        }
        
        // Create collider shape using proper Rapier API (convert to meters)
        const colliderDesc = RAPIER.ColliderDesc.cuboid(
            this.bossParams.size / 2 / 100,  // Convert pixels to meters
            this.bossParams.size / 2 / 100   // Convert pixels to meters
        )
        .setDensity(this.bossParams.density)
        .setFriction(this.bossParams.friction)
        .setRestitution(this.bossParams.restitution);
        
        this.collider = this.world.createCollider(colliderDesc, this.body);
        
        // Set up collision groups (boss should collide with player and ground)
        this.collider.setCollisionGroups(0x00020002); // Enemy collision group
    }
    
    scheduleNextJump() {
        // Schedule next jump with random timing
        const minInterval = this.bossParams.jumpIntervalMin;
        const maxInterval = this.bossParams.jumpIntervalMax;
        const interval = minInterval + Math.random() * (maxInterval - minInterval);
        
        this.nextJumpTime = Date.now() + interval;
        
        console.log(`[BossController] Next jump scheduled in ${Math.round(interval)}ms`);
    }
    
    performJump() {
        if (this.isJumping || !this.isActive) return;
        
        this.isJumping = true;
        this.onGround = false;
        
        // Random jump force between min and max
        const jumpForce = this.bossParams.jumpForceMin + 
                         Math.random() * (this.bossParams.jumpForceMax - this.bossParams.jumpForceMin);
        
        // Optional small horizontal drift
        const horizontalDrift = (Math.random() - 0.5) * this.bossParams.horizontalDrift;
        
        // CRITICAL: Wake the body before applying forces
        this.body.wakeUp();
        
        // Apply jump impulse
        this.body.setLinvel({ x: horizontalDrift, y: jumpForce }, true);

        // Jump spark FX
        try {
            const pos = this.body.translation();
            this.scene.add.particles(
                metersToPixels(pos.x),
                metersToPixels(pos.y) + this.bossParams.size / 2,
                ImageAssets.GEN_PARTICLE_FLARE_SMALL,
                { lifespan: 300, speed: {min:60, max:140}, scale: {start:0.4, end:0}, quantity: 4, angle: {min:200, max:340}, alpha: {start:0.8, end:0} }
            );
        } catch {}

        // Visual jump effect - boss gets "buffer" during jump
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.3,
            scaleY: 0.9,
            duration: 150,
            ease: 'Power2.easeOut',
            yoyo: true
        });
        
        // Log actual body position on jump
        const jumpPos = this.body.translation();
        console.log('[BossController] JUMP - Body position:', {
            bodyX: jumpPos.x,
            bodyY: jumpPos.y,
            force: jumpForce
        });
        
        // Emit boss jump event for potential sound effects
        this.eventSystem.emit(EventNames.BOSS_JUMP, { 
            x: jumpPos.x, 
            y: jumpPos.y, 
            force: jumpForce 
        });
        
        console.log('[BossController] Boss jumped with force', jumpForce);
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
            yoyo: true
        });
        
        // Log actual body position on landing
        const landPos = this.body.translation();
        console.log('[BossController] LAND - Body position:', {
            bodyX: landPos.x,
            bodyY: landPos.y
        });
        
        // Emit landing event
        this.eventSystem.emit(EventNames.BOSS_LAND, { 
            x: landPos.x, 
            y: landPos.y 
        });
        
        console.log('[BossController] Boss landed');

        // Small landing FX using generated particle
        try {
            this.scene.add.particles(
                metersToPixels(landPos.x),
                metersToPixels(landPos.y) + this.bossParams.size / 2,
                ImageAssets.GEN_PARTICLE_FLARE_SMALL,
                {
                    lifespan: 400,
                    speed: { min: 30, max: 120 },
                    scale: { start: 0.5, end: 0 },
                    quantity: 6,
                    angle: { min: 200, max: 340 },
                    alpha: { start: 0.8, end: 0 }
                }
            );
        } catch {}
    }
    
    update(time, delta) {
        if (!this.isActive || !this.body) return;
        
        // Update sprite position to match physics body with proper scaling
        const position = this.body.translation();
        
        // Convert from physics meters to render pixels
        this.sprite.setPosition(
            metersToPixels(position.x), 
            metersToPixels(position.y)
        );
        
        // Also sync rotation
        const rotation = this.body.rotation();
        this.sprite.setRotation(rotation);
        
        // Check ground contact
        this.checkGroundContact();
        
        // Check if it's time to jump
        const now = Date.now();
        if (now >= this.nextJumpTime && this.onGround && 
            (now - this.lastLandTime) >= this.bossParams.landingRecoveryTime) {
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
            height: this.bossParams.size
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
        const horizontalOverlap = playerX >= bounds.x - 20 && playerX <= bounds.x + bounds.width + 20;
        const verticalOverlap = playerY >= bounds.y - 20 && playerY <= bounds.y + bounds.height + 20;
        
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
        
        console.log('[BossController] Boss destroyed');
    }
}
