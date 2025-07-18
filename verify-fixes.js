// verify-fixes.js
// Script para verificar que los fixes aplicados funcionan correctamente

console.log('🔍 Iniciando verificación de fixes...');

// Verificar que los métodos faltantes existen
function verifyMissingMethods() {
    console.log('📋 Verificando métodos faltantes...');
    
    const requiredMethods = [
        'updateAllCounters',
        'renderVotesTable', 
        'renderDashboardPage',
        'renderStatisticsPage'
    ];
    
    const missingMethods = [];
    
    if (window.votingSystem) {
        requiredMethods.forEach(methodName => {
            if (typeof window.votingSystem[methodName] !== 'function') {
                missingMethods.push(methodName);
            }
        });
        
        if (missingMethods.length === 0) {
            console.log('✅ Todos los métodos requeridos están disponibles');
            return true;
        } else {
            console.error('❌ Métodos faltantes:', missingMethods);
            return false;
        }
    } else {
        console.error('❌ VotingSystem no está disponible');
        return false;
    }
}

// Verificar que los contadores se pueden actualizar
function verifyCounters() {
    console.log('📊 Verificando contadores...');
    
    const counterElements = [
        'total-counter',
        'voted-counter', 
        'not-voted-counter'
    ];
    
    const missingElements = [];
    
    counterElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            missingElements.push(id);
        }
    });
    
    if (missingElements.length === 0) {
        console.log('✅ Todos los elementos de contadores están presentes');
        
        // Probar actualización de contadores
        if (window.votingSystem && typeof window.votingSystem.updateAllCounters === 'function') {
            try {
                window.votingSystem.updateAllCounters();
                console.log('✅ Actualización de contadores funcionando');
                return true;
            } catch (error) {
                console.error('❌ Error actualizando contadores:', error);
                return false;
            }
        } else {
            console.error('❌ Método updateAllCounters no disponible');
            return false;
        }
    } else {
        console.warn('⚠️ Elementos de contadores faltantes:', missingElements);
        return false;
    }
}

// Verificar inicialización del sistema
function verifySystemInitialization() {
    console.log('🚀 Verificando inicialización del sistema...');
    
    const checks = {
        votingSystemExists: !!window.votingSystem,
        votingSystemInitialized: !!window.votingSystemInitialized,
        firebaseAvailable: !!window.firebaseAvailable,
        firebaseDBExists: !!window.firebaseDB
    };
    
    const allChecksPassed = Object.values(checks).every(check => check);
    
    console.log('📋 Estado del sistema:', checks);
    
    if (allChecksPassed) {
        console.log('✅ Sistema inicializado correctamente');
        return true;
    } else {
        console.warn('⚠️ Algunos componentes del sistema no están disponibles');
        return false;
    }
}

// Ejecutar todas las verificaciones
function runAllVerifications() {
    console.log('\n🔍 INICIANDO VERIFICACIÓN COMPLETA DE FIXES');
    console.log('=' .repeat(50));
    
    const results = {
        methods: verifyMissingMethods(),
        counters: verifyCounters(),
        system: verifySystemInitialization()
    };
    
    const allPassed = Object.values(results).every(result => result);
    
    console.log('\n📊 RESULTADOS DE VERIFICACIÓN:');
    console.log('=' .repeat(50));
    console.log(`✅ Métodos: ${results.methods ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Contadores: ${results.counters ? 'PASÓ' : 'FALLÓ'}`);
    console.log(`✅ Sistema: ${results.system ? 'PASÓ' : 'FALLÓ'}`);
    
    if (allPassed) {
        console.log('\n🎉 ¡TODAS LAS VERIFICACIONES PASARON!');
        console.log('✅ El sistema debería funcionar correctamente ahora');
    } else {
        console.log('\n⚠️ Algunas verificaciones fallaron');
        console.log('🔧 Revisar los errores anteriores');
    }
    
    return allPassed;
}

// Ejecutar verificación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllVerifications);
} else {
    // DOM ya está listo
    setTimeout(runAllVerifications, 1000);
}

// Exportar para uso manual
window.verifyFixes = runAllVerifications;

console.log('✅ Script de verificación cargado'); 