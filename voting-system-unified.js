// voting-system-unified.js
// Sistema de Votos Unificado - Reemplaza todos los scripts conflictivos

console.log('🚀 Iniciando Sistema de Votos Unificado...');

// === CONFIGURACIÓN GLOBAL ===
window.systemConfig = {
    maxRetries: 5,
    retryDelay: 2000,
    debugMode: true
};

// === VERIFICACIÓN DE INICIALIZACIÓN ===
if (window.votingSystemInitialized) {
    console.log('⚠️ Sistema ya inicializado, evitando duplicación');
} else {
    window.votingSystemInitialized = true;
    console.log('✅ Bandera de inicialización establecida');
}

// === CONFIGURACIÓN DE FIREBASE FALLBACK ===
if (!window.firebaseDB) {
    console.log('⚠️ Firebase no disponible, configurando modo offline...');
    window.firebaseDB = {
        isAvailable: false,
        db: null,
        votesCollection: {
            get: async () => ({ docs: [] }),
            add: async (data) => ({ id: 'local_' + Date.now() }),
            doc: (id) => ({
                get: async () => ({ exists: false, data: () => null }),
                set: async (data) => ({ id }),
                update: async (data) => ({ id }),
                delete: async () => ({ id })
            }),
            limit: (num) => ({
                get: async () => ({ docs: [] })
            }),
            where: (field, operator, value) => ({
                get: async () => ({ docs: [], size: 0 })
            })
        },
        ubchCollection: {
            doc: (id) => ({
                get: async () => ({ exists: false, data: () => null }),
                set: async (data) => ({ id })
            })
        }
    };
}

// === CLASE BASE DEL SISTEMA ===
class VotingSystem {
    constructor() {
        this.currentPage = 'registration';
        this.votes = [];
        this.candidates = [];
        this.pdfLibrariesReady = false;
        this.projectionInterval = null;
        this.userId = null;
        this.registrationQueue = [];
        this.isProcessingQueue = false;
        this.concurrentRegistrations = 0;
        this.maxConcurrentRegistrations = 3;
        this.searchTimeout = null;
        this.cache = new Map();
        this.voteToDelete = null;
        this.voteToEdit = null;
        this.ubchToCommunityMap = {};
        this.currentPage = 'registration';
        this.pageSize = 20;
        this.filteredVotes = [];
        this.selectedVotes = [];
        this.currentSearchTerm = '';
        this.currentSortField = null;
        this.currentSortDirection = 'asc';
        this.currentDetailVote = null;
        
        console.log('✅ Instancia de VotingSystem creada correctamente');
    }

    async init() {
        console.log('🔍 Iniciando sistema de votos...');
        await this.loadDataLocally();
        this.setupEventListeners();
        this.renderCurrentPage();
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
    }

    renderCurrentPage() {
        console.log('📄 Renderizando página actual...');
    }

