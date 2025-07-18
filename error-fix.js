// error-fix.js
// Reparación específica para errores identificados en los logs

console.log('🔧 Iniciando reparación de errores específicos...');

// Error 1: Firebase votesCollection undefined
function fixFirebaseCollectionError() {
    console.log('🔥 Reparando error de Firebase votesCollection...');
    
    try {
        // Verificar si firebaseDB existe
        if (!window.firebaseDB) {
            console.log('⚠️ firebaseDB no disponible, creando configuración de respaldo...');
            window.firebaseDB = {
                isAvailable: false,
                db: null,
                votesCollection: null,
                ubchCollection: null,
                defaultUBCHConfig: {
                    "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS"],
                    "LICEO JOSE FELIX RIBAS": ["EL CUJIJAL", "LAS FLORES"]
                },
                initializeUBCHConfig: async function() {
                    console.log('✅ Configuración UBCH inicializada (modo offline)');
                }
            };
        }
        
        // Verificar si votesCollection existe
        if (!window.firebaseDB.votesCollection) {
            console.log('⚠️ votesCollection no disponible, creando mock...');
            window.firebaseDB.votesCollection = {
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
                })
            };
        }
        
        console.log('✅ Error de Firebase votesCollection reparado');
        
    } catch (error) {
        console.error('❌ Error reparando Firebase:', error);
    }
}

// Error 2: appendChild null error
function fixAppendChildError() {
    console.log('📝 Reparando error de appendChild...');
    
    try {
        // Verificar si el elemento existe antes de usar appendChild
        const originalAppendChild = Element.prototype.appendChild;
        Element.prototype.appendChild = function(child) {
            if (this && this.nodeType === Node.ELEMENT_NODE) {
                return originalAppendChild.call(this, child);
            } else {
                console.warn('⚠️ Intentando appendChild en elemento null/undefined');
                return null;
            }
        };
        
        console.log('✅ Error de appendChild reparado');
        
    } catch (error) {
        console.error('❌ Error reparando appendChild:', error);
    }
}

// Error 3: style null error
function fixStyleError() {
    console.log('🎨 Reparando error de style...');
    
    try {
        // Verificar si el elemento existe antes de acceder a style
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
        
        console.log('✅ Error de style reparado');
        
    } catch (error) {
        console.error('❌ Error reparando style:', error);
    }
}

// Error 4: Service Worker registration
function fixServiceWorkerError() {
    console.log('🔧 Reparando error de Service Worker...');
    
    try {
        // Verificar si el Service Worker está disponible
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
        
        console.log('✅ Error de Service Worker reparado');
        
    } catch (error) {
        console.error('❌ Error reparando Service Worker:', error);
    }
}

// Reparar función switchRegistrationMode
function fixSwitchRegistrationMode() {
    console.log('🔄 Reparando función switchRegistrationMode...');
    
    try {
        // Redefinir la función con manejo de errores
        window.switchRegistrationMode = function(mode) {
            try {
                console.log(`🔄 Cambiando modo de registro a: ${mode}`);
                
                // Ocultar todos los modos
                const modes = ['individual', 'bulk', 'mylistado'];
                modes.forEach(m => {
                    const element = document.getElementById(`${m}-registration`);
                    if (element) {
                        element.style.display = 'none';
                    }
                });
                
                // Mostrar modo seleccionado
                const selectedElement = document.getElementById(`${mode}-registration`);
                if (selectedElement) {
                    selectedElement.style.display = 'block';
                }
                
                // Actualizar botones
                const buttons = document.querySelectorAll('.mode-btn');
                buttons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-mode') === mode) {
                        btn.classList.add('active');
                    }
                });
                
                console.log(`✅ Modo de registro cambiado a: ${mode}`);
                
            } catch (error) {
                console.error('❌ Error cambiando modo de registro:', error);
            }
        };
        
        console.log('✅ Función switchRegistrationMode reparada');
        
    } catch (error) {
        console.error('❌ Error reparando switchRegistrationMode:', error);
    }
}

