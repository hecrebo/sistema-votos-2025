// Estadísticas Avanzadas - Sistema de Votos 2025
class EstadisticasAvanzadas {
    constructor() {
        this.votes = [];
        this.ubchData = {};
        this.communityData = {};
        this.charts = {};
        this.currentUser = this.getCurrentUser();
        this.projectionInterval = null;
        this.isRendering = false;
        this.isRenderingUBCHChart = false;
        this.isRenderingCommunityChart = false;
        this.isRenderingUBCHComparisonChart = false;
        this.isRenderingCommunityComparisonChart = false;
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando EstadisticasAvanzadas...');
        
        // Limpiar cualquier gráfico existente al inicio
        this.forceCleanAllCharts();
        
        // Establecer el día actual para el reinicio diario
        localStorage.setItem('ultimoDiaReporte', new Date().toDateString());
        
        await this.loadData();
        
        // Migrar votos existentes que tienen voteTimestamp pero no fechaConfirmacion
        this.migrarVotosExistentes();
        
        this.setupEventListeners();
        // Configurar filtros después de cargar datos
        this.setupDashboardFilters();
        this.renderAllStatistics();
        this.updateUserInfo();
        if (!this.updateInterval) {
            this.updateInterval = setInterval(async () => {
                if (this.isRendering) return;
                this.isRendering = true;
                
                // Verificar si es un nuevo día
                this.reiniciarTablaDiaria();
                
                // Guardar valores actuales de los filtros
                const selCom = document.getElementById('filtro-comunidad');
                const selCV = document.getElementById('filtro-cv');
                const comunidadSeleccionada = selCom ? selCom.value : '';
                const cvSeleccionado = selCV ? selCV.value : '';
                
                await this.loadData();
                
                // Restaurar valores de los filtros después de recargar datos
                if (selCom && comunidadSeleccionada) {
                    selCom.value = comunidadSeleccionada;
                }
                if (selCV && cvSeleccionado) {
                    selCV.value = cvSeleccionado;
                }
                
                this.renderAllStatistics();
                this.isRendering = false;
            }, 30000);
        }
        document.getElementById('projection-mode-btn').onclick = () => this.enterProjectionMode();
        document.getElementById('exit-projection-btn').onclick = () => this.exitProjectionMode();
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('projection-overlay').style.display !== 'none' && (e.key === 'Escape' || e.key === 'Esc')) {
                this.exitProjectionMode();
            }
        });
    }

    getCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userIdElement = document.getElementById('userId');
            if (userIdElement) {
                userIdElement.textContent = `${this.currentUser.username} (${this.currentUser.rol})`;
            }
        }
    }

    async loadData() {
        try {
            console.log('🔄 Cargando datos de estadísticas avanzadas...');
            
            // Cargar votos desde Firebase
            const db = firebase.firestore();
            const votesSnapshot = await db.collection('votes').get();
            this.votes = votesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('📊 Votos cargados:', this.votes.length);
            
            // --- CARGAR CONFIGURACIÓN UBCH DESDE FIREBASE (igual que script-firebase.js) ---
            console.log('🔧 Cargando configuración UBCH desde Firebase...');
            
            // Intentar cargar desde ubchCollection/config (como en script-firebase.js)
            let ubchConfig = null;
            try {
                const configDoc = await db.collection('ubchCollection').doc('config').get();
                if (configDoc.exists && configDoc.data().mapping) {
                    ubchConfig = configDoc.data().mapping;
                    console.log('✅ Configuración UBCH cargada desde Firebase (ubchCollection/config):', Object.keys(ubchConfig).length, 'CV');
                }
            } catch (err) {
                console.error('❌ Error cargando configuración desde ubchCollection/config:', err);
            }
            
            // Si no se pudo cargar, intentar desde la variable global
            if (!ubchConfig && window.ubchToCommunityMap && typeof window.ubchToCommunityMap === 'object') {
                ubchConfig = window.ubchToCommunityMap;
                console.log('✅ Configuración UBCH cargada desde variable global:', Object.keys(ubchConfig).length, 'CV');
            }
            
            // Si aún no hay configuración, usar datos por defecto
            if (!ubchConfig) {
                console.log('⚠️ No se pudo cargar configuración UBCH, usando datos por defecto...');
                // Aquí podrías agregar una configuración por defecto si es necesario
                ubchConfig = {};
            }
            
            this.ubchData = ubchConfig;
            
            // Contar comunidades totales (igual que en script-firebase.js)
            const todasComunidades = new Set();
            if (this.ubchData && typeof this.ubchData === 'object') {
                Object.values(this.ubchData).forEach(comunidades => {
                    if (Array.isArray(comunidades)) {
                        comunidades.forEach(comunidad => todasComunidades.add(comunidad));
                    }
                });
            }
            
            console.log('🔍 DEBUG - CV disponibles:', Object.keys(this.ubchData));
            console.log('🔍 DEBUG - Comunidades totales:', todasComunidades.size);
            console.log('🔍 DEBUG - Comunidades disponibles:', Array.from(todasComunidades).sort());
            
            this.populateSelectors();
            console.log('✅ Datos cargados:', this.votes.length, 'votos,', Object.keys(this.ubchData).length, 'centros de votación,', todasComunidades.size, 'comunidades');
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.loadLocalData();
        }
    }

    loadLocalData() {
        console.log('📱 Cargando datos locales...');
        const localVotes = localStorage.getItem('votes');
        if (localVotes) {
            this.votes = JSON.parse(localVotes);
        }
        
        // Eliminar la carga local de ubch_config en loadLocalData()
        // const localUBCH = localStorage.getItem('ubch_config');
        // if (localUBCH) {
        //     this.ubchData = JSON.parse(localUBCH);
        // }
        
        console.log('✅ Datos locales cargados:', this.votes.length, 'votos');
    }

    setupEventListeners() {
        // Tabs
        document.querySelectorAll('.stats-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        // Botones de exportación
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.target.closest('.export-btn').classList.contains('pdf') ? 'pdf' : 'csv';
                const tab = this.getCurrentTab();
                this.exportData(tab, action);
            });
        });
    }

    getCurrentTab() {
        const activeTab = document.querySelector('.stats-tab.active');
        return activeTab ? activeTab.dataset.tab : 'general';
    }

    switchTab(tabName) {
        // Remover active de todos los tabs
        document.querySelectorAll('.stats-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.stats-content').forEach(content => {
            content.classList.remove('active');
        });

        // Activar tab seleccionado
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-content`).classList.add('active');

        // Renderizar estadísticas específicas
        if (tabName === 'ubch') {
            this.renderUBCHStatistics();
        } else if (tabName === 'community') {
            this.renderCommunityStatistics();
        }
    }

    renderAllStatistics() {
        try {
            // Reiniciar completamente Chart.js antes de renderizar
            this.resetChartJS();
            
        this.renderGeneralStatistics();
        this.renderDashboardAdvanced();
        this.renderReportesHora();
        } catch (error) {
            console.error('❌ Error en renderAllStatistics:', error);
        }
    }
    
    // Método para reiniciar completamente Chart.js
    resetChartJS() {
        try {
            // Limpiar todos los gráficos existentes
            this.forceCleanAllCharts();
            
            // Limpiar el registro interno de Chart.js
            this.clearChartRegistry();
            
            // Limpiar todos los canvas
            const canvases = document.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
            
            // Resetear nuestro objeto de gráficos
            this.charts = {};
            
            console.log('✅ Chart.js completamente reiniciado');
        } catch (error) {
            console.error('❌ Error reiniciando Chart.js:', error);
        }
    }

    renderGeneralStatistics() {
        console.log('📊 Renderizando estadísticas generales...');
        
        const totalRegistered = this.votes.length;
        const totalVoted = this.votes.filter(v => v.voted).length;
        const participationRate = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;
        const totalUBCH = Object.keys(this.ubchData).length;
        // Calcular total de comunidades únicas
        const totalCommunities = new Set(this.votes.map(v => v.community)).size;

        // Actualizar tarjetas resumen
        document.getElementById('total-registered-general').textContent = totalRegistered.toLocaleString();
        document.getElementById('total-voted-general').textContent = totalVoted.toLocaleString();
        document.getElementById('participation-rate-general').textContent = `${participationRate.toFixed(1)}%`;
        document.getElementById('total-ubch-general').textContent = totalUBCH;
        document.getElementById('total-communities-general').textContent = totalCommunities;

        // Renderizar listas y gráficos principales
        this.renderAllUBCH();
        this.renderAllCommunities();
        this.renderUBCHChart();
        this.renderCommunityChart();
    }

    renderDashboardAdvanced() {
        const filteredVotes = this.getFilteredVotes();
        // 1. KPIs principales
        const totalRegistrados = filteredVotes.length;
        const totalVotos = filteredVotes.filter(v => v.voted).length;
        const porcentaje = totalRegistrados ? ((totalVotos / totalRegistrados) * 100).toFixed(1) : 0;
        document.getElementById('dashboard-total-registrados').textContent = totalRegistrados.toLocaleString();
        document.getElementById('dashboard-total-votos').textContent = totalVotos.toLocaleString();
        document.getElementById('dashboard-porcentaje-participacion').textContent = porcentaje + '%';

        // 2. Registros por mes (igual que antes, pero solo con filteredVotes)
        const registrosPorMes = Array(12).fill(0);
        filteredVotes.forEach(r => {
            if (r.registeredAt) {
                const mes = new Date(r.registeredAt).getMonth();
                registrosPorMes[mes]++;
            }
        });
        this.renderBarChart('dashboard-registros-mes-chart', {
            labels: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
            data: registrosPorMes,
            label: 'Registros',
            color: '#667eea'
        });

        // 3. Votos por comunidad
        const votosPorComunidad = {};
        filteredVotes.forEach(r => {
            if (!votosPorComunidad[r.community]) votosPorComunidad[r.community] = 0;
            if (r.voted) votosPorComunidad[r.community]++;
        });
        const comunidades = Object.keys(votosPorComunidad);
        const votosCom = comunidades.map(c => votosPorComunidad[c]);
        this.renderBarChart('dashboard-votos-comunidad-chart', {
            labels: comunidades,
            data: votosCom,
            label: 'Votos',
            color: '#43e97b'
        });

        // 4. Crecimiento de registros (acumulado del mes en curso)
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const registrosPorDia = Array(daysInMonth).fill(0);
        filteredVotes.forEach(r => {
            if (r.registeredAt) {
                const fecha = new Date(r.registeredAt);
                if (fecha.getFullYear() === year && fecha.getMonth() === month) {
                    const dia = fecha.getDate() - 1;
                    registrosPorDia[dia]++;
                }
            }
        });
        let acumuladoMes = 0;
        const crecimientoMes = registrosPorDia.map(v => (acumuladoMes += v));
        this.renderLineChart('dashboard-crecimiento-chart', {
            labels: Array.from({length: daysInMonth}, (_,i) => (i+1).toString()),
            data: crecimientoMes,
            label: 'Acumulado mes',
            color: '#764ba2'
        });

        // 5. Ranking de comunidades
        const ranking = comunidades.map(c => [c, votosPorComunidad[c]])
            .sort((a,b) => b[1]-a[1]).slice(0,5);
        const rankingList = document.getElementById('dashboard-ranking-comunidades');
        rankingList.innerHTML = ranking.map(([com, count]) => `<li>${com}: ${count} votos</li>`).join('');

        // 6. Distribución por sexo
        const sexo = { M: 0, F: 0 };
        filteredVotes.forEach(r => { if (r.sexo) sexo[r.sexo] = (sexo[r.sexo]||0)+1; });
        this.renderPieChart('dashboard-sexo-chart', {
            labels: ['Masculino','Femenino'],
            data: [sexo.M, sexo.F],
            colors: ['#36a2eb','#ff6384']
        });

        // 7. Distribución por edad
        const edades = [0,0,0,0,0];
        filteredVotes.forEach(r => {
            if (!r.edad) return;
            if (r.edad < 26) edades[0]++;
            else if (r.edad < 36) edades[1]++;
            else if (r.edad < 46) edades[2]++;
            else if (r.edad < 56) edades[3]++;
            else edades[4]++;
        });
        this.renderBarChart('dashboard-edad-chart', {
            labels: ['16-25','26-35','36-45','46-55','56+'],
            data: edades,
            label: 'Personas',
            color: '#ffc107'
        });

        // 8. Actividad reciente
        const recientes = filteredVotes
            .sort((a,b) => new Date(b.registeredAt)-new Date(a.registeredAt))
            .slice(0,5);
        document.getElementById('dashboard-actividad-reciente').innerHTML = recientes
            .map(r => `<li>${r.name} (${r.cedula}) - ${r.registeredAt ? new Date(r.registeredAt).toLocaleString('es-VE') : ''}</li>`)
            .join('');

        // 9. Flujo de confirmación de votos por hora (6am-10pm)
        const horas = Array(17).fill(0); // 6am (0) a 22pm (16)
        filteredVotes.forEach(r => {
            if (r.voted && r.registeredAt) {
                const fecha = new Date(r.registeredAt);
                const h = fecha.getHours();
                if (h >= 6 && h <= 22) horas[h-6]++;
            }
        });
        this.renderLineChart('dashboard-flujo-horas-chart', {
            labels: Array.from({length:17}, (_,i) => `${i+6}:00`),
            data: horas,
            label: 'Votos confirmados',
            color: '#28a745'
        });
    }

    renderAgeDistribution() {
        const ageRanges = [
            { min: 16, max: 25, label: '16-25 años' },
            { min: 26, max: 35, label: '26-35 años' },
            { min: 36, max: 45, label: '36-45 años' },
            { min: 46, max: 55, label: '46-55 años' },
            { min: 56, max: 65, label: '56-65 años' },
            { min: 66, max: null, label: '66+ años' }
        ];

        const ageStats = {};
        ageRanges.forEach(range => {
            ageStats[range.label] = 0;
        });

        this.votes.filter(v => v.voted).forEach(vote => {
            const edad = vote.edad || 0;
            const range = ageRanges.find(r => 
                edad >= r.min && (r.max === null || edad <= r.max)
            );
            if (range) {
                ageStats[range.label]++;
            }
        });

        const container = document.getElementById('age-distribution');
        container.innerHTML = '';
        
        Object.entries(ageStats).forEach(([label, count]) => {
            const div = document.createElement('div');
            div.className = 'stats-item';
            div.innerHTML = `
                <span class="stats-item-name">${label}</span>
                <span class="stats-item-count">${count.toLocaleString()}</span>
            `;
            container.appendChild(div);
        });
    }

    renderAllUBCH() {
        // Mostrar todos los CV aunque tengan cero votos
        const ubchStats = {};
        this.votes.filter(v => v.voted).forEach(vote => {
            ubchStats[vote.ubch] = (ubchStats[vote.ubch] || 0) + 1;
        });
        // Usar this.ubchData para obtener todos los nombres de CV
        const allUBCH = Object.keys(this.ubchData);
        // Si no hay configuración, usar los que aparecen en votos
        const uniqueUBCH = new Set([...allUBCH, ...Object.keys(ubchStats)]);
        const sortedUBCH = Array.from(uniqueUBCH).sort((a, b) => {
            // Ordenar por cantidad de votos descendente
            return (ubchStats[b] || 0) - (ubchStats[a] || 0);
        });
        const container = document.getElementById('all-ubch');
        container.innerHTML = '';
        let pos = 1;
        sortedUBCH.forEach(ubch => {
            const count = ubchStats[ubch] || 0;
            const div = document.createElement('div');
            div.className = 'stats-item';
            div.innerHTML = `
                <span class="stats-item-name">${pos <= 3 ? `<b style='color:#667eea'>${pos}°</b> ` : ''}${ubch}</span>
                <span class="stats-item-count">${count.toLocaleString()}</span>
            `;
            container.appendChild(div);
            pos++;
        });
    }

    renderAllCommunities() {
        // Mostrar todas las comunidades aunque tengan cero votos
        const communityStats = {};
        this.votes.filter(v => v.voted).forEach(vote => {
            communityStats[vote.community] = (communityStats[vote.community] || 0) + 1;
        });
        // Obtener lista completa de comunidades
        let allCommunities = [];
        if (this.ubchData) {
            // NUEVO: Recorrer el mapping actual (cada valor es un array de comunidades)
            Object.values(this.ubchData).forEach(arr => {
                if (Array.isArray(arr)) allCommunities.push(...arr);
            });
        }
        // Agregar las que aparecen en votos
        allCommunities.push(...Object.keys(communityStats));
        // Quitar duplicados
        allCommunities = Array.from(new Set(allCommunities));
        // Ordenar por cantidad de votos descendente
        const sortedCommunities = allCommunities.sort((a, b) => {
            return (communityStats[b] || 0) - (communityStats[a] || 0);
        });
        const container = document.getElementById('all-communities');
        container.innerHTML = '';
        let pos = 1;
        sortedCommunities.forEach(community => {
            const count = communityStats[community] || 0;
            const div = document.createElement('div');
            div.className = 'stats-item';
            div.innerHTML = `
                <span class="stats-item-name">${pos <= 3 ? `<b style='color:#764ba2'>${pos}°</b> ` : ''}${community}</span>
                <span class="stats-item-count">${count.toLocaleString()}</span>
            `;
            container.appendChild(div);
            pos++;
        });
    }

    renderUBCHStatistics() {
        console.log('🏛️ Renderizando estadísticas por UBCH...');
        
        const container = document.getElementById('ubch-stats-grid');
        container.innerHTML = '';

        Object.keys(this.ubchData).forEach(ubch => {
            const ubchVotes = this.votes.filter(v => v.ubch === ubch);
            const totalRegistered = ubchVotes.length;
            const totalVoted = ubchVotes.filter(v => v.voted).length;
            const participationRate = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;

            const maleVotes = ubchVotes.filter(v => v.voted && v.sexo === 'M').length;
            const femaleVotes = ubchVotes.filter(v => v.voted && v.sexo === 'F').length;

            const card = document.createElement('div');
            card.className = 'ubch-details';
            card.innerHTML = `
                <h3>🏛️ ${ubch}</h3>
                <div class="ubch-stats-grid">
                    <div class="ubch-stat-item">
                        <div class="ubch-stat-number">${totalRegistered.toLocaleString()}</div>
                        <div class="ubch-stat-label">Total Registrados</div>
                    </div>
                    <div class="ubch-stat-item">
                        <div class="ubch-stat-number">${totalVoted.toLocaleString()}</div>
                        <div class="ubch-stat-label">Total Votaron</div>
                    </div>
                    <div class="ubch-stat-item">
                        <div class="ubch-stat-number">${participationRate.toFixed(1)}%</div>
                        <div class="ubch-stat-label">Tasa de Participación</div>
                    </div>
                    <div class="ubch-stat-item">
                        <div class="ubch-stat-number">${maleVotes.toLocaleString()}</div>
                        <div class="ubch-stat-label">Masculino</div>
                    </div>
                    <div class="ubch-stat-item">
                        <div class="ubch-stat-number">${femaleVotes.toLocaleString()}</div>
                        <div class="ubch-stat-label">Femenino</div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        this.renderUBCHComparisonChart();
    }

    renderCommunityStatistics() {
        console.log('🏘️ Renderizando estadísticas por comunidad...');
        
        const container = document.getElementById('community-stats-grid');
        container.innerHTML = '';

        const communityStats = {};
        this.votes.forEach(vote => {
            if (!communityStats[vote.community]) {
                communityStats[vote.community] = {
                    total: 0,
                    voted: 0,
                    male: 0,
                    female: 0
                };
            }
            communityStats[vote.community].total++;
            if (vote.voted) {
                communityStats[vote.community].voted++;
                if (vote.sexo === 'M') {
                    communityStats[vote.community].male++;
                } else if (vote.sexo === 'F') {
                    communityStats[vote.community].female++;
                }
            }
        });

        Object.entries(communityStats).forEach(([community, stats]) => {
            const participationRate = stats.total > 0 ? (stats.voted / stats.total) * 100 : 0;

            const card = document.createElement('div');
            card.className = 'community-details';
            card.innerHTML = `
                <h3>🏘️ ${community}</h3>
                <div class="community-stats-grid">
                    <div class="community-stat-item">
                        <div class="community-stat-number">${stats.total.toLocaleString()}</div>
                        <div class="community-stat-label">Total Registrados</div>
                    </div>
                    <div class="community-stat-item">
                        <div class="community-stat-number">${stats.voted.toLocaleString()}</div>
                        <div class="community-stat-label">Total Votaron</div>
                    </div>
                    <div class="community-stat-item">
                        <div class="community-stat-number">${participationRate.toFixed(1)}%</div>
                        <div class="community-stat-label">Tasa de Participación</div>
                    </div>
                    <div class="community-stat-item">
                        <div class="community-stat-number">${stats.male.toLocaleString()}</div>
                        <div class="community-stat-label">Masculino</div>
                    </div>
                    <div class="community-stat-item">
                        <div class="community-stat-number">${stats.female.toLocaleString()}</div>
                        <div class="community-stat-label">Femenino</div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        this.renderCommunityComparisonChart();
    }

    renderUBCHChart() {
        // Evitar renderizado múltiple simultáneo
        if (this.isRenderingUBCHChart) return;
        this.isRenderingUBCHChart = true;
        
        try {
            const canvas = document.getElementById('ubch-chart');
            if (!canvas) {
                console.error('❌ Canvas ubch-chart no encontrado');
                this.isRenderingUBCHChart = false;
                return;
            }
            
            const ctx = canvas.getContext('2d');
            
        // Destruir y limpiar el gráfico anterior si existe
        if (this.charts.ubch) {
            this.charts.ubch.destroy();
            this.charts.ubch = null;
        }
            
            // Limpiar el canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
        const ubchStats = {};
        this.votes.filter(v => v.voted).forEach(vote => {
            ubchStats[vote.ubch] = (ubchStats[vote.ubch] || 0) + 1;
        });
        const sortedUBCH = Object.entries(ubchStats).sort(([,a], [,b]) => b - a);
            
            // Crear nuevo gráfico directamente
        this.charts.ubch = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedUBCH.map(([ubch]) => ubch),
                datasets: [{
                    label: 'Votos',
                    data: sortedUBCH.map(([,count]) => count),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Votos: ${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.1)', drawBorder: false },
                        ticks: { color: '#666', font: { size: 12 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#666', font: { size: 11 }, maxRotation: 45, minRotation: 45 }
                    }
                }
            }
        });
        } catch (error) {
            console.error('❌ Error renderizando gráfico UBCH:', error);
        } finally {
            // Resetear bandera de renderizado
            this.isRenderingUBCHChart = false;
        }
    }

    renderCommunityChart() {
        // Evitar renderizado múltiple simultáneo
        if (this.isRenderingCommunityChart) return;
        this.isRenderingCommunityChart = true;
        
        try {
            const canvas = document.getElementById('community-chart');
            if (!canvas) {
                console.error('❌ Canvas community-chart no encontrado');
                this.isRenderingCommunityChart = false;
                return;
            }
            
            const ctx = canvas.getContext('2d');
            
        // Destruir y limpiar el gráfico anterior si existe
        if (this.charts.community) {
            this.charts.community.destroy();
            this.charts.community = null;
        }
            
            // Limpiar el canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
        const communityStats = {};
        this.votes.filter(v => v.voted).forEach(vote => {
            communityStats[vote.community] = (communityStats[vote.community] || 0) + 1;
        });
        const sortedCommunities = Object.entries(communityStats).sort(([,a], [,b]) => b - a);
            
            // Crear nuevo gráfico directamente
        this.charts.community = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedCommunities.map(([community]) => community),
                datasets: [{
                    data: sortedCommunities.map(([,count]) => count),
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.9)',
                        'rgba(118, 75, 162, 0.9)',
                        'rgba(255, 99, 132, 0.9)',
                        'rgba(54, 162, 235, 0.9)',
                        'rgba(255, 206, 86, 0.9)',
                        'rgba(75, 192, 192, 0.9)',
                        'rgba(153, 102, 255, 0.9)',
                        'rgba(255, 159, 64, 0.9)',
                        'rgba(199, 199, 199, 0.9)',
                        'rgba(83, 102, 255, 0.9)',
                        'rgba(255, 99, 132, 0.9)',
                        'rgba(54, 162, 235, 0.9)',
                        'rgba(255, 206, 86, 0.9)',
                        'rgba(75, 192, 192, 0.9)',
                        'rgba(153, 102, 255, 0.9)'
                    ],
                    borderColor: 'white',
                    borderWidth: 3,
                    hoverBorderWidth: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#333',
                            font: { size: 12 },
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(118, 75, 162, 1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('❌ Error renderizando gráfico Community:', error);
        } finally {
            // Resetear bandera de renderizado
            this.isRenderingCommunityChart = false;
        }
    }

    renderUBCHComparisonChart() {
        // Evitar renderizado múltiple simultáneo
        if (this.isRenderingUBCHComparisonChart) return;
        this.isRenderingUBCHComparisonChart = true;
        
        const ctx = document.getElementById('ubch-comparison-chart').getContext('2d');
        
        const ubchData = [];
        Object.keys(this.ubchData).forEach(ubch => {
            const ubchVotes = this.votes.filter(v => v.ubch === ubch);
            const totalRegistered = ubchVotes.length;
            const totalVoted = ubchVotes.filter(v => v.voted).length;
            const participationRate = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;
            
            ubchData.push({
                ubch,
                registered: totalRegistered,
                voted: totalVoted,
                rate: participationRate
            });
        });

        const sortedUBCH = ubchData.sort((a, b) => b.rate - a.rate).slice(0, 12);

        if (this.charts.ubchComparison) {
            this.charts.ubchComparison.destroy();
        }

        this.charts.ubchComparison = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: sortedUBCH.map(item => item.ubch),
                datasets: [{
                    label: 'Tasa de Participación (%)',
                    data: sortedUBCH.map(item => item.rate),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `Participación: ${context.parsed.x.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
        
        // Resetear bandera de renderizado
        this.isRenderingUBCHComparisonChart = false;
    }

    renderCommunityComparisonChart() {
        // Evitar renderizado múltiple simultáneo
        if (this.isRenderingCommunityComparisonChart) return;
        this.isRenderingCommunityComparisonChart = true;
        
        const ctx = document.getElementById('community-comparison-chart').getContext('2d');
        
        const communityData = [];
        const communityStats = {};
        this.votes.forEach(vote => {
            if (!communityStats[vote.community]) {
                communityStats[vote.community] = { total: 0, voted: 0 };
            }
            communityStats[vote.community].total++;
            if (vote.voted) {
                communityStats[vote.community].voted++;
            }
        });

        Object.entries(communityStats).forEach(([community, stats]) => {
            const participationRate = stats.total > 0 ? (stats.voted / stats.total) * 100 : 0;
            communityData.push({
                community,
                registered: stats.total,
                voted: stats.voted,
                rate: participationRate
            });
        });

        const sortedCommunities = communityData.sort((a, b) => b.rate - a.rate).slice(0, 12);

        if (this.charts.communityComparison) {
            this.charts.communityComparison.destroy();
        }

        this.charts.communityComparison = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedCommunities.map(item => item.community),
                datasets: [{
                    label: 'Tasa de Participación (%)',
                    data: sortedCommunities.map(item => item.rate),
                    borderColor: 'rgba(118, 75, 162, 1)',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(118, 75, 162, 1)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(118, 75, 162, 1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `Participación: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                size: 11
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
        
        // Resetear bandera de renderizado
        this.isRenderingCommunityComparisonChart = false;
    }

    async exportData(tab, format) {
        try {
            console.log(`📤 Exportando datos de ${tab} en formato ${format}...`);
            
            let data = [];
            let filename = '';
            
            switch(tab) {
                case 'general':
                    data = this.prepareGeneralData();
                    filename = `estadisticas-generales-${new Date().toISOString().split('T')[0]}`;
                    break;
                case 'ubch':
                    data = this.prepareUBCHData();
                    filename = `estadisticas-ubch-${new Date().toISOString().split('T')[0]}`;
                    break;
                case 'community':
                    data = this.prepareCommunityData();
                    filename = `estadisticas-comunidades-${new Date().toISOString().split('T')[0]}`;
                    break;
            }
            
            if (format === 'pdf') {
                await this.exportToPDF(data, filename);
            } else {
                this.exportToCSV(data, filename);
            }
            
        } catch (error) {
            console.error('❌ Error exportando datos:', error);
            alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
        }
    }

    prepareGeneralData() {
        const totalRegistered = this.votes.length;
        const totalVoted = this.votes.filter(v => v.voted).length;
        const participationRate = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;
        
        return {
            summary: {
                totalRegistered,
                totalVoted,
                participationRate,
                totalUBCH: Object.keys(this.ubchData).length
            },
            ageDistribution: this.getAgeDistribution(),
            topUBCH: this.getTopUBCH(),
            topCommunities: this.getTopCommunities(),
            sexDistribution: this.getSexDistribution()
        };
    }

    prepareUBCHData() {
        const ubchData = [];
        Object.keys(this.ubchData).forEach(ubch => {
            const ubchVotes = this.votes.filter(v => v.ubch === ubch);
            const totalRegistered = ubchVotes.length;
            const totalVoted = ubchVotes.filter(v => v.voted).length;
            const participationRate = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;
            const maleVotes = ubchVotes.filter(v => v.voted && v.sexo === 'M').length;
            const femaleVotes = ubchVotes.filter(v => v.voted && v.sexo === 'F').length;
            
            ubchData.push({
                ubch,
                totalRegistered,
                totalVoted,
                participationRate,
                maleVotes,
                femaleVotes
            });
        });
        
        return ubchData;
    }

    prepareCommunityData() {
        const communityData = [];
        const communityStats = {};
        
        this.votes.forEach(vote => {
            if (!communityStats[vote.community]) {
                communityStats[vote.community] = {
                    total: 0,
                    voted: 0,
                    male: 0,
                    female: 0
                };
            }
            communityStats[vote.community].total++;
            if (vote.voted) {
                communityStats[vote.community].voted++;
                if (vote.sexo === 'M') {
                    communityStats[vote.community].male++;
                } else if (vote.sexo === 'F') {
                    communityStats[vote.community].female++;
                }
            }
        });
        
        Object.entries(communityStats).forEach(([community, stats]) => {
            const participationRate = stats.total > 0 ? (stats.voted / stats.total) * 100 : 0;
            communityData.push({
                community,
                totalRegistered: stats.total,
                totalVoted: stats.voted,
                participationRate,
                maleVotes: stats.male,
                femaleVotes: stats.female
            });
        });
        
        return communityData;
    }

    getAgeDistribution() {
        const ageRanges = [
            { min: 16, max: 25, label: '16-25 años' },
            { min: 26, max: 35, label: '26-35 años' },
            { min: 36, max: 45, label: '36-45 años' },
            { min: 46, max: 55, label: '46-55 años' },
            { min: 56, max: 65, label: '56-65 años' },
            { min: 66, max: null, label: '66+ años' }
        ];

        const ageStats = {};
        ageRanges.forEach(range => {
            ageStats[range.label] = 0;
        });

        this.votes.filter(v => v.voted).forEach(vote => {
            const edad = vote.edad || 0;
            const range = ageRanges.find(r => 
                edad >= r.min && (r.max === null || edad <= r.max)
            );
            if (range) {
                ageStats[range.label]++;
            }
        });

        return ageStats;
    }

    getTopUBCH() {
        const ubchStats = {};
        this.votes.filter(v => v.voted).forEach(vote => {
            ubchStats[vote.ubch] = (ubchStats[vote.ubch] || 0) + 1;
        });

        return Object.entries(ubchStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
    }

    getTopCommunities() {
        const communityStats = {};
        this.votes.filter(v => v.voted).forEach(vote => {
            communityStats[vote.community] = (communityStats[vote.community] || 0) + 1;
        });

        return Object.entries(communityStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
    }

    getSexDistribution() {
        const maleVotes = this.votes.filter(v => v.voted && v.sexo === 'M').length;
        const femaleVotes = this.votes.filter(v => v.voted && v.sexo === 'F').length;
        return { male: maleVotes, female: femaleVotes };
    }

    async exportToPDF(data, filename) {
        // Implementación básica de exportación PDF
        alert(`Función de exportación PDF para ${filename} en desarrollo`);
    }

    exportToCSV(data, filename) {
        let csvContent = '';
        
        if (Array.isArray(data)) {
            // Datos de UBCH o Comunidades
            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                csvContent = headers.join(',') + '\n';
                
                data.forEach(row => {
                    const values = headers.map(header => {
                        const value = row[header];
                        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                    });
                    csvContent += values.join(',') + '\n';
                });
            }
        } else {
            // Datos generales
            csvContent = 'Categoría,Valor\n';
            csvContent += `Total Registrados,${data.summary.totalRegistered}\n`;
            csvContent += `Total Votaron,${data.summary.totalVoted}\n`;
            csvContent += `Tasa de Participación,${data.summary.participationRate.toFixed(1)}%\n`;
            csvContent += `Total Centros de Votación,${data.summary.totalUBCH}\n`;
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Llenar listas interactivas de acceso rápido
    renderCVLinks() {
        const container = document.getElementById('cv-link-list');
        container.innerHTML = '';
        // Usar todos los CV de la config o de los votos
        let allUBCH = Object.keys(this.ubchData || {});
        if (allUBCH.length === 0) {
            allUBCH = Array.from(new Set(this.votes.map(v => v.ubch)));
        }
        allUBCH.forEach(ubch => {
            if (!ubch) return;
            const btn = document.createElement('button');
            btn.className = 'stats-item stats-link-btn';
            btn.innerHTML = `<span class='stats-item-name'>${ubch}</span>`;
            btn.onclick = () => this.showDetailModal('cv', ubch);
            container.appendChild(btn);
        });
    }

    renderCommunityLinks() {
        const container = document.getElementById('community-link-list');
        container.innerHTML = '';
        let allCommunities = [];
        if (this.ubchData && Object.keys(this.ubchData).length > 0) {
            Object.values(this.ubchData).forEach(ubch => {
                if (ubch.comunidades && Array.isArray(ubch.comunidades)) {
                    allCommunities.push(...ubch.comunidades);
                }
            });
        }
        if (allCommunities.length === 0) {
            allCommunities = Array.from(new Set(this.votes.map(v => v.community)));
        }
        allCommunities = Array.from(new Set(allCommunities)).filter(Boolean);
        allCommunities.forEach(community => {
            const btn = document.createElement('button');
            btn.className = 'stats-item stats-link-btn';
            btn.innerHTML = `<span class='stats-item-name'>${community}</span>`;
            btn.onclick = () => this.showDetailModal('community', community);
            container.appendChild(btn);
        });
    }

    showDetailModal(type, name) {
        const modal = document.getElementById('detalle-modal');
        const content = document.getElementById('detalle-modal-content');
        // Filtrar votos según tipo
        let filteredVotes = [];
        if (type === 'cv') {
            filteredVotes = this.votes.filter(v => v.ubch === name);
        } else {
            filteredVotes = this.votes.filter(v => v.community === name);
        }
        const totalRegistered = filteredVotes.length;
        const totalVoted = filteredVotes.filter(v => v.voted).length;
        const participationRate = totalRegistered > 0 ? (totalVoted / totalRegistered) * 100 : 0;
        // Desglose por sexo
        const maleVotes = filteredVotes.filter(v => v.voted && v.sexo === 'M').length;
        const femaleVotes = filteredVotes.filter(v => v.voted && v.sexo === 'F').length;
        // Desglose por edad
        const ageRanges = [
            { min: 16, max: 25, label: '16-25 años' },
            { min: 26, max: 35, label: '26-35 años' },
            { min: 36, max: 45, label: '36-45 años' },
            { min: 46, max: 55, label: '46-55 años' },
            { min: 56, max: 65, label: '56-65 años' },
            { min: 66, max: null, label: '66+ años' }
        ];
        const ageStats = {};
        ageRanges.forEach(range => { ageStats[range.label] = 0; });
        filteredVotes.filter(v => v.voted).forEach(vote => {
            const edad = vote.edad || 0;
            const range = ageRanges.find(r => edad >= r.min && (r.max === null || edad <= r.max));
            if (range) ageStats[range.label]++;
        });
        // HTML del modal
        content.innerHTML = `
            <h2 style='color:#667eea;'>${type === 'cv' ? 'Centro de Votación' : 'Comunidad'}: ${name}</h2>
            <div style='display:flex; gap:24px; flex-wrap:wrap; margin-bottom:24px;'>
                <div><b>Registrados:</b> ${totalRegistered}</div>
                <div><b>Votaron:</b> ${totalVoted}</div>
                <div><b>Participación:</b> ${participationRate.toFixed(1)}%</div>
            </div>
            <div style='display:flex; gap:32px; flex-wrap:wrap;'>
                <div>
                    <h4>Por Sexo</h4>
                    <ul style='list-style:none; padding:0;'>
                        <li>Masculino: <b>${maleVotes}</b></li>
                        <li>Femenino: <b>${femaleVotes}</b></li>
                    </ul>
                </div>
                <div>
                    <h4>Por Edad</h4>
                    <ul style='list-style:none; padding:0;'>
                        ${ageRanges.map(r => `<li>${r.label}: <b>${ageStats[r.label]}</b></li>`).join('')}
                    </ul>
                </div>
            </div>
            <div style='margin-top:24px; display:flex; gap:32px; flex-wrap:wrap;'>
                <div>
                    <canvas id='detalle-chart-sexo' width='300' height='200'></canvas>
                </div>
                <div>
                    <canvas id='detalle-chart-edad' width='300' height='200'></canvas>
                </div>
            </div>
            <div style='text-align:right; margin-top:24px;'>
                <button onclick="window.exportDetalleCSV && window.exportDetalleCSV()" class="btn btn-secondary">Exportar CSV</button>
                <button onclick="window.exportDetallePDF && window.exportDetallePDF()" class="btn btn-primary">Exportar PDF</button>
                <button onclick="document.getElementById('detalle-modal').style.display='none'" class="btn btn-secondary">Cerrar</button>
            </div>
        `;
        modal.style.display = 'block';
        // Gráfico de barras de participación por sexo
        setTimeout(() => {
            const ctxSexo = document.getElementById('detalle-chart-sexo').getContext('2d');
            new Chart(ctxSexo, {
                type: 'bar',
                data: {
                    labels: ['Masculino', 'Femenino'],
                    datasets: [{
                        label: 'Votos',
                        data: [maleVotes, femaleVotes],
                        backgroundColor: ['#667eea', '#764ba2']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
            // Gráfico de barras por edad
            const ctxEdad = document.getElementById('detalle-chart-edad').getContext('2d');
            new Chart(ctxEdad, {
                type: 'bar',
                data: {
                    labels: ageRanges.map(r => r.label),
                    datasets: [{
                        label: 'Votos',
                        data: ageRanges.map(r => ageStats[r.label]),
                        backgroundColor: '#667eea'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }, 100);
        // Exportación CSV y PDF
        window.exportDetalleCSV = () => {
            let csv = 'Campo,Valor\n';
            csv += `Registrados,${totalRegistered}\n`;
            csv += `Votaron,${totalVoted}\n`;
            csv += `Participación,${participationRate.toFixed(1)}%\n`;
            csv += `Masculino,${maleVotes}\nFemenino,${femaleVotes}\n`;
            ageRanges.forEach(r => {
                csv += `${r.label},${ageStats[r.label]}\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${type === 'cv' ? 'CV' : 'Comunidad'}_${name}_detalle.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        window.exportDetallePDF = () => {
            const doc = new window.jspdf.jsPDF();
            doc.setFontSize(16);
            doc.text(`${type === 'cv' ? 'Centro de Votación' : 'Comunidad'}: ${name}`, 10, 15);
            doc.setFontSize(12);
            let y = 30;
            doc.text(`Registrados: ${totalRegistered}`, 10, y);
            y += 8;
            doc.text(`Votaron: ${totalVoted}`, 10, y);
            y += 8;
            doc.text(`Participación: ${participationRate.toFixed(1)}%`, 10, y);
            y += 12;
            doc.text('Por Sexo:', 10, y);
            y += 8;
            doc.text(`Masculino: ${maleVotes}`, 15, y);
            y += 8;
            doc.text(`Femenino: ${femaleVotes}`, 15, y);
            y += 12;
            doc.text('Por Edad:', 10, y);
            y += 8;
            ageRanges.forEach(r => {
                doc.text(`${r.label}: ${ageStats[r.label]}`, 15, y);
                y += 8;
            });
            doc.save(`${type === 'cv' ? 'CV' : 'Comunidad'}_${name}_detalle.pdf`);
        };
    }

    renderBarChart(canvasId, {labels, data, label, color}) {
        try {
            // Verificar que el canvas existe
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error(`❌ Canvas ${canvasId} no encontrado`);
                return;
            }
            
            // Destruir gráfico existente si existe
            if (this.charts[canvasId]) {
                try {
                    this.charts[canvasId].destroy();
                } catch (e) {
                    // Ignorar errores de gráficos ya destruidos
                }
                this.charts[canvasId] = null;
            }
            
            const ctx = canvas.getContext('2d');
            
            // Limpiar el canvas antes de crear nuevo gráfico
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Crear nuevo gráfico directamente
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label,
                    data,
                    backgroundColor: color,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { color: '#333' } }, y: { ticks: { color: '#333' } } }
            }
        });
        } catch (error) {
            console.error(`❌ Error renderizando gráfico ${canvasId}:`, error);
        }
    }

    renderLineChart(canvasId, {labels, data, label, color}) {
        try {
            // Verificar que el canvas existe
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error(`❌ Canvas ${canvasId} no encontrado`);
                return;
            }
            
            // Destruir gráfico existente si existe
            if (this.charts[canvasId]) {
                try {
                    this.charts[canvasId].destroy();
                } catch (e) {
                    // Ignorar errores de gráficos ya destruidos
                }
                this.charts[canvasId] = null;
            }
            
            const ctx = canvas.getContext('2d');
            
            // Limpiar el canvas antes de crear nuevo gráfico
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Crear nuevo gráfico directamente
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label,
                    data,
                    fill: false,
                    borderColor: color,
                    backgroundColor: color,
                    tension: 0.3,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { color: '#333' } }, y: { ticks: { color: '#333' } } }
            }
        });
        } catch (error) {
            console.error(`❌ Error renderizando gráfico ${canvasId}:`, error);
        }
    }

    renderPieChart(canvasId, {labels, data, colors}) {
        try {
            // Verificar que el canvas existe
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error(`❌ Canvas ${canvasId} no encontrado`);
                return;
            }
            
            // Destruir gráfico existente si existe
            if (this.charts[canvasId]) {
                try {
                    this.charts[canvasId].destroy();
                } catch (e) {
                    // Ignorar errores de gráficos ya destruidos
                }
                this.charts[canvasId] = null;
            }
            
            const ctx = canvas.getContext('2d');
            
            // Limpiar el canvas antes de crear nuevo gráfico
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Crear nuevo gráfico directamente
        this.charts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { color: '#333' } } }
            }
        });
        } catch (error) {
            console.error(`❌ Error renderizando gráfico ${canvasId}:`, error);
        }
    }

    enterProjectionMode() {
        const overlay = document.getElementById('projection-overlay');
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.renderProjection();
        this.projectionInterval = setInterval(() => this.renderProjection(), 30000);
    }

    exitProjectionMode() {
        const overlay = document.getElementById('projection-overlay');
        overlay.style.display = 'none';
        document.body.style.overflow = '';
        if (this.projectionInterval) clearInterval(this.projectionInterval);
    }

    renderProjection() {
        const filteredVotes = this.getFilteredVotes();
        // Totales
        const totalRegistrados = filteredVotes.length;
        const totalVotos = filteredVotes.filter(v => v.voted).length;
        const porcentaje = totalRegistrados ? ((totalVotos / totalRegistrados) * 100).toFixed(1) : 0;
        document.getElementById('projection-total-votos').textContent = totalVotos.toLocaleString();
        document.getElementById('projection-text').textContent = `${totalVotos.toLocaleString()} de ${totalRegistrados.toLocaleString()} personas`;
        document.getElementById('projection-porcentaje').textContent = porcentaje + '%';
        // Barra de progreso
        const fill = document.getElementById('projection-progress-fill');
        fill.style.width = porcentaje + '%';
        fill.textContent = porcentaje + '%';
        // Ranking top 5 comunidades
        const votosPorComunidad = {};
        filteredVotes.forEach(r => {
            if (!votosPorComunidad[r.community]) votosPorComunidad[r.community] = 0;
            if (r.voted) votosPorComunidad[r.community]++;
        });
        const ranking = Object.entries(votosPorComunidad)
            .sort((a,b) => b[1]-a[1]).slice(0,5);
        const rankingList = document.getElementById('projection-ranking-list');
        rankingList.innerHTML = ranking.map(([com, count],i) => `<div class='projection-item'><span class='projection-item-name'>${i+1}. ${com}</span> <span class='projection-item-count'>${count}</span></div>`).join('');
    }

    setupDashboardFilters() {
        const selCom = document.getElementById('filtro-comunidad');
        const selCV = document.getElementById('filtro-cv');
        
        // Guardar valores actuales antes de repoblar
        const comunidadSeleccionada = selCom ? selCom.value : '';
        const cvSeleccionado = selCV ? selCV.value : '';
        
        console.log('🔧 Configurando filtros...');
        console.log('🔧 this.ubchData:', this.ubchData);
        console.log('🔧 this.votes.length:', this.votes.length);
        
        // Poblar comunidad (TODAS las comunidades del mapping, igual que en script-firebase.js)
        const todasLasComunidades = new Set();
        
        // Usar la misma lógica que script-firebase.js
        if (this.ubchData && typeof this.ubchData === 'object') {
            Object.values(this.ubchData).forEach(comunidades => {
                if (Array.isArray(comunidades)) {
                    comunidades.forEach(comunidad => todasLasComunidades.add(comunidad));
                }
            });
        }
        
        console.log('🔧 Comunidades del mapping:', todasLasComunidades.size);
        console.log('🔍 DEBUG: Comunidades encontradas:', Array.from(todasLasComunidades));
        
        // Llenar select de comunidades (igual que en script-firebase.js)
        console.log(`🔄 Cargando ${todasLasComunidades.size} comunidades en el formulario...`);
        console.log('📋 Lista completa de comunidades:', Array.from(todasLasComunidades).sort());
        
        const comunidadesOrdenadas = Array.from(todasLasComunidades).sort();
        selCom.innerHTML = '<option value="">Todas</option>' + comunidadesOrdenadas.map(c => `<option value="${c}">${c}</option>`).join('');
        console.log('🔧 Comunidades en selector:', comunidadesOrdenadas.length);
        
        // Poblar CV (TODOS los CV del mapping, igual que en script-firebase.js)
        console.log(`🔄 Cargando ${Object.keys(this.ubchData).length} Centros de Votación en el formulario...`);
        
        const cvOrdenados = Object.keys(this.ubchData).sort();
        selCV.innerHTML = '<option value="">Todos</option>' + cvOrdenados.map(cv => `<option value="${cv}">${cv}</option>`).join('');
        console.log('🔧 CV en selector:', cvOrdenados.length);
        
        // Restaurar valores seleccionados si existían
        if (comunidadSeleccionada && selCom) {
            selCom.value = comunidadSeleccionada;
        }
        if (cvSeleccionado && selCV) {
            selCV.value = cvSeleccionado;
        }
        
        // Evento de cambio - AMBOS filtros siempre activos
        selCom.onchange = () => {
            console.log('🔧 Filtro comunidad cambiado a:', selCom.value);
            this.renderAllStatistics();
        };
        selCV.onchange = () => {
            console.log('🔧 Filtro CV cambiado a:', selCV.value);
            this.renderAllStatistics();
        };
        
        console.log('✅ Filtros configurados - Comunidades:', comunidadesOrdenadas.length, 'CV:', cvOrdenados.length);
        console.log(`📊 Resumen: ${todasLasComunidades.size} comunidades, ${Object.keys(this.ubchData).length} centros de votación`);
    }
    
    getFilteredVotes() {
        const selCom = document.getElementById('filtro-comunidad');
        const selCV = document.getElementById('filtro-cv');
        let filtered = this.votes;
        
        // Aplicar filtro de comunidad si está seleccionado
        if (selCom && selCom.value) {
            filtered = filtered.filter(v => v.community === selCom.value);
        }
        
        // Aplicar filtro de CV si está seleccionado
        if (selCV && selCV.value) {
            filtered = filtered.filter(v => v.ubch === selCV.value);
        }
        
        return filtered;
    }
    populateSelectors() {
        this.setupDashboardFilters();
    }
    
    // Método para limpiar gráficos de manera rápida y eficiente
    quickCleanCharts() {
        try {
            // Lista de todos los gráficos que vamos a renderizar
            const chartsToClean = [
                'ubch', 'community',
                'dashboard-registros-mes-chart',
                'dashboard-votos-comunidad-chart',
                'dashboard-crecimiento-chart',
                'dashboard-sexo-chart',
                'dashboard-edad-chart',
                'dashboard-flujo-horas-chart'
            ];
            
            // Destruir solo los gráficos que necesitamos
            chartsToClean.forEach(chartId => {
                if (this.charts[chartId]) {
                    try {
                        this.charts[chartId].destroy();
                    } catch (e) {
                        // Ignorar errores de gráficos ya destruidos
                    }
                    this.charts[chartId] = null;
                }
            });
            
            console.log('✅ Limpieza rápida de gráficos completada');
        } catch (error) {
            console.error('❌ Error en limpieza rápida:', error);
        }
    }
    
    // Método para limpiar gráficos específicos que se van a renderizar
    clearSpecificCharts() {
        try {
            // Gráficos principales que siempre se renderizan
            const mainCharts = ['ubch', 'community'];
            mainCharts.forEach(chartKey => {
                if (this.charts[chartKey]) {
                    this.charts[chartKey].destroy();
                    this.charts[chartKey] = null;
                }
            });
            
            // Gráficos del dashboard que se renderizan en renderDashboardAdvanced
            const dashboardCharts = [
                'dashboard-registros-mes-chart',
                'dashboard-votos-comunidad-chart',
                'dashboard-crecimiento-chart',
                'dashboard-sexo-chart',
                'dashboard-edad-chart',
                'dashboard-flujo-horas-chart'
            ];
            
            dashboardCharts.forEach(chartId => {
                if (this.charts[chartId]) {
                    this.charts[chartId].destroy();
                    this.charts[chartId] = null;
                }
            });
            
            console.log('✅ Gráficos específicos limpiados');
        } catch (error) {
            console.error('❌ Error limpiando gráficos específicos:', error);
        }
    }
    
    // Método para forzar la limpieza de todos los gráficos de Chart.js
    forceCleanAllCharts() {
        try {
            // Limpiar todos los gráficos de Chart.js de manera más agresiva
            if (typeof Chart !== 'undefined') {
                // Destruir todas las instancias de Chart.js
                if (Chart.instances) {
                    Object.keys(Chart.instances).forEach(key => {
                        try {
                            Chart.instances[key].destroy();
                        } catch (e) {
                            // Ignorar errores de gráficos ya destruidos
                        }
                    });
                }
                
                            // Limpiar el registro de instancias de forma segura
            try {
                if (Chart.instances && typeof Chart.instances === 'object') {
                    Object.keys(Chart.instances).forEach(key => {
                        try {
                            if (Chart.instances[key] && typeof Chart.instances[key].destroy === 'function') {
                                Chart.instances[key].destroy();
                            }
                        } catch (e) {
                            // Ignorar errores de gráficos ya destruidos
                        }
                    });
                }
            } catch (e) {
                console.warn('⚠️ No se pudo limpiar Chart.instances:', e);
            }
            
            // Forzar la limpieza del registro interno de Chart.js
            if (Chart.helpers && Chart.helpers.each) {
                try {
                    Chart.helpers.each(Chart.instances, (instance) => {
                        try {
                            if (instance && typeof instance.destroy === 'function') {
                                instance.destroy();
                            }
                        } catch (e) {
                            // Ignorar errores
                        }
                    });
                } catch (e) {
                    console.warn('⚠️ No se pudo limpiar con Chart.helpers.each:', e);
                }
            }
                
                // Limpiar completamente el registro interno de Chart.js
                this.clearChartRegistry();
            }
            
            // Limpiar nuestro objeto de gráficos
            this.charts = {};
            
            // Limpiar todos los canvas
            const canvases = document.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
            
            console.log('✅ Limpieza forzada de todos los gráficos completada');
        } catch (error) {
            console.error('❌ Error en limpieza forzada:', error);
        }
    }
    
    // Método para limpiar completamente el registro interno de Chart.js
    clearChartRegistry() {
        try {
            if (typeof Chart !== 'undefined') {
                // Limpiar el registro de instancias de forma segura
                try {
                    if (Chart.instances && typeof Chart.instances === 'object') {
                        Object.keys(Chart.instances).forEach(key => {
                            try {
                                if (Chart.instances[key] && typeof Chart.instances[key].destroy === 'function') {
                                    Chart.instances[key].destroy();
                                }
                            } catch (e) {
                                // Ignorar errores de gráficos ya destruidos
                            }
                        });
                    }
                } catch (e) {
                    console.warn('⚠️ No se pudo limpiar Chart.instances:', e);
                }
                
                // Limpiar cualquier referencia interna
                if (Chart.helpers && Chart.helpers.each) {
                    try {
                        Chart.helpers.each(Chart.instances, (instance) => {
                            try {
                                if (instance && typeof instance.destroy === 'function') {
                                    instance.destroy();
                                }
                            } catch (e) {
                                // Ignorar errores
                            }
                        });
                    } catch (e) {
                        console.warn('⚠️ No se pudo limpiar con Chart.helpers.each:', e);
                    }
                }
                
                // Forzar la limpieza del registro de forma segura
                try {
                    if (Chart.instances && typeof Chart.instances === 'object') {
                        Object.keys(Chart.instances).forEach(key => {
                            try {
                                delete Chart.instances[key];
                            } catch (e) {
                                // Ignorar errores de propiedades de solo lectura
                            }
                        });
                    }
                } catch (e) {
                    console.warn('⚠️ No se pudo eliminar propiedades de Chart.instances:', e);
                }
                
                console.log('✅ Registro interno de Chart.js limpiado');
            }
        } catch (error) {
            console.error('❌ Error limpiando registro de Chart.js:', error);
        }
    }
    
    // Método para limpiar todos los gráficos
    destroyAllCharts() {
        try {
            // Destruir gráficos específicos que conocemos
            const knownCharts = ['ubch', 'community', 'ubchComparison', 'communityComparison'];
            knownCharts.forEach(chartKey => {
                if (this.charts[chartKey]) {
                    this.charts[chartKey].destroy();
                    this.charts[chartKey] = null;
                }
            });
            
            // Destruir gráficos dinámicos del dashboard
            const dashboardCharts = [
                'dashboard-registros-mes-chart',
                'dashboard-votos-comunidad-chart',
                'dashboard-crecimiento-chart',
                'dashboard-sexo-chart',
                'dashboard-edad-chart',
                'dashboard-flujo-horas-chart'
            ];
            
            dashboardCharts.forEach(chartId => {
                if (this.charts[chartId]) {
                    this.charts[chartId].destroy();
                    this.charts[chartId] = null;
                }
            });
            
            // Limpiar el objeto de gráficos
            this.charts = {};
            
            // Forzar la limpieza de Chart.js
            if (typeof Chart !== 'undefined') {
                Chart.helpers.each(Chart.instances, (instance) => {
                    instance.destroy();
                });
            }
            
            console.log('✅ Todos los gráficos destruidos');
        } catch (error) {
            console.error('❌ Error destruyendo gráficos:', error);
        }
    }

    // ===== FUNCIONES PARA REPORTES POR HORA =====
    
    async renderReportesHora() {
        try {
            console.log('📊 Renderizando tabla de reportes por hora...');
            
            // DEBUG: Verificar datos de votos
            this.debugVotosConfirmados();
            
            // Actualizar fecha en la tabla
            this.actualizarFechaReporte();
            
            const tbody = document.getElementById('reportes-hora-tbody');
            if (!tbody) {
                console.warn('⚠️ No se encontró el tbody para reportes por hora');
                return;
            }

            // Obtener todos los Centros de Votación del filtro (incluyendo los que no tienen votos)
            const todosLosCV = this.obtenerTodosLosCV();
            todosLosCV.sort();

            // Limpiar tabla
            tbody.innerHTML = '';

            // Inicializar totales
            const totales = {
                '08:00': 0, '10:00': 0, '12:00': 0, '14:00': 0, 
                '16:00': 0, '18:00': 0, '19:00': 0, '20:00': 0, '21:00': 0
            };

            // Procesar cada centro de votación (todos los del filtro)
            todosLosCV.forEach((cv, index) => {
                // Filtrar votos solo del día actual (usar fechaConfirmacion o voteTimestamp como respaldo)
                const votosCV = this.votes.filter(vote => 
                    vote.ubch === cv && 
                    vote.voted && 
                    this.esVotoDelDiaActual(vote.fechaConfirmacion || vote.voteTimestamp)
                );
                
                // DEBUG: Mostrar votos encontrados para este CV
                if (votosCV.length > 0) {
                    console.log(`🔍 CV ${cv}: ${votosCV.length} votos confirmados hoy`);
                    votosCV.forEach(voto => {
                        console.log(`  - Voto ID: ${voto.id}, Fecha: ${voto.fechaConfirmacion}, Hora: ${new Date(voto.fechaConfirmacion).getHours()}:${new Date(voto.fechaConfirmacion).getMinutes()}`);
                    });
                }
                
                // Contar votos por hora
                const votosPorHora = this.contarVotosPorHora(votosCV);
                
                // Crear fila
                const row = document.createElement('tr');
                row.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
                
                row.innerHTML = `
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${index + 1}</td>
                    <td style="padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: 500;">${cv}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 13px; color: #2c3e50;">${votosPorHora['08:00'] || 0}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 13px; color: #2c3e50;">${votosPorHora['10:00'] || 0}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 13px; color: #2c3e50;">${votosPorHora['12:00'] || 0}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 13px; color: #2c3e50;">${votosPorHora['14:00'] || 0}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 13px; color: #2c3e50;">${votosPorHora['16:00'] || 0}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 13px; color: #2c3e50;">${votosPorHora['18:00'] || 0}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 13px; color: #2c3e50;">${votosPorHora['19:00'] || 0}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 13px; color: #2c3e50;">${votosPorHora['20:00'] || 0}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 13px; color: #2c3e50;">${votosPorHora['21:00'] || 0}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; background: #e8f5e8; color: #2e7d32; font-size: 14px;">${Object.values(votosPorHora).reduce((sum, count) => sum + count, 0)}</td>
                `;

                tbody.appendChild(row);

                // Sumar a totales
                Object.keys(votosPorHora).forEach(hora => {
                    totales[hora] += votosPorHora[hora] || 0;
                });
            });

            // Actualizar totales en el pie de tabla
            this.actualizarTotalesReporte(totales);

            console.log('✅ Tabla de reportes por hora renderizada con todos los CV del filtro');
        } catch (error) {
            console.error('❌ Error renderizando reportes por hora:', error);
        }
    }

    // Función para obtener todos los Centros de Votación del filtro
    obtenerTodosLosCV() {
        // Verificar si hay filtro de CV aplicado
        if (typeof obtenerCVFiltrados === 'function') {
            const cvFiltrados = obtenerCVFiltrados();
            console.log('📊 CV filtrados para tabla de reportes:', cvFiltrados.length, 'centros de votación');
            return cvFiltrados;
        }
        
        // Usar los mismos CV que se cargan en el filtro
        if (this.ubchData && typeof this.ubchData === 'object') {
            const cvOrdenados = Object.keys(this.ubchData).sort();
            console.log('📊 CV para tabla de reportes:', cvOrdenados.length, 'centros de votación');
            return cvOrdenados;
        } else {
            console.warn('⚠️ No hay datos de CV disponibles, usando lista por defecto');
            // Lista de respaldo si no hay datos cargados
            return [
                'CV 01 - Escuela Básica Nacional "Simón Bolívar"',
                'CV 02 - Escuela Básica Nacional "Rómulo Gallegos"',
                'CV 03 - Escuela Básica Nacional "Andrés Bello"',
                'CV 04 - Escuela Básica Nacional "Juan Vicente González"',
                'CV 05 - Escuela Básica Nacional "Rafael Urdaneta"',
                'CV 06 - Escuela Básica Nacional "Antonio José de Sucre"',
                'CV 07 - Escuela Básica Nacional "José Félix Ribas"',
                'CV 08 - Escuela Básica Nacional "José Antonio Páez"',
                'CV 09 - Escuela Básica Nacional "Francisco de Miranda"',
                'CV 10 - Escuela Básica Nacional "José Gregorio Monagas"',
                'CV 11 - Escuela Básica Nacional "Manuel Piar"',
                'CV 12 - Escuela Básica Nacional "José Tadeo Monagas"',
                'CV 13 - Escuela Básica Nacional "Ezequiel Zamora"',
                'CV 14 - Escuela Básica Nacional "Juan Crisóstomo Falcón"',
                'CV 15 - Escuela Básica Nacional "José María Vargas"',
                'CV 16 - Escuela Básica Nacional "Carlos Soublette"',
                'CV 17 - Escuela Básica Nacional "José Laurencio Silva"',
                'CV 18 - Escuela Básica Nacional "Tomás Lander"',
                'CV 19 - Escuela Básica Nacional "José Félix Blanco"'
            ];
        }
    }

    // Función para verificar si un voto es del día actual
    esVotoDelDiaActual(fechaConfirmacion) {
        if (!fechaConfirmacion) return false;
        
        try {
            const fechaVoto = new Date(fechaConfirmacion);
            const hoy = new Date();
            
            // Verificar que la fecha sea válida
            if (isNaN(fechaVoto.getTime())) {
                console.warn('⚠️ Fecha inválida:', fechaConfirmacion);
                return false;
            }
            
            // Comparar solo fecha (sin hora)
            const fechaVotoDate = fechaVoto.toDateString();
            const hoyDate = hoy.toDateString();
            
            return fechaVotoDate === hoyDate;
        } catch (error) {
            console.error('❌ Error verificando fecha del voto:', error, 'Fecha:', fechaConfirmacion);
            return false;
        }
    }

    // Función para verificar si es un nuevo día
    esNuevoDia() {
        const hoy = new Date().toDateString();
        const ultimoDia = localStorage.getItem('ultimoDiaReporte');
        
        if (ultimoDia !== hoy) {
            localStorage.setItem('ultimoDiaReporte', hoy);
            return true;
        }
        return false;
    }

    // Función para reiniciar tabla al inicio del día
    reiniciarTablaDiaria() {
        if (this.esNuevoDia()) {
            console.log('🔄 Nuevo día detectado, reiniciando tabla de reportes...');
            this.renderReportesHora();
        }
    }

    // Función para actualizar la fecha en la tabla
    actualizarFechaReporte() {
        const fechaElement = document.getElementById('fecha-actual-reporte');
        if (fechaElement) {
            const fechaActual = new Date().toLocaleDateString('es-VE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            fechaElement.textContent = fechaActual;
        }
    }

    contarVotosPorHora(votos) {
        const votosPorHora = {
            '08:00': 0, '10:00': 0, '12:00': 0, '14:00': 0, 
            '16:00': 0, '18:00': 0, '19:00': 0, '20:00': 0, '21:00': 0
        };

        votos.forEach(voto => {
            // Usar fechaConfirmacion o voteTimestamp como respaldo
            const fechaConfirmacion = voto.fechaConfirmacion || voto.voteTimestamp;
            
            if (fechaConfirmacion) {
                const fecha = new Date(fechaConfirmacion);
                const hora = fecha.getHours();
                
                // Mapear horas a franjas horarias
                if (hora >= 8 && hora < 10) votosPorHora['08:00']++;
                else if (hora >= 10 && hora < 12) votosPorHora['10:00']++;
                else if (hora >= 12 && hora < 14) votosPorHora['12:00']++;
                else if (hora >= 14 && hora < 16) votosPorHora['14:00']++;
                else if (hora >= 16 && hora < 18) votosPorHora['16:00']++;
                else if (hora >= 18 && hora < 19) votosPorHora['18:00']++;
                else if (hora >= 19 && hora < 20) votosPorHora['19:00']++;
                else if (hora >= 20 && hora < 21) votosPorHora['20:00']++;
                else if (hora >= 21 && hora < 22) votosPorHora['21:00']++;
            }
        });

        return votosPorHora;
    }

    actualizarTotalesReporte(totales) {
        document.getElementById('total-08am').textContent = totales['08:00'] || 0;
        document.getElementById('total-10am').textContent = totales['10:00'] || 0;
        document.getElementById('total-12pm').textContent = totales['12:00'] || 0;
        document.getElementById('total-02pm').textContent = totales['14:00'] || 0;
        document.getElementById('total-04pm').textContent = totales['16:00'] || 0;
        document.getElementById('total-06pm').textContent = totales['18:00'] || 0;
        document.getElementById('total-07pm').textContent = totales['19:00'] || 0;
        document.getElementById('total-08pm').textContent = totales['20:00'] || 0;
        document.getElementById('total-09pm').textContent = totales['21:00'] || 0;
        
        const totalGeneral = Object.values(totales).reduce((sum, count) => sum + count, 0);
        document.getElementById('total-general').textContent = totalGeneral;
    }

    // Función para migrar votos existentes que tienen voteTimestamp pero no fechaConfirmacion
    migrarVotosExistentes() {
        console.log('🔄 Migrando votos existentes...');
        
        let migrados = 0;
        this.votes.forEach(vote => {
            if (vote.voted && vote.voteTimestamp && !vote.fechaConfirmacion) {
                vote.fechaConfirmacion = vote.voteTimestamp;
                migrados++;
            }
        });
        
        if (migrados > 0) {
            console.log(`✅ ${migrados} votos migrados exitosamente`);
            // Guardar cambios en localStorage como respaldo
            localStorage.setItem('votes', JSON.stringify(this.votes));
        } else {
            console.log('ℹ️ No hay votos que necesiten migración');
        }
        
        return migrados;
    }

    // Función de debugging para diagnosticar problemas con votos confirmados
    debugVotosConfirmados() {
        console.log('🔍 DEBUG: Analizando votos confirmados...');
        console.log(`📊 Total de votos cargados: ${this.votes.length}`);
        
        // Contar votos confirmados
        const votosConfirmados = this.votes.filter(vote => vote.voted);
        console.log(`✅ Votos confirmados (vote.voted = true): ${votosConfirmados.length}`);
        
        // Verificar campo fechaConfirmacion
        const votosConFecha = this.votes.filter(vote => vote.fechaConfirmacion);
        console.log(`📅 Votos con fechaConfirmacion: ${votosConFecha.length}`);
        
        // Verificar campo voteTimestamp como respaldo
        const votosConTimestamp = this.votes.filter(vote => vote.voteTimestamp);
        console.log(`⏰ Votos con voteTimestamp: ${votosConTimestamp.length}`);
        
        // Verificar votos del día actual usando fechaConfirmacion
        const hoy = new Date();
        console.log(`📅 Fecha actual: ${hoy.toLocaleDateString('es-VE')} ${hoy.toLocaleTimeString('es-VE')}`);
        
        const votosHoy = this.votes.filter(vote => 
            vote.voted && 
            vote.fechaConfirmacion && 
            this.esVotoDelDiaActual(vote.fechaConfirmacion)
        );
        console.log(`🎯 Votos confirmados hoy (fechaConfirmacion): ${votosHoy.length}`);
        
        // Verificar votos del día actual usando voteTimestamp como respaldo
        const votosHoyTimestamp = this.votes.filter(vote => 
            vote.voted && 
            vote.voteTimestamp && 
            this.esVotoDelDiaActual(vote.voteTimestamp)
        );
        console.log(`🎯 Votos confirmados hoy (voteTimestamp): ${votosHoyTimestamp.length}`);
        
        // Mostrar algunos ejemplos de votos
        if (votosHoy.length > 0) {
            console.log('📋 Ejemplos de votos confirmados hoy (fechaConfirmacion):');
            votosHoy.slice(0, 5).forEach((voto, index) => {
                const fecha = new Date(voto.fechaConfirmacion);
                console.log(`  ${index + 1}. ID: ${voto.id}, CV: ${voto.ubch}, Fecha: ${fecha.toLocaleString('es-VE')}, Hora: ${fecha.getHours()}:${fecha.getMinutes()}`);
            });
        } else if (votosHoyTimestamp.length > 0) {
            console.log('📋 Ejemplos de votos confirmados hoy (voteTimestamp):');
            votosHoyTimestamp.slice(0, 5).forEach((voto, index) => {
                const fecha = new Date(voto.voteTimestamp);
                console.log(`  ${index + 1}. ID: ${voto.id}, CV: ${voto.ubch}, Fecha: ${fecha.toLocaleString('es-VE')}, Hora: ${fecha.getHours()}:${fecha.getMinutes()}`);
            });
        } else {
            console.log('⚠️ No se encontraron votos confirmados para hoy');
            
            // Mostrar algunos votos confirmados recientes para debugging
            const votosConfirmadosRecientes = this.votes
                .filter(vote => vote.voted && (vote.fechaConfirmacion || vote.voteTimestamp))
                .sort((a, b) => {
                    const fechaA = new Date(a.fechaConfirmacion || a.voteTimestamp);
                    const fechaB = new Date(b.fechaConfirmacion || b.voteTimestamp);
                    return fechaB - fechaA;
                })
                .slice(0, 5);
            
            if (votosConfirmadosRecientes.length > 0) {
                console.log('📋 Votos confirmados más recientes:');
                votosConfirmadosRecientes.forEach((voto, index) => {
                    const fecha = new Date(voto.fechaConfirmacion || voto.voteTimestamp);
                    console.log(`  ${index + 1}. ID: ${voto.id}, CV: ${voto.ubch}, Fecha: ${fecha.toLocaleString('es-VE')}, Campo usado: ${voto.fechaConfirmacion ? 'fechaConfirmacion' : 'voteTimestamp'}`);
                });
            }
        }
        
        // Verificar estructura de datos
        if (this.votes.length > 0) {
            const primerVoto = this.votes[0];
            console.log('🔍 Estructura del primer voto:', Object.keys(primerVoto));
            console.log('📋 Campos relevantes del primer voto:', {
                id: primerVoto.id,
                ubch: primerVoto.ubch,
                voted: primerVoto.voted,
                fechaConfirmacion: primerVoto.fechaConfirmacion,
                voteTimestamp: primerVoto.voteTimestamp,
                fechaConfirmacionTipo: typeof primerVoto.fechaConfirmacion,
                voteTimestampTipo: typeof primerVoto.voteTimestamp
            });
        }
    }

    async exportarReporteHora() {
        try {
            console.log('📊 Exportando reporte por hora a Excel y PDF...');
            
            // Obtener todos los Centros de Votación del filtro
            const todosLosCV = this.obtenerTodosLosCV();
            todosLosCV.sort();

            // Crear datos para Excel
            const excelData = [
                ['N°', 'Centro de Votación', 'Reporte 08:00 AM', 'Reporte 10:00 AM', 'Reporte 12:00 M', 
                 'Reporte 02:00 PM', 'Reporte 04:00 PM', 'Reporte 06:00 PM', 'Reporte 07:00 PM', 
                 'Reporte 08:00 PM', 'Reporte 09:00 PM', 'TOTAL']
            ];

            const totales = {
                '08:00': 0, '10:00': 0, '12:00': 0, '14:00': 0, 
                '16:00': 0, '18:00': 0, '19:00': 0, '20:00': 0, '21:00': 0
            };

            // Agregar datos de cada CV (todos los 19)
            todosLosCV.forEach((cv, index) => {
                // Filtrar votos solo del día actual (usar fechaConfirmacion o voteTimestamp como respaldo)
                const votosCV = this.votes.filter(vote => 
                    vote.ubch === cv && 
                    vote.voted && 
                    this.esVotoDelDiaActual(vote.fechaConfirmacion || vote.voteTimestamp)
                );
                
                const votosPorHora = this.contarVotosPorHora(votosCV);
                const totalCV = Object.values(votosPorHora).reduce((sum, count) => sum + count, 0);

                excelData.push([
                    index + 1,
                    cv,
                    votosPorHora['08:00'] || 0,
                    votosPorHora['10:00'] || 0,
                    votosPorHora['12:00'] || 0,
                    votosPorHora['14:00'] || 0,
                    votosPorHora['16:00'] || 0,
                    votosPorHora['18:00'] || 0,
                    votosPorHora['19:00'] || 0,
                    votosPorHora['20:00'] || 0,
                    votosPorHora['21:00'] || 0,
                    totalCV
                ]);

                // Sumar a totales
                Object.keys(votosPorHora).forEach(hora => {
                    totales[hora] += votosPorHora[hora] || 0;
                });
            });

            // Agregar fila de totales
            const totalGeneral = Object.values(totales).reduce((sum, count) => sum + count, 0);
            excelData.push([
                '-',
                'TOTALES',
                totales['08:00'] || 0,
                totales['10:00'] || 0,
                totales['12:00'] || 0,
                totales['14:00'] || 0,
                totales['16:00'] || 0,
                totales['18:00'] || 0,
                totales['19:00'] || 0,
                totales['20:00'] || 0,
                totales['21:00'] || 0,
                totalGeneral
            ]);

            // Generar Excel usando SheetJS
            await this.generarExcelReporte(excelData);
            
            // Generar PDF
            await this.generarPDFReporte(todosLosCV, totales, totalGeneral);

            console.log('✅ Reporte por hora exportado exitosamente como Excel y PDF');
            alert('✅ Reporte por hora exportado exitosamente como Excel y PDF');
        } catch (error) {
            console.error('❌ Error exportando reporte por hora:', error);
            alert('❌ Error exportando reporte por hora');
        }
    }

    // Función para generar Excel
    async generarExcelReporte(excelData) {
        try {
            // Verificar si SheetJS está disponible
            if (typeof XLSX === 'undefined') {
                console.warn('⚠️ SheetJS no está disponible, generando CSV como respaldo');
                this.generarCSVRespaldo(excelData);
                return;
            }

            // Crear workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(excelData);

            // Aplicar estilos y formato
            ws['!cols'] = [
                { width: 5 },   // N°
                { width: 50 },  // Centro de Votación
                { width: 15 },  // 08:00 AM
                { width: 15 },  // 10:00 AM
                { width: 15 },  // 12:00 M
                { width: 15 },  // 02:00 PM
                { width: 15 },  // 04:00 PM
                { width: 15 },  // 06:00 PM
                { width: 15 },  // 07:00 PM
                { width: 15 },  // 08:00 PM
                { width: 15 },  // 09:00 PM
                { width: 15 }   // TOTAL
            ];

            // Agregar hoja al workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Reporte por Hora');

            // Generar archivo
            const fecha = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `reporte_por_hora_${fecha}.xlsx`);

            console.log('✅ Archivo Excel generado exitosamente');
        } catch (error) {
            console.error('❌ Error generando Excel:', error);
            this.generarCSVRespaldo(excelData);
        }
    }

    // Función de respaldo para generar CSV
    generarCSVRespaldo(excelData) {
        const csvContent = excelData.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_por_hora_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Función para generar PDF
    async generarPDFReporte(todosLosCV, totales, totalGeneral) {
        try {
            // Verificar si jsPDF está disponible
            if (typeof window.jspdf === 'undefined') {
                console.warn('⚠️ jsPDF no está disponible');
                return;
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('l', 'mm', 'a4'); // Orientación horizontal para mejor ajuste

            const fechaActual = new Date().toLocaleDateString('es-VE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Configurar fuente
            pdf.setFont('helvetica');
            pdf.setFontSize(16);

            // Título
            pdf.text('📊 Reporte de Confirmación de Votos por Centro de Votación y Hora', 20, 20);
            pdf.setFontSize(12);
            pdf.text(`📅 Fecha: ${fechaActual}`, 20, 30);

            // Crear tabla para PDF
            const headers = ['N°', 'Centro de Votación', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '19:00', '20:00', '21:00', 'TOTAL'];
            
            const tableData = [];
            
            // Agregar datos de cada CV
            todosLosCV.forEach((cv, index) => {
                const votosCV = this.votes.filter(vote => 
                    vote.ubch === cv && 
                    vote.voted && 
                    this.esVotoDelDiaActual(vote.fechaConfirmacion)
                );
                
                const votosPorHora = this.contarVotosPorHora(votosCV);
                const totalCV = Object.values(votosPorHora).reduce((sum, count) => sum + count, 0);

                tableData.push([
                    index + 1,
                    cv,
                    votosPorHora['08:00'] || 0,
                    votosPorHora['10:00'] || 0,
                    votosPorHora['12:00'] || 0,
                    votosPorHora['14:00'] || 0,
                    votosPorHora['16:00'] || 0,
                    votosPorHora['18:00'] || 0,
                    votosPorHora['19:00'] || 0,
                    votosPorHora['20:00'] || 0,
                    votosPorHora['21:00'] || 0,
                    totalCV
                ]);
            });

            // Agregar fila de totales
            tableData.push([
                '-',
                'TOTALES',
                totales['08:00'] || 0,
                totales['10:00'] || 0,
                totales['12:00'] || 0,
                totales['14:00'] || 0,
                totales['16:00'] || 0,
                totales['18:00'] || 0,
                totales['19:00'] || 0,
                totales['20:00'] || 0,
                totales['21:00'] || 0,
                totalGeneral
            ]);

            // Generar tabla usando autoTable
            pdf.autoTable({
                head: [headers],
                body: tableData,
                startY: 40,
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [102, 126, 234],
                    textColor: 255
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                },
                columnStyles: {
                    0: { cellWidth: 10 },  // N°
                    1: { cellWidth: 60 },  // Centro de Votación
                    11: { fillColor: [232, 245, 232] } // TOTAL
                }
            });

            // Agregar información adicional
            const finalY = pdf.lastAutoTable.finalY + 10;
            pdf.setFontSize(10);
            pdf.text('📊 Reporte generado automáticamente por el Sistema de Registro de Votos 2025', 20, finalY);
            pdf.text('🔄 La tabla se reinicia automáticamente cada día a las 00:00 horas', 20, finalY + 8);

            // Guardar PDF
            const fecha = new Date().toISOString().split('T')[0];
            pdf.save(`reporte_por_hora_${fecha}.pdf`);

            console.log('✅ Archivo PDF generado exitosamente');
        } catch (error) {
            console.error('❌ Error generando PDF:', error);
        }
    }

    async actualizarReporteHora() {
        try {
            console.log('🔄 Actualizando reporte por hora...');
            await this.loadData();
            await this.renderReportesHora();
            console.log('✅ Reporte por hora actualizado');
            alert('✅ Reporte por hora actualizado');
        } catch (error) {
            console.error('❌ Error actualizando reporte por hora:', error);
            alert('❌ Error actualizando reporte por hora');
        }
    }
}

// Funciones globales para los botones
window.exportarReporteHora = function() {
    if (window.estadisticasAvanzadas) {
        window.estadisticasAvanzadas.exportarReporteHora();
    }
};

window.actualizarReporteHora = function() {
    if (window.estadisticasAvanzadas) {
        window.estadisticasAvanzadas.actualizarReporteHora();
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new EstadisticasAvanzadas();
}); 

// Función para manejar el acordeón de la tabla de reportes
function toggleAccordion() {
    const content = document.getElementById('accordion-content');
    const icon = document.getElementById('accordion-icon');
    
    if (content.style.display === 'none' || content.style.display === '') {
        // Abrir acordeón
        content.style.display = 'block';
        content.style.animation = 'slideDown 0.3s ease-out';
        icon.classList.add('rotated');
        
        // Cargar los filtros de CV cuando se abre el acordeón
        setTimeout(() => {
            cargarFiltrosCV();
        }, 100);
    } else {
        // Cerrar acordeón
        content.style.animation = 'slideUp 0.3s ease-out';
        icon.classList.remove('rotated');
        
        // Esperar a que termine la animación antes de ocultar
        setTimeout(() => {
            content.style.display = 'none';
        }, 300);
    }
}

// Inicializar el acordeón cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // El acordeón comienza cerrado por defecto
    const content = document.getElementById('accordion-content');
    const icon = document.getElementById('accordion-icon');
    
    if (content && icon) {
        content.style.display = 'none';
        icon.classList.remove('rotated');
    }
    
    // Inicializar filtros de CV cuando los datos estén disponibles
    setTimeout(() => {
        if (window.estadisticasAvanzadas && window.estadisticasAvanzadas.ubchData) {
            cargarFiltrosCV();
        }
    }, 2000);
}); 

