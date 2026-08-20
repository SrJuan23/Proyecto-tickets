<#
.SYNOPSIS
Inicia el backend de Support Desk y lo expone con ngrok para acceso remoto.
No requiere permisos de administrador.
#>

param(
    [switch]$NoBuild
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\JuanSebastiánMartíne\Desktop\Proyecto-tickets"
$BackendDir = Join-Path $ProjectRoot "backend"
$NodePath = "C:\Program Files\nodejs\node.exe"
$NgrokPath = "ngrok"

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "  SUPPORT DESK - DEMO CON NGROK" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

# 1. Verificar Node.js
if (-not (Test-Path $NodePath)) {
    Write-Host "ERROR: No se encuentra Node.js en $NodePath" -ForegroundColor Red
    Write-Host "Verifica la ruta de instalacion." -ForegroundColor Red
    exit 1
}

# 2. Verificar ngrok
$ngrokCmd = Get-Command $NgrokPath -ErrorAction SilentlyContinue
if (-not $ngrokCmd) {
    Write-Host "ERROR: No se encuentra ngrok en el PATH." -ForegroundColor Red
    Write-Host "Instalalo desde https://ngrok.com/download o agregalo al PATH." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] ngrok encontrado: $($ngrokCmd.Source)" -ForegroundColor Green

# 3. Detener procesos previos en puerto 3000 (no requiere admin si los procesos son del usuario)
Write-Host "`n[INFO] Liberando puerto 3000..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

# 4. Build si es necesario
if (-not $NoBuild) {
    Write-Host "[INFO] Compilando backend..." -ForegroundColor Yellow
    Push-Location $BackendDir
    try {
        $env:PATH += ";C:\Program Files\nodejs"
        & npm.cmd run build 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Fallo la compilacion del backend"
        }
        Write-Host "[OK] Backend compilado." -ForegroundColor Green
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}

# 5. Iniciar backend
Write-Host "[INFO] Iniciando backend en puerto 3000..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath $NodePath -ArgumentList "dist/server.js" -WorkingDirectory $BackendDir -WindowStyle Hidden -PassThru

# Esperar a que el backend esté listo (max 15 seg)
$maxRetries = 15
$retryCount = 0
$backendReady = $false
while (-not $backendReady -and $retryCount -lt $maxRetries) {
    Start-Sleep -Seconds 1
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -ErrorAction Stop
        $backendReady = $true
    } catch {
        $retryCount++
    }
}

if (-not $backendReady) {
    Write-Host "ERROR: El backend no respondio en 15 segundos." -ForegroundColor Red
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "[OK] Backend activo en http://localhost:3000" -ForegroundColor Green

# 6. Iniciar ngrok como proceso background
Write-Host "[INFO] Iniciando ngrok en puerto 3000..." -ForegroundColor Yellow

# Iniciar ngrok y redirigir output a archivo temporal
$ngrokLog = Join-Path $env:TEMP "ngrok_demo.log"
if (Test-Path $ngrokLog) { Remove-Item $ngrokLog -Force }

$ngrokProcess = Start-Process -FilePath $NgrokPath -ArgumentList "http 3000 --log=stdout" -WindowStyle Hidden -PassThru -RedirectStandardOutput $ngrokLog -NoNewWindow

# Esperar a que ngrok genere la URL
Start-Sleep -Seconds 4

# Intentar capturar la URL desde la API de ngrok (puerto 4040)
$publicUrl = $null
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    $publicUrl = $ngrokApi.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1 -ExpandProperty public_url
} catch {
    # Si falla la API, intentar parsear el log
    if (Test-Path $ngrokLog) {
        $logContent = Get-Content $ngrokLog -Raw -ErrorAction SilentlyContinue
        if ($logContent -match "https://[^\s]+\.ngrok[^\s]*\.app") {
            $publicUrl = $Matches[0]
        }
    }
}

if ($publicUrl) {
    Write-Host "`n====================================================" -ForegroundColor Green
    Write-Host "  ACCESO PUBLICO (ngrok)" -ForegroundColor Green
    Write-Host "  URL: $publicUrl" -ForegroundColor White
    Write-Host "  URL local: http://localhost:3000" -ForegroundColor Gray
    Write-Host "====================================================`n" -ForegroundColor Green
    Write-Host "[INFO] Servicios activos. Presiona Ctrl+C para detener todo.`n" -ForegroundColor Cyan
} else {
    Write-Host "`n[WARN] No se pudo obtener la URL de ngrok automaticamente." -ForegroundColor Yellow
    Write-Host "       Revisa la terminal de ngrok o ejecuta: ngrok http 3000`n" -ForegroundColor Yellow
}

# 7. Mantener el script corriendo hasta Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Verificar que el backend siga corriendo
        if (-not $backendProcess.HasExited) {
            try {
                $null = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -ErrorAction Stop
            } catch {
                Write-Host "`n[WARN] El backend dejo de responder. Reiniciando..." -ForegroundColor Yellow
                Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
                $backendProcess = Start-Process -FilePath $NodePath -ArgumentList "dist/server.js" -WorkingDirectory $BackendDir -WindowStyle Hidden -PassThru
                Start-Sleep -Seconds 3
            }
        }
        
        # Verificar que ngrok siga corriendo
        if ($ngrokProcess.HasExited) {
            Write-Host "`n[WARN] ngrok se detuvo. Reiniciando..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            $ngrokProcess = Start-Process -FilePath $NgrokPath -ArgumentList "http 3000 --log=stdout" -WindowStyle Hidden -PassThru -RedirectStandardOutput $ngrokLog -NoNewWindow
            Start-Sleep -Seconds 4
        }
    }
} catch {
    # Ctrl+C
} finally {
    Write-Host "`n[INFO] Deteniendo servicios..." -ForegroundColor Yellow
    if (-not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if (-not $ngrokProcess.HasExited) {
        Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
    }
    # Limpiar log temporal
    if (Test-Path $ngrokLog) { Remove-Item $ngrokLog -Force -ErrorAction SilentlyContinue }
    Write-Host "[OK] Servicios detenidos." -ForegroundColor Green
}
