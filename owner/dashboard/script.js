const ACCESS_CODE = '900900';
const PASSWORD = '900900';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5xtxnptjxh-FIyJuBoCct5vudZFFOeaisUUhT8X0R0kjAkY3f2CtD45CYcZjnPxGh52Og7_AXA756/pub?output=csv';

let rawJobs = [];
let monthlyChart, locationChart, miniMonthlyChart;

// Login check
function checkLogin() {
    if (sessionStorage.getItem('owner_logged_in') === 'true') {
        showDashboard();
        loadAllData();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('dashboardWrapper').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('dashboardWrapper').style.display = 'flex';
}

// Login event
document.getElementById('loginBtn').addEventListener('click', () => {
    const code = document.getElementById('aksesCode').value.trim();
    const pwd = document.getElementById('password').value.trim();
    if (code === ACCESS_CODE && pwd === PASSWORD) {
        sessionStorage.setItem('owner_logged_in', 'true');
        showDashboard();
        loadAllData();
        document.getElementById('loginError').innerText = '';
    } else {
        document.getElementById('loginError').innerText = 'Kode atau sandi salah!';
    }
});

// Logout
function logout() {
    sessionStorage.removeItem('owner_logged_in');
    showLogin();
    document.getElementById('aksesCode').value = '';
    document.getElementById('password').value = '';
}
document.getElementById('logoutBtnSidebar')?.addEventListener('click', logout);
document.getElementById('refreshBtnTop')?.addEventListener('click', () => loadAllData());
document.getElementById('forceRefreshBtn')?.addEventListener('click', () => loadAllData());

// Tab navigation
document.querySelectorAll('.sidebar-nav li').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-nav li').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`tab-${tabId}`).classList.add('active');
        if (tabId === 'analytics') {
            // refresh chart jika perlu
            if (locationChart) locationChart.update();
            if (monthlyChart) monthlyChart.update();
        }
    });
});

// Main data loading
async function loadAllData() {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Gagal fetch CSV');
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(r => r.trim() !== '');
        if (rows.length < 2) {
            rawJobs = [];
        } else {
            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
            const col = {
                timestamp: headers.findIndex(h => h.includes('timestamp')),
                email: headers.findIndex(h => h.includes('email')),
                perusahaan: headers.findIndex(h => h.includes('nama perusahaan') || h.includes('perusahaan')),
                posisi: headers.findIndex(h => h.includes('posisi') || h.includes('judul')),
                lokasi: headers.findIndex(h => h.includes('lokasi')),
                deskripsi: headers.findIndex(h => h.includes('deskripsi')),
                gaji: headers.findIndex(h => h.includes('gaji') || h.includes('sistem')),
                deadline: headers.findIndex(h => h.includes('deadline') || h.includes('batas'))
            };
            rawJobs = rows.slice(1).map(row => {
                const cols = row.split(',');
                return {
                    timestamp: (col.timestamp !== -1 && cols[col.timestamp]) ? cols[col.timestamp].trim() : '',
                    email: (col.email !== -1 && cols[col.email]) ? cols[col.email].trim() : '',
                    perusahaan: (col.perusahaan !== -1 && cols[col.perusahaan]) ? cols[col.perusahaan].trim() : '',
                    posisi: (col.posisi !== -1 && cols[col.posisi]) ? cols[col.posisi].trim() : '',
                    lokasi: (col.lokasi !== -1 && cols[col.lokasi]) ? cols[col.lokasi].trim() : '',
                    deskripsi: (col.deskripsi !== -1 && cols[col.deskripsi]) ? cols[col.deskripsi].trim() : '',
                    gaji: (col.gaji !== -1 && cols[col.gaji]) ? cols[col.gaji].trim() : '',
                    deadline: (col.deadline !== -1 && cols[col.deadline]) ? cols[col.deadline].trim() : ''
                };
            }).filter(j => j.perusahaan !== '');
        }
        updateUI();
    } catch (err) {
        console.error(err);
        document.querySelectorAll('.stat-number').forEach(el => el.innerText = 'Error');
        document.getElementById('recentJobsTable').innerHTML = '<tr><td colspan="4">Gagal memuat data</td></tr>';
        document.getElementById('allJobsTable').innerHTML = '<tr><td colspan="7">Error loading</td></tr>';
    }
}

