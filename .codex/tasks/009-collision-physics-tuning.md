Status: READY
Owner: phaser-coder
Scope: feature
Estimate: 3

# Collision Physics Tuning

Task: Solidify collision interactions so the player feels heavy and impactful.
  - In `PlayerController.create()`, update `ColliderDesc`:
    • friction -> 0.1
    • density -> 2.0
    • restitution -> 0.15
  - In `CollisionController`, verify/adjust collisionParams:
    • `groundTopOffset` and `platformMargin` for high-speed stability
  - (Optional) tweak world contact friction if needed for sliding/bounce
  - Test landing impacts, sliding behavior, and collision responses.

## Change Log
- Set player collider friction to 0.1, density to 2.0, restitution to 0.15.
- Reviewed and adjusted collision detection thresholds for stability.