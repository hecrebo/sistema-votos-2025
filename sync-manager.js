// sync-manager.js
// Sistema de sincronización inteligente para registros locales y remotos
// Funciona tanto online como offline con cola de sincronización

class SyncManager {
    constructor() {
        this.localQueue = [];
        this.isOnline = navigator.onLine;
        this.syncInterval = null;
        this.autoSyncEnabled = true;
        this.autoRetryEnabled = true;
        this.maxRetries = 3;
        this.retryDelay = 5000;
        this.syncStats = {
            totalSynced: 0,
            totalFailed: 0,
            lastSyncTime: null,
            syncDuration: 0
        };
        
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
        
        // Configurar auto-recuperación
        this.setupAutoRecovery();
        
        console.log('🔄 SyncManager iniciado - Modo:', this.isOnline ? 'Online' : 'Offline');
    }

    // === GESTIÓN DE CONECTIVIDAD ===
    handleOnline() {
        this.isOnline = true;
        console.log('🌐 Conexión restaurada - Iniciando sincronización automática');
        this.syncPendingRecords();
        this.updateSyncStatus('online');
        
        // Notificar al usuario
        this.showSyncNotification('Conexión restaurada. Sincronizando datos...', 'success');
    }

    handleOffline() {
        this.isOnline = false;
        console.log('📴 Conexión perdida - Modo offline activado');
        this.updateSyncStatus('offline');
        
        // Notificar al usuario
        this.showSyncNotification('Conexión perdida. Los datos se guardarán localmente.', 'warning');
    }

    // === GESTIÓN DE REGISTROS LOCALES ===
    addLocalRecord(record) {
        const localRecord = {
            ...record,
            id: this.generateLocalId(),
            timestamp: Date.now(),
            synced: false,
            local: true,
            retries: 0
        };

        this.localQueue.push(localRecord);
        this.saveLocalQueue();
        
        console.log('💾 Registro guardado localmente:', localRecord.id);
        
        // Intentar sincronizar inmediatamente si está online
        if (this.isOnline) {
            this.syncPendingRecords();
        }
        
        return localRecord;
    }

    generateLocalId() {
        return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // === SINCRONIZACIÓN AUTOMÁTICA MEJORADA ===
    async syncPendingRecords() {
        if (!this.isOnline || this.localQueue.length === 0) return;

        const startTime = Date.now();
        console.log('🔄 Sincronizando registros pendientes...');
        
        this.updateSyncStatus('syncing');
        
        const pendingRecords = this.localQueue.filter(record => !record.synced);
        let syncedCount = 0;
        let failedCount = 0;
        
        for (const record of pendingRecords) {
            try {
                await this.syncSingleRecord(record);
                syncedCount++;
                
                // Pequeña pausa entre sincronizaciones para evitar sobrecarga
                await this.delay(100);
                
            } catch (error) {
                console.error('❌ Error sincronizando registro:', record.id, error);
                failedCount++;
                
                // Incrementar contador de reintentos
                record.retries = (record.retries || 0) + 1;
                
                // Si se agotaron los reintentos, marcar como fallido permanentemente
                if (record.retries >= this.maxRetries) {
                    record.failed = true;
                    console.error('❌ Registro fallido permanentemente:', record.id);
                }
            }
        }
        
        // Actualizar estadísticas
        this.syncStats.totalSynced += syncedCount;
        this.syncStats.totalFailed += failedCount;
        this.syncStats.lastSyncTime = new Date().toISOString();
        this.syncStats.syncDuration = Date.now() - startTime;
        
        // Limpiar registros sincronizados exitosamente
        this.cleanupSyncedRecords();
        
        // Guardar estadísticas
        this.saveSyncStats();
        
        // Actualizar estado
        this.updateSyncStatus('online');
        
        // Mostrar resumen
        if (syncedCount > 0 || failedCount > 0) {
            this.showSyncSummary(syncedCount, failedCount);
        }
        
        console.log(`✅ Sincronización completada: ${syncedCount} exitosos, ${failedCount} fallidos`);
    }

    async syncSingleRecord(record) {
        // Subir a Firebase y obtener referencia
        const recordToSync = { ...record };
        delete recordToSync.local;
        delete recordToSync.synced;
        delete recordToSync.retries;
        delete recordToSync.failed;
        
        const docRef = await window.firebaseDB.votesCollection.add(recordToSync);
        
        // Actualizar en la lista principal si existe
        if (window.votingSystem && Array.isArray(window.votingSystem.votes)) {
            const idx = window.votingSystem.votes.findIndex(v => v.id === record.id);
            if (idx !== -1) {
                window.votingSystem.votes[idx].id = docRef.id;
                window.votingSystem.votes[idx].local = false;
                window.votingSystem.votes[idx].synced = true;
            }
        }
        
        // Marcar como sincronizado
        record.synced = true;
        record.remoteId = docRef.id;
        
        console.log('✅ Registro sincronizado:', record.id, '->', docRef.id);
        
        // Mostrar notificación visual
        this.showSyncToast('Registro sincronizado correctamente');
    }

    cleanupSyncedRecords() {
        const beforeCount = this.localQueue.length;
        this.localQueue = this.localQueue.filter(record => !record.synced);
        const afterCount = this.localQueue.length;
        
        if (beforeCount !== afterCount) {
            this.saveLocalQueue();
            console.log(`🧹 Limpieza: ${beforeCount - afterCount} registros sincronizados eliminados`);
        }
    }

    // === AUTO-RECUPERACIÓN ===
    setupAutoRecovery() {
        // Reintentar registros fallidos automáticamente
        setInterval(() => {
            if (this.isOnline && this.autoRetryEnabled) {
                this.retryFailedRecords();
            }
        }, 60000); // Cada minuto
    }

    async retryFailedRecords() {
        const failedRecords = this.localQueue.filter(record => 
            !record.synced && !record.failed && (record.retries || 0) < this.maxRetries
        );
        
        if (failedRecords.length > 0) {
            console.log(`🔄 Reintentando ${failedRecords.length} registros fallidos...`);
            await this.syncPendingRecords();
        }
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
        try {
        localStorage.setItem('syncQueue', JSON.stringify(this.localQueue));
        } catch (error) {
            console.error('❌ Error guardando cola local:', error);
        }
    }

    loadLocalQueue() {
        try {
        const saved = localStorage.getItem('syncQueue');
        this.localQueue = saved ? JSON.parse(saved) : [];
        console.log('📦 Cola local cargada:', this.localQueue.length, 'registros');
        } catch (error) {
            console.error('❌ Error cargando cola local:', error);
            this.localQueue = [];
        }
    }

    saveSyncStats() {
        try {
            localStorage.setItem('syncStats', JSON.stringify(this.syncStats));
        } catch (error) {
            console.error('❌ Error guardando estadísticas de sincronización:', error);
        }
    }

    loadSyncStats() {
        try {
            const saved = localStorage.getItem('syncStats');
            if (saved) {
                this.syncStats = { ...this.syncStats, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('❌ Error cargando estadísticas de sincronización:', error);
        }
    }

    // === SINCRONIZACIÓN AUTOMÁTICA ===
    startAutoSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        
        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.autoSyncEnabled) {
                this.syncPendingRecords();
            }
        }, 30000); // Cada 30 segundos
        
