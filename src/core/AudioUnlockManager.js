import { LOG } from '../observability/core/LogSystem.js';

import { BaseManager } from './BaseManager.js';

/**
 * AudioUnlockManager - Handles browser audio autoplay restrictions
 * 
 * ARCHITECTURE:
 * - Extends BaseManager for singleton pattern
 * - Orchestrates user gesture requirement before audio playback
 * - Works with Howler's internal AudioContext
 * - Integrates with observability system
 * 
 * BROWSER AUTOPLAY POLICY:
 * - Web Audio API requires user gesture to start
 * - iOS Safari has additional restrictions
 * - This manager handles all edge cases
 * 
 * USAGE:
 * ```javascript
 * const unlockManager = AudioUnlockManager.getInstance();
 * await unlockManager.waitForUnlock(); // Before Phaser boots
 * ```
 */
export class AudioUnlockManager extends BaseManager {
    constructor() {
        super();
        this.unlocked = false;
        this.callbacks = [];
        this.unlockAttempts = 0;
        this._initDetection();
    }

    /**
     * Detect if audio is already unlocked
     * @private
     */
    _initDetection() {
        // Check if Howler's AudioContext is already running
        if (window.Howler?.ctx && window.Howler.ctx.state === 'running') {
            this.unlocked = true;
            LOG.info('AUDIO_ALREADY_UNLOCKED', {
                subsystem: 'audio',
                message: 'Audio context already running - no unlock needed',
                contextState: window.Howler.ctx.state,
                hint: 'User may have interacted with page before game loaded',
            });
        } else {
            LOG.info('AUDIO_UNLOCK_REQUIRED', {
                subsystem: 'audio',
                message: 'Audio unlock required - waiting for user gesture',
                contextState: window.Howler?.ctx?.state || 'not-initialized',
                hint: 'Will show unlock overlay to user',
            });
        }
    }

    /**
     * Wait for audio unlock before proceeding
     * Call this BEFORE Phaser boots
     * @returns {Promise<void>}
     */
    async waitForUnlock() {
        if (this.unlocked) {
            LOG.dev('AUDIO_UNLOCK_SKIP', {
                subsystem: 'audio',
                message: 'Audio already unlocked - skipping wait',
            });
            return Promise.resolve();
        }

        LOG.info('AUDIO_UNLOCK_WAITING', {
            subsystem: 'audio',
            message: 'Waiting for user gesture to unlock audio',
            callbacksQueued: this.callbacks.length,
        });

        return new Promise((resolve) => {
            this.callbacks.push(resolve);
        });
    }

    /**
     * Unlock audio with user gesture
     * Wire this to your "Tap to Play" button
     * @returns {Promise<boolean>} Success status
     */
    async unlock() {
        if (this.unlocked) {
            LOG.dev('AUDIO_UNLOCK_ALREADY', {
                subsystem: 'audio',
                message: 'Audio already unlocked - ignoring duplicate unlock call',
            });
            return true;
        }

        this.unlockAttempts++;
        const attemptId = this.unlockAttempts;

        LOG.info('AUDIO_UNLOCK_ATTEMPT', {
            subsystem: 'audio',
            message: 'Attempting to unlock audio with user gesture',
            attempt: attemptId,
            contextState: window.Howler?.ctx?.state,
            callbacksWaiting: this.callbacks.length,
        });

        try {
            // Step 1: Resume Howler's AudioContext (gesture-gated)
            if (window.Howler?.ctx?.state === 'suspended') {
                await window.Howler.ctx.resume();
                LOG.dev('AUDIO_CONTEXT_RESUMED', {
                    subsystem: 'audio',
                    message: 'AudioContext resumed successfully',
                    newState: window.Howler.ctx.state,
                });
            }

            // Step 2: Play silent dummy sound to fully unlock iOS
            // This is required for iOS Safari which has additional restrictions
            await this._playDummySound();

            // Step 3: Mark as unlocked and persist
            this.unlocked = true;
            const timestamp = Date.now();
            localStorage.setItem('audioUnlocked', timestamp.toString());

            LOG.info('AUDIO_UNLOCK_SUCCESS', {
                subsystem: 'audio',
                message: 'Audio unlocked successfully',
                attempt: attemptId,
                contextState: window.Howler?.ctx?.state,
                timestamp,
                callbacksResolved: this.callbacks.length,
            });

            // Step 4: Resolve all waiting promises
            this.callbacks.forEach((cb) => cb());
            this.callbacks = [];

            return true;
        } catch (err) {
            LOG.warn('AUDIO_UNLOCK_FAILED', {
                subsystem: 'audio',
                error: err,
                message: 'Audio unlock failed - game will proceed silently',
                attempt: attemptId,
                hint: 'User may have disabled autoplay in browser settings. Audio can be enabled via mute toggle.',
            });

            // Still resolve callbacks - let game proceed silently
            this.callbacks.forEach((cb) => cb());
            this.callbacks = [];

            return false;
        }
    }

