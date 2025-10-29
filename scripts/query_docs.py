#!/usr/bin/env python3
"""
query_docs.py - Interactive query tool for document structure database

Quick analysis queries for the generated SQLite database.
"""

import sqlite3
import argparse
from pathlib import Path
from typing import List, Tuple
import csv
import sys

class DocAnalyzer:
    def __init__(self, db_path: str):
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.conn.close()
    
    def execute_query(self, query: str, params: Tuple = ()) -> List[sqlite3.Row]:
        """Execute a query and return results"""
        cursor = self.conn.execute(query, params)
        return cursor.fetchall()
    
    def find_token(self, value: str, case_sensitive: bool = False) -> List[sqlite3.Row]:
        """Find all occurrences of a token"""
        if case_sensitive:
            query = "SELECT * FROM tokens WHERE value = ? ORDER BY file, line"
        else:
            query = "SELECT * FROM tokens WHERE LOWER(value) = LOWER(?) ORDER BY file, line"
        return self.execute_query(query, (value,))
    
    def find_in_file(self, filepath: str) -> List[sqlite3.Row]:
        """Get all tokens from a specific file"""
        query = "SELECT * FROM tokens WHERE file LIKE ? ORDER BY line"
        return self.execute_query(query, (f"%{filepath}%",))
    
    def token_frequency(self, limit: int = 50, min_count: int = 2) -> List[sqlite3.Row]:
        """Get most frequent tokens"""
        query = """
            SELECT value, COUNT(*) as count, 
                   COUNT(DISTINCT file) as file_count,
                   GROUP_CONCAT(DISTINCT token_type) as types
            FROM tokens
            GROUP BY value
            HAVING count >= ?
            ORDER BY count DESC
            LIMIT ?
        """
        return self.execute_query(query, (min_count, limit))
    
    def files_by_token_count(self, limit: int = 20) -> List[sqlite3.Row]:
        """Files with most tokens"""
        query = """
            SELECT relative_path, token_count, file_type, size
            FROM documents
            ORDER BY token_count DESC
            LIMIT ?
        """
        return self.execute_query(query, (limit,))
    
    def find_references_to(self, target: str) -> List[sqlite3.Row]:
        """Find all files that reference a target"""
        query = """
            SELECT DISTINCT source FROM relationships
            WHERE target LIKE ?
        """
        return self.execute_query(query, (f"%{target}%",))
    
    def find_references_from(self, source: str) -> List[sqlite3.Row]:
        """Find all references from a source file"""
        query = """
            SELECT DISTINCT target FROM relationships
            WHERE source LIKE ?
        """
        return self.execute_query(query, (f"%{source}%",))
    
    def orphaned_files(self) -> List[sqlite3.Row]:
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
        return self.execute_query(query)
    
    def files_by_type(self) -> List[sqlite3.Row]:
        """Count files by type"""
        query = """
            SELECT file_type, COUNT(*) as count,
                   SUM(size) as total_size,
                   AVG(token_count) as avg_tokens
            FROM documents
            GROUP BY file_type
            ORDER BY count DESC
        """
        return self.execute_query(query)
    
    def similar_tokens(self, pattern: str) -> List[sqlite3.Row]:
        """Find tokens matching a pattern"""
        query = """
            SELECT DISTINCT value, COUNT(*) as count
            FROM tokens
            WHERE value LIKE ?
            GROUP BY value
            ORDER BY count DESC
        """
        return self.execute_query(query, (f"%{pattern}%",))
    
    def tokens_by_type(self, token_type: str) -> List[sqlite3.Row]:
        """Get all tokens of a specific type"""
        query = """
            SELECT value, COUNT(*) as count, 
                   COUNT(DISTINCT file) as file_count
            FROM tokens
            WHERE token_type = ?
            GROUP BY value
            ORDER BY count DESC
        """
        return self.execute_query(query, (token_type,))