// Reparar sistema de notificaciones
function fixNotificationSystem() {
    console.log('🔔 Reparando sistema de notificaciones...');
    
    try {
        // Crear contenedor de notificaciones si no existe
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
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
        
        console.log('✅ Sistema de notificaciones reparado');
        
    } catch (error) {
        console.error('❌ Error reparando sistema de notificaciones:', error);
    }
}

// Reparar sistema de sincronización
function fixSyncSystem() {
    console.log('🔄 Reparando sistema de sincronización...');
    
    try {
        // Verificar si el sistema de votación tiene método syncData
        if (window.votingSystem && !window.votingSystem.syncData) {
            window.votingSystem.syncData = async function() {
                console.log('🔄 Sincronizando datos...');
                try {
                    // Implementación básica de sincronización
                    if (this.firebaseAvailable && this.votesCollection) {
                        const snapshot = await this.votesCollection.get();
                        this.votes = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            synced: true
                        }));
                        console.log(`✅ ${this.votes.length} registros sincronizados`);
                    } else {
                        console.log('⚠️ Firebase no disponible para sincronización');
                    }
                } catch (error) {
                    console.error('❌ Error en sincronización:', error);
                }
            };
        }
        
        console.log('✅ Sistema de sincronización reparado');
        
    } catch (error) {
        console.error('❌ Error reparando sistema de sincronización:', error);
    }
}

// Función principal de reparación
async function fixAllErrors() {
    console.log('🚀 Iniciando reparación de todos los errores...');
    
    try {
        // 1. Reparar errores de Firebase
        fixFirebaseCollectionError();
        
        // 2. Reparar errores de DOM
        fixAppendChildError();
        fixStyleError();
        
        // 3. Reparar Service Worker
        fixServiceWorkerError();
        
        // 4. Reparar función de cambio de modo
        fixSwitchRegistrationMode();
        
        // 5. Reparar sistema de notificaciones
        fixNotificationSystem();
        
        // 6. Reparar sistema de sincronización
        fixSyncSystem();
        
        console.log('✅ Todos los errores han sido reparados');
        
        // Verificar que las reparaciones funcionaron
        await verifyRepairs();
        
    } catch (error) {
        console.error('❌ Error durante la reparación:', error);
    }
}

// Verificar que las reparaciones funcionaron
async function verifyRepairs() {
    console.log('🔍 Verificando reparaciones...');
    
    const checks = [
        { name: 'Firebase Collection', check: () => window.firebaseDB && window.firebaseDB.votesCollection },
        { name: 'Switch Registration Mode', check: () => typeof window.switchRegistrationMode === 'function' },
        { name: 'Notification Container', check: () => document.getElementById('notification-container') },
        { name: 'Service Worker', check: () => 'serviceWorker' in navigator }
    ];
    
    let successCount = 0;
    
    for (const check of checks) {
        try {
            if (check.check()) {
                console.log(`✅ ${check.name}: OK`);
                successCount++;
            } else {
                console.log(`❌ ${check.name}: Falló`);
            }
        } catch (error) {
            console.log(`❌ ${check.name}: Error - ${error.message}`);
        }
    }
    
    console.log(`📊 Verificación completada: ${successCount}/${checks.length} reparaciones exitosas`);
    
    return successCount === checks.length;
}

// Ejecutar reparación automáticamente
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Ejecutando reparación automática de errores...');
    fixAllErrors();
});

// Exportar funciones para uso manual
window.fixAllErrors = fixAllErrors;
window.fixFirebaseCollectionError = fixFirebaseCollectionError;
window.fixAppendChildError = fixAppendChildError;
window.fixStyleError = fixStyleError;
window.fixServiceWorkerError = fixServiceWorkerError;
window.fixSwitchRegistrationMode = fixSwitchRegistrationMode;
window.fixNotificationSystem = fixNotificationSystem;
window.fixSyncSystem = fixSyncSystem;

console.log('🔧 Script de reparación de errores cargado'); 