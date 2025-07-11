// notification-system.js
// Sistema de notificaciones modular para el panel de administración

class NotificationSystem {
    constructor() {
        this.container = null;
        this.avatarUrl = 'logo.jpg';
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
    }

    /**
     * Muestra una notificación en la pantalla
     * @param {string} message - El mensaje a mostrar
     * @param {string} type - Tipo de notificación (info, success, warning, error)
     * @param {boolean} autoDismiss - Si debe desaparecer automáticamente
     * @param {number} duration - Duración en milisegundos (solo si autoDismiss es true)
     */
    show(message, type = 'info', autoDismiss = false, duration = 3000) {
        if (!message || !message.trim()) {
            console.warn('No se puede mostrar una notificación vacía.');
            return;
        }

        const notification = document.createElement('div');
        notification.classList.add('notification', type);

        const avatarHtml = `<img src="${this.avatarUrl}" alt="Avatar de notificación" class="notification-avatar" onerror="this.onerror=null;this.src='https://placehold.co/40x40/cccccc/ffffff?text=Avatar';">`;

        notification.innerHTML = `
            ${avatarHtml}
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        this.container.appendChild(notification);

        // Evento para cerrar notificación
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.dismiss(notification);
        });

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
     * Desvanece y elimina una notificación
     * @param {HTMLElement} notificationElement - Elemento de notificación a eliminar
     */
    dismiss(notificationElement) {
        notificationElement.classList.add('fade-out');
        notificationElement.addEventListener('transitionend', () => {
            notificationElement.remove();
            this.updateCount();
        }, { once: true });
    }

    /**
     * Actualiza el contador de notificaciones activas
     */
    updateCount() {
        const countElement = document.getElementById('notification-count');
        if (countElement) {
            const count = this.container.querySelectorAll('.notification').length;
            countElement.textContent = count;
        }
    }

    /**
     * Limpia todas las notificaciones activas
     */
    clearAll() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.dismiss(notification);
        });
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
}

// Crear instancia global
window.notificationSystem = new NotificationSystem();

// Funciones globales para compatibilidad
window.showNotification = (message, type = 'info', autoDismiss = false) => {
    return window.notificationSystem.show(message, type, autoDismiss);
};

window.dismissNotification = (notificationElement) => {
    return window.notificationSystem.dismiss(notificationElement);
};

// Funciones específicas para el panel de administración
window.testNotification = (type) => {
    return window.notificationSystem.test(type);
};

window.sendCustomNotification = () => {
    const textarea = document.getElementById('custom-notification');
    if (textarea) {
        const message = textarea.value.trim();
        window.notificationSystem.sendCustom(message, 'info', false);
        textarea.value = '';
    }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
} 