// admin-sync-panel.js
// Panel de gestión de sincronización para el admin panel

(function() {
    const container = document.getElementById('sync-panel');
    if (!container) return;

    container.innerHTML = `
        <div class="admin-card">
            <h3>🔄 Gestión de Sincronización</h3>
            
            <!-- Estado de Conexión -->
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #155724;">Estado del Sistema</h4>
                <div style="display: flex; gap: 20px; align-items: center;">
                    <span id="sync-status" style="font-weight: bold;">🌐 Online</span>
                    <span id="sync-stats" style="color: #666;">0 pendientes, 0 sincronizados</span>
                </div>
            </div>

            <!-- Controles de Sincronización -->
            <div class="service-controls" style="margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="forceSync()">🔄 Sincronizar Ahora</button>
                <button class="btn btn-warning" onclick="clearSynced()">🧹 Limpiar Sincronizados</button>
                <button class="btn btn-danger" onclick="clearAllLocal()">🗑️ Limpiar Todo Local</button>
            </div>

            <!-- Tabs de Registros -->
            <div style="margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="showTab('local')" id="tab-local">📱 Registros Locales</button>
                <button class="btn btn-primary" onclick="showTab('remote')" id="tab-remote">☁️ Registros Remotos</button>
                <button class="btn btn-primary" onclick="showTab('pending')" id="tab-pending">⏳ Pendientes</button>
            </div>

            <!-- Contenido de Tabs -->
            <div id="tab-content" style="min-height: 300px;">
                <div id="local-content" class="tab-panel">
                    <h4>📱 Registros Locales</h4>
                    <div id="local-records" class="records-list"></div>
                </div>
                
                <div id="remote-content" class="tab-panel" style="display: none;">
                    <h4>☁️ Registros Remotos</h4>
                    <div id="remote-records" class="records-list"></div>
                </div>
                
                <div id="pending-content" class="tab-panel" style="display: none;">
                    <h4>⏳ Registros Pendientes de Sincronización</h4>
                    <div id="pending-records" class="records-list"></div>
                </div>
            </div>
        </div>
    `;

    // Estilos adicionales
    const style = document.createElement('style');
    style.textContent = `
        .records-list {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 10px;
        }
        
        .record-item {
            background: #f8f9fa;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        
        .record-item.local {
            border-left-color: #28a745;
        }
        
        .record-item.pending {
            border-left-color: #ffc107;
        }
        
        .record-item.synced {
            border-left-color: #6c757d;
        }
        
        .tab-panel {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        
        .record-details {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }
        
        .record-status {
            float: right;
            font-size: 0.8em;
            padding: 2px 6px;
            border-radius: 3px;
            color: white;
        }
        
        .status-pending { background: #ffc107; }
        .status-synced { background: #28a745; }
        .status-local { background: #007bff; }
    `;
    document.head.appendChild(style);

    // Funciones del panel
    window.showTab = function(tabName) {
        // Ocultar todos los paneles
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        
        // Mostrar panel seleccionado
        document.getElementById(tabName + '-content').style.display = 'block';
        
        // Actualizar botones
        document.querySelectorAll('[id^="tab-"]').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        });
        document.getElementById('tab-' + tabName).classList.remove('btn-secondary');
        document.getElementById('tab-' + tabName).classList.add('btn-primary');
        
        // Cargar datos del tab
        loadTabData(tabName);
    };

    window.forceSync = async function() {
        if (window.syncManager) {
            await window.syncManager.syncPendingRecords();
            updateSyncDisplay();
            showTab('pending');
        }
    };

    window.clearSynced = function() {
        if (window.syncManager && confirm('¿Limpiar registros sincronizados?')) {
            window.syncManager.clearSyncedRecords();
            updateSyncDisplay();
            showTab('local');
        }
    };

    window.clearAllLocal = function() {
        if (window.syncManager && confirm('¿Eliminar TODOS los registros locales?')) {
            window.syncManager.clearAllLocalRecords();
            updateSyncDisplay();
            showTab('local');
        }
    };

    // Funciones internas
    async function loadTabData(tabName) {
        if (!window.syncManager) return;

        const records = await window.syncManager.getAllRecords();
        
        switch(tabName) {
            case 'local':
                displayRecords(records.local, 'local-records', 'local');
                break;
            case 'remote':
                displayRecords(records.remote, 'remote-records', 'remote');
                break;
            case 'pending':
                const pending = window.syncManager.localQueue.filter(r => !r.synced);
                displayRecords(pending, 'pending-records', 'pending');
                break;
        }
    }

    function displayRecords(records, containerId, type) {
        const container = document.getElementById(containerId);
        
        if (records.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay registros para mostrar</p>';
            return;
        }

        container.innerHTML = records.map(record => `
            <div class="record-item ${type}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${record.nombre || record.id}</strong>
                    <span class="record-status status-${type}">${getStatusText(type)}</span>
                </div>
                <div class="record-details">
                    ID: ${record.id}<br>
                    Fecha: ${new Date(record.timestamp || Date.now()).toLocaleString()}<br>
                    ${record.cedula ? 'Cédula: ' + record.cedula : ''}
                </div>
            </div>
        `).join('');
    }

    function getStatusText(type) {
        switch(type) {
            case 'local': return 'Local';
            case 'remote': return 'Remoto';
            case 'pending': return 'Pendiente';
            default: return 'Desconocido';
        }
    }

    function updateSyncDisplay() {
        if (!window.syncManager) return;
        
        const stats = window.syncManager.getSyncStats();
        const statusElement = document.getElementById('sync-status');
        const statsElement = document.getElementById('sync-stats');
        
        if (statusElement) {
            statusElement.textContent = stats.isOnline ? '🌐 Online' : '📴 Offline';
        }
        
        if (statsElement) {
            statsElement.textContent = `${stats.pending} pendientes, ${stats.synced} sincronizados`;
        }
    }

    // Inicialización
    setTimeout(() => {
        updateSyncDisplay();
        showTab('local');
    }, 1000);

    // Actualizar cada 10 segundos
    setInterval(updateSyncDisplay, 10000);

})();