Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 3

# Common Theme Styles

Task: Create and apply a shared theme configuration for colors, fonts, and UI styles across scenes.
  - Add `src/constants/UIConfig.js` exporting shared style constants (font sizes, colors, stroke settings, spacing).
  - Refactor `WelcomeScene`, `CharacterSelectScene`, `MainMenu`, and `GameOver` to use `UIConfig` values for text and UI elements.
  - Ensure consistent font families, sizes, colors, and button hover effects.
  - Run through each scene to replace hard-coded style objects with references to `UIConfig`.
  
## Change Log
- Extended `UIConfig.text` with presets: title, subtitle, heading, label, stats, button, message.
- Updated `WelcomeScene` to use `UIConfig.text.title` and `UIConfig.text.subtitle`.
- Updated `CharacterSelectScene` to use `UIConfig.text.heading` and `UIConfig.text.label`.
- Updated `MainMenu` to use `UIConfig.text.heading` for the game title.
- Updated `GameOver` to use `UIConfig.text.title`, `UIConfig.text.stats`, `UIConfig.text.message`, and `UIConfig.text.button`.