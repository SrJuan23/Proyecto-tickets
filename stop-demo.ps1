<#
.SYNOPSIS
Detiene todos los servicios de Support Demo (backend + ngrok).
#>

Write-Host "`n[INFO] Deteniendo servicios de Support Desk..." -ForegroundColor Yellow

# Detener backend en puerto 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# Detener ngrok
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "[OK] Todos los servicios detenidos." -ForegroundColor Green
