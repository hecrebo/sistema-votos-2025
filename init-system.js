// init-system.js
// Sistema de inicialización unificado para evitar conflictos

console.log('🚀 Iniciando Sistema de Votos 2025...');

// Verificar si ya hay una instancia del sistema corriendo
if (window.votingSystem) {
    console.log('⚠️ Sistema ya inicializado, limpiando instancia anterior...');
    delete window.votingSystem;
}

// Verificar Firebase
if (!window.firebaseDB) {
    console.error('❌ Firebase no está disponible');
    alert('Error: Firebase no está configurado correctamente.');
} else {
    console.log('✅ Firebase configurado correctamente');
}

// Inicializar sistema Firebase
async function initializeFirebaseSystem() {
    try {
        console.log('🔄 Inicializando sistema Firebase...');
        
        // Crear instancia del sistema Firebase
        // Comentado para evitar conflictos con auto-init.js
        // window.votingSystem = new VotingSystemFirebase();
        
        // Inicializar el sistema
        // Comentado para evitar conflictos con auto-init.js
        // await window.votingSystem.init();
        
        console.log('✅ Sistema Firebase inicializado correctamente');
        
        // Mostrar información del usuario
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                const userInfo = document.getElementById('userId');
                if (userInfo) {
                    userInfo.textContent = `${user.username} (${user.rol})`;
                }
            } catch (error) {
                console.error('Error al mostrar información del usuario:', error);
            }
        }
        
    } catch (error) {
        console.error('❌ Error inicializando sistema Firebase:', error);
        alert('Error al inicializar el sistema. Por favor, recarga la página.');
    }
}

// Verificar sesión del usuario
function checkUserSession() {
    const currentUser = localStorage.getItem('currentUser');
    const sessionTime = localStorage.getItem('sessionTime');
    
    if (!currentUser) {
        console.log('🔒 No hay sesión activa, redirigiendo a login...');
        window.location.href = 'login.html';
        return false;
    }
    
    // Verificar si la sesión ha expirado (24 horas)
    if (sessionTime && (Date.now() - parseInt(sessionTime)) > 24 * 60 * 60 * 1000) {
        console.log('⏰ Sesión expirada, redirigiendo a login...');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionTime');
        window.location.href = 'login.html';
        return false;
    }
    
    console.log('✅ Sesión válida');
    return true;
}

// Función de logout
function logout() {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionTime');
    window.location.href = 'login.html';
}

// Función para mostrar mensajes
function showMessage(message, type = 'info') {
    const messageElement = document.getElementById('login-message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `login-message ${type}`;
        messageElement.style.display = 'block';
        if (type === 'success') {
            setTimeout(() => { messageElement.style.display = 'none'; }, 3000);
        }
    }
}

// Función para alternar menú móvil
function toggleMenu() {
    const dropdown = document.getElementById('menu-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Inicialización principal
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📱 Página cargada, verificando sesión...');
    
    // Verificar sesión del usuario
    if (!checkUserSession()) {
        return;
    }
    
    // Esperar a que Firebase esté disponible
    let retries = 0;
    const maxRetries = 10;
    
    while (!window.firebaseDB && retries < maxRetries) {
        console.log(`⏳ Esperando Firebase... (intento ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
    }
    
    if (!window.firebaseDB) {
        console.error('❌ Firebase no disponible después de múltiples intentos');
        showMessage('Error: No se pudo conectar con Firebase.', 'error');
        return;
    }
    
    // Inicializar sistema Firebase
    await initializeFirebaseSystem();
    
    // Configurar menú móvil
    setupMobileMenu();
    
    // Configurar cierre de menú
    document.addEventListener('click', function(event) {
        const menuToggle = document.querySelector('.menu-toggle');
        const menuDropdown = document.getElementById('menu-dropdown');
        
        if (menuToggle && menuDropdown && !menuToggle.contains(event.target) && !menuDropdown.contains(event.target)) {
            menuDropdown.classList.remove('active');
        }
    });
    
    console.log('🎉 Sistema inicializado completamente');
});

// Configurar menú móvil
function setupMobileMenu() {
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
}

// Exportar funciones globales
window.logout = logout;
window.showMessage = showMessage;
window.toggleMenu = toggleMenu;
window.checkUserSession = checkUserSession;

console.log('📋 Funciones globales configuradas');
