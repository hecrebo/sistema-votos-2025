@echo off
REM Script para limpiar la carpeta y dejar solo archivos de producción
REM Puedes ejecutarlo antes de hacer push a GitHub

REM Archivos HTML principales
echo Manteniendo: index.html, login.html, admin-panel.html, admin-panel-backup.html
REM Archivos JS principales
echo Manteniendo: script-firebase.js, firebase-config.js, service-worker.js, styles.css, sync-manager.js, service-manager.js, admin-sync-panel.js
REM Recursos
echo Manteniendo: logo.jpg, favicon.ico, manifest.json, vercel.json, netlify.toml

REM Eliminar archivos de pruebas y documentación
del /Q *.md
 del /Q *.py
 del /Q *.pdf
 del /Q *.bak
 del /Q *.zip
 del /Q *.ttf
 del /Q test-*.html
 del /Q debug-*.html
 del /Q usuarios_*.csv
 del /Q usuarios_*.xlsx
 del /Q usuarios_*.ods
 del /Q db.json
rmdir /S /Q dejavu-fonts-ttf-2.37

REM Eliminar archivos temporales
 del /Q .DS_Store
 del /Q Thumbs.db

REM Mensaje final
echo Limpieza completada. Revisa la carpeta antes de hacer push a GitHub.
pause 

REM Haz commit y push a tu repositorio de GitHub
git add .
git commit -m "Limpieza y preparación para despliegue en la nube"
git push