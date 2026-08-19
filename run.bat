@echo off
title Support Desk - Gestion de Casos
echo ===================================================
echo   SUPPORT DESK - GESTION DE CASOS Y TICKETS
echo ===================================================
echo Iniciando servidor unificado en http://localhost:3000...
echo.

cd /d "%~dp0backend"
node dist/server.js
pause
