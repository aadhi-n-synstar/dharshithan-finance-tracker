@echo off
title Dharshithan Waterproofing - Finance ERP Pro (Multi-Cloud Edition)
echo ========================================================
echo   Dharshithan Waterproofing - Finance ERP Pro
echo   Dual-Cloud Engine: Supabase (Free Tier PostgreSQL) / MongoDB Atlas (Free M0)
echo ========================================================
echo.
set "PATH=%APPDATA%\Antigravity\bin;%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
echo Starting Local ERP Server at http://localhost:3000 ...
start "" "http://localhost:3000"
node server.js
pause
