# AIProjectDocs Reorganization Plan

**Purpose**: Categorize and reorganize 32 AIProjectDocs files into topic-based structure
**Date**: October 28, 2025
**Session**: 3 - Task 2

---

## Categorization Rationale

Files organized by **content type** and **current relevance**:

- **Architecture**: System design and structural decisions
- **Technology**: Tech stack integration guides
- **Systems**: Core system documentation
- **Features**: Specific feature implementations
- **Design**: Game design and visual guidelines
- **Archive**: Historical, superseded, or issue-specific docs

---

## File Categorization (32 files total)

### docs/architecture/ (4 files)

**Purpose**: System architecture and design decisions

| File                       | Rationale                                   |
| -------------------------- | ------------------------------------------- |
| ArchitecturalAssessment.md | Architecture evaluation and recommendations |
| ArchitecturalOverview.md   | Complete architectural vision               |
| ModularArchitecture.md     | Modular design patterns                     |
| MVPArchitectureSummary.md  | MVP architecture summary                    |

### docs/technology/ (4 files)

**Purpose**: Technology stack integration and usage

| File                       | Rationale                  |
| -------------------------- | -------------------------- |
| PhaserFramework.md         | Phaser 3 integration guide |
| RapierPhysics.md           | Rapier physics integration |
| ViteBuildTool.md           | Vite build configuration   |
| TechnologiesAndPackages.md | Tech stack overview        |

### docs/systems/ (7 files)

**Purpose**: Core game systems documentation

| File                                | Rationale                   |
| ----------------------------------- | --------------------------- |
| EventSystem.md                      | Event system architecture   |
| EventSystemImplementationSteps.md   | Event system implementation |
| ModularPlayerController.md          | Player controller design    |
| MovementSystem.md                   | Movement mechanics          |
| ModularLevelArchitecture.md         | Level system architecture   |
| ModularLevelSystemImplementation.md | Level system implementation |
| UIManager.md                        | UI management system        |

### docs/features/ (4 files)

**Purpose**: Specific feature implementation guides

| File                                  | Rationale                     |
| ------------------------------------- | ----------------------------- |
| TripleJumpRefinementPlan.md           | Triple jump feature design    |
| TripleJumpRefinementImplementation.md | Triple jump implementation    |
| LevelImplementationArchitecture.md    | Level loading architecture    |
| LevelImplementationSummary.md         | Level implementation overview |
| LevelImplementationTasks.md           | Level implementation tasks    |

### docs/design/ (6 files)

**Purpose**: Game design and visual guidelines

| File                       | Rationale               |
| -------------------------- | ----------------------- |
| GameDesignPrinciples.md    | Core design principles  |
| MVPLevelDesignGuide.md     | Level design guide      |
| SillyMechanicsIdeas.md     | Creative mechanic ideas |
| ArtStyleAndAssetPlan.md    | Art direction           |
| AssetManagementStrategy.md | Asset workflow          |
| pixelart-style.md          | Pixel art guidelines    |

### docs/archive/aiprojectdocs-historical/ (6 files)

**Purpose**: Historical documentation - completed, superseded, or deprecated

| File                            | Rationale                              |
| ------------------------------- | -------------------------------------- |
| ImplementationProgress.md       | Dated progress report                  |
| LevelManagerWrapperIssue.md     | Specific resolved issue                |
| MVPRecommendations.md           | MVP-phase recommendations (superseded) |
| RevisedMVPImplementationPlan.md | MVP-phase plan (superseded)            |
| MovementSystem.md.deprecated    | Explicitly deprecated                  |

### AIProjectDocs/ (Keep 1 file)

**Purpose**: Index for AI project documentation

| File      | Rationale                                           |
| --------- | --------------------------------------------------- |
| README.md | Serves as index, updated to reference new locations |

---

## New Directory Structure

