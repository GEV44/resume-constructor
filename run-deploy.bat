@echo off
title Deploy AI Resume Builder
cd /d "%~dp0"

echo.
echo Official site: https://resume-constructor-gev44.vercel.app
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Opening Vercel in browser instead...
  goto BROWSER
)

echo Checking Vercel login...
call npx vercel whoami >nul 2>&1
if errorlevel 1 goto BROWSER

echo Logged in. Deploying...
set VITE_SITE_URL=https://resume-constructor-gev44.vercel.app
call npm install >nul 2>&1
call npm run build
if errorlevel 1 (
  echo BUILD FAILED - see errors above.
  pause
  exit /b 1
)

if not exist .vercel (
  call npx vercel link --yes --project resume-constructor-gev44 2>nul
  if errorlevel 1 call npx vercel link --yes
)

call npx vercel --prod --yes
if errorlevel 1 goto BROWSER

echo.
echo ============================================
echo   LIVE: https://resume-constructor-gev44.vercel.app
echo ============================================
pause
exit /b 0

:BROWSER
echo.
echo Opening Vercel in your browser...
echo.
echo In Vercel:
echo   1. Sign in with GitHub
echo   2. Import repo: GEV44/resume-constructor
echo   3. Project name: resume-constructor-gev44
echo   4. Click Deploy
echo.
start https://vercel.com/new/import?s=https://github.com/GEV44/resume-constructor
pause
