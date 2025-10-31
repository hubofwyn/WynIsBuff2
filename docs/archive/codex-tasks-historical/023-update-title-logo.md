Status: DONE
Owner: phaser-coder
Scope: chore
Estimate: 1

# Update Game Title and Logo

Task: Replace any default 'Phaser' branding and text with game-specific assets/text.

- Ensure the game title displayed in WelcomeScene, MainMenu, and GameOver scenes uses the official WynIsBuff2 logo or stylized text.
- Import and preload a custom logo image (e.g., `assets/images/ui/wynisbuff2-logo.png`).
- Update scene code to display this logo instead of the Phaser logo or default text.
- Verify scaling, positioning, and legibility across scenes.

## Change Log

- Preloader loads custom WynIsBuff2 logo from `assets/images/ui/wynisbuff2-logo.png` under key `logo`.
- WelcomeScene and MainMenu now use `logo` image for branding.
- GameOver scene displays the logo above the 'Game Complete!' title when available.
