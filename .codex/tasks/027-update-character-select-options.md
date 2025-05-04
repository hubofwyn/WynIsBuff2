Status: READY
Owner: phaser-coder
Scope: feature
Estimate: 2

# Update Character Selection Options

Task: Modify `CharacterSelectScene` to present the three playable characters:
  - Update options array in `src/scenes/CharacterSelect.js` to include:
      • `{ key: 'ila_sprite', label: 'Favorite Sister' }`
      • `{ key: 'axel_sprite', label: 'Not Buff Axel' }`
      • `{ key: 'wyn_sprite', label: 'Wyn the Buff' }`
  - Ensure images use these keys and set appropriate display sizes.
  - Remove or archive prior placeholder options (`axelface`, `wynface`) from selection.