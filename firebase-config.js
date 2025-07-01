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
const syncQueueCollection = db.collection('syncQueue');

// Configuración de Firestore para mejor rendimiento
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: true, // Mejor para múltiples usuarios
    merge: true // Habilitar merge automático
});

// Sistema de sincronización en tiempo real mejorado para 50 usuarios concurrentes
class FirebaseSyncManager {
    constructor() {
        this.ubchListeners = new Map();
        this.communityListeners = new Map();
        this.votesListeners = new Map();
        this.syncStatus = {
            ubch: false,
            communities: false,
            votes: false,
            queue: false
        };
        this.lastSync = {
            ubch: null,
            communities: null,
            votes: null,
            queue: null
        };
        
        // Sistema de cola para múltiples usuarios
        this.processingQueue = false;
        this.queueRetryCount = 0;
        this.maxRetries = 3;
        
        // Control de concurrencia
        this.activeConnections = 0;
        this.maxConnections = 50;
        this.connectionTimeout = 30000; // 30 segundos
        
        // Cache inteligente
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        
        // Debounce para actualizaciones
        this.updateTimeouts = new Map();
        this.debounceDelay = 1000; // 1 segundo
        
        // Métricas de rendimiento
        this.metrics = {
            syncCount: 0,
            errorCount: 0,
            lastError: null,
            averageSyncTime: 0
        };
    }

    // Método principal para iniciar sincronización completa
    async startFullSync() {
        try {
            console.log('🚀 Iniciando sincronización completa para múltiples usuarios...');
            
            // Iniciar sincronización en tiempo real
            await Promise.all([
                this.syncUBCHRealTime(),
                this.syncCommunitiesRealTime(),
                this.syncVotesRealTime(),
                this.syncQueueRealTime()
            ]);
            
            // Configurar listeners de reconexión
            this.setupReconnectionHandlers();
            
            // Configurar limpieza de cache
            this.setupCacheCleanup();
            
            console.log('✅ Sincronización completa iniciada');
            this.updateSyncIndicator('online');
            
        } catch (error) {
            console.error('❌ Error iniciando sincronización completa:', error);
            this.updateSyncIndicator('error');
        }
    }

    // Sincronizar UBCH en tiempo real mejorado
    async syncUBCHRealTime() {
        try {
            console.log('🔄 Iniciando sincronización UBCH en tiempo real...');
            
            // Escuchar cambios en la colección UBCH con optimizaciones
            const unsubscribe = ubchCollection
                .orderBy('updatedAt', 'desc')
                .onSnapshot(
                    (snapshot) => {
                        const startTime = Date.now();
                        const ubchData = [];
                        
                        snapshot.forEach((doc) => {
                            ubchData.push({
                                id: doc.id,
                                ...doc.data()
                            });
                        });
                        
                        // Actualizar cache
                        this.cache.set('ubchData', {
                            data: ubchData,
                            timestamp: Date.now()
                        });
                        
                        // Guardar en localStorage como respaldo
                        localStorage.setItem('ubchData', JSON.stringify(ubchData));
                        localStorage.setItem('ubchLastSync', Date.now().toString());
                        
                        this.syncStatus.ubch = true;
                        this.lastSync.ubch = new Date();
                        
                        // Actualizar métricas
                        this.updateMetrics(Date.now() - startTime);
                        
                        console.log(`✅ UBCH sincronizado: ${ubchData.length} registros en ${Date.now() - startTime}ms`);
                        
                        // Disparar evento para notificar cambios
                        window.dispatchEvent(new CustomEvent('ubchDataUpdated', {
                            detail: { 
                                data: ubchData, 
                                source: 'firebase',
                                timestamp: Date.now(),
                                syncTime: Date.now() - startTime
                            }
                        }));
                        
                        // Actualizar interfaz si está disponible
                        this.updateUI('ubch', ubchData);
                        
                    },
                    (error) => {
                        console.error('❌ Error en sincronización UBCH:', error);
                        this.syncStatus.ubch = false;
                        this.handleSyncError('ubch', error);
                    }
                );
            
            // Guardar listener para poder cancelarlo después
            this.ubchListeners.set('main', unsubscribe);
            
        } catch (error) {
            console.error('❌ Error iniciando sincronización UBCH:', error);
            this.syncStatus.ubch = false;
        }
    }

