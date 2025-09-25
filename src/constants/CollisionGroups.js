// Collision groups and helper mask utilities for Rapier.
// Keep values stable; use bitmasks for grouping.

export const CollisionGroups = {
  NONE: 0,
  STATIC: 1 << 0,
  DYNAMIC: 1 << 1,
  PLAYER: 1 << 2,
  ENEMY: 1 << 3,
  SENSOR: 1 << 4,

  // Helper: compose a mask from one membership bit and a collide-with bitmask
  // In Rapier, interaction groups are a 32-bit integer where the high 16 bits
  // encode the group the collider belongs to, and the low 16 bits encode the mask.
  // This helper lifts the membership to the high bits and keeps mask in the low bits.
  createMask(membership, withMask) {
    const mem = (membership & 0xffff) << 16;
    const mask = withMask & 0xffff;
    return mem | mask;
  }
};

/**
 * Build a basic query filter structure compatible with Rapier's query API.
 * @param {object} RAPIER Rapier module
 * @param {object} options Options
 * @param {number} options.groups Interaction groups bitfield
 * @param {boolean} [options.excludeSensors=true] Exclude sensors from hits
 */
export function createQueryFilter(RAPIER, { groups, excludeSensors = true }) {
  const filter = new RAPIER.QueryFilterFlags();
  let flags = 0;
  if (excludeSensors) flags |= RAPIER.QueryFilterFlags.EXCLUDE_SENSORS;
  return {
    flags,
    groups
  };
}

