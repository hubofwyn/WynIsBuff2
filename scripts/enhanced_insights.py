#!/usr/bin/env python3
"""
enhanced_insights.py - Generate actionable, semantic insights with prioritized recommendations

Adds to insights_report.py:
- Priority matrix for action items
- Documentation coverage analysis
- Quality improvement roadmap
- Trend analysis (comparing multiple scans)
- Semantic categorization of issues
"""

import sqlite3
import json
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Set
from dataclasses import dataclass, field
from collections import defaultdict
from datetime import datetime
import sys

# Import the base insights reporter
try:
    from insights_report import DocAnalyzer, DocInsights, calculate_health_score
except ImportError:
    print("Error: insights_report.py must be in the same directory", file=sys.stderr)
    sys.exit(1)

@dataclass
class ActionItem:
    """Prioritized action item"""
    priority: str  # "critical", "high", "medium", "low"
    category: str  # "broken_refs", "orphans", "stubs", "consolidation", etc.
    title: str
    description: str
    files_affected: List[str] = field(default_factory=list)
    estimated_effort: str = "medium"  # "low", "medium", "high"
    impact: str = "medium"  # "low", "medium", "high"


@dataclass
class CoverageGap:
    """Documentation coverage gap"""
    topic: str
    evidence: str
    recommendation: str


