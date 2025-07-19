// debug-verifier.js
// Herramientas de debugging para el sistema de verificadores

console.log('🔧 Cargando herramientas de debugging para verificadores...');

// Función para diagnosticar el problema de confirmaciones
function debugVerifierConfirmations() {
    console.log('🔍 === DIAGNÓSTICO DE CONFIRMACIONES DEL VERIFICADOR ===');
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log('👤 Usuario actual:', currentUser);
    
    if (!window.votingSystem) {
        console.error('❌ Sistema de votos no disponible');
        return;
    }
    
    const system = window.votingSystem;
    console.log('📊 Total de votos en el sistema:', system.votes.length);
    
    // Contar votos confirmados
    const votosConfirmados = system.votes.filter(vote => vote.voted === true);
    console.log('✅ Votos confirmados (voted = true):', votosConfirmados.length);
    
    // Verificar confirmaciones del usuario actual
    const confirmacionesUsuario = system.votes.filter(vote => 
        vote.voted === true && 
        vote.confirmedBy === currentUser.username
    );
    console.log('🎯 Confirmaciones del usuario actual:', confirmacionesUsuario.length);
    
    // Verificar campo fechaConfirmacion
    const votosConFecha = system.votes.filter(vote => vote.fechaConfirmacion);
    console.log('📅 Votos con fechaConfirmacion:', votosConFecha.length);
    
    // Verificar campo voteTimestamp
    const votosConTimestamp = system.votes.filter(vote => vote.voteTimestamp);
    console.log('⏰ Votos con voteTimestamp:', votosConTimestamp.length);
    
    // Mostrar detalles de las confirmaciones del usuario
    if (confirmacionesUsuario.length > 0) {
        console.log('📋 Detalles de confirmaciones del usuario:');
        confirmacionesUsuario.forEach((conf, index) => {
            console.log(`  ${index + 1}. ID: ${conf.id}, Nombre: ${conf.name}, Fecha: ${conf.fechaConfirmacion}, Timestamp: ${conf.voteTimestamp}`);
        });
    } else {
        console.log('⚠️ No se encontraron confirmaciones del usuario actual');
    }
    
    // Verificar si hay votos confirmados pero sin confirmedBy
    const votosSinConfirmador = system.votes.filter(vote => 
        vote.voted === true && 
        (!vote.confirmedBy || vote.confirmedBy === '')
    );
    console.log('❓ Votos confirmados sin confirmedBy:', votosSinConfirmador.length);
    
    // Verificar votos del día actual
    const hoy = new Date();
    const votosHoy = system.votes.filter(vote => 
        vote.voted === true && 
        vote.fechaConfirmacion && 
        system.isSameDay(new Date(vote.fechaConfirmacion), hoy)
    );
    console.log('📅 Votos confirmados hoy:', votosHoy.length);
    
    return {
        totalVotes: system.votes.length,
        confirmedVotes: votosConfirmados.length,
        userConfirmations: confirmacionesUsuario.length,
        votesWithDate: votosConFecha.length,
        votesWithTimestamp: votosConTimestamp.length,
        votesWithoutConfirmer: votosSinConfirmador.length,
        todayConfirmations: votosHoy.length
    };
}

// Función para forzar la actualización del dashboard del verificador
function forceUpdateVerifierDashboard() {
    console.log('🔄 Forzando actualización del dashboard del verificador...');
    
    if (!window.votingSystem) {
        console.error('❌ Sistema de votos no disponible');
        return;
    }
    
    const system = window.votingSystem;
    
    // Recargar datos desde Firebase
    system.loadDataFromFirebase().then(() => {
        console.log('✅ Datos recargados desde Firebase');
        
        // Renderizar dashboard
        system.renderVerifierDashboard();
        
        // Renderizar historial
        system.renderVerifierHistory();
        
        console.log('✅ Dashboard y historial actualizados');
    }).catch(error => {
        console.error('❌ Error recargando datos:', error);
    });
}

// Función para simular una confirmación de voto
function simulateVoteConfirmation() {
    console.log('🧪 Simulando confirmación de voto...');
    
    if (!window.votingSystem) {
        console.error('❌ Sistema de votos no disponible');
        return;
    }
    
    const system = window.votingSystem;
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Buscar un voto no confirmado
    const votoPendiente = system.votes.find(vote => !vote.voted);
    
    if (!votoPendiente) {
        console.log('⚠️ No hay votos pendientes para confirmar');
        return;
    }
    
    console.log('🎯 Confirmando voto:', votoPendiente);
    
    // Confirmar el voto
    system.confirmVote(votoPendiente.id).then(() => {
        console.log('✅ Voto confirmado exitosamente');
        
        // Actualizar dashboard
        setTimeout(() => {
            system.renderVerifierDashboard();
            system.renderVerifierHistory();
        }, 1000);
    }).catch(error => {
        console.error('❌ Error confirmando voto:', error);
    });
}

