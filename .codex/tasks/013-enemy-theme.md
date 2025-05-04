Status: IN-PROG
Owner: phaser-coder
Scope: feature
Estimate: 4

# Buff-Themed Enemies

Task: Introduce or reskin enemy characters to match the “Wyn is Buff” motif in level1.
  - Review `Enemy_Animations_Set` assets under `assets/Enemy_Animations_Set/`.
  - In `src/modules/level/LevelLoader.js`, define enemy spawn points in level1 config.
  - Use Phaser’s `load.atlas()` or `load.spritesheet()` to import buffed enemy animations.
  - Create enemy game objects with custom controllers or reuse existing NPC logic.
  - Set up simple patrol or follow behavior, emit `COLLISION_START` with player to test interactions.
  - Ensure enemy sprites reflect buff theme (e.g., extra muscles, bold colors).