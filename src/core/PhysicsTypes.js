import RAPIER from '@dimforge/rapier2d-compat';

/**
 * PhysicsTypes - Core abstraction layer for Rapier physics
 *
 * This module abstracts Rapier physics types and provides helper functions.
 * Only the core layer should import from '@dimforge/rapier2d-compat' directly.
 * All game modules should use PhysicsTypes instead.
 *
 * Benefits:
 * - Clean architectural boundaries (vendor abstraction)
 * - Easier testing (mock physics types instead of Rapier)
 * - Simplified library upgrades (change Rapier version in one place)
 * - Consistent physics API across the codebase
 *
 * Usage:
 * ```javascript
 * import { createDynamicBody, createBoxCollider, Vector2 } from '@features/core';
 *
 * // Create a dynamic physics body
 * const body = createDynamicBody(world, x, y);
 *
 * // Create a box collider
 * const collider = createBoxCollider(width, height);
 *
 * // Use physics types
 * const velocity = new Vector2(5, 0);
 * ```
 *
 * @module PhysicsTypes
 */

// ============================================================================
// Type Exports - Direct re-exports from Rapier
// ============================================================================

/**
 * Rapier physics world
 * @typedef {RAPIER.World} World
 */
export const World = RAPIER.World;

/**
 * Rigid body type enumeration
 * @typedef {RAPIER.RigidBodyType} RigidBodyType
 */
export const RigidBodyType = RAPIER.RigidBodyType;

/**
 * Rigid body descriptor for creating bodies
 * @typedef {RAPIER.RigidBodyDesc} RigidBodyDesc
 */
export const RigidBodyDesc = RAPIER.RigidBodyDesc;

/**
 * Rigid body instance
 * @typedef {RAPIER.RigidBody} RigidBody
 */
export const RigidBody = RAPIER.RigidBody;

/**
 * Rigid body handle
 * @typedef {RAPIER.RigidBodyHandle} RigidBodyHandle
 */
export const RigidBodyHandle = RAPIER.RigidBodyHandle;

/**
 * Collider descriptor for creating colliders
 * @typedef {RAPIER.ColliderDesc} ColliderDesc
 */
export const ColliderDesc = RAPIER.ColliderDesc;

/**
 * 2D Vector for physics calculations
 * @typedef {RAPIER.Vector2} Vector2
 */
export const Vector2 = RAPIER.Vector2;

/**
 * Ray for raycasting
 * @typedef {RAPIER.Ray} Ray
 */
export const Ray = RAPIER.Ray;

/**
 * Query filter flags for physics queries
 * @typedef {RAPIER.QueryFilterFlags} QueryFilterFlags
 */
export const QueryFilterFlags = RAPIER.QueryFilterFlags;

/**
 * Active events enumeration
 * @typedef {RAPIER.ActiveEvents} ActiveEvents
 */
export const ActiveEvents = RAPIER.ActiveEvents;

/**
 * Character controller for kinematic character movement
 * @typedef {RAPIER.KinematicCharacterController} KinematicCharacterController
 */
export const KinematicCharacterController = RAPIER.KinematicCharacterController;

/**
 * Character controller collision flags
 * @typedef {RAPIER.CharacterCollision} CharacterCollision
 */
export const CharacterCollision = RAPIER.CharacterCollision;

// ============================================================================
// Helper Functions - Simplified APIs for common operations
// ============================================================================

/**
 * Create a dynamic rigid body (affected by forces and gravity)
 * @param {RAPIER.World} world - The physics world
 * @param {number} x - X position in meters
 * @param {number} y - Y position in meters
 * @returns {RAPIER.RigidBody} The created rigid body
 */
export function createDynamicBody(world, x, y) {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y);
    return world.createRigidBody(bodyDesc);
}

/**
 * Create a kinematic position-based rigid body (moved via position, not forces)
 * @param {RAPIER.World} world - The physics world
 * @param {number} x - X position in meters
 * @param {number} y - Y position in meters
 * @returns {RAPIER.RigidBody} The created rigid body
 */
export function createKinematicBody(world, x, y) {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y);
    return world.createRigidBody(bodyDesc);
}

/**
 * Create a kinematic velocity-based rigid body (moved via velocity)
 * @param {RAPIER.World} world - The physics world
 * @param {number} x - X position in meters
 * @param {number} y - Y position in meters
 * @returns {RAPIER.RigidBody} The created rigid body
 */
export function createKinematicVelocityBody(world, x, y) {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased().setTranslation(x, y);
    return world.createRigidBody(bodyDesc);
}

/**
 * Create a fixed (static) rigid body (never moves)
 * @param {RAPIER.World} world - The physics world
 * @param {number} x - X position in meters
 * @param {number} y - Y position in meters
 * @returns {RAPIER.RigidBody} The created rigid body
 */
