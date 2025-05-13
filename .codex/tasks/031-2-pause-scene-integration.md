Status: DONE
Owner: phaser-coder
Scope: chore
Estimate: 1

# PauseScene Integration (031-2)

Task: In `src/scenes/PauseScene.js`, add a **Settings** button:
- Styled with `UIConfig.menuButton` constants.
- Positioned below the existing “Main Menu” button.
- On pointerover: tint + `AudioManager.getInstance().playSFX('hover')`.
- On pointerdown: launch `SettingsScene` and keep `PauseScene` paused.

Acceptance Criteria:
- “Settings” button appears in the pause overlay.
- Clicking it opens `SettingsScene` without closing the pause overlay.