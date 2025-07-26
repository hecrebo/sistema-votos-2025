// notification-system.js
// Sistema de notificaciones modular para el panel de administración

class NotificationSystem {
    constructor() {
        this.container = null;
        this.avatarUrl = 'logo.jpg';
        this.avatarSettings = {
            size: 'medium',
            shape: 'circle',
            border: 'solid',
            enabled: true
        };
        this.notifications = [];
        this.maxNotifications = 5; // Máximo número de notificaciones visibles
        
        // Sistema anti-duplicados y anti-molestias
        this.recentNotifications = new Map(); // Para tracking de notificaciones recientes
        this.notificationHistory = []; // Historial de notificaciones
        this.maxHistorySize = 100; // Máximo historial a mantener
        
        // Configuración de molestias
        this.settings = {
            preventDuplicates: true,
            duplicateTimeout: 30000, // 30 segundos para considerar duplicado
            maxSimilarPerMinute: 3, // Máximo 3 notificaciones similares por minuto
            autoDismissDelay: 5000, // 5 segundos por defecto
            enableSound: false,
            enableDesktop: true,
            filterLevel: 'normal', // 'minimal', 'normal', 'verbose'
            blockedTypes: [], // Tipos de notificaciones bloqueadas
            blockedKeywords: [] // Palabras clave bloqueadas
        };
        
        // Cargar configuración guardada
        this.loadSettings();
        
        // Cargar configuración del avatar
        this.loadAvatarSettings();
        
        this.init();
    }

    init() {
        try {
            // Crear contenedor de notificaciones si no existe
            if (!document.getElementById('notification-container')) {
                this.container = document.createElement('div');
                this.container.id = 'notification-container';
                const bar = document.getElementById('notification-bar');
                if (bar) {
                    bar.appendChild(this.container);
                } else {
                    document.body.appendChild(this.container);
                }
            } else {
                this.container = document.getElementById('notification-container');
            }
            
            // Limpiar notificaciones existentes al inicializar
            if (this.container) {
                this.container.innerHTML = '';
                this.notifications = [];
            }
            
            // Limpiar notificaciones antiguas del historial
            this.cleanupOldNotifications();
            
        } catch (error) {
            // Error silencioso si no se puede crear el contenedor
            console.warn('No se pudo inicializar el contenedor de notificaciones');
        }
    }

    /**
     * Carga la configuración guardada
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('notificationSettings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.warn('Error cargando configuración de notificaciones:', error);
        }
    }

    /**
     * Guarda la configuración actual
     */
    saveSettings() {
        try {
            localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Error guardando configuración de notificaciones:', error);
        }
    }