    // Sincronizar Comunidades en tiempo real mejorado
    async syncCommunitiesRealTime() {
        try {
            console.log('🔄 Iniciando sincronización Comunidades en tiempo real...');
            
            // Escuchar cambios en la colección Communities con optimizaciones
            const unsubscribe = communitiesCollection
                .orderBy('updatedAt', 'desc')
                .onSnapshot(
                    (snapshot) => {
                        const startTime = Date.now();
                        const communitiesData = [];
                        
                        snapshot.forEach((doc) => {
                            communitiesData.push({
                                id: doc.id,
                                ...doc.data()
                            });
                        });
                        
                        // Actualizar cache
                        this.cache.set('communitiesData', {
                            data: communitiesData,
                            timestamp: Date.now()
                        });
                        
                        // Guardar en localStorage como respaldo
                        localStorage.setItem('communitiesData', JSON.stringify(communitiesData));
                        localStorage.setItem('communitiesLastSync', Date.now().toString());
                        
                        this.syncStatus.communities = true;
                        this.lastSync.communities = new Date();
                        
                        // Actualizar métricas
                        this.updateMetrics(Date.now() - startTime);
                        
                        console.log(`✅ Comunidades sincronizadas: ${communitiesData.length} registros en ${Date.now() - startTime}ms`);
                        
                        // Disparar evento para notificar cambios
                        window.dispatchEvent(new CustomEvent('communitiesDataUpdated', {
                            detail: { 
                                data: communitiesData, 
                                source: 'firebase',
                                timestamp: Date.now(),
                                syncTime: Date.now() - startTime
                            }
                        }));
                        
                    },
                    (error) => {
                        console.error('❌ Error en sincronización Comunidades:', error);
                        this.syncStatus.communities = false;
                        this.handleSyncError('communities', error);
                    }
                );
            
            // Guardar listener para poder cancelarlo después
            this.communityListeners.set('main', unsubscribe);
            
        } catch (error) {
            console.error('❌ Error iniciando sincronización Comunidades:', error);
            this.syncStatus.communities = false;
        }
    }

