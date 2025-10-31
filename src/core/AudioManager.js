import { Howl, Howler } from 'howler';

// Using the new path alias introduced in Step 2
import { AudioAssets, AudioPaths } from '../constants/Assets.js';
import { LOG } from '../observability/core/LogSystem.js';

import { BaseManager } from './BaseManager.js';

/**
 * Extract audio format from file path for Howler.js format property
 * @param {string} path - Audio file path
 * @returns {string[]} Array of format strings (e.g., ['mp3'], ['ogg'], ['wav'])
 */
function getAudioFormat(path) {
    const extension = path.split('.').pop().toLowerCase();
    const formatMap = {
        mp3: ['mp3'],
        ogg: ['ogg'],
        oga: ['ogg'],
        wav: ['wav'],
        m4a: ['m4a'],
        webm: ['webm'],
    };
    return formatMap[extension] || [extension];
}

// Background music sources
const bgmList = {
    [AudioAssets.PROTEIN_PIXEL_ANTHEM]: AudioPaths.PROTEIN_PIXEL_ANTHEM,
    [AudioAssets.HYPER_BUFF_BLITZ]: AudioPaths.HYPER_BUFF_BLITZ,
    [AudioAssets.BIRTHDAY_SONG]: AudioPaths.BIRTHDAY_SONG,
};

