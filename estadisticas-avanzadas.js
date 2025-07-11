// Estadísticas Avanzadas - Sistema de Votos 2025
class EstadisticasAvanzadas {
    constructor() {
        this.votes = [];
        this.ubchData = {};
        this.communityData = {};
        this.charts = {};
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderAllStatistics(); // Solo una vez aquí
        this.updateUserInfo();
        // Actualización automática cada 30 segundos, pero solo si no está ya en proceso
        if (!this.updateInterval) {
            this.updateInterval = setInterval(async () => {
                if (this.isRendering) return;
                this.isRendering = true;
                await this.loadData();
                this.renderAllStatistics();
                this.isRendering = false;
            }, 30000);
        }
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
            
            // Cargar datos desde Firebase
            const db = firebase.firestore();
            const votesSnapshot = await db.collection('votes').get();
            this.votes = votesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Cargar configuración de UBCH
            const ubchSnapshot = await db.collection('ubch_config').get();
            this.ubchData = {};
            ubchSnapshot.docs.forEach(doc => {
                this.ubchData[doc.id] = doc.data();
            });
            
            console.log('✅ Datos cargados:', this.votes.length, 'votos,', Object.keys(this.ubchData).length, 'centros de votación');
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            // Cargar datos locales si Firebase falla
            this.loadLocalData();
        }
    }

    loadLocalData() {
        console.log('📱 Cargando datos locales...');
        const localVotes = localStorage.getItem('votes');
        if (localVotes) {
            this.votes = JSON.parse(localVotes);
        }
        
        const localUBCH = localStorage.getItem('ubch_config');
        if (localUBCH) {
            this.ubchData = JSON.parse(localUBCH);
        }
        
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
        this.renderGeneralStatistics();
        // Eliminar llamadas a funciones de secciones antiguas
        // this.renderUBCHStatistics();
        // this.renderCommunityStatistics();
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
            // Si en la config de UBCH hay comunidades, úsalas
            Object.values(this.ubchData).forEach(ubch => {
                if (ubch.comunidades && Array.isArray(ubch.comunidades)) {
                    allCommunities.push(...ubch.comunidades);
                }
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
        const ctx = document.getElementById('ubch-chart').getContext('2d');
        // Destruir y limpiar el gráfico anterior si existe
        if (this.charts.ubch) {
            this.charts.ubch.destroy();
            this.charts.ubch = null;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        const ubchStats = {};
        this.votes.filter(v => v.voted).forEach(vote => {
            ubchStats[vote.ubch] = (ubchStats[vote.ubch] || 0) + 1;
        });
        const sortedUBCH = Object.entries(ubchStats).sort(([,a], [,b]) => b - a);
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
    }

    renderCommunityChart() {
        const ctx = document.getElementById('community-chart').getContext('2d');
        // Destruir y limpiar el gráfico anterior si existe
        if (this.charts.community) {
            this.charts.community.destroy();
            this.charts.community = null;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        const communityStats = {};
        this.votes.filter(v => v.voted).forEach(vote => {
            communityStats[vote.community] = (communityStats[vote.community] || 0) + 1;
        });
        const sortedCommunities = Object.entries(communityStats).sort(([,a], [,b]) => b - a);
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
    }

    renderUBCHComparisonChart() {
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
    }

    renderCommunityComparisonChart() {
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
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new EstadisticasAvanzadas();
}); 