function updateUI() {
    const total = rawJobs.length;
    const uniqueCompanies = new Set(rawJobs.map(j => j.perusahaan)).size;
    const lokasiCount = {};
    rawJobs.forEach(j => { let loc = j.lokasi || 'Tidak diketahui'; lokasiCount[loc] = (lokasiCount[loc] || 0) + 1; });
    const topLocation = Object.entries(lokasiCount).sort((a,b) => b[1] - a[1])[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthCount = rawJobs.filter(j => {
        let d = new Date(j.timestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // Update stat cards
    document.querySelectorAll('.stat-number')[0].innerText = total;
    document.querySelectorAll('.stat-number')[1].innerText = uniqueCompanies;
    if (topLocation) {
        document.querySelectorAll('.stat-number')[2].innerHTML = `${topLocation[0]} <span style="font-size:0.8rem;">(${topLocation[1]})</span>`;
    } else {
        document.querySelectorAll('.stat-number')[2].innerText = '-';
    }
    document.querySelectorAll('.stat-number')[3].innerText = thisMonthCount;

    // Update badges
    document.getElementById('lastUpdateBadge').innerHTML = `Update: ${new Date().toLocaleString()}`;
    document.getElementById('analyticsTotal').innerText = total;
    document.getElementById('analyticsCompanies').innerText = uniqueCompanies;
    document.getElementById('analyticsTopCity').innerText = topLocation ? topLocation[0] : '-';
    document.getElementById('analyticsLastUpdate').innerHTML = new Date().toLocaleString();
    document.getElementById('csvUrlDisplay').innerText = CSV_URL;

    // Tabel terbaru (5 data)
    let recent = [...rawJobs].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,5);
    let recentHtml = '';
    recent.forEach(j => {
        recentHtml += `<tr><td>${escapeHtml(j.timestamp)}</td><td>${escapeHtml(j.perusahaan)}</td><td>${escapeHtml(j.posisi)}</td><td>${escapeHtml(j.lokasi)}</td></tr>`;
    });
    document.getElementById('recentJobsTable').innerHTML = recentHtml || '<tr><td colspan="4">Tidak ada data</td></tr>';

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
            <td><button class="view-btn" data-index="${idx}">👁️ Detail</button></td>
        </tr>`;
    });
    document.getElementById('allJobsTable').innerHTML = allHtml || '<tr><td colspan="7">Tidak ada data</td></tr>';
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let idx = e.target.getAttribute('data-index');
            let job = rawJobs[idx];
            alert(`Detail Lowongan\n\nPerusahaan: ${job.perusahaan}\nPosisi: ${job.posisi}\nLokasi: ${job.lokasi}\nDeskripsi: ${job.deskripsi.substring(0,200)}...\nEmail: ${job.email}\nDeadline: ${job.deadline}\nTanggal: ${job.timestamp}`);
        });
    });

    // Grafik bulanan
    const monthMap = {};
    rawJobs.forEach(j => {
        if (j.timestamp) {
            let d = new Date(j.timestamp);
            let key = `${d.getFullYear()}-${d.getMonth()+1}`;
            monthMap[key] = (monthMap[key] || 0) + 1;
        }
    });
    const sortedMonths = Object.keys(monthMap).sort();
    const monthLabels = sortedMonths.map(m => m);
    const monthData = sortedMonths.map(m => monthMap[m]);
    if (monthlyChart) monthlyChart.destroy();
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: monthLabels, datasets: [{ label: 'Jumlah Lowongan', data: monthData, backgroundColor: '#1e3a5f' }] },
        options: { responsive: true, maintainAspectRatio: true }
    });
    if (miniMonthlyChart) miniMonthlyChart.destroy();
    const miniCtx = document.getElementById('miniMonthlyChart').getContext('2d');
    miniMonthlyChart = new Chart(miniCtx, {
        type: 'line',
        data: { labels: monthLabels, datasets: [{ label: 'Tren', data: monthData, borderColor: '#1e3a5f', fill: false }] },
        options: { responsive: true, maintainAspectRatio: true }
    });

    // Grafik lokasi (top 5)
    const topLocs = Object.entries(lokasiCount).sort((a,b) => b[1] - a[1]).slice(0,5);
    const locLabels = topLocs.map(l => l[0]);
    const locData = topLocs.map(l => l[1]);
    if (locationChart) locationChart.destroy();
    const locCtx = document.getElementById('locationChart').getContext('2d');
    locationChart = new Chart(locCtx, {
        type: 'pie',
        data: { labels: locLabels, datasets: [{ data: locData, backgroundColor: ['#1e3a5f','#2c5f8a','#3d7ca8','#5a9bc0','#7eb8d4'] }] },
        options: { responsive: true }
    });
}

function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }

// Init
checkLogin();