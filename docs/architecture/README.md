# Architecture Documentation

System architecture and design decisions for WynIsBuff2.

## Contents

| Document                                                   | Purpose                                         |
| ---------------------------------------------------------- | ----------------------------------------------- |
| [ArchitecturalAssessment.md](./ArchitecturalAssessment.md) | Architecture evaluation and recommendations     |
| [ArchitecturalOverview.md](./ArchitecturalOverview.md)     | Complete architectural vision and system design |
| [ModularArchitecture.md](./ModularArchitecture.md)         | Modular design patterns and implementation      |
| [MVPArchitectureSummary.md](./MVPArchitectureSummary.md)   | MVP architecture summary and decisions          |

## Overview

This directory contains documentation about WynIsBuff2's system architecture, including:

- **Feature-based organization**: Barrel exports at `@features/*`
- **Event-driven architecture**: Centralized EventBus with namespaced events
- **Singleton managers**: BaseManager pattern for consistent singletons
- **No magic strings**: Generated constants for assets, scenes, events

## Key Architectural Patterns

### Manager Pattern

All managers extend `BaseManager` for consistent initialization and singleton behavior.

### Event-Driven Communication

Systems communicate through `EventBus` using namespaced events (`player:jump`, `level:complete`).

### Constants-Based References

All assets, scenes, and events use generated constants - no hardcoded strings.

## Related Documentation

- [../systems/](../systems/) - Core system implementations
- [../technology/](../technology/) - Technology stack details
- [../INDEX.md](../INDEX.md) - Full documentation index
