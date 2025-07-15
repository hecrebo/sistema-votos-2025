# 🔥 GUÍA RÁPIDA: CONFIGURAR FIREBASE

## 🚨 PROBLEMA ACTUAL
El sistema está funcionando en **modo offline** porque Firebase no está configurado correctamente. Los logs muestran:
```
❌ Firebase: Offline - Firebase no está disponible
❌ Base de datos: Offline - Base de datos no disponible
❌ Sincronización: Offline - Listener no está activo
```

## ✅ SOLUCIÓN PASO A PASO

### 1. **Crear Proyecto Firebase**
1. Ve a https://console.firebase.google.com/
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto (ej: "sistema-votos-2025")
4. Sigue los pasos de configuración

### 2. **Registrar Aplicación Web**
1. En tu proyecto Firebase, ve a **Configuración del proyecto** (⚙️)
2. En la sección "Tus apps", haz clic en el ícono web (</>)
3. Registra tu app con un nombre (ej: "sistema-votos-web")
4. **NO** habilites Google Analytics por ahora
5. Haz clic en "Registrar app"

### 3. **Copiar Configuración**
Firebase te mostrará algo como esto:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...tu-api-key-real...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

### 4. **Actualizar firebase-config.js**
1. Abre el archivo `firebase-config.js`
2. Reemplaza la configuración de ejemplo con la tuya:
```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY_REAL_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdefghijklmnop"
};
```

### 5. **Crear Base de Datos Firestore**
1. En Firebase Console, ve a **Firestore Database**
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba" (para desarrollo)
4. Elige una ubicación cercana (ej: "us-central1")
5. Haz clic en "Listo"

### 6. **Configurar Reglas de Seguridad**
1. En Firestore Database, ve a la pestaña "Reglas"
2. Reemplaza las reglas con esto:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Para desarrollo
    }
  }
}
```
3. Haz clic en "Publicar"

### 7. **Probar Configuración**
1. Recarga tu página web
2. Haz clic en el botón **"🔥 Configurar Firebase"** en la barra de navegación
3. Verifica en la consola (F12) que aparezca:
```
✅ Firebase está configurado correctamente
✅ Conexión a Firebase exitosa
🎉 ¡Firebase configurado exitosamente!
```

## 🔧 VERIFICACIÓN MANUAL

### En la Consola del Navegador (F12):
```javascript
// Verificar si Firebase está disponible
console.log(window.firebaseAvailable);

// Verificar configuración
console.log(window.firebaseDB);

// Probar conexión manualmente
window.configurarFirebase();
```

### Logs Esperados:
```
🔧 INICIANDO CONFIGURACIÓN DE FIREBASE
==================================================
🔍 Verificando configuración actual de Firebase...
📊 Estado actual: {firebaseAvailable: true, firebaseDB: true, ...}
✅ Firebase está configurado correctamente
🧪 Probando conexión a Firebase...
✅ Conexión a Firebase exitosa
📊 Documentos encontrados: 0
🔧 Creando colecciones de prueba...
✅ Documento de prueba creado en colección votes
✅ Configuración UBCH inicializada
🎉 ¡Firebase configurado exitosamente!
```

## 🚨 PROBLEMAS COMUNES

### Error: "Firebase no está disponible"
- **Causa**: Configuración incorrecta en `firebase-config.js`
- **Solución**: Verifica que copiaste correctamente la configuración de Firebase Console

### Error: "Permission denied"
- **Causa**: Reglas de seguridad muy restrictivas
- **Solución**: Usa las reglas de ejemplo arriba para desarrollo

### Error: "Network error"
- **Causa**: Problemas de conectividad o configuración de red
- **Solución**: Verifica tu conexión a internet

## 📊 ESTADO DESPUÉS DE CONFIGURAR

Una vez configurado correctamente, deberías ver:
- ✅ **Firebase: Online** en lugar de ❌ Offline
- ✅ **Base de datos: Online** en lugar de ❌ Offline  
- ✅ **Sincronización: Online** en lugar de ❌ Offline
- 🔄 Sincronización automática de datos
- 📊 Contadores actualizados en tiempo real

## 🎯 PRÓXIMOS PASOS

1. **Configura Firebase** siguiendo los pasos arriba
2. **Prueba la sincronización** registrando una persona
3. **Verifica que los datos aparecen** en Firebase Console
4. **Comprueba que los contadores se actualizan** automáticamente

---

**¿Necesitas ayuda?** Ejecuta `window.configurarFirebase()` en la consola para diagnóstico automático. 