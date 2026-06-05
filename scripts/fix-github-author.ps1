# Remove Cursor co-author from commits and push clean history
Set-Location $PSScriptRoot\..

git config core.hooksPath .githooks

Write-Host "Staging changes (excluding .env)..." -ForegroundColor Cyan
git add .
git reset HEAD .env

Write-Host "Amending last commit — removing cursoragent co-author..." -ForegroundColor Cyan
git -c user.name="GEV44" -c user.email="gev220705@gmail.com" commit --amend -m "docs: production build, README cleanup, remove Vercel from GitHub"

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push --force-with-lease origin main

Write-Host "Done. GitHub should show only GEV44." -ForegroundColor Green
