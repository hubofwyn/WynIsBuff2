import { Scene } from 'phaser';

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
    }
}