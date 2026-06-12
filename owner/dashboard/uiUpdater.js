// ===========================================
// FILE: uiUpdater.js
// Update semua tampilan (KPI, tabel) dan panggil updateCharts
// ===========================================
function updateUI() {
    const total = rawJobs.length;
    const uniqueCompanies = new Set(rawJobs.map(j => j.perusahaan)).size;
    const lokasiCount = {};
    rawJobs.forEach(j => { let l = j.lokasi || 'Tidak diketahui'; lokasiCount[l] = (lokasiCount[l] || 0) + 1; });
    const topLocationEntry = Object.entries(lokasiCount).sort((a,b) => b[1] - a[1])[0];
    const topLocation = topLocationEntry ? topLocationEntry[0] : '-';
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthCount = rawJobs.filter(j => {
        let d = new Date(j.timestamp);
        return !isNaN(d) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    
    document.getElementById('totalJobs').innerText = total;
    document.getElementById('uniqueCompanies').innerText = uniqueCompanies;
    document.getElementById('monthJobs').innerText = thisMonthCount;
    document.getElementById('topLocation').innerText = topLocation;
    document.getElementById('lastUpdateBadge').innerHTML = `Update: ${new Date().toLocaleString()}`;
    document.getElementById('csvUrlDisplay').innerText = CSV_URL;
    document.getElementById('lastUpdateTime').innerText = new Date().toLocaleString();
    
    const companyCount = {};
    rawJobs.forEach(j => { companyCount[j.perusahaan] = (companyCount[j.perusahaan] || 0) + 1; });
    const topCompanyEntry = Object.entries(companyCount).sort((a,b) => b[1] - a[1])[0];
    document.getElementById('topCompany').innerText = topCompanyEntry ? `${topCompanyEntry[0]} (${topCompanyEntry[1]})` : '-';
    document.getElementById('topCityDetail').innerText = topLocation;
    
    const monthMap = {};
    rawJobs.forEach(j => {
        if (j.timestamp) {
            let d = new Date(j.timestamp);
            if (!isNaN(d)) {
                let key = `${d.getFullYear()}-${d.getMonth()+1}`;
                monthMap[key] = (monthMap[key] || 0) + 1;
            }
        }
    });
    const values = Object.values(monthMap);
    const avg = values.length ? (values.reduce((a,b) => a+b,0)/values.length).toFixed(1) : 0;
    document.getElementById('avgPerMonth').innerText = avg;
    
    // Tabel lowongan terbaru
    let recent = [...rawJobs].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,5);
    let recentHtml = '';
    recent.forEach(j => {
        recentHtml += `<tr><td>${escapeHtml(j.timestamp)}</td><td>${escapeHtml(j.perusahaan)}</td><td>${escapeHtml(j.posisi)}</td><td>${escapeHtml(j.lokasi)}</td></tr>`;
    });
    document.getElementById('recentJobsTable').innerHTML = recentHtml || '<tr><td colspan="4">Tidak ada数据</td></tr>';
    
    // Tabel semua lowongan
    let allHtml = '';
    rawJobs.forEach((j, idx) => {
        allHtml += `<tr>
            <td>${escapeHtml(j.timestamp)}</td>
            <td>${escapeHtml(j.email)}</td>
            <td>${escapeHtml(j.perusahaan)}</td>
            <td>${escapeHtml(j.posisi)}</td>
            <td>${escapeHtml(j.lokasi)}</td>
            <td>${escapeHtml(j.deadline)}</td>
            <td><button class="view-btn" data-index="${idx}">Detail</button></td>
        </tr>`;
    });
    document.getElementById('allJobsTable').innerHTML = allHtml || '<tr><td colspan="7">Tidak ada数据</td></tr>';
    
    // Event listener tombol detail
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let idx = e.target.getAttribute('data-index');
            let job = rawJobs[idx];
            alert(`Detail Lowongan\n\nPerusahaan: ${job.perusahaan}\nPosisi: ${job.posisi}\nLokasi: ${job.lokasi}\nDeskripsi: ${job.deskripsi.substring(0,200)}...\nEmail: ${job.email}\nDeadline: ${job.deadline}\nTanggal: ${job.timestamp}`);
        });
    });
    
    // Panggil fungsi grafik dari charts.js
    updateCharts(monthMap, lokasiCount);
}