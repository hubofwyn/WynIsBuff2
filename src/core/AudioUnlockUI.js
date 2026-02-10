import { LOG } from '../observability/core/LogSystem.js';

import { AudioUnlockManager } from './AudioUnlockManager.js';

/**
 * AudioUnlockUI - Creates and manages the "Tap to Play" overlay
 *
 * ARCHITECTURE:
 * - Pure function approach (no class needed)
 * - Creates DOM overlay before Phaser boots
 * - Integrates with AudioUnlockManager
 * - Self-removes after unlock
 *
 * DESIGN:
 * - Matches WynIsBuff2 branding
 * - Gradient background
 * - Animated button
 * - Accessible and mobile-friendly
 */

/**
 * Create the audio unlock overlay
 * @returns {HTMLElement} The overlay element
 */
export function createAudioUnlockOverlay() {
    LOG.info('AUDIO_UNLOCK_UI_CREATE', {
        subsystem: 'audio',
        message: 'Creating audio unlock overlay',
    });

    const overlay = document.createElement('div');
    overlay.id = 'audio-unlock-overlay';
    overlay.innerHTML = `
        <style>
            #audio-unlock-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                color: white;
                animation: fadeIn 0.3s ease-out;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            .audio-unlock__content {
                text-align: center;
                max-width: 400px;
                padding: 2rem;
                animation: slideUp 0.5s ease-out;
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .audio-unlock__title {
                font-size: 2.5rem;
                font-weight: 800;
                margin-bottom: 0.5rem;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                letter-spacing: -0.02em;
            }

            .audio-unlock__subtitle {
                font-size: 1.1rem;
                margin-bottom: 2rem;
                opacity: 0.95;
                font-weight: 500;
            }

            .audio-unlock__btn {
                background: white;
                color: #667eea;
                border: none;
                padding: 1rem 3rem;
                border-radius: 50px;
                font-size: 1.1rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .audio-unlock__btn:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 30px rgba(0, 0, 0, 0.3);
            }

            .audio-unlock__btn:active {
                transform: scale(0.98);
            }

            .audio-unlock__btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }

            .audio-unlock__hint {
                margin-top: 1.5rem;
                font-size: 0.9rem;
                opacity: 0.8;
            }

            /* Mobile optimizations */
            @media (max-width: 480px) {
                .audio-unlock__title {
                    font-size: 2rem;
                }
                .audio-unlock__content {
                    padding: 1.5rem;
                }
                .audio-unlock__btn {
                    padding: 0.875rem 2.5rem;
                    font-size: 1rem;
                }
            }
        </style>
        <div class="audio-unlock__content">
            <div class="audio-unlock__title">🎮 WynIsBuff2</div>
            <div class="audio-unlock__subtitle">Maximum gaming power awaits!</div>
            <button class="audio-unlock__btn" id="audio-unlock-btn">
                Tap to Play
            </button>
            <div class="audio-unlock__hint">
                🔊 Enable sound for the full experience
            </div>
        </div>
    `;

    const btn = overlay.querySelector('#audio-unlock-btn');
    const unlockManager = AudioUnlockManager.getInstance();

    btn.addEventListener('click', async () => {
        LOG.info('AUDIO_UNLOCK_UI_CLICKED', {
            subsystem: 'audio',
            message: 'User clicked unlock button',
        });

        // Update button state
        btn.textContent = 'Loading...';
        btn.disabled = true;

        // Attempt unlock
        const success = await unlockManager.unlock();

        if (success) {
            LOG.info('AUDIO_UNLOCK_UI_SUCCESS', {
                subsystem: 'audio',
                message: 'Audio unlocked - removing overlay',
            });

            // Fade out and remove
            overlay.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                overlay.remove();
                LOG.dev('AUDIO_UNLOCK_UI_REMOVED', {
                    subsystem: 'audio',
                    message: 'Unlock overlay removed from DOM',
                });
            }, 300);
        } else {
            LOG.warn('AUDIO_UNLOCK_UI_FAILED', {
                subsystem: 'audio',
                message: 'Audio unlock failed - updating UI',
            });

            // Update button to show failure
            btn.textContent = 'Continue Anyway';
            btn.disabled = false;

            // Add warning message
            const warning = document.createElement('div');
            warning.className = 'audio-unlock__hint';
            warning.style.color = '#ffeb3b';
            warning.textContent = '⚠️ Audio may not work - check browser settings';
            overlay.querySelector('.audio-unlock__content').appendChild(warning);
        }
    });

    document.body.appendChild(overlay);

    LOG.dev('AUDIO_UNLOCK_UI_ADDED', {
        subsystem: 'audio',
        message: 'Unlock overlay added to DOM',
    });

    return overlay;
}

/**
 * Remove the audio unlock overlay (if it exists)
 */
export function removeAudioUnlockOverlay() {
    const overlay = document.getElementById('audio-unlock-overlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            overlay.remove();
            LOG.dev('AUDIO_UNLOCK_UI_FORCE_REMOVED', {
                subsystem: 'audio',
                message: 'Unlock overlay force removed',
            });
        }, 300);
    }
}
