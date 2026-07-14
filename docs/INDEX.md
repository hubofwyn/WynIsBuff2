# WynIsBuff2 Documentation Index

Complete navigation hub for all WynIsBuff2 documentation.

**Last Updated**: July 14, 2026
**Documentation Health**: See [DOC_ANALYSIS_SUMMARY.md](../DOC_ANALYSIS_SUMMARY.md)
**Agentic System**: See [meta/doc_index.yaml](meta/doc_index.yaml) for queryable cross-reference system

> **Current-work authority:** [PROJECT_STATUS.md](PROJECT_STATUS.md). Older
> roadmaps, action plans, and generated status snapshots are historical input,
> not authorization to begin work. This index still contains broken legacy
> links; their repair is tracked in the current status ledger.

---

## 🤖 Agentic Development System (NEW)

**AI-assisted development with automated validation and documentation**

| Document | Purpose | Audience |
|----------|---------|----------|
| [meta/AGENTIC_WORKFLOW.md](meta/AGENTIC_WORKFLOW.md) | Complete workflow guide | AI assistants, Developers |
| [meta/doc_index.yaml](meta/doc_index.yaml) | Cross-reference index (queryable) | AI tools, Scripts |
| [meta/IMPLEMENTATION_SUMMARY.md](meta/IMPLEMENTATION_SUMMARY.md) | Implementation details | Developers |
| [reference/data/level_schema.md](reference/data/level_schema.md) | Level data schema v1.1.0 | Level designers, AI |

**Quick Commands**:

```bash
bun run docs:update        # Update documentation index
bun run validate:levels    # Validate all level data
bun run arch:health        # Check architecture compliance
```

---

## Quick Start

**New to WynIsBuff2?** Start here:

