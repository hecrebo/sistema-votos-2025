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

// === FUNCIONES GLOBALES PARA REGISTRO ===

// Función global para cambiar modo de registro
window.switchRegistrationMode = function(mode) {
    const individualDiv = document.getElementById('individual-registration');
    const bulkDiv = document.getElementById('bulk-registration');
    const modeButtons = document.querySelectorAll('.mode-btn');
    
    if (!individualDiv || !bulkDiv) {
        console.warn('⚠️ Elementos de modo de registro no encontrados');
        return;
    }
    
    // Actualizar botones
    modeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    // Mostrar/ocultar secciones
    if (mode === 'individual') {
        individualDiv.style.display = 'block';
        bulkDiv.style.display = 'none';
        
        // Reinicializar el formulario individual si es necesario
        setTimeout(() => {
            if (window.votingSystem) {
                window.votingSystem.renderRegistrationPage();
            }
        }, 100);
    } else if (mode === 'bulk') {
        individualDiv.style.display = 'none';
        bulkDiv.style.display = 'block';
    }
    console.log(`✅ Modo de registro cambiado a: ${mode}`);
};

// Función global para importar tabla pegada
window.importPasteTable = async function() {
    const pasteTableBody = document.getElementById('paste-table-body');
    const importStatus = document.getElementById('import-massive-status');
    
    if (!pasteTableBody || !importStatus) {
        alert('Error: Elementos de la tabla no encontrados');
        return;
    }

    // Verificar que Firebase esté disponible
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        alert('Error: Firebase no está disponible. Intenta recargar la página.');
        return;
    }

    importStatus.style.display = 'block';
    importStatus.className = 'import-status info';
    importStatus.textContent = 'Validando y cargando datos...';
    
    let count = 0, errors = 0;
    
    for (let tr of pasteTableBody.rows) {
        const [ubch, community, name, cedula, telefono, sexo, edad] = Array.from(tr.cells).map(td => td.textContent.trim());
        
        // Validación básica (teléfono es opcional)
        if (!ubch || !community || !name || !cedula || !sexo || !edad) {
            errors++;
            tr.style.background = '#fff3cd';
            continue;
        }
        if (!/^\d{6,10}$/.test(cedula)) {
            errors++;
            tr.style.background = '#fff3cd';
            continue;
        }
        // Validar teléfono solo si está presente (es opcional)
        if (telefono && !/^04\d{9}$/.test(telefono)) {
            errors++;
            tr.style.background = '#fff3cd';
            continue;
        }
        if (!['M','F','m','f'].includes(sexo)) {
            errors++;
            tr.style.background = '#fff3cd';
            continue;
        }
        if (isNaN(edad) || edad < 16 || edad > 120) {
            errors++;
            tr.style.background = '#fff3cd';
            continue;
        }
        
        // Preparar datos
        const data = {
            ubch,
            community,
            name,
            cedula: cedula.replace(/\D/g, ''),
            telefono: telefono ? telefono.replace(/\D/g, '') : '',
            sexo: sexo.toUpperCase(),
            edad: parseInt(edad),
            registeredBy: normalizarUsuario(JSON.parse(localStorage.getItem('currentUser')||'{}').username || 'admin'),
            voted: false,
            registeredAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        try {
            // Verificar duplicados por cédula
            const existing = await window.firebaseDB.votesCollection.where('cedula','==',data.cedula).get();
            if (!existing.empty) {
                tr.style.background = '#ffeaa7'; // Amarillo: duplicado
                continue;
            }
            
            // Guardar en Firebase
            await window.firebaseDB.votesCollection.add(data);
            count++;
            tr.style.background = '#d4edda'; // Verde: éxito
        } catch (error) {
            errors++;
            tr.style.background = '#f8d7da'; // Rojo: error
            console.error('Error guardando registro:', error);
        }
    }
    
    importStatus.className = `import-status ${errors > 0 ? 'warning' : 'success'}`;
    importStatus.textContent = `Proceso completado: ${count} registros guardados, ${errors} errores`;
    
    if (count > 0) {
        // Actualizar la interfaz si el sistema de votos está disponible
        if (window.votingSystem) {
            setTimeout(() => {
                window.votingSystem.loadDataFromFirebase();
            }, 1000);
        }
    }
};

// Función global para limpiar tabla
window.clearPasteTable = function() {
    const pasteTableBody = document.getElementById('paste-table-body');
    const importStatus = document.getElementById('import-massive-status');
    
    if (pasteTableBody) {
        pasteTableBody.innerHTML = '<tr><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td style="text-align: center; color: #6c757d;">Pendiente</td></tr>';
        if (importStatus) {
            importStatus.style.display = 'none';
        }
        updateBulkStats();
    }
};

// Función simplificada para validar datos
window.validateBulkData = function() {
    const pasteTableBody = document.getElementById('paste-table-body');
    if (!pasteTableBody) return;
    
    let validCount = 0, errorCount = 0;
    
    for (let tr of pasteTableBody.rows) {
        const cells = Array.from(tr.cells);
        if (cells.length < 7) continue;
        
        const [ubch, community, name, cedula, telefono, sexo, edad] = cells.map(td => td.textContent.trim());
        const statusCell = cells[7];
        
        // Validar campos requeridos
        if (!ubch || !community || !name || !cedula || !sexo || !edad) {
            tr.style.background = '#fff3cd';
            statusCell.innerHTML = '<span style="color: #856404;">⚠️ Campos faltantes</span>';
            errorCount++;
            continue;
        }
        
        // Validar cédula
        if (!/^\d{6,10}$/.test(cedula)) {
            tr.style.background = '#fff3cd';
            statusCell.innerHTML = '<span style="color: #856404;">⚠️ Cédula inválida</span>';
            errorCount++;
            continue;
        }
        
        // Validar teléfono (opcional)
        if (telefono && !/^04\d{9}$/.test(telefono)) {
            tr.style.background = '#fff3cd';
            statusCell.innerHTML = '<span style="color: #856404;">⚠️ Teléfono inválido</span>';
            errorCount++;
            continue;
        }
        
        // Validar sexo (aceptar mayúsculas y minúsculas)
        if (!['M','F','m','f'].includes(sexo)) {
            tr.style.background = '#fff3cd';
            statusCell.innerHTML = '<span style="color: #856404;">⚠️ Sexo inválido</span>';
            errorCount++;
            continue;
        }
        
        // Validar edad
        if (isNaN(edad) || edad < 16 || edad > 120) {
            tr.style.background = '#fff3cd';
            statusCell.innerHTML = '<span style="color: #856404;">⚠️ Edad inválida</span>';
            errorCount++;
            continue;
        }
        
        // Marcar como válido
        tr.style.background = '#e8f5e8';
        statusCell.innerHTML = '<span style="color: #28a745;">✅ Válido</span>';
        validCount++;
    }
    
    updateBulkStats(validCount, errorCount, 0);
    
    const importStatus = document.getElementById('import-massive-status');
    if (importStatus) {
        importStatus.style.display = 'block';
        importStatus.className = `import-status ${errorCount > 0 ? 'warning' : 'success'}`;
        importStatus.textContent = `🔍 Validación: ${validCount} válidos, ${errorCount} errores`;
    }
};

// Función para limpiar filas con errores
window.clearErrorRows = function() {
    const pasteTableBody = document.getElementById('paste-table-body');
    if (!pasteTableBody) return;
    
    const rowsToRemove = [];
    for (let tr of pasteTableBody.rows) {
        if (tr.style.background === 'rgb(255, 243, 205)' || tr.style.background === '#fff3cd') {
            rowsToRemove.push(tr);
        }
    }
    
    rowsToRemove.forEach(row => row.remove());
    updateBulkStats();
    
    const importStatus = document.getElementById('import-massive-status');
    if (importStatus) {
        importStatus.style.display = 'block';
        importStatus.className = 'import-status success';
        importStatus.textContent = `Se eliminaron ${rowsToRemove.length} filas con errores`;
    }
};

