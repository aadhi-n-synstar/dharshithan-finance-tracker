@echo off
setlocal
title Push Dharshithan Finance Tracker to GitHub
echo ======================================================================
echo    Dharshithan Waterproofing - GitHub Sync Assistant
echo ======================================================================
echo.
echo Target Repository:
echo   https://github.com/aadhi-n-synstar/dharshithan-finance-tracker.git
echo.

git remote set-url origin https://github.com/aadhi-n-synstar/dharshithan-finance-tracker.git
git branch -M main

echo Pushing code to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo   SUCCESS! Your project has been pushed to GitHub.
    echo ======================================================================
    echo.
    echo Your Vercel application is also live:
    echo   https://agile-lute-g6r500e.tmp.now
    echo.
) else (
    echo.
    echo Notice: If prompted, please authenticate via your browser or Personal Access Token.
)

pause
