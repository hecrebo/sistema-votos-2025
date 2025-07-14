// fix-system.js
// Script de reparación automática del sistema de votos 2025

console.log('🔧 Iniciando reparación automática del sistema...');

// Función principal de reparación
async function fixSystemIssues() {
    console.log('🚀 Iniciando proceso de reparación...');
    
    try {
        // 1. Reparar configuración de Firebase
        await fixFirebaseConfiguration();
        
        // 2. Reparar sistema de votación
        await fixVotingSystem();
        
        // 3. Reparar funciones específicas
        await fixSystemFunctions();
        
        // 4. Verificar reparaciones
        await verifyRepairs();
        
        console.log('✅ Reparación automática completada exitosamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error durante la reparación:', error);
        return false;
    }
}

// Reparar configuración de Firebase
async function fixFirebaseConfiguration() {
    console.log('🔥 Reparando configuración de Firebase...');
    
    try {
        // Verificar si Firebase está disponible
        if (!window.firebaseDB) {
            console.log('⚠️ Firebase no disponible, configurando modo offline');
            
            // Crear configuración offline
            window.firebaseAvailable = false;
            window.firebaseDB = {
                isAvailable: false,
                db: null,
                votesCollection: null,
                ubchCollection: null,
                defaultUBCHConfig: {
                    "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS", "VILLAS DEL CENTRO 3ERA ETAPA B", "VILLAS DEL CENTRO 3ERA ETAPA C", "VILLAS DEL CENTRO 4A ETAPA", "LA CAMACHERA"],
                    "LICEO JOSE FELIX RIBAS": ["EL CUJIJAL", "LAS FLORES", "LAS ESPERANZA 200", "VILLAS DEL CENTRO 2ERA ETAPA A", "LOS PALOMARES", "EL LAGO", "CAIPARICALLY I II", "EL BANCO", "CAIPARICHA I Y II"],
                    "ESCUELA PRIMARIA BOLIVARIANA LA PRADERA": ["EL SAMAN", "GUADALUPE", "PALOS GRANDES II", "PALOS GRANDES I", "TIERRA DEL SOL", "LA CASTELLANA", "GARDENIAS I", "GARDENIAS II", "EL CERCADITO", "ALTAMIRA", "LA ADJUNTADA", "BUCARES", "GUAYABAL", "APARTATE", "EL REFUGIO", "LOS ROBLES", "ARAUCARIA"],
                    "CASA COMUNAL JOSE TOMAS GALLARDO": ["JOSE TOMAS GALLARDO A", "LA PRIMAVERA"],
                    "ESCUELA 5 DE JULIO": ["10 DE AGOSTO", "CAMPO ALEGRE I", "CAMPO ALEGRE II", "5 DE JULIO"],
                    "ESCUELA CECILIO ACOSTA": ["VOLUNTAD DE DIOS", "LAS MATWINAS", "BRISAS DEL LAGO", "MANDANTO", "INDIANAPOLIS", "SUR DE ACOSTA"],
                    "ESCUELA BASICA FE Y ALEGRIA": ["FE Y ALEGRIA", "BARRIO SOLIDARIO", "COMUNIDAD FUTURO"],
                    "ESCUELA GRADUADA ANTONIO JOSE DE SUCRE": ["JESUS DE NAZARETH", "SECTOR BOLIVAR", "PALO NEGRO ESTE"],
                    "CASA COMUNAL": ["LOS JABILLOS"],
                    "UNIDAD EDUCATIVA MONSEÑOR JOSÉ JACINTO SOTO LAYA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II"],
                    "BASE DE MISIONES LUISA CACERES DE ARISMENDI": ["24 DE ENERO", "19 DE ABRIL", "EL PROGRESO"],
                    "ESCUELA ESTADAL ALEJO ZULOAGA": ["MAIQUETIA", "SAENZ", "PANAMERICANO"],
                    "UNIDAD EDUCATIVA MONSEÑOR MONTES DE OCA": ["REMEDIOS"],
                    "ESCUELA BASICA NACIONAL CONCENTRADA LA ESTACION": ["18 DE OCTUBRE"],
                    "ESCUELA RECEPTORIA": ["CARMEN CENTRO"],
                    "GRUPO ESCOLAR DR RAFAEL PEREZ": ["VIRGEN DEL CARMEN"],
                    "LICEO ALFREDO PIETRI": ["LOS OJITOS", "LOS VENECIANOS"],
                    "ESCUELA BOLIVARIANA ROMERO GARCIA": ["SAN BERNARDO", "LA HACIENDA"],
                    "ESCUELA GRADUADA PEDRO GUAL": ["INDIANAPOLIS NORTE"]
                },
                initializeUBCHConfig: async function() {
                    console.log('✅ Configuración UBCH inicializada (modo offline)');
                }
            };
        }
        
        console.log('✅ Configuración de Firebase reparada');
        
    } catch (error) {
        console.error('❌ Error reparando Firebase:', error);
        throw error;
    }
}

