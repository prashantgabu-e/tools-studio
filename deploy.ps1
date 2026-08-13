param(
  [string]$Message = "Deploy latest site update"
)

$ErrorActionPreference = "Stop"

Write-Host "Checking git status..."
$status = git status --porcelain

if (-not $status) {
  Write-Host "No changes to deploy."
  exit 0
}

Write-Host "Staging files..."
git add .

Write-Host "Creating commit..."
git commit -m $Message

Write-Host "Pushing to origin/main..."
git push origin main

Write-Host ""
Write-Host "Done. GitHub Pages will redeploy from the latest main branch push."
