// ===========================================
// FILE: charts.js
// Render semua grafik Chart.js
// ===========================================
function updateCharts(monthMap, lokasiCount) {
    // Data untuk chart bulanan & tren
    const sortedMonths = Object.keys(monthMap).sort();
    const monthLabels = sortedMonths;
    const monthData = sortedMonths.map(m => monthMap[m]);
    
    if (monthlyChart) monthlyChart.destroy();
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: monthLabels, datasets: [{ label: 'Jumlah Lowongan', data: monthData, backgroundColor: '#1e3a5f' }] },
        options: { responsive: true, maintainAspectRatio: true }
    });
    
    // Bar chart lokasi (horizontal)
    const topLocs = Object.entries(lokasiCount).sort((a,b) => b[1] - a[1]).slice(0,5);
    const locLabels = topLocs.map(l => l[0]);
    const locData = topLocs.map(l => l[1]);
    if (locationBarChart) locationBarChart.destroy();
    const locCtx = document.getElementById('locationBarChart').getContext('2d');
    locationBarChart = new Chart(locCtx, {
        type: 'bar',
        data: { labels: locLabels, datasets: [{ label: 'Jumlah Lowongan', data: locData, backgroundColor: '#2c5f8a' }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true }
    });
    
    // Pie chart tipe pekerjaan
    const typeCount = {};
    rawJobs.forEach(j => { let t = j.tipe || 'Lainnya'; typeCount[t] = (typeCount[t] || 0) + 1; });
    const typeLabels = Object.keys(typeCount);
    const typeData = Object.values(typeCount);
    if (typePieChart) typePieChart.destroy();
    const pieCtx = document.getElementById('typePieChart').getContext('2d');
    typePieChart = new Chart(pieCtx, {
        type: 'pie',
        data: { labels: typeLabels, datasets: [{ data: typeData, backgroundColor: ['#1e3a5f','#3d7ca8','#5a9bc0','#7eb8d4','#a0c4e2'] }] },
        options: { responsive: true }
    });
    
    // Line chart tren
    if (trendLineChart) trendLineChart.destroy();
    const lineCtx = document.getElementById('trendLineChart').getContext('2d');
    trendLineChart = new Chart(lineCtx, {
        type: 'line',
        data: { labels: monthLabels, datasets: [{ label: 'Tren Lowongan', data: monthData, borderColor: '#1e3a5f', fill: false }] },
        options: { responsive: true }
    });
}