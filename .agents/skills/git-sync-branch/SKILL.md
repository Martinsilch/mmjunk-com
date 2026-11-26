---
name: git-sync-branch
description: >-
  Use this skill whenever creating a new git branch, switching to a new feature branch,
  spawning a branch, or starting fresh work on a repository. Ensures the working tree
  is clean, remote commits are fetched, the base branch is fast-forwarded to the latest
  remote commit, and the new branch is branched from the freshest remote state.
---

# Git Branch Sync & Safe Branching

## Purpose
Prevents stale branching, merge conflicts, and regressions by ensuring every new git branch is created directly from the latest remote commit on `origin`.

## Core Procedure

Whenever instructed to create, checkout, or switch to a new branch (`git checkout -b <branch>`, `git switch -c <branch>`, or creating a feature/bugfix branch):

### Step 1: Pre-Flight Working Tree Check
Before switching or pulling, check if there are uncommitted changes:
```powershell
git status --porcelain
```
- If the working tree is **clean**, proceed to Step 2.
- If there are **uncommitted changes**:
  - Ask the user or temporarily stash them:
    ```powershell
    git stash push -u -m "pre-branch-sync-auto-stash"
    ```

### Step 2: Fetch Latest Remote State
Always fetch all pruned refs from `origin`:
```powershell
git fetch origin --prune
```

### Step 3: Determine the Base Branch
Identify the base branch to branch off from:
- Default is `main` (or `master` if the repo uses `master`, or the current active trunk/parent branch if specified by the user).
- To detect the remote's default branch:
  ```powershell
  git remote show origin | Select-String "HEAD branch"
  ```

### Step 4: Update the Base Branch (Fast-Forward Only)
Fast-forward the local base branch to match remote `origin`:
```powershell
git checkout <base>
git pull --ff-only origin <base>
```
*Note: Using `--ff-only` guarantees no accidental merge commits are created on the base branch.*

### Step 5: Create the New Branch from the Latest Remote Commit
Create and checkout the new branch directly off `origin/<base>`:
```powershell
git checkout -b <new-branch-name> origin/<base>
```
*Tip: Branching directly from `origin/<base>` guarantees the new branch points to the absolute latest remote commit.*

### Step 6: Verify Parity
Verify that the new branch HEAD matches the remote commit:
```powershell
$localCommit = (git rev-parse --short HEAD).Trim()
$remoteCommit = (git rev-parse --short origin/<base>).Trim()
Write-Output "Branch created at commit: $localCommit (matches origin: $($localCommit -eq $remoteCommit))"
```

## Helper Script
You can also run the bundled helper script to execute this entire flow in one command:
- PowerShell: `.\.agents\skills\git-sync-branch\scripts\git-sync-branch.ps1 -Branch "<new-branch-name>" -Base "<base-branch>"`
- Bash: `./.agents/skills/git-sync-branch/scripts/git-sync-branch.sh "<new-branch-name>" "<base-branch>"`
