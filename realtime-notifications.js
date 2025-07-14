// realtime-notifications.js
// Sistema de notificaciones en tiempo real usando Firebase

class RealtimeNotificationSystem {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.notificationsRef = null;
        this.unsubscribe = null;
        this.init();
    }

    async init() {
        try {
            // Obtener usuario actual
            this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            if (!this.currentUser.username) {
                return; // No inicializar si no hay usuario
            }

            // Inicializar Firebase si está disponible
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                this.notificationsRef = firebase.firestore().collection('notifications');
                this.isInitialized = true;
                
                // Suscribirse a notificaciones en tiempo real
                this.unsubscribe = this.notificationsRef
                    .orderBy('timestamp', 'desc')
                    .limit(50)
                    .onSnapshot(this.handleNotifications.bind(this), this.handleError.bind(this));
            }
        } catch (error) {
            // Error silencioso en inicialización
        }
    }

    handleNotifications(snapshot) {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const notificationData = change.doc.data();
                this.showRealtimeNotification(notificationData);
            }
        });
    }

    handleError(error) {
        // Error silencioso en suscripción
    }

    /**
     * Muestra una notificación en tiempo real
     */
    showRealtimeNotification(notificationData) {
        const { message, type, sender, timestamp, target, role, userId } = notificationData;
        
        // Evitar mostrar notificaciones propias
        if (sender === this.currentUser.username) {
            return;
        }

        // Verificar si la notificación es para este usuario/rol
        const currentUserRole = this.currentUser.rol;
        
        // Lógica de filtrado mejorada
        let shouldShow = false;
        
        if (target === 'all') {
            // Para todos los usuarios
            shouldShow = true;
        } else if (target === 'role' && role === currentUserRole) {
            // Para un rol específico
            shouldShow = true;
        } else if (target === 'user' && userId === this.currentUser.username) {
            // Para un usuario específico
            shouldShow = true;
        }

        if (!shouldShow) {
            return;
        }

        // Mostrar notificación usando el sistema visual flotante
        if (window.notificationSystem) {
            window.notificationSystem.show(message, type, true, 5000);
        } else if (window.showNotification) {
            window.showNotification(message, type, true);
        } else {
            // Intentar inicializar notificationSystem si no existe
            if (typeof NotificationSystem !== 'undefined') {
                window.notificationSystem = new NotificationSystem();
                window.notificationSystem.show(message, type, true, 5000);
            } else {
                // Fallback visual si no está disponible
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = 'notification fallback-notification ' + type;
                fallbackDiv.textContent = `Notificación (${type}): ${message}`;
                fallbackDiv.style.position = 'fixed';
                fallbackDiv.style.top = '30px';
                fallbackDiv.style.right = '30px';
                fallbackDiv.style.background = '#fff';
                fallbackDiv.style.border = '2px solid #e5e7eb';
                fallbackDiv.style.borderLeft = `5px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'}`;
                fallbackDiv.style.padding = '1rem 1.5rem';
                fallbackDiv.style.borderRadius = '0.75rem';
                fallbackDiv.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                fallbackDiv.style.zIndex = 10001;
                document.body.appendChild(fallbackDiv);
                setTimeout(() => { fallbackDiv.remove(); }, 4000);
            }
        }
    }

    /**
     * Envía una notificación a todos los usuarios conectados
     */
    async sendGlobalNotification(message, type = 'info', autoDismiss = true) {
        if (!this.isInitialized || !this.notificationsRef) {
            return;
        }

        try {
            const notificationData = {
                message: message,
                type: type,
                sender: this.currentUser.username || 'Sistema',
                timestamp: new Date().toISOString(),
                autoDismiss: autoDismiss,
                target: 'all' // Para todos los usuarios
            };

            await this.notificationsRef.add(notificationData);
        } catch (error) {
            // Error silencioso al enviar notificación
        }
    }

    /**
     * Envía una notificación específica a un usuario
     */
    async sendUserNotification(userId, message, type = 'info', autoDismiss = true) {
        if (!this.isInitialized || !this.notificationsRef) {
            return;
        }

        try {
            const notificationData = {
                message: message,
                type: type,
                sender: this.currentUser.username || 'Sistema',
                timestamp: new Date().toISOString(),
                autoDismiss: autoDismiss,
                target: 'user',
                userId: userId
            };

            await this.notificationsRef.add(notificationData);
        } catch (error) {
            // Error silencioso al enviar notificación
        }
    }

    /**
     * Envía una notificación a un rol específico
     */
    async sendRoleNotification(role, message, type = 'info', autoDismiss = true) {
        if (!this.isInitialized || !this.notificationsRef) {
            return;
        }

        try {
            const notificationData = {
                message: message,
                type: type,
                sender: this.currentUser.username || 'Sistema',
                timestamp: new Date().toISOString(),
                autoDismiss: autoDismiss,
                target: 'role',
                role: role
            };

            await this.notificationsRef.add(notificationData);
        } catch (error) {
            // Error silencioso al enviar notificación
        }
    }

    /**
     * Limpia las notificaciones antiguas
     */
    async cleanupOldNotifications() {
        if (!this.isInitialized || !this.notificationsRef) {
            return;
        }

        try {
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            const snapshot = await this.notificationsRef
                .where('timestamp', '<', oneDayAgo.toISOString())
                .get();

            const batch = firebase.firestore().batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        } catch (error) {
            // Error silencioso en limpieza
        }
    }

    /**
     * Desconecta el sistema de notificaciones
     */
    disconnect() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.isInitialized = false;
    }

    /**
     * Obtiene el estado del sistema
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentUser: this.currentUser ? this.currentUser.username : null,
            hasNotificationsRef: !!this.notificationsRef,
            isSubscribed: !!this.unsubscribe
        };
    }
}

// Crear instancia global
window.realtimeNotificationSystem = new RealtimeNotificationSystem();

// Limpiar notificaciones antiguas cada hora
setInterval(() => {
    if (window.realtimeNotificationSystem) {
        window.realtimeNotificationSystem.cleanupOldNotifications();
    }
}, 60 * 60 * 1000); // 1 hora

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeNotificationSystem;
} 