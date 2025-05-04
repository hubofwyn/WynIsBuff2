Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 4

# Buff-Themed Enemies

Task: Implement buff-themed enemy spawning and behavior for level1.
  - Preload enemy assets in `Preloader`: `axelface`, `wynface` images or atlases.
  - In `LevelManager.initializeComponents`, pass `world` into `LevelLoader`.
  - Extend `LevelLoader` constructor to capture `managers.world` and use it when spawning.
  - Update `LevelLoader.initializeLevel` to create `EnemyController(scene, world, eventSystem, x, y, key)`.
  - In `EnemyController.create()`:
    * Create a kinematic Rapier body and collider sized to the sprite (64×64).
    * Register body–sprite pair via `scene.physicsManager.registerBodySprite`.
    * Configure patrol parameters (`startX`, `patrolRange=100`, `patrolSpeed=50`, `patrolDir`).
  - In `EnemyController.update(time, delta)`:
    * Apply horizontal velocity (`patrolSpeed*patrolDir`).
    * Reverse `patrolDir` when reaching `startX±patrolRange`.
  - Ensure `GameScene.update` calls `enemy.update(time, delta)` for each enemy.
  - Verify collisions emit `COLLISION_START` and the buff enemy animates/patrols correctly.

## Change Log
* Refine Task breakdown for precise implementation of buff enemies in level1.