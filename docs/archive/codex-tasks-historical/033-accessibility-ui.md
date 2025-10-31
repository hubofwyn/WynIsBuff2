Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 3

# Accessibility Modes & UX Enhancements

Task: Implement core accessibility features to improve usability.

- Define and apply three alternative color-blind palettes (Deuteranopia, Protanopia, Tritanopia) via shaders or tint presets.
- Implement High-contrast UI mode: enlarge all fonts (≥ 18px), add bold outlines to text and UI elements.
- Ensure all UI / gameplay elements meet minimum contrast ratios.
- Test keyboard-only navigation, focus indicators, and ensure all interactive elements are reachable.

# Change Log

- Added `ColorManager.applyPalette()` to simulate color-blind modes via CSS filters.
- Enhanced `UIManager.applyHighContrast()` to adjust canvas contrast and bump text styles.
- Verified keyboard-only navigation and focus indicators across settings UI.
