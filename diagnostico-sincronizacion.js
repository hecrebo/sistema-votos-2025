// diagnostico-sincronizacion.js
// Diagnóstico específico para problemas de sincronización y funcionalidad

console.log('🔍 Iniciando diagnóstico de sincronización...');

// Función para diagnosticar problemas específicos
function diagnosticarSincronizacion() {
    console.log('📊 === DIAGNÓSTICO DE SINCRONIZACIÓN ===');
    
    const problemas = [];
    const exitos = [];
    
    // 1. Verificar sistema de votos
    if (!window.votingSystem) {
        problemas.push('❌ Sistema de votos no disponible');
    } else {
        exitos.push('✅ Sistema de votos disponible');
        
        // Verificar métodos específicos
        const metodosRequeridos = [
            'handleRegistration',
            'handleCheckIn', 
            'renderVotesTable',
            'renderDashboardPage',
            'renderStatisticsPage',
            'navigateToPage',
            'setupEventListeners'
        ];
        
        metodosRequeridos.forEach(metodo => {
            if (typeof window.votingSystem[metodo] === 'function') {
                exitos.push(`✅ Método ${metodo} disponible`);
            } else {
                problemas.push(`❌ Método ${metodo} no disponible`);
            }
        });
    }
    
    // 2. Verificar Firebase
    if (!window.firebaseDB) {
        problemas.push('❌ Firebase DB no disponible');
    } else {
        exitos.push('✅ Firebase DB disponible');
        
        if (window.firebaseDB.isAvailable) {
            exitos.push('✅ Firebase conectado');
        } else {
            problemas.push('⚠️ Firebase en modo offline');
        }
    }
    
    // 3. Verificar elementos DOM críticos
    const elementosCriticos = [
        { id: 'registration-form', nombre: 'Formulario de registro' },
        { id: 'check-in-form', nombre: 'Formulario de confirmación' },
        { id: 'registros-table', nombre: 'Tabla de registros' },
        { id: 'nav-registration', nombre: 'Botón registro' },
        { id: 'nav-check-in', nombre: 'Botón confirmar voto' },
        { id: 'nav-listado', nombre: 'Botón listado' },
        { id: 'nav-dashboard', nombre: 'Botón totales' },
        { id: 'nav-statistics', nombre: 'Botón estadísticas' }
    ];
    
    elementosCriticos.forEach(elemento => {
        const el = document.getElementById(elemento.id);
        if (el) {
            exitos.push(`✅ ${elemento.nombre} encontrado`);
        } else {
            problemas.push(`❌ ${elemento.nombre} no encontrado`);
        }
    });
    
    // 4. Verificar event listeners
    try {
        const form = document.getElementById('registration-form');
        if (form && form.onsubmit) {
            exitos.push('✅ Event listener de registro configurado');
        } else {
            problemas.push('❌ Event listener de registro no configurado');
        }
    } catch (error) {
        problemas.push(`❌ Error verificando event listeners: ${error.message}`);
    }
    
    // 5. Verificar datos locales
    try {
        const localVotes = localStorage.getItem('localVotes');
        const currentUser = localStorage.getItem('currentUser');
        
        if (localVotes) {
            const votes = JSON.parse(localVotes);
            exitos.push(`✅ ${votes.length} votos en localStorage`);
        } else {
            exitos.push('✅ localStorage vacío (normal)');
        }
        
        if (currentUser) {
            exitos.push('✅ Usuario configurado');
        } else {
            problemas.push('❌ Usuario no configurado');
        }
    } catch (error) {
        problemas.push(`❌ Error verificando localStorage: ${error.message}`);
    }
    
    // Mostrar resultados
    console.log('\n📊 === RESUMEN ===');
    console.log('✅ ÉXITOS:');
    exitos.forEach(exito => console.log(exito));
    
    if (problemas.length > 0) {
        console.log('\n❌ PROBLEMAS:');
        problemas.forEach(problema => console.log(problema));
    }
    
    return problemas.length === 0;
}

// Función para reparar problemas comunes
function repararProblemasComunes() {
    console.log('\n🔧 === REPARACIÓN AUTOMÁTICA ===');
    
    // 1. Configurar event listeners si no existen
    try {
        const form = document.getElementById('registration-form');
        if (form && !form.onsubmit && window.votingSystem && window.votingSystem.handleRegistration) {
            form.onsubmit = (e) => {
                e.preventDefault();
                window.votingSystem.handleRegistration();
            };
            console.log('✅ Event listener de registro reparado');
        }
    } catch (error) {
        console.error('❌ Error reparando event listener:', error);
    }
    
    // 2. Configurar navegación si no funciona
    try {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            if (!btn.onclick) {
                const page = btn.dataset.page;
                if (page && window.votingSystem && window.votingSystem.navigateToPage) {
                    btn.onclick = () => window.votingSystem.navigateToPage(page);
                }
            }
        });
        console.log('✅ Navegación reparada');
    } catch (error) {
        console.error('❌ Error reparando navegación:', error);
    }
    
    // 3. Inicializar sistema si no está inicializado
    if (window.votingSystem && !window.votingSystemInitialized) {
        try {
            window.votingSystem.init();
            window.votingSystemInitialized = true;
            console.log('✅ Sistema inicializado');
        } catch (error) {
            console.error('❌ Error inicializando sistema:', error);
        }
    }
}

// Función para probar funcionalidades
function probarFuncionalidades() {
    console.log('\n🧪 === PRUEBAS DE FUNCIONALIDAD ===');
    
    const pruebas = [];
    
    // Probar registro
    try {
        const form = document.getElementById('registration-form');
        if (form) {
            const nameInput = form.querySelector('#name');
            const cedulaInput = form.querySelector('#cedula');
            if (nameInput && cedulaInput) {
                pruebas.push('✅ Formulario de registro completo');
            } else {
                pruebas.push('❌ Formulario de registro incompleto');
            }
        } else {
            pruebas.push('❌ Formulario de registro no encontrado');
        }
    } catch (error) {
        pruebas.push(`❌ Error en formulario: ${error.message}`);
    }
    
    // Probar navegación
    try {
        const navButtons = document.querySelectorAll('.nav-btn');
        if (navButtons.length > 0) {
            pruebas.push(`✅ ${navButtons.length} botones de navegación`);
        } else {
            pruebas.push('❌ No hay botones de navegación');
        }
    } catch (error) {
        pruebas.push(`❌ Error en navegación: ${error.message}`);
    }
    
    // Probar sistema de votos
    try {
        if (window.votingSystem) {
            pruebas.push('✅ Sistema de votos disponible');
            if (window.votingSystem.votes) {
                pruebas.push(`✅ ${window.votingSystem.votes.length} votos cargados`);
            }
        } else {
            pruebas.push('❌ Sistema de votos no disponible');
        }
    } catch (error) {
        pruebas.push(`❌ Error en sistema: ${error.message}`);
    }
    
    console.log('📋 Resultados de pruebas:');
    pruebas.forEach(prueba => console.log(prueba));
}

// Ejecutar diagnóstico completo
setTimeout(() => {
    const sistemaOK = diagnosticarSincronizacion();
    
    if (!sistemaOK) {
        console.log('\n🔧 Intentando reparación automática...');
        repararProblemasComunes();
        
        // Volver a diagnosticar después de la reparación
        setTimeout(() => {
            console.log('\n🔍 Re-diagnóstico después de reparación...');
            diagnosticarSincronizacion();
            probarFuncionalidades();
        }, 1000);
    } else {
        probarFuncionalidades();
    }
}, 1500);

console.log('📋 Script de diagnóstico de sincronización cargado'); 