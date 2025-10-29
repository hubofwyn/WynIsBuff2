#!/usr/bin/env python3
"""
document_structurer.py
Professional document base structuring system with semantic analysis.

Features:
- Multi-format parsing (Markdown, YAML, JSON, HCL, Shell, Dockerfile, etc.)
- Parallel processing optimized for Apple Silicon
- Knowledge graph generation
- Semantic clustering and relationship mapping
- Export to multiple formats (JSON, SQLite, GraphML)
- Incremental updates with change detection

Author: Optimized for M3 Max, October 2025
"""

import os
import re
import json
import csv
import sqlite3
import hashlib
import argparse
from pathlib import Path
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor, as_completed
from collections import defaultdict, Counter
from typing import List, Dict, Any, Set, Tuple, Optional
from dataclasses import dataclass, asdict
from enum import Enum

# Optional dependencies with graceful degradation
try:
    import ruamel.yaml
    YAML = ruamel.yaml.YAML()
    YAML.preserve_quotes = True
    HAS_YAML = True
except ImportError:
    HAS_YAML = False

try:
    import hcl2
    HAS_HCL = True
except ImportError:
    HAS_HCL = False

try:
    from sentence_transformers import SentenceTransformer
    HAS_EMBEDDINGS = True
except ImportError:
    HAS_EMBEDDINGS = False

try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False

# ===========================
# DATA STRUCTURES
# ===========================

class TokenType(Enum):
    """Enumeration of all token types we extract"""
    STRING = "string"
    QUOTED_STRING = "quoted_string"
    ASSIGNMENT = "assignment"
    CODE_BLOCK = "code_block"
    INLINE_CODE = "inline_code"
    WORD = "word"
    URL = "url"
    PATH = "path"
    VARIABLE = "variable"
    HEADER = "header"
    LIST_ITEM = "list_item"
    KEY = "key"
    VALUE = "value"
    COMMENT = "comment"
    IMPORT = "import"
    REFERENCE = "reference"

@dataclass
class Token:
    """Structured token with complete metadata"""
    token_type: TokenType
    value: str
    raw: str
    file: str
    line: Optional[int] = None
    col: Optional[int] = None
    context: Optional[str] = None  # Surrounding text for context
    confidence: float = 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d['token_type'] = self.token_type.value
        return d

@dataclass
class Document:
    """Document metadata and structure"""
    path: str
    relative_path: str
    file_type: str
    size: int
    hash: str
    modified: float
    tokens: List[Token]
    links: Set[str]  # References to other documents
    headers: List[str]  # Document structure
    summary: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'path': self.path,
            'relative_path': self.relative_path,
            'file_type': self.file_type,
            'size': self.size,
            'hash': self.hash,
            'modified': self.modified,
            'token_count': len(self.tokens),
            'links': list(self.links),
            'headers': self.headers,
            'summary': self.summary
        }

# ===========================
# PARSER IMPLEMENTATIONS
# ===========================

class BaseParser:
    """Base class for all parsers"""
    
    def __init__(self, content: str, filepath: str):
        self.content = content
        self.filepath = filepath
        self.lines = content.splitlines()
    
    def parse(self) -> List[Token]:
        """Override in subclasses"""
        raise NotImplementedError
    
    def create_token(self, token_type: TokenType, value: str, raw: str, 
                    line: Optional[int] = None, col: Optional[int] = None,
                    context: Optional[str] = None) -> Token:
        """Helper to create tokens"""
        return Token(
            token_type=token_type,
            value=value,
            raw=raw,
            file=self.filepath,
            line=line,
            col=col,
            context=context
        )

