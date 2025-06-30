// Sistema de Registro de Votos 2025 - JavaScript Vanilla con Cache Local y Sincronización Inteligente

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
        
        // Sistema de sincronización inteligente
        this.syncInterval = null;
        this.lastSyncTime = Date.now();
        this.syncEnabled = true;
        this.offlineMode = false;
        
        // Verificar sesión de usuario
        this.currentUser = this.getCurrentUser();
        if (!this.currentUser) {
            this.redirectToLogin();
            return;
        }
        
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
            "UNIDAD EDUCATIVA MONSEÑOR JACINTO SOTO LAYERA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II"],
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
        this.useLocalStorage = false;
        this.pdfLibrariesReady = false;
        
        // Configuración de optimizaciones
        this.registrationQueue = [];
        this.isProcessingQueue = false;
        this.cache = {};
        this.searchTimeout = null;
        this.lastMessage = null;
        this.voteToDelete = null;
        this.projectionInterval = null;
        
        // --- Paginación ---
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalPages = 1;
        this.paginatedVotes = [];
        
        this.init();
    }

    // Verificar sesión de usuario
    getCurrentUser() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (!userData) return null;
            
            const user = JSON.parse(userData);
            const sessionTime = localStorage.getItem('sessionTime');
            
            // Verificar si la sesión ha expirado (24 horas)
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

    // Redirigir al login
    redirectToLogin() {
        if (window.location.pathname !== '/login.html') {
            window.location.href = 'login.html';
        }
    }

    // Logout
    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionTime');
        this.redirectToLogin();
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
            registeredBy: this.currentUser.username,
            voted: false
        };

        // Usar SyncManager si está disponible, sino método tradicional
        if (window.syncManager) {
            try {
                // Agregar a la cola local del SyncManager
                const localRecord = window.syncManager.addLocalRecord(newVote);
                
                // Agregar también a la lista local para mostrar inmediatamente
                this.votes.push(localRecord);
                
                // Mostrar mensaje según estado de conexión
                if (window.syncManager.isOnline) {
                    this.showMessage('✅ Registro guardado y sincronizado', 'success', 'registration');
                } else {
                    this.showMessage('📱 Registro guardado localmente (se sincronizará cuando haya conexión)', 'info', 'registration');
                }
                
                return localRecord;
            } catch (error) {
                console.error('Error con SyncManager:', error);
                // Fallback al método tradicional
            }
        }

        // Método tradicional (fallback)
        this.votes.push(newVote);
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

        // Validar sexo
        if (!data.sexo || !['M', 'F'].includes(data.sexo)) {
            return { isValid: false, message: 'Debe seleccionar el sexo' };
        }

        // Validar edad
        if (!data.edad || isNaN(data.edad) || data.edad < 16 || data.edad > 120) {
            return { isValid: false, message: 'Edad inválida. Debe estar entre 16 y 120 años' };
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
        // Evitar mensajes duplicados
        if (this.lastMessage === message) {
            return;
        }
        
        this.lastMessage = message;
        this.showMessage(message, type, page);
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
            this.lastMessage = null;
        }, 3000);
    }

    async init() {
        try {
            // Intentar cargar datos del servidor JSON
            await this.loadData();
            this.showMessage('Conectado al servidor. Los datos se comparten entre todas las computadoras.', 'success', 'registration');
            
            // Iniciar sincronización automática
            this.startAutoSync();
        } catch (error) {
            console.warn('No se pudo conectar al servidor, usando localStorage:', error);
            // Si falla, usar localStorage como respaldo
        this.useLocalStorage = true;
            this.offlineMode = true;
        this.loadFromLocalStorage();
            this.showMessage('Modo offline activado. Los datos solo se guardan en esta computadora.', 'warning', 'registration');
        }
        
        this.setupEventListeners();
        this.renderCurrentPage();
        this.loadPdfLibraries();
        
        // Mostrar información del usuario
        this.displayUserInfo();
        
        // Actualizar indicador de sincronización
        this.updateSyncStatus('Iniciando...', 'info');
        
        // Actualizar indicador cada 10 segundos
        setInterval(() => {
            this.updateSyncStatus('', 'info');
        }, 10000);
    }

    // Mostrar información del usuario
    displayUserInfo() {
        const userInfo = document.getElementById('userId');
        if (userInfo && this.currentUser) {
            userInfo.textContent = `${this.currentUser.username} (${this.currentUser.rol})`;
        }
    }

    // Iniciar sincronización automática
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Sincronizar cada 30 segundos
        this.syncInterval = setInterval(() => {
            if (this.syncEnabled && !this.offlineMode) {
                this.syncData();
            }
        }, 30000);
    }

    // Sincronizar datos
    async syncData() {
        try {
            const response = await fetch(`${this.apiUrl}/votes`);
            const serverVotes = await response.json();
            
            // Comparar con datos locales
            if (JSON.stringify(serverVotes) !== JSON.stringify(this.votes)) {
                this.votes = serverVotes;
                this.updateSyncStatus('Sincronizado', 'success');
                this.renderCurrentPage(); // Actualizar vista si es necesario
            }
            
            this.lastSyncTime = Date.now();
        } catch (error) {
            console.warn('Error en sincronización:', error);
            this.updateSyncStatus('Error de sincronización', 'error');
        }
    }

    // Actualizar estado de sincronización
    updateSyncStatus(message, type) {
        const syncIndicator = document.getElementById('sync-indicator');
        const syncText = document.getElementById('sync-text');
        const syncSpinner = document.getElementById('sync-spinner');
        const syncCheck = document.getElementById('sync-check');
        
        if (!syncIndicator) return;
        
        // Usar SyncManager si está disponible
        if (window.syncManager) {
            const stats = window.syncManager.getSyncStats();
            
            if (stats.isOnline) {
                syncIndicator.textContent = '🌐';
                syncText.textContent = stats.pending > 0 ? `Sincronizando (${stats.pending} pendientes)` : 'Sincronizado';
                
                if (stats.pending > 0) {
                    syncSpinner.style.display = 'inline-block';
                    syncCheck.style.display = 'none';
                } else {
                    syncSpinner.style.display = 'none';
                    syncCheck.style.display = 'inline-block';
                    syncCheck.textContent = '✅';
                }
            } else {
                syncIndicator.textContent = '📴';
                syncText.textContent = `Offline (${stats.pending} pendientes)`;
                syncSpinner.style.display = 'none';
                syncCheck.style.display = 'none';
            }
        } else {
            // Método tradicional
            syncIndicator.textContent = type === 'success' ? '✅' : '❌';
            syncIndicator.className = `sync-indicator ${type}`;
            syncText.textContent = message;
            syncText.className = `sync-text ${type}`;
        }
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    async loadData() {
        try {
            // Usar SyncManager si está disponible
            if (window.syncManager) {
                const allRecords = await window.syncManager.getAllRecords();
                
                // Combinar registros locales y remotos
                this.votes = [
                    ...allRecords.local,
                    ...allRecords.remote
                ];
                
                console.log(`📦 Datos cargados: ${allRecords.local.length} locales, ${allRecords.remote.length} remotos`);
                
                // Actualizar interfaz
                this.renderCurrentPage();
                return;
            }

            // Método tradicional (fallback)
            const response = await fetch(`${this.apiUrl}/votes`);
            if (response.ok) {
                this.votes = await response.json();
            } else {
                console.warn('No se pudo cargar desde servidor, usando localStorage');
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.loadFromLocalStorage();
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

        // Filtro por UBCH
        const ubchFilterSelect = document.getElementById('ubch-filter-select');
        if (ubchFilterSelect) {
            ubchFilterSelect.addEventListener('change', () => {
                this.applyFilters();
            });
        }

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
            this.showOptimizedMessage('No hay UBCH disponibles. Contacte al administrador.', 'error', 'registration');
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
        const sexo = formData.get('sexo');
        const edad = formData.get('edad');
        const ubch = formData.get('ubch');
        const community = formData.get('community');

        // Validación inicial
        if (!name || !cedula || !telefono || !sexo || !edad || !ubch || !community) {
            this.showOptimizedMessage('Por favor, completa todos los campos.', 'error', 'registration');
            return;
        }

        // Preparar datos para la cola
        const registrationData = {
                name,
            cedula: cedula.replace(/\D/g, ''),
            telefono: telefono.replace(/\D/g, ''),
            sexo,
            edad: parseInt(edad),
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
                    <p>Sexo: ${person.sexo === 'M' ? 'Masculino' : person.sexo === 'F' ? 'Femenino' : 'N/A'}</p>
                    <p>Edad: ${person.edad || 'N/A'} años</p>
                    <p>UBCH: ${person.ubch}</p>
                    <p>Comunidad: ${person.community}</p>
                </div>
                <button class="btn btn-success" onclick="votingSystem.confirmVote('${person.id}')">
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
        this.currentPage = 1;
        this.renderVotesTable();
    }

    renderVotesTable() {
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';

        // Poblar el selector de UBCH con las UBCH disponibles
        this.populateUBCHFilter();

        // Filtrar votos según filtros activos
        let filteredVotes = this.votes;
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        if (activeFilterBtn) {
            const filter = activeFilterBtn.dataset.filter;
            if (filter === 'voted') filteredVotes = filteredVotes.filter(v => v.voted);
            if (filter === 'not-voted') filteredVotes = filteredVotes.filter(v => !v.voted);
        }
        if (selectedUBCH) {
            filteredVotes = filteredVotes.filter(v => v.ubch === selectedUBCH);
        }

        // Paginación
        this.totalPages = Math.max(1, Math.ceil(filteredVotes.length / this.pageSize));
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const startIdx = (this.currentPage - 1) * this.pageSize;
        const endIdx = startIdx + this.pageSize;
        this.paginatedVotes = filteredVotes.slice(startIdx, endIdx);

        this.paginatedVotes.forEach(vote => {
            const tr = document.createElement('tr');
            const sexoClass = vote.sexo === 'M' ? 'sexo-masculino' : vote.sexo === 'F' ? 'sexo-femenino' : '';
            tr.innerHTML = `
                <td>${vote.name}</td>
                <td>${vote.cedula}</td>
                <td class="${sexoClass}">${vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'N/A'}</td>
                <td>${vote.edad || 'N/A'}</td>
                <td>${vote.ubch}</td>
                <td>${vote.community}</td>
                <td>
                    <span class="vote-status ${vote.voted ? 'voted' : 'not-voted'}">
                        ${vote.voted ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-danger" onclick="votingSystem.deleteVote('${vote.id}')">
                        Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar contador
        this.updateFilterCounter(filteredVotes.length);
        // Renderizar controles de paginación
        this.renderPaginationControls(filteredVotes.length);
    }

    renderPaginationControls(totalItems) {
        const container = document.getElementById('pagination-controls');
        if (!container) return;
        container.innerHTML = '';
        if (totalItems === 0) return;

        // Botones de navegación
        const btnFirst = document.createElement('button');
        btnFirst.textContent = '«';
        btnFirst.disabled = this.currentPage === 1;
        btnFirst.onclick = () => { this.currentPage = 1; this.renderVotesTable(); };

        const btnPrev = document.createElement('button');
        btnPrev.textContent = '‹';
        btnPrev.disabled = this.currentPage === 1;
        btnPrev.onclick = () => { this.currentPage--; this.renderVotesTable(); };

        const btnNext = document.createElement('button');
        btnNext.textContent = '›';
        btnNext.disabled = this.currentPage === this.totalPages;
        btnNext.onclick = () => { this.currentPage++; this.renderVotesTable(); };

        const btnLast = document.createElement('button');
        btnLast.textContent = '»';
        btnLast.disabled = this.currentPage === this.totalPages;
        btnLast.onclick = () => { this.currentPage = this.totalPages; this.renderVotesTable(); };

        // Info de página
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`;

        // Selector de tamaño de página
        const pageSizeSelect = document.createElement('select');
        [10, 20, 50, 100].forEach(size => {
            const opt = document.createElement('option');
            opt.value = size;
            opt.textContent = `${size} por página`;
            if (size === this.pageSize) opt.selected = true;
            pageSizeSelect.appendChild(opt);
        });
        pageSizeSelect.onchange = (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.renderVotesTable();
        };

        container.appendChild(btnFirst);
        container.appendChild(btnPrev);
        container.appendChild(pageInfo);
        container.appendChild(btnNext);
        container.appendChild(btnLast);
        container.appendChild(pageSizeSelect);
    }

    // Poblar el selector de filtro por UBCH
    populateUBCHFilter() {
        const ubchSelect = document.getElementById('ubch-filter-select');
        if (!ubchSelect) return;

        // Obtener todas las UBCH únicas de los registros
        const uniqueUBCHs = [...new Set(this.votes.map(vote => vote.ubch).filter(ubch => ubch))];
        
        // Limpiar opciones existentes excepto la primera
        ubchSelect.innerHTML = '<option value="">Todas las UBCH</option>';
        
        // Agregar opciones para cada UBCH
        uniqueUBCHs.sort().forEach(ubch => {
            const option = document.createElement('option');
            option.value = ubch;
            option.textContent = ubch;
            ubchSelect.appendChild(option);
        });
    }

    handleFilterChange(filter) {
        // Actualizar botones de filtro
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Aplicar filtros
        this.applyFilters();
    }

    // Aplicar todos los filtros (estado de voto y UBCH)
    applyFilters() {
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';

        // Obtener filtros activos
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        const selectedUBCH = document.getElementById('ubch-filter-select').value;

        let filteredVotes = this.votes;
        
        // Filtrar por estado de voto
        if (activeFilter === 'voted') {
            filteredVotes = filteredVotes.filter(vote => vote.voted);
        } else if (activeFilter === 'not-voted') {
            filteredVotes = filteredVotes.filter(vote => !vote.voted);
        }

        // Filtrar por UBCH
        if (selectedUBCH) {
            filteredVotes = filteredVotes.filter(vote => vote.ubch === selectedUBCH);
        }

        // Renderizar votos filtrados
        filteredVotes.forEach(vote => {
            const tr = document.createElement('tr');
            const sexoClass = vote.sexo === 'M' ? 'sexo-masculino' : vote.sexo === 'F' ? 'sexo-femenino' : '';
            tr.innerHTML = `
                <td>${vote.name}</td>
                <td>${vote.cedula}</td>
                <td class="${sexoClass}">${vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'N/A'}</td>
                <td>${vote.edad || 'N/A'}</td>
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

        // Mostrar contador de resultados
        this.updateFilterCounter(filteredVotes.length);
    }

    // Actualizar contador de resultados filtrados
    updateFilterCounter(count) {
        const totalCount = this.votes.length;
        const filterCounter = document.getElementById('filter-counter');
        
        if (filterCounter) {
            if (count === totalCount) {
                filterCounter.textContent = totalCount;
                filterCounter.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                filterCounter.style.borderColor = '#10b981';
            } else {
                filterCounter.textContent = `${count}/${totalCount}`;
                filterCounter.style.background = 'linear-gradient(135deg, #1f2937 0%, #374151 100%)';
                filterCounter.style.borderColor = '#4b5563';
            }
        }
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
        
        const tableColumn = ["Nombre", "Cédula", "Sexo", "Edad", "Teléfono", "UBCH", "Comunidad", "Votó"];
        const tableRows = [];

        this.votes.forEach(vote => {
            tableRows.push([
                vote.name,
                vote.cedula,
                vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'N/A',
                vote.edad || 'N/A',
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
        // Exportar solo los registros filtrados y visibles en la página actual
        const headers = ["Nombre", "Cédula", "Sexo", "Edad", "Teléfono", "UBCH", "Comunidad", "Votó"];
        const totalExport = this.paginatedVotes.length;
        if (totalExport === 0) {
            alert('No hay registros para exportar en la página actual.');
            return;
        }
        if (totalExport > 1000) {
            alert('Por favor, exporta menos de 1000 registros a la vez para evitar bloqueos del navegador. Usa la paginación o filtros.');
            return;
        }
        const csvRows = [
            headers.join(';'),
            ...this.paginatedVotes.map(vote => [
                `"${(vote.name || '').replace(/"/g, '""')}"`,
                `"${(vote.cedula || '').replace(/"/g, '""')}"`,
                `"${vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'N/A'}"`,
                `"${vote.edad || 'N/A'}"`,
                `"${(vote.telefono || '').replace(/"/g, '""')}"`,
                `"${(vote.ubch || '').replace(/"/g, '""')}"`,
                `"${(vote.community || '').replace(/"/g, '""')}"`,
                `"${vote.voted ? 'Sí' : 'No'}"`
            ].join(';'))
        ];
        const csvString = csvRows.join('\r\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `listado_registros-pagina${this.currentPage}-${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.csv`);
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

function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = 'login.html';
  });
}

if (typeof window !== 'undefined') {
    window.votingSystem = new VotingSystem();
}

// Forzar actualización del favicon
function forceFaviconUpdate() {
    const timestamp = new Date().getTime();
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
        favicon.href = `favicon.ico/favicon.ico?v=${timestamp}`;
    }
    
    // Limpiar caché del navegador para favicon
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                if (name.includes('favicon') || name.includes('icon')) {
                    caches.delete(name);
                }
            });
        });
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    forceFaviconUpdate();
    
    // También forzar actualización después de un breve delay
    setTimeout(forceFaviconUpdate, 1000);
});