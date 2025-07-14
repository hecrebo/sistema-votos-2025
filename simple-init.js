// simple-init.js
// Inicialización simple y segura del sistema de votos

console.log('🚀 Iniciando inicialización simple del sistema...');

// Función para inicializar el sistema de manera segura
function initializeSystemSafely() {
    console.log('🔍 Verificando estado del sistema...');
    
    // Verificar si ya está inicializado
    if (window.votingSystemInitialized) {
        console.log('⚠️ Sistema ya inicializado, evitando duplicación');
        return;
    }
    
    // Verificar si VotingSystemFirebase está disponible
    if (typeof VotingSystemFirebase === 'undefined') {
        console.error('❌ VotingSystemFirebase no está disponible');
        console.log('🔧 Intentando cargar desde voting-system-unified.js...');
        
        // Crear una instancia básica si no está disponible
        if (typeof VotingSystem !== 'undefined') {
            console.log('✅ VotingSystem disponible, creando instancia básica...');
            window.votingSystem = new VotingSystem();
            window.votingSystemInitialized = true;
            console.log('✅ Sistema básico inicializado');
        } else {
            console.error('❌ Ni VotingSystem ni VotingSystemFirebase están disponibles');
            return;
        }
    } else {
        console.log('✅ VotingSystemFirebase disponible, creando instancia...');
        try {
            window.votingSystem = new VotingSystemFirebase();
            window.votingSystemInitialized = true;
            console.log('✅ Sistema Firebase inicializado correctamente');
        } catch (error) {
            console.error('❌ Error creando VotingSystemFirebase:', error);
            // Fallback a sistema básico
            if (typeof VotingSystem !== 'undefined') {
                console.log('🔄 Intentando fallback a VotingSystem...');
                window.votingSystem = new VotingSystem();
                window.votingSystemInitialized = true;
                console.log('✅ Sistema básico inicializado como fallback');
            }
        }
    }
    
    // Verificar que el sistema se creó correctamente
    if (window.votingSystem) {
        console.log('✅ Sistema de votos creado correctamente');
        console.log('📊 Estado del sistema:', {
            votesCount: window.votingSystem.votes ? window.votingSystem.votes.length : 0,
            ubchConfigLoaded: !!window.votingSystem.ubchToCommunityMap,
            currentUser: window.votingSystem.getCurrentUser ? window.votingSystem.getCurrentUser() : null
        });
    } else {
        console.error('❌ No se pudo crear el sistema de votos');
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystemSafely);
} else {
    // DOM ya está listo
    initializeSystemSafely();
}

// También inicializar después de un pequeño delay para asegurar que todos los scripts estén cargados
setTimeout(initializeSystemSafely, 1000);

console.log('📋 Script de inicialización simple cargado'); 