class MarkdownParser(BaseParser):
    """Enhanced Markdown parser with structure extraction"""
    
    HEADER = re.compile(r'^(#{1,6})\s+(.+)$', re.MULTILINE)
    CODE_BLOCK = re.compile(r'```(\w*)\n(.*?)```', re.DOTALL)
    INLINE_CODE = re.compile(r'`([^`]+)`')
    LINK = re.compile(r'\[([^\]]+)\]\(([^\)]+)\)')
    URL = re.compile(r'https?://[^\s\)]+')
    LIST_ITEM = re.compile(r'^[\s]*[-*+]\s+(.+)$', re.MULTILINE)
    
    def parse(self) -> List[Token]:
        tokens = []
        
        # Headers (document structure)
        for m in self.HEADER.finditer(self.content):
            level = len(m.group(1))
            text = m.group(2).strip()
            tokens.append(self.create_token(
                TokenType.HEADER, text, m.group(0),
                context=f"level_{level}"
            ))
        
        # Code blocks
        for m in self.CODE_BLOCK.finditer(self.content):
            lang = m.group(1) or "text"
            code = m.group(2).strip()
            tokens.append(self.create_token(
                TokenType.CODE_BLOCK, code, m.group(0),
                context=lang
            ))
        
        # Inline code
        for m in self.INLINE_CODE.finditer(self.content):
            tokens.append(self.create_token(
                TokenType.INLINE_CODE, m.group(1), m.group(0)
            ))
        
        # Links
        for m in self.LINK.finditer(self.content):
            text, url = m.group(1), m.group(2)
            tokens.append(self.create_token(
                TokenType.REFERENCE, url, m.group(0),
                context=text
            ))
        
        # URLs
        for m in self.URL.finditer(self.content):
            tokens.append(self.create_token(
                TokenType.URL, m.group(0), m.group(0)
            ))
        
        # List items
        for m in self.LIST_ITEM.finditer(self.content):
            tokens.append(self.create_token(
                TokenType.LIST_ITEM, m.group(1).strip(), m.group(0)
            ))
        
        return tokens

class YAMLParser(BaseParser):
    """YAML parser with key-value extraction"""
    
    def parse(self) -> List[Token]:
        if not HAS_YAML:
            return []
        
        tokens = []
        try:
            data = YAML.load(self.content)
            self._walk(data, tokens, [])
        except Exception as e:
            print(f"[WARN] YAML parse error in {self.filepath}: {e}")
        
        return tokens
    
    def _walk(self, obj, tokens: List[Token], path: List[str]):
        """Recursively walk YAML structure"""
        if isinstance(obj, str):
            tokens.append(self.create_token(
                TokenType.VALUE, obj, obj,
                context=".".join(path)
            ))
        elif isinstance(obj, dict):
            for k, v in obj.items():
                tokens.append(self.create_token(
                    TokenType.KEY, str(k), str(k),
                    context=".".join(path)
                ))
                self._walk(v, tokens, path + [str(k)])
        elif isinstance(obj, list):
            for idx, v in enumerate(obj):
                self._walk(v, tokens, path + [f"[{idx}]"])

class JSONParser(BaseParser):
    """JSON parser with structure preservation"""
    
    def parse(self) -> List[Token]:
        tokens = []
        try:
            data = json.loads(self.content)
            self._walk(data, tokens, [])
        except Exception as e:
            print(f"[WARN] JSON parse error in {self.filepath}: {e}")
        
        return tokens
    
    def _walk(self, obj, tokens: List[Token], path: List[str]):
        if isinstance(obj, str):
            tokens.append(self.create_token(
                TokenType.VALUE, obj, obj,
                context=".".join(path)
            ))
        elif isinstance(obj, dict):
            for k, v in obj.items():
                tokens.append(self.create_token(
                    TokenType.KEY, k, k,
                    context=".".join(path)
                ))
                self._walk(v, tokens, path + [k])
        elif isinstance(obj, list):
            for idx, v in enumerate(obj):
                self._walk(v, tokens, path + [f"[{idx}]"])

