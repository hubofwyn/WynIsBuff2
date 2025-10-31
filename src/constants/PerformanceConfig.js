/**
 * Performance configuration for optimizing game across different systems
 */
export const PerformanceConfig = {
    physics: {
        // Maximum delta time to prevent spiral of death (in seconds)
        maxDeltaTime: 1 / 30,

        // Fixed timestep for physics (60 Hz)
        fixedTimeStep: 1 / 60,

        // Maximum physics steps per frame to prevent lockup
        maxStepsPerFrame: 3,

        // Enable interpolation for smooth rendering
        enableInterpolation: true,
    },

    rendering: {
        // Target FPS (0 = use browser's refresh rate)
        targetFPS: 0,

        // Enable/disable antialiasing
        antialias: true,

        // Pixel art mode (disables antialiasing for crisp pixels)
        pixelArt: false,

        // Power preference for GPU
        // "high-performance" | "low-power" | "default"
        powerPreference: 'default',
    },

    // Quality presets for different system capabilities
    qualityPresets: {
        low: {
            particles: {
                maxParticles: 50,
                particleLifespan: 500,
                enabled: true,
            },
            effects: {
                screenShake: true,
                colorTransitions: false,
                shadows: false,
            },
            physics: {
                maxStepsPerFrame: 2,
            },
        },
        medium: {
            particles: {
                maxParticles: 100,
                particleLifespan: 1000,
                enabled: true,
            },
            effects: {
                screenShake: true,
                colorTransitions: true,
                shadows: false,
            },
            physics: {
                maxStepsPerFrame: 3,
            },
        },
        high: {
            particles: {
                maxParticles: 200,
                particleLifespan: 2000,
                enabled: true,
            },
            effects: {
                screenShake: true,
                colorTransitions: true,
                shadows: true,
            },
            physics: {
                maxStepsPerFrame: 4,
            },
        },
    },

    // Auto-detect performance capabilities
    autoDetect: {
        enabled: true,
        // Minimum FPS before downgrading quality
        minFPS: 30,
        // Number of frames to sample for FPS calculation
        sampleFrames: 60,
        // Time between quality adjustments (ms)
        adjustmentInterval: 5000,
    },
};
