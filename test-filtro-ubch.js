// Script de prueba para el filtro por UBCH
console.log('🧪 INICIANDO PRUEBA DEL FILTRO UBCH');

// Función para probar el filtro UBCH
function testUBCHFilter() {
    console.log('=== PRUEBA DEL FILTRO UBCH ===');
    
    // 1. Verificar que el sistema esté disponible
    if (!window.votingSystem) {
        console.error('❌ Sistema de votación no disponible');
        return false;
    }
    
    console.log('✅ Sistema de votación disponible');
    
    // 2. Verificar que hay datos
    if (!window.votingSystem.votes || window.votingSystem.votes.length === 0) {
        console.warn('⚠️ No hay datos de votos para probar');
        return false;
    }
    
    console.log(`✅ Datos disponibles: ${window.votingSystem.votes.length} votos`);
    
    // 3. Verificar el selector de filtro
    const ubchFilterSelect = document.getElementById('ubch-filter-select');
    if (!ubchFilterSelect) {
        console.error('❌ Selector de filtro UBCH no encontrado');
        return false;
    }
    
    console.log('✅ Selector de filtro UBCH encontrado');
    
    // 4. Verificar que hay opciones en el selector
    if (ubchFilterSelect.options.length <= 1) {
        console.warn('⚠️ No hay opciones de UBCH en el selector');
        return false;
    }
    
    console.log(`✅ Opciones disponibles: ${ubchFilterSelect.options.length}`);
    
    // 5. Probar el filtro
    const testUBCH = ubchFilterSelect.options[1].value; // Primera UBCH disponible
    console.log(`🔄 Probando filtro con UBCH: "${testUBCH}"`);
    
    // Contar votos antes del filtro
    const totalVotes = window.votingSystem.votes.length;
    const expectedFilteredVotes = window.votingSystem.votes.filter(v => v.ubch === testUBCH).length;
    
    console.log(`   - Total de votos: ${totalVotes}`);
    console.log(`   - Votos esperados para "${testUBCH}": ${expectedFilteredVotes}`);
    
    // Aplicar filtro
    ubchFilterSelect.value = testUBCH;
    const changeEvent = new Event('change', { bubbles: true });
    ubchFilterSelect.dispatchEvent(changeEvent);
    
    // Esperar un momento para que se procese
    setTimeout(() => {
        // Verificar resultados
        const tbody = document.querySelector('#registros-table tbody');
        const actualFilteredVotes = tbody.children.length;
        
        console.log(`   - Votos mostrados en tabla: ${actualFilteredVotes}`);
        
        if (expectedFilteredVotes === actualFilteredVotes) {
            console.log('✅ Filtro UBCH funciona correctamente');
            return true;
        } else {
            console.error(`❌ Error en filtro UBCH: esperado ${expectedFilteredVotes}, mostrado ${actualFilteredVotes}`);
            return false;
        }
    }, 500);
}

// Función para probar múltiples UBCH
function testMultipleUBCHs() {
    console.log('=== PRUEBA MÚLTIPLE DE UBCH ===');
    
    const ubchFilterSelect = document.getElementById('ubch-filter-select');
    if (!ubchFilterSelect || ubchFilterSelect.options.length <= 1) {
        console.error('❌ No hay suficientes opciones de UBCH para probar');
        return;
    }
    
    let successCount = 0;
    let totalTests = 0;
    
    // Probar cada UBCH
    for (let i = 1; i < ubchFilterSelect.options.length; i++) {
        const ubch = ubchFilterSelect.options[i].value;
        console.log(`\n🔄 Probando UBCH ${i}: "${ubch}"`);
        
        const expectedCount = window.votingSystem.votes.filter(v => v.ubch === ubch).length;
        
        // Aplicar filtro
        ubchFilterSelect.value = ubch;
        const changeEvent = new Event('change', { bubbles: true });
        ubchFilterSelect.dispatchEvent(changeEvent);
        
        // Verificar después de un delay
        setTimeout(() => {
            const tbody = document.querySelector('#registros-table tbody');
            const actualCount = tbody.children.length;
            
            totalTests++;
            if (expectedCount === actualCount) {
                console.log(`✅ UBCH "${ubch}": ${actualCount} votos (correcto)`);
                successCount++;
            } else {
                console.error(`❌ UBCH "${ubch}": esperado ${expectedCount}, mostrado ${actualCount}`);
            }
            
            // Mostrar resumen final
            if (totalTests === ubchFilterSelect.options.length - 1) {
                console.log(`\n📊 RESUMEN: ${successCount}/${totalTests} pruebas exitosas`);
            }
        }, 500 * i);
    }
}

// Función para verificar el estado actual
function checkCurrentState() {
    console.log('=== ESTADO ACTUAL ===');
    
    const ubchFilterSelect = document.getElementById('ubch-filter-select');
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const tbody = document.querySelector('#registros-table tbody');
    
    console.log('Filtro UBCH seleccionado:', ubchFilterSelect?.value || 'ninguno');
    console.log('Filtro de estado:', activeFilterBtn?.dataset.filter || 'ninguno');
    console.log('Filas en tabla:', tbody?.children.length || 0);
    console.log('Total de votos en sistema:', window.votingSystem?.votes?.length || 0);
}

// Función para resetear filtros
function resetFilters() {
    console.log('🔄 Reseteando filtros...');
    
    // Resetear filtro de estado
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    
    // Resetear filtro UBCH
    const ubchFilterSelect = document.getElementById('ubch-filter-select');
    if (ubchFilterSelect) {
        ubchFilterSelect.value = '';
        const changeEvent = new Event('change', { bubbles: true });
        ubchFilterSelect.dispatchEvent(changeEvent);
    }
    
    console.log('✅ Filtros reseteados');
}

// Exponer funciones globalmente
window.testUBCHFilter = testUBCHFilter;
window.testMultipleUBCHs = testMultipleUBCHs;
window.checkCurrentState = checkCurrentState;
window.resetFilters = resetFilters;

console.log('🔧 Funciones de prueba disponibles:');
console.log('  - testUBCHFilter() - Probar filtro UBCH básico');
console.log('  - testMultipleUBCHs() - Probar todas las UBCH');
console.log('  - checkCurrentState() - Verificar estado actual');
console.log('  - resetFilters() - Resetear todos los filtros');

// Ejecutar verificación inicial
setTimeout(checkCurrentState, 1000); 