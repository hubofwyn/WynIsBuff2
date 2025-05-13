Status: READY
Owner: phaser-coder
Scope: feature
Estimate: 5

# Implement Pause Flow & Overlay

Task: Add a pause system with a dedicated overlay and freeze game logic.
  - Listen for `ESC` key and gamepad `START` button to toggle pause state.
  - On pause: halt physics simulation, tweens, timers, and AI; fade current BGM to 50% volume.
  - On resume: restore physics, tweens, timers, AI; fade BGM back to full volume.
  - Create `PauseScene` or overlay layer with:
      • Blurred background snapshot of the current game scene.
      • Centered card containing navigation to Resume, Settings, and Main Menu.
  - Support navigation via keyboard, mouse, gamepad D-pad, and touch input.
  - Ensure pausing from any scene (Game, MainMenu if needed) consistently works.

# Change Log
*TBD after implementation.*