// Variables globales para el filtro de CV
let centrosVotacionSeleccionados = new Set();
let todosLosCentrosVotacion = [];

// Función para cargar los checkboxes de centros de votación
function cargarFiltrosCV() {
    const container = document.getElementById('cv-filtros-container');
    if (!container) return;
    
    // Obtener todos los centros de votación disponibles
    if (window.estadisticasAvanzadas && window.estadisticasAvanzadas.ubchData) {
        todosLosCentrosVotacion = Object.keys(window.estadisticasAvanzadas.ubchData).sort();
    } else {
        // Lista de respaldo
        todosLosCentrosVotacion = [
            'CV 01 - Escuela Básica Nacional "Simón Bolívar"',
            'CV 02 - Escuela Básica Nacional "Rómulo Gallegos"',
            'CV 03 - Escuela Básica Nacional "Andrés Bello"',
            'CV 04 - Escuela Básica Nacional "Juan Vicente González"',
            'CV 05 - Escuela Básica Nacional "Rafael Urdaneta"',
            'CV 06 - Escuela Básica Nacional "Antonio José de Sucre"',
            'CV 07 - Escuela Básica Nacional "José Félix Ribas"',
            'CV 08 - Escuela Básica Nacional "José Antonio Páez"',
            'CV 09 - Escuela Básica Nacional "Francisco de Miranda"',
            'CV 10 - Escuela Básica Nacional "José Gregorio Monagas"',
            'CV 11 - Escuela Básica Nacional "Manuel Piar"',
            'CV 12 - Escuela Básica Nacional "José Tadeo Monagas"',
            'CV 13 - Escuela Básica Nacional "Ezequiel Zamora"',
            'CV 14 - Escuela Básica Nacional "Juan Crisóstomo Falcón"',
            'CV 15 - Escuela Básica Nacional "José María Vargas"',
            'CV 16 - Escuela Básica Nacional "Carlos Soublette"',
            'CV 17 - Escuela Básica Nacional "José Laurencio Silva"',
            'CV 18 - Escuela Básica Nacional "Tomás Lander"',
            'CV 19 - Escuela Básica Nacional "José Félix Blanco"'
        ];
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear checkboxes para cada centro de votación de forma más compacta
    todosLosCentrosVotacion.forEach(cv => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'cv-checkbox-container';
        checkboxContainer.onclick = () => toggleCVSelection(cv, checkboxContainer);
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `cv-checkbox-${cv.replace(/[^a-zA-Z0-9]/g, '-')}`;
        checkbox.checked = centrosVotacionSeleccionados.has(cv);
        
        const label = document.createElement('label');
        label.className = 'cv-checkbox-label';
        label.htmlFor = checkbox.id;
        
        // Acortar el nombre del CV para mejor visualización
        let cvCorto = cv;
        if (cv.includes(' - ')) {
            const partes = cv.split(' - ');
            if (partes.length >= 2) {
                cvCorto = partes[0] + ' - ' + partes[1].substring(0, 25) + (partes[1].length > 25 ? '...' : '');
            }
        }
        label.textContent = cvCorto;
        label.title = cv; // Tooltip con el nombre completo
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        
        // Aplicar estilo si está seleccionado
        if (centrosVotacionSeleccionados.has(cv)) {
            checkboxContainer.classList.add('selected');
        }
        
        container.appendChild(checkboxContainer);
    });
    
    console.log('✅ Filtros de CV cargados:', todosLosCentrosVotacion.length, 'centros de votación');
    actualizarContadorCV();
}

