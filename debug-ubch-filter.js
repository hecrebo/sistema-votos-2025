// Script de depuración para el filtro por UBCH
console.log('🔍 DEPURACIÓN DEL FILTRO POR UBCH');

// Función para verificar el estado del filtro
function debugUBCHFilter() {
    console.log('=== VERIFICACIÓN DEL FILTRO UBCH ===');
    
    // 1. Verificar si el elemento existe
    const ubchFilterSelect = document.getElementById('ubch-filter-select');
    console.log('1. Elemento ubch-filter-select existe:', !!ubchFilterSelect);
    
    if (ubchFilterSelect) {
        console.log('   - ID:', ubchFilterSelect.id);
        console.log('   - Clases:', ubchFilterSelect.className);
        console.log('   - Valor actual:', ubchFilterSelect.value);
        console.log('   - Opciones disponibles:', ubchFilterSelect.options.length);
        
        // Mostrar todas las opciones
        for (let i = 0; i < ubchFilterSelect.options.length; i++) {
            console.log(`   - Opción ${i}: "${ubchFilterSelect.options[i].text}" (valor: "${ubchFilterSelect.options[i].value}")`);
        }
    }
    
    // 2. Verificar si el sistema de votación está disponible
    console.log('2. Sistema de votación disponible:', !!window.votingSystem);
    
    if (window.votingSystem) {
        console.log('   - Tipo de sistema:', window.votingSystem.constructor.name);
        console.log('   - Votos cargados:', window.votingSystem.votes?.length || 0);
        console.log('   - UBCH únicas disponibles:', [...new Set(window.votingSystem.votes?.map(v => v.ubch).filter(ubch => ubch) || [])]);
    }
    
    // 3. Verificar eventos
    if (ubchFilterSelect) {
        const events = getEventListeners(ubchFilterSelect);
        console.log('3. Eventos registrados en el selector:', events);
    }
    
    // 4. Verificar datos de votos
    if (window.votingSystem && window.votingSystem.votes) {
        console.log('4. Muestra de votos:');
        window.votingSystem.votes.slice(0, 5).forEach((vote, index) => {
            console.log(`   - Voto ${index + 1}: ${vote.name} - UBCH: "${vote.ubch}"`);
        });
    }
    
    console.log('=== FIN DE VERIFICACIÓN ===');
}

// Función para probar el filtro manualmente
function testUBCHFilter() {
    console.log('🧪 PRUEBA MANUAL DEL FILTRO UBCH');
    
    const ubchFilterSelect = document.getElementById('ubch-filter-select');
    if (!ubchFilterSelect) {
        console.error('❌ No se encontró el selector de filtro UBCH');
        return;
    }
    
    // Simular cambio de valor
    if (ubchFilterSelect.options.length > 1) {
        const testValue = ubchFilterSelect.options[1].value;
        console.log(`🔄 Probando con valor: "${testValue}"`);
        
        ubchFilterSelect.value = testValue;
        
        // Disparar evento change manualmente
        const event = new Event('change', { bubbles: true });
        ubchFilterSelect.dispatchEvent(event);
        
        console.log('✅ Evento change disparado');
    } else {
        console.log('⚠️ No hay opciones disponibles para probar');
    }
}

// Función para verificar el estado de la tabla
function checkTableState() {
    console.log('📊 VERIFICACIÓN DEL ESTADO DE LA TABLA');
    
    const tbody = document.querySelector('#registros-table tbody');
    if (tbody) {
        console.log('   - Filas en la tabla:', tbody.children.length);
        
        // Contar filas por UBCH
        const ubchCounts = {};
        Array.from(tbody.children).forEach(row => {
            const ubchCell = row.children[4]; // Columna UBCH
            if (ubchCell) {
                const ubch = ubchCell.textContent;
                ubchCounts[ubch] = (ubchCounts[ubch] || 0) + 1;
            }
        });
        
        console.log('   - Distribución por UBCH:', ubchCounts);
    }
}

// Función para obtener event listeners (aproximación)
function getEventListeners(element) {
    // Esta es una aproximación, no es 100% precisa
    const events = [];
    const originalAddEventListener = element.addEventListener;
    const originalRemoveEventListener = element.removeEventListener;
    
    element.addEventListener = function(type, listener, options) {
        events.push({ type, listener: listener.toString().substring(0, 50) + '...' });
        return originalAddEventListener.call(this, type, listener, options);
    };
    
    return events;
}

// Ejecutar depuración cuando se carga la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(debugUBCHFilter, 1000);
    });
} else {
    setTimeout(debugUBCHFilter, 1000);
}

// Exponer funciones para uso manual
window.debugUBCHFilter = debugUBCHFilter;
window.testUBCHFilter = testUBCHFilter;
window.checkTableState = checkTableState;

console.log('🔧 Script de depuración cargado. Usa:');
console.log('  - debugUBCHFilter() para verificar el estado');
console.log('  - testUBCHFilter() para probar el filtro');
console.log('  - checkTableState() para verificar la tabla'); 