# 🌐 **Configuración del Servidor JSON para Compartir Datos**

## 🎯 **Problema Resuelto**

**Antes**: Los registros solo se guardaban localmente en cada computadora
**Ahora**: Los registros se comparten entre todas las computadoras conectadas

---

## 🚀 **Configuración Rápida**

### **Paso 1: Iniciar el Servidor JSON**
```bash
# En la computadora principal (servidor)
npm start
```

### **Paso 2: Verificar que el servidor esté funcionando**
- El servidor debe estar corriendo en: `http://localhost:3000`
- Deberías ver un mensaje: "Conectado al servidor. Los datos se comparten entre todas las computadoras."

---

## 📋 **Instrucciones Detalladas**

### **Opción 1: Usar la Computadora Principal como Servidor**

#### **En la PC Principal:**
1. **Abrir terminal en la carpeta del proyecto**
2. **Ejecutar**: `npm start`
3. **Verificar**: El servidor debe mostrar algo como:
   ```
   \{^_^}/ hi!
   
   Loading db.json
   Done
   
   Resources
   http://localhost:3000/votes
   http://localhost:3000/candidates
   http://localhost:3000/ubchToCommunityMap
   
   Home
   http://localhost:3000
   ```

#### **En las otras PCs:**
1. **Abrir el navegador**
2. **Ir a**: `http://[IP-DE-LA-PC-PRINCIPAL]:3000`
3. **Ejemplo**: `http://192.168.1.100:3000`

### **Opción 2: Configurar IP Pública (Recomendado para Red Local)**

#### **En la PC Principal:**
1. **Obtener la IP local**:
   ```bash
   # Windows
   ipconfig
   
   # Buscar "IPv4 Address" (ejemplo: 192.168.1.100)
   ```

2. **Iniciar servidor con IP específica**:
   ```bash
   npx json-server --watch db.json --host 0.0.0.0 --port 3000
   ```

3. **Configurar firewall** (si es necesario):
   - Permitir conexiones al puerto 3000

#### **En las otras PCs:**
1. **Abrir**: `http://[IP-DE-LA-PC-PRINCIPAL]:3000`
2. **Ejemplo**: `http://192.168.1.100:3000`

---

## 🔧 **Configuración Avanzada**

### **Modificar la URL del Servidor**

Si necesitas cambiar la IP del servidor, edita el archivo `script.js`:

```javascript
// Línea 5 en script.js
this.apiUrl = 'http://192.168.1.100:3000'; // Cambiar por tu IP
```

### **Configurar Puerto Diferente**

Si el puerto 3000 está ocupado:

```bash
# Iniciar en puerto diferente
npx json-server --watch db.json --port 3001

# Y actualizar en script.js
this.apiUrl = 'http://localhost:3001';
```

---

## 📊 **Verificación de Funcionamiento**

### **Indicadores de Conexión Exitosa:**
- ✅ Mensaje: "Conectado al servidor. Los datos se comparten entre todas las computadoras."
- ✅ Los registros aparecen en todas las PCs
- ✅ Los cambios se reflejan en tiempo real

### **Indicadores de Problemas:**
- ❌ Mensaje: "Modo offline activado. Los datos solo se guardan en esta computadora."
- ❌ Los registros no aparecen en otras PCs
- ❌ Error de conexión en la consola

---

## 🛠️ **Solución de Problemas**

### **Problema 1: No se puede conectar al servidor**
**Solución:**
1. Verificar que el servidor esté corriendo
2. Verificar la IP y puerto
3. Verificar firewall
4. Probar con `ping [IP-DEL-SERVIDOR]`

### **Problema 2: Datos no se sincronizan**
**Solución:**
1. Verificar conexión de red
2. Reiniciar el servidor
3. Limpiar cache del navegador
4. Verificar que todas las PCs usen la misma URL

### **Problema 3: Puerto ocupado**
**Solución:**
```bash
# Ver qué usa el puerto 3000
netstat -ano | findstr :3000

# Usar puerto diferente
npx json-server --watch db.json --port 3001
```

---

## 🔒 **Consideraciones de Seguridad**

### **Para Uso en Red Local:**
- ✅ Seguro para redes privadas
- ✅ Datos compartidos solo en la red local
- ✅ No accesible desde internet

### **Para Uso Público:**
- ⚠️ **NO RECOMENDADO** para uso público
- ⚠️ No tiene autenticación
- ⚠️ Cualquiera puede modificar datos

---

## 📱 **Configuración para Múltiples Dispositivos**

### **PCs con Windows:**
- Usar IP local (ejemplo: 192.168.1.100)
- Verificar firewall de Windows

### **PCs con Mac/Linux:**
- Mismo proceso que Windows
- Usar `ifconfig` en lugar de `ipconfig`

### **Dispositivos Móviles:**
- Conectar a la misma red WiFi
- Usar la IP del servidor en el navegador

---

## 🎯 **Beneficios de esta Configuración**

1. **Datos Compartidos**: Todos ven los mismos registros
2. **Tiempo Real**: Cambios inmediatos en todas las PCs
3. **Escalabilidad**: Soporta múltiples usuarios simultáneos
4. **Respaldo**: Datos centralizados en el servidor
5. **Estadísticas Unificadas**: Reportes consistentes

---

## ✅ **Estado de Implementación**

- ✅ **Servidor JSON configurado**
- ✅ **Conexión automática implementada**
- ✅ **Modo offline como respaldo**
- ✅ **Mensajes de estado claros**
- ✅ **Documentación completa**

**🎉 ¡El sistema ahora puede compartir datos entre múltiples computadoras!** 