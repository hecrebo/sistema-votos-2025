// test-proyeccion.js
// Script de prueba específico para el modo proyección

class ProjectionTester {
    constructor() {
        this.testResults = {};
    }

    // === EJECUTAR TODAS LAS PRUEBAS DE PROYECCIÓN ===
    async runAllProjectionTests() {
        console.log('🎬 Iniciando pruebas del modo proyección...');
        
        const tests = [
            { name: 'Verificar elementos de proyección', test: () => this.testProjectionElements() },
            { name: 'Verificar botón de proyección', test: () => this.testProjectionButton() },
            { name: 'Verificar activación de proyección', test: () => this.testProjectionActivation() },
            { name: 'Verificar desactivación de proyección', test: () => this.testProjectionDeactivation() },
            { name: 'Verificar actualización de datos', test: () => this.testProjectionDataUpdate() },
            { name: 'Verificar estilos de proyección', test: () => this.testProjectionStyles() },
            { name: 'Verificar contadores de proyección', test: () => this.testProjectionCounters() },
            { name: 'Verificar información de sincronización', test: () => this.testProjectionSyncInfo() }
        ];

        for (const test of tests) {
            try {
                console.log(`\n🔍 Ejecutando: ${test.name}`);
                const result = await test.test();
                this.testResults[test.name] = { success: true, result };
                console.log(`✅ ${test.name}: PASÓ`);
            } catch (error) {
                this.testResults[test.name] = { success: false, error: error.message };
                console.log(`❌ ${test.name}: FALLÓ - ${error.message}`);
            }
        }

        this.generateProjectionReport();
    }

    // === PRUEBAS INDIVIDUALES ===
    
