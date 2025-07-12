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
        try {
            // Crear contenedor de notificaciones si no existe
            if (!document.getElementById('notification-container')) {
                this.container = document.createElement('div');
                this.container.id = 'notification-container';
                document.body.appendChild(this.container);
            } else {
                this.container = document.getElementById('notification-container');
            }
            
            // Limpiar notificaciones existentes al inicializar
            if (this.container) {
                this.container.innerHTML = '';
                this.notifications = [];
            }
        } catch (error) {
            // Error silencioso si no se puede crear el contenedor
            console.warn('No se pudo inicializar el contenedor de notificaciones');
        }
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
            return;
        }

        // Verificar que el contenedor existe
        if (!this.container) {
            this.init();
            if (!this.container) {
                return; // No mostrar si no hay contenedor
            }
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
        
        return notification;
    }

    /**
     * Crea el elemento HTML de la notificación
     */
    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.classList.add('notification', type);

        // Iconos SVG para cada tipo
        const icons = {
            success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="12" fill="#10b981"/><path d="M7 13.5L10.5 17L17 10.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="12" fill="#3b82f6"/><circle cx="12" cy="8" r="1.5" fill="#fff"/><rect x="11" y="11" width="2" height="6" rx="1" fill="#fff"/></svg>`,
            warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="12" fill="#f59e0b"/><path d="M12 7V13" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="#fff"/></svg>`,
            error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="12" fill="#ef4444"/><path d="M8 8L16 16M16 8L8 16" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`
        };
        const iconHtml = `<span class="notification-status-icon">${icons[type] || icons.info}</span>`;

        const avatarHtml = `<img src="${this.avatarUrl}" alt="Logo" class="notification-avatar" onerror="this.onerror=null;this.src='https://placehold.co/40x40/cccccc/ffffff?text=Logo';">`;

        // Formatear hora en 12 horas con AM/PM
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        notification.innerHTML = `
            <div class="notification-left">
                ${avatarHtml}
                ${iconHtml}
            </div>
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <div class="notification-time">${timeString}</div>
            </div>
            <button class="notification-close" title="Cerrar notificación">&times;</button>
        `;

        return notification;
    }

    /**
     * Cierra una notificación específica
     */
    dismiss(notification) {
        if (notification && notification.parentNode) {
            notification.classList.add('notification-dismissing');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
                // Remover de la lista de notificaciones activas
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
                this.updateCount();
            }, 300);
        }
    }

    /**
     * Limita el número de notificaciones visibles
     */
    limitNotifications() {
        while (this.notifications.length > this.maxNotifications) {
            const oldestNotification = this.notifications.shift();
            if (oldestNotification && oldestNotification.parentNode) {
                oldestNotification.remove();
            }
        }
    }

    /**
     * Actualiza el contador de notificaciones
     */
    updateCount() {
        const countElement = document.getElementById('notification-count');
        if (countElement) {
            countElement.textContent = this.notifications.length;
            countElement.style.display = this.notifications.length > 0 ? 'block' : 'none';
        }
    }

    /**
     * Limpia todas las notificaciones
     */
    clearAll() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.notifications = [];
        this.updateCount();
    }

    /**
     * Obtiene el estado del sistema de notificaciones
     */
    getStatus() {
        return {
            containerExists: !!this.container,
            activeNotifications: this.notifications.length,
            maxNotifications: this.maxNotifications
        };
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
     */
    sendCustom(message, type = 'info', autoDismiss = false) {
        this.show(message, type, autoDismiss);
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
        // En vez de alert, crear un div flotante temporal
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
        // Log silencioso para verificar inicialización
    }
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
} 