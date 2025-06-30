// Configuración de Firebase para Sistema de Votos 2025
const firebaseConfig = {
    apiKey: "AIzaSyAtgIwPlrxpsrVNWIIG8i2fVle-DhX0suY",
    authDomain: "sistema-votos-2025.firebaseapp.com",
    projectId: "sistema-votos-2025",
    storageBucket: "sistema-votos-2025.firebasestorage.app",
    messagingSenderId: "136821740270",
    appId: "1:136821740270:web:a503de06b4cc28af3899ff"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a la base de datos
const db = firebase.firestore();
const votesCollection = db.collection('votes');
const ubchCollection = db.collection('ubchData');
const communitiesCollection = db.collection('communities');

// Configuración de Firestore para mejor rendimiento
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Sistema de sincronización en tiempo real
class FirebaseSyncManager {
    constructor() {
        this.ubchListeners = new Map();
        this.communityListeners = new Map();
        this.votesListeners = new Map();
        this.syncStatus = {
            ubch: false,
            communities: false,
            votes: false
        };
        this.lastSync = {
            ubch: null,
            communities: null,
            votes: null
        };
    }

    // Sincronizar UBCH en tiempo real
    async syncUBCHRealTime() {
        try {
            console.log('🔄 Iniciando sincronización UBCH en tiempo real...');
            
            // Escuchar cambios en la colección UBCH
            const unsubscribe = ubchCollection.onSnapshot(
                (snapshot) => {
                    const ubchData = [];
                    snapshot.forEach((doc) => {
                        ubchData.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    // Guardar en localStorage como respaldo
                    localStorage.setItem('ubchData', JSON.stringify(ubchData));
                    localStorage.setItem('ubchLastSync', Date.now().toString());
                    
                    this.syncStatus.ubch = true;
                    this.lastSync.ubch = new Date();
                    
                    console.log(`✅ UBCH sincronizado: ${ubchData.length} registros`);
                    
                    // Disparar evento para notificar cambios
                    window.dispatchEvent(new CustomEvent('ubchDataUpdated', {
                        detail: { data: ubchData, source: 'firebase' }
                    }));
                    
                    // Actualizar interfaz si está disponible
                    if (window.votingSystem && typeof window.votingSystem.renderRegistrationPage === 'function') {
                        window.votingSystem.renderRegistrationPage();
                    }
                },
                (error) => {
                    console.error('❌ Error en sincronización UBCH:', error);
                    this.syncStatus.ubch = false;
                }
            );
            
            // Guardar listener para poder cancelarlo después
            this.ubchListeners.set('main', unsubscribe);
            
        } catch (error) {
            console.error('❌ Error iniciando sincronización UBCH:', error);
            this.syncStatus.ubch = false;
        }
    }

    // Sincronizar Comunidades en tiempo real
    async syncCommunitiesRealTime() {
        try {
            console.log('🔄 Iniciando sincronización Comunidades en tiempo real...');
            
            // Escuchar cambios en la colección Communities
            const unsubscribe = communitiesCollection.onSnapshot(
                (snapshot) => {
                    const communitiesData = [];
                    snapshot.forEach((doc) => {
                        communitiesData.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    // Guardar en localStorage como respaldo
                    localStorage.setItem('communitiesData', JSON.stringify(communitiesData));
                    localStorage.setItem('communitiesLastSync', Date.now().toString());
                    
                    this.syncStatus.communities = true;
                    this.lastSync.communities = new Date();
                    
                    console.log(`✅ Comunidades sincronizadas: ${communitiesData.length} registros`);
                    
                    // Disparar evento para notificar cambios
                    window.dispatchEvent(new CustomEvent('communitiesDataUpdated', {
                        detail: { data: communitiesData, source: 'firebase' }
                    }));
                    
                },
                (error) => {
                    console.error('❌ Error en sincronización Comunidades:', error);
                    this.syncStatus.communities = false;
                }
            );
            
            // Guardar listener para poder cancelarlo después
            this.communityListeners.set('main', unsubscribe);
            
        } catch (error) {
            console.error('❌ Error iniciando sincronización Comunidades:', error);
            this.syncStatus.communities = false;
        }
    }

    // Sincronizar Votos en tiempo real
    async syncVotesRealTime() {
        try {
            console.log('🔄 Iniciando sincronización Votos en tiempo real...');
            
            // Escuchar cambios en la colección Votes
            const unsubscribe = votesCollection.onSnapshot(
                (snapshot) => {
                    const votesData = [];
                    const changes = snapshot.docChanges();
                    
                    // Procesar cambios para detectar eliminaciones
                    changes.forEach((change) => {
                        if (change.type === 'removed') {
                            console.log('🗑️ Documento eliminado:', change.doc.id);
                            // Disparar evento específico para eliminaciones
                            window.dispatchEvent(new CustomEvent('voteDeleted', {
                                detail: { voteId: change.doc.id, source: 'firebase' }
                            }));
                        }
                    });
                    
                    // Obtener todos los documentos actuales
                    snapshot.forEach((doc) => {
                        votesData.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    // Guardar en localStorage como respaldo
                    localStorage.setItem('votesData', JSON.stringify(votesData));
                    localStorage.setItem('votesLastSync', Date.now().toString());
                    
                    this.syncStatus.votes = true;
                    this.lastSync.votes = new Date();
                    
                    console.log(`✅ Votos sincronizados: ${votesData.length} registros`);
                    
                    // Disparar evento para notificar cambios
                    window.dispatchEvent(new CustomEvent('votesDataUpdated', {
                        detail: { data: votesData, source: 'firebase' }
                    }));
                    
                    // Actualizar interfaz si está disponible
                    if (window.votingSystem) {
                        // Actualizar lista de votos
                        if (window.votingSystem.votes) {
                            window.votingSystem.votes = votesData;
                        }
                        
                        // Actualizar páginas según la página actual
                        if (window.votingSystem.currentPage === 'listado') {
                            window.votingSystem.renderVotesTable();
                        } else if (window.votingSystem.currentPage === 'dashboard') {
                            window.votingSystem.renderDashboardPage();
                        } else if (window.votingSystem.currentPage === 'statistics') {
                            window.votingSystem.renderStatisticsPage();
                        }
                    }
                },
                (error) => {
                    console.error('❌ Error en sincronización Votos:', error);
                    this.syncStatus.votes = false;
                }
            );
            
            // Guardar listener para poder cancelarlo después
            this.votesListeners.set('main', unsubscribe);
            
        } catch (error) {
            console.error('❌ Error iniciando sincronización Votos:', error);
            this.syncStatus.votes = false;
        }
    }

    // Guardar UBCH en Firebase
    async saveUBCH(ubchData) {
        try {
            console.log('💾 Guardando UBCH en Firebase...');
            
            // Crear o actualizar documento UBCH
            const ubchRef = ubchCollection.doc(ubchData.id || 'ubch_' + Date.now());
            await ubchRef.set({
                name: ubchData.name,
                code: ubchData.code,
                communities: ubchData.communities || [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('✅ UBCH guardado exitosamente');
            return ubchRef.id;
            
        } catch (error) {
            console.error('❌ Error guardando UBCH:', error);
            throw error;
        }
    }

    // Guardar Comunidad en Firebase
    async saveCommunity(communityData) {
        try {
            console.log('💾 Guardando Comunidad en Firebase...');
            
            // Crear o actualizar documento Comunidad
            const communityRef = communitiesCollection.doc(communityData.id || 'community_' + Date.now());
            await communityRef.set({
                name: communityData.name,
                ubchId: communityData.ubchId,
                ubchName: communityData.ubchName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('✅ Comunidad guardada exitosamente');
            return communityRef.id;
            
        } catch (error) {
            console.error('❌ Error guardando Comunidad:', error);
            throw error;
        }
    }

    // Guardar Voto en Firebase
    async saveVote(voteData) {
        try {
            console.log('💾 Guardando Voto en Firebase...');
            
            // Crear o actualizar documento Voto
            const voteRef = votesCollection.doc(voteData.id || 'vote_' + Date.now());
            await voteRef.set({
                name: voteData.name,
                cedula: voteData.cedula,
                telefono: voteData.telefono,
                sexo: voteData.sexo,
                edad: voteData.edad,
                ubch: voteData.ubch,
                community: voteData.community,
                voted: voteData.voted || false,
                voteTimestamp: voteData.voteTimestamp || null,
                registeredAt: voteData.registeredAt || firebase.firestore.FieldValue.serverTimestamp(),
                registeredBy: voteData.registeredBy || 'Sistema',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('✅ Voto guardado exitosamente');
            return voteRef.id;
            
        } catch (error) {
            console.error('❌ Error guardando Voto:', error);
            throw error;
        }
    }

    // Eliminar Voto de Firebase
    async deleteVote(voteId) {
        try {
            console.log('🗑️ Eliminando Voto de Firebase...');
            
            await votesCollection.doc(voteId).delete();
            
            console.log('✅ Voto eliminado exitosamente');
            
        } catch (error) {
            console.error('❌ Error eliminando Voto:', error);
            throw error;
        }
    }

    // Cargar datos desde Firebase (fallback)
    async loadUBCHFromFirebase() {
        try {
            console.log('📥 Cargando UBCH desde Firebase...');
            
            const snapshot = await ubchCollection.get();
            const ubchData = [];
            
            snapshot.forEach((doc) => {
                ubchData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Guardar en localStorage
            localStorage.setItem('ubchData', JSON.stringify(ubchData));
            localStorage.setItem('ubchLastSync', Date.now().toString());
            
            console.log(`✅ UBCH cargado: ${ubchData.length} registros`);
            return ubchData;
            
        } catch (error) {
            console.error('❌ Error cargando UBCH desde Firebase:', error);
            return [];
        }
    }

    // Cargar comunidades desde Firebase (fallback)
    async loadCommunitiesFromFirebase() {
        try {
            console.log('📥 Cargando Comunidades desde Firebase...');
            
            const snapshot = await communitiesCollection.get();
            const communitiesData = [];
            
            snapshot.forEach((doc) => {
                communitiesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Guardar en localStorage
            localStorage.setItem('communitiesData', JSON.stringify(communitiesData));
            localStorage.setItem('communitiesLastSync', Date.now().toString());
            
            console.log(`✅ Comunidades cargadas: ${communitiesData.length} registros`);
            return communitiesData;
            
        } catch (error) {
            console.error('❌ Error cargando Comunidades desde Firebase:', error);
            return [];
        }
    }

    // Cargar TODOS los votos (para estadísticas)
    async getAllVotes() {
        try {
            console.log('📥 Cargando TODOS los Votos desde Firebase para estadísticas...');
            const snapshot = await votesCollection.get();
            const votesData = [];
            snapshot.forEach((doc) => {
                votesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            console.log(`✅ Todos los Votos cargados: ${votesData.length} registros`);
            return votesData;

        } catch (error) {
            console.error('❌ Error cargando todos los Votos desde Firebase:', error);
            return [];
        }
    }

    // Cargar votos desde Firebase (paginado)
    async getVotesPage(pageSize, lastVisibleDoc = null) {
        try {
            console.log(`📥 Cargando página de Votos desde Firebase...`);
            let query = votesCollection.orderBy('registeredAt', 'desc').limit(pageSize);

            if (lastVisibleDoc) {
                query = query.startAfter(lastVisibleDoc);
            }

            const snapshot = await query.get();
            const votesData = [];
            snapshot.forEach((doc) => {
                votesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            const lastDoc = snapshot.docs[snapshot.docs.length - 1];
            console.log(`✅ Página de Votos cargada: ${votesData.length} registros`);
            
            return { votes: votesData, lastDoc: lastDoc };

        } catch (error) {
            console.error('❌ Error cargando página de Votos desde Firebase:', error);
            return { votes: [], lastDoc: null };
        }
    }

    // Cargar votos desde Firebase (fallback)
    async loadVotesFromFirebase() {
        try {
            console.log('📥 Cargando Votos desde Firebase...');
            
            const snapshot = await votesCollection.get();
            const votesData = [];
            
            snapshot.forEach((doc) => {
                votesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Guardar en localStorage
            localStorage.setItem('votesData', JSON.stringify(votesData));
            localStorage.setItem('votesLastSync', Date.now().toString());
            
            console.log(`✅ Votos cargados: ${votesData.length} registros`);
            return votesData;
            
        } catch (error) {
            console.error('❌ Error cargando Votos desde Firebase:', error);
            return [];
        }
    }

    // Detener sincronización en tiempo real
    stopSync() {
        console.log('🛑 Deteniendo sincronización en tiempo real...');
        
        // Detener listeners de UBCH
        this.ubchListeners.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.ubchListeners.clear();
        
        // Detener listeners de Comunidades
        this.communityListeners.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.communityListeners.clear();
        
        // Detener listeners de Votos
        this.votesListeners.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.votesListeners.clear();
        
        this.syncStatus.ubch = false;
        this.syncStatus.communities = false;
        this.syncStatus.votes = false;
        
        console.log('✅ Sincronización detenida');
    }

    // Obtener estado de sincronización
    getSyncStatus() {
        return {
            ...this.syncStatus,
            lastSync: { ...this.lastSync }
        };
    }
}

// Crear instancia global del gestor de sincronización
const firebaseSyncManager = new FirebaseSyncManager();

// Exportar para uso en otros archivos
window.firebaseDB = {
    db,
    votesCollection,
    ubchCollection,
    communitiesCollection,
    firebaseSyncManager
};

// Iniciar sincronización automáticamente
document.addEventListener('DOMContentLoaded', function() {
    // Iniciar sincronización en tiempo real
    firebaseSyncManager.syncUBCHRealTime();
    firebaseSyncManager.syncCommunitiesRealTime();
    firebaseSyncManager.syncVotesRealTime();
    
    console.log('🚀 Sistema de sincronización Firebase iniciado');
});

// Manejar desconexión de página
window.addEventListener('beforeunload', function() {
    firebaseSyncManager.stopSync();
}); 