// Configuración de Optimizaciones para Múltiples Usuarios
const SYSTEM_CONFIG = {
    // Configuración de cola de registros
    queue: {
        maxConcurrentRegistrations: 5,
        delayBetweenRegistrations: 100, // ms
        maxQueueSize: 100,
        retryAttempts: 3
    },

    // Configuración de cache
    cache: {
        ubchData: 30000, // 30 segundos
        votes: 10000,    // 10 segundos
        searchResults: 5000 // 5 segundos
    },

    // Configuración de debounce
    debounce: {
        search: 300,     // 300ms para búsquedas
        formValidation: 200, // 200ms para validación
        autoSave: 1000   // 1 segundo para auto-guardado
    },

    // Configuración de notificaciones
    notifications: {
        maxDisplayTime: 3000, // 3 segundos
        preventDuplicates: true,
        maxVisible: 3
    },

    // Configuración de rendimiento
    performance: {
        maxVotesToRender: 1000,
        paginationSize: 50,
        updateInterval: 5000 // 5 segundos para actualizaciones
    },

    // Configuración de validación
    validation: {
        cedula: {
            minLength: 6,
            maxLength: 10,
            pattern: /^\d+$/
        },
        telefono: {
            pattern: /^04\d{9}$/,
            format: '04xxxxxxxxx'
        },
        nombre: {
            minLength: 3,
            maxLength: 100
        }
    },

    // Configuración de exportación
    export: {
        maxRecordsPerExport: 10000,
        csvDelimiter: ',',
        pdfPageSize: 'A4'
    },

    // Configuración de seguridad
    security: {
        maxLoginAttempts: 5,
        sessionTimeout: 3600000, // 1 hora
        enableAuditLog: true
    }
};

// Funciones de utilidad para optimizaciones
const OPTIMIZATION_UTILS = {
    // Debounce genérico
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle para limitar frecuencia de ejecución
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Validación de datos
    validateData: function(data, rules) {
        const errors = [];
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            
            if (rule.required && !value) {
                errors.push(`${field} es requerido`);
                continue;
            }
            
            if (value && rule.minLength && value.length < rule.minLength) {
                errors.push(`${field} debe tener al menos ${rule.minLength} caracteres`);
            }
            
            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors.push(`${field} debe tener máximo ${rule.maxLength} caracteres`);
            }
            
            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors.push(`${field} tiene formato inválido`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Cache simple
    createCache: function(maxAge = 30000) {
        const cache = new Map();
        
        return {
            get: function(key) {
                const item = cache.get(key);
                if (!item) return null;
                
                if (Date.now() - item.timestamp > maxAge) {
                    cache.delete(key);
                    return null;
                }
                
                return item.data;
            },
            
            set: function(key, data) {
                cache.set(key, {
                    data,
                    timestamp: Date.now()
                });
            },
            
            clear: function() {
                cache.clear();
            }
        };
    },

    // Sistema de cola simple
    createQueue: function(processor, maxConcurrent = 1) {
        const queue = [];
        let processing = 0;
        
        const processNext = async () => {
            if (processing >= maxConcurrent || queue.length === 0) {
                return;
            }
            
            processing++;
            const item = queue.shift();
            
            try {
                await processor(item.data);
                item.resolve(item.data);
            } catch (error) {
                item.reject(error);
            } finally {
                processing--;
                processNext();
            }
        };
        
        return {
            add: function(data) {
                return new Promise((resolve, reject) => {
                    queue.push({ data, resolve, reject });
                    processNext();
                });
            },
            
            getLength: function() {
                return queue.length;
            },
            
            clear: function() {
                queue.length = 0;
            }
        };
    },

    // Notificaciones optimizadas
    createNotificationManager: function() {
        const notifications = [];
        const maxVisible = SYSTEM_CONFIG.notifications.maxVisible;
        
        return {
            show: function(message, type = 'info', duration = SYSTEM_CONFIG.notifications.maxDisplayTime) {
                const notification = {
                    id: Date.now() + Math.random(),
                    message,
                    type,
                    timestamp: Date.now()
                };
                
                notifications.push(notification);
                
                // Limitar notificaciones visibles
                if (notifications.length > maxVisible) {
                    notifications.shift();
                }
                
                // Auto-remover después del tiempo especificado
                setTimeout(() => {
                    const index = notifications.findIndex(n => n.id === notification.id);
                    if (index > -1) {
                        notifications.splice(index, 1);
                    }
                }, duration);
                
                return notification.id;
            },
            
            getNotifications: function() {
                return notifications.slice();
            },
            
            clear: function() {
                notifications.length = 0;
            }
        };
    }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SYSTEM_CONFIG, OPTIMIZATION_UTILS };
} else {
    window.SYSTEM_CONFIG = SYSTEM_CONFIG;
    window.OPTIMIZATION_UTILS = OPTIMIZATION_UTILS;
} 