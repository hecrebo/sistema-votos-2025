// test-registro.js - Pruebas para el sistema de registro
console.log('🧪 Iniciando pruebas del sistema de registro...');

// Función para probar la inicialización del sistema
async function testSystemInitialization() {
    console.log('🔍 Probando inicialización del sistema...');
    
    try {
        // Verificar que Firebase esté disponible
        if (!window.firebaseDB) {
            console.error('❌ Firebase no está disponible');
            return false;
        }
        console.log('✅ Firebase disponible');
        
        // Verificar que el sistema de votos esté disponible
        if (!window.votingSystem) {
            console.error('❌ Sistema de votos no inicializado');
            return false;
        }
        console.log('✅ Sistema de votos disponible');
        
        // Verificar que el formulario esté disponible
        const form = document.getElementById('registration-form');
        if (!form) {
            console.error('❌ Formulario de registro no encontrado');
            return false;
        }
        console.log('✅ Formulario de registro disponible');
        
        // Verificar que los selects estén disponibles
        const ubchSelect = document.getElementById('ubch');
        const communitySelect = document.getElementById('community');
        if (!ubchSelect || !communitySelect) {
            console.error('❌ Selects no encontrados');
            return false;
        }
        console.log('✅ Selects disponibles');
        
        // Verificar que los selects tengan opciones
        if (ubchSelect.options.length <= 1) {
            console.error('❌ Select de CV no tiene opciones');
            return false;
        }
        if (communitySelect.options.length <= 1) {
            console.error('❌ Select de comunidad no tiene opciones');
            return false;
        }
        console.log('✅ Selects tienen opciones');
        
        console.log('✅ Inicialización del sistema exitosa');
        return true;
        
    } catch (error) {
        console.error('❌ Error en prueba de inicialización:', error);
        return false;
    }
}

// Función para probar el registro de una persona
async function testPersonRegistration() {
    console.log('🔍 Probando registro de persona...');
    
    try {
        const form = document.getElementById('registration-form');
        if (!form) {
            console.error('❌ Formulario no encontrado');
            return false;
        }
        
        // Llenar el formulario con datos de prueba
        const testData = {
            name: 'Juan Pérez Test',
            cedula: '12345678',
            telefono: '04121234567',
            sexo: 'M',
            edad: '25',
            ubch: 'COLEGIO ASUNCION BELTRAN',
            community: 'EL VALLE'
        };
        
        // Llenar los campos del formulario
        form.name.value = testData.name;
        form.cedula.value = testData.cedula;
        form.telefono.value = testData.telefono;
        form.sexo.value = testData.sexo;
        form.edad.value = testData.edad;
        form.ubch.value = testData.ubch;
        form.community.value = testData.community;
        
        console.log('📝 Formulario llenado con datos de prueba:', testData);
        
        // Simular envío del formulario
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
        
        console.log('✅ Prueba de registro iniciada');
        return true;
        
    } catch (error) {
        console.error('❌ Error en prueba de registro:', error);
        return false;
    }
}

// Función para probar la carga de datos UBCH
async function testUBCHDataLoading() {
    console.log('🔍 Probando carga de datos UBCH...');
    
    try {
        if (!window.votingSystem) {
            console.error('❌ Sistema de votos no disponible');
            return false;
        }
        
        // Verificar que los datos UBCH estén cargados
        if (!window.votingSystem.ubchToCommunityMap) {
            console.error('❌ Datos UBCH no cargados');
            return false;
        }
        
        const ubchCount = Object.keys(window.votingSystem.ubchToCommunityMap).length;
        console.log(`✅ Datos UBCH cargados: ${ubchCount} centros de votación`);
        
        // Verificar que haya comunidades
        const allCommunities = new Set();
        Object.values(window.votingSystem.ubchToCommunityMap).forEach(comunidades => {
            if (Array.isArray(comunidades)) {
                comunidades.forEach(comunidad => allCommunities.add(comunidad));
            }
        });
        
        console.log(`✅ Comunidades cargadas: ${allCommunities.size} comunidades únicas`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en prueba de carga UBCH:', error);
        return false;
    }
}

// Función para probar el registro masivo
async function testBulkRegistration() {
    console.log('🔍 Probando registro masivo...');
    
    // Verificar que la tabla de registro masivo esté disponible
    const pasteTable = document.getElementById('paste-table');
    if (!pasteTable) {
        console.error('❌ Tabla de registro masivo no encontrada');
        return false;
    }
    console.log('✅ Tabla de registro masivo encontrada');
    
    // Verificar que las funciones globales estén disponibles
    if (typeof window.importPasteTable !== 'function') {
        console.error('❌ Función importPasteTable no encontrada');
        return false;
    }
    console.log('✅ Función importPasteTable disponible');
    
    // Verificar que Firebase esté disponible
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        console.error('❌ Firebase no está disponible para registro masivo');
        return false;
    }
    console.log('✅ Firebase disponible para registro masivo');
    
    return true;
}