export function createFixedBody(world, x, y) {
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y);
    return world.createRigidBody(bodyDesc);
}

/**
 * Create a box (rectangle) collider
 * @param {number} width - Width in meters (half-width used by Rapier)
 * @param {number} height - Height in meters (half-height used by Rapier)
 * @returns {RAPIER.ColliderDesc} The collider descriptor
 */
export function createBoxCollider(width, height) {
    // Rapier uses half-extents, so divide by 2
    return RAPIER.ColliderDesc.cuboid(width / 2, height / 2);
}

/**
 * Create a circle collider
 * @param {number} radius - Radius in meters
 * @returns {RAPIER.ColliderDesc} The collider descriptor
 */
export function createCircleCollider(radius) {
    return RAPIER.ColliderDesc.ball(radius);
}

/**
 * Create a capsule collider (pill shape)
 * @param {number} halfHeight - Half height of the capsule in meters
 * @param {number} radius - Radius of the capsule ends in meters
 * @returns {RAPIER.ColliderDesc} The collider descriptor
 */
export function createCapsuleCollider(halfHeight, radius) {
    return RAPIER.ColliderDesc.capsule(halfHeight, radius);
}

/**
 * Create a kinematic character controller
 * @param {RAPIER.World} world - The physics world
 * @param {number} offset - Offset for collision detection (default 0.01)
 * @returns {RAPIER.KinematicCharacterController} The character controller
 */
export function createCharacterController(world, offset = 0.01) {
    return world.createCharacterController(offset);
}

/**
 * Create a 2D vector
 * @param {number} x - X component
 * @param {number} y - Y component
 * @returns {RAPIER.Vector2} The vector
 */
export function createVector2(x, y) {
    return new RAPIER.Vector2(x, y);
}

/**
 * Create a ray for raycasting
 * @param {Object} origin - Ray origin {x, y}
 * @param {Object} direction - Ray direction {x, y} (should be normalized)
 * @returns {RAPIER.Ray} The ray
 */
export function createRay(origin, direction) {
    return new RAPIER.Ray(origin, direction);
}

/**
 * Attach a collider to a rigid body
 * @param {RAPIER.World} world - The physics world
 * @param {RAPIER.ColliderDesc} colliderDesc - The collider descriptor
 * @param {RAPIER.RigidBody} body - The rigid body to attach to
 * @returns {RAPIER.Collider} The created collider
 */
export function attachCollider(world, colliderDesc, body) {
    return world.createCollider(colliderDesc, body);
}

/**
 * Set collision groups for a collider (for filtering collisions)
 * @param {RAPIER.ColliderDesc} colliderDesc - The collider descriptor
 * @param {number} groups - Collision groups bitmask
 * @param {number} mask - Collision mask bitmask
 * @returns {RAPIER.ColliderDesc} The modified collider descriptor (for chaining)
 */
export function setCollisionGroups(colliderDesc, groups, mask) {
    return colliderDesc.setCollisionGroups(groups << 16 | mask);
}

/**
 * Set sensor flag for a collider (sensor colliders detect but don't block)
 * @param {RAPIER.ColliderDesc} colliderDesc - The collider descriptor
 * @param {boolean} isSensor - Whether the collider is a sensor
 * @returns {RAPIER.ColliderDesc} The modified collider descriptor (for chaining)
 */
export function setSensor(colliderDesc, isSensor) {
    return colliderDesc.setSensor(isSensor);
}

/**
 * Set friction for a collider
 * @param {RAPIER.ColliderDesc} colliderDesc - The collider descriptor
 * @param {number} friction - Friction coefficient (0 = no friction)
 * @returns {RAPIER.ColliderDesc} The modified collider descriptor (for chaining)
 */
export function setFriction(colliderDesc, friction) {
    return colliderDesc.setFriction(friction);
}

/**
 * Set restitution (bounciness) for a collider
 * @param {RAPIER.ColliderDesc} colliderDesc - The collider descriptor
 * @param {number} restitution - Restitution coefficient (0 = no bounce, 1 = perfectly elastic)
 * @returns {RAPIER.ColliderDesc} The modified collider descriptor (for chaining)
 */
export function setRestitution(colliderDesc, restitution) {
    return colliderDesc.setRestitution(restitution);
}

/**
 * Set density for a collider (affects mass calculation)
 * @param {RAPIER.ColliderDesc} colliderDesc - The collider descriptor
 * @param {number} density - Density value
 * @returns {RAPIER.ColliderDesc} The modified collider descriptor (for chaining)
 */
export function setDensity(colliderDesc, density) {
    return colliderDesc.setDensity(density);
}

// ============================================================================
// Default Export - Full RAPIER namespace for advanced use
// ============================================================================

/**
 * Full Rapier namespace for advanced use cases
 * Use this sparingly - prefer the helper functions above
 */
export default RAPIER;