// Sound effect sources (multiple variants)
const sfxList = {
    land: [AudioPaths.SFX_LAND1, AudioPaths.SFX_LAND2, AudioPaths.SFX_LAND3, AudioPaths.SFX_LAND4],
    pickup: [
        AudioPaths.SFX_PICKUP1,
        AudioPaths.SFX_PICKUP2,
        AudioPaths.SFX_PICKUP3,
        AudioPaths.SFX_PICKUP4,
    ],
    click: [
        AudioPaths.SFX_CLICK1,
        AudioPaths.SFX_CLICK2,
        AudioPaths.SFX_CLICK3,
        AudioPaths.SFX_CLICK4,
    ],
    hover: [
        AudioPaths.SFX_HOVER1,
        AudioPaths.SFX_HOVER2,
        AudioPaths.SFX_HOVER3,
        AudioPaths.SFX_HOVER4,
    ],
    fart: [AudioPaths.SFX_FART],
    // Jump sounds - Bug #4 Fix
    jump: [
        AudioPaths.SFX_JUMP1_01,
        AudioPaths.SFX_JUMP1_02,
        AudioPaths.SFX_JUMP1_03,
        AudioPaths.SFX_JUMP1_04,
    ],
    jump2: [
        AudioPaths.SFX_JUMP2_01,
        AudioPaths.SFX_JUMP2_02,
        AudioPaths.SFX_JUMP2_03,
        AudioPaths.SFX_JUMP2_04,
    ],
    jump3: [
        AudioPaths.SFX_JUMP3_01,
        AudioPaths.SFX_JUMP3_02,
        AudioPaths.SFX_JUMP3_03,
        AudioPaths.SFX_JUMP3_04,
    ],
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
            return AudioManager.getInstance();
        }
        this.music = {};
        this.sfx = {};
        this.settings = {
            masterVolume: 0.8,
            musicVolume: 0.7,
            sfxVolume: 0.9,
        };
        // Set master volume
        Howler.volume(this.settings.masterVolume);
        this._initSounds();
        LOG.dev('AUDIO_INIT_COMPLETE', {
            subsystem: 'audio',
            message: 'AudioManager initialized',
            settings: this.settings,
        });
        // Mark as initialised for BaseManager consumers
        this.setInitialized();
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
        return super.getInstance.call(this);
    }

    /**
     * Internal: initialize Howl instances
     * @private
     */
    _initSounds() {
        // Setup background music
        Object.entries(bgmList).forEach(([key, src]) => {
            LOG.dev('AUDIO_LOADING_MUSIC', {
                subsystem: 'audio',
                message: 'Loading music track',
                track: key,
                src,
            });
            this.music[key] = new Howl({
                src: [`assets/${src}`],
                format: getAudioFormat(src),
                html5: true,
                loop: true,
                volume: this.settings.musicVolume,
                preload: true,
                onload: () =>
                    LOG.dev('AUDIO_MUSIC_LOADED', {
                        subsystem: 'audio',
                        message: 'Music track loaded successfully',
                        track: key,
                    }),
                onloaderror: (id, err) => {
                    LOG.error('AUDIO_MUSIC_LOAD_ERROR', {
                        subsystem: 'audio',
                        error: err,
                        message: 'Failed to load music track',
                        track: key,
                        src,
                        hint: 'Check if audio file exists at assets/' + src,
                    });
                    // Try fallback if available
                    if (src.endsWith('.mp3')) {
                        const fallbackSrc = src.replace('.mp3', '.ogg');
                        LOG.dev('AUDIO_TRYING_FALLBACK', {
                            subsystem: 'audio',
                            message: 'Trying fallback audio format',
                            track: key,
                            fallbackSrc,
                        });
                    }
                },
                onplayerror: (id, err) => {
                    LOG.error('AUDIO_PLAYBACK_ERROR', {
                        subsystem: 'audio',
                        error: err,
                        message: 'Playback error for music track',
                        track: key,
                        hint: 'May require user interaction to unlock audio. Check browser autoplay policy.',
                    });
                    // Unlock audio on next user interaction
                    window.Howler.ctx && window.Howler.ctx.resume();
                },
            });
        });
        // Setup sound effects
        Object.entries(sfxList).forEach(([key, list]) => {
            this.sfx[key] = list.map(
                (src) =>
                    new Howl({
                        src: [`assets/${src}`],
                        format: getAudioFormat(src),
                        volume: this.settings.sfxVolume,
                        preload: true,
                        onload: () =>
                            LOG.dev('AUDIO_SFX_LOADED', {
                                subsystem: 'audio',
                                message: 'SFX loaded successfully',
                                sfxKey: key,
                                src,
                                format: getAudioFormat(src),
                            }),
                        onloaderror: (id, err) =>
                            LOG.warn('AUDIO_SFX_LOAD_ERROR', {
                                subsystem: 'audio',
                                error: err,
                                message: 'Failed to load SFX',
                                sfxKey: key,
                                src,
                                format: getAudioFormat(src),
                                hint: 'Check if SFX file exists at assets/' + src,
                            }),
                    })
            );
        });

        // Log comprehensive audio system initialization summary
        const musicCount = Object.keys(this.music).length;
        const sfxCategoryCount = Object.keys(this.sfx).length;
        const totalSfxCount = Object.values(this.sfx).reduce((sum, arr) => sum + arr.length, 0);

        const formatBreakdown = {};
        Object.values(sfxList).flat().forEach((src) => {
            const format = getAudioFormat(src)[0];
            formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
        });

        Object.values(bgmList).forEach((src) => {
            const format = getAudioFormat(src)[0];
            formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
        });

        LOG.info('AUDIO_SYSTEM_INITIALIZED', {
            subsystem: 'audio',
            message: 'Audio system fully initialized with format detection',
            stats: {
                musicTracks: musicCount,
                sfxCategories: sfxCategoryCount,
                totalSfxVariants: totalSfxCount,
                totalAssets: musicCount + totalSfxCount,
                formatBreakdown,
            },
            categories: Object.keys(this.sfx),
            hint: 'All audio files loaded with explicit format property for browser compatibility',
        });
    }

    /**
     * Play background music by key
     * @param {string} key
     */
    playMusic(key) {
        const track = this.music[key];
        LOG.dev('AUDIO_PLAY_MUSIC_CALLED', {
            subsystem: 'audio',
            message: 'playMusic called',
            track: key,
            trackExists: !!track,
        });
        if (track) {
            // Handle browser autoplay policy
            if (window.Howler && window.Howler.ctx && window.Howler.ctx.state === 'suspended') {
                LOG.dev('AUDIO_RESUMING_CONTEXT', {
                    subsystem: 'audio',
                    message: 'Resuming suspended audio context',
                    track: key,
                });
                window.Howler.ctx
                    .resume()
                    .then(() => {
                        this._playTrack(track, key);
                    })
                    .catch((err) => {
                        LOG.warn('AUDIO_RESUME_FAILED', {
                            subsystem: 'audio',
                            error: err,
                            message: 'Could not resume audio context',
                            track: key,
                            hint: 'User interaction may be required to unlock audio',
                        });
                    });
            } else {
                this._playTrack(track, key);
            }
        } else {
            LOG.error('AUDIO_TRACK_NOT_FOUND', {
                subsystem: 'audio',
                message: 'Music track not found',
                track: key,
                availableTracks: Object.keys(this.music),
                hint:
                    'Check if track key exists in bgmList. Available tracks: ' +
                    Object.keys(this.music).join(', '),
            });
        }
    }

    /**
     * Internal method to actually play a track
     * @private
     */
    _playTrack(track, key) {
        if (!track.playing()) {
            LOG.dev('AUDIO_STARTING_PLAYBACK', {
                subsystem: 'audio',
                message: 'Starting music playback',
                track: key,
            });
            const id = track.play();
            if (id === undefined) {
                LOG.warn('AUDIO_PLAY_FAILED', {
                    subsystem: 'audio',
                    message: 'Failed to play music track',
                    track: key,
                    hint: 'User interaction may be required. Check browser autoplay policy.',
                });
            }
        } else {
            LOG.dev('AUDIO_ALREADY_PLAYING', {
                subsystem: 'audio',
                message: 'Music track is already playing',
                track: key,
            });
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
            LOG.warn('AUDIO_SFX_NOT_FOUND', {
                subsystem: 'audio',
                message: 'No SFX found for key',
                sfxKey: key,
                availableKeys: Object.keys(this.sfx),
                hint:
                    'Check if SFX key exists in sfxList. Available keys: ' +
                    Object.keys(this.sfx).join(', '),
            });
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
        Object.values(this.sfx)
            .flat()
            .forEach((s) => s.volume(value));
    }
}
