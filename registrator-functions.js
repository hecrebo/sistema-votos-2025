// === FUNCIONES GLOBALES PARA REGISTRADOR ===

// Función para filtrar historial del registrador
window.registratorFilterHistory = function() {
    if (votingSystem) {
        const currentUser = votingSystem.getCurrentUser();
        if (currentUser && currentUser.rol === 'registrador') {
            const registrations = votingSystem.getRegistratorRegistrations(currentUser.username);
            const filteredRegistrations = votingSystem.applyRegistratorFilters(registrations);
            votingSystem.renderRegistratorHistoryTable(filteredRegistrations);
        }
    }
};

// Función para exportar historial del registrador
window.registratorExportHistory = function() {
    if (votingSystem) {
        votingSystem.exportRegistratorHistory();
    }
};

// Configurar event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para filtros del registrador
    const dateFilter = document.getElementById('registrator-date-filter');
    const cvFilter = document.getElementById('registrator-cv-filter');
    const searchFilter = document.getElementById('registrator-search');

    if (dateFilter) {
        dateFilter.addEventListener('change', window.registratorFilterHistory);
    }

    if (cvFilter) {
        cvFilter.addEventListener('change', window.registratorFilterHistory);
    }

    if (searchFilter) {
        searchFilter.addEventListener('input', window.registratorFilterHistory);
    }
}); 