// realtime-notifications.js
// Sistema de notificaciones en tiempo real usando Firebase

class RealtimeNotificationSystem {
    constructor() {
        this.notificationsRef = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Esperar a que Firebase esté disponible
            if (typeof window.firebaseDB !== 'undefined') {
                this.notificationsRef = window.firebaseDB.db.collection('notifications');
                this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                this.isInitialized = true;
                this.setupRealtimeListener();
                console.log('✅ Sistema de notificaciones en tiempo real inicializado');
            } else {
                // Reintentar después de un tiempo
                setTimeout(() => this.init(), 1000);
            }
        } catch (error) {
            console.error('❌ Error inicializando sistema de notificaciones:', error);
        }
    }

    /**
     * Configura el listener en tiempo real para notificaciones
     */
    setupRealtimeListener() {
        if (!this.notificationsRef) return;

        // Escuchar nuevas notificaciones
        this.notificationsRef
            .orderBy('timestamp', 'desc')
            .limit(10) // Solo las últimas 10 notificaciones
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const notification = change.doc.data();
                        this.showRealtimeNotification(notification);
                    }
                });
            }, (error) => {
                console.error('❌ Error en listener de notificaciones:', error);
            });
    }

    /**
     * Muestra una notificación en tiempo real
     */
    showRealtimeNotification(notificationData) {
        const { message, type, sender, timestamp, target, role, userId } = notificationData;
        
        // Evitar mostrar notificaciones propias
        if (sender === this.currentUser.username) {
            console.log('🔇 Notificación propia ignorada:', message);
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
            console.log(`🔇 Notificación filtrada - Target: ${target}, Role: ${role}, User: ${userId}, Current: ${currentUserRole}`);
            return;
        }

        console.log(`📨 Notificación recibida: ${message} (${type}) de ${sender}`);

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
                // No mostrar nada si no está disponible
                console.warn('No se pudo mostrar la notificación visual. notificationSystem no está disponible.');
            }
        }
    }

    /**
     * Envía una notificación a todos los usuarios conectados
     */
    async sendGlobalNotification(message, type = 'info', autoDismiss = true) {
        if (!this.isInitialized || !this.notificationsRef) {
            console.warn('⚠️ Sistema de notificaciones no inicializado');
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
            console.log('📤 Notificación global enviada:', message);
        } catch (error) {
            console.error('❌ Error enviando notificación global:', error);
        }
    }

    /**
     * Envía una notificación específica a un usuario
     */
    async sendUserNotification(userId, message, type = 'info', autoDismiss = true) {
        if (!this.isInitialized || !this.notificationsRef) {
            console.warn('⚠️ Sistema de notificaciones no inicializado');
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
            console.log('📤 Notificación enviada a usuario:', userId);
        } catch (error) {
            console.error('❌ Error enviando notificación a usuario:', error);
        }
    }

    /**
     * Envía una notificación a un rol específico
     */
    async sendRoleNotification(role, message, type = 'info', autoDismiss = true) {
        if (!this.isInitialized || !this.notificationsRef) {
            console.warn('⚠️ Sistema de notificaciones no inicializado');
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
            console.log('📤 Notificación enviada a rol:', role);
        } catch (error) {
            console.error('❌ Error enviando notificación a rol:', error);
        }
    }

    /**
     * Limpia notificaciones antiguas (más de 24 horas)
     */
    async cleanupOldNotifications() {
        if (!this.isInitialized || !this.notificationsRef) return;

        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const oldNotifications = await this.notificationsRef
                .where('timestamp', '<', yesterday.toISOString())
                .get();

            const batch = window.firebaseDB.db.batch();
            oldNotifications.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log('🗑️ Notificaciones antiguas limpiadas');
        } catch (error) {
            console.error('❌ Error limpiando notificaciones antiguas:', error);
        }
    }

    /**
     * Obtiene el estado del sistema
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            currentUser: this.currentUser.username,
            firebaseConnected: !!this.notificationsRef
        };
    }
}

// Crear instancia global
window.realtimeNotificationSystem = new RealtimeNotificationSystem();

// Funciones globales para compatibilidad
window.sendGlobalNotification = (message, type, autoDismiss) => {
    return window.realtimeNotificationSystem.sendGlobalNotification(message, type, autoDismiss);
};

window.sendUserNotification = (userId, message, type, autoDismiss) => {
    return window.realtimeNotificationSystem.sendUserNotification(userId, message, type, autoDismiss);
};

window.sendRoleNotification = (role, message, type, autoDismiss) => {
    return window.realtimeNotificationSystem.sendRoleNotification(role, message, type, autoDismiss);
};

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