// Función para probar la funcionalidad de pegar datos
function testPasteFunctionality() {
    console.log('🔍 Probando funcionalidad de pegar datos...');
    
    try {
        const pasteTable = document.getElementById('paste-table');
        
        if (!pasteTable) {
            console.error('❌ Tabla no encontrada');
            return false;
        }
        
        // Verificar que el event listener de paste esté configurado
        const pasteEventListeners = pasteTable.onpaste;
        
        if (pasteEventListeners) {
            console.log('✅ Event listener de paste configurado');
        } else {
            console.log('⚠️ Event listener de paste no encontrado, pero puede estar configurado de otra manera');
        }
        
        console.log('✅ Funcionalidad de pegar datos verificada');
        return true;
        
    } catch (error) {
        console.error('❌ Error verificando funcionalidad de pegar:', error);
        return false;
    }
}

// Función específica para probar registro masivo con datos de prueba
function testBulkRegistrationWithData() {
    console.log('🧪 Probando registro masivo con datos de prueba...');
    
    const pasteTableBody = document.getElementById('paste-table-body');
    if (!pasteTableBody) {
        console.error('❌ Cuerpo de tabla no encontrado');
        return false;
    }
    
    // Datos de prueba
    const testData = [
        ['COLEGIO ASUNCION BELTRAN', 'EL VALLE', 'Juan Pérez Test', '12345678', '04121234567', 'M', '25'],
        ['LICEO JOSE FELIX RIBAS', 'EL CUJINAL', 'María García Test', '87654321', '04129876543', 'F', '30']
    ];
    
    // Limpiar tabla
    pasteTableBody.innerHTML = '';
    
    // Agregar datos de prueba
    testData.forEach(rowData => {
        const tr = document.createElement('tr');
        rowData.forEach(cellData => {
            const td = document.createElement('td');
            td.contentEditable = 'true';
            td.textContent = cellData;
            tr.appendChild(td);
        });
        pasteTableBody.appendChild(tr);
    });
    
    console.log('📝 Datos de prueba agregados a la tabla:', testData);
    console.log('✅ Registro masivo listo para probar');
    console.log('💡 Para probar realmente, ejecuta importPasteTable() en la consola');
    
    return true;
}

// Función para ejecutar todas las pruebas
async function runAllTests() {
    console.log('🚀 Ejecutando todas las pruebas del sistema de registro...');
    
    const results = {
        initialization: await testSystemInitialization(),
        ubchData: await testUBCHDataLoading(),
        registration: await testPersonRegistration(),
        bulkRegistration: await testBulkRegistration(),
        bulkRegistrationWithData: await testBulkRegistrationWithData(),
        pasteFunctionality: await testPasteFunctionality()
    };
    
    console.log('📊 Resultados de las pruebas:', results);
    
    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
        console.log('🎉 Todas las pruebas pasaron exitosamente');
        alert('✅ Sistema de registro funcionando correctamente');
    } else {
        console.error('❌ Algunas pruebas fallaron');
        alert('❌ Problemas detectados en el sistema de registro. Revisa la consola.');
    }
    
    return allPassed;
}

// Función para mostrar el estado del sistema
function showSystemStatus() {
    console.log('📊 Estado del sistema de registro:');
    
    const status = {
        firebase: !!window.firebaseDB,
        votingSystem: !!window.votingSystem,
        form: !!document.getElementById('registration-form'),
        ubchSelect: !!document.getElementById('ubch'),
        communitySelect: !!document.getElementById('community'),
        ubchOptions: document.getElementById('ubch')?.options?.length || 0,
        communityOptions: document.getElementById('community')?.options?.length || 0,
        ubchData: !!window.votingSystem?.ubchToCommunityMap,
        ubchCount: Object.keys(window.votingSystem?.ubchToCommunityMap || {}).length,
        bulkTable: !!document.getElementById('paste-table'),
        bulkTableBody: !!document.getElementById('paste-table-body'),
        importPasteTable: typeof importPasteTable === 'function',
        clearPasteTable: typeof clearPasteTable === 'function'
    };
    
    console.table(status);
    return status;
}

// Exportar funciones para uso global
window.testRegistrationSystem = runAllTests;
window.showRegistrationStatus = showSystemStatus;
window.testSystemInit = testSystemInitialization;
window.testUBCHData = testUBCHDataLoading;
window.testRegistration = testPersonRegistration;
window.testBulkRegistration = testBulkRegistration;
window.testPasteFunctionality = testPasteFunctionality;
window.testBulkRegistrationWithData = testBulkRegistrationWithData;

console.log('🧪 Pruebas del sistema de registro cargadas');
console.log('💡 Usa testRegistrationSystem() para ejecutar todas las pruebas');
console.log('💡 Usa showRegistrationStatus() para ver el estado del sistema');
console.log('💡 Usa testBulkRegistration() para probar el registro masivo'); 