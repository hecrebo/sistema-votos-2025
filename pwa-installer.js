// PWA Installer - Sistema de Votos 2025
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        console.log('🚀 Inicializando PWA Installer...');
        this.setupInstallPrompt();
        this.setupBeforeInstallPrompt();
        this.setupAppInstalled();
        this.createInstallButton();
        this.checkInstallationStatus();
        
        // Verificar estado después de un delay
        setTimeout(() => {
            this.debugPWAStatus();
        }, 3000);
    }

    setupInstallPrompt() {
        // Escuchar el evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 Evento beforeinstallprompt detectado');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
    }

    setupBeforeInstallPrompt() {
        // Manejar el evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 PWA puede ser instalada');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
    }

    setupAppInstalled() {
        // Escuchar cuando la app es instalada
        window.addEventListener('appinstalled', (evt) => {
            console.log('✅ PWA instalada exitosamente');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstallationSuccess();
        });
    }

    createInstallButton() {
        // Crear botón de instalación si no existe
        if (!document.getElementById('pwa-install-btn')) {
            const installButton = document.createElement('button');
            installButton.id = 'pwa-install-btn';
            installButton.className = 'btn btn-primary pwa-install-btn';
            installButton.innerHTML = '📱 Instalar App';
            installButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 25px;
                padding: 12px 20px;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                cursor: pointer;
                transition: all 0.3s ease;
                display: none;
            `;
            
            installButton.addEventListener('click', () => this.installPWA());
            installButton.addEventListener('mouseenter', () => {
                installButton.style.transform = 'translateY(-2px)';
                installButton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            });
            installButton.addEventListener('mouseleave', () => {
                installButton.style.transform = 'translateY(0)';
                installButton.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            });
            
            document.body.appendChild(installButton);
            this.installButton = installButton;
        }
    }

    showInstallButton() {
        if (this.installButton && !this.isInstalled) {
            this.installButton.style.display = 'block';
            console.log('📱 Botón de instalación mostrado');
        }
        
        // También mostrar el botón manual
        const manualBtn = document.getElementById('manual-install-btn');
        if (manualBtn && !this.isInstalled) {
            manualBtn.style.display = 'inline-block';
            console.log('📱 Botón manual de instalación mostrado');
        }
    }

    hideInstallButton() {
        if (this.installButton) {
            this.installButton.style.display = 'none';
            console.log('📱 Botón de instalación oculto');
        }
        
        // También ocultar el botón manual
        const manualBtn = document.getElementById('manual-install-btn');
        if (manualBtn) {
            manualBtn.style.display = 'none';
            console.log('📱 Botón manual de instalación oculto');
        }
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            console.log('⚠️ No hay prompt de instalación disponible');
            return;
        }

        try {
            console.log('📱 Iniciando instalación PWA...');
            
            // Mostrar el prompt de instalación
            this.deferredPrompt.prompt();
            
            // Esperar la respuesta del usuario
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ Usuario aceptó la instalación');
                this.showInstallationSuccess();
            } else {
                console.log('❌ Usuario rechazó la instalación');
            }
            
            // Limpiar el prompt
            this.deferredPrompt = null;
            this.hideInstallButton();
            
        } catch (error) {
            console.error('❌ Error durante la instalación:', error);
        }
    }

    showInstallationSuccess() {
        // Crear notificación de éxito
        const notification = document.createElement('div');
        notification.className = 'pwa-success-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
                z-index: 1001;
                font-weight: 600;
                max-width: 300px;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="logo 2.png" style="width: 32px; height: 32px; border-radius: 50%;" alt="Logo">
                    <div>
                        <div style="font-weight: bold; margin-bottom: 5px;">¡App Instalada!</div>
                        <div style="font-size: 12px; opacity: 0.9;">La app está ahora disponible en tu pantalla de inicio</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    checkInstallationStatus() {
        // Verificar si la app está instalada
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            console.log('✅ App ejecutándose en modo standalone (instalada)');
            this.isInstalled = true;
            this.hideInstallButton();
        } else if (window.navigator.standalone) {
            console.log('✅ App ejecutándose en modo standalone (iOS)');
            this.isInstalled = true;
            this.hideInstallButton();
        } else {
            console.log('📱 App ejecutándose en navegador');
        }
    }

    // Solicitar permisos de notificaciones
    async requestNotificationPermission() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('✅ Permisos de notificación concedidos');
                    return true;
                } else {
                    console.log('❌ Permisos de notificación denegados');
                    return false;
                }
            } catch (error) {
                console.error('❌ Error solicitando permisos de notificación:', error);
                return false;
            }
        }
        return false;
    }

    // Configurar notificaciones push
    async setupPushNotifications() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const permission = await Notification.requestPermission();
                
                if (permission === 'granted') {
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
                    });
                    
                    console.log('✅ Suscripción push configurada:', subscription);
                    return subscription;
                }
            } catch (error) {
                console.error('❌ Error configurando notificaciones push:', error);
            }
        }
        return null;
    }

    // Convertir clave VAPID (placeholder)
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Verificar características PWA disponibles
    checkPWACapabilities() {
        const capabilities = {
            serviceWorker: 'serviceWorker' in navigator,
            pushManager: 'PushManager' in window,
            notifications: 'Notification' in window,
            manifest: !!document.querySelector('link[rel="manifest"]'),
            standalone: window.matchMedia && window.matchMedia('(display-mode: standalone)').matches,
            iosStandalone: window.navigator.standalone,
            beforeInstallPrompt: !!this.deferredPrompt
        };

        console.log('📱 Capacidades PWA:', capabilities);
        return capabilities;
    }

    // Mostrar información PWA
    showPWAInfo() {
        const capabilities = this.checkPWACapabilities();
        const info = `
            📱 Estado PWA:
            • Service Worker: ${capabilities.serviceWorker ? '✅' : '❌'}
            • Push Manager: ${capabilities.pushManager ? '✅' : '❌'}
            • Notificaciones: ${capabilities.notifications ? '✅' : '❌'}
            • Manifest: ${capabilities.manifest ? '✅' : '❌'}
            • Modo Standalone: ${capabilities.standalone ? '✅' : '❌'}
            • iOS Standalone: ${capabilities.iosStandalone ? '✅' : '❌'}
            • Instalable: ${capabilities.beforeInstallPrompt ? '✅' : '❌'}
        `;
        
        console.log(info);
        return capabilities;
    }

    // Debugging detallado del estado PWA
    debugPWAStatus() {
        console.log('🔍 Debugging PWA Status...');
        
        // Verificar manifest
        const manifestLink = document.querySelector('link[rel="manifest"]');
        console.log('📄 Manifest link:', manifestLink ? manifestLink.href : 'No encontrado');
        
        // Verificar service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                console.log('🔧 Service Worker ready:', registration);
                console.log('📱 Service Worker scope:', registration.scope);
                console.log('📱 Service Worker active:', registration.active);
            });
        }
        
        // Verificar beforeinstallprompt
        console.log('📱 Deferred prompt:', this.deferredPrompt ? 'Disponible' : 'No disponible');
        
        // Verificar display mode
        if (window.matchMedia) {
            const standalone = window.matchMedia('(display-mode: standalone)');
            console.log('📱 Display mode standalone:', standalone.matches);
        }
        
        // Verificar protocolo
        console.log('🌐 Protocolo:', location.protocol);
        console.log('🏠 Hostname:', location.hostname);
        
        // Verificar si la página está controlada por SW
        console.log('📱 Página controlada por SW:', !!navigator.serviceWorker.controller);
        
        // Mostrar información completa
        this.showPWAInfo();
    }
}

// Inicializar PWA Installer cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.pwaInstaller = new PWAInstaller();
});

// Exportar para uso global
window.PWAInstaller = PWAInstaller; 