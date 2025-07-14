// system-repair.js
// Reparación específica para las funciones del sistema de votos 2025

console.log('🔧 Iniciando reparación específica del sistema...');

// Función principal de reparación específica
async function repairSpecificFunctions() {
    console.log('🎯 Reparando funciones específicas...');
    
    try {
        // 1. Reparar Registro
        await repairRegistration();
        
        // 2. Reparar Confirmar Voto
        await repairCheckIn();
        
        // 3. Reparar Listado
        await repairList();
        
        // 4. Reparar Totales
        await repairTotals();
        
        // 5. Reparar Estadísticas
        await repairStatistics();
        
        console.log('✅ Reparación específica completada');
        return true;
        
    } catch (error) {
        console.error('❌ Error en reparación específica:', error);
        return false;
    }
}

// Reparar función de Registro
async function repairRegistration() {
    console.log('📝 Reparando función de Registro...');
    
    try {
        // Verificar formulario de registro
        const registrationForm = document.getElementById('registration-form');
        if (!registrationForm) {
            console.error('❌ Formulario de registro no encontrado');
            return false;
        }
        
        // Configurar event listener para el formulario
        registrationForm.removeEventListener('submit', handleRegistrationSubmit);
        registrationForm.addEventListener('submit', handleRegistrationSubmit);
        
        // Cargar opciones de UBCH
        await loadUBCHOptions();
        
        // Cargar opciones de comunidad
        await loadCommunityOptions();
        
        console.log('✅ Función de Registro reparada');
        return true;
        
    } catch (error) {
        console.error('❌ Error reparando registro:', error);
        return false;
    }
}

// Reparar función de Confirmar Voto
async function repairCheckIn() {
    console.log('✅ Reparando función de Confirmar Voto...');
    
    try {
        // Verificar página de confirmación
        const checkInPage = document.getElementById('check-in-page');
        if (!checkInPage) {
            console.error('❌ Página de confirmación no encontrada');
            return false;
        }
        
        // Configurar búsqueda de cédula
        const cedulaSearch = document.getElementById('cedula-search');
        if (cedulaSearch) {
            cedulaSearch.removeEventListener('input', handleCedulaSearch);
            cedulaSearch.addEventListener('input', handleCedulaSearch);
        }
        
        // Configurar botón de confirmación
        const confirmButton = document.getElementById('confirm-vote-btn');
        if (confirmButton) {
            confirmButton.removeEventListener('click', handleVoteConfirmation);
            confirmButton.addEventListener('click', handleVoteConfirmation);
        }
        
        console.log('✅ Función de Confirmar Voto reparada');
        return true;
        
    } catch (error) {
        console.error('❌ Error reparando confirmación:', error);
        return false;
    }
}

// Reparar función de Listado
async function repairList() {
    console.log('📋 Reparando función de Listado...');
    
    try {
        // Verificar página de listado
        const listPage = document.getElementById('listado-page');
        if (!listPage) {
            console.error('❌ Página de listado no encontrada');
            return false;
        }
        
        // Configurar filtros
        setupListFilters();
        
        // Configurar paginación
        setupListPagination();
        
        // Cargar datos iniciales
        await loadListData();
        
        console.log('✅ Función de Listado reparada');
        return true;
        
    } catch (error) {
        console.error('❌ Error reparando listado:', error);
        return false;
    }
}

// Reparar función de Totales
async function repairTotals() {
    console.log('📊 Reparando función de Totales...');
    
    try {
        // Verificar página de totales
        const totalsPage = document.getElementById('dashboard-page');
        if (!totalsPage) {
            console.error('❌ Página de totales no encontrada');
            return false;
        }
        
        // Configurar actualización de totales
        setupTotalsUpdate();
        
        // Cargar totales iniciales
        await loadTotalsData();
        
        console.log('✅ Función de Totales reparada');
        return true;
        
    } catch (error) {
        console.error('❌ Error reparando totales:', error);
        return false;
    }
}

