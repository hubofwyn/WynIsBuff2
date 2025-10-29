Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 2

# Graphics Quality Dropdown (031-6)

Task: Add selector for graphics quality (Low, Medium, High):
- Use left/right arrows or a dropdown control.
- On change: call `ParticleManager.setQuality(level)` and `CameraManager.setQuality(level)`.
- Persist via `GameStateManager.saveSettings({ graphicsQuality })`.
- Default quality: Medium.

Acceptance Criteria:
- Changing quality updates visual effects immediately.
- Selection persists across sessions and reloads.