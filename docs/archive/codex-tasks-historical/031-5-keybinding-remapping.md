Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 3

# Keybinding Remapping (031-5)

Task: Add remapping controls for Jump, Move Left, Move Right, and Pause:

- Display current key mapping (e.g. “SPACE”, “A”, “D”, “ESC”).
- On click: enter listening mode and capture next key press.
- Update `InputManager` bindings in real time.
- Prevent duplicate key assignments.
- Persist via `GameStateManager.saveSettings({ keybindings })`.

Acceptance Criteria:

- New bindings take effect immediately.
- No two actions share the same key.
- Bindings persist across game reloads.
    > Archived Notice: This historical task is preserved for reference and superseded by the current documentation set. Start at docs/INDEX.md for canonical guidance. Related: CONTRIBUTING.md, docs/ARCHITECTURE.md, ASSET_MANAGEMENT.md.
