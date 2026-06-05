# Opens Vercel login — complete approval in browser, then run vercel-setup.ps1
Set-Location $PSScriptRoot\..

Write-Host "Starting Vercel login..." -ForegroundColor Cyan
Write-Host "When the browser opens (or URL appears), approve the login." -ForegroundColor Yellow
vercel login

Write-Host "`nLogin complete. Running full setup..." -ForegroundColor Green
& "$PSScriptRoot\vercel-setup.ps1"
