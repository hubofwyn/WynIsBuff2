# WynIsBuff2 Project Documentation

## Overview

This documentation provides comprehensive information about the technologies, frameworks, and tools used in the WynIsBuff2 game project. It serves as a reference for developers working on the project.

## Documentation Organization

**Note**: As of October 28, 2025, AIProjectDocs content has been reorganized into topic-based directories under `docs/`. This README now serves as an index pointing to the new locations.

### Documentation Categories

- Architecture Documentation → docs/architecture/README.md
  - ArchitecturalAssessment.md, ArchitecturalOverview.md, ModularArchitecture.md, MVPArchitectureSummary.md

- Technology Stack → docs/technology/README.md
  - PhaserFramework.md, RapierPhysics.md, ViteBuildTool.md, TechnologiesAndPackages.md

- Core Systems → docs/systems/README.md
  - EventSystem.md, EventSystemImplementationSteps.md, ModularPlayerController.md, MovementSystem.md, ModularLevelArchitecture.md, ModularLevelSystemImplementation.md, UIManager.md

- Feature Implementations → docs/features/README.md
  - TripleJumpRefinementPlan.md, TripleJumpRefinementImplementation.md, LevelImplementationArchitecture.md, LevelImplementationSummary.md, LevelImplementationTasks.md

- Game Design & Art → docs/design/README.md
  - GameDesignPrinciples.md, MVPLevelDesignGuide.md, SillyMechanicsIdeas.md, ArtStyleAndAssetPlan.md, AssetManagementStrategy.md, pixelart-style.md

- Historical Archive → docs/archive/aiprojectdocs-historical/README.md
  - Superseded and historical documentation preserved for reference

### Navigation

For comprehensive documentation navigation, see docs/INDEX.md

## Project Summary

**WynIsBuff2** is a 2D game built with the following core technologies:

- **Phaser 3.90.x**: HTML5 game framework providing the core game engine functionality
- **Rapier 0.17.x**: 2D physics engine for realistic physics simulations
- **Vite 7.x**: Modern build tool for fast development and optimized production builds

The game features a character that can move and perform triple jumps across platforms, with physics-based interactions powered by the Rapier physics engine.

## Getting Started

For complete development setup instructions, see [CONTRIBUTING.md](../CONTRIBUTING.md#getting-started).

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

```text
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

- [Phaser Documentation](https://newdocs.phaser.io/docs/3.90.0)
- [Rapier Documentation](https://rapier.rs/docs/)
- [Vite Documentation](https://vitejs.dev/)
