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

// Función real para procesarRegistrosMasivos
window.procesarRegistrosMasivos = async function() {
    console.log('🔄 Iniciando procesamiento de registros masivos...');
    
    // Evitar múltiples ejecuciones simultáneas
    if (window.procesandoRegistros) {
        console.log('⚠️ Ya se están procesando registros, espera...');
        return;
    }
    
    window.procesandoRegistros = true;
    
    try {
        const pasteTableBody = document.getElementById('paste-table-body');
        const importStatus = document.getElementById('import-massive-status');
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progressPercentage = document.getElementById('progress-percentage');
        
        if (!pasteTableBody) {
            alert('Error: Tabla no encontrada');
            return;
        }

        // Verificar que Firebase esté disponible
        if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
            console.error('❌ Firebase no está disponible');
            alert('Error: Firebase no está disponible. Intenta recargar la página.');
            return;
        }

        // Verificar que el sistema de votos esté disponible
        if (!window.votingSystem) {
            console.error('❌ Sistema de votos no está disponible');
            alert('Error: Sistema de votos no está disponible. Intenta recargar la página.');
            return;
        }

        // Contar registros válidos y mostrar estadísticas previas
        let validCount = 0;
        let invalidCount = 0;
        let duplicateCount = 0;
        
        for (let tr of pasteTableBody.rows) {
            const cells = Array.from(tr.cells);
            if (cells.length < 7) continue;
            
            const [ubch, community, name, cedula, telefono, sexo, edad] = cells.map(td => td.textContent.trim());
            
            // Validación básica
            if (!ubch || !community || !name || !cedula || !sexo || !edad) {
                invalidCount++;
                continue;
            }
            
            // Validación de formato
            if (!/^\d{6,10}$/.test(cedula) || 
                !['M','F','m','f'].includes(sexo) || 
                isNaN(edad) || edad < 16 || edad > 120) {
                invalidCount++;
                continue;
            }
            
            // Verificar duplicados locales
            const existingLocal = window.votingSystem.votes.find(v => v.cedula === cedula.replace(/\D/g, ''));
            if (existingLocal) {
                duplicateCount++;
                continue;
            }
            
            validCount++;
        }

        console.log(`📊 ANÁLISIS PREVIO:`);
        console.log(`✅ Registros válidos: ${validCount}`);
        console.log(`❌ Registros inválidos: ${invalidCount}`);
        console.log(`🔄 Registros duplicados: ${duplicateCount}`);

        if (validCount === 0) {
            alert(`No hay registros válidos para procesar.\n\nVálidos: ${validCount}\nInválidos: ${invalidCount}\nDuplicados: ${duplicateCount}\n\nVerifica los datos e intenta de nuevo.`);
            return;
        }
        
        // Confirmar procesamiento
        const confirmMessage = `¿Procesar ${validCount} registros válidos?\n\nVálidos: ${validCount}\nInválidos: ${invalidCount}\nDuplicados: ${duplicateCount}`;
        if (!confirm(confirmMessage)) {
            return;
        }

        // Mostrar barra de progreso
        if (progressContainer) progressContainer.style.display = 'block';
        if (importStatus) {
            importStatus.style.display = 'block';
            importStatus.className = 'import-status info';
            importStatus.textContent = 'Procesando registros...';
        }
        
        const rows = Array.from(pasteTableBody.rows);
        const totalRows = rows.length;
        let count = 0, errors = 0, duplicates = 0;
        const rowsToRemove = []; // Filas que se procesaron exitosamente
        
        for (let i = 0; i < rows.length; i++) {
            const tr = rows[i];
            const cells = Array.from(tr.cells);
            if (cells.length < 7) continue;
            
            const [ubch, community, name, cedula, telefono, sexo, edad] = cells.map(td => td.textContent.trim());
            
            // Actualizar progreso
            const progress = Math.round((i / totalRows) * 100);
            if (progressBar) progressBar.style.width = progress + '%';
            if (progressPercentage) progressPercentage.textContent = progress + '%';
            if (progressText) progressText.textContent = `Procesando registro ${i + 1} de ${totalRows}`;
            
            // Validación básica
            if (!ubch || !community || !name || !cedula || !sexo || !edad) {
                errors++;
                updateCellStatus(cells[7], 'Datos incompletos', 'error');
                continue;
            }
            
            // Validación de formato
            if (!/^\d{6,10}$/.test(cedula)) {
                errors++;
                updateCellStatus(cells[7], 'Cédula inválida', 'error');
                continue;
            }
            
            if (!['M','F','m','f'].includes(sexo)) {
                errors++;
                updateCellStatus(cells[7], 'Sexo inválido', 'error');
                continue;
            }
            
            if (isNaN(edad) || edad < 16 || edad > 120) {
                errors++;
                updateCellStatus(cells[7], 'Edad inválida', 'error');
                continue;
            }
            
            // Verificar duplicados
            const existingLocal = window.votingSystem.votes.find(v => v.cedula === cedula.replace(/\D/g, ''));
            if (existingLocal) {
                duplicates++;
                updateCellStatus(cells[7], 'Duplicado', 'duplicate');
                continue;
            }
            
            try {
                // Crear datos del registro
                const voteData = {
                    name: name.trim(),
                    cedula: cedula.replace(/\D/g, ''),
                    telefono: telefono || '',
                    sexo: sexo.toUpperCase(),
                    edad: parseInt(edad),
                    ubch: ubch.trim(),
                    community: community.trim(),
                    registeredBy: window.votingSystem.getCurrentUser()?.username || 'Sistema',
                    registeredAt: new Date().toISOString(),
                    timestamp: Date.now()
                };
                
                // Guardar en Firebase
                await window.votingSystem.saveVoteToFirebase(voteData);
                
                // Marcar como exitoso
                updateCellStatus(cells[7], '✅ Enviado', 'success');
                rowsToRemove.push(tr);
                count++;
                
                console.log(`✅ Registro enviado: ${name} - ${cedula}`);
                
            } catch (error) {
                console.error('❌ Error enviando registro:', error);
                errors++;
                updateCellStatus(cells[7], 'Error de envío', 'error');
            }
        }
        
        // Remover filas exitosas
        rowsToRemove.forEach(tr => tr.remove());
        
        // Ocultar barra de progreso
        if (progressContainer) progressContainer.style.display = 'none';
        
        // Mostrar resultado final
        const resultMessage = `${count} registros enviados exitosamente. ${errors} errores, ${duplicates} duplicados`;
        if (importStatus) {
            importStatus.style.display = 'block';
            importStatus.className = 'import-status success';
            importStatus.textContent = resultMessage;
        }
        
        console.log(`🎯 PROCESAMIENTO COMPLETADO:`);
        console.log(`✅ Enviados: ${count}`);
        console.log(`❌ Errores: ${errors}`);
        console.log(`🔄 Duplicados: ${duplicates}`);
        
        // Mostrar mensaje de éxito
        if (window.votingSystem && typeof window.votingSystem.showMessage === 'function') {
            window.votingSystem.showMessage(resultMessage, 'success', 'registration');
        }
        
        // Actualizar contadores
        if (typeof updateBulkStats === 'function') {
            updateBulkStats(count, errors, duplicates);
        }
        
    } catch (error) {
        console.error('❌ Error general en procesarRegistrosMasivos:', error);
        alert('Error al procesar registros. Revisa la consola para más detalles.');
    } finally {
        // Limpiar flag de procesamiento
        window.procesandoRegistros = false;
    }
};

