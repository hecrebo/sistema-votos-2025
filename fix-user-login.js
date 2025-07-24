// === SCRIPT DE REPARACIÓN DE LOGIN ===
console.log('🔐 Iniciando reparación de login...');

// Función para crear usuario por defecto
function crearUsuarioPorDefecto() {
    console.log('👤 Creando usuario por defecto...');
    
    const defaultUser = {
        username: 'superadmin_01',
        role: 'superusuario',
        email: 'admin@votos2025.com',
        permissions: ['all'],
        lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(defaultUser));
    console.log('✅ Usuario por defecto creado:', defaultUser.username);
    
    return defaultUser;
}

// Función para verificar y reparar login
function verificarYRepararLogin() {
    console.log('🔍 Verificando estado de login...');
    
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        console.log('⚠️ No hay usuario logueado, creando usuario por defecto...');
        crearUsuarioPorDefecto();
    } else {
        try {
            const user = JSON.parse(currentUser);
            console.log('✅ Usuario logueado:', user.username, 'Rol:', user.role);
        } catch (error) {
            console.log('❌ Error en datos de usuario, creando nuevo usuario...');
            crearUsuarioPorDefecto();
        }
    }
}

// Función para mostrar información de usuario
function mostrarInfoUsuario() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    console.log('👤 === INFORMACIÓN DE USUARIO ===');
    console.log('Usuario:', currentUser.username || 'No definido');
    console.log('Rol:', currentUser.role || 'No definido');
    console.log('Email:', currentUser.email || 'No definido');
    console.log('Permisos:', currentUser.permissions || 'No definidos');
    console.log('Último login:', currentUser.lastLogin || 'No definido');
}

// Función para simular login
function simularLogin(username = 'superadmin_01', role = 'superusuario') {
    console.log(`🔐 Simulando login: ${username} (${role})`);
    
    const user = {
        username: username,
        role: role,
        email: `${username}@votos2025.com`,
        permissions: ['all'],
        lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    console.log('✅ Login simulado exitosamente');
    
    // Recargar la página para aplicar cambios
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Función principal de reparación de login
function repararLogin() {
    console.log('🔧 === INICIANDO REPARACIÓN DE LOGIN ===');
    
    // 1. Verificar y reparar login
    verificarYRepararLogin();
    
    // 2. Mostrar información
    mostrarInfoUsuario();
    
    // 3. Configurar botones de login/logout
    configurarBotonesLogin();
    
    console.log('✅ Reparación de login completada');
}

// Función para configurar botones de login/logout
function configurarBotonesLogin() {
    console.log('🔧 Configurando botones de login/logout...');
    
    // Buscar botón de logout
    const logoutBtn = document.querySelector('[onclick*="logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚪 Cerrando sesión...');
            localStorage.removeItem('currentUser');
            alert('Sesión cerrada. Recargando página...');
            window.location.reload();
        });
    }
    
    // Crear botón de login si no existe
    const loginBtn = document.querySelector('#login-btn');
    if (!loginBtn) {
        const header = document.querySelector('.header');
        if (header) {
            const newLoginBtn = document.createElement('button');
            newLoginBtn.id = 'login-btn';
            newLoginBtn.textContent = '🔐 Login';
            newLoginBtn.style.cssText = 'padding: 8px 16px; margin-left: 10px; border-radius: 5px; background: #007bff; color: white; border: none; cursor: pointer;';
            newLoginBtn.onclick = () => simularLogin();
            header.appendChild(newLoginBtn);
        }
    }
    
    console.log('✅ Botones de login/logout configurados');
}

// Ejecutar reparación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, iniciando reparación de login...');
    
    // Esperar un poco para que otros scripts se carguen
    setTimeout(() => {
        repararLogin();
    }, 500);
});

// Funciones globales
window.repararLogin = repararLogin;
window.simularLogin = simularLogin;
window.mostrarInfoUsuario = mostrarInfoUsuario;

console.log('✅ Script de reparación de login cargado');
console.log('💡 Ejecuta repararLogin() en la consola para reparación manual'); 