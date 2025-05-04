Status: READY
Owner: phaser-coder
Scope: feature
Estimate: 3

# Common Theme Styles

Task: Create and apply a shared theme configuration for colors, fonts, and UI styles across scenes.
  - Add `src/constants/UIConfig.js` exporting shared style constants (font sizes, colors, stroke settings, spacing).
  - Refactor `WelcomeScene`, `CharacterSelectScene`, `MainMenu`, and `GameOver` to use `UIConfig` values for text and UI elements.
  - Ensure consistent font families, sizes, colors, and button hover effects.
  - Run through each scene to replace hard-coded style objects with references to `UIConfig`.