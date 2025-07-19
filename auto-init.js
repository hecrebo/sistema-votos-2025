// auto-init.js
// Sistema de inicialización automática global para el Sistema de Votos 2025

class AutoInitSystem {
    constructor() {
        this.initialized = false;
        this.initQueue = [];
        this.errorCount = 0;
        this.maxErrors = 5;
        
        // Configuración automática
        this.config = {
            autoSync: true,
            autoBackup: true,
            autoRecovery: true,
            autoProjection: true,
            autoNotifications: true,
            autoErrorHandling: true
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Iniciando sistema automático global...');
            
            // 1. Verificar entorno
            await this.checkEnvironment();
            
            // 2. Configurar notificaciones automáticas
            this.setupAutoNotifications();
            
            // 3. Configurar manejo automático de errores
            this.setupAutoErrorHandling();
            
            // 4. Configurar auto-backup global
            this.setupGlobalAutoBackup();
            
            // 5. Configurar auto-recuperación global
            this.setupGlobalAutoRecovery();
            
            // 6. Configurar auto-sincronización global
            this.setupGlobalAutoSync();
            
            // 7. Configurar auto-proyección global
            this.setupGlobalAutoProjection();
            
            // 8. Inicializar componentes principales
            await this.initializeComponents();
            
            this.initialized = true;
            console.log('✅ Sistema automático global iniciado correctamente');
            
            // Mostrar notificación de éxito
            this.showSystemNotification('Sistema automático iniciado correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error en inicialización automática global:', error);
            this.handleGlobalError(error);
        }
    }

    // === VERIFICACIÓN DE ENTORNO ===
    async checkEnvironment() {
        console.log('🔍 Verificando entorno...');
        
        // Verificar navegador
        this.checkBrowserCompatibility();
        
        // Verificar conectividad
        this.checkConnectivity();
        
        // Verificar almacenamiento
        this.checkStorage();
        
        // Verificar permisos
        await this.checkPermissions();
        
        console.log('✅ Entorno verificado correctamente');
    }

    checkBrowserCompatibility() {
        const requiredFeatures = [
            'localStorage',
            'fetch',
            'Promise',
            'async',
            'await'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => {
            switch(feature) {
                case 'localStorage':
                    return !window.localStorage;
                case 'fetch':
                    return !window.fetch;
                case 'Promise':
                    return !window.Promise;
                case 'async':
                    return !(async () => {}).constructor;
                case 'await':
                    return !(async () => { await Promise.resolve(); }).constructor;
                default:
                    return false;
            }
        });
        
        if (missingFeatures.length > 0) {
            throw new Error(`Navegador incompatible. Características faltantes: ${missingFeatures.join(', ')}`);
        }
    }

    checkConnectivity() {
        if (!navigator.onLine) {
            console.warn('⚠️ Sin conexión a internet - Modo offline activado');
        }
    }

    checkStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (error) {
            throw new Error('Almacenamiento local no disponible');
        }
    }

    async checkPermissions() {
        // Verificar permisos de notificación (sin solicitar)
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                console.log('✅ Permisos de notificación ya concedidos');
            } else if (Notification.permission === 'denied') {
                console.log('❌ Permisos de notificación denegados');
            } else {
                console.log('ℹ️ Permisos de notificación no solicitados (se solicitan en el login)');
            }
        }
    }

    // === NOTIFICACIONES AUTOMÁTICAS ===
    setupAutoNotifications() {
        if (!this.config.autoNotifications) return;
        
        // Notificar cambios de estado
        this.notificationQueue = [];
        this.isShowingNotification = false;
        
        // Mostrar notificaciones en cola
        setInterval(() => {
            this.processNotificationQueue();
        }, 2000);
    }

    showSystemNotification(message, type = 'info') {
        if (!this.config.autoNotifications) return;
        
        this.notificationQueue.push({ message, type, timestamp: Date.now() });
    }

    processNotificationQueue() {
        if (this.isShowingNotification || this.notificationQueue.length === 0) return;
        
        this.isShowingNotification = true;
        const notification = this.notificationQueue.shift();
        
        // Mostrar notificación del sistema
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Sistema de Votos 2025', {
                body: notification.message,
                icon: 'logo.jpg',
                tag: 'system-notification'
            });
        }
        
        // Mostrar toast visual
        this.showToast(notification.message, notification.type);
        
        setTimeout(() => {
            this.isShowingNotification = false;
        }, 3000);
    }

    showToast(message, type = 'info') {
        let toast = document.getElementById('system-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'system-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 12px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                max-width: 300px;
            `;
            document.body.appendChild(toast);
        }

        const colors = {
            success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };

        toast.style.background = colors[type] || colors.info;
        toast.textContent = message;
        toast.style.transform = 'translateX(0)';

        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
        }, 4000);
    }

    // === MANEJO AUTOMÁTICO DE ERRORES ===
    setupAutoErrorHandling() {
        if (!this.config.autoErrorHandling) return;
        
        // Interceptar errores globales
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error);
        });

        // Interceptar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason);
        });
    }

    handleGlobalError(error) {
        this.errorCount++;
        console.error('❌ Error global detectado:', error);
        // Solo mostrar notificación si es crítico o si hay varios errores
        const errorMsg = (error && error.message) ? error.message : String(error);
        const isCritical = /firebase|service worker|no se pudo inicializar|no se pudo cargar|critical|fatal|database|sync/i.test(errorMsg);
        if (this.errorCount >= 2 || isCritical) {
            this.showSystemNotification('Error detectado. Recuperando automáticamente...', 'error');
        } else {
            // Solo loguear en consola, no mostrar notificación visual
            console.warn('Error menor detectado, no se muestra notificación visual:', errorMsg);
        }
        // Intentar recuperación automática
        this.autoRecover();
        // Si hay demasiados errores, reiniciar el sistema
        if (this.errorCount >= this.maxErrors) {
            this.restartSystem();
        }
    }

    async autoRecover() {
        try {
            // 1. Verificar conectividad
            if (!navigator.onLine) {
                this.showSystemNotification('Modo offline activado', 'warning');
                return;
            }

            // 2. Reintentar operaciones fallidas
            await this.retryFailedOperations();

            // 3. Restaurar estado de la aplicación
            this.restoreSystemState();

            this.showSystemNotification('Recuperación automática completada', 'success');
            
        } catch (error) {
            console.error('❌ Error en recuperación automática:', error);
            this.showSystemNotification('Error en recuperación automática', 'error');
        }
    }

    async retryFailedOperations() {
        // Reintentar operaciones fallidas
        if (window.syncManager) {
            await window.syncManager.retryFailedRecords();
        }
        
        if (window.votingSystem && typeof window.votingSystem.syncData === 'function') {
            await window.votingSystem.syncData();
        } else {
            console.warn('⚠️ syncData no disponible en votingSystem');
        }
    }

    restoreSystemState() {
        // Restaurar estado de componentes principales
        if (window.votingSystem) {
            window.votingSystem.renderCurrentPage();
        }
    }

    restartSystem() {
        console.log('🔄 Reiniciando sistema automático...');
        this.showSystemNotification('Reiniciando sistema...', 'warning');
        
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }

    // === AUTO-BACKUP GLOBAL ===
    setupGlobalAutoBackup() {
        if (!this.config.autoBackup) return;
        
        // Backup automático cada 10 minutos
        setInterval(() => {
            this.createGlobalBackup();
        }, 10 * 60 * 1000);
        
        // Backup antes de cerrar la página
        window.addEventListener('beforeunload', () => {
            this.createGlobalBackup();
        });
    }

    createGlobalBackup() {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                systemState: {
                    votes: window.votingSystem ? window.votingSystem.votes : [],
                    syncQueue: window.syncManager ? window.syncManager.localQueue : [],
                    user: window.votingSystem ? window.votingSystem.currentUser : null
                },
                config: this.config
            };

            localStorage.setItem('globalBackup', JSON.stringify(backupData));
            console.log('💾 Backup global creado');
        } catch (error) {
            console.error('❌ Error creando backup global:', error);
        }
    }

    restoreFromGlobalBackup() {
        try {
            const backupData = localStorage.getItem('globalBackup');
            if (backupData) {
                const backup = JSON.parse(backupData);
                
                if (window.votingSystem && backup.systemState.votes) {
                    window.votingSystem.votes = backup.systemState.votes;
                }
                
                console.log('🔄 Sistema restaurado desde backup global');
                return true;
            }
        } catch (error) {
            console.error('❌ Error restaurando desde backup global:', error);
        }
        return false;
    }

    // === AUTO-RECUPERACIÓN GLOBAL ===
    setupGlobalAutoRecovery() {
        if (!this.config.autoRecovery) return;
        
        // Verificar integridad del sistema cada 5 minutos
        setInterval(() => {
            this.checkSystemIntegrity();
        }, 5 * 60 * 1000);
    }

    checkSystemIntegrity() {
        // Verificar que los componentes principales estén funcionando
        const issues = [];
        
        if (!window.votingSystem) {
            issues.push('Sistema de votos no disponible');
        }
        
        if (!window.syncManager) {
            issues.push('Gestor de sincronización no disponible');
        }
        
        if (issues.length > 0) {
            console.warn('⚠️ Problemas de integridad detectados:', issues);
            this.autoRecover();
        }
    }

    // === AUTO-SINCRONIZACIÓN GLOBAL ===
    setupGlobalAutoSync() {
        if (!this.config.autoSync) return;
        
        // Sincronización global cada 2 minutos
        setInterval(async () => {
            try {
                if (window.syncManager) {
                    await window.syncManager.syncPendingRecords();
                }
                
                if (window.votingSystem && typeof window.votingSystem.syncData === 'function') {
                    await window.votingSystem.syncData();
                }
            } catch (error) {
                console.error('❌ Error en sincronización global:', error);
            }
        }, 2 * 60 * 1000);
    }

    // === AUTO-PROYECCIÓN GLOBAL ===
    setupGlobalAutoProjection() {
        if (!this.config.autoProjection) return;
        
        // Detectar modo proyección global
        const checkGlobalProjection = () => {
            const isLargeScreen = window.innerWidth >= 1920 && window.innerHeight >= 1080;
            const isFullscreen = document.fullscreenElement !== null;
            const isProjectionMode = window.location.search.includes('projection=true');
            
            if (isLargeScreen || isFullscreen || isProjectionMode) {
                this.enterGlobalProjectionMode();
            } else {
                this.exitGlobalProjectionMode();
            }
        };
        
        window.addEventListener('resize', checkGlobalProjection);
        window.addEventListener('fullscreenchange', checkGlobalProjection);
        
        // Verificar inicialmente
        setTimeout(checkGlobalProjection, 2000);
    }

    enterGlobalProjectionMode() {
        if (this.globalProjectionMode) return;
        
        this.globalProjectionMode = true;
        console.log('📺 Modo proyección global activado');
        
        // Aplicar estilos globales
        document.body.classList.add('global-projection-mode');
        
        // Navegar a estadísticas si está disponible
        if (window.votingSystem) {
            window.votingSystem.navigateToPage('statistics');
        }
        
        this.showSystemNotification('Modo proyección global activado', 'info');
    }

    exitGlobalProjectionMode() {
        if (!this.globalProjectionMode) return;
        
        this.globalProjectionMode = false;
        console.log('📱 Modo proyección global desactivado');
        
        // Remover estilos globales
        document.body.classList.remove('global-projection-mode');
        
        this.showSystemNotification('Modo proyección global desactivado', 'info');
    }

    // === INICIALIZACIÓN DE COMPONENTES ===
    async initializeComponents() {
        console.log('🔧 Inicializando componentes...');
        
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Inicializar componentes principales
        this.initQueue = [
            () => this.initVotingSystem(),
            () => this.initSyncManager(),
            () => this.initServiceWorker(),
            () => this.initPWA()
        ];
        
        // Ejecutar inicializaciones en secuencia
        for (const initFn of this.initQueue) {
            try {
                await initFn();
            } catch (error) {
                console.error('❌ Error inicializando componente:', error);
            }
        }
    }

    async initVotingSystem() {
        try {
            console.log('🔧 Inicializando sistema de votos...');
            
            // Verificar si ya existe una instancia válida
            if (window.votingSystem && window.votingSystemInitialized) {
                console.log('✅ Sistema de votos ya inicializado, usando instancia existente');
                return;
            }
            
            // Verificar si VotingSystemFirebase está disponible
            if (typeof VotingSystemFirebase !== 'undefined') {
                // Solo crear nueva instancia si no existe
                if (!window.votingSystem) {
                    window.votingSystem = new VotingSystemFirebase();
                    console.log('✅ Sistema de votos Firebase inicializado');
                } else {
                    console.log('⚠️ Instancia de sistema de votos ya existe');
                }
            } else if (typeof VotingSystem !== 'undefined') {
                if (!window.votingSystem) {
            window.votingSystem = new VotingSystem();
                    console.log('✅ Sistema de votos básico inicializado');
                }
            } else {
                console.warn('⚠️ No se encontró sistema de votos disponible');
                // Crear un sistema básico de fallback solo si no existe
                if (!window.votingSystem) {
                    window.votingSystem = {
                        currentPage: 'registration',
                        votes: [],
                        init: async () => console.log('🔧 Sistema de fallback inicializado'),
                        setupEventListeners: () => console.log('🔧 Event listeners de fallback configurados'),
                        renderCurrentPage: () => console.log('📄 Renderizado de fallback'),
                        showMessage: (msg, type, page) => console.log(`💬 [${type}] ${msg}`),
                        setLoadingState: (page, loading) => console.log(`⏳ [${page}] Loading: ${loading}`),
                        syncData: async () => {
                            console.log('🔄 Sincronización de fallback ejecutada');
                            return true;
                        }
                    };
                }
            }
            
            // Inicializar el sistema si tiene método init y no se ha inicializado
            if (window.votingSystem && typeof window.votingSystem.init === 'function' && !window.votingSystemInitialized) {
                await window.votingSystem.init();
                window.votingSystemInitialized = true;
                console.log('✅ Sistema de votos inicializado completamente');
            }
            
        } catch (error) {
            console.error('❌ Error inicializando sistema de votos:', error);
            // Crear sistema de fallback en caso de error solo si no existe
            if (!window.votingSystem) {
                window.votingSystem = {
                    currentPage: 'registration',
                    votes: [],
                    init: async () => console.log('🔧 Sistema de fallback por error inicializado'),
                    setupEventListeners: () => console.log('🔧 Event listeners de fallback por error configurados'),
                    renderCurrentPage: () => console.log('📄 Renderizado de fallback por error'),
                    showMessage: (msg, type, page) => console.log(`💬 [${type}] ${msg}`),
                    setLoadingState: (page, loading) => console.log(`⏳ [${page}] Loading: ${loading}`),
                    syncData: async () => {
                        console.log('🔄 Sincronización de fallback por error ejecutada');
                        return true;
                    }
                };
            }
        }
    }

    async initSyncManager() {
        if (!window.syncManager) {
            console.log('🔧 Inicializando gestor de sincronización...');
            window.syncManager = new SyncManager();
        }
    }

    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                console.log('🔧 Registrando service worker...');
                
                // Verificar si estamos en un entorno que soporta Service Workers
                const isLocalFile = window.location.protocol === 'file:';
                const isLocalhost = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1';
                
                if (isLocalFile) {
                    console.log('⚠️ Service Worker no disponible en archivos locales (file://). Usando modo offline básico.');
                    this.setupBasicOfflineMode();
                    return;
                }
                
                // Solo registrar Service Worker en entornos HTTP/HTTPS
                if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                    await navigator.serviceWorker.register('service-worker.js');
                    console.log('✅ Service worker registrado');
                } else {
                    console.log('⚠️ Protocolo no soportado para Service Worker:', window.location.protocol);
                    this.setupBasicOfflineMode();
                }
            } catch (error) {
                console.error('❌ Error registrando service worker:', error);
                console.log('🔄 Usando modo offline básico como fallback');
                this.setupBasicOfflineMode();
            }
        } else {
            console.log('⚠️ Service Worker no soportado en este navegador');
            this.setupBasicOfflineMode();
        }
    }

    // Modo offline básico como fallback
    setupBasicOfflineMode() {
        console.log('🔧 Configurando modo offline básico...');
        
        // Detectar cambios de conectividad
        window.addEventListener('online', () => {
            console.log('🌐 Conexión restaurada');
            this.showSystemNotification('Conexión a internet restaurada', 'success');
            
            // Reintentar sincronización
            if (window.syncManager) {
                window.syncManager.syncPendingRecords();
            }
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Conexión perdida');
            this.showSystemNotification('Sin conexión a internet - Modo offline activado', 'warning');
        });
        
        // Almacenamiento local como fallback
        if (window.localStorage) {
            console.log('💾 Almacenamiento local disponible');
        }
        
        console.log('✅ Modo offline básico configurado');
    }

    async initPWA() {
        // Configurar PWA automáticamente
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            console.log('🔧 Configurando PWA...');
            // Aquí se configurarían las notificaciones push y otras características PWA
        }
    }

    // === UTILIDADES ===
    getSystemStatus() {
        return {
            initialized: this.initialized,
            errorCount: this.errorCount,
            config: this.config,
            components: {
                votingSystem: !!window.votingSystem,
                syncManager: !!window.syncManager,
                serviceWorker: 'serviceWorker' in navigator
            },
            connectivity: navigator.onLine,
            storage: !!window.localStorage
        };
    }
}

// Inicializar sistema automático global
window.autoInitSystem = new AutoInitSystem();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoInitSystem;
} 