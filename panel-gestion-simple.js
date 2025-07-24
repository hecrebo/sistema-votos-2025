// === PANEL DE GESTIÓN SIMPLE ===
console.log('🔧 Iniciando Panel de Gestión Simple...');

// Variables globales
let systemLogs = [];
let systemStatus = {
    firebase: false,
    navigation: false,
    users: 0,
    votes: 0
};

// === FUNCIONES PRINCIPALES ===

// Función para inicializar el panel
function inicializarPanel() {
    console.log('🚀 Inicializando panel de gestión simple...');
    
    // Verificar permisos
    verificarPermisos();
    
    // Cargar datos iniciales
    cargarDatosIniciales();
    
    // Mostrar sección por defecto
    mostrarSeccion('dashboard');
    
    agregarLog('Panel de gestión simple inicializado correctamente', 'success');
}

// Función para verificar permisos de superusuario
function verificarPermisos() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (user.role !== 'superusuario') {
        alert('⚠️ Acceso denegado\n\nSolo los superusuarios pueden acceder al Panel de Gestión del Sistema.');
        window.location.href = 'index.html';
        return false;
    }
    
    document.getElementById('user-badge').textContent = `${user.username} (${user.role})`;
    
    console.log('✅ Permisos verificados:', user.username);
    return true;
}

// Función para cargar datos iniciales
function cargarDatosIniciales() {
    console.log('📊 Cargando datos iniciales...');
    
    // Actualizar estadísticas
    actualizarEstadisticas();
    
    // Verificar estado del sistema
    verificarEstadoSistema();
}

// Función para actualizar estadísticas
function actualizarEstadisticas() {
    // Simular datos (en producción vendrían de Firebase)
    document.getElementById('total-users').textContent = '5';
    document.getElementById('total-votes').textContent = '1,247';
    document.getElementById('system-status').textContent = '🟢';
    document.getElementById('firebase-status').textContent = '🟢';
}

// Función para verificar estado del sistema
function verificarEstadoSistema() {
    console.log('🔍 Verificando estado del sistema...');
    
    // Verificar Firebase
    if (window.firebaseDB && window.firebaseDB.votesCollection) {
        systemStatus.firebase = true;
        agregarLog('Firebase conectado correctamente', 'success');
    } else {
        systemStatus.firebase = false;
        agregarLog('Firebase no disponible', 'error');
    }
    
    // Verificar navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    systemStatus.navigation = navButtons.length > 0;
    
    agregarLog(`Navegación: ${navButtons.length} botones encontrados`, 'info');
}

// === FUNCIONES DE NAVEGACIÓN ===

// Función para mostrar todos los botones
function mostrarTodosLosBotones() {
    console.log('👁️ Mostrando todos los botones...');
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.style.display = 'inline-block';
        btn.classList.add('configured');
    });
    
    agregarLog(`${navButtons.length} botones mostrados`, 'success');
    verificarEstadoBotones();
}

// Función para ocultar todos los botones
function ocultarTodosLosBotones() {
    console.log('🙈 Ocultando todos los botones...');
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.style.display = 'none';
        btn.classList.remove('configured');
    });
    
    agregarLog(`${navButtons.length} botones ocultados`, 'warning');
    verificarEstadoBotones();
}

// Función para configurar por rol
function configurarPorRol() {
    console.log('🎯 Configurando navegación por rol...');
    
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = user.role || 'usuario basico';
    
    // Ocultar todos primero
    ocultarTodosLosBotones();
    
    // Mostrar según rol
    const botonesPorRol = {
        'superusuario': ['nav-registration', 'nav-check-in', 'nav-listado', 'nav-dashboard', 'nav-statistics', 'nav-advanced-stats'],
        'admin': ['nav-registration', 'nav-check-in', 'nav-listado', 'nav-dashboard', 'nav-statistics'],
        'registrador': ['nav-registration', 'nav-check-in', 'nav-registrator-dashboard', 'nav-registrator-history'],
        'verificador': ['nav-listado', 'nav-dashboard', 'nav-statistics'],
        'usuario basico': ['nav-registration', 'nav-check-in']
    };
    
    const botonesAMostrar = botonesPorRol[userRole] || botonesPorRol['usuario basico'];
    
    botonesAMostrar.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.display = 'inline-block';
            btn.classList.add('configured');
        }
    });
    
    agregarLog(`Navegación configurada para rol: ${userRole}`, 'success');
    verificarEstadoBotones();
}

