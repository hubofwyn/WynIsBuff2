#!/usr/bin/env python3
"""
insights_report.py - Generate actionable insights from document structure analysis

Goes beyond raw statistics to provide:
- Documentation health score
- Actionable recommendations
- Quality metrics
- Consolidation opportunities
- Orphaned content detection
"""

import sqlite3
import json
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Set
from dataclasses import dataclass, field
from collections import defaultdict
import sys

@dataclass
class DocInsights:
    """Container for documentation insights"""
    total_files: int = 0
    total_tokens: int = 0
    unique_tokens: int = 0

    # Health metrics
    orphaned_files: List[str] = field(default_factory=list)
    large_files: List[Tuple[str, int]] = field(default_factory=list)
    stub_files: List[Tuple[str, int]] = field(default_factory=list)

    # Quality indicators
    broken_references: List[Tuple[str, str]] = field(default_factory=list)
    duplicate_tokens: List[Tuple[str, int, int]] = field(default_factory=list)

    # Token analysis
    token_distribution: Dict[str, int] = field(default_factory=dict)
    file_type_stats: Dict[str, Dict] = field(default_factory=dict)

    # Network metrics
    hub_files: List[Tuple[str, int]] = field(default_factory=list)  # Files with many references
    isolated_clusters: List[Set[str]] = field(default_factory=list)

    # Recommendations
    consolidation_candidates: List[Tuple[str, str, float]] = field(default_factory=list)