    /**
     * Play silent dummy sound to unlock iOS audio
     * @private
     * @returns {Promise<void>}
     */
    _playDummySound() {
        return new Promise((resolve) => {
            try {
                // Base64-encoded silent WAV file (44 bytes)
                const silentWav =
                    'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

                // Use Howler to play the dummy sound
                const { Howl } = window.Howler.constructor;
                const dummy = new Howl({
                    src: [silentWav],
                    volume: 0,
                    onend: () => {
                        dummy.unload();
                        LOG.dev('AUDIO_DUMMY_PLAYED', {
                            subsystem: 'audio',
                            message: 'Silent dummy sound played for iOS unlock',
                        });
                        resolve();
                    },
                    onloaderror: (_id, err) => {
                        LOG.warn('AUDIO_DUMMY_FAILED', {
                            subsystem: 'audio',
                            error: err,
                            message: 'Dummy sound failed to load - may not be critical',
                        });
                        // Still resolve - this is not critical
                        resolve();
                    },
                });

                dummy.play();

                // Fallback timeout in case onend never fires
                setTimeout(() => {
                    dummy.unload();
                    resolve();
                }, 1000);
            } catch (err) {
                LOG.warn('AUDIO_DUMMY_ERROR', {
                    subsystem: 'audio',
                    error: err,
                    message: 'Error playing dummy sound',
                });
                // Not critical - resolve anyway
                resolve();
            }
        });
    }

    /**
     * Check if we should show the unlock prompt
     * @returns {boolean}
     */
    shouldShowPrompt() {
        // Always show if not unlocked
        if (!this.unlocked) {
            return true;
        }

        // Check localStorage for last unlock time
        const lastUnlock = localStorage.getItem('audioUnlocked');
        if (!lastUnlock) {
            return true;
        }

        // Show if last unlock was more than 7 days ago
        const daysSince = (Date.now() - parseInt(lastUnlock)) / (1000 * 60 * 60 * 24);
        const shouldShow = daysSince > 7;

        LOG.dev('AUDIO_PROMPT_CHECK', {
            subsystem: 'audio',
            message: 'Checking if unlock prompt should be shown',
            lastUnlock: new Date(parseInt(lastUnlock)).toISOString(),
            daysSince: Math.round(daysSince * 10) / 10,
            shouldShow,
        });

        return shouldShow;
    }

    /**
     * Get current unlock status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            unlocked: this.unlocked,
            contextState: window.Howler?.ctx?.state || 'not-initialized',
            unlockAttempts: this.unlockAttempts,
            callbacksWaiting: this.callbacks.length,
            lastUnlock: localStorage.getItem('audioUnlocked')
                ? new Date(parseInt(localStorage.getItem('audioUnlocked'))).toISOString()
                : null,
        };
    }

    /**
     * Force reset unlock state (for testing)
     */
    reset() {
        this.unlocked = false;
        this.callbacks = [];
        this.unlockAttempts = 0;
        localStorage.removeItem('audioUnlocked');

        LOG.warn('AUDIO_UNLOCK_RESET', {
            subsystem: 'audio',
            message: 'Audio unlock state reset - for testing only',
        });
    }
}
