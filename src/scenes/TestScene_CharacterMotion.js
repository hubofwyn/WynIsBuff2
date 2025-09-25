import Phaser from 'phaser';
import RAPIER from '@dimforge/rapier2d-compat';
import { EventSystem } from '@features/core';
import { PhysicsDebugOverlay } from '@features/debug';
import { PhysicsManager } from '../core/PhysicsManager';
import { PlayerController } from '../modules/player/PlayerController';
import { pixelsToMeters } from '../constants/PhysicsConstants';
import { CollisionGroups } from '../constants/CollisionGroups.js';

/**
 * Minimal test scene to verify character movement
 * Spawns only player on flat ground and auto-holds right for 120 frames
 * Asserts player moves > 1.0 meters to the right
 */
export class TestScene_CharacterMotion extends Phaser.Scene {
    constructor() {
        super({ key: 'TestScene_CharacterMotion' });
    }
    
  async create() {
        console.log('[TEST] Starting character motion test scene');
        
        // Initialize Rapier and register in scene registry for subsystems
        await RAPIER.init();
        this.registry.set('RAPIER', RAPIER);
        
        // Create physics world
        const gravity = { x: 0, y: 9.81 };
        this.world = new RAPIER.World(gravity);
        
        // Create event system
        this.eventSystem = new EventSystem();
        
        // Create physics manager (simplified, no singleton)
        this.physicsManager = new PhysicsManager();
        await this.physicsManager.init(this, this.eventSystem);
        
        // Create flat ground
        const groundDesc = RAPIER.RigidBodyDesc.static()
            .setTranslation(pixelsToMeters(400), pixelsToMeters(500));
        const groundBody = this.world.createRigidBody(groundDesc);
        
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(
            pixelsToMeters(800),
            pixelsToMeters(20)
        );
        const groundCollider = this.world.createCollider(groundColliderDesc, groundBody);
        // Use CollisionGroups: STATIC colliding with common dynamic/player/enemy groups
        const collideWith = (CollisionGroups.DYNAMIC | CollisionGroups.PLAYER | CollisionGroups.ENEMY);
        groundCollider.setCollisionGroups(CollisionGroups.createMask(CollisionGroups.STATIC, collideWith));
        
        // Visual ground
        this.add.rectangle(400, 500, 1600, 40, 0x444444);
        
        // Create player at starting position
        const startX = 200;
        const startY = 400;
        this.playerController = new PlayerController(
            this,
            this.world,
            this.eventSystem,
            startX,
            startY
        );
        
        // Store starting position in meters
        this.startXMeters = pixelsToMeters(startX);
        
        // Test state
        this.testFrames = 0;
        this.maxTestFrames = 120;
        this.testPassed = false;
        this.autoRightInput = true;
        
        // Create UI text
        this.statusText = this.add.text(400, 100, 'TEST IN PROGRESS...', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Debug overlay (toggle with F1)
    this.debugOverlay = new PhysicsDebugOverlay(this);
    this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
    this.debugOverlay.enable();
    this.events.once('shutdown', () => {
      if (this.debugOverlay) this.debugOverlay.disable();
      if (this.debugKey) this.input.keyboard.removeKey(this.debugKey);
    });

        console.log('[TEST] Scene created. Starting position:', this.startXMeters, 'meters');
    }
    
    update(time, delta) {
        if (this.testPassed) return;
        
        // Fixed timestep
        const fixedDelta = 16.67; // 60 FPS
        
        // Auto-apply right input
        if (this.autoRightInput && this.playerController) {
            // Simulate holding right arrow
            if (this.playerController.cursors) {
                this.playerController.cursors.right.isDown = true;
            }
            if (this.playerController.wasd) {
                this.playerController.wasd.right.isDown = true;
            }
        }
        
        // Update physics
        if (this.physicsManager) {
            this.physicsManager.update(fixedDelta);
        }
        
        // Update player
        if (this.playerController) {
            this.playerController.update(fixedDelta);
        }
        
        // Increment test frames
        this.testFrames++;
        
        // Check test condition
        if (this.testFrames >= this.maxTestFrames) {
            this.runTestAssertion();
        }
        
        // Toggle debug overlay
        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            if (this.debugOverlay.enabled) this.debugOverlay.disable(); else this.debugOverlay.enable();
        }

        // Toggle debug overlay
        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            if (this.debugOverlay.enabled) this.debugOverlay.disable(); else this.debugOverlay.enable();
        }

        // Update status display
        if (this.playerController && this.playerController.body) {
            const currentPos = this.playerController.body.translation();
            const distanceMoved = currentPos.x - this.startXMeters;
            this.statusText.setText(
                `Frame: ${this.testFrames}/${this.maxTestFrames}\n` +
                `Distance moved: ${distanceMoved.toFixed(2)} meters\n` +
                `Velocity: ${this.playerController.body.linvel().x.toFixed(2)} m/s`
            );
            // Update overlay info
            const fps = this.game && this.game.loop ? Math.round(this.game.loop.actualFps || 0) : 0;
            const contacts = this.physicsManager?.getLastContactsPerSec ? this.physicsManager.getLastContactsPerSec() : 0;
            const bodies = this.world?.bodies ? this.world.bodies.len : undefined;
            this.debugOverlay.update({ grounded: !!this.playerController.onGround, fps, contacts, bodies });
        }
    }
    
    runTestAssertion() {
        this.testPassed = true;
        this.autoRightInput = false;
        
        if (!this.playerController || !this.playerController.body) {
            this.failTest('Player controller or body not initialized');
            return;
        }
        
        const finalPos = this.playerController.body.translation();
        const distanceMoved = finalPos.x - this.startXMeters;
        
        console.log('[TEST] Final results:', {
            startX: this.startXMeters,
            finalX: finalPos.x,
            distanceMoved: distanceMoved,
            frames: this.testFrames
        });
        
        // Assert player moved at least 1.0 meters to the right
        if (distanceMoved > 1.0) {
            this.passTest(distanceMoved);
        } else {
            this.failTest(`Player only moved ${distanceMoved.toFixed(2)} meters (expected > 1.0)`);
            
            // FAIL FAST with clear console error as required
            throw new Error(`[TEST FAILED] playerBody.translation().x (${finalPos.x.toFixed(2)}) <= startX + 1.0 (${(this.startXMeters + 1.0).toFixed(2)})`);
        }
    }
    
    passTest(distance) {
        console.log(`✅ [TEST] PASSED! Player moved ${distance.toFixed(2)} meters`);
        this.statusText.setText(`✅ TEST PASSED!\nPlayer moved ${distance.toFixed(2)} meters`);
        this.statusText.setColor('#00ff00');
    }
    
    failTest(reason) {
        console.error(`❌ [TEST] FAILED! ${reason}`);
        this.statusText.setText(`❌ TEST FAILED!\n${reason}`);
        this.statusText.setColor('#ff0000');
        
        // Log additional debug info
        if (this.playerController && this.playerController.body) {
            const bodyType = this.playerController.body.bodyType();
            const linvel = this.playerController.body.linvel();
            console.error('[TEST] Debug info:', {
                bodyType: bodyType,
                linvel: linvel,
                position: this.playerController.body.translation()
            });
        }
    }
}
