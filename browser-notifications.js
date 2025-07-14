/**
 * Sistema de Notificaciones Push del Navegador
 * Integración completa con el sistema de votos 2025
 */

class BrowserNotificationSystem {
    constructor() {
        this.isSupported = 'Notification' in window;
        this.permission = this.isSupported ? Notification.permission : 'denied';
        this.isInitialized = false;
        this.notificationQueue = [];
        this.isProcessingQueue = false;
        
        // Configuración por defecto
        this.config = {
            title: 'Sistema de Votos 2025',
            icon: './favicon.ico',
            badge: './favicon.ico',
            tag: 'votos-notification',
            requireInteraction: false,
            silent: false,
            vibrate: [200, 100, 200]
        };
        
        this.init();
    }

    async init() {
        if (!this.isSupported) {
            console.warn('⚠️ Notificaciones del navegador no soportadas');
            return false;
        }

        try {
            // Verificar permisos existentes
            this.permission = Notification.permission;
            
            if (this.permission === 'default') {
                // Solicitar permisos automáticamente
                await this.requestPermission();
            }
            
            this.isInitialized = true;
            console.log('✅ Sistema de notificaciones push inicializado');
            
            // Procesar cola de notificaciones pendientes
            this.processQueue();
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando notificaciones push:', error);
            return false;
        }
    }

