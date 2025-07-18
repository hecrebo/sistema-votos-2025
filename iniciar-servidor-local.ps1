Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SERVIDOR LOCAL PARA SISTEMA DE VOTOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciando servidor local..." -ForegroundColor Yellow
Write-Host ""
Write-Host "URL: http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Verificar si Python está instalado
try {
    $pythonVersion = python --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Usando Python para el servidor..." -ForegroundColor Green
        python -m http.server 8080
    }
} catch {
    # Verificar si Node.js está instalado
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Usando Node.js para el servidor..." -ForegroundColor Green
            npx http-server -p 8080
        }
    } catch {
        Write-Host "ERROR: No se encontró Python ni Node.js" -ForegroundColor Red
        Write-Host ""
        Write-Host "Para instalar Python: https://www.python.org/downloads/" -ForegroundColor Yellow
        Write-Host "Para instalar Node.js: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Presiona Enter para continuar"
    }
} 