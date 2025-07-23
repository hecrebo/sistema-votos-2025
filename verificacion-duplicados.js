// === SISTEMA GLOBAL DE VERIFICACIÓN DE DUPLICADOS ===
// Este script proporciona funciones para verificar duplicados en todo el sistema

console.log('🔍 Cargando sistema global de verificación de duplicados...');

// Función global para verificar duplicados
window.verificarDuplicadoCedula = async function(cedula) {
    console.log(`🔍 Verificando duplicado para cédula: ${cedula}`);
    
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        console.error('❌ Firebase no disponible para verificación');
        return { esDuplicado: false, error: 'Firebase no disponible' };
    }
    
    try {
        const cedulaClean = cedula.replace(/\D/g, '');
        
        // Consulta específica para duplicados
        const duplicateQuery = window.firebaseDB.votesCollection
            .where('cedula', '==', cedulaClean)
            .limit(1);
        
        const duplicateSnapshot = await duplicateQuery.get();
        const esDuplicado = !duplicateSnapshot.empty;
        
        console.log(`🔍 Resultado verificación: ${esDuplicado ? 'DUPLICADO' : 'NO DUPLICADO'} para cédula ${cedulaClean}`);
        
        return {
            esDuplicado: esDuplicado,
            cedula: cedulaClean,
            registrosEncontrados: duplicateSnapshot.size
        };
        
    } catch (error) {
        console.error('❌ Error verificando duplicado:', error);
        return { esDuplicado: false, error: error.message };
    }
};

// Función global para verificar duplicados antes de guardar
window.guardarConVerificacionDuplicados = async function(voteData) {
    console.log('🔍 Guardando con verificación de duplicados...');
    
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        throw new Error('Firebase no disponible');
    }
    
    try {
        // Verificar duplicados
        const verificacion = await window.verificarDuplicadoCedula(voteData.cedula);
        
        if (verificacion.esDuplicado) {
            console.log(`🔄 Duplicado encontrado para cédula: ${voteData.cedula}`);
            throw new Error(`DUPLICADO: Ya existe un registro con la cédula ${voteData.cedula}`);
        }
        
        // Si no es duplicado, guardar
        console.log(`✅ No se encontraron duplicados, guardando registro...`);
        const docRef = await window.firebaseDB.votesCollection.add(voteData);
        
        console.log(`✅ Registro guardado exitosamente con ID: ${docRef.id}`);
        return docRef;
        
    } catch (error) {
        console.error('❌ Error guardando con verificación:', error);
        throw error;
    }
};

// Función para interceptar todas las operaciones de add
window.interceptarOperacionesAdd = function() {
    console.log('🛡️ Interceptando operaciones de add para verificación de duplicados...');
    
    if (!window.firebaseDB || !window.firebaseDB.votesCollection) {
        console.error('❌ Firebase no disponible para interceptación');
        return;
    }
    
    // Guardar la función original
    const originalAdd = window.firebaseDB.votesCollection.add;
    
    // Reemplazar con función que verifica duplicados
    window.firebaseDB.votesCollection.add = async function(data) {
        console.log('🛡️ Interceptando add con verificación de duplicados...');
        
        try {
            // Verificar duplicados si el dato tiene cédula
            if (data.cedula) {
                const verificacion = await window.verificarDuplicadoCedula(data.cedula);
                
                if (verificacion.esDuplicado) {
                    console.log(`🔄 DUPLICADO DETECTADO: ${data.cedula}`);
                    throw new Error(`DUPLICADO: Ya existe un registro con la cédula ${data.cedula}`);
                }
            }
            
            // Si no es duplicado, proceder con la operación original
            console.log('✅ No se encontraron duplicados, procediendo con add...');
            return await originalAdd.call(this, data);
            
        } catch (error) {
            console.error('❌ Error en add interceptado:', error);
            throw error;
        }
    };
    
    console.log('✅ Interceptación de operaciones add configurada');
};

// Función para configurar verificación automática
window.configurarVerificacionAutomatica = function() {
    console.log('⚙️ Configurando verificación automática de duplicados...');
    
    // Interceptar operaciones de add
    window.interceptarOperacionesAdd();
    
    // Configurar verificación en formularios
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            const cedulaInput = form.querySelector('input[name="cedula"], input[placeholder*="cédula"], input[placeholder*="Cédula"]');
            
            if (cedulaInput && cedulaInput.value) {
                console.log('🔍 Verificando duplicados en formulario...');
                
                try {
                    const verificacion = await window.verificarDuplicadoCedula(cedulaInput.value);
                    
                    if (verificacion.esDuplicado) {
                        e.preventDefault();
                        alert(`⚠️ DUPLICADO DETECTADO\n\nYa existe un registro con la cédula ${cedulaInput.value}.\n\nNo se puede crear un registro duplicado.`);
                        cedulaInput.focus();
                        return false;
                    }
                } catch (error) {
                    console.error('❌ Error verificando duplicados en formulario:', error);
                }
            }
        });
    });
    
    console.log('✅ Verificación automática configurada');
};

// Función para mostrar estado de verificación
window.mostrarEstadoVerificacion = function() {
    console.log('📊 Estado de verificación de duplicados:');
    console.log('✅ Funciones disponibles:');
    console.log('- verificarDuplicadoCedula(cedula)');
    console.log('- guardarConVerificacionDuplicados(voteData)');
    console.log('- interceptarOperacionesAdd()');
    console.log('- configurarVerificacionAutomatica()');
    
    if (window.firebaseDB && window.firebaseDB.votesCollection) {
        console.log('✅ Firebase disponible para verificación');
    } else {
        console.log('❌ Firebase no disponible');
    }
};

// Configurar automáticamente cuando se carga
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Configurando verificación automática de duplicados...');
    
    // Esperar a que Firebase esté disponible
    setTimeout(() => {
        if (window.firebaseDB && window.firebaseDB.votesCollection) {
            window.configurarVerificacionAutomatica();
        } else {
            console.log('⏳ Firebase no disponible, reintentando en 2 segundos...');
            setTimeout(() => {
                if (window.firebaseDB && window.firebaseDB.votesCollection) {
                    window.configurarVerificacionAutomatica();
                } else {
                    console.log('❌ Firebase no disponible después de reintentos');
                }
            }, 2000);
        }
    }, 1000);
});

console.log('✅ Sistema global de verificación de duplicados cargado');
console.log('📋 Funciones disponibles:');
console.log('- verificarDuplicadoCedula(cedula)');
console.log('- guardarConVerificacionDuplicados(voteData)');
console.log('- interceptarOperacionesAdd()');
console.log('- configurarVerificacionAutomatica()');
console.log('- mostrarEstadoVerificacion()'); 