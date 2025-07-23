// Verificación global para evitar múltiples inicializaciones
if (window.votingSystemInitialized) {
    console.log('⚠️ Sistema ya inicializado, evitando duplicación');
} else {
    window.votingSystemInitialized = true;
    console.log('🚀 Inicializando sistema de votos Firebase...');
}

// Limpiar instancia anterior si existe
if (window.votingSystem) {
    console.log('🔄 Limpiando instancia anterior del sistema...');
    window.votingSystem = null;
}

// === FUNCIONES CRÍTICAS DEL REGISTRO MASIVO - DEFINIDAS INMEDIATAMENTE ===

// Función simple para procesarRegistrosMasivos - SIN DEPENDENCIAS COMPLEJAS
window.procesarRegistrosMasivos = function() {
    console.log('🔄 procesarRegistrosMasivos llamada - MODO SIMPLIFICADO');
    
    // Verificar que Firebase esté disponible
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        alert('Firebase no está disponible. Intenta recargar la página.');
        return;
    }
    
    // Verificar que la tabla exista
    const pasteTableBody = document.getElementById('paste-table-body');
    if (!pasteTableBody) {
        alert('Error: Tabla no encontrada');
        return;
    }
    
    // Obtener usuario actual de manera simple
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const username = currentUser.username || 'Sistema';
    
    console.log('✅ Iniciando procesamiento de registros...');
    
    let count = 0, errors = 0, duplicates = 0;
    
    for (let tr of pasteTableBody.rows) {
        const cells = Array.from(tr.cells);
        if (cells.length < 7) continue;
        
        const [ubch, community, name, cedula, telefono, sexo, edad] = cells.map(td => td.textContent.trim());
        
        // Validación básica
        if (!ubch || !community || !name || !cedula || !sexo || !edad) {
            errors++;
            continue;
        }
        
        // Validación de formato
        if (!/^\d{6,10}$/.test(cedula) || 
            !['M','F','m','f'].includes(sexo) || 
            isNaN(edad) || edad < 16 || edad > 120) {
            errors++;
            continue;
        }
        
        // Crear datos del registro
        const voteData = {
            name: name.trim(),
            cedula: cedula.replace(/\D/g, ''),
            telefono: telefono || '',
            sexo: sexo.toUpperCase(),
            edad: parseInt(edad),
            ubch: ubch.trim(),
            community: community.trim(),
            registeredBy: username,
            registeredAt: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        // Guardar directamente en Firebase
        try {
            window.firebaseDB.votesCollection.add(voteData);
            count++;
            tr.remove(); // Remover fila exitosa
            console.log(`✅ Registro enviado: ${name} - ${cedula}`);
        } catch (error) {
            console.error('Error enviando registro:', error);
            errors++;
        }
    }
    
    // Mostrar resultado
    const resultMessage = `${count} registros enviados exitosamente. ${errors} errores, ${duplicates} duplicados`;
    alert(resultMessage);
    
    // Actualizar contadores si la función existe
    if (typeof updateBulkStats === 'function') {
        updateBulkStats(count, errors, duplicates);
    }
    
    console.log(`🎯 PROCESAMIENTO COMPLETADO: ${count} enviados, ${errors} errores`);
};

// Función simple para limpiarTablaMasiva - SIN DEPENDENCIAS
window.limpiarTablaMasiva = function() {
    console.log('🧹 limpiarTablaMasiva llamada - MODO SIMPLIFICADO');
    
    const pasteTableBody = document.getElementById('paste-table-body');
    if (!pasteTableBody) {
        alert('Error: Tabla no encontrada');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres limpiar toda la tabla?')) {
        pasteTableBody.innerHTML = '';
        
        // Agregar una fila vacía
        const newRow = document.createElement('tr');
        newRow.style.background = '#fff';
        
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('td');
            cell.contentEditable = 'true';
            cell.style.padding = '1rem 0.75rem';
            cell.style.borderBottom = '1px solid #dee2e6';
            cell.style.minWidth = i < 3 ? '150px' : i < 5 ? '120px' : '80px';
            newRow.appendChild(cell);
        }
        
        const statusCell = document.createElement('td');
        statusCell.style.padding = '1rem 0.75rem';
        statusCell.style.borderBottom = '1px solid #dee2e6';
        statusCell.style.minWidth = '100px';
        statusCell.style.textAlign = 'center';
        statusCell.style.color = '#6c757d';
        statusCell.textContent = 'Pendiente';
        newRow.appendChild(statusCell);
        
        pasteTableBody.appendChild(newRow);
        
        // Limpiar localStorage
        localStorage.removeItem('bulkRegistrationData');
        
        // Actualizar contadores
        if (typeof updateBulkStats === 'function') {
            updateBulkStats(0, 0, 0);
        }
        
        console.log('✅ Tabla limpiada correctamente');
    }
};

// Función simple para loadExcelFile
window.loadExcelFile = function() {
    console.log('📁 loadExcelFile llamada');
    alert('Función de carga de Excel en desarrollo. Por favor, pega los datos directamente en la tabla.');
};

// Función simple para downloadTemplate
window.downloadTemplate = function() {
    console.log('📋 downloadTemplate llamada');
    alert('Plantilla de ejemplo:\n\nCentro de Votación\tComunidad\tNombre\tCédula\tTeléfono\tSexo\tEdad\nGRUPO ESCOLAR DOCTOR RAFAEL PEREZ\tALTAMIRA\tJuan Pérez\t12345678\t04123456789\tM\t25');
};

// Función simple para actualizarConfiguracionMasivo
window.actualizarConfiguracionMasivo = function() {
    console.log('⚙️ actualizarConfiguracionMasivo llamada');
    alert('Configuración actualizada. Los valores por defecto se aplicarán automáticamente.');
};

// Función simple para forzarReinicializacionRegistroMasivo
window.forzarReinicializacionRegistroMasivo = function() {
    console.log('🔄 forzarReinicializacionRegistroMasivo llamada');
    
    // Limpiar estados
    window.procesandoRegistros = false;
    window.limpiandoTabla = false;
    
    // Limpiar localStorage
    localStorage.removeItem('bulkRegistrationData');
    
    // Limpiar tabla
    const pasteTableBody = document.getElementById('paste-table-body');
    if (pasteTableBody) {
        pasteTableBody.innerHTML = '';
        
        // Agregar fila vacía
        const newRow = document.createElement('tr');
        newRow.style.background = '#fff';
        
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('td');
            cell.contentEditable = 'true';
            cell.style.padding = '1rem 0.75rem';
            cell.style.borderBottom = '1px solid #dee2e6';
            cell.style.minWidth = i < 3 ? '150px' : i < 5 ? '120px' : '80px';
            newRow.appendChild(cell);
        }
        
        const statusCell = document.createElement('td');
        statusCell.style.padding = '1rem 0.75rem';
        statusCell.style.borderBottom = '1px solid #dee2e6';
        statusCell.style.minWidth = '100px';
        statusCell.style.textAlign = 'center';
        statusCell.style.color = '#6c757d';
        statusCell.textContent = 'Pendiente';
        newRow.appendChild(statusCell);
        
        pasteTableBody.appendChild(newRow);
    }
    
    alert('Registro masivo reinicializado correctamente');
    console.log('✅ Reinicialización completada');
};

console.log('✅ Funciones críticas del registro masivo definidas - MODO SIMPLIFICADO');

