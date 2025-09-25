import Phaser, { Scene } from 'phaser';
import { PhysicsDebugOverlay } from '@features/debug';

export class TestScene extends Scene {
    constructor() {
        super({ key: 'TestScene' });
    }

    create() {
        console.log('[TestScene] Test scene started successfully!');
        
        // Add simple text to show something is working
        this.add.text(400, 300, 'TEST SCENE WORKING!', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Add colored background to verify rendering
        this.add.rectangle(400, 300, 800, 600, 0x00ff00, 0.3);
        
        // Test click to advance
        this.input.on('pointerdown', () => {
            console.log('[TestScene] Click detected, game is responsive');
            this.add.text(400, 400, 'CLICK DETECTED!', {
                fontSize: '24px',
                color: '#ffff00'
            }).setOrigin(0.5);
        });

        // Minimal overlay toggle (F1) to surface FPS in non-physics scene
        this.debugOverlay = new PhysicsDebugOverlay(this);
        this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
        this.debugOverlay.enable();
        this.events.once('shutdown', () => {
            if (this.debugOverlay) this.debugOverlay.disable();
            if (this.debugKey) this.input.keyboard.removeKey(this.debugKey);
        });
    }

    update() {
        if (this.debugKey && Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            if (this.debugOverlay.enabled) this.debugOverlay.disable(); else this.debugOverlay.enable();
        }
        const fps = this.game && this.game.loop ? Math.round(this.game.loop.actualFps || 0) : 0;
        if (this.debugOverlay) this.debugOverlay.update({ fps });
    }
}
