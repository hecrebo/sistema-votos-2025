@echo off
echo ========================================
echo    SERVIDOR LOCAL PARA SISTEMA DE VOTOS
echo ========================================
echo.
echo Iniciando servidor local...
echo.
echo URL: http://localhost:8080
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Usando Python para el servidor...
    python -m http.server 8080
) else (
    REM Verificar si Node.js está instalado
    node --version >nul 2>&1
    if %errorlevel% == 0 (
        echo Usando Node.js para el servidor...
        npx http-server -p 8080
    ) else (
        echo ERROR: No se encontró Python ni Node.js
        echo.
        echo Para instalar Python: https://www.python.org/downloads/
        echo Para instalar Node.js: https://nodejs.org/
        echo.
        pause
    )
) 