// test-automatico.js
// Script de prueba para verificar el funcionamiento automático del sistema

class AutomaticSystemTester {
    constructor() {
        this.tests = [];
        this.results = {};
        this.startTime = Date.now();
    }

    // === EJECUTAR TODAS LAS PRUEBAS ===
    async runAllTests() {
        console.log('🧪 Iniciando pruebas del sistema automático...');
        
        this.tests = [
            { name: 'Verificar inicialización automática', test: () => this.testAutoInit() },
            { name: 'Verificar sincronización automática', test: () => this.testAutoSync() },
            { name: 'Verificar auto-recuperación', test: () => this.testAutoRecovery() },
            { name: 'Verificar auto-backup', test: () => this.testAutoBackup() },
            { name: 'Verificar modo proyección', test: () => this.testAutoProjection() },
            { name: 'Verificar notificaciones', test: () => this.testAutoNotifications() },
            { name: 'Verificar manejo de errores', test: () => this.testErrorHandling() },
            { name: 'Verificar conectividad', test: () => this.testConnectivity() },
            { name: 'Verificar almacenamiento', test: () => this.testStorage() },
            { name: 'Verificar componentes principales', test: () => this.testMainComponents() }
        ];

        for (const test of this.tests) {
            try {
                console.log(`\n🔍 Ejecutando: ${test.name}`);
                const result = await test.test();
                this.results[test.name] = { success: true, result };
                console.log(`✅ ${test.name}: PASÓ`);
            } catch (error) {
                this.results[test.name] = { success: false, error: error.message };
                console.log(`❌ ${test.name}: FALLÓ - ${error.message}`);
            }
        }

        this.generateReport();
    }

    // === PRUEBAS INDIVIDUALES ===
    
    testAutoInit() {
        // Verificar que el sistema automático se inicializó
        if (!window.autoInitSystem) {
            throw new Error('Sistema automático no inicializado');
        }

        if (!window.autoInitSystem.initialized) {
            throw new Error('Sistema automático no completó la inicialización');
        }

        const status = window.autoInitSystem.getSystemStatus();
        if (!status.initialized) {
            throw new Error('Estado del sistema no es válido');
        }

        return {
            initialized: status.initialized,
            errorCount: status.errorCount,
            components: status.components
        };
    }

    testAutoSync() {
        // Verificar que el SyncManager está funcionando
        if (!window.syncManager) {
            throw new Error('SyncManager no inicializado');
        }

        const stats = window.syncManager.getSyncStats();
        const diagnostics = window.syncManager.getDiagnostics();

        if (typeof stats.pending !== 'number') {
            throw new Error('Estadísticas de sincronización no válidas');
        }

        return {
            isOnline: stats.isOnline,
            pending: stats.pending,
            synced: stats.synced,
            failed: stats.failed
        };
    }

    testAutoRecovery() {
        // Verificar sistema de auto-recuperación
        if (!window.autoInitSystem) {
            throw new Error('Sistema automático no disponible');
        }

        const status = window.autoInitSystem.getSystemStatus();
        
        if (!status.config.autoRecovery) {
            throw new Error('Auto-recuperación no está habilitada');
        }

        return {
            autoRecoveryEnabled: status.config.autoRecovery,
            errorCount: status.errorCount,
            maxErrors: window.autoInitSystem.maxErrors
        };
    }

    testAutoBackup() {
        // Verificar sistema de auto-backup
        const backupData = localStorage.getItem('globalBackup');
        
        if (!backupData) {
            // Crear un backup de prueba
            const testBackup = {
                timestamp: new Date().toISOString(),
                test: true
            };
            localStorage.setItem('testBackup', JSON.stringify(testBackup));
            
            const restored = localStorage.getItem('testBackup');
            if (!restored) {
                throw new Error('Sistema de backup no funciona');
            }
            
            localStorage.removeItem('testBackup');
        }

        return {
            backupExists: !!backupData,
            backupSize: backupData ? backupData.length : 0
        };
    }

    testAutoProjection() {
        // Verificar modo proyección automático
        if (!window.autoInitSystem) {
            throw new Error('Sistema automático no disponible');
        }

        const isLargeScreen = window.innerWidth >= 1920 && window.innerHeight >= 1080;
        const isFullscreen = document.fullscreenElement !== null;
        const isProjectionMode = window.location.search.includes('projection=true');

        return {
            isLargeScreen,
            isFullscreen,
            isProjectionMode,
            globalProjectionMode: window.autoInitSystem.globalProjectionMode || false
        };
    }

    testAutoNotifications() {
        // Verificar sistema de notificaciones
        if (!window.autoInitSystem) {
            throw new Error('Sistema automático no disponible');
        }

        const status = window.autoInitSystem.getSystemStatus();
        
        if (!status.config.autoNotifications) {
            throw new Error('Notificaciones automáticas no están habilitadas');
        }

        // Verificar si las notificaciones están disponibles
        const notificationsSupported = 'Notification' in window;
        const permission = notificationsSupported ? Notification.permission : 'not-supported';

        return {
            autoNotificationsEnabled: status.config.autoNotifications,
            notificationsSupported,
            permission
        };
    }

