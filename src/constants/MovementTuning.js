/**
 * MovementTuning: All movement speeds in meters/second for proper physics integration
 * Using PIXELS_PER_METER = 100, so these values are in Rapier's native units
 */

export const MovementTuning = {
    // Horizontal movement speeds (m/s)
    WALK_SPEED: 6.0,      // Normal walking speed
    RUN_SPEED: 8.0,       // Running speed 
    
    // Vertical movement speeds (m/s)
    JUMP_VELOCITY: 12.0,  // Initial jump velocity (positive = upward)
    FALL_SPEED_MAX: 20.0, // Terminal velocity
    FAST_FALL_MULTIPLIER: 1.8,
    
    // Game feel timing (seconds)
    COYOTE_TIME: 0.15,    // Grace period after leaving ground
    JUMP_BUFFER_TIME: 0.12, // Input buffer time
    VARIABLE_JUMP_MIN_HEIGHT: 0.4, // Minimum jump height ratio
    
    // Physics parameters
    LINEAR_DAMPING: 2.0,  // Air resistance for horizontal movement
    GROUND_FRICTION: 0.8, // Ground friction
    AIR_CONTROL: 0.65,    // Air control factor (0.0 = no control, 1.0 = full control)
    
    // Debug/Health
    MOTION_THRESHOLD: 0.05, // Minimum velocity to consider "moving" (m/s)
    HEALTH_CHECK_FRAMES: 30, // Frames before warning about stuck movement
    
    // Feature flags (progressive KCC adoption)
    USE_KCC_HORIZONTAL: false, // Route horizontal control through KccAdapter (keeps same semantics)
};

// Derived constants for convenience
export const FIXED_TIMESTEP = 1/60; // 60Hz physics
export const PPM = 100; // Pixels per meter - for reference
