# ===================================================
# Support Desk - Script de Inicio en PowerShell
# ===================================================

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  SUPPORT DESK - GESTION DE CASOS Y TICKETS" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Iniciando servidor en http://localhost:3000..." -ForegroundColor Green
Write-Host "Abriendo en navegador predeterminado..." -ForegroundColor Yellow

Start-Process "http://localhost:3000"

Set-Location "$PSScriptRoot/backend"
node dist/server.js
