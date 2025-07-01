// Sistema de Registro de Votos 2025 - JavaScript Vanilla con Cache Local y Sincronización Inteligente

class VotingSystem {
    constructor() {
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
        this.pageSize = 50;
        this.totalPages = 1;
        this.paginatedVotes = [];
        this.lastVisibleDoc = null; // Para paginación de Firestore
        this.pageCursors = [null]; // Almacena el cursor del inicio de cada página
        
        // Listener global para sincronización en tiempo real de votos
        window.addEventListener('votesDataUpdated', (event) => {
            // Con la paginación del servidor, la actualización en tiempo real es más compleja.
            // Por ahora, recargaremos la página actual para reflejar los cambios.
            console.log('🔄 Datos de votos actualizados, recargando vista...');
            this.loadVotesPage(this.currentPage);
        });
        
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

        // Validación de duplicados en frontend
        const isDuplicate = this.votes.some(vote => vote.cedula === registrationData.cedula);
        if (isDuplicate) {
            throw new Error('Esta cédula ya está registrada');
        }

        // Validación de duplicados en Firebase
        if (window.firebaseDB && window.firebaseDB.firebaseSyncManager) {
            try {
                const exists = await window.firebaseDB.firebaseSyncManager.existsVoteByCedula(registrationData.cedula);
                if (exists) {
                    throw new Error('Esta cédula ya está registrada en la base de datos');
                }
            } catch (firebaseError) {
                throw new Error(firebaseError.message || 'Error validando duplicados en Firebase');
            }
        }

        // Crear nuevo registro
        const newVote = {
            id: Date.now() + Math.random(),
            ...registrationData,
            registeredAt: new Date().toISOString(),
            registeredBy: this.currentUser.username,
            voted: false
        };

        // Prioridad 1: Usar Firebase SyncManager si está disponible
        if (window.firebaseDB && window.firebaseDB.firebaseSyncManager) {
            try {
                console.log('🚀 Guardando registro en Firebase...');
                const firebaseId = await window.firebaseDB.firebaseSyncManager.saveVote(newVote);
                newVote.id = firebaseId;
                this.votes.push(newVote);
                console.log('✅ Registro guardado en Firebase exitosamente');
                return newVote;
            } catch (firebaseError) {
                console.warn('⚠️ Error guardando en Firebase, usando método tradicional:', firebaseError);
            }
        }
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
        // Cargar datos de Firebase y configuraciones locales
        await this.loadData();
        
        // Cargar votos desde el respaldo local de Firebase si existen
        const votesData = localStorage.getItem('votesData');
        if (votesData) {
            this.votes = JSON.parse(votesData);
        } else {
            // Si no hay nada en local, intentar cargar la primera página desde Firestore
            this.loadVotesPage(1);
        }

        // Configurar listeners de Firebase en tiempo real
        this.setupFirebaseListeners();

        this.setupEventListeners();
        this.renderCurrentPage();
        this.loadPdfLibraries();
        this.displayUserInfo();
        this.updateSyncStatus('Conectado a Firebase', 'success');
    }

    // Mostrar información del usuario
    displayUserInfo() {
        const userInfo = document.getElementById('userId');
        if (userInfo && this.currentUser) {
            userInfo.textContent = `${this.currentUser.username} (${this.currentUser.rol})`;
        }
    }

