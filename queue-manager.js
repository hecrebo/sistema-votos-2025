/**
 * Sistema de Gestión de Cola para Registro de Personas
 * Optimiza el envío de datos con validación y manejo de conectividad
 */

class QueueManager {
    constructor() {
        this.registrationQueue = [];
        this.isProcessing = false;
        this.isOnline = navigator.onLine;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 segundos
        
        this.initializeQueue();
        this.setupConnectivityMonitoring();
        this.setupAutoProcessing();
    }

    /**
     * Inicializar la cola desde localStorage
     */
    initializeQueue() {
        try {
            const savedQueue = localStorage.getItem('registrationQueue');
            if (savedQueue) {
                this.registrationQueue = JSON.parse(savedQueue);
                console.log(`📋 Cola inicializada con ${this.registrationQueue.length} registros pendientes`);
            }
        } catch (error) {
            console.error('❌ Error inicializando cola:', error);
            this.registrationQueue = [];
        }
    }

    /**
     * Agregar registro a la cola
     */
    addToQueue(registrationData) {
        try {
            // Validar datos antes de agregar
            const validation = this.validateRegistrationData(registrationData);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            // Verificar duplicados en la cola
            const isDuplicateInQueue = this.registrationQueue.some(
                item => item.data.cedula === registrationData.cedula
            );
            
            if (isDuplicateInQueue) {
                throw new Error('Esta cédula ya está en la cola de registro');
            }

            // Crear elemento de cola con metadata
            const queueItem = {
                id: this.generateQueueId(),
                data: registrationData,
                timestamp: Date.now(),
                status: 'pending',
                attempts: 0
            };

            this.registrationQueue.push(queueItem);
            this.saveQueueToStorage();
            
            console.log(`✅ Registro agregado a la cola (ID: ${queueItem.id})`);
            console.log(`📊 Total en cola: ${this.registrationQueue.length}`);
            
            // Intentar procesar inmediatamente si hay conexión
            if (this.isOnline) {
                this.processQueue();
            }
            
            return queueItem;
            
        } catch (error) {
            console.error('❌ Error agregando a la cola:', error);
            throw error;
        }
    }

    /**
     * Validar datos de registro
     */
    validateRegistrationData(data) {
        // Validar cédula
        if (!data.cedula || !/^\d{6,10}$/.test(data.cedula)) {
            return { isValid: false, message: 'Cédula inválida. Debe tener entre 6 y 10 dígitos' };
        }

        // Validar nombre
        if (!data.name || data.name.trim().length < 3) {
            return { isValid: false, message: 'Nombre inválido. Debe tener al menos 3 caracteres' };
        }

        // Validar teléfono
        if (!data.telefono || !/^04\d{9}$/.test(data.telefono)) {
            return { isValid: false, message: 'Teléfono inválido. Debe tener formato: 04xxxxxxxxx' };
        }

        // Validar sexo
        if (!data.sexo || !['M', 'F'].includes(data.sexo)) {
            return { isValid: false, message: 'Debe seleccionar el sexo' };
        }

        // Validar edad
        if (!data.edad || isNaN(data.edad) || data.edad < 16 || data.edad > 120) {
            return { isValid: false, message: 'Edad inválida. Debe estar entre 16 y 120 años' };
        }

        // Validar UBCH y comunidad
        if (!data.ubch || !data.community) {
            return { isValid: false, message: 'Debe seleccionar Centro de Votación y comunidad' };
        }

        return { isValid: true, message: 'Datos válidos' };
    }