// Función para exportar filas con errores
window.exportErrorRows = function() {
    const pasteTableBody = document.getElementById('paste-table-body');
    if (!pasteTableBody) return;
    
    const errorRows = [];
    for (let tr of pasteTableBody.rows) {
        if (tr.style.background === 'rgb(255, 243, 205)' || tr.style.background === '#fff3cd') {
            const cells = Array.from(tr.cells);
            if (cells.length >= 7) {
                errorRows.push({
                    ubch: cells[0].textContent.trim(),
                    community: cells[1].textContent.trim(),
                    name: cells[2].textContent.trim(),
                    cedula: cells[3].textContent.trim(),
                    telefono: cells[4].textContent.trim(),
                    sexo: cells[5].textContent.trim(),
                    edad: cells[6].textContent.trim(),
                    error: cells[7]?.textContent.trim() || 'Error de validación'
                });
            }
        }
    }
    
    if (errorRows.length === 0) {
        alert('No hay filas con errores para exportar');
        return;
    }
    
    // Crear CSV con errores
    let csv = 'Centro de Votación,Comunidad,Nombre,Cédula,Teléfono,Sexo,Edad,Error\n';
    errorRows.forEach(row => {
        csv += `"${row.ubch}","${row.community}","${row.name}","${row.cedula}","${row.telefono}","${row.sexo}","${row.edad}","${row.error}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errores_registro_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Función para descargar plantilla
window.downloadTemplate = function() {
    const template = `Centro de Votación,Comunidad,Nombre,Cédula,Teléfono,Sexo,Edad
COLEGIO ASUNCION BELTRAN,EL VALLE,María González,12345678,04123456789,F,25
LICEO JOSE FELIX RIBAS,EL CUJINAL,Carlos Rodríguez,87654321,04987654321,M,30
COLEGIO ASUNCION BELTRAN,VILLA OASIS,Ana López,11223344,04112233445,F,28`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_registro_masivo.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Función para actualizar estadísticas
function updateBulkStats(valid = 0, errors = 0, duplicates = 0) {
    const pasteTableBody = document.getElementById('paste-table-body');
    if (!pasteTableBody) return;
    
    if (valid === 0 && errors === 0 && duplicates === 0) {
        // Recalcular desde la tabla
        for (let tr of pasteTableBody.rows) {
            const cells = Array.from(tr.cells);
            if (cells.length < 7) continue;
            
            if (tr.style.background === 'rgb(232, 245, 232)' || tr.style.background === '#e8f5e8') {
                valid++;
            } else if (tr.style.background === 'rgb(255, 243, 205)' || tr.style.background === '#fff3cd') {
                errors++;
            } else if (tr.style.background === 'rgb(255, 234, 167)' || tr.style.background === '#ffeaa7') {
                duplicates++;
            }
        }
    }
    
    const total = valid + errors + duplicates;
    
    document.getElementById('valid-count').textContent = valid;
    document.getElementById('error-count').textContent = errors;
    document.getElementById('duplicate-count').textContent = duplicates;
    document.getElementById('total-count').textContent = total;
}

// Evento para actualizar estadísticas cuando se pegue contenido
document.addEventListener('DOMContentLoaded', function() {
    const pasteTable = document.getElementById('paste-table');
    if (pasteTable) {
        pasteTable.addEventListener('paste', function(e) {
            setTimeout(() => {
                updateBulkStats();
                addEmptyRowIfNeeded();
            }, 100);
        });
        
        pasteTable.addEventListener('input', function(e) {
            setTimeout(() => {
                updateBulkStats();
                addEmptyRowIfNeeded();
            }, 100);
        });
    }
});

// Función para agregar fila vacía si es necesario
function addEmptyRowIfNeeded() {
    const pasteTableBody = document.getElementById('paste-table-body');
    if (!pasteTableBody) return;
    
    const rows = pasteTableBody.rows;
    const lastRow = rows[rows.length - 1];
    
    if (lastRow) {
        const cells = Array.from(lastRow.cells);
        const hasContent = cells.some(cell => cell.textContent.trim() !== '');
        
        if (hasContent) {
            // Agregar nueva fila vacía
            const newRow = document.createElement('tr');
            newRow.style.background = '#fff';
            
            for (let i = 0; i < 8; i++) {
                const cell = document.createElement('td');
                if (i < 7) {
                    cell.contentEditable = true;
                    cell.style.padding = '1rem 0.75rem';
                    cell.style.borderBottom = '1px solid #dee2e6';
                    cell.style.minWidth = i < 3 ? '150px' : i < 5 ? '120px' : '80px';
                } else {
                    cell.style.padding = '1rem 0.75rem';
                    cell.style.borderBottom = '1px solid #dee2e6';
                    cell.style.minWidth = '100px';
                    cell.style.textAlign = 'center';
                    cell.style.color = '#6c757d';
                    cell.textContent = 'Pendiente';
                }
                newRow.appendChild(cell);
            }
            
            pasteTableBody.appendChild(newRow);
        }
    }
}

// Función para mostrar tooltips informativos
function showTooltip(element, message) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = message;
    tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        max-width: 200px;
        word-wrap: break-word;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 5) + 'px';
    
    setTimeout(() => {
        if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
    }, 3000);
}

// Agregar tooltips a los botones
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.import-controls-main .btn, .import-controls-secondary .btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            let message = '';
            if (this.textContent.includes('Validar')) {
                message = 'Revisa los datos antes de cargarlos a Firebase';
            } else if (this.textContent.includes('Cargar')) {
                message = 'Envía los datos válidos a Firebase';
            } else if (this.textContent.includes('Limpiar')) {
                message = 'Elimina todos los datos de la tabla';
            } else if (this.textContent.includes('Errores')) {
                message = 'Elimina solo las filas con errores de validación';
            } else if (this.textContent.includes('Exportar')) {
                message = 'Descarga un archivo CSV con los errores encontrados';
            } else if (this.textContent.includes('Plantilla')) {
                message = 'Descarga una plantilla CSV con formato correcto';
            }
            
            if (message) {
                showTooltip(this, message);
            }
        });
    });
    
    // Auto-guardar en localStorage
    const pasteTable = document.getElementById('paste-table');
    if (pasteTable) {
        // Cargar datos guardados al iniciar
        const savedData = localStorage.getItem('bulkRegistrationData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                const pasteTableBody = document.getElementById('paste-table-body');
                if (pasteTableBody && data.rows) {
                    pasteTableBody.innerHTML = '';
                    data.rows.forEach(row => {
                        const tr = document.createElement('tr');
                        tr.style.background = row.background || '#fff';
                        row.cells.forEach((cell, index) => {
                            const td = document.createElement('td');
                            if (index < 7) {
                                td.contentEditable = true;
                                td.style.padding = '1rem 0.75rem';
                                td.style.borderBottom = '1px solid #dee2e6';
                                td.style.minWidth = index < 3 ? '150px' : index < 5 ? '120px' : '80px';
                            } else {
                                td.style.padding = '1rem 0.75rem';
                                td.style.borderBottom = '1px solid #dee2e6';
                                td.style.minWidth = '100px';
                                td.style.textAlign = 'center';
                                td.style.color = '#6c757d';
                            }
                            td.textContent = cell;
                            tr.appendChild(td);
                        });
                        pasteTableBody.appendChild(tr);
                    });
                    updateBulkStats();
                }
            } catch (e) {
                console.error('Error cargando datos guardados:', e);
            }
        }
        
        // Guardar datos automáticamente
        pasteTable.addEventListener('input', function() {
            setTimeout(() => {
                saveBulkDataToLocalStorage();
            }, 1000);
        });
        
        // Inicializar cargador de archivos Excel
        loadXLSXLibrary();
    }
});

// Función para guardar datos en localStorage
function saveBulkDataToLocalStorage() {
    const pasteTableBody = document.getElementById('paste-table-body');
    if (!pasteTableBody) return;
    
    const data = {
        timestamp: new Date().toISOString(),
        rows: []
    };
    
    for (let tr of pasteTableBody.rows) {
        const cells = Array.from(tr.cells);
        const rowData = {
            background: tr.style.background,
            cells: cells.map(cell => cell.textContent.trim())
        };
        data.rows.push(rowData);
    }
    
    localStorage.setItem('bulkRegistrationData', JSON.stringify(data));
}

// Función para cargar archivo Excel
window.loadExcelFile = function() {
    const fileInput = document.getElementById('excel-file-input');
    if (!fileInput) return;
    
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
                        
                        if (row.length === 5) {
                            // Formato: Cédula, Teléfono, Sexo, Edad, (datos adicionales)
                            mappedData = [
                                window.configuracionRegistroMasivo.centroVotacion, // Centro de Votación por defecto
                                window.configuracionRegistroMasivo.comunidad, // Comunidad por defecto
                                window.configuracionRegistroMasivo.nombrePorDefecto, // Nombre por defecto
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
                    
                    updateBulkStats();
                    
                    const importStatus = document.getElementById('import-massive-status');
                    if (importStatus) {
                        importStatus.style.display = 'block';
                        importStatus.className = 'import-status success';
                        importStatus.textContent = `📁 Archivo cargado: ${jsonData.length - 1} registros listos para procesar`;
                    }
                }
            } catch (error) {
                console.error('Error cargando archivo Excel:', error);
                alert('Error al cargar el archivo. Asegúrate de que sea un archivo Excel válido.');
            }
        };
        
        reader.readAsBinaryString(file);
    });
};

// Cargar librería XLSX si no está disponible
function loadXLSXLibrary() {
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = function() {
            console.log('Librería XLSX cargada');
            loadExcelFile();
        };
        document.head.appendChild(script);
    } else {
        loadExcelFile();
    }
}

// Función auxiliar para actualizar el estado de una celda de manera segura
function updateCellStatus(cell, message, color) {
    try {
        if (cell && cell.innerHTML !== undefined) {
            cell.innerHTML = `<span style="color: ${color};">${message}</span>`;
        }
    } catch (error) {
        console.warn('No se pudo actualizar el estado de la celda:', error);
    }
}

// Nueva función para procesar registros masivos (como registro individual)
window.procesarRegistrosMasivos = async function() {
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
        alert('Error: Firebase no está disponible. Intenta recargar la página.');
        return;
    }

    // Contar registros válidos
    let validCount = 0;
    for (let tr of pasteTableBody.rows) {
        const cells = Array.from(tr.cells);
        if (cells.length < 7) continue;
        
        const [ubch, community, name, cedula, telefono, sexo, edad] = cells.map(td => td.textContent.trim());
        if (ubch && community && name && cedula && sexo && edad && 
            /^\d{6,10}$/.test(cedula) && 
            ['M','F','m','f'].includes(sexo) && 
            !isNaN(edad) && edad >= 16 && edad <= 120) {
            validCount++;
        }
    }

        if (validCount === 0) {
            alert('No hay registros válidos para procesar. Verifica los datos.');
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
        
        console.log(`🔄 Iniciando procesamiento de ${totalRows} registros...`);
    
    for (let i = 0; i < rows.length; i++) {
            try {
        const tr = rows[i];
        const cells = Array.from(tr.cells);
                
                // Verificar que la fila tenga suficientes celdas
                if (cells.length < 8) {
                    console.log(`⚠️ Fila ${i + 1} ignorada: no tiene suficientes celdas (${cells.length})`);
                    continue;
                }
        
        const [ubch, community, name, cedula, telefono, sexo, edad] = cells.map(td => td.textContent.trim());
        const statusCell = cells[7];
        
        // Actualizar progreso
        const progress = Math.round(((i + 1) / totalRows) * 100);
                if (progressBar) progressBar.style.width = progress + '%';
                if (progressPercentage) progressPercentage.textContent = progress + '%';
                if (progressText) progressText.textContent = `Procesando registro ${i + 1} de ${totalRows}`;
                
                console.log(`📝 Procesando registro ${i + 1}: ${name} (${cedula})`);
                
                // Validación mejorada (sin problemas de mayúsculas/minúsculas)
        if (!ubch || !community || !name || !cedula || !sexo || !edad) {
            errors++;
                    tr.style.background = '#ffebee'; // Rojo claro para errores
                    updateCellStatus(statusCell, '❌ Campos faltantes', '#d32f2f');
                    console.log(`❌ Registro ${i + 1} inválido: campos faltantes`);
            continue;
        }
        if (!/^\d{6,10}$/.test(cedula)) {
            errors++;
                    tr.style.background = '#ffebee'; // Rojo claro para errores
                    updateCellStatus(statusCell, '❌ Cédula inválida', '#d32f2f');
                    console.log(`❌ Registro ${i + 1} inválido: cédula ${cedula} no válida`);
            continue;
        }
        if (telefono && !/^04\d{9}$/.test(telefono)) {
            errors++;
                    tr.style.background = '#ffebee'; // Rojo claro para errores
                    updateCellStatus(statusCell, '❌ Teléfono inválido', '#d32f2f');
                    console.log(`❌ Registro ${i + 1} inválido: teléfono ${telefono} no válido`);
            continue;
        }
        if (!['M','F','m','f'].includes(sexo)) {
            errors++;
                    tr.style.background = '#ffebee'; // Rojo claro para errores
                    updateCellStatus(statusCell, '❌ Sexo inválido', '#d32f2f');
                    console.log(`❌ Registro ${i + 1} inválido: sexo ${sexo} no válido`);
            continue;
        }
        if (isNaN(edad) || edad < 16 || edad > 120) {
            errors++;
                    tr.style.background = '#ffebee'; // Rojo claro para errores
                    updateCellStatus(statusCell, '❌ Edad inválida', '#d32f2f');
                    console.log(`❌ Registro ${i + 1} inválido: edad ${edad} no válida`);
            continue;
        }
        
                // Preparar datos (normalizar nombres y manejar teléfono opcional)
        const data = {
                    ubch: ubch.trim(),
                    community: community.trim(),
                    name: name.trim(), // Sin normalizar mayúsculas/minúsculas
            cedula: cedula.replace(/\D/g, ''),
                    telefono: telefono ? telefono.replace(/\D/g, '') : '', // Teléfono opcional
            sexo: sexo.toUpperCase(),
            edad: parseInt(edad),
            registeredBy: normalizarUsuario(JSON.parse(localStorage.getItem('currentUser')||'{}').username || 'admin'),
            voted: false,
            registeredAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
                // Verificar duplicados por cédula (solo en la misma sesión)
            const existing = await window.firebaseDB.votesCollection.where('cedula','==',data.cedula).get();
            if (!existing.empty) {
                duplicates++;
                    tr.style.background = '#fff3cd'; // Amarillo para duplicados
                    updateCellStatus(statusCell, '🔄 Duplicado', '#856404');
                    console.log(`🔄 Registro ${i + 1} duplicado: cédula ${data.cedula} ya existe`);
                continue;
            }
            
                // Guardar en Firebase (como registro individual)
            await window.firebaseDB.votesCollection.add(data);
            count++;
                
                // Marcar como exitoso (azul para éxito)
                tr.style.background = '#e3f2fd'; // Azul claro para éxito
                updateCellStatus(statusCell, '✅ Enviado', '#1976d2');
                console.log(`✅ Registro ${i + 1} enviado exitosamente: ${data.name} (${data.cedula})`);
                
                // Marcar fila para eliminar (se procesó exitosamente)
                rowsToRemove.push(tr);
                
        } catch (error) {
            errors++;
                const tr = rows[i];
                const cells = Array.from(tr.cells);
                const statusCell = cells[7];
                
            tr.style.background = '#f8d7da';
                updateCellStatus(statusCell, '❌ Error', '#dc3545');
                console.error(`❌ Error guardando registro ${i + 1}:`, error);
            }
        }
        
        // Eliminar filas procesadas exitosamente
        rowsToRemove.forEach(tr => {
            if (tr.parentNode) {
                tr.parentNode.removeChild(tr);
            }
        });
    
    // Ocultar barra de progreso
        if (progressContainer) progressContainer.style.display = 'none';
    
    // Actualizar estadísticas
    updateBulkStats(count, errors, duplicates);
    
    // Mostrar resultado final
        if (importStatus) {
            let statusClass = 'success';
            let statusMessage = '';
            
            if (count > 0 && errors === 0 && duplicates === 0) {
                statusClass = 'success';
                statusMessage = `✅ ${count} registros enviados exitosamente.`;
            } else if (count > 0) {
                statusClass = 'info';
                statusMessage = `✅ ${count} registros enviados. ${errors > 0 ? `❌ ${errors} errores.` : ''} ${duplicates > 0 ? `🔄 ${duplicates} duplicados.` : ''}`;
            } else if (errors > 0) {
                statusClass = 'error';
                statusMessage = `❌ ${errors} errores encontrados. Revisa los datos.`;
            } else if (duplicates > 0) {
                statusClass = 'warning';
                statusMessage = `🔄 ${duplicates} registros duplicados.`;
            } else {
                statusClass = 'info';
                statusMessage = 'No hay registros válidos para procesar.';
            }
            
            importStatus.className = `import-status ${statusClass}`;
            importStatus.textContent = statusMessage;
        }
        
        // Log final detallado
        console.log(`🎯 PROCESAMIENTO COMPLETADO:`);
        console.log(`✅ Registros enviados: ${count}`);
        console.log(`❌ Errores: ${errors}`);
        console.log(`🔄 Duplicados: ${duplicates}`);
        console.log(`📊 Total procesado: ${totalRows}`);
        console.log(`🗑️ Filas eliminadas: ${rowsToRemove.length}`);
    
    if (count > 0) {
        // Actualizar la interfaz si el sistema de votos está disponible
        if (window.votingSystem) {
            setTimeout(() => {
                window.votingSystem.loadDataFromFirebase();
            }, 1000);
        }
        }
        
    } catch (error) {
        console.error('❌ Error general en procesarRegistrosMasivos:', error);
        alert('Error al procesar registros. Revisa la consola para más detalles.');
    }
};

// Función para limpiar toda la tabla
window.limpiarTablaMasiva = function() {
    const pasteTableBody = document.getElementById('paste-table-body');
    const importStatus = document.getElementById('import-massive-status');
    
    if (pasteTableBody) {
        pasteTableBody.innerHTML = '<tr style="background: #fff;"><td contenteditable="true" style="padding: 1rem 0.75rem; border-bottom: 1px solid #dee2e6; min-width: 150px;"></td><td contenteditable="true" style="padding: 1rem 0.75rem; border-bottom: 1px solid #dee2e6; min-width: 150px;"></td><td contenteditable="true" style="padding: 1rem 0.75rem; border-bottom: 1px solid #dee2e6; min-width: 150px;"></td><td contenteditable="true" style="padding: 1rem 0.75rem; border-bottom: 1px solid #dee2e6; min-width: 120px;"></td><td contenteditable="true" style="padding: 1rem 0.75rem; border-bottom: 1px solid #dee2e6; min-width: 120px;"></td><td contenteditable="true" style="padding: 1rem 0.75rem; border-bottom: 1px solid #dee2e6; min-width: 80px;"></td><td contenteditable="true" style="padding: 1rem 0.75rem; border-bottom: 1px solid #dee2e6; min-width: 80px;"></td><td style="padding: 1rem 0.75rem; border-bottom: 1px solid #dee2e6; min-width: 100px; text-align: center; color: #6c757d;">Pendiente</td></tr>';
        if (importStatus) {
            importStatus.style.display = 'none';
        }
        updateBulkStats();
    }
};

// Clase base para el sistema de votos
class VotingSystem {
    constructor() {
        this.currentPage = 'registration';
        this.votes = [];
        this.candidates = [];
        this.pdfLibrariesReady = false;
        this.projectionInterval = null;
    }

    // Métodos base que pueden ser sobrescritos
    async init() {
        console.log('🔍 Iniciando sistema de votos...');
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
    }

    renderCurrentPage() {
        console.log('📄 Renderizando página actual...');
    }

    showMessage(message, type, page) {
        console.log(`💬 [${type}] ${message}`);
    }

    setLoadingState(page, loading) {
        console.log(`⏳ [${page}] Loading: ${loading}`);
    }
}

class VotingSystemFirebase extends VotingSystem {
    constructor() {
        // Llamar al constructor de la clase padre PRIMERO
        super();
        
        // Evitar múltiples instancias del sistema
        if (window.votingSystem && window.votingSystem !== this) {
            console.log('⚠️ Sistema ya inicializado, evitando duplicación');
            return;
        }
        
        // Inicializar propiedades específicas de Firebase
        this.userId = null;
        this.registrationQueue = [];
        this.isProcessingQueue = false;
        this.concurrentRegistrations = 0;
        this.maxConcurrentRegistrations = 3;
        this.searchTimeout = null;
        this.cache = new Map();
        this.voteToDelete = null;
        this.voteToEdit = null;
        
        // Asegurar que ubchToCommunityMap sea un objeto (no Map)
        this.ubchToCommunityMap = {};
        
        // Marcar como inicializado
        window.votingSystemInitialized = true;
        window.votingSystem = this;
        
        // Nuevas propiedades para mejoras del listado
        this.currentPage = 'registration';
        this.pageSize = 20;
        this.filteredVotes = [];
        this.selectedVotes = [];
        this.currentSearchTerm = '';
        this.currentSortField = null;
        this.currentSortDirection = 'asc';
        this.currentDetailVote = null;
        
        console.log('✅ Instancia de VotingSystemFirebase creada correctamente');
        
        this.init();
    }

    async init() {
        try {
        console.log('🔄 Inicializando VotingSystemFirebase...');
        // Verificar usuario actual y establecer página inicial según rol
        const userForHeader = this.getCurrentUser();
        if (!userForHeader || !userForHeader.username) {
            window.location.href = 'login.html';
            return;
        }
        if (userForHeader.rol === 'verificador') {
            this.currentPage = 'check-in';
        } else if (userForHeader.rol === 'registrador') {
            this.currentPage = 'registration';
        }
        // Cargar datos desde Firebase
        await this.loadDataFromFirebase();
        // Configurar event listeners
        this.setupEventListeners();
        // Renderizar página inicial
        this.renderCurrentPage();
        // Configurar navegación según rol DESPUÉS de cargar datos
        this.setupNavigationByRole();
        // Inicializar sistema offline
        this.inicializarSistemaOffline();
        console.log('✅ VotingSystemFirebase inicializado correctamente');
        this.updateUserId();
        } catch (error) {
            this.handleInitError(error, 'VotingSystemFirebase');
        }
    }

    async loadDataFromFirebase() {
        try {
            // Evitar múltiples cargas simultáneas
            if (this.isLoadingData) {
                console.log('⚠️ Carga de datos en progreso, evitando duplicación');
                return;
            }
            
            this.isLoadingData = true;
            console.log('📥 Cargando datos desde Firebase...');
            
            // Verificar si Firebase está disponible
            if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
                console.log('⚠️ Firebase no disponible, cargando datos locales');
                this.isLoadingData = false;
                return this.loadDataLocally();
            }
            
            // Cargar votos desde Firebase
            const votesSnapshot = await window.firebaseDB.votesCollection.get();
            this.votes = votesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`✅ ${this.votes.length} votos cargados desde Firebase`);

            // Cargar configuración UBCH desde Firebase
            try {
                const ubchDoc = await window.firebaseDB.ubchCollection.doc('config').get();
                if (ubchDoc.exists && ubchDoc.data().mapping) {
                    this.ubchToCommunityMap = ubchDoc.data().mapping;
                    console.log('✅ Configuración CV cargada desde Firebase');
                } else {
                    console.log('⚠️ Configuración CV no encontrada en Firebase, usando configuración por defecto');
                    await this.saveUBCHConfigToFirebase();
                }
                    
                    // Calcular estadísticas claras
                const totalUBCH = this.ubchToCommunityMap && Object.keys(this.ubchToCommunityMap).length || 0;
                const todasLasComunidades = this.ubchToCommunityMap ? Object.values(this.ubchToCommunityMap).flat() : [];
                    const comunidadesUnicas = [...new Set(todasLasComunidades)];
                    
                    console.log(`📊 Configuración CV: ${totalUBCH} centros de votación, ${comunidadesUnicas.length} comunidades únicas`);
                    console.log(`📋 Lista única de comunidades: (${comunidadesUnicas.length}) [${comunidadesUnicas.join(', ')}]`);
                    
                    this.ubchConfigLoaded = true;
                    
            } catch (error) {
                console.error('❌ Error cargando configuración CV:', error);
                // Usar configuración por defecto en caso de error
                this._useDefaultConfig();
            }

            this.isLoadingData = false;
            console.log('✅ Datos cargados desde Firebase:', this.votes.length, 'registros');

        } catch (error) {
            console.error('❌ Error cargando datos de Firebase:', error);
            console.log('🔄 Intentando cargar datos locales como fallback');
            this.isLoadingData = false;
            return this.loadDataLocally();
        }
    }

    // Método de fallback para cargar datos locales
    loadDataLocally() {
        try {
            console.log('📥 Cargando datos locales...');
            
            // Cargar votos locales desde localStorage
            const localVotes = localStorage.getItem('localVotes');
            if (localVotes) {
                this.votes = JSON.parse(localVotes);
                console.log(`✅ ${this.votes.length} votos cargados desde localStorage`);
            } else {
                this.votes = [];
                console.log('✅ No hay votos locales, iniciando con lista vacía');
            }
            
            // Usar configuración UBCH por defecto
            this.ubchToCommunityMap = {
                "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS", "VILLAS DEL CENTRO 1ERA ETAPA", "VILLAS DEL CENTRO 3ERA ETAPA B", "VILLAS DEL CENTRO 3ERA ETAPA C", "VILLAS DEL CENTRO IV ETAPA", "LA CAMACHERA", "CONSOLACIÓN"],
                "LICEO JOSE FELIX RIBAS": ["EL CUJINAL", "LAS MORAS", "VILLA ESPERANZA 200", "VILLAS DEL CENTRO 3ERA ETAPA A", "LOS PALOMARES", "EL LAGO", "CARABALI I Y II", "EL BANCO", "CARIAPRIMA I Y II", "CONSOLACIÓN"],
                "ESCUELA PRIMARIA BOLIVARIANA LA PRADERA": ["EL SAMAN", "GUAYABAL E", "PALOS GRANDES II", "PALOS GRANDES I", "TIERRAS DEL SOL", "LA CASTELLANA", "GARDENIAS I", "GARDENIAS II", "EL CERCADITO", "ALTAMIRA", "LA ENSENADA", "BUCARES", "GUAYABAL", "APAMATE", "EL REFUGIO", "LOS ROBLES", "ARAGUANEY", "CONSOLACIÓN"],
                "CASA COMUNAL JOSE TOMAS GALLARDO": ["JOSE TOMAS GALLARDO A", "JOSE TOMAS GALLARDO B", "ALI PRIMERA", "CONSOLACIÓN"],
                "ESCUELA 5 DE JULIO": ["10 DE AGOSTO", "CAMPO ALEGRE I", "CAMPO ALEGRE II", "5 DE JULIO", "CONSOLACIÓN"],
                "ESCUELA CECILIO ACOSTA": ["VOLUNTAD DE DIOS", "LAS MALVINAS", "BRISAS DEL LAGO", "MAISANTA", "INDIANA SUR", "LOS CASTORES", "CONSOLACIÓN"],
                "ESCUELA BASICA FE Y ALEGRIA": ["FE Y ALEGRIA", "CONSOLACIÓN"],
                "ESCUELA GRADUADA ANTONIO JOSE DE SUCRE": ["PALO NEGRO OESTE", "JESUS DE NAZARETH", "SECTOR BOLIVAR", "PALO NEGRO ESTE", "CONSOLACIÓN"],
                "CASA COMUNAL": ["LOS JABILLOS", "CONSOLACIÓN"],
                "UNIDAD EDUCATIVA MONSEÑOR JOSÉ JACINTO SOTO LAYA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II", "CONSOLACIÓN"],
                "BASE DE MISIONES LUISA CACERES DE ARISMENDI": ["4 DE DICIEMBRE", "23 DE ENERO", "19 DE ABRIL", "EL EREIGUE", "CONSOLACIÓN"],
                "ESCUELA ESTADAL ALEJO ZULOAGA": ["MANUELITA SAENZ", "PANAMERICANO", "CONSOLACIÓN"],
                "UNIDAD EDUCATIVA MONSEÑOR MONTES DE OCA": ["REMATE", "CONSOLACIÓN"],
                "ESCUELA BASICA NACIONAL CONCENTRADA LA ESTACION": ["18 DE OCTUBRE", "CONSOLACIÓN"],
                "ESCUELA RECEPTORIA": ["CARMEN CENTRO", "CENTRO CENTRO", "CONSOLACIÓN"],
                "GRUPO ESCOLAR DR RAFAEL PEREZ": ["VIRGEN DEL CARMEN", "CONSOLACIÓN"],
                "LICEO ALFREDO PIETRI": ["LOS OJITOS", "LOS VENCEDORES", "CONSOLACIÓN"],
                "ESCUELA BOLIVARIANA ROMERO GARCIA": ["SAN BERNARDO", "LA CAPILLA", "LAS HACIENDAS", "CONSOLACIÓN"],
                "ESCUELA GRADUADA PEDRO GUAL": ["BOQUITA CENTRO", "INDIANA NORTE", "CONSOLACIÓN"]
            };
            
            console.log(`✅ Configuración CV cargada: ${Object.keys(this.ubchToCommunityMap).length} CV disponibles`);
            
        } catch (error) {
            console.error('❌ Error cargando datos locales:', error);
            this.votes = [];
            this.ubchToCommunityMap = {};
        }
    }

    // Guardar configuración UBCH en Firebase
    async saveUBCHConfigToFirebase() {
        try {
            await window.firebaseDB.ubchCollection.doc('config').set({
                mapping: this.ubchToCommunityMap,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Configuración CV guardada en Firebase');
        } catch (error) {
            console.error('❌ Error guardando configuración CV:', error);
        }
    }

    setupRealtimeListener() {
        console.log('🔄 Configurando listener en tiempo real...');
        
        try {
            // Limpiar listener anterior si existe
            if (this.unsubscribeListener && typeof this.unsubscribeListener === 'function') {
                console.log('🧹 Limpiando listener anterior...');
                this.unsubscribeListener();
            }
            
            // Verificar que Firebase esté disponible
            if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
                throw new Error('Firebase no está disponible');
            }
        
        // Escuchar cambios en tiempo real
        const unsubscribe = window.firebaseDB.votesCollection.onSnapshot((snapshot) => {
            console.log('📡 Cambio detectado en Firebase:', snapshot.docs.length, 'registros');
            
            // Actualizar datos locales
            this.votes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('✅ Datos actualizados localmente');
            
            // Actualizar TODAS las páginas que muestran datos
            this.updateAllDataDisplays();
            
        }, (error) => {
            console.error('❌ Error en listener de Firebase:', error);
            this.showMessage('Error de sincronización. Reintentando...', 'error', 'registration');
        });
        
        // Guardar la función de unsubscribe para limpiar después
        this.unsubscribeListener = unsubscribe;
        console.log('✅ Listener en tiempo real configurado correctamente');
            
        } catch (error) {
            console.error('❌ Error configurando listener:', error);
            this.unsubscribeListener = null;
        }
    }

    // Función para reinicializar el listener de sincronización
    async reinitializeSyncListener() {
        console.log('🔄 Reinicializando listener de sincronización...');
        
        try {
            // Limpiar listener anterior
            if (this.unsubscribeListener && typeof this.unsubscribeListener === 'function') {
                this.unsubscribeListener();
                this.unsubscribeListener = null;
            }
            
            // Esperar un momento antes de reconfigurar
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Reconfigurar listener
            this.setupRealtimeListener();
            
            console.log('✅ Listener de sincronización reinicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error reinicializando listener:', error);
        }
    }

    // Función para actualizar todas las pantallas de datos
    updateAllDataDisplays() {
        console.log('🔄 Actualizando todas las pantallas...');
        
        // Actualizar indicador de sincronización
        this.updateSyncIndicator(true);
        
        // Actualizar contadores en dashboard
        if (this.currentPage === 'dashboard') {
            this.renderDashboardPage();
        }
        
        // Actualizar tabla de listado
        if (this.currentPage === 'listado') {
            this.renderVotesTable();
        }
        
        // Actualizar estadísticas
        if (this.currentPage === 'statistics') {
            this.renderStatisticsPage();
        }
        
        // Actualizar proyección si está activa
        if (document.getElementById('projection-view').style.display !== 'none') {
            this.updateProjection();
        }
        
        // Mostrar notificación de actualización
        this.showRealtimeUpdate('Datos actualizados en tiempo real');
    }

    // Actualizar indicador de sincronización
    updateSyncIndicator(synced = false, error = false) {
        const indicator = document.getElementById('sync-indicator');
        const text = document.getElementById('sync-text');
        const spinner = document.getElementById('sync-spinner');
        const check = document.getElementById('sync-check');
        
        if (error) {
            indicator.textContent = '❌';
            indicator.className = 'sync-indicator error';
            text.textContent = 'Error de conexión';
            text.className = 'sync-text error';
            if (spinner) spinner.style.display = 'none';
            if (check) { check.style.display = 'none'; check.classList.remove('active'); }
        } else if (synced) {
            indicator.textContent = '';
            indicator.className = 'sync-indicator synced';
            text.textContent = 'Sincronizado';
            text.className = 'sync-text synced';
            if (spinner) spinner.style.display = 'none';
            if (check) { check.style.display = 'inline-block'; setTimeout(() => check.classList.add('active'), 50); }
            // Volver a estado de sincronización después de 3 segundos
            setTimeout(() => {
                indicator.textContent = '';
                indicator.className = 'sync-indicator';
                text.textContent = 'Sincronizando';
                text.className = 'sync-text';
                if (spinner) spinner.style.display = 'inline-block';
                if (check) { check.style.display = 'none'; check.classList.remove('active'); }
            }, 3000);
        } else {
            indicator.textContent = '';
            indicator.className = 'sync-indicator';
            text.textContent = 'Sincronizando';
            text.className = 'sync-text';
            if (spinner) spinner.style.display = 'inline-block';
            if (check) { check.style.display = 'none'; check.classList.remove('active'); }
        }
    }

    // Mostrar notificación de actualización en tiempo real
    showRealtimeUpdate(message) {
        // Remover notificación anterior si existe
        const existingNotification = document.querySelector('.realtime-update');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Crear nueva notificación
        const notification = document.createElement('div');
        notification.className = 'realtime-update';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    async saveVoteToFirebase(voteData) {
        try {
            console.log('💾 Guardando en Firebase:', voteData);
            
            // Verificar si Firebase está disponible
            if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
                console.log('⚠️ Firebase no disponible, guardando localmente');
                return this.saveVoteLocally(voteData);
            }
            
            const docRef = await window.firebaseDB.votesCollection.add({
                ...voteData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Datos guardados en Firebase con ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error guardando en Firebase:', error);
            console.log('🔄 Intentando guardar localmente como fallback');
            return this.saveVoteLocally(voteData);
        }
    }

    // Método de fallback para guardar localmente
    saveVoteLocally(voteData) {
        try {
            const localId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const localVote = {
                id: localId,
                ...voteData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isLocal: true
            };
            
            // Agregar a la lista local
            this.votes.push(localVote);
            
            // Guardar en localStorage
            localStorage.setItem('localVotes', JSON.stringify(this.votes.filter(v => v.isLocal)));
            
            console.log('✅ Datos guardados localmente con ID:', localId);
            return localId;
        } catch (error) {
            console.error('❌ Error guardando localmente:', error);
            throw new Error('No se pudo guardar el registro');
        }
    }

    async updateVoteInFirebase(voteId, updateData) {
        try {
            await window.firebaseDB.votesCollection.doc(voteId).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error actualizando en Firebase:', error);
            throw error;
        }
    }

    async deleteVoteFromFirebase(voteId) {
        try {
            await window.firebaseDB.votesCollection.doc(voteId).delete();
        } catch (error) {
            console.error('Error eliminando de Firebase:', error);
            throw error;
        }
    }

    // Resto de métodos igual que el script original...
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    // Método para obtener el usuario actual (compatible con Firebase)
    getCurrentUser() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (!userData) return null;
            
            const user = JSON.parse(userData);
            const sessionTime = localStorage.getItem('sessionTime');
            
            // Verificar si la sesión ha expirado (24 horas)
            if (sessionTime && (Date.now() - parseInt(sessionTime)) > 24 * 60 * 60 * 1000) {
                this.logout();
                return null;
            }
            
            return user;
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            return null;
        }
    }

    // Método de logout específico para Firebase
    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionTime');
        if (window.location.pathname !== '/login.html') {
            window.location.href = 'login.html';
        }
    }

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

        // Validar Centro de Votación y comunidad
        if (!data.ubch || !data.community) {
            return { isValid: false, message: 'Debe seleccionar Centro de Votación y comunidad' };
        }

        return { isValid: true, message: 'Datos válidos' };
    }

    async handleRegistration() {
        const form = document.getElementById('registration-form');
        if (!form) {
            console.error('❌ Formulario de registro no encontrado');
            this.showMessage('Error: Formulario no encontrado.', 'error', 'registration');
            return;
        }
        
        const formData = new FormData(form);
        
        const name = formData.get('name')?.trim();
        const cedula = formData.get('cedula')?.trim();
        const telefono = formData.get('telefono')?.trim();
        const sexo = formData.get('sexo');
        const edad = formData.get('edad');
        const ubch = formData.get('ubch');
        const community = formData.get('community');

        console.log('📝 Datos del formulario:', { name, cedula, telefono, sexo, edad, ubch, community });

        // Validación inicial (teléfono es opcional)
        if (!name || !cedula || !sexo || !edad || !ubch || !community) {
            this.showMessage('Por favor, completa todos los campos obligatorios.', 'error', 'registration');
            return;
        }

        // Validación de cédula
        if (!/^\d{6,10}$/.test(cedula)) {
            this.showMessage('La cédula debe tener entre 6 y 10 dígitos numéricos.', 'error', 'registration');
            return;
        }

        // Validación de edad
        const edadNum = parseInt(edad);
        if (isNaN(edadNum) || edadNum < 16 || edadNum > 120) {
            this.showMessage('La edad debe estar entre 16 y 120 años.', 'error', 'registration');
            return;
        }

        // Validación de teléfono (opcional pero si se proporciona debe ser válido)
        if (telefono && !/^04\d{9}$/.test(telefono)) {
            this.showMessage('El teléfono debe tener el formato 04xxxxxxxxx.', 'error', 'registration');
            return;
        }

        // Preparar datos
        const registrationData = {
            name,
            cedula: cedula.replace(/\D/g, ''),
            telefono: telefono ? telefono.replace(/\D/g, '') : '',
            sexo,
            edad: edadNum,
            ubch,
            community,
            registeredBy: normalizarUsuario(this.getCurrentUser()?.username || this.userId),
            registradoPor: normalizarUsuario(this.getCurrentUser()?.username || this.userId),
            voted: false,
            registeredAt: new Date().toISOString(),
            fechaRegistro: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        console.log('📋 Datos preparados para registro:', registrationData);

        this.setLoadingState('registration', true);

        try {
            // Usar el sistema de cola offline
            if (window.offlineQueueManager) {
                const registroId = window.offlineQueueManager.guardarEnColaLocal(registrationData);
                this.showMessage('✅ Registro guardado localmente. Se sincronizará automáticamente cuando haya conexión.', 'success', 'registration');
                this.showMessage('👤 Nuevo registro: ' + name + ' en ' + community, 'success', 'registration');
                await this.generateThankYouMessage(name, ubch, community);
                form.reset();
                const stats = window.offlineQueueManager.obtenerEstadisticasCola();
                window.offlineQueueManager.actualizarIndicadorCola(stats.total);
                
                // ASEGURAR que se guarde también en "Mis Registros"
                if (typeof guardarRegistroLocal === 'function') {
                    guardarRegistroLocal({
                        nombre: name,
                        cedula: registrationData.cedula,
                        telefono: registrationData.telefono,
                        sexo: sexo,
                        edad: edadNum,
                        ubch: ubch,
                        comunidad: community,
                        fecha: new Date().toLocaleString()
                    });
                }
                
                if (window.renderMyRecordsTable) window.renderMyRecordsTable();
            } else {
                console.warn('⚠️ Gestor offline no disponible, usando sistema anterior');
                await this.saveVoteToFirebase(registrationData);
                this.showMessage('✅ Registro guardado exitosamente.', 'success', 'registration');
                this.showMessage('👤 Nuevo registro: ' + name + ' en ' + community, 'success', 'registration');
                await this.generateThankYouMessage(name, ubch, community);
                form.reset();
                
                // ASEGURAR que se guarde también en "Mis Registros"
                if (typeof guardarRegistroLocal === 'function') {
                    guardarRegistroLocal({
                        nombre: name,
                        cedula: registrationData.cedula,
                        telefono: registrationData.telefono,
                        sexo: sexo,
                        edad: edadNum,
                        ubch: ubch,
                        comunidad: community,
                        fecha: new Date().toLocaleString()
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error al registrar:', error);
            this.showMessage('Error al registrar persona. Inténtalo de nuevo.', 'error', 'registration');
        } finally {
            this.setLoadingState('registration', false);
        }
    }

    /**
     * Actualizar estado de la cola en la interfaz
     */
    updateQueueStatus() {
        if (!window.queueManager) return;
        
        const stats = window.queueManager.getQueueStats();
        const queueStatusElement = document.getElementById('queue-status');
        
        if (queueStatusElement) {
            if (stats.total > 0) {
                queueStatusElement.innerHTML = `
                    <div class="queue-info">
                        <span class="queue-count">📋 ${stats.total} en cola</span>
                        <span class="queue-status ${stats.isOnline ? 'online' : 'offline'}">
                            ${stats.isOnline ? '🌐 En línea' : '📴 Sin conexión'}
                        </span>
                        ${stats.isProcessing ? '<span class="processing">🔄 Procesando...</span>' : ''}
                    </div>
                `;
                queueStatusElement.style.display = 'block';
            } else {
                queueStatusElement.style.display = 'none';
            }
        }
    }

    async confirmVote(personId) {
        try {
            console.log('✅ Confirmando voto para ID:', personId);
            
            // Verificar que el ID existe en los datos locales
            const vote = this.votes.find(v => v.id === personId);
            if (!vote) {
                console.error('❌ Voto no encontrado localmente con ID:', personId);
                this.showMessage('Error: Voto no encontrado. Intenta buscar nuevamente.', 'error', 'check-in');
                return;
            }
            
            // Verificar que el ID no sea temporal (empiece con 'local_')
            if (personId.startsWith('local_')) {
                console.error('❌ ID temporal detectado:', personId);
                this.showMessage('Error: ID temporal detectado. Intenta buscar nuevamente.', 'error', 'check-in');
                return;
            }
            
            // Obtener usuario actual
            const currentUser = this.getCurrentUser();
            
            // Actualizar en Firebase
            await this.updateVoteInFirebase(personId, {
                voted: true,
                fechaConfirmacion: new Date().toISOString(),
                voteTimestamp: new Date().toISOString(),
                confirmedBy: currentUser.username,
                updatedAt: new Date().toISOString()
            });
            
            // Actualizar localmente también
            const voteIndex = this.votes.findIndex(v => v.id === personId);
            if (voteIndex !== -1) {
                this.votes[voteIndex].voted = true;
                this.votes[voteIndex].fechaConfirmacion = new Date().toISOString();
                this.votes[voteIndex].voteTimestamp = new Date().toISOString();
            }
            
            this.showMessage('¡Voto confirmado con éxito!', 'success', 'check-in');
            
            // Enviar notificación global
            this.showMessage(`🎯 Voto confirmado: ${vote.name} en ${vote.community}`, 'success', true);
            
            document.getElementById('cedula-search').value = '';
            document.getElementById('search-results').innerHTML = '';
            
            // Actualizar todas las pantallas que muestran datos
            this.updateAllDataDisplays();
            
        } catch (error) {
            console.error('❌ Error al confirmar voto:', error);
            
            // Si el error es que el documento no existe, intentar sincronizar y buscar nuevamente
            if (error.message && error.message.includes('No document to update')) {
                console.log('🔄 Documento no encontrado, sincronizando datos...');
                this.showMessage('Sincronizando datos...', 'info', 'check-in');
                
                try {
                    await this.loadDataFromFirebase();
                    this.showMessage('Datos sincronizados. Intenta confirmar el voto nuevamente.', 'info', 'check-in');
                } catch (syncError) {
                    console.error('❌ Error sincronizando datos:', syncError);
                    this.showMessage('Error de sincronización. Inténtalo de nuevo.', 'error', 'check-in');
                }
            } else {
            this.showMessage('Error al confirmar el voto. Inténtalo de nuevo.', 'error', 'check-in');
            }
        }
    }

    async confirmDelete() {
        if (!this.voteToDelete) return;
        // Bloquear eliminación de registros locales
        if (this.voteToDelete.startsWith('local_')) {
            this.showMessage('Este registro aún no ha sido sincronizado. Por favor, espera a que se sincronice para poder eliminarlo.', 'warning', 'listado');
            this.closeDeleteModal();
            return;
        }
        try {
            await this.deleteVoteFromFirebase(this.voteToDelete);
            
            // Enviar notificación global
            this.showMessage(`❌ Registro eliminado del sistema`, 'warning', true);
            
            // Recargar datos desde Firebase para reflejar el cambio
            await this.loadDataFromFirebase();
            this.closeDeleteModal();
        } catch (error) {
            console.error('Error al eliminar:', error);
            this.showMessage('Error al eliminar el registro.', 'error', 'listado');
        }
    }

    // Métodos de renderizado (igual que el original)
    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        // Navegación - usar delegación de eventos para mayor robustez
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                const page = e.target.dataset.page;
                console.log('🖱️ Click en botón de navegación:', page);
                if (page) {
                    this.navigateToPage(page);
                }
            }
        });

        // Formulario de registro
        const registrationForm = document.getElementById('registration-form');
        if (registrationForm) {
            registrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }

        // Formulario de confirmación de voto
        const checkInForm = document.getElementById('check-in-form');
        if (checkInForm) {
            checkInForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCheckIn();
            });
        }

        // Formulario de edición
        const editForm = document.getElementById('edit-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditSubmit(e);
            });
        }

        // Los selects de comunidad y CV son independientes, no necesitan event listeners de vinculación

        // Botones del modal de eliminación
        const cancelDeleteBtn = document.getElementById('cancel-delete');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                this.closeDeleteModal();
            });
        }

        const confirmDeleteBtn = document.getElementById('confirm-delete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.confirmDelete();
            });
        }

        // Botones del modal de edición
        const cancelEditBtn = document.getElementById('cancel-edit');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        // Cerrar modales al hacer clic fuera de ellos
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
                if (e.target.id === 'delete-modal') {
                    this.closeDeleteModal();
                } else if (e.target.id === 'edit-modal') {
                    this.closeEditModal();
                }
            }
        });
        
        console.log('✅ Event listeners configurados correctamente');
    }

    navigateToPage(page) {
        // Verificar permisos según el rol del usuario
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            console.log('Usuario no autenticado');
            return;
        }

        // Control de acceso por rol
        if (currentUser.rol === 'verificador') {
            // Los verificadores pueden acceder a confirmación de votos y sus páginas específicas
            const allowedPages = ['check-in', 'verifier-dashboard', 'verifier-history', 'listado'];
            if (!allowedPages.includes(page)) {
                this.showMessage('No tienes permisos para acceder a esta página.', 'error', 'check-in');
                return;
            }
        } else if (currentUser.rol === 'registrador') {
            // Los registradores pueden acceder a registro, dashboard e historial
            const allowedPages = ['registration', 'registrator-dashboard', 'registrator-history', 'listado'];
            if (!allowedPages.includes(page)) {
                this.showMessage('No tienes permisos para acceder a esta página.', 'error', 'registration');
                return;
            }
        }

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const navBtn = document.querySelector(`[data-page="${page}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
        }
        this.currentPage = page;
        this.renderCurrentPage();
    }

    renderCurrentPage() {
        console.log('🔍 DEBUG: renderCurrentPage llamado con currentPage:', this.currentPage);
        switch (this.currentPage) {
            case 'registration':
                console.log('🔍 DEBUG: Renderizando página de registro...');
                this.renderRegistrationPage();
                break;
            case 'check-in':
                console.log('🔍 DEBUG: Renderizando página de check-in...');
                this.renderCheckInPage();
                break;
            case 'verifier-dashboard':
                console.log('🔍 DEBUG: Renderizando dashboard del verificador...');
                this.renderVerifierDashboard();
                break;
            case 'verifier-history':
                console.log('🔍 DEBUG: Renderizando historial del verificador...');
                this.renderVerifierHistory();
                break;
            case 'registrator-dashboard':
                console.log('🔍 DEBUG: Renderizando dashboard del registrador...');
                this.renderRegistratorDashboard();
                break;
            case 'registrator-history':
                console.log('🔍 DEBUG: Renderizando historial del registrador...');
                this.renderRegistratorHistory();
                break;
            case 'listado':
                console.log('🔍 DEBUG: Renderizando página de listado...');
                this.renderListPage();
                break;
            case 'dashboard':
                console.log('🔍 DEBUG: Renderizando página de dashboard...');
                this.renderDashboardPage();
                break;
            case 'statistics':
                console.log('🔍 DEBUG: Renderizando página de estadísticas...');
                this.renderStatisticsPage();
                break;
            default:
                console.log('🔍 DEBUG: Página no reconocida:', this.currentPage);
        }
    }

    renderRegistrationPage() {
        console.log('🔍 DEBUG: Iniciando renderRegistrationPage...');
        console.log('🔍 DEBUG: this.ubchToCommunityMap:', this.ubchToCommunityMap);
        console.log('🔍 DEBUG: Tipo de ubchToCommunityMap:', typeof this.ubchToCommunityMap);
        console.log('🔍 DEBUG: Keys de ubchToCommunityMap:', Object.keys(this.ubchToCommunityMap));
        
        const ubchSelect = document.getElementById('ubch');
        const communitySelect = document.getElementById('community');
        const form = document.getElementById('registration-form');

        console.log('🔍 DEBUG: Elementos del DOM encontrados:', {
            ubchSelect: !!ubchSelect,
            communitySelect: !!communitySelect,
            form: !!form
        });

        if (!ubchSelect || !communitySelect || !form) {
            console.error('❌ Elementos del formulario no encontrados');
            return;
        }

        // Limpiar selects
        ubchSelect.innerHTML = '<option value="">Selecciona un Centro de Votación (CV)</option>';
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';

        // Verificar si hay datos disponibles
        if (!this.ubchToCommunityMap || Object.keys(this.ubchToCommunityMap).length === 0) {
            console.log('⚠️ No hay datos disponibles, intentando recargar...');
            console.log('🔍 DEBUG: ubchToCommunityMap está vacío o no definido');
            
            // Evitar bucle infinito - solo intentar recargar una vez
            if (this._reloadAttempted) {
                console.log('⚠️ Ya se intentó recargar una vez, usando configuración por defecto');
                this._useDefaultConfig();
                return;
            }
            
            this._reloadAttempted = true;
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
            this.showMessage('Cargando datos...', 'info', 'registration');
            
            // Intentar recargar la configuración
            this.loadDataFromFirebase().then(() => {
                console.log('🔍 DEBUG: Datos recargados, renderizando de nuevo...');
                this.renderRegistrationPage();
            }).catch(error => {
                console.error('❌ Error recargando datos:', error);
                this.showMessage('Error cargando datos. Contacte al administrador.', 'error', 'registration');
                this._useDefaultConfig();
            });
            return;
        }

        // Resetear flag de recarga
        this._reloadAttempted = false;

        console.log('🔍 DEBUG: Datos disponibles, procediendo a cargar formulario...');

        // Habilitar formulario
        form.querySelectorAll('input, select, button').forEach(el => el.disabled = false);

        // Cargar todas las comunidades disponibles (sin vinculación)
        const todasLasComunidades = new Set();
        Object.values(this.ubchToCommunityMap).forEach(comunidades => {
            if (Array.isArray(comunidades)) {
            comunidades.forEach(comunidad => todasLasComunidades.add(comunidad));
            }
        });

        console.log('🔍 DEBUG: Comunidades encontradas:', Array.from(todasLasComunidades));

        // Llenar select de comunidades (independiente)
        console.log(`🔄 Cargando ${todasLasComunidades.size} comunidades en el formulario...`);
        console.log('📋 Lista completa de comunidades:', Array.from(todasLasComunidades).sort());
        
        Array.from(todasLasComunidades).sort().forEach(comunidad => {
            const option = document.createElement('option');
            option.value = comunidad;
            option.textContent = comunidad;
            communitySelect.appendChild(option);
        });

        // Llenar select de Centros de Votación (independiente)
        console.log(`🔄 Cargando ${Object.keys(this.ubchToCommunityMap).length} Centros de Votación en el formulario...`);
        Object.keys(this.ubchToCommunityMap).sort().forEach(ubch => {
            const option = document.createElement('option');
            option.value = ubch;
            option.textContent = ubch;
            ubchSelect.appendChild(option);
        });
        
        console.log('✅ Datos cargados correctamente en el formulario');
        console.log(`📊 Resumen: ${todasLasComunidades.size} comunidades, ${Object.keys(this.ubchToCommunityMap).length} centros de votación`);
        this.showMessage(`Formulario listo con ${todasLasComunidades.size} comunidades disponibles`, 'success', 'registration');

        // Inicializar Choices.js para el autocompletado de comunidades si está disponible
        if (window.initializeChoicesForCommunity) {
            setTimeout(() => {
                window.initializeChoicesForCommunity();
            }, 100);
        }

        // Iniciar sincronización automática si está disponible
        if (window.offlineQueueManager) {
            window.offlineQueueManager.iniciarSincronizacionAutomatica();
        }

        // Actualizar indicadores de estado offline
        this.actualizarIndicadorOffline();
        this.actualizarFormularioOffline();
    }

    // Método para usar configuración por defecto cuando no se pueden cargar los datos
    _useDefaultConfig() {
        console.log('🔄 Usando configuración por defecto...');
        
        // Configuración por defecto
        this.ubchToCommunityMap = {
            "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS", "VILLAS DEL CENTRO 1ERA ETAPA", "VILLAS DEL CENTRO 3ERA ETAPA B", "VILLAS DEL CENTRO 3ERA ETAPA C", "VILLAS DEL CENTRO IV ETAPA", "LA CAMACHERA", "CONSOLACIÓN"],
            "LICEO JOSE FELIX RIBAS": ["EL CUJINAL", "LAS MORAS", "VILLA ESPERANZA 200", "VILLAS DEL CENTRO 3ERA ETAPA A", "LOS PALOMARES", "EL LAGO", "CARABALI I Y II", "EL BANCO", "CARIAPRIMA I Y II", "CONSOLACIÓN"],
            "ESCUELA PRIMARIA BOLIVARIANA LA PRADERA": ["EL SAMAN", "GUAYABAL E", "PALOS GRANDES II", "PALOS GRANDES I", "TIERRAS DEL SOL", "LA CASTELLANA", "GARDENIAS I", "GARDENIAS II", "EL CERCADITO", "ALTAMIRA", "LA ENSENADA", "BUCARES", "GUAYABAL", "APAMATE", "EL REFUGIO", "LOS ROBLES", "ARAGUANEY", "CONSOLACIÓN"],
            "CASA COMUNAL JOSE TOMAS GALLARDO": ["JOSE TOMAS GALLARDO A", "JOSE TOMAS GALLARDO B", "ALI PRIMERA", "CONSOLACIÓN"],
            "ESCUELA 5 DE JULIO": ["10 DE AGOSTO", "CAMPO ALEGRE I", "CAMPO ALEGRE II", "5 DE JULIO", "CONSOLACIÓN"],
            "ESCUELA CECILIO ACOSTA": ["VOLUNTAD DE DIOS", "LAS MALVINAS", "BRISAS DEL LAGO", "MAISANTA", "INDIANA SUR", "LOS CASTORES", "CONSOLACIÓN"],
            "ESCUELA BASICA FE Y ALEGRIA": ["FE Y ALEGRIA", "CONSOLACIÓN"],
            "ESCUELA GRADUADA ANTONIO JOSE DE SUCRE": ["PALO NEGRO OESTE", "JESUS DE NAZARETH", "SECTOR BOLIVAR", "PALO NEGRO ESTE", "CONSOLACIÓN"],
            "CASA COMUNAL": ["LOS JABILLOS", "CONSOLACIÓN"],
            "UNIDAD EDUCATIVA MONSEÑOR JOSÉ JACINTO SOTO LAYA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II", "CONSOLACIÓN"],
            "BASE DE MISIONES LUISA CACERES DE ARISMENDI": ["4 DE DICIEMBRE", "23 DE ENERO", "19 DE ABRIL", "EL EREIGUE", "CONSOLACIÓN"],
            "ESCUELA ESTADAL ALEJO ZULOAGA": ["MANUELITA SAENZ", "PANAMERICANO", "CONSOLACIÓN"],
            "UNIDAD EDUCATIVA MONSEÑOR MONTES DE OCA": ["REMATE", "CONSOLACIÓN"],
            "ESCUELA BASICA NACIONAL CONCENTRADA LA ESTACION": ["18 DE OCTUBRE", "CONSOLACIÓN"],
            "ESCUELA RECEPTORIA": ["CARMEN CENTRO", "CENTRO CENTRO", "CONSOLACIÓN"],
            "GRUPO ESCOLAR DR RAFAEL PEREZ": ["VIRGEN DEL CARMEN", "CONSOLACIÓN"],
            "LICEO ALFREDO PIETRI": ["LOS OJITOS", "LOS VENCEDORES", "CONSOLACIÓN"],
            "ESCUELA BOLIVARIANA ROMERO GARCIA": ["SAN BERNARDO", "LA CAPILLA", "LAS HACIENDAS", "CONSOLACIÓN"],
            "ESCUELA GRADUADA PEDRO GUAL": ["BOQUITA CENTRO", "INDIANA NORTE", "CONSOLACIÓN"]
        };
        
        // Habilitar formulario
        const form = document.getElementById('registration-form');
        if (form) {
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = false);
        }
        
        // Renderizar con configuración por defecto
        this.renderRegistrationPage();
        
        this.showMessage('Sistema funcionando con configuración por defecto', 'warning', 'registration');
    }

    // Los selects de comunidad y CV son independientes, no necesitan funciones de vinculación

    // === FUNCIONES PARA SISTEMA OFFLINE ===

    // Actualizar indicador de estado offline en el header
    actualizarIndicadorOffline() {
        const indicator = document.getElementById('offline-indicator');
        if (!indicator) return;

        if (window.offlineQueueManager) {
            const stats = window.offlineQueueManager.obtenerEstadisticasCola();
            
            if (!stats.online) {
                indicator.className = 'offline-indicator show offline';
                indicator.innerHTML = '<span class="offline-icon">📴</span><span class="offline-text">Sin conexión</span>';
            } else {
                indicator.className = 'offline-indicator show online';
                indicator.innerHTML = '<span class="offline-icon">🌐</span><span class="offline-text">En línea</span>';
            }
        }
    }

    // Actualizar clase del formulario según estado de conexión
    actualizarFormularioOffline() {
        const form = document.getElementById('registration-form');
        if (!form) return;

        if (window.offlineQueueManager) {
            const stats = window.offlineQueueManager.obtenerEstadisticasCola();
            
            if (!stats.online) {
                form.classList.add('offline-mode');
            } else {
                form.classList.remove('offline-mode');
            }
        }
    }

    // Inicializar sistema offline
    inicializarSistemaOffline() {
        if (window.offlineQueueManager) {
            // Actualizar indicadores iniciales
            this.actualizarIndicadorOffline();
            this.actualizarFormularioOffline();
            
            // Configurar listeners para cambios de estado
            window.addEventListener('online', () => {
                this.actualizarIndicadorOffline();
                this.actualizarFormularioOffline();
            });
            
            window.addEventListener('offline', () => {
                this.actualizarIndicadorOffline();
                this.actualizarFormularioOffline();
            });
            
            console.log('✅ Sistema offline inicializado correctamente');
        }
    }

    // === FIN FUNCIONES OFFLINE ===

    renderCheckInPage() {
        // La página ya está renderizada en el HTML
    }

    async handleCheckIn() {
        const cedula = document.getElementById('cedula-search').value.trim();
        
        if (!cedula) {
            this.showMessage('Por favor, ingresa un número de cédula para buscar.', 'error', 'check-in');
            return;
        }

        // Limpiar cédula (solo números)
        const cleanCedula = cedula.replace(/\D/g, '');
        
        if (cleanCedula.length < 6 || cleanCedula.length > 10) {
            this.showMessage('Por favor, ingresa una cédula válida (6 a 10 dígitos).', 'error', 'check-in');
            return;
        }

        this.setLoadingState('check-in', true);

        try {
            // Siempre sincronizar datos antes de buscar para asegurar datos actualizados
            console.log('🔄 Sincronizando datos antes de buscar...');
            await this.loadDataFromFirebase();
            
            // Buscar en datos sincronizados
            let results = this.votes.filter(vote => vote.cedula === cleanCedula);
            
            // Verificar que los resultados tengan IDs válidos (no temporales)
            results = results.filter(vote => !vote.id.startsWith('local_'));
        
        if (results.length === 0) {
                this.showMessage(`No se encontró a ninguna persona con la cédula ${cleanCedula}.`, 'error', 'check-in');
            return;
        }

        this.renderSearchResults(results);
            this.showMessage(`Se encontró ${results.length} persona(s) con la cédula ${cleanCedula}.`, 'success', 'check-in');
            
        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            this.showMessage('Error al buscar. Inténtalo de nuevo.', 'error', 'check-in');
        } finally {
            this.setLoadingState('check-in', false);
        }
    }

    renderSearchResults(results) {
        const container = document.getElementById('search-results');
        container.innerHTML = '';

        results.forEach(person => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            
            // Verificar si la persona ya votó
            const yaVoto = person.voted === true;
            
            div.innerHTML = `
                <div class="search-result-info">
                    <h4>${person.name}</h4>
                    <p>Cédula: ${person.cedula}</p>
                    <p>Sexo: ${person.sexo === 'M' ? 'Masculino' : person.sexo === 'F' ? 'Femenino' : 'N/A'}</p>
                    <p>Edad: ${person.edad || 'N/A'} años</p>
                    <p>CV: ${person.ubch}</p>
                    <p>Comunidad: ${person.community}</p>
                    <p class="vote-status-info">
                        <strong>Estado del voto:</strong> 
                        <span class="vote-status ${yaVoto ? 'voted' : 'not-voted'}">
                            ${yaVoto ? '🎯 Ya confirmado' : '⏳ Pendiente de confirmar'}
                        </span>
                    </p>
                </div>
                ${yaVoto ? 
                    '<div class="already-voted-message">Esta cédula ya fue confirmada anteriormente</div>' :
                    `<button class="btn btn-success" onclick="votingSystem.confirmVote('${person.id}')">
                        Confirmar Voto
                    </button>`
                }
            `;
            container.appendChild(div);
        });
    }

    renderListPage() {
        console.log('🔄 Renderizando página de listado...');
        console.log(`📊 Total de votos cargados: ${this.votes.length}`);
        console.log('📋 Primeros 3 votos:', this.votes.slice(0, 3));
        
        this.renderVotesTable();
        this.setupListPageEventListeners();
        
        // Debug después de renderizar
        setTimeout(() => {
            this.debugListPage();
        }, 100);
    }

    setupListPageEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('list-search');
        const clearSearchBtn = document.getElementById('clear-search');
        const searchFieldSelect = document.getElementById('search-field');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
                clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.handleSearch('');
                clearSearchBtn.style.display = 'none';
            });
        }

        // Ordenamiento
        document.querySelectorAll('.sortable-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const sortField = e.target.dataset.sort;
                this.handleSort(sortField);
            });
        });

        // Filtros principales (Todos, Votaron, No Votaron)
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.closest('.filter-btn').dataset.filter;
                this.handleFilterChange(filter);
            });
        });

        // Filtro de edad
        const ageFilter = document.getElementById('age-filter-select');
        if (ageFilter) {
            ageFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Selección masiva
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const headerCheckbox = document.getElementById('header-checkbox');

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        if (headerCheckbox) {
            headerCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Paginación
        this.setupPaginationEventListeners();

        // Exportar PDF
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                this.exportToPDF();
            });
        }

        // Exportar CSV
        const exportCsvBtn = document.getElementById('export-csv-btn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                // Usa el modo inteligente para registros filtrados o seleccionados
                this.exportToCSVSmart();
            });
        }
    }

    renderVotesTable() {
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';

        // Poblar los selectores de filtro con las opciones disponibles
        this.populateUBCHFilter();
        this.populateCommunityFilter();

        // Inicializar votos filtrados con todos los votos
        this.filteredVotes = [...this.votes];
        this.currentPage = 1;

        // Actualizar todos los contadores
        this.updateAllCounters();

        // Aplicar filtros y renderizar tabla
        this.applyFilters();
    }
    
    // Nuevo método para renderizar votos filtrados optimizado
    renderFilteredVotesTable(filteredVotes) {
        const tbody = document.querySelector('#registros-table tbody');
        if (!tbody) {
            console.error('❌ No se encontró el tbody de la tabla');
            return;
        }
        
        // Usar DocumentFragment para optimizar el renderizado
        const fragment = document.createDocumentFragment();

        console.log(`🔄 Renderizando ${filteredVotes.length} votos en la tabla`);

        // Obtener registros de la página actual
        const pageSize = this.pageSize || 20;
        const startIndex = (this.currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageVotes = filteredVotes.slice(startIndex, endIndex);

        console.log(`📄 Página ${this.currentPage}: mostrando registros ${startIndex + 1} a ${endIndex} de ${filteredVotes.length} total`);

        // Renderizar votos de la página actual usando DocumentFragment
        pageVotes.forEach(vote => {
            const tr = document.createElement('tr');
            const sexoClass = vote.sexo === 'M' ? 'sexo-masculino' : vote.sexo === 'F' ? 'sexo-femenino' : '';
            tr.innerHTML = `
                <td>
                    <input type="checkbox" class="row-checkbox" data-vote-id="${vote.id}" ${this.selectedVotes.includes(vote.id) ? 'checked' : ''}>
                </td>
                <td>${vote.name || 'N/A'}</td>
                <td>${vote.cedula || 'N/A'}</td>
                <td>${vote.telefono || ''}</td>
                <td class="${sexoClass}">${vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'N/A'}</td>
                <td>${vote.edad || 'N/A'}</td>
                <td>${vote.ubch || 'N/A'}</td>
                <td>${vote.community || 'N/A'}</td>
                <td>
                    <span class="vote-status ${vote.voted ? 'voted' : 'not-voted'}">
                        ${vote.voted ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-primary btn-small" onclick="votingSystem.showDetailView('${vote.id}')" title="Ver detalles">
                        👁️
                    </button>
                    ${['admin','superusuario'].includes(this.getCurrentUser()?.rol) ? `
                    <button class="btn btn-primary btn-small" onclick="votingSystem.editVote('${vote.id}')" title="Editar">🔄</button>
                    <button class="btn btn-danger btn-small" onclick="votingSystem.deleteVote('${vote.id}')" title="Eliminar">❌</button>
                    ` : ''}
                </td>
            `;
            fragment.appendChild(tr);
        });

        // Usar requestAnimationFrame para optimizar el renderizado
        requestAnimationFrame(() => {
            // Limpiar tbody y agregar fragmento de una vez
            tbody.innerHTML = '';
            tbody.appendChild(fragment);

            // Configurar eventos de checkbox usando delegación de eventos
            tbody.addEventListener('change', (e) => {
                if (e.target.classList.contains('row-checkbox')) {
                    const voteId = e.target.dataset.voteId;
                    this.toggleVoteSelection(voteId, e.target.checked);
                }
            });
        
                                console.log(`✅ Tabla renderizada con ${pageVotes.length} votos de la página ${this.currentPage}`);
        });
    }

    // Poblar el selector de filtro por UBCH
    populateUBCHFilter() {
        const ubchSelect = document.getElementById('ubch-filter-select');
        if (!ubchSelect) {
            console.warn('⚠️ No se encontró el selector ubch-filter-select');
            return;
        }
        // Obtener todos los Centros de Votación posibles del mapa
        const allCVs = Object.keys(this.ubchToCommunityMap || {}).sort();
        console.log(`🔄 Poblando filtro CV con ${allCVs.length} centros posibles:`, allCVs);
        // Limpiar opciones existentes
        ubchSelect.innerHTML = '<option value="">Todos los CV</option>';
        // Agregar opciones para cada CV
        allCVs.forEach(cv => {
            const option = document.createElement('option');
            option.value = cv;
            option.textContent = cv;
            ubchSelect.appendChild(option);
        });
        console.log(`✅ Filtro CV poblado con ${ubchSelect.options.length} opciones`);
        // Verificar que el evento change esté funcionando
        if (!ubchSelect.hasAttribute('data-event-bound')) {
            ubchSelect.setAttribute('data-event-bound', 'true');
            ubchSelect.addEventListener('change', (e) => {
                console.log(`🔄 Filtro CV cambiado a: "${e.target.value}"`);
                this.applyFilters();
            });
        }
    }
    
    // Poblar el selector de filtro por Comunidad
    populateCommunityFilter() {
        const communitySelect = document.getElementById('community-filter-select');
        if (!communitySelect) {
            console.warn('⚠️ No se encontró el selector community-filter-select');
            return;
        }

        // Obtener todas las comunidades posibles del mapa
        const todasLasComunidades = new Set();
        Object.values(this.ubchToCommunityMap).forEach(comunidades => {
            comunidades.forEach(comunidad => todasLasComunidades.add(comunidad));
        });
        const comunidadesArray = Array.from(todasLasComunidades).sort();
        console.log(`🔄 Poblando filtro Comunidad con ${comunidadesArray.length} comunidades posibles:`, comunidadesArray);
        
        // Limpiar opciones existentes
        communitySelect.innerHTML = '<option value="">Todas las Comunidades</option>';
        
        // Agregar opciones para cada comunidad
        comunidadesArray.forEach(community => {
            const option = document.createElement('option');
            option.value = community;
            option.textContent = community;
            communitySelect.appendChild(option);
        });
        
        console.log(`✅ Filtro Comunidad poblado con ${communitySelect.options.length} opciones`);
        
        // Verificar que el evento change esté funcionando
        if (!communitySelect.hasAttribute('data-event-bound')) {
            communitySelect.setAttribute('data-event-bound', 'true');
            communitySelect.addEventListener('change', (e) => {
                console.log(`🔄 Filtro Comunidad cambiado a: "${e.target.value}"`);
                this.applyFilters();
            });
        }
    }

    // Actualizar todos los contadores
    updateAllCounters() {
        const totalVotes = this.votes.length;
        const votedVotes = this.votes.filter(v => v.voted).length;
        const notVotedVotes = this.votes.filter(v => !v.voted).length;
        
        // Contadores generales
        this.updateCounter('total-counter', totalVotes);
        this.updateCounter('voted-counter', votedVotes);
        this.updateCounter('not-voted-counter', notVotedVotes);
        
        // Contadores en botones de filtro
        this.updateCounter('all-count', totalVotes);
        this.updateCounter('voted-count', votedVotes);
        this.updateCounter('not-voted-count', notVotedVotes);
        
        // Contador de registros mostrados (se actualiza en renderFilteredVotesTable)
    }
    
    // Actualizar contador específico
    updateCounter(elementId, count) {
        const element = document.getElementById(elementId);
        if (element) {
            requestAnimationFrame(() => {
                element.textContent = count.toLocaleString();
            });
        }
    }
    
    // Actualizar información de filtros aplicados
    updateFilterInfo() {
        const filterInfo = document.getElementById('filter-info');
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        const selectedCommunity = document.getElementById('community-filter-select')?.value;
        const selectedAgeRange = document.getElementById('age-filter-select')?.value;
        
        if (filterInfo) {
            const appliedFilters = [];
            
            if (activeFilterBtn && activeFilterBtn.dataset.filter !== 'all') {
                appliedFilters.push(activeFilterBtn.dataset.filter === 'voted' ? 'Votaron' : 'No votaron');
            }
            if (selectedUBCH) appliedFilters.push(`CV: ${selectedUBCH}`);
            if (selectedCommunity) appliedFilters.push(`Comunidad: ${selectedCommunity}`);
            if (selectedAgeRange) appliedFilters.push(`Edad: ${selectedAgeRange}`);
            
            if (appliedFilters.length > 0) {
                filterInfo.style.display = 'flex';
                filterInfo.querySelector('.filter-info-text').textContent = `Filtros: ${appliedFilters.join(', ')}`;
            } else {
                filterInfo.style.display = 'none';
            }
        }
    }
    
    // Actualizar contador de filtros optimizado (mantener para compatibilidad)
    updateFilterCounter(count) {
        // Este método ya no se usa, pero se mantiene para compatibilidad
        console.log(`Contador de filtros: ${count}`);
    }

    // Manejar cambio de filtro
    handleFilterChange(filter) {
        // Remover clase active de todos los botones
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Agregar clase active al botón seleccionado
        const targetBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        // Aplicar filtros y re-renderizar la tabla
        this.applyFilters();
    }

    // Aplicar filtros (para el selector de UBCH y Comunidad)
    applyFilters() {
        console.log('🔄 Aplicando filtros...');
        
        // Obtener filtros activos
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        const selectedCommunity = document.getElementById('community-filter-select')?.value;
        const selectedAgeRange = document.getElementById('age-filter-select')?.value;
        
        console.log('   - Filtro de estado:', activeFilterBtn?.dataset.filter || 'ninguno');
        console.log('   - Filtro UBCH:', selectedUBCH || 'todas');
        console.log('   - Filtro Comunidad:', selectedCommunity || 'todas');
        console.log('   - Filtro Edad:', selectedAgeRange || 'todas');
        
        // Aplicar filtros
        let filteredVotes = this.votes;
        
        // Filtrar por estado de voto
        if (activeFilterBtn) {
            const filter = activeFilterBtn.dataset.filter;
            if (filter === 'voted') {
                filteredVotes = filteredVotes.filter(v => v.voted);
                console.log(`   - Filtrando por votados: ${filteredVotes.length} votos`);
            } else if (filter === 'not-voted') {
                filteredVotes = filteredVotes.filter(v => !v.voted);
                console.log(`   - Filtrando por no votados: ${filteredVotes.length} votos`);
            }
        }
        
        // Filtrar por UBCH
        if (selectedUBCH) {
            const beforeCount = filteredVotes.length;
            filteredVotes = filteredVotes.filter(v => v.ubch === selectedUBCH);
            console.log(`   - Filtrando por UBCH "${selectedUBCH}": ${beforeCount} → ${filteredVotes.length} votos`);
        }
        
        // Filtrar por Comunidad
        if (selectedCommunity) {
            const beforeCount = filteredVotes.length;
            filteredVotes = filteredVotes.filter(v => v.community === selectedCommunity);
            console.log(`   - Filtrando por Comunidad "${selectedCommunity}": ${beforeCount} → ${filteredVotes.length} votos`);
        }

        // Filtrar por rango de edad
        if (selectedAgeRange) {
            const beforeCount = filteredVotes.length;
            filteredVotes = filteredVotes.filter(v => {
                const edad = v.edad || 0;
                switch (selectedAgeRange) {
                    case '16-25': return edad >= 16 && edad <= 25;
                    case '26-35': return edad >= 26 && edad <= 35;
                    case '36-45': return edad >= 36 && edad <= 45;
                    case '46-55': return edad >= 46 && edad <= 55;
                    case '56+': return edad >= 56;
                    default: return true;
                }
            });
            console.log(`   - Filtrando por edad "${selectedAgeRange}": ${beforeCount} → ${filteredVotes.length} votos`);
        }
        
        console.log(`✅ Filtros aplicados: ${filteredVotes.length} votos mostrados de ${this.votes.length} total`);
        
        // Aplicar búsqueda si hay término de búsqueda
        if (this.currentSearchTerm) {
            filteredVotes = this.applySearch(filteredVotes, this.currentSearchTerm);
        }
        
        // Aplicar ordenamiento si hay orden activo
        if (this.currentSortField) {
            filteredVotes = this.applySort(filteredVotes, this.currentSortField, this.currentSortDirection);
        }
        
        // Guardar votos filtrados para paginación
        this.filteredVotes = filteredVotes;
        this.currentPage = 1; // Resetear a la primera página cuando se aplican filtros
        
        // Actualizar información de filtros aplicados
        this.updateFilterInfo();
        
        // Renderizar tabla con votos filtrados
        this.renderFilteredVotesTable(filteredVotes);
        
        // Actualizar paginación
        this.updatePagination();
    }

    // Búsqueda
    handleSearch(searchTerm) {
        this.currentSearchTerm = searchTerm;
        this.applyFilters();
    }

    applySearch(votes, searchTerm) {
        if (!searchTerm.trim()) return votes;
        
        const searchField = document.getElementById('search-field')?.value || 'all';
        const term = searchTerm.toLowerCase();
        
        return votes.filter(vote => {
            if (searchField === 'all') {
                return (
                    (vote.name || '').toLowerCase().includes(term) ||
                    (vote.cedula || '').toLowerCase().includes(term) ||
                    (vote.community || '').toLowerCase().includes(term) ||
                    (vote.ubch || '').toLowerCase().includes(term)
                );
            } else {
                const fieldValue = vote[searchField] || '';
                return fieldValue.toString().toLowerCase().includes(term);
            }
        });
    }

    // Ordenamiento
    handleSort(sortField) {
        const header = document.querySelector(`[data-sort="${sortField}"]`);
        if (!header) {
            console.warn(`⚠️ No se encontró el header para ordenar: ${sortField}`);
            return;
        }
        
        // Limpiar ordenamiento previo
        document.querySelectorAll('.sortable-header').forEach(h => {
            h.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Cambiar dirección de ordenamiento
        if (this.currentSortField === sortField) {
            this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortField = sortField;
            this.currentSortDirection = 'asc';
        }
        
        // Aplicar clase visual
        header.classList.add(this.currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        
        // Aplicar filtros (que incluyen ordenamiento)
        this.applyFilters();
    }

    applySort(votes, sortField, direction) {
        return votes.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];
            
            // Manejar valores nulos
            if (aValue === null || aValue === undefined) aValue = '';
            if (bValue === null || bValue === undefined) bValue = '';
            
            // Convertir a string para comparación
            aValue = aValue.toString().toLowerCase();
            bValue = bValue.toString().toLowerCase();
            
            if (direction === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    }

    // Paginación
    setupPaginationEventListeners() {
        document.getElementById('first-page')?.addEventListener('click', () => this.goToPage(1));
        document.getElementById('prev-page')?.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        document.getElementById('next-page')?.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        document.getElementById('last-page')?.addEventListener('click', () => this.goToPage(this.getTotalPages()));
    }

    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderFilteredVotesTable(this.filteredVotes);
        this.updatePagination();
    }

    getTotalPages() {
        return Math.ceil(this.filteredVotes.length / this.pageSize);
    }

    updatePagination() {
        const totalPages = this.getTotalPages();
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.filteredVotes.length);
        
        console.log(`📄 Actualizando paginación: página ${this.currentPage} de ${totalPages}, registros ${startIndex + 1}-${endIndex} de ${this.filteredVotes.length}`);
        
        // Actualizar información de paginación
        const startElement = document.getElementById('pagination-start');
        const endElement = document.getElementById('pagination-end');
        const totalElement = document.getElementById('pagination-total');
        
        if (startElement) startElement.textContent = this.filteredVotes.length > 0 ? startIndex + 1 : 0;
        if (endElement) endElement.textContent = endIndex;
        if (totalElement) totalElement.textContent = this.filteredVotes.length;
        
        // Actualizar botones de navegación
        const firstBtn = document.getElementById('first-page');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const lastBtn = document.getElementById('last-page');
        
        if (firstBtn) firstBtn.disabled = this.currentPage <= 1;
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
        if (lastBtn) lastBtn.disabled = this.currentPage >= totalPages;
        
        // Generar números de página
        this.generatePageNumbers(totalPages);
    }

    generatePageNumbers(totalPages) {
        const container = document.getElementById('page-numbers');
        container.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `pagination-btn ${i === this.currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener('click', () => this.goToPage(i));
            container.appendChild(btn);
        }
    }

    // Selección masiva
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const voteId = checkbox.dataset.voteId;
            this.toggleVoteSelection(voteId, checked);
        });
        
        this.updateBulkActionsVisibility();
    }

    toggleVoteSelection(voteId, selected) {
        if (selected) {
            if (!this.selectedVotes.includes(voteId)) {
                this.selectedVotes.push(voteId);
            }
        } else {
            this.selectedVotes = this.selectedVotes.filter(id => id !== voteId);
        }
        
        this.updateBulkActionsVisibility();
        this.updateSelectAllCheckbox();
    }

    updateBulkActionsVisibility() {
        const bulkActions = document.getElementById('bulk-actions');
        if (bulkActions) {
            if (this.selectedVotes.length > 0) {
                bulkActions.classList.add('show');
            } else {
                bulkActions.classList.remove('show');
            }
        }
    }

    updateSelectAllCheckbox() {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        const totalCount = checkboxes.length;
        
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const headerCheckbox = document.getElementById('header-checkbox');
        
        if (checkedCount === 0) {
            selectAllCheckbox.checked = false;
            headerCheckbox.checked = false;
        } else if (checkedCount === totalCount) {
            selectAllCheckbox.checked = true;
            headerCheckbox.checked = true;
        } else {
            selectAllCheckbox.checked = false;
            headerCheckbox.checked = false;
        }
    }

    // Acciones masivas
    async bulkConfirmVotes() {
        if (this.selectedVotes.length === 0) return;
        
        const confirmed = confirm(`¿Confirmar votos para ${this.selectedVotes.length} registros seleccionados?`);
        if (!confirmed) return;
        
        this.showLoadingState('list', true);
        
        try {
            for (const voteId of this.selectedVotes) {
                await this.confirmVote(voteId);
            }
            
            this.selectedVotes = [];
            this.updateBulkActionsVisibility();
            this.applyFilters();
            
            // Enviar notificación
            if (window.realtimeNotifications) {
                window.realtimeNotifications.sendNotification(
                    `Se confirmaron ${this.selectedVotes.length} votos masivamente`,
                    'success',
                    'global'
                );
            }
            
        } catch (error) {
            console.error('Error en confirmación masiva:', error);
            this.showMessage('Error al confirmar votos masivamente', 'error', 'list');
        } finally {
            this.showLoadingState('list', false);
        }
    }

    async bulkDeleteVotes() {
        // Verificar permisos para verificadores
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.rol === 'verificador') {
            this.showMessage('Los verificadores no pueden eliminar registros. Contacta al administrador.', 'warning', 'list');
            return;
        }
        
        if (this.selectedVotes.length === 0) return;
        
        const confirmed = confirm(`¿Eliminar ${this.selectedVotes.length} registros seleccionados? Esta acción no se puede deshacer.`);
        if (!confirmed) return;
        
        this.showLoadingState('list', true);
        
        try {
            for (const voteId of this.selectedVotes) {
                await this.deleteVoteFromFirebase(voteId);
            }
            
            this.selectedVotes = [];
            this.updateBulkActionsVisibility();
            this.applyFilters();
            
            // Enviar notificación
            if (window.realtimeNotifications) {
                window.realtimeNotifications.sendNotification(
                    `Se eliminaron ${this.selectedVotes.length} registros masivamente`,
                    'info',
                    'global'
                );
            }
            
        } catch (error) {
            console.error('Error en eliminación masiva:', error);
            this.showMessage('Error al eliminar registros masivamente', 'error', 'list');
        } finally {
            this.showLoadingState('list', false);
        }
    }

    // Método eliminado - funcionalidad integrada en exportToCSVSmart()
    // bulkExportSelected() {
    //     if (this.selectedVotes.length === 0) return;
    //     
    //     const selectedVotesData = this.votes.filter(vote => this.selectedVotes.includes(vote.id));
    //     this.exportVotesToCSV(selectedVotesData, 'votos_seleccionados');
    // }

    // Vista detallada
    showDetailView(voteId) {
        const vote = this.votes.find(v => v.id === voteId);
        if (!vote) return;
        
        this.currentDetailVote = vote;
        
        // Llenar información detallada de manera segura
        const detailElements = {
            'detail-name': vote.name || 'N/A',
            'detail-cedula': vote.cedula || 'N/A',
            'detail-telefono': vote.telefono || 'N/A',
            'detail-sexo': vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'N/A',
            'detail-edad': vote.edad || 'N/A',
            'detail-ubch': vote.ubch || 'N/A',
            'detail-community': vote.community || 'N/A',
            'detail-vote-status': vote.voted ? 'Sí' : 'No',
            'detail-registered-at': vote.registeredAt ? new Date(vote.registeredAt).toLocaleString() : 'N/A',
            'detail-registered-by': vote.registeredBy || 'N/A'
        };
        
        // Actualizar elementos de manera segura
        Object.entries(detailElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Mostrar vista detallada
        const detailView = document.getElementById('detail-view');
        if (detailView) {
            detailView.classList.add('show');
        }
    }

    closeDetailView() {
        const detailView = document.getElementById('detail-view');
        if (detailView) {
            detailView.classList.remove('show');
        }
        this.currentDetailVote = null;
    }

    editFromDetail() {
        if (this.currentDetailVote) {
            this.editVote(this.currentDetailVote.id);
            this.closeDetailView();
        }
    }

    confirmFromDetail() {
        if (this.currentDetailVote) {
            this.confirmVote(this.currentDetailVote.id);
            this.closeDetailView();
        }
    }

    deleteFromDetail() {
        // Verificar permisos para verificadores
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.rol === 'verificador') {
            this.showMessage('Los verificadores no pueden eliminar registros. Contacta al administrador.', 'warning', 'list');
            this.closeDetailView();
            return;
        }
        
        if (this.currentDetailVote) {
            this.deleteVote(this.currentDetailVote.id);
            this.closeDetailView();
        }
    }

    // Estados de carga
    showLoadingState(page, loading) {
        const loadingOverlay = document.getElementById('table-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = loading ? 'flex' : 'none';
        }
    }

    // Método de debug para verificar el estado del sistema
    debugListPage() {
        console.log('🔍 === DEBUG LIST PAGE ===');
        console.log('📊 Votos totales:', this.votes.length);
        console.log('📋 Votos filtrados:', this.filteredVotes.length);
        console.log('📄 Página actual:', this.currentPage);
        console.log('📏 Tamaño de página:', this.pageSize);
        console.log('✅ Elementos seleccionados:', this.selectedVotes.length);
        console.log('🔍 Término de búsqueda:', this.currentSearchTerm);
        console.log('📊 Campo de ordenamiento:', this.currentSortField);
        console.log('📈 Dirección de ordenamiento:', this.currentSortDirection);
        
        // Verificar elementos del DOM
        const table = document.getElementById('registros-table');
        const tbody = table?.querySelector('tbody');
        const paginationContainer = document.getElementById('pagination-container');
        
        console.log('📋 Tabla encontrada:', !!table);
        console.log('📋 Tbody encontrado:', !!tbody);
        console.log('📋 Contenedor de paginación:', !!paginationContainer);
        
        if (tbody) {
            console.log('📋 Filas en tbody:', tbody.children.length);
        }
        
        console.log('🔍 === FIN DEBUG ===');
    }

    deleteVote(voteId) {
        // Verificar permisos para verificadores
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.rol === 'verificador') {
            this.showMessage('Los verificadores no pueden eliminar registros. Contacta al administrador.', 'warning', 'listado');
            return;
        }
        
        this.voteToDelete = voteId;
        document.getElementById('delete-modal').style.display = 'flex';
    }

    editVote(voteId) {
        // Encontrar el registro a editar
        const vote = this.votes.find(v => v.id === voteId);
        if (!vote) {
            this.showMessage('Registro no encontrado', 'error', 'listado');
            return;
        }

        // Guardar el ID del registro que se está editando
        this.voteToEdit = voteId;

        // Llenar el formulario con los datos actuales
        this.populateEditForm(vote);

        // Mostrar el modal de edición
        document.getElementById('edit-modal').style.display = 'flex';
    }

    populateEditForm(vote) {
        // Llenar los campos del formulario
        document.getElementById('edit-name').value = vote.name || '';
        document.getElementById('edit-cedula').value = vote.cedula || '';
        document.getElementById('edit-telefono').value = vote.telefono || '';
        document.getElementById('edit-sexo').value = vote.sexo || '';
        document.getElementById('edit-edad').value = vote.edad || '';

        // Configurar CV y comunidad
        this.populateEditUBCH(vote.ubch, vote.community);
    }

    populateEditUBCH(selectedUBCH, selectedCommunity) {
        const ubchSelect = document.getElementById('edit-ubch');
        const communitySelect = document.getElementById('edit-community');

        // Limpiar opciones existentes
        ubchSelect.innerHTML = '<option value="">Selecciona un CV</option>';
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';

        // Agregar opciones de UBCH
        Object.keys(this.ubchToCommunityMap).forEach(ubch => {
            const option = document.createElement('option');
            option.value = ubch;
            option.textContent = ubch;
            if (ubch === selectedUBCH) {
                option.selected = true;
            }
            ubchSelect.appendChild(option);
        });

        // Configurar comunidades si hay UBCH seleccionada
        if (selectedUBCH && this.ubchToCommunityMap[selectedUBCH]) {
            communitySelect.disabled = false;
            this.ubchToCommunityMap[selectedUBCH].forEach(community => {
                const option = document.createElement('option');
                option.value = community;
                option.textContent = community;
                if (community === selectedCommunity) {
                    option.selected = true;
                }
                communitySelect.appendChild(option);
            });
        } else {
            communitySelect.disabled = true;
        }
    }

    closeEditModal() {
        document.getElementById('edit-modal').style.display = 'none';
        this.voteToEdit = null;
        
        // Limpiar el formulario
        document.getElementById('edit-form').reset();
    }

    async handleEditSubmit(event) {
        event.preventDefault();

        if (!this.voteToEdit) {
            this.showMessage('Error: No hay registro seleccionado para editar', 'error', 'listado');
            return;
        }
        // Bloquear edición de registros locales
        if (this.voteToEdit.startsWith('local_')) {
            this.showMessage('Este registro aún no ha sido sincronizado. Por favor, espera a que se sincronice para poder editarlo.', 'warning', 'listado');
            return;
        }
        // Obtener los datos del formulario
        const formData = new FormData(event.target);
        const editData = {
            name: formData.get('name'),
            cedula: formData.get('cedula'),
            telefono: formData.get('telefono'),
            sexo: formData.get('sexo'),
            edad: parseInt(formData.get('edad')),
            ubch: formData.get('ubch'),
            community: formData.get('community')
        };

        // Validar los datos
        const validation = this.validateRegistrationData(editData);
        if (!validation.isValid) {
            this.showMessage(validation.message, 'error', 'listado');
            return;
        }

        try {
            // Actualizar en Firebase
            await this.updateVoteInFirebase(this.voteToEdit, editData);
            // Recargar datos desde Firebase para reflejar el cambio
            await this.loadDataFromFirebase();
            // Cerrar el modal
            this.closeEditModal();
            // Mostrar mensaje de éxito
            this.showMessage('Registro actualizado correctamente', 'success', 'listado');
        } catch (error) {
            console.error('Error al actualizar registro:', error);
            this.showMessage('Error al actualizar el registro: ' + error.message, 'error', 'listado');
        }
    }

    closeDeleteModal() {
        document.getElementById('delete-modal').style.display = 'none';
        this.voteToDelete = null;
    }

    renderDashboardPage() {
        const totalRegistered = this.votes.length;
        const totalVoted = this.votes.filter(vote => vote.voted).length;
        const percentage = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;

        document.getElementById('total-registered').textContent = totalRegistered;
        document.getElementById('total-voted').textContent = totalVoted;
        document.getElementById('vote-progress').style.width = `${percentage}%`;
        document.getElementById('vote-progress').textContent = '';
        document.getElementById('progress-percentage').textContent = `${percentage.toFixed(1)}%`;
        document.getElementById('progress-text').textContent = `${totalVoted} de ${totalRegistered} personas han votado.`;
    }

    renderStatisticsPage() {
        const votedVotes = this.votes.filter(vote => vote.voted);
        
        // Estadísticas por CV
        const ubchStats = {};
        votedVotes.forEach(vote => {
            ubchStats[vote.ubch] = (ubchStats[vote.ubch] || 0) + 1;
        });

        // Estadísticas por Comunidad
        const communityStats = {};
        votedVotes.forEach(vote => {
            communityStats[vote.community] = (communityStats[vote.community] || 0) + 1;
        });

        // Estadísticas por Sexo
        const sexoStats = {};
        votedVotes.forEach(vote => {
            const sexo = vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'No especificado';
            sexoStats[sexo] = (sexoStats[sexo] || 0) + 1;
        });

        // Estadísticas por Rango de Edad
        const edadStats = {};
        votedVotes.forEach(vote => {
            const edad = vote.edad || 0;
            let rango = 'No especificado';
            
            if (edad >= 16 && edad <= 25) rango = '16-25 años';
            else if (edad >= 26 && edad <= 35) rango = '26-35 años';
            else if (edad >= 36 && edad <= 45) rango = '36-45 años';
            else if (edad >= 46 && edad <= 55) rango = '46-55 años';
            else if (edad >= 56 && edad <= 65) rango = '56-65 años';
            else if (edad >= 66) rango = '66+ años';
            
            edadStats[rango] = (edadStats[rango] || 0) + 1;
        });

        this.renderStatsList('ubch-stats', ubchStats, 'ubch');
        this.renderStatsList('community-stats', communityStats, 'community');
        this.renderStatsList('sexo-stats', sexoStats, 'sexo');
        this.renderStatsList('edad-stats', edadStats, 'edad');

        // --- NUEVO: Renderizar tarjetas de todas las CV abajo ---
        const statsProjectionList = document.getElementById('stats-projection-list');
        if (statsProjectionList) {
            // Obtener todos los CV posibles (ordenados)
            const allCVs = Object.keys(this.ubchToCommunityMap || {}).sort();
            // Contar votos y registrados por CV
            const votosPorCV = {};
            const registradosPorCV = {};
            allCVs.forEach(cv => { votosPorCV[cv] = 0; registradosPorCV[cv] = 0; });
            this.votes.forEach(v => {
                if (v.ubch && registradosPorCV.hasOwnProperty(v.ubch)) {
                    registradosPorCV[v.ubch]++;
                    if (v.voted) votosPorCV[v.ubch]++;
                }
            });
            // Renderizar tarjetas
            statsProjectionList.innerHTML = allCVs.map((cv, i) => {
                const votos = votosPorCV[cv];
                const registrados = registradosPorCV[cv];
                const porcentajeCV = registrados ? ((votos / registrados) * 100).toFixed(1) : 0;
                return `
                <div class='projection-item' style="background:#232946; border-radius:1rem; padding:0.3rem 0.5rem; margin-bottom:0.7rem; box-shadow:0 2px 8px rgba(80,112,255,0.08);">
                    <div class='projection-item-header' style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                        <span class='projection-item-name' style="font-size:1em; font-weight:600; color:#fff;">${i+1}. ${cv}</span>
                        <span class='projection-item-count' style="font-size:1.1em; font-weight:700; color:#43e97b;">${votos}</span>
                    </div>
                    <div style="font-size:0.93em; color:#bfc9d1; margin-bottom:0.2em;">Registrados: ${registrados}</div>
                    <div class='projection-item-progress' style="width:100%; height:0.7rem; background:#374151; border-radius:0.5rem; overflow:hidden; margin-bottom:0.1em;">
                        <div class='projection-item-progress-fill' style="height:100%; background:linear-gradient(90deg,#10b981,#34d399); width:${porcentajeCV}%; transition:width 0.5s; border-radius:0.5rem;"></div>
                    </div>
                    <div style="font-size:0.85em; color:#43e97b;">${porcentajeCV}% participación</div>
                </div>
                `;
            }).join('');
        }
    }

    renderStatsList(containerId, stats, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        const sortedStats = Object.entries(stats).sort(([,a], [,b]) => b - a);

        sortedStats.forEach(([name, count]) => {
            const div = document.createElement('div');
            div.className = `stats-item ${type}`;
            div.innerHTML = `
                <span>${name}</span>
                <span>${count}</span>
            `;
            container.appendChild(div);
        });
    }

    async generateThankYouMessage(name, ubch, community) {
        const messageDiv = document.getElementById('thank-you-message');
        messageDiv.innerHTML = '<p>Generando mensaje...</p>';
        messageDiv.style.display = 'block';

        try {
            const messages = [
                            `¡Excelente ${name}! Tu registro en el Centro de Votación "${ubch}" y comunidad "${community}" es un paso importante para fortalecer nuestra democracia. Tu participación cuenta.`,
                `${name}, gracias por registrarte en "${ubch}". Tu compromiso con la comunidad "${community}" es fundamental para el futuro de nuestro país.`,
                `¡Bienvenido ${name}! Tu registro en "${ubch}" demuestra tu compromiso con la participación ciudadana. Juntos construimos un mejor futuro.`
            ];
            
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            messageDiv.innerHTML = `
                <p><strong>Mensaje para la persona registrada:</strong></p>
                <p>${randomMessage}</p>
            `;
        } catch (error) {
            messageDiv.innerHTML = `
                <p><strong>Mensaje para la persona registrada:</strong></p>
                <p>¡Gracias por tu registro! Tu participación es muy valiosa.</p>
            `;
        }
    }

    setLoadingState(page, loading) {
        const form = document.getElementById(`${page}-form`);
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            submitBtn.disabled = true;
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    showMessage(message, type, page) {
        const messageDiv = document.getElementById(`${page}-message`);
        if (!messageDiv) return; // Evitar error si el elemento no existe
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    loadPdfLibraries() {
        if (window.jspdf) {
            this.pdfLibrariesReady = true;
            return;
        }

        const checkLibraries = () => {
            if (window.jspdf) {
                this.pdfLibrariesReady = true;
            } else {
                setTimeout(checkLibraries, 100);
            }
        };
        checkLibraries();
    }

    // Obtener votos filtrados según los filtros activos
    getFilteredVotes() {
        let filteredVotes = this.votes;
        
        // Filtro por estado de voto
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        if (activeFilterBtn) {
            const filter = activeFilterBtn.dataset.filter;
            if (filter === 'voted') {
                filteredVotes = filteredVotes.filter(v => v.voted);
            } else if (filter === 'not-voted') {
                filteredVotes = filteredVotes.filter(v => !v.voted);
            }
        }
        
        // Filtro por UBCH
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        if (selectedUBCH) {
            filteredVotes = filteredVotes.filter(v => v.ubch === selectedUBCH);
        }
        
        // Filtro por comunidad
        const selectedCommunity = document.getElementById('community-filter-select')?.value;
        if (selectedCommunity) {
            filteredVotes = filteredVotes.filter(v => v.community === selectedCommunity);
        }
        
        // Filtro por rango de edad
        const selectedAgeRange = document.getElementById('age-filter-select')?.value;
        if (selectedAgeRange) {
            filteredVotes = filteredVotes.filter(v => {
                const edad = v.edad || 0;
                switch (selectedAgeRange) {
                    case '16-25': return edad >= 16 && edad <= 25;
                    case '26-35': return edad >= 26 && edad <= 35;
                    case '36-45': return edad >= 36 && edad <= 45;
                    case '46-55': return edad >= 46 && edad <= 55;
                    case '56+': return edad >= 56;
                    default: return true;
                }
            });
        }
        
        // Aplicar búsqueda si hay término de búsqueda
        if (this.currentSearchTerm) {
            filteredVotes = this.applySearch(filteredVotes, this.currentSearchTerm);
        }
        
        return filteredVotes;
    }
    
    // Obtener información de filtros aplicados
    getFilterInfo() {
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const selectedUBCH = document.getElementById('ubch-filter-select')?.value;
        const selectedCommunity = document.getElementById('community-filter-select')?.value;
        const selectedAgeRange = document.getElementById('age-filter-select')?.value;
        
        const filterInfo = {
            hasFilters: false,
            statusFilter: null,
            ubchFilter: null,
            communityFilter: null,
            ageFilter: null,
            searchTerm: this.currentSearchTerm || null
        };
        
        if (activeFilterBtn && activeFilterBtn.dataset.filter !== 'all') {
            filterInfo.statusFilter = activeFilterBtn.dataset.filter === 'voted' ? 'Votaron' : 'No votaron';
            filterInfo.hasFilters = true;
        }
        
        if (selectedUBCH) {
            filterInfo.ubchFilter = selectedUBCH;
            filterInfo.hasFilters = true;
        }
        
        if (selectedCommunity) {
            filterInfo.communityFilter = selectedCommunity;
            filterInfo.hasFilters = true;
        }
        
        if (selectedAgeRange) {
            filterInfo.ageFilter = selectedAgeRange;
            filterInfo.hasFilters = true;
        }
        
        if (this.currentSearchTerm) {
            filterInfo.hasFilters = true;
        }
        
        return filterInfo;
    }
    
    // Generar nombre de archivo con información de filtros
    generateFileName(extension, filterInfo) {
        let fileName = 'listado-personas';
        
        if (filterInfo.hasFilters) {
            const filters = [];
            if (filterInfo.statusFilter) filters.push(filterInfo.statusFilter);
            if (filterInfo.ubchFilter) filters.push(filterInfo.ubchFilter.replace(/[^a-zA-Z0-9]/g, '-'));
            if (filterInfo.communityFilter) filters.push(filterInfo.communityFilter.replace(/[^a-zA-Z0-9]/g, '-'));
            if (filterInfo.ageFilter) filters.push(filterInfo.ageFilter.replace(/[^a-zA-Z0-9]/g, '-'));
            if (filterInfo.searchTerm) filters.push('busqueda');
            
            fileName += `-filtrado-${filters.join('-')}`;
        }
        
        fileName += `-${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}`;
        fileName += `.${extension}`;
        
        return fileName;
    }

    exportToPDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            this.showMessage('Error: Librería PDF no disponible', 'error', 'listado');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Obtener votos filtrados
        const filteredVotes = this.getFilteredVotes();
        const filterInfo = this.getFilterInfo();
        
        // Título
        doc.setFontSize(18);
        doc.text('Listado de Personas Registradas', 20, 20);

        // Información de filtros aplicados
        if (filterInfo.hasFilters) {
            doc.setFontSize(10);
            doc.text('Filtros aplicados:', 20, 30);
            doc.setFontSize(8);
            let yPos = 35;
            if (filterInfo.statusFilter) {
                doc.text(`• Estado: ${filterInfo.statusFilter}`, 25, yPos);
                yPos += 5;
            }
            if (filterInfo.ubchFilter) {
                doc.text(`• CV: ${filterInfo.ubchFilter}`, 25, yPos);
                yPos += 5;
            }
            if (filterInfo.communityFilter) {
                doc.text(`• Comunidad: ${filterInfo.communityFilter}`, 25, yPos);
                yPos += 5;
            }
            doc.text(`• Total de registros: ${filteredVotes.length}`, 25, yPos);
            yPos += 10;
        } else {
            doc.setFontSize(10);
            doc.text(`Total de registros: ${filteredVotes.length}`, 20, 30);
        }

        // Fecha
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, 20, filterInfo.hasFilters ? 55 : 40);

        // Datos de la tabla
        const tableData = filteredVotes.map(vote => [
            vote.name,
            vote.cedula,
            vote.telefono || '',
            vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'N/A',
            vote.edad || 'N/A',
            vote.ubch,
            vote.community,
            vote.voted ? 'Sí' : 'No'
        ]);

        doc.autoTable({
            head: [['Nombre', 'Cédula', 'Teléfono', 'Sexo', 'Edad', 'CV', 'Comunidad', 'Votó']],
            body: tableData,
            startY: filterInfo.hasFilters ? 65 : 50,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });

        // Generar nombre de archivo con filtros
        const fileName = this.generateFileName('pdf', filterInfo);
        
        // Guardar PDF
        doc.save(fileName);
        this.showMessage(`PDF generado: ${fileName}`, 'success', 'listado');
    }

    // Método inteligente para exportar CSV
    exportToCSVSmart() {
        // Verificar si hay registros seleccionados
        if (this.selectedVotes.length > 0) {
            // Exportar solo los registros seleccionados
            const selectedVotesData = this.votes.filter(vote => this.selectedVotes.includes(vote.id));
            this.exportVotesToCSV(selectedVotesData, 'votos_seleccionados');
            this.showMessage(`CSV generado con ${selectedVotesData.length} registros seleccionados`, 'success', 'listado');
        } else {
            // Exportar todos los registros filtrados según los filtros activos
            const filteredVotes = this.getFilteredVotes();
            const filterInfo = this.getFilterInfo();
            
            if (filteredVotes.length === 0) {
                this.showMessage('No hay registros para exportar con los filtros aplicados', 'warning', 'listado');
                return;
            }
            
            // Generar nombre de archivo con información de filtros
            const fileName = this.generateFileName('csv', filterInfo);
            this.exportVotesToCSV(filteredVotes, fileName.replace('.csv', ''));
            
            // Mostrar información detallada sobre los filtros aplicados
            let filterMessage = `CSV generado: ${fileName} con ${filteredVotes.length} registros`;
            if (filterInfo.hasFilters) {
                const appliedFilters = [];
                if (filterInfo.statusFilter) appliedFilters.push(filterInfo.statusFilter);
                if (filterInfo.ubchFilter) appliedFilters.push(`CV: ${filterInfo.ubchFilter}`);
                if (filterInfo.communityFilter) appliedFilters.push(`Comunidad: ${filterInfo.communityFilter}`);
                if (filterInfo.ageFilter) appliedFilters.push(`Edad: ${filterInfo.ageFilter}`);
                if (filterInfo.searchTerm) appliedFilters.push(`Búsqueda: "${filterInfo.searchTerm}"`);
                
                filterMessage += `\nFiltros aplicados: ${appliedFilters.join(', ')}`;
            }
            
            this.showMessage(filterMessage, 'success', 'listado');
        }
    }

    // Método para exportar registros específicos a CSV
    exportVotesToCSV(votesData, fileName) {
        const headers = ['Nombre', 'Cédula', 'Teléfono', 'Sexo', 'Edad', 'CV', 'Comunidad', 'Votó'];
        const rows = votesData.map(vote => [
            `"${(vote.name || '').replace(/"/g, '""')}"`,
            `"${(vote.cedula || '').replace(/"/g, '""')}"`,
            `"${(vote.telefono || '').replace(/"/g, '""')}"`,
            `"${vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : ''}"`,
            `"${vote.edad || ''}"`,
            `"${(vote.ubch || '').replace(/"/g, '""')}"`,
            `"${(vote.community || '').replace(/"/g, '""')}"`,
            `"${vote.voted ? 'Sí' : 'No'}"`
        ]);
        
        let csvContent = headers.join(';') + '\r\n';
        rows.forEach(row => {
            csvContent += row.join(';') + '\r\n';
        });
        
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${fileName}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportToCSV() {
        // Obtener votos filtrados
        const filteredVotes = this.getFilteredVotes();
        const filterInfo = this.getFilterInfo();
        
        const headers = ['Nombre', 'Cédula', 'Teléfono', 'Sexo', 'Edad', 'CV', 'Comunidad', 'Votó'];
        const rows = filteredVotes.map(vote => [
            `"${(vote.name || '').replace(/"/g, '""')}"`,
            `"${(vote.cedula || '').replace(/"/g, '""')}"`,
            `"${(vote.telefono || '').replace(/"/g, '""')}"`,
            `"${vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : ''}"`,
            `"${vote.edad || ''}"`,
            `"${(vote.ubch || '').replace(/"/g, '""')}"`,
            `"${(vote.community || '').replace(/"/g, '""')}"`,
            `"${vote.voted ? 'Sí' : 'No'}"`
        ]);
        
        let csvContent = headers.join(';') + '\r\n';
        rows.forEach(row => {
            csvContent += row.join(';') + '\r\n';
        });
        
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        // Generar nombre de archivo con filtros
        const fileName = this.generateFileName('csv', filterInfo);
        link.setAttribute('download', fileName);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showMessage(`CSV generado: ${fileName}`, 'success', 'listado');
    }

    // Función para forzar recarga de configuración y actualizar Firebase
    async forzarRecargaConfiguracion() {
        console.log('🔄 Forzando recarga y actualización de configuración en Firebase...');
        // Configuración local correcta
        const configCorrecta = {
            "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS", "VILLAS DEL CENTRO 1ERA ETAPA", "VILLAS DEL CENTRO 3ERA ETAPA B", "VILLAS DEL CENTRO 3ERA ETAPA C", "VILLAS DEL CENTRO IV ETAPA", "LA CAMACHERA", "CONSOLACIÓN"],
            "LICEO JOSE FELIX RIBAS": ["EL CUJINAL", "LAS MORAS", "VILLA ESPERANZA 200", "VILLAS DEL CENTRO 3ERA ETAPA A", "LOS PALOMARES", "EL LAGO", "CARABALI I Y II", "EL BANCO", "CARIAPRIMA I Y II", "CONSOLACIÓN"],
            "ESCUELA PRIMARIA BOLIVARIANA LA PRADERA": ["EL SAMAN", "GUAYABAL E", "PALOS GRANDES II", "PALOS GRANDES I", "TIERRAS DEL SOL", "LA CASTELLANA", "GARDENIAS I", "GARDENIAS II", "EL CERCADITO", "ALTAMIRA", "LA ENSENADA", "BUCARES", "GUAYABAL", "APAMATE", "EL REFUGIO", "LOS ROBLES", "ARAGUANEY", "CONSOLACIÓN"],
            "CASA COMUNAL JOSE TOMAS GALLARDO": ["JOSE TOMAS GALLARDO A", "JOSE TOMAS GALLARDO B", "ALI PRIMERA", "CONSOLACIÓN"],
            "ESCUELA 5 DE JULIO": ["10 DE AGOSTO", "CAMPO ALEGRE I", "CAMPO ALEGRE II", "5 DE JULIO", "CONSOLACIÓN"],
            "ESCUELA CECILIO ACOSTA": ["VOLUNTAD DE DIOS", "LAS MALVINAS", "BRISAS DEL LAGO", "MAISANTA", "INDIANA SUR", "LOS CASTORES", "CONSOLACIÓN"],
            "ESCUELA BASICA FE Y ALEGRIA": ["FE Y ALEGRIA", "CONSOLACIÓN"],
            "ESCUELA GRADUADA ANTONIO JOSE DE SUCRE": ["PALO NEGRO OESTE", "JESUS DE NAZARETH", "SECTOR BOLIVAR", "PALO NEGRO ESTE", "CONSOLACIÓN"],
            "CASA COMUNAL": ["LOS JABILLOS", "CONSOLACIÓN"],
            "UNIDAD EDUCATIVA MONSEÑOR JOSÉ JACINTO SOTO LAYA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II", "CONSOLACIÓN"],
            "BASE DE MISIONES LUISA CACERES DE ARISMENDI": ["4 DE DICIEMBRE", "23 DE ENERO", "19 DE ABRIL", "EL EREIGUE", "CONSOLACIÓN"],
            "ESCUELA ESTADAL ALEJO ZULOAGA": ["MANUELITA SAENZ", "PANAMERICANO", "CONSOLACIÓN"],
            "UNIDAD EDUCATIVA MONSEÑOR MONTES DE OCA": ["REMATE", "CONSOLACIÓN"],
            "ESCUELA BASICA NACIONAL CONCENTRADA LA ESTACION": ["18 DE OCTUBRE", "CONSOLACIÓN"],
            "ESCUELA RECEPTORIA": ["CARMEN CENTRO", "CENTRO CENTRO", "CONSOLACIÓN"],
            "GRUPO ESCOLAR DR RAFAEL PEREZ": ["VIRGEN DEL CARMEN", "CONSOLACIÓN"],
            "LICEO ALFREDO PIETRI": ["LOS OJITOS", "LOS VENCEDORES", "CONSOLACIÓN"],
            "ESCUELA BOLIVARIANA ROMERO GARCIA": ["SAN BERNARDO", "LA CAPILLA", "LAS HACIENDAS", "CONSOLACIÓN"],
            "ESCUELA GRADUADA PEDRO GUAL": ["BOQUITA CENTRO", "INDIANA NORTE", "CONSOLACIÓN"]
        };
        // Actualizar en memoria y en Firebase
        this.ubchToCommunityMap = configCorrecta;
        if (window.firebaseDB && window.firebaseDB.ubchCollection) {
            await window.firebaseDB.ubchCollection.doc('config').set({
                mapping: configCorrecta,
                lastUpdated: (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue && window.firebase.firestore.FieldValue.serverTimestamp) ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date()
            });
            console.log('✅ Configuración CV actualizada en Firebase');
        } else {
            console.warn('⚠️ No se pudo actualizar Firebase, usando solo local');
        }
        // Re-renderizar la página actual
        if (this.currentPage === 'registration') {
            this.renderRegistrationPage();
        }
        this.showMessage('Configuración actualizada correctamente en Firebase y local', 'success', 'registration');
    }

    // Método para sincronización de datos (requerido por auto-init.js)
    async syncData() {
        try {
            console.log('🔄 Sincronizando datos...');
            await this.loadDataFromFirebase();
            this.updateAllDataDisplays();
            console.log('✅ Datos sincronizados correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error sincronizando datos:', error);
            return false;
        }
    }

    async loadRegistrations() {
        try {
            console.log('📥 Cargando datos desde Firebase...');
            const snapshot = await this.votesCollection.get();
            this.votes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`✅ ${this.votes.length} votos cargados desde Firebase`);
            
            // Cargar configuración UBCH solo una vez
            if (!this.ubchConfigLoaded) {
                await this.loadUBCHConfig();
                this.ubchConfigLoaded = true;
            }
            
            this.updateAllScreens();
            return this.votes;
        } catch (error) {
            console.error('❌ Error cargando registros:', error);
            throw error;
        }
    }

    setupNavigationByRole() {
        console.log('🔧 Configurando navegación por rol...');
        
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            console.log('⚠️ No hay usuario autenticado');
            return;
        }

        console.log('👤 Usuario actual:', currentUser.username, 'Rol:', currentUser.rol);

        // Ocultar todos los botones primero
        const navButtons = document.querySelectorAll('.nav-btn');
        console.log('🔍 Encontrados', navButtons.length, 'botones de navegación');
        
        navButtons.forEach(btn => {
            btn.style.display = 'none';
            btn.classList.remove('active');
            console.log('🚫 Ocultando botón:', btn.textContent.trim(), 'ID:', btn.id);
        });
        
        // Ocultar botones de eliminación para verificadores
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        const detailDeleteBtn = document.getElementById('detail-delete-btn');
        
        if (currentUser.rol === 'verificador') {
            if (bulkDeleteBtn) {
                bulkDeleteBtn.style.display = 'none';
                console.log('🚫 Botón de eliminación masiva oculto para verificador');
            }
            if (detailDeleteBtn) {
                detailDeleteBtn.style.display = 'none';
                console.log('🚫 Botón de eliminación en vista detallada oculto para verificador');
            }
        }

        // Mostrar botones según el rol
        if (currentUser.rol === 'verificador') {
            console.log('🔍 Configurando navegación para VERIFICADOR');
            
            // Mostrar botones específicos para verificadores
            const navCheckIn = document.getElementById('nav-check-in');
            const navVerifierDashboard = document.getElementById('nav-verifier-dashboard');
            const navVerifierHistory = document.getElementById('nav-verifier-history');
            const navRezagados = document.getElementById('nav-rezagados');
            const navRezagadosMobile = document.getElementById('nav-rezagados-mobile');
            const rezInline = document.getElementById('rezagados-inline');
            const navListado = document.getElementById('nav-listado');
            
            if (navCheckIn) {
                navCheckIn.style.display = 'inline-block';
                navCheckIn.classList.add('active', 'configured');
                console.log('✅ Botón Confirmar Voto mostrado');
            } else {
                console.log('❌ No se encontró nav-check-in');
            }
            if (navVerifierDashboard) {
                navVerifierDashboard.style.display = 'inline-block';
                navVerifierDashboard.classList.add('configured');
                console.log('✅ Botón Mi Dashboard (Verificador) mostrado');
            } else {
                console.log('❌ No se encontró nav-verifier-dashboard');
            }
            if (navVerifierHistory) {
                navVerifierHistory.style.display = 'inline-block';
                navVerifierHistory.classList.add('configured');
                console.log('✅ Botón Mi Historial (Verificador) mostrado');
            } else {
                console.log('❌ No se encontró nav-verifier-history');
            }
            if (navListado) {
                navListado.style.display = 'inline-block';
                navListado.classList.add('configured');
                console.log('✅ Botón Listado mostrado');
            } else {
                console.log('❌ No se encontró nav-listado');
            }
            if (navRezagados) {
                navRezagados.style.display = 'inline-block';
                navRezagados.classList.add('configured');
                console.log('✅ Botón Registro Rezagados mostrado');
            } else {
                console.log('❌ No se encontró nav-rezagados');
            }
            if (navRezagadosMobile && window.innerWidth <= 768) {
                navRezagadosMobile.style.display = 'inline-block';
                console.log('✅ Botón móvil Rezagados mostrado');
            }
            if (rezInline) {
                rezInline.style.display = 'inline-block';
                console.log('✅ Botón inline Rezagados mostrado');
            }
            
            // Asegurar que la página inicial sea check-in para verificadores
            this.navigateToPage('check-in');
            
        } else if (currentUser.rol === 'registrador') {
            console.log('📝 Configurando navegación para REGISTRADOR');
            
            // Mostrar botones específicos para registradores
            const navRegistration = document.getElementById('nav-registration');
            const navRegistratorDashboard = document.getElementById('nav-registrator-dashboard');
            const navRegistratorHistory = document.getElementById('nav-registrator-history');
            const navListado2 = document.getElementById('nav-listado');
            
            if (navRegistration) {
                navRegistration.style.display = 'inline-block';
                navRegistration.classList.add('active', 'configured');
                console.log('✅ Botón Registro mostrado');
            } else {
                console.log('❌ No se encontró nav-registration');
            }
            if (navRegistratorDashboard) {
                navRegistratorDashboard.style.display = 'inline-block';
                navRegistratorDashboard.classList.add('configured');
                console.log('✅ Botón Mi Dashboard (Registrador) mostrado');
            } else {
                console.log('❌ No se encontró nav-registrator-dashboard');
            }
            if (navRegistratorHistory) {
                navRegistratorHistory.style.display = 'inline-block';
                navRegistratorHistory.classList.add('configured');
                console.log('✅ Botón Mi Historial (Registrador) mostrado');
            } else {
                console.log('❌ No se encontró nav-registrator-history');
            }
            if (navListado2) {
                navListado2.style.display = 'inline-block';
                navListado2.classList.add('configured');
                console.log('✅ Botón Listado mostrado');
            } else {
                console.log('❌ No se encontró nav-listado');
            }
            
            // Asegurar que la página inicial sea registration para registradores
            this.navigateToPage('registration');
            
        } else {
            console.log('👑 Configurando navegación para SUPERUSUARIO/ADMIN');
            
            // Superusuarios y admins tienen acceso a funcionalidades generales
            // pero NO a los dashboards específicos de verificadores y registradores
            navButtons.forEach(btn => {
                const btnId = btn.id;
                const btnText = btn.textContent.trim();
                
                // Ocultar botones específicos de verificadores y registradores
                if (btnId === 'nav-verifier-dashboard' || 
                    btnId === 'nav-verifier-history' || 
                    btnId === 'nav-registrator-dashboard' || 
                    btnId === 'nav-registrator-history' ||
                    btnId === 'nav-rezagados' ||
                    btnId === 'nav-rezagados-mobile' ||
                    btnId === 'rezagados-inline') { // eliminado nav-listado
                    btn.style.display = 'none';
                    console.log('🚫 Botón oculto (específico de rol):', btnText);
                } else {
                    btn.style.display = 'inline-block';
                    btn.classList.add('configured');
                    console.log('✅ Botón mostrado:', btnText);
                }
            });
        }
        
        // Panel de Control solo para superusuario
        if (currentUser.rol === 'admin') {
            const btnPanel = document.getElementById('nav-admin-panel');
            if (btnPanel) btnPanel.style.display = 'none';
        }
        
        console.log('✅ Navegación configurada correctamente');
        
        // 🔄 Limpieza: permitir que CSS controle visibilidad
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.style.display = '';
        });
    }
    
    // Reconfigurar event listeners después de cambios en la navegación
    reconfigureEventListeners() {
        console.log('🔄 Reconfigurando event listeners...');
        
        // Reconfigurar event listeners de navegación
        document.querySelectorAll('.nav-btn').forEach(btn => {
            // Remover listeners existentes
            btn.removeEventListener('click', this.navClickHandler);
            
            // Agregar nuevo listener
            btn.addEventListener('click', this.navClickHandler);
        });
        
        console.log('✅ Event listeners reconfigurados');
    }
    
    // Handler para clicks de navegación
    navClickHandler(e) {
        const page = e.target.dataset.page;
        console.log('🖱️ Click en botón de navegación:', page);
        if (window.votingSystem) {
            window.votingSystem.navigateToPage(page);
        }
    }
    
    // Función para forzar actualización de navegación
    forceNavigationUpdate() {
        console.log('🔄 Forzando actualización de navegación...');
        
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;
        
        // Verificar que los botones estén correctamente configurados
        const navButtons = document.querySelectorAll('.nav-btn');
        console.log('🔍 Verificando', navButtons.length, 'botones después de configuración');
        
        navButtons.forEach(btn => {
            const isVisible = btn.style.display !== 'none';
            const isActive = btn.classList.contains('active');
            console.log(`📋 Botón "${btn.textContent.trim()}" (${btn.id}): Visible=${isVisible}, Activo=${isActive}`);
        });
        
        // Si hay problemas, intentar arreglar
        if (currentUser.rol === 'registrador') {
            const checkInBtn = document.getElementById('nav-check-in');
            if (checkInBtn && checkInBtn.style.display !== 'none') {
                console.log('⚠️ Botón "Confirmar Voto" visible para registrador, ocultando...');
                checkInBtn.style.display = 'none';
            }
        }
    }

    // Generar menú móvil según el rol del usuario
    generateMobileMenu() {
        const currentUser = this.getCurrentUser();
        const menuDropdown = document.getElementById('menu-dropdown');
        
        if (!menuDropdown || !currentUser) return;
        
        let menuItems = '';
        
        if (currentUser.rol === 'verificador') {
            menuItems = `
                <div class="menu-item" onclick="votingSystem.navigateToPage('check-in')">
                    <span class="icon">✅</span>
                    Confirmar Voto
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('verifier-dashboard')">
                    <span class="icon">📊</span>
                    Mi Dashboard
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('verifier-history')">
                    <span class="icon">📋</span>
                    Mi Historial
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('listado')">
                    <span class="icon">📋</span>
                    Listado
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('dashboard')">
                    <span class="icon">📊</span>
                    Totales
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('statistics')">
                    <span class="icon">📈</span>
                    Estadísticas
                </div>
                <div class="menu-item" onclick="window.location.href='estadisticas-avanzadas.html'">
                    <span class="icon">📊</span>
                    Estadísticas Avanzadas
                </div>
                <div class="menu-item" onclick="window.location.href='admin-panel.html'">
                    <span class="icon">⚙️</span>
                    Panel de Control
                </div>
            `;
        } else if (currentUser.rol === 'registrador') {
            menuItems = `
                <div class="menu-item" onclick="votingSystem.navigateToPage('registration')">
                    <span class="icon">👤</span>
                    Registro
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('registrator-dashboard')">
                    <span class="icon">📊</span>
                    Mi Dashboard
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('registrator-history')">
                    <span class="icon">📋</span>
                    Mi Historial
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('listado')">
                    <span class="icon">📋</span>
                    Listado
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('dashboard')">
                    <span class="icon">📊</span>
                    Totales
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('statistics')">
                    <span class="icon">📈</span>
                    Estadísticas
                </div>
                <div class="menu-item" onclick="window.location.href='estadisticas-avanzadas.html'">
                    <span class="icon">📊</span>
                    Estadísticas Avanzadas
                </div>
                <div class="menu-item" onclick="window.location.href='admin-panel.html'">
                    <span class="icon">⚙️</span>
                    Panel de Control
                </div>
            `;
        } else {
            // Superusuarios y admins tienen acceso completo
            menuItems = `
                <div class="menu-item" onclick="votingSystem.navigateToPage('registration')">
                    <span class="icon">👤</span>
                    Registro
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('check-in')">
                    <span class="icon">✅</span>
                    Confirmar Voto
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('listado')">
                    <span class="icon">📋</span>
                    Listado
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('dashboard')">
                    <span class="icon">📊</span>
                    Totales
                </div>
                <div class="menu-item" onclick="votingSystem.navigateToPage('statistics')">
                    <span class="icon">📈</span>
                    Estadísticas
                </div>
                <div class="menu-item" onclick="window.location.href='estadisticas-avanzadas.html'">
                    <span class="icon">📊</span>
                    Estadísticas Avanzadas
                </div>
                <div class="menu-item" onclick="window.location.href='admin-panel.html'">
                    <span class="icon">⚙️</span>
                    Panel de Control
                </div>
            `;
        }
        
        // Agregar botón de cerrar sesión
        menuItems += `
            <div class="menu-item" onclick="votingSystem.logout()" style="border-top: 1px solid #e5e7eb; margin-top: 10px; padding-top: 10px;">
                Cerrar Sesión
            </div>
        `;
        
        menuDropdown.innerHTML = menuItems;
        console.log('📱 Menú móvil generado para rol:', currentUser.rol);
    }

    updateUserId() {
        const userIdElement = document.getElementById('userId');
        const userForHeader = this.getCurrentUser();
        if (userIdElement && userForHeader && userForHeader.username) {
            userIdElement.textContent = `${userForHeader.username} (${userForHeader.rol})`;
        } else if (userIdElement) {
            userIdElement.textContent = '';
        }
    }

    // 1. Métodos para el modo proyección
    enterProjectionMode() {
        const overlay = document.getElementById('projection-view');
        overlay.style.display = 'block';
        document.body.classList.add('projection-mode');
        this.updateProjection();
        this.projectionInterval = setInterval(() => this.updateProjection(), 30000);
        // Solicitar pantalla completa
        if (overlay.requestFullscreen) {
            overlay.requestFullscreen();
        } else if (overlay.webkitRequestFullscreen) { // Safari
            overlay.webkitRequestFullscreen();
        } else if (overlay.msRequestFullscreen) { // IE11
            overlay.msRequestFullscreen();
        }
    }

    exitProjectionMode() {
        const overlay = document.getElementById('projection-view');
        overlay.style.display = 'none';
        document.body.classList.remove('projection-mode');
        if (this.projectionInterval) clearInterval(this.projectionInterval);
        // Salir de pantalla completa si está activo
        if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { // Safari
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE11
                document.msExitFullscreen();
            }
        }
    }

    updateProjection() {
        // Obtener todos los CV posibles (19) desde this.ubchToCommunityMap
        const allCVs = Object.keys(this.ubchToCommunityMap || {}).sort();
        // Filtrar votos actuales
        const votes = this.votes || [];
        // Contar votos por CV
        const votosPorCV = {};
        const registradosPorCV = {};
        allCVs.forEach(cv => { votosPorCV[cv] = 0; registradosPorCV[cv] = 0; });
        votes.forEach(v => {
            if (v.ubch && registradosPorCV.hasOwnProperty(v.ubch)) {
                registradosPorCV[v.ubch]++;
                if (v.voted) votosPorCV[v.ubch]++;
            }
        });
        // Totales
        const totalRegistrados = votes.length;
        const totalVotaron = votes.filter(v => v.voted).length;
        const porcentaje = totalRegistrados ? ((totalVotaron / totalRegistrados) * 100).toFixed(1) : 0;
        // Actualizar DOM general
        document.getElementById('projection-votes').textContent = totalVotaron.toLocaleString();
        document.getElementById('projection-text').textContent = `${totalVotaron.toLocaleString()} de ${totalRegistrados.toLocaleString()}`;
        const fill = document.getElementById('projection-progress-fill');
        fill.style.width = porcentaje + '%';
        fill.textContent = porcentaje + '%';
        // Mostrar los 19 CV como tarjetas
        const rankingList = document.getElementById('projection-ubch-list');
        rankingList.innerHTML = allCVs.map((cv, i) => {
            const votos = votosPorCV[cv];
            const registrados = registradosPorCV[cv];
            const porcentajeCV = registrados ? ((votos / registrados) * 100).toFixed(1) : 0;
            return `
            <div class='projection-item' style="background:#232946; border-radius:1rem; padding:1rem 1.2rem; margin-bottom:1.2rem; box-shadow:0 2px 8px rgba(80,112,255,0.08);">
                <div class='projection-item-header' style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span class='projection-item-name' style="font-size:1.1em; font-weight:600; color:#fff;">${i+1}. ${cv}</span>
                    <span class='projection-item-count' style="font-size:1.2em; font-weight:700; color:#43e97b;">${votos}</span>
                </div>
                <div style="font-size:0.95em; color:#bfc9d1; margin-bottom:0.3em;">Registrados: ${registrados}</div>
                <div class='projection-item-progress' style="width:100%; height:0.8rem; background:#374151; border-radius:0.5rem; overflow:hidden; margin-bottom:0.2em;">
                    <div class='projection-item-progress-fill' style="height:100%; background:linear-gradient(90deg,#10b981,#34d399); width:${porcentajeCV}%; transition:width 0.5s; border-radius:0.5rem;"></div>
                </div>
                <div style="font-size:0.9em; color:#43e97b;">${porcentajeCV}% participación</div>
            </div>
            `;
        }).join('');
    }

    // 2. Asignar eventos al cargar la página principal
    setupProjectionEvents() {
        const btn = document.getElementById('projection-btn');
        const exitBtn = document.getElementById('exit-projection-btn');
        if (btn) btn.onclick = () => this.enterProjectionMode();
        if (exitBtn) exitBtn.onclick = () => this.exitProjectionMode();
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            const overlay = document.getElementById('projection-view');
            if (overlay.style.display !== 'none' && (e.key === 'Escape' || e.key === 'Esc')) {
                this.exitProjectionMode();
            }
        });
    }

    // Función para verificar el estado del listener de sincronización
    isSyncListenerActive() {
        return this.unsubscribeListener && typeof this.unsubscribeListener === 'function';
    }

    // Función para reinicializar el listener de sincronización
    async reinitializeSyncListener() {
        console.log('🔄 Reinicializando listener de sincronización...');
        
        try {
            // Limpiar listener anterior
            if (this.unsubscribeListener && typeof this.unsubscribeListener === 'function') {
                this.unsubscribeListener();
                this.unsubscribeListener = null;
            }
            
            // Esperar un momento antes de reconfigurar
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Reconfigurar listener
            this.setupRealtimeListener();
            
            console.log('✅ Listener de sincronización reinicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error reinicializando listener:', error);
        }
    }

    // Función para manejar errores de inicialización
    handleInitError(error, context) {
        console.error(`❌ Error en ${context}:`, error);
        
        // Mostrar mensaje al usuario
        this.showMessage(`Error de inicialización: ${error.message}`, 'error', 'registration');
        
        // Intentar recuperación automática
        setTimeout(() => {
            console.log(`🔄 Intentando recuperación automática para ${context}...`);
            this.init();
        }, 5000);
    }

    // === MÉTODOS PARA REGISTRADORES ===

    // Renderizar dashboard del registrador
    renderRegistratorDashboard() {
        console.log('📊 Renderizando dashboard del registrador...');
        
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== 'registrador') {
            console.error('❌ Usuario no autorizado para dashboard de registrador');
            return;
        }

        // Verificar que la página existe
        const dashboardPage = document.getElementById('registrator-dashboard-page');
        if (!dashboardPage) {
            console.error('❌ Página del dashboard del registrador no encontrada');
            return;
        }

        console.log('✅ Página del dashboard encontrada, mostrando...');
        
        // Obtener registros del registrador actual
        const registratorRegistrations = this.getRegistratorRegistrations(currentUser.username);
        console.log('📊 Registros encontrados:', registratorRegistrations.length);
        
        // Si no hay registros, crear algunos de ejemplo para pruebas
        if (registratorRegistrations.length === 0) {
            console.log('📝 No hay registros, creando datos de ejemplo para pruebas...');
            this.createSampleRegistrations(currentUser.username);
            // Recargar después de crear los datos de ejemplo
            setTimeout(() => {
                this.renderRegistratorDashboard();
            }, 100);
            return;
        }
        
        // Calcular estadísticas
        const today = new Date();
        const todayRegistrations = registratorRegistrations.filter(reg => {
            const regDate = new Date(reg.fechaRegistro || reg.registeredAt);
            return this.isSameDay(regDate, today);
        });
        
        const weekRegistrations = registratorRegistrations.filter(reg => {
            const regDate = new Date(reg.fechaRegistro || reg.registeredAt);
            return this.isWithinWeek(regDate, today);
        });
        
        const totalRegistrations = registratorRegistrations.length;
        const hourlyAverage = this.calculateRegistratorHourlyAverage(registratorRegistrations);

        console.log('📊 Estadísticas calculadas:', {
            hoy: todayRegistrations.length,
            semana: weekRegistrations.length,
            total: totalRegistrations,
            promedio: hourlyAverage
        });

        // Actualizar estadísticas
        const todayElement = document.getElementById('registrator-today-registrations');
        const weekElement = document.getElementById('registrator-week-registrations');
        const totalElement = document.getElementById('registrator-total-registrations');
        const hourlyElement = document.getElementById('registrator-hourly-average');

        if (todayElement) todayElement.textContent = todayRegistrations.length;
        if (weekElement) weekElement.textContent = weekRegistrations.length;
        if (totalElement) totalElement.textContent = totalRegistrations;
        if (hourlyElement) hourlyElement.textContent = hourlyAverage.toFixed(1);

        // Renderizar gráfico de actividad
        this.renderRegistratorActivityChart(registratorRegistrations);
        
        // Renderizar estadísticas por CV
        this.renderRegistratorCVStats(registratorRegistrations);
        
        // Renderizar registros recientes
        this.renderRegistratorRecentRegistrations(registratorRegistrations);

        // Mostrar estadísticas detalladas de tipos de registro
        this.renderRegistratorTypeStats(registratorRegistrations);

        console.log('✅ Dashboard del registrador renderizado correctamente');
    }

    // Crear registros de ejemplo para pruebas
    createSampleRegistrations(username) {
        console.log('📝 Creando registros de ejemplo para:', username);
        
        const sampleData = [
            {
                name: 'María González',
                cedula: '12345678',
                telefono: '04123456789',
                sexo: 'F',
                edad: 25,
                ubch: 'COLEGIO ASUNCION BELTRAN',
                community: 'EL VALLE',
                registradoPor: username,
                fechaRegistro: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
                voted: false
            },
            {
                name: 'Carlos Rodríguez',
                cedula: '87654321',
                telefono: '04987654321',
                sexo: 'M',
                edad: 30,
                ubch: 'LICEO JOSE FELIX RIBAS',
                community: 'EL CUJINAL',
                registradoPor: username,
                fechaRegistro: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
                voted: true
            },
            {
                name: 'Ana López',
                cedula: '11223344',
                telefono: '04112233445',
                sexo: 'F',
                edad: 28,
                ubch: 'COLEGIO ASUNCION BELTRAN',
                community: 'VILLA OASIS',
                registradoPor: username,
                fechaRegistro: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
                voted: false
            },
            {
                name: 'Luis Pérez',
                cedula: '55667788',
                telefono: '04556677889',
                sexo: 'M',
                edad: 35,
                ubch: 'ESCUELA PRIMARIA BOLIVARIANA LA PRADERA',
                community: 'EL SAMAN',
                registradoPor: username,
                fechaRegistro: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 horas atrás
                voted: true
            },
            {
                name: 'Carmen Silva',
                cedula: '99887766',
                telefono: '04998877665',
                sexo: 'F',
                edad: 42,
                ubch: 'LICEO JOSE FELIX RIBAS',
                community: 'LAS MORAS',
                registradoPor: username,
                fechaRegistro: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 horas atrás
                voted: false
            }
        ];

        // Agregar los registros de ejemplo al array de votos
        sampleData.forEach(reg => {
            reg.id = 'sample_' + Date.now() + Math.random();
            this.votes.push(reg);
        });

        console.log('✅ Registros de ejemplo creados:', sampleData.length);
    }

    // Obtener registros del registrador
    getRegistratorRegistrations(username) {
        return this.votes.filter(vote => {
            // Incluir registros individuales (con registradoPor)
            const isIndividualRegistration = vote.registradoPor === username && vote.fechaRegistro;
            
            // Incluir registros masivos (con registeredBy)
            const isBulkRegistration = vote.registeredBy === username && vote.registeredAt;
            
            return isIndividualRegistration || isBulkRegistration;
        });
    }

    // Calcular promedio por hora para registradores
    calculateRegistratorHourlyAverage(registrations) {
        if (registrations.length === 0) return 0;
        
        const today = new Date();
        const todayRegistrations = registrations.filter(reg => {
            const regDate = new Date(reg.fechaRegistro || reg.registeredAt);
            return this.isSameDay(regDate, today);
        });
        
        if (todayRegistrations.length === 0) return 0;
        
        const hoursWorked = Math.max(1, (today.getHours() - 6)); // Asumiendo trabajo desde 6am
        return todayRegistrations.length / hoursWorked;
    }

    // Renderizar gráfico de actividad del registrador
    renderRegistratorActivityChart(registrations) {
        const ctx = document.getElementById('registrator-activity-chart');
        if (!ctx) return;

        // Crear datos por hora (6am - 10pm)
        const hourlyData = Array(17).fill(0); // 6am a 10pm = 17 horas
        
        registrations.forEach(reg => {
            const regDate = new Date(reg.fechaRegistro || reg.registeredAt);
            const today = new Date();
            
            if (this.isSameDay(regDate, today)) {
                const hour = regDate.getHours();
                if (hour >= 6 && hour <= 22) {
                    hourlyData[hour - 6]++;
                }
            }
        });

        // Crear gráfico
        if (window.registratorActivityChart) {
            window.registratorActivityChart.destroy();
        }

        window.registratorActivityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm'],
                datasets: [{
                    label: 'Registros',
                    data: hourlyData,
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Renderizar estadísticas por CV del registrador
    renderRegistratorCVStats(registrations) {
        const container = document.getElementById('registrator-cv-stats-list');
        if (!container) return;

        // Agrupar por CV
        const cvStats = {};
        registrations.forEach(reg => {
            if (!cvStats[reg.ubch]) {
                cvStats[reg.ubch] = 0;
            }
            cvStats[reg.ubch]++;
        });

        // Ordenar por cantidad
        const sortedCVs = Object.entries(cvStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10

        container.innerHTML = sortedCVs.map(([cv, count]) => `
            <div class="registrator-cv-item">
                <h4>${cv}</h4>
                <div class="registrator-cv-count">${count}</div>
            </div>
        `).join('');
    }

    // Renderizar registros recientes del registrador
    renderRegistratorRecentRegistrations(registrations) {
        const container = document.getElementById('registrator-recent-registrations');
        if (!container) return;

        // Obtener los 10 más recientes
        const recentRegistrations = registrations
            .sort((a, b) => new Date(b.fechaRegistro || b.registeredAt) - new Date(a.fechaRegistro || a.registeredAt))
            .slice(0, 10);

        container.innerHTML = recentRegistrations.map(reg => {
            const regDate = new Date(reg.fechaRegistro || reg.registeredAt);
            const timeAgo = this.getTimeAgo(regDate);
            
            // Determinar el tipo de registro
            const isBulkRegistration = reg.registeredBy && reg.registeredAt;
            const registrationType = isBulkRegistration ? '📊' : '👤';
            
            return `
                <div class="registrator-recent-item">
                    <div class="registrator-recent-info">
                        <div class="registrator-recent-name">${registrationType} ${reg.name}</div>
                        <div class="registrator-recent-details">${reg.cedula} • ${reg.ubch}</div>
                    </div>
                    <div class="registrator-recent-time">${timeAgo}</div>
                </div>
            `;
        }).join('');
    }

    // Renderizar historial del registrador
    renderRegistratorHistory() {
        console.log('📋 Renderizando historial del registrador...');
        
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== 'registrador') {
            console.error('❌ Usuario no autorizado para historial de registrador');
            return;
        }

        // Verificar que la página existe
        const historyPage = document.getElementById('registrator-history-page');
        if (!historyPage) {
            console.error('❌ Página del historial del registrador no encontrada');
            return;
        }

        console.log('✅ Página del historial encontrada, mostrando...');

        // Obtener registros del registrador
        const registrations = this.getRegistratorRegistrations(currentUser.username);
        console.log('📋 Registros encontrados para historial:', registrations.length);
        
        // Si no hay registros, crear algunos de ejemplo para pruebas
        if (registrations.length === 0) {
            console.log('📝 No hay registros en historial, creando datos de ejemplo para pruebas...');
            this.createSampleRegistrations(currentUser.username);
            // Recargar después de crear los datos de ejemplo
            setTimeout(() => {
                this.renderRegistratorHistory();
            }, 100);
            return;
        }
        
        // Aplicar filtros
        const filteredRegistrations = this.applyRegistratorFilters(registrations);
        console.log('📋 Registros filtrados:', filteredRegistrations.length);
        
        // Renderizar tabla
        this.renderRegistratorHistoryTable(filteredRegistrations, 1);
        
        // Actualizar filtros
        this.updateRegistratorFilters(registrations);

        console.log('✅ Historial del registrador renderizado correctamente');
    }

    // Aplicar filtros del registrador
    applyRegistratorFilters(registrations) {
        const dateFilter = document.getElementById('registrator-date-filter')?.value;
        const cvFilter = document.getElementById('registrator-cv-filter')?.value;
        const searchTerm = document.getElementById('registrator-search')?.value?.toLowerCase();

        let filtered = [...registrations];

        // Filtro por fecha
        if (dateFilter) {
            const today = new Date();
            switch (dateFilter) {
                case 'today':
                    filtered = filtered.filter(reg => {
                        const regDate = new Date(reg.fechaRegistro || reg.registeredAt);
                        return this.isSameDay(regDate, today);
                    });
                    break;
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    filtered = filtered.filter(reg => {
                        const regDate = new Date(reg.fechaRegistro || reg.registeredAt);
                        return this.isSameDay(regDate, yesterday);
                    });
                    break;
                case 'week':
                    filtered = filtered.filter(reg => {
                        const regDate = new Date(reg.fechaRegistro || reg.registeredAt);
                        return this.isWithinWeek(regDate, today);
                    });
                    break;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    filtered = filtered.filter(reg => {
                        const regDate = new Date(reg.fechaRegistro || reg.registeredAt);
                        return regDate >= monthAgo;
                    });
                    break;
            }
        }

        // Filtro por CV
        if (cvFilter) {
            filtered = filtered.filter(reg => reg.ubch === cvFilter);
        }

        // Filtro por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(reg => 
                reg.name.toLowerCase().includes(searchTerm) ||
                reg.cedula.includes(searchTerm)
            );
        }

        return filtered;
    }

    // Renderizar tabla del historial del registrador
    renderRegistratorHistoryTable(registrations, currentPage = 1) {
        const tbody = document.getElementById('registrator-history-tbody');
        if (!tbody) return;

        const itemsPerPage = 20;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedRegistrations = registrations.slice(startIndex, endIndex);

        tbody.innerHTML = paginatedRegistrations.map(reg => {
            // Manejar tanto registros individuales como masivos
            const regDate = new Date(reg.fechaRegistro || reg.registeredAt);
            const formattedDate = regDate.toLocaleDateString('es-ES');
            const formattedTime = regDate.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            // Determinar el tipo de registro
            const isBulkRegistration = reg.registeredBy && reg.registeredAt;
            const registrationType = isBulkRegistration ? '📊 Masivo' : '👤 Individual';

            return `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${formattedTime}</td>
                    <td>${reg.name}</td>
                    <td>${reg.cedula}</td>
                    <td>${reg.telefono || '-'}</td>
                    <td>${reg.sexo === 'M' ? 'Masculino' : 'Femenino'}</td>
                    <td>${reg.edad}</td>
                    <td>${reg.ubch}</td>
                    <td>${reg.community}</td>
                    <td style="text-align: center; font-size: 0.9rem; color: #6c757d;">${registrationType}</td>
                    <td><span class="vote-status ${reg.voted ? 'voted' : 'not-voted'}">${reg.voted ? 'Sí' : 'No'}</span></td>
                </tr>
            `;
        }).join('');

        // Actualizar paginación
        this.updateRegistratorPagination(registrations.length, itemsPerPage, currentPage);
    }

    // Actualizar filtros del registrador
    updateRegistratorFilters(registrations) {
        const cvFilter = document.getElementById('registrator-cv-filter');
        if (!cvFilter) return;

        // Obtener CVs únicos
        const uniqueCVs = [...new Set(registrations.map(reg => reg.ubch))].sort();
        
        // Mantener la opción actual si existe
        const currentValue = cvFilter.value;
        
        // Actualizar opciones
        cvFilter.innerHTML = '<option value="">Todos los CV</option>' +
            uniqueCVs.map(cv => 
                `<option value="${cv}" ${cv === currentValue ? 'selected' : ''}>${cv}</option>`
            ).join('');
    }

    // Actualizar paginación del registrador
    updateRegistratorPagination(totalItems, itemsPerPage, currentPage) {
        const paginationContainer = document.getElementById('registrator-pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Botón anterior
        paginationHTML += `
            <button onclick="votingSystem.goToRegistratorPage(${currentPage - 1})" 
                    ${currentPage <= 1 ? 'disabled' : ''}>
                Anterior
            </button>
        `;

        // Números de página
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                paginationHTML += `
                    <button onclick="votingSystem.goToRegistratorPage(${i})" 
                            class="${i === currentPage ? 'active' : ''}">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                paginationHTML += '<span>...</span>';
            }
        }

        // Botón siguiente
        paginationHTML += `
            <button onclick="votingSystem.goToRegistratorPage(${currentPage + 1})" 
                    ${currentPage >= totalPages ? 'disabled' : ''}>
                Siguiente
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    // Ir a página del registrador
    goToRegistratorPage(page) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== 'registrador') return;

        const registrations = this.getRegistratorRegistrations(currentUser.username);
        const filtered = this.applyRegistratorFilters(registrations);

        // Validar rango de página
        const itemsPerPage = 20;
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const pageNum = Math.max(1, Math.min(page, totalPages));

        this.renderRegistratorHistoryTable(filtered, pageNum);
    }

    // Exportar historial del registrador
    exportRegistratorHistory() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== 'registrador') {
            console.error('❌ Usuario no autorizado para exportar historial de registrador');
            return;
        }

        const registrations = this.getRegistratorRegistrations(currentUser.username);
        const filteredRegistrations = this.applyRegistratorFilters(registrations);
        
        if (filteredRegistrations.length === 0) {
            this.showMessage('No hay datos para exportar', 'warning', 'registrator-history');
            return;
        }

        const csvContent = this.generateRegistratorHistoryCSV(filteredRegistrations);
        const fileName = `historial_registros_${currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`;
        
        this.downloadCSV(csvContent, fileName);
        this.showMessage('Historial exportado correctamente', 'success', 'registrator-history');
    }

    // Generar CSV del historial del registrador
    generateRegistratorHistoryCSV(registrations) {
        const headers = [
            'Fecha',
            'Hora',
            'Nombre',
            'Cédula',
            'Teléfono',
            'Sexo',
            'Edad',
            'Centro de Votación',
            'Comunidad',
            'Votó'
        ];

        const rows = registrations.map(reg => {
            const regDate = new Date(reg.fechaRegistro);
            const formattedDate = regDate.toLocaleDateString('es-ES');
            const formattedTime = regDate.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            return [
                `"${formattedDate}"`,
                `"${formattedTime}"`,
                `"${(reg.name || '').replace(/"/g, '""')}"`,
                `"${(reg.cedula || '').replace(/"/g, '""')}"`,
                `"${(reg.telefono || '').replace(/"/g, '""')}"`,
                `"${reg.sexo === 'M' ? 'Masculino' : 'Femenino'}"`,
                `"${reg.edad || ''}"`,
                `"${(reg.ubch || '').replace(/"/g, '""')}"`,
                `"${(reg.community || '').replace(/"/g, '""')}"`,
                `"${reg.voted ? 'Sí' : 'No'}"`
            ];
        });

        let csvContent = headers.join(';') + '\r\n';
        rows.forEach(row => {
            csvContent += row.join(';') + '\r\n';
        });

        return csvContent;
    }

    // Función para descargar CSV
    downloadCSV(csvContent, fileName) {
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', fileName);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // === MÉTODOS PARA VERIFICADORES ===

    // Renderizar dashboard del verificador
    renderVerifierDashboard() {
        console.log('📊 Renderizando dashboard del verificador...');
        
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== 'verificador') {
            console.error('❌ Usuario no autorizado para dashboard de verificador');
            return;
        }

        // Obtener confirmaciones del verificador actual
        const verifierConfirmations = this.getVerifierConfirmations(currentUser.username);
        
        // Calcular estadísticas
        const today = new Date();
        const todayConfirmations = verifierConfirmations.filter(conf => 
            this.isSameDay(new Date(conf.fechaConfirmacion), today)
        );
        
        const weekConfirmations = verifierConfirmations.filter(conf => 
            this.isWithinWeek(new Date(conf.fechaConfirmacion), today)
        );
        
        const totalConfirmations = verifierConfirmations.length;
        const hourlyAverage = this.calculateHourlyAverage(verifierConfirmations);

        // Actualizar estadísticas
        document.getElementById('verifier-today-confirmations').textContent = todayConfirmations.length;
        document.getElementById('verifier-week-confirmations').textContent = weekConfirmations.length;
        document.getElementById('verifier-total-confirmations').textContent = totalConfirmations;
        document.getElementById('verifier-hourly-average').textContent = hourlyAverage.toFixed(1);

        // Renderizar gráfico de actividad
        this.renderVerifierActivityChart(verifierConfirmations);
        
        // Renderizar estadísticas por CV
        this.renderVerifierCVStats(verifierConfirmations);
        
        // Renderizar confirmaciones recientes
        this.renderVerifierRecentConfirmations(verifierConfirmations);
    }

    // Obtener confirmaciones del verificador
    getVerifierConfirmations(username) {
        return this.votes.filter(vote => 
            vote.voted && 
            vote.confirmedBy === username &&
            vote.fechaConfirmacion
        );
    }

    // Verificar si es el mismo día
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    // Verificar si está dentro de la semana
    isWithinWeek(date, today) {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return date >= weekAgo && date <= today;
    }

    // Calcular promedio por hora
    calculateHourlyAverage(confirmations) {
        if (confirmations.length === 0) return 0;
        
        const today = new Date();
        const todayConfirmations = confirmations.filter(conf => 
            this.isSameDay(new Date(conf.fechaConfirmacion), today)
        );
        
        if (todayConfirmations.length === 0) return 0;
        
        const hoursWorked = Math.max(1, (today.getHours() - 6)); // Asumiendo trabajo desde 6am
        return todayConfirmations.length / hoursWorked;
    }

    // Renderizar gráfico de actividad
    renderVerifierActivityChart(confirmations) {
        const ctx = document.getElementById('verifier-activity-chart');
        if (!ctx) return;

        // Crear datos por hora (6am - 10pm)
        const hourlyData = Array(17).fill(0); // 6am a 10pm = 17 horas
        
        confirmations.forEach(conf => {
            const confDate = new Date(conf.fechaConfirmacion);
            const today = new Date();
            
            if (this.isSameDay(confDate, today)) {
                const hour = confDate.getHours();
                if (hour >= 6 && hour <= 22) {
                    hourlyData[hour - 6]++;
                }
            }
        });

        // Crear gráfico
        if (window.verifierActivityChart) {
            window.verifierActivityChart.destroy();
        }

        window.verifierActivityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm'],
                datasets: [{
                    label: 'Confirmaciones',
                    data: hourlyData,
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Renderizar estadísticas por CV
    renderVerifierCVStats(confirmations) {
        const container = document.getElementById('verifier-cv-stats-list');
        if (!container) return;

        // Agrupar por CV
        const cvStats = {};
        confirmations.forEach(conf => {
            if (!cvStats[conf.ubch]) {
                cvStats[conf.ubch] = 0;
            }
            cvStats[conf.ubch]++;
        });

        // Ordenar por cantidad
        const sortedCVs = Object.entries(cvStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10

        container.innerHTML = sortedCVs.map(([cv, count]) => `
            <div class="verifier-cv-item">
                <h4>${cv}</h4>
                <div class="verifier-cv-count">${count}</div>
            </div>
        `).join('');
    }

    // Renderizar confirmaciones recientes
    renderVerifierRecentConfirmations(confirmations) {
        const container = document.getElementById('verifier-recent-confirmations');
        if (!container) return;

        // Obtener las 10 más recientes
        const recentConfirmations = confirmations
            .sort((a, b) => new Date(b.fechaConfirmacion) - new Date(a.fechaConfirmacion))
            .slice(0, 10);

        container.innerHTML = recentConfirmations.map(conf => {
            const confDate = new Date(conf.fechaConfirmacion);
            const timeAgo = this.getTimeAgo(confDate);
            
            return `
                <div class="verifier-recent-item">
                    <div class="verifier-recent-info">
                        <div class="verifier-recent-name">${conf.name}</div>
                        <div class="verifier-recent-details">${conf.cedula} • ${conf.ubch}</div>
                    </div>
                    <div class="verifier-recent-time">${timeAgo}</div>
                </div>
            `;
        }).join('');
    }

    // Obtener tiempo transcurrido
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        return `Hace ${diffDays} días`;
    }

    // Renderizar historial del verificador
    renderVerifierHistory() {
        console.log('📋 Renderizando historial del verificador...');
        
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== 'verificador') {
            console.error('❌ Usuario no autorizado para historial de verificador');
            return;
        }

        // Obtener confirmaciones del verificador
        const confirmations = this.getVerifierConfirmations(currentUser.username);
        
        // Aplicar filtros
        const filteredConfirmations = this.applyVerifierFilters(confirmations);
        
        // Renderizar tabla
        this.renderVerifierHistoryTable(filteredConfirmations);
        
        // Actualizar filtros
        this.updateVerifierFilters(confirmations);
    }

    // Aplicar filtros al historial
    applyVerifierFilters(confirmations) {
        const dateFilter = document.getElementById('verifier-date-filter')?.value;
        const cvFilter = document.getElementById('verifier-cv-filter')?.value;
        const searchFilter = document.getElementById('verifier-search')?.value;

        let filtered = confirmations;

        // Filtro por fecha
        if (dateFilter) {
            const today = new Date();
            switch (dateFilter) {
                case 'today':
                    filtered = filtered.filter(conf => 
                        this.isSameDay(new Date(conf.fechaConfirmacion), today)
                    );
                    break;
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    filtered = filtered.filter(conf => 
                        this.isSameDay(new Date(conf.fechaConfirmacion), yesterday)
                    );
                    break;
                case 'week':
                    filtered = filtered.filter(conf => 
                        this.isWithinWeek(new Date(conf.fechaConfirmacion), today)
                    );
                    break;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    filtered = filtered.filter(conf => 
                        new Date(conf.fechaConfirmacion) >= monthAgo
                    );
                    break;
            }
        }

        // Filtro por CV
        if (cvFilter) {
            filtered = filtered.filter(conf => conf.ubch === cvFilter);
        }

        // Filtro de búsqueda
        if (searchFilter) {
            const searchLower = searchFilter.toLowerCase();
            filtered = filtered.filter(conf => 
                conf.name.toLowerCase().includes(searchLower) ||
                conf.cedula.includes(searchFilter)
            );
        }

        return filtered;
    }

    // Renderizar tabla de historial
    renderVerifierHistoryTable(confirmations) {
        const tbody = document.getElementById('verifier-history-tbody');
        if (!tbody) return;

        tbody.innerHTML = confirmations.map(conf => {
            const confDate = new Date(conf.fechaConfirmacion);
            const formattedDate = confDate.toLocaleDateString('es-VE');
            const formattedTime = confDate.toLocaleTimeString('es-VE', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            return `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${formattedTime}</td>
                    <td>${conf.name}</td>
                    <td>${conf.cedula}</td>
                    <td>${conf.ubch}</td>
                    <td>${conf.community}</td>
                    <td><span class="verifier-status confirmed">Confirmado</span></td>
                </tr>
            `;
        }).join('');
    }

    // Actualizar filtros del verificador
    updateVerifierFilters(confirmations) {
        // Actualizar filtro de CV
        const cvFilter = document.getElementById('verifier-cv-filter');
        if (cvFilter) {
            const cvs = [...new Set(confirmations.map(conf => conf.ubch))].sort();
            cvFilter.innerHTML = '<option value="">Todos los CV</option>' +
                cvs.map(cv => `<option value="${cv}">${cv}</option>`).join('');
        }
    }

    // Exportar historial del verificador
    exportVerifierHistory() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== 'verificador') {
            this.showMessage('No tienes permisos para exportar historial', 'error', 'verifier-history');
            return;
        }

        const confirmations = this.getVerifierConfirmations(currentUser.username);
        const filteredConfirmations = this.applyVerifierFilters(confirmations);

        if (filteredConfirmations.length === 0) {
            this.showMessage('No hay datos para exportar', 'warning', 'verifier-history');
            return;
        }

        // Crear CSV con el mismo formato que el listado
        const csvContent = this.generateVerifierHistoryCSV(filteredConfirmations);
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `historial_verificador_${currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showMessage(`CSV generado: historial_verificador_${currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`, 'success', 'verifier-history');
    }

    // Generar CSV del historial del verificador
    generateVerifierHistoryCSV(confirmations) {
        const headers = ['Fecha', 'Hora', 'Nombre', 'Cédula', 'Centro de Votación', 'Comunidad', 'Estado'];
        
        const rows = confirmations.map(conf => {
            const confDate = new Date(conf.fechaConfirmacion);
            return [
                `"${(confDate.toLocaleDateString('es-VE') || '').replace(/"/g, '""')}"`,
                `"${(confDate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) || '').replace(/"/g, '""')}"`,
                `"${(conf.name || '').replace(/"/g, '""')}"`,
                `"${(conf.cedula || '').replace(/"/g, '""')}"`,
                `"${(conf.ubch || '').replace(/"/g, '""')}"`,
                `"${(conf.community || '').replace(/"/g, '""')}"`,
                `"Confirmado"`
            ];
        });
        
        let csvContent = headers.join(';') + '\r\n';
        rows.forEach(row => {
            csvContent += row.join(';') + '\r\n';
        });
        
        return csvContent;
    }

    // Renderizar estadísticas de tipos de registro
    renderRegistratorTypeStats(registrations) {
        const individualRegistrations = registrations.filter(reg => reg.registradoPor && reg.fechaRegistro);
        const bulkRegistrations = registrations.filter(reg => reg.registeredBy && reg.registeredAt);
        
        const individualCount = individualRegistrations.length;
        const bulkCount = bulkRegistrations.length;
        const totalCount = registrations.length;
        
        console.log('📊 Estadísticas de tipos de registro:', {
            individual: individualCount,
            bulk: bulkCount,
            total: totalCount
        });
        
        // Actualizar contadores en el dashboard si existen
        const individualElement = document.getElementById('registrator-individual-count');
        const bulkElement = document.getElementById('registrator-bulk-count');
        
        if (individualElement) individualElement.textContent = individualCount;
        if (bulkElement) bulkElement.textContent = bulkCount;
    }

    // Forzar configuración de event listeners en botones originales
    forceSetupOriginalButtons() {
        console.log('🔧 Forzando configuración de botones originales...');
        
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            // Remover todos los listeners existentes
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Agregar nuevo listener
            newBtn.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                console.log('🖱️ Click en botón original:', page);
                this.navigateToPage(page);
            });
        });
        
        console.log('✅ Botones originales reconfigurados');
    }

    // Función para forzar configuración de botones de dashboard e historial
    forceSetupDashboardButtons() {
        console.log('🔧 Forzando configuración de botones de dashboard...');
        
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            console.log('❌ No hay usuario autenticado');
            return;
        }
        
        // Configurar botones según el rol
        if (currentUser.rol === 'verificador') {
            const verifierDashboardBtn = document.getElementById('nav-verifier-dashboard');
            const verifierHistoryBtn = document.getElementById('nav-verifier-history');
            
            if (verifierDashboardBtn) {
                verifierDashboardBtn.style.display = 'inline-block';
                verifierDashboardBtn.onclick = () => this.navigateToPage('verifier-dashboard');
                console.log('✅ Botón dashboard verificador configurado');
            }
            
            if (verifierHistoryBtn) {
                verifierHistoryBtn.style.display = 'inline-block';
                verifierHistoryBtn.onclick = () => this.navigateToPage('verifier-history');
                console.log('✅ Botón historial verificador configurado');
            }
        } else if (currentUser.rol === 'registrador') {
            const registratorDashboardBtn = document.getElementById('nav-registrator-dashboard');
            const registratorHistoryBtn = document.getElementById('nav-registrator-history');
            
            if (registratorDashboardBtn) {
                registratorDashboardBtn.style.display = 'inline-block';
                registratorDashboardBtn.onclick = () => this.navigateToPage('registrator-dashboard');
                console.log('✅ Botón dashboard registrador configurado');
            }
            
            if (registratorHistoryBtn) {
                registratorHistoryBtn.style.display = 'inline-block';
                registratorHistoryBtn.onclick = () => this.navigateToPage('registrator-history');
                console.log('✅ Botón historial registrador configurado');
            }
        }
        
        console.log('✅ Configuración de botones de dashboard completada');
    }
}

