// enhanced-init.js
// Inicialización mejorada del sistema de votos 2025

console.log('🚀 Iniciando Sistema de Votos 2025 (Versión Mejorada)...');

// Configuración global
window.systemConfig = {
    maxRetries: 5,
    retryDelay: 1000,
    debugMode: true
};

// Función de logging mejorada
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (window.systemConfig.debugMode) {
        console.log(logMessage);
    }
    
    // También mostrar en la interfaz si hay un elemento de logs
    const logsElement = document.getElementById('system-logs');
    if (logsElement) {
        logsElement.textContent += logMessage + '\n';
        logsElement.scrollTop = logsElement.scrollHeight;
    }
}

// Verificar dependencias críticas
function checkCriticalDependencies() {
    log('🔍 Verificando dependencias críticas...');
    
    const dependencies = [
        { name: 'Firebase', check: () => typeof firebase !== 'undefined' },
        { name: 'Firebase Config', check: () => window.firebaseDB !== undefined },
        { name: 'Voting System', check: () => typeof VotingSystem !== 'undefined' },
        { name: 'DOM Ready', check: () => document.readyState === 'complete' }
    ];
    
    let allDependenciesMet = true;
    
    for (const dep of dependencies) {
        try {
            if (dep.check()) {
                log(`✅ ${dep.name}: OK`);
            } else {
                log(`❌ ${dep.name}: No disponible`);
                allDependenciesMet = false;
            }
        } catch (error) {
            log(`❌ ${dep.name}: Error - ${error.message}`);
            allDependenciesMet = false;
        }
    }
    
    return allDependenciesMet;
}

// Inicializar Firebase con retry
async function initializeFirebaseWithRetry() {
    log('🔥 Inicializando Firebase con retry...');
    
    let retries = 0;
    
    while (retries < window.systemConfig.maxRetries) {
        try {
            if (window.firebaseDB && window.firebaseDB.isAvailable) {
                log('✅ Firebase ya está disponible');
                return true;
            }
            
            // Esperar un poco antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, window.systemConfig.retryDelay));
            retries++;
            
            log(`⏳ Intento ${retries}/${window.systemConfig.maxRetries}...`);
            
        } catch (error) {
            log(`❌ Error en intento ${retries}: ${error.message}`);
            retries++;
        }
    }
    
    log('⚠️ Firebase no disponible después de múltiples intentos');
    return false;
}

// Inicializar sistema de votación con retry
async function initializeVotingSystemWithRetry() {
    log('🗳️ Inicializando sistema de votación con retry...');
    
    let retries = 0;
    
    while (retries < window.systemConfig.maxRetries) {
        try {
            // Crear instancia del sistema
            if (typeof VotingSystemFirebase !== 'undefined') {
                window.votingSystem = new VotingSystemFirebase();
                log('✅ VotingSystemFirebase creado');
            } else if (typeof VotingSystem !== 'undefined') {
                window.votingSystem = new VotingSystem();
                log('✅ VotingSystem creado (modo offline)');
            } else {
                throw new Error('No se encontró ninguna clase de sistema de votación');
            }
            
            // Inicializar el sistema
            if (window.votingSystem && typeof window.votingSystem.init === 'function') {
                await window.votingSystem.init();
                log('✅ Sistema de votación inicializado');
                return true;
            } else {
                throw new Error('Método init no disponible');
            }
            
        } catch (error) {
            log(`❌ Error en intento ${retries}: ${error.message}`);
            retries++;
            
            if (retries < window.systemConfig.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, window.systemConfig.retryDelay));
            }
        }
    }
    
    log('⚠️ Sistema de votación no pudo inicializarse');
    return false;
}

// Inicializar funciones específicas
async function initializeSpecificFunctions() {
    log('⚙️ Inicializando funciones específicas...');
    
    try {
        // 1. Inicializar Registro
        await initializeRegistration();
        
        // 2. Inicializar Confirmar Voto
        await initializeCheckIn();
        
        // 3. Inicializar Listado
        await initializeList();
        
        // 4. Inicializar Totales
        await initializeTotals();
        
        // 5. Inicializar Estadísticas
        await initializeStatistics();
        
        log('✅ Funciones específicas inicializadas');
        return true;
        
    } catch (error) {
        log(`❌ Error inicializando funciones específicas: ${error.message}`);
        return false;
    }
}

