#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparando proyecto para despliegue...\n');

// Verificar que todos los archivos necesarios existen
const requiredFiles = [
  'index.html',
  'styles.css', 
  'script.js',
  'package.json',
  'db.json'
];

console.log('📋 Verificando archivos requeridos...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTANTE`);
  }
});

console.log('\n🌐 Opciones de despliegue disponibles:\n');

console.log('1. GitHub Pages (Gratuito):');
console.log('   - Crear repositorio en GitHub');
console.log('   - Subir código: git push origin main');
console.log('   - Activar GitHub Pages en Settings > Pages');
console.log('   - URL: https://tu-usuario.github.io/nombre-repo\n');

console.log('2. Netlify (Gratuito):');
console.log('   - Ir a netlify.com');
console.log('   - Conectar repositorio de GitHub');
console.log('   - Configurar build: npm install');
console.log('   - Publish directory: . (raíz)\n');

console.log('3. Vercel (Gratuito):');
console.log('   - Instalar: npm i -g vercel');
console.log('   - Ejecutar: vercel');
console.log('   - Seguir instrucciones en terminal\n');

console.log('4. Firebase Hosting (Gratuito):');
console.log('   - Instalar: npm i -g firebase-tools');
console.log('   - Inicializar: firebase init hosting');
console.log('   - Desplegar: firebase deploy\n');

console.log('📝 Notas importantes:');
console.log('- Tu proyecto usa JSON Server que requiere un servidor');
console.log('- Para producción, considera migrar a una base de datos real');
console.log('- Implementa autenticación para mayor seguridad');
console.log('- Configura HTTPS en producción');

console.log('\n✨ ¡Tu proyecto está listo para ser publicado!'); 