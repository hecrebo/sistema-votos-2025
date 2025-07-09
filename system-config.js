// system-config.js - Configuración unificada del sistema
console.log('🔧 Cargando configuración del sistema...');

// Configuración global del sistema
window.SYSTEM_CONFIG = {
    // Configuración de Firebase
    firebase: {
        enabled: true,
        retryAttempts: 3,
        retryDelay: 2000
    },
    
    // Configuración de sesión
    session: {
        timeout: 24 * 60 * 60 * 1000, // 24 horas
        checkInterval: 60000 // 1 minuto
    },
    
    // Configuración de sincronización
    sync: {
        enabled: true,
        interval: 30000, // 30 segundos
        maxRetries: 3
    },
    
    // Configuración de cache
    cache: {
        enabled: true,
        ttl: 300000 // 5 minutos
    },
    
    // Configuración de validación
    validation: {
        cedula: {
            minLength: 6,
            maxLength: 10,
            pattern: /^\d+$/
        },
        telefono: {
            pattern: /^04\d{9}$/
        },
        edad: {
            min: 16,
            max: 120
        }
    }
};

// Función para verificar si el sistema está listo
window.isSystemReady = function() {
    return window.firebaseDB && window.firebaseDB.db;
};

// Función para esperar a que el sistema esté listo
window.waitForSystem = function(callback, maxWait = 10000) {
    const startTime = Date.now();
    
    function check() {
        if (window.isSystemReady()) {
            callback();
        } else if (Date.now() - startTime < maxWait) {
            setTimeout(check, 500);
        } else {
            console.error('❌ Sistema no disponible después de esperar');
            callback(new Error('Sistema no disponible'));
        }
    }
    
    check();
};

console.log('✅ Configuración del sistema cargada'); 