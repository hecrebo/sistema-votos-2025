/**
 * Sistema de Reparación de Páginas - Sistema de Votos 2025
 * Repara páginas que no se encuentran y asegura que todas las funciones estén disponibles
 */

class PageRepair {
    constructor() {
        this.pages = {
            registration: 'registration-page',
            checkIn: 'check-in-page',
            listado: 'listado-page',
            dashboard: 'dashboard-page',
            statistics: 'statistics-page'
        };
        
        this.functions = {
            register: 'handleRegistration',
            confirmVote: 'handleCheckIn',
            listVotes: 'renderVotesTable',
            showTotals: 'renderDashboardPage',
            showStatistics: 'renderStatisticsPage'
        };
        
        this.init();
    }

    init() {
        console.log('🔧 Inicializando reparación de páginas...');
        
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.repairAllPages();
            });
        } else {
            this.repairAllPages();
        }
    }

    repairAllPages() {
        console.log('🔧 Reparando todas las páginas...');
        
        // Verificar y reparar cada página
        this.checkAndRepairPage('registration', 'Registro');
        this.checkAndRepairPage('checkIn', 'Confirmar Voto');
        this.checkAndRepairPage('listado', 'Listado');
        this.checkAndRepairPage('dashboard', 'Totales');
        this.checkAndRepairPage('statistics', 'Estadísticas');
        
        // Verificar y reparar funciones
        this.checkAndRepairFunctions();
        
        // Configurar navegación
        this.setupNavigation();
        
        console.log('✅ Reparación de páginas completada');
    }

    checkAndRepairPage(pageKey, pageName) {
        const pageId = this.pages[pageKey];
        const pageElement = document.getElementById(pageId);
        
        if (!pageElement) {
            console.warn(`⚠️ Página ${pageName} no encontrada, creando...`);
            this.createPage(pageKey, pageName);
        } else {
            console.log(`✅ Página ${pageName} encontrada`);
            this.ensurePageContent(pageKey, pageElement);
        }
    }

    createPage(pageKey, pageName) {
        const pageId = this.pages[pageKey];
        const pageElement = document.createElement('div');
        pageElement.id = pageId;
        pageElement.className = 'page';
        
        // Crear contenido básico para la página
        pageElement.innerHTML = this.getPageContent(pageKey, pageName);
        
        // Agregar al contenedor principal
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(pageElement);
            console.log(`✅ Página ${pageName} creada`);
        } else {
            console.error('❌ No se encontró el contenedor principal');
        }
    }

    getPageContent(pageKey, pageName) {
        const baseContent = `
            <div class="page-container">
                <h2 class="page-title">${pageName}</h2>
                <div class="page-content">
                    <p>Página ${pageName} en construcción...</p>
                    <button class="btn btn-primary" onclick="loadPageContent('${pageKey}')">
                        Cargar Contenido Completo
                    </button>
                </div>
            </div>
        `;
        
        switch (pageKey) {
            case 'registration':
                return `
                    <div class="page-container">
                        <h2 class="page-title">Registro de Persona</h2>
                        <div class="page-content">
                            <form id="registration-form" class="registration-form">
                                <div class="form-group">
                                    <label for="name">Nombre</label>
                                    <input type="text" id="name" name="name" required>
                                </div>
                                <div class="form-group">
                                    <label for="cedula">Cédula</label>
                                    <input type="text" id="cedula" name="cedula" required>
                                </div>
                                <button type="submit" class="btn btn-primary">Registrar</button>
                            </form>
                        </div>
                    </div>
                `;
                
            case 'checkIn':
                return `
                    <div class="page-container">
                        <h2 class="page-title">Confirmar Voto</h2>
                        <div class="page-content">
                            <form id="check-in-form" class="check-in-form">
                                <div class="search-container">
                                    <input type="text" id="cedula-search" placeholder="Buscar por Cédula" required>
                                    <button type="submit" class="btn btn-primary">Buscar</button>
                                </div>
                            </form>
                            <div id="search-results" class="search-results"></div>
                        </div>
                    </div>
                `;
                
            case 'listado':
                return `
                    <div class="page-container">
                        <h2 class="page-title">Listado de Personas Registradas</h2>
                        <div class="page-content">
                            <div class="filter-container">
                                <input type="text" id="list-search" placeholder="Buscar..." class="search-input">
                            </div>
                            <div id="votes-table-container">
                                <table id="votes-table" class="votes-table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Cédula</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="votes-table-body"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
                
            case 'dashboard':
                return `
                    <div class="page-container">
                        <h2 class="page-title">Totales</h2>
                        <div class="page-content">
                            <div class="dashboard-stats">
                                <div class="stat-card">
                                    <h3>Total Registrados</h3>
                                    <p id="total-registered">0</p>
                                </div>
                                <div class="stat-card">
                                    <h3>Votos Confirmados</h3>
                                    <p id="total-voted">0</p>
                                </div>
                                <div class="stat-card">
                                    <h3>Pendientes</h3>
                                    <p id="total-pending">0</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
            case 'statistics':
                return `
                    <div class="page-container">
                        <h2 class="page-title">Estadísticas</h2>
                        <div class="page-content">
                            <div class="stats-container">
                                <div class="stat-section">
                                    <h3>Estadísticas Generales</h3>
                                    <div id="general-stats"></div>
                                </div>
                                <div class="stat-section">
                                    <h3>Estadísticas por CV</h3>
                                    <div id="ubch-stats"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
            default:
                return baseContent;
        }
    }

    ensurePageContent(pageKey, pageElement) {
        // Verificar que la página tenga el contenido mínimo necesario
        const hasContent = pageElement.querySelector('.page-container') || 
                          pageElement.querySelector('.page-content') ||
                          pageElement.querySelector('form') ||
                          pageElement.querySelector('table');
        
        if (!hasContent) {
            console.warn(`⚠️ Página ${pageKey} no tiene contenido, agregando...`);
            pageElement.innerHTML = this.getPageContent(pageKey, pageKey.charAt(0).toUpperCase() + pageKey.slice(1));
        }
    }

    checkAndRepairFunctions() {
        console.log('🔧 Verificando funciones del sistema...');
        
        // Verificar función de registro
        if (typeof window.handleRegistration !== 'function') {
            console.warn('⚠️ Función handleRegistration no encontrada, creando...');
            this.createRegistrationFunction();
        }
        
        // Verificar función de confirmación de voto
        if (typeof window.handleCheckIn !== 'function') {
            console.warn('⚠️ Función handleCheckIn no encontrada, creando...');
            this.createCheckInFunction();
        }
        
        // Verificar función de listado
        if (typeof window.renderVotesTable !== 'function') {
            console.warn('⚠️ Función renderVotesTable no encontrada, creando...');
            this.createListFunction();
        }
        
        // Verificar función de totales
        if (typeof window.renderDashboardPage !== 'function') {
            console.warn('⚠️ Función renderDashboardPage no encontrada, creando...');
            this.createTotalsFunction();
        }
        
        // Verificar función de estadísticas
        if (typeof window.renderStatisticsPage !== 'function') {
            console.warn('⚠️ Función renderStatisticsPage no encontrada, creando...');
            this.createStatisticsFunction();
        }
    }

    createRegistrationFunction() {
        window.handleRegistration = async function(event) {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            const voteData = {
                name: formData.get('name'),
                cedula: formData.get('cedula'),
                registeredAt: new Date().toISOString(),
                registeredBy: JSON.parse(localStorage.getItem('currentUser') || '{}').username || 'unknown'
            };
            
            try {
                if (window.firebaseDB && window.firebaseDB.votesCollection) {
                    await window.firebaseDB.votesCollection.add(voteData);
                    console.log('✅ Voto registrado en Firebase');
                } else {
                    // Guardar localmente
                    const localVotes = JSON.parse(localStorage.getItem('localVotes') || '[]');
                    localVotes.push({ ...voteData, id: 'local_' + Date.now() });
                    localStorage.setItem('localVotes', JSON.stringify(localVotes));
                    console.log('✅ Voto guardado localmente');
                }
                
                alert('✅ Persona registrada exitosamente');
                event.target.reset();
                
            } catch (error) {
                console.error('❌ Error registrando voto:', error);
                alert('❌ Error al registrar: ' + error.message);
            }
        };
        
        console.log('✅ Función handleRegistration creada');
    }

    createCheckInFunction() {
        window.handleCheckIn = async function(event) {
            event.preventDefault();
            
            const cedula = document.getElementById('cedula-search').value;
            const resultsContainer = document.getElementById('search-results');
            
            try {
                let votes = [];
                
                // Buscar en Firebase
                if (window.firebaseDB && window.firebaseDB.votesCollection) {
                    const snapshot = await window.firebaseDB.votesCollection
                        .where('cedula', '==', cedula)
                        .get();
                    votes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }
                
                // Buscar localmente si no hay resultados
                if (votes.length === 0) {
                    const localVotes = JSON.parse(localStorage.getItem('localVotes') || '[]');
                    votes = localVotes.filter(vote => vote.cedula === cedula);
                }
                
                if (votes.length > 0) {
                    const vote = votes[0];
                    resultsContainer.innerHTML = `
                        <div class="search-result">
                            <h3>Resultado encontrado:</h3>
                            <p><strong>Nombre:</strong> ${vote.name}</p>
                            <p><strong>Cédula:</strong> ${vote.cedula}</p>
                            <p><strong>Estado:</strong> ${vote.voted ? '✅ Votó' : '⏳ Pendiente'}</p>
                            <button class="btn btn-success" onclick="confirmVote('${vote.id}')">
                                ${vote.voted ? 'Ya Votó' : 'Confirmar Voto'}
                            </button>
                        </div>
                    `;
                } else {
                    resultsContainer.innerHTML = '<p>No se encontró ninguna persona con esa cédula.</p>';
                }
                
            } catch (error) {
                console.error('❌ Error buscando voto:', error);
                resultsContainer.innerHTML = '<p>Error al buscar: ' + error.message + '</p>';
            }
        };
        
        console.log('✅ Función handleCheckIn creada');
    }

    createListFunction() {
        window.renderVotesTable = function() {
            const tableBody = document.getElementById('votes-table-body');
            if (!tableBody) return;
            
            let votes = [];
            
            // Obtener votos de Firebase
            if (window.firebaseDB && window.firebaseDB.votesCollection) {
                window.firebaseDB.votesCollection.get().then(snapshot => {
                    votes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    renderVotes(votes);
                });
            } else {
                // Obtener votos locales
                votes = JSON.parse(localStorage.getItem('localVotes') || '[]');
                renderVotes(votes);
            }
            
            function renderVotes(votes) {
                tableBody.innerHTML = votes.map(vote => `
                    <tr>
                        <td>${vote.name}</td>
                        <td>${vote.cedula}</td>
                        <td>${vote.voted ? '✅ Votó' : '⏳ Pendiente'}</td>
                        <td>
                            <button class="btn btn-small btn-success" onclick="confirmVote('${vote.id}')">
                                Confirmar
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        };
        
        console.log('✅ Función renderVotesTable creada');
    }

    createTotalsFunction() {
        window.renderDashboardPage = function() {
            let votes = [];
            
            // Obtener votos
            if (window.firebaseDB && window.firebaseDB.votesCollection) {
                window.firebaseDB.votesCollection.get().then(snapshot => {
                    votes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    updateTotals(votes);
                });
            } else {
                votes = JSON.parse(localStorage.getItem('localVotes') || '[]');
                updateTotals(votes);
            }
            
            function updateTotals(votes) {
                const totalRegistered = document.getElementById('total-registered');
                const totalVoted = document.getElementById('total-voted');
                const totalPending = document.getElementById('total-pending');
                
                if (totalRegistered) totalRegistered.textContent = votes.length;
                if (totalVoted) totalVoted.textContent = votes.filter(v => v.voted).length;
                if (totalPending) totalPending.textContent = votes.filter(v => !v.voted).length;
            }
        };
        
        console.log('✅ Función renderDashboardPage creada');
    }

    createStatisticsFunction() {
        window.renderStatisticsPage = function() {
            let votes = [];
            
            // Obtener votos
            if (window.firebaseDB && window.firebaseDB.votesCollection) {
                window.firebaseDB.votesCollection.get().then(snapshot => {
                    votes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    updateStatistics(votes);
                });
            } else {
                votes = JSON.parse(localStorage.getItem('localVotes') || '[]');
                updateStatistics(votes);
            }
            
            function updateStatistics(votes) {
                const generalStats = document.getElementById('general-stats');
                const ubchStats = document.getElementById('ubch-stats');
                
                if (generalStats) {
                    const total = votes.length;
                    const voted = votes.filter(v => v.voted).length;
                    const pending = total - voted;
                    
                    generalStats.innerHTML = `
                        <p><strong>Total registrados:</strong> ${total}</p>
                        <p><strong>Votos confirmados:</strong> ${voted}</p>
                        <p><strong>Pendientes:</strong> ${pending}</p>
                        <p><strong>Porcentaje de participación:</strong> ${total > 0 ? Math.round((voted/total)*100) : 0}%</p>
                    `;
                }
                
                if (ubchStats) {
                    const ubchCounts = {};
                    votes.forEach(vote => {
                        if (vote.ubch) {
                            ubchCounts[vote.ubch] = (ubchCounts[vote.ubch] || 0) + 1;
                        }
                    });
                    
                    ubchStats.innerHTML = Object.entries(ubchCounts)
                        .map(([ubch, count]) => `<p><strong>${ubch}:</strong> ${count}</p>`)
                        .join('');
                }
            }
        };
        
        console.log('✅ Función renderStatisticsPage creada');
    }

    setupNavigation() {
        // Configurar navegación entre páginas
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const page = button.dataset.page;
                if (page) {
                    this.switchToPage(page);
                }
            });
        });
        
        console.log('✅ Navegación configurada');
    }

    switchToPage(pageName) {
        // Ocultar todas las páginas
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Mostrar página seleccionada
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            console.log(`📄 Cambiando a página: ${pageName}`);
            
            // Cargar contenido específico de la página
            this.loadPageContent(pageName);
        }
    }

    loadPageContent(pageName) {
        switch (pageName) {
            case 'listado':
                if (typeof window.renderVotesTable === 'function') {
                    window.renderVotesTable();
                }
                break;
            case 'dashboard':
                if (typeof window.renderDashboardPage === 'function') {
                    window.renderDashboardPage();
                }
                break;
            case 'statistics':
                if (typeof window.renderStatisticsPage === 'function') {
                    window.renderStatisticsPage();
                }
                break;
        }
    }
}

// Crear instancia global
window.pageRepair = new PageRepair();

// Función global para cargar contenido de página
window.loadPageContent = (pageName) => {
    if (window.pageRepair) {
        window.pageRepair.loadPageContent(pageName);
    }
};

console.log('🔧 Sistema de reparación de páginas cargado'); 