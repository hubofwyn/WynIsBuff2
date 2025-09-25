Phaser 4 Sandbox (Planning Stub)

Purpose
- Host a minimal Phaser 4 playground for staged migration testing (per rapier-plus-phaser4.md).
- Keep this folder self-contained and optional. If Phaser 4 is not installed, code will no-op gracefully.

Usage
- Install Phaser 4 in a sandbox branch or locally (not required for CI):
  - bun add phaser@next
- Run the sandbox:
  - bun sandbox/phaser4/main.js

Notes
- This is a planning stub. The game remains on Phaser 3 for now.
- Tests skip if Phaser 4 is not available.

