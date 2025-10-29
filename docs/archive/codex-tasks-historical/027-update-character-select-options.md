Status: DONE
Owner: phaser-coder
Scope: feature
Estimate: 2

# Update Character Selection Options

# Task: Modify `CharacterSelectScene` to present the three playable characters:
#   - Updated options in `CharacterSelect.js` to:
#       • `ila_sprite` → Favorite Sister
#       • `axel_sprite` → Not Buff Axel
#       • `wyn_sprite` → Wyn the Buff
#   - Ensured sprites use new keys with `setDisplaySize(128,128)`.
#   - Removed placeholder options (`axelface`, `wynface`).
## Change Log
- Replaced placeholder options with `{ key: 'ila_sprite', label: 'Favorite Sister' }`, `{ key: 'axel_sprite', label: 'Not Buff Axel' }`, and `{ key: 'wyn_sprite', label: 'Wyn the Buff' }` in `CharacterSelect.js`.