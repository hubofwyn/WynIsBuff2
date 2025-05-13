Status: DONE
Owner: phaser-coder
Scope: chore
Estimate: 2

# Settings Persistence & Load (031-9)

Task: Load and apply persisted settings on game start:
- In `Preloader.create()`, read `GameStateManager.settings` and apply volumes via `AudioManager`.
- In `Game.create()`, read `this.gameStateManager.settings` and:
  • Set `ParticleManager` and `CameraManager` quality.
  • Apply palette via `ColorManager.applyPalette()`.
  • Apply high-contrast via `UIManager.applyHighContrast()`.
  • Enable subtitles via `UIManager.showSubtitles()`.

Acceptance Criteria:
- Audio, graphics, and accessibility settings automatically apply on startup.
- No console errors if settings keys are missing.