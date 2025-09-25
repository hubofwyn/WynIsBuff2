import { BirthdayConfig, BirthdayEvents } from './BirthdayConfig';

/**
 * BirthdayPlayer - Physics-enabled player sprite for the birthday minigame
 * CRITICAL: Must extend Phaser.Physics.Arcade.Sprite for collisions to work!
 */
export class BirthdayPlayer extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'wyn-sprite');
        
        this.config = BirthdayConfig;
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Player state
        this.isCarrying = false;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.horizontalVelocity = 0;
        
        // Setup physics body
        this.setupPhysics();
        
        // Create carry indicator
        this.createCarryIndicator();
        
        // Create shield visual if active
        this.shieldVisual = null;
    }
    
    /**
     * Setup physics properties
     */
    setupPhysics() {
        this.setScale(this.config.Player.Scale);
        this.body.setSize(40, 60);
        this.body.setCollideWorldBounds(true);
        this.setDepth(10);
    }
    
    /**
     * Create carry indicator (shows when carrying parcel)
     */
    createCarryIndicator() {
        this.carryIndicator = this.scene.add.text(
            this.x, this.y - 40,
            '📦',
            { fontSize: '32px' }
        ).setOrigin(0.5).setVisible(false);
    }
    
    /**
     * Update player each frame
     * @param {number} delta - Delta time in ms
     */
    update(delta) {
        // Update cooldowns
        if (this.dashCooldown > 0) {
            this.dashCooldown -= delta;
        }
        
        // Update carry indicator position
        if (this.carryIndicator) {
            this.carryIndicator.setPosition(this.x, this.y - 40);
            
            // Bob animation when carrying
            if (this.isCarrying) {
                this.carryIndicator.y = this.y - 40 + Math.sin(this.scene.time.now / 200) * 3;
            }
        }
        
        // Update shield visual if active
        if (this.shieldVisual) {
            this.shieldVisual.setPosition(this.x, this.y);
        }
        
        // Apply horizontal movement
        if (this.horizontalVelocity !== 0) {
            this.x += this.horizontalVelocity;
            
            // Clamp to boundaries
            this.x = Phaser.Math.Clamp(
                this.x,
                this.config.Player.MinXPx,
                this.config.Player.MaxXPx
            );
        }
        
        // Running animation
        if (!this.isDashing) {
            this.setAngle(Math.sin(this.scene.time.now / 100) * 3);
        }
    }
    
    /**
     * Move player horizontally
     * @param {number} direction - Direction (-1 for left, 1 for right, 0 for stop)
     */
    moveHorizontal(direction) {
        this.horizontalVelocity = direction * this.config.Player.HorizontalSpeedPxPerFrame;
        
        // Flip sprite based on direction
        if (direction !== 0) {
            this.setFlipX(direction < 0);
        }
    }
    
    /**
     * Perform dash move
     * @param {number} direction - Dash direction (-1 or 1)
     * @returns {boolean} Whether dash was performed
     */
    dash(direction) {
        if (this.isDashing || this.dashCooldown > 0) {
            return false;
        }
        
        this.isDashing = true;
        this.dashCooldown = this.config.Player.DashCooldownMs;
        
        // Calculate dash target
        const dashDistance = this.config.Player.DashDistancePx * direction;
        const targetX = Phaser.Math.Clamp(
            this.x + dashDistance,
            this.config.Player.MinXPx,
            this.config.Player.MaxXPx
        );
        
        // Create dash trail effect
        this.createDashTrail(direction);
        
        // Perform dash tween
        this.scene.tweens.add({
            targets: this,
            x: targetX,
            duration: 300,
            ease: this.config.Effects.TweenEases.Dash,
            onComplete: () => {
                this.isDashing = false;
            }
        });
        
        // Emit dash event
        this.scene.events.emit(BirthdayEvents.DASH_ACTIVATED, { direction });
        
        return true;
    }
    
    /**
     * Create dash trail visual effect
     */
    createDashTrail(direction) {
        for (let i = 0; i < 5; i++) {
            const trail = this.scene.add.sprite(
                this.x - (direction * i * 20),
                this.y,
                this.texture.key
            );
            
            trail.setScale(this.config.Player.Scale);
            trail.setAlpha(0.5 - i * 0.1);
            trail.setTint(0x00FFFF);
            
            this.scene.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.1,
                duration: 300,
                onComplete: () => trail.destroy()
            });
        }
    }
    
    /**
     * Pick up a parcel
     */
    pickUpParcel() {
        this.isCarrying = true;
        this.carryIndicator.setVisible(true);
        
        // Pickup animation
        this.scene.tweens.add({
            targets: this,
            scale: this.config.Player.Scale * 1.2,
            duration: 100,
            yoyo: true,
            ease: this.config.Effects.TweenEases.Pickup
        });
        
        // Bob effect on indicator
        this.scene.tweens.add({
            targets: this.carryIndicator,
            scale: { from: 0, to: 1 },
            duration: 200,
            ease: 'Back.Out'
        });
    }
    
    /**
     * Deliver the parcel
     */
    deliverParcel() {
        this.isCarrying = false;
        this.carryIndicator.setVisible(false);
        
        // Delivery animation
        this.scene.tweens.add({
            targets: this,
            angle: 360,
            scale: { from: this.config.Player.Scale * 1.3, to: this.config.Player.Scale },
            duration: 300
        });
    }
    
    /**
     * Drop the parcel (from hit or timeout)
     */
    dropParcel() {
        this.isCarrying = false;
        this.carryIndicator.setVisible(false);
        
        // Drop animation
        const droppedParcel = this.scene.add.text(
            this.x, this.y - 20,
            '📦',
            { fontSize: '32px' }
        );
        
        this.scene.tweens.add({
            targets: droppedParcel,
            y: this.y + 50,
            alpha: 0,
            angle: 180,
            duration: 500,
            onComplete: () => droppedParcel.destroy()
        });
    }
    
    /**
     * Activate shield visual
     */
    activateShield() {
        if (!this.shieldVisual) {
            this.shieldVisual = this.scene.add.graphics();
            this.shieldVisual.lineStyle(3, 0x00FFFF, 0.5);
            this.shieldVisual.strokeCircle(0, 0, 40);
            this.shieldVisual.setDepth(9);
            
            // Rotation animation
            this.scene.tweens.add({
                targets: this.shieldVisual,
                angle: 360,
                duration: 2000,
                repeat: -1
            });
        }
        
        this.shieldVisual.setVisible(true);
    }
    
    /**
     * Deactivate shield visual
     */
    deactivateShield() {
        if (this.shieldVisual) {
            this.shieldVisual.setVisible(false);
        }
    }
    
    /**
     * Apply speed boost visual
     */
    applySpeedBoost() {
        this.setTint(0xFFFF00);
        
        // Speed lines effect
        this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.scene) return;
                
                const speedLine = this.scene.add.rectangle(
                    this.x + Phaser.Math.Between(-30, 30),
                    this.y,
                    100, 2,
                    0xFFFF00, 0.5
                );
                
                this.scene.tweens.add({
                    targets: speedLine,
                    x: speedLine.x - 200,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => speedLine.destroy()
                });
            },
            repeat: 30
        });
    }
    
    /**
     * Remove speed boost visual
     */
    removeSpeedBoost() {
        this.clearTint();
    }
    
    /**
     * Take damage animation
     */
    takeDamage() {
        // Flash red
        this.setTint(0xFF0000);
        
        // Shake
        this.scene.tweens.add({
            targets: this,
            x: this.x + Phaser.Math.Between(-10, 10),
            y: this.y + Phaser.Math.Between(-5, 5),
            duration: 50,
            repeat: 3,
            yoyo: true,
            onComplete: () => {
                this.clearTint();
            }
        });
        
        // Drop parcel if carrying
        if (this.isCarrying) {
            this.dropParcel();
        }
    }
    
    /**
     * Celebration animation
     */
    celebrate() {
        // Victory dance
        this.scene.tweens.add({
            targets: this,
            angle: { from: -15, to: 15 },
            y: this.y - 20,
            duration: 200,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                // Jump for joy
                this.scene.tweens.add({
                    targets: this,
                    y: this.y - 100,
                    duration: 500,
                    ease: 'Power2.Out',
                    yoyo: true
                });
            }
        });
    }
    
    /**
     * Reset player to initial state
     */
    reset() {
        this.setPosition(this.config.Player.StartXPx, this.config.Lanes.Positions[this.config.Player.StartLane]);
        this.isCarrying = false;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.horizontalVelocity = 0;
        this.clearTint();
        this.setAngle(0);
        this.carryIndicator.setVisible(false);
        
        if (this.shieldVisual) {
            this.shieldVisual.setVisible(false);
        }
    }
    
    /**
     * Destroy player and cleanup
     */
    destroy() {
        if (this.carryIndicator) {
            this.carryIndicator.destroy();
        }
        
        if (this.shieldVisual) {
            this.shieldVisual.destroy();
        }
        
        super.destroy();
    }
}