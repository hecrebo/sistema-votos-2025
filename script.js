// Sistema de Registro de Votos 2025 - JavaScript Vanilla con JSON Server

class VotingSystem {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
        this.currentPage = 'registration';
        this.userId = this.generateUserId();
        
        // Sistema de cola para múltiples usuarios
        this.registrationQueue = [];
        this.isProcessingQueue = false;
        this.concurrentRegistrations = 0;
        this.maxConcurrentRegistrations = 5;
        
        // Debounce para búsquedas
        this.searchTimeout = null;
        
        // Cache para optimizar consultas
        this.cache = {
            ubchData: null,
            votes: null,
            lastUpdate: null
        };
        
        this.ubchToCommunityMap = {
            "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS", "VILLAS DEL CENTRO 3ERA ETAPA B", "VILLAS DEL CENTRO 3ERA ETAPA C", "VILLAS DEL CENTRO 4A ETAPA", "LA CAMACHERA"],
            "LICEO JOSE FELIX RIBAS": ["EL CUJIJAL", "LAS FLORES", "LAS ESPERANZA 200", "VILLAS DEL CENTRO 2ERA ETAPA A", "LOS PALOMARES", "EL LAGO", "CAIPARICALLY I II", "EL BANCO", "CAIPARICHA I Y II"],
            "ESCUELA PRIMARIA BOLIVARIANA LA PRADERA": ["EL SAMAN", "GUADALUPE", "PALOS GRANDES II", "PALOS GRANDES I", "TIERRA DEL SOL", "LA CASTELLANA", "GARDENIAS I", "GARDENIAS II", "EL CERCADITO", "ALTAMIRA", "LA ADJUNTADA", "BUCARES", "GUAYABAL", "APARTATE", "EL REFUGIO", "LOS ROBLES", "ARAUCARIA"],
            "CASA COMUNAL JOSE TOMAS GALLARDO": ["JOSE TOMAS GALLARDO A", "LA PRIMAVERA"],
            "ESCUELA 5 DE JULIO": ["10 DE AGOSTO", "CAMPO ALEGRE I", "CAMPO ALEGRE II", "5 DE JULIO"],
            "ESCUELA CECILIO ACOSTA": ["VOLUNTAD DE DIOS", "LAS MATWINAS", "BRISAS DEL LAGO", "MANDANTO", "INDIANAPOLIS", "SUR DE ACOSTA"],
            "ESCUELA BASICA FE Y ALEGRIA": ["FE Y ALEGRIA", "BARRIO SOLIDARIO", "COMUNIDAD FUTURO"],
            "ESCUELA GRADUADA ANTONIO JOSE DE SUCRE": ["JESUS DE NAZARETH", "SECTOR BOLIVAR", "PALO NEGRO ESTE"],
            "CASA COMUNAL": ["LOS JABILLOS"],
            "UNIDAD EDUCATiva MONSEÑOR JACINTO SOTO LAYERA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II"],
            "BASE DE MISIONES LUISA CACERES DE ARISMENDI": ["24 DE ENERO", "19 DE ABRIL", "EL PROGRESO"],
            "ESCUELA ESTADAL ALEJO ZULOAGA": ["MAIQUETIA", "SAENZ", "PANAMERICANO"],
            "UNIDAD EDUCATIVA MONSEÑOR MONTES DE OCA": ["REMEDIOS"],
            "ESCUELA BASICA NACIONAL CONCENTRADA LA ESTACION": ["18 DE OCTUBRE"],
            "ESCUELA RECEPTORIA": ["CARMEN CENTRO"],
            "GRUPO ESCOLAR DR RAFAEL PEREZ": ["VIRGEN DEL CARMEN"],
            "LICEO ALFREDO PIETRI": ["LOS OJITOS", "LOS VENECIANOS"],
            "ESCUELA BOLIVARIANA ROMERO GARCIA": ["SAN BERNARDO", "LA HACIENDA"],
            "ESCUELA GRADUADA PEDRO GUAL": ["INDIANOS NORTE"]
        };
        this.votes = [];
        this.candidates = [];
        this.useLocalStorage = true;
        this.pdfLibrariesReady = false;
        
        this.init();
    }

    // Sistema de cola para registros múltiples
    async addToRegistrationQueue(registrationData) {
        return new Promise((resolve, reject) => {
            const queueItem = {
                data: registrationData,
                resolve,
                reject,
                timestamp: Date.now()
            };
            
            this.registrationQueue.push(queueItem);
            this.showMessage(`Registro en cola. Posición: ${this.registrationQueue.length}`, 'info', 'registration');
            
            if (!this.isProcessingQueue) {
                this.processRegistrationQueue();
            }
        });
    }

    async processRegistrationQueue() {
        if (this.isProcessingQueue || this.registrationQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.registrationQueue.length > 0 && this.concurrentRegistrations < this.maxConcurrentRegistrations) {
            const queueItem = this.registrationQueue.shift();
            this.concurrentRegistrations++;

            try {
                const result = await this.processRegistration(queueItem.data);
                queueItem.resolve(result);
            } catch (error) {
                queueItem.reject(error);
            } finally {
                this.concurrentRegistrations--;
                // Pequeña pausa entre registros para evitar sobrecarga
                await this.delay(100);
            }
        }

        this.isProcessingQueue = false;

        // Si quedan elementos en la cola, continuar procesando
        if (this.registrationQueue.length > 0) {
            setTimeout(() => this.processRegistrationQueue(), 200);
        }
    }

    async processRegistration(registrationData) {
        // Validación en tiempo real
        const validation = this.validateRegistrationData(registrationData);
        if (!validation.isValid) {
            throw new Error(validation.message);
        }

        // Verificar duplicados
        const isDuplicate = this.votes.some(vote => vote.cedula === registrationData.cedula);
        if (isDuplicate) {
            throw new Error('Esta cédula ya está registrada');
        }

        // Crear nuevo registro
        const newVote = {
            id: Date.now() + Math.random(),
            ...registrationData,
            registeredAt: new Date().toISOString(),
            registeredBy: this.userId,
            hasVoted: false
        };

        // Agregar a la lista local
        this.votes.push(newVote);
        
        // Guardar datos
        await this.saveData();
        
        return newVote;
    }

    validateRegistrationData(data) {
        // Validar cédula
        if (!data.cedula || !/^\d{6,10}$/.test(data.cedula)) {
            return { isValid: false, message: 'Cédula inválida. Debe tener entre 6 y 10 dígitos' };
        }

        // Validar nombre
        if (!data.name || data.name.trim().length < 3) {
            return { isValid: false, message: 'Nombre inválido. Debe tener al menos 3 caracteres' };
        }

        // Validar teléfono
        if (!data.telefono || !/^04\d{9}$/.test(data.telefono)) {
            return { isValid: false, message: 'Teléfono inválido. Debe tener formato: 04xxxxxxxxx' };
        }

        // Validar UBCH y comunidad
        if (!data.ubch || !data.community) {
            return { isValid: false, message: 'Debe seleccionar UBCH y comunidad' };
        }

        return { isValid: true, message: 'Datos válidos' };
    }

    // Debounce para búsquedas
    debounce(func, wait) {
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(this.searchTimeout);
                func(...args);
            };
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(later, wait);
        }.bind(this);
    }

    // Función de delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Cache optimizado
    async getCachedData(key, fetchFunction, maxAge = 30000) {
        const now = Date.now();
        const cached = this.cache[key];
        
        if (cached && (now - cached.timestamp) < maxAge) {
            return cached.data;
        }

        const data = await fetchFunction();
        this.cache[key] = {
            data,
            timestamp: now
        };

        return data;
    }

    // Notificaciones optimizadas
    showOptimizedMessage(message, type = 'info', page = 'registration') {
        // Evitar múltiples mensajes del mismo tipo
        const messageKey = `${type}-${message}`;
        if (this.lastMessage === messageKey) {
            return;
        }
        
        this.lastMessage = messageKey;
        this.showMessage(message, type, page);
        
        // Limpiar después de 3 segundos
        setTimeout(() => {
            this.lastMessage = null;
        }, 3000);
    }

    async init() {
        // Usar localStorage por defecto para evitar problemas de conexión
        this.useLocalStorage = true;
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.renderCurrentPage();
        this.loadPdfLibraries();
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    async loadData() {
        try {
            // Cargar mapeo UBCH-Comunidad
            const ubchResponse = await fetch(`${this.apiUrl}/ubchToCommunityMap`);
            if (!ubchResponse.ok) throw new Error('No se pudo cargar el mapeo UBCH-Comunidad');
            const ubchData = await ubchResponse.json();
            if (!ubchData || Object.keys(ubchData).length === 0) {
                this.showMessage('No se encontraron UBCH disponibles. Contacte al administrador.', 'error', 'registration');
                this.ubchToCommunityMap = {};
            } else {
                this.ubchToCommunityMap = ubchData;
            }
            
            // Cargar votos
            const votesResponse = await fetch(`${this.apiUrl}/votes`);
            this.votes = await votesResponse.json();
            
            // Cargar candidatos
            const candidatesResponse = await fetch(`${this.apiUrl}/candidates`);
            this.candidates = await candidatesResponse.json();
            
        } catch (error) {
            this.showMessage('Error al cargar datos del servidor. Verifique su conexión.', 'error', 'registration');
            throw new Error('No se pudo conectar al servidor');
        }
    }

    loadFromLocalStorage() {
        // Usar datos por defecto de UBCH si no hay datos guardados
        const savedUbchData = localStorage.getItem('ubchToCommunityMap');
        this.ubchToCommunityMap = savedUbchData ? JSON.parse(savedUbchData) : this.ubchToCommunityMap;
        
        this.votes = JSON.parse(localStorage.getItem('votes')) || [];
        this.candidates = JSON.parse(localStorage.getItem('candidates')) || [];
    }

    async saveData() {
        if (this.useLocalStorage) {
            localStorage.setItem('ubchToCommunityMap', JSON.stringify(this.ubchToCommunityMap));
            localStorage.setItem('votes', JSON.stringify(this.votes));
            localStorage.setItem('candidates', JSON.stringify(this.candidates));
        } else {
            try {
                // Actualizar votos
                await fetch(`${this.apiUrl}/votes`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.votes)
                });
            } catch (error) {
                console.error('Error al guardar en servidor:', error);
                this.useLocalStorage = true;
                this.saveData();
            }
        }
    }

    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navigateToPage(e.target.dataset.page);
            });
        });

        // Formulario de registro
        document.getElementById('registration-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // Formulario de confirmación de voto
        document.getElementById('check-in-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCheckIn();
        });

        // Cambio de UBCH
        document.getElementById('ubch').addEventListener('change', (e) => {
            this.handleUBCHChange(e.target.value);
        });

        // Exportación
        document.getElementById('export-pdf-btn').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('export-csv-btn').addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('export-stats-pdf-btn').addEventListener('click', () => {
            this.exportStatsToPDF();
        });

        // Proyección
        document.getElementById('projection-btn').addEventListener('click', () => {
            this.enterProjectionMode();
        });

        document.getElementById('exit-projection-btn').addEventListener('click', () => {
            this.exitProjectionMode();
        });

        // Modal de eliminación
        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterChange(e.target.dataset.filter);
            });
        });

        // Mostrar ID de usuario
        document.getElementById('userId').textContent = this.userId;
    }

    navigateToPage(page) {
        // Actualizar navegación
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Ocultar todas las páginas
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Mostrar página seleccionada
        document.getElementById(`${page}-page`).classList.add('active');

        this.currentPage = page;
        this.renderCurrentPage();
    }

    renderCurrentPage() {
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
        }
    }

    renderRegistrationPage() {
        const ubchSelect = document.getElementById('ubch');
        const communitySelect = document.getElementById('community');
        const form = document.getElementById('registration-form');

        // Limpiar opciones
        ubchSelect.innerHTML = '<option value="">Selecciona una UBCH</option>';
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';
        communitySelect.disabled = true;

        // Si no hay UBCH, desactivar el formulario y mostrar mensaje
        if (!this.ubchToCommunityMap || Object.keys(this.ubchToCommunityMap).length === 0) {
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
            this.showMessage('No hay UBCH disponibles. Contacte al administrador.', 'error', 'registration');
            return;
        } else {
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = false);
        }

        // Llenar UBCH
        Object.keys(this.ubchToCommunityMap).forEach(ubch => {
            const option = document.createElement('option');
            option.value = ubch;
            option.textContent = ubch;
            ubchSelect.appendChild(option);
        });
    }

    handleUBCHChange(selectedUBCH) {
        const communitySelect = document.getElementById('community');
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';
        communitySelect.disabled = !selectedUBCH;

        if (selectedUBCH && this.ubchToCommunityMap[selectedUBCH]) {
            this.ubchToCommunityMap[selectedUBCH].forEach(community => {
                const option = document.createElement('option');
                option.value = community;
                option.textContent = community;
                communitySelect.appendChild(option);
            });
        }
    }

    async handleRegistration() {
        const form = document.getElementById('registration-form');
        const formData = new FormData(form);
        
        const name = formData.get('name').trim();
        const cedula = formData.get('cedula').trim();
        const telefono = formData.get('telefono').trim();
        const ubch = formData.get('ubch');
        const community = formData.get('community');

        // Validación inicial
        if (!name || !cedula || !telefono || !ubch || !community) {
            this.showOptimizedMessage('Por favor, completa todos los campos.', 'error', 'registration');
            return;
        }

        // Preparar datos para la cola
        const registrationData = {
            name,
            cedula: cedula.replace(/\D/g, ''),
            telefono: telefono.replace(/\D/g, ''),
            ubch,
            community
        };

        this.setLoadingState('registration', true);

        try {
            // Agregar a la cola de registros
            const result = await this.addToRegistrationQueue(registrationData);
            
            this.showOptimizedMessage('¡Persona registrada con éxito!', 'success', 'registration');
            await this.generateThankYouMessage(name, ubch, community);
            
            // Limpiar formulario
            form.reset();
            document.getElementById('community').disabled = true;
            
            // Mantener visible el mensaje de agradecimiento
            setTimeout(() => {
                document.getElementById('thank-you-message').style.display = 'none';
            }, 10000);
            
        } catch (error) {
            console.error('Error al registrar:', error);
            this.showOptimizedMessage(error.message || 'Error al registrar persona. Inténtalo de nuevo.', 'error', 'registration');
        } finally {
            this.setLoadingState('registration', false);
        }
    }

    async generateThankYouMessage(name, ubch, community) {
        const messageDiv = document.getElementById('thank-you-message');
        messageDiv.innerHTML = '<p>Generando mensaje...</p>';
        messageDiv.style.display = 'block';

        try {
            // Simular generación de mensaje (aquí podrías integrar con una API real)
            const messages = [
                `¡Excelente ${name}! Tu registro en la UBCH "${ubch}" y comunidad "${community}" es un paso importante para fortalecer nuestra democracia. Tu participación cuenta.`,
                `${name}, gracias por registrarte en "${ubch}". Tu compromiso con la comunidad "${community}" es fundamental para el futuro de nuestro país.`,
                `¡Bienvenido ${name}! Tu registro en "${ubch}" demuestra tu compromiso con la participación ciudadana. Juntos construimos un mejor futuro.`
            ];
            
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            messageDiv.innerHTML = `
                <p><strong>Mensaje para la persona registrada:</strong></p>
                <p>${randomMessage}</p>
            `;
        } catch (error) {
            messageDiv.innerHTML = `
                <p><strong>Mensaje para la persona registrada:</strong></p>
                <p>¡Gracias por tu registro! Tu participación es muy valiosa.</p>
            `;
        }
    }

    renderCheckInPage() {
        // La página ya está renderizada en el HTML
    }

    async handleCheckIn() {
        const cedula = document.getElementById('cedula-search').value.trim();
        
        if (!cedula) {
            this.showOptimizedMessage('Por favor, ingresa un número de cédula para buscar.', 'error', 'check-in');
            return;
        }

        // Usar debounce para evitar múltiples búsquedas
        const debouncedSearch = this.debounce(async (searchCedula) => {
            this.setLoadingState('check-in', true);

            try {
                const results = this.votes.filter(vote => vote.cedula === searchCedula);
                
                if (results.length === 0) {
                    this.showOptimizedMessage(`No se encontró a ninguna persona con la cédula ${searchCedula}.`, 'error', 'check-in');
                    return;
                }

                this.renderSearchResults(results);
                this.showOptimizedMessage(`Se encontró ${results.length} persona(s) con la cédula ${searchCedula}.`, 'success', 'check-in');
                
            } catch (error) {
                console.error('Error en búsqueda:', error);
                this.showOptimizedMessage('Error al buscar. Inténtalo de nuevo.', 'error', 'check-in');
            } finally {
                this.setLoadingState('check-in', false);
            }
        }, 300);

        await debouncedSearch(cedula);
    }

    renderSearchResults(results) {
        const container = document.getElementById('search-results');
        container.innerHTML = '';

        results.forEach(person => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <div class="search-result-info">
                    <h4>${person.name}</h4>
                    <p>Cédula: ${person.cedula}</p>
                    <p>UBCH: ${person.ubch}</p>
                    <p>Comunidad: ${person.community}</p>
                </div>
                <button class="btn btn-success" onclick="votingSystem.confirmVote(${person.id})">
                    Confirmar Voto
                </button>
            `;
            container.appendChild(div);
        });
    }

    async confirmVote(personId) {
        try {
            const person = this.votes.find(v => v.id === personId);
            if (!person) return;

            person.voted = true;
            person.voteTimestamp = new Date().toISOString();
            
            await this.saveData();
            
            this.showMessage('¡Voto confirmado con éxito!', 'success', 'check-in');
            document.getElementById('cedula-search').value = '';
            document.getElementById('search-results').innerHTML = '';
            
        } catch (error) {
            console.error('Error al confirmar voto:', error);
            this.showMessage('Error al confirmar el voto. Inténtalo de nuevo.', 'error', 'check-in');
        }
    }

    renderListPage() {
        this.renderVotesTable();
    }

    renderVotesTable() {
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';

        this.votes.forEach(vote => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${vote.name}</td>
                <td>${vote.cedula}</td>
                <td>${vote.ubch}</td>
                <td>${vote.community}</td>
                <td>
                    <span class="vote-status ${vote.voted ? 'voted' : 'not-voted'}">
                        ${vote.voted ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-danger" onclick="votingSystem.deleteVote(${vote.id})">
                        Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    handleFilterChange(filter) {
        // Actualizar botones de filtro
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Filtrar tabla
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';

        let filteredVotes = this.votes;
        
        if (filter === 'voted') {
            filteredVotes = this.votes.filter(vote => vote.voted);
        } else if (filter === 'not-voted') {
            filteredVotes = this.votes.filter(vote => !vote.voted);
        }

        filteredVotes.forEach(vote => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${vote.name}</td>
                <td>${vote.cedula}</td>
                <td>${vote.ubch}</td>
                <td>${vote.community}</td>
                <td>
                    <span class="vote-status ${vote.voted ? 'voted' : 'not-voted'}">
                        ${vote.voted ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-danger" onclick="votingSystem.deleteVote(${vote.id})">
                        Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    deleteVote(voteId) {
        this.voteToDelete = voteId;
        document.getElementById('delete-modal').style.display = 'flex';
    }

    closeDeleteModal() {
        document.getElementById('delete-modal').style.display = 'none';
        this.voteToDelete = null;
    }

    async confirmDelete() {
        if (!this.voteToDelete) return;

        try {
            this.votes = this.votes.filter(vote => vote.id !== this.voteToDelete);
            await this.saveData();
            this.renderVotesTable();
            this.closeDeleteModal();
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    }

    renderDashboardPage() {
        const totalRegistered = this.votes.length;
        const totalVoted = this.votes.filter(vote => vote.voted).length;
        const percentage = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;

        document.getElementById('total-registered').textContent = totalRegistered;
        document.getElementById('total-voted').textContent = totalVoted;
        document.getElementById('vote-progress').style.width = `${percentage}%`;
        document.getElementById('vote-progress').textContent = `${percentage.toFixed(1)}%`;
        document.getElementById('progress-text').textContent = `${totalVoted} de ${totalRegistered} personas han votado.`;
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

        this.renderStatsList('ubch-stats', ubchStats, 'ubch');
        this.renderStatsList('community-stats', communityStats, 'community');
    }

    renderStatsList(containerId, stats, type) {
        const container = document.getElementById(containerId);
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

    enterProjectionMode() {
        document.getElementById('projection-view').style.display = 'block';
        this.updateProjection();
        
        // Actualizar cada 5 segundos
        this.projectionInterval = setInterval(() => {
            this.updateProjection();
        }, 5000);
    }

    exitProjectionMode() {
        document.getElementById('projection-view').style.display = 'none';
        if (this.projectionInterval) {
            clearInterval(this.projectionInterval);
        }
    }

    updateProjection() {
        const totalRegistered = this.votes.length;
        const totalVoted = this.votes.filter(vote => vote.voted).length;
        const percentage = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;

        document.getElementById('projection-votes').textContent = totalVoted;
        document.getElementById('projection-progress-fill').style.width = `${percentage}%`;
        document.getElementById('projection-progress-fill').textContent = `${percentage.toFixed(1)}%`;
        document.getElementById('projection-text').textContent = `${totalVoted} de ${totalRegistered}`;

        // Actualizar lista de UBCH
        const votedVotes = this.votes.filter(vote => vote.voted);
        const ubchStats = {};
        votedVotes.forEach(vote => {
            ubchStats[vote.ubch] = (ubchStats[vote.ubch] || 0) + 1;
        });

        const sortedUBCH = Object.entries(ubchStats).sort(([,a], [,b]) => b - a);
        const maxVotes = sortedUBCH[0] ? sortedUBCH[0][1] : 1;

        const container = document.getElementById('projection-ubch-list');
        container.innerHTML = '';

        sortedUBCH.forEach(([ubch, count], index) => {
            const percentage = (count / maxVotes) * 100;
            const div = document.createElement('div');
            div.className = 'projection-item';
            div.innerHTML = `
                <div class="projection-item-header">
                    <span class="projection-item-name">${index + 1}. ${ubch}</span>
                    <span class="projection-item-count">${count}</span>
                </div>
                <div class="projection-item-progress">
                    <div class="projection-item-progress-fill" style="width: ${percentage}%"></div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    loadPdfLibraries() {
        // Verificar si las librerías ya están cargadas
        if (window.jspdf) {
            this.pdfLibrariesReady = true;
            return;
        }

        // Las librerías se cargan desde CDN en el HTML
        const checkLibraries = () => {
            if (window.jspdf) {
                this.pdfLibrariesReady = true;
            } else {
                setTimeout(checkLibraries, 100);
            }
        };
        checkLibraries();
    }

    exportToPDF() {
        if (!this.pdfLibrariesReady) {
            alert('Las librerías para PDF no están listas.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const tableColumn = ["Nombre", "Cédula", "Teléfono", "UBCH", "Comunidad", "Votó"];
        const tableRows = [];

        this.votes.forEach(vote => {
            tableRows.push([
                vote.name,
                vote.cedula,
                vote.telefono,
                vote.ubch,
                vote.community,
                vote.voted ? "Sí" : "No"
            ]);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            headStyles: { fillColor: [52, 152, 219] },
        });
        
        doc.text("Listado de Personas Registradas", 14, 15);
        doc.save("listado_registros.pdf");
    }

    exportToCSV() {
        const headers = ["Nombre", "Cédula", "Teléfono", "UBCH", "Comunidad", "Votó"];
        const csvRows = [
            headers.join(','),
            ...this.votes.map(vote => [
                `"${vote.name}"`,
                `"${vote.cedula}"`,
                `"${vote.telefono}"`,
                `"${vote.ubch}"`,
                `"${vote.community}"`,
                `"${vote.voted ? 'Sí' : 'No'}"`
            ].join(','))
        ];

        const csvString = csvRows.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "listado_registros.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportStatsToPDF() {
        if (!this.pdfLibrariesReady) {
            alert('Las librerías para PDF no están listas.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Reporte de Estadísticas de Votación", 14, 22);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString('es-VE')}`, 14, 30);
        
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
        
        doc.setFontSize(14);
        doc.text("Votos por UBCH", 14, 40);
        doc.autoTable({ 
            startY: 45, 
            head: [['UBCH', 'Votos']], 
            body: Object.entries(ubchStats), 
            headStyles: { fillColor: [52, 152, 219] } 
        });
        
        doc.text("Votos por Comunidad", 14, doc.lastAutoTable.finalY + 15);
        doc.autoTable({ 
            startY: doc.lastAutoTable.finalY + 20, 
            head: [['Comunidad', 'Votos']], 
            body: Object.entries(communityStats), 
            headStyles: { fillColor: [52, 152, 219] } 
        });

        doc.save('reporte_votacion.pdf');
    }

    setLoadingState(page, loading) {
        const form = document.getElementById(`${page}-form`);
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            submitBtn.disabled = true;
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    showMessage(message, type, page) {
        const messageDiv = document.getElementById(`${page}-message`);
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Inicializar el sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.votingSystem = new VotingSystem();
});