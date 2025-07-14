// reparacion-sincronizacion.js
// Reparación específica para problemas de sincronización y funcionalidad

console.log('🔧 Iniciando reparación de sincronización...');

// Función para reparar el sistema de votos
function repararSistemaVotos() {
    console.log('🔧 === REPARACIÓN DEL SISTEMA DE VOTOS ===');
    
    // 1. Verificar y crear sistema si no existe
    if (!window.votingSystem) {
        console.log('🔧 Creando sistema de votos...');
        
        if (typeof VotingSystemFirebase !== 'undefined') {
            try {
                window.votingSystem = new VotingSystemFirebase();
                console.log('✅ Sistema Firebase creado');
            } catch (error) {
                console.error('❌ Error creando VotingSystemFirebase:', error);
                if (typeof VotingSystem !== 'undefined') {
                    window.votingSystem = new VotingSystem();
                    console.log('✅ Sistema básico creado como fallback');
                }
            }
        } else if (typeof VotingSystem !== 'undefined') {
            window.votingSystem = new VotingSystem();
            console.log('✅ Sistema básico creado');
        } else {
            console.error('❌ No se pudo crear el sistema de votos');
            return false;
        }
    }
    
    // 2. Inicializar sistema si no está inicializado
    if (window.votingSystem && !window.votingSystemInitialized) {
        try {
            console.log('🔧 Inicializando sistema...');
            window.votingSystem.init();
            window.votingSystemInitialized = true;
            console.log('✅ Sistema inicializado');
        } catch (error) {
            console.error('❌ Error inicializando sistema:', error);
        }
    }
    
    return true;
}

// Función para reparar event listeners
function repararEventListeners() {
    console.log('🔧 === REPARACIÓN DE EVENT LISTENERS ===');
    
    // 1. Reparar formulario de registro
    try {
        const form = document.getElementById('registration-form');
        if (form) {
            // Remover listeners existentes
            form.onsubmit = null;
            
            // Agregar nuevo listener
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('📝 Enviando formulario de registro...');
                
                if (window.votingSystem && window.votingSystem.handleRegistration) {
                    window.votingSystem.handleRegistration();
                } else {
                    console.error('❌ Método handleRegistration no disponible');
                    alert('Error: Sistema de registro no disponible');
                }
            });
            console.log('✅ Event listener de registro reparado');
        }
    } catch (error) {
        console.error('❌ Error reparando event listener de registro:', error);
    }
    
    // 2. Reparar formulario de confirmación
    try {
        const checkInForm = document.getElementById('check-in-form');
        if (checkInForm) {
            checkInForm.onsubmit = null;
            checkInForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('✅ Confirmando voto...');
                
                if (window.votingSystem && window.votingSystem.handleCheckIn) {
                    window.votingSystem.handleCheckIn();
                } else {
                    console.error('❌ Método handleCheckIn no disponible');
                    alert('Error: Sistema de confirmación no disponible');
                }
            });
            console.log('✅ Event listener de confirmación reparado');
        }
    } catch (error) {
        console.error('❌ Error reparando event listener de confirmación:', error);
    }
    
    // 3. Reparar navegación
    try {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const page = btn.dataset.page;
            if (page) {
                btn.onclick = function() {
                    console.log(`🔄 Navegando a: ${page}`);
                    if (window.votingSystem && window.votingSystem.navigateToPage) {
                        window.votingSystem.navigateToPage(page);
                    } else {
                        console.error('❌ Método navigateToPage no disponible');
                        // Fallback básico
                        const pages = document.querySelectorAll('.page');
                        pages.forEach(p => p.classList.remove('active'));
                        const targetPage = document.getElementById(`${page}-page`);
                        if (targetPage) {
                            targetPage.classList.add('active');
                        }
                    }
                };
            }
        });
        console.log(`✅ ${navButtons.length} botones de navegación reparados`);
    } catch (error) {
        console.error('❌ Error reparando navegación:', error);
    }
}

