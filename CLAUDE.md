# CLAUDE.md

@AGENTS.md

Read [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) before choosing work. It
is the current-work authority. Wyn der Schrank is a separate rebuild and must
not be treated as this repository's remote, migration branch, issue tracker,
deployment, or status source.

## Claude Code

- **Skills**: /implement-game-feature, /debug-physics-issue, /manage-assets, /add-scene, /add-module, /arch-health, /playtest-check
- **Agents**: architecture-guardian, game-physics-expert, game-design-innovator
- **Observability**: `window.debugAPI.getSummary()` in browser console

## Quick Start

```bash
bun install             # Install dependencies
bun run dev             # Dev server (port 5173)
bun test                # Run tests
bun run build           # Production build
bun run arch:health     # Architecture health check
```

## Windsurf/Cascade Users

See [.windsurf/README.md](.windsurf/README.md) for workspace rules and configuration.

## Docs

- [Current status and next work](docs/PROJECT_STATUS.md)
- [Architecture](docs/ARCHITECTURE.md) | [Debugging](docs/guides/DEBUGGING.md) | [Assets](docs/guides/ASSET_MANAGEMENT.md)
- [Contributing](CONTRIBUTING.md) | [Full Index](docs/INDEX.md)