    showMessage(message, type, page) {
        console.log(`💬 [${type}] ${message}`);
        const messageDiv = document.getElementById(`${page}-message`);
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `message ${type}`;
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    setLoadingState(page, loading) {
        console.log(`⏳ [${page}] Loading: ${loading}`);
    }

    loadDataLocally() {
        try {
            console.log('📥 Cargando datos locales...');
            
            const localVotes = localStorage.getItem('localVotes');
            if (localVotes) {
                this.votes = JSON.parse(localVotes);
                console.log(`✅ ${this.votes.length} votos cargados desde localStorage`);
            } else {
                this.votes = [];
                console.log('✅ No hay votos locales, iniciando con lista vacía');
            }
            
            this.ubchToCommunityMap = {
                "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS", "VILLAS DEL CENTRO 1ERA ETAPA", "VILLAS DEL CENTRO 3ERA ETAPA B", "VILLAS DEL CENTRO 3ERA ETAPA C", "VILLAS DEL CENTRO IV ETAPA", "LA CAMACHERA", "COMUNIDAD NO DEFINIDA"],
                "LICEO JOSE FELIX RIBAS": ["EL CUJINAL", "LAS MORAS", "VILLA ESPERANZA 200", "VILLAS DEL CENTRO 3ERA ETAPA A", "LOS PALOMARES", "EL LAGO", "CARABALI I Y II", "EL BANCO", "CARIAPRIMA I Y II", "COMUNIDAD NO DEFINIDA"],
                "ESCUELA PRIMARIA BOLIVARIANA LA PRADERA": ["EL SAMAN", "GUAYABAL E", "PALOS GRANDES II", "PALOS GRANDES I", "TIERRAS DEL SOL", "LA CASTELLANA", "GARDENIAS I", "GARDENIAS II", "EL CERCADITO", "ALTAMIRA", "LA ENSENADA", "BUCARES", "GUAYABAL", "APAMATE", "EL REFUGIO", "LOS ROBLES", "ARAGUANEY", "COMUNIDAD NO DEFINIDA"],
                "CASA COMUNAL JOSE TOMAS GALLARDO": ["JOSE TOMAS GALLARDO A", "JOSE TOMAS GALLARDO B", "ALI PRIMERA", "COMUNIDAD NO DEFINIDA"],
                "ESCUELA 5 DE JULIO": ["10 DE AGOSTO", "CAMPO ALEGRE I", "CAMPO ALEGRE II", "5 DE JULIO", "COMUNIDAD NO DEFINIDA"],
                "ESCUELA CECILIO ACOSTA": ["VOLUNTAD DE DIOS", "LAS MALVINAS", "BRISAS DEL LAGO", "MAISANTA", "INDIANA SUR", "LOS CASTORES", "COMUNIDAD NO DEFINIDA"],
                "ESCUELA BASICA FE Y ALEGRIA": ["FE Y ALEGRIA", "BARRIO SOLIDARIO", "COMUNIDAD FUTURO", "COMUNIDAD NO DEFINIDA"],
                "ESCUELA GRADUADA ANTONIO JOSE DE SUCRE": ["PALO NEGRO OESTE", "JESUS DE NAZARETH", "SECTOR BOLIVAR", "PALO NEGRO ESTE", "COMUNIDAD NO DEFINIDA"],
                "CASA COMUNAL": ["LOS JABILLOS", "COMUNIDAD NO DEFINIDA"],
                "UNIDAD EDUCATIVA MONSEÑOR JACINTO SOTO LAYERA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II", "COMUNIDAD NO DEFINIDA"],
                "BASE DE MISIONES LUISA CACERES DE ARISMENDI": ["4 DE DICIEMBRE", "23 DE ENERO", "19 DE ABRIL", "EL EREIGÜE", "COMUNIDAD NO DEFINIDA"],
                "ESCUELA ESTADAL ALEJO ZULOAGA": ["MANUELITA SAENZ", "PANAMERICANO", "COMUNIDAD NO DEFINIDA"],
                "UNIDAD EDUCATIVA MONSEÑOR MONTES DE OCA": ["REMATE", "COMUNIDAD NO DEFINIDA"],
                "ESCUELA BASICA NACIONAL CONCENTRADA LA ESTACION": ["18 DE OCTUBRE", "COMUNIDAD NO DEFINIDA"],
                "ESCUELA RECEPTORIA": ["CARMEN CENTRO", "CENTRO CENTRO", "COMUNIDAD NO DEFINIDA"],
                "GRUPO ESCOLAR DR RAFAEL PEREZ": ["VIRGEN DEL CARMEN", "COMUNIDAD NO DEFINIDA"],
                "LICEO ALFREDO PIETRI": ["LOS OJITOS", "LOS VENCEDORES", "COMUNIDAD NO DEFINIDA"],
                "ESCUELA BOLIVARIANA ROMERO GARCIA": ["SAN BERNARDO", "LA CAPILLA", "LAS HACIENDAS", "COMUNIDAD NO DEFINIDA"],
                "ESCUELA GRADUADA PEDRO GUAL": ["BOQUITA CENTRO", "INDIANA NORTE", "COMUNIDAD NO DEFINIDA"]
            };
            
            console.log(`✅ Configuración UBCH cargada: ${Object.keys(this.ubchToCommunityMap).length} UBCH disponibles`);
            
        } catch (error) {
            console.error('❌ Error cargando datos locales:', error);
            this.votes = [];
            this.ubchToCommunityMap = {};
        }
    }

    getCurrentUser() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (!userData) return null;
            
            const user = JSON.parse(userData);
            const sessionTime = localStorage.getItem('sessionTime');
            
            if (sessionTime && (Date.now() - parseInt(sessionTime)) > 24 * 60 * 60 * 1000) {
                this.logout();
                return null;
            }
            
            return user;
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            return null;
        }
    }

    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionTime');
        if (window.location.pathname !== '/login.html') {
            window.location.href = 'login.html';
        }
    }

    validateRegistrationData(data) {
        if (!data.cedula || !/^\d{6,10}$/.test(data.cedula)) {
            return { isValid: false, message: 'Cédula inválida. Debe tener entre 6 y 10 dígitos' };
        }
        if (!data.name || data.name.trim().length < 3) {
            return { isValid: false, message: 'Nombre inválido. Debe tener al menos 3 caracteres' };
        }
        if (!data.telefono || !/^04\d{9}$/.test(data.telefono)) {
            return { isValid: false, message: 'Teléfono inválido. Debe tener formato: 04xxxxxxxxx' };
        }
        if (!data.sexo || !['M', 'F'].includes(data.sexo)) {
            return { isValid: false, message: 'Debe seleccionar el sexo' };
        }
        if (!data.edad || isNaN(data.edad) || data.edad < 16 || data.edad > 120) {
            return { isValid: false, message: 'Edad inválida. Debe estar entre 16 y 120 años' };
        }
        if (!data.ubch || !data.community) {
            return { isValid: false, message: 'Debe seleccionar UBCH y comunidad' };
        }
        return { isValid: true, message: 'Datos válidos' };
    }

    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navigateToPage(e.target.dataset.page);
            });
        });

        // Formulario de registro
        const registrationForm = document.getElementById('registration-form');
        if (registrationForm) {
            registrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }

        // Formulario de confirmación de voto
        const checkInForm = document.getElementById('check-in-form');
        if (checkInForm) {
            checkInForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCheckIn();
            });
        }

        console.log('✅ Event listeners configurados');
    }

    navigateToPage(page) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            console.log('Usuario no autenticado');
            return;
        }

        if (currentUser.rol === 'verificador' && page !== 'check-in') {
            this.showMessage('No tienes permisos para acceder a esta página.', 'error', 'check-in');
            return;
        } else if (currentUser.rol === 'registrador' && page !== 'registration') {
            this.showMessage('No tienes permisos para acceder a esta página.', 'error', 'registration');
            return;
        }

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const navBtn = document.querySelector(`[data-page="${page}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
        }
        this.currentPage = page;
        this.renderCurrentPage();
    }

    renderCurrentPage() {
        console.log('🔍 DEBUG: renderCurrentPage llamado con currentPage:', this.currentPage);
        switch (this.currentPage) {
            case 'registration':
                this.renderRegistrationPage();
                break;
            case 'check-in':
                this.renderCheckInPage();
                break;
            case 'listado':
                this.renderListPage();
                break;
            case 'dashboard':
                this.renderDashboardPage();
                break;
            case 'statistics':
                this.renderStatisticsPage();
                break;
            default:
                console.log('🔍 DEBUG: Página no reconocida:', this.currentPage);
        }
    }

    renderRegistrationPage() {
        console.log('🔍 DEBUG: Iniciando renderRegistrationPage...');
        
        const ubchSelect = document.getElementById('ubch');
        const communitySelect = document.getElementById('community');
        const form = document.getElementById('registration-form');

        if (!ubchSelect || !communitySelect || !form) {
            console.error('❌ Elementos del formulario no encontrados');
            return;
        }

        // Limpiar opciones
        ubchSelect.innerHTML = '<option value="">Selecciona un Centro de Votación (CV)</option>';
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';

        if (!this.ubchToCommunityMap || Object.keys(this.ubchToCommunityMap).length === 0) {
            console.log('⚠️ No hay datos disponibles');
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
            this.showMessage('Cargando datos...', 'info', 'registration');
            return;
        }

        // Habilitar formulario
        form.querySelectorAll('input, select, button').forEach(el => el.disabled = false);

        // Cargar todas las comunidades disponibles
        const todasLasComunidades = new Set();
        Object.values(this.ubchToCommunityMap).forEach(comunidades => {
            comunidades.forEach(comunidad => todasLasComunidades.add(comunidad));
        });

        // Llenar select de comunidades
        Array.from(todasLasComunidades).sort().forEach(comunidad => {
            const option = document.createElement('option');
            option.value = comunidad;
            option.textContent = comunidad;
            communitySelect.appendChild(option);
        });

        // Llenar select de Centros de Votación
        Object.keys(this.ubchToCommunityMap).sort().forEach(ubch => {
            const option = document.createElement('option');
            option.value = ubch;
            option.textContent = ubch;
            ubchSelect.appendChild(option);
        });
        
        console.log('✅ Datos cargados correctamente en el formulario');
        this.showMessage(`Formulario listo con ${todasLasComunidades.size} comunidades disponibles`, 'success', 'registration');
    }

    renderCheckInPage() {
        // La página ya está renderizada en el HTML
        console.log('✅ Página de check-in renderizada');
    }

    renderListPage() {
        console.log('🔄 Renderizando página de listado...');
        this.renderVotesTable();
        console.log('✅ Página de listado renderizada');
    }

    renderDashboardPage() {
        const totalRegistered = this.votes.length;
        const totalVoted = this.votes.filter(vote => vote.voted).length;
        const percentage = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;

        const totalRegisteredEl = document.getElementById('total-registered');
        const totalVotedEl = document.getElementById('total-voted');
        const voteProgressEl = document.getElementById('vote-progress');
        const progressTextEl = document.getElementById('progress-text');

        if (totalRegisteredEl) totalRegisteredEl.textContent = totalRegistered;
        if (totalVotedEl) totalVotedEl.textContent = totalVoted;
        if (voteProgressEl) {
            voteProgressEl.style.width = `${percentage}%`;
            voteProgressEl.textContent = `${percentage.toFixed(1)}%`;
        }
        if (progressTextEl) {
            progressTextEl.textContent = `${totalVoted} de ${totalRegistered} personas han votado.`;
        }

        console.log('✅ Dashboard renderizado');
    }

    renderStatisticsPage() {
        const votedVotes = this.votes.filter(vote => vote.voted);
        
        // Estadísticas por UBCH
        const ubchStats = {};
        votedVotes.forEach(vote => {
            ubchStats[vote.ubch] = (ubchStats[vote.ubch] || 0) + 1;
        });

        // Estadísticas por Comunidad
        const communityStats = {};
        votedVotes.forEach(vote => {
            communityStats[vote.community] = (communityStats[vote.community] || 0) + 1;
        });

        // Estadísticas por Sexo
        const sexoStats = {};
        votedVotes.forEach(vote => {
            const sexo = vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'No especificado';
            sexoStats[sexo] = (sexoStats[sexo] || 0) + 1;
        });

        // Estadísticas por Rango de Edad
        const edadStats = {};
        votedVotes.forEach(vote => {
            const edad = vote.edad || 0;
            let rango = 'No especificado';
            
            if (edad >= 16 && edad <= 25) rango = '16-25 años';
            else if (edad >= 26 && edad <= 35) rango = '26-35 años';
            else if (edad >= 36 && edad <= 45) rango = '36-45 años';
            else if (edad >= 46 && edad <= 55) rango = '46-55 años';
            else if (edad >= 56 && edad <= 65) rango = '56-65 años';
            else if (edad >= 66) rango = '66+ años';
            
            edadStats[rango] = (edadStats[rango] || 0) + 1;
        });

        this.renderStatsList('ubch-stats', ubchStats, 'ubch');
        this.renderStatsList('community-stats', communityStats, 'community');
        this.renderStatsList('sexo-stats', sexoStats, 'sexo');
        this.renderStatsList('edad-stats', edadStats, 'edad');

        console.log('✅ Estadísticas renderizadas');
    }

    renderStatsList(containerId, stats, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        const sortedStats = Object.entries(stats).sort(([,a], [,b]) => b - a);

        sortedStats.forEach(([name, count]) => {
            const div = document.createElement('div');
            div.className = `stats-item ${type}`;
            div.innerHTML = `
                <span>${name}</span>
                <span>${count}</span>
            `;
            container.appendChild(div);
        });
    }

    renderVotesTable() {
        const tbody = document.querySelector('#registros-table tbody');
        if (!tbody) {
            console.error('❌ No se encontró el tbody de la tabla');
            return;
        }

        tbody.innerHTML = '';

        this.votes.forEach(vote => {
            const tr = document.createElement('tr');
            const sexoClass = vote.sexo === 'M' ? 'sexo-masculino' : vote.sexo === 'F' ? 'sexo-femenino' : '';
            tr.innerHTML = `
                <td>${vote.name || 'N/A'}</td>
                <td>${vote.cedula || 'N/A'}</td>
                <td class="${sexoClass}">${vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'N/A'}</td>
                <td>${vote.edad || 'N/A'}</td>
                <td>${vote.ubch || 'N/A'}</td>
                <td>${vote.community || 'N/A'}</td>
                <td>
                    <span class="vote-status ${vote.voted ? 'voted' : 'not-voted'}">
                        ${vote.voted ? 'Sí' : 'No'}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        console.log(`✅ Tabla renderizada con ${this.votes.length} votos`);
    }

    async handleRegistration() {
        const form = document.getElementById('registration-form');
        if (!form) {
            console.error('❌ Formulario de registro no encontrado');
            return;
        }

        const formData = new FormData(form);
        
        const name = formData.get('name').trim();
        const cedula = formData.get('cedula').trim();
        const telefono = formData.get('telefono').trim();
        const sexo = formData.get('sexo');
        const edad = formData.get('edad');
        const ubch = formData.get('ubch');
        const community = formData.get('community');

        if (!name || !cedula || !sexo || !edad || !ubch || !community) {
            this.showMessage('Por favor, completa todos los campos obligatorios.', 'error', 'registration');
            return;
        }

        const registrationData = {
            name,
            cedula: cedula.replace(/\D/g, ''),
            telefono: telefono.replace(/\D/g, ''),
            sexo,
            edad: parseInt(edad),
            ubch,
            community,
            registeredBy: this.getCurrentUser()?.username || 'usuario',
            voted: false,
            registeredAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        this.setLoadingState('registration', true);

        try {
            // Guardar localmente
            const localId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const localVote = {
                id: localId,
                ...registrationData
            };
            
            this.votes.push(localVote);
            localStorage.setItem('localVotes', JSON.stringify(this.votes));
            
            this.showMessage('✅ Registro guardado exitosamente.', 'success', 'registration');
            this.showMessage('👤 Nuevo registro: ' + name + ' en ' + community, 'success', 'registration');
            
            form.reset();
            
            // Actualizar todas las pantallas
            this.updateAllDataDisplays();
            
        } catch (error) {
            console.error('❌ Error al registrar:', error);
            this.showMessage('Error al registrar persona. Inténtalo de nuevo.', 'error', 'registration');
        } finally {
            this.setLoadingState('registration', false);
        }
    }

    async handleCheckIn() {
        const cedula = document.getElementById('cedula-search')?.value.trim();
        
        if (!cedula) {
            this.showMessage('Por favor, ingresa un número de cédula para buscar.', 'error', 'check-in');
            return;
        }

        const cleanCedula = cedula.replace(/\D/g, '');
        
        if (cleanCedula.length < 6 || cleanCedula.length > 10) {
            this.showMessage('Por favor, ingresa una cédula válida (6 a 10 dígitos).', 'error', 'check-in');
            return;
        }

        this.setLoadingState('check-in', true);

        try {
            let results = this.votes.filter(vote => vote.cedula === cleanCedula);
            results = results.filter(vote => !vote.id.startsWith('local_'));
        
            if (results.length === 0) {
                this.showMessage(`No se encontró a ninguna persona con la cédula ${cleanCedula}.`, 'error', 'check-in');
                return;
            }

            this.renderSearchResults(results);
            this.showMessage(`Se encontró ${results.length} persona(s) con la cédula ${cleanCedula}.`, 'success', 'check-in');
            
        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            this.showMessage('Error al buscar. Inténtalo de nuevo.', 'error', 'check-in');
        } finally {
            this.setLoadingState('check-in', false);
        }
    }

    renderSearchResults(results) {
        const container = document.getElementById('search-results');
        if (!container) return;

        container.innerHTML = '';

        results.forEach(person => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            
            const yaVoto = person.voted === true;
            
            div.innerHTML = `
                <div class="search-result-info">
                    <h4>${person.name}</h4>
                    <p>Cédula: ${person.cedula}</p>
                    <p>Sexo: ${person.sexo === 'M' ? 'Masculino' : person.sexo === 'F' ? 'Femenino' : 'N/A'}</p>
                    <p>Edad: ${person.edad || 'N/A'} años</p>
                    <p>UBCH: ${person.ubch}</p>
                    <p>Comunidad: ${person.community}</p>
                    <p class="vote-status-info">
                        <strong>Estado del voto:</strong> 
                        <span class="vote-status ${yaVoto ? 'voted' : 'not-voted'}">
                            ${yaVoto ? '🎯 Ya confirmado' : '⏳ Pendiente de confirmar'}
                        </span>
                    </p>
                </div>
                ${yaVoto ? 
                    '<div class="already-voted-message">Esta cédula ya fue confirmada anteriormente</div>' :
                    `<button class="btn btn-success" onclick="votingSystem.confirmVote('${person.id}')">
                        Confirmar Voto
                    </button>`
                }
            `;
            container.appendChild(div);
        });
    }

    async confirmVote(personId) {
        try {
            console.log('✅ Confirmando voto para ID:', personId);
            
            const vote = this.votes.find(v => v.id === personId);
            if (!vote) {
                this.showMessage('Error: Voto no encontrado. Intenta buscar nuevamente.', 'error', 'check-in');
                return;
            }
            
            if (personId.startsWith('local_')) {
                this.showMessage('Error: ID temporal detectado. Intenta buscar nuevamente.', 'error', 'check-in');
                return;
            }
            
            // Actualizar localmente
            const voteIndex = this.votes.findIndex(v => v.id === personId);
            if (voteIndex !== -1) {
                this.votes[voteIndex].voted = true;
                this.votes[voteIndex].voteTimestamp = new Date().toISOString();
                localStorage.setItem('localVotes', JSON.stringify(this.votes));
            }
            
            this.showMessage('¡Voto confirmado con éxito!', 'success', 'check-in');
            this.showMessage(`🎯 Voto confirmado: ${vote.name} en ${vote.community}`, 'success', true);
            
            const cedulaSearch = document.getElementById('cedula-search');
            const searchResults = document.getElementById('search-results');
            if (cedulaSearch) cedulaSearch.value = '';
            if (searchResults) searchResults.innerHTML = '';
            
            this.updateAllDataDisplays();
            
        } catch (error) {
            console.error('❌ Error al confirmar voto:', error);
            this.showMessage('Error al confirmar el voto. Inténtalo de nuevo.', 'error', 'check-in');
        }
    }

    updateAllDataDisplays() {
        console.log('🔄 Actualizando todas las pantallas...');
        
        if (this.currentPage === 'dashboard') {
            this.renderDashboardPage();
        }
        
        if (this.currentPage === 'listado') {
            this.renderVotesTable();
        }
        
        if (this.currentPage === 'statistics') {
            this.renderStatisticsPage();
        }
    }

    setLoadingState(page, loading) {
        const form = document.getElementById(`${page}-form`);
        if (!form) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        if (loading) {
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline';
            submitBtn.disabled = true;
        } else {
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }
}