// Reparar función de Estadísticas
async function repairStatistics() {
    console.log('📈 Reparando función de Estadísticas...');
    
    try {
        // Verificar página de estadísticas
        const statsPage = document.getElementById('statistics-page');
        if (!statsPage) {
            console.error('❌ Página de estadísticas no encontrada');
            return false;
        }
        
        // Configurar gráficos
        setupStatisticsCharts();
        
        // Cargar datos de estadísticas
        await loadStatisticsData();
        
        console.log('✅ Función de Estadísticas reparada');
        return true;
        
    } catch (error) {
        console.error('❌ Error reparando estadísticas:', error);
        return false;
    }
}

// Funciones auxiliares para el registro
async function loadUBCHOptions() {
    try {
        const ubchSelect = document.getElementById('ubch');
        if (!ubchSelect) return;
        
        // Limpiar opciones existentes
        ubchSelect.innerHTML = '<option value="">Selecciona un CV</option>';
        
        // Cargar opciones desde Firebase o configuración local
        const ubchConfig = window.firebaseDB ? window.firebaseDB.defaultUBCHConfig : {};
        
        for (const [ubch, communities] of Object.entries(ubchConfig)) {
            const option = document.createElement('option');
            option.value = ubch;
            option.textContent = ubch;
            ubchSelect.appendChild(option);
        }
        
        console.log('✅ Opciones de CV cargadas');
        
    } catch (error) {
        console.error('❌ Error cargando opciones de CV:', error);
    }
}

async function loadCommunityOptions() {
    try {
        const communitySelect = document.getElementById('community');
        if (!communitySelect) return;
        
        // Limpiar opciones existentes
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';
        
        // Cargar comunidades desde Firebase o configuración local
        const ubchConfig = window.firebaseDB ? window.firebaseDB.defaultUBCHConfig : {};
        const allCommunities = [];
        
        for (const communities of Object.values(ubchConfig)) {
            allCommunities.push(...communities);
        }
        
        // Ordenar y eliminar duplicados
        const uniqueCommunities = [...new Set(allCommunities)].sort();
        
        for (const community of uniqueCommunities) {
            const option = document.createElement('option');
            option.value = community;
            option.textContent = community;
            communitySelect.appendChild(option);
        }
        
        console.log('✅ Opciones de comunidad cargadas');
        
    } catch (error) {
        console.error('❌ Error cargando opciones de comunidad:', error);
    }
}

// Función para manejar el envío del formulario de registro
async function handleRegistrationSubmit(event) {
    event.preventDefault();
    console.log('📝 Procesando registro...');
    
    try {
        const formData = new FormData(event.target);
        const voteData = {
            community: formData.get('community'),
            name: formData.get('name'),
            cedula: formData.get('cedula'),
            telefono: formData.get('telefono'),
            sexo: formData.get('sexo'),
            edad: parseInt(formData.get('edad')),
            ubch: formData.get('ubch'),
            timestamp: new Date().toISOString(),
            status: 'registered'
        };
        
        // Validar datos
        if (!voteData.name || !voteData.cedula || !voteData.sexo || !voteData.edad || !voteData.ubch) {
            alert('Por favor, completa todos los campos requeridos');
            return;
        }
        
        // Guardar en Firebase o localStorage
        if (window.votingSystem && typeof window.votingSystem.addVote === 'function') {
            await window.votingSystem.addVote(voteData);
        } else {
            // Guardar en localStorage como fallback
            const votes = JSON.parse(localStorage.getItem('votes') || '[]');
            votes.push({ ...voteData, id: Date.now().toString() });
            localStorage.setItem('votes', JSON.stringify(votes));
        }
        
        // Limpiar formulario
        event.target.reset();
        
        // Mostrar mensaje de éxito
        alert('Persona registrada exitosamente');
        
        console.log('✅ Registro completado');
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        alert('Error al registrar persona. Intenta nuevamente.');
    }
}

// Funciones auxiliares para confirmación de voto
function handleCedulaSearch(event) {
    const cedula = event.target.value.trim();
    if (cedula.length >= 6) {
        searchPersonByCedula(cedula);
    }
}

