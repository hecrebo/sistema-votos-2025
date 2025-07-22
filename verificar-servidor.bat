@echo off
echo ========================================
echo    Verificacion del Servidor Local
echo    Sistema de Votos 2025
echo ========================================
echo.

echo 🔍 Verificando si el servidor esta ejecutandose...
netstat -an | findstr :8000 > nul
if %errorlevel% equ 0 (
    echo ✅ Servidor encontrado en puerto 8000
    echo.
    echo 🌐 Abriendo navegador...
    start http://localhost:8000
    echo.
    echo 📋 Para probar el registro masivo:
    echo    1. Ve a la seccion "Registro de Persona"
    echo    2. Selecciona "📊 Registro Masivo (Excel)"
    echo    3. Usa el archivo datos_prueba_masivo.csv
    echo.
    echo 🧪 Para ejecutar pruebas:
    echo    start http://localhost:8000/test-registro-masivo.html
    echo.
) else (
    echo ❌ Servidor no encontrado en puerto 8000
    echo.
    echo 🚀 Iniciando servidor...
    echo python -m http.server 8000
    echo.
    echo ⏳ Esperando 3 segundos...
    timeout /t 3 /nobreak > nul
    echo.
    echo 🌐 Abriendo navegador...
    start http://localhost:8000
)

echo.
echo ========================================
echo    Verificacion Completada
echo ========================================
pause 