// === CLASE FIREBASE (EXTENSIÓN) ===
class VotingSystemFirebase extends VotingSystem {
    constructor() {
        super();
        
        if (window.votingSystem && window.votingSystem !== this) {
            console.log('⚠️ Sistema ya inicializado, evitando duplicación');
            return;
        }
        
        window.votingSystem = this;
        console.log('✅ Instancia de VotingSystemFirebase creada correctamente');
        
        this.init();
    }

    async init() {
        console.log('🔄 Inicializando VotingSystemFirebase...');
        
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            if (currentUser.rol === 'verificador') {
                this.currentPage = 'check-in';
            } else if (currentUser.rol === 'registrador') {
                this.currentPage = 'registration';
            }
        }
            
        await this.loadDataFromFirebase();
        this.setupEventListeners();
        this.setupNavigationByRole();
        this.renderCurrentPage();
        
        console.log('✅ VotingSystemFirebase inicializado correctamente');
    }

    async loadDataFromFirebase() {
        try {
            if (this.isLoadingData) {
                console.log('⚠️ Carga de datos en progreso, evitando duplicación');
                return;
            }
            
            this.isLoadingData = true;
            console.log('📥 Cargando datos desde Firebase...');
            
            if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
                console.log('⚠️ Firebase no disponible, cargando datos locales');
                this.isLoadingData = false;
                return this.loadDataLocally();
            }
            
            const votesSnapshot = await window.firebaseDB.votesCollection.get();
            this.votes = votesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`✅ ${this.votes.length} votos cargados desde Firebase`);

            if (!this.ubchConfigLoaded) {
                try {
                    const ubchSnapshot = await window.firebaseDB.ubchCollection.doc('config').get();
                    if (ubchSnapshot.exists) {
                        this.ubchToCommunityMap = ubchSnapshot.data().mapping;
                        console.log('✅ Configuración UBCH cargada desde Firebase');
                    } else {
                        console.log('⚠️ No se encontró configuración UBCH en Firebase, usando configuración por defecto');
                        await this.saveUBCHConfigToFirebase();
                    }
                    
                    this.ubchConfigLoaded = true;
                    
                } catch (error) {
                    console.error('❌ Error cargando configuración UBCH:', error);
                    this.ubchConfigLoaded = true;
                }
            }

            this.isLoadingData = false;
            console.log('✅ Datos cargados desde Firebase:', this.votes.length, 'registros');

        } catch (error) {
            console.error('❌ Error cargando datos de Firebase:', error);
            console.log('🔄 Intentando cargar datos locales como fallback');
            this.isLoadingData = false;
            return this.loadDataLocally();
        }
    }

    async saveUBCHConfigToFirebase() {
        try {
            await window.firebaseDB.ubchCollection.doc('config').set({
                mapping: this.ubchToCommunityMap,
                lastUpdated: new Date()
            });
            console.log('✅ Configuración UBCH guardada en Firebase');
        } catch (error) {
            console.error('❌ Error guardando configuración UBCH:', error);
        }
    }

    setupNavigationByRole() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.style.display = 'none');

        if (currentUser.rol === 'verificador') {
            const navCheckIn = document.getElementById('nav-check-in');
            if (navCheckIn) {
                navCheckIn.style.display = 'block';
                navCheckIn.classList.add('active');
            }
        } else if (currentUser.rol === 'registrador') {
            const navRegistration = document.getElementById('nav-registration');
            if (navRegistration) {
                navRegistration.style.display = 'block';
                navRegistration.classList.add('active');
            }
        } else {
            navButtons.forEach(btn => btn.style.display = 'block');
        }
    }
}