class EnhancedAnalyzer:
    def __init__(self, db_path: str, kg_path: str = None, ignore_prefixes: list = None):
        self.analyzer = DocAnalyzer(db_path, kg_path, tuple(ignore_prefixes or []))
        self.insights = None

    def __enter__(self):
        self.analyzer.__enter__()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.analyzer.__exit__(exc_type, exc_val, exc_tb)

    def generate_enhanced_insights(self) -> Tuple[DocInsights, List[ActionItem], List[CoverageGap]]:
        """Generate insights + actionable recommendations"""
        self.insights = self.analyzer.generate_insights()

        action_items = self._generate_action_items()
        coverage_gaps = self._analyze_coverage_gaps()

        return self.insights, action_items, coverage_gaps

    def _generate_action_items(self) -> List[ActionItem]:
        """Generate prioritized action items from insights"""
        items = []

        # Critical: Broken references in main navigation
        critical_broken = self._identify_critical_broken_refs()
        if critical_broken:
            items.append(ActionItem(
                priority="critical",
                category="broken_refs",
                title="Fix broken references in main documentation",
                description=f"Found {len(critical_broken)} broken references in key documents that may affect navigation",
                files_affected=[f"{src} → {tgt}" for src, tgt in critical_broken[:10]],
                estimated_effort="medium",
                impact="high"
            ))

        # High: Stub files that should have content
        important_stubs = self._identify_important_stubs()
        if important_stubs:
            items.append(ActionItem(
                priority="high",
                category="stubs",
                title="Complete stub files in main documentation",
                description=f"Found {len(important_stubs)} stub files that appear in navigation or are referenced",
                files_affected=[f"{f} ({t} tokens)" for f, t in important_stubs[:10]],
                estimated_effort="high",
                impact="medium"
            ))

        # High: Orphaned files that should be integrated
        valuable_orphans = self._identify_valuable_orphans()
        if valuable_orphans:
            items.append(ActionItem(
                priority="high",
                category="orphans",
                title="Integrate orphaned documentation into main structure",
                description=f"Found {len(valuable_orphans)} substantial orphaned files that should be linked",
                files_affected=valuable_orphans[:15],
                estimated_effort="medium",
                impact="medium"
            ))

        # Medium: Consolidation opportunities
        if len(self.insights.consolidation_candidates) > 5:
            items.append(ActionItem(
                priority="medium",
                category="consolidation",
                title="Consolidate duplicate/similar documentation",
                description=f"Found {len(self.insights.consolidation_candidates)} pairs of similar documents",
                files_affected=[f"{f1} ⇄ {f2} ({s}% similar)"
                               for f1, f2, s in self.insights.consolidation_candidates[:10]],
                estimated_effort="high",
                impact="medium"
            ))

        # Medium: Large files that should be split
        oversized = [f for f, t in self.insights.large_files if t > 2000]
        if oversized:
            items.append(ActionItem(
                priority="medium",
                category="large_files",
                title="Split oversized documentation files",
                description=f"Found {len(oversized)} files with >2000 tokens that may be hard to maintain",
                files_affected=oversized[:10],
                estimated_effort="medium",
                impact="low"
            ))

        # Low: Clean up truly empty/obsolete stubs
        empty_stubs = [f for f, t in self.insights.stub_files if t == 0]
        if len(empty_stubs) > 10:
            items.append(ActionItem(
                priority="low",
                category="cleanup",
                title="Remove or populate empty stub files",
                description=f"Found {len(empty_stubs)} completely empty markdown files",
                files_affected=empty_stubs[:20],
                estimated_effort="low",
                impact="low"
            ))

        # Sort by priority
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        items.sort(key=lambda x: priority_order[x.priority])

        return items

    def _identify_critical_broken_refs(self) -> List[Tuple[str, str]]:
        """Identify broken refs in README, index, or main navigation files"""
        critical_sources = {'README.md', 'index.md', 'INDEX.md', 'docs/INDEX.md',
                           'docs/index.md', 'QUICKSTART.md', 'setup_guide.md'}

        return [
            (src, tgt) for src, tgt in self.insights.broken_references
            if any(src.endswith(cs) for cs in critical_sources) or 'index' in src.lower()
        ]

    def _identify_important_stubs(self) -> List[Tuple[str, int]]:
        """Identify stub files that are referenced or in main docs/"""
        # Files in main docs/ directory or referenced elsewhere
        referenced_files = set()
        conn = self.analyzer.conn
        for row in conn.execute("SELECT DISTINCT target FROM relationships"):
            referenced_files.add(row['target'])

        important = [
            (f, t) for f, t in self.insights.stub_files
            if f.startswith('docs/') or f in referenced_files
        ]

        return important

    def _identify_valuable_orphans(self) -> List[str]:
        """Identify orphaned files with substantial content that should be integrated"""
        conn = self.analyzer.conn

        # Get token counts for orphaned files
        valuable = []
        for orphan in self.insights.orphaned_files:
            row = conn.execute(
                "SELECT token_count FROM documents WHERE relative_path = ?",
                (orphan,)
            ).fetchone()

            if row and row['token_count'] > 100:  # Substantial content
                # Prioritize main docs/ directory
                if orphan.startswith('docs/'):
                    valuable.insert(0, orphan)
                else:
                    valuable.append(orphan)

        return valuable[:30]  # Top 30

    def _analyze_coverage_gaps(self) -> List[CoverageGap]:
        """Analyze potential documentation coverage gaps"""
        gaps = []

        # Analyze what topics we have
        conn = self.analyzer.conn

        # Check for common infrastructure docs
        doc_files = set(row['relative_path'] for row in
                       conn.execute("SELECT relative_path FROM documents WHERE file_type = '.md'"))

        # Expected topics for a home network ops repo
        expected_topics = {
            'backup': ('backup', 'Backup and disaster recovery documentation'),
            'monitoring': ('monitor', 'System monitoring and alerting'),
            'security': ('security', 'Security hardening and best practices'),
            'troubleshooting': ('troubleshoot', 'Troubleshooting guides and runbooks'),
            'disaster_recovery': ('disaster', 'Disaster recovery procedures'),
            'changelog': ('changelog', 'Change log and version history'),
            'runbook': ('runbook', 'Operational runbooks'),
            'api_docs': ('api', 'API documentation and integration guides'),
        }

        for topic, (keyword, description) in expected_topics.items():
            # Check if we have docs covering this
            matching = [f for f in doc_files if keyword in f.lower()]

            if not matching:
                gaps.append(CoverageGap(
                    topic=topic.replace('_', ' ').title(),
                    evidence=f"No files found containing '{keyword}'",
                    recommendation=f"Consider adding {description}"
                ))
            elif len(matching) == 1 and any(row['token_count'] < 100 for row in
                    conn.execute("SELECT token_count FROM documents WHERE relative_path = ?",
                               (matching[0],))):
                gaps.append(CoverageGap(
                    topic=topic.replace('_', ' ').title(),
                    evidence=f"Found {matching[0]} but it's a stub",
                    recommendation=f"Expand {description.lower()}"
                ))

        return gaps