// Inicializar el sistema cuando el DOM esté listo
// Comentado para evitar conflictos con auto-init.js
// document.addEventListener('DOMContentLoaded', () => {
//     window.votingSystem = new VotingSystemFirebase();
// }); 

// === MIS REGISTROS ===
// Mostrar los registros del usuario actual en la tabla de 'Mis Registros'
window.renderMyRecordsTable = async function() {
    const tableBody = document.querySelector('#myrecords-table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>';
    try {
        // Obtener usuario actual
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const username = normalizarUsuario(currentUser.username || '');
        if (!username) {
            tableBody.innerHTML = '<tr><td colspan="8">No hay usuario activo</td></tr>';
            return;
        }
        
        console.log('🔍 Buscando registros para usuario:', username);
        
        // Obtener registros de múltiples fuentes
        const records = [];
        
        // 1. Registros de Firebase
        try {
        const snapshot = await window.firebaseDB.votesCollection.where('registeredBy', '==', username).orderBy('createdAt', 'desc').limit(500).get();
        snapshot.forEach(doc => {
            const d = doc.data();
                records.push({
                    name: d.name || '',
                    cedula: d.cedula || '',
                    telefono: d.telefono || '',
                    sexo: d.sexo || '',
                    edad: d.edad || '',
                    ubch: d.ubch || '',
                    community: d.community || '',
                    registeredAt: d.registeredAt ? (new Date(d.registeredAt)).toLocaleString('es-VE', {hour12:true}) : '',
                    source: 'Firebase'
                });
            });
            console.log('📊 Registros de Firebase:', records.length);
        } catch (error) {
            console.error('❌ Error consultando Firebase:', error);
        }
        
        // 2. Registros locales (misRegistrosLocales)
        try {
            const registrosLocales = JSON.parse(localStorage.getItem('misRegistrosLocales') || '[]');
            registrosLocales.forEach(r => {
                records.push({
                    name: r.nombre || '',
                    cedula: r.cedula || '',
                    telefono: r.telefono || '',
                    sexo: r.sexo || '',
                    edad: r.edad || '',
                    ubch: r.ubch || '',
                    community: r.comunidad || '',
                    registeredAt: r.fecha || '',
                    source: 'Local'
                });
            });
            console.log('💾 Registros locales agregados:', registrosLocales.length);
        } catch (error) {
            console.error('❌ Error consultando registros locales:', error);
        }
        
        // 3. Cola offline
        try {
            if (window.offlineQueueManager && typeof window.offlineQueueManager.obtenerColaLocal === 'function') {
                const colaLocal = window.offlineQueueManager.obtenerColaLocal();
                colaLocal.forEach(r => {
                    records.push({
                        name: r.name || '',
                        cedula: r.cedula || '',
                        telefono: r.telefono || '',
                        sexo: r.sexo || '',
                        edad: r.edad || '',
                        ubch: r.ubch || '',
                        community: r.community || '',
                        registeredAt: r.registeredAt ? (new Date(r.registeredAt)).toLocaleString('es-VE', {hour12:true}) : '',
                        source: 'Cola'
                    });
                });
                console.log('🔄 Registros de cola agregados:', colaLocal.length);
            }
        } catch (error) {
            console.error('❌ Error consultando cola offline:', error);
        }
        
        // Eliminar duplicados por cédula (mantener el más reciente)
        const uniqueRecords = [];
        const seenCedulas = new Set();
        records.forEach(record => {
            if (!seenCedulas.has(record.cedula)) {
                seenCedulas.add(record.cedula);
                uniqueRecords.push(record);
            }
        });
        
        console.log('📋 Total de registros únicos:', uniqueRecords.length);
        if (uniqueRecords.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8">No tienes registros propios aún.</td></tr>';
            return;
        }
        
        // Función para renderizar filas filtradas
        function renderRows(filtered) {
            if (!filtered.length) {
                tableBody.innerHTML = '<tr><td colspan="8">No se encontraron registros.</td></tr>';
                return;
            }
            tableBody.innerHTML = filtered.map(d => `
                <tr>
                    <td>${d.name}</td>
                    <td>${d.cedula}</td>
                    <td>${d.telefono}</td>
                    <td>${d.sexo}</td>
                    <td>${d.edad}</td>
                    <td>${d.ubch}</td>
                    <td>${d.community}</td>
                    <td>${d.registeredAt}</td>
                </tr>
            `).join('');
        }
        // Inicial: mostrar todos
        renderRows(uniqueRecords);
        // Filtrado en tiempo real
        const searchInput = document.getElementById('myrecords-search');
        if (searchInput) {
            searchInput.value = '';
            searchInput.oninput = function() {
                const q = this.value.trim().toLowerCase();
                if (!q) return renderRows(uniqueRecords);
                const filtered = uniqueRecords.filter(d =>
                    Object.values(d).some(val => (val+'').toLowerCase().includes(q))
                );
                renderRows(filtered);
            };
        }
    } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="8">Error cargando registros</td></tr>';
    }
};

