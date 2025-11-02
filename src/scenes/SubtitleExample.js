import { BaseScene, AudioManager, UIManager, GameStateManager } from '@features/core';

import { EventNames } from '../constants/EventNames.js';

/**
 * Example scene demonstrating subtitle integration
 * This can be used as a reference for implementing subtitles in other scenes
 */
export class SubtitleExample extends BaseScene {
    constructor() {
        super('SubtitleExample'); // Not in SceneKeys, just an example
    }

    create() {
        // Initialize managers
        this.uiManager = UIManager.getInstance();
        this.uiManager.init(this, this.events);

        this.audioManager = AudioManager.getInstance();
        this.gameStateManager = GameStateManager.getInstance();

        // Enable subtitles based on user settings
        const subtitlesEnabled = this.gameStateManager.settings?.accessibility?.subtitles || false;
        this.uiManager.showSubtitles(subtitlesEnabled);

        // Title
        this.add
            .text(400, 100, 'Subtitle System Example', {
                fontSize: '32px',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        // Instructions
        this.add
            .text(400, 200, 'Click buttons to test subtitle system', {
                fontSize: '20px',
                color: '#cccccc',
            })
            .setOrigin(0.5);

        // Toggle subtitles button
        const toggleBtn = this.add
            .text(400, 300, `Subtitles: ${subtitlesEnabled ? 'ON' : 'OFF'}`, {
                fontSize: '24px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
            })
            .setOrigin(0.5)
            .setInteractive();

        toggleBtn.on('pointerdown', () => {
            const enabled = !this.uiManager.subtitlesEnabled;
            this.uiManager.showSubtitles(enabled);
            toggleBtn.setText(`Subtitles: ${enabled ? 'ON' : 'OFF'}`);

            // Save preference
            this.gameStateManager.saveSettings({
                ...this.gameStateManager.settings,
                accessibility: {
                    ...this.gameStateManager.settings.accessibility,
                    subtitles: enabled,
                },
            });
        });

        // Test buttons
        this.createTestButton(200, 400, 'Jump Sound', () => {
            this.audioManager.playSFX('jump');
            this.uiManager.displaySubtitle('*Jump*', 1000);
        });

        this.createTestButton(400, 400, 'Pickup Sound', () => {
            this.audioManager.playSFX('pickup');
            this.uiManager.displaySubtitle('*Collected protein shake*', 2000);
        });

        this.createTestButton(600, 400, 'Multiple Sounds', () => {
            // Play multiple sounds with queued subtitles
            this.audioManager.playSFX('click');
            this.uiManager.displaySubtitle('*Click*', 1000);

            this.time.delayedCall(500, () => {
                this.audioManager.playSFX('hover');
                this.uiManager.queueSubtitle('*Hover*', 1000);
            });

            this.time.delayedCall(1000, () => {
                this.audioManager.playSFX('land');
                this.uiManager.queueSubtitle('*Heavy landing*', 1500);
            });
        });

        this.createTestButton(400, 500, 'Story Dialogue', () => {
            this.uiManager.displaySubtitle('Wyn: "Time to get BUFF!"', 3000);
            this.uiManager.queueSubtitle('Axel: "Let\'s do this!"', 3000);
            this.uiManager.queueSubtitle('*Both characters flex*', 2000);
        });

        // Listen for game events that should trigger subtitles
        this.setupEventListeners();
    }

    createTestButton(x, y, text, callback) {
        const button = this.add
            .text(x, y, text, {
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 15, y: 8 },
            })
            .setOrigin(0.5)
            .setInteractive();

        button.on('pointerover', () => {
            button.setBackgroundColor('#555555');
        });

        button.on('pointerout', () => {
            button.setBackgroundColor('#333333');
        });

        button.on('pointerdown', callback);

        return button;
    }

    setupEventListeners() {
        // Example: Listen for player events and add subtitles
        this.events.on(EventNames.PLAYER_JUMP, () => {
            this.uiManager.displaySubtitle('*Jump*', 800);
        });

        this.events.on(EventNames.PLAYER_LAND, () => {
            this.uiManager.displaySubtitle('*Thud*', 1000);
        });

        this.events.on(EventNames.COLLECTIBLE_COLLECTED, () => {
            this.uiManager.displaySubtitle('*Ding! Item collected*', 1500);
        });

        this.events.on(EventNames.LEVEL_COMPLETE, () => {
            this.uiManager.displaySubtitle('LEVEL COMPLETE!', 3000);
            this.uiManager.queueSubtitle('*Victory music plays*', 3000);
        });
    }

    /**
     * Helper method to play sound with subtitle
     * This could be added to AudioManager as a feature
     */
    playSoundWithSubtitle(soundKey, subtitleText, duration = 2000) {
        this.audioManager.playSFX(soundKey);
        this.uiManager.displaySubtitle(subtitleText, duration);
    }
}