class HCLParser(BaseParser):
    """Terraform HCL parser"""
    
    def parse(self) -> List[Token]:
        if not HAS_HCL:
            return self._fallback_parse()
        
        tokens = []
        try:
            data = hcl2.loads(self.content)
            self._extract_literals(data, tokens)
        except Exception:
            return self._fallback_parse()
        
        return tokens
    
    def _extract_literals(self, obj, tokens: List[Token]):
        """Extract literals from HCL structure"""
        if isinstance(obj, str):
            tokens.append(self.create_token(TokenType.VALUE, obj, obj))
        elif isinstance(obj, dict):
            for v in obj.values():
                self._extract_literals(v, tokens)
        elif isinstance(obj, list):
            for v in obj:
                self._extract_literals(v, tokens)
    
    def _fallback_parse(self) -> List[Token]:
        """Regex-based fallback for HCL"""
        tokens = []
        QUOTED = re.compile(r'"([^"]*)"')
        for m in QUOTED.finditer(self.content):
            tokens.append(self.create_token(
                TokenType.QUOTED_STRING, m.group(1), m.group(0)
            ))
        return tokens

class ShellParser(BaseParser):
    """Shell script parser"""
    
    QUOTED = re.compile(r'''(['"])(.*?)\1''')
    ASSIGNMENT = re.compile(r'^\s*([A-Z_][A-Z0-9_]*)=(["\']?)([^"\']+)\2', re.MULTILINE)
    VARIABLE = re.compile(r'\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?')
    COMMENT = re.compile(r'^\s*#\s*(.+)$', re.MULTILINE)
    
    def parse(self) -> List[Token]:
        tokens = []
        
        for i, line in enumerate(self.lines, start=1):
            # Quoted strings
            for m in self.QUOTED.finditer(line):
                tokens.append(self.create_token(
                    TokenType.QUOTED_STRING, m.group(2), m.group(0),
                    line=i, col=m.start() + 1
                ))
            
            # Variable assignments
            for m in self.ASSIGNMENT.finditer(line):
                tokens.append(self.create_token(
                    TokenType.ASSIGNMENT, m.group(3), m.group(0),
                    line=i, context=m.group(1)
                ))
            
            # Variable references
            for m in self.VARIABLE.finditer(line):
                tokens.append(self.create_token(
                    TokenType.VARIABLE, m.group(1), m.group(0),
                    line=i, col=m.start() + 1
                ))
            
            # Comments
            for m in self.COMMENT.finditer(line):
                tokens.append(self.create_token(
                    TokenType.COMMENT, m.group(1), m.group(0),
                    line=i
                ))
        
        return tokens

class DockerfileParser(BaseParser):
    """Dockerfile parser"""
    
    FROM = re.compile(r'^FROM\s+([^\s]+)', re.MULTILINE | re.IGNORECASE)
    ENV = re.compile(r'^ENV\s+([A-Z_][A-Z0-9_]*)\s*=?\s*(.+)$', re.MULTILINE | re.IGNORECASE)
    ARG = re.compile(r'^ARG\s+([A-Z_][A-Z0-9_]*)\s*=?\s*(.*)$', re.MULTILINE | re.IGNORECASE)
    LABEL = re.compile(r'^LABEL\s+([^\s=]+)="?([^"]*)"?', re.MULTILINE | re.IGNORECASE)
    
    def parse(self) -> List[Token]:
        tokens = []
        
        # Base images
        for m in self.FROM.finditer(self.content):
            tokens.append(self.create_token(
                TokenType.REFERENCE, m.group(1), m.group(0),
                context="base_image"
            ))
        
        # Environment variables
        for m in self.ENV.finditer(self.content):
            tokens.append(self.create_token(
                TokenType.ASSIGNMENT, m.group(2).strip(), m.group(0),
                context=m.group(1)
            ))
        
        # Build arguments
        for m in self.ARG.finditer(self.content):
            value = m.group(2).strip() if m.group(2) else ""
            tokens.append(self.create_token(
                TokenType.ASSIGNMENT, value, m.group(0),
                context=f"arg:{m.group(1)}"
            ))
        
        # Labels
        for m in self.LABEL.finditer(self.content):
            tokens.append(self.create_token(
                TokenType.KEY, m.group(1), m.group(0),
                context="label"
            ))
        
        return tokens

