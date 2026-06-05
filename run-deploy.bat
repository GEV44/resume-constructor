@echo off
title Deploy AI Resume Builder — Official Site
cd /d "%~dp0"

echo.
echo Official site: https://resume-constructor-gev44.vercel.app
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 pause & exit /b 1

echo.
echo [2/4] Vercel login (browser opens — sign in with GitHub)...
call npx vercel login
if errorlevel 1 pause & exit /b 1

echo.
echo [3/4] Link project as resume-constructor-gev44...
if not exist .vercel (
  call npx vercel link --yes --project resume-constructor-gev44 2>nul
  if errorlevel 1 call npx vercel link
)

echo.
echo [4/4] Build and deploy to production...
set VITE_SITE_URL=https://resume-constructor-gev44.vercel.app
call npm run build
if errorlevel 1 pause & exit /b 1

call npx vercel --prod --yes
if errorlevel 1 pause & exit /b 1

echo.
echo ============================================
echo   DONE — Your official site is live at:
echo   https://resume-constructor-gev44.vercel.app
echo ============================================
echo.
echo Set GitHub repo About -^> Website to that URL.
echo Google Search Console -^> submit /sitemap.xml
echo.
pause
