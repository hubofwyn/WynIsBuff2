Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 3

# Integrate Audio Playback on Game Events

Task: Hook up the AudioManager to play appropriate sounds for core gameplay and UI events.

- On player jump event (`EventNames.PLAYER_JUMP`), play `sfxJump`.
- On player land event (`EventNames.PLAYER_LAND`), play `sfxLand`, cycling through variant keys.
- On collectible collected event (`EventNames.COLLECTIBLE_COLLECTED`), play `sfxPickup`.
- For UI interactions:
  • Play `sfxClick` on button press/click events.
  • Play `sfxHover` on UI hover events.
- In `WelcomeScene` and `MainMenu`, start background music (`proteinPixelAnthem`) on scene start; loop indefinitely.
- In `Game` scene, switch to in-level music (`hyperBuffBlitz`) when level begins, and stop/transition on level complete.
- Ensure sound playback is debounced/throttled to avoid overlap on rapid events.

# Change Log

- Hooked `AudioManager` playback into core game events: `PLAYER_JUMP`, `PLAYER_LAND`, `COLLECTIBLE_COLLECTED`.
- Added `playSFX('hover')` and `playSFX('click')` on UI pointerover/down across all scenes (Welcome, MainMenu, CharacterSelect, GameOver, in-game continue button).
- Implemented background music transitions: `proteinPixelAnthem` on menus, switched to `hyperBuffBlitz` on game start.
