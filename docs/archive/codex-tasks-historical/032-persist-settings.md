Status: READY
Owner: phaser-coder
Scope: chore
Estimate: 2

# Persist Settings & Schema Versioning

Task: Extend `GameStateManager` to store and migrate settings with version control.

- Add `settings` object to the saved JSON blob under a new `schemaVersion` key.
- Store user preferences: volume levels, keybindings, graphics quality, palette mode, high-contrast flag, subtitle captions.
- On initialization, detect `schemaVersion` mismatch and migrate existing settings or reset to defaults.
- Expose methods: `saveSettings()`, `loadSettings()`, `resetSettings()`.

# Change Log

_TBD after implementation._