class DocAnalyzer:
    def __init__(self, db_path: str, knowledge_graph_path: str = None):
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.kg = None

        if knowledge_graph_path and Path(knowledge_graph_path).exists():
            with open(knowledge_graph_path, 'r', encoding='utf-8') as f:
                self.kg = json.load(f)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.conn.close()

    def generate_insights(self) -> DocInsights:
        """Generate comprehensive insights"""
        insights = DocInsights()

        # Basic stats
        stats = self.conn.execute("""
            SELECT COUNT(*) as files,
                   SUM(token_count) as tokens
            FROM documents
        """).fetchone()

        insights.total_files = stats['files']
        insights.total_tokens = stats['tokens']

        unique_tokens = self.conn.execute("""
            SELECT COUNT(DISTINCT value) FROM tokens
        """).fetchone()[0]

        insights.unique_tokens = unique_tokens

        # Quality metrics
        insights.orphaned_files = self._find_orphaned()
        insights.large_files = self._find_large_files()
        insights.stub_files = self._find_stub_files()
        insights.broken_references = self._find_broken_references()

        # Token analysis
        insights.token_distribution = self._token_distribution()
        insights.file_type_stats = self._file_type_stats()

        # Network analysis
        insights.hub_files = self._find_hub_files()

        # Find duplicate content indicators
        insights.duplicate_tokens = self._find_duplicate_patterns()

        # Consolidation opportunities
        insights.consolidation_candidates = self._find_consolidation_candidates()

        return insights

    def _find_orphaned(self) -> List[str]:
        """Find files with no incoming or outgoing references"""
        query = """
            SELECT relative_path FROM documents
            WHERE relative_path NOT IN (
                SELECT DISTINCT source FROM relationships
                UNION
                SELECT DISTINCT target FROM relationships
            )
            ORDER BY relative_path
        """
        return [row['relative_path'] for row in self.conn.execute(query)]

    def _find_large_files(self, threshold: int = 1000) -> List[Tuple[str, int]]:
        """Find files with unusually high token counts"""
        query = """
            SELECT relative_path, token_count
            FROM documents
            WHERE token_count > ?
            ORDER BY token_count DESC
            LIMIT 20
        """
        return [(row['relative_path'], row['token_count'])
                for row in self.conn.execute(query, (threshold,))]

    def _find_stub_files(self, threshold: int = 50) -> List[Tuple[str, int]]:
        """Find files with very low content (potential stubs or incomplete docs)"""
        query = """
            SELECT relative_path, token_count
            FROM documents
            WHERE token_count < ?
              AND file_type = '.md'
            ORDER BY token_count ASC
            LIMIT 30
        """
        return [(row['relative_path'], row['token_count'])
                for row in self.conn.execute(query, (threshold,))]

    def _find_broken_references(self) -> List[Tuple[str, str]]:
        """Find references to non-existent files"""
        query = """
            SELECT DISTINCT r.source, r.target
            FROM relationships r
            WHERE r.target NOT IN (
                SELECT relative_path FROM documents
            )
            ORDER BY r.source, r.target
        """
        return [(row['source'], row['target'])
                for row in self.conn.execute(query)]

    def _token_distribution(self) -> Dict[str, int]:
        """Get distribution of token types"""
        query = """
            SELECT token_type, COUNT(*) as count
            FROM tokens
            GROUP BY token_type
            ORDER BY count DESC
        """
        return {row['token_type']: row['count']
                for row in self.conn.execute(query)}

    def _file_type_stats(self) -> Dict[str, Dict]:
        """Statistics by file type"""
        query = """
            SELECT file_type,
                   COUNT(*) as count,
                   SUM(size) as total_size,
                   AVG(token_count) as avg_tokens,
                   MAX(token_count) as max_tokens
            FROM documents
            GROUP BY file_type
            ORDER BY count DESC
        """
        return {row['file_type']: {
            'count': row['count'],
            'total_size': row['total_size'],
            'avg_tokens': round(row['avg_tokens'], 1),
            'max_tokens': row['max_tokens']
        } for row in self.conn.execute(query)}

    def _find_hub_files(self, threshold: int = 5) -> List[Tuple[str, int]]:
        """Find files that are referenced by many others (hubs)"""
        query = """
            SELECT target, COUNT(*) as ref_count
            FROM relationships
            GROUP BY target
            HAVING ref_count >= ?
            ORDER BY ref_count DESC
            LIMIT 15
        """
        return [(row['target'], row['ref_count'])
                for row in self.conn.execute(query, (threshold,))]

    def _find_duplicate_patterns(self) -> List[Tuple[str, int, int]]:
        """Find tokens that appear unusually frequently (possible duplication)"""
        query = """
            SELECT value, COUNT(*) as count, COUNT(DISTINCT file) as file_count
            FROM tokens
            WHERE token_type IN ('value', 'quoted_string', 'code_block')
              AND LENGTH(value) > 30
            GROUP BY value
            HAVING count > 5
            ORDER BY count DESC
            LIMIT 20
        """
        return [(row['value'][:80], row['count'], row['file_count'])
                for row in self.conn.execute(query)]

    def _find_consolidation_candidates(self) -> List[Tuple[str, str, float]]:
        """Find files that might be candidates for consolidation"""
        # Files with very similar token sets
        query = """
            SELECT d1.relative_path as file1,
                   d2.relative_path as file2,
                   COUNT(*) as common_tokens
            FROM tokens t1
            JOIN tokens t2 ON t1.value = t2.value
            JOIN documents d1 ON t1.file = d1.relative_path
            JOIN documents d2 ON t2.file = d2.relative_path
            WHERE d1.relative_path < d2.relative_path
              AND d1.file_type = '.md'
              AND d2.file_type = '.md'
              AND d1.token_count < 500
              AND d2.token_count < 500
            GROUP BY d1.relative_path, d2.relative_path
            HAVING common_tokens > 30
            ORDER BY common_tokens DESC
            LIMIT 15
        """

        results = []
        for row in self.conn.execute(query):
            # Calculate similarity score
            file1_tokens = self.conn.execute(
                "SELECT token_count FROM documents WHERE relative_path = ?",
                (row['file1'],)
            ).fetchone()['token_count']

            file2_tokens = self.conn.execute(
                "SELECT token_count FROM documents WHERE relative_path = ?",
                (row['file2'],)
            ).fetchone()['token_count']

            similarity = row['common_tokens'] / max(file1_tokens, file2_tokens)

            if similarity > 0.4:  # More than 40% similarity
                results.append((row['file1'], row['file2'], round(similarity * 100, 1)))

        return results