// === INICIALIZACIÓN UNIFICADA ===
function initializeVotingSystem() {
    console.log('🚀 Inicializando sistema de votos unificado...');
    
    try {
        // Limpiar instancia anterior si existe
        if (window.votingSystem) {
            console.log('🔄 Limpiando instancia anterior del sistema...');
            window.votingSystem = null;
        }

        // Crear nueva instancia
        if (typeof VotingSystemFirebase !== 'undefined') {
            window.votingSystem = new VotingSystemFirebase();
            console.log('✅ VotingSystemFirebase creado');
        } else if (typeof VotingSystem !== 'undefined') {
            window.votingSystem = new VotingSystem();
            console.log('✅ VotingSystem creado (modo offline)');
        } else {
            throw new Error('No se encontró ninguna clase de sistema de votación');
        }

        // Mostrar información del usuario
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                const userInfo = document.getElementById('userId');
                if (userInfo) {
                    userInfo.textContent = `${user.username} (${user.rol})`;
                }
            } catch (error) {
                console.error('Error al mostrar información del usuario:', error);
            }
        }

        console.log('✅ Sistema de votos unificado inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando sistema de votos:', error);
    }
}

// === INICIALIZACIÓN AUTOMÁTICA ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, iniciando sistema...');
    initializeVotingSystem();
});

// === FUNCIONES GLOBALES ===
function normalizarUsuario(username) {
    return (username || '').trim().toLowerCase();
}

console.log('✅ Sistema de votos unificado cargado correctamente'); 