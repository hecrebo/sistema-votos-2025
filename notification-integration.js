/**
 * Integración de Notificaciones Push con el Sistema de Votos
 * Este archivo conecta las notificaciones push con las funciones del sistema
 */

class NotificationIntegration {
    constructor() {
        this.browserNotificationSystem = null;
        this.notificationSystem = null;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            // Inicializar sistemas de notificación
            if (typeof BrowserNotificationSystem !== 'undefined') {
                this.browserNotificationSystem = new BrowserNotificationSystem();
            }
            
            if (typeof NotificationSystem !== 'undefined') {
                this.notificationSystem = new NotificationSystem();
            }
            
            this.isInitialized = true;
            console.log('✅ Integración de notificaciones inicializada');
            
            // Configurar listeners para eventos del sistema
            this.setupSystemListeners();
            
        } catch (error) {
            console.error('❌ Error inicializando integración de notificaciones:', error);
        }
    }

    setupSystemListeners() {
        // Interceptar funciones del sistema para agregar notificaciones
        this.interceptSystemFunctions();
        
        // Escuchar eventos del DOM para detectar acciones
        this.setupDOMMonitoring();
    }

    interceptSystemFunctions() {
        // Interceptar función de registro de personas
        if (window.votingSystem) {
            const originalRegister = window.votingSystem.registerPerson;
            if (originalRegister) {
                window.votingSystem.registerPerson = async function(...args) {
                    const result = await originalRegister.apply(this, args);
                    
                    // Mostrar notificación push si el registro fue exitoso
                    if (result && result.success) {
                        this.showVoteRegistrationNotification(result.data);
                    }
                    
                    return result;
                }.bind(this);
            }
        }

        // Interceptar función de confirmación de votos
        if (window.votingSystem) {
            const originalConfirm = window.votingSystem.confirmVote;
            if (originalConfirm) {
                window.votingSystem.confirmVote = async function(...args) {
                    const result = await originalConfirm.apply(this, args);
                    
                    // Mostrar notificación push si la confirmación fue exitosa
                    if (result && result.success) {
                        this.showVoteConfirmationNotification(result.data);
                    }
                    
                    return result;
                }.bind(this);
            }
        }
    }

    setupDOMMonitoring() {
        // Monitorear cambios en el DOM para detectar acciones
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.checkForSystemActions(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    checkForSystemActions(element) {
        // Detectar mensajes de éxito o error
        if (element.classList && element.classList.contains('message')) {
            const text = element.textContent || '';
            
            if (text.includes('registrado') || text.includes('Registro exitoso')) {
                this.showVoteRegistrationNotification({
                    name: 'Persona registrada',
                    cedula: 'N/A',
                    centroVotacion: 'N/A'
                });
            }
            
            if (text.includes('confirmado') || text.includes('voto confirmado')) {
                this.showVoteConfirmationNotification({
                    name: 'Voto confirmado',
                    cedula: 'N/A'
                });
            }
        }
    }

    // Notificaciones específicas del sistema
    showVoteRegistrationNotification(voteData) {
        if (this.browserNotificationSystem && this.browserNotificationSystem.areNotificationsAvailable()) {
            this.browserNotificationSystem.showVoteNotification(voteData);
        }
        
        // También mostrar notificación visual
        if (this.notificationSystem) {
            this.notificationSystem.show(
                `Nuevo registro: ${voteData.name} (${voteData.cedula})`,
                'success',
                true,
                5000
            );
        }
    }

    showVoteConfirmationNotification(voteData) {
        if (this.browserNotificationSystem && this.browserNotificationSystem.areNotificationsAvailable()) {
            this.browserNotificationSystem.showSuccessNotification(
                `Voto confirmado para ${voteData.name} (${voteData.cedula})`
            );
        }
        
        // También mostrar notificación visual
        if (this.notificationSystem) {
            this.notificationSystem.show(
                `Voto confirmado: ${voteData.name} (${voteData.cedula})`,
                'success',
                true,
                5000
            );
        }
    }

    showSyncNotification(message) {
        if (this.browserNotificationSystem && this.browserNotificationSystem.areNotificationsAvailable()) {
            this.browserNotificationSystem.showSyncNotification(message);
        }
        
        // También mostrar notificación visual
        if (this.notificationSystem) {
            this.notificationSystem.show(message, 'info', true, 3000);
        }
    }

    showErrorNotification(error) {
        if (this.browserNotificationSystem && this.browserNotificationSystem.areNotificationsAvailable()) {
            this.browserNotificationSystem.showErrorNotification(error);
        }
        
        // También mostrar notificación visual
        if (this.notificationSystem) {
            this.notificationSystem.show(error, 'error', true, 5000);
        }
    }

    showWarningNotification(message) {
        if (this.browserNotificationSystem && this.browserNotificationSystem.areNotificationsAvailable()) {
            this.browserNotificationSystem.showWarningNotification(message);
        }
        
        // También mostrar notificación visual
        if (this.notificationSystem) {
            this.notificationSystem.show(message, 'warning', true, 4000);
        }
    }

    // Función para probar todas las notificaciones
    testAllNotifications() {
        console.log('🧪 Probando todas las notificaciones...');
        
        // Probar notificación de registro
        setTimeout(() => {
            this.showVoteRegistrationNotification({
                name: 'Juan Pérez',
                cedula: '12345678',
                centroVotacion: 'COLEGIO ASUNCION BELTRAN'
            });
        }, 1000);
        
        // Probar notificación de confirmación
        setTimeout(() => {
            this.showVoteConfirmationNotification({
                name: 'María García',
                cedula: '87654321'
            });
        }, 3000);
        
        // Probar notificación de sincronización
        setTimeout(() => {
            this.showSyncNotification('Sincronización completada: 15 registros actualizados');
        }, 5000);
        
        // Probar notificación de error
        setTimeout(() => {
            this.showErrorNotification('Error de conexión con Firebase. Verificando...');
        }, 7000);
        
        // Probar notificación de advertencia
        setTimeout(() => {
            this.showWarningNotification('Conexión inestable detectada');
        }, 9000);
    }

    // Función para obtener estado de las notificaciones
    getNotificationStatus() {
        const status = {
            browserNotifications: false,
            visualNotifications: false,
            initialized: this.isInitialized
        };
        
        if (this.browserNotificationSystem) {
            status.browserNotifications = this.browserNotificationSystem.areNotificationsAvailable();
        }
        
        if (this.notificationSystem) {
            status.visualNotifications = true;
        }
        
        return status;
    }
}

// Crear instancia global
window.notificationIntegration = new NotificationIntegration();

// Funciones globales para compatibilidad
window.testAllNotifications = () => {
    if (window.notificationIntegration) {
        window.notificationIntegration.testAllNotifications();
    }
};

window.getNotificationStatus = () => {
    if (window.notificationIntegration) {
        return window.notificationIntegration.getNotificationStatus();
    }
    return { initialized: false, browserNotifications: false, visualNotifications: false };
};

// Integración automática con el sistema existente
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que el sistema principal se inicialice
    setTimeout(() => {
        if (window.notificationIntegration) {
            console.log('🔔 Integración de notificaciones lista');
            
            // Mostrar estado inicial
            const status = window.notificationIntegration.getNotificationStatus();
            console.log('📊 Estado de notificaciones:', status);
        }
    }, 2000);
});

console.log('🔔 Sistema de integración de notificaciones cargado'); 