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

// Clase base para el sistema de votos
class VotingSystem {
    constructor() {
        this.currentPage = 'registration';
        this.votes = [];
        this.candidates = [];
        this.pdfLibrariesReady = false;
        this.projectionInterval = null;
    }

    // Métodos base que pueden ser sobrescritos
    async init() {
        console.log('🔍 Iniciando sistema de votos...');
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
    }

    renderCurrentPage() {
        console.log('📄 Renderizando página actual...');
    }

    showMessage(message, type, page) {
        console.log(`💬 [${type}] ${message}`);
    }

    setLoadingState(page, loading) {
        console.log(`⏳ [${page}] Loading: ${loading}`);
    }
}

class VotingSystemFirebase extends VotingSystem {
    constructor() {
        // Llamar al constructor de la clase padre PRIMERO
        super();
        
        // Evitar múltiples instancias del sistema
        if (window.votingSystem && window.votingSystem !== this) {
            console.log('⚠️ Sistema ya inicializado, evitando duplicación');
            return;
        }
        
        // Inicializar propiedades específicas de Firebase
        this.userId = null;
        this.registrationQueue = [];
        this.isProcessingQueue = false;
        this.concurrentRegistrations = 0;
        this.maxConcurrentRegistrations = 3;
        this.searchTimeout = null;
        this.cache = new Map();
        this.voteToDelete = null;
        this.voteToEdit = null;
        
        // Asegurar que ubchToCommunityMap sea un objeto (no Map)
        this.ubchToCommunityMap = {};
        
        // Marcar como inicializado
        window.votingSystemInitialized = true;
        window.votingSystem = this;
        
        // Nuevas propiedades para mejoras del listado
        this.currentPage = 1;
        this.pageSize = 20;
        this.filteredVotes = [];
        this.selectedVotes = [];
        this.currentSearchTerm = '';
        this.currentSortField = null;
        this.currentSortDirection = 'asc';
        this.currentDetailVote = null;
        
        console.log('✅ Instancia de VotingSystemFirebase creada correctamente');
        
        this.init();
    }

    async init() {
        console.log('🔄 Inicializando VotingSystemFirebase...');
        
        // Verificar usuario actual y establecer página inicial según rol
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            if (currentUser.rol === 'verificador') {
                this.currentPage = 'check-in';
            } else if (currentUser.rol === 'registrador') {
                this.currentPage = 'registration';
            }
        }
            
            // Cargar datos desde Firebase
            await this.loadDataFromFirebase();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Configurar navegación según rol
        this.setupNavigationByRole();
        
        // Renderizar página inicial
        this.renderCurrentPage();
        
        // Inicializar sistema offline
        this.inicializarSistemaOffline();
        
