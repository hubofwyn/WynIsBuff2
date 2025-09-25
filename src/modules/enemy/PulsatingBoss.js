import RAPIER from '@dimforge/rapier2d-compat';
import { EventNames } from '../../constants/EventNames.js';
import { ImageAssets } from '../../constants/Assets.js';

/**
 * PulsatingBoss - A pulsating obstacle that the player must avoid
 * Goal of level 1 is to get past this boss without touching it
 */
export class PulsatingBoss {
    constructor(scene, world, x, y, eventSystem) {
        this.scene = scene;
        this.world = world;
        this.eventSystem = eventSystem;
        this.x = x;
        this.y = y;
        
        // Boss properties
        this.baseSize = 80;
        this.currentSize = this.baseSize;
        this.pulsateMin = 0.8;
        this.pulsateMax = 1.3;
        this.pulsateSpeed = 2000; // milliseconds for one pulse cycle
        
        // Create visual representation
        this.createSprite();
        
        // Create physics body
        this.createPhysicsBody();
        
        // Start pulsating
        this.startPulsating();
        
        // Track if player has passed
        this.playerPassed = false;
    }
    
    createSprite() {
        // Prefer generated boss sprite if available
        if (this.scene.textures.exists(ImageAssets.GEN_SPRITE_PULSAR_BOSS)) {
            this.sprite = this.scene.add.image(this.x, this.y, ImageAssets.GEN_SPRITE_PULSAR_BOSS)
                .setOrigin(0.5)
                .setDepth(50)
                .setScale(this.baseSize / 256); // approximate scale to size
        } else {
            // Create a menacing red circle with glow effect as fallback
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xff0000, 0.3);
            graphics.fillCircle(0, 0, this.baseSize * 1.5);
            graphics.fillStyle(0xff0000, 0.5);
            graphics.fillCircle(0, 0, this.baseSize * 1.2);
            graphics.fillStyle(0xff0000, 1);
            graphics.fillCircle(0, 0, this.baseSize);
            graphics.generateTexture('bossTexture', this.baseSize * 3, this.baseSize * 3);
            graphics.destroy();
            this.sprite = this.scene.add.sprite(this.x, this.y, 'bossTexture');
            this.sprite.setDepth(50);
        }
        
        // Add warning text
        this.warningText = this.scene.add.text(this.x, this.y - 100, 'DANGER!', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Pulsate warning text
        this.scene.tweens.add({
            targets: this.warningText,
            alpha: { from: 0.5, to: 1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    createPhysicsBody() {
        // Create a static body for the boss
        const bodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(this.x, this.y);
            
        this.body = this.world.createRigidBody(bodyDesc);
        
        // Create collider
        const colliderDesc = RAPIER.ColliderDesc
            .ball(this.baseSize)
            .setSensor(true); // Sensor to detect collisions without physics response
            
        this.collider = this.world.createCollider(colliderDesc, this.body);
        
        // Store boss reference on the body for collision detection
        this.body.userData = { type: 'boss', instance: this };
    }
    
    startPulsating() {
        // Main pulsating animation
        this.pulseTween = this.scene.tweens.add({
            targets: this,
            currentSize: {
                from: this.baseSize * this.pulsateMin,
                to: this.baseSize * this.pulsateMax
            },
            duration: this.pulsateSpeed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
            onUpdate: () => {
                // Update sprite scale
                const scale = this.currentSize / this.baseSize;
                this.sprite.setScale(scale);
                this.face.setScale(scale);
                
                // Update physics collider
                if (this.collider && this.world) {
                    this.world.removeCollider(this.collider);
                    
                    const colliderDesc = RAPIER.ColliderDesc
                        .ball(this.currentSize)
                        .setSensor(true);
                        
                    this.collider = this.world.createCollider(colliderDesc, this.body);
                }
            }
        });
        
        // Add subtle spin if using fallback graphic
        if (this.sprite?.type === 'Sprite') {
            this.scene.tweens.add({ targets: this.sprite, angle: 360, duration: 10000, repeat: -1 });
        }
        
        // Add particle effect
        this.createParticleEffect();
    }
    
    createParticleEffect() {
        // Create pulsing energy particles
        this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                const angle = Phaser.Math.Between(0, 360);
                const distance = this.currentSize;
                const x = this.x + Math.cos(angle * Math.PI / 180) * distance;
                const y = this.y + Math.sin(angle * Math.PI / 180) * distance;
                
                try {
                    this.scene.add.particles(
                        x, y,
                        ImageAssets.GEN_PARTICLE_FLARE_SMALL,
                        { lifespan: 600, speed: {min:30, max:120}, scale: {start:0.4, end:0}, quantity: 1, alpha: {start:0.8, end:0} }
                    );
                } catch {}
            },
            loop: true
        });
    }
    
    checkPlayerContact(playerBody) {
        if (!playerBody || !this.body) return false;
        
        const playerPos = playerBody.translation();
        const bossPos = this.body.translation();
        
        const distance = Math.sqrt(
            Math.pow(playerPos.x - bossPos.x, 2) + 
            Math.pow(playerPos.y - bossPos.y, 2)
        );
        
        // Check if player is touching the boss
        if (distance < this.currentSize + 32) { // 32 is half player size
            return true;
        }
        
        // Check if player has passed the boss
        if (!this.playerPassed && playerPos.x > bossPos.x + this.baseSize + 50) {
            this.playerPassed = true;
            this.onPlayerPassed();
        }
        
        return false;
    }
    
    onPlayerPassed() {
        // Congratulate player for passing
        const successText = this.scene.add.text(this.x, this.y + 100, 'NICE DODGE!', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScale(0);
        
        this.scene.tweens.add({
            targets: successText,
            scale: 1,
            duration: 500,
            ease: 'Back.Out'
        });
        
        // Boss becomes friendly
        this.face.setText('😊');
        this.warningText.setText('WELL DONE!');
        this.warningText.setColor('#00ff00');
        
        // Trigger scene transition after a moment
        this.scene.time.delayedCall(1500, () => {
            // Emit scene transition event
            if (this.eventSystem) {
                this.eventSystem.emit(EventNames.SCENE_TRANSITION, {
                    fromScene: 'level1',
                    toScene: 'level1_scene2',
                    transition: 'fade'
                });
            }
        });
        
        // Emit success event
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.BOSS_DEFEATED, {
                bossType: 'pulsating',
                position: { x: this.x, y: this.y }
            });
        }
    }
    
    onPlayerHit() {
        // Player touched the boss - trigger game over
        if (this.eventSystem) {
            this.eventSystem.emit(EventNames.PLAYER_EXPLODE, {
                position: this.body.translation(),
                reason: 'Touched the pulsating boss!'
            });
        }
        
        // Flash the boss
        this.scene.tweens.add({
            targets: this.sprite,
            tint: { from: 0xffffff, to: 0xff0000 },
            duration: 100,
            yoyo: true,
            repeat: 5
        });
    }
    
    update() {
        // Update face position to match sprite
        if (this.face && this.sprite) {
            this.face.setPosition(this.sprite.x, this.sprite.y);
        }
    }
    
    destroy() {
        // Clean up
        if (this.pulseTween) {
            this.pulseTween.stop();
        }
        
        if (this.sprite) {
            this.sprite.destroy();
        }
        
        if (this.face) {
            this.face.destroy();
        }
        
        if (this.warningText) {
            this.warningText.destroy();
        }
        
        if (this.body && this.world) {
            this.world.removeRigidBody(this.body);
        }
    }
}
