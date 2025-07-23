// === FUNCIONES DEL REGISTRO MASIVO - DEFINIDAS INMEDIATAMENTE ===
// Este archivo se carga ANTES que el HTML para evitar errores de funciones no definidas

console.log('🚀 Cargando funciones del registro masivo...');

// Función para procesar registros masivos
window.procesarRegistrosMasivos = async function() {
    console.log('🔄 procesarRegistrosMasivos llamada');
    
    // Verificar que Firebase esté disponible
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        alert('⚠️ El sistema no puede conectarse a la base de datos.\n\nSolución:\n• Verifica tu conexión a internet\n• Recarga la página (F5)\n• Intenta más tarde');
        return;
    }
    
    console.log('✅ Firebase disponible para verificación de duplicados');
    
    // Verificar que la tabla exista
    const pasteTableBody = document.getElementById('paste-table-body');
    if (!pasteTableBody) {
        alert('Error: Tabla no encontrada');
        return;
    }

    // Contar registros válidos
    let validCount = 0;
    let invalidCount = 0;
    
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
        
        validCount++;
    }

    if (validCount === 0) {
        alert(`No hay registros válidos para procesar.\n\nVálidos: ${validCount}\nInválidos: ${invalidCount}\n\nVerifica los datos e intenta de nuevo.`);
        return;
    }
    
    // Confirmar procesamiento
    if (!confirm(`¿Procesar ${validCount} registros válidos?\n\nVálidos: ${validCount}\nInválidos: ${invalidCount}`)) {
        return;
    }

    // Mostrar barra de progreso
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressPercentage = document.getElementById('progress-percentage');
    const importStatus = document.getElementById('import-massive-status');
    
    if (progressContainer) progressContainer.style.display = 'block';
    if (importStatus) {
        importStatus.style.display = 'block';
        importStatus.className = 'import-status info';
        importStatus.textContent = 'Procesando registros...';
    }
    
    const rows = Array.from(pasteTableBody.rows);
    const totalRows = rows.length;
    let count = 0, errors = 0, duplicates = 0;
    const rowsToRemove = [];
    
    // Obtener usuario actual
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const username = currentUser.username || 'Sistema';
    
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
        
        try {
            // Verificar duplicados en Firebase
            const cedulaClean = cedula.replace(/\D/g, '');
            console.log(`🔍 Verificando duplicado para cédula: ${cedulaClean}`);
            
            // Consulta más específica para duplicados
            const duplicateQuery = window.firebaseDB.votesCollection
                .where('cedula', '==', cedulaClean)
                .limit(1);
            
            const duplicateSnapshot = await duplicateQuery.get();
            console.log(`🔍 Resultado de consulta duplicados: ${duplicateSnapshot.size} registros encontrados`);
            
            if (!duplicateSnapshot.empty) {
                // Duplicado encontrado
                updateCellStatus(cells[7], '🔄 Duplicado', 'duplicate');
                duplicates++;
                console.log(`🔄 Duplicado encontrado: ${name} - ${cedulaClean}`);
                continue;
            }
            
            console.log(`✅ No se encontraron duplicados para: ${name} - ${cedulaClean}`);
            
            // Crear datos del registro
            const voteData = {
                name: name.trim(),
                cedula: cedulaClean,
                telefono: telefono || '',
                sexo: sexo.toUpperCase(),
                edad: parseInt(edad),
                ubch: ubch.trim(),
                community: community.trim(),
                registeredBy: username,
                registeredAt: new Date().toISOString(),
                timestamp: Date.now()
            };
            
            // Guardar en Firebase
            await window.firebaseDB.votesCollection.add(voteData);
            
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
    
    console.log(`🎯 PROCESAMIENTO COMPLETADO: ${count} enviados, ${errors} errores, ${duplicates} duplicados`);
    
    // Actualizar contadores
    if (typeof updateBulkStats === 'function') {
        updateBulkStats(count, errors, duplicates);
    }
};

