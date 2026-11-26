# Safe Branching Checklist & Best Practices

1. **Clean Tree Guarantee**: Never branch while having modified or untracked changes in the working directory. Always verify `git status --porcelain`.
2. **Fetch Before Branch**: Remote origins frequently advance with commits from team members, CI, or other machines. Run `git fetch origin --prune` first.
3. **Branch From Remote**: Using `git checkout -b <new-branch> origin/<base>` guarantees you branch from the verified remote state, preventing accidental branching from an outdated local copy.
4. **Fast-Forward Only**: When updating local tracking branches (`main`, `master`), use `git pull --ff-only` to prevent accidental merge bubbles.
5. **Set Upstream**: On first push, use `git push -u origin <new-branch>` to establish upstream tracking.
