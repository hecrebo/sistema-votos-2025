/**
 * Sistema de Diagnóstico - Sistema de Votos 2025
 * Verifica el estado del sistema y proporciona información detallada
 */

class SystemDiagnostic {
    constructor() {
        this.diagnosticResults = {};
        this.isRunning = false;
    }

    async runFullDiagnostic() {
        if (this.isRunning) {
            console.log('⚠️ Diagnóstico ya en ejecución...');
            return;
        }

        this.isRunning = true;
        console.log('🔍 Iniciando diagnóstico completo del sistema...');

        try {
            // 1. Diagnóstico básico del navegador
            this.diagnosticResults.browser = this.diagnoseBrowser();

            // 2. Diagnóstico de sesión de usuario
            this.diagnosticResults.session = this.diagnoseUserSession();

            // 3. Diagnóstico de Firebase
            this.diagnosticResults.firebase = await this.diagnoseFirebase();

            // 4. Diagnóstico del sistema de votación
            this.diagnosticResults.votingSystem = this.diagnoseVotingSystem();

            // 5. Diagnóstico de notificaciones
            this.diagnosticResults.notifications = this.diagnoseNotifications();

            // 6. Diagnóstico de almacenamiento
            this.diagnosticResults.storage = this.diagnoseStorage();

            // 7. Diagnóstico de conectividad
            this.diagnosticResults.connectivity = await this.diagnoseConnectivity();

            // 8. Generar reporte
            this.generateReport();

            this.isRunning = false;
            console.log('✅ Diagnóstico completado');

        } catch (error) {
            console.error('❌ Error en diagnóstico:', error);
            this.isRunning = false;
        }
    }

    diagnoseBrowser() {
        const results = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            serviceWorker: 'serviceWorker' in navigator,
            notifications: 'Notification' in window,
            localStorage: this.testLocalStorage(),
            sessionStorage: this.testSessionStorage(),
            indexedDB: this.testIndexedDB()
        };

