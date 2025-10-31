# Game Settings UI: Subtask Breakdown (Task 031)

This document outlines the bite-sized subtasks required to fully implement the in-game Settings UI (Task 031). Each subtask is numbered 031.x and covers a distinct piece of functionality, including missing aspects such as storage schema and default values.

## 031.1 SettingsScene Skeleton

- Create `src/scenes/SettingsScene.js` extending `Phaser.Scene` with:
  • constructor (scene key: `'Settings'`)
  • empty `create()` and `update()` methods
  • scene registration in `src/main.js` after `PauseScene`

Acceptance Criteria:

- `SettingsScene` can be launched without errors.
- Scene key `'Settings'` appears in the game config.

## 031.2 PauseScene Integration

- In `PauseScene` (src/scenes/PauseScene.js), add a third button labeled **Settings**:
  • Position it below the existing “Main Menu” button
  • Match style: `UIConfig.menuButton`, hover/click SFX
  • On pointerdown, call `this.scene.launch('Settings')` and keep `PauseScene` paused

Acceptance Criteria:

- “Settings” button appears in the pause overlay
- Clicking it opens `SettingsScene` without closing `PauseScene`

## 031.3 SettingsPanel Layout

- In `SettingsScene.create()`:
  • Draw full-screen semi-transparent overlay
  • Render centered panel rectangle using `UIConfig.panel`
  • Add title text “Settings” with `UIConfig.text.title`
  • Add a **Back** button to return to `PauseScene`

Acceptance Criteria:

- Overlay and panel display correctly
- **Back** button returns to pause overlay

## 031.4 Volume Controls (Sliders)

- Three controls: Master, Music, SFX
  • Each with label, current percentage (0–100%), and “−”/“+” buttons in 5% increments
  • Hook events to call:
    - `AudioManager.getInstance().setMasterVolume(value)`
    - `AudioManager.getInstance().setMusicVolume(value)`
    - `AudioManager.getInstance().setSFXVolume(value)`
      • Default values: Master 80%, Music 70%, SFX 90%
      • Persist values via `GameStateManager.saveSettings({ volumes })`

Acceptance Criteria:

- Adjusting controls immediately changes audio levels
- Settings persist after scene exit and page reload

## 031.5 Keybinding Remapping

- For actions: Jump, Move Left, Move Right, Pause
  • Display current key (e.g. “SPACE”, “A”, “D”, “ESC”)
  • On click, enter “listening” mode and capture next key/code
  • Update `InputManager` mapping dynamically
  • Persist via `GameStateManager.saveSettings({ keybindings })`
  • Reject duplicate assignments

Acceptance Criteria:

- New key assignments take effect immediately
- Cannot bind the same key to multiple actions
- Persisted on reload

## 031.6 Graphics Quality Dropdown

- Control with three options: Low, Medium, High
  • A left/right arrow or dropdown selector
  • On change, call:
    - `ParticleManager.setQuality(level)` (affects particle count)
    - `CameraManager.setQuality(level)` (affects bloom/intensity)
      • Persist via `GameStateManager.saveSettings({ graphicsQuality })`

Acceptance Criteria:

- Switching quality updates effects in real time
- Setting stored and reapplied on scene entry

## 031.7 Accessibility Toggles

- Three toggles:
  • Color-blind palette (options: Off, Deuteranopia, Protanopia, Tritanopia)
  • High-contrast UI mode (boolean)
  • Subtitle captions for SFX events (boolean)
- On change, apply immediately:
  • `ColorManager.applyPalette(type)`
  • `UIManager.applyHighContrast()`
  • `UIManager.showSubtitles(enable)`
- Persist via `GameStateManager.saveSettings({ accessibility })`

Acceptance Criteria:

- Toggling options visually updates game/UI
- Subtitles overlay for sound events if enabled

## 031.8 Input & Navigation Support

- Ensure UI is navigable via:
  • Mouse/touch (pointer interactions)
  • Keyboard (Tab to focus, Arrow keys/Enter to change values)
  • Gamepad (D-pad/A button navigation)
- Implement focus highlight using `.setInteractive()` and `scene.input.keyboard.on('keydown')`

Acceptance Criteria:

- All controls reachable without mouse
- Visual focus indicator present

## 031.9 Settings Persistence & Load

- Extend `GameStateManager`:
  • `saveSettings(settings: object)`
  • `loadSettings(): object`
  • Default schema:
    ```json
    {
        "volumes": { "master": 0.8, "music": 0.7, "sfx": 0.9 },
        "keybindings": { "jump": "SPACE", "left": "A", "right": "D", "pause": "ESC" },
        "graphicsQuality": "Medium",
        "accessibility": { "palette": "Off", "highContrast": false, "subtitles": false }
    }
    ```
- Load and apply these settings in `Preloader.create()` or at game start

Acceptance Criteria:

- Settings automatically applied on new sessions

## 031.10 Back Navigation & Exit

- “Back” button in `SettingsScene`:
  • On click or ESC key, play SFX, stop `SettingsScene`, resume `PauseScene`
- Ensure no duplicate scenes running

Acceptance Criteria:

- Consistent return flow to pause overlay

## 031.11 Testing & QA

- Write unit/integration tests for:
  • Volume adjustments
  • Key remapping logic
  • Dropdown/toggle behavior
  • Persistence layer (`GameStateManager`)
  – Manual test plan: walkthrough on desktop/tablet + gamepad

---

_End of Task 031 subtask breakdown._
