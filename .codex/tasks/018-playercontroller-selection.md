Status: READY
Owner: phaser-coder
Scope: feature
Estimate: 3

# PlayerController Character Key Injection

Task: Modify `PlayerController` and `Game` scene to use the selected character key:
  - In `Game` scene's `create()`, retrieve `selectedCharacter` from `GameStateManager`.
  - Pass this value as an additional constructor argument to `PlayerController`.
  - Update `PlayerController.create()` to use `this.textureKey` instead of hard-coded `'player'` when spawning the sprite.
  - Ensure fallback to default sprite if key not found.