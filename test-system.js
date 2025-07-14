// test-system.js
// Script de prueba para verificar el funcionamiento del sistema

console.log('🧪 Iniciando pruebas del sistema...');

// Función para verificar el estado del sistema
function testSystemStatus() {
    console.log('🔍 Verificando estado del sistema...');
    
    const status = {
        votingSystemExists: !!window.votingSystem,
        votingSystemInitialized: !!window.votingSystemInitialized,
        firebaseAvailable: !!window.firebaseDB,
        currentUser: localStorage.getItem('currentUser'),
        votesCount: window.votingSystem ? window.votingSystem.votes.length : 0,
        ubchConfigLoaded: window.votingSystem ? !!window.votingSystem.ubchToCommunityMap : false
    };
    
    console.log('📊 Estado del sistema:', status);
    
    if (status.votingSystemExists && status.votingSystemInitialized) {
        console.log('✅ Sistema funcionando correctamente');
        return true;
    } else {
        console.warn('⚠️ Sistema no está funcionando correctamente');
        return false;
    }
}

// Función para probar registro
function testRegistration() {
    console.log('🧪 Probando registro...');
    
    if (!window.votingSystem) {
        console.error('❌ Sistema de votos no disponible');
        return false;
    }
    
    try {
        // Simular datos de registro
        const testData = {
            name: 'Usuario de Prueba',
            cedula: '12345678',
            telefono: '04123456789',
            sexo: 'M',
            edad: 25,
            ubch: 'COLEGIO ASUNCION BELTRAN',
            community: 'EL VALLE'
        };
        
        // Validar datos
        const validation = window.votingSystem.validateRegistrationData(testData);
        console.log('✅ Validación de datos:', validation);
        
        return validation.isValid;
    } catch (error) {
        console.error('❌ Error en prueba de registro:', error);
        return false;
    }
}

// Función para probar búsqueda
function testSearch() {
    console.log('🧪 Probando búsqueda...');
    
    if (!window.votingSystem) {
        console.error('❌ Sistema de votos no disponible');
        return false;
    }
    
    try {
        // Simular búsqueda
        const results = window.votingSystem.votes.filter(vote => vote.cedula === '12345678');
        console.log('✅ Búsqueda completada, resultados:', results.length);
        
        return true;
    } catch (error) {
        console.error('❌ Error en prueba de búsqueda:', error);
        return false;
    }
}

// Función para probar navegación
function testNavigation() {
    console.log('🧪 Probando navegación...');
    
    try {
        // Verificar que los elementos de navegación existen
        const navButtons = document.querySelectorAll('.nav-btn');
        console.log('✅ Botones de navegación encontrados:', navButtons.length);
        
        return navButtons.length > 0;
    } catch (error) {
        console.error('❌ Error en prueba de navegación:', error);
        return false;
    }
}

// Función principal de pruebas
function runAllTests() {
    console.log('🚀 Ejecutando todas las pruebas...');
    
    const tests = [
        { name: 'Estado del Sistema', test: testSystemStatus },
        { name: 'Registro', test: testRegistration },
        { name: 'Búsqueda', test: testSearch },
        { name: 'Navegación', test: testNavigation }
    ];
    
    const results = tests.map(test => {
        const passed = test.test();
        console.log(`${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASÓ' : 'FALLÓ'}`);
        return { name: test.name, passed };
    });
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`📊 Resultados: ${passedTests}/${totalTests} pruebas pasaron`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ¡Todas las pruebas pasaron! El sistema está funcionando correctamente.');
        alert('✅ Sistema funcionando correctamente');
    } else {
        console.warn('⚠️ Algunas pruebas fallaron. Revisa los logs para más detalles.');
        alert('⚠️ Algunos problemas detectados. Revisa la consola (F12)');
    }
    
    return results;
}

// Ejecutar pruebas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, ejecutando pruebas...');
    
    // Esperar un poco para que el sistema se inicialice
    setTimeout(() => {
        runAllTests();
    }, 2000);
});

// Función global para ejecutar pruebas manualmente
window.testSystem = runAllTests;

console.log('🧪 Script de pruebas cargado'); 