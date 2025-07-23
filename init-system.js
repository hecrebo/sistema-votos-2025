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
        alert('⚠️ El sistema está cargando...\n\nSi el problema persiste:\n• Recarga la página (F5)\n• Verifica tu conexión a internet\n• Intenta más tarde');
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

// Configurar menú móvil mejorado
function setupMobileMenu() {
    const menuDropdown = document.getElementById('menu-dropdown');
    if (menuDropdown) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        let menuHTML = '';
        
        // Agregar información del usuario
        menuHTML += `
            <div class="menu-item info">
                <span class="icon">👤</span>
                ${currentUser.username || 'Usuario'} (${currentUser.rol || 'Sin rol'})
            </div>
        `;
        
        // Separador
        menuHTML += '<div style="height: 1px; background: #e9ecef; margin: 0.5rem 0;"></div>';
        
        // Menú principal según el rol
        if (currentUser.rol === 'superusuario' || currentUser.rol === 'admin') {
            menuHTML += `
                <a href="#" onclick="showPage('registration')" class="menu-item">
                    <span class="icon">📝</span>Registro de Personas
                </a>
                <a href="#" onclick="showPage('check-in')" class="menu-item">
                    <span class="icon">✅</span>Confirmar Voto
                </a>
                <a href="#" onclick="showPage('listado')" class="menu-item">
                    <span class="icon">📋</span>Listado General
                </a>
                <a href="#" onclick="showPage('dashboard')" class="menu-item">
                    <span class="icon">📊</span>Dashboard General
                </a>
                <a href="#" onclick="showPage('statistics')" class="menu-item">
                    <span class="icon">📈</span>Estadísticas
                </a>
                <a href="estadisticas-avanzadas.html" class="menu-item">
                    <span class="icon">📊</span>Estadísticas Avanzadas
                </a>
                <a href="admin-panel.html" class="menu-item">
                    <span class="icon">⚙️</span>Panel de Administración
                </a>
            `;
        } else if (currentUser.rol === 'verificador') {
            menuHTML += `
                <a href="#" onclick="showPage('registration')" class="menu-item">
                    <span class="icon">📝</span>Registro de Personas
                </a>
                <a href="#" onclick="showPage('check-in')" class="menu-item">
                    <span class="icon">✅</span>Confirmar Voto
                </a>
                <a href="#" onclick="showPage('verifier-dashboard')" class="menu-item">
                    <span class="icon">📊</span>Mi Dashboard
                </a>
                <a href="#" onclick="showPage('verifier-history')" class="menu-item">
                    <span class="icon">📋</span>Mi Historial
                </a>
                <a href="#" onclick="showPage('listado')" class="menu-item">
                    <span class="icon">📋</span>Listado General
                </a>
                <a href="#" onclick="showPage('dashboard')" class="menu-item">
                    <span class="icon">📊</span>Dashboard General
                </a>
                <a href="#" onclick="showPage('statistics')" class="menu-item">
                    <span class="icon">📈</span>Estadísticas
                </a>
            `;
        } else if (currentUser.rol === 'registrador') {
            menuHTML += `
                <a href="#" onclick="showPage('registration')" class="menu-item">
                    <span class="icon">📝</span>Registro de Personas
                </a>
                <a href="#" onclick="showPage('registrator-dashboard')" class="menu-item">
                    <span class="icon">📊</span>Mi Dashboard
                </a>
                <a href="#" onclick="showPage('registrator-history')" class="menu-item">
                    <span class="icon">📋</span>Mi Historial
                </a>
                <a href="#" onclick="showPage('listado')" class="menu-item">
                    <span class="icon">📋</span>Listado General
                </a>
                <a href="#" onclick="showPage('dashboard')" class="menu-item">
                    <span class="icon">📊</span>Dashboard General
                </a>
            `;
        } else {
            // Usuario básico
            menuHTML += `
                <a href="#" onclick="showPage('registration')" class="menu-item">
                    <span class="icon">📝</span>Registro de Personas
                </a>
                <a href="#" onclick="showPage('check-in')" class="menu-item">
                    <span class="icon">✅</span>Confirmar Voto
                </a>
                <a href="#" onclick="showPage('listado')" class="menu-item">
                    <span class="icon">📋</span>Listado General
                </a>
                <a href="#" onclick="showPage('dashboard')" class="menu-item">
                    <span class="icon">📊</span>Dashboard General
                </a>
            `;
        }
        
        // Separador
        menuHTML += '<div style="height: 1px; background: #e9ecef; margin: 0.5rem 0;"></div>';
        
        // Opciones adicionales
        menuHTML += `
            <a href="#" onclick="installPWA()" class="menu-item">
                <span class="icon">📱</span>Instalar App
            </a>
            <a href="#" onclick="showSystemInfo()" class="menu-item">
                <span class="icon">ℹ️</span>Información del Sistema
            </a>
        `;
        
        // Separador
        menuHTML += '<div style="height: 1px; background: #e9ecef; margin: 0.5rem 0;"></div>';
        
        // Cerrar sesión
        menuHTML += `
            <a href="#" onclick="logout()" class="menu-item danger">
                <span class="icon">🚪</span>Cerrar Sesión
            </a>
        `;
        
        menuDropdown.innerHTML = menuHTML;
        
        // Agregar event listeners para cerrar menú al hacer clic en un elemento
        const menuItems = menuDropdown.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                setTimeout(() => {
                    menuDropdown.classList.remove('active');
                    const menuToggle = document.querySelector('.menu-toggle');
                    if (menuToggle) {
                        menuToggle.classList.remove('active');
                    }
                }, 100);
            });
        });
    }
}