// Función para limpiar tabla masiva
window.limpiarTablaMasiva = function() {
    console.log('🧹 limpiarTablaMasiva llamada');
    
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

// Función para cargar archivo Excel
window.loadExcelFile = function() {
    console.log('📁 loadExcelFile llamada');
    
    const fileInput = document.getElementById('excel-file-input');
    if (!fileInput) {
        alert('Error: Input de archivo no encontrado');
        return;
    }
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Limpiar tabla actual
                const pasteTableBody = document.getElementById('paste-table-body');
                if (pasteTableBody) {
                    pasteTableBody.innerHTML = '';
                    
                    // Agregar datos del Excel
                    jsonData.forEach((row, index) => {
                        if (index === 0) return; // Saltar encabezados
                        
                        const tr = document.createElement('tr');
                        tr.style.background = '#fff';
                        
                        // Mapear datos según el número de columnas
                        let mappedData = [];
                        
                        if (row.length === 4) {
                            // Formato: Cédula, Teléfono, Sexo, Edad
                            mappedData = [
                                'GRUPO ESCOLAR DOCTOR RAFAEL PEREZ', // Centro de Votación por defecto
                                'ALTAMIRA', // Comunidad por defecto
                                'NOMBRE POR DEFINIR', // Nombre por defecto
                                row[0] || '', // Cédula
                                row[1] || '', // Teléfono
                                row[2] || '', // Sexo
                                row[3] || ''  // Edad
                            ];
                        } else if (row.length === 7) {
                            // Formato completo: Centro, Comunidad, Nombre, Cédula, Teléfono, Sexo, Edad
                            mappedData = row;
                        } else {
                            // Otros formatos, usar los datos disponibles
                            mappedData = [
                                row[0] || '', // Centro de Votación
                                row[1] || '', // Comunidad
                                row[2] || '', // Nombre
                                row[3] || '', // Cédula
                                row[4] || '', // Teléfono
                                row[5] || '', // Sexo
                                row[6] || ''  // Edad
                            ];
                        }
                        
                        // Crear siempre 8 celdas (7 datos + 1 estado)
                        for (let i = 0; i < 8; i++) {
                            const cell = document.createElement('td');
                            if (i < 7) {
                                cell.contentEditable = true;
                                cell.style.padding = '1rem 0.75rem';
                                cell.style.borderBottom = '1px solid #dee2e6';
                                cell.style.minWidth = i < 3 ? '150px' : i < 5 ? '120px' : '80px';
                                cell.textContent = mappedData[i] || '';
                            } else {
                                // Celda de estado (no editable)
                                cell.style.padding = '1rem 0.75rem';
                                cell.style.borderBottom = '1px solid #dee2e6';
                                cell.style.minWidth = '100px';
                                cell.style.textAlign = 'center';
                                cell.style.color = '#6c757d';
                                cell.textContent = 'Pendiente';
                            }
                            tr.appendChild(cell);
                        }
                        pasteTableBody.appendChild(tr);
                    });
                    
                    console.log(`✅ Excel cargado: ${jsonData.length - 1} registros`);
                    alert(`Excel cargado exitosamente: ${jsonData.length - 1} registros`);
                }
            } catch (error) {
                console.error('❌ Error cargando Excel:', error);
                alert('Error cargando el archivo Excel. Verifica el formato.');
            }
        };
        
        reader.readAsBinaryString(file);
    });
    
    fileInput.click();
};

// Función para descargar plantilla
window.downloadTemplate = function() {
    console.log('📋 downloadTemplate llamada');
    alert('Plantilla de ejemplo:\n\nCentro de Votación\tComunidad\tNombre\tCédula\tTeléfono\tSexo\tEdad\nGRUPO ESCOLAR DOCTOR RAFAEL PEREZ\tALTAMIRA\tJuan Pérez\t12345678\t04123456789\tM\t25');
};

// Función para actualizar configuración
window.actualizarConfiguracionMasivo = function() {
    console.log('⚙️ actualizarConfiguracionMasivo llamada');
    alert('Configuración actualizada. Los valores por defecto se aplicarán automáticamente.');
};

// Función para reinicializar
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

// Función para actualizar estado de celda
function updateCellStatus(cell, message, color) {
    if (!cell) return;
    
    cell.textContent = message;
    cell.style.color = color === 'success' ? '#28a745' : 
                      color === 'error' ? '#dc3545' : 
                      color === 'duplicate' ? '#ffc107' : '#6c757d';
    cell.style.fontWeight = 'bold';
}

// Función para cargar librería XLSX
function loadXLSXLibrary() {
    if (typeof XLSX !== 'undefined') {
        console.log('✅ Librería XLSX ya cargada');
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = function() {
        console.log('✅ Librería XLSX cargada');
    };
    script.onerror = function() {
        console.error('❌ Error cargando librería XLSX');
    };
    document.head.appendChild(script);
}

// Cargar librería XLSX al inicio
loadXLSXLibrary();

// Función para probar verificación de duplicados
window.probarVerificacionDuplicados = async function(cedula) {
    console.log(`🧪 Probando verificación de duplicados para cédula: ${cedula}`);
    
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        console.error('❌ Firebase no disponible para prueba');
        return false;
    }
    
    try {
        const cedulaClean = cedula.replace(/\D/g, '');
        const query = window.firebaseDB.votesCollection
            .where('cedula', '==', cedulaClean)
            .limit(1);
        
        const snapshot = await query.get();
        const esDuplicado = !snapshot.empty;
        
        console.log(`🧪 Resultado: ${esDuplicado ? 'DUPLICADO' : 'NO DUPLICADO'} para cédula ${cedulaClean}`);
        return esDuplicado;
    } catch (error) {
        console.error('❌ Error en prueba de duplicados:', error);
        return false;
    }
};

console.log('✅ Funciones del registro masivo cargadas correctamente'); 