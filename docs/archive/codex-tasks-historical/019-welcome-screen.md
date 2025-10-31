Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 4

# Welcome Screen Scene

Task: Create a branded Welcome Screen to kick off the game.

- Add `src/scenes/WelcomeScene.js` extending `Phaser.Scene` with:
  • constructor (key: 'Welcome')
  • preload(): ensure any welcome assets (logo, background) are loaded or rely on Preloader's cache
  • create(): display game title, subtitle/tagline, and a “Press SPACE to start” prompt
  • update(): listen for SPACE (or click/tap) to transition to 'CharacterSelect'
- Use `GameStateManager` to reset any previous state if needed.
- Apply WynIsBuff2 branding: bold fonts, neon glow, theme colors defined in UIConfig.

## Change Log

- WelcomeScene implemented and wired: displays title, prompt, and transitions to CharacterSelect on SPACE or click.
    > Archived Notice: This historical task is preserved for reference and superseded by the current documentation set. Start at docs/INDEX.md for canonical guidance. Related: CONTRIBUTING.md, docs/ARCHITECTURE.md, ASSET_MANAGEMENT.md.
