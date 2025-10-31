# Documentation Quality Standards

## Core Principles

**No workarounds. No shortcuts. High quality throughout.**

This document defines the quality standards for WynIsBuff2 documentation overhaul. Every task, every change, every decision must meet these standards.

---

## Quality Gates

### 1. Accuracy Gate

Every piece of documentation must be technically accurate.

**Validation**:

- [ ] Code examples tested and functional
- [ ] File paths verified to exist
- [ ] API references match actual code
- [ ] Commands produce expected results
- [ ] Version numbers are current

**Process**:

1. Read code before writing documentation
2. Test every example
3. Verify every path
4. Cross-check version information
5. Run examples in clean environment

### 2. Completeness Gate

No placeholder content. No TODO markers without resolution plan.

**Validation**:

- [ ] All sections fully written
- [ ] No "Coming soon" or "TBD" without dates
- [ ] Every topic covered to actionable depth
- [ ] All questions a reader would have are answered
- [ ] Related topics cross-referenced

**Process**:

1. If incomplete, either finish it or remove it
2. Stub files require explicit justification
3. TODO markers must have resolution date
4. Partial content goes in drafts, not main docs

### 3. Navigation Gate

Every document is discoverable and connected.

**Validation**:

- [ ] Linked from INDEX.md or parent directory README
- [ ] Has clear "Related Documents" section
- [ ] All internal links functional
- [ ] Breadcrumb path to root exists
- [ ] No dead-end pages

**Process**:

1. Add to index immediately upon creation
2. Link to related docs bidirectionally
3. Test navigation paths end-to-end
4. Run scanner after every linking change

### 4. Clarity Gate

Documentation must be direct, actionable, development-focused.

**Validation**:

- [ ] No unnecessary historical context
- [ ] Every section has clear purpose
- [ ] Examples are practical and relevant
- [ ] Language is direct (no fluff)
- [ ] Reader knows what to do next

**Anti-patterns**:

- ❌ "This might be helpful for..."
- ❌ "We're planning to..."
- ❌ "In the old version we used to..."
- ❌ Verbose explanations of obvious concepts
- ❌ Apologetic or uncertain language

**Good patterns**:

- ✅ "Use X to achieve Y"
- ✅ "Run this command: ..."
- ✅ "See [related doc] for details"
- ✅ Clear steps numbered 1, 2, 3
- ✅ Code-first explanations

### 5. Consistency Gate

All documentation follows project conventions.

**Validation**:

- [ ] File naming: kebab-case for files, PascalCase for classes
- [ ] Headers use consistent hierarchy
- [ ] Code blocks have language tags
- [ ] Links use relative paths
- [ ] Terminology matches codebase

**Reference**:

- Classes: PascalCase (PlayerController)
- Files: kebab-case (player-controller.md)
- Directories: camelCase (src/modules)
- Constants: SCREAMING_SNAKE (SCENE_KEYS)
- Events: namespace:action (player:jump)

### 6. Maintenance Gate

Changes are tracked, validated, and sustainable.

**Validation**:

- [ ] Git history is clean and meaningful
- [ ] Moves use `git mv` (not delete+add)
- [ ] Commit messages explain the why
- [ ] Automated scanners pass
- [ ] Health score improves or maintains

**Commit Message Format**:

```
docs: [category] brief description

- Specific change 1
- Specific change 2
- Why this change matters

Health score: [before] → [after]
```

---

## Per-Session Standards

### Session 2: Architecture & Critical Fixes

**Minimum Acceptable Quality**:

- Zero broken references (scanner validated)
- All architectural decisions documented
- Every file move tracked in git
- Index is comprehensive and tested
- Health score 70+

**Validation Process**:

1. Complete each task
2. Run scanner immediately
3. Manual verification of changes
4. Document decisions in commit
5. Final full scanner run
6. Complete validation checklist

### Session 3: Consolidation

**Minimum Acceptable Quality**:

- No information loss during merges
- All merges compared via diff
- Git history shows what was merged
- Superseded files archived, not deleted
- Clear directory structure with README in each
- Health score 78+

**Validation Process**:

1. Before merge: save diff of both sources
2. After merge: verify all unique content preserved
3. Test merged instructions work
4. Update all references
5. Run full scanner validation
6. Manual review of 3+ merged docs

### Session 4: Rewrite & Polish

**Minimum Acceptable Quality**:

- All code examples tested
- Technical accuracy verified against codebase
- No outdated references remain
- Consistent voice throughout
- Production-ready quality
- Health score 85+

**Validation Process**:

1. Read entire doc before rewriting
2. Test all examples in clean environment
3. Verify every technical claim
4. Cross-reference validation
5. Final read-through as user
6. Peer-reviewable quality check

---

## Automated Validation Tools

### Quick Scanner (2 seconds)

```bash
node scripts/doc-scanner.cjs
```

**Catches**:

- Outdated references
- Broken links
- Duplicate titles
- Missing headers
- Old dates

**Run**: After every set of changes

### Deep Analyzer (60 seconds)

```bash
./scripts/doc-analysis.sh
```

**Provides**:

- Health score
- Orphan analysis
- Knowledge graph
- Broken reference details
- Consolidation opportunities

**Run**: After completing each session task

### Query Tool (instant)

```bash
python3 scripts/query_docs.py --db doc-analysis/documents.db [OPTIONS]
```

**Uses**:

- Find orphaned files
- Search for patterns (TODO, FIXME)
- Token frequency analysis
- Custom investigations

**Run**: As needed for specific queries

---

## Manual Validation Procedures

### Link Validation (per document)

1. Click every internal link
2. Verify target section exists
3. Test navigation path back
4. Confirm bidirectional links work

### Code Example Validation (per example)

1. Copy code exactly as written
2. Run in clean environment
3. Verify expected output
4. Document any prerequisites
5. Test error cases if applicable

### Content Accuracy Validation (per technical claim)

1. Find relevant code in codebase
2. Verify claim matches implementation
3. Check version applicability
4. Update or remove if incorrect

### Navigation Path Validation (per document)

1. Start from INDEX.md
2. Follow links to target doc
3. Verify all intermediate links work
4. Test alternative paths
5. Confirm no dead ends

---

## Quality Checklist Template

Copy this for each session:

```markdown
## Session [N] Quality Checklist

### Pre-Session

- [ ] Latest scanner results reviewed
- [ ] Task list prioritized
- [ ] Success criteria defined
- [ ] Time allocated appropriately

### During Session

- [ ] Each task validated before next
- [ ] Scanner run after major changes
- [ ] Git commits are atomic and clear
- [ ] Decisions documented
- [ ] No placeholder content added

### Post-Session

- [ ] All planned tasks completed
- [ ] Full scanner validation passed
- [ ] Health score target met
- [ ] Manual validation complete
- [ ] Session summary documented

### Quality Gates Passed

- [ ] Accuracy Gate
- [ ] Completeness Gate
- [ ] Navigation Gate
- [ ] Clarity Gate
- [ ] Consistency Gate
- [ ] Maintenance Gate

### Metrics

- Health Score: [before] → [after] (Target: [X])
- Orphan Ratio: [before] → [after]
- Broken Refs: [before] → [after]
- File Count: [before] → [after]

### Notes

[Any important decisions, tradeoffs, or discoveries]
```

---

## Red Flags - Stop and Fix

If you encounter these, stop and address immediately:

🚨 **Critical Issues**:

- Adding content you haven't verified
- Creating broken links
- Losing information during merges
- Unclear commit messages
- Scanner regressions
- Placeholder content in production docs

⚠️ **Warning Signs**:

- Task taking significantly longer than estimated
- Uncertain about technical accuracy
- Multiple approaches seem viable
- Temptation to "fix later"
- Git history getting messy

**Response Protocol**:

1. Stop current task
2. Document the issue
3. Run scanner to assess impact
4. Choose best path forward
5. Address properly, not quickly
6. Validate before continuing

---

## Success Metrics

| Metric          | Session 2 Target | Session 3 Target | Session 4 Target |
| --------------- | ---------------- | ---------------- | ---------------- |
| Health Score    | 70+              | 78+              | 85+              |
| Orphan Ratio    | <60%             | <40%             | <20%             |
| Broken Refs     | 0                | 0                | 0                |
| Stub Files      | <20              | <10              | <5               |
| Avg Tokens/File | 100+             | 120+             | 150+             |

### Definition of Done (Session 4)

Documentation overhaul is complete when:

- ✅ Health score 85+
- ✅ Zero broken references
- ✅ Orphan ratio <20%
- ✅ All core docs rewritten to standard
- ✅ Clear directory structure
- ✅ Comprehensive INDEX.md
- ✅ All code examples tested
- ✅ No TODO/FIXME without resolution
- ✅ Cross-references functional
- ✅ Manual read-through passes
- ✅ Production-ready quality

---

## Maintenance Standards

After overhaul completion:

### Weekly

- Run quick scanner
- Address any new issues immediately
- Keep health score 85+

### Monthly

- Full deep analysis
- Review for outdated content
- Check for new orphans
- Validate example code still works

### Per Change

- Update related docs
- Test affected examples
- Maintain cross-references
- Run scanner before committing

---

## Philosophy

> "Documentation is code. It has correctness, maintainability, and testability requirements just like code. Treat it with the same rigor."

**Key Tenets**:

1. **Accuracy over speed** - Better to take time and be right
2. **Completeness over coverage** - Better to fully document 10 things than partially document 100
3. **Clarity over cleverness** - Direct language beats elegant prose
4. **Maintainability over novelty** - Consistent patterns beat creative organization
5. **Validation over trust** - Test everything, assume nothing

---

## When In Doubt

Ask these questions:

1. **Is this technically accurate?** → Verify against code
2. **Is this complete?** → Could someone use this successfully?
3. **Is this discoverable?** → How would someone find this?
4. **Is this clear?** → Would a new dev understand?
5. **Is this maintainable?** → Can this be easily updated?

If you can't answer "yes" to all five, the documentation isn't ready.

---

**Remember**: The goal is production-ready documentation that serves developers effectively. Quality is non-negotiable.
