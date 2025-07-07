/**
 * PhysicsConfig: Action-packed physics settings for buff gameplay
 * Enhanced for dynamic, responsive movement with satisfying feel
 */
export const PhysicsConfig = {
    /** Default horizontal gravity */
    gravityX: 0.0,
    /** Default vertical gravity (increased for snappier jumps) */
    gravityY: 45.0,
    
    /** Physics world timestep settings for smooth, consistent physics */
    timeStep: 1.0 / 60.0,
    maxVelIterations: 8,
    maxPosIterations: 3,
    
    /** Player physics material properties - buff athletic feel */
    player: {
        density: 1.2,        // Slightly lighter for more agility
        friction: 0.3,       // Increased friction for better control
        restitution: 0.0,    // No bounce for predictable landings
        linearDamping: 0.01, // Less damping for momentum preservation
        angularDamping: 10.0 // Strong rotation prevention
    },
    
    /** Ground/platform physics properties */
    ground: {
        density: 0.0,        // Static bodies
        friction: 0.8,       // Higher grip for athletic movements
        restitution: 0.0     // No bounce on platforms
    },
    
    /** Buff action game physics constants */
    classic: {
        maxWalkSpeed: 45,    // Faster walking (buff characters move with purpose)
        maxRunSpeed: 65,     // Higher max run speed for action
        acceleration: 1.2,   // Snappier acceleration
        airAcceleration: 0.6, // Better air control for skilled play
        friction: 0.85,      // Quick stops for precise platforming
        airFriction: 0.99,   // Minimal air resistance
        jumpHeight: 65,      // Higher base jump for buff characters
        gravityScale: 1.0    // Gravity multiplier
    }
};