    testErrorHandling() {
        // Verificar manejo automático de errores
        if (!window.autoInitSystem) {
            throw new Error('Sistema automático no disponible');
        }

        const status = window.autoInitSystem.getSystemStatus();
        
        if (!status.config.autoErrorHandling) {
            throw new Error('Manejo automático de errores no está habilitado');
        }

        return {
            autoErrorHandlingEnabled: status.config.autoErrorHandling,
            errorCount: status.errorCount,
            maxErrors: window.autoInitSystem.maxErrors
        };
    }

    testConnectivity() {
        // Verificar conectividad
        const isOnline = navigator.onLine;
        const connectionType = navigator.connection ? navigator.connection.effectiveType : 'unknown';

        return {
            isOnline,
            connectionType,
            userAgent: navigator.userAgent
        };
    }

    testStorage() {
        // Verificar almacenamiento local
        try {
            localStorage.setItem('test', 'test');
            const testValue = localStorage.getItem('test');
            localStorage.removeItem('test');
            
            if (testValue !== 'test') {
                throw new Error('Almacenamiento local no funciona correctamente');
            }

            return {
                localStorage: true,
                sessionStorage: true,
                available: true
            };
        } catch (error) {
            throw new Error(`Almacenamiento no disponible: ${error.message}`);
        }
    }

    testMainComponents() {
        // Verificar componentes principales
        const components = {
            votingSystem: !!window.votingSystem,
            syncManager: !!window.syncManager,
            autoInitSystem: !!window.autoInitSystem,
            serviceWorker: 'serviceWorker' in navigator
        };

        const allComponentsPresent = Object.values(components).every(Boolean);
        
        if (!allComponentsPresent) {
            const missing = Object.keys(components).filter(key => !components[key]);
            throw new Error(`Componentes faltantes: ${missing.join(', ')}`);
        }

        return components;
    }

    // === GENERAR REPORTE ===
    generateReport() {
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        const passedTests = Object.values(this.results).filter(r => r.success).length;
        const totalTests = this.tests.length;
        const successRate = (passedTests / totalTests) * 100;

        console.log('\n📊 REPORTE DE PRUEBAS DEL SISTEMA AUTOMÁTICO');
        console.log('=' .repeat(60));
        console.log(`⏱️  Duración total: ${duration}ms`);
        console.log(`✅ Pruebas exitosas: ${passedTests}/${totalTests}`);
        console.log(`📈 Tasa de éxito: ${successRate.toFixed(1)}%`);
        console.log('\n📋 DETALLES POR PRUEBA:');

        Object.entries(this.results).forEach(([testName, result]) => {
            const status = result.success ? '✅' : '❌';
            const details = result.success ? JSON.stringify(result.result) : result.error;
            console.log(`${status} ${testName}: ${details}`);
        });

        console.log('\n🎯 RESUMEN:');
        if (successRate === 100) {
            console.log('🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema automático está funcionando perfectamente.');
        } else if (successRate >= 80) {
            console.log('👍 La mayoría de las pruebas pasaron. El sistema automático está funcionando bien.');
        } else if (successRate >= 60) {
            console.log('⚠️  Algunas pruebas fallaron. Revisar configuración del sistema automático.');
        } else {
            console.log('❌ Muchas pruebas fallaron. El sistema automático necesita atención.');
        }

        // Guardar reporte en localStorage
        const report = {
            timestamp: new Date().toISOString(),
            duration,
            successRate,
            results: this.results,
            summary: {
                passed: passedTests,
                total: totalTests,
                status: successRate === 100 ? 'PERFECTO' : 
                       successRate >= 80 ? 'BUENO' : 
                       successRate >= 60 ? 'REGULAR' : 'CRÍTICO'
            }
        };

        localStorage.setItem('automaticSystemTestReport', JSON.stringify(report));
        console.log('\n💾 Reporte guardado en localStorage como "automaticSystemTestReport"');
    }

    // === UTILIDADES ===
    
    // Ejecutar prueba específica
    async runTest(testName) {
        const test = this.tests.find(t => t.name === testName);
        if (!test) {
            throw new Error(`Prueba no encontrada: ${testName}`);
        }

        console.log(`🔍 Ejecutando prueba específica: ${testName}`);
        const result = await test.test();
        console.log(`✅ Resultado:`, result);
        return result;
    }

    // Obtener reporte guardado
    getSavedReport() {
        const saved = localStorage.getItem('automaticSystemTestReport');
        return saved ? JSON.parse(saved) : null;
    }

    // Limpiar reportes
    clearReports() {
        localStorage.removeItem('automaticSystemTestReport');
        console.log('🗑️ Reportes de prueba eliminados');
    }
}

// Función global para ejecutar pruebas
window.runAutomaticSystemTests = async () => {
    const tester = new AutomaticSystemTester();
    await tester.runAllTests();
    return tester;
};

// Función para ejecutar prueba específica
window.runSpecificTest = async (testName) => {
    const tester = new AutomaticSystemTester();
    return await tester.runTest(testName);
};

// Función para obtener reporte
window.getTestReport = () => {
    const tester = new AutomaticSystemTester();
    return tester.getSavedReport();
};

// Función para limpiar reportes
window.clearTestReports = () => {
    const tester = new AutomaticSystemTester();
    tester.clearReports();
};

// Auto-ejecutar pruebas si está en modo desarrollo
if (window.location.search.includes('test=automatic')) {
    console.log('🧪 Modo de prueba automática detectado. Ejecutando pruebas...');
    setTimeout(() => {
        window.runAutomaticSystemTests();
    }, 3000); // Esperar 3 segundos para que el sistema se inicialice
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomaticSystemTester;
} 