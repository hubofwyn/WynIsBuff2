import { PIXELS_PER_METER, pixelsToMeters } from './PhysicsConstants.js';

/**
 * PhysicsConfig: Modern 2D platformer physics settings based on expert guide
 * Properly scaled for Rapier's meter-based physics with responsive control feel
 * All values account for PIXELS_PER_METER scaling (100 pixels = 1 meter)
 */
export const PhysicsConfig = {
    /** World gravity - Higher than realistic for tighter, action-oriented feel */
    gravityX: 0.0,
    gravityY: 20.0,  // Proper scaled gravity for responsive jump arcs
    
    /** Physics solver settings for stability and performance */
    timeStep: 1.0 / 60.0,           // Fixed 60Hz timestep for determinism
    maxVelIterations: 8,            // Increased for high-speed collision stability
    maxPosIterations: 2,            // Increased to reduce penetration errors
    erp: 0.8,                      // Error reduction parameter for smooth correction
    
    /** Player physics material properties for responsive platforming */
    player: {
        friction: 1.0,              // High friction for immediate stops/starts
        restitution: 0.0,           // No bounce for predictable landings
        density: 1.0,               // Standard density

        // Dimensions in PIXELS (convert to meters when needed)
        pixelWidth: 32,             // Standing width in pixels
        pixelHeight: 48,            // Standing height in pixels
        pixelHeightDuck: 24,        // Ducking height in pixels
        radiusPixels: 16,           // Capsule radius in pixels

        // Character controller settings (in meters)
        radius: pixelsToMeters(16), // 16 pixel radius = 0.16 meters
        height: pixelsToMeters(48), // 48 pixel height = 0.48 meters
        heightDuck: pixelsToMeters(24), // 24 pixel duck height = 0.24 meters
        offset: 0.01,               // Small offset to prevent sticking

        // Modern platformer controller features
        enableAutostep: true,
        autostepMaxHeight: 0.1,     // Can step over 10cm obstacles
        autostepMinWidth: 0.1,      // Minimum step width
        enableSnapToGround: true,
        snapToGroundDistance: 0.2,  // Snap to ground within 20cm
        maxSlopeClimbAngle: 45 * Math.PI / 180, // 45 degree max slope
    },
    
    /** Ground/platform physics properties for predictable surfaces */
    ground: {
        friction: 1.0,              // High friction for player traction
        restitution: 0.0,           // No bounce on platforms
        density: 0.0                // Static bodies (infinite mass)
    },
    
    /** Movement parameters properly scaled for responsive control */
    movement: {
        // Speeds in meters per second (will be applied correctly via scaling)
        walkSpeed: pixelsToMeters(250),    // 250 px/s = 2.5 m/s
        runSpeed: pixelsToMeters(400),     // 400 px/s = 4.0 m/s  
        jumpVelocity: pixelsToMeters(480), // 480 px/s = 4.8 m/s upward
        
        // Air control parameters
        airControlFactor: 0.8,      // 80% of ground control in air
        
        // Acceleration values (in meters per second squared)
        groundAcceleration: 15.0,   // Fast ground response
        airAcceleration: 8.0,       // Good air control
        deceleration: 20.0,         // Quick stopping
        
        // Fast fall mechanics
        fastFallMultiplier: 1.4,    // 40% faster falling when holding down
        maxFallSpeed: pixelsToMeters(600), // Terminal velocity
    },
    
    /** Advanced game feel parameters */
    gameFeel: {
        coyoteTime: 0.15,           // 150ms grace period for jumping after leaving ledge
        jumpBufferTime: 0.1,        // 100ms input buffering before landing
        variableJumpMinHeight: 0.3, // Minimum jump height when releasing early
        
        // Landing recovery
        landingRecoveryTime: 0.08,  // 80ms reduced control after landing
        landingSpeedMultiplier: 0.9 // 90% speed during landing recovery
    }
};