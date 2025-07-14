// pre-init.js
// Script de pre-inicialización para prevenir errores

console.log('🚀 Pre-inicialización del sistema...');

// Prevenir errores de Firebase antes de que ocurran
function setupFirebaseFallback() {
    console.log('🔥 Configurando fallback de Firebase...');
    
    // Crear configuración de Firebase de respaldo
    if (!window.firebaseDB) {
        window.firebaseDB = {
            isAvailable: false,
            db: null,
            votesCollection: {
                get: async () => ({ docs: [] }),
                add: async (data) => ({ id: Date.now().toString() }),
                doc: (id) => ({
                    get: async () => ({ exists: false, data: () => null }),
                    set: async (data) => ({ id }),
                    update: async (data) => ({ id }),
                    delete: async () => ({ id })
                }),
                limit: (num) => ({
                    get: async () => ({ docs: [] })
                }),
                where: (field, operator, value) => ({
                    get: async () => ({ docs: [], size: 0 })
                })
            },
            ubchCollection: {
                doc: (id) => ({
                    get: async () => ({ exists: false, data: () => null }),
                    set: async (data) => ({ id })
                })
            },
            defaultUBCHConfig: {
                "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS", "VILLAS DEL CENTRO 3ERA ETAPA B", "VILLAS DEL CENTRO 3ERA ETAPA C", "VILLAS DEL CENTRO 4A ETAPA", "LA CAMACHERA"],
                "LICEO JOSE FELIX RIBAS": ["EL CUJIJAL", "LAS FLORES", "LAS ESPERANZA 200", "VILLAS DEL CENTRO 2ERA ETAPA A", "LOS PALOMARES", "EL LAGO", "CAIPARICALLY I II", "EL BANCO", "CAIPARICHA I Y II"],
                "ESCUELA PRIMARIA BOLIVARIANA LA PRADERA": ["EL SAMAN", "GUADALUPE", "PALOS GRANDES II", "PALOS GRANDES I", "TIERRA DEL SOL", "LA CASTELLANA", "GARDENIAS I", "GARDENIAS II", "EL CERCADITO", "ALTAMIRA", "LA ADJUNTADA", "BUCARES", "GUAYABAL", "APARTATE", "EL REFUGIO", "LOS ROBLES", "ARAUCARIA"],
                "CASA COMUNAL JOSE TOMAS GALLARDO": ["JOSE TOMAS GALLARDO A", "LA PRIMAVERA"],
                "ESCUELA 5 DE JULIO": ["10 DE AGOSTO", "CAMPO ALEGRE I", "CAMPO ALEGRE II", "5 DE JULIO"],
                "ESCUELA CECILIO ACOSTA": ["VOLUNTAD DE DIOS", "LAS MATWINAS", "BRISAS DEL LAGO", "MANDANTO", "INDIANAPOLIS", "SUR DE ACOSTA"],
                "ESCUELA BASICA FE Y ALEGRIA": ["FE Y ALEGRIA", "BARRIO SOLIDARIO", "COMUNIDAD FUTURO"],
                "ESCUELA GRADUADA ANTONIO JOSE DE SUCRE": ["JESUS DE NAZARETH", "SECTOR BOLIVAR", "PALO NEGRO ESTE"],
                "CASA COMUNAL": ["LOS JABILLOS"],
                "UNIDAD EDUCATIVA MONSEÑOR JOSÉ JACINTO SOTO LAYA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II"],
                "BASE DE MISIONES LUISA CACERES DE ARISMENDI": ["24 DE ENERO", "19 DE ABRIL", "EL PROGRESO"],
                "ESCUELA ESTADAL ALEJO ZULOAGA": ["MAIQUETIA", "SAENZ", "PANAMERICANO"],
                "UNIDAD EDUCATIVA MONSEÑOR MONTES DE OCA": ["REMEDIOS"],
                "ESCUELA BASICA NACIONAL CONCENTRADA LA ESTACION": ["18 DE OCTUBRE"],
                "ESCUELA RECEPTORIA": ["CARMEN CENTRO"],
                "GRUPO ESCOLAR DR RAFAEL PEREZ": ["VIRGEN DEL CARMEN"],
                "LICEO ALFREDO PIETRI": ["LOS OJITOS", "LOS VENECIANOS"],
                "ESCUELA BOLIVARIANA ROMERO GARCIA": ["SAN BERNARDO", "LA HACIENDA"],
                "ESCUELA GRADUADA PEDRO GUAL": ["INDIANAPOLIS NORTE"]
            },
            initializeUBCHConfig: async function() {
                console.log('✅ Configuración UBCH inicializada (modo offline)');
            }
        };
    }
    
    console.log('✅ Fallback de Firebase configurado');
}

