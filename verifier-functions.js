// === FUNCIONES ESPECÍFICAS PARA VERIFICADORES ===

// Función global para filtrar historial del verificador
window.verifierFilterHistory = function() {
    if (window.votingSystem) {
        window.votingSystem.renderVerifierHistory();
    }
};

// Función global para exportar historial del verificador
window.verifierExportHistory = function() {
    if (window.votingSystem) {
        window.votingSystem.exportVerifierHistory();
    }
};

// Función para inicializar las páginas del verificador
window.initVerifierPages = function() {
    console.log('🔧 Inicializando páginas del verificador...');
    
    // Configurar event listeners para filtros
    const dateFilter = document.getElementById('verifier-date-filter');
    const cvFilter = document.getElementById('verifier-cv-filter');
    const searchFilter = document.getElementById('verifier-search');
    
    if (dateFilter) {
        dateFilter.addEventListener('change', window.verifierFilterHistory);
    }
    
    if (cvFilter) {
        cvFilter.addEventListener('change', window.verifierFilterHistory);
    }
    
    if (searchFilter) {
        searchFilter.addEventListener('input', window.verifierFilterHistory);
    }
    
    console.log('✅ Páginas del verificador inicializadas');
};

// Función para verificar si el usuario es verificador
window.isVerifier = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return currentUser.rol === 'verificador';
};

// Función para mostrar mensaje específico para verificadores
window.showVerifierMessage = function(message, type = 'info') {
    if (window.votingSystem) {
        window.votingSystem.showMessage(message, type, 'verifier-dashboard');
    }
}; 