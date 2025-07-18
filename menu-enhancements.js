// menu-enhancements.js
// Mejoras adicionales para el menú desplegable

console.log('🔧 Cargando mejoras del menú desplegable...');

// Función para agregar notificaciones al menú
function addMenuNotifications() {
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        // Verificar si hay notificaciones pendientes
        const pendingNotifications = localStorage.getItem('pendingNotifications') || '0';
        if (parseInt(pendingNotifications) > 0) {
            menuToggle.classList.add('has-notifications');
            
            // Agregar contador de notificaciones
            let notificationBadge = menuToggle.querySelector('.notification-badge');
            if (!notificationBadge) {
                notificationBadge = document.createElement('span');
                notificationBadge.className = 'notification-badge';
                notificationBadge.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #e74c3c;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 0.7rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    animation: pulse 2s infinite;
                `;
                menuToggle.appendChild(notificationBadge);
            }
            notificationBadge.textContent = pendingNotifications;
        }
    }
}

// Función para actualizar el estado del menú según la página actual
function updateMenuState() {
    const currentPage = document.querySelector('.page.active');
    const menuDropdown = document.getElementById('menu-dropdown');
    
    if (currentPage && menuDropdown) {
        const pageId = currentPage.id.replace('-page', '');
        const menuItems = menuDropdown.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('onclick');
            if (href && href.includes(`showPage('${pageId}')`)) {
                item.classList.add('active');
            }
        });
    }
}

// Función para agregar búsqueda rápida al menú
function addMenuSearch() {
    const menuDropdown = document.getElementById('menu-dropdown');
    if (menuDropdown) {
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `
            padding: 1rem;
            border-bottom: 1px solid #e9ecef;
            background: #f8f9fa;
        `;
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Buscar en el menú...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            font-size: 0.9rem;
        `;
        
        searchContainer.appendChild(searchInput);
        menuDropdown.insertBefore(searchContainer, menuDropdown.firstChild);
        
        // Funcionalidad de búsqueda
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const menuItems = menuDropdown.querySelectorAll('.menu-item');
            
            menuItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}

// Función para agregar atajos de teclado
function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + M para abrir/cerrar menú
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            toggleMenu();
        }
        
        // Escape para cerrar menú
        if (e.key === 'Escape') {
            const menuDropdown = document.getElementById('menu-dropdown');
            if (menuDropdown && menuDropdown.classList.contains('active')) {
                toggleMenu();
            }
        }
    });
}

// Función para agregar animaciones suaves
function addSmoothAnimations() {
    const menuDropdown = document.getElementById('menu-dropdown');
    if (menuDropdown) {
        // Agregar animación de entrada para cada elemento del menú
        const menuItems = menuDropdown.querySelectorAll('.menu-item');
        menuItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
            item.classList.add('menu-item-animated');
        });
    }
}

// Función para mostrar estadísticas rápidas en el menú
function addQuickStats() {
    const menuDropdown = document.getElementById('menu-dropdown');
    if (menuDropdown) {
        const statsContainer = document.createElement('div');
        statsContainer.style.cssText = `
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0.5rem 0;
            border-radius: 8px;
            font-size: 0.9rem;
        `;
        
        // Obtener estadísticas básicas
        const totalRegistros = localStorage.getItem('totalRegistros') || '0';
        const totalVotos = localStorage.getItem('totalVotos') || '0';
        
        statsContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>📝 Registros:</span>
                <span style="font-weight: bold;">${totalRegistros}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>✅ Votos:</span>
                <span style="font-weight: bold;">${totalVotos}</span>
            </div>
        `;
        
        // Insertar después del primer separador
        const separators = menuDropdown.querySelectorAll('div[style*="height: 1px"]');
        if (separators.length > 0) {
            menuDropdown.insertBefore(statsContainer, separators[0].nextSibling);
        }
    }
}

// Función para agregar modo oscuro al menú
function addDarkModeToggle() {
    const menuDropdown = document.getElementById('menu-dropdown');
    if (menuDropdown) {
        const darkModeItem = document.createElement('a');
        darkModeItem.href = '#';
        darkModeItem.className = 'menu-item';
        darkModeItem.innerHTML = '<span class="icon">🌙</span>Modo Oscuro';
        darkModeItem.onclick = toggleDarkMode;
        
        // Insertar antes del último separador
        const separators = menuDropdown.querySelectorAll('div[style*="height: 1px"]');
        if (separators.length > 0) {
            const lastSeparator = separators[separators.length - 1];
            menuDropdown.insertBefore(darkModeItem, lastSeparator);
        }
    }
}

// Función para alternar modo oscuro
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');
    
    if (isDark) {
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    }
}

// Función para inicializar todas las mejoras
function initializeMenuEnhancements() {
    console.log('🎨 Inicializando mejoras del menú...');
    
    // Esperar a que el DOM esté listo
    setTimeout(() => {
        addMenuNotifications();
        updateMenuState();
        addKeyboardShortcuts();
        addSmoothAnimations();
        addQuickStats();
        addDarkModeToggle();
        
        // Verificar modo oscuro guardado
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'true') {
            document.body.classList.add('dark-mode');
        }
        
        console.log('✅ Mejoras del menú inicializadas');
    }, 1000);
}

// Exportar funciones globales
window.addMenuNotifications = addMenuNotifications;
window.updateMenuState = updateMenuState;
window.addMenuSearch = addMenuSearch;
window.addKeyboardShortcuts = addKeyboardShortcuts;
window.addSmoothAnimations = addSmoothAnimations;
window.addQuickStats = addQuickStats;
window.addDarkModeToggle = addDarkModeToggle;
window.toggleDarkMode = toggleDarkMode;
window.initializeMenuEnhancements = initializeMenuEnhancements;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMenuEnhancements);
} else {
    initializeMenuEnhancements();
}

console.log('🎯 Mejoras del menú cargadas correctamente'); 