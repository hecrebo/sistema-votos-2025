/**
 * Demostración de Sincronización en Tiempo Real
 * 
 * Este script simula registros de votos en tiempo real para demostrar
 * cómo funciona la sincronización automática en el modo proyección.
 */

class DemoSincronizacionTiempoReal {
    constructor() {
        this.isRunning = false;
        this.demoInterval = null;
        this.demoCounter = 0;
        this.ubchOptions = [
            'UBCH Libertador',
            'UBCH Sucre',
            'UBCH Miranda',
            'UBCH Aragua',
            'UBCH Carabobo'
        ];
        this.communityOptions = [
            'Comunidad A',
            'Comunidad B',
            'Comunidad C',
            'Comunidad D',
            'Comunidad E'
        ];
        this.names = [
            'María González',
            'Carlos Rodríguez',
            'Ana Martínez',
            'Luis Pérez',
            'Isabel Torres',
            'Roberto Silva',
            'Carmen Vargas',
            'Jorge Mendoza',
            'Patricia Ruiz',
            'Fernando Castro'
        ];
    }

    startDemo() {
        if (this.isRunning) {
            console.log('⚠️ La demostración ya está ejecutándose');
            return;
        }

        console.log('🎬 Iniciando demostración de sincronización en tiempo real...');
        
        this.isRunning = true;
        this.demoCounter = 0;
        
        // Activar modo proyección si no está activo
        if (!window.votingSystem.isProjectionModeActive) {
            window.votingSystem.enterProjectionMode();
        }
        
        // Simular registros cada 3 segundos
        this.demoInterval = setInterval(() => {
            this.simulateRegistration();
        }, 3000);
        
        console.log('✅ Demostración iniciada. Los registros se simularán cada 3 segundos.');
        console.log('📝 Para detener: stopDemo()');
    }

    stopDemo() {
        if (!this.isRunning) {
            console.log('⚠️ La demostración no está ejecutándose');
            return;
        }

        console.log('🛑 Deteniendo demostración...');
        
        this.isRunning = false;
        
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
            this.demoInterval = null;
        }
        
        console.log('✅ Demostración detenida');
    }

    simulateRegistration() {
        this.demoCounter++;
        
        // Generar datos aleatorios
        const randomName = this.names[Math.floor(Math.random() * this.names.length)];
        const randomUBCH = this.ubchOptions[Math.floor(Math.random() * this.ubchOptions.length)];
        const randomCommunity = this.communityOptions[Math.floor(Math.random() * this.communityOptions.length)];
        const randomSex = Math.random() > 0.5 ? 'M' : 'F';
        const randomAge = Math.floor(Math.random() * 50) + 18; // 18-67 años
        const randomCedula = Math.floor(Math.random() * 90000000) + 10000000; // 8 dígitos
        const randomTelefono = Math.floor(Math.random() * 9000000000) + 1000000000; // 10 dígitos
        
        // Crear voto de demostración
        const demoVote = {
            id: `demo-${Date.now()}-${this.demoCounter}`,
            name: randomName,
            cedula: randomCedula.toString(),
            telefono: randomTelefono.toString(),
            sexo: randomSex,
            edad: randomAge,
            ubch: randomUBCH,
            community: randomCommunity,
            voted: Math.random() > 0.3, // 70% probabilidad de haber votado
            timestamp: Date.now(),
            isDemo: true // Marcar como dato de demostración
        };
        
        // Agregar al sistema
        if (window.votingSystem && window.votingSystem.votes) {
            window.votingSystem.votes.push(demoVote);
            
            console.log(`📝 Registro simulado #${this.demoCounter}: ${randomName} - ${randomUBCH}`);
            
            // Forzar actualización de proyección
            if (window.votingSystem.updateProjection) {
                window.votingSystem.updateProjection();
            }
            
            // Mostrar notificación
            this.showNotification(`Nuevo registro: ${randomName}`);
        }
    }

    showNotification(message) {
        // Crear notificación visual
        const notification = document.createElement('div');
        notification.className = 'demo-notification';
        notification.innerHTML = `
            <div class="demo-notification-content">
                <span class="demo-notification-icon">📝</span>
                <span class="demo-notification-text">${message}</span>
            </div>
        `;
        
        // Agregar estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-weight: 600;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Método para limpiar datos de demostración
    cleanupDemo() {
        console.log('🧹 Limpiando datos de demostración...');
        
        if (window.votingSystem && window.votingSystem.votes) {
            const originalLength = window.votingSystem.votes.length;
            window.votingSystem.votes = window.votingSystem.votes.filter(vote => !vote.isDemo);
            const newLength = window.votingSystem.votes.length;
            
            console.log(`✅ Datos de demostración eliminados: ${originalLength - newLength} registros`);
        }
        
        // Detener demostración si está ejecutándose
        if (this.isRunning) {
            this.stopDemo();
        }
    }

    // Método para mostrar estadísticas de la demostración
    showDemoStats() {
        if (!window.votingSystem || !window.votingSystem.votes) {
            console.log('❌ Sistema de votación no disponible');
            return;
        }
        
        const demoVotes = window.votingSystem.votes.filter(vote => vote.isDemo);
        const totalVotes = window.votingSystem.votes.length;
        
        console.log('\n📊 ESTADÍSTICAS DE LA DEMOSTRACIÓN');
        console.log('=' .repeat(40));
        console.log(`Total de registros: ${totalVotes}`);
        console.log(`Registros de demostración: ${demoVotes.length}`);
        console.log(`Registros reales: ${totalVotes - demoVotes.length}`);
        
        if (demoVotes.length > 0) {
            const votedCount = demoVotes.filter(v => v.voted).length;
            const percentage = Math.round((votedCount / demoVotes.length) * 100);
            
            console.log(`Votos de demostración: ${votedCount}/${demoVotes.length} (${percentage}%)`);
            
            // Estadísticas por UBCH
            const ubchStats = {};
            demoVotes.forEach(vote => {
                ubchStats[vote.ubch] = (ubchStats[vote.ubch] || 0) + 1;
            });
            
            console.log('\n📋 Distribución por UBCH:');
            Object.entries(ubchStats).forEach(([ubch, count]) => {
                console.log(`   ${ubch}: ${count} registros`);
            });
        }
    }
}

// Crear instancia global
window.demoSincronizacion = new DemoSincronizacionTiempoReal();

// Funciones globales para control desde consola
window.startDemo = () => {
    window.demoSincronizacion.startDemo();
};

window.stopDemo = () => {
    window.demoSincronizacion.stopDemo();
};

window.cleanupDemo = () => {
    window.demoSincronizacion.cleanupDemo();
};

window.showDemoStats = () => {
    window.demoSincronizacion.showDemoStats();
};

console.log('🎬 Demo de Sincronización en Tiempo Real cargado');
console.log('📝 Comandos disponibles:');
console.log('   startDemo() - Iniciar demostración');
console.log('   stopDemo() - Detener demostración');
console.log('   cleanupDemo() - Limpiar datos de demostración');
console.log('   showDemoStats() - Mostrar estadísticas de demostración'); 