    /**
     * Procesar la cola de registros
     */
    async processQueue() {
        if (this.isProcessing || !this.isOnline || this.registrationQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        console.log(`🔄 Procesando cola con ${this.registrationQueue.length} registros...`);

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Procesar registros en lotes para optimizar
        const batchSize = 5;
        const batches = this.chunkArray(this.registrationQueue, batchSize);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`📦 Procesando lote ${i + 1}/${batches.length} (${batch.length} registros)`);

            for (const item of batch) {
                try {
                    // Verificar duplicados contra registros existentes
                    const isDuplicate = await this.checkForDuplicates(item.data);
                    if (isDuplicate) {
                        console.log(`⚠️ Duplicado detectado: ${item.data.cedula}`);
                        this.removeFromQueue(item.id);
                        results.failed++;
                        continue;
                    }

                    // Intentar enviar registro
                    await this.sendRegistration(item.data);
                    
                    // Marcar como exitoso y remover de la cola
                    this.removeFromQueue(item.id);
                    results.success++;
                    
                    // Notificar a la UI para que se actualice
                    if (window.votingSystem && window.votingSystem.handleSuccessfulRegistrationUI) {
                        window.votingSystem.handleSuccessfulRegistrationUI(item.data);
                    }
                    
                    console.log(`✅ Registro enviado exitosamente: ${item.data.cedula}`);
                    
                } catch (error) {
                    console.error(`❌ Error procesando registro ${item.id}:`, error);
                    
                    item.attempts++;
                    item.lastError = error.message;
                    
                    if (item.attempts >= this.maxRetries) {
                        console.log(`🚫 Registro ${item.id} excedió intentos máximos`);
                        this.removeFromQueue(item.id);
                        results.failed++;
                    } else {
                        item.status = 'retry';
                    }
                    
                    results.errors.push({
                        id: item.id,
                        cedula: item.data.cedula,
                        error: error.message
                    });
                }
            }

            // Pequeña pausa entre lotes para evitar sobrecarga
            if (i < batches.length - 1) {
                await this.delay(1000);
            }
        }

        this.saveQueueToStorage();
        this.isProcessing = false;

