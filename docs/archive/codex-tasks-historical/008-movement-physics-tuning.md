Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 4

# Movement Physics Tuning

Task: Revise movement physics for weighty falls, fast acceleration, and high top speeds.

- Set `PhysicsConfig.gravityY` -> 95 (heavier falls, impactful landings)
- Update `MovementController.fallingParams`:
  • baseAcceleration -> 1.3
  • maxAcceleration -> 2.0
  • maxFallSpeed -> 90
- Update `MovementController.groundParams`:
  • moveSpeed -> 20
  • snapFactor -> 0.9
- Tweak `MovementController.airParams` for strong yet responsive momentum:
  • directionChangeFactor -> 0.8
  • snapFactor -> 0.8

## Change Log

- Increased global gravity to 95.0 (PhysicsConfig).
- Tuned fallingParams: baseAcceleration 1.3, maxAcceleration 2.0, maxFallSpeed 90.
- Boosted groundParams: moveSpeed 20, snapFactor 0.9.
- Adjusted airParams: directionChangeFactor 0.8, snapFactor 0.8.