1. [README.md](../README.md) - Game overview and installation
2. [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current status and next work
3. [CLAUDE.md](../CLAUDE.md) - Development guide for AI assistants
4. [meta/AGENTIC_WORKFLOW.md](meta/AGENTIC_WORKFLOW.md) - AI-assisted development
5. [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines

---

## Documentation Categories

### Core Development

**Essential guides for development workflow**

| Document                                                   | Purpose                            | Audience                   |
| ---------------------------------------------------------- | ---------------------------------- | -------------------------- |
| [CLAUDE.md](../CLAUDE.md)                                  | AI assistant development guide     | Claude Code, AI assistants |
| [CONTRIBUTING.md](../CONTRIBUTING.md)                      | Contribution guidelines            | Contributors               |
| [ARCHITECTURE.md](ARCHITECTURE.md)                         | System architecture overview       | Developers                 |
| [ASSET_MANAGEMENT.md](../ASSET_MANAGEMENT.md)              | Asset workflow and manifest system | Developers, Artists        |
| [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md) | Performance optimization guide     | Developers                 |

### Architecture & Design

**System design and architectural decisions**

| Document                                                                       | Purpose                                   |
| ------------------------------------------------------------------------------ | ----------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                             | Complete system architecture              |
| [report-05122025.md](report-05122025.md)                                       | Architecture assessment report (May 2025) |
| [architecture/ArchitecturalOverview.md](architecture/ArchitecturalOverview.md) | Detailed architectural vision             |
| [architecture/ModularArchitecture.md](architecture/ModularArchitecture.md)     | Modular design patterns                   |
| [design/GameDesignPrinciples.md](design/GameDesignPrinciples.md)               | Core game design principles               |

### Technical Stack

**Technology documentation and integration guides**

| Technology         | Document                                                                       | Purpose                                               |
| ------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| **Phaser 3**       | [technology/PhaserFramework.md](technology/PhaserFramework.md)                 | Phaser 3 integration guide                            |
| **Rapier Physics** | [technology/RapierPhysics.md](technology/RapierPhysics.md)                     | Physics engine integration (0.19+ API)                |
| **Rapier Physics** | [technology/RAPIER_019_MIGRATION.md](technology/RAPIER_019_MIGRATION.md)       | **Migration guide for Rapier 0.19+ breaking changes** |
| **Rapier Physics** | [design/rapier-updated-api-research.md](design/rapier-updated-api-research.md) | Deep dive: API evolution and character controllers    |
| **Vite**           | [technology/ViteBuildTool.md](technology/ViteBuildTool.md)                     | Build system configuration                            |

**Note**: Root `Rapier.md` is outdated template boilerplate (Rapier 0.14 API). Use docs above for current patterns.

### Systems & Features

**Individual system and feature documentation**

#### Event System

- [systems/EventSystem.md](systems/EventSystem.md) - Event system architecture
- [systems/EventSystemImplementationSteps.md](systems/EventSystemImplementationSteps.md) - Implementation guide

#### Player & Movement

- [systems/ModularPlayerController.md](systems/ModularPlayerController.md) - Player controller design
- [systems/MovementSystem.md](systems/MovementSystem.md) - Movement mechanics
- [features/TripleJumpRefinementPlan.md](features/TripleJumpRefinementPlan.md) - Triple jump design
- [features/TripleJumpRefinementImplementation.md](features/TripleJumpRefinementImplementation.md) - Triple jump implementation

#### Level System

- [features/LEVEL_SELECT_SCREEN_IMPLEMENTATION.md](features/LEVEL_SELECT_SCREEN_IMPLEMENTATION.md) - **Level Select Screen** - Production-ready UI implementation
- [features/LevelImplementationArchitecture.md](features/LevelImplementationArchitecture.md) - Level architecture
- [systems/ModularLevelArchitecture.md](systems/ModularLevelArchitecture.md) - Modular level design
- [systems/ModularLevelSystemImplementation.md](systems/ModularLevelSystemImplementation.md) - Level implementation
- [level-progression-plan.md](level-progression-plan.md) - Level progression design
- [buffed_level_system_workflow.md](buffed_level_system_workflow.md) - Level workflow

#### UI/UX Architecture

**Core Documentation:**

- [architecture/UI_UX_ARCHITECTURE.md](architecture/UI_UX_ARCHITECTURE.md) - **START HERE** - Complete UI/UX architecture guide
- [systems/LOADING_SCREEN_ARCHITECTURE.md](systems/LOADING_SCREEN_ARCHITECTURE.md) - Unified loading screen system
- [systems/UIManager.md](systems/UIManager.md) - UI element management API
- [SUBTITLE_SYSTEM.md](SUBTITLE_SYSTEM.md) - Subtitle/caption system for accessibility

**Design System:**

- **DesignTokens** (`src/constants/DesignTokens.js`) - Primary design system (spacing, colors, typography, components)
- **UIConfig** (`src/constants/UIConfig.js`) - ⚠️ Legacy (deprecated in favor of DesignTokens)

**Core Managers:**

- **LoadingScreenManager** (`src/core/LoadingScreenManager.js`) - Unified loading screens with progress/status
- **UIManager** (`src/modules/UIManager.js`) - UI element creation and management

**Implementation Guides:**

- [game-settings.md](game-settings.md) - Settings UI implementation tasks

#### Audio Systems

- [systems/AUDIO_UNLOCK_SYSTEM.md](systems/AUDIO_UNLOCK_SYSTEM.md) - **Audio autoplay handling** - Browser permission management

#### Known Issues

- [systems/KNOWN_WEBGL_ISSUES.md](systems/KNOWN_WEBGL_ISSUES.md) - WebGL warnings and non-critical issues

#### Debugging & Diagnostics

**✅ Observability System - PRODUCTION READY (Phases 0-5 Complete)**

**📖 Navigation Guide**:

- [OBSERVABILITY_DOCS_GUIDE.md](OBSERVABILITY_DOCS_GUIDE.md) - **Documentation navigation** - Find the right doc for your task

**Quick Start**:

- [systems/ERROR_HANDLING_LOGGING.md](systems/ERROR_HANDLING_LOGGING.md) - **START HERE** - Complete guide with Quick Start section
- [OBSERVABILITY_IMPLEMENTATION.md](../OBSERVABILITY_IMPLEMENTATION.md) - Master implementation plan (Phases 0-10)
- [STATUS_OBSERVABILITY.json](../STATUS_OBSERVABILITY.json) - Real-time status tracking

**Implementation Guides**:

- [OBSERVABILITY_WORKFLOW.md](../OBSERVABILITY_WORKFLOW.md) - Agent workflow guide
- [PHASE5_ERROR_INTEGRATION_PLAN.md](../PHASE5_ERROR_INTEGRATION_PLAN.md) - Error integration details (Phase 5)
- [DEBUGCONTEXT_INTEGRATION_PLAN.md](../DEBUGCONTEXT_INTEGRATION_PLAN.md) - Context integration (Phase 3.5)
- [OBSERVABILITY_EVALUATION.md](../OBSERVABILITY_EVALUATION.md) - Phase 3 evaluation results

**Architecture & Reference**:

- [architecture/Observability.md](architecture/Observability.md) - Architecture deep dive and migration guide
- [systems/INPUT_MOVEMENT_AUDIT.md](systems/INPUT_MOVEMENT_AUDIT.md) - Input and movement system technical audit

**Debugging Guide**:

- [guides/DEBUGGING.md](guides/DEBUGGING.md) - **Practical debugging guide** with common scenarios and solutions

**Key Features** (Phase 5):

- ✅ Structured logging with automatic context injection (DebugContext)
- ✅ Crash dump generation on fatal errors (CrashDumpGenerator)
- ✅ Automatic error pattern detection (ErrorPatternDetector)
- ✅ Query API for AI agents
- ✅ Circuit breakers with comprehensive state dumps
- ✅ 95% migration complete (278/293 statements)

### Assets & Art

**Asset creation and management guides**

| Document                                                               | Purpose                            |
| ---------------------------------------------------------------------- | ---------------------------------- |
| [ASSET_MANAGEMENT.md](../ASSET_MANAGEMENT.md)                          | Asset workflow and manifest system |
| [assets.md](assets.md)                                                 | Asset organization guide           |
| [design/ArtStyleAndAssetPlan.md](design/ArtStyleAndAssetPlan.md)       | Art style guide                    |
| [design/AssetManagementStrategy.md](design/AssetManagementStrategy.md) | Asset management strategy          |
| [design/pixelart-style.md](design/pixelart-style.md)                   | Pixel art guidelines               |

### Special Features

**Unique game features and mechanics**

| Feature           | Document                                                       |
| ----------------- | -------------------------------------------------------------- |
| Birthday Minigame | [birthday-minigame.md](birthday-minigame.md)                   |
| Silly Mechanics   | [design/SillyMechanicsIdeas.md](design/SillyMechanicsIdeas.md) |

### Agent System

**Multi-agent orchestration for development**

| Document                                  | Purpose                             |
| ----------------------------------------- | ----------------------------------- |
| [AGENTS.md](../AGENTS.md)                 | Agent system overview               |
| [.claude/CLAUDE.md](../.claude/CLAUDE.md) | Claude-specific agent configuration |
| [.claude/agents/](../.claude/agents/)     | Individual agent definitions        |
| [.claude/commands/](../.claude/commands/) | Agent slash commands                |

**Available Agents**:

- `architecture-guardian` - Enforces architectural patterns
- `game-physics-expert` - Phaser 3 and Rapier physics specialist
- `game-design-innovator` - Creative game design expert

### Implementation Plans

**Historical implementation plans**

| Document                                                  | Status     | Purpose                       |
| --------------------------------------------------------- | ---------- | ----------------------------- |
| [PROJECT_STATUS.md](PROJECT_STATUS.md)                    | Current    | Sole current-work ledger       |
| [IMPLEMENTATION_PLAN_V2.md](../IMPLEMENTATION_PLAN_V2.md) | Historical | Earlier implementation roadmap |
| [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)       | Historical | Original implementation plan  |
| [WYNISBUFF2_ACTION_PLAN.md](../WYNISBUFF2_ACTION_PLAN.md) | Historical | Earlier action items           |
| [next-implementations.md](next-implementations.md)        | Historical | Unverified planning questionnaire |

### Project Management

**Project status, planning, and coordination**

| Document                                            | Purpose                     |
| --------------------------------------------------- | --------------------------- |
| [PROJECT_STATUS.md](PROJECT_STATUS.md)               | Current project status      |
| [STATUS_REPORT.md](../STATUS_REPORT.md)              | Historical status snapshot  |
| [EXECUTION_CHECKLIST.md](../EXECUTION_CHECKLIST.md) | Execution checklist         |
| [CHANGELOG.md](../CHANGELOG.md)                     | Version history and changes |
| [QUICK_TEST.md](../QUICK_TEST.md)                   | Quick test procedures       |

### Codex System

**Code quality and baseline management**

| Document                                        | Purpose               |
| ----------------------------------------------- | --------------------- |
| [CODEX.md](../CODEX.md)                         | Codex system overview |
| [codex-setup.md](../codex-setup.md)             | Codex setup guide     |
| [baseline-creating.md](../baseline-creating.md) | Creating baselines    |
| [baseline-grading.md](../baseline-grading.md)   | Grading baselines     |

### Documentation Maintenance

**Meta-documentation for maintaining documentation**

| Document                                                                    | Purpose                        |
| --------------------------------------------------------------------------- | ------------------------------ |
| [DOC_ANALYSIS_SUMMARY.md](../DOC_ANALYSIS_SUMMARY.md)                       | Documentation health overview  |
| [DOCUMENTATION_QUALITY_STANDARDS.md](../DOCUMENTATION_QUALITY_STANDARDS.md) | Quality standards and gates    |
| [assets/ASSET_TRIAGE_PLAN.md](../assets/ASSET_TRIAGE_PLAN.md)               | Asset hygiene and cleanup plan |
| [docs/archive/sessions/README.md](../docs/archive/sessions/README.md)       | Archived session documents     |
| [scripts/README.md](../scripts/README.md)                                   | Documentation analysis tools   |

---

## Documentation by Audience

### For Developers

Start here if you're coding:

1. [CLAUDE.md](../CLAUDE.md) - Development patterns and conventions
2. [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
3. [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute
4. [ASSET_MANAGEMENT.md](../ASSET_MANAGEMENT.md) - Working with assets

### For Game Designers

Start here if you're designing features:

1. [design/GameDesignPrinciples.md](design/GameDesignPrinciples.md) - Design principles
2. [design/SillyMechanicsIdeas.md](design/SillyMechanicsIdeas.md) - Creative ideas
3. [level-progression-plan.md](level-progression-plan.md) - Level design

### For Artists

Start here if you're creating assets:

1. [design/ArtStyleAndAssetPlan.md](design/ArtStyleAndAssetPlan.md) - Art style guide
2. [ASSET_MANAGEMENT.md](../ASSET_MANAGEMENT.md) - Asset workflow
3. [design/pixelart-style.md](design/pixelart-style.md) - Pixel art guidelines

### For AI Assistants

Start here if you're an AI assistant:

1. [CLAUDE.md](../CLAUDE.md) - Primary development guide
2. [.claude/CLAUDE.md](../.claude/CLAUDE.md) - Claude-specific configuration
3. [AGENTS.md](../AGENTS.md) - Agent orchestration system
4. [DOCUMENTATION_QUALITY_STANDARDS.md](../DOCUMENTATION_QUALITY_STANDARDS.md) - Quality standards

---

## Documentation Structure Rationale

### Organization Principles

1. **Audience-first**: Documentation organized by who needs it
2. **Task-focused**: Find what you need to do, not abstract theory
3. **Progressive disclosure**: Quick Start → Core → Deep Dives
4. **Single source of truth**: Canonical location for each topic
5. **Cross-referenced**: Related docs linked bidirectionally

### Directory Structure

```text
WynIsBuff2/
├── README.md                  # Player-facing entry point
├── CLAUDE.md                  # Developer-facing entry point
├── docs/                      # Main documentation
│   ├── INDEX.md              # This file
│   ├── ARCHITECTURE.md       # System architecture
│   ├── architecture/         # Architecture docs
│   ├── technology/           # Tech stack docs
│   ├── systems/              # Core systems
│   ├── features/             # Feature implementations
│   ├── design/               # Game design & art
│   └── archive/              # Historical content
├── AIProjectDocs/            # Index only (content moved to docs/)
│   └── README.md             # Index with references to new locations
├── .claude/                  # Claude Code configuration
│   ├── agents/               # Agent definitions
│   └── commands/             # Slash commands
└── scripts/                  # Tooling and automation
    └── README.md             # Tool documentation
```

### Consolidation Status

**Current State** (as of Oct 28, 2025 - Session 3 Complete):

- ✅ Main docs: `docs/` directory with topic-based subdirectories
- ✅ AIProjectDocs consolidated: 31 files reorganized into docs/
  - architecture/ (4 files)
  - technology/ (4 files)
  - systems/ (7 files)
  - features/ (5 files)
  - design/ (6 files)
  - archive/aiprojectdocs-historical/ (5 files)
- Meta docs: Root level (process and tooling)
- Config: `.claude/`, `.codex/`

**Organization Improvements**:

- Topic-based directory structure
- README.md in each category directory
- All cross-references updated
- Git history preserved via `git mv`

---

## Finding What You Need

### Common Tasks

| I want to...                 | Go to...                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| Start developing             | [CLAUDE.md](../CLAUDE.md)                                                               |
| Understand the architecture  | [ARCHITECTURE.md](ARCHITECTURE.md)                                                      |
| Add a new feature            | [CONTRIBUTING.md](../CONTRIBUTING.md) + [CLAUDE.md](../CLAUDE.md)                       |
| Work with assets             | [ASSET_MANAGEMENT.md](../ASSET_MANAGEMENT.md)                                           |
| Understand physics           | [technology/RapierPhysics.md](technology/RapierPhysics.md)                              |
| **Implement level select UI** | **[features/LEVEL_SELECT_SCREEN_IMPLEMENTATION.md](features/LEVEL_SELECT_SCREEN_IMPLEMENTATION.md)** |
| Design a level               | [level-progression-plan.md](level-progression-plan.md)                                  |
| **Use structured logging**   | **[systems/ERROR_HANDLING_LOGGING.md](systems/ERROR_HANDLING_LOGGING.md) - Section 5**  |
| **Debug with observability** | **[systems/ERROR_HANDLING_LOGGING.md](systems/ERROR_HANDLING_LOGGING.md) - Section 11** |
| Debug "too many errors"      | [systems/ERROR_HANDLING_LOGGING.md](systems/ERROR_HANDLING_LOGGING.md) - Section 9      |
| Query logs programmatically  | [systems/ERROR_HANDLING_LOGGING.md](systems/ERROR_HANDLING_LOGGING.md) - Section 5.4    |
| Implement observability      | [OBSERVABILITY_IMPLEMENTATION.md](../OBSERVABILITY_IMPLEMENTATION.md)                   |
| Check observability status   | [STATUS_OBSERVABILITY.json](../STATUS_OBSERVABILITY.json)                               |
| Use the agent system         | [AGENTS.md](../AGENTS.md)                                                               |
| Check documentation health   | [DOC_ANALYSIS_SUMMARY.md](../DOC_ANALYSIS_SUMMARY.md)                                   |

### Search Strategies

**By technology**:

- Phaser 3: Search "Technical Stack" section
- Rapier: See Rapier.md and RapierPhysics.md
- Vite: See ViteBuildTool.md

**By system**:

- Events: EventSystem.md + EventSystemImplementationSteps.md
- Player: ModularPlayerController.md + MovementSystem.md
- Levels: LevelImplementation\* docs
- UI: UIManager.md + game-settings.md

**By audience**:

- See "Documentation by Audience" section above

---

## Documentation Quality

**Current Health Score**: 64/100 (see [DOC_ANALYSIS_SUMMARY.md](../DOC_ANALYSIS_SUMMARY.md))

**Active Improvements**:

- Session 1 ✅ Complete: Analysis tools deployed
- Session 2 🔄 In Progress: Architecture & critical fixes
- Session 3 ⏳ Planned: Consolidation
- Session 4 ⏳ Planned: Rewrite & polish

**Quality Standards**: All documentation follows [DOCUMENTATION_QUALITY_STANDARDS.md](../DOCUMENTATION_QUALITY_STANDARDS.md)

---

## Contributing to Documentation

See [CONTRIBUTING.md](../CONTRIBUTING.md) for general guidelines.

**Documentation-specific guidelines**:

1. Update this index when adding new documents
2. Follow [DOCUMENTATION_QUALITY_STANDARDS.md](../DOCUMENTATION_QUALITY_STANDARDS.md)
3. Run `node scripts/doc-scanner.cjs` before committing
4. Link new docs from related existing docs
5. Keep README and CLAUDE.md in sync with changes

---

## Tools and Automation

**Documentation analysis tools**:

- Quick scanner: `node scripts/doc-scanner.cjs` (2 sec)
- Full analysis: `./scripts/doc-analysis.sh` (60 sec)
- Query tool: `python3 scripts/query_docs.py --help`

See [scripts/README.md](../scripts/README.md) for tool documentation.

---

**Index Maintained By**: Documentation maintenance system
**Last Review**: October 28, 2025
**Next Review**: After Session 3 consolidation
