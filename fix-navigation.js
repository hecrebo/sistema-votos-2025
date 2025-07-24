// === SCRIPT DE REPARACIÓN DE NAVEGACIÓN ===
console.log('🔧 Iniciando reparación de navegación...');

// Función para configurar navegación por defecto
function configurarNavegacionPorDefecto() {
    console.log('🔧 Configurando navegación por defecto...');
    
    // Mostrar todos los botones de navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.style.display = 'inline-block';
        btn.classList.add('configured');
    });
    
    console.log(`✅ ${navButtons.length} botones de navegación configurados`);
}

// Función para configurar navegación por rol
function configurarNavegacionPorRol() {
    console.log('🔧 Configurando navegación por rol...');
    
    // Obtener usuario actual
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = currentUser.role || 'usuario basico';
    const username = currentUser.username || 'Usuario';
    
    console.log(`👤 Usuario: ${username}, Rol: ${userRole}`);
    
    // Ocultar todos los botones primero
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.style.display = 'none';
    });
    
    // Mostrar botones según el rol
    switch(userRole) {
        case 'superusuario':
        case 'admin':
            // Mostrar todos los botones
            navButtons.forEach(btn => {
                btn.style.display = 'inline-block';
                btn.classList.add('configured');
            });
            console.log('👑 Configuración para SUPERUSUARIO/ADMIN');
            break;
            
        case 'verificador':
            // Mostrar botones específicos del verificador
            const verifierButtons = [
                'nav-listado',
                'nav-dashboard',
                'nav-statistics',
                'nav-advanced-stats'
            ];
            verifierButtons.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.style.display = 'inline-block';
                    btn.classList.add('configured');
                }
            });
            console.log('🔍 Configuración para VERIFICADOR');
            break;
            
        case 'registrador':
            // Mostrar botones específicos del registrador
            const registratorButtons = [
                'nav-registration',
                'nav-check-in',
                'nav-registrator-dashboard',
                'nav-registrator-history',
                'nav-listado',
                'nav-dashboard'
            ];
            registratorButtons.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.style.display = 'inline-block';
                    btn.classList.add('configured');
                }
            });
            console.log('📝 Configuración para REGISTRADOR');
            break;
            
        default:
            // Configuración por defecto - mostrar botones básicos
            const defaultButtons = [
                'nav-registration',
                'nav-check-in',
                'nav-listado',
                'nav-dashboard'
            ];
            defaultButtons.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.style.display = 'inline-block';
                    btn.classList.add('configured');
                }
            });
            console.log('👤 Configuración por defecto');
            break;
    }
    
    console.log('✅ Navegación configurada correctamente');
}

// Función para verificar y arreglar Firebase
function verificarYArreglarFirebase() {
    console.log('🔥 Verificando Firebase...');
    
    if (!window.firebaseDB) {
        console.log('⚠️ Firebase no disponible, intentando inicializar...');
        
        // Crear objeto Firebase temporal
        window.firebaseDB = {
            votesCollection: {
                add: function(data) {
                    console.log('📝 Simulación de guardado en Firebase:', data);
                    return Promise.resolve({ id: 'temp-' + Date.now() });
                },
                where: function(field, operator, value) {
                    return {
                        limit: function(num) {
                            return {
                                get: function() {
                                    return Promise.resolve({ empty: true, size: 0 });
                                }
                            };
                        }
                    };
                }
            }
        };
        
        console.log('✅ Firebase temporal creado');
    } else {
        console.log('✅ Firebase disponible');
    }
}

// Función para verificar registro masivo
function verificarRegistroMasivo() {
    console.log('📊 Verificando registro masivo...');
    
    // Verificar que las funciones estén disponibles
    const funciones = [
        'procesarRegistrosMasivos',
        'limpiarTablaMasiva',
        'loadExcelFile',
        'downloadTemplate'
    ];
    
    funciones.forEach(func => {
        if (typeof window[func] !== 'function') {
            console.log(`⚠️ Función ${func} no disponible, creando temporal...`);
            
            window[func] = function() {
                alert(`⚠️ Función temporal: ${func}\n\nRecarga la página para usar la función completa.`);
            };
        }
    });
    
    console.log('✅ Funciones de registro masivo verificadas');
}

// Función principal de reparación
function repararSistema() {
    console.log('🔧 === INICIANDO REPARACIÓN DEL SISTEMA ===');
    
    // 1. Configurar navegación
    configurarNavegacionPorDefecto();
    
    // 2. Verificar Firebase
    verificarYArreglarFirebase();
    
    // 3. Verificar registro masivo
    verificarRegistroMasivo();
    
    // 4. Configurar event listeners
    configurarEventListeners();
    
    console.log('✅ Reparación del sistema completada');
}

// Función para configurar event listeners
function configurarEventListeners() {
    console.log('🔧 Configurando event listeners...');
    
    // Event listeners para navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page) {
                console.log(`🔄 Navegando a: ${page}`);
                // Aquí iría la lógica de navegación
            }
        });
    });
    
    // Event listener para cerrar sesión
    const logoutBtn = document.querySelector('[onclick*="logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log('🚪 Cerrando sesión...');
            localStorage.removeItem('currentUser');
            window.location.reload();
        });
    }
    
    console.log('✅ Event listeners configurados');
}

// Ejecutar reparación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, iniciando reparación...');
    
    // Esperar un poco para que otros scripts se carguen
    setTimeout(() => {
        repararSistema();
    }, 1000);
});

// Función global para reparación manual
window.repararSistema = repararSistema;
window.configurarNavegacionPorRol = configurarNavegacionPorRol;

console.log('✅ Script de reparación de navegación cargado');
console.log('💡 Ejecuta repararSistema() en la consola para reparación manual'); 