// Función para resetear navegación
function resetearNavegacion() {
    console.log('🔄 Reseteando navegación...');
    
    // Limpiar localStorage de navegación
    localStorage.removeItem('navigationConfig');
    
    // Mostrar configuración por defecto
    configurarPorRol();
    
    agregarLog('Navegación reseteada', 'success');
}

// Función para verificar estado de botones
function verificarEstadoBotones() {
    console.log('🔍 Verificando estado de botones...');
    
    const botonesStatus = document.getElementById('botones-status');
    const navButtons = document.querySelectorAll('.nav-btn');
    
    let html = '';
    navButtons.forEach(btn => {
        const isVisible = btn.style.display !== 'none';
        const isConfigured = btn.classList.contains('configured');
        const status = isVisible ? '✅ Visible' : '❌ Oculto';
        const config = isConfigured ? '✅ Configurado' : '❌ No configurado';
        
        html += `
            <div class="log-entry">
                <span class="log-time">${btn.textContent}</span>
                <span class="log-message">${status} | ${config}</span>
            </div>
        `;
    });
    
    botonesStatus.innerHTML = html;
}

// === FUNCIONES DE SISTEMA ===

// Función para cargar información del sistema
function cargarInfoSistema() {
    console.log('⚙️ Cargando información del sistema...');
    
    const sistemaInfo = document.getElementById('sistema-info');
    
    const info = {
        'Navegador': navigator.userAgent,
        'URL': window.location.href,
        'Firebase': systemStatus.firebase ? '✅ Conectado' : '❌ No conectado',
        'Navegación': systemStatus.navigation ? '✅ Configurada' : '❌ No configurada',
        'Usuario Actual': JSON.parse(localStorage.getItem('currentUser') || '{}').username || 'No definido',
        'Hora del Sistema': new Date().toLocaleString()
    };
    
    let html = '';
    Object.keys(info).forEach(key => {
        html += `
            <div class="log-entry">
                <span class="log-time">${key}:</span>
                <span class="log-message">${info[key]}</span>
            </div>
        `;
    });
    
    sistemaInfo.innerHTML = html;
}

// Función para ejecutar diagnóstico
function ejecutarDiagnostico() {
    console.log('🔍 Ejecutando diagnóstico completo...');
    
    agregarLog('Iniciando diagnóstico del sistema...', 'info');
    
    // Verificar Firebase
    if (window.firebaseDB && window.firebaseDB.votesCollection) {
        agregarLog('✅ Firebase conectado correctamente', 'success');
    } else {
        agregarLog('❌ Firebase no disponible', 'error');
    }
    
    // Verificar navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    agregarLog(`📊 Navegación: ${navButtons.length} botones encontrados`, 'info');
    
    // Verificar usuario
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user.username) {
        agregarLog(`👤 Usuario: ${user.username} (${user.role})`, 'success');
    } else {
        agregarLog('❌ No hay usuario logueado', 'error');
    }
    
    agregarLog('Diagnóstico completado', 'success');
}

// Función para verificar conexiones
function verificarConexiones() {
    console.log('🌐 Verificando conexiones...');
    
    agregarLog('Verificando conexión a Firebase...', 'info');
    
    if (window.firebaseDB) {
        agregarLog('✅ Firebase disponible', 'success');
    } else {
        agregarLog('❌ Firebase no disponible', 'error');
    }
    
    agregarLog('Verificando conexión a internet...', 'info');
    if (navigator.onLine) {
        agregarLog('✅ Conexión a internet disponible', 'success');
    } else {
        agregarLog('❌ Sin conexión a internet', 'error');
    }
}

// Función para optimizar sistema
function optimizarSistema() {
    console.log('⚡ Optimizando sistema...');
    
    agregarLog('Limpiando cache del navegador...', 'info');
    
    // Limpiar localStorage innecesario
    const keysToKeep = ['currentUser', 'configRoles'];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!keysToKeep.includes(key)) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
    
    agregarLog(`🗑️ Limpiados ${keysToRemove.length} elementos del cache`, 'success');
    agregarLog('Sistema optimizado', 'success');
}

// === FUNCIONES DE LOGS ===

// Función para agregar log
function agregarLog(mensaje, tipo = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
        timestamp: timestamp,
        message: mensaje,
        type: tipo
    };
    
    systemLogs.push(logEntry);
    
    // Mantener solo los últimos 100 logs
    if (systemLogs.length > 100) {
        systemLogs.shift();
    }
    
    // Actualizar logs en pantalla
    actualizarLogs();
    
    console.log(`[${timestamp}] ${mensaje}`);
}

