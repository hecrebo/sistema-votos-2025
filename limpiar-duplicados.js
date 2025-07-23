// === SCRIPT PARA LIMPIAR DUPLICADOS EN FIREBASE ===
// Este script elimina registros duplicados basándose en la cédula

console.log('🧹 Iniciando limpieza de duplicados...');

// Función para limpiar duplicados
window.limpiarDuplicadosFirebase = async function() {
    console.log('🔍 Iniciando proceso de limpieza de duplicados...');
    
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        alert('❌ Firebase no está disponible');
        return;
    }
    
    try {
        // Obtener todos los registros
        console.log('📥 Obteniendo todos los registros...');
        const snapshot = await window.firebaseDB.votesCollection.get();
        
        if (snapshot.empty) {
            console.log('✅ No hay registros para limpiar');
            alert('✅ No hay registros para limpiar');
            return;
        }
        
        console.log(`📊 Total de registros encontrados: ${snapshot.size}`);
        
        // Agrupar por cédula
        const registrosPorCedula = {};
        const duplicados = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const cedula = data.cedula;
            
            if (!registrosPorCedula[cedula]) {
                registrosPorCedula[cedula] = [];
            }
            
            registrosPorCedula[cedula].push({
                id: doc.id,
                data: data,
                timestamp: data.timestamp || 0
            });
        });
        
        // Identificar duplicados
        Object.keys(registrosPorCedula).forEach(cedula => {
            const registros = registrosPorCedula[cedula];
            
            if (registros.length > 1) {
                console.log(`🔄 Cédula ${cedula} tiene ${registros.length} registros`);
                
                // Ordenar por timestamp (más reciente primero)
                registros.sort((a, b) => b.timestamp - a.timestamp);
                
                // Mantener solo el más reciente, marcar los demás como duplicados
                const registrosAEliminar = registros.slice(1);
                duplicados.push(...registrosAEliminar);
            }
        });
        
        console.log(`🔄 Total de duplicados encontrados: ${duplicados.length}`);
        
        if (duplicados.length === 0) {
            console.log('✅ No se encontraron duplicados');
            alert('✅ No se encontraron duplicados');
            return;
        }
        
        // Confirmar eliminación
        const confirmacion = confirm(
            `Se encontraron ${duplicados.length} registros duplicados.\n\n` +
            `¿Deseas eliminar los duplicados?\n\n` +
            `Se mantendrá el registro más reciente de cada cédula.`
        );
        
        if (!confirmacion) {
            console.log('❌ Operación cancelada por el usuario');
            return;
        }
        
        // Eliminar duplicados
        console.log('🗑️ Eliminando duplicados...');
        let eliminados = 0;
        
        for (const duplicado of duplicados) {
            try {
                await window.firebaseDB.votesCollection.doc(duplicado.id).delete();
                eliminados++;
                console.log(`✅ Eliminado duplicado: ${duplicado.data.name} - ${duplicado.data.cedula}`);
            } catch (error) {
                console.error(`❌ Error eliminando duplicado: ${duplicado.id}`, error);
            }
        }
        
        console.log(`🎯 Limpieza completada: ${eliminados} duplicados eliminados`);
        alert(`✅ Limpieza completada\n\n${eliminados} duplicados eliminados\n\nSe mantuvieron los registros más recientes.`);
        
    } catch (error) {
        console.error('❌ Error en limpieza de duplicados:', error);
        alert('❌ Error durante la limpieza de duplicados');
    }
};

// Función para verificar duplicados sin eliminarlos
window.verificarDuplicadosFirebase = async function() {
    console.log('🔍 Verificando duplicados...');
    
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        alert('❌ Firebase no está disponible');
        return;
    }
    
    try {
        const snapshot = await window.firebaseDB.votesCollection.get();
        
        if (snapshot.empty) {
            console.log('✅ No hay registros para verificar');
            alert('✅ No hay registros para verificar');
            return;
        }
        
        const registrosPorCedula = {};
        const duplicados = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const cedula = data.cedula;
            
            if (!registrosPorCedula[cedula]) {
                registrosPorCedula[cedula] = [];
            }
            
            registrosPorCedula[cedula].push({
                id: doc.id,
                data: data,
                timestamp: data.timestamp || 0
            });
        });
        
        // Identificar duplicados
        Object.keys(registrosPorCedula).forEach(cedula => {
            const registros = registrosPorCedula[cedula];
            
            if (registros.length > 1) {
                duplicados.push({
                    cedula: cedula,
                    cantidad: registros.length,
                    registros: registros
                });
            }
        });
        
        if (duplicados.length === 0) {
            console.log('✅ No se encontraron duplicados');
            alert('✅ No se encontraron duplicados');
            return;
        }
        
        // Mostrar reporte de duplicados
        let reporte = `🔍 REPORTE DE DUPLICADOS\n\n`;
        reporte += `Total de cédulas con duplicados: ${duplicados.length}\n\n`;
        
        duplicados.forEach(dup => {
            reporte += `Cédula ${dup.cedula}: ${dup.cantidad} registros\n`;
            dup.registros.forEach((reg, index) => {
                const fecha = new Date(reg.timestamp).toLocaleString();
                reporte += `  ${index + 1}. ${reg.data.name} - ${fecha}\n`;
            });
            reporte += '\n';
        });
        
        console.log(reporte);
        alert(reporte);
        
    } catch (error) {
        console.error('❌ Error verificando duplicados:', error);
        alert('❌ Error verificando duplicados');
    }
};

// Función para crear índice único en cédula (solo para información)
window.crearIndiceUnicoCedula = function() {
    console.log('📋 Para crear un índice único en cédula:');
    console.log('1. Ve a Firebase Console');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a Firestore Database');
    console.log('4. Ve a la pestaña "Índices"');
    console.log('5. Crea un índice único en la colección "votes"');
    console.log('6. Campo: "cedula"');
    console.log('7. Tipo: "Ascending"');
    console.log('8. Configuración: "Unique"');
    
    alert('📋 Instrucciones para crear índice único:\n\n1. Ve a Firebase Console\n2. Selecciona tu proyecto\n3. Ve a Firestore Database\n4. Ve a la pestaña "Índices"\n5. Crea un índice único en la colección "votes"\n6. Campo: "cedula"\n7. Tipo: "Ascending"\n8. Configuración: "Unique"');
};

console.log('✅ Script de limpieza de duplicados cargado');
console.log('📋 Funciones disponibles:');
console.log('- limpiarDuplicadosFirebase() - Elimina duplicados');
console.log('- verificarDuplicadosFirebase() - Verifica duplicados');
console.log('- crearIndiceUnicoCedula() - Instrucciones para índice único'); 