```
docs/
├── INDEX.md                          # Main navigation (already exists)
├── architecture/                     # NEW: 4 files
│   ├── README.md                    # NEW: Directory guide
│   ├── ArchitecturalAssessment.md
│   ├── ArchitecturalOverview.md
│   ├── ModularArchitecture.md
│   └── MVPArchitectureSummary.md
├── technology/                       # NEW: 4 files
│   ├── README.md                    # NEW: Directory guide
│   ├── PhaserFramework.md
│   ├── RapierPhysics.md
│   ├── ViteBuildTool.md
│   └── TechnologiesAndPackages.md
├── systems/                          # NEW: 7 files
│   ├── README.md                    # NEW: Directory guide
│   ├── EventSystem.md
│   ├── EventSystemImplementationSteps.md
│   ├── ModularPlayerController.md
│   ├── MovementSystem.md
│   ├── ModularLevelArchitecture.md
│   ├── ModularLevelSystemImplementation.md
│   └── UIManager.md
├── features/                         # NEW: 5 files
│   ├── README.md                    # NEW: Directory guide
│   ├── TripleJumpRefinementPlan.md
│   ├── TripleJumpRefinementImplementation.md
│   ├── LevelImplementationArchitecture.md
│   ├── LevelImplementationSummary.md
│   └── LevelImplementationTasks.md
├── design/                           # NEW: 6 files
│   ├── README.md                    # NEW: Directory guide
│   ├── GameDesignPrinciples.md
│   ├── MVPLevelDesignGuide.md
│   ├── SillyMechanicsIdeas.md
│   ├── ArtStyleAndAssetPlan.md
│   ├── AssetManagementStrategy.md
│   └── pixelart-style.md
└── archive/
    ├── README.md                     # Already exists
    ├── codex-tasks-historical/       # Already exists
    └── aiprojectdocs-historical/     # NEW: 6 files
        ├── README.md                 # NEW: Archive explanation
        ├── ImplementationProgress.md
        ├── LevelManagerWrapperIssue.md
        ├── MVPRecommendations.md
        ├── RevisedMVPImplementationPlan.md
        └── MovementSystem.md.deprecated

AIProjectDocs/
└── README.md                         # Updated with new structure references
```

---

## Files Requiring Cross-Reference Updates

### docs/INDEX.md

Currently references AIProjectDocs/\* files - needs complete update for new structure.

**Lines to Update** (from current INDEX.md):

- All entries in "Architecture & Design" section
- All entries in "Technical Stack" section
- All entries in "Systems & Features" section
- All entries in "Assets & Art" section

### AIProjectDocs/README.md

Index for AI-specific docs - needs update to reference new locations.

---

## Implementation Steps

1. **Create new directory structure**

    ```bash
    mkdir -p docs/{architecture,technology,systems,features,design}
    mkdir -p docs/archive/aiprojectdocs-historical
    ```

2. **Move files with git mv** (preserves history)
    - Architecture files → docs/architecture/
    - Technology files → docs/technology/
    - Systems files → docs/systems/
    - Features files → docs/features/
    - Design files → docs/design/
    - Historical files → docs/archive/aiprojectdocs-historical/

3. **Create directory READMEs** (6 new files)
    - docs/architecture/README.md
    - docs/technology/README.md
    - docs/systems/README.md
    - docs/features/README.md
    - docs/design/README.md
    - docs/archive/aiprojectdocs-historical/README.md

4. **Update cross-references**
    - docs/INDEX.md - complete rewrite of AIProjectDocs references
    - AIProjectDocs/README.md - add new structure references
    - Verify all internal links still work

5. **Validate**
    - Run scanner to check for broken links
    - Manual verification of key navigation paths
    - Confirm git history preserved

---

## Success Criteria

- [ ] All 31 files moved to appropriate categories
- [ ] Git history preserved (using git mv)
- [ ] 6 new directory READMEs created
- [ ] docs/INDEX.md fully updated
- [ ] AIProjectDocs/README.md updated
- [ ] Zero broken links (scanner validation)
- [ ] Clear categorization rationale documented
- [ ] Archive README explains historical docs

---

## Estimated Impact

**File Count Changes**:

- AIProjectDocs/: 32 files → 1 file (README only)
- docs/: +26 files (5 categories × ~5 files each + 6 READMEs)
- docs/archive/: +6 historical files

**Organization Benefits**:

- Clear topic-based structure
- Better discoverability
- Logical groupings
- Reduced orphan ratio
- Clearer documentation hierarchy

---

**Plan Status**: Ready for execution
**Next**: Create directories and begin moving files
