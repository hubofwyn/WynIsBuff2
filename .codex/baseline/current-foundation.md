# WynIsBuff2 — Architecture & Baseline (v1.0)

1. Project Context & Goals
   * WynIsBuff2 is a browser-based 2D platformer built on Phaser 3 and Rapier 2D physics.
   * Demonstrates agile, triple-jump mechanics (single→double→triple jump).
   * Emphasizes modular, event-driven architecture for scalability and maintainability.
   * Visual flair via particle effects, screen shake, and color transitions.

2. High-Level Architecture
   * EntryPoint: src/main.js initializes Phaser.Game with Scenes: Boot, Preloader, MainMenu, Game, GameOver.
   * Scenes: handle lifecycle, asset loading, menu, gameplay, and game-over flow.
   * Modules (src/modules):
     * EventSystem: pub/sub central bus.
     * PhysicsManager: Rapier world setup and simulation.
     * LevelManager: level data loading (LevelData), platform and trigger setup.
     * UIManager: HUD and in-game instructions.
     * PlayerControllers: JumpController, MovementController, CollisionController coordinate player behavior.
     * Effect Managers: ParticleManager, CameraManager, ColorManager for visual feedback.

3. Critical Invariants
   Refer to invariants.yml for machine-readable details. Key invariants include:
   * INV-001: Dev server port = 8080 (vite/config.dev.mjs:15)
   * INV-002: Production build minification = terser with passes = 2 (vite/config.prod.mjs)
   * INV-003: Manual chunk “phaser” isolated in rollup (vite/config.dev.mjs:8)
   * INV-004: Game resolution = 1024×768 (src/main.js:11-12)
   * INV-005: Background color = #028af8 (src/main.js:14)
   * INV-006: Phaser version = ^3.88.0 (package.json)
   * INV-007: Rapier version = ^0.14.0 (package.json)
   * INV-008: Module and scene directories fixed under src/modules and src/scenes.
   * INV-009: Scale mode = FIT and autoCenter = CENTER_BOTH (src/main.js:16-17)
   * INV-010: Control mapping (WASD/Arrows + SPACE + ESC) (README.md: “Controls of Ultimate Buffness”)

4. Coding Standards & Conventions
   * Language: JavaScript ES6+ in ESM mode (package.json "type": "module").
   * Formatter: Prettier (default settings); Linter: ESLint recommended (eslint:recommended).
   * Consistent 2-space indentation, semicolons enabled, double quotes by default.
   * Module imports via relative paths; no global mutations.
   * No console.debug/log in production; use PLAY_SOUND events for audio.

5. Directory & Naming Rules

   ```text
   WynIsBuff2/
   ├── assets/          # Raw and processed images & sprites
   ├── src/
   │   ├── main.js      # Phaser entrypoint + config
   │   ├── scenes/      # Phaser.Scene subclasses
   │   ├── modules/     # Core game logic and managers
   │   └── constants/   # Static data (EventNames, LevelData)
   ├── AIProjectDocs/   # Design & architecture docs
   ├── docs/            # Asset guidelines
   ├── tests/           # Manual test pages (particle-test.html)
   └── vite/            # Build configurations
   ```

   * File names: PascalCase for classes, camelCase for instances and functions, UPPER_SNAKE for constants.

6. Dependency Contract
   * phaser: ^3.88.0 — rendering & core game framework.
   * @dimforge/rapier2d-compat: ^0.14.0 — 2D physics engine.
   * vite: ^5.3.1 — development server & bundler.
   * terser: ^5.31.0 — JS minification.

7. Open Questions / TODOs
   * No explicit ESLint or Prettier config in repo — consider adding for team alignment.
   * Automated test runner absent — tests folder holds manual HTML only.
   * Versioning strategy (semantic releases) not defined.
   * Consider typing (TypeScript) for stronger invariants.
