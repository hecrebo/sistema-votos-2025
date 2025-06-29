class VotingSystemFirebase {
    constructor() {
        this.currentPage = 'registration';
        this.userId = this.generateUserId();
        
        // Sistema de cola para múltiples usuarios
        this.registrationQueue = [];
        this.isProcessingQueue = false;
        this.concurrentRegistrations = 0;
        this.maxConcurrentRegistrations = 5;
        
        // Debounce para búsquedas
        this.searchTimeout = null;
        
        // Cache para optimizar consultas
        this.cache = {
            ubchData: null,
            votes: null,
            lastUpdate: null
        };
        
        // Variables para modales
        this.voteToDelete = null;
        this.voteToEdit = null;
        
        this.ubchToCommunityMap = {
            "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS", "VILLAS DEL CENTRO 3ERA ETAPA B", "VILLAS DEL CENTRO 3ERA ETAPA C", "VILLAS DEL CENTRO 4A ETAPA", "LA CAMACHERA"],
            "LICEO JOSE FELIX RIBAS": ["EL CUJIJAL", "LAS FLORES", "LAS ESPERANZA 200", "VILLAS DEL CENTRO 2ERA ETAPA A", "LOS PALOMARES", "EL LAGO", "CAIPARICALLY I II", "EL BANCO", "CAIPARICHA I Y II"],
            "ESCUELA PRIMARIA BOLIVARIANA LA PRADERA": ["EL SAMAN", "GUADALUPE", "PALOS GRANDES II", "PALOS GRANDES I", "TIERRA DEL SOL", "LA CASTELLANA", "GARDENIAS I", "GARDENIAS II", "EL CERCADITO", "ALTAMIRA", "LA ADJUNTADA", "BUCARES", "GUAYABAL", "APARTATE", "EL REFUGIO", "LOS ROBLES", "ARAUCARIA"],
            "CASA COMUNAL JOSE TOMAS GALLARDO": ["JOSE TOMAS GALLARDO A", "LA PRIMAVERA"],
            "ESCUELA 5 DE JULIO": ["10 DE AGOSTO", "CAMPO ALEGRE I", "CAMPO ALEGRE II", "5 DE JULIO"],
            "ESCUELA CECILIO ACOSTA": ["VOLUNTAD DE DIOS", "LAS MATWINAS", "BRISAS DEL LAGO", "MANDANTO", "INDIANAPOLIS", "SUR DE ACOSTA"],
            "ESCUELA BASICA FE Y ALEGRIA": ["FE Y ALEGRIA", "BARRIO SOLIDARIO", "COMUNIDAD FUTURO"],
            "ESCUELA GRADUADA ANTONIO JOSE DE SUCRE": ["JESUS DE NAZARETH", "SECTOR BOLIVAR", "PALO NEGRO ESTE"],
            "CASA COMUNAL": ["LOS JABILLOS"],
            "UNIDAD EDUCATIVA MONSEÑOR JACINTO SOTO LAYERA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II"],
            "BASE DE MISIONES LUISA CACERES DE ARISMENDI": ["24 DE ENERO", "19 DE ABRIL", "EL PROGRESO"],
            "ESCUELA ESTADAL ALEJO ZULOAGA": ["MAIQUETIA", "SAENZ", "PANAMERICANO"],
            "UNIDAD EDUCATIVA MONSEÑOR MONTES DE OCA": ["REMEDIOS"],
            "ESCUELA BASICA NACIONAL CONCENTRADA LA ESTACION": ["18 DE OCTUBRE"],
            "ESCUELA RECEPTORIA": ["CARMEN CENTRO"],
            "GRUPO ESCOLAR DR RAFAEL PEREZ": ["VIRGEN DEL CARMEN"],
            "LICEO ALFREDO PIETRI": ["LOS OJITOS", "LOS VENECIANOS"],
            "ESCUELA BOLIVARIANA ROMERO GARCIA": ["SAN BERNARDO", "LA HACIENDA"],
            "ESCUELA GRADUADA PEDRO GUAL": ["INDIANOS NORTE"]
        };
        
        this.votes = [];
        this.candidates = [];
        this.pdfLibrariesReady = false;
        this.projectionInterval = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('🔍 Iniciando conexión con Firebase...');
            
            // Verificar que Firebase esté disponible
            if (!window.firebaseDB) {
                throw new Error('Firebase no está inicializado');
            }
            
            console.log('✅ Firebase configurado correctamente');
            console.log('📊 Configuración Firebase:', window.firebaseDB);
            
            // Cargar datos desde Firebase
            await this.loadDataFromFirebase();
            console.log('✅ Datos cargados desde Firebase:', this.votes.length, 'registros');
            
            this.showMessage('Conectado a Firebase. Los datos están centralizados en la nube.', 'success', 'registration');
            
            // Configurar listener en tiempo real
            this.setupRealtimeListener();
            console.log('✅ Listener en tiempo real configurado');
            
            // Actualizar indicador de sincronización
            this.updateSyncIndicator(true);
            
        } catch (error) {
            console.error('❌ Error al conectar con Firebase:', error);
            this.showMessage('Error de conexión. Verificando configuración de Firebase.', 'error', 'registration');
            this.updateSyncIndicator(false, true);
        }
        
        this.setupEventListeners();
        this.renderCurrentPage();
        this.loadPdfLibraries();
    }

    async loadDataFromFirebase() {
        try {
            // Cargar votos desde Firebase
            const votesSnapshot = await window.firebaseDB.votesCollection.get();
            this.votes = votesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Cargar configuración UBCH
            const ubchSnapshot = await window.firebaseDB.ubchCollection.doc('config').get();
            if (ubchSnapshot.exists) {
                this.ubchToCommunityMap = ubchSnapshot.data().mapping;
            }

        } catch (error) {
            console.error('Error cargando datos de Firebase:', error);
            throw error;
        }
    }

    setupRealtimeListener() {
        console.log('🔄 Configurando listener en tiempo real...');
        
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
            
            const docRef = await window.firebaseDB.votesCollection.add({
                ...voteData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Datos guardados en Firebase con ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error guardando en Firebase:', error);
            throw error;
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

        // Validar UBCH y comunidad
        if (!data.ubch || !data.community) {
            return { isValid: false, message: 'Debe seleccionar UBCH y comunidad' };
        }

        return { isValid: true, message: 'Datos válidos' };
    }

    async handleRegistration() {
        const form = document.getElementById('registration-form');
        const formData = new FormData(form);
        
        const name = formData.get('name').trim();
        const cedula = formData.get('cedula').trim();
        const telefono = formData.get('telefono').trim();
        const sexo = formData.get('sexo');
        const edad = formData.get('edad');
        const ubch = formData.get('ubch');
        const community = formData.get('community');

        // Validación inicial
        if (!name || !cedula || !telefono || !sexo || !edad || !ubch || !community) {
            this.showMessage('Por favor, completa todos los campos.', 'error', 'registration');
            return;
        }

        // Preparar datos
        const registrationData = {
            name,
            cedula: cedula.replace(/\D/g, ''),
            telefono: telefono.replace(/\D/g, ''),
            sexo,
            edad: parseInt(edad),
            ubch,
            community,
            registeredBy: this.userId,
            voted: false
        };

        this.setLoadingState('registration', true);

        try {
            // Validar datos
            const validation = this.validateRegistrationData(registrationData);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            // Verificar duplicados
            const isDuplicate = this.votes.some(vote => vote.cedula === registrationData.cedula);
            if (isDuplicate) {
                throw new Error('Esta cédula ya está registrada');
            }

            // Guardar en Firebase
            const voteId = await this.saveVoteToFirebase(registrationData);
            
            this.showMessage('¡Persona registrada con éxito!', 'success', 'registration');
            await this.generateThankYouMessage(name, ubch, community);
            
            // Limpiar formulario
            form.reset();
            document.getElementById('community').disabled = true;
            
        } catch (error) {
            console.error('Error al registrar:', error);
            this.showMessage(error.message || 'Error al registrar persona. Inténtalo de nuevo.', 'error', 'registration');
        } finally {
            this.setLoadingState('registration', false);
        }
    }

    async confirmVote(personId) {
        try {
            await this.updateVoteInFirebase(personId, {
                voted: true,
                voteTimestamp: new Date().toISOString()
            });
            
            this.showMessage('¡Voto confirmado con éxito!', 'success', 'check-in');
            document.getElementById('cedula-search').value = '';
            document.getElementById('search-results').innerHTML = '';
            
        } catch (error) {
            console.error('Error al confirmar voto:', error);
            this.showMessage('Error al confirmar el voto. Inténtalo de nuevo.', 'error', 'check-in');
        }
    }

    async confirmDelete() {
        if (!this.voteToDelete) return;

        try {
            await this.deleteVoteFromFirebase(this.voteToDelete);
            this.closeDeleteModal();
        } catch (error) {
            console.error('Error al eliminar:', error);
            this.showMessage('Error al eliminar el registro.', 'error', 'listado');
        }
    }

    // Métodos de renderizado (igual que el original)
    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navigateToPage(e.target.dataset.page);
            });
        });

        // Formulario de registro
        document.getElementById('registration-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // Formulario de confirmación de voto
        document.getElementById('check-in-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCheckIn();
        });

        // Formulario de edición
        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditSubmit(e);
        });

        // Cambio de UBCH en formulario de registro
        document.getElementById('ubch').addEventListener('change', (e) => {
            this.handleUBCHChange(e.target.value);
        });

        // Cambio de UBCH en formulario de edición
        document.getElementById('edit-ubch').addEventListener('change', (e) => {
            this.handleEditUBCHChange(e.target.value);
        });

        // Botones del modal de eliminación
        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Botones del modal de edición
        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.closeEditModal();
        });

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

        // Mostrar ID de usuario
        document.getElementById('userId').textContent = this.userId;

        // Listeners para exportar PDF y CSV
        const pdfBtn = document.getElementById('export-pdf-btn');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => this.exportToPDF());
        }
        const csvBtn = document.getElementById('export-csv-btn');
        if (csvBtn) {
            csvBtn.addEventListener('click', () => this.exportToCSV());
        }
    }

    navigateToPage(page) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        document.getElementById(`${page}-page`).classList.add('active');
        this.currentPage = page;
        this.renderCurrentPage();
    }

    renderCurrentPage() {
        switch (this.currentPage) {
            case 'registration':
                this.renderRegistrationPage();
                break;
            case 'check-in':
                this.renderCheckInPage();
                break;
            case 'listado':
                this.renderListPage();
                break;
            case 'dashboard':
                this.renderDashboardPage();
                break;
            case 'statistics':
                this.renderStatisticsPage();
                break;
        }
    }

    renderRegistrationPage() {
        const ubchSelect = document.getElementById('ubch');
        const communitySelect = document.getElementById('community');

        ubchSelect.innerHTML = '<option value="">Selecciona una UBCH</option>';
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';
        communitySelect.disabled = true;

        Object.keys(this.ubchToCommunityMap).forEach(ubch => {
            const option = document.createElement('option');
            option.value = ubch;
            option.textContent = ubch;
            ubchSelect.appendChild(option);
        });
    }

    handleUBCHChange(selectedUBCH) {
        const communitySelect = document.getElementById('community');
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';
        communitySelect.disabled = !selectedUBCH;

        if (selectedUBCH && this.ubchToCommunityMap[selectedUBCH]) {
            this.ubchToCommunityMap[selectedUBCH].forEach(community => {
                const option = document.createElement('option');
                option.value = community;
                option.textContent = community;
                communitySelect.appendChild(option);
            });
        }
    }

    handleEditUBCHChange(selectedUBCH) {
        const communitySelect = document.getElementById('edit-community');
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';
        communitySelect.disabled = !selectedUBCH;

        if (selectedUBCH && this.ubchToCommunityMap[selectedUBCH]) {
            this.ubchToCommunityMap[selectedUBCH].forEach(community => {
                const option = document.createElement('option');
                option.value = community;
                option.textContent = community;
                communitySelect.appendChild(option);
            });
        }
    }

    renderCheckInPage() {
        // La página ya está renderizada en el HTML
    }

    async handleCheckIn() {
        const cedula = document.getElementById('cedula-search').value.trim();
        
        if (!cedula) {
            this.showMessage('Por favor, ingresa un número de cédula para buscar.', 'error', 'check-in');
            return;
        }

        const results = this.votes.filter(vote => vote.cedula === cedula);
        
        if (results.length === 0) {
            this.showMessage(`No se encontró a ninguna persona con la cédula ${cedula}.`, 'error', 'check-in');
            return;
        }

        this.renderSearchResults(results);
        this.showMessage(`Se encontró ${results.length} persona(s) con la cédula ${cedula}.`, 'success', 'check-in');
    }

    renderSearchResults(results) {
        const container = document.getElementById('search-results');
        container.innerHTML = '';

        results.forEach(person => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <div class="search-result-info">
                    <h4>${person.name}</h4>
                    <p>Cédula: ${person.cedula}</p>
                    <p>Sexo: ${person.sexo === 'M' ? 'Masculino' : person.sexo === 'F' ? 'Femenino' : 'N/A'}</p>
                    <p>Edad: ${person.edad || 'N/A'} años</p>
                    <p>UBCH: ${person.ubch}</p>
                    <p>Comunidad: ${person.community}</p>
                </div>
                <button class="btn btn-success" onclick="votingSystem.confirmVote('${person.id}')">
                    Confirmar Voto
                </button>
            `;
            container.appendChild(div);
        });
    }

    renderListPage() {
        this.renderVotesTable();
    }

    renderVotesTable() {
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';

        this.votes.forEach(vote => {
            const tr = document.createElement('tr');
            const sexoClass = vote.sexo === 'M' ? 'sexo-masculino' : vote.sexo === 'F' ? 'sexo-femenino' : '';
            tr.innerHTML = `
                <td>${vote.name}</td>
                <td>${vote.cedula}</td>
                <td class="${sexoClass}">${vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : 'N/A'}</td>
                <td>${vote.edad || 'N/A'}</td>
                <td>${vote.ubch}</td>
                <td>${vote.community}</td>
                <td>
                    <span class="vote-status ${vote.voted ? 'voted' : 'not-voted'}">
                        ${vote.voted ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-primary btn-small" onclick="votingSystem.editVote('${vote.id}')">
                        Editar
                    </button>
                    <button class="btn btn-danger btn-small" onclick="votingSystem.deleteVote('${vote.id}')">
                        Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    deleteVote(voteId) {
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

        // Configurar UBCH y comunidad
        this.populateEditUBCH(vote.ubch, vote.community);
    }

    populateEditUBCH(selectedUBCH, selectedCommunity) {
        const ubchSelect = document.getElementById('edit-ubch');
        const communitySelect = document.getElementById('edit-community');

        // Limpiar opciones existentes
        ubchSelect.innerHTML = '<option value="">Selecciona una UBCH</option>';
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
        document.getElementById('vote-progress').textContent = `${percentage.toFixed(1)}%`;
        document.getElementById('progress-text').textContent = `${totalVoted} de ${totalRegistered} personas han votado.`;
    }

    renderStatisticsPage() {
        const votedVotes = this.votes.filter(vote => vote.voted);
        
        // Estadísticas por UBCH
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
                `¡Excelente ${name}! Tu registro en la UBCH "${ubch}" y comunidad "${community}" es un paso importante para fortalecer nuestra democracia. Tu participación cuenta.`,
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

    exportToPDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('No se encontró la librería jsPDF.');
            return;
        }
        const doc = new window.jspdf.jsPDF();
        const columns = [
            { header: 'Nombre', dataKey: 'name' },
            { header: 'Cédula', dataKey: 'cedula' },
            { header: 'Sexo', dataKey: 'sexo' },
            { header: 'Edad', dataKey: 'edad' },
            { header: 'UBCH', dataKey: 'ubch' },
            { header: 'Comunidad', dataKey: 'community' },
            { header: 'Votó', dataKey: 'voted' }
        ];
        const rows = this.votes.map(vote => ({
            name: vote.name,
            cedula: vote.cedula,
            sexo: vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : '',
            edad: vote.edad || '',
            ubch: vote.ubch,
            community: vote.community,
            voted: vote.voted ? 'Sí' : 'No'
        }));
        doc.text('Listado de Personas Registradas', 14, 16);
        doc.autoTable({
            columns,
            body: rows,
            startY: 20,
            styles: { fontSize: 9 }
        });
        doc.save('listado-personas.pdf');
    }

    exportToCSV() {
        const headers = ['Nombre', 'Cédula', 'Sexo', 'Edad', 'UBCH', 'Comunidad', 'Votó'];
        const rows = this.votes.map(vote => [
            `"${(vote.name || '').replace(/"/g, '""')}"`,
            `"${(vote.cedula || '').replace(/"/g, '""')}"`,
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
        link.setAttribute('download', `listado-personas-${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Inicializar el sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.votingSystem = new VotingSystemFirebase();
}); 