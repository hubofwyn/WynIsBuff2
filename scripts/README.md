# Documentation Analysis Tools

This directory contains tools for analyzing and maintaining WynIsBuff2's documentation quality.

## Tools Available

### 1. Quick Scanner (Node.js)

**File**: `doc-scanner.cjs`

Fast, lightweight scanner that identifies obvious documentation issues:

- Outdated references (TODO, FIXME, deprecated, "in progress")
- Duplicate section titles across files
- Broken internal links
- Old datestamps
- Files without headers
- Empty or oversized files

**Usage**:

```bash
node scripts/doc-scanner.cjs
```

**Output**: `doc-scan-report.json` in project root

**Runtime**: ~2 seconds

### 2. Deep Analyzer (Python)

**File**: `document_structurer.py`

Comprehensive documentation analysis with:

- Knowledge graph generation
- Token extraction and indexing
- Relationship mapping
- SQLite database for queries
- Network analysis (hubs, orphans, PageRank)
- Health scoring
- Actionable insights

**Usage**:

```bash
./scripts/doc-analysis.sh
```

**Output**: `doc-analysis/` directory with:

- `INSIGHTS.md` - Health score and recommendations
- `SUMMARY.md` - Statistics overview
- `documents.db` - SQLite database for custom queries
- `knowledge_graph.json` - Complete structured data
- `token_frequency.csv` - Most common terms

**Runtime**: ~30-60 seconds

### 3. Query Tool

**File**: `query_docs.py`

Query the documentation database for specific insights.

**Common queries**:

```bash
# Find orphaned files (no incoming links)
python3 scripts/query_docs.py --db doc-analysis/documents.db --orphaned

# Find most common tokens
python3 scripts/query_docs.py --db doc-analysis/documents.db --frequency --limit 50

# Find specific token usage
python3 scripts/query_docs.py --db doc-analysis/documents.db --token "BaseManager"

# Find TODOs/FIXMEs
python3 scripts/query_docs.py --db doc-analysis/documents.db --pattern "TODO|FIXME"

# Files with most content
python3 scripts/query_docs.py --db doc-analysis/documents.db --top-files --limit 20
```

## Workflow

### Initial Documentation Audit

1. **Run comprehensive analysis**:

    ```bash
    ./scripts/doc-analysis.sh
    ```

2. **Review insights**:

    ```bash
    cat doc-analysis/INSIGHTS.md
    ```

3. **Identify priorities**:
    - Check health score (target: 80+)
    - Review critical issues (broken links, orphans)
    - Note duplication candidates

### Regular Maintenance

**Weekly**: Run quick scanner

```bash
node scripts/doc-scanner.cjs
```

**Monthly**: Full analysis and compare against baseline

```bash
./scripts/doc-analysis.sh
# Review improvements/regressions
```

### Specific Investigations

**Find duplicate content**:

```bash
python3 scripts/query_docs.py --db doc-analysis/documents.db --pattern "specific phrase"
```

**Track term usage**:

```bash
python3 scripts/query_docs.py --db doc-analysis/documents.db --token "EventBus"
```

**Find navigation hubs**:

```bash
# Most referenced files become natural navigation hubs
cat doc-analysis/INSIGHTS.md | grep -A 10 "Most Referenced"
```

## Output Interpretation

### Health Score

| Score  | Status    | Action Required     |
| ------ | --------- | ------------------- |
| 80-100 | Excellent | Maintain            |
| 60-79  | Good      | Minor fixes         |
| 40-59  | Fair      | Improvement sprint  |
| 0-39   | Poor      | Immediate attention |

### Key Metrics

- **Orphan Ratio**: <20% ideal (files with no incoming links)
- **Broken Links**: Should be 0
- **Stub Files**: <50 lines - may need expansion
- **Hub Files**: Most referenced docs - good index candidates

## Project-Specific Patterns

### WynIsBuff2 Documentation Structure

Current state (from initial scan):

- **66 documentation files**
- **534 KB total**
- **~8 KB average file size**

### Common Issues Found

1. **Outdated markers**: "TODO", "in progress", "deprecated"
2. **Missing headers**: Some files lack structure
3. **Old dates**: References to 2024
4. **Duplicated titles**: Same section names across files

### Documentation Standards

Based on CLAUDE.md principles:

- **Direct language**: No fluff, actionable content
- **Development-focused**: Useful for coding, not history
- **Consolidated**: No duplication, single source of truth
- **Cross-referenced**: Clear navigation paths
- **Current**: Remove outdated historical content

## Consolidation Strategy

1. **Identify duplicates**: Use query tool to find similar content
2. **Determine canonical source**: Choose most current/complete version
3. **Merge content**: Consolidate into single document
4. **Add cross-references**: Link from deprecated to canonical
5. **Archive old files**: Move to `docs/archive/` with README
6. **Update references**: Fix any broken links

## Next Steps

1. **Phase 1**: Run full analysis (DONE)
2. **Phase 2**: Review INSIGHTS.md and prioritize issues
3. **Phase 3**: Create documentation architecture/index
4. **Phase 4**: Consolidate duplicates
5. **Phase 5**: Rewrite in direct, actionable language
6. **Phase 6**: Add cross-references and navigation
7. **Phase 7**: Validate against codebase

## Maintenance Commands

```bash
# Quick health check
node scripts/doc-scanner.cjs && cat doc-scan-report.json | jq '.stats'

# Full analysis
./scripts/doc-analysis.sh

# Find specific issues
python3 scripts/query_docs.py --db doc-analysis/documents.db --orphaned
python3 scripts/query_docs.py --db doc-analysis/documents.db --pattern "TODO"

# Export issues for tracking
python3 scripts/query_docs.py --db doc-analysis/documents.db --orphaned --export orphans.csv
```

## Dependencies

### Node.js Scanner

- Node.js 14+ (built-in modules only)

### Python Analyzer

- Python 3.10+
- `ruamel.yaml` - YAML parsing
- `python-hcl2` - HCL/Terraform parsing
- `networkx` - Graph analysis

Automatically installed via `doc-analysis.sh` into isolated virtualenv.