// Función real para limpiarTablaMasiva
window.limpiarTablaMasiva = function() {
    console.log('🧹 Iniciando limpieza de tabla masiva...');
    
    // Evitar múltiples ejecuciones simultáneas
    if (window.limpiandoTabla) {
        console.log('⚠️ Ya se está limpiando la tabla, espera...');
        return;
    }
    
    window.limpiandoTabla = true;
    
    try {
        const pasteTableBody = document.getElementById('paste-table-body');
        const importStatus = document.getElementById('import-massive-status');
        const progressContainer = document.getElementById('progress-container');
        
        if (!pasteTableBody) {
            console.error('❌ Tabla no encontrada');
            alert('Error: Tabla no encontrada');
            return;
        }
        
        // Confirmar limpieza (solo si hay datos)
        const rows = pasteTableBody.querySelectorAll('tr');
        let hasData = false;
        
        for (let row of rows) {
            const cells = Array.from(row.cells);
            for (let cell of cells) {
                if (cell.textContent.trim() !== '' && cell.textContent.trim() !== 'Pendiente') {
                    hasData = true;
                    break;
                }
            }
            if (hasData) break;
        }
        
        if (hasData) {
            if (!confirm('¿Estás seguro de que quieres limpiar toda la tabla? Esta acción no se puede deshacer.')) {
                console.log('❌ Limpieza cancelada por el usuario');
                return;
            }
        }
        
        // Limpiar tabla completamente
        pasteTableBody.innerHTML = '';
        
        // Agregar una fila vacía limpia
        const newRow = document.createElement('tr');
        newRow.style.background = '#fff';
        
        // Crear las 8 celdas (7 editables + 1 status)
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('td');
            cell.contentEditable = 'true';
            cell.style.padding = '1rem 0.75rem';
            cell.style.borderBottom = '1px solid #dee2e6';
            cell.style.minWidth = i < 3 ? '150px' : i < 5 ? '120px' : '80px';
            newRow.appendChild(cell);
        }
        
        // Celda de estado (no editable)
        const statusCell = document.createElement('td');
        statusCell.style.padding = '1rem 0.75rem';
        statusCell.style.borderBottom = '1px solid #dee2e6';
        statusCell.style.minWidth = '100px';
        statusCell.style.textAlign = 'center';
        statusCell.style.color = '#6c757d';
        statusCell.textContent = 'Pendiente';
        newRow.appendChild(statusCell);
        
        pasteTableBody.appendChild(newRow);
        
        // Ocultar elementos de estado
        if (importStatus) {
            importStatus.style.display = 'none';
            importStatus.textContent = '';
            importStatus.className = 'import-status';
        }
        
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
        
        // Limpiar datos guardados en localStorage
        localStorage.removeItem('bulkRegistrationData');
        console.log('🧹 Datos de tabla masiva eliminados del localStorage');
        
        // Actualizar estadísticas
        if (typeof updateBulkStats === 'function') {
            updateBulkStats(0, 0, 0);
        }
        
        console.log('✅ Tabla limpiada correctamente');
        
        // Mostrar mensaje de éxito
        if (window.votingSystem && typeof window.votingSystem.showMessage === 'function') {
            window.votingSystem.showMessage('Tabla limpiada correctamente', 'success', 'registration');
        }
        
    } catch (error) {
        console.error('❌ Error limpiando tabla:', error);
        alert('Error al limpiar la tabla: ' + error.message);
    } finally {
        // Limpiar flag de limpieza
        window.limpiandoTabla = false;
        console.log('🧹 Limpieza de tabla completada');
    }
};

