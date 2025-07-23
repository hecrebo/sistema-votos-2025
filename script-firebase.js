// Verificación global para evitar múltiples inicializaciones
if (window.votingSystemInitialized) {
    console.log('⚠️ Sistema ya inicializado, evitando duplicación');
} else {
    window.votingSystemInitialized = true;
    console.log('🚀 Inicializando sistema de votos Firebase...');
}

// Limpiar instancia anterior si existe
if (window.votingSystem) {
    console.log('🔄 Limpiando instancia anterior del sistema...');
    window.votingSystem = null;
}

// === FUNCIONES CRÍTICAS DEL REGISTRO MASIVO - DEFINIDAS INMEDIATAMENTE ===

// Función placeholder para procesarRegistrosMasivos (se reemplazará más adelante)
window.procesarRegistrosMasivos = function() {
    console.log('⚠️ procesarRegistrosMasivos llamada antes de estar completamente definida');
    alert('El sistema está inicializando. Por favor, espera unos segundos y vuelve a intentar.');
};

// Función placeholder para limpiarTablaMasiva (se reemplazará más adelante)
window.limpiarTablaMasiva = function() {
    console.log('⚠️ limpiarTablaMasiva llamada antes de estar completamente definida');
    alert('El sistema está inicializando. Por favor, espera unos segundos y vuelve a intentar.');
};

// Función placeholder para loadExcelFile (se reemplazará más adelante)
window.loadExcelFile = function() {
    console.log('⚠️ loadExcelFile llamada antes de estar completamente definida');
    alert('El sistema está inicializando. Por favor, espera unos segundos y vuelve a intentar.');
};

// Función placeholder para downloadTemplate (se reemplazará más adelante)
window.downloadTemplate = function() {
    console.log('⚠️ downloadTemplate llamada antes de estar completamente definida');
    alert('El sistema está inicializando. Por favor, espera unos segundos y vuelve a intentar.');
};

// Función placeholder para actualizarConfiguracionMasivo (se reemplazará más adelante)
window.actualizarConfiguracionMasivo = function() {
    console.log('⚠️ actualizarConfiguracionMasivo llamada antes de estar completamente definida');
    alert('El sistema está inicializando. Por favor, espera unos segundos y vuelve a intentar.');
};

// Función placeholder para forzarReinicializacionRegistroMasivo (se reemplazará más adelante)
window.forzarReinicializacionRegistroMasivo = function() {
    console.log('⚠️ forzarReinicializacionRegistroMasivo llamada antes de estar completamente definida');
    alert('El sistema está inicializando. Por favor, espera unos segundos y vuelve a intentar.');
};

console.log('✅ Funciones críticas del registro masivo definidas como placeholders');

// Función para reemplazar placeholders con funciones reales
window.reemplazarPlaceholders = function() {
    console.log('🔄 Reemplazando placeholders con funciones reales...');
    
    // Reemplazar procesarRegistrosMasivos
    if (typeof procesarRegistrosMasivos === 'function') {
        window.procesarRegistrosMasivos = procesarRegistrosMasivos;
        console.log('✅ procesarRegistrosMasivos reemplazado con función real');
    }
    
    // Reemplazar limpiarTablaMasiva
    if (typeof limpiarTablaMasiva === 'function') {
        window.limpiarTablaMasiva = limpiarTablaMasiva;
        console.log('✅ limpiarTablaMasiva reemplazado con función real');
    }
    
    // Reemplazar loadExcelFile
    if (typeof loadExcelFile === 'function') {
        window.loadExcelFile = loadExcelFile;
        console.log('✅ loadExcelFile reemplazado con función real');
    }
    
    // Reemplazar downloadTemplate
    if (typeof downloadTemplate === 'function') {
        window.downloadTemplate = downloadTemplate;
        console.log('✅ downloadTemplate reemplazado con función real');
    }
    
    // Reemplazar actualizarConfiguracionMasivo
    if (typeof actualizarConfiguracionMasivo === 'function') {
        window.actualizarConfiguracionMasivo = actualizarConfiguracionMasivo;
        console.log('✅ actualizarConfiguracionMasivo reemplazado con función real');
    }
    
    // Reemplazar forzarReinicializacionRegistroMasivo
    if (typeof forzarReinicializacionRegistroMasivo === 'function') {
        window.forzarReinicializacionRegistroMasivo = forzarReinicializacionRegistroMasivo;
        console.log('✅ forzarReinicializacionRegistroMasivo reemplazado con función real');
    }
    
    console.log('🎯 Placeholders reemplazados correctamente');
};

// Ejecutar reemplazo de placeholders después de un tiempo
setTimeout(() => {
    if (typeof window.reemplazarPlaceholders === 'function') {
        window.reemplazarPlaceholders();
    }
}, 1000);

