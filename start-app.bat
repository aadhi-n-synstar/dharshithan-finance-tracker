@echo off
title Dharshithan Waterproofing - Finance ERP Pro (Multi-Cloud Edition)
echo ========================================================
echo   Dharshithan Waterproofing - Finance ERP Pro
echo   Multi-Cloud Engine: Supabase (Free Tier) / MongoDB / Neon
echo ========================================================
echo.
set "PATH=%APPDATA%\Antigravity\bin;%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
echo Starting Local ERP Server at http://localhost:3000 ...
start "" "http://localhost:3000"
node server.js
pause
