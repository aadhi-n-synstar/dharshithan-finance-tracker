@echo off
setlocal
title Push Dharshithan Finance Tracker to GitHub
echo ======================================================================
echo    Dharshithan Waterproofing - GitHub Sync Assistant
echo ======================================================================
echo.
echo Make sure you have created an empty repository on GitHub:
echo   https://github.com/new
echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/username/dharshithan-finance.git): "

if "%REPO_URL%"=="" (
    echo Error: No URL provided.
    pause
    exit /b 1
)

echo.
echo Configuring remote origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Pushing code to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo   SUCCESS! Your project has been pushed to GitHub.
    echo ======================================================================
    echo.
    echo Next step: Deploy to Vercel
    echo 1. Open https://vercel.com/new
    echo 2. Import your GitHub repository
    echo 3. Click "Deploy" (Settings are pre-configured in vercel.json)
    echo.
) else (
    echo.
    echo If GitHub requested credentials, please sign in or use a GitHub Personal Access Token.
)

pause
