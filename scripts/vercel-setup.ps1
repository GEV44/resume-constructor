# Vercel setup — run from project root after: vercel login
Set-Location $PSScriptRoot\..

Write-Host "=== 1. Check login ===" -ForegroundColor Cyan
vercel whoami
if ($LASTEXITCODE -ne 0) {
  Write-Host "`nNot logged in. Run: vercel login" -ForegroundColor Red
  Write-Host "Then open the device URL in your browser and approve." -ForegroundColor Yellow
  exit 1
}

Write-Host "`n=== 2. Link project ===" -ForegroundColor Cyan
vercel link --yes --project resume-constructor

Write-Host "`n=== 3. Deploy to production ===" -ForegroundColor Cyan
vercel --prod --yes

Write-Host "`n=== 4. Connect GitHub auto-deploy ===" -ForegroundColor Cyan
vercel git connect --yes

Write-Host "`n=== 5. List env vars ===" -ForegroundColor Cyan
vercel env ls

Write-Host "`n=== 6. Commit and push (excluding .env) ===" -ForegroundColor Cyan
git add .
git reset HEAD .env
git status --short
git commit -m "fix: Vercel config, Gemini AI docs, lovable-tagger vite config"
git push origin main

Write-Host "`nDone." -ForegroundColor Green