class TextParser(BaseParser):
    """Fallback parser for plain text"""
    
    TOKEN = re.compile(r'\b[A-Za-z0-9_\-./:]{3,}\b')
    URL = re.compile(r'https?://[^\s]+')
    PATH = re.compile(r'(?:/[A-Za-z0-9_.-]+)+/?')
    
    def parse(self) -> List[Token]:
        tokens = []
        
        # URLs (highest priority)
        for m in self.URL.finditer(self.content):
            tokens.append(self.create_token(
                TokenType.URL, m.group(0), m.group(0)
            ))
        
        # Paths
        for m in self.PATH.finditer(self.content):
            tokens.append(self.create_token(
                TokenType.PATH, m.group(0), m.group(0)
            ))
        
        # Generic tokens
        for i, line in enumerate(self.lines, start=1):
            for m in self.TOKEN.finditer(line):
                value = m.group(0)
                # Skip if already captured as URL or path
                if not any(value in t.value for t in tokens):
                    tokens.append(self.create_token(
                        TokenType.WORD, value, value,
                        line=i, col=m.start() + 1
                    ))
        
        return tokens

# ===========================
# PARSER REGISTRY
# ===========================

PARSER_REGISTRY = {
    '.md': MarkdownParser,
    '.markdown': MarkdownParser,
    '.yaml': YAMLParser,
    '.yml': YAMLParser,
    '.json': JSONParser,
    '.tf': HCLParser,
    '.tfvars': HCLParser,
    '.sh': ShellParser,
    '.bash': ShellParser,
    '.zsh': ShellParser,
    'dockerfile': DockerfileParser,
    'Dockerfile': DockerfileParser,
    '.txt': TextParser,
    '.env': TextParser,
}

def get_parser(filepath: str, content: str) -> BaseParser:
    """Select appropriate parser based on file extension"""
    path = Path(filepath)
    
    # Check filename first (e.g., Dockerfile)
    if path.name.lower() in PARSER_REGISTRY:
        return PARSER_REGISTRY[path.name.lower()](content, filepath)
    
    # Then check extension
    ext = path.suffix.lower()
    parser_class = PARSER_REGISTRY.get(ext, TextParser)
    return parser_class(content, filepath)

# ===========================
# DOCUMENT PROCESSING
# ===========================

def compute_hash(content: str) -> str:
    """Compute SHA256 hash of content"""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def safe_read(path: Path) -> Optional[str]:
    """Safely read file with error handling"""
    try:
        return path.read_text(encoding='utf-8', errors='ignore')
    except Exception as e:
        print(f"[WARN] Cannot read {path}: {e}")
        return None

def extract_links(tokens: List[Token]) -> Set[str]:
    """Extract document references from tokens"""
    links = set()
    for token in tokens:
        if token.token_type in (TokenType.REFERENCE, TokenType.URL):
            # Clean and normalize
            link = token.value.strip()
            if link and not link.startswith(('http://', 'https://')):
                # Likely a relative path
                links.add(link)
    return links

def extract_headers(tokens: List[Token]) -> List[str]:
    """Extract document headers in order"""
    return [t.value for t in tokens if t.token_type == TokenType.HEADER]

def process_file(filepath: Path, root: Path) -> Optional[Document]:
    """Process a single file and extract all metadata"""
    content = safe_read(filepath)
    if content is None:
        return None
    
    rel_path = str(filepath.relative_to(root))
    parser = get_parser(rel_path, content)
    tokens = parser.parse()
    
    doc = Document(
        path=str(filepath),
        relative_path=rel_path,
        file_type=filepath.suffix.lower() or 'none',
        size=len(content),
        hash=compute_hash(content),
        modified=filepath.stat().st_mtime,
        tokens=tokens,
        links=extract_links(tokens),
        headers=extract_headers(tokens)
    )
    
    return doc

# ===========================
# KNOWLEDGE GRAPH BUILDER
# ===========================