// Función para mostrar información del sistema
function showSystemInfo() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const systemInfo = `
        <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px; margin: 1rem 0;">
            <h4 style="margin-bottom: 1rem; color: #2c3e50;">ℹ️ Información del Sistema</h4>
            <div style="font-size: 0.9rem; line-height: 1.6;">
                <p><strong>Usuario:</strong> ${currentUser.username || 'No disponible'}</p>
                <p><strong>Rol:</strong> ${currentUser.rol || 'No disponible'}</p>
                <p><strong>Versión:</strong> Sistema de Votos 2025 v2.0</p>
                <p><strong>Estado:</strong> <span id="connection-status">Verificando...</span></p>
                <p><strong>Última sincronización:</strong> <span id="last-sync">Verificando...</span></p>
            </div>
        </div>
    `;
    
    // Crear modal temporal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    `;
    
    modalContent.innerHTML = `
        <button onclick="this.closest('.modal-overlay').remove()" style="
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
        ">×</button>
        ${systemInfo}
    `;
    
    modal.appendChild(modalContent);
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
    
    // Verificar estado de conexión
    setTimeout(() => {
        const connectionStatus = document.getElementById('connection-status');
        const lastSync = document.getElementById('last-sync');
        
        if (connectionStatus) {
            if (navigator.onLine) {
                connectionStatus.textContent = '🟢 En línea';
                connectionStatus.style.color = '#28a745';
            } else {
                connectionStatus.textContent = '🔴 Sin conexión';
                connectionStatus.style.color = '#dc3545';
            }
        }
        
        if (lastSync) {
            const syncTime = localStorage.getItem('lastSyncTime');
            if (syncTime) {
                const date = new Date(parseInt(syncTime));
                lastSync.textContent = date.toLocaleString('es-ES');
            } else {
                lastSync.textContent = 'No disponible';
            }
        }
    }, 500);
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Función mejorada para alternar menú
function toggleMenu() {
    const dropdown = document.getElementById('menu-dropdown');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (dropdown && menuToggle) {
        const isActive = dropdown.classList.contains('active');
        
        if (isActive) {
            dropdown.classList.remove('active');
            menuToggle.classList.remove('active');
        } else {
            dropdown.classList.add('active');
            menuToggle.classList.add('active');
        }
    }
}

// Función para mostrar página específica
function showPage(pageName) {
    // Ocultar todas las páginas
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Mostrar la página seleccionada
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Actualizar navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    const targetNav = document.getElementById('nav-' + pageName.replace('-', '-'));
    if (targetNav) {
        targetNav.classList.add('active');
    }
    
    // Cerrar menú móvil
    const menuDropdown = document.getElementById('menu-dropdown');
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuDropdown) {
        menuDropdown.classList.remove('active');
    }
    if (menuToggle) {
        menuToggle.classList.remove('active');
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

// Exportar funciones globales
window.logout = logout;
window.showMessage = showMessage;
window.toggleMenu = toggleMenu;
window.checkUserSession = checkUserSession;

console.log('📋 Funciones globales configuradas');

// Exportar funciones globales adicionales
window.showSystemInfo = showSystemInfo;
window.showPage = showPage;