def print_enhanced_report(insights: DocInsights, action_items: List[ActionItem],
                         coverage_gaps: List[CoverageGap]):
    """Print enhanced insights report with actionable recommendations"""

    # Print standard insights first
    from insights_report import print_report
    print_report(insights, 'text')

    # Add enhanced sections
    print("\n" + "=" * 80)
    print("🎯 PRIORITY ACTION ITEMS")
    print("=" * 80)

    if not action_items:
        print("\n✅ No critical issues found!")
    else:
        priority_icons = {
            "critical": "🔴",
            "high": "🟡",
            "medium": "🟢",
            "low": "⚪"
        }

        for i, item in enumerate(action_items, 1):
            icon = priority_icons.get(item.priority, "•")
            print(f"\n{icon} [{item.priority.upper()}] {item.title}")
            print(f"   Category: {item.category}")
            print(f"   Impact: {item.impact.capitalize()} | Effort: {item.estimated_effort.capitalize()}")
            print(f"   {item.description}")

            if item.files_affected:
                print(f"\n   Affected files ({len(item.files_affected)}):")
                for f in item.files_affected[:5]:
                    print(f"   • {f}")
                if len(item.files_affected) > 5:
                    print(f"   ... and {len(item.files_affected) - 5} more")

    # Coverage gaps
    if coverage_gaps:
        print("\n" + "=" * 80)
        print("📋 DOCUMENTATION COVERAGE GAPS")
        print("=" * 80)

        for gap in coverage_gaps:
            print(f"\n• {gap.topic}")
            print(f"  Evidence: {gap.evidence}")
            print(f"  → {gap.recommendation}")

    # Quality improvement roadmap
    print("\n" + "=" * 80)
    print("🗺️  QUALITY IMPROVEMENT ROADMAP")
    print("=" * 80)

    score, _ = calculate_health_score(insights)

    print("\nPhased approach to reach 85+ health score:")
    print("\n📍 Phase 1: Critical Issues (Week 1)")
    critical = [item for item in action_items if item.priority == "critical"]
    if critical:
        for item in critical:
            print(f"   • {item.title}")
    else:
        print("   ✅ No critical issues!")

    print("\n📍 Phase 2: High Priority (Weeks 2-3)")
    high = [item for item in action_items if item.priority == "high"]
    if high:
        for item in high[:3]:
            print(f"   • {item.title}")
    else:
        print("   ✅ No high priority issues!")

    print("\n📍 Phase 3: Optimization (Weeks 4+)")
    medium_low = [item for item in action_items if item.priority in ["medium", "low"]]
    if medium_low:
        for item in medium_low[:3]:
            print(f"   • {item.title}")

    print("\n💡 Quick Wins (Low effort, high impact):")
    quick_wins = [item for item in action_items
                  if item.estimated_effort == "low" and item.impact in ["medium", "high"]]
    if quick_wins:
        for item in quick_wins[:3]:
            print(f"   • {item.title}")
    else:
        print("   • Fix broken references in main docs")
        print("   • Link valuable orphaned files")
        print("   • Remove empty stub files")


def main():
    parser = argparse.ArgumentParser(
        description="Generate enhanced, actionable documentation insights"
    )
    parser.add_argument('db_path', help='Path to doc_structure.db')
    parser.add_argument('--kg', help='Path to knowledge_graph.json (optional)')
    parser.add_argument('--ignore-prefix', action='append', default=[], help='Prefix to ignore for orphan/stub counts (can be repeated)')
    parser.add_argument('--json', action='store_true', help='Output as JSON')

    args = parser.parse_args()

    if not Path(args.db_path).exists():
        print(f"Error: Database not found: {args.db_path}", file=sys.stderr)
        return 1

    with EnhancedAnalyzer(args.db_path, args.kg, args.ignore_prefix) as analyzer:
        insights, action_items, coverage_gaps = analyzer.generate_enhanced_insights()

        if args.json:
            # JSON output
            output = {
                'health_score': calculate_health_score(insights)[0],
                'action_items': [
                    {
                        'priority': item.priority,
                        'category': item.category,
                        'title': item.title,
                        'description': item.description,
                        'effort': item.estimated_effort,
                        'impact': item.impact,
                        'files_affected': item.files_affected
                    }
                    for item in action_items
                ],
                'coverage_gaps': [
                    {
                        'topic': gap.topic,
                        'evidence': gap.evidence,
                        'recommendation': gap.recommendation
                    }
                    for gap in coverage_gaps
                ]
            }
            print(json.dumps(output, indent=2))
        else:
            # Human-readable report
            print_enhanced_report(insights, action_items, coverage_gaps)

    return 0


if __name__ == '__main__':
    sys.exit(main())