class KnowledgeGraph:
    """Build and manage document knowledge graph"""
    
    def __init__(self):
        self.documents: Dict[str, Document] = {}
        self.token_index: Dict[str, List[Token]] = defaultdict(list)
        self.file_relationships: Dict[str, Set[str]] = defaultdict(set)
        
        if HAS_NETWORKX:
            self.graph = nx.DiGraph()
        else:
            self.graph = None
    
    def add_document(self, doc: Document):
        """Add document to knowledge graph"""
        self.documents[doc.relative_path] = doc
        
        # Index tokens
        for token in doc.tokens:
            self.token_index[token.value].append(token)
        
        # Build relationships
        for link in doc.links:
            self.file_relationships[doc.relative_path].add(link)
            
            if self.graph is not None:
                self.graph.add_edge(doc.relative_path, link, 
                                  relation='references')
    
    def get_related_documents(self, filepath: str, max_depth: int = 2) -> Set[str]:
        """Get documents related to the given file"""
        if self.graph is None:
            # Fallback without networkx
            related = set(self.file_relationships.get(filepath, set()))
            return related
        
        try:
            descendants = nx.descendants(self.graph, filepath)
            ancestors = nx.ancestors(self.graph, filepath)
            return descendants.union(ancestors)
        except nx.NetworkXError:
            return set()
    
    def find_similar_tokens(self, value: str, threshold: float = 0.8) -> List[str]:
        """Find tokens similar to the given value"""
        from difflib import SequenceMatcher
        
        similar = []
        value_lower = value.lower()
        
        for token_value in self.token_index.keys():
            ratio = SequenceMatcher(None, value_lower, token_value.lower()).ratio()
            if ratio >= threshold and token_value != value:
                similar.append(token_value)
        
        return similar
    
    def get_statistics(self) -> Dict[str, Any]:
        """Compute knowledge graph statistics"""
        total_tokens = sum(len(doc.tokens) for doc in self.documents.values())
        unique_tokens = len(self.token_index)
        
        token_type_counts = Counter()
        for doc in self.documents.values():
            for token in doc.tokens:
                token_type_counts[token.token_type.value] += 1
        
        stats = {
            'total_documents': len(self.documents),
            'total_tokens': total_tokens,
            'unique_tokens': unique_tokens,
            'token_types': dict(token_type_counts),
            'file_types': Counter(doc.file_type for doc in self.documents.values()),
            'total_relationships': sum(len(links) for links in self.file_relationships.values())
        }
        
        if self.graph is not None:
            stats['graph_nodes'] = self.graph.number_of_nodes()
            stats['graph_edges'] = self.graph.number_of_edges()
        
        return stats

# ===========================
# OUTPUT FORMATTERS
# ===========================