// Función para actualizar logs
function actualizarLogs() {
    const logsContainer = document.getElementById('logs-container');
    
    let html = '';
    systemLogs.slice(-20).forEach(log => {
        const logClass = log.type === 'error' ? 'log-error' : 
                        log.type === 'success' ? 'log-success' : 'log-message';
        
        html += `
            <div class="log-entry">
                <span class="log-time">[${log.timestamp}]</span>
                <span class="${logClass}">${log.message}</span>
            </div>
        `;
    });
    
    logsContainer.innerHTML = html;
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

// Función para limpiar logs
function limpiarLogs() {
    systemLogs = [];
    actualizarLogs();
    agregarLog('Logs limpiados', 'success');
}

// Función para exportar logs
function exportarLogs() {
    const logsText = systemLogs.map(log => `[${log.timestamp}] ${log.message}`).join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-sistema-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    agregarLog('Logs exportados', 'success');
}

// Función para activar logs detallados
function activarLogsDetallados() {
    // Simular activación de logs detallados
    agregarLog('Logs detallados activados', 'success');
    agregarLog('Capturando información del sistema...', 'info');
    agregarLog('Monitoreando navegación...', 'info');
    agregarLog('Verificando conexiones...', 'info');
}

// === FUNCIONES DE ACCIONES RÁPIDAS ===

// Función para reiniciar navegación
function reiniciarNavegacion() {
    console.log('🔄 Reiniciando navegación...');
    
    // Limpiar configuración
    localStorage.removeItem('navigationConfig');
    
    // Recargar página
    window.location.reload();
}

// Función para limpiar cache
function limpiarCache() {
    console.log('🗑️ Limpiando cache...');
    
    // Limpiar localStorage
    const keysToKeep = ['currentUser'];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!keysToKeep.includes(key)) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
    
    agregarLog(`Cache limpiado: ${keysToRemove.length} elementos eliminados`, 'success');
}

// Función para verificar Firebase
function verificarFirebase() {
    console.log('🔥 Verificando Firebase...');
    
    if (window.firebaseDB && window.firebaseDB.votesCollection) {
        agregarLog('✅ Firebase conectado correctamente', 'success');
        document.getElementById('firebase-status').textContent = '🟢';
    } else {
        agregarLog('❌ Firebase no disponible', 'error');
        document.getElementById('firebase-status').textContent = '🔴';
    }
}

// === FUNCIONES DE REPARACIÓN ===

// Función para reparar navegación
function repararNavegacion() {
    console.log('🔧 Reparando navegación...');
    
    agregarLog('Iniciando reparación de navegación...', 'info');
    
    // Mostrar todos los botones
    mostrarTodosLosBotones();
    
    agregarLog('Navegación reparada', 'success');
}

// Función para crear usuario admin
function crearUsuarioAdmin() {
    const adminUser = {
        username: 'admin_emergencia',
        role: 'admin',
        email: 'admin@emergencia.com',
        permissions: ['all'],
        lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(adminUser));
    
    agregarLog('Usuario admin de emergencia creado', 'success');
    alert('Usuario admin creado. Recargando página...');
    window.location.reload();
}

// Función para resetear sistema
function resetearSistema() {
    if (confirm('¿Estás seguro de que quieres resetear el sistema? Esto limpiará toda la configuración.')) {
        console.log('🔄 Reseteando sistema...');
        
        // Limpiar localStorage
        localStorage.clear();
        
        // Recargar página
        window.location.reload();
    }
}

// Función para limpiar datos
function limpiarDatos() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos? Esta acción no se puede deshacer.')) {
        console.log('🗑️ Limpiando datos...');
        
        // Limpiar datos de prueba
        localStorage.removeItem('bulkRegistrationData');
        localStorage.removeItem('sampleDataCreated');
        
        agregarLog('Datos limpiados', 'success');
    }
}

// Función para cerrar sesión
function cerrarSesion() {
    console.log('🚪 Cerrando sesión...');
    
    localStorage.removeItem('currentUser');
    agregarLog('Sesión cerrada', 'info');
    
    window.location.href = 'index.html';
}

// === INICIALIZACIÓN ===

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, iniciando panel de gestión simple...');
    
    // Esperar un poco para que otros scripts se carguen
    setTimeout(() => {
        inicializarPanel();
    }, 1000);
});

// Funciones globales para acceso desde consola
window.panelGestion = {
    repararNavegacion,
    ejecutarDiagnostico,
    agregarLog,
    verificarEstadoBotones,
    configurarPorRol
};

console.log('✅ Panel de gestión simple cargado');
console.log('💡 Usa panelGestion.repararNavegacion() para reparar la navegación'); 