        console.log(`📊 Procesamiento completado:`, results);
        this.showQueueStatus(results);
    }

    /**
     * Verificar duplicados contra registros existentes
     */
    async checkForDuplicates(registrationData) {
        try {
            // Verificar en datos locales
            if (window.votingSystem && window.votingSystem.votes) {
                const isDuplicate = window.votingSystem.votes.some(
                    vote => vote.cedula === registrationData.cedula
                );
                if (isDuplicate) return true;
            }

            // Verificar en Firebase si está disponible
            if (window.firebaseDB && window.firebaseDB.votesCollection) {
                const snapshot = await window.firebaseDB.votesCollection
                    .where('cedula', '==', registrationData.cedula)
                    .limit(1)
                    .get();
                
                return !snapshot.empty;
            }

            return false;
        } catch (error) {
            console.error('Error verificando duplicados:', error);
            return false; // En caso de error, permitir el registro
        }
    }

    /**
     * Enviar registro individual
     */
    async sendRegistration(registrationData) {
        try {
            // Intentar enviar a Firebase primero
            if (window.firebaseDB && window.firebaseDB.votesCollection) {
                const docRef = await window.firebaseDB.votesCollection.add({
                    ...registrationData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return docRef.id;
            } else {
                // Fallback a almacenamiento local
                return this.saveLocally(registrationData);
            }
        } catch (error) {
            console.error('Error enviando registro:', error);
            throw error;
        }
    }

    /**
     * Guardar localmente como fallback
     */
    saveLocally(registrationData) {
        const localId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const localVote = {
            id: localId,
            ...registrationData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isLocal: true
        };

        if (window.votingSystem) {
            window.votingSystem.votes.push(localVote);
        }

        localStorage.setItem('localVotes', JSON.stringify(
            (window.votingSystem ? window.votingSystem.votes : []).filter(v => v.isLocal)
        ));

        return localId;
    }

    /**
     * Configurar monitoreo de conectividad
     */
    setupConnectivityMonitoring() {
        window.addEventListener('online', () => {
            console.log('🌐 Conexión restaurada');
            this.isOnline = true;
            this.retryAttempts = 0;
            this.processQueue();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Conexión perdida');
            this.isOnline = false;
        });

        // Verificar conectividad periódicamente
        setInterval(() => {
            const wasOnline = this.isOnline;
            this.isOnline = navigator.onLine;
            
            if (!wasOnline && this.isOnline) {
                console.log('🌐 Conexión detectada, procesando cola...');
                this.processQueue();
            }
        }, 10000); // Verificar cada 10 segundos
    }

    /**
     * Configurar procesamiento automático
     */
    setupAutoProcessing() {
        // Procesar cola automáticamente cada 30 segundos si hay conexión
        setInterval(() => {
            if (this.isOnline && this.registrationQueue.length > 0 && !this.isProcessing) {
                this.processQueue();
            }
        }, 30000);
    }

    /**
     * Remover elemento de la cola
     */
    removeFromQueue(itemId) {
        this.registrationQueue = this.registrationQueue.filter(item => item.id !== itemId);
        this.saveQueueToStorage();
    }

    /**
     * Guardar cola en localStorage
     */
    saveQueueToStorage() {
        try {
            localStorage.setItem('registrationQueue', JSON.stringify(this.registrationQueue));
        } catch (error) {
            console.error('Error guardando cola:', error);
        }
    }

    /**
     * Generar ID único para elementos de cola
     */
    generateQueueId() {
        return 'queue_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Dividir array en lotes
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Mostrar estado de la cola
     */
    showQueueStatus(results) {
        const message = `Cola procesada: ${results.success} exitosos, ${results.failed} fallidos`;
        const type = results.failed > 0 ? 'warning' : 'success';
        
        if (window.votingSystem && window.votingSystem.showMessage) {
            window.votingSystem.showMessage(message, type, 'registration');
        }
    }

    /**
     * Obtener estadísticas de la cola
     */
    getQueueStats() {
        return {
            total: this.registrationQueue.length,
            pending: this.registrationQueue.filter(item => item.status === 'pending').length,
            retry: this.registrationQueue.filter(item => item.status === 'retry').length,
            isOnline: this.isOnline,
            isProcessing: this.isProcessing
        };
    }

    /**
     * Limpiar cola (para administración)
     */
    clearQueue() {
        this.registrationQueue = [];
        this.saveQueueToStorage();
        console.log('🗑️ Cola limpiada');
    }
}

// Exportar para uso global
window.QueueManager = QueueManager;

// === SISTEMA DE COLA LOCAL Y SINCRONIZACIÓN OFFLINE/ONLINE ===

class OfflineQueueManager {
    constructor() {
        this.queueKey = 'colaRegistros';
        this.syncInterval = null;
        this.isOnline = navigator.onLine;
        this.setupOnlineOfflineListeners();
    }

    // Guardar registro en la cola local
    guardarEnColaLocal(registro) {
        try {
            let cola = this.obtenerColaLocal();
            const registroConId = {
                ...registro,
                id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                status: 'pending'
            };
            cola.push(registroConId);
            this.guardarColaLocal(cola);
            console.log('✅ Registro guardado en cola local:', registroConId);
            return registroConId.id;
        } catch (error) {
            console.error('❌ Error guardando en cola local:', error);
            throw error;
        }
    }

    // Obtener cola local
    obtenerColaLocal() {
        try {
            const cola = localStorage.getItem(this.queueKey);
            return cola ? JSON.parse(cola) : [];
        } catch (error) {
            console.error('❌ Error obteniendo cola local:', error);
            return [];
        }
    }

    // Guardar cola local
    guardarColaLocal(cola) {
        try {
            localStorage.setItem(this.queueKey, JSON.stringify(cola));
        } catch (error) {
            console.error('❌ Error guardando cola local:', error);
            throw error;
        }
    }

    // Sincronizar cola con Firebase
    async sincronizarCola() {
        if (!this.isOnline) {
            console.log('⚠️ Sin conexión, no se puede sincronizar');
            return;
        }

        // Verificar que Firebase esté disponible
        if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
            console.log('⚠️ Firebase no disponible, no se puede sincronizar');
            return;
        }

        const cola = this.obtenerColaLocal();
        if (cola.length === 0) {
            console.log('✅ Cola vacía, nada que sincronizar');
            return;
        }

        console.log(`🔄 Sincronizando ${cola.length} registros pendientes...`);

        for (let i = 0; i < cola.length; i++) {
            const registro = cola[i];
            
            try {
                // Verificar duplicados por cédula
                const existing = await window.firebaseDB.votesCollection.where('cedula', '==', registro.cedula).get();
                if (!existing.empty) {
                    // Registro duplicado, eliminar de la cola
                    cola.splice(i, 1);
                    i--;
                    console.log(`⚠️ Registro duplicado eliminado: ${registro.cedula}`);
                    this.mostrarNotificacion('Registro duplicado eliminado', 'warning');
                    continue;
                }

                // Enviar a Firebase
                await window.firebaseDB.votesCollection.add({
                    name: registro.name,
                    cedula: registro.cedula,
                    telefono: registro.telefono || '',
                    sexo: registro.sexo,
                    edad: registro.edad,
                    ubch: registro.ubch,
                    community: registro.community,
                    voted: false,
                    createdAt: new Date().toISOString(),
                    createdBy: registro.createdBy || 'Sistema',
                    registeredAt: registro.registeredAt || new Date().toISOString()
                });

                // Registro exitoso, eliminar de la cola
                cola.splice(i, 1);
                i--;
                console.log(`✅ Registro sincronizado exitosamente: ${registro.cedula}`);
                this.mostrarNotificacion('Registro sincronizado exitosamente', 'success');
                
            } catch (error) {
                console.error('❌ Error sincronizando registro:', error);
                // Error de Firebase, mantener en cola para reintentar
                this.mostrarNotificacion('Error sincronizando registro', 'error');
                break;
            }
        }

        // Guardar cola actualizada
        this.guardarColaLocal(cola);
        
        // Actualizar indicador de estado
        this.actualizarIndicadorCola(cola.length);
    }

    // Configurar listeners de conectividad
    setupOnlineOfflineListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Conexión restaurada');
            this.mostrarNotificacion('Conexión restaurada. Sincronizando...', 'success');
            this.sincronizarCola();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 Conexión perdida');
            this.mostrarNotificacion('Sin conexión. Los registros se guardarán localmente.', 'warning');
        });
    }

    // Iniciar sincronización automática
    iniciarSincronizacionAutomatica() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            this.sincronizarCola();
        }, 10000); // Sincronizar cada 10 segundos
        
        console.log('🔄 Sincronización automática iniciada');
    }

    // Detener sincronización automática
    detenerSincronizacionAutomatica() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Sincronización automática detenida');
        }
    }

    // Mostrar notificación
    mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear toast si no existe
        let toast = document.getElementById('offline-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'offline-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 12px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                max-width: 300px;
            `;
            document.body.appendChild(toast);
        }

        // Configurar colores según tipo
        const colores = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        toast.style.backgroundColor = colores[tipo] || colores.info;

        // Mostrar mensaje
        toast.textContent = mensaje;
        toast.style.transform = 'translateX(0)';

        // Ocultar después de 3 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
        }, 3000);
    }

    // Actualizar indicador de estado de la cola
    actualizarIndicadorCola(cantidadPendiente) {
        const indicador = document.getElementById('queue-status');
        if (indicador) {
            if (cantidadPendiente > 0) {
                indicador.innerHTML = `
                    <div class="queue-indicator">
                        <span class="queue-icon">📋</span>
                        <span class="queue-text">${cantidadPendiente} registro(s) pendiente(s) de sincronización</span>
                    </div>
                `;
                indicador.style.display = 'block';
            } else {
                indicador.style.display = 'none';
            }
        }
    }

    // Obtener estadísticas de la cola
    obtenerEstadisticasCola() {
        const cola = this.obtenerColaLocal();
        return {
            total: cola.length,
            pendientes: cola.filter(r => r.status === 'pending').length,
            online: this.isOnline
        };
    }

    // Limpiar cola local
    limpiarColaLocal() {
        try {
            localStorage.removeItem(this.queueKey);
            console.log('🗑️ Cola local limpiada');
            this.actualizarIndicadorCola(0);
            this.mostrarNotificacion('Cola local limpiada', 'info');
        } catch (error) {
            console.error('❌ Error limpiando cola local:', error);
        }
    }

    // Forzar sincronización
    async forzarSincronizacion() {
        console.log('🔄 Forzando sincronización...');
        await this.sincronizarCola();
    }
}

// Crear instancia global del gestor de cola
window.offlineQueueManager = new OfflineQueueManager();
