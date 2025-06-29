// Sistema de Gestión de Usuarios y Roles SOLO con Firebase Auth + Firestore
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
            'admin': {
                name: 'Administrador',
                permissions: ['manage_users', 'view_all'],
                description: 'Gestión de usuarios y acceso total'
            },
            'registrador': {
                name: 'Registrador',
                permissions: ['view_registration', 'confirm_votes'],
                description: 'Registrar votantes y confirmar votos'
            },
            'usuario': {
                name: 'Usuario',
                permissions: ['view_registration', 'confirm_votes', 'view_listings', 'view_totals', 'view_statistics'],
                description: 'Ver registros, confirmar votos y estadísticas'
            }
        };
        this.init();
    }

    async init() {
        console.log('🔐 Iniciando sistema de gestión de usuarios...');
        // Verificar autenticación con Firebase Auth
        firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            // Cargar perfil y rol desde Firestore (colección 'usuarios')
            const perfilDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();
            if (!perfilDoc.exists) {
                alert('No tienes perfil asignado. Contacta al administrador.');
                window.location.href = 'login.html';
                return;
            }
            this.currentUser = { ...perfilDoc.data(), uid: user.uid };
            // Si es admin o superusuario, cargar todos los usuarios
            if (['superusuario', 'admin'].includes(this.currentUser.rol)) {
                await this.loadUsers();
            }
            this.setupInterface();
            console.log('✅ Sistema de gestión de usuarios iniciado');
        });
    }

    async loadUsers() {
        try {
            const snapshot = await firebase.firestore().collection('usuarios').get();
            this.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('👥 Usuarios cargados:', this.users.length);
        } catch (error) {
            console.error('❌ Error cargando usuarios:', error);
        }
    }

    setupInterface() {
        // Implementa aquí la lógica de interfaz según el rol actual
        // Ejemplo: mostrar/ocultar menús, botones, etc.
    }

    async logout() {
        try {
            await firebase.auth().signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error en logout:', error);
            window.location.href = 'login.html';
        }
    }

    // Métodos para crear, editar, eliminar usuarios usando Firebase Auth + Firestore
    async createUser(email, password, nombre, rol) {
        if (!this.roles[rol]) {
            alert('Rol inválido');
            return;
        }
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            await firebase.firestore().collection('usuarios').doc(userCredential.user.uid).set({
                email, nombre, rol, activo: true, creado: new Date()
            });
            alert('Usuario creado exitosamente');
            await this.loadUsers();
        } catch (error) {
            alert(`Error creando usuario: ${error.message}`);
        }
    }

    async changeUserRole(userId, newRol) {
        if (!this.roles[newRol]) {
            alert('Rol inválido');
            return;
        }
        try {
            await firebase.firestore().collection('usuarios').doc(userId).update({ rol: newRol });
            alert('Rol actualizado exitosamente');
            await this.loadUsers();
        } catch (error) {
            alert(`Error actualizando rol: ${error.message}`);
        }
    }

    async deleteUser(userId) {
        if (!confirm('¿Eliminar usuario?')) return;
        try {
            await firebase.firestore().collection('usuarios').doc(userId).delete();
            alert('Usuario eliminado');
            await this.loadUsers();
        } catch (error) {
            alert(`Error eliminando usuario: ${error.message}`);
        }
    }
}

// Exportar para uso global
window.UserManagement = UserManagement;
// Inicializar gestión de usuarios al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    window.userManagement = new UserManagement();
});

// --- NUEVA LÓGICA DE GESTIÓN DE USUARIOS SOLO CON FIREBASE AUTH ---
window.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        // Cargar perfil y rol desde Firestore
        const perfilDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();
        if (!perfilDoc.exists || !['superusuario', 'admin'].includes(perfilDoc.data().rol)) {
            alert('No tienes permisos para acceder a esta página.');
            window.location.href = 'index.html';
            return;
        }
        window.userAdmin = new UserAdmin(user, perfilDoc.data());
    });
});

class UserAdmin {
    constructor(firebaseUser, perfil) {
        this.firebaseUser = firebaseUser;
        this.perfil = perfil;
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
        this.setupLogout();
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
    setupLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                firebase.auth().signOut().then(() => {
                    window.location.href = 'login.html';
                });
            };
        }
    }
} 