    // Sincronizar Votos en tiempo real mejorado con paginación
    async syncVotesRealTime() {
        try {
            console.log('🔄 Iniciando sincronización Votos en tiempo real...');
            
            // Escuchar cambios en la colección Votes con optimizaciones
            const unsubscribe = votesCollection
                .orderBy('registeredAt', 'desc')
                .limit(100) // Limitar para mejor rendimiento
                .onSnapshot(
                    (snapshot) => {
                        const startTime = Date.now();
                        const votesData = [];
                        const changes = snapshot.docChanges();
                        
                        // Procesar cambios para detectar operaciones específicas
                        changes.forEach((change) => {
                            if (change.type === 'removed') {
                                console.log('🗑️ Documento eliminado:', change.doc.id);
                                window.dispatchEvent(new CustomEvent('voteDeleted', {
                                    detail: { 
                                        voteId: change.doc.id, 
                                        source: 'firebase',
                                        timestamp: Date.now()
                                    }
                                }));
                            } else if (change.type === 'added') {
                                console.log('➕ Documento agregado:', change.doc.id);
                                window.dispatchEvent(new CustomEvent('voteAdded', {
                                    detail: { 
                                        vote: { id: change.doc.id, ...change.doc.data() },
                                        source: 'firebase',
                                        timestamp: Date.now()
                                    }
                                }));
                            } else if (change.type === 'modified') {
                                console.log('✏️ Documento modificado:', change.doc.id);
                                window.dispatchEvent(new CustomEvent('voteModified', {
                                    detail: { 
                                        vote: { id: change.doc.id, ...change.doc.data() },
                                        source: 'firebase',
                                        timestamp: Date.now()
                                    }
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
                        
                        // Actualizar cache
                        this.cache.set('votesData', {
                            data: votesData,
                            timestamp: Date.now()
                        });
                        
                        // Guardar en localStorage como respaldo
                        localStorage.setItem('votesData', JSON.stringify(votesData));
                        localStorage.setItem('votesLastSync', Date.now().toString());
                        
                        this.syncStatus.votes = true;
                        this.lastSync.votes = new Date();
                        
                        // Actualizar métricas
                        this.updateMetrics(Date.now() - startTime);
                        
                        console.log(`✅ Votos sincronizados: ${votesData.length} registros en ${Date.now() - startTime}ms`);
                        
                        // Disparar evento para notificar cambios
                        window.dispatchEvent(new CustomEvent('votesDataUpdated', {
                            detail: { 
                                data: votesData, 
                                source: 'firebase',
                                timestamp: Date.now(),
                                syncTime: Date.now() - startTime,
                                changes: changes.length
                            }
                        }));
                        
                        // Actualizar interfaz si está disponible
                        this.updateUI('votes', votesData);
                        
                    },
                    (error) => {
                        console.error('❌ Error en sincronización Votos:', error);
                        this.syncStatus.votes = false;
                        this.handleSyncError('votes', error);
                    }
                );
            
            // Guardar listener para poder cancelarlo después
            this.votesListeners.set('main', unsubscribe);
            
        } catch (error) {
            console.error('❌ Error iniciando sincronización Votos:', error);
            this.syncStatus.votes = false;
        }
    }

    // Sincronizar cola de procesamiento en tiempo real
    async syncQueueRealTime() {
        try {
            console.log('🔄 Iniciando sincronización de cola en tiempo real...');
            
            const unsubscribe = syncQueueCollection
                .orderBy('timestamp', 'asc')
                .onSnapshot(
                    (snapshot) => {
                        const queueData = [];
                        snapshot.forEach((doc) => {
                            queueData.push({
                                id: doc.id,
                                ...doc.data()
                            });
                        });
                        
                        this.syncStatus.queue = true;
                        this.lastSync.queue = new Date();
                        
                        console.log(`✅ Cola sincronizada: ${queueData.length} elementos`);
                        
                        // Procesar cola si hay elementos pendientes
                        if (queueData.length > 0 && !this.processingQueue) {
                            this.processQueue(queueData);
                        }
                        
                    },
                    (error) => {
                        console.error('❌ Error en sincronización de cola:', error);
                        this.syncStatus.queue = false;
                    }
                );
            
            this.queueListeners = unsubscribe;
            
        } catch (error) {
            console.error('❌ Error iniciando sincronización de cola:', error);
            this.syncStatus.queue = false;
        }
    }

    // Procesar cola de sincronización
    async processQueue(queueData) {
        if (this.processingQueue) return;
        
        this.processingQueue = true;
        console.log('🔄 Procesando cola de sincronización...');
        
        for (const item of queueData) {
            try {
                if (item.status === 'pending') {
                    await this.processQueueItem(item);
                }
            } catch (error) {
                console.error('❌ Error procesando elemento de cola:', error);
                await this.markQueueItemAsFailed(item.id, error.message);
            }
        }
        
        this.processingQueue = false;
    }

    // Procesar elemento individual de la cola
    async processQueueItem(item) {
        try {
            // Marcar como procesando
            await syncQueueCollection.doc(item.id).update({
                status: 'processing',
                processingAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Procesar según el tipo
            switch (item.type) {
                case 'vote':
                    await this.saveVote(item.data);
                    break;
                case 'ubch':
                    await this.saveUBCH(item.data);
                    break;
                case 'community':
                    await this.saveCommunity(item.data);
                    break;
                default:
                    throw new Error(`Tipo de operación no soportado: ${item.type}`);
            }
            
            // Marcar como completado
            await syncQueueCollection.doc(item.id).update({
                status: 'completed',
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`✅ Elemento de cola procesado: ${item.id}`);
            
        } catch (error) {
            throw error;
        }
    }

    // Agregar elemento a la cola de sincronización
    async addToSyncQueue(type, data) {
        try {
            const queueItem = {
                type,
                data,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userId: this.getCurrentUserId(),
                retryCount: 0
            };
            
            await syncQueueCollection.add(queueItem);
            console.log(`📝 Elemento agregado a cola: ${type}`);
            
        } catch (error) {
            console.error('❌ Error agregando elemento a cola:', error);
            throw error;
        }
    }

    // Marcar elemento de cola como fallido
    async markQueueItemAsFailed(itemId, errorMessage) {
        try {
            await syncQueueCollection.doc(itemId).update({
                status: 'failed',
                error: errorMessage,
                failedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('❌ Error marcando elemento como fallido:', error);
        }
    }

    // Guardar UBCH en Firebase con manejo de conflictos
    async saveUBCH(ubchData) {
        try {
            console.log('💾 Guardando UBCH en Firebase...');
            
            const ubchRef = ubchCollection.doc(ubchData.id || 'ubch_' + Date.now());
            await ubchRef.set({
                name: ubchData.name,
                code: ubchData.code,
                communities: ubchData.communities || [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastModifiedBy: this.getCurrentUserId()
            }, { merge: true });
            
            console.log('✅ UBCH guardado exitosamente');
            return ubchRef.id;
            
        } catch (error) {
            console.error('❌ Error guardando UBCH:', error);
            throw error;
        }
    }

    // Guardar Comunidad en Firebase con manejo de conflictos
    async saveCommunity(communityData) {
        try {
            console.log('💾 Guardando Comunidad en Firebase...');
            
            const communityRef = communitiesCollection.doc(communityData.id || 'community_' + Date.now());
            await communityRef.set({
                name: communityData.name,
                ubchId: communityData.ubchId,
                ubchName: communityData.ubchName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastModifiedBy: this.getCurrentUserId()
            }, { merge: true });
            
            console.log('✅ Comunidad guardada exitosamente');
            return communityRef.id;
            
        } catch (error) {
            console.error('❌ Error guardando Comunidad:', error);
            throw error;
        }
    }

    // Guardar Voto en Firebase con validación de duplicados
    async saveVote(voteData) {
        try {
            console.log('💾 Guardando Voto en Firebase...');
            
            // Validar duplicados
            const existingVote = await this.existsVoteByCedula(voteData.cedula);
            if (existingVote && existingVote.id !== voteData.id) {
                throw new Error('Esta cédula ya está registrada');
            }
            
            // Generar ID válido para el documento
            const voteId = voteData.id && typeof voteData.id === 'string' && voteData.id.trim() !== '' 
                ? voteData.id 
                : 'vote_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const voteRef = votesCollection.doc(voteId);
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
                registeredBy: voteData.registeredBy || this.getCurrentUserId(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastModifiedBy: this.getCurrentUserId()
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

    // Cargar datos desde Firebase con cache inteligente
    async loadUBCHFromFirebase() {
        try {
            // Verificar cache primero
            const cached = this.cache.get('ubchData');
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                console.log('📋 UBCH cargado desde cache');
                return cached.data;
            }
            
            console.log('📥 Cargando UBCH desde Firebase...');
            
            const snapshot = await ubchCollection.get();
            const ubchData = [];
            
            snapshot.forEach((doc) => {
                ubchData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Actualizar cache
            this.cache.set('ubchData', {
                data: ubchData,
                timestamp: Date.now()
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

    // Cargar comunidades desde Firebase con cache inteligente
    async loadCommunitiesFromFirebase() {
        try {
            // Verificar cache primero
            const cached = this.cache.get('communitiesData');
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                console.log('📋 Comunidades cargadas desde cache');
                return cached.data;
            }
            
            console.log('📥 Cargando Comunidades desde Firebase...');
            
            const snapshot = await communitiesCollection.get();
            const communitiesData = [];
            
            snapshot.forEach((doc) => {
                communitiesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Actualizar cache
            this.cache.set('communitiesData', {
                data: communitiesData,
                timestamp: Date.now()
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

    // Cargar TODOS los votos (para estadísticas) con cache
    async getAllVotes() {
        try {
            // Verificar cache primero
            const cached = this.cache.get('allVotesData');
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                console.log('📋 Todos los votos cargados desde cache');
                return cached.data;
            }
            
            console.log('📥 Cargando TODOS los Votos desde Firebase para estadísticas...');
            const snapshot = await votesCollection.get();
            const votesData = [];
            snapshot.forEach((doc) => {
                votesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Actualizar cache
            this.cache.set('allVotesData', {
                data: votesData,
                timestamp: Date.now()
            });
            
            console.log(`✅ Todos los Votos cargados: ${votesData.length} registros`);
            return votesData;

        } catch (error) {
            console.error('❌ Error cargando todos los Votos desde Firebase:', error);
            return [];
        }
    }

    // Cargar votos desde Firebase (paginado optimizado)
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
            // Verificar cache primero
            const cached = this.cache.get('votesData');
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                console.log('📋 Votos cargados desde cache');
                return cached.data;
            }
            
            console.log('📥 Cargando Votos desde Firebase...');
            
            const snapshot = await votesCollection.get();
            const votesData = [];
            
            snapshot.forEach((doc) => {
                votesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Actualizar cache
            this.cache.set('votesData', {
                data: votesData,
                timestamp: Date.now()
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
        
        // Detener listener de cola
        if (this.queueListeners) {
            this.queueListeners();
            this.queueListeners = null;
        }
        
        this.syncStatus.ubch = false;
        this.syncStatus.communities = false;
        this.syncStatus.votes = false;
        this.syncStatus.queue = false;
        
        this.updateSyncIndicator('offline');
        console.log('✅ Sincronización detenida');
    }

    // Obtener estado de sincronización
    getSyncStatus() {
        return {
            ...this.syncStatus,
            lastSync: { ...this.lastSync },
            metrics: { ...this.metrics },
            activeConnections: this.activeConnections,
            cacheSize: this.cache.size
        };
    }

    // Validar si existe un voto por cédula
    async existsVoteByCedula(cedula) {
        try {
            const query = await votesCollection.where('cedula', '==', cedula).limit(1).get();
            if (!query.empty) {
                const doc = query.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Error buscando duplicados por cédula en Firebase:', error);
            throw new Error('Error buscando duplicados en Firebase');
        }
    }

    // Métodos de utilidad
    getCurrentUserId() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                const user = JSON.parse(userData);
                return user.username || 'unknown';
            }
            return 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    // Actualizar métricas de rendimiento
    updateMetrics(syncTime) {
        this.metrics.syncCount++;
        this.metrics.averageSyncTime = 
            (this.metrics.averageSyncTime * (this.metrics.syncCount - 1) + syncTime) / this.metrics.syncCount;
    }

    // Manejar errores de sincronización
    handleSyncError(type, error) {
        this.metrics.errorCount++;
        this.metrics.lastError = {
            type,
            message: error.message,
            timestamp: Date.now()
        };
        
        console.error(`❌ Error de sincronización ${type}:`, error);
        
        // Intentar reconectar después de un delay
        setTimeout(() => {
            this.retrySync(type);
        }, 5000);
    }

    // Reintentar sincronización
    async retrySync(type) {
        if (this.queueRetryCount >= this.maxRetries) {
            console.error(`❌ Máximo de reintentos alcanzado para ${type}`);
            return;
        }
        
        this.queueRetryCount++;
        console.log(`🔄 Reintentando sincronización ${type} (intento ${this.queueRetryCount})`);
        
        try {
            switch (type) {
                case 'ubch':
                    await this.syncUBCHRealTime();
                    break;
                case 'communities':
                    await this.syncCommunitiesRealTime();
                    break;
                case 'votes':
                    await this.syncVotesRealTime();
                    break;
            }
            this.queueRetryCount = 0; // Reset contador en éxito
        } catch (error) {
            console.error(`❌ Error en reintento de ${type}:`, error);
        }
    }

    // Configurar manejadores de reconexión
    setupReconnectionHandlers() {
        // Detectar cambios en conectividad
        window.addEventListener('online', () => {
            console.log('🌐 Conexión restaurada, reiniciando sincronización...');
            this.startFullSync();
        });
        
        window.addEventListener('offline', () => {
            console.log('📡 Conexión perdida, pausando sincronización...');
            this.updateSyncIndicator('offline');
        });
        
        // Detectar cuando la pestaña vuelve a estar activa
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Pestaña activa, verificando sincronización...');
                this.checkSyncStatus();
            }
        });
    }

    // Verificar estado de sincronización
    async checkSyncStatus() {
        const status = this.getSyncStatus();
        const allSynced = Object.values(status.syncStatus).every(s => s);
        
        if (!allSynced) {
            console.log('⚠️ Sincronización incompleta, reiniciando...');
            await this.startFullSync();
        }
    }

    // Configurar limpieza de cache
    setupCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                if (now - value.timestamp > this.cacheTimeout) {
                    this.cache.delete(key);
                    console.log(`🗑️ Cache limpiado: ${key}`);
                }
            }
        }, this.cacheTimeout);
    }

    // Actualizar interfaz de usuario
    updateUI(type, data) {
        if (window.votingSystem) {
            switch (type) {
                case 'ubch':
                    if (window.votingSystem.currentPage === 'registration') {
                        window.votingSystem.renderRegistrationPage();
                    }
                    break;
                case 'votes':
                    if (window.votingSystem.currentPage === 'listado') {
                        window.votingSystem.renderVotesTable();
                    } else if (window.votingSystem.currentPage === 'dashboard') {
                        window.votingSystem.renderDashboardPage();
                    } else if (window.votingSystem.currentPage === 'statistics') {
                        window.votingSystem.renderStatisticsPage();
                    }
                    break;
            }
        }
    }

    // Actualizar indicador de sincronización
    updateSyncIndicator(status) {
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.className = `sync-indicator ${status}`;
            indicator.title = this.getSyncStatusText(status);
        }
        
        // Disparar evento para notificar cambio de estado
        window.dispatchEvent(new CustomEvent('syncStatusChanged', {
            detail: { status, timestamp: Date.now() }
        }));
    }

    // Obtener texto de estado de sincronización
    getSyncStatusText(status) {
        switch (status) {
            case 'online':
                return 'Sincronización activa';
            case 'offline':
                return 'Sin conexión';
            case 'error':
                return 'Error de sincronización';
            case 'syncing':
                return 'Sincronizando...';
            default:
                return 'Estado desconocido';
        }
    }

    // Debounce para actualizaciones
    debounceUpdate(key, callback) {
        if (this.updateTimeouts.has(key)) {
            clearTimeout(this.updateTimeouts.get(key));
        }
        
        this.updateTimeouts.set(key, setTimeout(() => {
            callback();
            this.updateTimeouts.delete(key);
        }, this.debounceDelay));
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
    syncQueueCollection,
    firebaseSyncManager
};

// Iniciar sincronización automáticamente
document.addEventListener('DOMContentLoaded', function() {
    // Iniciar sincronización completa
    firebaseSyncManager.startFullSync();
    
    console.log('🚀 Sistema de sincronización Firebase mejorado iniciado');
});

// Manejar desconexión de página
window.addEventListener('beforeunload', function() {
    firebaseSyncManager.stopSync();
}); 