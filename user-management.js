// Sistema de Gestión de Usuarios y Roles
class UserManagement {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.roles = {
            'superusuario': {
                name: 'Superusuario',
                permissions: ['all'],
                description: 'Acceso completo al sistema'
            },
            'usuario': {
                name: 'Usuario',
                permissions: ['view_registration', 'confirm_votes', 'view_listings', 'view_totals', 'view_statistics'],
                description: 'Ver registros, confirmar votos y estadísticas'
            },
            'registrador': {
                name: 'Registrador',
                permissions: ['view_registration', 'confirm_votes'],
                description: 'Registrar votantes y confirmar votos'
            }
        };
        
        this.init();
    }
    
    async init() {
        console.log('🔐 Iniciando sistema de gestión de usuarios...');
        
        // Cargar usuario actual
        this.loadCurrentUser();
        
        // Verificar autenticación
        if (!this.currentUser) {
            this.redirectToLogin();
            return;
        }
        
        // Cargar usuarios si es superusuario
        if (this.currentUser.role === 'superusuario') {
            await this.loadUsers();
        }
        
        // Configurar interfaz según rol
        this.setupInterface();
        
        console.log('✅ Sistema de gestión de usuarios iniciado');
    }
    
    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            console.log('👤 Usuario cargado:', this.currentUser);
        }
    }
    
    redirectToLogin() {
        window.location.href = 'login.html';
    }
    
    async loadUsers() {
        try {
            const snapshot = await firebase.firestore().collection('users').get();
            this.users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('👥 Usuarios cargados:', this.users.length);
        } catch (error) {
            console.error('❌ Error cargando usuarios:', error);
        }
    }
    
    setupInterface() {
        // Ocultar elementos según permisos
        this.hideUnauthorizedElements();
        
        // Mostrar información del usuario
        this.displayUserInfo();
        
        // Configurar navegación según rol
        this.setupNavigation();
    }
    
    hideUnauthorizedElements() {
        const permissions = this.getUserPermissions();
        
        // Elementos que requieren permisos específicos
        const elementsByPermission = {
            'view_registration': ['#registration-page'],
            'confirm_votes': ['#check-in-page'],
            'view_listings': ['#listado-page'],
            'view_totals': ['#dashboard-page'],
            'view_statistics': ['#statistics-page'],
            'admin_panel': ['#admin-panel-link', '.admin-link']
        };
        
        // Ocultar elementos no autorizados
        Object.keys(elementsByPermission).forEach(permission => {
            if (!permissions.includes(permission) && !permissions.includes('all')) {
                elementsByPermission[permission].forEach(selector => {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.style.display = 'none';
                    }
                });
            }
        });
        
        // Ocultar botones de navegación no autorizados
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const page = btn.getAttribute('data-page');
            const hasPermission = this.hasPermissionForPage(page);
            
            if (!hasPermission) {
                btn.style.display = 'none';
            }
        });
    }
    
    hasPermissionForPage(page) {
        const permissions = this.getUserPermissions();
        
        const pagePermissions = {
            'registration': ['view_registration'],
            'check-in': ['confirm_votes'],
            'listado': ['view_listings'],
            'dashboard': ['view_totals'],
            'statistics': ['view_statistics']
        };
        
        const requiredPermissions = pagePermissions[page] || [];
        
        return permissions.includes('all') || 
               requiredPermissions.some(perm => permissions.includes(perm));
    }
    
    displayUserInfo() {
        const userInfoElement = document.getElementById('userId');
        if (userInfoElement && this.currentUser) {
            userInfoElement.textContent = `${this.currentUser.displayName} (${this.roles[this.currentUser.role].name})`;
        }
    }
    
    setupNavigation() {
        // Ya no se debe agregar botón de logout aquí
    }
    
    getUserPermissions() {
        if (!this.currentUser) return [];
        
        const role = this.roles[this.currentUser.role];
        return role ? role.permissions : [];
    }
    
    hasPermission(permission) {
        const permissions = this.getUserPermissions();
        return permissions.includes('all') || permissions.includes(permission);
    }
    
    async logout() {
        try {
            // Cerrar sesión de Firebase si existe
            if (firebase.auth) {
                await firebase.auth().signOut();
            }
            
            // Limpiar localStorage
            localStorage.removeItem('currentUser');
            
            // Redirigir a login
            window.location.href = 'login.html';
            
        } catch (error) {
            console.error('Error en logout:', error);
            // Forzar redirección
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    }
    
    // Funciones de administración (solo para superusuario)
    async openUserManager() {
        if (!this.hasPermission('all')) {
            alert('No tienes permisos para acceder a esta función');
            return;
        }
        
        this.showUserManagerModal();
    }
    
    showUserManagerModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'user-manager-modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>👥 Gestión de Usuarios</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-actions">
                        <button class="btn btn-success" onclick="userManagement.createUser()">
                            ➕ Crear Usuario
                        </button>
                        <button class="btn btn-primary" onclick="userManagement.refreshUsers()">
                            🔄 Actualizar
                        </button>
                    </div>
                    <div class="users-table-container">
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body">
                                ${this.renderUsersTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    renderUsersTable() {
        if (this.users.length === 0) {
            return '<tr><td colspan="5" style="text-align: center;">No hay usuarios registrados</td></tr>';
        }
        
        return this.users.map(user => `
            <tr>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email}</td>
                <td>
                    <select onchange="userManagement.changeUserRole('${user.id}', this.value)">
                        ${Object.keys(this.roles).map(role => 
                            `<option value="${role}" ${user.role === role ? 'selected' : ''}>
                                ${this.roles[role].name}
                            </option>`
                        ).join('')}
                    </select>
                </td>
                <td>
                    <span class="status-badge ${user.active ? 'active' : 'inactive'}">
                        ${user.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="userManagement.resetPassword('${user.id}')">
                        🔑 Reset
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="userManagement.deleteUser('${user.id}')">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    async createUser() {
        const email = prompt('Email del nuevo usuario:');
        if (!email) return;
        
        const name = prompt('Nombre del usuario:');
        if (!name) return;
        
        const role = prompt('Rol (superusuario/usuario/registrador):');
        if (!this.roles[role]) {
            alert('Rol inválido');
            return;
        }
        
        const password = prompt('Contraseña temporal:');
        if (!password) return;
        
        try {
            // Crear usuario en Firebase Auth
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Guardar datos adicionales en Firestore
            await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                role: role,
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.currentUser.uid
            });
            
            alert('Usuario creado exitosamente');
            await this.loadUsers();
            this.showUserManagerModal();
            
        } catch (error) {
            alert(`Error creando usuario: ${error.message}`);
        }
    }
    
    async changeUserRole(userId, newRole) {
        if (!this.roles[newRole]) {
            alert('Rol inválido');
            return;
        }
        
        try {
            await firebase.firestore().collection('users').doc(userId).update({
                role: newRole,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: this.currentUser.uid
            });
            
            alert('Rol actualizado exitosamente');
            await this.loadUsers();
            
        } catch (error) {
            alert(`Error actualizando rol: ${error.message}`);
        }
    }
    
    async resetPassword(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        const newPassword = prompt('Nueva contraseña:');
        if (!newPassword) return;
        
        try {
            // Reset password en Firebase Auth
            await firebase.auth().sendPasswordResetEmail(user.email);
            alert(`Se envió un email de reset a ${user.email}`);
            
        } catch (error) {
            alert(`Error reseteando contraseña: ${error.message}`);
        }
    }
    
    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        if (!confirm(`¿Estás seguro de eliminar al usuario ${user.name}?`)) {
            return;
        }
        
        try {
            // Desactivar usuario en lugar de eliminarlo
            await firebase.firestore().collection('users').doc(userId).update({
                active: false,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedBy: this.currentUser.uid
            });
            
            alert('Usuario desactivado exitosamente');
            await this.loadUsers();
            
        } catch (error) {
            alert(`Error eliminando usuario: ${error.message}`);
        }
    }
    
    async refreshUsers() {
        await this.loadUsers();
        const tbody = document.getElementById('users-table-body');
        if (tbody) {
            tbody.innerHTML = this.renderUsersTable();
        }
    }
}

// Inicializar gestión de usuarios
let userManagement;

window.addEventListener('load', () => {
    userManagement = new UserManagement();
});

// Exportar para uso global
window.UserManagement = UserManagement;

// --- NUEVA LÓGICA DE GESTIÓN DE USUARIOS ---

// Inicialización global
window.addEventListener('DOMContentLoaded', () => {
    // Proteger acceso solo para superusuario/admin
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        // Cargar perfil y rol
        const perfilDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();
        if (!perfilDoc.exists || !['superusuario', 'admin'].includes(perfilDoc.data().rol)) {
            alert('No tienes permisos para acceder a esta página.');
            window.location.href = 'index.html';
            return;
        }
        // Mostrar panel
        window.userAdmin = new UserAdmin();
    });
});

class UserAdmin {
    constructor() {
        this.users = [];
        this.audit = [];
        this.init();
    }
    async init() {
        await this.loadUsers();
        await this.loadAudit();
        this.setupForm();
        this.setupCSV();
        this.renderUsers();
        this.renderAudit();
    }
    async loadUsers() {
        const snap = await firebase.firestore().collection('usuarios').get();
        this.users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    async loadAudit() {
        const snap = await firebase.firestore().collection('auditoria').orderBy('fecha', 'desc').limit(100).get();
        this.audit = snap.docs.map(doc => doc.data());
    }
    setupForm() {
        const form = document.getElementById('add-user-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const email = document.getElementById('user-email').value;
                const password = document.getElementById('user-password').value;
                const nombre = document.getElementById('user-nombre').value;
                const rol = document.getElementById('user-rol').value;
                try {
                    const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
                    await firebase.firestore().collection('usuarios').doc(cred.user.uid).set({
                        email, nombre, rol, creado: new Date()
                    });
                    await this.logAudit(email, 'Alta individual');
                    alert('Usuario creado');
                    form.reset();
                    await this.loadUsers();
                    this.renderUsers();
                } catch (err) {
                    alert('Error: ' + err.message);
                }
            };
        }
    }
    setupCSV() {
        const btn = document.getElementById('import-csv-btn');
        if (btn) {
            btn.onclick = async () => {
                const input = document.getElementById('csv-input');
                if (!input.files[0]) return alert('Selecciona un archivo CSV');
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const lines = e.target.result.split('\n').filter(l => l.trim());
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    for (let i = 1; i < lines.length; i++) {
                        const vals = lines[i].split(',');
                        if (vals.length < 4) continue;
                        const [email, password, nombre, rol] = vals;
                        try {
                            const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
                            await firebase.firestore().collection('usuarios').doc(cred.user.uid).set({
                                email, nombre, rol, creado: new Date()
                            });
                            await this.logAudit(email, 'Alta masiva CSV');
                        } catch (err) {
                            console.error('Error creando usuario CSV:', email, err.message);
                        }
                    }
                    alert('Importación masiva finalizada');
                    await this.loadUsers();
                    this.renderUsers();
                };
                reader.readAsText(input.files[0]);
            };
        }
        // Descargar plantilla
        const tpl = document.getElementById('download-csv-template');
        if (tpl) {
            tpl.onclick = (e) => {
                e.preventDefault();
                const csv = 'email,password,nombre,rol\n';
                const blob = new Blob([csv], { type: 'text/csv' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'plantilla-usuarios.csv';
                link.click();
            };
        }
    }
    renderUsers() {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;
        tbody.innerHTML = this.users.map(u => `
            <tr>
                <td>${u.email}</td>
                <td>${u.nombre || ''}</td>
                <td>
                    <select onchange="window.userAdmin.changeRole('${u.id}', this.value)">
                        <option value="superusuario" ${u.rol==='superusuario'?'selected':''}>Superusuario</option>
                        <option value="admin" ${u.rol==='admin'?'selected':''}>Administrador</option>
                        <option value="registrador" ${u.rol==='registrador'?'selected':''}>Registrador</option>
                        <option value="usuario" ${u.rol==='usuario'?'selected':''}>Usuario</option>
                    </select>
                </td>
                <td>${u.ultimoAcceso ? new Date(u.ultimoAcceso.seconds*1000).toLocaleString() : ''}</td>
                <td><button onclick="window.userAdmin.deleteUser('${u.id}')" class="btn btn-danger btn-sm">Eliminar</button></td>
            </tr>
        `).join('');
    }
    renderAudit() {
        const tbody = document.querySelector('#audit-table tbody');
        if (!tbody) return;
        tbody.innerHTML = this.audit.map(a => `
            <tr>
                <td>${a.email}</td>
                <td>${a.accion}</td>
                <td>${a.fecha ? new Date(a.fecha.seconds*1000).toLocaleString() : ''}</td>
            </tr>
        `).join('');
    }
    async changeRole(uid, rol) {
        await firebase.firestore().collection('usuarios').doc(uid).update({ rol });
        await this.logAudit(uid, 'Cambio de rol a ' + rol);
        await this.loadUsers();
        this.renderUsers();
    }
    async deleteUser(uid) {
        if (!confirm('¿Eliminar usuario?')) return;
        await firebase.firestore().collection('usuarios').doc(uid).delete();
        await this.logAudit(uid, 'Eliminado');
        await this.loadUsers();
        this.renderUsers();
    }
    async logAudit(email, accion) {
        await firebase.firestore().collection('auditoria').add({
            email,
            accion,
            fecha: new Date()
        });
    }
} 