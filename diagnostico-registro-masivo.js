// Script de diagnóstico para el registro masivo
console.log('🔍 Iniciando diagnóstico del registro masivo...');

// Función para diagnosticar el estado del sistema
function diagnosticarRegistroMasivo() {
    console.log('=== DIAGNÓSTICO DEL REGISTRO MASIVO ===');
    
    // 1. Verificar elementos DOM
    console.log('\n1. Verificando elementos DOM:');
    const elementos = {
        'paste-table': document.getElementById('paste-table'),
        'paste-table-body': document.getElementById('paste-table-body'),
        'import-massive-status': document.getElementById('import-massive-status'),
        'excel-file-input': document.getElementById('excel-file-input'),
        'progress-container': document.getElementById('progress-container'),
        'progress-bar': document.getElementById('progress-bar')
    };
    
    Object.entries(elementos).forEach(([nombre, elemento]) => {
        if (elemento) {
            console.log(`✅ ${nombre}: Encontrado`);
        } else {
            console.log(`❌ ${nombre}: NO encontrado`);
        }
    });
    
    // 2. Verificar Firebase
    console.log('\n2. Verificando Firebase:');
    if (window.firebaseDB) {
        console.log('✅ Firebase DB: Disponible');
        if (window.firebaseDB.votesCollection) {
            console.log('✅ Collection votes: Disponible');
        } else {
            console.log('❌ Collection votes: NO disponible');
        }
    } else {
        console.log('❌ Firebase DB: NO disponible');
    }
    
    // 3. Verificar datos en la tabla
    console.log('\n3. Verificando datos en la tabla:');
    const pasteTableBody = document.getElementById('paste-table-body');
    if (pasteTableBody) {
        const rows = pasteTableBody.rows;
        console.log(`📊 Filas en la tabla: ${rows.length}`);
        
        if (rows.length > 0) {
            for (let i = 0; i < Math.min(rows.length, 3); i++) {
                const cells = Array.from(rows[i].cells);
                const datos = cells.map(cell => cell.textContent.trim());
                console.log(`Fila ${i + 1}: [${datos.join(', ')}]`);
            }
        } else {
            console.log('⚠️ La tabla está vacía');
        }
    } else {
        console.log('❌ No se puede acceder a la tabla');
    }
    
    // 4. Verificar validación de datos
    console.log('\n4. Verificando validación de datos:');
    if (pasteTableBody) {
        let validos = 0, errores = 0;
        for (let tr of pasteTableBody.rows) {
            const cells = Array.from(tr.cells);
            if (cells.length < 7) {
                console.log('⚠️ Fila con menos de 7 columnas');
                continue;
            }
            
            const [ubch, community, name, cedula, telefono, sexo, edad] = cells.map(td => td.textContent.trim());
            
            // Validación
            let erroresFila = [];
            if (!ubch) erroresFila.push('Centro de Votación vacío');
            if (!community) erroresFila.push('Comunidad vacía');
            if (!name) erroresFila.push('Nombre vacío');
            if (!cedula) erroresFila.push('Cédula vacía');
            if (!sexo) erroresFila.push('Sexo vacío');
            if (!edad) erroresFila.push('Edad vacía');
            
            if (!/^\d{6,10}$/.test(cedula)) erroresFila.push('Cédula inválida');
            if (telefono && !/^04\d{9}$/.test(telefono)) erroresFila.push('Teléfono inválido');
            if (!['M','F','m','f'].includes(sexo)) erroresFila.push('Sexo inválido');
            if (isNaN(edad) || edad < 16 || edad > 120) erroresFila.push('Edad inválida');
            
            if (erroresFila.length === 0) {
                validos++;
            } else {
                errores++;
                console.log(`❌ Fila con errores: ${erroresFila.join(', ')}`);
            }
        }
        
        console.log(`📊 Registros válidos: ${validos}`);
        console.log(`📊 Registros con errores: ${errores}`);
    }
    
    // 5. Verificar funciones disponibles
    console.log('\n5. Verificando funciones disponibles:');
    const funciones = [
        'importPasteTable',
        'validateBulkData',
        'clearPasteTable',
        'downloadTemplate',
        'loadExcelFile'
    ];
    
    funciones.forEach(func => {
        if (typeof window[func] === 'function') {
            console.log(`✅ ${func}: Disponible`);
        } else {
            console.log(`❌ ${func}: NO disponible`);
        }
    });
    
    console.log('\n=== FIN DEL DIAGNÓSTICO ===');
}

