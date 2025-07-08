import { EventNames } from '../../constants/EventNames.js';
import { getLogger } from '../../core/Logger.js';

/**
 * CollisionController class handles all collision-related functionality for the player
 * including ground detection, platform interactions, and collision events.
 */
export class CollisionController {
    /**
     * Create a new CollisionController
     * @param {Phaser.Scene} scene - The scene this controller belongs to
     * @param {EventSystem} eventSystem - The event system for communication
     */
    constructor(scene, eventSystem) {
        this.logger = getLogger('CollisionController');
        this.scene = scene;
        this.eventSystem = eventSystem;
        
        // Collision state
        this.isOnGround = false;
        this._lastOnGround = false;
        
        // Collision parameters
        this.collisionParams = {
            playerWidth: 32,
            playerHeight: 32,
            feetOffset: 2,       // Offset from center to feet position
            platformMargin: 5,   // Margin for platform width collision
            groundTopOffset: 5,  // Offset for ground top collision
            groundY: 700,        // Y position of the ground
            groundHeight: 50     // Height of the ground
        };
        
        this.logger.info('Initialized');
    }
    
    /**
     * Update method called every frame
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Array} platforms - Array of platforms to check for collisions
     * @returns {boolean} Whether the player is on the ground
     */
    update(body, platforms) {
        if (!body) return false;
        
        // Process collisions to detect ground contact
        this.processCollisions(body, platforms);
        
        // Return current ground state
        return this.isOnGround;
    }
    
    /**
     * Process collisions to detect if player is on ground
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {Array} platforms - Array of platforms to check for collisions
     */
    processCollisions(body, platforms) {
        try {
            // Reset ground state at the beginning of each frame
            this.isOnGround = false;
            
            // Only proceed if player body exists
            if (!body) return;
            
            // Get player position and velocity
            const playerPos = body.translation();
            const playerVel = body.linvel();
            
            // Player dimensions
            const playerHeight = this.collisionParams.playerHeight;
            const playerWidth = this.collisionParams.playerWidth;
            const playerFeet = playerPos.y + (playerHeight / 2) - this.collisionParams.feetOffset;
            
            // Check platform collisions
            this.checkPlatformCollisions(playerPos, playerVel, playerFeet, platforms);
            
            // Check ground collision
            this.checkGroundCollision(playerPos, playerVel, playerFeet);
            
            // Store previous ground state
            this._lastOnGround = this.isOnGround;
        } catch (error) {
            this.logger.error('Error in processCollisions:', error);
        }
    }
    
    /**
     * Check for collisions with platforms
     * @param {object} playerPos - Player position
     * @param {object} playerVel - Player velocity
     * @param {number} playerFeet - Y position of player's feet
     * @param {Array} platforms - Array of platforms to check
     */
    checkPlatformCollisions(playerPos, playerVel, playerFeet, platforms) {
        // Check if player's feet are close to any platform
        for (const platform of platforms) {
            const platformPos = platform.body.translation();
            const platformWidth = 200; // From platform creation
            const platformHeight = 20; // From platform creation
            const platformTop = platformPos.y - (platformHeight / 2);
            
            // More precise collision check
            // 1. Player must be within the platform width
            // 2. Player's feet must be very close to the platform top
            // 3. Player must be moving downward or stationary (not jumping up)
            if (Math.abs(playerPos.x - platformPos.x) < (platformWidth / 2) - this.collisionParams.platformMargin && // Within platform width with margin
                Math.abs(playerFeet - platformTop) < this.collisionParams.groundTopOffset && // Very close to platform top
                playerVel.y >= 0) { // Moving down or stationary
                this.isOnGround = true;
                break;
            }
        }
    }
    
    /**
     * Check for collision with the main ground
     * @param {object} playerPos - Player position
     * @param {object} playerVel - Player velocity
     * @param {number} playerFeet - Y position of player's feet
     */
    checkGroundCollision(playerPos, playerVel, playerFeet) {
        // Check if on the main ground with improved precision
        const groundTop = this.collisionParams.groundY - (this.collisionParams.groundHeight / 2);
        if (playerFeet >= groundTop - this.collisionParams.groundTopOffset && 
            playerVel.y >= 0) { // Close to ground top and moving down or stationary
            this.isOnGround = true;
        }
    }
    
