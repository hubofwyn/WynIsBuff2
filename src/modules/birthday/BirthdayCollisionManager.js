import { BirthdayConfig, BirthdayEvents } from './BirthdayConfig';

/**
 * BirthdayCollisionManager - Handles all collision detection and response
 */
export class BirthdayCollisionManager {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.config = BirthdayConfig;
        
        // Collision state
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
    }
    
    /**
     * Check all collisions
     * @param {Phaser.GameObjects.Sprite} player - Player sprite
     * @param {Object} objects - Active objects from spawn manager
     * @param {boolean} isCarrying - Whether player is carrying a parcel
     */
    checkCollisions(player, objects, isCarrying) {
        const { obstacles, parcels, powerUps } = objects;
        
        // Check obstacle collisions
        obstacles.forEach(obstacle => {
            if (this.checkOverlap(player, obstacle)) {
                this.handleObstacleCollision(player, obstacle);
            } else if (this.checkNearMiss(player, obstacle)) {
                this.handleNearMiss(obstacle);
            }
        });
        
        // Check parcel pickups (only if not carrying)
        if (!isCarrying) {
            parcels.forEach(parcel => {
                if (this.checkOverlap(player, parcel)) {
                    this.handleParcelPickup(parcel);
                }
            });
        }
        
        // Check power-up collections
        powerUps.forEach(powerUp => {
            if (this.checkOverlap(player, powerUp)) {
                this.handlePowerUpCollection(powerUp);
            }
        });
        
        // Check magnet effect if active
        if (this.gameManager.magnetActive) {
            this.applyMagnetEffect(player, parcels, powerUps);
        }
    }
    
    /**
     * Check delivery zone collision
     * @param {Phaser.GameObjects.Sprite} player - Player sprite
     * @param {Phaser.GameObjects.Rectangle} deliveryZone - Delivery zone
     * @param {boolean} isCarrying - Whether player is carrying
     */
    checkDeliveryZone(player, deliveryZone, isCarrying) {
        if (!isCarrying) return false;
        
        const distance = Math.abs(player.x - this.config.DeliveryZone.TriggerXPx);
        
        if (distance < this.config.Collision.DeliveryThresholdPx) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if two objects overlap
     */
    checkOverlap(obj1, obj2) {
        if (!obj1 || !obj2 || !obj1.active || !obj2.active) return false;
        
        const bounds1 = obj1.getBounds();
        const bounds2 = obj2.getBounds();
        
        return Phaser.Geom.Rectangle.Overlaps(bounds1, bounds2);
    }
    
    /**
     * Check for near miss
     */
    checkNearMiss(player, obstacle) {
        if (!player || !obstacle || !obstacle.active) return false;
        
        const distance = Phaser.Math.Distance.Between(
            player.x, player.y,
            obstacle.x, obstacle.y
        );
        
        // Near miss if close but not overlapping
        return distance < this.config.Collision.NearMissThresholdPx + 40 &&
               distance > this.config.Collision.PickupThresholdPx;
    }
    
    /**
     * Handle obstacle collision
     */
    handleObstacleCollision(player, obstacle) {
        if (this.invulnerable) return;
        
        const type = obstacle.getData('type');
        const hit = this.gameManager.hitObstacle();
        
        if (hit) {
            // Apply hit effects
            this.applyHitEffects(player);
            
            // Make player invulnerable briefly
            this.makeInvulnerable(this.config.Effects.InvulnerabilityMs);
            
            // Create impact particles
            this.createImpactParticles(player.x, player.y);
            
            // Screen shake
            this.scene.cameras.main.shake(
                this.config.Effects.ScreenShakeDurationMs,
                this.config.Effects.ScreenShakeIntensity
            );
            
            // Remove the obstacle
            this.scene.events.emit('removeObject', obstacle);
        }
    }
    
    /**
     * Handle near miss
     */
    handleNearMiss(obstacle) {
        this.gameManager.registerNearMiss();
        
        // Visual feedback for near miss
        this.createNearMissEffect(obstacle);
    }
    
    /**
     * Handle parcel pickup
     */
    handleParcelPickup(parcel) {
        this.gameManager.pickupParcel();
        
        // Create pickup effect
        this.createPickupEffect(parcel);
        
        // Remove parcel
        this.scene.events.emit('removeObject', parcel);
    }
    
    /**
     * Handle power-up collection
     */
    handlePowerUpCollection(powerUp) {
        const type = powerUp.getData('type');
        this.gameManager.collectPowerUp(type);
        
        // Create collection effect
        this.createPowerUpEffect(powerUp, type);
        
        // Remove power-up
        this.scene.events.emit('removeObject', powerUp);
    }
    
    /**
     * Apply magnet effect to attract nearby items
     */
    applyMagnetEffect(player, parcels, powerUps) {
        const magnetRange = this.config.PowerUps.Types.Magnet.RangePx;
        
        // Attract parcels
        parcels.forEach(parcel => {
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y,
                parcel.x, parcel.y
            );
            
            if (distance < magnetRange) {
                // Move parcel towards player
                const angle = Phaser.Math.Angle.Between(
                    parcel.x, parcel.y,
                    player.x, player.y
                );
                
                const speed = (magnetRange - distance) / magnetRange * 5;
                parcel.x += Math.cos(angle) * speed;
                parcel.y += Math.sin(angle) * speed;
            }
        });
        
        // Attract power-ups
        powerUps.forEach(powerUp => {
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y,
                powerUp.x, powerUp.y
            );
            
            if (distance < magnetRange) {
                const angle = Phaser.Math.Angle.Between(
                    powerUp.x, powerUp.y,
                    player.x, player.y
                );
                
                const speed = (magnetRange - distance) / magnetRange * 5;
                powerUp.x += Math.cos(angle) * speed;
                powerUp.y += Math.sin(angle) * speed;
            }
        });
    }
    
    /**
     * Make player invulnerable
     */
    makeInvulnerable(duration) {
        this.invulnerable = true;
        this.invulnerabilityTimer = duration;
    }
    
    /**
     * Update invulnerability timer
     */
    updateInvulnerability(delta) {
        if (this.invulnerable) {
            this.invulnerabilityTimer -= delta;
            
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
                this.invulnerabilityTimer = 0;
            }
        }
    }
    
    /**
     * Apply visual hit effects to player
     */
    applyHitEffects(player) {
        // Flash red
        player.setTint(0xff0000);
        
        this.scene.time.delayedCall(this.config.Effects.FlashDurationMs, () => {
            if (this.invulnerable) {
                // Flashing effect during invulnerability
                this.scene.tweens.add({
                    targets: player,
                    alpha: { from: 1, to: 0.5 },
                    duration: 100,
                    yoyo: true,
                    repeat: Math.floor(this.config.Effects.InvulnerabilityMs / 200),
                    onComplete: () => {
                        player.clearTint();
                        player.setAlpha(1);
                    }
                });
            } else {
                player.clearTint();
            }
        });
    }
    
    /**
     * Create impact particle effect
     */
    createImpactParticles(x, y) {
        for (let i = 0; i < this.config.Effects.ParticleCount; i++) {
            const particle = this.scene.add.circle(
                x, y, 4,
                Phaser.Display.Color.GetColor(255, 100, 100)
            );
            
            const angle = (Math.PI * 2 / this.config.Effects.ParticleCount) * i;
            const speed = Phaser.Math.Between(100, 200);
            
            this.scene.physics.add.existing(particle);
            particle.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                duration: this.config.Effects.ParticleLifeMs,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    /**
     * Create near miss visual effect
     */
    createNearMissEffect(obstacle) {
        const text = this.scene.add.text(
            obstacle.x, obstacle.y - 30,
            'CLOSE!',
            {
                fontFamily: 'Arial Black',
                fontSize: '16px',
                color: '#FFFF00'
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: text.y - 20,
            alpha: 0,
            duration: 500,
            onComplete: () => text.destroy()
        });
    }
    
    /**
     * Create pickup visual effect
     */
    createPickupEffect(parcel) {
        // Create expanding ring
        const ring = this.scene.add.circle(
            parcel.x, parcel.y, 10,
            0x00FF00, 0.5
        );
        
        this.scene.tweens.add({
            targets: ring,
            scale: 3,
            alpha: 0,
            duration: 300,
            onComplete: () => ring.destroy()
        });
        
        // Create sparkles
        for (let i = 0; i < 5; i++) {
            const sparkle = this.scene.add.star(
                parcel.x + Phaser.Math.Between(-20, 20),
                parcel.y + Phaser.Math.Between(-20, 20),
                5, 3, 6,
                0xFFFFFF
            );
            
            this.scene.tweens.add({
                targets: sparkle,
                y: sparkle.y - 30,
                alpha: 0,
                scale: 0,
                duration: 500,
                delay: i * 50,
                onComplete: () => sparkle.destroy()
            });
        }
    }
    
    /**
     * Create power-up collection effect
     */
    createPowerUpEffect(powerUp, type) {
        const config = this.config.PowerUps.Types[type];
        
        // Create colored burst
        const burst = this.scene.add.circle(
            powerUp.x, powerUp.y, 20,
            config.Color, 0.7
        );
        
        this.scene.tweens.add({
            targets: burst,
            scale: 4,
            alpha: 0,
            duration: 400,
            ease: 'Power2.Out',
            onComplete: () => burst.destroy()
        });
        
        // Show power-up name
        const text = this.scene.add.text(
            powerUp.x, powerUp.y,
            type.toUpperCase() + '!',
            {
                fontFamily: 'Arial Black',
                fontSize: '20px',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: text.y - 40,
            scale: 1.5,
            duration: 300,
            yoyo: true,
            onComplete: () => text.destroy()
        });
    }
    
    /**
     * Reset collision manager
     */
    reset() {
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
    }
    
    /**
     * Update collision manager
     */
    update(delta) {
        this.updateInvulnerability(delta);
    }
    
    /**
     * Check if currently invulnerable
     */
    isInvulnerable() {
        return this.invulnerable;
    }
}