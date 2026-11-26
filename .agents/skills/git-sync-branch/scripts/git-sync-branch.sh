#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-}"
BASE="${2:-}"

if [ -z "$BRANCH" ]; then
  echo "Usage: ./git-sync-branch.sh <branch-name> [base-branch]"
  exit 1
fi

echo "=== Git Sync & Safe Branch Creator ==="

# 1. Check clean tree
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory has uncommitted changes. Stash or commit before branching."
  exit 1
fi

# 2. Fetch origin
echo "Fetching origin..."
git fetch origin --prune

# 3. Detect base branch if not provided
if [ -z "$BASE" ]; then
  REMOTE_HEAD=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || true)
  if [ -n "$REMOTE_HEAD" ]; then
    BASE="${REMOTE_HEAD#refs/remotes/origin/}"
  elif git show-ref --verify --quiet refs/remotes/origin/main; then
    BASE="main"
  elif git show-ref --verify --quiet refs/remotes/origin/master; then
    BASE="master"
  else
    BASE=$(git rev-parse --abbrev-ref HEAD)
  fi
fi

echo "Base branch: origin/$BASE"

# 4. Checkout new branch from origin/$BASE
git checkout -B "$BRANCH" "origin/$BASE"

HEAD_COMMIT=$(git rev-parse --short HEAD)
REMOTE_COMMIT=$(git rev-parse --short "origin/$BASE")

if [ "$HEAD_COMMIT" = "$REMOTE_COMMIT" ]; then
  echo "SUCCESS: Branch '$BRANCH' created at commit $HEAD_COMMIT (matches origin/$BASE)."
else
  echo "Warning: Commit mismatch: HEAD is $HEAD_COMMIT, but origin/$BASE is $REMOTE_COMMIT."
fi
