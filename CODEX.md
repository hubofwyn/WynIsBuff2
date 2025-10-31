# WynIsBuff2 - Project Codex

## Overview

WynIsBuff2 is a 2D platformer game built with Phaser and the Rapier physics engine. This document serves as the central reference point for project-level guidance and development standards.

## Project Structure

- `src/` - Source code for the game
    - `scenes/` - Phaser scenes
    - `modules/` - Game modules (player, enemies, level, etc.)
    - `constants/` - Game constants and configuration
- `assets/` - Game assets (images, sounds, etc.)
- `docs/` - Project documentation
- `AIProjectDocs/` - AI-generated documentation
- `tests/` - Test files
- `.codex/` - Codex configuration files

## Development Guidelines

### Game Design Principles

1. **Responsive Controls** - Player movement should feel tight and responsive
2. **Progressive Difficulty** - Levels should gradually increase in difficulty
3. **Rewarding Exploration** - Hidden collectibles and secrets should reward exploration
4. **Visual Feedback** - Clear visual feedback for player actions and game events

### Coding Standards

1. Follow the project's established architecture and patterns
2. Maintain modular code organization
3. Document all public APIs and complex logic
4. Write tests for critical game functionality

## Codex Usage

The codex system helps maintain project consistency and alignment with established architecture. To use the codex:

1. Run `./run-codex` to start a new session (simplified launcher)
2. If you encounter model access issues, try one of these alternative launchers:
    - `./run-codex-gpt4o` - Uses the gpt-4o model
    - `./run-codex-gpt4` - Uses the gpt-4 model
    - `./run-codex-allowed [model]` - Uses models from the allowed list
3. Work on tasks marked as READY in the `.codex/tasks/` directory
4. Update task status when complete

The scripts automatically use this CODEX.md file for project-level guidance.

### Allowed Models

The following models are allowed in the OpenAI platform settings:

- gpt-4.1
- gpt-4o-realtime-preview-2024-12-17
- chatgpt-4o-latest
- o4-mini
- gpt-4
- o3-mini
- gpt-4o
- gpt-4-turbo
- gpt-4.1-2025-04-14

### Known Issues

- When trying to use o4-mini, the codex client attempts to use a specific dated version (o4-mini-2025-04-16) which may not be accessible
- When using chatgpt-4o-latest, you may encounter an error that functions are not supported with that model
- The gpt-4o and gpt-4 models should work correctly with functions

## Roles

- `game-architect` - High-level architecture and systems design
- `phaser-coder` - Day-to-day feature implementation
- `game-designer` - Gameplay mechanics and level design
- `physics-expert` - Physics system tuning and optimization

## Version Control

- Keep PRs under 400 lines of code unless approved by the architect
- Include a Test Plan in commit messages
- Run linting and tests before pushing changes

## Resources

- [Phaser Documentation](https://phaser.io/docs)
- [Rapier Physics Documentation](https://rapier.rs/docs/)
- Project-specific documentation in the `docs/` and `AIProjectDocs/` directories
