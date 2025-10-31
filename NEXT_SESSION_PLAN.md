# Documentation Overhaul - Next Session Plan

## Session 1 Complete ✅

**Accomplished**:

- Deployed analysis tools (Node.js + Python)
- Scanned 129 documentation files
- Generated health score: 64/100
- Identified critical issues
- Created automated maintenance workflow

**Time**: 45 minutes

---

## Session 2: Architecture & Critical Fixes

**Goal**: Fix critical issues and establish documentation structure

**Quality Standards**:

- Zero broken links (verified by scanner)
- All moves/renames tracked in git
- Every decision documented
- Validation after each task
- No temporary workarounds

### Tasks (Estimated: 120 minutes - extended for quality)

#### 1. Create Documentation Index (30 min)

Create `docs/INDEX.md` as the central navigation hub

**Actions**:

- Map current documentation landscape (comprehensive)
- Define canonical locations for each topic
- Create topic-based organization with clear hierarchy
- Document decision rationale for structure

**Validation**:

- All major documentation areas represented
- Every link in index verified to exist
- Index follows project naming conventions
- Run scanner: verify index has no broken links

#### 2. Fix Broken References (40 min)

Priority files with surgical precision

**Actions**:

- `AIProjectDocs/README.md`: Fix all 6 broken links
- Update anchor links across AIProjectDocs files
- Verify target sections exist before linking
- Update links to match new structure

**Validation**:

- Run scanner: zero broken references in updated files
- Manual verification of each fixed link
- Test navigation paths end-to-end
- Document any structural changes made

#### 3. Handle Empty/Stub Files (30 min)

Make definitive decisions, no placeholders

**Actions**:

- `docs/config-settings-modern.md`: Complete with actual content OR remove entirely
- `.codex/tasks/` stub files: Archive to `docs/archive/tasks-historical/` with README
- Create `docs/archive/README.md` explaining archive purpose
- Update any references to archived files

**Validation**:

- Zero files with <10 tokens remaining (except intentional stubs with TODOs)
- Archive has clear README explaining contents
- No broken links to archived files
- Git history preserved for all moves

#### 4. Link High-Value Orphans (20 min)

Integrate valuable content into structure

**Actions**:

- Add each orphan to appropriate index section
- Create cross-references where relevant
- Verify content is current and valuable
- Update file headers with context

**Validation**:

- Run scanner: orphan ratio reduced to <60%
- Each linked file accessible from index
- No duplicate content introduced
- All links bidirectional where appropriate

**Session 2 Validation Checklist**:

- [ ] Run `./scripts/doc-analysis.sh`
- [ ] Health score 70+ achieved
- [ ] Zero broken references in scanner output
- [ ] Orphan ratio <60%
- [ ] All moves tracked in git with clear commit messages
- [ ] Documentation structure decisions documented in INDEX.md
- [ ] Manual spot-check of 5 random navigation paths

---

## Session 3: Consolidation

**Goal**: Eliminate duplication, merge related content

**Quality Standards**:

- Content accuracy maintained during merges
- No information loss
- Clear git history showing what was merged
- All merged files archived (not deleted)
- Comprehensive testing of merged content

### Tasks (Estimated: 150 minutes - extended for quality)

#### 1. Consolidate Duplicate Content (40 min)

**Actions**:

- Compare duplicate sections side-by-side
- Identify unique content in each version
- Merge into single canonical source (preserve all unique info)
- Add cross-references from old locations
- Archive superseded versions with clear explanation

**Validation**:

- No information loss (manual review of diffs)
- Scanner shows duplicate reduction
- All internal references updated
- Test merged instructions actually work

#### 2. Restructure AIProjectDocs (60 min)

**Actions**:

- Categorize each AIProjectDocs file by topic
- Create target directory structure
- Move files with git mv (preserve history)
- Update all cross-references
- Create redirect notes in old locations

**Validation**:

- Git log shows clean moves (not delete+add)
- All inbound links updated
- Directory structure matches plan
- No orphans created by moves
- Run full scanner validation

#### 3. Finalize Topic-Based Organization (50 min)

**Actions**:

- Implement complete directory structure
- Move remaining files to appropriate locations
- Create README.md in each directory explaining purpose
- Update INDEX.md with new structure
- Document organization principles

**Structure**:

