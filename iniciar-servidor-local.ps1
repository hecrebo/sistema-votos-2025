# Script para iniciar servidor HTTP local
# Resuelve problemas de CORS al ejecutar la aplicación

Write-Host "🚀 Iniciando servidor HTTP local..." -ForegroundColor Green
Write-Host "📁 Directorio: $PWD" -ForegroundColor Yellow
Write-Host "🌐 URL: http://localhost:8000" -ForegroundColor Cyan
Write-Host "⏹️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Red
Write-Host ""

# Verificar si Python está disponible
try {
    python --version | Out-Null
    Write-Host "✅ Python encontrado, iniciando servidor..." -ForegroundColor Green
    python -m http.server 8000
} catch {
    Write-Host "❌ Python no encontrado, intentando con Python3..." -ForegroundColor Red
    try {
        python3 --version | Out-Null
        Write-Host "✅ Python3 encontrado, iniciando servidor..." -ForegroundColor Green
        python3 -m http.server 8000
    } catch {
        Write-Host "❌ Error: No se encontró Python instalado" -ForegroundColor Red
        Write-Host "💡 Instala Python desde https://python.org" -ForegroundColor Yellow
        Read-Host "Presiona Enter para salir"
    }
} 