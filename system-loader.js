/**
 * Sistema de Carga Unificado - Sistema de Votos 2025
 * Resuelve problemas de inicialización y sincronización
 */

class SystemLoader {
    constructor() {
        this.isLoading = false;
        this.isLoaded = false;
        this.loadAttempts = 0;
        this.maxLoadAttempts = 5;
        this.loadTimeout = 30000; // 30 segundos
        this.firebaseReady = false;
        this.votingSystemReady = false;
        this.notificationsReady = false;
        
        this.init();
    }

    async init() {
        if (this.isLoading) {
            console.log('⚠️ Sistema ya se está cargando...');
            return;
        }

        this.isLoading = true;
        console.log('🚀 Iniciando carga del sistema...');

        try {
            // 1. Verificar sesión de usuario
            if (!this.checkUserSession()) {
                console.error('❌ No hay sesión de usuario válida');
                this.showError('No hay sesión de usuario. Por favor, inicia sesión.');
                return;
            }

            // 2. Inicializar Firebase con retry
            await this.initializeFirebase();

            // 3. Inicializar sistema de votación
            await this.initializeVotingSystem();

            // 4. Inicializar notificaciones
            await this.initializeNotifications();

            // 5. Configurar UI
            this.setupUI();

            // 6. Marcar como cargado
            this.isLoaded = true;
            this.isLoading = false;

            console.log('✅ Sistema cargado correctamente');
            this.showSuccess('Sistema cargado correctamente');

        } catch (error) {
            console.error('❌ Error cargando sistema:', error);
            this.handleLoadError(error);
        }
    }

    checkUserSession() {
        try {
            const currentUser = localStorage.getItem('currentUser');
            if (!currentUser) {
                console.warn('⚠️ No hay usuario en sesión');
                return false;
            }

            const user = JSON.parse(currentUser);
            if (!user.username || !user.rol) {
                console.warn('⚠️ Datos de usuario incompletos');
                return false;
            }

            console.log('✅ Sesión de usuario válida:', user.username);
            return true;

        } catch (error) {
            console.error('❌ Error verificando sesión:', error);
            return false;
        }
    }

