# Finish all: git push + Vercel deploy (run in Cursor terminal)
Set-Location $PSScriptRoot\..

$ErrorActionPreference = "Continue"
$log = Join-Path $PSScriptRoot "..\deploy-run.log"
"" | Set-Content $log

function Log($label, [scriptblock]$Block) {
    "`n========== $label ==========" | Tee-Object -FilePath $log -Append
    & $Block 2>&1 | Tee-Object -FilePath $log -Append
    "EXIT: $LASTEXITCODE" | Tee-Object -FilePath $log -Append
    return $LASTEXITCODE
}

Log "git hooks" { git config core.hooksPath .githooks }
Log "git add" { git add .; git reset HEAD .env; git status --short }

$commitExit = Log "git commit" {
    git -c user.name="GEV44" -c user.email="gev220705@gmail.com" commit -m "docs: clean README for GitHub, remove Vercel links, author GEV44"
}
if ($commitExit -ne 0) {
    Log "git amend (remove cursoragent co-author)" {
        git -c user.name="GEV44" -c user.email="gev220705@gmail.com" commit --amend -m "docs: clean README for GitHub, remove Vercel links, author GEV44"
    }
    Log "git push force-with-lease" { git push --force-with-lease origin main }
} else {
    Log "git push" { git push origin main }
}

Log "vercel whoami" { vercel whoami }
Log "vercel link" { vercel link --yes --project resume-constructor }
Log "vercel prod" { vercel --prod --yes }

Log "verify commit" { git log -1 --format=fuller; git log -1 --format=%B; git rev-parse HEAD }

Write-Host "`nAll done. Log: $log" -ForegroundColor Green
Write-Host "Check GitHub: https://github.com/GEV44/resume-constructor" -ForegroundColor Cyan
