# WynIsBuff2 Project Documentation

## Overview

This documentation provides comprehensive information about the technologies, frameworks, and tools used in the WynIsBuff2 game project. It serves as a reference for developers working on the project.

## Documentation Files

| File | Description |
|------|-------------|
| [TechnologiesAndPackages.md](./TechnologiesAndPackages.md) | Overview of all technologies and packages used in the project, including versions and project structure |
| [PhaserFramework.md](./PhaserFramework.md) | Detailed documentation on the Phaser game framework, its core concepts, and implementation in this project |
| [RapierPhysics.md](./RapierPhysics.md) | In-depth guide to the Rapier physics engine integration, including initialization, rigid bodies, and collision detection |
| [ViteBuildTool.md](./ViteBuildTool.md) | Information about the Vite build tool, configuration, and build process for development and production |
| [MovementSystem.md](./MovementSystem.md) | Comprehensive documentation of the player movement system, including recent improvements, implementation details, and lessons learned |
| [ModularArchitecture.md](./ModularArchitecture.md) | Documentation of the modular architecture implemented in the game, including module structure, integration with Phaser, and best practices |

## Project Summary

**WynIsBuff2** is a 2D game built with the following core technologies:

- **Phaser 3.88.0**: HTML5 game framework providing the core game engine functionality
- **Rapier 0.14.0**: 2D physics engine for realistic physics simulations
- **Vite 5.3.1**: Modern build tool for fast development and optimized production builds

The game features a character that can move and perform triple jumps across platforms, with physics-based interactions powered by the Rapier physics engine.

## Getting Started

To run the project locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will run on http://localhost:8080 by default.

To build for production:

```bash
# Create production build
npm run build
```

The production build will be created in the `dist` folder.

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