// Descargar los registros del usuario actual como CSV
window.downloadMyRecordsAsCSV = async function() {
    // Obtener usuario actual
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const username = normalizarUsuario(currentUser.username || '');
    if (!username) return alert('No hay usuario activo');
    const snapshot = await window.firebaseDB.votesCollection.where('registeredBy', '==', username).orderBy('createdAt', 'desc').limit(1000).get();
    if (snapshot.empty) return alert('No tienes registros propios aún.');
    let csv = 'Nombre,Cédula,Teléfono,Sexo,Edad,CV,Comunidad,Fecha\n';
    snapshot.forEach(doc => {
        const d = doc.data();
        csv += `"${d.name||''}","${d.cedula||''}","${d.telefono||''}","${d.sexo||''}","${d.edad||''}","${d.ubch||''}","${d.community||''}","${d.registeredAt ? (new Date(d.registeredAt)).toLocaleString('es-VE', {hour12:true}) : ''}"
`;
    });
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mis_registros.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};

// Mostrar la tabla cada vez que se entra en la sección
if (typeof switchRegistrationMode === 'function') {
    const oldSwitch = switchRegistrationMode;
    window.switchRegistrationMode = function(mode) {
        oldSwitch(mode);
        if (mode === 'myrecords') {
            window.renderMyRecordsTable();
        }
    };
}