    /**
     * Check if a specific point is inside a platform
     * @param {number} x - X position to check
     * @param {number} y - Y position to check
     * @param {Array} platforms - Array of platforms to check
     * @returns {boolean} Whether the point is inside a platform
     */
    isPointInPlatform(x, y, platforms) {
        for (const platform of platforms) {
            const platformPos = platform.body.translation();
            const platformWidth = 200; // From platform creation
            const platformHeight = 20; // From platform creation
            
            // Check if point is inside platform bounds
            if (Math.abs(x - platformPos.x) < platformWidth / 2 &&
                Math.abs(y - platformPos.y) < platformHeight / 2) {
                return true;
            }
        }
        
        // Check if point is inside ground bounds
        const groundTop = this.collisionParams.groundY - (this.collisionParams.groundHeight / 2);
        if (y > groundTop) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Cast a ray from the player in a specific direction
     * @param {RAPIER.RigidBody} body - The player's physics body
     * @param {object} direction - Direction vector {x, y}
     * @param {number} distance - Maximum ray distance
     * @param {Array} platforms - Array of platforms to check
     * @returns {object|null} Hit result or null if no hit
     */
    castRay(body, direction, distance, platforms) {
        if (!body) return null;
        
        const start = body.translation();
        const end = {
            x: start.x + direction.x * distance,
            y: start.y + direction.y * distance
        };
        
        // Simple ray casting implementation
        // In a real implementation, you would use Rapier's ray casting API
        // This is a simplified version for demonstration
        
        // Check each platform for intersection
        for (const platform of platforms) {
            const platformPos = platform.body.translation();
            const platformWidth = 200;
            const platformHeight = 20;
            
            // Platform bounds
            const platformLeft = platformPos.x - platformWidth / 2;
            const platformRight = platformPos.x + platformWidth / 2;
            const platformTop = platformPos.y - platformHeight / 2;
            const platformBottom = platformPos.y + platformHeight / 2;
            
            // Check if ray intersects platform
            // This is a simplified line-box intersection test
            
            // Horizontal ray components
            if (direction.x !== 0) {
                const tNear = (platformLeft - start.x) / direction.x;
                const tFar = (platformRight - start.x) / direction.x;
                
                // Ensure tNear is less than tFar
                let t1 = Math.min(tNear, tFar);
                let t2 = Math.max(tNear, tFar);
                
                // Check vertical intersection
                const y = start.y + direction.y * t1;
                if (y >= platformTop && y <= platformBottom && t1 >= 0 && t1 <= distance) {
                    return {
                        distance: t1,
                        normal: { x: -Math.sign(direction.x), y: 0 },
                        point: { x: start.x + direction.x * t1, y }
                    };
                }
            }
            
            // Vertical ray components
            if (direction.y !== 0) {
                const tNear = (platformTop - start.y) / direction.y;
                const tFar = (platformBottom - start.y) / direction.y;
                
                // Ensure tNear is less than tFar
                let t1 = Math.min(tNear, tFar);
                let t2 = Math.max(tNear, tFar);
                
                // Check horizontal intersection
                const x = start.x + direction.x * t1;
                if (x >= platformLeft && x <= platformRight && t1 >= 0 && t1 <= distance) {
                    return {
                        distance: t1,
                        normal: { x: 0, y: -Math.sign(direction.y) },
                        point: { x, y: start.y + direction.y * t1 }
                    };
                }
            }
        }
        
        // Check ground intersection
        if (direction.y > 0) {
            const groundTop = this.collisionParams.groundY - (this.collisionParams.groundHeight / 2);
            const t = (groundTop - start.y) / direction.y;
            
            if (t >= 0 && t <= distance) {
                return {
                    distance: t,
                    normal: { x: 0, y: -1 },
                    point: { x: start.x + direction.x * t, y: groundTop }
                };
            }
        }
        
        return null;
    }
    
    /**
     * Get the current collision state
     * @returns {object} Collision state information
     */
    getCollisionState() {
        return {
            isOnGround: this.isOnGround,
            lastOnGround: this._lastOnGround
        };
    }
}