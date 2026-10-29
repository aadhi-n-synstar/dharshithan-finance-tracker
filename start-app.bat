@echo off
title Dharshithan Waterproofing - Finance Tracker Pro (Neon Cloud Edition)
echo ========================================================
echo   Dharshithan Waterproofing - Finance Tracker Pro
echo   Powered 100%% by Neon Cloud Database (Postgres, Auth, Realtime)
echo ========================================================
echo.
set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%"
echo Starting Neon Cloud API Server at http://localhost:3000 ...
start "" "http://localhost:3000"
node server.js
pause