// Función para alternar selección de un CV
function toggleCVSelection(cv, container) {
    if (centrosVotacionSeleccionados.has(cv)) {
        centrosVotacionSeleccionados.delete(cv);
        container.classList.remove('selected');
    } else {
        centrosVotacionSeleccionados.add(cv);
        container.classList.add('selected');
    }
    
    // Actualizar checkbox
    const checkbox = container.querySelector('input[type="checkbox"]');
    if (checkbox) {
        checkbox.checked = centrosVotacionSeleccionados.has(cv);
    }
    
    // Actualizar contador
    actualizarContadorCV();
}

// Función para actualizar el contador de CV seleccionados
function actualizarContadorCV() {
    const contador = document.getElementById('cv-seleccionados-count');
    if (contador) {
        const count = centrosVotacionSeleccionados.size;
        const total = todosLosCentrosVotacion.length;
        contador.textContent = `${count} de ${total} seleccionados`;
        
        // Cambiar color según la cantidad
        if (count === 0) {
            contador.style.background = '#95a5a6';
        } else if (count === total) {
            contador.style.background = '#2ecc71';
        } else {
            contador.style.background = '#667eea';
        }
    }
}

// Función para seleccionar todos los CV
function seleccionarTodosCV() {
    centrosVotacionSeleccionados = new Set(todosLosCentrosVotacion);
    cargarFiltrosCV();
    actualizarContadorCV();
    console.log('✅ Todos los CV seleccionados');
}