    /**
     * Solicitar permisos de notificación
     */
    async requestPermission() {
        if (!this.isSupported) {
            this.showToast('Las notificaciones no están disponibles en este navegador', 'warning');
            return false;
        }

        if (this.permission === 'granted') {
            this.showToast('Las notificaciones ya están activadas', 'success');
            return true;
        }

        if (this.permission === 'denied') {
            this.showToast('Las notificaciones están bloqueadas. Habilítalas en la configuración del navegador', 'warning');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.showToast('¡Notificaciones push activadas! Recibirás alertas importantes', 'success');
                this.createNotificationButton();
                return true;
            } else {
                this.showToast('Las notificaciones fueron rechazadas. Puedes activarlas más tarde', 'info');
                return false;
            }
        } catch (error) {
            console.error('Error al solicitar permisos de notificación:', error);
            this.showToast('Error al activar notificaciones', 'error');
            return false;
        }
    }

    /**
     * Crear botón de activación de notificaciones
     */
    createNotificationButton() {
        // Solo crear si no existe ya
        if (document.getElementById('notification-activation-btn')) return;
        
        const button = document.createElement('button');
        button.id = 'notification-activation-btn';
        button.innerHTML = '🔔 Activar Notificaciones Push';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 25px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            display: ${this.permission === 'granted' ? 'none' : 'block'};
        `;
        
        // Efectos hover
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        });
        
        // Click handler
        button.addEventListener('click', async () => {
            button.disabled = true;
            button.innerHTML = '⏳ Activando...';
            
            const success = await this.requestPermission();
            
            if (success) {
                button.style.display = 'none';
            } else {
                button.disabled = false;
                button.innerHTML = '🔔 Activar Notificaciones Push';
            }
        });
        
        document.body.appendChild(button);
    }

    /**
     * Mostrar notificación push del navegador
     */
    showPushNotification(title, body, options = {}) {
        if (!this.isSupported || this.permission !== 'granted') {
            // Agregar a la cola para mostrar cuando se activen los permisos
            this.notificationQueue.push({ title, body, options });
            return false;
        }

        try {
            const notificationOptions = {
                ...this.config,
                ...options,
                body: body,
                icon: options.icon || this.config.icon,
                badge: options.badge || this.config.badge,
                tag: options.tag || this.config.tag,
                requireInteraction: options.requireInteraction || this.config.requireInteraction,
                silent: options.silent || this.config.silent,
                vibrate: options.vibrate || this.config.vibrate,
                data: options.data || {},
                actions: options.actions || []
            };

            const notification = new Notification(title, notificationOptions);

            // Manejar clics en la notificación
            notification.onclick = (event) => {
                event.preventDefault();
                notification.close();
                
                // Enfocar la ventana si está minimizada
                if (window.focus) {
                    window.focus();
                }
                
                // Ejecutar acción personalizada si existe
                if (options.onClick) {
                    options.onClick(event);
                }
                
                // Acción por defecto: abrir la aplicación
                if (options.url) {
                    window.open(options.url, '_blank');
                }
            };

            // Manejar cierre de notificación
            notification.onclose = () => {
                if (options.onClose) {
                    options.onClose();
                }
            };

            // Auto-cerrar después de un tiempo (si no requiere interacción)
            if (!notificationOptions.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, options.duration || 5000);
            }

            return notification;
        } catch (error) {
            console.error('Error mostrando notificación push:', error);
            return false;
        }
    }

    /**
     * Procesar cola de notificaciones pendientes
     */
    processQueue() {
        if (this.isProcessingQueue || this.notificationQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        const processNext = () => {
            if (this.notificationQueue.length === 0) {
                this.isProcessingQueue = false;
                return;
            }

            const notification = this.notificationQueue.shift();
            this.showPushNotification(notification.title, notification.body, notification.options);

            // Procesar siguiente después de un pequeño delay
            setTimeout(processNext, 1000);
        };

        processNext();
    }

    /**
     * Notificaciones específicas del sistema de votos
     */
    showVoteNotification(voteData) {
        const title = '🗳️ Nuevo Voto Registrado';
        const body = `Voto registrado para ${voteData.cedula} en ${voteData.centroVotacion}`;
        
        return this.showPushNotification(title, body, {
            tag: 'vote-notification',
            requireInteraction: true,
            actions: [
                {
                    action: 'view',
                    title: 'Ver Detalles',
                    icon: './favicon.ico'
                },
                {
                    action: 'dismiss',
                    title: 'Cerrar'
                }
            ],
            onClick: () => {
                // Abrir página de estadísticas
                if (window.switchToPage) {
                    window.switchToPage('statistics');
                }
            }
        });
    }

    showSyncNotification(message) {
        const title = '🔄 Sincronización';
        const body = message;
        
        return this.showPushNotification(title, body, {
            tag: 'sync-notification',
            requireInteraction: false,
            duration: 3000
        });
    }

    showErrorNotification(error) {
        const title = '❌ Error del Sistema';
        const body = `Se ha producido un error: ${error}`;
        
        return this.showPushNotification(title, body, {
            tag: 'error-notification',
            requireInteraction: true,
            actions: [
                {
                    action: 'retry',
                    title: 'Reintentar',
                    icon: './favicon.ico'
                },
                {
                    action: 'dismiss',
                    title: 'Cerrar'
                }
            ]
        });
    }

    showSuccessNotification(message) {
        const title = '✅ Éxito';
        const body = message;
        
        return this.showPushNotification(title, body, {
            tag: 'success-notification',
            requireInteraction: false,
            duration: 4000
        });
    }

    showWarningNotification(message) {
        const title = '⚠️ Advertencia';
        const body = message;
        
        return this.showPushNotification(title, body, {
            tag: 'warning-notification',
            requireInteraction: false,
            duration: 5000
        });
    }

    /**
     * Mostrar toast visual (fallback)
     */
    showToast(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type, true);
        } else if (window.notificationSystem) {
            window.notificationSystem.show(message, type, true);
        } else {
            // Fallback simple
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Verificar si las notificaciones están disponibles
     */
    areNotificationsAvailable() {
        return this.isSupported && this.permission === 'granted';
    }

    /**
     * Obtener estado de las notificaciones
     */
    getNotificationStatus() {
        return {
            supported: this.isSupported,
            permission: this.permission,
            initialized: this.isInitialized,
            available: this.areNotificationsAvailable()
        };
    }

    /**
     * Limpiar todas las notificaciones activas
     */
    clearAllNotifications() {
        // Las notificaciones push del navegador se cierran automáticamente
        // o por el usuario, no necesitan limpieza manual
        console.log('Notificaciones push limpiadas');
    }
}

// Crear instancia global
window.browserNotificationSystem = new BrowserNotificationSystem();

// Funciones globales para compatibilidad
window.showPushNotification = (title, body, options) => {
    if (window.browserNotificationSystem) {
        return window.browserNotificationSystem.showPushNotification(title, body, options);
    }
    return false;
};

window.requestNotificationPermission = async () => {
    if (window.browserNotificationSystem) {
        return await window.browserNotificationSystem.requestPermission();
    }
    return false;
};

window.areNotificationsAvailable = () => {
    if (window.browserNotificationSystem) {
        return window.browserNotificationSystem.areNotificationsAvailable();
    }
    return false;
};

// Integración con el sistema existente
document.addEventListener('DOMContentLoaded', () => {
    // Crear botón de activación si es necesario
    if (window.browserNotificationSystem) {
        setTimeout(() => {
            window.browserNotificationSystem.createNotificationButton();
        }, 2000);
    }
});

console.log('🔔 Sistema de notificaciones push del navegador cargado'); 