// Configuración del Sistema de Registro de Votos 2025
const CONFIG = {
    // Configuración de la API
    API_URL: 'http://localhost:3001',
    
    // Configuración de optimizaciones
    OPTIMIZATIONS: {
        // Cola de registros para manejar múltiples usuarios simultáneos
        REGISTRATION_QUEUE: {
            ENABLED: true,
            MAX_CONCURRENT: 3,
            DELAY_BETWEEN: 500, // ms
            MAX_RETRIES: 3
        },
        
        // Cache para mejorar rendimiento
        CACHE: {
            ENABLED: true,
            DEFAULT_TTL: 30000, // 30 segundos
            MAX_ITEMS: 100
        },
        
        // Debounce para búsquedas
        SEARCH: {
            DEBOUNCE_DELAY: 300, // ms
            MIN_CHARS: 3
        },
        
        // Notificaciones optimizadas
        NOTIFICATIONS: {
            PREVENT_DUPLICATES: true,
            AUTO_HIDE_DELAY: 5000, // 5 segundos
            MAX_DISPLAY_TIME: 10000 // 10 segundos
        }
    },
    
    // Configuración de campos del formulario
    FORM_FIELDS: {
        REQUIRED: ['name', 'cedula', 'telefono', 'sexo', 'edad', 'ubch', 'community'],
        VALIDATION: {
            CEDULA: {
                MIN_LENGTH: 6,
                MAX_LENGTH: 10,
                PATTERN: /^\d+$/
            },
            TELEFONO: {
                PATTERN: /^04\d{9}$/,
                FORMAT: '04xxxxxxxxx'
            },
            EDAD: {
                MIN: 16,
                MAX: 120
            },
            SEXO: {
                VALUES: ['M', 'F'],
                LABELS: {
                    'M': 'Masculino',
                    'F': 'Femenino'
                }
            }
        }
    },
    
    // Configuración de rangos de edad para estadísticas
    AGE_RANGES: [
        { min: 16, max: 25, label: '16-25 años' },
        { min: 26, max: 35, label: '26-35 años' },
        { min: 36, max: 45, label: '36-45 años' },
        { min: 46, max: 55, label: '46-55 años' },
        { min: 56, max: 65, label: '56-65 años' },
        { min: 66, max: null, label: '66+ años' }
    ],
    
    // Configuración de exportación
    EXPORT: {
        PDF: {
            ENABLED: true,
            COLUMNS: ['Nombre', 'Cédula', 'Sexo', 'Edad', 'Teléfono', 'UBCH', 'Comunidad', 'Votó']
        },
        CSV: {
            ENABLED: true,
            ENCODING: 'utf-8'
        }
    },
    
    // Configuración de estadísticas
    STATISTICS: {
        SECTIONS: ['ubch', 'community', 'sexo', 'edad'],
        UPDATE_INTERVAL: 5000 // 5 segundos
    }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
} 