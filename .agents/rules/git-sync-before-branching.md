---
description: Always fetch remote and sync latest commits before creating any git branch
globs: **/*
always_on: true
---

# Git Sync Before Branching Rule

Whenever creating, checking out, or spawning a new git branch:
1. **Never** branch off a stale or un-pulled local branch.
2. **Always** check `git status --porcelain` to verify the working tree is clean before branching.
3. **Always** run `git fetch origin --prune` to obtain the latest remote commits.
4. **Always** branch directly from the latest remote reference (e.g., `git checkout -b <new-branch> origin/<base>` or fast-forward the base branch first with `git pull --ff-only origin <base>`).
5. Verify that `HEAD` of the new branch matches `origin/<base>`.
