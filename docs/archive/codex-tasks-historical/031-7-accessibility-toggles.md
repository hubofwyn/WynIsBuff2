Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 2

# Accessibility Toggles (031-7)

Task: Add toggles for:

- Color-blind palette (Off, Deuteranopia, Protanopia, Tritanopia).
- High-contrast UI mode (on/off).
- Subtitle captions for SFX events (on/off).
- On change, apply via `ColorManager.applyPalette()`, `UIManager.applyHighContrast()`, `UIManager.showSubtitles()`.
- Persist via `GameStateManager.saveSettings({ accessibility })`.
- Defaults: palette Off, highContrast false, subtitles false.

Acceptance Criteria:

- Toggling options updates game/UI immediately.
- Subtitles appear on sound events if enabled.
- Settings persist across sessions.
