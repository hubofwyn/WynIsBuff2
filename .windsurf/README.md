# Windsurf Configuration for WynIsBuff2

This directory contains Windsurf and Cascade AI configuration optimized for the WynIsBuff2 project.

## Configuration Files

### Core Configuration

- **`cascade.json`** - Main Cascade configuration with project metadata, patterns, workflows, and validation rules
- **`.windsurfignore`** - Files and directories to exclude from AI analysis/modification (in project root)

### Rule Files

- **`workspace-rules.md`** - Global workspace rules applying to all files
- **`rules-scenes.md`** - File-scoped rules for `src/scenes/**/*.js`
- **`rules-modules.md`** - File-scoped rules for `src/modules/**/*.js`
- **`rules-core.md`** - File-scoped rules for `src/core/**/*.js`
- **`rules-constants.md`** - File-scoped rules for `src/constants/**/*.js`

## How It Works

### Rule Hierarchy

1. **Global Rules** (from user settings) - Apply everywhere
2. **Workspace Rules** (`workspace-rules.md`) - Apply to entire project
3. **File-Scoped Rules** - Apply to specific file patterns (most specific wins)

### File-Scoped Rule Matching

When Cascade works on a file, it automatically loads the most specific rules:

```
src/scenes/GameScene.js       → workspace-rules.md + rules-scenes.md
src/modules/player/Player.js  → workspace-rules.md + rules-modules.md
src/core/PhysicsManager.js    → workspace-rules.md + rules-core.md
src/constants/EventNames.js   → workspace-rules.md + rules-constants.md
```

## Key Features

### 1. Architecture Enforcement

The configuration enforces WynIsBuff2's critical patterns:

- **Barrel exports** - Import from `@features/*`, never from `../modules/*`
- **Vendor abstraction** - Only `src/core/` imports vendors (Phaser, Rapier, Howler)
- **Generated constants** - Use `ImageAssets.*`, `SceneKeys.*`, `EventNames.*`
- **Singleton managers** - Extend `BaseManager` with proper initialization
- **Event-driven** - Use `EventBus` with namespaced events
- **Structured logging** - Use `LOG.*` from `@observability`, never `console.*`

### 2. Context Awareness

Cascade automatically includes relevant context:

- **Always included**: `CLAUDE.md`, `AGENTS.md`, `package.json`, constants files
- **Documentation**: Architecture, contributing, debugging guides
- **File-specific**: Rules matching the file being edited

### 3. Workflow Automation

Pre-configured workflows for common tasks:

```bash
# Before commit
bun run lint && bun run test && bun run arch:health

# After asset changes
bun run generate-assets && bun run validate-assets

# Before deploy
bun run lint && bun run test && bun run arch:check && bun run build
```

### 4. Pattern Recognition

Cascade knows about project patterns:

- **Import patterns** - Barrel exports, constants, vendor abstraction
- **Logging patterns** - Structured logging with subsystems
- **Manager patterns** - Singleton with BaseManager
- **Event patterns** - Namespaced events via EventNames

### 5. Agent Routing

Intelligent routing to specialized agents:

- **architecture-guardian** - Architecture, patterns, boundaries
- **game-physics-expert** - Physics, Rapier, collision, movement
- **game-design-innovator** - Gameplay, mechanics, features

## Usage Examples

### Working on a Scene

When editing `src/scenes/GameScene.js`, Cascade will:
1. Load workspace rules (architecture patterns, commands, workflows)
2. Load scene-specific rules (BaseScene usage, asset loading, cleanup)
3. Enforce: Use `BaseScene`, `SceneKeys.*`, structured logging
4. Suggest: Proper event emission, cleanup in shutdown

### Working on a Module

When editing `src/modules/player/PlayerController.js`, Cascade will:
1. Load workspace rules
2. Load module-specific rules (no vendor imports, manager pattern)
3. Enforce: Use `@features/core` abstractions, `EventNames.*`
4. Suggest: Proper singleton pattern, event communication

### Adding Assets

When updating `/assets/manifest.json`, Cascade will:
1. Recognize asset workflow
2. Suggest running `bun run generate-assets`
3. Remind to use generated constants
4. Validate with `bun run validate-assets`

### Fixing Bugs

Cascade will:
1. Check event flow and manager states
2. Verify constants usage
3. Add structured logging for debugging
4. Test across scenes
5. Run regression tests

## Validation

The configuration includes validation rules:

### Pre-Commit Checks
- ✓ No magic strings
- ✓ No direct vendor imports (outside `src/core/`)
- ✓ No `console.*` usage
- ✓ Barrel imports used correctly

### Architecture Checks
- ✓ Vendor abstraction enforced
- ✓ Barrel exports enforced
- ✓ Constants enforced
- ✓ Structured logging enforced

## Ignored Files

The following are excluded from AI modification:

- **Generated files**: `src/constants/Assets.js`
- **Dependencies**: `node_modules/`, lock files
- **Build outputs**: `dist/`, `build/`
- **Binary assets**: Images, audio files (reference only)
- **Session notes**: `SESSION_*.md`, `*_COMPLETE.md`
- **Architecture snapshots**: `STATUS-*.json`

See `.windsurfignore` for complete list.

## Commands Reference

Quick access to project commands:

```bash
# Development
bun run dev              # Start dev server
bun run build            # Production build

# Assets
bun run generate-assets  # Regenerate Assets.js
bun run validate-assets  # Validate assets

# Testing
bun run test             # Run tests

# Quality
bun run lint             # Lint code
bun run format           # Format code
bun run arch:health      # Architecture health check
bun run arch:validate    # Validate architecture
```

## Customization

### Adding New File-Scoped Rules

1. Create new rule file: `.windsurf/rules-yourpattern.md`
2. Add to `cascade.json`:
```json
{
  "pattern": "src/yourdir/**/*.js",
  "rules": ".windsurf/rules-yourpattern.md"
}
```

### Updating Workflows

Edit `cascade.json` workflows section:
```json
"workflows": {
  "yourWorkflow": [
    "command1",
    "command2"
  ]
}
```

### Adding Context

Edit `cascade.json` context section:
```json
"context": {
  "alwaysInclude": [
    "your-important-file.md"
  ]
}
```

## Troubleshooting

### Cascade Not Following Rules

1. Check file matches pattern in `cascade.json`
2. Verify rule file exists and is readable
3. Check for conflicting rules
4. Restart Windsurf to reload configuration

### Schema Warning in cascade.json

The schema URL warning is expected - it's a placeholder for future validation. The JSON is valid and works correctly.

### Rules Not Applying

1. Ensure file is not in `.windsurfignore`
2. Check rule file syntax (valid Markdown)
3. Verify pattern matching in `cascade.json`

## Maintenance

### Regular Updates

- Review and update rules as architecture evolves
- Add new patterns as they emerge
- Update workflows for new processes
- Keep documentation references current

### Rule Pruning

Periodically review rules to:
- Remove outdated patterns
- Consolidate duplicate rules
- Move project-specific rules to workspace rules
- Keep file-scoped rules focused

## Documentation

For more information:

- **Architecture**: `../CLAUDE.md`, `../docs/ARCHITECTURE.md`
- **Contributing**: `../CONTRIBUTING.md`
- **Agent System**: `../AGENTS.md`
- **Debugging**: `../docs/guides/DEBUGGING.md`

---

**Last Updated**: 2025-01-02  
**Version**: 1.0  
**Maintainer**: WynIsBuff2 Team