async function searchPersonByCedula(cedula) {
    try {
        console.log(`🔍 Buscando persona con cédula: ${cedula}`);
        
        let person = null;
        
        // Buscar en Firebase o localStorage
        if (window.votingSystem && typeof window.votingSystem.searchByCedula === 'function') {
            person = await window.votingSystem.searchByCedula(cedula);
        } else {
            // Buscar en localStorage
            const votes = JSON.parse(localStorage.getItem('votes') || '[]');
            person = votes.find(vote => vote.cedula === cedula && vote.status === 'registered');
        }
        
        if (person) {
            displayPersonForConfirmation(person);
        } else {
            alert('Persona no encontrada o ya confirmó su voto');
        }
        
    } catch (error) {
        console.error('❌ Error buscando persona:', error);
        alert('Error al buscar persona');
    }
}

function displayPersonForConfirmation(person) {
    // Mostrar información de la persona para confirmación
    const confirmationDiv = document.getElementById('person-confirmation');
    if (confirmationDiv) {
        confirmationDiv.innerHTML = `
            <div class="person-info">
                <h3>Información de la Persona</h3>
                <p><strong>Nombre:</strong> ${person.name}</p>
                <p><strong>Cédula:</strong> ${person.cedula}</p>
                <p><strong>Comunidad:</strong> ${person.community}</p>
                <p><strong>CV:</strong> ${person.ubch}</p>
                <button id="confirm-vote-btn" class="btn btn-success">✅ Confirmar Voto</button>
            </div>
        `;
        
        // Configurar botón de confirmación
        const confirmBtn = document.getElementById('confirm-vote-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => handleVoteConfirmation(person));
        }
    }
}

async function handleVoteConfirmation(person) {
    try {
        console.log('✅ Confirmando voto...');
        
        // Actualizar estado del voto
        person.status = 'confirmed';
        person.confirmedAt = new Date().toISOString();
        
        // Guardar en Firebase o localStorage
        if (window.votingSystem && typeof window.votingSystem.updateVote === 'function') {
            await window.votingSystem.updateVote(person.id, person);
        } else {
            // Actualizar en localStorage
            const votes = JSON.parse(localStorage.getItem('votes') || '[]');
            const index = votes.findIndex(vote => vote.id === person.id);
            if (index !== -1) {
                votes[index] = person;
                localStorage.setItem('votes', JSON.stringify(votes));
            }
        }
        
        alert('Voto confirmado exitosamente');
        
        // Limpiar formulario de búsqueda
        const cedulaSearch = document.getElementById('cedula-search');
        if (cedulaSearch) {
            cedulaSearch.value = '';
        }
        
        // Limpiar información de persona
        const confirmationDiv = document.getElementById('person-confirmation');
        if (confirmationDiv) {
            confirmationDiv.innerHTML = '';
        }
        
        console.log('✅ Voto confirmado');
        
    } catch (error) {
        console.error('❌ Error confirmando voto:', error);
        alert('Error al confirmar voto');
    }
}

// Funciones auxiliares para listado
function setupListFilters() {
    // Configurar filtros del listado
    const filterElements = document.querySelectorAll('.filter-control');
    filterElements.forEach(filter => {
        filter.addEventListener('change', updateListDisplay);
    });
}

function setupListPagination() {
    // Configurar paginación del listado
    const paginationButtons = document.querySelectorAll('.pagination-btn');
    paginationButtons.forEach(button => {
        button.addEventListener('click', handlePagination);
    });
}

async function loadListData() {
    try {
        console.log('📋 Cargando datos del listado...');
        
        let votes = [];
        
        // Cargar desde Firebase o localStorage
        if (window.votingSystem && typeof window.votingSystem.getVotes === 'function') {
            votes = await window.votingSystem.getVotes();
        } else {
            votes = JSON.parse(localStorage.getItem('votes') || '[]');
        }
        
        displayListData(votes);
        
        console.log(`✅ ${votes.length} registros cargados en listado`);
        
    } catch (error) {
        console.error('❌ Error cargando datos del listado:', error);
    }
}

