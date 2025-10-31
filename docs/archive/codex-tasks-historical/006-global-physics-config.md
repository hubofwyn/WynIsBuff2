Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 2

# Global Physics Configuration

Task: Centralize gravity and physics world parameters into a config/constants module.

- Extract default gravity (currently hard-coded in PhysicsManager.initialize) to a new `PhysicsConfig` in `src/constants/PhysicsConfig.js`.
- Import and apply these constants in `PhysicsManager.initialize`.
- Ensure gravityX and gravityY are configurable by environment or level config if needed.

## Change Log

- Added `src/constants/PhysicsConfig.js` defining gravityX and gravityY defaults.
- Updated `PhysicsManager.initialize` to use `PhysicsConfig` constants as default values.
