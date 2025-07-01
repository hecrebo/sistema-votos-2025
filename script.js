// Sistema de Registro de Votos 2025 - JavaScript Vanilla con JSON Server

class VotingSystem {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
        this.currentPage = 'registration';
        this.userId = this.generateUserId();
        this.ubchToCommunityMap = {};
        this.votes = [];
        this.candidates = [];
        this.useLocalStorage = false;
        this.pdfLibrariesReady = false;
        
        this.init();
    }

    async init() {
        try {
            await this.loadData();
        this.setupEventListeners();
        this.renderCurrentPage();
        this.loadPdfLibraries();
        } catch (error) {
            console.log('Servidor no disponible, usando localStorage');
            this.useLocalStorage = true;
            this.loadFromLocalStorage();
            this.setupEventListeners();
            this.renderCurrentPage();
        }
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    async loadData() {
        try {
            // Cargar mapeo UBCH-Comunidad
            const ubchResponse = await fetch(`${this.apiUrl}/ubchToCommunityMap`);
            if (!ubchResponse.ok) throw new Error('No se pudo cargar el mapeo UBCH-Comunidad');
            const ubchData = await ubchResponse.json();
            if (!ubchData || Object.keys(ubchData).length === 0) {
                this.showMessage('No se encontraron UBCH disponibles. Contacte al administrador.', 'error', 'registration');
            this.ubchToCommunityMap = {};
        } else {
                this.ubchToCommunityMap = ubchData;
            }
            
            // Cargar votos
            const votesResponse = await fetch(`${this.apiUrl}/votes`);
            this.votes = await votesResponse.json();
            
            // Cargar candidatos
            const candidatesResponse = await fetch(`${this.apiUrl}/candidates`);
            this.candidates = await candidatesResponse.json();
            
            } catch (error) {
            this.showMessage('Error al cargar datos del servidor. Verifique su conexión.', 'error', 'registration');
            throw new Error('No se pudo conectar al servidor');
        }
    }

    loadFromLocalStorage() {
        this.ubchToCommunityMap = JSON.parse(localStorage.getItem('ubchToCommunityMap')) || {};
        this.votes = JSON.parse(localStorage.getItem('votes')) || [];
        this.candidates = JSON.parse(localStorage.getItem('candidates')) || [];
    }

    async saveData() {
        if (this.useLocalStorage) {
            localStorage.setItem('ubchToCommunityMap', JSON.stringify(this.ubchToCommunityMap));
            localStorage.setItem('votes', JSON.stringify(this.votes));
            localStorage.setItem('candidates', JSON.stringify(this.candidates));
        } else {
            try {
                // Actualizar votos
                await fetch(`${this.apiUrl}/votes`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.votes)
                });
            } catch (error) {
                console.error('Error al guardar en servidor:', error);
                this.useLocalStorage = true;
                this.saveData();
            }
        }
    }

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

        // Cambio de UBCH
        document.getElementById('ubch').addEventListener('change', (e) => {
            this.handleUBCHChange(e.target.value);
        });

        // Exportación
        document.getElementById('export-pdf-btn').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('export-csv-btn').addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('export-stats-pdf-btn').addEventListener('click', () => {
            this.exportStatsToPDF();
        });

        // Proyección
        document.getElementById('projection-btn').addEventListener('click', () => {
            this.enterProjectionMode();
        });

        document.getElementById('exit-projection-btn').addEventListener('click', () => {
            this.exitProjectionMode();
        });

        // Modal de eliminación
        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterChange(e.target.dataset.filter);
            });
        });

        // Mostrar ID de usuario
        document.getElementById('userId').textContent = this.userId;
    }

    navigateToPage(page) {
        // Actualizar navegación
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Ocultar todas las páginas
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Mostrar página seleccionada
        document.getElementById(`${page}-page`).classList.add('active');

        this.currentPage = page;
        this.renderCurrentPage();
        if (page === 'listado' && window.firebaseDB && window.firebaseDB.firebaseSyncManager) {
            window.firebaseDB.firebaseSyncManager.loadVotesFromFirebase().then(votes => {
                this.votes = votes;
                this.renderVotesTable();
            });
        }
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
        const form = document.getElementById('registration-form');

        // Limpiar opciones
        ubchSelect.innerHTML = '<option value="">Selecciona una UBCH</option>';
        communitySelect.innerHTML = '<option value="">Selecciona una comunidad</option>';
        communitySelect.disabled = true;

        // Si no hay UBCH, desactivar el formulario y mostrar mensaje
        if (!this.ubchToCommunityMap || Object.keys(this.ubchToCommunityMap).length === 0) {
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
            this.showMessage('No hay UBCH disponibles. Contacte al administrador.', 'error', 'registration');
            return;
        } else {
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = false);
        }

        // Llenar UBCH
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

    async handleRegistration() {
        const form = document.getElementById('registration-form');
        const formData = new FormData(form);
        
        const name = formData.get('name').trim();
        const cedula = formData.get('cedula').trim();
        const telefono = formData.get('telefono').trim();
        const sexo = formData.get('sexo');
        const edad = parseInt(formData.get('edad'), 10);
        const ubch = formData.get('ubch');
        const community = formData.get('community');

        // Validaciones
        const cedulaValida = /^\d{6,10}$/.test(cedula);
        const telefonoValido = /^04\d{9}$/.test(telefono);
        const sexoValido = sexo === 'M' || sexo === 'F';
        const edadValida = !isNaN(edad) && edad >= 16 && edad <= 120;

        if (!name || !cedula || !telefono || !sexo || !edad || !ubch || !community) {
            this.showMessage('Por favor, completa todos los campos.', 'error', 'registration');
            return;
        }
        if (!cedulaValida) {
            this.showMessage('Introduce una cédula válida (solo números, 6 a 10 dígitos).', 'error', 'registration');
            return;
        }
        if (!telefonoValido) {
            this.showMessage('Introduce un teléfono válido (ej: 04121234567).', 'error', 'registration');
            return;
        }
        if (!sexoValido) {
            this.showMessage('Selecciona el sexo.', 'error', 'registration');
            return;
        }
        if (!edadValida) {
            this.showMessage('Edad inválida. Debe estar entre 16 y 120 años.', 'error', 'registration');
            return;
        }
        // Verificar si la cédula ya existe
        if (this.votes.some(vote => vote.cedula === cedula)) {
            this.showMessage('Error: Esta cédula ya está registrada.', 'error', 'registration');
            return;
        }
        this.setLoadingState('registration', true);
        try {
            const newVote = {
                id: Date.now(),
                name,
                cedula,
                telefono,
            sexo,
                edad,
                ubch,
                community,
                timestamp: new Date().toISOString(),
                registeredBy: this.userId,
                preRegistered: true,
                voted: false
            };
            this.votes.push(newVote);
            await this.saveData();
            this.showMessage('¡Persona registrada con éxito!', 'success', 'registration');
            await this.generateThankYouMessage(name, ubch, community);
            form.reset();
            document.getElementById('community').disabled = true;
            setTimeout(() => {
                document.getElementById('thank-you-message').style.display = 'none';
            }, 10000);
        } catch (error) {
            console.error('Error al registrar:', error);
            this.showMessage('Error al registrar persona. Inténtalo de nuevo.', 'error', 'registration');
        } finally {
            this.setLoadingState('registration', false);
        }
    }

    async generateThankYouMessage(name, ubch, community) {
        const messageDiv = document.getElementById('thank-you-message');
        messageDiv.innerHTML = '<p>Generando mensaje...</p>';
        messageDiv.style.display = 'block';

        try {
            // Simular generación de mensaje (aquí podrías integrar con una API real)
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

    renderCheckInPage() {
        // La página ya está renderizada en el HTML
    }

    async handleCheckIn() {
        const cedula = document.getElementById('cedula-search').value.trim();
        
        if (!cedula) {
            this.showMessage('Por favor, ingresa un número de cédula para buscar.', 'error', 'check-in');
            return;
        }

        this.setLoadingState('check-in', true);

        try {
            const results = this.votes.filter(vote => vote.cedula === cedula);
            
            if (results.length === 0) {
                this.showMessage(`No se encontró a ninguna persona con la cédula ${cedula}.`, 'error', 'check-in');
                return;
            }

            const notVoted = results.filter(vote => !vote.voted);
            
            if (notVoted.length === 0) {
                this.showMessage(`La persona con cédula ${cedula} ya ha votado.`, 'error', 'check-in');
                return;
            }

            this.renderSearchResults(notVoted);

        } catch (error) {
            console.error('Error al buscar:', error);
            this.showMessage('Error al buscar persona. Inténtalo de nuevo.', 'error', 'check-in');
        } finally {
            this.setLoadingState('check-in', false);
        }
    }

    renderSearchResults(results) {
        const container = document.getElementById('search-results');
        container.innerHTML = '';
        results.forEach(person => {
            const sexoLabel = person.sexo === 'M' ? 'Masculino' : (person.sexo === 'F' ? 'Femenino' : '');
            container.innerHTML += `
                <div class="search-result-item">
                <div class="search-result-info">
                    <h4>${person.name}</h4>
                    <p>Cédula: ${person.cedula}</p>
                        <p>Sexo: ${sexoLabel}</p>
                        <p>Edad: ${person.edad || ''}</p>
                    <p>UBCH: ${person.ubch}</p>
                        <p>Comunidad: ${person.community}</p>
                </div>
                    <button class="btn btn-success" onclick="votingSystem.confirmVote(${person.id})">
                        Confirmar Voto
                </button>
                </div>
            `;
        });
    }

    async confirmVote(personId) {
        try {
            const person = this.votes.find(v => v.id === personId);
            if (!person) return;

            person.voted = true;
            person.voteTimestamp = new Date().toISOString();
            
            await this.saveData();
            
            this.showMessage('¡Voto confirmado con éxito!', 'success', 'check-in');
            document.getElementById('cedula-search').value = '';
            document.getElementById('search-results').innerHTML = '';
            
        } catch (error) {
            console.error('Error al confirmar voto:', error);
            this.showMessage('Error al confirmar el voto. Inténtalo de nuevo.', 'error', 'check-in');
        }
    }

    renderListPage() {
            this.renderVotesTable();
    }

    renderVotesTable() {
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';
        this.votes.forEach(vote => {
            const sexoLabel = vote.sexo === 'M' ? 'Masculino' : (vote.sexo === 'F' ? 'Femenino' : '');
            tbody.innerHTML += `
                <tr>
                <td>${vote.name}</td>
                <td>${vote.cedula}</td>
                <td>${vote.ubch}</td>
                <td>${vote.community}</td>
                    <td>${sexoLabel}</td>
                    <td>${vote.edad || ''}</td>
                <td>
                    <span class="vote-status ${vote.voted ? 'voted' : 'not-voted'}">
                        ${vote.voted ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>
                        <button class="btn btn-danger" onclick="votingSystem.deleteVote(${vote.id})">
                            Eliminar
                    </button>
                </td>
                </tr>
            `;
        });
    }

    handleFilterChange(filter) {
        // Actualizar botones de filtro
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Filtrar tabla
        const tbody = document.querySelector('#registros-table tbody');
        tbody.innerHTML = '';

        let filteredVotes = this.votes;
        
        if (filter === 'voted') {
            filteredVotes = this.votes.filter(vote => vote.voted);
        } else if (filter === 'not-voted') {
            filteredVotes = this.votes.filter(vote => !vote.voted);
        }

        filteredVotes.forEach(vote => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${vote.name}</td>
                <td>${vote.cedula}</td>
                <td>${vote.ubch}</td>
                <td>${vote.community}</td>
                <td>
                    <span class="vote-status ${vote.voted ? 'voted' : 'not-voted'}">
                        ${vote.voted ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-danger" onclick="votingSystem.deleteVote(${vote.id})">
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

    closeDeleteModal() {
        document.getElementById('delete-modal').style.display = 'none';
        this.voteToDelete = null;
    }

    async confirmDelete() {
        if (!this.voteToDelete) return;

        try {
            this.votes = this.votes.filter(vote => vote.id !== this.voteToDelete);
            await this.saveData();
            this.renderVotesTable();
            this.closeDeleteModal();
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
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

        this.renderStatsList('ubch-stats', ubchStats, 'ubch');
        this.renderStatsList('community-stats', communityStats, 'community');
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

    enterProjectionMode() {
        document.getElementById('projection-view').style.display = 'block';
        this.updateProjection();
        
        // Actualizar cada 5 segundos
        this.projectionInterval = setInterval(() => {
            this.updateProjection();
        }, 5000);
    }

    exitProjectionMode() {
        document.getElementById('projection-view').style.display = 'none';
        if (this.projectionInterval) {
            clearInterval(this.projectionInterval);
        }
    }

    updateProjection() {
        const totalRegistered = this.votes.length;
        const totalVoted = this.votes.filter(vote => vote.voted).length;
        const percentage = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;

        document.getElementById('projection-votes').textContent = totalVoted;
        document.getElementById('projection-progress-fill').style.width = `${percentage}%`;
        document.getElementById('projection-progress-fill').textContent = `${percentage.toFixed(1)}%`;
        document.getElementById('projection-text').textContent = `${totalVoted} de ${totalRegistered}`;

        // Actualizar lista de UBCH
        const votedVotes = this.votes.filter(vote => vote.voted);
        const ubchStats = {};
        votedVotes.forEach(vote => {
            ubchStats[vote.ubch] = (ubchStats[vote.ubch] || 0) + 1;
        });

        const sortedUBCH = Object.entries(ubchStats).sort(([,a], [,b]) => b - a);
        const maxVotes = sortedUBCH[0] ? sortedUBCH[0][1] : 1;

        const container = document.getElementById('projection-ubch-list');
        container.innerHTML = '';

        sortedUBCH.forEach(([ubch, count], index) => {
            const percentage = (count / maxVotes) * 100;
            const div = document.createElement('div');
            div.className = 'projection-item';
            div.innerHTML = `
                <div class="projection-item-header">
                    <span class="projection-item-name">${index + 1}. ${ubch}</span>
                    <span class="projection-item-count">${count}</span>
                </div>
                <div class="projection-item-progress">
                    <div class="projection-item-progress-fill" style="width: ${percentage}%"></div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    loadPdfLibraries() {
        // Verificar si las librerías ya están cargadas
        if (window.jspdf) {
            this.pdfLibrariesReady = true;
            return;
        }

        // Las librerías se cargan desde CDN en el HTML
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
        if (!this.pdfLibrariesReady) {
            alert('Las librerías para PDF no están listas.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const tableColumn = ["Nombre", "Cédula", "Teléfono", "Sexo", "Edad", "UBCH", "Comunidad", "Votó"];
        const tableRows = [];
        this.votes.forEach(vote => {
            const sexoLabel = vote.sexo === 'M' ? 'Masculino' : (vote.sexo === 'F' ? 'Femenino' : '');
            tableRows.push([
                vote.name,
                vote.cedula,
                vote.telefono,
                sexoLabel,
                vote.edad || '',
                vote.ubch,
                vote.community,
                vote.voted ? "Sí" : "No"
            ]);
        });
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            headStyles: { fillColor: [52, 152, 219] },
        });
        doc.text("Listado de Personas Registradas", 14, 15);
        doc.save("listado_registros.pdf");
    }

    exportToCSV() {
        const headers = ["Nombre", "Cédula", "Teléfono", "Sexo", "Edad", "UBCH", "Comunidad", "Votó"];
        const csvRows = [
            headers.join(','),
            ...this.votes.map(vote => [
                `"${vote.name}"`,
                `"${vote.cedula}"`,
                `"${vote.telefono}"`,
                `"${vote.sexo === 'M' ? 'Masculino' : vote.sexo === 'F' ? 'Femenino' : ''}"`,
                `"${vote.edad || ''}"`,
                `"${vote.ubch}"`,
                `"${vote.community}"`,
                `"${vote.voted ? 'Sí' : 'No'}"`
            ].join(','))
        ];
        const csvString = csvRows.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "listado_registros.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportStatsToPDF() {
        if (!this.pdfLibrariesReady) {
            alert('Las librerías para PDF no están listas.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Reporte de Estadísticas de Votación", 14, 22);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString('es-VE')}`, 14, 30);
        
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
        
        doc.setFontSize(14);
        doc.text("Votos por UBCH", 14, 40);
        doc.autoTable({ 
            startY: 45, 
            head: [['UBCH', 'Votos']], 
            body: Object.entries(ubchStats), 
            headStyles: { fillColor: [52, 152, 219] } 
        });
        
        doc.text("Votos por Comunidad", 14, doc.lastAutoTable.finalY + 15);
        doc.autoTable({ 
            startY: doc.lastAutoTable.finalY + 20, 
            head: [['Comunidad', 'Votos']], 
            body: Object.entries(communityStats), 
            headStyles: { fillColor: [52, 152, 219] } 
        });

        doc.save('reporte_votacion.pdf');
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
}

// Inicializar el sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.votingSystem = new VotingSystem();
    // Sincronización en tiempo real del listado
    window.addEventListener('votesDataUpdated', (event) => {
        if (window.votingSystem) {
            window.votingSystem.votes = event.detail.data;
            if (window.votingSystem.currentPage === 'listado') {
                window.votingSystem.renderVotesTable();
            }
        }
    });
});

// Sistema de roles y control de acceso
const userRoles = {
    ADMIN: 'admin',
    REGISTRADOR: 'registrador',
    CONFIRMADOR: 'confirmador',
    VISUALIZADOR: 'visualizador'
};

function checkPermission(action, userRole) {
    const permissions = {
        'register': ['admin', 'registrador'],
        'confirm_vote': ['admin', 'confirmador'],
        'view_stats': ['admin', 'visualizador'],
        'export_data': ['admin']
    };
    return permissions[action]?.includes(userRole) || false;
}

function logActivity(user, action, details) {
    const log = {
        timestamp: new Date().toISOString(),
        user: user,
        action: action,
        details: details
    };
    console.log('AUDIT:', log);
    // Guardar en localStorage para referencia rápida
    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    logs.push(log);
    localStorage.setItem('activityLogs', JSON.stringify(logs));
}

// Ejemplo: ocultar botones de exportación si el usuario no es admin
// (puedes adaptar esto según cómo determines el rol del usuario)
document.addEventListener('DOMContentLoaded', () => {
    const userRole = window.currentUserRole || 'registrador'; // Cambia esto según tu lógica
    if (!checkPermission('export_data', userRole)) {
        const exportBtns = document.querySelectorAll('#export-pdf-btn, #export-csv-btn');
        exportBtns.forEach(btn => btn.style.display = 'none');
    }
});

// Construir el mapeo UBCH-Comunidad cada vez que se actualicen los datos
window.addEventListener('ubchDataUpdated', function(e) {
    window.UBCH_DATA = e.detail.data;
    if (window.COMMUNITIES_DATA) {
        const map = {};
        window.UBCH_DATA.forEach(ubch => {
            map[ubch.name] = window.COMMUNITIES_DATA
                .filter(c => c.ubchId === ubch.id)
                .map(c => c.name);
        });
        window.ubchToCommunityMap = map;
    }
});
window.addEventListener('communitiesDataUpdated', function(e) {
    window.COMMUNITIES_DATA = e.detail.data;
    if (window.UBCH_DATA) {
        const map = {};
        window.UBCH_DATA.forEach(ubch => {
            map[ubch.name] = window.COMMUNITIES_DATA
                .filter(c => c.ubchId === ubch.id)
                .map(c => c.name);
        });
        window.ubchToCommunityMap = map;
    }
});