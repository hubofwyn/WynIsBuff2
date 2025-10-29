Status: DONE
Owner: phaser-coder
Scope: chore
Estimate: 1

# Back Navigation & Exit (031-10)

Task: Implement **Back** button in `SettingsScene`:
- Play click SFX via `AudioManager.playSFX('click')`.
- Stop `SettingsScene`, resume `PauseScene`.
- ESC key also triggers back navigation.

Acceptance Criteria:
- Back button and ESC return to pause overlay correctly.
- No duplicate scenes created.