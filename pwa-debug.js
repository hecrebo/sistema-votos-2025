// PWA Debug Script - Sistema de Votos 2025
console.log('🔍 Iniciando debugging PWA...');

// Función para verificar todos los requisitos PWA
function checkPWARequirements() {
    console.log('📋 Verificando requisitos PWA...');
    
    const requirements = {
        // 1. Service Worker
        serviceWorker: 'serviceWorker' in navigator,
        
        // 2. Manifest
        manifest: !!document.querySelector('link[rel="manifest"]'),
        
        // 3. HTTPS o localhost
        secureContext: location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1',
        
        // 4. Push Manager (opcional)
        pushManager: 'PushManager' in window,
        
        // 5. Notifications
        notifications: 'Notification' in window,
        
        // 6. Display mode
        displayMode: window.matchMedia && window.matchMedia('(display-mode: standalone)').matches,
        
        // 7. Before install prompt
        beforeInstallPrompt: false, // Se verificará después
    };
    
    console.log('📊 Estado de requisitos PWA:', requirements);
    
    // Verificar si todos los requisitos básicos están cumplidos
    const basicRequirements = requirements.serviceWorker && requirements.manifest && requirements.secureContext;
    
    if (basicRequirements) {
        console.log('✅ Requisitos básicos PWA cumplidos');
    } else {
        console.log('❌ Algunos requisitos básicos PWA no están cumplidos');
    }
    
    return requirements;
}

// Función para verificar el manifest
function checkManifest() {
    console.log('📄 Verificando manifest...');
    
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
        console.log('✅ Manifest link encontrado:', manifestLink.href);
        
        // Intentar cargar el manifest
        fetch(manifestLink.href)
            .then(response => response.json())
            .then(manifest => {
                console.log('📄 Manifest cargado:', manifest);
                
                // Verificar campos requeridos
                const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
                const missingFields = requiredFields.filter(field => !manifest[field]);
                
                if (missingFields.length === 0) {
                    console.log('✅ Todos los campos requeridos del manifest están presentes');
                } else {
                    console.log('❌ Campos faltantes en manifest:', missingFields);
                }
            })
            .catch(error => {
                console.error('❌ Error cargando manifest:', error);
            });
    } else {
        console.log('❌ Manifest link no encontrado');
    }
}

// Función para verificar service worker
function checkServiceWorker() {
    console.log('🔧 Verificando service worker...');
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            console.log('✅ Service Worker registrado:', registration);
            console.log('📱 Scope:', registration.scope);
            console.log('📱 Active:', registration.active);
            console.log('📱 Installing:', registration.installing);
            console.log('📱 Waiting:', registration.waiting);
        }).catch(error => {
            console.error('❌ Error con service worker:', error);
        });
    } else {
        console.log('❌ Service Worker no soportado');
    }
}

// Función para verificar instalabilidad
function checkInstallability() {
    console.log('📱 Verificando instalabilidad...');
    
    // Verificar si ya está instalada
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ App ya está instalada (modo standalone)');
        return;
    }
    
    // Verificar beforeinstallprompt
    let deferredPrompt = null;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('📱 Evento beforeinstallprompt detectado');
        e.preventDefault();
        deferredPrompt = e;
        
        // Mostrar botón de instalación
        const installBtn = document.getElementById('manual-install-btn');
        if (installBtn) {
            installBtn.style.display = 'inline-block';
            console.log('📱 Botón de instalación mostrado');
        }
    });
    
    // Verificar si ya se disparó el evento
    setTimeout(() => {
        if (deferredPrompt) {
            console.log('✅ beforeinstallprompt disponible');
        } else {
            console.log('❌ beforeinstallprompt no disponible');
            console.log('💡 Posibles razones:');
            console.log('   - App ya instalada');
            console.log('   - No cumple criterios de instalación');
            console.log('   - Navegador no soporta PWA');
        }
    }, 2000);
}

// Función para mostrar información completa
function showCompletePWAInfo() {
    console.log('📊 === INFORMACIÓN COMPLETA PWA ===');
    
    // Verificar requisitos
    const requirements = checkPWARequirements();
    
    // Verificar manifest
    checkManifest();
    
    // Verificar service worker
    checkServiceWorker();
    
    // Verificar instalabilidad
    checkInstallability();
    
    // Información adicional
    console.log('🌐 Protocolo:', location.protocol);
    console.log('🏠 Hostname:', location.hostname);
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('📱 Página controlada por SW:', !!navigator.serviceWorker.controller);
    
    // Verificar si PWA Installer está disponible
    if (window.pwaInstaller) {
        console.log('✅ PWA Installer disponible');
        window.pwaInstaller.showPWAInfo();
    } else {
        console.log('❌ PWA Installer no disponible');
    }
    
    console.log('📊 === FIN INFORMACIÓN PWA ===');
}

// Ejecutar debugging cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 PWA Debug iniciado');
    
    // Esperar un poco para que todo se cargue
    setTimeout(() => {
        showCompletePWAInfo();
    }, 1000);
});

// Función global para debugging manual
window.debugPWA = function() {
    showCompletePWAInfo();
};

console.log('🔍 PWA Debug script cargado. Usa debugPWA() para verificar estado.'); 