def calculate_health_score(insights: DocInsights) -> Tuple[int, List[str]]:
    """
    Calculate documentation health score (0-100)
    Returns: (score, list of issues)
    """
    score = 100
    issues = []

    # Orphaned files penalty
    orphan_ratio = len(insights.orphaned_files) / max(insights.total_files, 1)
    if orphan_ratio > 0.3:
        penalty = min(20, int(orphan_ratio * 40))
        score -= penalty
        issues.append(f"High orphan ratio: {len(insights.orphaned_files)}/{insights.total_files} files ({orphan_ratio*100:.1f}%)")

    # Broken references penalty
    if insights.broken_references:
        penalty = min(15, len(insights.broken_references))
        score -= penalty
        issues.append(f"{len(insights.broken_references)} broken references")

    # Stub files penalty
    stub_ratio = len(insights.stub_files) / max(insights.total_files, 1)
    if stub_ratio > 0.2:
        penalty = min(10, int(stub_ratio * 30))
        score -= penalty
        issues.append(f"Too many stub files: {len(insights.stub_files)} files with <50 tokens")

    # Large files warning
    if len(insights.large_files) > 5:
        score -= 5
        issues.append(f"{len(insights.large_files)} very large files (>1000 tokens) - consider splitting")

    # Consolidation opportunities
    if len(insights.consolidation_candidates) > 10:
        score -= 5
        issues.append(f"{len(insights.consolidation_candidates)} potential duplicate/similar documents")

    # Positive factors
    if insights.hub_files:
        score += 5
        issues.append(f"✅ Good cross-referencing: {len(insights.hub_files)} hub files")

    return max(0, min(100, score)), issues

def print_report(insights: DocInsights, output_format: str = 'text'):
    """Generate and print insights report"""

    if output_format == 'json':
        print(json.dumps({
            'total_files': insights.total_files,
            'total_tokens': insights.total_tokens,
            'unique_tokens': insights.unique_tokens,
            'orphaned_files': insights.orphaned_files,
            'large_files': [{'file': f, 'tokens': t} for f, t in insights.large_files],
            'stub_files': [{'file': f, 'tokens': t} for f, t in insights.stub_files],
            'broken_references': [{'source': s, 'target': t} for s, t in insights.broken_references],
            'hub_files': [{'file': f, 'refs': r} for f, r in insights.hub_files],
            'consolidation_candidates': [
                {'file1': f1, 'file2': f2, 'similarity': s}
                for f1, f2, s in insights.consolidation_candidates
            ]
        }, indent=2))
        return

    # Text report
    print("=" * 80)
    print("📊 DOCUMENTATION INSIGHTS REPORT")
    print("=" * 80)

    # Health score
    score, issues = calculate_health_score(insights)
    print(f"\n🏥 Health Score: {score}/100")

    if score >= 80:
        print("   Status: ✅ Excellent")
    elif score >= 60:
        print("   Status: ⚠️  Good, with room for improvement")
    else:
        print("   Status: ⛔ Needs attention")

    if issues:
        print("\n   Issues:")
        for issue in issues:
            if issue.startswith("✅"):
                print(f"   {issue}")
            else:
                print(f"   • {issue}")

    # Basic stats
    print(f"\n📈 Overview")
    print(f"   Total Files: {insights.total_files:,}")
    print(f"   Total Tokens: {insights.total_tokens:,}")
    print(f"   Unique Tokens: {insights.unique_tokens:,}")
    print(f"   Avg Tokens/File: {insights.total_tokens // max(insights.total_files, 1):,}")

    # File type breakdown
    print(f"\n📁 File Type Distribution")
    for ftype, stats in sorted(insights.file_type_stats.items(),
                               key=lambda x: x[1]['count'], reverse=True)[:10]:
        print(f"   {ftype:10} {stats['count']:4} files  "
              f"({stats['total_size'] // 1024:,} KB, "
              f"avg {stats['avg_tokens']:.0f} tokens)")

    # Orphaned files
    if insights.orphaned_files:
        print(f"\n🔗 Orphaned Files ({len(insights.orphaned_files)})")
        print("   Files with no incoming or outgoing references:")
        for filepath in insights.orphaned_files[:15]:
            print(f"   • {filepath}")
        if len(insights.orphaned_files) > 15:
            print(f"   ... and {len(insights.orphaned_files) - 15} more")

    # Hub files
    if insights.hub_files:
        print(f"\n⭐ Hub Files (Most Referenced)")
        for filepath, ref_count in insights.hub_files[:10]:
            print(f"   • {filepath} ({ref_count} references)")

    # Large files
    if insights.large_files:
        print(f"\n📦 Large Files (>1000 tokens)")
        print("   Consider splitting these for better maintainability:")
        for filepath, token_count in insights.large_files[:10]:
            print(f"   • {filepath} ({token_count:,} tokens)")

    # Stub files
    if insights.stub_files:
        print(f"\n📝 Stub Files (<50 tokens)")
        print("   These may be incomplete or candidates for removal:")
        for filepath, token_count in insights.stub_files[:15]:
            print(f"   • {filepath} ({token_count} tokens)")

    # Broken references
    if insights.broken_references:
        print(f"\n❌ Broken References ({len(insights.broken_references)})")
        for source, target in insights.broken_references[:15]:
            print(f"   • {source} → {target}")
        if len(insights.broken_references) > 15:
            print(f"   ... and {len(insights.broken_references) - 15} more")

    # Consolidation candidates
    if insights.consolidation_candidates:
        print(f"\n🔄 Consolidation Candidates")
        print("   Files with high similarity - consider merging:")
        for file1, file2, similarity in insights.consolidation_candidates[:10]:
            print(f"   • {file1}")
            print(f"     ↔ {file2}")
            print(f"     Similarity: {similarity}%")

    # Duplicate patterns
    if insights.duplicate_tokens:
        print(f"\n📋 Potential Duplicated Content")
        print("   Repeated long tokens (check for copy-paste):")
        for value, count, file_count in insights.duplicate_tokens[:8]:
            print(f"   • \"{value}...\"")
            print(f"     Appears {count} times across {file_count} files")

    # Recommendations
    print(f"\n💡 Recommendations")
    recommendations = generate_recommendations(insights, score)
    for i, rec in enumerate(recommendations, 1):
        print(f"   {i}. {rec}")

    print("\n" + "=" * 80)

