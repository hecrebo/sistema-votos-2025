// Lógica para el formulario de registro de rezagados
(function() {
    // Validaciones básicas reutilizadas del sistema principal
    function validarDatos(data) {
        if (!data.cedula || !/^\d{6,10}$/.test(data.cedula)) {
            return { ok: false, msg: 'Cédula inválida (6-10 dígitos).' };
        }
        if (!data.name || data.name.trim().length < 3) {
            return { ok: false, msg: 'Nombre inválido (mín. 3 caracteres).' };
        }
        if (data.telefono && !/^04\d{9}$/.test(data.telefono)) {
            return { ok: false, msg: 'Teléfono inválido (formato 04xxxxxxxxx).' };
        }
        if (!data.sexo || !['M', 'F'].includes(data.sexo)) {
            return { ok: false, msg: 'Debes seleccionar el sexo.' };
        }
        const edadNum = parseInt(data.edad, 10);
        if (isNaN(edadNum) || edadNum < 16 || edadNum > 120) {
            return { ok: false, msg: 'Edad inválida (16-120).' };
        }
        if (!data.ubch || !data.community) {
            return { ok: false, msg: 'Selecciona Centro de Votación y comunidad.' };
        }
        return { ok: true };
    }

    // Mostrar mensaje en pantalla
    function mostrar(msg, tipo = 'info') {
        const div = document.getElementById('msg');
        if (!div) return;
        div.textContent = msg;
        div.style.color = tipo === 'error' ? '#dc2626' : '#16a34a';
    }

    async function guardarEnFirebase(datos) {
        if (window.firebaseDB && window.firebaseDB.votesCollection) {
            try {
                await window.firebaseDB.votesCollection.add({
                    ...datos,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Rezagado guardado en Firebase');
                return true;
            } catch (err) {
                console.error('❌ Error Firebase:', err);
            }
        }
        // Fallback localStorage
        const key = 'rezagadosLocal';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push({ ...datos, id: 'local_' + Date.now() });
        localStorage.setItem(key, JSON.stringify(arr));
        console.log('💾 Rezagado guardado localmente');
        return true;
    }

    // Poblar selects de UBCH y comunidad
    function poblarUBCH() {
        const ubchSelect = document.getElementById('ubch');
        const communitySelect = document.getElementById('community');
        if (!ubchSelect || !communitySelect) return;

        const mapping = (window.firebaseDB && window.firebaseDB.defaultUBCHConfig) || {};

        // Poblar UBCH
        ubchSelect.innerHTML = '<option value="">Selecciona un Centro de Votación</option>';
        Object.keys(mapping).forEach(cv => {
            const opt = document.createElement('option');
            opt.value = cv;
            opt.textContent = cv;
            ubchSelect.appendChild(opt);
        });

        // Poblar todas las comunidades disponibles (sin filtrar por UBCH)
        const todasComunidades = [...new Set(Object.values(mapping).flat())].sort();
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';
        todasComunidades.forEach(com => {
            const opt = document.createElement('option');
            opt.value = com;
            opt.textContent = com;
            communitySelect.appendChild(opt);
        });

        // Inicializar Choices para autocompletado (ambos independientes)
        if (typeof Choices !== 'undefined') {
            ubchSelect._choices = new Choices(ubchSelect, { searchEnabled: true });
            communitySelect._choices = new Choices(communitySelect, { searchEnabled: true });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Verificar rol
        const usuario = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!usuario || usuario.rol !== 'verificador') {
            alert('Acceso denegado');
            window.location.href = 'login.html';
            return;
        }

        poblarUBCH();

        const form = document.getElementById('registration-form');
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const data = {
                name: document.getElementById('name').value.trim(),
                cedula: document.getElementById('cedula').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                sexo: document.getElementById('sexo').value,
                edad: document.getElementById('edad').value,
                ubch: document.getElementById('ubch').value,
                community: document.getElementById('community').value,
                // Metadatos
                registradoPor: usuario.username,
                tipoRegistro: 'rezagado',
                rolRegistro: 'verificador'
            };

            const val = validarDatos(data);
            if (!val.ok) {
                mostrar(val.msg, 'error');
                return;
            }

            mostrar('Guardando...', 'info');
            const ok = await guardarEnFirebase(data);
            if (ok) {
                mostrar('✅ Registrado correctamente');
                form.reset();
            } else {
                mostrar('❌ Error al guardar', 'error');
            }
        });
    });
})(); 