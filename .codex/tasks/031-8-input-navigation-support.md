Status: DONE
Owner: phaser-coder
Scope: chore
Estimate: 2

# Input & Navigation Support (031-8)

Task: Ensure `SettingsScene` UI supports:
- Mouse/touch pointer interactions (via `.setInteractive()`).
- Keyboard navigation:
  • TAB/Shift+TAB to cycle focus.
  • ENTER/SPACE to activate focused control.
  • LEFT/RIGHT arrows for `<`/`>` adjustments.
- Gamepad navigation:
  • D-pad UP/DOWN to move focus.
  • D-pad LEFT/RIGHT to adjust values.
  • A button to activate focused control.
- Visual focus indicator via background-color highlight.

Acceptance Criteria:
- All controls reachable via mouse, keyboard, and gamepad.
- Focus highlight indicates the active element.