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
```
Para iniciar el servidor de desarrollo (sirve los archivos HTML/CSS/JS, con recarga en vivo):
```bash
npm run dev
```
Esto usualmente abrirá `http://localhost:8080` en tu navegador.

Si necesitas la API simulada con `db.json` (para desarrollo sin Firebase o pruebas específicas):
```bash
npm run start
```
Esto iniciará `json-server` en `http://localhost:3000`.

Consulta la `GUIA_DESARROLLO_LOCAL.md` para más detalles y alternativas.

## 📁 Estructura del Proyecto

- `index.html` - Página principal de la aplicación de votos.
- `login.html` - Página de inicio de sesión.
- `admin-panel.html` - Panel de administración.
- `styles.css` - Estilos principales de la aplicación.
- `script.js` - Lógica principal JavaScript para la interfaz de usuario y manejo de datos (versión base).
- `script-firebase.js` - Extensión de `script.js` con lógica específica de Firebase.
- `firebase-config.js` - Configuración de la conexión a Firebase.
- `queue-manager.js` - Gestor de cola para registros offline/pendientes.
- `sync-manager.js` - Gestor de sincronización de datos.
- `service-manager.js` - Gestor de estado de servicios.
- `auto-init.js` - Script para la inicialización automática del sistema.
- `db.json` - Base de datos JSON de ejemplo para `json-server`.
- `package.json` - Define dependencias y scripts del proyecto.
- `netlify.toml`, `vercel.json` - Archivos de configuración para despliegue en Netlify y Vercel.
- `*.md` - Archivos de documentación.
- `favicon.ico/` - Iconos del sitio.
- `test-*.js`, `test-*.html` - Archivos de prueba (algunos pueden ser eliminados por `npm run clean`).

## 🔧 Scripts Disponibles en `package.json`

-   **`npm run dev`**: Inicia un servidor de desarrollo local con `live-server` en el puerto 8080 (recomendado para desarrollo).
-   **`npm start`**: Inicia `json-server` para simular una API REST con `db.json` en el puerto 3000.
-   **`npm run serve`**: Alias para `npm run dev`.
-   **`npm run serve:py`**: Inicia un servidor HTTP simple usando Python en el puerto 8080.
-   **`npm run serve:node`**: Inicia un servidor HTTP simple usando `http-server` (Node.js) en el puerto 8080.
-   **`npm run json-server`**: Inicia `json-server` escuchando en todas las interfaces de red (`0.0.0.0`), útil para pruebas en red local.
-   **`npm run clean`**: Ejecuta una limpieza de archivos de documentación (excepto README y AGENTS), pruebas y otros archivos misceláneos.
    *   `npm run clean:docs`
    *   `npm run clean:tests`
    *   `npm run clean:misc`
-   **`npm run build`**: Actualmente solo muestra un mensaje. Considera usar `npm run clean` para un estado similar al de producción.
-   **`npm run deploy`**: Ejecuta `node deploy.js`, que muestra instrucciones de despliegue.

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
      "image": "ruta/a/imagen.jpg"
    }
  ],
  "votedUsers": []
}
```

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Escritorio (1024px+)

## 🔒 Seguridad

- Validación de entrada en el frontend
- Prevención de votos duplicados
- Sanitización de datos
- Para producción: implementar autenticación

## 🚀 Despliegue

### Netlify (Recomendado)
1. Conecta tu repositorio de GitHub
2. Build command: `npm install`
3. Publish directory: `.`
4. ¡Listo! Tu sitio estará en `https://tu-sitio.netlify.app`

### Vercel
1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta: `vercel`
3. Sigue las instrucciones

### GitHub Pages
1. Ve a Settings > Pages
2. Selecciona rama main
3. Tu sitio estará en `https://tu-usuario.github.io/repo`

## 📞 Soporte

Si tienes problemas:
1. Verifica que Node.js esté instalado
2. Ejecuta `npm install` para instalar dependencias
3. Asegúrate de que el puerto 3000 esté libre para JSON Server

## 📄 Licencia

MIT License - Libre para uso personal y comercial
