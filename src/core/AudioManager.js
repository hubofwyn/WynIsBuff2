import { Howl, Howler } from 'howler';
// Using the new path alias introduced in Step 2
import { BaseManager } from './BaseManager.js';
import { AudioAssets, AudioPaths } from '../constants/Assets.js';

// Background music sources
const bgmList = {
    [AudioAssets.PROTEIN_PIXEL_ANTHEM]: AudioPaths.PROTEIN_PIXEL_ANTHEM,
    [AudioAssets.HYPER_BUFF_BLITZ]: AudioPaths.HYPER_BUFF_BLITZ,
    [AudioAssets.BIRTHDAY_SONG]: AudioPaths.BIRTHDAY_SONG
};

// Sound effect sources (multiple variants)
const sfxList = {
    land: [
        AudioPaths.SFX_LAND1,
        AudioPaths.SFX_LAND2,
        AudioPaths.SFX_LAND3,
        AudioPaths.SFX_LAND4
    ],
    pickup: [
        AudioPaths.SFX_PICKUP1,
        AudioPaths.SFX_PICKUP2,
        AudioPaths.SFX_PICKUP3,
        AudioPaths.SFX_PICKUP4
    ],
    click: [
        AudioPaths.SFX_CLICK1,
        AudioPaths.SFX_CLICK2,
        AudioPaths.SFX_CLICK3,
        AudioPaths.SFX_CLICK4
    ],
    hover: [
        AudioPaths.SFX_HOVER1,
        AudioPaths.SFX_HOVER2,
        AudioPaths.SFX_HOVER3,
        AudioPaths.SFX_HOVER4
    ],
    fart: [
        AudioPaths.SFX_FART
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
            console.log(`[AudioManager] Loading music: ${key} from ${src}`);
            this.music[key] = new Howl({
                src: [src],
                html5: true,
                loop: true,
                volume: this.settings.musicVolume,
                onload: () => console.log(`[AudioManager] Successfully loaded: ${key}`),
                onloaderror: (id, err) => console.error(`[AudioManager] Failed to load ${key}:`, err)
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
        console.log(`[AudioManager] playMusic called for: ${key}`, track);
        if (track) {
            if (!track.playing()) {
                console.log(`[AudioManager] Starting playback of: ${key}`);
                track.play();
            } else {
                console.log(`[AudioManager] ${key} is already playing`);
            }
        } else {
            console.error(`[AudioManager] Track not found: ${key}`);
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
