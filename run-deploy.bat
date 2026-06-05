@echo off
cd /d c:\Users\Gevorg\resume-constructor
set LOG=push-result.txt
echo START %date% %time% > %LOG%

echo Step 1: stage >> %LOG%
git config core.hooksPath .githooks >> %LOG% 2>&1
git add . >> %LOG% 2>&1
git reset HEAD .env >> %LOG% 2>&1
git status --short >> %LOG% 2>&1

echo Step 2: amend >> %LOG%
git -c user.name=GEV44 -c user.email=gev220705@gmail.com commit --amend -m "docs: clean README for GitHub, author GEV44" >> %LOG% 2>&1

echo Step 3: push >> %LOG%
git push --force-with-lease origin main >> %LOG% 2>&1
if errorlevel 1 git push --force origin main >> %LOG% 2>&1

echo Step 4: verify >> %LOG%
git log -1 --format=fuller >> %LOG% 2>&1
git log -1 --format=%%B >> %LOG% 2>&1

echo DONE %date% %time% >> %LOG%
type %LOG%