def print_results(rows: List[sqlite3.Row], title: str = "Results"):
    """Pretty print query results"""
    if not rows:
        print(f"\n{title}: No results found")
        return
    
    print(f"\n{title}:")
    print("=" * 80)
    
    # Get column names
    if rows:
        cols = rows[0].keys()
        
        # Calculate column widths
        widths = {col: len(col) for col in cols}
        for row in rows:
            for col in cols:
                widths[col] = max(widths[col], len(str(row[col])))
        
        # Print header
        header = " | ".join(col.ljust(widths[col]) for col in cols)
        print(header)
        print("-" * len(header))
        
        # Print rows
        for row in rows:
            print(" | ".join(str(row[col]).ljust(widths[col]) for col in cols))
    
    print(f"\nTotal: {len(rows)} rows")

def export_csv(rows: List[sqlite3.Row], filename: str):
    """Export results to CSV"""
    if not rows:
        print("No results to export")
        return
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        for row in rows:
            writer.writerow(dict(row))
    
    print(f"✅ Exported to {filename}")

def main():
    parser = argparse.ArgumentParser(
        description="Query document structure database",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --db docs.db --token production
  %(prog)s --db docs.db --frequency --limit 100
  %(prog)s --db docs.db --file config.yaml
  %(prog)s --db docs.db --orphaned
  %(prog)s --db docs.db --pattern API_KEY
  %(prog)s --db docs.db --refs-to api.md
        """
    )
    
    parser.add_argument('--db', required=True, help='Path to documents.db')
    
    # Query types
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--token', help='Find specific token')
    group.add_argument('--file', help='Get all tokens from file')
    group.add_argument('--frequency', action='store_true', help='Token frequency analysis')
    group.add_argument('--top-files', action='store_true', help='Files with most tokens')
    group.add_argument('--refs-to', help='Find references to target')
    group.add_argument('--refs-from', help='Find references from source')
    group.add_argument('--orphaned', action='store_true', help='Find orphaned files')
    group.add_argument('--by-type', action='store_true', help='Count files by type')
    group.add_argument('--pattern', help='Find tokens matching pattern')
    group.add_argument('--token-type', help='Get tokens of specific type')
    group.add_argument('--custom', help='Execute custom SQL query')
    
    # Options
    parser.add_argument('--limit', type=int, default=50, help='Result limit (default: 50)')
    parser.add_argument('--min-count', type=int, default=2, help='Minimum count for frequency (default: 2)')
    parser.add_argument('--export', help='Export results to CSV file')
    parser.add_argument('--case-sensitive', action='store_true', help='Case-sensitive search')
    
    args = parser.parse_args()
    
    # Check database exists
    if not Path(args.db).exists():
        print(f"Error: Database not found: {args.db}")
        return 1
    
    with DocAnalyzer(args.db) as analyzer:
        results = []
        title = "Results"
        
        if args.token:
            results = analyzer.find_token(args.token, args.case_sensitive)
            title = f"Occurrences of '{args.token}'"
        
        elif args.file:
            results = analyzer.find_in_file(args.file)
            title = f"Tokens in '{args.file}'"
        
        elif args.frequency:
            results = analyzer.token_frequency(args.limit, args.min_count)
            title = f"Top {args.limit} Most Frequent Tokens"
        
        elif args.top_files:
            results = analyzer.files_by_token_count(args.limit)
            title = f"Top {args.limit} Files by Token Count"
        
        elif args.refs_to:
            results = analyzer.find_references_to(args.refs_to)
            title = f"Files Referencing '{args.refs_to}'"
        
        elif args.refs_from:
            results = analyzer.find_references_from(args.refs_from)
            title = f"References from '{args.refs_from}'"
        
        elif args.orphaned:
            results = analyzer.orphaned_files()
            title = "Orphaned Files (No References)"
        
        elif args.by_type:
            results = analyzer.files_by_type()
            title = "Files by Type"
        
        elif args.pattern:
            results = analyzer.similar_tokens(args.pattern)
            title = f"Tokens Matching Pattern '{args.pattern}'"
        
        elif args.token_type:
            results = analyzer.tokens_by_type(args.token_type)
            title = f"Tokens of Type '{args.token_type}'"
        
        elif args.custom:
            results = analyzer.execute_query(args.custom)
            title = "Custom Query Results"
        
        # Output
        if args.export:
            export_csv(results, args.export)
        else:
            print_results(results, title)
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
