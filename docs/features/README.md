# Feature Implementation Documentation

Documentation for specific game features and their implementations.

## Contents

| Document | Purpose |
|----------|---------|
| [TripleJumpRefinementPlan.md](./TripleJumpRefinementPlan.md) | Triple jump mechanic design and planning |
| [TripleJumpRefinementImplementation.md](./TripleJumpRefinementImplementation.md) | Triple jump implementation details |
| [LevelImplementationArchitecture.md](./LevelImplementationArchitecture.md) | Level loading system architecture |
| [LevelImplementationSummary.md](./LevelImplementationSummary.md) | Level implementation overview |
| [LevelImplementationTasks.md](./LevelImplementationTasks.md) | Level implementation task breakdown |

## Feature Overview

### Triple Jump Mechanic
Progressive jump system allowing players to perform up to three consecutive jumps with visual feedback (subtle scaling, squash/stretch effects) and physics-based mechanics.

**Key Aspects:**
- Progressive jump heights and velocities
- Visual feedback with scaling (1.0x → 1.05x → 1.1x)
- Squash/stretch animation on landing
- Physics integration via PhysicsManager

### Level Implementation System
Modular level loading and management system supporting dynamic level transitions, platform configurations, and collectible placement.

**Key Aspects:**
- JSON-based level definitions
- Dynamic platform and collectible spawning
- Level transition events
- Old-school scene changes triggered by game events

## Implementation Patterns

### Feature Development Workflow
1. Design phase: Document mechanics and requirements
2. Architecture phase: Plan integration with existing systems
3. Implementation phase: Build with event-driven patterns
4. Refinement phase: Iterate based on game feel

### Integration Guidelines
- Use EventBus for feature communication
- Extend BaseManager for feature managers
- Use generated constants (no magic strings)
- Follow barrel export pattern (`@features/*`)

## Related Documentation

- [../systems/](../systems/) - Core system documentation
- [../design/](../design/) - Game design principles
- [../INDEX.md](../INDEX.md) - Full documentation index