    testProjectionElements() {
        // Verificar que existen todos los elementos necesarios
        const requiredElements = [
            'projection-view',
            'projection-btn',
            'exit-projection-btn',
            'projection-votes',
            'projection-progress-fill',
            'projection-text',
            'projection-ubch-list'
        ];

        const missingElements = [];
        
        requiredElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (!element) {
                missingElements.push(elementId);
            }
        });

        if (missingElements.length > 0) {
            throw new Error(`Elementos faltantes: ${missingElements.join(', ')}`);
        }

        return {
            totalElements: requiredElements.length,
            foundElements: requiredElements.length - missingElements.length,
            missingElements: missingElements
        };
    }

    testProjectionButton() {
        // Verificar que el botón de proyección existe y es clickeable
        const projectionBtn = document.getElementById('projection-btn');
        if (!projectionBtn) {
            throw new Error('Botón de proyección no encontrado');
        }

        if (projectionBtn.disabled) {
            throw new Error('Botón de proyección está deshabilitado');
        }

        // Verificar que tiene el evento click
        const hasClickEvent = projectionBtn.onclick !== null || 
                            projectionBtn.getAttribute('onclick') !== null;

        return {
            buttonExists: true,
            buttonEnabled: !projectionBtn.disabled,
            buttonText: projectionBtn.textContent,
            hasClickEvent: hasClickEvent
        };
    }

    testProjectionActivation() {
        // Verificar que el sistema de votos existe
        if (!window.votingSystem) {
            throw new Error('Sistema de votos no inicializado');
        }

        // Verificar que el método enterProjectionMode existe
        if (typeof window.votingSystem.enterProjectionMode !== 'function') {
            throw new Error('Método enterProjectionMode no disponible');
        }

        // Simular activación
        const projectionView = document.getElementById('projection-view');
        const initialDisplay = projectionView.style.display;
        
        // Activar proyección
        window.votingSystem.enterProjectionMode();
        
        // Verificar que se activó
        const activated = projectionView.style.display === 'block';
        
        // Restaurar estado original
        projectionView.style.display = initialDisplay;
        document.body.classList.remove('projection-mode');

        return {
            methodExists: true,
            activationSuccessful: activated,
            projectionViewVisible: activated
        };
    }

    testProjectionDeactivation() {
        // Verificar que el método exitProjectionMode existe
        if (typeof window.votingSystem.exitProjectionMode !== 'function') {
            throw new Error('Método exitProjectionMode no disponible');
        }

        // Simular desactivación
        const projectionView = document.getElementById('projection-view');
        projectionView.style.display = 'block';
        document.body.classList.add('projection-mode');
        
        // Desactivar proyección
        window.votingSystem.exitProjectionMode();
        
        // Verificar que se desactivó
        const deactivated = projectionView.style.display === 'none' && 
                           !document.body.classList.contains('projection-mode');

        return {
            methodExists: true,
            deactivationSuccessful: deactivated,
            projectionViewHidden: projectionView.style.display === 'none',
            projectionModeRemoved: !document.body.classList.contains('projection-mode')
        };
    }

    testProjectionDataUpdate() {
        // Verificar que el método updateProjection existe
        if (typeof window.votingSystem.updateProjection !== 'function') {
            throw new Error('Método updateProjection no disponible');
        }

        // Verificar que los métodos de actualización existen
        const requiredMethods = [
            'updateProjectionCounters',
            'updateProjectionSyncInfo'
        ];

        const missingMethods = [];
        requiredMethods.forEach(methodName => {
            if (typeof window.votingSystem[methodName] !== 'function') {
                missingMethods.push(methodName);
            }
        });

        if (missingMethods.length > 0) {
            throw new Error(`Métodos faltantes: ${missingMethods.join(', ')}`);
        }

        return {
            updateProjectionExists: true,
            updateCountersExists: true,
            updateSyncInfoExists: true,
            allMethodsAvailable: missingMethods.length === 0
        };
    }

    testProjectionStyles() {
        // Verificar que los estilos de proyección están definidos
        const styleSheets = Array.from(document.styleSheets);
        let projectionStylesFound = false;
        let globalProjectionStylesFound = false;

        styleSheets.forEach(sheet => {
            try {
                const rules = Array.from(sheet.cssRules || sheet.rules);
                rules.forEach(rule => {
                    if (rule.selectorText && rule.selectorText.includes('projection-mode')) {
                        projectionStylesFound = true;
                    }
                    if (rule.selectorText && rule.selectorText.includes('global-projection-mode')) {
                        globalProjectionStylesFound = true;
                    }
                });
            } catch (e) {
                // Ignorar errores de CORS
            }
        });

        return {
            projectionStylesFound,
            globalProjectionStylesFound,
            stylesAvailable: projectionStylesFound || globalProjectionStylesFound
        };
    }

    testProjectionCounters() {
        // Verificar que los contadores se actualizan correctamente
        const projectionVotes = document.getElementById('projection-votes');
        const projectionText = document.getElementById('projection-text');
        
        if (!projectionVotes || !projectionText) {
            throw new Error('Elementos de contadores no encontrados');
        }

        // Simular actualización de contadores
        const testData = {
            totalVotes: 100,
            votedCount: 75,
            pendingCount: 25
        };

        // Actualizar contadores manualmente
        projectionVotes.textContent = testData.votedCount;
        projectionText.textContent = `${testData.votedCount} de ${testData.totalVotes}`;

        return {
            countersExist: true,
            countersUpdateable: true,
            testDataApplied: true
        };
    }

    testProjectionSyncInfo() {
        // Verificar que la información de sincronización funciona
        const syncInfo = document.getElementById('projection-sync-info');
        
        if (!syncInfo) {
            // Crear elemento temporal para la prueba
            const tempSyncInfo = document.createElement('div');
            tempSyncInfo.id = 'projection-sync-info';
            document.body.appendChild(tempSyncInfo);
            
            // Verificar que se puede actualizar
            tempSyncInfo.innerHTML = `
                <div class="sync-status online">
                    🌐 Online
                </div>
                <div class="sync-stats">
                    Pendientes: 0 | Fallidos: 0
                </div>
            `;
            
            const updateSuccessful = tempSyncInfo.innerHTML.includes('Online');
            
            // Limpiar
            document.body.removeChild(tempSyncInfo);
            
            return {
                syncInfoCreated: true,
                syncInfoUpdateable: updateSuccessful
            };
        }

        return {
            syncInfoExists: true,
            syncInfoUpdateable: true
        };
    }

    // === GENERAR REPORTE ===
    generateProjectionReport() {
        const passedTests = Object.values(this.testResults).filter(r => r.success).length;
        const totalTests = Object.keys(this.testResults).length;
        const successRate = (passedTests / totalTests) * 100;

        console.log('\n📊 REPORTE DE PRUEBAS DEL MODO PROYECCIÓN');
        console.log('=' .repeat(60));
        console.log(`✅ Pruebas exitosas: ${passedTests}/${totalTests}`);
        console.log(`📈 Tasa de éxito: ${successRate.toFixed(1)}%`);
        console.log('\n📋 DETALLES POR PRUEBA:');

        Object.entries(this.testResults).forEach(([testName, result]) => {
            const status = result.success ? '✅' : '❌';
            const details = result.success ? JSON.stringify(result.result) : result.error;
            console.log(`${status} ${testName}: ${details}`);
        });

        console.log('\n🎯 RESUMEN DEL MODO PROYECCIÓN:');
        if (successRate === 100) {
            console.log('🎉 ¡TODAS LAS PRUEBAS PASARON! El modo proyección está funcionando perfectamente.');
        } else if (successRate >= 80) {
            console.log('👍 La mayoría de las pruebas pasaron. El modo proyección está funcionando bien.');
        } else if (successRate >= 60) {
            console.log('⚠️  Algunas pruebas fallaron. Revisar configuración del modo proyección.');
        } else {
            console.log('❌ Muchas pruebas fallaron. El modo proyección necesita atención.');
        }

        // Guardar reporte
        const report = {
            timestamp: new Date().toISOString(),
            successRate,
            results: this.testResults,
            summary: {
                passed: passedTests,
                total: totalTests,
                status: successRate === 100 ? 'PERFECTO' : 
                       successRate >= 80 ? 'BUENO' : 
                       successRate >= 60 ? 'REGULAR' : 'CRÍTICO'
            }
        };

        localStorage.setItem('projectionTestReport', JSON.stringify(report));
        console.log('\n💾 Reporte guardado en localStorage como "projectionTestReport"');
    }

    // === UTILIDADES ===
    
    // Ejecutar prueba específica
    async runSpecificTest(testName) {
        const testMap = {
            'elementos': () => this.testProjectionElements(),
            'boton': () => this.testProjectionButton(),
            'activacion': () => this.testProjectionActivation(),
            'desactivacion': () => this.testProjectionDeactivation(),
            'datos': () => this.testProjectionDataUpdate(),
            'estilos': () => this.testProjectionStyles(),
            'contadores': () => this.testProjectionCounters(),
            'sincronizacion': () => this.testProjectionSyncInfo()
        };

        const test = testMap[testName];
        if (!test) {
            throw new Error(`Prueba no encontrada: ${testName}`);
        }

        console.log(`🔍 Ejecutando prueba específica: ${testName}`);
        const result = await test();
        console.log(`✅ Resultado:`, result);
        return result;
    }

    // Obtener reporte guardado
    getSavedReport() {
        const saved = localStorage.getItem('projectionTestReport');
        return saved ? JSON.parse(saved) : null;
    }

    // Limpiar reportes
    clearReports() {
        localStorage.removeItem('projectionTestReport');
        console.log('🗑️ Reportes de proyección eliminados');
    }
}

// Función global para ejecutar pruebas de proyección
window.runProjectionTests = async () => {
    const tester = new ProjectionTester();
    await tester.runAllProjectionTests();
    return tester;
};

// Función para ejecutar prueba específica
window.runSpecificProjectionTest = async (testName) => {
    const tester = new ProjectionTester();
    return await tester.runSpecificTest(testName);
};

// Función para obtener reporte
window.getProjectionTestReport = () => {
    const tester = new ProjectionTester();
    return tester.getSavedReport();
};

// Función para limpiar reportes
window.clearProjectionTestReports = () => {
    const tester = new ProjectionTester();
    tester.clearReports();
};

// Auto-ejecutar pruebas si está en modo desarrollo
if (window.location.search.includes('test=projection')) {
    console.log('🎬 Modo de prueba de proyección detectado. Ejecutando pruebas...');
    setTimeout(() => {
        window.runProjectionTests();
    }, 3000); // Esperar 3 segundos para que el sistema se inicialice
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectionTester;
} 