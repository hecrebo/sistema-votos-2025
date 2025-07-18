// 🔍 HERRAMIENTAS DE ANÁLISIS - Sistema de Votos 2025

class PerformanceAnalyzer {
    constructor() {
        this.metrics = {
            pageLoads: [],
            apiCalls: [],
            memoryUsage: [],
            errors: [],
            userActions: []
        };
        this.startTime = Date.now();
        this.setupMonitoring();
    }

    // Configurar monitoreo automático
    setupMonitoring() {
        // Monitorear carga de páginas
        window.addEventListener('load', () => {
            this.recordPageLoad();
        });

        // Monitorear errores
        window.addEventListener('error', (e) => {
            this.recordError(e);
        });

        // Monitorear uso de memoria
        this.startMemoryMonitoring();

        // Interceptar llamadas a Firebase
        this.interceptFirebaseCalls();
    }

    // Registrar carga de página
    recordPageLoad() {
        const loadTime = performance.now();
        const memoryUsage = performance.memory?.usedJSHeapSize || 0;
        
        this.metrics.pageLoads.push({
            timestamp: Date.now(),
            loadTime,
            memoryUsage,
            url: window.location.href
        });

        console.log(`📊 Página cargada en ${loadTime.toFixed(2)}ms`);
        console.log(`💾 Memoria usada: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }

    // Interceptar llamadas a Firebase
    interceptFirebaseCalls() {
        if (window.firebaseDB && window.firebaseDB.votesCollection) {
            const originalGet = window.firebaseDB.votesCollection.get;
            const originalAdd = window.firebaseDB.votesCollection.add;
            const originalUpdate = window.firebaseDB.votesCollection.doc;

            // Interceptar consultas
            window.firebaseDB.votesCollection.get = async function(...args) {
                const startTime = performance.now();
                try {
                    const result = await originalGet.apply(this, args);
                    const duration = performance.now() - startTime;
                    
                    if (window.performanceAnalyzer) {
                        window.performanceAnalyzer.recordAPICall('get', duration, args);
                    }
                    
                    return result;
                } catch (error) {
                    if (window.performanceAnalyzer) {
                        window.performanceAnalyzer.recordError(error);
                    }
                    throw error;
                }
            };

            // Interceptar escrituras
            window.firebaseDB.votesCollection.add = async function(...args) {
                const startTime = performance.now();
                try {
                    const result = await originalAdd.apply(this, args);
                    const duration = performance.now() - startTime;
                    
                    if (window.performanceAnalyzer) {
                        window.performanceAnalyzer.recordAPICall('add', duration, args);
                    }
                    
                    return result;
                } catch (error) {
                    if (window.performanceAnalyzer) {
                        window.performanceAnalyzer.recordError(error);
                    }
                    throw error;
                }
            };
        }
    }

    // Registrar llamada a API
    recordAPICall(method, duration, args) {
        this.metrics.apiCalls.push({
            timestamp: Date.now(),
            method,
            duration,
            argsCount: args.length
        });

        console.log(`🔥 Firebase ${method}: ${duration.toFixed(2)}ms`);
    }

    // Registrar error
    recordError(error) {
        this.metrics.errors.push({
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack,
            url: window.location.href
        });

        console.error(`❌ Error registrado: ${error.message}`);
    }

    // Monitorear uso de memoria
    startMemoryMonitoring() {
        setInterval(() => {
            if (performance.memory) {
                const memoryUsage = performance.memory.usedJSHeapSize;
                this.metrics.memoryUsage.push({
                    timestamp: Date.now(),
                    used: memoryUsage,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                });
            }
        }, 30000); // Cada 30 segundos
    }

    // Generar reporte de rendimiento
    generateReport() {
        const now = Date.now();
        const last24h = now - (24 * 60 * 60 * 1000);
        
        const recentLoads = this.metrics.pageLoads.filter(m => m.timestamp > last24h);
        const recentCalls = this.metrics.apiCalls.filter(m => m.timestamp > last24h);
        const recentErrors = this.metrics.errors.filter(m => m.timestamp > last24h);
        
        const avgLoadTime = recentLoads.length > 0 ? recentLoads.reduce((sum, m) => sum + m.loadTime, 0) / recentLoads.length : 0;
        const avgAPITime = recentCalls.length > 0 ? recentCalls.reduce((sum, m) => sum + m.duration, 0) / recentCalls.length : 0;
        const avgMemory = this.metrics.memoryUsage.length > 0 ? this.metrics.memoryUsage.reduce((sum, m) => sum + m.used, 0) / this.metrics.memoryUsage.length : 0;
        
        return {
            period: "Últimas 24 horas",
            pageLoads: recentLoads.length,
            avgLoadTime: avgLoadTime.toFixed(2) + "ms",
            apiCalls: recentCalls.length,
            avgAPITime: avgAPITime.toFixed(2) + "ms",
            errors: recentErrors.length,
            avgMemory: (avgMemory / 1024 / 1024).toFixed(2) + "MB",
            errorRate: recentCalls.length > 0 ? ((recentErrors.length / recentCalls.length) * 100).toFixed(2) + "%" : "0%"
        };
    }

    // Exportar métricas
    exportMetrics() {
        return {
            metrics: this.metrics,
            report: this.generateReport(),
            timestamp: Date.now()
        };
    }
}

// Herramienta para analizar rendimiento de tablas
class TablePerformanceAnalyzer {
    constructor(tableId) {
        this.tableId = tableId;
        this.table = document.getElementById(tableId);
        this.metrics = {
            renderTimes: [],
            rowCounts: [],
            memoryUsage: []
        };
    }

    // Analizar rendimiento de renderizado
    analyzeTableRender(data) {
        const startTime = performance.now();
        const startMemory = performance.memory?.usedJSHeapSize || 0;
        
        // Simular renderizado
        this.simulateTableRender(data);
        
        const endTime = performance.now();
        const endMemory = performance.memory?.usedJSHeapSize || 0;
        
        const renderTime = endTime - startTime;
        const memoryDelta = endMemory - startMemory;
        
        this.metrics.renderTimes.push({
            timestamp: Date.now(),
            dataSize: data.length,
            renderTime,
            memoryDelta
        });

        console.log(`📊 Tabla renderizada: ${data.length} registros en ${renderTime.toFixed(2)}ms`);
        console.log(`💾 Memoria adicional: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
        
        return {
            renderTime,
            memoryDelta,
            dataSize: data.length
        };
    }

    // Simular renderizado de tabla
    simulateTableRender(data) {
        // Simular el proceso de renderizado actual
        const tbody = this.table?.querySelector('tbody');
        if (!tbody) return;

        // Limpiar tabla
        tbody.innerHTML = '';
        
        // Renderizar filas
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.name || ''}</td>
                <td>${item.cedula || ''}</td>
                <td>${item.telefono || ''}</td>
                <td>${item.sexo || ''}</td>
                <td>${item.edad || ''}</td>
                <td>${item.ubch || ''}</td>
                <td>${item.community || ''}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Generar reporte de tabla
    generateTableReport() {
        const avgRenderTime = this.metrics.renderTimes.length > 0 ? this.metrics.renderTimes.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.renderTimes.length : 0;
        const avgMemoryDelta = this.metrics.renderTimes.length > 0 ? this.metrics.renderTimes.reduce((sum, m) => sum + m.memoryDelta, 0) / this.metrics.renderTimes.length : 0;
        
        return {
            totalRenders: this.metrics.renderTimes.length,
            avgRenderTime: avgRenderTime.toFixed(2) + "ms",
            avgMemoryDelta: (avgMemoryDelta / 1024 / 1024).toFixed(2) + "MB",
            maxDataSize: this.metrics.renderTimes.length > 0 ? Math.max(...this.metrics.renderTimes.map(m => m.dataSize)) : 0,
            performanceRating: this.getPerformanceRating(avgRenderTime)
        };
    }

    // Calificar rendimiento
    getPerformanceRating(avgRenderTime) {
        if (avgRenderTime < 1000) return "✅ EXCELENTE";
        if (avgRenderTime < 3000) return "🟡 ACEPTABLE";
        if (avgRenderTime < 5000) return "🟠 LENTO";
        return "❌ PROBLEMÁTICO";
    }
}

// Herramienta para analizar Firebase
class FirebaseAnalyzer {
    constructor() {
        this.metrics = {
            queries: [],
            writes: [],
            errors: []
        };
    }