// Función para normalizar el nombre de usuario (minúsculas y sin espacios extra)
function normalizarUsuario(username) {
    return (username || '').trim().toLowerCase();
}

// --- Exportar Mis Registros (solo usuario actual) ---
document.addEventListener('DOMContentLoaded', function() {
    const btnCSV = document.getElementById('myrecords-export-csv');
    const btnPDF = document.getElementById('myrecords-export-pdf');
    if (btnCSV) {
        btnCSV.addEventListener('click', async function() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const username = normalizarUsuario(currentUser.username || '');
            if (!username) return alert('No hay usuario activo');
            const snapshot = await window.firebaseDB.votesCollection.where('registeredBy', '==', username).orderBy('createdAt', 'desc').limit(1000).get();
            if (snapshot.empty) return alert('No tienes registros propios aún.');
            let csv = 'Nombre;Cédula;Teléfono;Sexo;Edad;CV;Comunidad;Fecha\n';
            snapshot.forEach(doc => {
                const d = doc.data();
                csv += `"${d.name||''}";"${d.cedula||''}";"${d.telefono||''}";"${d.sexo||''}";"${d.edad||''}";"${d.ubch||''}";"${d.community||''}";"${d.registeredAt ? (new Date(d.registeredAt)).toLocaleString('es-VE', {hour12:true}) : ''}"\n`;
            });
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csv], {type: 'text/csv;charset=utf-8;'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mis_registros.csv';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
        });
    }
    if (btnPDF) {
        btnPDF.addEventListener('click', async function() {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert('Error: Librería PDF no disponible');
                return;
            }
            const { jsPDF } = window.jspdf;
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const username = normalizarUsuario(currentUser.username || '');
            if (!username) return alert('No hay usuario activo');
            const snapshot = await window.firebaseDB.votesCollection.where('registeredBy', '==', username).orderBy('createdAt', 'desc').limit(1000).get();
            if (snapshot.empty) return alert('No tienes registros propios aún.');
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text('Mis Registros', 20, 20);
            doc.setFontSize(10);
            doc.text(`Total de registros: ${snapshot.size}`, 20, 30);
            doc.text(`Fecha: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, 20, 36);
            // Datos de la tabla
            const tableData = [];
            snapshot.forEach(docSnap => {
                const d = docSnap.data();
                tableData.push([
                    d.name || '',
                    d.cedula || '',
                    d.telefono || '',
                    d.sexo || '',
                    d.edad || '',
                    d.ubch || '',
                    d.community || '',
                    d.registeredAt ? (new Date(d.registeredAt)).toLocaleString('es-VE', {hour12:true}) : ''
                ]);
            });
            doc.autoTable({
                head: [['Nombre', 'Cédula', 'Teléfono', 'Sexo', 'Edad', 'CV', 'Comunidad', 'Fecha']],
                body: tableData,
                startY: 45,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 245, 245] }
            });
            doc.save('mis_registros.pdf');
        });
    }
});

const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
const username = (currentUser.username || '').trim().toLowerCase();

// Verificar que Firebase esté disponible antes de usar votesCollection
if (window.firebaseDB && window.firebaseDB.votesCollection) {
window.firebaseDB.votesCollection.where('registeredBy', '==', username).get().then(snap => console.log('Registros:', snap.size));
} else {
    console.log('⚠️ Firebase no está listo aún, verificando registros más tarde...');
}

document.addEventListener('DOMContentLoaded', function() {
    const btnUpdateOld = document.getElementById('myrecords-update-old');
    if (btnUpdateOld) {
        btnUpdateOld.addEventListener('click', async function() {
            if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
                alert('Firebase no está listo para actualizar registros.');
                return;
            }
            const usernameCorrecto = 'victor';
            const confirmacion = confirm('¿Seguro que quieres vincular todos los registros antiguos (sin usuario) a tu usuario actual?');
            if (!confirmacion) return;
            let actualizados = 0;
            const snapshot = await window.firebaseDB.votesCollection.get();
            for (const doc of snapshot.docs) {
                const data = doc.data();
                if (!data.registeredBy || data.registeredBy === '' || data.registeredBy === null) {
                    try {
                        await window.firebaseDB.votesCollection.doc(doc.id).update({
                            registeredBy: usernameCorrecto
                        });
                        actualizados++;
                        console.log('Actualizado:', doc.id);
                    } catch (err) {
                        console.error('Error actualizando', doc.id, err);
                    }
                }
            }
            alert('Registros antiguos actualizados: ' + actualizados);
            if (window.renderMyRecordsTable) window.renderMyRecordsTable();
        });
    }
});

// Guardar registro localmente tras registro exitoso
function guardarRegistroLocal(registro) {
    let registros = JSON.parse(localStorage.getItem('misRegistrosLocales') || '[]');
    registros.push(registro);
    localStorage.setItem('misRegistrosLocales', JSON.stringify(registros));
}

// Renderizar tarjetas en Mis Registros
async function renderMisRegistrosComoTarjetas(filtro = '') {
    const contenedor = document.getElementById('myrecords-cards');
    if (!contenedor) return;
    
    // Obtener usuario actual
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const username = normalizarUsuario(currentUser.username || '');
    if (!username) {
        contenedor.innerHTML = '<p style="text-align:center;">No hay usuario activo</p>';
        return;
    }
    
    // Obtener registros de múltiples fuentes (igual que renderMyRecordsTable)
    const records = [];
    
    // 1. Registros locales
    try {
        const registrosLocales = JSON.parse(localStorage.getItem('misRegistrosLocales') || '[]');
        registrosLocales.forEach(r => {
            records.push({
                nombre: r.nombre || '',
                cedula: r.cedula || '',
                telefono: r.telefono || '',
                sexo: r.sexo || '',
                edad: r.edad || '',
                ubch: r.ubch || '',
                comunidad: r.comunidad || '',
                fecha: r.fecha || ''
            });
        });
    } catch (error) {
        console.error('❌ Error consultando registros locales para tarjetas:', error);
    }
    
    // 2. Cola offline
    try {
        if (window.offlineQueueManager && typeof window.offlineQueueManager.obtenerColaLocal === 'function') {
            const colaLocal = window.offlineQueueManager.obtenerColaLocal();
            colaLocal.forEach(r => {
                records.push({
                    nombre: r.name || '',
                    cedula: r.cedula || '',
                    telefono: r.telefono || '',
                    sexo: r.sexo || '',
                    edad: r.edad || '',
                    ubch: r.ubch || '',
                    comunidad: r.community || '',
                    fecha: r.registeredAt ? (new Date(r.registeredAt)).toLocaleString('es-VE', {hour12:true}) : ''
                });
            });
        }
    } catch (error) {
        console.error('❌ Error consultando cola offline para tarjetas:', error);
    }
    
    // Eliminar duplicados por cédula
    const uniqueRecords = [];
    const seenCedulas = new Set();
    records.forEach(record => {
        if (!seenCedulas.has(record.cedula)) {
            seenCedulas.add(record.cedula);
            uniqueRecords.push(record);
        }
    });
    
    // Aplicar filtro
    let registros = uniqueRecords;
    if (filtro) {
        const f = filtro.toLowerCase();
        registros = uniqueRecords.filter(r =>
            (r.nombre && r.nombre.toLowerCase().includes(f)) ||
            (r.cedula && r.cedula.toLowerCase().includes(f)) ||
            (r.telefono && r.telefono.toLowerCase().includes(f)) ||
            (r.sexo && r.sexo.toLowerCase().includes(f)) ||
            (r.edad && String(r.edad).includes(f)) ||
            (r.ubch && r.ubch.toLowerCase().includes(f)) ||
            (r.comunidad && r.comunidad.toLowerCase().includes(f)) ||
            (r.fecha && r.fecha.toLowerCase().includes(f))
        );
    }
    
    if (registros.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center;">No tienes registros propios aún.</p>';
        return;
    }
    
    contenedor.innerHTML = registros.map(reg => `
        <div class="tarjeta-registro">
            <strong>${reg.nombre}</strong> - ${reg.cedula}<br>
            Tel: ${reg.telefono} | Sexo: ${reg.sexo} | Edad: ${reg.edad}<br>
            CV: ${reg.ubch} | Comunidad: ${reg.comunidad}<br>
            <small>${reg.fecha}</small>
        </div>
    `).join('');
}

// Escuchar el input de búsqueda
const myrecordsSearch = document.getElementById('myrecords-search');
if (myrecordsSearch) {
    myrecordsSearch.addEventListener('input', async function() {
        await renderMisRegistrosComoTarjetas(this.value);
    });
}

// Llamar al render al cargar la página
if (document.getElementById('myrecords-cards')) {
    renderMisRegistrosComoTarjetas();
}

// Modificar el flujo de registro exitoso para guardar localmente
// Busca donde se muestra el mensaje de registro exitoso y agrega:
// guardarRegistroLocal({
//     nombre: name,
//     cedula: cedula,
//     telefono: telefono,
//     sexo: sexo,
//     edad: edad,
//     ubch: ubch,
//     comunidad: community,
//     fecha: new Date().toLocaleString()
// });

// Configuración por defecto para registro masivo
window.configuracionRegistroMasivo = {
    centroVotacion: 'GRUPO ESCOLAR DOCTOR RAFAEL PEREZ',
    comunidad: 'ALTAMIRA',
    nombrePorDefecto: 'NOMBRE POR DEFINIR'
};

// Función para actualizar configuración por defecto
window.actualizarConfiguracionMasivo = function() {
    const centro = prompt('Centro de Votación por defecto:', window.configuracionRegistroMasivo.centroVotacion);
    if (centro) window.configuracionRegistroMasivo.centroVotacion = centro;
    
    const comunidad = prompt('Comunidad por defecto:', window.configuracionRegistroMasivo.comunidad);
    if (comunidad) window.configuracionRegistroMasivo.comunidad = comunidad;
    
    const nombre = prompt('Nombre por defecto:', window.configuracionRegistroMasivo.nombrePorDefecto);
    if (nombre) window.configuracionRegistroMasivo.nombrePorDefecto = nombre;
    
    console.log('✅ Configuración actualizada:', window.configuracionRegistroMasivo);
};