// Función para deseleccionar todos los CV
function deseleccionarTodosCV() {
    centrosVotacionSeleccionados.clear();
    cargarFiltrosCV();
    actualizarContadorCV();
    console.log('❌ Todos los CV deseleccionados');
}

// Función para aplicar el filtro
function aplicarFiltroCV() {
    if (centrosVotacionSeleccionados.size === 0) {
        alert('⚠️ Por favor selecciona al menos un Centro de Votación');
        return;
    }
    
    console.log('🔍 Aplicando filtro de CV:', centrosVotacionSeleccionados.size, 'centros seleccionados');
    
    // Actualizar la tabla con el filtro aplicado
    if (window.estadisticasAvanzadas) {
        window.estadisticasAvanzadas.renderReportesHora();
    }
}

// Función para limpiar el filtro
function limpiarFiltroCV() {
    centrosVotacionSeleccionados.clear();
    cargarFiltrosCV();
    
    // Actualizar la tabla sin filtro
    if (window.estadisticasAvanzadas) {
        window.estadisticasAvanzadas.renderReportesHora();
    }
    
    console.log('🗑️ Filtro de CV limpiado');
}

// Función para obtener los CV filtrados
function obtenerCVFiltrados() {
    if (centrosVotacionSeleccionados.size === 0) {
        // Si no hay filtro, mostrar todos
        return todosLosCentrosVotacion;
    }
    
    return Array.from(centrosVotacionSeleccionados).sort();
}