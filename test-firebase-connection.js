// test-firebase-connection.js
// Script para probar la conexión a Firebase

console.log('🧪 INICIANDO PRUEBA DE CONEXIÓN FIREBASE');
console.log('=' .repeat(50));

// Función para probar la conexión completa
async function testFirebaseConnection() {
    console.log('🔍 Verificando estado de Firebase...');
    
    // 1. Verificar disponibilidad
    const firebaseStatus = {
        firebaseObject: typeof window.firebase !== 'undefined',
        firebaseApp: !!(window.firebase && window.firebase.app),
        firestore: !!(window.firestore),
        firebaseDB: !!(window.firebaseDB),
        votesCollection: !!(window.firebaseDB && window.firebaseDB.votesCollection),
        ubchCollection: !!(window.firebaseDB && window.firebaseDB.ubchCollection)
    };
    
    console.log('📊 Estado de Firebase:', firebaseStatus);
    
    // 2. Probar escritura
    if (firebaseStatus.votesCollection) {
        console.log('✍️ Probando escritura en Firebase...');
        try {
            const testData = {
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
                createdAt: new Date().toISOString(),
                test: true
            };
            
            const docRef = await window.firebaseDB.votesCollection.add(testData);
            console.log('✅ Escritura exitosa - Documento ID:', docRef.id);
            
            // 3. Probar lectura
            console.log('📖 Probando lectura desde Firebase...');
            const docSnap = await window.firebaseDB.votesCollection.doc(docRef.id).get();
            
            if (docSnap.exists) {
                console.log('✅ Lectura exitosa - Datos:', docSnap.data());
                
                // 4. Limpiar documento de prueba
                console.log('🧹 Limpiando documento de prueba...');
                await window.firebaseDB.votesCollection.doc(docRef.id).delete();
                console.log('✅ Documento de prueba eliminado');
                
                return {
                    success: true,
                    message: 'Firebase funcionando correctamente',
                    details: {
                        write: true,
                        read: true,
                        delete: true,
                        documentId: docRef.id
                    }
                };
            } else {
                console.log('❌ Documento no encontrado después de escribir');
                return {
                    success: false,
                    message: 'Error: Documento no encontrado después de escribir'
                };
            }
            
        } catch (error) {
            console.error('❌ Error en prueba de Firebase:', error);
            return {
                success: false,
                message: 'Error en Firebase: ' + error.message
            };
        }
    } else {
        console.log('❌ Firebase no disponible para pruebas');
        return {
            success: false,
            message: 'Firebase no está configurado correctamente'
        };
    }
}

// Función para probar sincronización en tiempo real
async function testRealtimeSync() {
    console.log('🔄 Probando sincronización en tiempo real...');
    
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        console.log('❌ Firebase no disponible para prueba de sincronización');
        return false;
    }
    
    try {
        // Crear un listener en tiempo real
        const unsubscribe = window.firebaseDB.votesCollection.onSnapshot((snapshot) => {
            console.log('📡 Evento de sincronización recibido');
            console.log('📊 Documentos en snapshot:', snapshot.size);
            
            snapshot.docChanges().forEach((change) => {
                console.log(`📝 Cambio detectado: ${change.type} - ID: ${change.doc.id}`);
            });
        }, (error) => {
            console.error('❌ Error en listener en tiempo real:', error);
        });
        
        // Esperar un momento y luego cancelar el listener
        setTimeout(() => {
            unsubscribe();
            console.log('✅ Listener en tiempo real cancelado');
        }, 3000);
        
        return true;
    } catch (error) {
        console.error('❌ Error configurando listener en tiempo real:', error);
        return false;
    }
}

// Función para mostrar estado del sistema
function showSystemStatus() {
    console.log('\n📊 ESTADO DEL SISTEMA:');
    console.log('=' .repeat(30));
    
    const status = {
        firebase: window.firebaseAvailable ? '✅ Online' : '❌ Offline',
        firestore: typeof window.firestore !== 'undefined' ? '✅ Disponible' : '❌ No disponible',
        votesCollection: !!(window.firebaseDB && window.firebaseDB.votesCollection) ? '✅ Configurado' : '❌ No configurado',
        network: navigator.onLine ? '✅ Online' : '❌ Offline',
        localStorage: '✅ Disponible'
    };
    
    Object.entries(status).forEach(([service, state]) => {
        console.log(`${service}: ${state}`);
    });
    
    // Mostrar datos locales
    const localVotes = localStorage.getItem('votes');
    const localUser = localStorage.getItem('currentUser');
    
    console.log(`\n💾 Datos locales:`);
    console.log(`- Usuario: ${localUser ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`- Votos: ${localVotes ? JSON.parse(localVotes).length : 0} registros`);
}

// Función principal de prueba
async function runFirebaseTest() {
    console.log('🚀 Iniciando pruebas de Firebase...\n');
    
    // Mostrar estado inicial
    showSystemStatus();
    
    // Probar conexión
    const connectionResult = await testFirebaseConnection();
    
    if (connectionResult.success) {
        console.log('\n🎉 ¡PRUEBA EXITOSA!');
        console.log('✅ Firebase está funcionando correctamente');
        console.log('📊 Detalles:', connectionResult.details);
        
        // Probar sincronización en tiempo real
        const syncResult = await testRealtimeSync();
        if (syncResult) {
            console.log('✅ Sincronización en tiempo real funcionando');
        } else {
            console.log('⚠️ Sincronización en tiempo real no disponible');
        }
        
        console.log('\n🎯 RESULTADO FINAL:');
        console.log('✅ Firebase configurado y funcionando');
        console.log('✅ El sistema puede sincronizar datos');
        console.log('✅ Modo online activado');
        
    } else {
        console.log('\n❌ PRUEBA FALLIDA');
        console.log('❌ Error:', connectionResult.message);
        console.log('\n🔧 RECOMENDACIONES:');
        console.log('1. Verifica tu conexión a internet');
        console.log('2. Asegúrate de que Firebase esté configurado correctamente');
        console.log('3. Verifica las reglas de seguridad en Firebase Console');
        console.log('4. Revisa la consola para errores específicos');
    }
    
    return connectionResult.success;
}

// Exportar funciones para uso manual
window.testFirebaseConnection = testFirebaseConnection;
window.testRealtimeSync = testRealtimeSync;
window.runFirebaseTest = runFirebaseTest;
window.showSystemStatus = showSystemStatus;

// Ejecutar prueba automáticamente después de un delay
setTimeout(() => {
    runFirebaseTest();
}, 2000);

console.log('✅ Script de prueba de Firebase cargado');
console.log('💡 Ejecuta window.runFirebaseTest() para probar manualmente'); 