// Inicializar función de Registro
async function initializeRegistration() {
    log('📝 Inicializando función de Registro...');
    
    try {
        const registrationForm = document.getElementById('registration-form');
        if (registrationForm) {
            // Configurar event listener
            registrationForm.removeEventListener('submit', handleRegistrationSubmit);
            registrationForm.addEventListener('submit', handleRegistrationSubmit);
            
            // Cargar opciones
            await loadUBCHOptions();
            await loadCommunityOptions();
            
            log('✅ Función de Registro inicializada');
        } else {
            log('⚠️ Formulario de registro no encontrado');
        }
        
    } catch (error) {
        log(`❌ Error inicializando registro: ${error.message}`);
    }
}

// Inicializar función de Confirmar Voto
async function initializeCheckIn() {
    log('✅ Inicializando función de Confirmar Voto...');
    
    try {
        const checkInPage = document.getElementById('check-in-page');
        if (checkInPage) {
            // Configurar búsqueda de cédula
            const cedulaSearch = document.getElementById('cedula-search');
            if (cedulaSearch) {
                cedulaSearch.removeEventListener('input', handleCedulaSearch);
                cedulaSearch.addEventListener('input', handleCedulaSearch);
            }
            
            log('✅ Función de Confirmar Voto inicializada');
        } else {
            log('⚠️ Página de confirmación no encontrada');
        }
        
    } catch (error) {
        log(`❌ Error inicializando confirmación: ${error.message}`);
    }
}

// Inicializar función de Listado
async function initializeList() {
    log('📋 Inicializando función de Listado...');
    
    try {
        const listPage = document.getElementById('listado-page');
        if (listPage) {
            // Configurar filtros y paginación
            setupListFilters();
            setupListPagination();
            
            // Cargar datos iniciales
            await loadListData();
            
            log('✅ Función de Listado inicializada');
        } else {
            log('⚠️ Página de listado no encontrada');
        }
        
    } catch (error) {
        log(`❌ Error inicializando listado: ${error.message}`);
    }
}

// Inicializar función de Totales
async function initializeTotals() {
    log('📊 Inicializando función de Totales...');
    
    try {
        const totalsPage = document.getElementById('dashboard-page');
        if (totalsPage) {
            // Configurar actualización de totales
            setupTotalsUpdate();
            
            // Cargar totales iniciales
            await loadTotalsData();
            
            log('✅ Función de Totales inicializada');
        } else {
            log('⚠️ Página de totales no encontrada');
        }
        
    } catch (error) {
        log(`❌ Error inicializando totales: ${error.message}`);
    }
}

// Inicializar función de Estadísticas
async function initializeStatistics() {
    log('📈 Inicializando función de Estadísticas...');
    
    try {
        const statsPage = document.getElementById('statistics-page');
        if (statsPage) {
            // Configurar gráficos
            setupStatisticsCharts();
            
            // Cargar datos de estadísticas
            await loadStatisticsData();
            
            log('✅ Función de Estadísticas inicializada');
        } else {
            log('⚠️ Página de estadísticas no encontrada');
        }
        
    } catch (error) {
        log(`❌ Error inicializando estadísticas: ${error.message}`);
    }
}

// Configurar navegación
function setupNavigation() {
    log('🧭 Configurando navegación...');
    
    try {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetPage = this.getAttribute('data-page');
                if (targetPage) {
                    showPage(targetPage);
                }
            });
        });
        
        log('✅ Navegación configurada');
        
    } catch (error) {
        log(`❌ Error configurando navegación: ${error.message}`);
    }
}

