# WynIsBuff2 Project Documentation

## Overview

This documentation provides comprehensive information about the technologies, frameworks, and tools used in the WynIsBuff2 game project. It serves as a reference for developers working on the project.

## Documentation Organization

**Note**: As of October 28, 2025, AIProjectDocs content has been reorganized into topic-based directories under `docs/`. This README now serves as an index pointing to the new locations.

### Documentation Categories

**Architecture Documentation** → [docs/architecture/](../docs/architecture/)
- [ArchitecturalAssessment.md](../docs/architecture/ArchitecturalAssessment.md)
- [ArchitecturalOverview.md](../docs/architecture/ArchitecturalOverview.md)
- [ModularArchitecture.md](../docs/architecture/ModularArchitecture.md)
- [MVPArchitectureSummary.md](../docs/architecture/MVPArchitectureSummary.md)

**Technology Stack** → [docs/technology/](../docs/technology/)
- [PhaserFramework.md](../docs/technology/PhaserFramework.md)
- [RapierPhysics.md](../docs/technology/RapierPhysics.md)
- [ViteBuildTool.md](../docs/technology/ViteBuildTool.md)
- [TechnologiesAndPackages.md](../docs/technology/TechnologiesAndPackages.md)

**Core Systems** → [docs/systems/](../docs/systems/)
- [EventSystem.md](../docs/systems/EventSystem.md)
- [EventSystemImplementationSteps.md](../docs/systems/EventSystemImplementationSteps.md)
- [ModularPlayerController.md](../docs/systems/ModularPlayerController.md)
- [MovementSystem.md](../docs/systems/MovementSystem.md)
- [ModularLevelArchitecture.md](../docs/systems/ModularLevelArchitecture.md)
- [ModularLevelSystemImplementation.md](../docs/systems/ModularLevelSystemImplementation.md)
- [UIManager.md](../docs/systems/UIManager.md)

**Feature Implementations** → [docs/features/](../docs/features/)
- [TripleJumpRefinementPlan.md](../docs/features/TripleJumpRefinementPlan.md)
- [TripleJumpRefinementImplementation.md](../docs/features/TripleJumpRefinementImplementation.md)
- [LevelImplementationArchitecture.md](../docs/features/LevelImplementationArchitecture.md)
- [LevelImplementationSummary.md](../docs/features/LevelImplementationSummary.md)
- [LevelImplementationTasks.md](../docs/features/LevelImplementationTasks.md)

**Game Design & Art** → [docs/design/](../docs/design/)
- [GameDesignPrinciples.md](../docs/design/GameDesignPrinciples.md)
- [MVPLevelDesignGuide.md](../docs/design/MVPLevelDesignGuide.md)
- [SillyMechanicsIdeas.md](../docs/design/SillyMechanicsIdeas.md)
- [ArtStyleAndAssetPlan.md](../docs/design/ArtStyleAndAssetPlan.md)
- [AssetManagementStrategy.md](../docs/design/AssetManagementStrategy.md)
- [pixelart-style.md](../docs/design/pixelart-style.md)

**Historical Archive** → [docs/archive/aiprojectdocs-historical/](../docs/archive/aiprojectdocs-historical/)
- Superseded and historical documentation preserved for reference

### Navigation

For comprehensive documentation navigation, see [docs/INDEX.md](../docs/INDEX.md).

## Project Summary

**WynIsBuff2** is a 2D game built with the following core technologies:

- **Phaser 3.88.0**: HTML5 game framework providing the core game engine functionality
- **Rapier 0.14.0**: 2D physics engine for realistic physics simulations
- **Vite 5.3.1**: Modern build tool for fast development and optimized production builds

The game features a character that can move and perform triple jumps across platforms, with physics-based interactions powered by the Rapier physics engine.

## Getting Started

For complete development setup instructions, see [CONTRIBUTING.md](../CONTRIBUTING.md#-getting-started).

**Quick Start**:
```bash
npm install && npm run dev
```

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Detailed development workflow
- Architecture patterns and conventions
- Asset management and testing guidelines
- Migration guide for existing code

## Project Structure

```
/
├── assets/                  # Game assets
├── docs/                    # Project documentation
├── public/                  # Static files
├── src/                     # Source code
│   ├── main.js              # Entry point
│   └── scenes/              # Phaser scenes
├── vite/                    # Vite configuration
├── index.html               # HTML entry point
└── package.json             # Project metadata
```

## Additional Resources

- [Phaser Documentation](https://newdocs.phaser.io/docs/3.88.0)
- [Rapier Documentation](https://rapier.rs/docs/)
- [Vite Documentation](https://vitejs.dev/)