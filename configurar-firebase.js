// configurar-firebase.js
// Script para configurar Firebase correctamente

console.log('🔧 INICIANDO CONFIGURACIÓN DE FIREBASE');
console.log('=' .repeat(50));

// Función para verificar si Firebase está configurado correctamente
function verificarConfiguracionFirebase() {
    console.log('🔍 Verificando configuración actual de Firebase...');
    
    const config = {
        firebaseAvailable: window.firebaseAvailable,
        firebaseDB: !!window.firebaseDB,
        firebaseObject: typeof firebase !== 'undefined',
        votesCollection: !!(window.firebaseDB && window.firebaseDB.votesCollection),
        ubchCollection: !!(window.firebaseDB && window.firebaseDB.ubchCollection)
    };
    
    console.log('📊 Estado actual:', config);
    
    if (config.firebaseAvailable && config.firebaseDB && config.votesCollection) {
        console.log('✅ Firebase está configurado correctamente');
        return true;
    } else {
        console.log('❌ Firebase no está configurado correctamente');
        return false;
    }
}

// Función para mostrar instrucciones de configuración
function mostrarInstruccionesConfiguracion() {
    console.log('\n📋 INSTRUCCIONES PARA CONFIGURAR FIREBASE:');
    console.log('=' .repeat(50));
    console.log('1. Ve a https://console.firebase.google.com/');
    console.log('2. Crea un nuevo proyecto o selecciona uno existente');
    console.log('3. Ve a Configuración del proyecto > General');
    console.log('4. En "Tus apps", haz clic en el ícono de web (</>)');
    console.log('5. Registra tu app con un nombre (ej: "sistema-votos-web")');
    console.log('6. Copia la configuración que te proporciona Firebase');
    console.log('7. Reemplaza los valores en firebase-config.js');
    console.log('8. Ve a Firestore Database y crea una base de datos');
    console.log('9. Configura las reglas de seguridad según tus necesidades');
    console.log('\n💡 Ejemplo de configuración válida:');
    console.log('const firebaseConfig = {');
    console.log('    apiKey: "AIzaSyC...tu-api-key-real...",');
    console.log('    authDomain: "tu-proyecto.firebaseapp.com",');
    console.log('    projectId: "tu-proyecto-id",');
    console.log('    storageBucket: "tu-proyecto.appspot.com",');
    console.log('    messagingSenderId: "123456789012",');
    console.log('    appId: "1:123456789012:web:abcdefghijklmnop"');
    console.log('};');
}

// Función para probar conexión a Firebase
async function probarConexionFirebase() {
    console.log('\n🧪 Probando conexión a Firebase...');
    
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        console.log('❌ Firebase no está disponible para pruebas');
        return false;
    }
    
    try {
        // Intentar leer un documento de prueba
        const testSnapshot = await window.firebaseDB.votesCollection.limit(1).get();
        console.log('✅ Conexión a Firebase exitosa');
        console.log(`📊 Documentos encontrados: ${testSnapshot.size}`);
        return true;
    } catch (error) {
        console.error('❌ Error conectando a Firebase:', error.message);
        return false;
    }
}

// Función para crear colecciones de prueba
async function crearColeccionesPrueba() {
    console.log('\n🔧 Creando colecciones de prueba...');
    
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        console.log('❌ Firebase no disponible para crear colecciones');
        return false;
    }
    
    try {
        // Crear documento de prueba en votes
        const testVote = {
            name: 'Prueba de Conexión',
            cedula: '00000000',
            telefono: '0000000000',
            sexo: 'M',
            edad: 25,
            ubch: 'UBCH PRUEBA',
            community: 'Comunidad Prueba',
            registeredBy: 'sistema',
            voted: false,
            registeredAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        await window.firebaseDB.votesCollection.add(testVote);
        console.log('✅ Documento de prueba creado en colección votes');
        
        // Crear configuración UBCH si no existe
        if (window.firebaseDB.ubchCollection) {
            await window.firebaseDB.initializeUBCHConfig();
            console.log('✅ Configuración UBCH inicializada');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error creando colecciones de prueba:', error.message);
        return false;
    }
}

// Función para mostrar estado del sistema
function mostrarEstadoSistema() {
    console.log('\n📊 ESTADO DEL SISTEMA:');
    console.log('=' .repeat(30));
    
    const estado = {
        firebase: window.firebaseAvailable ? '✅ Online' : '❌ Offline',
        localStorage: '✅ Disponible',
        serviceWorker: 'serviceWorker' in navigator ? '✅ Disponible' : '❌ No disponible',
        network: navigator.onLine ? '✅ Online' : '❌ Offline'
    };
    
    Object.entries(estado).forEach(([servicio, status]) => {
        console.log(`${servicio}: ${status}`);
    });
    
    // Mostrar datos locales
    const localVotes = localStorage.getItem('votes');
    const localUser = localStorage.getItem('currentUser');
    
    console.log(`\n💾 Datos locales:`);
    console.log(`- Usuario: ${localUser ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`- Votos: ${localVotes ? JSON.parse(localVotes).length : 0} registros`);
}

// Función principal de configuración
async function configurarFirebase() {
    console.log('🚀 Iniciando proceso de configuración...\n');
    
    // 1. Verificar configuración actual
    const configurado = verificarConfiguracionFirebase();
    
    if (!configurado) {
        console.log('\n⚠️ Firebase no está configurado correctamente');
        mostrarInstruccionesConfiguracion();
        mostrarEstadoSistema();
        return;
    }
    
    // 2. Probar conexión
    const conexionExitosa = await probarConexionFirebase();
    
    if (!conexionExitosa) {
        console.log('\n❌ No se pudo conectar a Firebase');
        console.log('🔧 Verifica tu configuración y reglas de seguridad');
        return;
    }
    
    // 3. Crear colecciones de prueba
    const coleccionesCreadas = await crearColeccionesPrueba();
    
    if (coleccionesCreadas) {
        console.log('\n🎉 ¡Firebase configurado exitosamente!');
        console.log('✅ El sistema ahora sincronizará con Firebase');
    }
    
    // 4. Mostrar estado final
    mostrarEstadoSistema();
}

// Función para limpiar datos de prueba
async function limpiarDatosPrueba() {
    console.log('\n🧹 Limpiando datos de prueba...');
    
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        console.log('❌ Firebase no disponible');
        return;
    }
    
    try {
        // Buscar y eliminar documentos de prueba
        const snapshot = await window.firebaseDB.votesCollection
            .where('name', '==', 'Prueba de Conexión')
            .get();
        
        const batch = window.firebaseDB.db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`✅ ${snapshot.size} documentos de prueba eliminados`);
        
    } catch (error) {
        console.error('❌ Error limpiando datos de prueba:', error.message);
    }
}

// Exportar funciones para uso manual
window.configurarFirebase = configurarFirebase;
window.verificarConfiguracionFirebase = verificarConfiguracionFirebase;
window.probarConexionFirebase = probarConexionFirebase;
window.limpiarDatosPrueba = limpiarDatosPrueba;
window.mostrarEstadoSistema = mostrarEstadoSistema;

// Ejecutar configuración automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configurarFirebase);
} else {
    setTimeout(configurarFirebase, 2000);
}

console.log('✅ Script de configuración de Firebase cargado');
console.log('💡 Ejecuta window.configurarFirebase() para configurar manualmente'); 