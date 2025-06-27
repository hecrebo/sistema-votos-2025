# Sistema de Registro de Votos 2025

Sistema de votación electrónica desarrollado con HTML, CSS y JavaScript.

## 🚀 Cómo Publicar el Proyecto

### Opción 1: GitHub Pages (Recomendado)

1. **Crear un repositorio en GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Primer commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/nombre-del-repo.git
   git push -u origin main
   ```

2. **Activar GitHub Pages:**
   - Ve a Settings > Pages
   - Selecciona "Deploy from a branch"
   - Elige la rama "main"
   - Guarda

3. **Tu sitio estará disponible en:** `https://tu-usuario.github.io/nombre-del-repo`

### Opción 2: Netlify (Con backend)

1. **Crear cuenta en Netlify**
2. **Conectar tu repositorio de GitHub**
3. **Configurar el build:**
   - Build command: `npm install`
   - Publish directory: `.` (raíz del proyecto)

### Opción 3: Vercel

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Desplegar:**
   ```bash
   vercel
   ```

## 📋 Requisitos

- Node.js (para desarrollo local)
- Navegador web moderno

## 🛠️ Instalación Local

```bash
npm install
npm run dev
```

## 📁 Estructura del Proyecto

- `index.html` - Página principal
- `styles.css` - Estilos
- `script.js` - Lógica JavaScript
- `db.json` - Base de datos JSON
- `favicon.ico/` - Iconos del sitio

## 🔧 Scripts Disponibles

- `npm start` - Inicia JSON Server (puerto 3000)
- `npm run dev` - Inicia servidor de desarrollo (puerto 8080)
- `npm run build` - No requiere build (archivos estáticos)

## 🌐 Notas Importantes

- Para producción, considera migrar de JSON Server a una base de datos real
- Implementa autenticación y autorización
- Configura HTTPS para seguridad
- Optimiza imágenes y recursos

## ✨ Características

- **Interfaz moderna y responsiva** - Diseño atractivo que funciona en todos los dispositivos
- **Sistema de votación** - Los usuarios pueden votar por candidatos
- **Prevención de votos duplicados** - Control para evitar votos múltiples
- **Panel de administración** - Agregar candidatos, reiniciar votos, exportar resultados
- **Múltiples opciones de almacenamiento** - JSON Server, localStorage, Firebase
- **Exportación de resultados** - Descarga de resultados en formato CSV
- **Notificaciones en tiempo real** - Feedback visual para las acciones del usuario

## 🚀 Cómo usar

### Opción 1: Con JSON Server (Recomendado)

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor de datos:**
   ```bash
   npm start
   ```

3. **Abrir la aplicación:**
   - Abre `index.html` en tu navegador
   - O usa: `npm run dev` para servidor de desarrollo

### Opción 2: Solo archivos estáticos

1. **Abre `index.html`** directamente en tu navegador
2. **Los datos se guardarán** en localStorage automáticamente

### Opción 3: Subir a un servidor

1. **Sube todos los archivos** a tu servidor web
2. **Configura JSON Server** en tu servidor o usa localStorage
3. **Accede a `index.html`** desde tu dominio

## 💾 Opciones de Almacenamiento de Datos

### 1. **JSON Server (Recomendado)**
- ✅ Base de datos JSON simple
- ✅ API REST automática
- ✅ Datos persistentes
- ✅ Fácil de configurar
- ✅ Ideal para desarrollo y producción pequeña

### 2. **localStorage (Fallback)**
- ✅ Funciona sin servidor
- ✅ Datos locales en el navegador
- ❌ Se pierden al limpiar caché
- ❌ No sincroniza entre dispositivos

### 3. **Firebase (Para producción)**
- ✅ Base de datos en la nube
- ✅ Tiempo real
- ✅ Escalable
- ✅ Plan gratuito generoso

### 4. **Supabase (Alternativa)**
- ✅ Base de datos PostgreSQL
- ✅ API REST automática
- ✅ Generoso plan gratuito

## 🎯 Funcionalidades

### Para Votantes
- Ver lista de candidatos con fotos y partidos
- Votar por un candidato (solo una vez)
- Ver resultados en tiempo real
- Barras de progreso visuales

### Para Administradores
- **Agregar candidatos**: Nombre, partido e imagen opcional
- **Reiniciar votos**: Limpiar todos los votos registrados
- **Exportar resultados**: Descargar datos en formato CSV

## 🔧 Configuración

### Instalar JSON Server
```bash
npm install json-server
```

### Iniciar servidor de datos
```bash
npm start
```

### API Endpoints disponibles
- `GET /candidates` - Obtener candidatos
- `PUT /candidates/:id` - Actualizar candidato
- `POST /candidates` - Crear candidato
- `GET /votedUsers` - Obtener usuarios que votaron
- `PUT /votedUsers` - Actualizar lista de votantes

## 🎨 Personalización

### Cambiar colores
Edita las variables CSS en `styles.css`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #48bb78;
    --danger-color: #f56565;
}
```

### Agregar candidatos por defecto
Modifica el archivo `db.json`:
```json
{
  "candidates": [
    {
      "id": 1,
      "name": "Tu Candidato",
      "party": "Tu Partido",
      "votes": 0,
      "image": "url-de-la-imagen"
    }
  ]
}
```

## 🔧 Requisitos técnicos

- **Navegador moderno** (Chrome, Firefox, Safari, Edge)
- **JavaScript habilitado**
- **Node.js** (solo para JSON Server)
- **Conexión a internet** (solo para cargar imágenes externas)

## 📱 Compatibilidad

- ✅ Desktop (Windows, Mac, Linux)
- ✅ Móviles (iOS, Android)
- ✅ Tablets
- ✅ Todos los navegadores modernos

## 🚨 Limitaciones

- **Con localStorage**: Los datos se almacenan localmente
- **Con JSON Server**: Requiere servidor Node.js
- No hay autenticación de usuarios avanzada
- No hay base de datos relacional completa

## 🔮 Futuras mejoras

- [ ] Autenticación de usuarios
- [ ] Base de datos PostgreSQL/MySQL
- [ ] Múltiples elecciones
- [ ] Gráficos estadísticos
- [ ] Notificaciones push
- [ ] Modo offline
- [ ] Integración con Firebase/Supabase

## 📞 Soporte

Si tienes problemas o sugerencias:
1. Revisa que JavaScript esté habilitado
2. Verifica que JSON Server esté corriendo (puerto 3000)
3. Limpia el caché del navegador
4. Verifica que todos los archivos estén presentes

---

**Desarrollado con ❤️ usando tecnologías web estándar** 