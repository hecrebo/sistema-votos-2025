@echo off
echo ========================================
echo    Abriendo Prueba de Registro Masivo
echo    Sistema de Votos 2025
echo ========================================
echo.

echo 🔍 Verificando servidor...
netstat -an | findstr :8000 > nul
if %errorlevel% equ 0 (
    echo ✅ Servidor encontrado en puerto 8000
    echo.
    echo 🌐 Abriendo página de prueba...
    start http://localhost:8000/prueba-registro-masivo.html
    echo.
    echo 📋 Instrucciones:
    echo    1. Ejecuta el diagnóstico completo
    echo    2. Carga datos de prueba
    echo    3. Prueba la validación
    echo    4. Simula el registro
    echo.
    echo 🔧 Para diagnóstico manual:
    echo    - Abre la consola del navegador (F12)
    echo    - Ejecuta: diagnosticarRegistroMasivo()
    echo    - Ejecuta: cargarDatosPrueba()
    echo    - Ejecuta: probarValidacion()
    echo.
) else (
    echo ❌ Servidor no encontrado en puerto 8000
    echo.
    echo 🚀 Iniciando servidor...
    start /min python -m http.server 8000
    echo.
    echo ⏳ Esperando 3 segundos...
    timeout /t 3 /nobreak > nul
    echo.
    echo 🌐 Abriendo página de prueba...
    start http://localhost:8000/prueba-registro-masivo.html
)

echo.
echo ========================================
echo    Página de Prueba Abierta
echo ========================================
pause 