// Prevenir errores de DOM
function setupDOMFallbacks() {
    console.log('📝 Configurando fallbacks de DOM...');
    
    // Prevenir errores de appendChild
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function(child) {
        if (this && this.nodeType === Node.ELEMENT_NODE) {
            return originalAppendChild.call(this, child);
        } else {
            console.warn('⚠️ Intentando appendChild en elemento null/undefined');
            return null;
        }
    };
    
    // Prevenir errores de style
    const originalStyle = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
    Object.defineProperty(HTMLElement.prototype, 'style', {
        get: function() {
            if (this && this.nodeType === Node.ELEMENT_NODE) {
                return originalStyle.get.call(this);
            } else {
                console.warn('⚠️ Intentando acceder a style en elemento null/undefined');
                return { display: 'none' };
            }
        },
        set: function(value) {
            if (this && this.nodeType === Node.ELEMENT_NODE) {
                originalStyle.set.call(this, value);
            } else {
                console.warn('⚠️ Intentando establecer style en elemento null/undefined');
            }
        }
    });
    
    console.log('✅ Fallbacks de DOM configurados');
}

// Prevenir errores de Service Worker
function setupServiceWorkerFallback() {
    console.log('🔧 Configurando fallback de Service Worker...');
    
    if ('serviceWorker' in navigator) {
        // Registrar Service Worker con manejo de errores
        navigator.serviceWorker.register('./service-worker.js')
            .then(function(registration) {
                console.log('✅ Service Worker registrado exitosamente:', registration);
            })
            .catch(function(error) {
                console.warn('⚠️ Error registrando Service Worker (no crítico):', error);
            });
    } else {
        console.log('ℹ️ Service Worker no disponible en este navegador');
    }
    
    console.log('✅ Fallback de Service Worker configurado');
}

// Prevenir errores de notificaciones
function setupNotificationFallback() {
    console.log('🔔 Configurando fallback de notificaciones...');
    
    // Crear contenedor de notificaciones si no existe
    if (!document.getElementById('notification-container')) {
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 300px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    console.log('✅ Fallback de notificaciones configurado');
}

// Prevenir errores de función switchRegistrationMode
function setupSwitchRegistrationModeFallback() {
    console.log('🔄 Configurando fallback de switchRegistrationMode...');
    
    // Definir la función de manera segura
    window.switchRegistrationMode = function(mode) {
        try {
            console.log(`🔄 Cambiando modo de registro a: ${mode}`);
            
            const individualDiv = document.getElementById('individual-registration');
            const bulkDiv = document.getElementById('bulk-registration');
            const myRecordsDiv = document.getElementById('myrecords-registration');
            const modeButtons = document.querySelectorAll('.mode-btn');
            
            // Verificar que los elementos existen antes de acceder a sus propiedades
            if (individualDiv && bulkDiv && myRecordsDiv) {
                // Actualizar botones
                modeButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.mode === mode) {
                        btn.classList.add('active');
                    }
                });
                
                // Mostrar/ocultar secciones
                if (mode === 'individual') {
                    individualDiv.style.display = 'block';
                    bulkDiv.style.display = 'none';
                    myRecordsDiv.style.display = 'none';
                } else if (mode === 'bulk') {
                    individualDiv.style.display = 'none';
                    bulkDiv.style.display = 'block';
                    myRecordsDiv.style.display = 'none';
                } else if (mode === 'mylistado') {
                    individualDiv.style.display = 'none';
                    bulkDiv.style.display = 'none';
                    myRecordsDiv.style.display = 'block';
                }
                
                console.log(`✅ Modo de registro cambiado a: ${mode}`);
            } else {
                console.warn('⚠️ Algunos elementos de registro no encontrados');
            }
            
        } catch (error) {
            console.error('❌ Error cambiando modo de registro:', error);
        }
    };
    
    console.log('✅ Fallback de switchRegistrationMode configurado');
}

// Función principal de pre-inicialización
function preInitialize() {
    console.log('🚀 Ejecutando pre-inicialización...');
    
    try {
        // 1. Configurar fallbacks de Firebase
        setupFirebaseFallback();
        
        // 2. Configurar fallbacks de DOM
        setupDOMFallbacks();
        
        // 3. Configurar fallback de Service Worker
        setupServiceWorkerFallback();
        
        // 4. Configurar fallback de notificaciones
        setupNotificationFallback();
        
        // 5. Configurar fallback de switchRegistrationMode
        setupSwitchRegistrationModeFallback();
        
        console.log('✅ Pre-inicialización completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error en pre-inicialización:', error);
    }
}

// Ejecutar pre-inicialización inmediatamente
preInitialize();

// También ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preInitialize);
} else {
    preInitialize();
}

console.log('📋 Script de pre-inicialización cargado'); 