    /**
     * Carga la configuración del avatar personalizado
     */
    loadAvatarSettings() {
        try {
            const savedAvatar = localStorage.getItem('notificationAvatar');
            if (savedAvatar) {
                const avatarData = JSON.parse(savedAvatar);
                this.avatarUrl = avatarData.data;
            }
            
            const savedSettings = localStorage.getItem('avatarSettings');
            if (savedSettings) {
                this.avatarSettings = { ...this.avatarSettings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.warn('Error cargando configuración del avatar:', error);
        }
    }

    /**
     * Actualiza el avatar de las notificaciones
     */
    updateNotificationAvatar(avatarData, settings) {
        this.avatarUrl = avatarData;
        this.avatarSettings = { ...this.avatarSettings, ...settings };
        console.log('Avatar de notificaciones actualizado:', this.avatarUrl);
    }

    /**
     * Verifica si una notificación debe ser mostrada o bloqueada
     */
    shouldShowNotification(message, type) {
        // Verificar si el tipo está bloqueado
        if (this.settings.blockedTypes.includes(type)) {
            return false;
        }

        // Verificar palabras clave bloqueadas
        const messageLower = message.toLowerCase();
        for (const keyword of this.settings.blockedKeywords) {
            if (messageLower.includes(keyword.toLowerCase())) {
                return false;
            }
        }

        // Verificar nivel de filtro
        if (this.settings.filterLevel === 'minimal' && type === 'info') {
            return false;
        }

        // Verificar duplicados si está habilitado
        if (this.settings.preventDuplicates) {
            const notificationKey = `${message}-${type}`;
            const now = Date.now();
            
            // Verificar si es un duplicado reciente
            if (this.recentNotifications.has(notificationKey)) {
                const lastTime = this.recentNotifications.get(notificationKey);
                if (now - lastTime < this.settings.duplicateTimeout) {
                    return false; // Es un duplicado, no mostrar
                }
            }
            
            // Verificar frecuencia de notificaciones similares
            const similarCount = this.getSimilarNotificationsCount(message, type, 60000); // 1 minuto
            if (similarCount >= this.settings.maxSimilarPerMinute) {
                return false; // Demasiadas notificaciones similares
            }
            
            // Actualizar tracking
            this.recentNotifications.set(notificationKey, now);
        }

        return true;
    }

    /**
     * Cuenta notificaciones similares en un período de tiempo
     */
    getSimilarNotificationsCount(message, type, timeWindow) {
        const now = Date.now();
        const cutoff = now - timeWindow;
        
        return this.notificationHistory.filter(notification => {
            return notification.timestamp > cutoff &&
                   notification.type === type &&
                   this.isSimilarMessage(notification.message, message);
        }).length;
    }

    /**
     * Verifica si dos mensajes son similares
     */
    isSimilarMessage(message1, message2) {
        const words1 = message1.toLowerCase().split(/\s+/);
        const words2 = message2.toLowerCase().split(/\s+/);
        
        const commonWords = words1.filter(word => words2.includes(word));
        const similarity = commonWords.length / Math.max(words1.length, words2.length);
        
        return similarity > 0.6; // 60% de similitud
    }

    /**
     * Limpia notificaciones antiguas del tracking
     */
    cleanupOldNotifications() {
        const now = Date.now();
        const cutoff = now - this.settings.duplicateTimeout;
        
        // Limpiar notificaciones recientes antiguas
        for (const [key, timestamp] of this.recentNotifications.entries()) {
            if (timestamp < cutoff) {
                this.recentNotifications.delete(key);
            }
        }
        
        // Limpiar historial antiguo
        this.notificationHistory = this.notificationHistory.filter(notification => {
            return notification.timestamp > cutoff;
        });
        
        // Limitar tamaño del historial
        if (this.notificationHistory.length > this.maxHistorySize) {
            this.notificationHistory = this.notificationHistory.slice(-this.maxHistorySize);
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

        // Verificar si debe mostrar la notificación
        if (!this.shouldShowNotification(message, type)) {
            return;
        }

        // Verificar que el contenedor existe
        if (!this.container) {
            this.init();
            if (!this.container) {
                return; // No mostrar si no hay contenedor
            }
        }

        // Agregar al historial
        this.notificationHistory.push({
            message,
            type,
            timestamp: Date.now()
        });

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
            }, duration || this.settings.autoDismissDelay);
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

        // Crear avatar con configuraciones personalizadas
        let avatarHtml = '';
        if (this.avatarSettings.enabled) {
            const sizeMap = {
                small: '32px',
                medium: '40px',
                large: '48px',
                xlarge: '56px'
            };
            const size = sizeMap[this.avatarSettings.size] || '40px';
            
            const shapeMap = {
                circle: '50%',
                square: '0%',
                rounded: '8px'
            };
            const borderRadius = shapeMap[this.avatarSettings.shape] || '50%';
            
            const borderMap = {
                none: 'none',
                solid: `2px solid #667eea`,
                dashed: `2px dashed #667eea`,
                shadow: 'none'
            };
            const border = borderMap[this.avatarSettings.border] || '2px solid #667eea';
            
            const boxShadow = this.avatarSettings.border === 'shadow' 
                ? '0 2px 8px rgba(102, 126, 234, 0.3)' 
                : '0 1px 4px rgba(0, 0, 0, 0.1)';
            
            avatarHtml = `<img src="${this.avatarUrl}" alt="Logo" class="notification-avatar" style="width: ${size}; height: ${size}; border-radius: ${borderRadius}; border: ${border}; box-shadow: ${boxShadow}; object-fit: cover;" onerror="this.onerror=null;this.src='https://placehold.co/40x40/cccccc/ffffff?text=Logo';">`;
        }

        notification.innerHTML = `
            <div class="notification-left">
                ${avatarHtml}
                ${iconHtml}
            </div>
            <div class="notification-content">
                <span class="notification-message">${message}</span>
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

    /**
     * Actualiza la configuración de notificaciones
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        
        // Limpiar notificaciones si se cambió el filtro
        if (newSettings.filterLevel || newSettings.blockedTypes || newSettings.blockedKeywords) {
            this.cleanupOldNotifications();
        }
    }

    /**
     * Obtiene la configuración actual
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Bloquea un tipo de notificación
     */
    blockNotificationType(type) {
        if (!this.settings.blockedTypes.includes(type)) {
            this.settings.blockedTypes.push(type);
            this.saveSettings();
        }
    }

    /**
     * Desbloquea un tipo de notificación
     */
    unblockNotificationType(type) {
        const index = this.settings.blockedTypes.indexOf(type);
        if (index > -1) {
            this.settings.blockedTypes.splice(index, 1);
            this.saveSettings();
        }
    }

    /**
     * Bloquea una palabra clave
     */
    blockKeyword(keyword) {
        if (!this.settings.blockedKeywords.includes(keyword)) {
            this.settings.blockedKeywords.push(keyword);
            this.saveSettings();
        }
    }

    /**
     * Desbloquea una palabra clave
     */
    unblockKeyword(keyword) {
        const index = this.settings.blockedKeywords.indexOf(keyword);
        if (index > -1) {
            this.settings.blockedKeywords.splice(index, 1);
            this.saveSettings();
        }
    }

    /**
     * Obtiene estadísticas del sistema de notificaciones
     */
    getStatistics() {
        const now = Date.now();
        const lastHour = now - (60 * 60 * 1000);
        const lastDay = now - (24 * 60 * 60 * 1000);
        
        const hourlyStats = this.notificationHistory.filter(n => n.timestamp > lastHour);
        const dailyStats = this.notificationHistory.filter(n => n.timestamp > lastDay);
        
        const typeStats = {};
        this.notificationHistory.forEach(notification => {
            typeStats[notification.type] = (typeStats[notification.type] || 0) + 1;
        });
        
        return {
            totalNotifications: this.notificationHistory.length,
            activeNotifications: this.notifications.length,
            lastHour: hourlyStats.length,
            lastDay: dailyStats.length,
            byType: typeStats,
            recentDuplicates: this.recentNotifications.size,
            settings: this.settings
        };
    }

    /**
     * Limpia completamente el sistema de notificaciones
     */
    clearAllData() {
        this.notifications = [];
        this.notificationHistory = [];
        this.recentNotifications.clear();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.updateCount();
    }

    /**
     * Resetea la configuración a valores por defecto
     */
    resetSettings() {
        this.settings = {
            preventDuplicates: true,
            duplicateTimeout: 30000,
            maxSimilarPerMinute: 3,
            autoDismissDelay: 5000,
            enableSound: false,
            enableDesktop: true,
            filterLevel: 'normal',
            blockedTypes: [],
            blockedKeywords: []
        };
        this.saveSettings();
    }

    /**
     * Obtiene el historial de notificaciones
     */
    getHistory(limit = 50) {
        return this.notificationHistory
            .slice(-limit)
            .map(notification => ({
                ...notification,
                date: new Date(notification.timestamp).toLocaleString('es-VE')
            }));
    }

    /**
     * Exporta el historial de notificaciones
     */
    exportHistory() {
        const history = this.getHistory();
        const csv = [
            ['Fecha', 'Tipo', 'Mensaje'],
            ...history.map(n => [n.date, n.type, n.message])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notificaciones_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
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

// Nuevas funciones de configuración
window.updateNotificationSettings = (settings) => {
    if (window.notificationSystem) {
        return window.notificationSystem.updateSettings(settings);
    }
};

window.getNotificationSettings = () => {
    if (window.notificationSystem) {
        return window.notificationSystem.getSettings();
    }
    return null;
};

window.getNotificationStatistics = () => {
    if (window.notificationSystem) {
        return window.notificationSystem.getStatistics();
    }
    return null;
};

window.blockNotificationType = (type) => {
    if (window.notificationSystem) {
        return window.notificationSystem.blockNotificationType(type);
    }
};

window.unblockNotificationType = (type) => {
    if (window.notificationSystem) {
        return window.notificationSystem.unblockNotificationType(type);
    }
};

window.blockNotificationKeyword = (keyword) => {
    if (window.notificationSystem) {
        return window.notificationSystem.blockKeyword(keyword);
    }
};

window.unblockNotificationKeyword = (keyword) => {
    if (window.notificationSystem) {
        return window.notificationSystem.unblockKeyword(keyword);
    }
};

window.clearNotificationHistory = () => {
    if (window.notificationSystem) {
        return window.notificationSystem.clearAllData();
    }
};

window.exportNotificationHistory = () => {
    if (window.notificationSystem) {
        return window.notificationSystem.exportHistory();
    }
};

window.resetNotificationSettings = () => {
    if (window.notificationSystem) {
        return window.notificationSystem.resetSettings();
    }
};

// Función global para actualizar el avatar de notificaciones
window.updateNotificationAvatar = (avatarData, settings) => {
    if (window.notificationSystem) {
        return window.notificationSystem.updateNotificationAvatar(avatarData, settings);
    }
};

// Limpiar notificaciones antiguas cada 5 minutos
setInterval(() => {
    if (window.notificationSystem) {
        window.notificationSystem.cleanupOldNotifications();
    }
}, 5 * 60 * 1000); // 5 minutos

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