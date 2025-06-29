// sync-manager.js
// Sistema de sincronización inteligente para registros locales y remotos
// Funciona tanto online como offline con cola de sincronización

class SyncManager {
    constructor() {
        this.localQueue = [];
        this.isOnline = navigator.onLine;
        this.syncInterval = null;
        this.init();
    }

    init() {
        // Cargar cola local
        this.loadLocalQueue();
        
        // Escuchar cambios de conectividad
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Iniciar sincronización automática
        this.startAutoSync();
        
        console.log('🔄 SyncManager iniciado - Modo:', this.isOnline ? 'Online' : 'Offline');
    }

    // === GESTIÓN DE CONECTIVIDAD ===
    handleOnline() {
        this.isOnline = true;
        console.log('🌐 Conexión restaurada - Iniciando sincronización');
        this.syncPendingRecords();
        this.updateSyncStatus('online');
    }

    handleOffline() {
        this.isOnline = false;
        console.log('📴 Conexión perdida - Modo offline activado');
        this.updateSyncStatus('offline');
    }

    // === GESTIÓN DE REGISTROS LOCALES ===
    addLocalRecord(record) {
        const localRecord = {
            ...record,
            id: this.generateLocalId(),
            timestamp: Date.now(),
            synced: false,
            local: true
        };

        this.localQueue.push(localRecord);
        this.saveLocalQueue();
        
        console.log('💾 Registro guardado localmente:', localRecord.id);
        return localRecord;
    }

    generateLocalId() {
        return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // === SINCRONIZACIÓN ===
    async syncPendingRecords() {
        if (!this.isOnline || this.localQueue.length === 0) return;

        console.log('🔄 Sincronizando registros pendientes...');
        
        const pendingRecords = this.localQueue.filter(record => !record.synced);
        
        for (const record of pendingRecords) {
            try {
                await this.syncRecord(record);
                record.synced = true;
                console.log('✅ Registro sincronizado:', record.id);
            } catch (error) {
                console.error('❌ Error sincronizando registro:', record.id, error);
            }
        }

        this.saveLocalQueue();
        this.updateSyncStatus('syncing');
    }

    async syncRecord(record) {
        if (!window.firebaseDB) throw new Error('Firebase no disponible');
        
        const recordToSync = { ...record };
        delete recordToSync.local;
        delete recordToSync.synced;
        
        await window.firebaseDB.votesCollection.add(recordToSync);
    }

    // === GESTIÓN DE DATOS ===
    async getAllRecords() {
        const localRecords = this.localQueue.filter(record => !record.synced);
        let remoteRecords = [];

        if (this.isOnline && window.firebaseDB) {
            try {
                const snapshot = await window.firebaseDB.votesCollection.get();
                remoteRecords = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    synced: true,
                    local: false
                }));
            } catch (error) {
                console.error('❌ Error obteniendo registros remotos:', error);
            }
        }

        return {
            local: localRecords,
            remote: remoteRecords,
            total: localRecords.length + remoteRecords.length
        };
    }

    // === PERSISTENCIA LOCAL ===
    saveLocalQueue() {
        localStorage.setItem('syncQueue', JSON.stringify(this.localQueue));
    }

    loadLocalQueue() {
        const saved = localStorage.getItem('syncQueue');
        this.localQueue = saved ? JSON.parse(saved) : [];
        console.log('📦 Cola local cargada:', this.localQueue.length, 'registros');
    }

    // === SINCRONIZACIÓN AUTOMÁTICA ===
    startAutoSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        
        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.syncPendingRecords();
            }
        }, 30000); // Cada 30 segundos
    }

    // === ESTADO DEL SISTEMA ===
    updateSyncStatus(status) {
        const statusElement = document.getElementById('sync-status');
        if (statusElement) {
            statusElement.textContent = status === 'online' ? '🌐 Online' : 
                                      status === 'offline' ? '📴 Offline' : 
                                      status === 'syncing' ? '🔄 Sincronizando' : '❓ Desconocido';
        }
    }

    getSyncStats() {
        const pending = this.localQueue.filter(r => !r.synced).length;
        const synced = this.localQueue.filter(r => r.synced).length;
        
        return {
            pending,
            synced,
            total: this.localQueue.length,
            isOnline: this.isOnline
        };
    }

    // === LIMPIEZA ===
    clearSyncedRecords() {
        this.localQueue = this.localQueue.filter(record => !record.synced);
        this.saveLocalQueue();
        console.log('🧹 Registros sincronizados limpiados');
    }

    clearAllLocalRecords() {
        this.localQueue = [];
        this.saveLocalQueue();
        console.log('🗑️ Todos los registros locales eliminados');
    }
}

// Inicializar SyncManager globalmente
window.syncManager = new SyncManager(); 