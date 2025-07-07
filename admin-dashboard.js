// admin-dashboard.js

// Copia de USUARIOS_INICIALES para evitar dependencia directa de login.html en este script
const USUARIOS_INICIALES_ADMIN_PANEL = [
    // Superusuarios
    { username: "superadmin_01", password: "SUp3r_Adm1n#2o24", rol: "superusuario" },
    { username: "superadmin_02", password: "aB5!zP9$qW_sU", rol: "superusuario" },
    { username: "superadmin_03", password: "rT7@eX3&yU_sU", rol: "superusuario" },
    { username: "superadmin_04", password: "kL9#mN1!bV_sU", rol: "superusuario" },
    { username: "superadmin_05", password: "zX8$cV6@fG_sU", rol: "superusuario" },
    { username: "diego corrales", password: "alcalde1", rol: "superusuario" },
    // Administradores
    { username: "admin_01", password: "P@ssw0rd_Adm_01", rol: "admin" },
    { username: "admin_02", password: "Adm_Secure_02!", rol: "admin" },
    { username: "admin_03", password: "Gestion_2024_03", rol: "admin" },
    { username: "admin_04", password: "4dminUser_p4ss", rol: "admin" },
    { username: "admin_05", password: "Adm!n_Syst3m_05", rol: "admin" },
    { username: "admin_06", password: "UserAdmin_06#", rol: "admin" },
    { username: "admin_07", password: "Control_Panel_07", rol: "admin" },
    { username: "admin_08", password: "Adm_Access_08$", rol: "admin" },
    { username: "admin_09", password: "My_Admin_P@ss09", rol: "admin" },
    { username: "admin_10", password: "P@ss_Adm_Global", rol: "admin" },
    // Registradores (ejemplos, pueden haber más)
    { username: "maria ordoñez", password: "20161765", rol: "registrador" },
    { username: "reinaldo aguilar", password: "12478928", rol: "registrador" },
    // Usuarios de ejemplo para otros roles
    { username: "usuario_visor", password: "user123", rol: "usuario" },
    { username: "usuario_ccv_test", password: "ccv123", rol: "CCV" }
];


// Función para verificar el rol del usuario y mostrar/ocultar elementos del panel
function checkUserRoleForAdminPanel() {
    const currentUserData = localStorage.getItem('currentUser');
    if (!currentUserData) {
        // Si no hay usuario, redirigir o mostrar mensaje, aunque idealmente no se debería llegar aquí sin login
        console.warn("No hay usuario logueado en admin panel.");
        // Opcionalmente, ocultar todo o redirigir
        // document.body.innerHTML = "<h1>Acceso Denegado</h1>";
        return;
    }

    const currentUser = JSON.parse(currentUserData);
    const userRole = currentUser.rol;

    console.log("Rol del usuario en Admin Panel:", userRole);

    // Elementos que solo superusuarios pueden ver/usar
    const superUserElements = [
        document.getElementById('send-notification-card'), // Tarjeta para enviar notificaciones
        document.getElementById('user-role-management-card') // Tarjeta para gestión de roles
        // Añadir más IDs de elementos específicos para superusuario aquí
    ];

    if (userRole === 'superusuario') {
        superUserElements.forEach(el => {
            if (el) el.style.display = 'block'; // o 'flex', o lo que corresponda a su display original
        });
        // Cargar usuarios para la gestión de roles si la tarjeta existe
        if (document.getElementById('user-role-management-card')) {
            loadUsersForRoleManagement();
        }
    } else {
        superUserElements.forEach(el => {
            if (el) el.style.display = 'none';
        });
    }

    // Si hay otros roles con acceso limitado al panel (ej. 'admin'), se manejarían aquí
    // Por ahora, asumimos que solo 'superusuario' tiene acceso total al panel de admin.
    // Si un 'admin' normal no debe ver ciertas cosas, añadir lógica similar.
}


// --- Funcionalidad de Notificaciones Globales (para Superusuarios) ---
function sendGlobalNotification() {
    const messageInput = document.getElementById('global-notification-message');
    const message = messageInput.value.trim();

    if (!message) {
        alert('Por favor, escribe un mensaje para la notificación.');
        return;
    }

    if (!window.firebaseDB || !window.firebaseDB.db) {
        alert('Error: Firebase no está inicializado. No se puede enviar la notificación.');
        console.error('Firebase DB no disponible para enviar notificación.');
        return;
    }

    const notificationsRef = window.firebaseDB.db.collection('notifications');
    notificationsRef.add({
        message: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        sender: JSON.parse(localStorage.getItem('currentUser'))?.username || 'superusuario'
    })
    .then(() => {
        alert('Notificación enviada exitosamente.');
        messageInput.value = '';
    })
    .catch(error => {
        console.error("Error enviando notificación:", error);
        alert('Error al enviar la notificación. Revisa la consola.');
    });
}

