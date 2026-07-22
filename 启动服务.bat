@echo off
chcp 65001 >nul
title MOOVED EV Survey Server
echo ============================================
echo   MOOVED EV Market Survey Server
echo   加纳电动车市场价格调研问卷
echo ============================================
echo.
echo Starting server on http://localhost:5000 ...
start "" "http://localhost:5000"
C:\Python314\python.exe server.py
pause