def generate_recommendations(insights: DocInsights, health_score: int) -> List[str]:
    """Generate actionable recommendations"""
    recs = []

    if len(insights.orphaned_files) > 10:
        recs.append(f"Review {len(insights.orphaned_files)} orphaned files - link them to your index or archive/remove them")

    if len(insights.broken_references) > 0:
        recs.append(f"Fix {len(insights.broken_references)} broken references to prevent 404s")

    if len(insights.stub_files) > 15:
        recs.append(f"Complete or remove {len(insights.stub_files)} stub files (<50 tokens)")

    if len(insights.large_files) > 3:
        recs.append(f"Split {len(insights.large_files)} large files (>1000 tokens) into focused documents")

    if len(insights.consolidation_candidates) > 5:
        recs.append(f"Review {len(insights.consolidation_candidates)} similar file pairs for potential consolidation")

    if not insights.hub_files:
        recs.append("Create index/hub documents to improve navigation and cross-referencing")

    if health_score < 60:
        recs.append("Run a documentation sprint to address quality issues")

    if len(recs) == 0:
        recs.append("Great job! Your documentation is well-structured. Keep it maintained.")

    return recs

def main():
    parser = argparse.ArgumentParser(
        description="Generate actionable insights from document structure analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('--db', required=True, help='Path to documents.db')
    parser.add_argument('--kg', help='Path to knowledge_graph.json (optional)')
    parser.add_argument('--format', choices=['text', 'json'], default='text',
                       help='Output format')
    parser.add_argument('--export', help='Export report to file')

    args = parser.parse_args()

    if not Path(args.db).exists():
        print(f"Error: Database not found: {args.db}", file=sys.stderr)
        return 1

    with DocAnalyzer(args.db, args.kg) as analyzer:
        insights = analyzer.generate_insights()

        if args.export:
            import sys
            old_stdout = sys.stdout
            with open(args.export, 'w', encoding='utf-8') as f:
                sys.stdout = f
                print_report(insights, args.format)
            sys.stdout = old_stdout
            print(f"✅ Report exported to {args.export}")
        else:
            print_report(insights, args.format)

    return 0

if __name__ == '__main__':
    sys.exit(main())