// Mostrar página específica
function showPage(pageName) {
    log(`📄 Mostrando página: ${pageName}`);
    
    try {
        // Ocultar todas las páginas
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Mostrar página seleccionada
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Actualizar navegación
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.classList.remove('active'));
        const activeButton = document.querySelector(`[data-page="${pageName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        log(`✅ Página ${pageName} mostrada`);
        
    } catch (error) {
        log(`❌ Error mostrando página ${pageName}: ${error.message}`);
    }
}

// Configurar menú móvil
function setupMobileMenu() {
    log('📱 Configurando menú móvil...');
    
    try {
        const menuDropdown = document.getElementById('menu-dropdown');
        if (menuDropdown) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            let menuHTML = '';
            
            // Agregar enlaces según el rol del usuario
            if (currentUser.rol === 'superusuario' || currentUser.rol === 'admin') {
                menuHTML += '<a href="admin-panel.html" class="menu-item"><span class="icon">⚙️</span>Panel de Administración</a>';
            }
            
            // Agregar información del rol para verificadores
            if (currentUser.rol === 'verificador') {
                menuHTML += '<div class="menu-item info"><span class="icon">🔍</span>Verificador de Votos</div>';
            }
            
            menuHTML += '<a href="#" onclick="logout()" class="menu-item danger"><span class="icon">🚪</span>Cerrar Sesión</a>';
            
            menuDropdown.innerHTML = menuHTML;
        }
        
        log('✅ Menú móvil configurado');
        
    } catch (error) {
        log(`❌ Error configurando menú móvil: ${error.message}`);
    }
}

// Verificar sesión del usuario
function checkUserSession() {
    log('🔒 Verificando sesión del usuario...');
    
    try {
        const currentUser = localStorage.getItem('currentUser');
        const sessionTime = localStorage.getItem('sessionTime');
        
        if (!currentUser) {
            log('🔒 No hay sesión activa, redirigiendo a login...');
            window.location.href = 'login.html';
            return false;
        }
        
        // Verificar si la sesión ha expirado (24 horas)
        if (sessionTime && (Date.now() - parseInt(sessionTime)) > 24 * 60 * 60 * 1000) {
            log('⏰ Sesión expirada, redirigiendo a login...');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionTime');
            window.location.href = 'login.html';
            return false;
        }
        
        log('✅ Sesión válida');
        return true;
        
    } catch (error) {
        log(`❌ Error verificando sesión: ${error.message}`);
        return false;
    }
}

// Función de logout
function logout() {
    log('🚪 Cerrando sesión...');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionTime');
    window.location.href = 'login.html';
}

// Función para alternar menú móvil
function toggleMenu() {
    const dropdown = document.getElementById('menu-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Inicialización principal mejorada
async function enhancedInitialization() {
    log('🚀 Iniciando inicialización mejorada...');
    
    try {
        // 1. Verificar dependencias críticas
        if (!checkCriticalDependencies()) {
            log('⚠️ Algunas dependencias críticas no están disponibles');
        }
        
        // 2. Verificar sesión del usuario
        if (!checkUserSession()) {
            return;
        }
        
        // 3. Inicializar Firebase con retry
        const firebaseReady = await initializeFirebaseWithRetry();
        
        // 4. Inicializar sistema de votación con retry
        const votingSystemReady = await initializeVotingSystemWithRetry();
        
        // 5. Inicializar funciones específicas
        const functionsReady = await initializeSpecificFunctions();
        
        // 6. Configurar navegación y menú
        setupNavigation();
        setupMobileMenu();
        
        // 7. Mostrar información del usuario
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                const userInfo = document.getElementById('userId');
                if (userInfo) {
                    userInfo.textContent = `${user.username} (${user.rol})`;
                }
            } catch (error) {
                log(`❌ Error mostrando información del usuario: ${error.message}`);
            }
        }
        
        // 8. Configurar cierre de menú
        document.addEventListener('click', function(event) {
            const menuToggle = document.querySelector('.menu-toggle');
            const menuDropdown = document.getElementById('menu-dropdown');
            
            if (menuToggle && menuDropdown && !menuToggle.contains(event.target) && !menuDropdown.contains(event.target)) {
                menuDropdown.classList.remove('active');
            }
        });
        
        log('🎉 Inicialización mejorada completada');
        
        // Mostrar resumen
        const summary = {
            firebase: firebaseReady ? '✅' : '❌',
            votingSystem: votingSystemReady ? '✅' : '❌',
            functions: functionsReady ? '✅' : '❌'
        };
        
        log(`📊 Resumen de inicialización: Firebase ${summary.firebase}, Sistema ${summary.votingSystem}, Funciones ${summary.functions}`);
        
    } catch (error) {
        log(`❌ Error en inicialización mejorada: ${error.message}`);
    }
}

// Ejecutar inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhancedInitialization);
} else {
    enhancedInitialization();
}

// Exportar funciones para uso global
window.enhancedInitialization = enhancedInitialization;
window.logout = logout;
window.toggleMenu = toggleMenu;
window.showPage = showPage;

log('📋 Funciones globales configuradas (Versión Mejorada)'); 