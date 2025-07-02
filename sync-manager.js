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
        let idsToRemove = [];
        for (const record of pendingRecords) {
            try {
                // Subir a Firebase y obtener referencia
                const recordToSync = { ...record };
                delete recordToSync.local;
                delete recordToSync.synced;
                const docRef = await window.firebaseDB.votesCollection.add(recordToSync);
                // Actualizar en la lista principal si existe (por ejemplo, window.votingSystem.votes)
                if (window.votingSystem && Array.isArray(window.votingSystem.votes)) {
                    const idx = window.votingSystem.votes.findIndex(v => v.id === record.id);
                    if (idx !== -1) {
                        window.votingSystem.votes[idx].id = docRef.id;
                        window.votingSystem.votes[idx].local = false;
                        window.votingSystem.votes[idx].synced = true;
                    }
                }
                idsToRemove.push(record.id);
                console.log('✅ Registro sincronizado:', record.id, '->', docRef.id);
                // Mostrar mensaje visual
                showSyncToast('Registro sincronizado correctamente');
            } catch (error) {
                console.error('❌ Error sincronizando registro:', record.id, error);
            }
        }
        // Limpiar de la cola local los registros sincronizados
        if (idsToRemove.length > 0) {
            this.localQueue = this.localQueue.filter(r => !idsToRemove.includes(r.id));
            this.saveLocalQueue();
        }
        this.updateSyncStatus('syncing');
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

// Toast visual para sincronización
function showSyncToast(msg) {
    let toast = document.getElementById('sync-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sync-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '32px';
        toast.style.right = '32px';
        toast.style.background = 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)';
        toast.style.color = 'white';
        toast.style.padding = '18px 32px';
        toast.style.borderRadius = '16px';
        toast.style.fontSize = '1.1em';
        toast.style.fontWeight = '600';
        toast.style.boxShadow = '0 8px 32px rgba(67,233,123,0.18)';
        toast.style.zIndex = '99999';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
} 