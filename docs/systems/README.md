# Core Systems Documentation

Documentation for WynIsBuff2's core game systems and their implementations.

## Contents

| Document | Purpose |
|----------|---------|
| [EventSystem.md](./EventSystem.md) | Event system architecture and patterns |
| [EventSystemImplementationSteps.md](./EventSystemImplementationSteps.md) | Event system implementation guide |
| [ModularPlayerController.md](./ModularPlayerController.md) | Player controller design and structure |
| [MovementSystem.md](./MovementSystem.md) | Movement mechanics and implementation |
| [ModularLevelArchitecture.md](./ModularLevelArchitecture.md) | Level system architecture and design |
| [ModularLevelSystemImplementation.md](./ModularLevelSystemImplementation.md) | Level system implementation details |
| [UIManager.md](./UIManager.md) | UI management system |

## System Overview

### Event System
Centralized event bus enabling decoupled communication between game systems using namespaced events (`namespace:action` format).

### Player Controller
Modular controller managing player input, movement, jumping, collision detection, and visual effects. Organized into specialized sub-controllers.

### Movement System
Enhanced movement mechanics with responsive controls, gravity, velocity, and physics integration through PhysicsManager.

### Level System
Modular level loading and management with support for dynamic level transitions, collectibles, and platform configurations.

### UI System
Centralized UI management for menus, HUD, overlays, and in-game interfaces using Phaser's scene system.

## Key Patterns

### Manager Pattern
Systems extend `BaseManager` for consistent initialization and singleton behavior.

### Event-Driven Architecture
Systems communicate via EventBus rather than direct references.

### Separation of Concerns
Each system handles a specific domain with minimal coupling to other systems.

## Related Documentation

- [../architecture/](../architecture/) - Architectural patterns
- [../features/](../features/) - Specific feature implementations
- [../INDEX.md](../INDEX.md) - Full documentation index
