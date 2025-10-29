# Technology Stack Documentation

Documentation for the core technologies and frameworks used in WynIsBuff2.

## Contents

| Document | Purpose |
|----------|---------|
| [PhaserFramework.md](./PhaserFramework.md) | Phaser 3 game framework integration and usage |
| [RapierPhysics.md](./RapierPhysics.md) | Rapier 2D physics engine integration |
| [ViteBuildTool.md](./ViteBuildTool.md) | Vite build tool configuration and workflow |
| [TechnologiesAndPackages.md](./TechnologiesAndPackages.md) | Complete tech stack overview and package list |

## Tech Stack Overview

### Core Technologies

- **Phaser 3.88.2**: HTML5 game framework
- **Rapier 0.14.0**: 2D physics engine (via PhysicsManager)
- **Howler 2.2.4**: Audio management (via AudioManager)
- **Vite 5.4.19**: Build tool with custom configs

### Development Tools

- **Node.js**: Development environment
- **npm**: Package management
- **Git**: Version control

## Quick Reference

### Development Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm test                 # Run tests
npm run generate-assets  # Regenerate asset constants
```

### Key Integrations

- **PhysicsManager**: Singleton wrapper for Rapier physics
- **AudioManager**: Singleton wrapper for Howler audio
- **AssetLoader**: Handles Phaser asset loading with manifest

## Related Documentation

- [../architecture/](../architecture/) - Architectural patterns
- [../systems/](../systems/) - System implementations
- [../INDEX.md](../INDEX.md) - Full documentation index
