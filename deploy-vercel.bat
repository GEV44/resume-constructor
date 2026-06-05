@echo off
title Deploy AI Resume Builder to Vercel
cd /d "%~dp0"

echo.
echo ============================================
echo   Deploy to Vercel (free) - one-time setup
echo ============================================
echo.
echo Your site URL will be: https://resume-constructor-gev44.vercel.app
echo (contains "resume-constructor" for Google search)
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 exit /b 1

echo.
echo [2/4] Vercel login (browser opens - sign in with GitHub)...
call npx vercel login
if errorlevel 1 exit /b 1

echo.
echo [3/4] Link project (name: resume-constructor-gev44)...
if not exist .vercel (
  call npx vercel link --yes --project resume-constructor-gev44 2>nul
  if errorlevel 1 call npx vercel link
)

echo.
echo [4/4] Build and deploy to production...
set VITE_SITE_URL=https://resume-constructor-gev44.vercel.app
call npm run build
if errorlevel 1 exit /b 1

call npx vercel --prod --yes
if errorlevel 1 exit /b 1

echo.
echo ============================================
echo   DONE! Your live site:
echo   https://resume-constructor-gev44.vercel.app
echo ============================================
echo.
echo Next (free, for Google):
echo   1. GitHub repo -^> About -^> set Website to the URL above
echo   2. https://search.google.com/search-console -^> add site -^> submit sitemap.xml
echo.
pause
