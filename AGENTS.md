# WynIsBuff2 - Codex AI Agent Instructions

This file provides project-specific instructions for Codex AI agents working on WynIsBuff2.
It complements the global configuration at ~/.codex/AGENTS.md.

## Project Overview

WynIsBuff2 is a Phaser 3 platformer game with:
- Feature-based modular architecture
- Event-driven communication system
- Rapier physics integration
- Automated asset generation pipeline
- Special birthday minigame for Wyn's 9th birthday

## Critical Development Rules

### Import Patterns (STRICT)
```javascript
// ✅ CORRECT - Use barrel exports and constants
import { PlayerController } from '@features/player';
import { AudioManager } from '@features/core';
import { SceneKeys } from '../constants/SceneKeys.js';
import { EventNames } from '../constants/EventNames.js';
import { ImageAssets, AudioAssets } from '../constants/Assets.js';

// ❌ WRONG - Never use direct imports or magic strings
import { PlayerController } from '../modules/player/PlayerController.js';
this.load.image('logo', 'images/ui/logo.png'); // NO!
```

### Architecture Conventions
1. All managers extend BaseManager for singleton pattern
2. Events follow namespace:action format (e.g., `player:jump`)
3. No magic strings - use generated constants from Assets.js
4. Feature modules have barrel exports at @features/*
5. Tests use CommonJS format (.cjs files)

## Build & Test Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Production build

# Asset Management  
npm run generate-assets  # Regenerate Assets.js from manifest.json
npm run validate-assets  # Check asset integrity

# Testing
npm test                 # Run all tests (CommonJS format)

# Quality Checks
npm run lint             # ESLint checking (if configured)
npm run typecheck        # TypeScript checking (if configured)
```

## Agent Workflow

### For Feature Development:
1. Check existing patterns in similar modules
2. Follow barrel export structure (@features/*)
3. Add events to EventNames.js
4. Update manifest.json for new assets
5. Run `npm run generate-assets`
6. Test with `npm test`

### For Bug Fixes:
1. Reproduce the issue first
2. Check event flow and manager states
3. Verify asset constants are used correctly
4. Test fix across different scenes
5. Run tests to ensure no regression

### For Performance Optimization:
1. Profile with Chrome DevTools
2. Check PhysicsManager for Rapier optimizations
3. Review event listener cleanup
4. Optimize asset loading in Preloader scene
5. Consider texture atlases for sprites

## Security & Best Practices

- Never commit API keys or secrets
- Use environment variables for configuration
- Follow existing code style (2 spaces, camelCase)
- Maintain test coverage for critical paths
- Document complex game mechanics

## Project-Specific Context

### Tech Stack:
- Phaser 3.88.2 (game framework)
- Rapier 0.14.0 (physics via PhysicsManager)
- Howler 2.2.4 (audio via AudioManager)
- Vite 5.4.19 (build tool)

### Key Directories:
- `src/constants/` - Generated and manual constants
- `src/core/` - Infrastructure and managers
- `src/features/` - Barrel exports for imports
- `src/modules/` - Implementation details
- `src/scenes/` - Phaser scene classes
- `assets/` - Game assets with manifest.json

### Agent Orchestration:
The project includes intelligent agent routing via AgentOrchestrator:
- architecture-guardian: Ensures pattern compliance
- game-physics-expert: Phaser/Rapier optimization
- game-design-innovator: Creative gameplay features

### Testing Approach:
- Unit tests for managers and controllers
- Integration tests for event flow
- Manual testing for gameplay feel
- CommonJS format required (.cjs extension)

## Codex Profile Recommendations

- **speed profile**: Quick fixes, asset updates, simple features
- **depth profile**: Architecture changes, complex physics, system design
- **agent profile**: CI/CD automation, batch operations

## Common Codex Commands for This Project

```bash
# Quick fixes
codex "fix the jump height constant"

# Feature development
codex --profile depth "implement wall-jump mechanic following existing patterns"

# Asset management
codex "add new coin sprite to assets and regenerate constants"

# Testing
codex "write tests for the new PowerUpManager"

# Performance
codex --profile depth "optimize collision detection in PhysicsManager"
```

## Integration with Claude Code

This project is compatible with both Codex and Claude Code. Both tools should:
1. Follow the same import patterns (@features/*)
2. Use generated constants from Assets.js
3. Extend BaseManager for new managers
4. Follow event naming conventions
5. Run tests before completing tasks

## Notes for AI Agents

- The project has strong conventions - follow existing patterns
- Always check CLAUDE.md for detailed architecture rules
- Run `npm run generate-assets` after modifying manifest.json
- Test changes across multiple scenes (MainMenu, Game, BirthdayMinigame)
- The birthday minigame is a special feature - handle with care