// Función placeholder para loadExcelFile (se reemplazará más adelante)
window.loadExcelFile = function() {
    console.log('⚠️ loadExcelFile llamada antes de estar completamente definida');
    alert('El sistema está inicializando. Por favor, espera unos segundos y vuelve a intentar.');
};

// Función placeholder para downloadTemplate (se reemplazará más adelante)
window.downloadTemplate = function() {
    console.log('⚠️ downloadTemplate llamada antes de estar completamente definida');
    alert('El sistema está inicializando. Por favor, espera unos segundos y vuelve a intentar.');
};

// Función placeholder para actualizarConfiguracionMasivo (se reemplazará más adelante)
window.actualizarConfiguracionMasivo = function() {
    console.log('⚠️ actualizarConfiguracionMasivo llamada antes de estar completamente definida');
    alert('El sistema está inicializando. Por favor, espera unos segundos y vuelve a intentar.');
};

// Función placeholder para forzarReinicializacionRegistroMasivo (se reemplazará más adelante)
window.forzarReinicializacionRegistroMasivo = function() {
    console.log('⚠️ forzarReinicializacionRegistroMasivo llamada antes de estar completamente definida');
    alert('El sistema está inicializando. Por favor, espera unos segundos y vuelve a intentar.');
};

console.log('✅ Funciones críticas del registro masivo definidas como placeholders');

// Función para reemplazar placeholders con funciones reales
window.reemplazarPlaceholders = function() {
    console.log('🔄 Reemplazando placeholders con funciones reales...');
    
    // Reemplazar procesarRegistrosMasivos
    if (typeof procesarRegistrosMasivos === 'function') {
        window.procesarRegistrosMasivos = procesarRegistrosMasivos;
        console.log('✅ procesarRegistrosMasivos reemplazado con función real');
    }
    
    // Reemplazar limpiarTablaMasiva
    if (typeof limpiarTablaMasiva === 'function') {
        window.limpiarTablaMasiva = limpiarTablaMasiva;
        console.log('✅ limpiarTablaMasiva reemplazado con función real');
    }
    
    // Reemplazar loadExcelFile
    if (typeof loadExcelFile === 'function') {
        window.loadExcelFile = loadExcelFile;
        console.log('✅ loadExcelFile reemplazado con función real');
    }
    
    // Reemplazar downloadTemplate
    if (typeof downloadTemplate === 'function') {
        window.downloadTemplate = downloadTemplate;
        console.log('✅ downloadTemplate reemplazado con función real');
    }
    
    // Reemplazar actualizarConfiguracionMasivo
    if (typeof actualizarConfiguracionMasivo === 'function') {
        window.actualizarConfiguracionMasivo = actualizarConfiguracionMasivo;
        console.log('✅ actualizarConfiguracionMasivo reemplazado con función real');
    }
    
    // Reemplazar forzarReinicializacionRegistroMasivo
    if (typeof forzarReinicializacionRegistroMasivo === 'function') {
        window.forzarReinicializacionRegistroMasivo = forzarReinicializacionRegistroMasivo;
        console.log('✅ forzarReinicializacionRegistroMasivo reemplazado con función real');
    }
    
    console.log('🎯 Placeholders reemplazados correctamente');
};

// Ejecutar reemplazo de placeholders después de un tiempo
setTimeout(() => {
    if (typeof window.reemplazarPlaceholders === 'function') {
        window.reemplazarPlaceholders();
    }
}, 1000);

