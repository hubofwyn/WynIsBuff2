Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 6

# Character Actions Framework

Task: Define player controller modules under src/modules/player. Create base classes or stubs for:
  - JumpController
  - MovementController
  - CollisionController
Ensure each controller exposes clear method signatures for initializing, updating per frame, and handling relevant events. Integrate with the existing EventSystem stub.

## Change Log
- JumpController, MovementController, CollisionController modules confirmed under src/modules/player
- Each controller has constructor, update(), and event hooks wired via EventNames