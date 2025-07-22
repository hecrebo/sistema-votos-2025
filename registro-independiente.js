// --- REGISTRO CENTRO DE VOTACIÓN/COMUNIDAD AISLADO ---

// Configuración estática (puedes cargarla dinámicamente si lo prefieres)
const UBCH_TO_COMMUNITY = {
    "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS", "VILLAS DEL CENTRO 1ERA ETAPA", "VILLAS DEL CENTRO 3ERA ETAPA B", "VILLAS DEL CENTRO 3ERA ETAPA C", "VILLAS DEL CENTRO IV ETAPA", "LA CAMACHERA", "COMUNIDAD NO DEFINIDA"],
    "LICEO JOSE FELIX RIBAS": ["EL CUJINAL", "LAS MORAS", "VILLA ESPERANZA 200", "VILLAS DEL CENTRO 3ERA ETAPA A", "LOS PALOMARES", "EL LAGO", "CARABALI I Y II", "EL BANCO", "CARIAPRIMA I Y II", "COMUNIDAD NO DEFINIDA"],
    "ESCUELA PRIMARIA BOLIVARIANA LA PRADERA": ["EL SAMAN", "GUAYABAL E", "PALOS GRANDES II", "PALOS GRANDES I", "TIERRAS DEL SOL", "LA CASTELLANA", "GARDENIAS I", "GARDENIAS II", "EL CERCADITO", "ALTAMIRA", "LA ENSENADA", "BUCARES", "GUAYABAL", "APAMATE", "EL REFUGIO", "LOS ROBLES", "ARAGUANEY", "COMUNIDAD NO DEFINIDA"],
    "CASA COMUNAL JOSE TOMAS GALLARDO": ["JOSE TOMAS GALLARDO A", "JOSE TOMAS GALLARDO B", "ALI PRIMERA", "COMUNIDAD NO DEFINIDA"],
    "ESCUELA 5 DE JULIO": ["10 DE AGOSTO", "CAMPO ALEGRE I", "CAMPO ALEGRE II", "5 DE JULIO", "COMUNIDAD NO DEFINIDA"],
    "ESCUELA CECILIO ACOSTA": ["VOLUNTAD DE DIOS", "LAS MALVINAS", "BRISAS DEL LAGO", "MAISANTA", "INDIANA SUR", "LOS CASTORES", "COMUNIDAD NO DEFINIDA"],
    "ESCUELA BASICA FE Y ALEGRIA": ["FE Y ALEGRIA", "COMUNIDAD NO DEFINIDA"],
    "ESCUELA GRADUADA ANTONIO JOSE DE SUCRE": ["PALO NEGRO OESTE", "JESUS DE NAZARETH", "SECTOR BOLIVAR", "PALO NEGRO ESTE", "COMUNIDAD NO DEFINIDA"],
    "CASA COMUNAL": ["LOS JABILLOS", "COMUNIDAD NO DEFINIDA"],
    "UNIDAD EDUCATIVA MONSEÑOR JACINTO SOTO LAYERA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II", "COMUNIDAD NO DEFINIDA"],
    "BASE DE MISIONES LUISA CACERES DE ARISMENDI": ["4 DE DICIEMBRE", "23 DE ENERO", "19 DE ABRIL", "EL EREIGÜE", "COMUNIDAD NO DEFINIDA"],
    "ESCUELA ESTADAL ALEJO ZULOAGA": ["MANUELITA SAENZ", "PANAMERICANO", "COMUNIDAD NO DEFINIDA"],
    "UNIDAD EDUCATIVA MONSEÑOR MONTES DE OCA": ["REMATE", "COMUNIDAD NO DEFINIDA"],
    "ESCUELA BASICA NACIONAL CONCENTRADA LA ESTACION": ["18 DE OCTUBRE", "COMUNIDAD NO DEFINIDA"],
    "ESCUELA RECEPTORIA": ["CARMEN CENTRO", "CENTRO CENTRO", "COMUNIDAD NO DEFINIDA"],
    "GRUPO ESCOLAR DR RAFAEL PEREZ": ["VIRGEN DEL CARMEN", "COMUNIDAD NO DEFINIDA"],
    "LICEO ALFREDO PIETRI": ["LOS OJITOS", "LOS VENCEDORES", "COMUNIDAD NO DEFINIDA"],
    "ESCUELA BOLIVARIANA ROMERO GARCIA": ["SAN BERNARDO", "LA CAPILLA", "LAS HACIENDAS", "COMUNIDAD NO DEFINIDA"],
    "ESCUELA GRADUADA PEDRO GUAL": ["BOQUITA CENTRO", "INDIANA NORTE", "COMUNIDAD NO DEFINIDA"]
};

