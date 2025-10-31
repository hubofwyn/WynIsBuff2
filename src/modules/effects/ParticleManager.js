import { EventNames } from '../../constants/EventNames';
import { LOG } from '../../observability/core/LogSystem.js';

/**
 * ParticleManager class handles the creation and management of particle effects
 * for various game events like jumping, landing, and movement.
 */
export class ParticleManager {
    /**
     * Create a new ParticleManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.scene = scene;
        this.eventSystem = eventSystem;
        this.emitters = new Map();

        // Initialize particle configurations
        this.initializeParticleConfigs();

        // Set up event listeners
        this.setupEventListeners();

        LOG.dev('PARTICLEMANAGER_INITIALIZED', {
            subsystem: 'effects',
            message: 'ParticleManager initialized with BUFF edition particle effects',
        });
    }

    /**
     * Initialize particle configurations for different effect types
     */
    initializeParticleConfigs() {
        // Jump particles configuration - BUFF EDITION
        this.jumpParticleConfigs = {
            // First jump (dust cloud)
            1: {
                frame: ['white'], // Default particle texture
                lifespan: 700,
                speed: { min: 60, max: 120 },
                scale: { start: 0.15, end: 0 },
                quantity: 15,
                gravityY: 350,
                alpha: { start: 0.7, end: 0 },
                tint: 0xdddddd, // Light gray dust
                emitCallback: this.emitJumpParticles.bind(this),
                angle: { min: -30, max: 210 }, // Spread particles in jump arc
                blendMode: 'ADD',
            },
            // Second jump (energy burst)
            2: {
                frame: ['white'],
                lifespan: 900,
                speed: { min: 100, max: 180 },
                scale: { start: 0.2, end: 0 },
                quantity: 25,
                gravityY: 50, // Floaty energy particles
                alpha: { start: 0.9, end: 0 },
                tint: 0xffff00, // Yellow energy
                emitCallback: this.emitJumpParticles.bind(this),
                angle: { min: -45, max: 225 }, // Wider spread
                blendMode: 'ADD',
                rotate: { start: 0, end: 360 }, // Spinning particles
            },
            // Third jump (MEGA BUFF EXPLOSION)
            3: {
                frame: ['white'],
                lifespan: 1200,
                speed: { min: 150, max: 300 },
                scale: { start: 0.3, end: 0 },
                quantity: 40,
                gravityY: -50, // Particles float up for epic effect
                alpha: { start: 1, end: 0 },
                tint: [0xff0000, 0xffff00, 0xff00ff], // Multi-color burst
                emitCallback: this.emitJumpParticles.bind(this),
                angle: { min: 0, max: 360 }, // Full circle explosion
                blendMode: 'ADD',
                rotate: { start: 0, end: 720 }, // Fast spinning
                frequency: 50, // Emit over time for trail effect
            },
        };

        // Landing particles configuration - BUFF IMPACT
        this.landParticleConfig = {
            frame: ['white'],
            lifespan: 900,
            speed: { min: 80, max: 160 },
            scale: { start: 0.2, end: 0 },
            quantity: 20,
            gravityY: 250,
            alpha: { start: 0.8, end: 0 },
            tint: [0xcccccc, 0xffffff], // Mixed dust colors
            emitCallback: this.emitLandParticles.bind(this),
            angle: { min: -60, max: 240 }, // Upward spray pattern
            blendMode: 'ADD',
        };

        // Movement particles configuration
        this.moveParticleConfig = {
            frame: ['white'],
            lifespan: 400,
            speed: { min: 20, max: 40 },
            scale: { start: 0.05, end: 0 },
            quantity: 1,
            frequency: 100, // Emit every 100ms while moving
            gravityY: 200,
            alpha: { start: 0.3, end: 0 },
            tint: 0xcccccc, // Light gray dust
            emitCallback: this.emitMoveParticles.bind(this),
        };
    }

