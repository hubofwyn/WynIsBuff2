Status: READY
Owner: phaser-coder
Scope: feature
Estimate: 4

# Implement Settings UI Components

Task: Create in-Pause settings UI to expose configurable options and persist changes.

- Volume sliders for Master, Music, and SFX channels (0–100%, step 5%).
- Keybinding remapping UI for Jump, Move Left/Right, and Pause; show current binding and allow rebind on input capture.
- Dropdown to select Graphics Quality (Low / Medium / High) affecting particle counts and bloom.
- Toggles for:
  • Color-blind palettes (Deuteranopia, Protanopia, Tritanopia).
  • High-contrast UI mode (enlarged fonts, bold outlines).
  • Subtitle captions for key SFX events.
- Ensure UI controls are navigable via keyboard, mouse, gamepad, and touch.
- Style components using `UIConfig` constants for consistency.

# Change Log

_TBD after implementation._

## Subtasks

- 031-1: SettingsScene skeleton
- 031-2: PauseScene integration (add Settings button)
- 031-3: Settings panel layout (overlay, panel, Back button)
- 031-4: Volume controls (Master, Music, SFX sliders)
- 031-5: Keybinding remapping (Jump, Move Left/Right, Pause)
- 031-6: Graphics quality dropdown (Low/Medium/High)
- 031-7: Accessibility toggles (color-blind palettes, high-contrast, subtitles)
- 031-8: Input and navigation support (mouse, keyboard, gamepad)
- 031-9: Settings persistence and load (GameStateManager.saveSettings/loadSettings)
- 031-10: Back navigation and exit from SettingsScene
- 031-11: Testing & QA (unit/integration/manual)