        console.log('✅ VotingSystemFirebase inicializado correctamente');
    }

    async loadDataFromFirebase() {
        try {
            // Evitar múltiples cargas simultáneas
            if (this.isLoadingData) {
                console.log('⚠️ Carga de datos en progreso, evitando duplicación');
                return;
            }
            
            this.isLoadingData = true;
            console.log('📥 Cargando datos desde Firebase...');
            
            // Verificar si Firebase está disponible
            if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
                console.log('⚠️ Firebase no disponible, cargando datos locales');
                this.isLoadingData = false;
                return this.loadDataLocally();
            }
            
            // Cargar votos desde Firebase
            const votesSnapshot = await window.firebaseDB.votesCollection.get();
            this.votes = votesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`✅ ${this.votes.length} votos cargados desde Firebase`);

            // Cargar configuración UBCH desde Firebase (solo una vez)
            if (!this.ubchConfigLoaded) {
            try {
            const ubchSnapshot = await window.firebaseDB.ubchCollection.doc('config').get();
            if (ubchSnapshot.exists) {
                this.ubchToCommunityMap = ubchSnapshot.data().mapping;
                    console.log('✅ Configuración UBCH cargada desde Firebase');
                } else {
                    // Si no existe en Firebase, usar configuración por defecto
                    console.log('⚠️ No se encontró configuración UBCH en Firebase, usando configuración por defecto');
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
                    
                    // Guardar configuración por defecto en Firebase para futuras cargas
                    await this.saveUBCHConfigToFirebase();
                }
                    
                    // Calcular estadísticas claras
                    const totalUBCH = Object.keys(this.ubchToCommunityMap).length;
                    const todasLasComunidades = Object.values(this.ubchToCommunityMap).flat();
                    const comunidadesUnicas = [...new Set(todasLasComunidades)];
                    
                    console.log(`📊 Configuración UBCH: ${totalUBCH} centros de votación, ${comunidadesUnicas.length} comunidades únicas`);
                    console.log(`📋 Lista única de comunidades: (${comunidadesUnicas.length}) [${comunidadesUnicas.join(', ')}]`);
                    
                    this.ubchConfigLoaded = true;
                    
            } catch (error) {
                console.error('❌ Error cargando configuración UBCH:', error);
                // Usar configuración por defecto en caso de error
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

    // Método de fallback para cargar datos locales
    loadDataLocally() {
        try {
            console.log('📥 Cargando datos locales...');
            
            // Cargar votos locales desde localStorage
            const localVotes = localStorage.getItem('localVotes');
            if (localVotes) {
                this.votes = JSON.parse(localVotes);
                console.log(`✅ ${this.votes.length} votos cargados desde localStorage`);
            } else {
                this.votes = [];
                console.log('✅ No hay votos locales, iniciando con lista vacía');
            }
            
            // Usar configuración UBCH por defecto
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

    // Guardar configuración UBCH en Firebase
    async saveUBCHConfigToFirebase() {
        try {
            await window.firebaseDB.ubchCollection.doc('config').set({
                mapping: this.ubchToCommunityMap,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Configuración UBCH guardada en Firebase');
        } catch (error) {
            console.error('❌ Error guardando configuración UBCH:', error);
        }
    }

    setupRealtimeListener() {
        console.log('🔄 Configurando listener en tiempo real...');
        
        // Escuchar cambios en tiempo real
        const unsubscribe = window.firebaseDB.votesCollection.onSnapshot((snapshot) => {
            console.log('📡 Cambio detectado en Firebase:', snapshot.docs.length, 'registros');
            
            // Actualizar datos locales
            this.votes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('✅ Datos actualizados localmente');
            
            // Actualizar TODAS las páginas que muestran datos
            this.updateAllDataDisplays();
            
        }, (error) => {
            console.error('❌ Error en listener de Firebase:', error);
            this.showMessage('Error de sincronización. Reintentando...', 'error', 'registration');
        });
        
        // Guardar la función de unsubscribe para limpiar después
        this.unsubscribeListener = unsubscribe;
        console.log('✅ Listener en tiempo real configurado correctamente');
    }

    // Función para actualizar todas las pantallas de datos
    updateAllDataDisplays() {
        console.log('🔄 Actualizando todas las pantallas...');
        
        // Actualizar indicador de sincronización
        this.updateSyncIndicator(true);
        
        // Actualizar contadores en dashboard
        if (this.currentPage === 'dashboard') {
            this.renderDashboardPage();
        }
        
        // Actualizar tabla de listado
        if (this.currentPage === 'listado') {
            this.renderVotesTable();
        }
        
        // Actualizar estadísticas
        if (this.currentPage === 'statistics') {
            this.renderStatisticsPage();
        }
        
        // Actualizar proyección si está activa
        if (document.getElementById('projection-view').style.display !== 'none') {
            this.updateProjection();
        }
        
        // Mostrar notificación de actualización
        this.showRealtimeUpdate('Datos actualizados en tiempo real');
    }

    // Actualizar indicador de sincronización
    updateSyncIndicator(synced = false, error = false) {
        const indicator = document.getElementById('sync-indicator');
        const text = document.getElementById('sync-text');
        const spinner = document.getElementById('sync-spinner');
        const check = document.getElementById('sync-check');
        
        if (error) {
            indicator.textContent = '❌';
            indicator.className = 'sync-indicator error';
            text.textContent = 'Error de conexión';
            text.className = 'sync-text error';
            if (spinner) spinner.style.display = 'none';
            if (check) { check.style.display = 'none'; check.classList.remove('active'); }
        } else if (synced) {
            indicator.textContent = '';
            indicator.className = 'sync-indicator synced';
            text.textContent = 'Sincronizado';
            text.className = 'sync-text synced';
            if (spinner) spinner.style.display = 'none';
            if (check) { check.style.display = 'inline-block'; setTimeout(() => check.classList.add('active'), 50); }
            // Volver a estado de sincronización después de 3 segundos
            setTimeout(() => {
                indicator.textContent = '';
                indicator.className = 'sync-indicator';
                text.textContent = 'Sincronizando';
                text.className = 'sync-text';
                if (spinner) spinner.style.display = 'inline-block';
                if (check) { check.style.display = 'none'; check.classList.remove('active'); }
            }, 3000);
        } else {
            indicator.textContent = '';
            indicator.className = 'sync-indicator';
            text.textContent = 'Sincronizando';
            text.className = 'sync-text';
            if (spinner) spinner.style.display = 'inline-block';
            if (check) { check.style.display = 'none'; check.classList.remove('active'); }
        }
    }

    // Mostrar notificación de actualización en tiempo real
    showRealtimeUpdate(message) {
        // Remover notificación anterior si existe
        const existingNotification = document.querySelector('.realtime-update');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Crear nueva notificación
        const notification = document.createElement('div');
        notification.className = 'realtime-update';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    async saveVoteToFirebase(voteData) {
        try {
            console.log('💾 Guardando en Firebase:', voteData);
            
            // Verificar si Firebase está disponible
            if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
                console.log('⚠️ Firebase no disponible, guardando localmente');
                return this.saveVoteLocally(voteData);
            }
            
            const docRef = await window.firebaseDB.votesCollection.add({
                ...voteData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Datos guardados en Firebase con ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error guardando en Firebase:', error);
            console.log('🔄 Intentando guardar localmente como fallback');
            return this.saveVoteLocally(voteData);
        }
    }

    // Método de fallback para guardar localmente
    saveVoteLocally(voteData) {
        try {
            const localId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const localVote = {
                id: localId,
                ...voteData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isLocal: true
            };
            
            // Agregar a la lista local
            this.votes.push(localVote);
            
            // Guardar en localStorage
            localStorage.setItem('localVotes', JSON.stringify(this.votes.filter(v => v.isLocal)));
            
            console.log('✅ Datos guardados localmente con ID:', localId);
            return localId;
        } catch (error) {
            console.error('❌ Error guardando localmente:', error);
            throw new Error('No se pudo guardar el registro');
        }
    }

    async updateVoteInFirebase(voteId, updateData) {
        try {
            await window.firebaseDB.votesCollection.doc(voteId).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error actualizando en Firebase:', error);
            throw error;
        }
    }

    async deleteVoteFromFirebase(voteId) {
        try {
            await window.firebaseDB.votesCollection.doc(voteId).delete();
        } catch (error) {
            console.error('Error eliminando de Firebase:', error);
            throw error;
        }
    }

    // Resto de métodos igual que el script original...
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    // Método para obtener el usuario actual (compatible con Firebase)
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

    // Método de logout específico para Firebase
    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionTime');
        if (window.location.pathname !== '/login.html') {
            window.location.href = 'login.html';
        }
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

        // Validación inicial (teléfono es opcional)
        if (!name || !cedula || !sexo || !edad || !ubch || !community) {
            this.showMessage('Por favor, completa todos los campos obligatorios.', 'error', 'registration');
            return;
        }

        // Preparar datos
        const registrationData = {
            name,
            cedula: cedula.replace(/\D/g, ''),
            telefono: telefono.replace(/\D/g, ''),
            sexo,
            edad: parseInt(edad),
            ubch,
            community,
            registeredBy: this.getCurrentUser()?.username || this.userId,
            voted: false,
            registeredAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        this.setLoadingState('registration', true);

        try {
            // Usar el sistema de cola offline
            if (window.offlineQueueManager) {
                const registroId = window.offlineQueueManager.guardarEnColaLocal(registrationData);
                
                // Mostrar mensaje de éxito inmediato
                this.showMessage('✅ Registro guardado localmente. Se sincronizará automáticamente cuando haya conexión.', 'success', 'registration');
                
                // Enviar notificación global
                showNotification(`�� Nuevo registro: ${name} en ${community}`, 'info', true);
                
                // Generar mensaje de agradecimiento
            await this.generateThankYouMessage(name, ubch, community);
            
            // Limpiar formulario
            form.reset();
                
                // Actualizar indicador de cola
                const stats = window.offlineQueueManager.obtenerEstadisticasCola();
                window.offlineQueueManager.actualizarIndicadorCola(stats.total);
                
            } else {
                // Fallback al sistema anterior si no está disponible el gestor offline
                console.warn('⚠️ Gestor offline no disponible, usando sistema anterior');
                
                // Intentar guardar directamente en Firebase
                await this.saveVoteToFirebase(registrationData);
                this.showMessage('✅ Registro guardado exitosamente.', 'success', 'registration');
                
                // Enviar notificación global
                showNotification(`👤 Nuevo registro: ${name} en ${community}`, 'success', true);
                
                await this.generateThankYouMessage(name, ubch, community);
                form.reset();
            }
            
        } catch (error) {
            console.error('❌ Error al registrar:', error);
            this.showMessage('Error al registrar persona. Inténtalo de nuevo.', 'error', 'registration');
        } finally {
            this.setLoadingState('registration', false);
        }
    }

    /**
     * Actualizar estado de la cola en la interfaz
     */
    updateQueueStatus() {
        if (!window.queueManager) return;
        
        const stats = window.queueManager.getQueueStats();
        const queueStatusElement = document.getElementById('queue-status');
        
        if (queueStatusElement) {
            if (stats.total > 0) {
                queueStatusElement.innerHTML = `
                    <div class="queue-info">
                        <span class="queue-count">📋 ${stats.total} en cola</span>
                        <span class="queue-status ${stats.isOnline ? 'online' : 'offline'}">
                            ${stats.isOnline ? '🌐 En línea' : '📴 Sin conexión'}
                        </span>
                        ${stats.isProcessing ? '<span class="processing">🔄 Procesando...</span>' : ''}
                    </div>
                `;
                queueStatusElement.style.display = 'block';
            } else {
                queueStatusElement.style.display = 'none';
            }
        }
    }

    async confirmVote(personId) {
        try {
            console.log('✅ Confirmando voto para ID:', personId);
            
            // Verificar que el ID existe en los datos locales
            const vote = this.votes.find(v => v.id === personId);
            if (!vote) {
                console.error('❌ Voto no encontrado localmente con ID:', personId);
                this.showMessage('Error: Voto no encontrado. Intenta buscar nuevamente.', 'error', 'check-in');
                return;
            }
            
            // Verificar que el ID no sea temporal (empiece con 'local_')
            if (personId.startsWith('local_')) {
                console.error('❌ ID temporal detectado:', personId);
                this.showMessage('Error: ID temporal detectado. Intenta buscar nuevamente.', 'error', 'check-in');
                return;
            }
            
            // Actualizar en Firebase
            await this.updateVoteInFirebase(personId, {
                voted: true,
                voteTimestamp: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            // Actualizar localmente también
            const voteIndex = this.votes.findIndex(v => v.id === personId);
            if (voteIndex !== -1) {
                this.votes[voteIndex].voted = true;
                this.votes[voteIndex].voteTimestamp = new Date().toISOString();
            }
            
            this.showMessage('¡Voto confirmado con éxito!', 'success', 'check-in');
            
            // Enviar notificación global
            showNotification(`🎯 Voto confirmado: ${vote.name} en ${vote.community}`, 'success', true);
            
            document.getElementById('cedula-search').value = '';
            document.getElementById('search-results').innerHTML = '';
            
            // Actualizar todas las pantallas que muestran datos
            this.updateAllDataDisplays();
            
        } catch (error) {
            console.error('❌ Error al confirmar voto:', error);
            
            // Si el error es que el documento no existe, intentar sincronizar y buscar nuevamente
            if (error.message && error.message.includes('No document to update')) {
                console.log('🔄 Documento no encontrado, sincronizando datos...');
                this.showMessage('Sincronizando datos...', 'info', 'check-in');
                
                try {
                    await this.loadDataFromFirebase();
                    this.showMessage('Datos sincronizados. Intenta confirmar el voto nuevamente.', 'info', 'check-in');
                } catch (syncError) {
                    console.error('❌ Error sincronizando datos:', syncError);
                    this.showMessage('Error de sincronización. Inténtalo de nuevo.', 'error', 'check-in');
                }
            } else {
            this.showMessage('Error al confirmar el voto. Inténtalo de nuevo.', 'error', 'check-in');
            }
        }
    }

    async confirmDelete() {
        if (!this.voteToDelete) return;
        // Bloquear eliminación de registros locales
        if (this.voteToDelete.startsWith('local_')) {
            this.showMessage('Este registro aún no ha sido sincronizado. Por favor, espera a que se sincronice para poder eliminarlo.', 'warning', 'listado');
            this.closeDeleteModal();
            return;
        }
        try {
            await this.deleteVoteFromFirebase(this.voteToDelete);
            
            // Enviar notificación global
            showNotification(`❌ Registro eliminado del sistema`, 'warning', true);
            
            // Recargar datos desde Firebase para reflejar el cambio
            await this.loadDataFromFirebase();
            this.closeDeleteModal();
        } catch (error) {
            console.error('Error al eliminar:', error);
            this.showMessage('Error al eliminar el registro.', 'error', 'listado');
        }
    }

    // Métodos de renderizado (igual que el original)
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

        // Los selects de comunidad y CV son independientes, no necesitan event listeners de vinculación

        // Botones del modal de eliminación
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

        // Mostrar ID de usuario
        document.getElementById('userId').textContent = this.userId;

        // Listeners para exportar PDF y CSV
        const pdfBtn = document.getElementById('export-pdf-btn');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => this.exportToPDF());
        }
        const csvBtn = document.getElementById('export-csv-btn');
        if (csvBtn) {
            csvBtn.addEventListener('click', () => this.exportToCSVSmart());
        }

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

        // Filtro por Comunidad
        const communityFilterSelect = document.getElementById('community-filter-select');
        if (communityFilterSelect) {
            communityFilterSelect.addEventListener('change', () => {
                this.applyFilters();
            });
        }
    }

    navigateToPage(page) {
        // Verificar permisos según el rol del usuario
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            console.log('Usuario no autenticado');
            return;
        }

        // Control de acceso por rol
        if (currentUser.rol === 'verificador') {
            // Los verificadores solo pueden acceder a la página de confirmación de votos
            if (page !== 'check-in') {
                this.showMessage('No tienes permisos para acceder a esta página.', 'error', 'check-in');
                return;
            }
        } else if (currentUser.rol === 'registrador') {
            // Los registradores solo pueden acceder a la página de registro
            if (page !== 'registration') {
                this.showMessage('No tienes permisos para acceder a esta página.', 'error', 'registration');
                return;
            }
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
                console.log('🔍 DEBUG: Renderizando página de registro...');
                this.renderRegistrationPage();
                break;
            case 'check-in':
                console.log('🔍 DEBUG: Renderizando página de check-in...');
                this.renderCheckInPage();
                break;
            case 'listado':
                console.log('🔍 DEBUG: Renderizando página de listado...');
                this.renderListPage();
                break;
            case 'dashboard':
                console.log('🔍 DEBUG: Renderizando página de dashboard...');
                this.renderDashboardPage();
                break;
            case 'statistics':
                console.log('🔍 DEBUG: Renderizando página de estadísticas...');
                this.renderStatisticsPage();
                break;
            default:
                console.log('🔍 DEBUG: Página no reconocida:', this.currentPage);
        }
    }

    renderRegistrationPage() {
        console.log('🔍 DEBUG: Iniciando renderRegistrationPage...');
        console.log('🔍 DEBUG: this.ubchToCommunityMap:', this.ubchToCommunityMap);
        console.log('🔍 DEBUG: Tipo de ubchToCommunityMap:', typeof this.ubchToCommunityMap);
        console.log('🔍 DEBUG: Keys de ubchToCommunityMap:', Object.keys(this.ubchToCommunityMap));
        
        const ubchSelect = document.getElementById('ubch');
        const communitySelect = document.getElementById('community');
        const form = document.getElementById('registration-form');

        console.log('🔍 DEBUG: Elementos del DOM encontrados:', {
            ubchSelect: !!ubchSelect,
            communitySelect: !!communitySelect,
            form: !!form
        });

        // Limpiar opciones
        ubchSelect.innerHTML = '<option value="">Selecciona un Centro de Votación (CV)</option>';
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';

        // Verificar si hay datos disponibles
        if (!this.ubchToCommunityMap || Object.keys(this.ubchToCommunityMap).length === 0) {
            console.log('⚠️ No hay datos disponibles, intentando recargar...');
            console.log('🔍 DEBUG: ubchToCommunityMap está vacío o no definido');
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
            this.showMessage('Cargando datos...', 'info', 'registration');
            
            // Intentar recargar la configuración
            this.loadDataFromFirebase().then(() => {
                console.log('🔍 DEBUG: Datos recargados, renderizando de nuevo...');
                this.renderRegistrationPage();
            }).catch(error => {
                console.error('❌ Error recargando datos:', error);
                this.showMessage('Error cargando datos. Contacte al administrador.', 'error', 'registration');
            });
            return;
        }

        console.log('🔍 DEBUG: Datos disponibles, procediendo a cargar formulario...');

        // Habilitar formulario
        form.querySelectorAll('input, select, button').forEach(el => el.disabled = false);

        // Cargar todas las comunidades disponibles (sin vinculación)
        const todasLasComunidades = new Set();
        Object.values(this.ubchToCommunityMap).forEach(comunidades => {
            comunidades.forEach(comunidad => todasLasComunidades.add(comunidad));
        });

        console.log('🔍 DEBUG: Comunidades encontradas:', Array.from(todasLasComunidades));

        // Llenar select de comunidades (independiente)
        console.log(`🔄 Cargando ${todasLasComunidades.size} comunidades en el formulario...`);
        console.log('📋 Lista completa de comunidades:', Array.from(todasLasComunidades).sort());
        
        Array.from(todasLasComunidades).sort().forEach(comunidad => {
            const option = document.createElement('option');
            option.value = comunidad;
            option.textContent = comunidad;
            communitySelect.appendChild(option);
        });

        // Llenar select de Centros de Votación (independiente)
        console.log(`🔄 Cargando ${Object.keys(this.ubchToCommunityMap).length} Centros de Votación en el formulario...`);
        Object.keys(this.ubchToCommunityMap).sort().forEach(ubch => {
            const option = document.createElement('option');
            option.value = ubch;
            option.textContent = ubch;
            ubchSelect.appendChild(option);
        });
        
        console.log('✅ Datos cargados correctamente en el formulario');
        console.log(`📊 Resumen: ${todasLasComunidades.size} comunidades, ${Object.keys(this.ubchToCommunityMap).length} centros de votación`);
        this.showMessage(`Formulario listo con ${todasLasComunidades.size} comunidades disponibles`, 'success', 'registration');

        // Inicializar Choices.js para el autocompletado de comunidades
        if (window.initializeChoicesForCommunity) {
            setTimeout(() => {
                window.initializeChoicesForCommunity();
            }, 100);
        }

        // Iniciar sincronización automática si está disponible
        if (window.offlineQueueManager) {
            window.offlineQueueManager.iniciarSincronizacionAutomatica();
        }

        // Actualizar indicadores de estado offline
        this.actualizarIndicadorOffline();
        this.actualizarFormularioOffline();
    }

    // Los selects de comunidad y CV son independientes, no necesitan funciones de vinculación

    // === FUNCIONES PARA SISTEMA OFFLINE ===

    // Actualizar indicador de estado offline en el header
    actualizarIndicadorOffline() {
        const indicator = document.getElementById('offline-indicator');
        if (!indicator) return;

        if (window.offlineQueueManager) {
            const stats = window.offlineQueueManager.obtenerEstadisticasCola();
            
            if (!stats.online) {
                indicator.className = 'offline-indicator show offline';
                indicator.innerHTML = '<span class="offline-icon">📴</span><span class="offline-text">Sin conexión</span>';
            } else {
                indicator.className = 'offline-indicator show online';
                indicator.innerHTML = '<span class="offline-icon">🌐</span><span class="offline-text">En línea</span>';
            }
        }
    }

    // Actualizar clase del formulario según estado de conexión
    actualizarFormularioOffline() {
        const form = document.getElementById('registration-form');
        if (!form) return;

        if (window.offlineQueueManager) {
            const stats = window.offlineQueueManager.obtenerEstadisticasCola();
            
            if (!stats.online) {
                form.classList.add('offline-mode');
            } else {
                form.classList.remove('offline-mode');
            }
        }
    }

    // Inicializar sistema offline
    inicializarSistemaOffline() {
        if (window.offlineQueueManager) {
            // Actualizar indicadores iniciales
            this.actualizarIndicadorOffline();
            this.actualizarFormularioOffline();
            
            // Configurar listeners para cambios de estado
            window.addEventListener('online', () => {
                this.actualizarIndicadorOffline();
                this.actualizarFormularioOffline();
            });
            
            window.addEventListener('offline', () => {
                this.actualizarIndicadorOffline();
                this.actualizarFormularioOffline();
            });
            
            console.log('✅ Sistema offline inicializado correctamente');
        }
    }

    // === FIN FUNCIONES OFFLINE ===

    renderCheckInPage() {
        // La página ya está renderizada en el HTML
    }

    async handleCheckIn() {
        const cedula = document.getElementById('cedula-search').value.trim();
        
        if (!cedula) {
            this.showMessage('Por favor, ingresa un número de cédula para buscar.', 'error', 'check-in');
            return;
        }

        // Limpiar cédula (solo números)
        const cleanCedula = cedula.replace(/\D/g, '');
        
        if (cleanCedula.length < 6 || cleanCedula.length > 10) {
            this.showMessage('Por favor, ingresa una cédula válida (6 a 10 dígitos).', 'error', 'check-in');
            return;
        }

        this.setLoadingState('check-in', true);

        try {
            // Siempre sincronizar datos antes de buscar para asegurar datos actualizados
            console.log('🔄 Sincronizando datos antes de buscar...');
            await this.loadDataFromFirebase();
            
            // Buscar en datos sincronizados
            let results = this.votes.filter(vote => vote.cedula === cleanCedula);
            
            // Verificar que los resultados tengan IDs válidos (no temporales)
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
        container.innerHTML = '';

        results.forEach(person => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            
            // Verificar si la persona ya votó
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

    renderListPage() {
        console.log('🔄 Renderizando página de listado...');
        console.log(`📊 Total de votos cargados: ${this.votes.length}`);
        console.log('📋 Primeros 3 votos:', this.votes.slice(0, 3));
        
        this.renderVotesTable();
        this.setupListPageEventListeners();
        
        // Debug después de renderizar
        setTimeout(() => {
            this.debugListPage();
        }, 100);
    }

    setupListPageEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('list-search');
        const clearSearchBtn = document.getElementById('clear-search');
        const searchFieldSelect = document.getElementById('search-field');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
                clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.handleSearch('');
                clearSearchBtn.style.display = 'none';
            });
        }

        // Ordenamiento
        document.querySelectorAll('.sortable-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const sortField = e.target.dataset.sort;
                this.handleSort(sortField);
            });
        });

        // Filtros principales (Todos, Votaron, No Votaron)
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.closest('.filter-btn').dataset.filter;
                this.handleFilterChange(filter);
            });
        });

        // Filtro de edad
        const ageFilter = document.getElementById('age-filter-select');
        if (ageFilter) {
            ageFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Selección masiva
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const headerCheckbox = document.getElementById('header-checkbox');

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        if (headerCheckbox) {
            headerCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Paginación
        this.setupPaginationEventListeners();
    }

    renderVotesTable() {
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';

        // Poblar los selectores de filtro con las opciones disponibles
        this.populateUBCHFilter();
        this.populateCommunityFilter();

        // Inicializar votos filtrados con todos los votos
        this.filteredVotes = [...this.votes];
        this.currentPage = 1;

        // Actualizar todos los contadores
        this.updateAllCounters();

        // Aplicar filtros y renderizar tabla
        this.applyFilters();
    }
    
    // Nuevo método para renderizar votos filtrados optimizado
    renderFilteredVotesTable(filteredVotes) {
        const tbody = document.querySelector('#registros-table tbody');
        if (!tbody) {
            console.error('❌ No se encontró el tbody de la tabla');
            return;
        }
        
        // Usar DocumentFragment para optimizar el renderizado
        const fragment = document.createDocumentFragment();

        console.log(`🔄 Renderizando ${filteredVotes.length} votos en la tabla`);

        // Obtener registros de la página actual
        const pageSize = this.pageSize || 20;
        const startIndex = (this.currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageVotes = filteredVotes.slice(startIndex, endIndex);

        console.log(`📄 Página ${this.currentPage}: mostrando registros ${startIndex + 1} a ${endIndex} de ${filteredVotes.length} total`);

        // Renderizar votos de la página actual usando DocumentFragment
        pageVotes.forEach(vote => {
            const tr = document.createElement('tr');
            const sexoClass = vote.sexo === 'M' ? 'sexo-masculino' : vote.sexo === 'F' ? 'sexo-femenino' : '';
            tr.innerHTML = `
                <td>
                    <input type="checkbox" class="row-checkbox" data-vote-id="${vote.id}" ${this.selectedVotes.includes(vote.id) ? 'checked' : ''}>
                </td>
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
                <td>
                    <button class="btn btn-primary btn-small" onclick="votingSystem.showDetailView('${vote.id}')" title="Ver detalles">
                        👁️
                    </button>
                    <button class="btn btn-primary btn-small" onclick="votingSystem.editVote('${vote.id}')" title="Editar">
                        🔄
                    </button>
                    <button class="btn btn-danger btn-small" onclick="votingSystem.deleteVote('${vote.id}')" title="Eliminar">
                        ❌
                    </button>
                </td>
            `;
            fragment.appendChild(tr);
        });

        // Usar requestAnimationFrame para optimizar el renderizado
        requestAnimationFrame(() => {
            // Limpiar tbody y agregar fragmento de una vez
            tbody.innerHTML = '';
            tbody.appendChild(fragment);

            // Configurar eventos de checkbox usando delegación de eventos
            tbody.addEventListener('change', (e) => {
                if (e.target.classList.contains('row-checkbox')) {
                    const voteId = e.target.dataset.voteId;
                    this.toggleVoteSelection(voteId, e.target.checked);
                }
            });
        
                                console.log(`✅ Tabla renderizada con ${pageVotes.length} votos de la página ${this.currentPage}`);
        });
    }

    // Poblar el selector de filtro por UBCH
    populateUBCHFilter() {
        const ubchSelect = document.getElementById('ubch-filter-select');
        if (!ubchSelect) {
            console.warn('⚠️ No se encontró el selector ubch-filter-select');
            return;
        }

        // Obtener todas las UBCH únicas de los registros
        const uniqueUBCHs = [...new Set(this.votes.map(vote => vote.ubch).filter(ubch => ubch))];
        
        console.log(`🔄 Poblando filtro UBCH con ${uniqueUBCHs.length} UBCH únicas:`, uniqueUBCHs);
        
        // Limpiar opciones existentes
        ubchSelect.innerHTML = '<option value="">Todas las UBCH</option>';
        
        // Agregar opciones para cada UBCH
        uniqueUBCHs.sort().forEach(ubch => {
            const option = document.createElement('option');
            option.value = ubch;
            option.textContent = ubch;
            ubchSelect.appendChild(option);
        });
        
        console.log(`✅ Filtro UBCH poblado con ${ubchSelect.options.length} opciones`);
        
        // Verificar que el evento change esté funcionando
        if (!ubchSelect.hasAttribute('data-event-bound')) {
            ubchSelect.setAttribute('data-event-bound', 'true');
            ubchSelect.addEventListener('change', (e) => {
                console.log(`🔄 Filtro UBCH cambiado a: "${e.target.value}"`);
                this.applyFilters();
            });
        }
    }
    
    // Poblar el selector de filtro por Comunidad
    populateCommunityFilter() {
        const communitySelect = document.getElementById('community-filter-select');
        if (!communitySelect) {
            console.warn('⚠️ No se encontró el selector community-filter-select');
            return;
        }

        // Obtener todas las comunidades posibles del mapa UBCH
        const todasLasComunidades = new Set();
        Object.values(this.ubchToCommunityMap).forEach(comunidades => {
            comunidades.forEach(comunidad => todasLasComunidades.add(comunidad));
        });
        const comunidadesArray = Array.from(todasLasComunidades).sort();
        console.log(`🔄 Poblando filtro Comunidad con ${comunidadesArray.length} comunidades posibles:`, comunidadesArray);
        
        // Limpiar opciones existentes
        communitySelect.innerHTML = '<option value="">Todas las Comunidades</option>';
        
        // Agregar opciones para cada comunidad
        comunidadesArray.forEach(community => {
            const option = document.createElement('option');
            option.value = community;
            option.textContent = community;
            communitySelect.appendChild(option);
        });
        
        console.log(`✅ Filtro Comunidad poblado con ${communitySelect.options.length} opciones`);
        
        // Verificar que el evento change esté funcionando
        if (!communitySelect.hasAttribute('data-event-bound')) {
            communitySelect.setAttribute('data-event-bound', 'true');
            communitySelect.addEventListener('change', (e) => {
                console.log(`🔄 Filtro Comunidad cambiado a: "${e.target.value}"`);
                this.applyFilters();
            });
        }
    }

    // Actualizar todos los contadores
    updateAllCounters() {
        const totalVotes = this.votes.length;
        const votedVotes = this.votes.filter(v => v.voted).length;
        const notVotedVotes = this.votes.filter(v => !v.voted).length;
        
        // Contadores generales
        this.updateCounter('total-counter', totalVotes);
        this.updateCounter('voted-counter', votedVotes);
        this.updateCounter('not-voted-counter', notVotedVotes);
        
        // Contadores en botones de filtro
        this.updateCounter('all-count', totalVotes);
        this.updateCounter('voted-count', votedVotes);
        this.updateCounter('not-voted-count', notVotedVotes);
        
        // Contador de registros mostrados (se actualiza en renderFilteredVotesTable)
    }
    
    // Actualizar contador específico
    updateCounter(elementId, count) {
        const element = document.getElementById(elementId);
        if (element) {
            requestAnimationFrame(() => {
                element.textContent = count.toLocaleString();
            });
        }
    }
    
    // Actualizar información de filtros aplicados
    updateFilterInfo() {
        const filterInfo = document.getElementById('filter-info');
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        const selectedCommunity = document.getElementById('community-filter-select')?.value;
        const selectedAgeRange = document.getElementById('age-filter-select')?.value;
        
        if (filterInfo) {
            const appliedFilters = [];
            
            if (activeFilterBtn && activeFilterBtn.dataset.filter !== 'all') {
                appliedFilters.push(activeFilterBtn.dataset.filter === 'voted' ? 'Votaron' : 'No votaron');
            }
            if (selectedUBCH) appliedFilters.push(`CV: ${selectedUBCH}`);
            if (selectedCommunity) appliedFilters.push(`Comunidad: ${selectedCommunity}`);
            if (selectedAgeRange) appliedFilters.push(`Edad: ${selectedAgeRange}`);
            
            if (appliedFilters.length > 0) {
                filterInfo.style.display = 'flex';
                filterInfo.querySelector('.filter-info-text').textContent = `Filtros: ${appliedFilters.join(', ')}`;
            } else {
                filterInfo.style.display = 'none';
            }
        }
    }
    
    // Actualizar contador de filtros optimizado (mantener para compatibilidad)
    updateFilterCounter(count) {
        // Este método ya no se usa, pero se mantiene para compatibilidad
        console.log(`Contador de filtros: ${count}`);
    }

    // Manejar cambio de filtro
    handleFilterChange(filter) {
        // Remover clase active de todos los botones
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Agregar clase active al botón seleccionado
        const targetBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        // Aplicar filtros y re-renderizar la tabla
        this.applyFilters();
    }

    // Aplicar filtros (para el selector de UBCH y Comunidad)
    applyFilters() {
        console.log('🔄 Aplicando filtros...');
        
        // Obtener filtros activos
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        const selectedCommunity = document.getElementById('community-filter-select')?.value;
        const selectedAgeRange = document.getElementById('age-filter-select')?.value;
        
        console.log('   - Filtro de estado:', activeFilterBtn?.dataset.filter || 'ninguno');
        console.log('   - Filtro UBCH:', selectedUBCH || 'todas');
        console.log('   - Filtro Comunidad:', selectedCommunity || 'todas');
        console.log('   - Filtro Edad:', selectedAgeRange || 'todas');
        
        // Aplicar filtros
        let filteredVotes = this.votes;
        
        // Filtrar por estado de voto
        if (activeFilterBtn) {
            const filter = activeFilterBtn.dataset.filter;
            if (filter === 'voted') {
                filteredVotes = filteredVotes.filter(v => v.voted);
                console.log(`   - Filtrando por votados: ${filteredVotes.length} votos`);
            } else if (filter === 'not-voted') {
                filteredVotes = filteredVotes.filter(v => !v.voted);
                console.log(`   - Filtrando por no votados: ${filteredVotes.length} votos`);
            }
        }
        
        // Filtrar por UBCH
        if (selectedUBCH) {
            const beforeCount = filteredVotes.length;
            filteredVotes = filteredVotes.filter(v => v.ubch === selectedUBCH);
            console.log(`   - Filtrando por UBCH "${selectedUBCH}": ${beforeCount} → ${filteredVotes.length} votos`);
        }
        
        // Filtrar por Comunidad
        if (selectedCommunity) {
            const beforeCount = filteredVotes.length;
            filteredVotes = filteredVotes.filter(v => v.community === selectedCommunity);
            console.log(`   - Filtrando por Comunidad "${selectedCommunity}": ${beforeCount} → ${filteredVotes.length} votos`);
        }

        // Filtrar por rango de edad
        if (selectedAgeRange) {
            const beforeCount = filteredVotes.length;
            filteredVotes = filteredVotes.filter(v => {
                const edad = v.edad || 0;
                switch (selectedAgeRange) {
                    case '16-25': return edad >= 16 && edad <= 25;
                    case '26-35': return edad >= 26 && edad <= 35;
                    case '36-45': return edad >= 36 && edad <= 45;
                    case '46-55': return edad >= 46 && edad <= 55;
                    case '56+': return edad >= 56;
                    default: return true;
                }
            });
            console.log(`   - Filtrando por edad "${selectedAgeRange}": ${beforeCount} → ${filteredVotes.length} votos`);
        }
        
        console.log(`✅ Filtros aplicados: ${filteredVotes.length} votos mostrados de ${this.votes.length} total`);
        
        // Aplicar búsqueda si hay término de búsqueda
        if (this.currentSearchTerm) {
            filteredVotes = this.applySearch(filteredVotes, this.currentSearchTerm);
        }
        
        // Aplicar ordenamiento si hay orden activo
        if (this.currentSortField) {
            filteredVotes = this.applySort(filteredVotes, this.currentSortField, this.currentSortDirection);
        }
        
        // Guardar votos filtrados para paginación
        this.filteredVotes = filteredVotes;
        this.currentPage = 1; // Resetear a la primera página cuando se aplican filtros
        
        // Actualizar información de filtros aplicados
        this.updateFilterInfo();
        
        // Renderizar tabla con votos filtrados
        this.renderFilteredVotesTable(filteredVotes);
        
        // Actualizar paginación
        this.updatePagination();
    }

    // Búsqueda
    handleSearch(searchTerm) {
        this.currentSearchTerm = searchTerm;
        this.applyFilters();
    }

    applySearch(votes, searchTerm) {
        if (!searchTerm.trim()) return votes;
        
        const searchField = document.getElementById('search-field')?.value || 'all';
        const term = searchTerm.toLowerCase();
        
        return votes.filter(vote => {
            if (searchField === 'all') {
                return (
                    (vote.name || '').toLowerCase().includes(term) ||
                    (vote.cedula || '').toLowerCase().includes(term) ||
                    (vote.community || '').toLowerCase().includes(term) ||
                    (vote.ubch || '').toLowerCase().includes(term)
                );
            } else {
                const fieldValue = vote[searchField] || '';
                return fieldValue.toString().toLowerCase().includes(term);
            }
        });
    }

    // Ordenamiento
    handleSort(sortField) {
        const header = document.querySelector(`[data-sort="${sortField}"]`);
        if (!header) {
            console.warn(`⚠️ No se encontró el header para ordenar: ${sortField}`);
            return;
        }
        
        // Limpiar ordenamiento previo
        document.querySelectorAll('.sortable-header').forEach(h => {
            h.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Cambiar dirección de ordenamiento
        if (this.currentSortField === sortField) {
            this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortField = sortField;
            this.currentSortDirection = 'asc';
        }
        
        // Aplicar clase visual
        header.classList.add(this.currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        
        // Aplicar filtros (que incluyen ordenamiento)
        this.applyFilters();
    }

    applySort(votes, sortField, direction) {
        return votes.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];
            
            // Manejar valores nulos
            if (aValue === null || aValue === undefined) aValue = '';
            if (bValue === null || bValue === undefined) bValue = '';
            
            // Convertir a string para comparación
            aValue = aValue.toString().toLowerCase();
            bValue = bValue.toString().toLowerCase();
            
            if (direction === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    }

    // Paginación
    setupPaginationEventListeners() {
        document.getElementById('first-page')?.addEventListener('click', () => this.goToPage(1));
        document.getElementById('prev-page')?.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        document.getElementById('next-page')?.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        document.getElementById('last-page')?.addEventListener('click', () => this.goToPage(this.getTotalPages()));
    }

    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderFilteredVotesTable(this.filteredVotes);
        this.updatePagination();
    }

    getTotalPages() {
        return Math.ceil(this.filteredVotes.length / this.pageSize);
    }

    updatePagination() {
        const totalPages = this.getTotalPages();
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.filteredVotes.length);
        
        console.log(`📄 Actualizando paginación: página ${this.currentPage} de ${totalPages}, registros ${startIndex + 1}-${endIndex} de ${this.filteredVotes.length}`);
        
        // Actualizar información de paginación
        const startElement = document.getElementById('pagination-start');
        const endElement = document.getElementById('pagination-end');
        const totalElement = document.getElementById('pagination-total');
        
        if (startElement) startElement.textContent = this.filteredVotes.length > 0 ? startIndex + 1 : 0;
        if (endElement) endElement.textContent = endIndex;
        if (totalElement) totalElement.textContent = this.filteredVotes.length;
        
        // Actualizar botones de navegación
        const firstBtn = document.getElementById('first-page');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const lastBtn = document.getElementById('last-page');
        
        if (firstBtn) firstBtn.disabled = this.currentPage <= 1;
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
        if (lastBtn) lastBtn.disabled = this.currentPage >= totalPages;
        
        // Generar números de página
        this.generatePageNumbers(totalPages);
    }

    generatePageNumbers(totalPages) {
        const container = document.getElementById('page-numbers');
        container.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `pagination-btn ${i === this.currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener('click', () => this.goToPage(i));
            container.appendChild(btn);
        }
    }

    // Selección masiva
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const voteId = checkbox.dataset.voteId;
            this.toggleVoteSelection(voteId, checked);
        });
        
        this.updateBulkActionsVisibility();
    }

    toggleVoteSelection(voteId, selected) {
        if (selected) {
            if (!this.selectedVotes.includes(voteId)) {
                this.selectedVotes.push(voteId);
            }
        } else {
            this.selectedVotes = this.selectedVotes.filter(id => id !== voteId);
        }
        
        this.updateBulkActionsVisibility();
        this.updateSelectAllCheckbox();
    }

    updateBulkActionsVisibility() {
        const bulkActions = document.getElementById('bulk-actions');
        if (bulkActions) {
            if (this.selectedVotes.length > 0) {
                bulkActions.classList.add('show');
            } else {
                bulkActions.classList.remove('show');
            }
        }
    }

    updateSelectAllCheckbox() {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        const totalCount = checkboxes.length;
        
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const headerCheckbox = document.getElementById('header-checkbox');
        
        if (checkedCount === 0) {
            selectAllCheckbox.checked = false;
            headerCheckbox.checked = false;
        } else if (checkedCount === totalCount) {
            selectAllCheckbox.checked = true;
            headerCheckbox.checked = true;
        } else {
            selectAllCheckbox.checked = false;
            headerCheckbox.checked = false;
        }
    }

    // Acciones masivas
    async bulkConfirmVotes() {
        if (this.selectedVotes.length === 0) return;
        
        const confirmed = confirm(`¿Confirmar votos para ${this.selectedVotes.length} registros seleccionados?`);
        if (!confirmed) return;
        
        this.showLoadingState('list', true);
        
        try {
            for (const voteId of this.selectedVotes) {
                await this.confirmVote(voteId);
            }
            
            this.selectedVotes = [];
            this.updateBulkActionsVisibility();
            this.applyFilters();
            
            // Enviar notificación
            if (window.realtimeNotifications) {
                window.realtimeNotifications.sendNotification(
                    `Se confirmaron ${this.selectedVotes.length} votos masivamente`,
                    'success',
                    'global'
                );
            }
            
        } catch (error) {
            console.error('Error en confirmación masiva:', error);
            this.showMessage('Error al confirmar votos masivamente', 'error', 'list');
        } finally {
            this.showLoadingState('list', false);
        }
    }

    async bulkDeleteVotes() {
        if (this.selectedVotes.length === 0) return;
        
        const confirmed = confirm(`¿Eliminar ${this.selectedVotes.length} registros seleccionados? Esta acción no se puede deshacer.`);
        if (!confirmed) return;
        
        this.showLoadingState('list', true);
        
        try {
            for (const voteId of this.selectedVotes) {
                await this.deleteVoteFromFirebase(voteId);
            }
            
            this.selectedVotes = [];
            this.updateBulkActionsVisibility();
            this.applyFilters();
            
            // Enviar notificación
            if (window.realtimeNotifications) {
                window.realtimeNotifications.sendNotification(
                    `Se eliminaron ${this.selectedVotes.length} registros masivamente`,
                    'info',
                    'global'
                );
            }
            
        } catch (error) {
            console.error('Error en eliminación masiva:', error);
            this.showMessage('Error al eliminar registros masivamente', 'error', 'list');
        } finally {
            this.showLoadingState('list', false);
        }
    }

    // Método eliminado - funcionalidad integrada en exportToCSVSmart()
    // bulkExportSelected() {
    //     if (this.selectedVotes.length === 0) return;
    //     
    //     const selectedVotesData = this.votes.filter(vote => this.selectedVotes.includes(vote.id));
    //     this.exportVotesToCSV(selectedVotesData, 'votos_seleccionados');
    // }

    // Vista detallada
    showDetailView(voteId) {
        const vote = this.votes.find(v => v.id === voteId);
        if (!vote) return;
        
        this.currentDetailVote = vote;
        
        // Llenar información detallada de manera segura
        const detailElements = {
            'detail-name': vote.name || 'N/A',
            'detail-cedula': vote.cedula || 'N/A',
            'detail-telefono': vote.telefono || 'N/A',
            'detail-sexo': vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'N/A',
            'detail-edad': vote.edad || 'N/A',
            'detail-ubch': vote.ubch || 'N/A',
            'detail-community': vote.community || 'N/A',
            'detail-vote-status': vote.voted ? 'Sí' : 'No',
            'detail-registered-at': vote.registeredAt ? new Date(vote.registeredAt).toLocaleString() : 'N/A',
            'detail-registered-by': vote.registeredBy || 'N/A'
        };
        
        // Actualizar elementos de manera segura
        Object.entries(detailElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Mostrar vista detallada
        const detailView = document.getElementById('detail-view');
        if (detailView) {
            detailView.classList.add('show');
        }
    }

    closeDetailView() {
        const detailView = document.getElementById('detail-view');
        if (detailView) {
            detailView.classList.remove('show');
        }
        this.currentDetailVote = null;
    }

    editFromDetail() {
        if (this.currentDetailVote) {
            this.editVote(this.currentDetailVote.id);
            this.closeDetailView();
        }
    }

    confirmFromDetail() {
        if (this.currentDetailVote) {
            this.confirmVote(this.currentDetailVote.id);
            this.closeDetailView();
        }
    }

    deleteFromDetail() {
        if (this.currentDetailVote) {
            this.deleteVote(this.currentDetailVote.id);
            this.closeDetailView();
        }
    }

    // Estados de carga
    showLoadingState(page, loading) {
        const loadingOverlay = document.getElementById('table-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = loading ? 'flex' : 'none';
        }
    }

    // Método de debug para verificar el estado del sistema
    debugListPage() {
        console.log('🔍 === DEBUG LIST PAGE ===');
        console.log('📊 Votos totales:', this.votes.length);
        console.log('📋 Votos filtrados:', this.filteredVotes.length);
        console.log('📄 Página actual:', this.currentPage);
        console.log('📏 Tamaño de página:', this.pageSize);
        console.log('✅ Elementos seleccionados:', this.selectedVotes.length);
        console.log('🔍 Término de búsqueda:', this.currentSearchTerm);
        console.log('📊 Campo de ordenamiento:', this.currentSortField);
        console.log('📈 Dirección de ordenamiento:', this.currentSortDirection);
        
        // Verificar elementos del DOM
        const table = document.getElementById('registros-table');
        const tbody = table?.querySelector('tbody');
        const paginationContainer = document.getElementById('pagination-container');
        
        console.log('📋 Tabla encontrada:', !!table);
        console.log('📋 Tbody encontrado:', !!tbody);
        console.log('📋 Contenedor de paginación:', !!paginationContainer);
        
        if (tbody) {
            console.log('📋 Filas en tbody:', tbody.children.length);
        }
        
        console.log('🔍 === FIN DEBUG ===');
    }

    deleteVote(voteId) {
        this.voteToDelete = voteId;
        document.getElementById('delete-modal').style.display = 'flex';
    }

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

        if (!this.voteToEdit) {
            this.showMessage('Error: No hay registro seleccionado para editar', 'error', 'listado');
            return;
        }
        // Bloquear edición de registros locales
        if (this.voteToEdit.startsWith('local_')) {
            this.showMessage('Este registro aún no ha sido sincronizado. Por favor, espera a que se sincronice para poder editarlo.', 'warning', 'listado');
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
            // Actualizar en Firebase
            await this.updateVoteInFirebase(this.voteToEdit, editData);
            // Recargar datos desde Firebase para reflejar el cambio
            await this.loadDataFromFirebase();
            // Cerrar el modal
            this.closeEditModal();
            // Mostrar mensaje de éxito
            this.showMessage('Registro actualizado correctamente', 'success', 'listado');
        } catch (error) {
            console.error('Error al actualizar registro:', error);
            this.showMessage('Error al actualizar el registro: ' + error.message, 'error', 'listado');
        }
    }

    closeDeleteModal() {
        document.getElementById('delete-modal').style.display = 'none';
        this.voteToDelete = null;
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

    async generateThankYouMessage(name, ubch, community) {
        const messageDiv = document.getElementById('thank-you-message');
        messageDiv.innerHTML = '<p>Generando mensaje...</p>';
        messageDiv.style.display = 'block';

        try {
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
        if (!messageDiv) return; // Evitar error si el elemento no existe
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    loadPdfLibraries() {
        if (window.jspdf) {
            this.pdfLibrariesReady = true;
            return;
        }

        const checkLibraries = () => {
            if (window.jspdf) {
                this.pdfLibrariesReady = true;
            } else {
                setTimeout(checkLibraries, 100);
            }
        };
        checkLibraries();
    }

    // Obtener votos filtrados según los filtros activos
    getFilteredVotes() {
        let filteredVotes = this.votes;
        
        // Filtro por estado de voto
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        if (activeFilterBtn) {
            const filter = activeFilterBtn.dataset.filter;
            if (filter === 'voted') {
                filteredVotes = filteredVotes.filter(v => v.voted);
            } else if (filter === 'not-voted') {
                filteredVotes = filteredVotes.filter(v => !v.voted);
            }
        }
        
        // Filtro por UBCH
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        if (selectedUBCH) {
            filteredVotes = filteredVotes.filter(v => v.ubch === selectedUBCH);
        }
        
        // Filtro por comunidad
        const selectedCommunity = document.getElementById('community-filter-select')?.value;
        if (selectedCommunity) {
            filteredVotes = filteredVotes.filter(v => v.community === selectedCommunity);
        }
        
        // Filtro por rango de edad
        const selectedAgeRange = document.getElementById('age-filter-select')?.value;
        if (selectedAgeRange) {
            filteredVotes = filteredVotes.filter(v => {
                const edad = v.edad || 0;
                switch (selectedAgeRange) {
                    case '16-25': return edad >= 16 && edad <= 25;
                    case '26-35': return edad >= 26 && edad <= 35;
                    case '36-45': return edad >= 36 && edad <= 45;
                    case '46-55': return edad >= 46 && edad <= 55;
                    case '56+': return edad >= 56;
                    default: return true;
                }
            });
        }
        
        // Aplicar búsqueda si hay término de búsqueda
        if (this.currentSearchTerm) {
            filteredVotes = this.applySearch(filteredVotes, this.currentSearchTerm);
        }
        
        return filteredVotes;
    }
    
    // Obtener información de filtros aplicados
    getFilterInfo() {
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        const selectedCommunity = document.getElementById('community-filter-select')?.value;
        const selectedAgeRange = document.getElementById('age-filter-select')?.value;
        
        const filterInfo = {
            hasFilters: false,
            statusFilter: null,
            ubchFilter: null,
            communityFilter: null,
            ageFilter: null,
            searchTerm: this.currentSearchTerm || null
        };
        
        if (activeFilterBtn && activeFilterBtn.dataset.filter !== 'all') {
            filterInfo.statusFilter = activeFilterBtn.dataset.filter === 'voted' ? 'Votaron' : 'No votaron';
            filterInfo.hasFilters = true;
        }
        
        if (selectedUBCH) {
            filterInfo.ubchFilter = selectedUBCH;
            filterInfo.hasFilters = true;
        }
        
        if (selectedCommunity) {
            filterInfo.communityFilter = selectedCommunity;
            filterInfo.hasFilters = true;
        }
        
        if (selectedAgeRange) {
            filterInfo.ageFilter = selectedAgeRange;
            filterInfo.hasFilters = true;
        }
        
        if (this.currentSearchTerm) {
            filterInfo.hasFilters = true;
        }
        
        return filterInfo;
    }
    
    // Generar nombre de archivo con información de filtros
    generateFileName(extension, filterInfo) {
        let fileName = 'listado-personas';
        
        if (filterInfo.hasFilters) {
            const filters = [];
            if (filterInfo.statusFilter) filters.push(filterInfo.statusFilter);
            if (filterInfo.ubchFilter) filters.push(filterInfo.ubchFilter.replace(/[^a-zA-Z0-9]/g, '-'));
            if (filterInfo.communityFilter) filters.push(filterInfo.communityFilter.replace(/[^a-zA-Z0-9]/g, '-'));
            if (filterInfo.ageFilter) filters.push(filterInfo.ageFilter.replace(/[^a-zA-Z0-9]/g, '-'));
            if (filterInfo.searchTerm) filters.push('busqueda');
            
            fileName += `-filtrado-${filters.join('-')}`;
        }
        
        fileName += `-${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}`;
        fileName += `.${extension}`;
        
        return fileName;
    }

    exportToPDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            this.showMessage('Error: Librería PDF no disponible', 'error', 'listado');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Obtener votos filtrados
        const filteredVotes = this.getFilteredVotes();
        const filterInfo = this.getFilterInfo();
        
        // Título
        doc.setFontSize(18);
        doc.text('Listado de Personas Registradas', 20, 20);

        // Información de filtros aplicados
        if (filterInfo.hasFilters) {
            doc.setFontSize(10);
            doc.text('Filtros aplicados:', 20, 30);
            doc.setFontSize(8);
            let yPos = 35;
            if (filterInfo.statusFilter) {
                doc.text(`• Estado: ${filterInfo.statusFilter}`, 25, yPos);
                yPos += 5;
            }
            if (filterInfo.ubchFilter) {
                doc.text(`• UBCH: ${filterInfo.ubchFilter}`, 25, yPos);
                yPos += 5;
            }
            if (filterInfo.communityFilter) {
                doc.text(`• Comunidad: ${filterInfo.communityFilter}`, 25, yPos);
                yPos += 5;
            }
            doc.text(`• Total de registros: ${filteredVotes.length}`, 25, yPos);
            yPos += 10;
        } else {
            doc.setFontSize(10);
            doc.text(`Total de registros: ${filteredVotes.length}`, 20, 30);
        }

        // Fecha
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, 20, filterInfo.hasFilters ? 55 : 40);

        // Datos de la tabla
        const tableData = filteredVotes.map(vote => [
            vote.name,
            vote.cedula,
            vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'N/A',
            vote.edad || 'N/A',
            vote.ubch,
            vote.community,
            vote.voted ? 'Sí' : 'No'
        ]);

        doc.autoTable({
            head: [['Nombre', 'Cédula', 'Sexo', 'Edad', 'UBCH', 'Comunidad', 'Votó']],
            body: tableData,
            startY: filterInfo.hasFilters ? 65 : 50,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });

        // Generar nombre de archivo con filtros
        const fileName = this.generateFileName('pdf', filterInfo);
        
        // Guardar PDF
        doc.save(fileName);
        this.showMessage(`PDF generado: ${fileName}`, 'success', 'listado');
    }

    // Método inteligente para exportar CSV
    exportToCSVSmart() {
        // Verificar si hay registros seleccionados
        if (this.selectedVotes.length > 0) {
            // Exportar solo los registros seleccionados
            const selectedVotesData = this.votes.filter(vote => this.selectedVotes.includes(vote.id));
            this.exportVotesToCSV(selectedVotesData, 'votos_seleccionados');
            this.showMessage(`CSV generado con ${selectedVotesData.length} registros seleccionados`, 'success', 'listado');
        } else {
            // Exportar todos los registros filtrados según los filtros activos
            const filteredVotes = this.getFilteredVotes();
            const filterInfo = this.getFilterInfo();
            
            if (filteredVotes.length === 0) {
                this.showMessage('No hay registros para exportar con los filtros aplicados', 'warning', 'listado');
                return;
            }
            
            // Generar nombre de archivo con información de filtros
            const fileName = this.generateFileName('csv', filterInfo);
            this.exportVotesToCSV(filteredVotes, fileName.replace('.csv', ''));
            
            // Mostrar información detallada sobre los filtros aplicados
            let filterMessage = `CSV generado: ${fileName} con ${filteredVotes.length} registros`;
            if (filterInfo.hasFilters) {
                const appliedFilters = [];
                if (filterInfo.statusFilter) appliedFilters.push(filterInfo.statusFilter);
                if (filterInfo.ubchFilter) appliedFilters.push(`CV: ${filterInfo.ubchFilter}`);
                if (filterInfo.communityFilter) appliedFilters.push(`Comunidad: ${filterInfo.communityFilter}`);
                if (filterInfo.ageFilter) appliedFilters.push(`Edad: ${filterInfo.ageFilter}`);
                if (filterInfo.searchTerm) appliedFilters.push(`Búsqueda: "${filterInfo.searchTerm}"`);
                
                filterMessage += `\nFiltros aplicados: ${appliedFilters.join(', ')}`;
            }
            
            this.showMessage(filterMessage, 'success', 'listado');
        }
    }

    // Método para exportar registros específicos a CSV
    exportVotesToCSV(votesData, fileName) {
        const headers = ['Nombre', 'Cédula', 'Sexo', 'Edad', 'UBCH', 'Comunidad', 'Votó'];
        const rows = votesData.map(vote => [
            `"${(vote.name || '').replace(/"/g, '""')}"`,
            `"${(vote.cedula || '').replace(/"/g, '""')}"`,
            `"${vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : ''}"`,
            `"${vote.edad || ''}"`,
            `"${(vote.ubch || '').replace(/"/g, '""')}"`,
            `"${(vote.community || '').replace(/"/g, '""')}"`,
            `"${vote.voted ? 'Sí' : 'No'}"`
        ]);
        
        let csvContent = headers.join(';') + '\r\n';
        rows.forEach(row => {
            csvContent += row.join(';') + '\r\n';
        });
        
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${fileName}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportToCSV() {
        // Obtener votos filtrados
        const filteredVotes = this.getFilteredVotes();
        const filterInfo = this.getFilterInfo();
        
        const headers = ['Nombre', 'Cédula', 'Sexo', 'Edad', 'UBCH', 'Comunidad', 'Votó'];
        const rows = filteredVotes.map(vote => [
            `"${(vote.name || '').replace(/"/g, '""')}"`,
            `"${(vote.cedula || '').replace(/"/g, '""')}"`,
            `"${vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : ''}"`,
            `"${vote.edad || ''}"`,
            `"${(vote.ubch || '').replace(/"/g, '""')}"`,
            `"${(vote.community || '').replace(/"/g, '""')}"`,
            `"${vote.voted ? 'Sí' : 'No'}"`
        ]);
        
        let csvContent = headers.join(';') + '\r\n';
        rows.forEach(row => {
            csvContent += row.join(';') + '\r\n';
        });
        
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        // Generar nombre de archivo con filtros
        const fileName = this.generateFileName('csv', filterInfo);
        link.setAttribute('download', fileName);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showMessage(`CSV generado: ${fileName}`, 'success', 'listado');
    }

    // Función para forzar recarga de configuración y actualizar Firebase
    async forzarRecargaConfiguracion() {
        console.log('🔄 Forzando recarga y actualización de configuración en Firebase...');
        // Configuración local correcta
        const configCorrecta = {
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
        // Actualizar en memoria y en Firebase
        this.ubchToCommunityMap = configCorrecta;
        if (window.firebaseDB && window.firebaseDB.ubchCollection) {
            await window.firebaseDB.ubchCollection.doc('config').set({
                mapping: configCorrecta,
                lastUpdated: (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue && window.firebase.firestore.FieldValue.serverTimestamp) ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
            });
            console.log('✅ Configuración UBCH actualizada en Firebase');
        } else {
            console.warn('⚠️ No se pudo actualizar Firebase, usando solo local');
        }
        // Re-renderizar la página actual
        if (this.currentPage === 'registration') {
            this.renderRegistrationPage();
        }
        this.showMessage('Configuración actualizada correctamente en Firebase y local', 'success', 'registration');
    }

    // Método para sincronización de datos (requerido por auto-init.js)
    async syncData() {
        try {
            console.log('🔄 Sincronizando datos...');
            await this.loadDataFromFirebase();
            this.updateAllDataDisplays();
            console.log('✅ Datos sincronizados correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error sincronizando datos:', error);
            return false;
        }
    }

    async loadRegistrations() {
        try {
            console.log('📥 Cargando datos desde Firebase...');
            const snapshot = await this.votesCollection.get();
            this.votes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`✅ ${this.votes.length} votos cargados desde Firebase`);
            
            // Cargar configuración UBCH solo una vez
            if (!this.ubchConfigLoaded) {
                await this.loadUBCHConfig();
                this.ubchConfigLoaded = true;
            }
            
            this.updateAllScreens();
            return this.votes;
        } catch (error) {
            console.error('❌ Error cargando registros:', error);
            throw error;
        }
    }

    setupNavigationByRole() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        // Ocultar todos los botones primero
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.style.display = 'none');

        // Mostrar botones según el rol
        if (currentUser.rol === 'verificador') {
            // Solo mostrar botón de confirmación de voto
            const navCheckIn = document.getElementById('nav-check-in');
            if (navCheckIn) {
                navCheckIn.style.display = 'block';
                navCheckIn.classList.add('active');
            }
        } else if (currentUser.rol === 'registrador') {
            // Solo mostrar botón de registro
            const navRegistration = document.getElementById('nav-registration');
            if (navRegistration) {
                navRegistration.style.display = 'block';
                navRegistration.classList.add('active');
            }
        } else {
            // Superusuarios y admins tienen acceso a todo
            navButtons.forEach(btn => btn.style.display = 'block');
        }
    }
}

// Inicializar el sistema cuando el DOM esté listo
// Comentado para evitar conflictos con auto-init.js
// document.addEventListener('DOMContentLoaded', () => {
//     window.votingSystem = new VotingSystemFirebase();
// }); 