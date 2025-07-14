// Gestor de Servicios 24/7 - Sistema de Votos 2025
class ServiceManager {
    constructor() {
        this.services = {
            firebase: { status: 'offline', lastCheck: null, retries: 0 },
            database: { status: 'offline', lastCheck: null, retries: 0 },
            sync: { status: 'offline', lastCheck: null, retries: 0 }
        };
        
        this.autoRestart = true;
        this.maxRetries = 5;
        this.checkInterval = 30000; // 30 segundos
        this.restartDelay = 5000; // 5 segundos
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Iniciando Gestor de Servicios 24/7...');
        
        // Iniciar monitoreo automático
        this.startMonitoring();
        
        // Configurar listeners de eventos
        this.setupEventListeners();
        
        // Verificar servicios iniciales
        await this.checkAllServices();
        
        console.log('✅ Gestor de Servicios iniciado correctamente');
    }
    
    startMonitoring() {
        // Verificar servicios cada 30 segundos
        setInterval(() => {
            this.checkAllServices();
        }, this.checkInterval);
        
        // Verificar conexión de red
        setInterval(() => {
            this.checkNetworkConnection();
        }, 10000); // 10 segundos
        
        // Limpiar logs antiguos
        setInterval(() => {
            this.cleanupOldLogs();
        }, 300000); // 5 minutos
    }
    
