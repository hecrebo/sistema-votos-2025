// Script de prueba para las mejoras de exportación PDF/CSV
console.log('🧪 INICIANDO PRUEBAS DE EXPORTACIÓN MEJORADA');

// Función para probar la integración de filtros en exportación
function testFilteredExport() {
    console.log('=== PRUEBA DE EXPORTACIÓN CON FILTROS ===');
    
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
    
    // 3. Verificar métodos de filtrado
    if (typeof window.votingSystem.getFilteredVotes !== 'function') {
        console.error('❌ Método getFilteredVotes no disponible');
        return false;
    }
    
    if (typeof window.votingSystem.getFilterInfo !== 'function') {
        console.error('❌ Método getFilterInfo no disponible');
        return false;
    }
    
    if (typeof window.votingSystem.generateFileName !== 'function') {
        console.error('❌ Método generateFileName no disponible');
        return false;
    }
    
    console.log('✅ Métodos de filtrado disponibles');
    
    // 4. Probar filtrado sin filtros
    const allVotes = window.votingSystem.getFilteredVotes();
    const filterInfo = window.votingSystem.getFilterInfo();
    
    console.log(`   - Votos sin filtros: ${allVotes.length}`);
    console.log(`   - Información de filtros:`, filterInfo);
    
    // 5. Probar generación de nombres de archivo
    const pdfFileName = window.votingSystem.generateFileName('pdf', filterInfo);
    const csvFileName = window.votingSystem.generateFileName('csv', filterInfo);
    
    console.log(`   - Nombre PDF: ${pdfFileName}`);
    console.log(`   - Nombre CSV: ${csvFileName}`);
    
    return true;
}

// Función para probar filtro por comunidad
function testCommunityFilter() {
    console.log('=== PRUEBA DEL FILTRO POR COMUNIDAD ===');
    
    const communityFilterSelect = document.getElementById('community-filter-select');
    if (!communityFilterSelect) {
        console.error('❌ Selector de filtro comunidad no encontrado');
        return false;
    }
    
    console.log('✅ Selector de filtro comunidad encontrado');
    
    // Verificar que hay opciones
    if (communityFilterSelect.options.length <= 1) {
        console.warn('⚠️ No hay opciones de comunidad en el selector');
        return false;
    }
    
    console.log(`✅ Opciones disponibles: ${communityFilterSelect.options.length}`);
    
    // Probar el filtro
    const testCommunity = communityFilterSelect.options[1].value;
    console.log(`🔄 Probando filtro con comunidad: "${testCommunity}"`);
    
    const expectedCount = window.votingSystem.votes.filter(v => v.community === testCommunity).length;
    
    // Aplicar filtro
    communityFilterSelect.value = testCommunity;
    const changeEvent = new Event('change', { bubbles: true });
    communityFilterSelect.dispatchEvent(changeEvent);
    
    // Verificar después de un delay
    setTimeout(() => {
        const tbody = document.querySelector('#registros-table tbody');
        const actualCount = tbody.children.length;
        
        if (expectedCount === actualCount) {
            console.log(`✅ Filtro comunidad funciona correctamente: ${actualCount} registros`);
            return true;
        } else {
            console.error(`❌ Error en filtro comunidad: esperado ${expectedCount}, mostrado ${actualCount}`);
            return false;
        }
    }, 500);
}

// Función para probar exportación con filtros aplicados
function testFilteredExport() {
    console.log('=== PRUEBA DE EXPORTACIÓN CON FILTROS APLICADOS ===');
    
    // Aplicar un filtro de ejemplo
    const ubchFilterSelect = document.getElementById('ubch-filter-select');
    if (ubchFilterSelect && ubchFilterSelect.options.length > 1) {
        const testUBCH = ubchFilterSelect.options[1].value;
        ubchFilterSelect.value = testUBCH;
        
        // Obtener votos filtrados
        const filteredVotes = window.votingSystem.getFilteredVotes();
        const filterInfo = window.votingSystem.getFilterInfo();
        
        console.log(`🔄 Filtro aplicado: UBCH "${testUBCH}"`);
        console.log(`   - Votos filtrados: ${filteredVotes.length}`);
        console.log(`   - Información de filtros:`, filterInfo);
        
        // Generar nombres de archivo
        const pdfFileName = window.votingSystem.generateFileName('pdf', filterInfo);
        const csvFileName = window.votingSystem.generateFileName('csv', filterInfo);
        
        console.log(`   - Nombre PDF con filtros: ${pdfFileName}`);
        console.log(`   - Nombre CSV con filtros: ${csvFileName}`);
        
        // Verificar que los nombres incluyen información de filtros
        if (pdfFileName.includes('filtrado') && csvFileName.includes('filtrado')) {
            console.log('✅ Nombres de archivo incluyen información de filtros');
            return true;
        } else {
            console.error('❌ Nombres de archivo no incluyen información de filtros');
            return false;
        }
    } else {
        console.warn('⚠️ No hay opciones de UBCH para probar');
        return false;
    }
}

