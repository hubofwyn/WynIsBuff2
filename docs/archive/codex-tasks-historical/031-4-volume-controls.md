Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 2

# Volume Controls (031-4)

Task: Add sliders for Master, Music, and SFX volumes:
- Label each control and display current percentage (0–100%).
- Provide “<” and “>” buttons to adjust by 5% increments.
- Hook to `AudioManager.setMasterVolume()`, `.setMusicVolume()`, `.setSFXVolume()`.
- Persist values via `GameStateManager.saveSettings({ volumes })`.
- Default values: Master 80%, Music 70%, SFX 90%.

Acceptance Criteria:
- Adjusting controls updates audio levels immediately.
- Volume settings persist across scene transitions and reloads.