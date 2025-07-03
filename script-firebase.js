class VotingSystemFirebase extends VotingSystem {
    constructor() {
        super(); // Llamar al constructor de la clase padre
        
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
        
        // Variables para modales
        this.voteToDelete = null;
        this.voteToEdit = null;
        
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
        this.pdfLibrariesReady = false;
        this.projectionInterval = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('🔍 Iniciando conexión con Firebase...');
            
            // Verificar que Firebase esté disponible
            if (!window.firebaseDB) {
                throw new Error('Firebase no está inicializado');
            }
            
            console.log('✅ Firebase configurado correctamente');
            console.log('📊 Configuración Firebase:', window.firebaseDB);
            
            // Cargar datos desde Firebase
            await this.loadDataFromFirebase();
            console.log('✅ Datos cargados desde Firebase:', this.votes.length, 'registros');
            
            this.showMessage('Conectado a Firebase. Los datos están centralizados en la nube.', 'success', 'registration');
            
            // Configurar listener en tiempo real
            this.setupRealtimeListener();
            console.log('✅ Listener en tiempo real configurado');
            
            // Actualizar indicador de sincronización
            this.updateSyncIndicator(true);
            
        } catch (error) {
            console.error('❌ Error al conectar con Firebase:', error);
            this.showMessage('Error de conexión. Verificando configuración de Firebase.', 'error', 'registration');
            this.updateSyncIndicator(false, true);
        }
        
        this.setupEventListeners();
        this.renderCurrentPage();
        this.loadPdfLibraries();
    }

    async loadDataFromFirebase() {
        try {
            console.log('📥 Cargando datos desde Firebase...');
            
            // Verificar si Firebase está disponible
            if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
                console.log('⚠️ Firebase no disponible, cargando datos locales');
                return this.loadDataLocally();
            }
            
            // Cargar votos desde Firebase
            const votesSnapshot = await window.firebaseDB.votesCollection.get();
            this.votes = votesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`✅ ${this.votes.length} votos cargados desde Firebase`);

            // Cargar configuración UBCH desde Firebase
            try {
            const ubchSnapshot = await window.firebaseDB.ubchCollection.doc('config').get();
            if (ubchSnapshot.exists) {
                this.ubchToCommunityMap = ubchSnapshot.data().mapping;
                    console.log('✅ Configuración UBCH cargada desde Firebase');
                } else {
                    // Si no existe en Firebase, usar configuración por defecto
                    console.log('⚠️ No se encontró configuración UBCH en Firebase, usando configuración por defecto');
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
                    
                    // Guardar configuración por defecto en Firebase para futuras cargas
                    await this.saveUBCHConfigToFirebase();
                }
            } catch (error) {
                console.error('❌ Error cargando configuración UBCH:', error);
                // Usar configuración por defecto en caso de error
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
            }

            console.log(`✅ Configuración UBCH cargada: ${Object.keys(this.ubchToCommunityMap).length} UBCH disponibles`);

        } catch (error) {
            console.error('❌ Error cargando datos de Firebase:', error);
            console.log('🔄 Intentando cargar datos locales como fallback');
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

        // Validación inicial
        if (!name || !cedula || !telefono || !sexo || !edad || !ubch || !community) {
            this.showMessage('Por favor, completa todos los campos.', 'error', 'registration');
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
            // Inicializar sistema de cola si no existe
            if (!window.queueManager) {
                window.queueManager = new QueueManager();
            }

            // Agregar registro a la cola
            const queueItem = window.queueManager.addToQueue(registrationData);
            
            this.showMessage(`✅ Registro agregado a la cola (ID: ${queueItem.id}). Se procesará automáticamente cuando haya conexión.`, 'success', 'registration');
            await this.generateThankYouMessage(name, ubch, community);
            
            // Limpiar formulario
            form.reset();
            document.getElementById('community').disabled = true;
            
            // Mostrar estadísticas de la cola
            this.updateQueueStatus();
            
        } catch (error) {
            console.error('Error al registrar:', error);
            this.showMessage(error.message || 'Error al registrar persona. Inténtalo de nuevo.', 'error', 'registration');
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

        // Cambio de UBCH en formulario de registro
        document.getElementById('ubch').addEventListener('change', (e) => {
            this.handleUBCHChange(e.target.value);
        });

        // Cambio de UBCH en formulario de edición
        document.getElementById('edit-ubch').addEventListener('change', (e) => {
            this.handleEditUBCHChange(e.target.value);
        });

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
            csvBtn.addEventListener('click', () => this.exportToCSV());
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
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

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

        // Verificar si hay UBCH disponibles
        if (!this.ubchToCommunityMap || Object.keys(this.ubchToCommunityMap).length === 0) {
            console.log('⚠️ No hay UBCH disponibles, intentando recargar...');
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
            this.showMessage('Cargando UBCH...', 'info', 'registration');
            
            // Intentar recargar la configuración UBCH
            this.loadDataFromFirebase().then(() => {
                this.renderRegistrationPage();
            }).catch(error => {
                console.error('❌ Error recargando UBCH:', error);
                this.showMessage('Error cargando UBCH. Contacte al administrador.', 'error', 'registration');
            });
            return;
        }

        // Habilitar formulario
        form.querySelectorAll('input, select, button').forEach(el => el.disabled = false);

        // Llenar UBCH
        console.log(`🔄 Cargando ${Object.keys(this.ubchToCommunityMap).length} UBCH en el formulario...`);
        Object.keys(this.ubchToCommunityMap).forEach(ubch => {
            const option = document.createElement('option');
            option.value = ubch;
            option.textContent = ubch;
            ubchSelect.appendChild(option);
        });
        
        console.log('✅ UBCH cargadas correctamente en el formulario');
        this.showMessage('UBCH cargadas correctamente', 'success', 'registration');
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

    renderListPage() {
        this.renderVotesTable();
    }

    renderVotesTable() {
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';

        // Poblar los selectores de filtro con las opciones disponibles
        this.populateUBCHFilter();
        this.populateCommunityFilter();

        // Renderizar todos los votos sin filtros
        this.renderFilteredVotesTable(this.votes);
    }
    
    // Nuevo método para renderizar votos filtrados
    renderFilteredVotesTable(filteredVotes) {
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';

        console.log(`🔄 Renderizando ${filteredVotes.length} votos en la tabla`);

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
                        Editar
                    </button>
                    <button class="btn btn-danger btn-small" onclick="votingSystem.deleteVote('${vote.id}')">
                        Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar contador de filtros
        this.updateFilterCounter(filteredVotes.length);
        
        console.log(`✅ Tabla renderizada con ${filteredVotes.length} votos`);
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

        // Obtener todas las comunidades únicas de los registros
        const uniqueCommunities = [...new Set(this.votes.map(vote => vote.community).filter(community => community))];
        
        console.log(`🔄 Poblando filtro Comunidad con ${uniqueCommunities.length} comunidades únicas:`, uniqueCommunities);
        
        // Limpiar opciones existentes
        communitySelect.innerHTML = '<option value="">Todas las Comunidades</option>';
        
        // Agregar opciones para cada comunidad
        uniqueCommunities.sort().forEach(community => {
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

    // Actualizar contador de filtros
    updateFilterCounter(count) {
        const counter = document.getElementById('filter-counter');
        if (counter) {
            counter.textContent = count;
        }
    }

    // Manejar cambio de filtro
    handleFilterChange(filter) {
        // Remover clase active de todos los botones
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Agregar clase active al botón seleccionado
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Re-renderizar la tabla con los nuevos filtros
        this.renderVotesTable();
    }

    // Aplicar filtros (para el selector de UBCH y Comunidad)
    applyFilters() {
        console.log('🔄 Aplicando filtros...');
        
        // Obtener filtros activos
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        const selectedCommunity = document.getElementById('community-filter-select')?.value;
        
        console.log('   - Filtro de estado:', activeFilterBtn?.dataset.filter || 'ninguno');
        console.log('   - Filtro UBCH:', selectedUBCH || 'todas');
        console.log('   - Filtro Comunidad:', selectedCommunity || 'todas');
        
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
        
        console.log(`✅ Filtros aplicados: ${filteredVotes.length} votos mostrados de ${this.votes.length} total`);
        
        // Renderizar tabla con votos filtrados
        this.renderFilteredVotesTable(filteredVotes);
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
        
        return filteredVotes;
    }
    
    // Obtener información de filtros aplicados
    getFilterInfo() {
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        const selectedCommunity = document.getElementById('community-filter-select')?.value;
        
        const filterInfo = {
            hasFilters: false,
            statusFilter: null,
            ubchFilter: null,
            communityFilter: null
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
            
            fileName += `-filtrado-${filters.join('-')}`;
        }
        
        fileName += `-${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}`;
        fileName += `.${extension}`;
        
        return fileName;
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
        
        return filteredVotes;
    }
    
    // Obtener información de filtros aplicados
    getFilterInfo() {
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        const selectedCommunity = document.getElementById('community-filter-select')?.value;
        
        const filterInfo = {
            hasFilters: false,
            statusFilter: null,
            ubchFilter: null,
            communityFilter: null
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
}

// Inicializar el sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.votingSystem = new VotingSystemFirebase();
}); 