    /**
     * Set up event listeners for particle effects
     */
    setupEventListeners() {
        if (!this.eventSystem) return;

        // Listen for jump events
        this.eventSystem.on(EventNames.PLAYER_JUMP, this.handleJump.bind(this));

        // Listen for land events
        this.eventSystem.on(EventNames.PLAYER_LAND, this.handleLand.bind(this));

        // Listen for move events
        this.eventSystem.on(EventNames.PLAYER_MOVE, this.handleMove.bind(this));

        // Listen for custom particle emission events
        this.eventSystem.on(EventNames.EMIT_PARTICLES, this.handleEmitParticles.bind(this));
    }

    /**
     * Create a particle emitter
     * @param {string} key - Unique identifier for the emitter
     * @param {object} config - Emitter configuration
     * @returns {Phaser.GameObjects.Particles.ParticleEmitter} The created emitter
     */
    createEmitter(key, config) {
        // Create particle manager if it doesn't exist
        if (!this.scene.particles) {
            this.scene.particles = this.scene.add.particles('particle');
        }

        // Create the emitter with the provided configuration
        const emitter = this.scene.particles.createEmitter({
            frame: config.frame || ['white'],
            lifespan: config.lifespan || 1000,
            speed: config.speed || { min: 50, max: 100 },
            scale: config.scale || { start: 0.1, end: 0 },
            quantity: config.quantity || 10,
            gravityY: config.gravityY || 200,
            alpha: config.alpha || { start: 1, end: 0 },
            tint: config.tint || 0xffffff,
            on: false, // Start inactive
        });

        // Store the emitter
        this.emitters.set(key, {
            emitter,
            config,
        });

        return emitter;
    }

    /**
     * Get or create an emitter
     * @param {string} key - Emitter identifier
     * @param {object} config - Emitter configuration
     * @returns {Phaser.GameObjects.Particles.ParticleEmitter} The emitter
     */
    getEmitter(key, config) {
        if (!this.emitters.has(key)) {
            return this.createEmitter(key, config);
        }
        return this.emitters.get(key).emitter;
    }

    /**
     * Handle jump events
     * @param {object} data - Jump event data
     */
    handleJump(data) {
        const jumpNumber = data.jumpNumber;
        const position = data.position;
        const velocity = data.velocity;

        // Get the appropriate jump particle configuration
        const config = this.jumpParticleConfigs[jumpNumber] || this.jumpParticleConfigs[1];

        // Create a unique key for this jump emitter
        const key = `jump-${jumpNumber}-${Date.now()}`;

        // Create and emit particles
        const emitter = this.getEmitter(key, config);

        // Call the emit callback
        if (config.emitCallback) {
            config.emitCallback(emitter, position, velocity, jumpNumber);
        }
    }

    /**
     * Handle land events
     * @param {object} data - Land event data
     */
    handleLand(data) {
        const position = data.position;
        const velocity = data.velocity;

        // Only emit particles if landing with significant velocity
        if (Math.abs(velocity.y) < 10) return;

        // Create a unique key for this land emitter
        const key = `land-${Date.now()}`;

        // Create and emit particles
        const emitter = this.getEmitter(key, this.landParticleConfig);

        // Call the emit callback
        if (this.landParticleConfig.emitCallback) {
            this.landParticleConfig.emitCallback(emitter, position, velocity);
        }
    }

    /**
     * Handle move events
     * @param {object} data - Move event data
     */
    handleMove(data) {
        const position = data.position;
        const velocity = data.velocity;

        // Only emit particles if moving with significant velocity
        if (Math.abs(velocity.x) < 15 || !data.isOnGround) return;

        // Use a single key for the movement emitter
        const key = 'move';

        // Create and emit particles
        const emitter = this.getEmitter(key, this.moveParticleConfig);

        // Call the emit callback
        if (this.moveParticleConfig.emitCallback) {
            this.moveParticleConfig.emitCallback(emitter, position, velocity);
        }
    }

    /**
     * Handle custom particle emission events
     * @param {object} data - Emission event data
     */
    handleEmitParticles(data) {
        const { type, position, config } = data;

        // Create a unique key for this custom emitter
        const key = `custom-${type}-${Date.now()}`;

        // Create and emit particles
        const emitter = this.getEmitter(key, config);

        // Emit at the specified position
        emitter.setPosition(position.x, position.y);
        emitter.explode(config.quantity || 10);
    }

