// Kinematic Character Controller adapter scaffold for Rapier compat.
// This provides a narrow surface for PlayerController to request moves,
// while encapsulating Rapier-specific details. JS implementation with JSDoc.

/**
 * @typedef {object} MoveRequest
 * @property {number} dx Horizontal delta in pixels per step
 * @property {number} dy Vertical delta in pixels per step
 * @property {boolean} [snapToGround] Attempt to snap to ground when near
 */

export class KccAdapter {
  /**
   * @param {object} params
   * @param {*} params.RAPIER The Rapier module (compat flavour)
   * @param {*} params.world Rapier.World
   * @param {*} params.body Rapier.RigidBody (kinematic)
   * @param {*} params.collider Rapier.Collider
   * @param {number} params.pxPerMeter Pixels per meter conversion
   */
  constructor({ RAPIER, world, body, collider, pxPerMeter = 50 }) {
    this.RAPIER = RAPIER;
    this.world = world;
    this.body = body;
    this.collider = collider;
    this.pxPerMeter = pxPerMeter;
    this._grounded = false;
  }

  /** Convert pixels to meters */
  _p2m(p) { return p / this.pxPerMeter; }
  /** Convert meters to pixels */
  _m2p(m) { return m * this.pxPerMeter; }

  /**
   * Move character using a simple move-and-sweep strategy.
   * This is a placeholder; refine with proper shape casts and snapping.
   * @param {MoveRequest} req
   * @returns {{ grounded: boolean, translation: { x:number, y:number } }}
   */
  move(req) {
    const { dx = 0, dy = 0 } = req || {};
    const current = this.body.translation();
    const nx = current.x + this._p2m(dx);
    const ny = current.y + this._p2m(dy);
    this.body.setNextKinematicTranslation({ x: nx, y: ny });
    // Grounded state unknown without queries; keep last known value.
    return { grounded: this._grounded, translation: { x: this._m2p(nx), y: this._m2p(ny) } };
  }

  /**
   * Apply horizontal velocity on a dynamic body while preserving Y velocity.
   * This is a bridge toward full KCC adoption without changing body type yet.
   * @param {number} vxMps Horizontal velocity in meters/second
   */
  applyHorizontalVelocity(vxMps) {
    const vel = this.body.linvel();
    this.body.setLinvel({ x: vxMps, y: vel.y }, true);
  }

  /**
   * Very rough ground probe straight down by `probePx`.
   * Replace with proper shape casts; for now, updates internal grounded flag.
   * @param {number} probePx
   * @param {number} groups Interaction groups bitfield
   */
  probeGround(probePx = 4, groups = undefined) {
    const origin = this.body.translation();
    const dir = { x: 0, y: 1 };
    const maxToi = this._p2m(probePx);
    const solid = true;
    const ray = new this.RAPIER.Ray(origin, dir);
    const hit = this.world.castRay(ray, maxToi, solid, undefined, groups);
    this._grounded = !!(hit && hit.toi < maxToi);
    return this._grounded;
  }
}