// Función para simular carga de datos de prueba
function cargarDatosPrueba() {
    console.log('🧪 Cargando datos de prueba...');
    
    const pasteTableBody = document.getElementById('paste-table-body');
    if (!pasteTableBody) {
        console.log('❌ No se puede acceder a la tabla');
        return;
    }
    
    // Limpiar tabla
    pasteTableBody.innerHTML = '';
    
    // Datos de prueba
    const datosPrueba = [
        ['COLEGIO ASUNCION BELTRAN', 'EL VALLE', 'Juan Carlos Pérez', '12345678', '04121234567', 'M', '45'],
        ['LICEO JOSE FELIX RIBAS', 'EL CUJINAL', 'María Elena Rodríguez', '23456789', '04122345678', 'F', '38'],
        ['ESCUELA PRIMARIA BOLIVARIANA LA PRADERA', 'EL SAMAN', 'Carlos Alberto López', '34567890', '04123456789', 'M', '52']
    ];
    
    datosPrueba.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.style.background = '#fff';
        
        for (let i = 0; i < 8; i++) {
            const cell = document.createElement('td');
            if (i < 7) {
                cell.contentEditable = true;
                cell.style.padding = '1rem 0.75rem';
                cell.style.borderBottom = '1px solid #dee2e6';
                cell.style.minWidth = i < 3 ? '150px' : i < 5 ? '120px' : '80px';
                cell.textContent = row[i] || '';
            } else {
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
    
    console.log(`✅ Datos de prueba cargados: ${datosPrueba.length} registros`);
}

// Función para probar la validación
function probarValidacion() {
    console.log('🔍 Probando validación...');
    
    const datosPrueba = [
        ['COLEGIO ASUNCION BELTRAN', 'EL VALLE', 'Juan Pérez', '12345678', '', 'M', '45'], // Sin teléfono
        ['LICEO JOSE FELIX RIBAS', 'EL CUJINAL', 'María Rodríguez', '23456789', '04122345678', 'F', '38'], // Con teléfono
        ['ESCUELA PRIMARIA', 'EL SAMAN', 'Carlos López', '34567890', '04123456789', 'M', '52'] // Con teléfono
    ];
    
    datosPrueba.forEach((row, index) => {
        const [ubch, community, name, cedula, telefono, sexo, edad] = row;
        
        console.log(`\nPrueba ${index + 1}:`);
        console.log(`Datos: [${row.join(', ')}]`);
        
        // Validación
        let errores = [];
        if (!ubch) errores.push('Centro de Votación vacío');
        if (!community) errores.push('Comunidad vacía');
        if (!name) errores.push('Nombre vacío');
        if (!cedula) errores.push('Cédula vacía');
        if (!sexo) errores.push('Sexo vacío');
        if (!edad) errores.push('Edad vacía');
        
        if (!/^\d{6,10}$/.test(cedula)) errores.push('Cédula inválida');
        if (telefono && !/^04\d{9}$/.test(telefono)) errores.push('Teléfono inválido');
        if (!['M','F','m','f'].includes(sexo)) errores.push('Sexo inválido');
        if (isNaN(edad) || edad < 16 || edad > 120) errores.push('Edad inválida');
        
        if (errores.length === 0) {
            console.log('✅ Registro válido');
        } else {
            console.log(`❌ Errores: ${errores.join(', ')}`);
        }
    });
}

// Ejecutar diagnóstico cuando se cargue la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(diagnosticarRegistroMasivo, 1000);
    });
} else {
    setTimeout(diagnosticarRegistroMasivo, 1000);
}

// Hacer funciones disponibles globalmente
window.diagnosticarRegistroMasivo = diagnosticarRegistroMasivo;
window.cargarDatosPrueba = cargarDatosPrueba;
window.probarValidacion = probarValidacion;

console.log('🔧 Script de diagnóstico cargado. Usa:');
console.log('- diagnosticarRegistroMasivo() para diagnóstico completo');
console.log('- cargarDatosPrueba() para cargar datos de prueba');
console.log('- probarValidacion() para probar validación'); 