    /**
     * Emit jump particles
     * @param {Phaser.GameObjects.Particles.ParticleEmitter} emitter - The particle emitter
     * @param {object} position - Position to emit from
     * @param {object} velocity - Velocity data
     * @param {number} jumpNumber - Which jump this is (1, 2, or 3)
     */
    emitJumpParticles(emitter, position, velocity, jumpNumber) {
        // Set emitter position
        emitter.setPosition(position.x, position.y + 16); // Offset to feet position

        // Configure emitter based on jump number (Phaser 3.60+ API)
        if (jumpNumber === 1) {
            // First jump: simple dust cloud below player
            emitter.setConfig({
                speed: { min: 50, max: 100 },
                scale: { start: 0.1, end: 0 },
            });
            emitter.explode(10);
        } else if (jumpNumber === 2) {
            // Second jump: energy particles in a wider pattern
            emitter.setConfig({
                speed: { min: 80, max: 120 },
                scale: { start: 0.15, end: 0 },
            });
            emitter.explode(15);
        } else if (jumpNumber === 3) {
            // Third jump: burst effect in all directions
            emitter.setConfig({
                speed: { min: 100, max: 200 },
                scale: { start: 0.2, end: 0 },
            });
            emitter.explode(25);
        }
    }

    /**
     * Emit landing particles
     * @param {Phaser.GameObjects.Particles.ParticleEmitter} emitter - The particle emitter
     * @param {object} position - Position to emit from
     * @param {object} velocity - Velocity data
     */
    emitLandParticles(emitter, position, velocity) {
        // Set emitter position
        emitter.setPosition(position.x, position.y + 16); // Offset to feet position

        // Scale particle quantity based on landing velocity
        const impactForce = Math.min(Math.abs(velocity.y) / 10, 3); // Cap at 3x
        const quantity = Math.floor(this.landParticleConfig.quantity * impactForce);

        // Emit particles in a horizontal pattern (Phaser 3.60+ API)
        emitter.setConfig({
            speed: { min: 60, max: 120 },
            gravityY: 200,
        });
        emitter.explode(quantity);
    }

    /**
     * Emit movement particles
     * @param {Phaser.GameObjects.Particles.ParticleEmitter} emitter - The particle emitter
     * @param {object} position - Position to emit from
     * @param {object} velocity - Velocity data
     */
    emitMoveParticles(emitter, position, velocity) {
        // Set emitter position
        emitter.setPosition(position.x, position.y + 16); // Offset to feet position

        // Emit particles opposite to movement direction
        const particleVelocityX = -Math.sign(velocity.x) * 30;

        // Configure particle velocity (Phaser 3.60+ API)
        emitter.setConfig({
            speedX: { min: particleVelocityX - 10, max: particleVelocityX + 10 },
            speedY: { min: -20, max: 0 },
            gravityY: 200,
        });

        // Emit a small puff
        emitter.explode(1);
    }

    /**
     * Clean up resources when scene is shut down
     */
    shutdown() {
        // Remove event listeners
        if (this.eventSystem) {
            this.eventSystem.off(EventNames.PLAYER_JUMP, this.handleJump);
            this.eventSystem.off(EventNames.PLAYER_LAND, this.handleLand);
            this.eventSystem.off(EventNames.PLAYER_MOVE, this.handleMove);
            this.eventSystem.off(EventNames.EMIT_PARTICLES, this.handleEmitParticles);
        }

        // Destroy all emitters
        this.emitters.forEach((emitterData) => {
            emitterData.emitter.stop();
            emitterData.emitter.remove();
        });

        this.emitters.clear();
    }
    /**
     * Set graphics quality for particle effects
     * @param {string} level - 'Low', 'Medium', or 'High'
     */
    setQuality(level) {
        this.quality = level;
        LOG.dev('PARTICLEMANAGER_QUALITY_SET', {
            subsystem: 'effects',
            message: 'Particle quality level changed',
            qualityLevel: level,
        });
        // Future: adjust particle config density or disable effects for 'Low'
    }
}
