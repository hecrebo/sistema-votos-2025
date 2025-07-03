# Guía de Desarrollo Local - Sistema de Votos 2025

## 🚀 Ejecutar el Sistema Localmente

### Problema del Service Worker
El sistema utiliza Service Workers para funcionalidades offline y PWA. Los Service Workers **NO funcionan** cuando abres archivos HTML directamente desde el sistema de archivos (`file://`).

### Solución: Servidor Local

#### Opción 1: Usar los Scripts Automáticos

**Windows (CMD):**
```cmd
iniciar-servidor-local.bat
```

**Windows (PowerShell):**
```powershell
.\iniciar-servidor-local.ps1
```

#### Opción 2: Manual

**Con Python:**
```bash
python -m http.server 8080
```

**Con Node.js:**
```bash
npx http-server -p 8080
```

**Con PHP:**
```bash
php -S localhost:8080
```

### Acceder al Sistema

1. Ejecuta uno de los comandos anteriores
2. Abre tu navegador
3. Ve a: `http://localhost:8080`
4. El sistema funcionará completamente con todas las características

## 🔧 Características que Funcionan con Servidor Local

✅ **Service Worker** - Modo offline y PWA  
✅ **Sincronización automática** - Firebase y localStorage  
✅ **Modo proyección** - Funciona correctamente  
✅ **Notificaciones** - Push y toast  
✅ **Almacenamiento** - IndexedDB y localStorage  
✅ **Auto-recuperación** - Manejo de errores  
✅ **Backup automático** - Respaldo de datos  

## ❌ Lo que NO funciona con `file://`

❌ Service Workers  
❌ Algunas APIs de PWA  
❌ Ciertas características de seguridad  
❌ IndexedDB (en algunos navegadores)  

## 🐛 Solución de Problemas

### Error: "The URL protocol of the current origin ('null') is not supported"

**Causa:** Estás abriendo el archivo directamente desde el explorador.

**Solución:** Usa un servidor local como se describe arriba.

### Error: "Failed to register a ServiceWorker"

**Causa:** Protocolo no soportado o navegador sin soporte.

**Solución:** El sistema automáticamente cambia a "modo offline básico".

### El sistema funciona pero algunas características no

**Verificar:**
1. ¿Estás usando `http://localhost:8080`?
2. ¿El navegador soporta Service Workers?
3. ¿Hay errores en la consola del navegador?

## 📱 Probar en Diferentes Dispositivos

### En la misma red WiFi:
1. Encuentra la IP de tu computadora
2. En otros dispositivos, ve a: `http://[TU-IP]:8080`

### Ejemplo:
- Tu PC: `192.168.1.100`
- Otros dispositivos: `http://192.168.1.100:8080`

## 🔄 Desarrollo y Pruebas

### Para desarrollo:
```bash
# Terminal 1: Servidor
python -m http.server 8080

# Terminal 2: Observar cambios (opcional)
# Puedes usar herramientas como Live Server en VS Code
```

### Para producción:
El sistema ya está configurado para Netlify y funcionará correctamente en producción.

## 📊 Verificar que Todo Funciona

1. **Service Worker:** Ve a DevTools → Application → Service Workers
2. **Almacenamiento:** DevTools → Application → Storage
3. **Console:** No debe haber errores de Service Worker
4. **Funcionalidades:** Todas las características deben funcionar

## 🎯 Resumen

- ✅ **Usa servidor local** para desarrollo completo
- ✅ **El sistema detecta automáticamente** el entorno
- ✅ **Fallback automático** si algo no funciona
- ✅ **Listo para producción** en Netlify

¡El sistema está diseñado para ser robusto y funcionar en cualquier entorno! 