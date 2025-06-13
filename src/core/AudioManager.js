import { Howl, Howler } from 'howler';
// Using the new path alias introduced in Step 2
import { BaseManager } from './BaseManager.js';

// Background music sources
const bgmList = {
    proteinPixelAnthem: 'assets/sounds/opener/protein-pixel-anthem.mp3',
    hyperBuffBlitz: 'assets/sounds/background/hyper-buff-blitz.mp3'
};

// Sound effect sources (multiple variants)
const sfxList = {
    land: [
        'assets/sounds/land-effects/land1.mp3',
        'assets/sounds/land-effects/land2.mp3',
        'assets/sounds/land-effects/land3.mp3',
        'assets/sounds/land-effects/land4.mp3'
    ],
    pickup: [
        'assets/sounds/pickup-effects/pickup1.mp3',
        'assets/sounds/pickup-effects/pickup2.mp3',
        'assets/sounds/pickup-effects/pickup3.mp3',
        'assets/sounds/pickup-effects/pickup4.mp3'
    ],
    click: [
        'assets/sounds/primary-click/click1.mp3',
        'assets/sounds/primary-click/click2.mp3',
        'assets/sounds/primary-click/click3.mp3',
        'assets/sounds/primary-click/click4.mp3'
    ],
    hover: [
        'assets/sounds/ui-hover/hover1.mp3',
        'assets/sounds/ui-hover/hover2.mp3',
        'assets/sounds/ui-hover/hover3.mp3',
        'assets/sounds/ui-hover/hover4.mp3'
    ]
};

/**
 * AudioManager: central Howler.js wrapper for BGM and SFX
 */
export class AudioManager extends BaseManager {
    /**
     * @private
     */
    constructor() {
        super();
        // The BaseManager constructor guarantees the singleton, so if the
        // current instance is already initialised we can early-return.
        if (this.isInitialized()) {
            // eslint-disable-next-line no-constructor-return
            return AudioManager.getInstance();
        }
        this.music = {};
        this.sfx = {};
        this.settings = {
            masterVolume: 0.8,
            musicVolume: 0.7,
            sfxVolume: 0.9
        };
        // Set master volume
        Howler.volume(this.settings.masterVolume);
        this._initSounds();
        console.log('[AudioManager] Initialized with settings', this.settings);
        // Mark as initialised for BaseManager consumers
        this._initialized = true;
    }

    /**
     * Get singleton instance
     * @returns {AudioManager}
     */
    // AudioManager inherits static getInstance from BaseManager – keep old
    // method for backward compatibility, delegating to the base implementation.
    /**
     * @deprecated – use BaseManager.getInstance inherited by AudioManager.
     */
    static getInstance() {
        // eslint-disable-next-line no-useless-call
        return super.getInstance.call(this);
    }

    /**
     * Internal: initialize Howl instances
     * @private
     */
    _initSounds() {
        // Setup background music
        Object.entries(bgmList).forEach(([key, src]) => {
            this.music[key] = new Howl({
                src: [src],
                html5: true,
                loop: true,
                volume: this.settings.musicVolume
            });
        });
        // Setup sound effects
        Object.entries(sfxList).forEach(([key, list]) => {
            this.sfx[key] = list.map((src) => new Howl({
                src: [src],
                volume: this.settings.sfxVolume,
                preload: true
            }));
        });
    }

    /**
     * Play background music by key
     * @param {string} key
     */
    playMusic(key) {
        const track = this.music[key];
        if (track && !track.playing()) {
            track.play();
        }
    }

    /**
     * Stop background music by key
     * @param {string} key
     */
    stopMusic(key) {
        const track = this.music[key];
        if (track) {
            track.stop();
        }
    }

    /**
     * Play a sound effect by key with optional stereo pan
     * @param {string} key
     * @param {number} [pan=0] stereo pan (-1 left to 1 right)
     */
    playSFX(key, pan = 0) {
        const arr = this.sfx[key];
        if (!arr || arr.length === 0) {
            console.warn(`[AudioManager] No SFX for key: ${key}`);
            return;
        }
        const howl = arr[Math.floor(Math.random() * arr.length)];
        const id = howl.play();
        if (typeof howl.stereo === 'function') {
            howl.stereo(pan, id);
        }
        return id;
    }

    /**
     * Adjust master volume (0.0 to 1.0)
     * @param {number} value
     */
    setMasterVolume(value) {
        this.settings.masterVolume = value;
        Howler.volume(value);
    }

    /**
     * Adjust music volume (0.0 to 1.0)
     * @param {number} value
     */
    setMusicVolume(value) {
        this.settings.musicVolume = value;
        Object.values(this.music).forEach((track) => track.volume(value));
    }

    /**
     * Adjust SFX volume (0.0 to 1.0)
     * @param {number} value
     */
    setSFXVolume(value) {
        this.settings.sfxVolume = value;
        Object.values(this.sfx).flat().forEach((s) => s.volume(value));
    }
}