```
docs/
├── README.md              # Entry point
├── INDEX.md              # Complete navigation
├── architecture/         # System design docs
│   └── README.md
├── development/          # Developer workflow
│   └── README.md
├── features/            # Feature-specific guides
│   └── README.md
├── agents/              # Agent system docs
│   └── README.md
└── archive/             # Historical/superseded
    └── README.md
```

**Validation**:

- Every directory has README
- No files in wrong category
- Clear separation of concerns
- Scanner shows improved metrics

**Session 3 Validation Checklist**:

- [ ] Run `./scripts/doc-analysis.sh`
- [ ] Health score 78+ achieved
- [ ] File count reduced by 30%
- [ ] Orphan ratio <40%
- [ ] Zero duplicate content (verified by query tool)
- [ ] All git moves tracked properly
- [ ] Directory structure documented
- [ ] Manual review of 3 merged documents for accuracy

---

## Session 4: Rewrite & Polish

**Goal**: Apply direct, actionable language to core documentation

**Quality Standards**:

- Every rewrite reviewed for accuracy
- Technical correctness verified against codebase
- All claims validated
- Cross-references functional
- Code examples tested

### Tasks (Estimated: 180 minutes - extended for quality)

#### 1. Identify & Prioritize Hub Documents (20 min)

**Actions**:

- Run query tool to find most-referenced docs
- Identify top 10 by PageRank/references
- Assess current quality and rewrite needs
- Create rewrite order (critical → important → nice-to-have)

**Priority List** (to be validated):

1. CLAUDE.md
2. README.md
3. AGENTS.md
4. CONTRIBUTING.md
5. docs/ARCHITECTURE.md
6. docs/INDEX.md
7. ASSET_MANAGEMENT.md
8. (3 more from analysis)

#### 2. Rewrite Core Documents (120 min, ~12 min each)

**For Each Document**:

- Read through completely
- Remove historical/outdated content
- Rewrite in direct, actionable language
- Verify technical accuracy against codebase
- Add cross-references where valuable
- Test any code examples
- Validate all links

**Rewrite Principles**:

- **Direct**: No fluff, no unnecessary context
- **Development-focused**: Useful for coding now, not history
- **Actionable**: Every section enables a task
- **Current**: Remove outdated references completely
- **Connected**: Cross-reference related docs
- **Tested**: All examples and commands verified

**Per-Document Validation**:

- Technical accuracy verified (check code)
- All links functional
- No TODO/FIXME left without resolution
- Follows project voice/style
- Peer reviewable quality

#### 3. Final Polish & Cross-Reference Pass (40 min)

**Actions**:

- Review all rewritten docs as a set
- Ensure consistent terminology
- Add missing cross-references
- Create navigation paths between related docs
- Final scanner validation
- Update INDEX.md with improved summaries

**Validation**:

- Consistent voice across all docs
- No dead-end pages (all have next steps)
- Technical terms used consistently
- Cross-reference graph is logical

**Session 4 Validation Checklist**:

- [ ] Run `./scripts/doc-analysis.sh`
- [ ] Health score 85+ achieved
- [ ] Orphan ratio <20%
- [ ] Top 10 docs fully rewritten and validated
- [ ] All code examples tested
- [ ] Zero outdated references in core docs
- [ ] Cross-reference validation complete
- [ ] Manual read-through of complete doc set
- [ ] Ready for production use

---

## Quick Reference Commands

```bash
# Check progress
node scripts/doc-scanner.cjs

# Full health check
./scripts/doc-analysis.sh
cat doc-analysis/INSIGHTS.md

# Find orphans
python3 scripts/query_docs.py --db doc-analysis/documents.db --orphaned

# Find TODOs
python3 scripts/query_docs.py --db doc-analysis/documents.db --pattern "TODO"

# Export for tracking
python3 scripts/query_docs.py --db doc-analysis/documents.db --orphaned --export orphans.csv
```

---

## Success Metrics

| Session  | Health Score | Orphan Ratio | Broken Refs | File Count |
| -------- | ------------ | ------------ | ----------- | ---------- |
| 1 (Done) | 64/100       | 76%          | 248         | 129        |
| 2 (Next) | 70/100       | 60%          | 0           | 125        |
| 3        | 78/100       | 40%          | 0           | 90         |
| 4        | 85/100       | <20%         | 0           | 80         |

---

## Ready to Start Session 2?

Just run:

```bash
# Refresh analysis
./scripts/doc-analysis.sh

# Review current state
cat doc-analysis/INSIGHTS.md

# Begin Session 2 tasks
```

See you next session! 🚀