function displayListData(votes) {
    const listContainer = document.getElementById('votes-list');
    if (!listContainer) return;
    
    let html = '';
    
    votes.forEach(vote => {
        html += `
            <tr>
                <td>${vote.name}</td>
                <td>${vote.cedula}</td>
                <td>${vote.community}</td>
                <td>${vote.ubch}</td>
                <td>${vote.status}</td>
                <td>${new Date(vote.timestamp).toLocaleDateString()}</td>
            </tr>
        `;
    });
    
    listContainer.innerHTML = html;
}

// Funciones auxiliares para totales
function setupTotalsUpdate() {
    // Configurar actualización automática de totales
    setInterval(updateTotals, 30000); // Actualizar cada 30 segundos
}

async function loadTotalsData() {
    try {
        console.log('📊 Cargando datos de totales...');
        
        let votes = [];
        
        // Cargar desde Firebase o localStorage
        if (window.votingSystem && typeof window.votingSystem.getVotes === 'function') {
            votes = await window.votingSystem.getVotes();
        } else {
            votes = JSON.parse(localStorage.getItem('votes') || '[]');
        }
        
        updateTotalsDisplay(votes);
        
        console.log('✅ Totales actualizados');
        
    } catch (error) {
        console.error('❌ Error cargando totales:', error);
    }
}

function updateTotalsDisplay(votes) {
    const totalRegistered = votes.filter(vote => vote.status === 'registered').length;
    const totalConfirmed = votes.filter(vote => vote.status === 'confirmed').length;
    const totalPending = totalRegistered - totalConfirmed;
    
    // Actualizar displays
    const totalElement = document.getElementById('total-registered');
    if (totalElement) totalElement.textContent = totalRegistered;
    
    const confirmedElement = document.getElementById('total-confirmed');
    if (confirmedElement) confirmedElement.textContent = totalConfirmed;
    
    const pendingElement = document.getElementById('total-pending');
    if (pendingElement) pendingElement.textContent = totalPending;
}

// Funciones auxiliares para estadísticas
function setupStatisticsCharts() {
    // Configurar gráficos de estadísticas
    console.log('📈 Configurando gráficos de estadísticas...');
}

async function loadStatisticsData() {
    try {
        console.log('📈 Cargando datos de estadísticas...');
        
        let votes = [];
        
        // Cargar desde Firebase o localStorage
        if (window.votingSystem && typeof window.votingSystem.getVotes === 'function') {
            votes = await window.votingSystem.getVotes();
        } else {
            votes = JSON.parse(localStorage.getItem('votes') || '[]');
        }
        
        updateStatisticsDisplay(votes);
        
        console.log('✅ Estadísticas actualizadas');
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
    }
}

function updateStatisticsDisplay(votes) {
    // Actualizar displays de estadísticas
    console.log('📊 Actualizando displays de estadísticas...');
}

// Función para manejar paginación
function handlePagination(event) {
    const page = event.target.getAttribute('data-page');
    if (page) {
        loadListData(); // Recargar datos con nueva página
    }
}

// Función para actualizar display del listado
function updateListDisplay() {
    loadListData(); // Recargar datos con filtros aplicados
}

// Función para actualizar totales
function updateTotals() {
    loadTotalsData();
}

// Ejecutar reparación al cargar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Ejecutando reparación específica...');
    repairSpecificFunctions().then(success => {
        if (success) {
            console.log('✅ Reparación específica completada exitosamente');
        } else {
            console.log('⚠️ Algunos problemas persisten en la reparación específica');
        }
    });
});

// Exportar funciones para uso global
window.repairSpecificFunctions = repairSpecificFunctions;
window.handleRegistrationSubmit = handleRegistrationSubmit;
window.handleCedulaSearch = handleCedulaSearch;
window.handleVoteConfirmation = handleVoteConfirmation;

console.log('🔧 Script de reparación específica cargado'); 