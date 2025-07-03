// Sistema de Registro de Votos 2025 - JavaScript Vanilla con Cache Local y Sincronización Inteligente

class VotingSystem {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
        this.activePage = 'registration';  // Cambiar nombre para evitar confusión
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
        
        // --- Cache para filtros (optimización) ---
        this.filteredVotes = [];
        this.lastFilterState = null;
        
        // === SISTEMA AUTOMÁTICO MEJORADO ===
        this.autoSyncEnabled = true;
        this.autoRetryEnabled = true;
        this.autoErrorRecovery = true;
        this.autoProjectionMode = false;
        this.autoBackupEnabled = true;
        
        // Inicialización automática
        this.init();
    }

    // === SISTEMA AUTOMÁTICO ===
    async init() {
        try {
            console.log('🚀 Iniciando sistema automático...');
            
            // 1. Cargar datos automáticamente
            await this.loadData();
            
            // 2. Configurar eventos automáticamente
            this.setupEventListeners();
            
            // 3. Iniciar sincronización automática
            this.startAutoSync();
            
            // 4. Configurar auto-recuperación de errores
            this.setupAutoErrorRecovery();
            
            // 5. Configurar auto-backup
            this.setupAutoBackup();
            
            // 6. Mostrar información del usuario
            this.displayUserInfo();
            
            // 7. Renderizar página inicial
            this.renderCurrentPage();
            
            // 8. Configurar modo proyección automático
            this.setupAutoProjection();
            
            console.log('✅ Sistema automático iniciado correctamente');
            
        } catch (error) {
            console.error('❌ Error en inicialización automática:', error);
            this.handleAutoError(error);
        }
    }

    // === AUTO-RECUPERACIÓN DE ERRORES ===
    setupAutoErrorRecovery() {
        // Interceptar errores globales
        window.addEventListener('error', (event) => {
            this.handleAutoError(event.error);
        });

        // Interceptar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handleAutoError(event.reason);
        });

        // Auto-reintento para operaciones fallidas
        this.retryQueue = [];
        this.isRetrying = false;
    }

    async handleAutoError(error) {
        console.error('🔄 Error detectado, iniciando recuperación automática:', error);
        
        // Agregar a cola de reintentos
        this.retryQueue.push({
            error,
            timestamp: Date.now(),
            retries: 0
        });

        // Mostrar mensaje al usuario
        this.showMessage('Error detectado. Recuperando automáticamente...', 'warning');
        
        // Intentar recuperación automática
        await this.autoRecover();
    }

    async autoRecover() {
        if (this.isRetrying) return;
        
        this.isRetrying = true;
        
        try {
            // 1. Verificar conectividad
            if (!navigator.onLine) {
                this.offlineMode = true;
                this.showMessage('Modo offline activado. Los datos se guardarán localmente.', 'info');
                return;
            }

            // 2. Reintentar operaciones fallidas
            await this.retryFailedOperations();

            // 3. Re-sincronizar datos
            await this.syncData();

            // 4. Restaurar estado de la aplicación
            this.restoreApplicationState();

            this.showMessage('Recuperación automática completada', 'success');
            
        } catch (error) {
            console.error('❌ Error en recuperación automática:', error);
            this.showMessage('Error en recuperación. Contacte al administrador.', 'error');
        } finally {
            this.isRetrying = false;
        }
    }

    async retryFailedOperations() {
        const maxRetries = 3;
        const retryDelay = 2000;

        for (let i = 0; i < this.retryQueue.length; i++) {
            const item = this.retryQueue[i];
            
            if (item.retries < maxRetries) {
                item.retries++;
                
                try {
                    await this.delay(retryDelay * item.retries);
                    // Aquí se reintentaría la operación específica
                    console.log(`🔄 Reintentando operación (${item.retries}/${maxRetries})`);
                } catch (error) {
                    console.error(`❌ Reintento ${item.retries} fallido:`, error);
                }
            } else {
                // Eliminar de la cola si se agotaron los reintentos
                this.retryQueue.splice(i, 1);
                i--;
            }
        }
    }

    restoreApplicationState() {
        // Restaurar estado de la página actual
        this.renderCurrentPage();
        
        // Restaurar datos de formularios
        this.restoreFormData();
        
        // Restaurar filtros aplicados
        this.restoreFilters();
    }

    // === AUTO-BACKUP ===
    setupAutoBackup() {
        if (!this.autoBackupEnabled) return;

        // Backup automático cada 5 minutos
        setInterval(() => {
            this.createAutoBackup();
        }, 5 * 60 * 1000);

        // Backup antes de cerrar la página
        window.addEventListener('beforeunload', () => {
            this.createAutoBackup();
        });
    }

    createAutoBackup() {
        try {
            const backupData = {
                votes: this.votes,
                timestamp: new Date().toISOString(),
                user: this.currentUser.username
            };

            localStorage.setItem('autoBackup', JSON.stringify(backupData));
            console.log('💾 Backup automático creado');
        } catch (error) {
            console.error('❌ Error creando backup automático:', error);
        }
    }

    restoreFromBackup() {
        try {
            const backupData = localStorage.getItem('autoBackup');
            if (backupData) {
                const backup = JSON.parse(backupData);
                this.votes = backup.votes || [];
                console.log('🔄 Datos restaurados desde backup automático');
                return true;
            }
        } catch (error) {
            console.error('❌ Error restaurando desde backup:', error);
        }
        return false;
    }

    // === AUTO-PROYECCIÓN ===
    setupAutoProjection() {
        // Detectar si la pantalla es grande (modo proyección)
        const checkProjectionMode = () => {
            const isLargeScreen = window.innerWidth >= 1920 && window.innerHeight >= 1080;
            const isFullscreen = document.fullscreenElement !== null;
            const isProjectionMode = window.location.search.includes('projection=true');
            
            if ((isLargeScreen || isFullscreen || isProjectionMode) && !this.autoProjectionMode) {
                this.enterAutoProjectionMode();
            } else if (!isLargeScreen && !isFullscreen && !isProjectionMode && this.autoProjectionMode) {
                this.exitAutoProjectionMode();
            }
        };

        // Verificar al cargar y al cambiar tamaño
        window.addEventListener('resize', checkProjectionMode);
        window.addEventListener('fullscreenchange', checkProjectionMode);
        
        // Verificar inicialmente
        setTimeout(checkProjectionMode, 1000);
    }

    enterAutoProjectionMode() {
        this.autoProjectionMode = true;
        console.log('📺 Modo proyección automático activado');
        
        // Aplicar estilos de proyección
        document.body.classList.add('projection-mode');
        
        // Navegar automáticamente a estadísticas
        this.navigateToPage('statistics');
        
        // Actualizar estadísticas en tiempo real
        this.startAutoProjectionUpdates();
        
        this.showMessage('Modo proyección automático activado', 'info');
    }

    exitAutoProjectionMode() {
        this.autoProjectionMode = false;
        console.log('📱 Modo proyección automático desactivado');
        
        // Remover estilos de proyección
        document.body.classList.remove('projection-mode');
        
        // Detener actualizaciones automáticas
        this.stopAutoProjectionUpdates();
    }

    startAutoProjectionUpdates() {
        if (this.projectionInterval) clearInterval(this.projectionInterval);
        
        this.projectionInterval = setInterval(() => {
            this.updateProjection();
        }, 5000); // Actualizar cada 5 segundos
        
        // Actualizar inmediatamente
        this.updateProjection();
    }

    stopAutoProjectionUpdates() {
        if (this.projectionInterval) {
            clearInterval(this.projectionInterval);
            this.projectionInterval = null;
        }
    }

    updateProjection() {
        // Actualizar estadísticas en tiempo real
        this.renderStatisticsPage();
        
        // Actualizar contadores
        this.updateProjectionCounters();
        
        // Mostrar información de sincronización
        this.updateProjectionSyncInfo();
        
        console.log('📊 Proyección actualizada');
    }

    updateProjectionCounters() {
        const totalVotes = this.votes.length;
        const votedCount = this.votes.filter(v => v.voted).length;
        const pendingCount = totalVotes - votedCount;
        
        // Actualizar contadores en pantalla
        const counters = document.querySelectorAll('.projection-counter');
        counters.forEach(counter => {
            const type = counter.dataset.type;
            switch(type) {
                case 'total':
                    counter.textContent = totalVotes;
                    break;
                case 'voted':
                    counter.textContent = votedCount;
                    break;
                case 'pending':
                    counter.textContent = pendingCount;
                    break;
                case 'percentage':
                    const percentage = totalVotes > 0 ? Math.round((votedCount / totalVotes) * 100) : 0;
                    counter.textContent = `${percentage}%`;
                    break;
            }
        });
    }

    updateProjectionSyncInfo() {
        if (window.syncManager) {
            const stats = window.syncManager.getSyncStats();
            const syncInfo = document.getElementById('projection-sync-info');
            if (syncInfo) {
                syncInfo.innerHTML = `
                    <div class="sync-status ${stats.isOnline ? 'online' : 'offline'}">
                        ${stats.isOnline ? '🌐' : '📴'} ${stats.isOnline ? 'Online' : 'Offline'}
                    </div>
                    <div class="sync-stats">
                        Pendientes: ${stats.pending} | Fallidos: ${stats.failed}
                    </div>
                `;
            }
        }
    }

    // === SINCRONIZACIÓN AUTOMÁTICA MEJORADA ===
    startAutoSync() {
        if (!this.autoSyncEnabled) return;

        // Sincronización cada 30 segundos
        this.syncInterval = setInterval(async () => {
            try {
                await this.syncData();
            } catch (error) {
                console.error('❌ Error en sincronización automática:', error);
                this.handleAutoError(error);
            }
        }, 30000);

        // Sincronización inmediata al iniciar
        setTimeout(() => {
            this.syncData();
        }, 2000);

        console.log('🔄 Sincronización automática iniciada');
    }

    async syncData() {
        if (!navigator.onLine) {
            this.offlineMode = true;
            this.updateSyncStatus('offline');
            return;
        }

        try {
            this.updateSyncStatus('syncing');
            
            // Sincronizar con SyncManager si está disponible
            if (window.syncManager) {
                await window.syncManager.syncPendingRecords();
            }

            // Actualizar datos desde el servidor
            await this.loadData();
            
            this.offlineMode = false;
            this.updateSyncStatus('online');
            this.lastSyncTime = Date.now();
            
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
            this.updateSyncStatus('error');
            throw error;
        }
    }

    // === GESTIÓN AUTOMÁTICA DE FORMULARIOS ===
    restoreFormData() {
        const savedData = localStorage.getItem('formData');
        if (savedData) {
            try {
                const formData = JSON.parse(savedData);
                Object.keys(formData).forEach(fieldId => {
                    const element = document.getElementById(fieldId);
                    if (element) {
                        element.value = formData[fieldId];
                    }
                });
            } catch (error) {
                console.error('❌ Error restaurando datos del formulario:', error);
            }
        }
    }

    saveFormData() {
        try {
            const formData = {};
            const form = document.getElementById('registration-form');
            if (form) {
                const inputs = form.querySelectorAll('input, select');
                inputs.forEach(input => {
                    if (input.value) {
                        formData[input.id] = input.value;
                    }
                });
                localStorage.setItem('formData', JSON.stringify(formData));
            }
        } catch (error) {
            console.error('❌ Error guardando datos del formulario:', error);
        }
    }

    restoreFilters() {
        const savedFilters = localStorage.getItem('appliedFilters');
        if (savedFilters) {
            try {
                const filters = JSON.parse(savedFilters);
                // Restaurar filtros aplicados
                this.applyFilters(filters);
            } catch (error) {
                console.error('❌ Error restaurando filtros:', error);
            }
        }
    }

    // === SISTEMA DE MENSAJES MEJORADO ===
    showMessage(message, type = 'info', page = 'registration') {
        // Evitar mensajes duplicados
        if (this.lastMessage === message) return;
        this.lastMessage = message;

        const messageElement = document.getElementById(`${page}-message`);
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `message ${type}`;
            messageElement.style.display = 'block';

            // Auto-ocultar después de 5 segundos
            setTimeout(() => {
                messageElement.style.display = 'none';
                this.lastMessage = null;
            }, 5000);
        }

        // Mostrar notificación del sistema si está disponible
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Sistema de Votos 2025', {
                body: message,
                icon: 'logo.jpg'
            });
        }
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

    // Mostrar información del usuario
    displayUserInfo() {
        const userInfo = document.getElementById('userId');
        if (userInfo && this.currentUser) {
            userInfo.textContent = `${this.currentUser.username} (${this.currentUser.rol})`;
        }
        
        // Aplicar restricciones de acceso basadas en roles
        this.applyRoleBasedAccess();
    }
    
    // Control de acceso basado en roles
    applyRoleBasedAccess() {
        if (!this.currentUser) return;
        
        const userRole = this.currentUser.rol;
        
        // Definir permisos por rol
        const permissions = {
            'registrador': {
                allowedPages: ['registration', 'check-in'],
                hiddenElements: ['.export-btn', '#projection-btn', '#admin-panel-btn'],
                disabledFeatures: ['delete', 'admin-functions']
            },
            'admin': {
                allowedPages: ['registration', 'check-in', 'listado', 'dashboard', 'statistics'],
                hiddenElements: ['#admin-panel-btn'],
                disabledFeatures: []
            },
            'superusuario': {
                allowedPages: ['registration', 'check-in', 'listado', 'dashboard', 'statistics', 'admin'],
                hiddenElements: [],
                disabledFeatures: []
            }
        };
        
        const userPermissions = permissions[userRole] || permissions['registrador'];
        
        // Ocultar botones de navegación no permitidos
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const page = btn.dataset.page;
            if (!userPermissions.allowedPages.includes(page)) {
                btn.style.display = 'none';
            }
        });
        
        // Ocultar elementos específicos
        userPermissions.hiddenElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.style.display = 'none');
        });
        
        // Aplicar restricciones específicas por rol
        this.applySpecificRoleRestrictions(userRole, userPermissions);
    }
    
    // Aplicar restricciones específicas por rol
    applySpecificRoleRestrictions(userRole, permissions) {
        switch(userRole) {
            case 'registrador':
                // Solo puede registrar y confirmar votos
                this.restrictRegistradorAccess();
                break;
                
            case 'admin':
                // Puede ver todo excepto funciones de superusuario
                this.restrictAdminAccess();
                break;
                
            case 'superusuario':
                // Acceso completo - no hay restricciones
                break;
        }
    }
    
    // Restricciones para registradores
    restrictRegistradorAccess() {
        // Ocultar botones de eliminación
        const deleteButtons = document.querySelectorAll('.btn-danger');
        deleteButtons.forEach(btn => {
            if (btn.textContent.includes('Eliminar')) {
                btn.style.display = 'none';
            }
        });
        
        // Ocultar botones de exportación
        const exportButtons = document.querySelectorAll('#export-pdf-btn, #export-csv-btn, #export-stats-pdf-btn');
        exportButtons.forEach(btn => btn.style.display = 'none');
        
        // Redirigir a página de registro si está en una página no permitida
        if (!['registration', 'check-in'].includes(this.activePage)) {
            this.navigateToPage('registration');
        }
    }
    
    // Restricciones para administradores
    restrictAdminAccess() {
        // Los administradores tienen acceso casi completo
        // Solo se ocultan funciones de superusuario si las hay
        const superUserElements = document.querySelectorAll('.superuser-only');
        superUserElements.forEach(el => el.style.display = 'none');
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
            ubchFilterSelect.addEventListener('change', (e) => {
                // Actualizar el filtro de comunidades cuando cambie la UBCH
                this.populateCommunityFilter(e.target.value);
                this.renderFilteredTable();
            });
        }

        // Filtro por Comunidad
        const communityFilterSelect = document.getElementById('community-filter-select');
        if (communityFilterSelect) {
            communityFilterSelect.addEventListener('change', () => {
                this.renderFilteredTable();
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

        this.activePage = page;
        this.renderCurrentPage();
    }

    renderCurrentPage() {
        switch (this.activePage) {
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
        const sexo = formData.get('sexo');
        const edad = formData.get('edad');
        const ubch = formData.get('ubch');
        const community = formData.get('community');

        // Validación inicial
        if (!name || !cedula || !telefono || !sexo || !edad || !ubch || !community) {
            this.showMessage('Por favor, completa todos los campos.', 'error', 'registration');
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

            this.showMessage('¡Persona registrada con éxito!', 'success', 'registration');
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
            this.showMessage(error.message || 'Error al registrar persona. Inténtalo de nuevo.', 'error', 'registration');
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
            this.showMessage('Por favor, ingresa un número de cédula para buscar.', 'error', 'check-in');
            return;
        }

        // Usar debounce para evitar múltiples búsquedas
        const debouncedSearch = this.debounce(async (searchCedula) => {
        this.setLoadingState('check-in', true);

        try {
                const results = this.votes.filter(vote => vote.cedula === searchCedula);
            
            if (results.length === 0) {
                    this.showMessage(`No se encontró a ninguna persona con la cédula ${searchCedula}.`, 'error', 'check-in');
                return;
            }

                this.renderSearchResults(results);
                this.showMessage(`Se encontró ${results.length} persona(s) con la cédula ${searchCedula}.`, 'success', 'check-in');

        } catch (error) {
                console.error('Error en búsqueda:', error);
                this.showMessage('Error al buscar. Inténtalo de nuevo.', 'error', 'check-in');
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
        
        // Inicializar el filtro de comunidades
        this.populateCommunityFilter();
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

    // Poblar el selector de filtro por Comunidades
    populateCommunityFilter(selectedUBCH = '') {
        const communitySelect = document.getElementById('community-filter-select');
        if (!communitySelect) return;

        // Obtener comunidades según la UBCH seleccionada
        let availableCommunities;
        if (selectedUBCH) {
            // Si hay UBCH seleccionada, mostrar solo sus comunidades
            availableCommunities = [...new Set(this.votes
                .filter(vote => vote.ubch === selectedUBCH)
                .map(vote => vote.community)
                .filter(community => community)
            )];
        } else {
            // Si no hay UBCH seleccionada, mostrar todas las comunidades
            availableCommunities = [...new Set(this.votes.map(vote => vote.community).filter(community => community))];
        }
        
        // Limpiar opciones existentes excepto la primera
        communitySelect.innerHTML = '<option value="">Todas las Comunidades</option>';
        
        // Agregar opciones para cada comunidad
        availableCommunities.sort().forEach(community => {
            const option = document.createElement('option');
            option.value = community;
            option.textContent = community;
            communitySelect.appendChild(option);
        });
    }

    handleFilterChange(filter) {
        // Actualizar botones de filtro
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Resetear a página 1 cuando se cambia el filtro
        this.currentPage = 1;
        
        // Usar la función de filtrado optimizada
        this.renderFilteredTable();
    }

    // Aplicar todos los filtros (estado de voto, UBCH y comunidad)
    applyFilters() {
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';

        // Obtener filtros activos
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        const selectedUBCH = document.getElementById('ubch-filter-select').value;
        const selectedCommunity = document.getElementById('community-filter-select').value;

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

        // Filtrar por Comunidad
        if (selectedCommunity) {
            filteredVotes = filteredVotes.filter(vote => vote.community === selectedCommunity);
        }

        // Aplicar paginación a los resultados filtrados
        this.totalPages = Math.max(1, Math.ceil(filteredVotes.length / this.pageSize));
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const startIdx = (this.currentPage - 1) * this.pageSize;
        const endIdx = startIdx + this.pageSize;
        const paginatedResults = filteredVotes.slice(startIdx, endIdx);

        // Renderizar votos filtrados con paginación
        paginatedResults.forEach(vote => {
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

        // Actualizar contador de resultados (total filtrado, no solo la página actual)
        this.updateFilterCounter(filteredVotes.length);
        
        // Renderizar controles de paginación
        this.renderPaginationControls(filteredVotes.length);
    }

    // Función optimizada para renderizar tabla filtrada (mejor rendimiento)
    renderFilteredTable() {
        // Obtener estado actual de filtros
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value || '';
        const selectedCommunity = document.getElementById('community-filter-select')?.value || '';
        
        // Crear clave de estado de filtro para cache
        const filterState = `${activeFilter}-${selectedUBCH}-${selectedCommunity}`;
        
        // Si el estado del filtro no ha cambiado, no re-renderizar
        if (this.lastFilterState === filterState && this.filteredVotes.length > 0) {
            // Solo actualizar la paginación
            this.renderTablePage();
            return;
        }
        
        // Aplicar filtros (solo una vez)
        this.filteredVotes = this.votes.filter(vote => {
            // Filtro por estado de voto
            if (activeFilter === 'voted' && !vote.voted) return false;
            if (activeFilter === 'not-voted' && vote.voted) return false;
            
            // Filtro por UBCH
            if (selectedUBCH && vote.ubch !== selectedUBCH) return false;
            
            // Filtro por Comunidad
            if (selectedCommunity && vote.community !== selectedCommunity) return false;
            
            return true;
        });
        
        // Guardar estado del filtro
        this.lastFilterState = filterState;
        
        // Renderizar página actual
        this.renderTablePage();
        
        // Actualizar contador y paginación
        this.updateFilterCounter(this.filteredVotes.length);
        this.renderPaginationControls(this.filteredVotes.length);
    }
    
    // Renderizar solo la página actual (más rápido)
    renderTablePage() {
        const tbody = document.querySelector('#registros-table tbody');
        
        // Limpiar tbody de manera eficiente
        tbody.innerHTML = '';
        
        // Calcular paginación
        this.totalPages = Math.max(1, Math.ceil(this.filteredVotes.length / this.pageSize));
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        
        const startIdx = (this.currentPage - 1) * this.pageSize;
        const endIdx = startIdx + this.pageSize;
        const pageVotes = this.filteredVotes.slice(startIdx, endIdx);
        
        // Usar DocumentFragment para mejor rendimiento
        const fragment = document.createDocumentFragment();
        
        pageVotes.forEach(vote => {
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
            
            fragment.appendChild(tr);
        });
        
        // Agregar todo de una vez (más eficiente)
        tbody.appendChild(fragment);
    }

    // Actualizar contador de resultados filtrados
    updateFilterCounter(count) {
        const totalCount = this.votes.length;
        const filterCounter = document.getElementById('filter-counter');
        
        if (filterCounter) {
            // Siempre mostrar solo el número de registros en la lista actual
            filterCounter.textContent = count;
            
            // Cambiar color según si hay filtros aplicados o no
            if (count === totalCount) {
                // Sin filtros aplicados - color verde
                filterCounter.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                filterCounter.style.borderColor = '#10b981';
            } else {
                // Con filtros aplicados - color azul
                filterCounter.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                filterCounter.style.borderColor = '#3b82f6';
            }
            
            filterCounter.style.color = '#ffffff';
            
            // Agregar animación de actualización
            filterCounter.style.transform = 'scale(1.1)';
            setTimeout(() => {
                filterCounter.style.transform = 'scale(1)';
            }, 200);
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
        console.log('🎬 Activando modo proyección...');
        
        // Verificar si existe el elemento de proyección
        const projectionView = document.getElementById('projection-view');
        if (!projectionView) {
            console.error('❌ Elemento projection-view no encontrado');
            this.showMessage('Error: Vista de proyección no disponible', 'error');
            return;
        }
        
        // Mostrar vista de proyección
        projectionView.style.display = 'block';
        
        // Aplicar estilos de proyección
        document.body.classList.add('projection-mode');
        
        // Actualizar datos de proyección
        this.updateProjection();
        
        // Iniciar actualizaciones automáticas cada 5 segundos
        this.projectionInterval = setInterval(() => {
            this.updateProjection();
        }, 5000);
        
        // Mostrar mensaje de confirmación
        this.showMessage('Modo proyección activado', 'success');
        
        console.log('✅ Modo proyección activado correctamente');
    }

    exitProjectionMode() {
        console.log('🎬 Desactivando modo proyección...');
        
        // Ocultar vista de proyección
        const projectionView = document.getElementById('projection-view');
        if (projectionView) {
            projectionView.style.display = 'none';
        }
        
        // Remover estilos de proyección
        document.body.classList.remove('projection-mode');
        
        // Detener actualizaciones automáticas
        if (this.projectionInterval) {
            clearInterval(this.projectionInterval);
            this.projectionInterval = null;
        }
        
        // Mostrar mensaje de confirmación
        this.showMessage('Modo proyección desactivado', 'info');
        
        console.log('✅ Modo proyección desactivado correctamente');
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
        
        // === CONFIGURACIÓN INICIAL ===
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let currentY = 20;
        
        // === ENCABEZADO CORPORATIVO ===
        this.addCorporateHeader(doc, pageWidth);
        currentY = 60;
        
        // === RESUMEN EJECUTIVO ===
        currentY = this.addExecutiveSummary(doc, currentY, pageWidth);
        
        // === ESTADÍSTICAS GENERALES ===
        currentY = this.addGeneralStats(doc, currentY, pageWidth);
        
        // === NUEVA PÁGINA PARA GRÁFICAS ===
        doc.addPage();
        this.addCorporateHeader(doc, pageWidth);
        currentY = 70;
        
        // === GRÁFICAS Y ESTADÍSTICAS DETALLADAS ===
        currentY = this.addDetailedCharts(doc, currentY, pageWidth);
        
        // === NUEVA PÁGINA PARA TABLAS DETALLADAS ===
        doc.addPage();
        this.addCorporateHeader(doc, pageWidth);
        currentY = 70;
        
        // === TABLAS DETALLADAS ===
        currentY = this.addDetailedTables(doc, currentY, pageWidth);
        
        // === PIE DE PÁGINA ===
        this.addFooter(doc, pageWidth, pageHeight);
        
        // === GUARDAR ARCHIVO ===
        const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
        const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        doc.save(`Reporte_Estadisticas_${fecha}_${hora}.pdf`);
    }
    
    // === FUNCIONES AUXILIARES PARA EL PDF ===
    
    addCorporateHeader(doc, pageWidth) {
        // Fondo del encabezado
        doc.setFillColor(52, 152, 219); // Azul corporativo
        doc.rect(0, 0, pageWidth, 50, 'F');
        
        // Título principal
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('SISTEMA DE REGISTRO DE VOTOS 2025', pageWidth / 2, 20, { align: 'center' });
        
        // Subtítulo
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Reporte Estadístico Completo', pageWidth / 2, 30, { align: 'center' });
        
        // Fecha y hora de generación
        doc.setFontSize(10);
        const fechaHora = new Date().toLocaleString('es-ES');
        doc.text(`Generado: ${fechaHora}`, pageWidth / 2, 40, { align: 'center' });
        
        // Usuario que genera el reporte
        doc.text(`Usuario: ${this.currentUser.username} (${this.currentUser.rol})`, pageWidth / 2, 45, { align: 'center' });
        
        // Restablecer color de texto
        doc.setTextColor(0, 0, 0);
    }
    
    addExecutiveSummary(doc, startY, pageWidth) {
        const totalRegistered = this.votes.length;
        const totalVoted = this.votes.filter(vote => vote.voted).length;
        const totalPending = totalRegistered - totalVoted;
        const participationRate = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;
        
        // Título de sección
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 152, 219);
        doc.text('📊 RESUMEN EJECUTIVO', 14, startY);
        
        // Cuadro de resumen
        doc.setDrawColor(52, 152, 219);
        doc.setLineWidth(1);
        doc.rect(14, startY + 5, pageWidth - 28, 45);
        
        // Datos del resumen
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        const summaryY = startY + 15;
        doc.text(`Total de Personas Registradas: ${totalRegistered}`, 20, summaryY);
        doc.text(`Total de Votos Confirmados: ${totalVoted}`, 20, summaryY + 8);
        doc.text(`Pendientes por Votar: ${totalPending}`, 20, summaryY + 16);
        doc.text(`Tasa de Participación: ${participationRate.toFixed(2)}%`, 20, summaryY + 24);
        
        // Indicador visual de participación
        const barWidth = 100;
        const barHeight = 8;
        const barX = pageWidth - 130;
        const barY = summaryY + 20;
        
        // Fondo de la barra
        doc.setFillColor(220, 220, 220);
        doc.rect(barX, barY, barWidth, barHeight, 'F');
        
        // Barra de progreso
        doc.setFillColor(52, 152, 219);
        doc.rect(barX, barY, (barWidth * participationRate) / 100, barHeight, 'F');
        
        return startY + 60;
    }
    
    addGeneralStats(doc, startY, pageWidth) {
        // Título de sección
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 152, 219);
        doc.text('📈 ESTADÍSTICAS GENERALES', 14, startY);
        
        const votedVotes = this.votes.filter(vote => vote.voted);
        
        // Estadísticas por sexo
        const sexoStats = {};
        votedVotes.forEach(vote => {
            const sexo = vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'No especificado';
            sexoStats[sexo] = (sexoStats[sexo] || 0) + 1;
        });
        
        // Estadísticas por edad
        const edadStats = {
            '16-25 años': 0,
            '26-35 años': 0,
            '36-45 años': 0,
            '46-55 años': 0,
            '56-65 años': 0,
            '66+ años': 0,
            'No especificado': 0
        };
        
        votedVotes.forEach(vote => {
            const edad = vote.edad || 0;
            if (edad >= 16 && edad <= 25) edadStats['16-25 años']++;
            else if (edad >= 26 && edad <= 35) edadStats['26-35 años']++;
            else if (edad >= 36 && edad <= 45) edadStats['36-45 años']++;
            else if (edad >= 46 && edad <= 55) edadStats['46-55 años']++;
            else if (edad >= 56 && edad <= 65) edadStats['56-65 años']++;
            else if (edad >= 66) edadStats['66+ años']++;
            else edadStats['No especificado']++;
        });
        
        // Tabla de estadísticas por sexo
        doc.autoTable({
            startY: startY + 10,
            head: [['Distribución por Sexo', 'Cantidad', 'Porcentaje']],
            body: Object.entries(sexoStats).map(([sexo, count]) => {
                const percentage = votedVotes.length > 0 ? ((count / votedVotes.length) * 100).toFixed(1) : '0';
                return [sexo, count, `${percentage}%`];
            }),
            headStyles: { 
                fillColor: [52, 152, 219],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            theme: 'striped',
            margin: { left: 14, right: 14 }
        });
        
        // Tabla de estadísticas por edad
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Distribución por Edad', 'Cantidad', 'Porcentaje']],
            body: Object.entries(edadStats)
                .filter(([, count]) => count > 0)
                .map(([rango, count]) => {
                    const percentage = votedVotes.length > 0 ? ((count / votedVotes.length) * 100).toFixed(1) : '0';
                    return [rango, count, `${percentage}%`];
                }),
            headStyles: { 
                fillColor: [52, 152, 219],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            theme: 'striped',
            margin: { left: 14, right: 14 }
        });
        
        return doc.lastAutoTable.finalY + 20;
    }
    
    addDetailedCharts(doc, startY, pageWidth) {
        // Título de sección
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 152, 219);
        doc.text('📊 GRÁFICAS Y ANÁLISIS DETALLADO', 14, startY);
        
        const votedVotes = this.votes.filter(vote => vote.voted);
        
        // Crear gráfico de barras simulado para UBCH
        const ubchStats = {};
        votedVotes.forEach(vote => {
            ubchStats[vote.ubch] = (ubchStats[vote.ubch] || 0) + 1;
        });
        
        // Título del gráfico
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Participación por UBCH (Top 10)', 14, startY + 20);
        
        // Crear "gráfico" de barras con texto
        const topUBCH = Object.entries(ubchStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
            
        const maxVotes = Math.max(...topUBCH.map(([,votes]) => votes));
        const chartStartY = startY + 30;
        const barHeight = 6;
        const maxBarWidth = 120;
        
        topUBCH.forEach(([ubch, votes], index) => {
            const y = chartStartY + (index * 12);
            const barWidth = maxVotes > 0 ? (votes / maxVotes) * maxBarWidth : 0;
            
            // Nombre de la UBCH (truncado si es muy largo)
            const ubchName = ubch.length > 35 ? ubch.substring(0, 32) + '...' : ubch;
            doc.setFontSize(8);
            doc.text(ubchName, 14, y + 4);
            
            // Barra de progreso
            doc.setFillColor(52, 152, 219);
            doc.rect(14, y + 6, barWidth, barHeight, 'F');
            
            // Valor numérico
            doc.text(votes.toString(), 140, y + 10);
        });
        
        // Análisis de tendencias
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('📈 ANÁLISIS DE TENDENCIAS', 14, chartStartY + 140);
        
        const totalVoted = votedVotes.length;
        const totalRegistered = this.votes.length;
        const participationRate = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const analysisY = chartStartY + 150;
        doc.text(`• Tasa de participación actual: ${participationRate.toFixed(2)}%`, 14, analysisY);
        
        if (participationRate > 70) {
            doc.text('• Participación EXCELENTE - Meta superada', 14, analysisY + 8);
        } else if (participationRate > 50) {
            doc.text('• Participación BUENA - Dentro de expectativas', 14, analysisY + 8);
        } else {
            doc.text('• Participación REGULAR - Requiere impulso', 14, analysisY + 8);
        }
        
        const topUBCHName = topUBCH.length > 0 ? topUBCH[0][0] : 'N/A';
        doc.text(`• UBCH con mayor participación: ${topUBCHName}`, 14, analysisY + 16);
        
        return analysisY + 30;
    }
    
    addDetailedTables(doc, startY, pageWidth) {
        const votedVotes = this.votes.filter(vote => vote.voted);
        
        // Título de sección
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 152, 219);
        doc.text('📋 TABLAS DETALLADAS', 14, startY);
        
        // Estadísticas por UBCH
        const ubchStats = {};
        const ubchTotal = {};
        
        // Contar totales y votados por UBCH
        this.votes.forEach(vote => {
            ubchTotal[vote.ubch] = (ubchTotal[vote.ubch] || 0) + 1;
            if (vote.voted) {
                ubchStats[vote.ubch] = (ubchStats[vote.ubch] || 0) + 1;
            }
        });
        
        // Tabla detallada por UBCH
        const ubchTableData = Object.keys(ubchTotal)
            .map(ubch => {
                const total = ubchTotal[ubch];
                const voted = ubchStats[ubch] || 0;
                const pending = total - voted;
                const percentage = total > 0 ? ((voted / total) * 100).toFixed(1) : '0';
                
                return [
                    ubch.length > 40 ? ubch.substring(0, 37) + '...' : ubch,
                    total,
                    voted,
                    pending,
                    `${percentage}%`
                ];
            })
            .sort((a, b) => b[2] - a[2]); // Ordenar por votos descendente
        
        doc.autoTable({
            startY: startY + 15,
            head: [['UBCH', 'Total', 'Votaron', 'Pendientes', '% Participación']],
            body: ubchTableData,
            headStyles: { 
                fillColor: [52, 152, 219],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                fontSize: 8
            },
            theme: 'striped',
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 25, halign: 'center' }
            }
        });
        
        let currentY = doc.lastAutoTable.finalY + 15;
        
        // Estadísticas por Comunidad (Top 15)
        const communityStats = {};
        const communityTotal = {};
        
        this.votes.forEach(vote => {
            communityTotal[vote.community] = (communityTotal[vote.community] || 0) + 1;
            if (vote.voted) {
                communityStats[vote.community] = (communityStats[vote.community] || 0) + 1;
            }
        });
        
        const topCommunities = Object.keys(communityTotal)
            .map(community => {
                const total = communityTotal[community];
                const voted = communityStats[community] || 0;
                const percentage = total > 0 ? ((voted / total) * 100).toFixed(1) : '0';
                return [community, total, voted, `${percentage}%`];
            })
            .sort((a, b) => b[2] - a[2])
            .slice(0, 15);
        
        // Verificar si hay espacio en la página
        if (currentY > 200) {
            doc.addPage();
            this.addCorporateHeader(doc, pageWidth);
            currentY = 70;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 152, 219);
        doc.text('Top 15 Comunidades por Participación', 14, currentY);
        
        doc.autoTable({
            startY: currentY + 10,
            head: [['Comunidad', 'Total', 'Votaron', '% Participación']],
            body: topCommunities,
            headStyles: { 
                fillColor: [52, 152, 219],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                fontSize: 9
            },
            theme: 'striped',
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' }
            }
        });
        
        return doc.lastAutoTable.finalY + 20;
    }
    
    addFooter(doc, pageWidth, pageHeight) {
        // Agregar pie de página a todas las páginas
        const pageCount = doc.internal.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Línea separadora
            doc.setDrawColor(52, 152, 219);
            doc.setLineWidth(0.5);
            doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
            
            // Texto del pie de página
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            
            // Información del sistema
            doc.text('Sistema de Registro de Votos 2025 - Reporte Generado Automáticamente', 14, pageHeight - 15);
            
            // Número de página
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pageHeight - 15);
            
            // Marca de tiempo
            const timestamp = new Date().toLocaleString('es-ES');
            doc.text(`Generado: ${timestamp}`, 14, pageHeight - 10);
            
            // Usuario
            doc.text(`Usuario: ${this.currentUser.username}`, pageWidth - 60, pageHeight - 10);
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