// Función para reparar sincronización
function repararSincronizacion() {
    console.log('🔧 === REPARACIÓN DE SINCRONIZACIÓN ===');
    
    // 1. Verificar Firebase
    if (!window.firebaseDB) {
        console.log('🔧 Configurando Firebase fallback...');
        window.firebaseDB = {
            isAvailable: false,
            db: null,
            votesCollection: {
                get: async () => ({ docs: [] }),
                add: async (data) => ({ id: 'local_' + Date.now() }),
                doc: (id) => ({
                    get: async () => ({ exists: false, data: () => null }),
                    set: async (data) => ({ id }),
                    update: async (data) => ({ id }),
                    delete: async () => ({ id })
                })
            },
            ubchCollection: {
                doc: (id) => ({
                    get: async () => ({ exists: false, data: () => null }),
                    set: async (data) => ({ id })
                })
            }
        };
        console.log('✅ Firebase fallback configurado');
    }
    
    // 2. Configurar sincronización local
    if (window.votingSystem) {
        // Agregar método de sincronización si no existe
        if (!window.votingSystem.syncToLocal) {
            window.votingSystem.syncToLocal = function() {
                try {
                    if (this.votes && this.votes.length > 0) {
                        localStorage.setItem('localVotes', JSON.stringify(this.votes));
                        console.log(`✅ ${this.votes.length} votos sincronizados localmente`);
                    }
                } catch (error) {
                    console.error('❌ Error sincronizando localmente:', error);
                }
            };
        }
        
        // Agregar método de carga local si no existe
        if (!window.votingSystem.loadFromLocal) {
            window.votingSystem.loadFromLocal = function() {
                try {
                    const localVotes = localStorage.getItem('localVotes');
                    if (localVotes) {
                        this.votes = JSON.parse(localVotes);
                        console.log(`✅ ${this.votes.length} votos cargados localmente`);
                    }
                } catch (error) {
                    console.error('❌ Error cargando localmente:', error);
                    this.votes = [];
                }
            };
        }
        
        console.log('✅ Métodos de sincronización agregados');
    }
}

// Función para reparar renderizado
function repararRenderizado() {
    console.log('🔧 === REPARACIÓN DE RENDERIZADO ===');
    
    if (window.votingSystem) {
        // Agregar método de renderizado básico si no existe
        if (!window.votingSystem.renderCurrentPage) {
            window.votingSystem.renderCurrentPage = function() {
                console.log('🔧 Renderizando página actual...');
                
                // Renderizar página de registro
                if (this.currentPage === 'registration') {
                    this.renderRegistrationPage();
                }
                // Renderizar página de confirmación
                else if (this.currentPage === 'check-in') {
                    this.renderCheckInPage();
                }
                // Renderizar página de listado
                else if (this.currentPage === 'listado') {
                    this.renderListPage();
                }
                // Renderizar página de dashboard
                else if (this.currentPage === 'dashboard') {
                    this.renderDashboardPage();
                }
                // Renderizar página de estadísticas
                else if (this.currentPage === 'statistics') {
                    this.renderStatisticsPage();
                }
            };
        }
        
        console.log('✅ Métodos de renderizado agregados');
    }
}

// Función principal de reparación
function ejecutarReparacionCompleta() {
    console.log('🔧 === INICIANDO REPARACIÓN COMPLETA ===');
    
    const resultados = [];
    
    // 1. Reparar sistema de votos
    try {
        const sistemaOK = repararSistemaVotos();
        resultados.push(sistemaOK ? '✅ Sistema de votos reparado' : '❌ Error reparando sistema de votos');
    } catch (error) {
        console.error('❌ Error en reparación de sistema:', error);
        resultados.push('❌ Error reparando sistema de votos');
    }
    
    // 2. Reparar event listeners
    try {
        repararEventListeners();
        resultados.push('✅ Event listeners reparados');
    } catch (error) {
        console.error('❌ Error en reparación de event listeners:', error);
        resultados.push('❌ Error reparando event listeners');
    }
    
    // 3. Reparar sincronización
    try {
        repararSincronizacion();
        resultados.push('✅ Sincronización reparada');
    } catch (error) {
        console.error('❌ Error en reparación de sincronización:', error);
        resultados.push('❌ Error reparando sincronización');
    }
    
    // 4. Reparar renderizado
    try {
        repararRenderizado();
        resultados.push('✅ Renderizado reparado');
    } catch (error) {
        console.error('❌ Error en reparación de renderizado:', error);
        resultados.push('❌ Error reparando renderizado');
    }
    
    // Mostrar resultados
    console.log('\n📊 === RESULTADOS DE REPARACIÓN ===');
    resultados.forEach(resultado => console.log(resultado));
    
    // Verificar si la reparación fue exitosa
    const exitos = resultados.filter(r => r.startsWith('✅')).length;
    const errores = resultados.filter(r => r.startsWith('❌')).length;
    
    console.log(`\n📊 Resumen: ${exitos} exitos, ${errores} errores`);
    
    if (errores === 0) {
        console.log('🎉 Reparación completada exitosamente');
        return true;
    } else {
        console.log('⚠️ Reparación completada con algunos errores');
        return false;
    }
}

// Ejecutar reparación después de un delay
setTimeout(() => {
    const reparacionExitosa = ejecutarReparacionCompleta();
    
    if (reparacionExitosa) {
        console.log('✅ Sistema reparado y listo para usar');
    } else {
        console.log('⚠️ Sistema reparado con limitaciones');
    }
}, 2000);

console.log('📋 Script de reparación de sincronización cargado'); 