    async initializeFirebase() {
        console.log('🔥 Inicializando Firebase...');
        
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                // Esperar a que Firebase esté disponible
                await this.waitForFirebase();
                
                // Verificar que Firebase esté configurado correctamente
                if (window.firebaseDB && window.firebaseDB.isAvailable) {
                    console.log('✅ Firebase inicializado correctamente');
                    this.firebaseReady = true;
                    return;
                } else {
                    throw new Error('Firebase no está disponible');
                }

            } catch (error) {
                attempts++;
                console.warn(`⚠️ Intento ${attempts}/${maxAttempts} falló:`, error.message);
                
                if (attempts >= maxAttempts) {
                    console.warn('⚠️ Firebase no disponible - Continuando en modo offline');
                    this.firebaseReady = false;
                    return;
                }
                
                // Esperar antes del siguiente intento
                await this.delay(2000);
            }
        }
    }

    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            const maxWait = 10000; // 10 segundos
            const startTime = Date.now();
            
            const check = () => {
                if (window.firebaseDB) {
                    resolve();
                } else if (Date.now() - startTime > maxWait) {
                    reject(new Error('Timeout esperando Firebase'));
                } else {
                    setTimeout(check, 500);
                }
            };
            
            check();
        });
    }

    async initializeVotingSystem() {
        console.log('🗳️ Inicializando sistema de votación...');
        
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

            // Inicializar el sistema
            if (window.votingSystem && typeof window.votingSystem.init === 'function') {
                await window.votingSystem.init();
                console.log('✅ Sistema de votación inicializado');
                this.votingSystemReady = true;
            } else {
                throw new Error('Sistema de votación no tiene método init');
            }

        } catch (error) {
            console.error('❌ Error inicializando sistema de votación:', error);
            this.votingSystemReady = false;
            throw error;
        }
    }

    async initializeNotifications() {
        console.log('🔔 Inicializando notificaciones...');
        
        try {
            // Inicializar sistema de notificaciones visuales
            if (typeof NotificationSystem !== 'undefined') {
                window.notificationSystem = new NotificationSystem();
                console.log('✅ Sistema de notificaciones visuales inicializado');
            }

            // Inicializar notificaciones push del navegador
            if (typeof BrowserNotificationSystem !== 'undefined') {
                window.browserNotificationSystem = new BrowserNotificationSystem();
                console.log('✅ Sistema de notificaciones push inicializado');
            }

            // Inicializar integración de notificaciones
            if (typeof NotificationIntegration !== 'undefined') {
                window.notificationIntegration = new NotificationIntegration();
                console.log('✅ Integración de notificaciones inicializada');
            }

            this.notificationsReady = true;

        } catch (error) {
            console.error('❌ Error inicializando notificaciones:', error);
            this.notificationsReady = false;
        }
    }

    setupUI() {
        console.log('🎨 Configurando interfaz de usuario...');
        
        try {
            // Mostrar información del usuario
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                const userInfo = document.getElementById('userId');
                if (userInfo) {
                    userInfo.textContent = `${user.username} (${user.rol})`;
                }
            }

            // Configurar menú móvil
            this.setupMobileMenu();

            // Configurar navegación
            this.setupNavigation();

            // Actualizar indicadores de estado
            this.updateStatusIndicators();

            console.log('✅ Interfaz configurada correctamente');

        } catch (error) {
            console.error('❌ Error configurando interfaz:', error);
        }
    }

    setupMobileMenu() {
        try {
            const menuToggle = document.querySelector('.menu-toggle');
            const menuDropdown = document.getElementById('menu-dropdown');
            
            if (menuToggle && menuDropdown) {
                menuToggle.addEventListener('click', () => {
                    menuDropdown.classList.toggle('active');
                });
            }

            // Cerrar menú al hacer clic fuera
            document.addEventListener('click', (event) => {
                if (menuDropdown && !menuToggle.contains(event.target) && !menuDropdown.contains(event.target)) {
                    menuDropdown.classList.remove('active');
                }
            });

        } catch (error) {
            console.error('❌ Error configurando menú móvil:', error);
        }
    }

    setupNavigation() {
        try {
            const navButtons = document.querySelectorAll('.nav-btn');
            
            navButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    // Remover clase active de todos los botones
                    navButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // Agregar clase active al botón clickeado
                    button.classList.add('active');
                    
                    // Cambiar página si no es un enlace externo
                    const page = button.dataset.page;
                    if (page && !button.hasAttribute('onclick')) {
                        this.switchToPage(page);
                    }
                });
            });

        } catch (error) {
            console.error('❌ Error configurando navegación:', error);
        }
    }

    switchToPage(pageName) {
        try {
            // Ocultar todas las páginas
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => page.classList.remove('active'));
            
            // Mostrar página seleccionada
            const targetPage = document.getElementById(`${pageName}-page`);
            if (targetPage) {
                targetPage.classList.add('active');
                console.log(`📄 Cambiando a página: ${pageName}`);
            }

        } catch (error) {
            console.error('❌ Error cambiando página:', error);
        }
    }

    updateStatusIndicators() {
        try {
            // Actualizar indicador de sincronización
            const syncIndicator = document.getElementById('sync-indicator');
            const syncText = document.getElementById('sync-text');
            
            if (syncIndicator && syncText) {
                if (this.firebaseReady) {
                    syncIndicator.textContent = '✅';
                    syncText.textContent = 'Conectado';
                } else {
                    syncIndicator.textContent = '📴';
                    syncText.textContent = 'Modo offline';
                }
            }

            // Ocultar indicador offline si está conectado
            const offlineIndicator = document.getElementById('offline-indicator');
            if (offlineIndicator) {
                offlineIndicator.style.display = this.firebaseReady ? 'none' : 'block';
            }

        } catch (error) {
            console.error('❌ Error actualizando indicadores:', error);
        }
    }

    handleLoadError(error) {
        console.error('❌ Error crítico cargando sistema:', error);
        
        this.isLoading = false;
        this.isLoaded = false;
        
        // Mostrar mensaje de error al usuario
        this.showError(`Error cargando sistema: ${error.message}`);
        
        // Intentar recuperación automática
        this.attemptRecovery();
    }

    async attemptRecovery() {
        console.log('🔄 Intentando recuperación automática...');
        
        this.loadAttempts++;
        
        if (this.loadAttempts < this.maxLoadAttempts) {
            console.log(`🔄 Intento de recuperación ${this.loadAttempts}/${this.maxLoadAttempts}`);
            
            // Esperar antes del siguiente intento
            await this.delay(5000);
            
            // Reiniciar carga
            this.init();
        } else {
            console.error('❌ Máximo de intentos alcanzado');
            this.showError('No se pudo cargar el sistema después de múltiples intentos. Por favor, recarga la página.');
        }
    }

    showSuccess(message) {
        if (window.notificationSystem) {
            window.notificationSystem.show(message, 'success', true, 3000);
        } else {
            console.log('✅', message);
        }
    }

    showError(message) {
        if (window.notificationSystem) {
            window.notificationSystem.show(message, 'error', true, 5000);
        } else {
            console.error('❌', message);
            alert(message);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Métodos públicos para verificar estado
    isSystemReady() {
        return this.isLoaded && !this.isLoading;
    }

    getSystemStatus() {
        return {
            loaded: this.isLoaded,
            loading: this.isLoading,
            firebaseReady: this.firebaseReady,
            votingSystemReady: this.votingSystemReady,
            notificationsReady: this.notificationsReady,
            loadAttempts: this.loadAttempts
        };
    }
}

// Crear instancia global
window.systemLoader = new SystemLoader();

// Función global para verificar estado del sistema
window.isSystemReady = () => {
    return window.systemLoader && window.systemLoader.isSystemReady();
};

// Función global para obtener estado del sistema
window.getSystemStatus = () => {
    return window.systemLoader ? window.systemLoader.getSystemStatus() : null;
};

console.log('🚀 Sistema de carga unificado inicializado'); 