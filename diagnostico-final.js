// diagnostico-final.js
// Diagnóstico final del sistema de votos

console.log('🔍 Iniciando diagnóstico final del sistema...');

// Función para diagnosticar el estado del sistema
function diagnosticarSistema() {
    console.log('📊 === DIAGNÓSTICO FINAL DEL SISTEMA ===');
    
    const diagnostico = {
        // Verificaciones básicas
        domReady: document.readyState === 'complete',
        votingSystemExists: !!window.votingSystem,
        votingSystemInitialized: !!window.votingSystemInitialized,
        firebaseAvailable: !!window.firebaseDB,
        
        // Verificaciones de clases
        votingSystemClassExists: typeof VotingSystem !== 'undefined',
        votingSystemFirebaseClassExists: typeof VotingSystemFirebase !== 'undefined',
        
        // Verificaciones de datos
        votesCount: window.votingSystem ? window.votingSystem.votes.length : 0,
        ubchConfigLoaded: window.votingSystem ? !!window.votingSystem.ubchToCommunityMap : false,
        currentUser: window.votingSystem && window.votingSystem.getCurrentUser ? window.votingSystem.getCurrentUser() : null,
        
        // Verificaciones de elementos DOM
        registrationForm: !!document.getElementById('registration-form'),
        checkInForm: !!document.getElementById('check-in-form'),
        votesTable: !!document.querySelector('#registros-table'),
        navigationButtons: document.querySelectorAll('.nav-btn').length,
        
        // Verificaciones de scripts
        scriptsLoaded: {
            votingSystemUnified: typeof VotingSystem !== 'undefined',
            simpleInit: typeof initializeSystemSafely !== 'undefined',
            testSystem: typeof testSystemStatus !== 'undefined'
        }
    };
    
    console.log('📋 Resultados del diagnóstico:', diagnostico);
    
    // Evaluar estado general
    const errores = [];
    const advertencias = [];
    const exitos = [];
    
    if (!diagnostico.votingSystemExists) {
        errores.push('❌ Sistema de votos no creado');
    } else {
        exitos.push('✅ Sistema de votos creado correctamente');
    }
    
    if (!diagnostico.votingSystemInitialized) {
        errores.push('❌ Sistema no inicializado');
    } else {
        exitos.push('✅ Sistema inicializado correctamente');
    }
    
    if (!diagnostico.firebaseAvailable) {
        advertencias.push('⚠️ Firebase no disponible (modo offline)');
    } else {
        exitos.push('✅ Firebase disponible');
    }
    
    if (!diagnostico.registrationForm) {
        errores.push('❌ Formulario de registro no encontrado');
    } else {
        exitos.push('✅ Formulario de registro encontrado');
    }
    
    if (!diagnostico.checkInForm) {
        errores.push('❌ Formulario de confirmación no encontrado');
    } else {
        exitos.push('✅ Formulario de confirmación encontrado');
    }
    
    if (diagnostico.navigationButtons === 0) {
        errores.push('❌ Botones de navegación no encontrados');
    } else {
        exitos.push(`✅ ${diagnostico.navigationButtons} botones de navegación encontrados`);
    }
    
    // Mostrar resultados
    console.log('\n📊 === RESUMEN DEL DIAGNÓSTICO ===');
    console.log('✅ ÉXITOS:');
    exitos.forEach(exito => console.log(exito));
    
    if (advertencias.length > 0) {
        console.log('\n⚠️ ADVERTENCIAS:');
        advertencias.forEach(advertencia => console.log(advertencia));
    }
    
    if (errores.length > 0) {
        console.log('\n❌ ERRORES:');
        errores.forEach(error => console.log(error));
    }
    
    // Estado general
    if (errores.length === 0) {
        console.log('\n🎉 SISTEMA FUNCIONANDO CORRECTAMENTE');
        return true;
    } else {
        console.log('\n⚠️ SISTEMA CON PROBLEMAS - Revisar errores arriba');
        return false;
    }
}

// Función para probar funcionalidades básicas
function probarFuncionalidades() {
    console.log('\n🧪 === PRUEBAS DE FUNCIONALIDAD ===');
    
    const pruebas = [];
    
    // Probar navegación
    try {
        const navButtons = document.querySelectorAll('.nav-btn');
        if (navButtons.length > 0) {
            pruebas.push('✅ Navegación disponible');
        } else {
            pruebas.push('❌ Navegación no disponible');
        }
    } catch (error) {
        pruebas.push('❌ Error en navegación: ' + error.message);
    }
    
    // Probar formulario de registro
    try {
        const form = document.getElementById('registration-form');
        if (form) {
            pruebas.push('✅ Formulario de registro disponible');
        } else {
            pruebas.push('❌ Formulario de registro no disponible');
        }
    } catch (error) {
        pruebas.push('❌ Error en formulario: ' + error.message);
    }
    
    // Probar sistema de votos
    try {
        if (window.votingSystem) {
            pruebas.push('✅ Sistema de votos disponible');
            if (window.votingSystem.votes) {
                pruebas.push(`✅ ${window.votingSystem.votes.length} votos cargados`);
            }
        } else {
            pruebas.push('❌ Sistema de votos no disponible');
        }
    } catch (error) {
        pruebas.push('❌ Error en sistema de votos: ' + error.message);
    }
    
    console.log('📋 Resultados de pruebas:');
    pruebas.forEach(prueba => console.log(prueba));
}

// Ejecutar diagnóstico después de un delay
setTimeout(() => {
    const sistemaOK = diagnosticarSistema();
    if (sistemaOK) {
        probarFuncionalidades();
    }
}, 2000);

console.log('📋 Script de diagnóstico final cargado'); 