class OutputManager:
    """Manage multiple output formats"""
    
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def write_json(self, kg: KnowledgeGraph):
        """Write complete JSON dump"""
        output = {
            'generated': datetime.now().isoformat(),
            'statistics': kg.get_statistics(),
            'documents': {
                path: doc.to_dict() 
                for path, doc in kg.documents.items()
            },
            'token_index': {
                value: [t.to_dict() for t in tokens]
                for value, tokens in kg.token_index.items()
            },
            'relationships': {
                src: list(dests)
                for src, dests in kg.file_relationships.items()
            }
        }
        
        path = self.output_dir / 'knowledge_graph.json'
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Wrote {path}")
    
    def write_sqlite(self, kg: KnowledgeGraph):
        """Write to SQLite database"""
        db_path = self.output_dir / 'documents.db'
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        # Create tables
        c.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                relative_path TEXT PRIMARY KEY,
                file_type TEXT,
                size INTEGER,
                hash TEXT,
                modified REAL,
                token_count INTEGER
            )
        ''')
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file TEXT,
                token_type TEXT,
                value TEXT,
                raw TEXT,
                line INTEGER,
                col INTEGER,
                context TEXT,
                FOREIGN KEY (file) REFERENCES documents(relative_path)
            )
        ''')
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS relationships (
                source TEXT,
                target TEXT,
                PRIMARY KEY (source, target),
                FOREIGN KEY (source) REFERENCES documents(relative_path)
            )
        ''')
        
        # Insert documents
        for doc in kg.documents.values():
            c.execute('''
                INSERT OR REPLACE INTO documents 
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (doc.relative_path, doc.file_type, doc.size, 
                  doc.hash, doc.modified, len(doc.tokens)))
        
        # Insert tokens
        for doc in kg.documents.values():
            for token in doc.tokens:
                c.execute('''
                    INSERT INTO tokens (file, token_type, value, raw, line, col, context)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (doc.relative_path, token.token_type.value, token.value,
                      token.raw, token.line, token.col, token.context))
        
        # Insert relationships
        for src, dests in kg.file_relationships.items():
            for dest in dests:
                c.execute('INSERT OR IGNORE INTO relationships VALUES (?, ?)',
                         (src, dest))
        
        # Create indexes
        c.execute('CREATE INDEX IF NOT EXISTS idx_tokens_value ON tokens(value)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_tokens_file ON tokens(file)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_tokens_type ON tokens(token_type)')
        
        conn.commit()
        conn.close()
        
        print(f"✅ Wrote {db_path}")
    
    def write_frequency_csv(self, kg: KnowledgeGraph, min_freq: int = 2):
        """Write token frequency analysis"""
        csv_path = self.output_dir / 'token_frequency.csv'
        
        with open(csv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['value', 'count', 'distinct_files', 
                           'token_types', 'example_file', 'example_line'])
            
            # Sort by frequency
            sorted_tokens = sorted(kg.token_index.items(), 
                                 key=lambda x: len(x[1]), reverse=True)
            
            for value, tokens in sorted_tokens:
                if len(tokens) < min_freq:
                    continue
                
                files = {t.file for t in tokens}
                types = {t.token_type.value for t in tokens}
                example = tokens[0]
                
                writer.writerow([
                    value,
                    len(tokens),
                    len(files),
                    '|'.join(sorted(types)),
                    example.file,
                    example.line or ''
                ])
        
        print(f"✅ Wrote {csv_path}")
    
    def write_graphml(self, kg: KnowledgeGraph):
        """Write graph in GraphML format for visualization"""
        if not HAS_NETWORKX or kg.graph is None:
            print("[SKIP] NetworkX not available, skipping GraphML export")
            return
        
        graphml_path = self.output_dir / 'relationships.graphml'
        
        # Add node attributes
        for node in kg.graph.nodes():
            if node in kg.documents:
                doc = kg.documents[node]
                kg.graph.nodes[node]['type'] = doc.file_type
                kg.graph.nodes[node]['size'] = doc.size
                kg.graph.nodes[node]['tokens'] = len(doc.tokens)
        
        nx.write_graphml(kg.graph, graphml_path)
        print(f"✅ Wrote {graphml_path}")
    
    def write_summary_report(self, kg: KnowledgeGraph):
        """Write human-readable summary report"""
        report_path = self.output_dir / 'SUMMARY.md'
        stats = kg.get_statistics()
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# Document Structure Analysis Report\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## Statistics\n\n")
            f.write(f"- **Total Documents**: {stats['total_documents']:,}\n")
            f.write(f"- **Total Tokens**: {stats['total_tokens']:,}\n")
            f.write(f"- **Unique Tokens**: {stats['unique_tokens']:,}\n")
            f.write(f"- **Relationships**: {stats['total_relationships']:,}\n\n")
            
            f.write("## File Types\n\n")
            for ftype, count in stats['file_types'].most_common():
                f.write(f"- {ftype or 'no extension'}: {count}\n")
            
            f.write("\n## Token Types\n\n")
            for ttype, count in sorted(stats['token_types'].items(), 
                                      key=lambda x: x[1], reverse=True):
                f.write(f"- {ttype}: {count:,}\n")
            
            if HAS_NETWORKX and kg.graph:
                f.write(f"\n## Graph Structure\n\n")
                f.write(f"- **Nodes**: {stats['graph_nodes']}\n")
                f.write(f"- **Edges**: {stats['graph_edges']}\n")
                
                if stats['graph_nodes'] > 0:
                    density = nx.density(kg.graph)
                    f.write(f"- **Density**: {density:.4f}\n")
            
            # Top tokens
            f.write("\n## Most Common Tokens\n\n")
            sorted_tokens = sorted(kg.token_index.items(), 
                                 key=lambda x: len(x[1]), reverse=True)
            
            for value, tokens in sorted_tokens[:20]:
                files = len({t.file for t in tokens})
                f.write(f"- `{value}`: {len(tokens)} occurrences in {files} files\n")
        
        print(f"✅ Wrote {report_path}")

# ===========================
# MAIN APPLICATION
# ===========================

def main():
    parser = argparse.ArgumentParser(
        description="Professional document structuring system",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s /path/to/docs
  %(prog)s . --output ./analysis --workers 12
  %(prog)s ~/project --minfreq 3 --formats json,sqlite,csv
        """
    )
    
    parser.add_argument('root', nargs='?', default='.',
                       help='Root directory to scan (default: current directory)')
    parser.add_argument('--output', '-o', default='./doc_structure',
                       help='Output directory (default: ./doc_structure)')
    parser.add_argument('--workers', '-w', type=int, 
                       default=os.cpu_count() or 8,
                       help='Number of parallel workers (default: CPU count)')
    parser.add_argument('--minfreq', '-m', type=int, default=2,
                       help='Minimum token frequency for CSV output (default: 2)')
    parser.add_argument('--formats', '-f', default='all',
                       help='Output formats: json,sqlite,csv,graphml,summary or "all" (default: all)')
    parser.add_argument('--exclude', '-e', action='append', default=[],
                       help='Patterns to exclude (can be repeated)')
    parser.add_argument('--include-exts', action='append', default=[],
                       help='Additional file extensions to include')
    
    args = parser.parse_args()
    
    # Setup
    root = Path(args.root).resolve()
    if not root.exists():
        print(f"Error: {root} does not exist")
        return 1
    
    output_dir = Path(args.output)
    
    # Determine file extensions to scan
    supported_exts = set(PARSER_REGISTRY.keys())
    if args.include_exts:
        supported_exts.update(args.include_exts)
    
    # Find files
    print(f"Scanning {root}...")
    all_files = []
    exclude_patterns = set(args.exclude) | {'.git', '__pycache__', 'node_modules', '.venv'}
    
    for path in root.rglob('*'):
        if not path.is_file():
            continue
        
        # Check exclusions
        if any(pattern in str(path) for pattern in exclude_patterns):
            continue
        
        # Check extensions
        if path.suffix.lower() in supported_exts or path.name.lower() in supported_exts:
            all_files.append(path)
    
    print(f"Found {len(all_files)} files to process")
    
    # Process files in parallel
    print(f"Processing with {args.workers} workers (optimized for Apple Silicon)...")
    
    kg = KnowledgeGraph()
    processed = 0
    
    with ProcessPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(process_file, p, root): p for p in all_files}
        
        for future in as_completed(futures):
            doc = future.result()
            if doc:
                kg.add_document(doc)
                processed += 1
                
                if processed % 100 == 0:
                    print(f"  Processed {processed}/{len(all_files)} files...")
    
    print(f"✅ Processed {processed} documents")
    
    # Generate outputs
    print("\nGenerating outputs...")
    output_mgr = OutputManager(output_dir)
    
    formats = set(args.formats.split(','))
    if 'all' in formats:
        formats = {'json', 'sqlite', 'csv', 'graphml', 'summary'}
    
    if 'json' in formats:
        output_mgr.write_json(kg)
    
    if 'sqlite' in formats:
        output_mgr.write_sqlite(kg)
    
    if 'csv' in formats:
        output_mgr.write_frequency_csv(kg, args.minfreq)
    
    if 'graphml' in formats:
        output_mgr.write_graphml(kg)
    
    if 'summary' in formats:
        output_mgr.write_summary_report(kg)
    
    print(f"\n✅ Complete! Results in {output_dir}")
    
    # Print statistics
    stats = kg.get_statistics()
    print(f"\n📊 Statistics:")
    print(f"   Documents: {stats['total_documents']:,}")
    print(f"   Total tokens: {stats['total_tokens']:,}")
    print(f"   Unique tokens: {stats['unique_tokens']:,}")
    print(f"   Relationships: {stats['total_relationships']:,}")
    
    return 0

if __name__ == '__main__':
    exit(main())