    // Actualizar estado de sincronización
    updateSyncStatus(message, type) {
        const syncIndicator = document.getElementById('sync-indicator');
        const syncText = document.getElementById('sync-text');
        const syncSpinner = document.getElementById('sync-spinner');
        const syncCheck = document.getElementById('sync-check');
        
        if (!syncIndicator) return;
        
            // Método tradicional
            syncIndicator.textContent = type === 'success' ? '✅' : '❌';
            syncIndicator.className = `sync-indicator ${type}`;
            syncText.textContent = message;
            syncText.className = `sync-text ${type}`;
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    async loadData() {
        try {
            // Cargar datos de UBCH y comunidades desde Firebase
            await this.loadUBCHDataFromAdmin();
            
            // Cargar votos desde Firebase
            if (window.firebaseDB && window.firebaseDB.firebaseSyncManager) {
                try {
                    console.log('📥 Cargando votos desde Firebase...');
                    const firebaseVotes = await window.firebaseDB.firebaseSyncManager.loadVotesFromFirebase();
                    this.votes = firebaseVotes;
                    console.log(`✅ Votos cargados desde Firebase: ${this.votes.length} registros`);
                } catch (firebaseError) {
                    console.warn('⚠️ Error cargando votos desde Firebase, usando localStorage:', firebaseError);
                    // Fallback a localStorage
                    const votesData = localStorage.getItem('votesData');
                    this.votes = votesData ? JSON.parse(votesData) : [];
                }
            } else {
                // Fallback a localStorage si Firebase no está disponible
                const votesData = localStorage.getItem('votesData');
                this.votes = votesData ? JSON.parse(votesData) : [];
            }
            
            // Cargar configuración de UBCH (mantener compatibilidad)
            const savedUbchData = localStorage.getItem('ubchToCommunityMap');
            this.ubchToCommunityMap = savedUbchData ? JSON.parse(savedUbchData) : this.ubchToCommunityMap;
            
            console.log('✅ Datos cargados exitosamente');
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.showMessage('Error cargando datos', 'error', 'registration');
        }
    }

    // Nueva función para cargar datos de UBCH desde la página de administración
    async loadUBCHDataFromAdmin() {
        try {
            console.log('🔄 Cargando datos de UBCH...');
            
            // Prioridad 1: Intentar cargar desde Firebase en tiempo real
            if (window.firebaseDB && window.firebaseDB.firebaseSyncManager) {
                try {
                    // Verificar si ya tenemos datos sincronizados
                    const ubchData = localStorage.getItem('ubchData');
                    const communitiesData = localStorage.getItem('communitiesData');
                    
                    if (ubchData && communitiesData) {
                        const ubchList = JSON.parse(ubchData);
                        const communityList = JSON.parse(communitiesData);
                        
                        // Convertir formato Firebase al formato del sistema
                        const newUbchToCommunityMap = {};
                        
                        ubchList.forEach(ubch => {
                            const communitiesForUbch = communityList
                                .filter(community => community.ubchId === ubch.id)
                                .map(community => community.name);
                            
                            if (communitiesForUbch.length > 0) {
                                newUbchToCommunityMap[ubch.name] = communitiesForUbch;
                            }
                        });
                        
                        // Actualizar el mapa si hay datos válidos
                        if (Object.keys(newUbchToCommunityMap).length > 0) {
                            this.ubchToCommunityMap = newUbchToCommunityMap;
                            console.log('✅ Datos de UBCH cargados desde Firebase:', this.ubchToCommunityMap);
                            return;
                        }
                    }
                    
                    // Si no hay datos en localStorage, cargar desde Firebase
                    console.log('📥 Cargando datos desde Firebase...');
                    const firebaseUbchData = await window.firebaseDB.firebaseSyncManager.loadUBCHFromFirebase();
                    const firebaseCommunitiesData = await window.firebaseDB.firebaseSyncManager.loadCommunitiesFromFirebase();
                    
                    if (firebaseUbchData.length > 0 && firebaseCommunitiesData.length > 0) {
                        const newUbchToCommunityMap = {};
                        
                        firebaseUbchData.forEach(ubch => {
                            const communitiesForUbch = firebaseCommunitiesData
                                .filter(community => community.ubchId === ubch.id)
                                .map(community => community.name);
                            
                            if (communitiesForUbch.length > 0) {
                                newUbchToCommunityMap[ubch.name] = communitiesForUbch;
                            }
                        });
                        
                        if (Object.keys(newUbchToCommunityMap).length > 0) {
                            this.ubchToCommunityMap = newUbchToCommunityMap;
                            console.log('✅ Datos de UBCH cargados desde Firebase:', this.ubchToCommunityMap);
                            return;
                        }
                    }
                    
                } catch (firebaseError) {
                    console.warn('⚠️ Error cargando desde Firebase, intentando localStorage:', firebaseError);
                }
            }
            
            // Prioridad 2: Intentar cargar datos de la página de administración (localStorage)
            const ubchData = localStorage.getItem('ubchData');
            const communityData = localStorage.getItem('communityData');
            
            if (ubchData && communityData) {
                const ubchList = JSON.parse(ubchData);
                const communityList = JSON.parse(communityData);
                
                // Convertir el formato de la página de administración al formato del sistema principal
                const newUbchToCommunityMap = {};
                
                ubchList.forEach(ubch => {
                    const communitiesForUbch = communityList
                        .filter(community => community.ubchId === ubch.id)
                        .map(community => community.name);
                    
                    if (communitiesForUbch.length > 0) {
                        newUbchToCommunityMap[ubch.name] = communitiesForUbch;
                    }
                });
                
                // Actualizar el mapa solo si hay datos válidos
                if (Object.keys(newUbchToCommunityMap).length > 0) {
                    this.ubchToCommunityMap = newUbchToCommunityMap;
                    console.log('✅ Datos de UBCH cargados desde localStorage:', this.ubchToCommunityMap);
                } else {
                    console.log('⚠️ No se encontraron datos válidos de UBCH, usando datos por defecto');
                }
            } else {
                console.log('⚠️ No se encontraron datos de UBCH, usando datos por defecto');
            }
            
            // Configurar listeners para cambios en tiempo real
            this.setupRealTimeListeners();
            
        } catch (error) {
            console.error('❌ Error cargando datos de UBCH:', error);
            // Mantener datos por defecto en caso de error
        }
    }

    // Configurar listeners de Firebase en tiempo real
    setupFirebaseListeners() {
        if (window.firebaseDB && window.firebaseDB.firebaseSyncManager) {
            try {
                console.log('🔄 Configurando listeners de Firebase...');
                
                // Iniciar sincronización en tiempo real
                window.firebaseDB.firebaseSyncManager.syncUBCHRealTime();
                window.firebaseDB.firebaseSyncManager.syncCommunitiesRealTime();
                window.firebaseDB.firebaseSyncManager.syncVotesRealTime();
                
                // Configurar listeners para eventos
                window.addEventListener('ubchDataUpdated', (event) => {
                    console.log('🔄 Datos de UBCH actualizados en tiempo real:', event.detail);
                    this.handleUBCHDataUpdate(event.detail.data);
                });
                
                window.addEventListener('communitiesDataUpdated', (event) => {
                    console.log('🔄 Datos de Comunidades actualizados en tiempo real:', event.detail);
                    this.handleCommunitiesDataUpdate(event.detail.data);
                });
                
                window.addEventListener('votesDataUpdated', (event) => {
                    console.log('🔄 Datos de Votos actualizados en tiempo real:', event.detail);
                    this.handleVotesDataUpdate(event.detail.data);
                });
                
                window.addEventListener('voteDeleted', (event) => {
                    console.log('🗑️ Voto eliminado en tiempo real:', event.detail);
                    this.handleVoteDeleted(event.detail.voteId);
                });
                
                console.log('✅ Listeners de Firebase configurados correctamente');
            } catch (error) {
                console.error('❌ Error configurando listeners de Firebase:', error);
            }
        } else {
            console.warn('⚠️ Firebase no disponible para configurar listeners');
        }
    }

    // Configurar listeners para cambios en tiempo real (mantener compatibilidad)
    setupRealTimeListeners() {
        // Esta función ahora llama a setupFirebaseListeners
        this.setupFirebaseListeners();
    }

    // Manejar actualización de datos UBCH
    handleUBCHDataUpdate(ubchData) {
        try {
            const communitiesData = JSON.parse(localStorage.getItem('communitiesData') || '[]');
            
            if (ubchData.length > 0 && communitiesData.length > 0) {
                const newUbchToCommunityMap = {};
                
                ubchData.forEach(ubch => {
                    const communitiesForUbch = communitiesData
                        .filter(community => community.ubchId === ubch.id)
                        .map(community => community.name);
                    
                    if (communitiesForUbch.length > 0) {
                        newUbchToCommunityMap[ubch.name] = communitiesForUbch;
                    }
                });
                
                if (Object.keys(newUbchToCommunityMap).length > 0) {
                    this.ubchToCommunityMap = newUbchToCommunityMap;
                    console.log('✅ Mapa UBCH actualizado en tiempo real:', this.ubchToCommunityMap);
                    
                    // Actualizar interfaz si estamos en la página de registro
                    if (this.currentPage === 'registration') {
                        this.renderRegistrationPage();
                    }
                    
                    // Actualizar filtros si estamos en la página de listado
                    if (this.currentPage === 'listado') {
                        this.populateUBCHFilter();
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error actualizando datos UBCH:', error);
        }
    }

    // Manejar actualización de datos de Comunidades
    handleCommunitiesDataUpdate(communitiesData) {
        try {
            const ubchData = JSON.parse(localStorage.getItem('ubchData') || '[]');
            
            if (communitiesData.length > 0 && ubchData.length > 0) {
                const newUbchToCommunityMap = {};
                
                ubchData.forEach(ubch => {
                    const communitiesForUbch = communitiesData
                        .filter(community => community.ubchId === ubch.id)
                        .map(community => community.name);
                    
                    if (communitiesForUbch.length > 0) {
                        newUbchToCommunityMap[ubch.name] = communitiesForUbch;
                    }
                });
                
                if (Object.keys(newUbchToCommunityMap).length > 0) {
                    this.ubchToCommunityMap = newUbchToCommunityMap;
                    console.log('✅ Mapa UBCH actualizado por cambios en comunidades:', this.ubchToCommunityMap);
                    
                    // Actualizar interfaz si estamos en la página de registro
                    if (this.currentPage === 'registration') {
                        this.renderRegistrationPage();
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error actualizando datos de comunidades:', error);
        }
    }

    // Manejar actualización de datos de votos
    handleVotesDataUpdate(votesData) {
        try {
            this.votes = votesData;
            localStorage.setItem('votesData', JSON.stringify(this.votes));
            console.log('✅ Lista de votos actualizada en tiempo real:', this.votes.length, 'registros');
            // Siempre renderizar la lista completa sin paginación
            if (this.currentPage === 'listado') {
                this.renderVotesTable(true); // true = sin paginación
            } else if (this.currentPage === 'dashboard') {
                this.renderDashboardPage();
            } else if (this.currentPage === 'statistics') {
                this.renderStatisticsPage();
            }
        } catch (error) {
            console.error('❌ Error manejando actualización de votos:', error);
        }
    }

    // Manejar eliminación de votos en tiempo real
    handleVoteDeleted(voteId) {
        try {
            console.log('🗑️ Procesando eliminación de voto:', voteId);
            
            // Eliminar de la lista local
            this.votes = this.votes.filter(vote => vote.id !== voteId);
            
            // Actualizar localStorage
            localStorage.setItem('votesData', JSON.stringify(this.votes));
            
            // Actualizar interfaz según la página actual
            if (this.currentPage === 'listado') {
                this.renderVotesTable();
            } else if (this.currentPage === 'dashboard') {
                this.renderDashboardPage();
            } else if (this.currentPage === 'statistics') {
                this.renderStatisticsPage();
            }
            
            console.log('✅ Voto eliminado de la interfaz local');
            
        } catch (error) {
            console.error('❌ Error procesando eliminación de voto:', error);
        }
    }

    loadFromLocalStorage() {
        // Solo respaldo offline
        const savedUbchData = localStorage.getItem('ubchToCommunityMap');
        this.ubchToCommunityMap = savedUbchData ? JSON.parse(savedUbchData) : this.ubchToCommunityMap;
        this.votes = JSON.parse(localStorage.getItem('votesData')) || [];
        this.candidates = JSON.parse(localStorage.getItem('candidates')) || [];
    }

    async saveData() {
        if (this.useLocalStorage) {
            // Solo respaldo offline
            localStorage.setItem('ubchToCommunityMap', JSON.stringify(this.ubchToCommunityMap));
            localStorage.setItem('votesData', JSON.stringify(this.votes));
            localStorage.setItem('candidates', JSON.stringify(this.candidates));
        } else {
            // No guardar en backend local ni usar SyncManager
            // Firebase maneja la persistencia
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

        // Formulario de edición
        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditSubmit(e);
        });

        // Cambio de UBCH
        document.getElementById('ubch').addEventListener('change', (e) => {
            this.handleUBCHChange(e.target.value);
        });

        // Cambio de UBCH en formulario de edición
        document.getElementById('edit-ubch').addEventListener('change', (e) => {
            this.handleEditUBCHChange(e.target.value);
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

        // Botones del modal de edición
        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.closeEditModal();
        });

        // Cerrar modales al hacer clic fuera de ellos
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
                if (e.target.id === 'delete-modal') {
                    this.closeDeleteModal();
                } else if (e.target.id === 'edit-modal') {
                    this.closeEditModal();
                }
            }
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

    handleEditUBCHChange(selectedUBCH) {
        const communitySelect = document.getElementById('edit-community');
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
                    <p>UBCH: ${person.ubch}</p>
                </div>
                <button id="confirm-vote-${person.id}" class="btn btn-success" onclick="votingSystem.confirmVote('${person.id}')">
                    <span class="btn-text">Confirmar Voto</span>
                    <span class="btn-loading" style="display: none;">Confirmando...</span>
                </button>
            `;
            container.appendChild(div);
        });
    }

    async confirmVote(personId) {
        const confirmBtn = document.getElementById(`confirm-vote-${personId}`);
        if(confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.querySelector('.btn-text').style.display = 'none';
            confirmBtn.querySelector('.btn-loading').style.display = 'inline-block';
        }

        try {
            const person = this.votes.find(v => v.id === personId);
            if (!person) {
                this.showMessage('Persona no encontrada', 'error', 'check-in');
                return;
            }

            // Actualizar datos del voto
            person.voted = true;
            person.voteTimestamp = new Date().toISOString();
            person.updatedAt = new Date().toISOString();
            person.updatedBy = this.currentUser.username;

            // Prioridad 1: Actualizar en Firebase si está disponible
            if (window.firebaseDB && window.firebaseDB.firebaseSyncManager) {
                try {
                    console.log('✅ Confirmando voto en Firebase...');
                    await window.firebaseDB.firebaseSyncManager.saveVote(person);
                    console.log('✅ Voto confirmado en Firebase exitosamente');
                } catch (firebaseError) {
                    console.warn('⚠️ Error confirmando voto en Firebase, usando método tradicional:', firebaseError);
                    // Fallback al método tradicional
                }
            }

            // Guardar en localStorage como respaldo
            await this.saveData();
            
            // Mostrar mensaje de éxito
            this.showMessage('¡Voto confirmado con éxito!', 'success', 'check-in');
            
            // Limpiar formulario de búsqueda
            document.getElementById('cedula-search').value = '';
            document.getElementById('search-results').innerHTML = '';
            
        } catch (error) {
            console.error('Error al confirmar voto:', error);
            this.showMessage('Error al confirmar el voto. Inténtalo de nuevo.', 'error', 'check-in');
            // Rehabilitar el botón en caso de error
            if(confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.querySelector('.btn-text').style.display = 'inline';
                confirmBtn.querySelector('.btn-loading').style.display = 'none';
            }
        }
    }

    renderListPage() {
        this.currentPage = 1;
        this.pageCursors = [null]; // Reiniciar cursores
        this.loadVotesPage(1); // Cargar la primera página desde Firestore
    }

    async loadVotesPage(pageNumber) {
        this.setLoadingState('listado', true);
        try {
            const cursor = this.pageCursors[pageNumber - 1];
            const { votes, lastDoc } = await window.firebaseDB.firebaseSyncManager.getVotesPage(this.pageSize, cursor);

            if (votes.length > 0) {
                this.paginatedVotes = votes;
                this.currentPage = pageNumber;
                
                // Guardar el cursor para la *siguiente* página, si no existe ya
                if (lastDoc && this.pageCursors.length === pageNumber) {
                    this.pageCursors.push(lastDoc);
                }
            } else if (pageNumber > 1) {
                // Si pedimos una página que no existe (y no es la primera), no hacemos nada.
                console.log("No hay más registros.");
                return;
            } else {
                // Si la primera página está vacía
                this.paginatedVotes = [];
            }

            this.renderVotesTable();

        } catch (error) {
            console.error('Error cargando la página de votos:', error);
            this.showMessage('Error al cargar registros.', 'error', 'listado');
        } finally {
            this.setLoadingState('listado', false);
        }
    }

    renderVotesTable(noPagination = false) {
        const tableBody = document.getElementById('votes-table-body');
        if (!tableBody) return;
        // Calcular los registros a mostrar según la página actual
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const votesToShow = this.votes.slice(start, end);
        tableBody.innerHTML = '';
        votesToShow.forEach(vote => {
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
                    <button class="btn btn-primary btn-small" onclick="votingSystem.editVote('${vote.id}')">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-danger btn-small" onclick="votingSystem.deleteVote('${vote.id}')">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }
    
    renderPaginationControls(hasNextPage) {
        const container = document.getElementById('pagination-controls');
        if (!container) return;
        container.innerHTML = '';

        const hasPreviousPage = this.currentPage > 1;
        const hasMoreData = this.paginatedVotes.length === this.pageSize;

        // Botón Anterior
        const btnPrev = document.createElement('button');
        btnPrev.textContent = '‹ Anterior';
        btnPrev.disabled = !hasPreviousPage;
        btnPrev.onclick = () => {
            if (this.currentPage > 1) {
                this.loadVotesPage(this.currentPage - 1);
            }
        };

        // Info de página
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Página ${this.currentPage}`;

        // Botón Siguiente
        const btnNext = document.createElement('button');
        btnNext.textContent = 'Siguiente ›';
        btnNext.disabled = !hasMoreData;
        btnNext.onclick = () => {
            this.loadVotesPage(this.currentPage + 1);
        };
        
        container.appendChild(btnPrev);
        container.appendChild(pageInfo);
        container.appendChild(btnNext);
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
                    <button class="btn btn-primary btn-small" onclick="votingSystem.editVote('${vote.id}')">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-danger btn-small" onclick="votingSystem.deleteVote('${vote.id}')">
                        🗑️ Eliminar
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
        this.setLoadingState('delete-modal', true); // Deshabilitar botón

        try {
            // Prioridad 1: Eliminar de Firebase si está disponible
            if (window.firebaseDB && window.firebaseDB.firebaseSyncManager) {
                try {
                    console.log('🗑️ Eliminando registro de Firebase...');
                    await window.firebaseDB.firebaseSyncManager.deleteVote(this.voteToDelete);
                    console.log('✅ Registro eliminado de Firebase exitosamente');
                    
                    // Esperar un momento para que Firebase procese la eliminación
                    await this.delay(500);
                    
                    // La interfaz se actualizará automáticamente por el listener de Firebase
                    this.closeDeleteModal();
                    this.showMessage('Registro eliminado correctamente', 'success', 'listado');
                    return;
                    
                } catch (firebaseError) {
                    console.warn('⚠️ Error eliminando de Firebase, usando método tradicional:', firebaseError);
                    // Fallback al método tradicional
                }
            }

            // Fallback: Eliminar de la lista local
            this.votes = this.votes.filter(vote => vote.id !== this.voteToDelete);
            
            // Guardar en localStorage como respaldo
            await this.saveData();
            
            // Actualizar interfaz
            this.renderVotesTable();
            this.closeDeleteModal();
            
            // Mostrar mensaje de éxito
            this.showMessage('Registro eliminado correctamente', 'success', 'listado');
            
        } catch (error) {
            console.error('Error al eliminar:', error);
            this.showMessage('Error al eliminar el registro: ' + error.message, 'error', 'listado');
        } finally {
            this.setLoadingState('delete-modal', false); // Rehabilitar botón
        }
    }

    // Funciones de edición
    editVote(voteId) {
        // Encontrar el registro a editar
        const vote = this.votes.find(v => v.id === voteId);
        if (!vote) {
            this.showMessage('Registro no encontrado', 'error', 'listado');
            return;
        }

        // Guardar el ID del registro que se está editando
        this.voteToEdit = voteId;

        // Llenar el formulario con los datos actuales
        this.populateEditForm(vote);

        // Mostrar el modal de edición
        document.getElementById('edit-modal').style.display = 'flex';
    }

    populateEditForm(vote) {
        // Llenar los campos del formulario
        document.getElementById('edit-name').value = vote.name || '';
        document.getElementById('edit-cedula').value = vote.cedula || '';
        document.getElementById('edit-telefono').value = vote.telefono || '';
        document.getElementById('edit-sexo').value = vote.sexo || '';
        document.getElementById('edit-edad').value = vote.edad || '';

        // Configurar UBCH y comunidad
        this.populateEditUBCH(vote.ubch, vote.community);
    }

    populateEditUBCH(selectedUBCH, selectedCommunity) {
        const ubchSelect = document.getElementById('edit-ubch');
        const communitySelect = document.getElementById('edit-community');

        // Limpiar opciones existentes
        ubchSelect.innerHTML = '<option value="">Selecciona una UBCH</option>';
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';

        // Agregar opciones de UBCH
        Object.keys(this.ubchToCommunityMap).forEach(ubch => {
            const option = document.createElement('option');
            option.value = ubch;
            option.textContent = ubch;
            if (ubch === selectedUBCH) {
                option.selected = true;
            }
            ubchSelect.appendChild(option);
        });

        // Configurar comunidades si hay UBCH seleccionada
        if (selectedUBCH && this.ubchToCommunityMap[selectedUBCH]) {
            communitySelect.disabled = false;
            this.ubchToCommunityMap[selectedUBCH].forEach(community => {
                const option = document.createElement('option');
                option.value = community;
                option.textContent = community;
                if (community === selectedCommunity) {
                    option.selected = true;
                }
                communitySelect.appendChild(option);
            });
        } else {
            communitySelect.disabled = true;
        }
    }

    closeEditModal() {
        document.getElementById('edit-modal').style.display = 'none';
        this.voteToEdit = null;
        
        // Limpiar el formulario
        document.getElementById('edit-form').reset();
    }

    async handleEditSubmit(event) {
        event.preventDefault();
        this.setLoadingState('edit-modal', true); // Deshabilitar botón

        if (!this.voteToEdit) {
            this.showMessage('Error: No hay registro seleccionado para editar', 'error', 'listado');
            return;
        }

        // Obtener los datos del formulario
        const formData = new FormData(event.target);
        const editData = {
            name: formData.get('name'),
            cedula: formData.get('cedula'),
            telefono: formData.get('telefono'),
            sexo: formData.get('sexo'),
            edad: parseInt(formData.get('edad')),
            ubch: formData.get('ubch'),
            community: formData.get('community')
        };

        // Validar los datos
        const validation = this.validateRegistrationData(editData);
        if (!validation.isValid) {
            this.showMessage(validation.message, 'error', 'listado');
            return;
        }

        try {
            // Encontrar el registro a editar
            const voteIndex = this.votes.findIndex(v => v.id === this.voteToEdit);
            if (voteIndex === -1) {
                this.showMessage('Registro no encontrado', 'error', 'listado');
                return;
            }

            // Preparar datos actualizados
            const updatedVote = {
                ...this.votes[voteIndex],
                ...editData,
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentUser.username
            };

            // Actualizar en la lista local
            this.votes[voteIndex] = updatedVote;
            
            // Guardar en localStorage como respaldo
            await this.saveData();
            
            // Cerrar el modal
            this.closeEditModal();
            
            // Actualizar la tabla
            this.renderVotesTable();
            
            // Mostrar mensaje de éxito
            this.showMessage('Registro actualizado correctamente', 'success', 'listado');
            
        } catch (error) {
            console.error('Error al actualizar registro:', error);
            this.showMessage('Error al actualizar el registro: ' + error.message, 'error', 'listado');
        } finally {
            this.setLoadingState('edit-modal', false); // Rehabilitar botón
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

    async renderStatisticsPage() {
        this.setLoadingState('statistics', true); // Mostrar carga
        try {
            const allVotes = await window.firebaseDB.firebaseSyncManager.getAllVotes();
            const votedVotes = allVotes.filter(vote => vote.voted);
            
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

        } catch (error) {
            console.error('Error al renderizar estadísticas:', error);
            this.showMessage('No se pudieron cargar las estadísticas.', 'error', 'statistics');
        } finally {
            this.setLoadingState('statistics', false); // Ocultar carga
        }
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
        const registerBtn = document.getElementById('register-btn');
        const checkInBtn = document.querySelector('#check-in-form button[type="submit"]');
        const listadoTableBody = document.querySelector('#registros-table tbody');
        const saveEditBtn = document.getElementById('save-edit');
        const confirmDeleteBtn = document.getElementById('confirm-delete');
        const statsContainer = document.getElementById('statistics-page');

        // Botón de Registro
        if (page === 'registration' && registerBtn) {
            registerBtn.disabled = loading;
            registerBtn.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
            registerBtn.querySelector('.btn-loading').style.display = loading ? 'inline-block' : 'none';
        }

        // Botón de Búsqueda en Check-in
        if (page === 'check-in' && checkInBtn) {
            checkInBtn.disabled = loading;
            checkInBtn.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
            checkInBtn.querySelector('.btn-loading').style.display = loading ? 'inline-block' : 'none';
        }
        
        // Tabla de Listado
        if (page === 'listado' && listadoTableBody) {
            if (loading) {
                listadoTableBody.innerHTML = '<tr><td colspan="8" class="loading-message">Cargando registros...</td></tr>';
            } else if (listadoTableBody.querySelector('.loading-message')) {
                // No limpiar aquí, renderVotesTable lo hará
            }
        }

        // Botón de Guardar en Modal de Edición
        if (page === 'edit-modal' && saveEditBtn) {
            saveEditBtn.disabled = loading;
            saveEditBtn.textContent = loading ? 'Guardando...' : 'Guardar Cambios';
        }

        // Botón de Confirmar en Modal de Eliminación
        if (page === 'delete-modal' && confirmDeleteBtn) {
            confirmDeleteBtn.disabled = loading;
            confirmDeleteBtn.textContent = loading ? 'Eliminando...' : 'Confirmar';
        }

        // Página de Estadísticas
        if (page === 'statistics' && statsContainer) {
            if (loading) {
                statsContainer.querySelector('.stats-grid').style.display = 'none';
                // Opcional: Mostrar un spinner
                let loader = statsContainer.querySelector('.loading-message');
                if (!loader) {
                    loader = document.createElement('div');
                    loader.className = 'loading-message';
                    loader.textContent = 'Calculando estadísticas...';
                    statsContainer.appendChild(loader);
                }
                loader.style.display = 'block';
            } else {
                statsContainer.querySelector('.stats-grid').style.display = 'grid';
                const loader = statsContainer.querySelector('.loading-message');
                if (loader) {
                    loader.style.display = 'none';
                }
            }
        }
    }

    showMessage(message, type, page) {
        const messageDiv = document.getElementById(`${page}-message`);
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `message ${type}`;
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        } else {
            // Fallback: mostrar alerta si el div no existe
            alert(message);
        }
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