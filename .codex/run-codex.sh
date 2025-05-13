#!/usr/bin/env bash
#
# run-codex.sh: Load environment variables and helper for Codex CLI sessions.
# Usage: source .codex/run-codex.sh [role]

# Resolve project root (parent of this script)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

# Set the Codex role (default: phaser-coder)
export CODEX_ROLE="${1:-phaser-coder}"

# Define project-specific paths
export CODEX_PROJECT_DOC="$PROJECT_ROOT/CODEX.md"
export CODEX_BASELINE_DIR="$PROJECT_ROOT/.codex/baseline"
export CODEX_GOALS_FILE="$PROJECT_ROOT/.codex/goals/active-goals.txt"
export CODEX_TASKS_DIR="$PROJECT_ROOT/.codex/tasks"

# Wrap the codex CLI to include the project document by default
codex() {
  command codex --project-doc "$CODEX_PROJECT_DOC" "$@"
}

# Inform user
cat <<EOF
Codex environment initialized.
  Role:         $CODEX_ROLE
  Project doc:  $CODEX_PROJECT_DOC
  Baseline dir: $CODEX_BASELINE_DIR
  Goals file:   $CODEX_GOALS_FILE
  Tasks dir:    $CODEX_TASKS_DIR

Use 'codex' (wrapped) to start an interactive session or run commands.
EOF