        console.log('🌐 Diagnóstico del navegador:', results);
        return results;
    }

    diagnoseUserSession() {
        const results = {
            hasSession: false,
            userData: null,
            sessionValid: false,
            errors: []
        };

        try {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                results.hasSession = true;
                results.userData = {
                    username: user.username,
                    rol: user.rol,
                    timestamp: user.timestamp
                };
                results.sessionValid = !!(user.username && user.rol);
            }
        } catch (error) {
            results.errors.push(`Error parsing session: ${error.message}`);
        }

        console.log('👤 Diagnóstico de sesión:', results);
        return results;
    }

    async diagnoseFirebase() {
        const results = {
            available: false,
            configured: false,
            connected: false,
            collections: [],
            errors: []
        };

        try {
            // Verificar si Firebase está disponible
            if (window.firebaseDB) {
                results.available = true;
                results.configured = true;

                // Verificar conexión
                if (window.firebaseDB.votesCollection) {
                    try {
                        const snapshot = await window.firebaseDB.votesCollection.limit(1).get();
                        results.connected = true;
                        results.collections.push('votes');
                    } catch (error) {
                        results.errors.push(`Error testing votes collection: ${error.message}`);
                    }
                }

                if (window.firebaseDB.ubchCollection) {
                    results.collections.push('ubchData');
                }
            }
        } catch (error) {
            results.errors.push(`Firebase error: ${error.message}`);
        }

        console.log('🔥 Diagnóstico de Firebase:', results);
        return results;
    }

    diagnoseVotingSystem() {
        const results = {
            available: false,
            initialized: false,
            hasData: false,
            dataCount: 0,
            errors: []
        };

        try {
            if (window.votingSystem) {
                results.available = true;
                results.initialized = true;

                if (window.votingSystem.votes) {
                    results.hasData = true;
                    results.dataCount = window.votingSystem.votes.length;
                }

                // Verificar métodos principales
                const requiredMethods = ['init', 'loadDataFromFirebase', 'loadDataLocally'];
                const missingMethods = requiredMethods.filter(method => 
                    !window.votingSystem[method] || typeof window.votingSystem[method] !== 'function'
                );

                if (missingMethods.length > 0) {
                    results.errors.push(`Missing methods: ${missingMethods.join(', ')}`);
                }
            }
        } catch (error) {
            results.errors.push(`Voting system error: ${error.message}`);
        }

        console.log('🗳️ Diagnóstico del sistema de votación:', results);
        return results;
    }

    diagnoseNotifications() {
        const results = {
            visualSystem: false,
            pushSystem: false,
            integration: false,
            permissions: 'default',
            errors: []
        };

        try {
            // Verificar sistema de notificaciones visuales
            if (window.notificationSystem) {
                results.visualSystem = true;
            }

            // Verificar sistema de notificaciones push
            if (window.browserNotificationSystem) {
                results.pushSystem = true;
            }

            // Verificar integración
            if (window.notificationIntegration) {
                results.integration = true;
            }

            // Verificar permisos
            if ('Notification' in window) {
                results.permissions = Notification.permission;
            }
        } catch (error) {
            results.errors.push(`Notifications error: ${error.message}`);
        }

        console.log('🔔 Diagnóstico de notificaciones:', results);
        return results;
    }

    diagnoseStorage() {
        const results = {
            localStorage: {},
            sessionStorage: {},
            indexedDB: false,
            errors: []
        };

        try {
            // Verificar localStorage
            const keys = Object.keys(localStorage);
            results.localStorage = {
                available: true,
                keys: keys,
                keyCount: keys.length,
                size: this.getLocalStorageSize()
            };

            // Verificar sessionStorage
            const sessionKeys = Object.keys(sessionStorage);
            results.sessionStorage = {
                available: true,
                keys: sessionKeys,
                keyCount: sessionKeys.length
            };

            // Verificar IndexedDB
            results.indexedDB = 'indexedDB' in window;

        } catch (error) {
            results.errors.push(`Storage error: ${error.message}`);
        }

        console.log('💾 Diagnóstico de almacenamiento:', results);
        return results;
    }

    async diagnoseConnectivity() {
        const results = {
            online: navigator.onLine,
            firebaseConnection: false,
            testUrls: [],
            errors: []
        };

        try {
            // Probar conexión a Firebase
            if (window.firebaseDB && window.firebaseDB.votesCollection) {
                try {
                    await window.firebaseDB.votesCollection.limit(1).get();
                    results.firebaseConnection = true;
                } catch (error) {
                    results.errors.push(`Firebase connection failed: ${error.message}`);
                }
            }

            // Probar URLs de prueba
            const testUrls = [
                'https://www.google.com',
                'https://firebase.google.com'
            ];

            for (const url of testUrls) {
                try {
                    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
                    results.testUrls.push({ url, status: 'success' });
                } catch (error) {
                    results.testUrls.push({ url, status: 'failed', error: error.message });
                }
            }

        } catch (error) {
            results.errors.push(`Connectivity error: ${error.message}`);
        }

        console.log('🌐 Diagnóstico de conectividad:', results);
        return results;
    }

    testLocalStorage() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    testSessionStorage() {
        try {
            const testKey = '__test__';
            sessionStorage.setItem(testKey, 'test');
            sessionStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    testIndexedDB() {
        return 'indexedDB' in window;
    }

    getLocalStorageSize() {
        let size = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                size += localStorage[key].length + key.length;
            }
        }
        return size;
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.generateSummary(),
            details: this.diagnosticResults,
            recommendations: this.generateRecommendations()
        };

        console.log('📊 Reporte de diagnóstico:', report);
        
        // Guardar reporte en localStorage
        try {
            localStorage.setItem('systemDiagnostic', JSON.stringify(report));
        } catch (error) {
            console.error('Error guardando reporte:', error);
        }

        return report;
    }

    generateSummary() {
        const results = this.diagnosticResults;
        const summary = {
            overall: 'unknown',
            issues: [],
            working: []
        };

        // Verificar componentes críticos
        if (results.session.sessionValid) {
            summary.working.push('Sesión de usuario');
        } else {
            summary.issues.push('Sesión de usuario inválida');
        }

        if (results.firebase.connected) {
            summary.working.push('Conexión Firebase');
        } else {
            summary.issues.push('Sin conexión Firebase');
        }

        if (results.votingSystem.available && results.votingSystem.initialized) {
            summary.working.push('Sistema de votación');
        } else {
            summary.issues.push('Sistema de votación no disponible');
        }

        if (results.notifications.visualSystem) {
            summary.working.push('Notificaciones visuales');
        }

        if (results.storage.localStorage.available) {
            summary.working.push('Almacenamiento local');
        }

        // Determinar estado general
        if (summary.issues.length === 0) {
            summary.overall = 'excellent';
        } else if (summary.issues.length <= 2) {
            summary.overall = 'good';
        } else if (summary.issues.length <= 4) {
            summary.overall = 'fair';
        } else {
            summary.overall = 'poor';
        }

        return summary;
    }

    generateRecommendations() {
        const results = this.diagnosticResults;
        const recommendations = [];

        // Recomendaciones basadas en los resultados
        if (!results.session.sessionValid) {
            recommendations.push('Iniciar sesión de usuario');
        }

        if (!results.firebase.connected) {
            recommendations.push('Verificar conexión a internet');
            recommendations.push('El sistema funcionará en modo offline');
        }

        if (!results.votingSystem.available) {
            recommendations.push('Recargar la página');
        }

        if (results.notifications.permissions === 'denied') {
            recommendations.push('Habilitar notificaciones en la configuración del navegador');
        }

        if (results.connectivity.online === false) {
            recommendations.push('Verificar conexión a internet');
        }

        return recommendations;
    }

    // Métodos públicos
    getDiagnosticResults() {
        return this.diagnosticResults;
    }

    getLastReport() {
        try {
            const report = localStorage.getItem('systemDiagnostic');
            return report ? JSON.parse(report) : null;
        } catch (error) {
            console.error('Error obteniendo último reporte:', error);
            return null;
        }
    }

    clearDiagnosticResults() {
        this.diagnosticResults = {};
        localStorage.removeItem('systemDiagnostic');
    }
}

// Crear instancia global
window.systemDiagnostic = new SystemDiagnostic();

// Funciones globales para diagnóstico
window.runDiagnostic = () => {
    return window.systemDiagnostic.runFullDiagnostic();
};

window.getDiagnosticResults = () => {
    return window.systemDiagnostic.getDiagnosticResults();
};

window.getLastDiagnosticReport = () => {
    return window.systemDiagnostic.getLastReport();
};

console.log('🔍 Sistema de diagnóstico cargado'); 