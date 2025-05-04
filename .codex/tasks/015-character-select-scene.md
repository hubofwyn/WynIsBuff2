Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 4

# Character Selection Scene

Task: Create `CharacterSelectScene` to allow players to choose between default and Wyn face.
  - Add `src/scenes/CharacterSelect.js` subclassing `Phaser.Scene` with keys:
      scene key: 'CharacterSelect'
      methods: constructor, preload, create, update
  - In `preload()`, ensure loading of 'axelface' and 'wynface' assets.
  - In `create()`, display both sprites side-by-side with labels and make interactive:
      • On pointerover, highlight selection
      • On pointerdown, store chosen key and start 'MainMenu' or next scene
  - Dispatch selection via `EventSystem.emit(EventNames.SELECT_CHARACTER, { key })`, or store via `GameStateManager`.
  - Include a “Confirm” button if desired, allowing deselection and reconfirm.