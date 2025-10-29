#!/usr/bin/env bash

# WynIsBuff2 Documentation Analysis Runner
# Quick setup and execution script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/doc-analysis"

echo "🔍 WynIsBuff2 Documentation Analysis"
echo "===================================="
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not found"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv "$SCRIPT_DIR/venv"
fi

# Activate virtual environment
source "$SCRIPT_DIR/venv/bin/activate"

# Install/upgrade dependencies
echo "📦 Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r "$SCRIPT_DIR/requirements.txt"

# Create output directory
mkdir -p "$OUTPUT_DIR"

cd "$PROJECT_ROOT"

echo ""
echo "Running analysis..."
echo ""

# Run quick Node.js scanner
echo "📊 Phase 1: Quick scan (Node.js)"
node "$SCRIPT_DIR/doc-scanner.cjs"

echo ""
echo "📊 Phase 2: Deep analysis (Python)"

# Run Python document structurer
python3 "$SCRIPT_DIR/document_structurer.py" . \
    --output "$OUTPUT_DIR" \
    --workers 8 \
    --formats json,sqlite,csv,summary \
    --exclude node_modules \
    --exclude .git \
    --exclude dist \
    --exclude build \
    --exclude venv

echo ""
echo "📊 Phase 3: Insights generation"

# Run insights analyzer
python3 "$SCRIPT_DIR/enhanced_insights.py" \
    --db "$OUTPUT_DIR/documents.db" \
    --kg "$OUTPUT_DIR/knowledge_graph.json" \
    --output "$OUTPUT_DIR/INSIGHTS.md"

echo ""
echo "✅ Analysis complete!"
echo ""
echo "📂 Results:"
echo "  - Quick scan:     doc-scan-report.json"
echo "  - Full analysis:  $OUTPUT_DIR/"
echo "  - Insights:       $OUTPUT_DIR/INSIGHTS.md"
echo "  - Database:       $OUTPUT_DIR/documents.db"
echo ""
echo "💡 Next steps:"
echo "  1. Review: cat $OUTPUT_DIR/INSIGHTS.md"
echo "  2. Query:  python3 scripts/query_docs.py --db $OUTPUT_DIR/documents.db --help"
echo ""