function cargarUBCH() {
    const ubchSelect = document.getElementById('ubch-ind');
    ubchSelect.innerHTML = '<option value="">Selecciona una UBCH</option>';
    Object.keys(UBCH_TO_COMMUNITY).forEach(ubch => {
        const option = document.createElement('option');
        option.value = ubch;
        option.textContent = ubch;
        ubchSelect.appendChild(option);
    });
}

function cargarComunidades(ubch) {
    const communitySelect = document.getElementById('community-ind');
    communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';
    if (UBCH_TO_COMMUNITY[ubch]) {
        UBCH_TO_COMMUNITY[ubch].forEach(comunidad => {
            const option = document.createElement('option');
            option.value = comunidad;
            option.textContent = comunidad;
            communitySelect.appendChild(option);
        });
        communitySelect.disabled = false;
    } else {
        communitySelect.disabled = true;
    }
}

function guardarSeleccionIndependiente(ubch, comunidad) {
    localStorage.setItem('seleccionIndependiente', JSON.stringify({ ubch, comunidad }));
}

function restaurarSeleccionIndependiente() {
    const data = localStorage.getItem('seleccionIndependiente');
    if (!data) return;
    try {
        const { ubch, comunidad } = JSON.parse(data);
        const ubchSelect = document.getElementById('ubch-ind');
        const communitySelect = document.getElementById('community-ind');
        if (ubch && ubchSelect.querySelector(`option[value="${ubch.replace(/"/g, '&quot;')}"]`)) {
            ubchSelect.value = ubch;
            cargarComunidades(ubch);
        }
        if (comunidad && communitySelect.querySelector(`option[value="${comunidad.replace(/"/g, '&quot;')}"]`)) {
            communitySelect.value = comunidad;
        }
    } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
    cargarUBCH();
    restaurarSeleccionIndependiente();
    document.getElementById('ubch-ind').addEventListener('change', e => {
        cargarComunidades(e.target.value);
        document.getElementById('community-ind').value = '';
    });
    document.getElementById('form-registro-independiente').addEventListener('submit', e => {
        e.preventDefault();
        const ubch = document.getElementById('ubch-ind').value;
        const comunidad = document.getElementById('community-ind').value;
        if (!ubch || !comunidad) {
            document.getElementById('msg-registro-independiente').textContent = 'Debes seleccionar Centro de Votación y comunidad.';
            document.getElementById('msg-registro-independiente').style.color = 'red';
            return;
        }
        guardarSeleccionIndependiente(ubch, comunidad);
        document.getElementById('msg-registro-independiente').textContent = 'Selección guardada correctamente.';
        document.getElementById('msg-registro-independiente').style.color = 'green';
        // --- NUEVO: Actualizar formulario principal si está visible ---
        const form = document.getElementById('registration-form');
        if (form && form.ubch && form.community) {
            form.ubch.value = ubch;
            // Disparar evento para cargar comunidades
            form.ubch.dispatchEvent(new Event('change'));
            setTimeout(() => {
                form.community.value = comunidad;
            }, 200); // Espera breve para asegurar que las opciones estén listas
        }
    });
    // --- NUEVO: Al cargar la página, si hay selección guardada, ponerla en el formulario principal ---
    setTimeout(() => {
        const data = localStorage.getItem('seleccionIndependiente');
        if (!data) return;
        try {
            const { ubch, comunidad } = JSON.parse(data);
            const form = document.getElementById('registration-form');
            if (form && form.ubch && form.community) {
                form.ubch.value = ubch;
                form.ubch.dispatchEvent(new Event('change'));
                setTimeout(() => {
                    form.community.value = comunidad;
                }, 200);
            }
        } catch (e) {}
    }, 500);
});
