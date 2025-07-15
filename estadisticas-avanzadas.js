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
        
        await this.loadData();
        this.setupEventListeners();
        // Configurar filtros después de cargar datos
        this.setupDashboardFilters();
        this.renderAllStatistics();
        this.updateUserInfo();
        if (!this.updateInterval) {
            this.updateInterval = setInterval(async () => {
                if (this.isRendering) return;
                this.isRendering = true;
                
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
                
                // Limpiar el registro de instancias
                Chart.instances = {};
                
                // Forzar la limpieza del registro interno de Chart.js
                if (Chart.helpers && Chart.helpers.each) {
                    Chart.helpers.each(Chart.instances, (instance) => {
                        try {
                            instance.destroy();
                        } catch (e) {
                            // Ignorar errores
                        }
                    });
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
                // Limpiar el registro de instancias
                Chart.instances = {};
                
                // Limpiar cualquier referencia interna
                if (Chart.helpers && Chart.helpers.each) {
                    Chart.helpers.each(Chart.instances, (instance) => {
                        try {
                            instance.destroy();
                        } catch (e) {
                            // Ignorar errores
                        }
                    });
                }
                
                // Forzar la limpieza del registro
                if (Chart.instances && typeof Chart.instances === 'object') {
                    Object.keys(Chart.instances).forEach(key => {
                        delete Chart.instances[key];
                    });
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
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new EstadisticasAvanzadas();
}); 