    // Analizar consultas Firebase
    async analyzeFirebaseQueries() {
        if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
            console.warn('⚠️ Firebase no está disponible');
            return {
                totalQueries: 0,
                avgQueryTime: "0ms",
                totalErrors: 0,
                errorRate: "0%",
                queries: [],
                errors: []
            };
        }

        console.log('🔍 Analizando consultas Firebase...');

        // Probar diferentes tipos de consultas
        const queries = [
            {
                name: "Consulta completa",
                query: () => window.firebaseDB.votesCollection.get()
            },
            {
                name: "Consulta por usuario",
                query: () => window.firebaseDB.votesCollection.where('registeredBy', '==', 'test').get()
            },
            {
                name: "Consulta por cédula",
                query: () => window.firebaseDB.votesCollection.where('cedula', '==', '12345678').get()
            },
            {
                name: "Consulta por UBCH",
                query: () => window.firebaseDB.votesCollection.where('ubch', '==', 'TEST UBCH').get()
            }
        ];

        for (const queryTest of queries) {
            try {
                const startTime = performance.now();
                const result = await queryTest.query();
                const duration = performance.now() - startTime;

                this.metrics.queries.push({
                    name: queryTest.name,
                    duration,
                    resultSize: result.size,
                    timestamp: Date.now()
                });

                console.log(`📊 ${queryTest.name}: ${duration.toFixed(2)}ms (${result.size} resultados)`);
            } catch (error) {
                console.error(`❌ Error en ${queryTest.name}:`, error);
                this.metrics.errors.push({
                    query: queryTest.name,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        }
    }

    // Generar reporte Firebase
    generateFirebaseReport() {
        const avgQueryTime = this.metrics.queries.length > 0 ? this.metrics.queries.reduce((sum, q) => sum + q.duration, 0) / this.metrics.queries.length : 0;
        const totalQueries = this.metrics.queries.length;
        const totalErrors = this.metrics.errors.length;

        return {
            totalQueries,
            avgQueryTime: avgQueryTime.toFixed(2) + "ms",
            totalErrors,
            errorRate: totalQueries > 0 ? ((totalErrors / totalQueries) * 100).toFixed(2) + "%" : "0%",
            queries: this.metrics.queries,
            errors: this.metrics.errors
        };
    }
}

// Herramienta para generar datos de prueba
class TestDataGenerator {
    constructor() {
        this.testData = [];
    }

    // Generar datos de prueba
    generateTestData(size) {
        console.log(`🧪 Generando ${size} registros de prueba...`);
        
        this.testData = [];
        for (let i = 0; i < size; i++) {
            this.testData.push({
                id: `test-${i}`,
                name: `Usuario Test ${i}`,
                cedula: `${10000000 + i}`,
                telefono: `0412${Math.floor(1000000 + Math.random() * 8999999)}`,
                sexo: i % 2 === 0 ? 'M' : 'F',
                edad: 18 + (i % 50),
                ubch: `UBCH Test ${i % 5}`,
                community: `Comunidad Test ${i % 10}`,
                voted: Math.random() > 0.7,
                registeredAt: new Date().toISOString(),
                registeredBy: 'test-user'
            });
        }

        console.log(`✅ ${size} registros generados`);
        return this.testData;
    }

    // Generar datos de prueba para Firebase
    generateFirebaseTestData(size) {
        const data = this.generateTestData(size);
        return data.map(item => ({
            name: item.name,
            cedula: item.cedula,
            telefono: item.telefono,
            sexo: item.sexo,
            edad: item.edad,
            ubch: item.ubch,
            community: item.community,
            voted: item.voted,
            registeredAt: item.registeredAt,
            registeredBy: item.registeredBy,
            createdAt: new Date().toISOString()
        }));
    }
}

// Inicializar herramientas de análisis
window.performanceAnalyzer = new PerformanceAnalyzer();
window.tableAnalyzer = new TablePerformanceAnalyzer('registros-table');
window.firebaseAnalyzer = new FirebaseAnalyzer();
window.testDataGenerator = new TestDataGenerator();

// Función global para ejecutar análisis completo
window.runCompleteAnalysis = async function() {
    console.log('🔍 INICIANDO ANÁLISIS COMPLETO DEL SISTEMA');
    console.log('==========================================');

    try {
        // 1. Análisis de rendimiento de página
        console.log('\n📊 1. ANÁLISIS DE RENDIMIENTO DE PÁGINA');
        const pageReport = window.performanceAnalyzer.generateReport();
        console.log('Reporte de página:', pageReport);

        // 2. Análisis de tabla
        console.log('\n📊 2. ANÁLISIS DE TABLA');
        const testData = window.testDataGenerator.generateTestData(1000);
        const tableReport = window.tableAnalyzer.analyzeTableRender(testData);
        console.log('Reporte de tabla:', tableReport);

        // 3. Análisis de Firebase
        console.log('\n📊 3. ANÁLISIS DE FIREBASE');
        await window.firebaseAnalyzer.analyzeFirebaseQueries();
        const firebaseReport = window.firebaseAnalyzer.generateFirebaseReport();
        console.log('Reporte de Firebase:', firebaseReport);

        // 4. Resumen final
        console.log('\n📊 RESUMEN DEL ANÁLISIS');
        console.log('========================');
        console.log(`Tiempo de carga promedio: ${pageReport.avgLoadTime}`);
        console.log(`Tiempo de API promedio: ${pageReport.avgAPITime}`);
        console.log(`Tiempo de renderizado de tabla: ${tableReport.renderTime.toFixed(2)}ms`);
        console.log(`Memoria promedio: ${pageReport.avgMemory}`);
        console.log(`Tasa de errores: ${pageReport.errorRate}`);

        return {
            pageReport,
            tableReport,
            firebaseReport
        };
    } catch (error) {
        console.error('❌ Error durante el análisis:', error);
        throw error;
    }
};

console.log('✅ Herramientas de análisis cargadas');
console.log('💡 Ejecuta: window.runCompleteAnalysis() para análisis completo'); 