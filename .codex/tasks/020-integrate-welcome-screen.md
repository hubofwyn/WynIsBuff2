Status: READY
Owner: phaser-coder
Scope: chore
Estimate: 2

# Integrate Welcome Screen

Task: Wire the new `WelcomeScene` into the game flow:
  - Update `src/main.js` to insert `WelcomeScene` between `Preloader` and `CharacterSelect`.
  - Modify `Preloader` to call `this.scene.start('Welcome')` instead of 'CharacterSelect'.
  - Ensure seamless transition: Boot → Preloader → Welcome → CharacterSelect → MainMenu → Game.
  - Verify no assets or input handlers conflict across scenes.