// --- Funcionalidad de Gestión de Usuarios y Roles (para Superusuarios) ---
function loadUsersForRoleManagement() {
    // Usar la copia local USUARIOS_INICIALES_ADMIN_PANEL
    const users = USUARIOS_INICIALES_ADMIN_PANEL;
    if (!users || users.length === 0) {
        console.warn("No se pudo cargar la lista de usuarios para la gestión de roles.");
        const userTableBody = document.getElementById('admin-users-table-body');
        if (userTableBody) {
            userTableBody.innerHTML = '<tr><td colspan="3">No se pudieron cargar los usuarios.</td></tr>';
        }
        return;
    }
    renderUsersForRoleManagement(users);
}

function renderUsersForRoleManagement(users) {
    const tableBody = document.getElementById('admin-users-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Limpiar tabla
    const availableRoles = ['superusuario', 'admin', 'usuario', 'registrador', 'CCV'];

    users.forEach((user, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>${user.rol}</td>
            <td>
                <select id="role-select-${index}" class="admin-role-select">
                    ${availableRoles.map(role =>
                        `<option value="${role}" ${user.rol === role ? 'selected' : ''}>${role}</option>`
                    ).join('')}
                </select>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function saveRoleChanges() {
    const users = USUARIOS_INICIALES_ADMIN_PANEL; // Trabajar con la copia local
    let changesMade = false;

    users.forEach((user, index) => {
        const selectElement = document.getElementById(`role-select-${index}`);
        if (selectElement) {
            const newRole = selectElement.value;
            if (user.rol !== newRole) {
                console.log(`Cambio de rol para ${user.username}: de ${user.rol} a ${newRole} (simulado)`);
                // Actualizar la copia local en admin-dashboard.js
                USUARIOS_INICIALES_ADMIN_PANEL[index].rol = newRole;
                changesMade = true;
            }
        }
    });

    if (changesMade) {
        // Re-renderizar la tabla para mostrar los roles actualizados (en la UI del admin panel)
        renderUsersForRoleManagement(USUARIOS_INICIALES_ADMIN_PANEL);
        alert("Cambios de roles aplicados en esta sesión del panel de administración.\n\nIMPORTANTE: Estos cambios NO son persistentes. Para que los roles actualizados se reflejen en el inicio de sesión, debes modificar manualmente la lista 'USUARIOS_INICIALES' en el archivo 'login.html'.\n\nUna gestión de usuarios y roles más robusta requeriría almacenar esta información en una base de datos (como Firebase) en lugar de un archivo HTML.");
        console.log("USUARIOS_INICIALES_ADMIN_PANEL actualizado:", USUARIOS_INICIALES_ADMIN_PANEL);
    } else {
        alert("No se detectaron cambios en los roles.");
    }
    // NOTA: No se puede escribir directamente en login.html desde aquí por razones de seguridad y arquitectura.
    // La persistencia real requeriría un backend o modificar manualmente el archivo fuente.
}


// Inicialización cuando el DOM del panel de admin esté listo
document.addEventListener('DOMContentLoaded', () => {
    checkUserRoleForAdminPanel();

    const sendNotificationBtn = document.getElementById('send-global-notification-btn');
    if (sendNotificationBtn) {
        sendNotificationBtn.addEventListener('click', sendGlobalNotification);
    }

    const saveRolesBtn = document.getElementById('save-role-changes-btn');
    if (saveRolesBtn) {
        saveRolesBtn.addEventListener('click', saveRoleChanges);
    }
});


// Módulo independiente para dashboard visual en el panel de administración (Gráficos)
// Eliminar este IIFE y el <div id="dashboard-visual"> para quitar el módulo sin afectar el sistema
(function() {
    // Verifica si el contenedor existe
    const container = document.getElementById('dashboard-visual');
    if (!container) return;
    container.innerHTML = `
        <div style="background:white;padding:24px;border-radius:15px;box-shadow:0 4px 16px rgba(0,0,0,0.07);margin-bottom:24px;">
            <h2 style="margin-top:0;">📊 Dashboard Visual (Simulado)</h2>
            <canvas id="chart-registros" height="80"></canvas>
            <canvas id="chart-votos" height="80" style="margin-top:32px;"></canvas>
        </div>
    `;
    // Datos simulados (reemplazar por datos reales si se desea)
    const dias = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    const registros = [12, 19, 7, 15, 10, 5, 8];
    const votos = [8, 15, 5, 12, 7, 3, 6];
    // Gráfico de registros
    new Chart(document.getElementById('chart-registros').getContext('2d'), {
        type: 'bar',
        data: {
            labels: dias,
            datasets: [{
                label: 'Registros por día',
                data: registros,
                backgroundColor: 'rgba(102,126,234,0.7)',
                borderColor: 'rgba(102,126,234,1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {y: {beginAtZero: true}}
        }
    });
    // Gráfico de votos
    new Chart(document.getElementById('chart-votos').getContext('2d'), {
        type: 'line',
        data: {
            labels: dias,
            datasets: [{
                label: 'Votos confirmados por día',
                data: votos,
                fill: false,
                borderColor: 'rgba(118,75,162,1)',
                backgroundColor: 'rgba(118,75,162,0.2)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {y: {beginAtZero: true}}
        }
    });
})(); 