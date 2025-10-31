Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 2

# Persist Character Selection

Task: Extend `GameStateManager` to store and retrieve selected character:

- Add methods `setSelectedCharacter(key: string)` and `getSelectedCharacter(): string`.
- Store `selectedCharacter` in-memory or in localStorage under key `'selectedCharacter'`.
- On initialization, load persisted value if present, defaulting to `'axelface'`.
- Expose selection to scenes via `GameStateManager` API.
