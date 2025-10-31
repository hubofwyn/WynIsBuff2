Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 2

# Settings Panel Layout (031-3)

Task: In `SettingsScene.create()`:

- Draw full-screen semi-transparent overlay.
- Render centered panel rectangle using `UIConfig.panel`.
- Add title text “Settings” with `UIConfig.text.title`.
- Add a **Back** button styled with `UIConfig.menuButton` to return to `PauseScene`.
- ESC key also returns to pause overlay.

Acceptance Criteria:

- Overlay and panel display correctly.
- **Back** button and ESC return to pause overlay without errors.
