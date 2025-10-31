import { Scene } from 'phaser';

import { LOG } from '../observability/core/LogSystem.js';

export class TestScene extends Scene {
    constructor() {
        super({ key: 'TestScene' });
    }

    create() {
        LOG.dev('TESTSCENE_CREATED', {
            subsystem: 'testing',
            scene: 'TestScene',
            message: 'Test scene started successfully - verifying Phaser initialization',
        });

        // Add simple text to show something is working
        this.add
            .text(400, 300, 'TEST SCENE WORKING!', {
                fontSize: '32px',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        // Add colored background to verify rendering
        this.add.rectangle(400, 300, 800, 600, 0x00ff00, 0.3);

        // Test click to advance
        this.input.on('pointerdown', () => {
            LOG.dev('TESTSCENE_CLICK_DETECTED', {
                subsystem: 'testing',
                scene: 'TestScene',
                message: 'Click detected - game is responsive and input system working',
            });
            this.add
                .text(400, 400, 'CLICK DETECTED!', {
                    fontSize: '24px',
                    color: '#ffff00',
                })
                .setOrigin(0.5);
        });
    }
}
