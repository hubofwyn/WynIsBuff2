/**
 * PhysicsConfig: Classic action game physics settings (Mario/Sonic style)
 * Balanced for natural, predictable movement with good game feel
 */
export const PhysicsConfig = {
    /** Default horizontal gravity */
    gravityX: 0.0,
    /** Default vertical gravity (classic platformer strength) */
    gravityY: 35.0,
    
    /** Physics world timestep settings for smooth, consistent physics */
    timeStep: 1.0 / 60.0,
    maxVelIterations: 6,
    maxPosIterations: 2,
    
    /** Player physics material properties - classic platformer feel */
    player: {
        density: 1.5,        // Moderate weight for natural movement
        friction: 0.2,       // Some friction for control
        restitution: 0.0,    // No bounce for predictable landings
        linearDamping: 0.02, // Minimal damping for smooth movement
        angularDamping: 5.0  // Prevent unwanted rotation
    },
    
    /** Ground/platform physics properties */
    ground: {
        density: 0.0,        // Static bodies
        friction: 0.6,       // Balanced grip
        restitution: 0.0     // No bounce on platforms
    },
    
    /** Classic action game physics constants */
    classic: {
        maxWalkSpeed: 35,    // Maximum walking speed
        maxRunSpeed: 50,     // Maximum running speed
        acceleration: 0.8,   // Ground acceleration factor
        airAcceleration: 0.4, // Air control factor
        friction: 0.7,       // Ground friction when stopping
        airFriction: 0.98,   // Air resistance
        jumpHeight: 55,      // Standard jump force
        gravityScale: 1.0    // Gravity multiplier
    }
};