        console.log('🔄 Sincronización automática iniciada');
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Sincronización automática detenida');
        }
    }

    // === ESTADO DEL SISTEMA ===
    updateSyncStatus(status) {
        const statusElement = document.getElementById('sync-status');
        if (statusElement) {
            const statusText = {
                'online': '🌐 Online',
                'offline': '📴 Offline',
                'syncing': '🔄 Sincronizando',
                'error': '❌ Error'
            };
            
            statusElement.textContent = statusText[status] || '❓ Desconocido';
            statusElement.className = `sync-status ${status}`;
        }
        
        // Actualizar indicador visual
        this.updateSyncIndicator(status);
    }

    updateSyncIndicator(status) {
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            const indicators = {
                'online': '🟢',
                'offline': '🔴',
                'syncing': '🔄',
                'error': '⚠️'
            };
            
            indicator.textContent = indicators[status] || '❓';
        }
    }

    getSyncStats() {
        const pending = this.localQueue.filter(r => !r.synced && !r.failed).length;
        const failed = this.localQueue.filter(r => r.failed).length;
        const synced = this.syncStats.totalSynced;
        
        return {
            pending,
            failed,
            synced,
            total: this.localQueue.length,
            isOnline: this.isOnline,
            lastSync: this.syncStats.lastSyncTime,
            syncDuration: this.syncStats.syncDuration
        };
    }

    // === NOTIFICACIONES ===
    showSyncNotification(message, type = 'info') {
        // Mostrar notificación del sistema si está disponible
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Sincronización - Sistema de Votos 2025', {
                body: message,
                icon: 'logo.jpg',
                tag: 'sync-notification'
            });
        }
        
        // Mostrar toast visual
        this.showSyncToast(message, type);
    }

    showSyncToast(message, type = 'success') {
        let toast = document.getElementById('sync-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'sync-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 32px;
                right: 32px;
                padding: 18px 32px;
                border-radius: 16px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(toast);
        }

        // Configurar colores según tipo
        const colors = {
            success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };

        toast.style.background = colors[type] || colors.info;
        toast.textContent = message;
        toast.style.transform = 'translateX(0)';

        // Auto-ocultar después de 4 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
        }, 4000);
    }

    showSyncSummary(syncedCount, failedCount) {
        let message = '';
        let type = 'info';
        
        if (syncedCount > 0 && failedCount === 0) {
            message = `✅ ${syncedCount} registros sincronizados correctamente`;
            type = 'success';
        } else if (syncedCount > 0 && failedCount > 0) {
            message = `⚠️ ${syncedCount} sincronizados, ${failedCount} fallidos`;
            type = 'warning';
        } else if (failedCount > 0) {
            message = `❌ ${failedCount} registros fallaron al sincronizar`;
            type = 'error';
        }
        
        if (message) {
            this.showSyncNotification(message, type);
        }
    }

    // === UTILIDADES ===
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === LIMPIEZA ===
    clearSyncedRecords() {
        const beforeCount = this.localQueue.length;
        this.localQueue = this.localQueue.filter(record => !record.synced);
        this.saveLocalQueue();
        console.log(`🧹 ${beforeCount - this.localQueue.length} registros sincronizados eliminados`);
    }

    clearAllLocalRecords() {
        this.localQueue = [];
        this.saveLocalQueue();
        console.log('🗑️ Todos los registros locales eliminados');
    }

    clearFailedRecords() {
        const beforeCount = this.localQueue.length;
        this.localQueue = this.localQueue.filter(record => !record.failed);
        this.saveLocalQueue();
        console.log(`🧹 ${beforeCount - this.localQueue.length} registros fallidos eliminados`);
    }

    // === DIAGNÓSTICO ===
    getDiagnostics() {
        return {
            queueSize: this.localQueue.length,
            pendingCount: this.localQueue.filter(r => !r.synced && !r.failed).length,
            failedCount: this.localQueue.filter(r => r.failed).length,
            isOnline: this.isOnline,
            autoSyncEnabled: this.autoSyncEnabled,
            lastSyncTime: this.syncStats.lastSyncTime,
            syncStats: this.syncStats
        };
    }
}

// Inicializar SyncManager globalmente
window.syncManager = new SyncManager(); 