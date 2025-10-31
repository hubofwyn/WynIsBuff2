Status: DONE
Owner: phaser-coder
Scope: chore
Estimate: 2

# Integrate CharacterSelectScene

Task: Wire `CharacterSelectScene` into the game flow:

- Update `src/main.js` scene list to insert 'CharacterSelect' after 'Preloader':
  [Boot, Preloader, CharacterSelect, MainMenu, Game, GameOver]
- Ensure Preloader completes before switching to CharacterSelect.
- Update scene transitions: Boot → Preloader → CharacterSelect → MainMenu.
- Adjust camera and UI fade-ins as needed for smooth transition.
    > Archived Notice: This historical task is preserved for reference and superseded by the current documentation set. Start at docs/INDEX.md for canonical guidance. Related: CONTRIBUTING.md, docs/ARCHITECTURE.md, ASSET_MANAGEMENT.md.