// Función para verificar la sincronización con Firebase
function checkFirebaseSync() {
    console.log('🔄 Verificando sincronización con Firebase...');
    
    if (!window.firebaseDB) {
        console.error('❌ Firebase no está disponible');
        return;
    }
    
    // Verificar conexión
    window.firebaseDB.votesCollection.limit(1).get().then(snapshot => {
        console.log('✅ Conexión a Firebase exitosa');
        console.log('📊 Documentos en Firebase:', snapshot.size);
        
        // Verificar documentos confirmados
        window.firebaseDB.votesCollection.where('voted', '==', true).get().then(confirmedSnapshot => {
            console.log('✅ Votos confirmados en Firebase:', confirmedSnapshot.size);
            
            // Verificar confirmaciones del usuario actual
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            window.firebaseDB.votesCollection
                .where('voted', '==', true)
                .where('confirmedBy', '==', currentUser.username)
                .get().then(userConfirmations => {
                    console.log('🎯 Confirmaciones del usuario en Firebase:', userConfirmations.size);
                });
        });
    }).catch(error => {
        console.error('❌ Error conectando a Firebase:', error);
    });
}

// Función para limpiar datos de confirmación corruptos
function cleanCorruptedConfirmations() {
    console.log('🧹 Limpiando confirmaciones corruptas...');
    
    if (!window.votingSystem) {
        console.error('❌ Sistema de votos no disponible');
        return;
    }
    
    const system = window.votingSystem;
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Encontrar votos confirmados sin confirmedBy
    const votosCorruptos = system.votes.filter(vote => 
        vote.voted === true && 
        (!vote.confirmedBy || vote.confirmedBy === '')
    );
    
    console.log('🔧 Votos corruptos encontrados:', votosCorruptos.length);
    
    if (votosCorruptos.length > 0) {
        const confirmacion = confirm(`Se encontraron ${votosCorruptos.length} votos confirmados sin verificador. ¿Deseas asignarlos al usuario actual?`);
        
        if (confirmacion) {
            votosCorruptos.forEach(voto => {
                // Actualizar en Firebase
                system.updateVoteInFirebase(voto.id, {
                    confirmedBy: currentUser.username,
                    updatedAt: new Date().toISOString()
                });
                
                // Actualizar localmente
                const voteIndex = system.votes.findIndex(v => v.id === vote.id);
                if (voteIndex !== -1) {
                    system.votes[voteIndex].confirmedBy = currentUser.username;
                }
            });
            
            console.log('✅ Votos corruptos corregidos');
            
            // Actualizar dashboard
            setTimeout(() => {
                system.renderVerifierDashboard();
                system.renderVerifierHistory();
            }, 1000);
        }
    }
}

// Función para mostrar estadísticas detalladas
function showDetailedStats() {
    const stats = debugVerifierConfirmations();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    `;
    
    modalContent.innerHTML = `
        <button onclick="this.closest('.debug-modal').remove()" style="
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
        ">×</button>
        <h3 style="margin-bottom: 1rem; color: #2c3e50;">📊 Estadísticas Detalladas del Verificador</h3>
        <div style="font-size: 0.9rem; line-height: 1.6;">
            <p><strong>Total de votos:</strong> ${stats.totalVotes}</p>
            <p><strong>Votos confirmados:</strong> ${stats.confirmedVotes}</p>
            <p><strong>Confirmaciones del usuario:</strong> ${stats.userConfirmations}</p>
            <p><strong>Votos con fecha:</strong> ${stats.votesWithDate}</p>
            <p><strong>Votos con timestamp:</strong> ${stats.votesWithTimestamp}</p>
            <p><strong>Votos sin confirmador:</strong> ${stats.votesWithoutConfirmer}</p>
            <p><strong>Confirmaciones hoy:</strong> ${stats.todayConfirmations}</p>
        </div>
        <div style="margin-top: 1rem;">
            <button onclick="forceUpdateVerifierDashboard()" style="
                background: #007bff;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                margin-right: 0.5rem;
                cursor: pointer;
            ">🔄 Actualizar Dashboard</button>
            <button onclick="checkFirebaseSync()" style="
                background: #28a745;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                margin-right: 0.5rem;
                cursor: pointer;
            ">🔄 Verificar Firebase</button>
            <button onclick="cleanCorruptedConfirmations()" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
            ">🧹 Limpiar Corruptos</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    modal.className = 'debug-modal';
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Exportar funciones globales
window.debugVerifierConfirmations = debugVerifierConfirmations;
window.forceUpdateVerifierDashboard = forceUpdateVerifierDashboard;
window.simulateVoteConfirmation = simulateVoteConfirmation;
window.checkFirebaseSync = checkFirebaseSync;
window.cleanCorruptedConfirmations = cleanCorruptedConfirmations;
window.showDetailedStats = showDetailedStats;

// Agregar botón de debugging al dashboard del verificador
function addDebugButton() {
    const dashboardPage = document.getElementById('verifier-dashboard-page');
    if (dashboardPage) {
        const debugButton = document.createElement('button');
        debugButton.innerHTML = '🔧 Debug';
        debugButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #6c757d;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            z-index: 1000;
        `;
        debugButton.onclick = showDetailedStats;
        dashboardPage.appendChild(debugButton);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addDebugButton);
} else {
    addDebugButton();
}

console.log('✅ Herramientas de debugging para verificadores cargadas'); 