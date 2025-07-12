// notification-system.js
// Sistema de notificaciones modular para el panel de administración

class NotificationSystem {
    constructor() {
        this.container = null;
        this.avatarUrl = 'logo.jpg';
        this.notifications = [];
        this.maxNotifications = 5; // Máximo número de notificaciones visibles
        this.init();
    }

    init() {
        // Crear contenedor de notificaciones si no existe
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
        
        // Limpiar notificaciones existentes al inicializar
        this.container.innerHTML = '';
        this.notifications = [];
    }

    /**
     * Muestra una notificación en la pantalla
     * @param {string} message - El mensaje a mostrar
     * @param {string} type - Tipo de notificación (info, success, warning, error)
     * @param {boolean} autoDismiss - Si debe desaparecer automáticamente
     * @param {number} duration - Duración en milisegundos (solo si autoDismiss es true)
     */
    show(message, type = 'info', autoDismiss = false, duration = 5000) {
        if (!message || !message.trim()) {
            console.warn('No se puede mostrar una notificación vacía.');
            return;
        }

        // Crear la notificación
        const notification = this.createNotificationElement(message, type);
        
        // Agregar al contenedor
        this.container.appendChild(notification);
        
        // Agregar a la lista de notificaciones activas
        this.notifications.push(notification);
        
        // Limitar el número de notificaciones visibles
        this.limitNotifications();
        
        // Evento para cerrar notificación
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.dismiss(notification);
            });
        }

        // Auto-dismiss si está habilitado
        if (autoDismiss) {
            setTimeout(() => {
                this.dismiss(notification);
            }, duration);
        }

        // Actualizar contador si existe
        this.updateCount();
        
        // Log para debugging
        console.log(`📨 Notificación mostrada: ${message} (${type})`);
        
        return notification;
    }

    /**
     * Crea el elemento HTML de la notificación
     */
    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.classList.add('notification', type);

        const avatarHtml = `<img src="${this.avatarUrl}" alt="Avatar de notificación" class="notification-avatar" onerror="this.onerror=null;this.src='https://placehold.co/40x40/cccccc/ffffff?text=Avatar';">`;

        notification.innerHTML = `
            ${avatarHtml}
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <div class="notification-time">${new Date().toLocaleTimeString()}</div>
            </div>
            <button class="notification-close" title="Cerrar notificación">&times;</button>
        `;

        return notification;
    }

    /**
     * Limita el número de notificaciones visibles
     */
    limitNotifications() {
        while (this.notifications.length > this.maxNotifications) {
            const oldestNotification = this.notifications.shift();
            if (oldestNotification && oldestNotification.parentNode) {
                this.dismiss(oldestNotification);
            }
        }
    }

    /**
     * Desvanece y elimina una notificación
     * @param {HTMLElement} notificationElement - Elemento de notificación a eliminar
     */
    dismiss(notificationElement) {
        if (!notificationElement) return;
        
        notificationElement.classList.add('fade-out');
        notificationElement.addEventListener('transitionend', () => {
            if (notificationElement.parentNode) {
                notificationElement.remove();
            }
            // Remover de la lista de notificaciones activas
            const index = this.notifications.indexOf(notificationElement);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
            this.updateCount();
        }, { once: true });
    }

    /**
     * Actualiza el contador de notificaciones activas
     */
    updateCount() {
        const countElement = document.getElementById('notification-count');
        if (countElement) {
            const count = this.notifications.length;
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'block' : 'none';
        }
    }

    /**
     * Limpia todas las notificaciones activas
     */
    clearAll() {
        const notificationsToRemove = [...this.notifications];
        notificationsToRemove.forEach(notification => {
            this.dismiss(notification);
        });
        this.notifications = [];
        this.updateCount();
    }

    /**
     * Muestra notificaciones de prueba para diferentes tipos
     */
    test(type) {
        const messages = {
            'info': 'Esta es una notificación de información del sistema.',
            'success': '¡Operación completada exitosamente!',
            'warning': 'Advertencia: El sistema detectó actividad inusual.',
            'error': 'Error: No se pudo procesar la solicitud.'
        };
        
        this.show(messages[type], type, true);
    }

    /**
     * Envía una notificación personalizada
     * @param {string} message - Mensaje personalizado
     * @param {string} type - Tipo de notificación
     * @param {boolean} autoDismiss - Si debe desaparecer automáticamente
     */
    sendCustom(message, type = 'info', autoDismiss = false) {
        if (!message || !message.trim()) {
            this.show('Por favor, escribe un mensaje antes de enviar.', 'warning', true);
            return;
        }
        
        this.show(message, type, autoDismiss);
    }

    /**
     * Verifica si el sistema está funcionando correctamente
     */
    isWorking() {
        return this.container !== null && this.container.parentNode !== null;
    }

    /**
     * Obtiene el estado del sistema
     */
    getStatus() {
        return {
            working: this.isWorking(),
            activeNotifications: this.notifications.length,
            maxNotifications: this.maxNotifications,
            containerExists: !!this.container
        };
    }
}

// Crear instancia global
window.notificationSystem = new NotificationSystem();

// Funciones globales para compatibilidad
window.showNotification = (message, type = 'info', autoDismiss = false) => {
    if (window.notificationSystem) {
        return window.notificationSystem.show(message, type, autoDismiss);
    } else {
        // Fallback simple si el sistema no está disponible
        console.warn('Sistema de notificaciones no disponible, usando fallback');
        alert(`Notificación (${type}): ${message}`);
    }
};

window.dismissNotification = (notificationElement) => {
    if (window.notificationSystem) {
        return window.notificationSystem.dismiss(notificationElement);
    }
};

// Funciones específicas para el panel de administración
window.testNotification = (type) => {
    if (window.notificationSystem) {
        return window.notificationSystem.test(type);
    }
};

window.sendCustomNotification = () => {
    const textarea = document.getElementById('custom-notification');
    if (textarea && window.notificationSystem) {
        const message = textarea.value.trim();
        window.notificationSystem.sendCustom(message, 'info', false);
        textarea.value = '';
    }
};

// Verificar que el sistema esté funcionando al cargar
document.addEventListener('DOMContentLoaded', () => {
    if (window.notificationSystem) {
        console.log('✅ Sistema de notificaciones inicializado:', window.notificationSystem.getStatus());
    }
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
} 