// Función para verificar el estado actual de los filtros
function checkFilterState() {
    console.log('=== ESTADO ACTUAL DE FILTROS ===');
    
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const ubchFilterSelect = document.getElementById('ubch-filter-select');
    const communityFilterSelect = document.getElementById('community-filter-select');
    const tbody = document.querySelector('#registros-table tbody');
    
    console.log('Filtro de estado:', activeFilterBtn?.dataset.filter || 'ninguno');
    console.log('Filtro UBCH:', ubchFilterSelect?.value || 'ninguno');
    console.log('Filtro Comunidad:', communityFilterSelect?.value || 'ninguno');
    console.log('Filas en tabla:', tbody?.children.length || 0);
    console.log('Total de votos en sistema:', window.votingSystem?.votes?.length || 0);
    
    // Verificar métodos
    if (window.votingSystem) {
        const filteredVotes = window.votingSystem.getFilteredVotes();
        const filterInfo = window.votingSystem.getFilterInfo();
        
        console.log('Votos filtrados (método):', filteredVotes.length);
        console.log('Información de filtros:', filterInfo);
    }
}

// Función para resetear todos los filtros
function resetAllFilters() {
    console.log('🔄 Reseteando todos los filtros...');
    
    // Resetear filtro de estado
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    
    // Resetear filtro UBCH
    const ubchFilterSelect = document.getElementById('ubch-filter-select');
    if (ubchFilterSelect) {
        ubchFilterSelect.value = '';
        const ubchEvent = new Event('change', { bubbles: true });
        ubchFilterSelect.dispatchEvent(ubchEvent);
    }
    
    // Resetear filtro Comunidad
    const communityFilterSelect = document.getElementById('community-filter-select');
    if (communityFilterSelect) {
        communityFilterSelect.value = '';
        const communityEvent = new Event('change', { bubbles: true });
        communityFilterSelect.dispatchEvent(communityEvent);
    }
    
    console.log('✅ Todos los filtros reseteados');
}

// Función para ejecutar todas las pruebas
function runAllExportTests() {
    console.log('🚀 EJECUTANDO TODAS LAS PRUEBAS DE EXPORTACIÓN');
    
    let successCount = 0;
    let totalTests = 0;
    
    // Prueba 1: Verificación básica
    totalTests++;
    if (testFilteredExport()) successCount++;
    
    // Prueba 2: Filtro por comunidad
    setTimeout(() => {
        totalTests++;
        if (testCommunityFilter()) successCount++;
        
        // Prueba 3: Exportación con filtros
        setTimeout(() => {
            totalTests++;
            if (testFilteredExport()) successCount++;
            
            console.log(`\n📊 RESUMEN: ${successCount}/${totalTests} pruebas exitosas`);
        }, 500);
    }, 500);
}

// Exponer funciones globalmente
window.testFilteredExport = testFilteredExport;
window.testCommunityFilter = testCommunityFilter;
window.testFilteredExport = testFilteredExport;
window.checkFilterState = checkFilterState;
window.resetAllFilters = resetAllFilters;
window.runAllExportTests = runAllExportTests;

console.log('🔧 Funciones de prueba disponibles:');
console.log('  - testFilteredExport() - Probar exportación básica');
console.log('  - testCommunityFilter() - Probar filtro por comunidad');
console.log('  - testFilteredExport() - Probar exportación con filtros');
console.log('  - checkFilterState() - Verificar estado actual');
console.log('  - resetAllFilters() - Resetear todos los filtros');
console.log('  - runAllExportTests() - Ejecutar todas las pruebas');

// Ejecutar verificación inicial
setTimeout(checkFilterState, 1000); 