    setupEventListeners() {
        // Escuchar eventos de pérdida de conexión
        window.addEventListener('online', () => {
            this.handleNetworkRecovery();
        });
        
        window.addEventListener('offline', () => {
            this.handleNetworkLoss();
        });
        
        // Escuchar eventos de visibilidad de página
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handlePageVisible();
            }
        });
        
        // Escuchar eventos de Firebase
        if (window.firebaseDB && window.firebaseDB.votesCollection && typeof window.firebaseDB.votesCollection.onSnapshot === 'function') {
            try {
                window.firebaseDB.votesCollection.onSnapshot(() => {
                    this.services.firebase.status = 'online';
                    this.services.firebase.lastCheck = Date.now();
                }, (error) => {
                    this.handleFirebaseError(error);
                });
            } catch (error) {
                console.warn('⚠️ No se pudo configurar listener de Firebase:', error.message);
            }
        } else {
            console.warn('⚠️ Firebase no disponible para listener en tiempo real');
        }
    }
    
    async checkAllServices() {
        console.log('🔍 Verificando servicios...');
        
        // Verificar Firebase
        await this.checkFirebaseService();
        
        // Verificar base de datos
        await this.checkDatabaseService();
        
        // Verificar sincronización
        await this.checkSyncService();
        
        // Actualizar indicadores
        this.updateServiceIndicators();
    }
    
    async checkFirebaseService() {
        try {
            if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
                throw new Error('Firebase no está disponible');
            }
            
            const testDoc = await window.firebaseDB.votesCollection.limit(1).get();
            this.services.firebase.status = 'online';
            this.services.firebase.lastCheck = Date.now();
            this.services.firebase.retries = 0;
            
            console.log('✅ Firebase: Online');
        } catch (error) {
            this.services.firebase.status = 'offline';
            this.services.firebase.retries++;
            
            console.error('❌ Firebase: Offline -', error.message);
            
            if (this.autoRestart && this.services.firebase.retries < this.maxRetries) {
                setTimeout(() => {
                    this.restartFirebaseService();
                }, this.restartDelay);
            }
        }
    }
    
    async checkDatabaseService() {
        try {
            // Verificar acceso a datos
            if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
                throw new Error('Base de datos no disponible');
            }
            
            const snapshot = await window.firebaseDB.votesCollection.get();
            this.services.database.status = 'online';
            this.services.database.lastCheck = Date.now();
            this.services.database.retries = 0;
            
            console.log('✅ Base de datos: Online');
        } catch (error) {
            this.services.database.status = 'offline';
            this.services.database.retries++;
            
            console.error('❌ Base de datos: Offline -', error.message);
            
            if (this.autoRestart && this.services.database.retries < this.maxRetries) {
                setTimeout(() => {
                    this.restartDatabaseService();
                }, this.restartDelay);
            }
        }
    }
    
    async checkSyncService() {
        try {
            // Verificar que el listener esté activo
            if (window.votingSystem && window.votingSystem.unsubscribeListener) {
                this.services.sync.status = 'online';
                this.services.sync.lastCheck = Date.now();
                this.services.sync.retries = 0;
                
                console.log('✅ Sincronización: Online');
            } else {
                throw new Error('Listener no está activo');
            }
        } catch (error) {
            this.services.sync.status = 'offline';
            this.services.sync.retries++;
            
            console.error('❌ Sincronización: Offline -', error.message);
            
            if (this.autoRestart && this.services.sync.retries < this.maxRetries) {
                setTimeout(() => {
                    this.restartSyncService();
                }, this.restartDelay);
            }
        }
    }
    
    checkNetworkConnection() {
        if (navigator.onLine) {
            console.log('🌐 Conexión de red: Online');
        } else {
            console.warn('🌐 Conexión de red: Offline');
            this.handleNetworkLoss();
        }
    }
    
    handleNetworkRecovery() {
        console.log('🌐 Recuperación de conexión detectada');
        
        // Reintentar conexión a servicios
        setTimeout(() => {
            this.checkAllServices();
        }, 2000);
    }
    
    handleNetworkLoss() {
        console.warn('🌐 Pérdida de conexión detectada');
        
        // Marcar servicios como offline
        Object.keys(this.services).forEach(service => {
            this.services[service].status = 'offline';
        });
        
        this.updateServiceIndicators();
    }
    
    handlePageVisible() {
        console.log('📱 Página visible - Verificando servicios');
        
        // Verificar servicios cuando la página vuelve a ser visible
        setTimeout(() => {
            this.checkAllServices();
        }, 1000);
    }
    
    handleFirebaseError(error) {
        console.error('🔥 Error de Firebase:', error);
        this.services.firebase.status = 'offline';
        this.services.firebase.retries++;
        
        if (this.autoRestart && this.services.firebase.retries < this.maxRetries) {
            setTimeout(() => {
                this.restartFirebaseService();
            }, this.restartDelay);
        }
    }
    
    async restartFirebaseService() {
        console.log('🔄 Reiniciando servicio Firebase...');
        
        try {
            // Reconfigurar Firebase
            if (window.firebaseDB) {
                // Reconfigurar listener
                if (window.votingSystem && window.votingSystem.setupRealtimeListener) {
                    window.votingSystem.setupRealtimeListener();
                }
                
                console.log('✅ Servicio Firebase reiniciado');
            }
        } catch (error) {
            console.error('❌ Error reiniciando Firebase:', error);
        }
    }
    
    async restartDatabaseService() {
        console.log('🔄 Reiniciando servicio de base de datos...');
        try {
            // Recargar datos SOLO si no está en registro
            if (window.votingSystem && window.votingSystem.loadDataFromFirebase) {
                if (window.votingSystem.currentPage !== 'registration') {
                    await window.votingSystem.loadDataFromFirebase();
                } else {
                    console.log('⏸️ Recarga de datos evitada en sección de registro');
                }
            }
            console.log('✅ Servicio de base de datos reiniciado');
        } catch (error) {
            console.error('❌ Error reiniciando base de datos:', error);
        }
    }
    
    async restartSyncService() {
        console.log('🔄 Reiniciando servicio de sincronización...');
        try {
            // Reconfigurar sincronización SOLO si no está en registro
            if (window.votingSystem && window.votingSystem.setupRealtimeListener) {
                if (window.votingSystem.currentPage !== 'registration') {
                    window.votingSystem.setupRealtimeListener();
                } else {
                    console.log('⏸️ Reconfiguración de listener evitada en sección de registro');
                }
            }
            console.log('✅ Servicio de sincronización reiniciado');
        } catch (error) {
            console.error('❌ Error reiniciando sincronización:', error);
        }
    }
    
    updateServiceIndicators() {
        // Actualizar indicadores en el panel de administración si existe
        const indicators = {
            'firebase-status': this.services.firebase.status,
            'database-status': this.services.database.status,
            'sync-status': this.services.sync.status
        };
        
        Object.keys(indicators).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.className = `status-indicator status-${indicators[id]}`;
            }
        });
    }
    
    cleanupOldLogs() {
        // Limpiar logs antiguos para evitar acumulación
        const logs = document.querySelectorAll('.log-entry');
        if (logs.length > 100) {
            const logsToRemove = logs.length - 50;
            for (let i = 0; i < logsToRemove; i++) {
                logs[i].remove();
            }
        }
    }
    
    // Métodos públicos para control manual
    enableAutoRestart() {
        this.autoRestart = true;
        console.log('✅ Auto-reinicio habilitado');
    }
    
    disableAutoRestart() {
        this.autoRestart = false;
        console.log('❌ Auto-reinicio deshabilitado');
    }
    
    getServiceStatus() {
        return this.services;
    }
    
    forceRestart() {
        console.log('🔄 Reinicio forzado de todos los servicios...');
        // Solo reiniciar si no está en registro
        if (window.votingSystem && window.votingSystem.currentPage === 'registration') {
            console.log('⏸️ Reinicio global evitado en sección de registro');
            return;
        }
        this.restartFirebaseService();
        this.restartDatabaseService();
        this.restartSyncService();
    }
}

// Inicializar gestor de servicios cuando se carga la página
window.addEventListener('load', () => {
    // Esperar a que Firebase esté disponible
    setTimeout(() => {
        if (window.firebaseDB) {
            window.serviceManager = new ServiceManager();
        } else {
            console.warn('⚠️ Firebase no disponible para el gestor de servicios');
        }
    }, 2000);
});

// Exportar para uso global
window.ServiceManager = ServiceManager;