/**
 * Player - The player character for the birthday minigame
 * CRITICAL: Extends Phaser.Physics.Arcade.Sprite for proper collision detection
 */
import { BdayConfig } from '../game/BdayConfig.js';
import { BdayEvents } from '../game/BdayGameManager.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Use wynSprite texture or fallback
        const texture = scene.textures.exists('wynSprite') ? 'wynSprite' : null;
        
        // If no texture, we'll create a placeholder
        if (!texture) {
            console.warn('[Player] wynSprite texture not found, using placeholder');
            // Create a temporary texture
            scene.textures.addBase64('playerPlaceholder', Player.createPlaceholderTexture());
            super(scene, x, y, 'playerPlaceholder');
        } else {
            super(scene, x, y, texture);
        }
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Store scene reference
        this.scene = scene;
        
        // Player state
        this.currentLane = BdayConfig.Player.StartLane;
        this.isChangingLanes = false;
        this.canDash = true;
        
        // Setup physics body
        this.setScale(BdayConfig.Effects.PlayerScale);
        this.setCollideWorldBounds(true);
        
        // Set proper hitbox size (smaller than visual for fairness)
        this.setSize(32, 48);
        this.setOffset(4, 2);
        
        // Visual elements that follow the player
        this.createVisualElements();
        
        // Running animation
        this.createRunningAnimation();
        
        // Input handling
        this.setupInput();
    }
    
    createVisualElements() {
        // Shadow underneath player
        this.shadow = this.scene.add.ellipse(
            this.x, 
            this.y + 25, 
            30, 
            10, 
            0x000000, 
            0.3
        );
        this.shadow.setDepth(this.depth - 1);
        
        // Carry indicator (initially hidden)
        this.carryIndicator = this.scene.add.container(this.x, this.y - 40);
        this.carryIndicator.setVisible(false);
        this.carryIndicator.setDepth(this.depth + 1);
        
        // Create carry indicator elements
        const glowCircle = this.scene.add.circle(0, 0, 20, 0xFFD700, 0.5);
        this.carryIndicatorText = this.scene.add.text(0, 0, '', {
            fontSize: '24px',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);
        
        this.carryIndicator.add([glowCircle, this.carryIndicatorText]);
        
        // Pulse animation for carry indicator
        this.scene.tweens.add({
            targets: glowCircle,
            scale: { from: 1, to: 1.3 },
            alpha: { from: 0.5, to: 0.2 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    createRunningAnimation() {
        // Bob up and down while running
        this.runTween = this.scene.tweens.add({
            targets: this,
            scaleY: this.scaleY * 0.9,
            y: '-=5',
            duration: BdayConfig.Effects.PlayerBobDurationMs,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
    }
    
    setupInput() {
        // Store references to input for cleanup
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
    
    // Called automatically by Phaser each frame
    preUpdate(time, delta) {
        super.preUpdate(time, delta); // Important: call parent
        
        // Update visual elements to follow player
        if (this.shadow) {
            this.shadow.x = this.x;
            this.shadow.y = this.y + 25;
        }
        
        if (this.carryIndicator && this.carryIndicator.visible) {
            this.carryIndicator.x = this.x;
            this.carryIndicator.y = this.y - 40;
        }
        
        // Handle continuous input (horizontal movement)
        this.handleMovement();
    }
    
    handleMovement() {
        if (!this.scene.gameManager || this.scene.gameManager.gameOver) return;
        
        const moveSpeed = BdayConfig.Player.HorizontalSpeedPxPerFrame;
        
        // Horizontal movement
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.x = Math.max(BdayConfig.Player.MinXPx, this.x - moveSpeed);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.x = Math.min(BdayConfig.Player.MaxXPx, this.x + moveSpeed);
        }
        
        // Lane changes (just-pressed to avoid repeat)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
            Phaser.Input.Keyboard.JustDown(this.wasd.W)) {
            this.changeLane(-1);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || 
                   Phaser.Input.Keyboard.JustDown(this.wasd.S)) {
            this.changeLane(1);
        }
        
        // Dash
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.performDash();
        }
    }
    
    changeLane(direction) {
        if (this.isChangingLanes) return;
        
        const newLane = this.currentLane + direction;
        
        // Check bounds
        if (newLane >= 0 && newLane < BdayConfig.Lanes.Count) {
            this.isChangingLanes = true;
            this.currentLane = newLane;
            
            const newY = BdayConfig.Lanes.Positions[this.currentLane];
            
            // Smooth lane change
            this.scene.tweens.add({
                targets: this,
                y: newY,
                duration: BdayConfig.Player.LaneChangeSpeedMs,
                ease: BdayConfig.Effects.TweenEases.LaneChange,
                onComplete: () => {
                    this.isChangingLanes = false;
                }
            });
            
            // Tilt effect
            this.scene.tweens.add({
                targets: this,
                angle: direction * -15,
                duration: 100,
                yoyo: true,
                ease: 'Sine.InOut'
            });
            
            // Play sound effect
            if (this.scene.audioManager) {
                this.scene.audioManager.playSFX('click');
            }
        }
    }
    
    performDash() {
        if (!this.canDash || this.isChangingLanes) return;
        
        this.canDash = false;
        
        // Create dash trail effect
        this.createDashTrail();
        
        // Dash forward
        const targetX = Math.min(
            BdayConfig.Player.MaxXPx, 
            this.x + BdayConfig.Player.DashDistancePx
        );
        
        this.scene.tweens.add({
            targets: this,
            x: targetX,
            duration: 300,
            ease: BdayConfig.Effects.TweenEases.Dash
        });
        
        // Cooldown timer
        this.scene.time.delayedCall(BdayConfig.Player.DashCooldownMs, () => {
            this.canDash = true;
            
            // Visual indicator that dash is ready
            this.scene.tweens.add({
                targets: this,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Power1'
            });
        });
    }
    
    createDashTrail() {
        // Visual dash effect - ghost images
        for (let i = 0; i < 5; i++) {
            const ghost = this.scene.add.rectangle(
                this.x - i * 20,
                this.y,
                this.width * this.scaleX,
                this.height * this.scaleY,
                0xFFD700,
                0.5 - i * 0.1
            );
            
            this.scene.tweens.add({
                targets: ghost,
                alpha: 0,
                scaleX: 2,
                duration: 500,
                delay: i * 50,
                onComplete: () => ghost.destroy()
            });
        }
        
        // Particle trail
        for (let i = 0; i < 5; i++) {
            const particle = this.scene.add.circle(
                this.x - i * 20,
                this.y,
                3,
                0xFFFFFF
            );
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                x: particle.x - 50,
                duration: 500,
                delay: i * 50,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    pickupParcel(type = 'protein', points = 100) {
        // Update visual indicator
        this.carryIndicator.setVisible(true);
        
        // Set indicator based on type
        if (type === 'shakeshake') {
            this.carryIndicatorText.setText('S²');
            this.carryIndicatorText.setColor('#FFD700');
            this.carryIndicatorText.setFontSize('18px');
        } else {
            this.carryIndicatorText.setText('🥤');
            this.carryIndicatorText.setFontSize('24px');
        }
        
        // Flash effect
        this.scene.cameras.main.flash(100, 255, 255, 0, true);
    }
    
    dropParcel() {
        // Hide carry indicator
        this.carryIndicator.setVisible(false);
        
        // Visual feedback
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.alpha = 1;
            }
        });
    }
    
    deliverParcel() {
        // Hide carry indicator
        this.carryIndicator.setVisible(false);
        
        // Success animation
        this.scene.tweens.add({
            targets: this,
            scale: this.scale * 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Back.Out'
        });
    }
    
    hit() {
        // Hit animation
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.alpha = 1;
            }
        });
        
        // Screen shake
        this.scene.cameras.main.shake(
            BdayConfig.Effects.ScreenShakeDurationMs, 
            BdayConfig.Effects.ScreenShakeIntensity
        );
        
        // Drop any carried parcel
        this.dropParcel();
    }
    
    respawn() {
        // Reset position
        this.currentLane = BdayConfig.Player.StartLane;
        this.x = BdayConfig.Player.StartXPx;
        this.y = BdayConfig.Lanes.Positions[this.currentLane];
        
        // Invulnerability period
        this.alpha = 0.5;
        this.scene.time.delayedCall(BdayConfig.Effects.InvulnerabilityMs, () => {
            this.alpha = 1;
        });
    }
    
    destroy() {
        // Clean up visual elements
        if (this.shadow) this.shadow.destroy();
        if (this.carryIndicator) this.carryIndicator.destroy();
        if (this.runTween) this.runTween.stop();
        
        // Call parent destroy
        super.destroy();
    }
    
    // Static helper to create placeholder texture
    static createPlaceholderTexture() {
        // Base64 encoded 1x1 yellow pixel as fallback
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }
}
