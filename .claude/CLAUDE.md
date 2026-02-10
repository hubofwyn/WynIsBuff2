# WynIsBuff2 - Claude Code Overrides

Claude Code-specific configuration. See [AGENTS.md](../AGENTS.md) for canonical project contract.

## Agent Routing

Automatic routing by keyword analysis:

| Keywords | Agent |
|---|---|
| pattern, structure, organize, module, manager, singleton | `architecture-guardian` |
| collision, velocity, gravity, jump, movement, rapier, physics | `game-physics-expert` |
| mechanic, gameplay, feel, experience, power-up, level, creative | `game-design-innovator` |

Fallback: `architecture-guardian` (validates all code changes).

## Workflow Patterns

**Feature development**: design (game-design-innovator) -> validate (architecture-guardian) -> implement (game-physics-expert) -> review (architecture-guardian)

**Bug fixing**: analyze (game-physics-expert) -> validate fix (architecture-guardian)

**Optimization**: profile (game-physics-expert) -> optimize (game-physics-expert) -> validate (architecture-guardian)

## Observability Integration

Every development session:

```javascript
// Browser console - system health
window.debugAPI.getSummary()

// Recent errors
window.debugAPI.getRecentLogs(60000)

// Analyze subsystem
window.debugAPI.analyzeSubsystem('physics')

// Export for bug reports
copy(window.debugAPI.exportForAnalysis({ format: 'markdown', timeWindow: 300000 }))
```

## MCP Servers

- **memory**: Cross-session state via knowledge graph
- **github**: Repository operations
- **context7**: Up-to-date library documentation
- **firecrawl**: Web content extraction
- **brave-search**: Web search
- **sequential-thinking**: Complex problem decomposition

## Configuration

- Runtime orchestration: `.claude-orchestration.json` (loaded by `src/core/AgentOrchestrator.js`)
- MCP servers: `.mcp.json`
- Quality gate logging: `.claude/orchestration.log`
