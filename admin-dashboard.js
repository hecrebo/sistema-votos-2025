// admin-dashboard.js
// Módulo independiente para dashboard visual en el panel de administración
// Eliminar este archivo y el <div id="dashboard-visual"> para quitar el módulo sin afectar el sistema

(function() {
    // Verifica si el contenedor existe
    const container = document.getElementById('dashboard-visual');
    if (!container) return;
    container.innerHTML = `
        <div style="background:white;padding:24px;border-radius:15px;box-shadow:0 4px 16px rgba(0,0,0,0.07);margin-bottom:24px;">
            <h2 style="margin-top:0;">📊 Dashboard Visual</h2>
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