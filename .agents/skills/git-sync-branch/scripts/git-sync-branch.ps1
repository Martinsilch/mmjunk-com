[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Branch,

    [Parameter(Mandatory = $false, Position = 1)]
    [string]$Base = ""
)

$ErrorActionPreference = "Stop"

Write-Host "=== Git Sync & Safe Branch Creator ===" -ForegroundColor Cyan

# 1. Check working directory status
$status = git status --porcelain
if ($status) {
    Write-Error "Working directory is not clean. Commit or stash changes before creating a branch:`n$status"
    exit 1
}

# 2. Fetch origin
Write-Host "Fetching latest updates from origin..." -ForegroundColor Yellow
git fetch origin --prune

# 3. Detect default base branch if not provided
if (-not $Base) {
    $remoteHead = git symbolic-ref refs/remotes/origin/HEAD 2>$null
    if ($remoteHead) {
        $Base = ($remoteHead -replace '^refs/remotes/origin/', '').Trim()
    } else {
        $branches = git branch -r
        if ($branches -match 'origin/main') {
            $Base = "main"
        } elseif ($branches -match 'origin/master') {
            $Base = "master"
        } else {
            $Base = (git rev-parse --abbrev-ref HEAD).Trim()
        }
    }
}

Write-Host "Base branch identified: origin/$Base" -ForegroundColor Green

# 4. Create new branch from origin/$Base
Write-Host "Creating new branch '$Branch' from origin/$Base..." -ForegroundColor Yellow
git checkout -B $Branch "origin/$Base"

# 5. Verify commit hash
$headCommit = (git rev-parse --short HEAD).Trim()
$remoteCommit = (git rev-parse --short "origin/$Base").Trim()

if ($headCommit -eq $remoteCommit) {
    Write-Host "SUCCESS: Branch '$Branch' created at commit $headCommit (matches origin/$Base)." -ForegroundColor Green
} else {
    Write-Warning "Commit mismatch: HEAD is $headCommit, but origin/$Base is $remoteCommit"
}