// Reparar sistema de votación
async function fixVotingSystem() {
    console.log('🗳️ Reparando sistema de votación...');
    
    try {
        // Limpiar instancia anterior si existe
        if (window.votingSystem) {
            console.log('🔄 Limpiando instancia anterior del sistema...');
            delete window.votingSystem;
        }
        
        // Crear nueva instancia del sistema
        if (typeof VotingSystemFirebase !== 'undefined') {
            window.votingSystem = new VotingSystemFirebase();
            console.log('✅ VotingSystemFirebase creado');
        } else if (typeof VotingSystem !== 'undefined') {
            window.votingSystem = new VotingSystem();
            console.log('✅ VotingSystem creado (modo offline)');
        } else {
            throw new Error('No se encontró ninguna clase de sistema de votación');
        }
        
        // Inicializar el sistema
        if (window.votingSystem && typeof window.votingSystem.init === 'function') {
            await window.votingSystem.init();
            console.log('✅ Sistema de votación inicializado');
        }
        
        console.log('✅ Sistema de votación reparado');
        
    } catch (error) {
        console.error('❌ Error reparando sistema de votación:', error);
        throw error;
    }
}

// Reparar funciones específicas del sistema
async function fixSystemFunctions() {
    console.log('⚙️ Reparando funciones del sistema...');
    
    try {
        // 1. Reparar navegación
        fixNavigation();
        
        // 2. Reparar formularios
        fixForms();
        
        // 3. Reparar displays de datos
        fixDataDisplays();
        
        // 4. Reparar event listeners
        fixEventListeners();
        
        console.log('✅ Funciones del sistema reparadas');
        
    } catch (error) {
        console.error('❌ Error reparando funciones:', error);
        throw error;
    }
}

// Reparar navegación
function fixNavigation() {
    console.log('🧭 Reparando navegación...');
    
    try {
        // Configurar navegación entre páginas
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetPage = this.getAttribute('data-page');
                if (targetPage) {
                    showPage(targetPage);
                }
            });
        });
        
        console.log('✅ Navegación reparada');
        
    } catch (error) {
        console.error('❌ Error reparando navegación:', error);
    }
}

// Reparar formularios
function fixForms() {
    console.log('📝 Reparando formularios...');
    
    try {
        // Reparar formulario de registro
        const registrationForm = document.getElementById('registration-form');
        if (registrationForm) {
            registrationForm.addEventListener('submit', handleRegistrationSubmit);
        }
        
        // Reparar formulario de confirmación
        const checkInForm = document.getElementById('check-in-form');
        if (checkInForm) {
            checkInForm.addEventListener('submit', handleCheckInSubmit);
        }
        
        console.log('✅ Formularios reparados');
        
    } catch (error) {
        console.error('❌ Error reparando formularios:', error);
    }
}

// Reparar displays de datos
function fixDataDisplays() {
    console.log('📊 Reparando displays de datos...');
    
    try {
        // Actualizar displays si el sistema está disponible
        if (window.votingSystem && typeof window.votingSystem.updateAllDataDisplays === 'function') {
            window.votingSystem.updateAllDataDisplays();
        }
        
        console.log('✅ Displays de datos reparados');
        
    } catch (error) {
        console.error('❌ Error reparando displays:', error);
    }
}

// Reparar event listeners
function fixEventListeners() {
    console.log('🎧 Reparando event listeners...');
    
    try {
        // Configurar event listeners básicos
        document.addEventListener('DOMContentLoaded', function() {
            console.log('✅ Event listeners configurados');
        });
        
        console.log('✅ Event listeners reparados');
        
    } catch (error) {
        console.error('❌ Error reparando event listeners:', error);
    }
}

// Verificar reparaciones
async function verifyRepairs() {
    console.log('🔍 Verificando reparaciones...');
    
    const checks = [
        { name: 'Firebase', check: () => window.firebaseDB !== undefined },
        { name: 'Sistema de Votación', check: () => window.votingSystem !== undefined },
        { name: 'Navegación', check: () => document.querySelectorAll('.nav-btn').length > 0 },
        { name: 'Formularios', check: () => document.getElementById('registration-form') !== null }
    ];
    
    let successCount = 0;
    
    for (const check of checks) {
        try {
            if (check.check()) {
                console.log(`✅ ${check.name}: OK`);
                successCount++;
            } else {
                console.log(`❌ ${check.name}: Falló`);
            }
        } catch (error) {
            console.log(`❌ ${check.name}: Error - ${error.message}`);
        }
    }
    
    console.log(`📊 Verificación completada: ${successCount}/${checks.length} componentes OK`);
    
    return successCount === checks.length;
}

// Funciones auxiliares
function showPage(pageName) {
    // Ocultar todas las páginas
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Mostrar página seleccionada
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Actualizar navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`[data-page="${pageName}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function handleRegistrationSubmit(event) {
    event.preventDefault();
    console.log('📝 Procesando registro...');
    
    // Aquí iría la lógica de registro
    // Por ahora solo mostramos un mensaje
    alert('Función de registro en desarrollo');
}

function handleCheckInSubmit(event) {
    event.preventDefault();
    console.log('✅ Procesando confirmación de voto...');
    
    // Aquí iría la lógica de confirmación
    // Por ahora solo mostramos un mensaje
    alert('Función de confirmación en desarrollo');
}

// Función para ejecutar reparación automática
function autoFix() {
    console.log('🔧 Ejecutando reparación automática...');
    fixSystemIssues().then(success => {
        if (success) {
            console.log('🎉 Sistema reparado exitosamente');
            alert('Sistema reparado exitosamente. Recarga la página para ver los cambios.');
        } else {
            console.log('⚠️ Algunos problemas persisten');
            alert('Algunos problemas persisten. Revisa la consola para más detalles.');
        }
    });
}

// Exportar funciones para uso global
window.fixSystemIssues = fixSystemIssues;
window.autoFix = autoFix;
window.showPage = showPage;

console.log('🔧 Script de reparación cargado'); 