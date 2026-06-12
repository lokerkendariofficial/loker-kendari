const ACCESS_CODE = '900900';
const PASSWORD = '900900';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5xtxnptjxh-FIyJuBoCct5vudZFFOeaisUUhT8X0R0kjAkY3f2CtD45CYcZjnPxGh52Og7_AXA756/pub?output=csv';

// URL Web App Google Apps Script untuk antrean
const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyTnN21CN0LtEapwWhum1WYHm0G1Ku1dNZGtvQqypnkuvlgZOOF1UCB-cZMJcESDDNG/exec';

let rawJobs = [];
let monthlyChart, locationBarChart, typePieChart, trendLineChart;

// ========== BYPASS LOGIN TOGGLE ==========
const BYPASS_KEY = 'owner_bypass_active';

function isBypassActive() {
    return localStorage.getItem(BYPASS_KEY) === 'true';
}
function setBypassActive(active) {
    localStorage.setItem(BYPASS_KEY, active ? 'true' : 'false');
}
function updateToggleUI() {
    const toggle = document.getElementById('bypassLoginToggle');
    if (toggle) toggle.checked = isBypassActive();
}
function initBypassToggle() {
    const toggle = document.getElementById('bypassLoginToggle');
    if (!toggle) return;
    toggle.addEventListener('change', function(e) {
        const active = e.target.checked;
        setBypassActive(active);
        if (active) {
            sessionStorage.setItem('owner_logged_in', 'true');
            location.reload();
        } else {
            sessionStorage.removeItem('owner_logged_in');
            location.reload();
        }
    });
}
// ===========================================

// Login check (modifikasi)
function checkLogin() {
    if (isBypassActive()) {
        sessionStorage.setItem('owner_logged_in', 'true');
        showDashboard();
        loadAllData();
        return;
    }
    if (sessionStorage.getItem('owner_logged_in') === 'true') {
        showDashboard();
        loadAllData();
    } else {
        showLogin();
    }
}
function showLogin() {
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('dashboardContainer').style.display = 'none';
}
function showDashboard() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'flex';
    updateToggleUI();
    initBypassToggle();
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
}
document.getElementById('logoutBtnHeader')?.addEventListener('click', logout);
document.getElementById('logoutBtnSidebar')?.addEventListener('click', logout);
document.getElementById('refreshBtn')?.addEventListener('click', () => loadAllData());
document.getElementById('forceRefreshBtn')?.addEventListener('click', () => loadAllData());

// Tab navigation
document.querySelectorAll('.sidebar-nav li[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-nav li').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        if (tabId === 'overview') document.getElementById('tab-overview').classList.add('active');
        if (tabId === 'jobs') document.getElementById('tab-jobs').classList.add('active');
        if (tabId === 'analytics') document.getElementById('tab-analytics').classList.add('active');
        if (tabId === 'settings') document.getElementById('tab-settings').classList.add('active');
        if (['health','whatif','inventory','space','power','cooling','connectivity'].includes(tabId)) {
            document.getElementById('tab-overview').classList.add('active');
        }
    });
});

// Clock
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('id-ID');
}
setInterval(updateClock, 1000);
updateClock();

// ========== FUNGSI APPROVE KE GAS (ANTREAN) ==========
async function approveJob(uniqueId, buttonElement) {
    if (!confirm('Setujui lowongan ini? Akan dijadwalkan (maks 8 per jam, jeda 7 menit).')) return;
    buttonElement.disabled = true;
    buttonElement.textContent = 'Memproses...';
    try {
        const response = await fetch(GAS_WEBAPP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uniqueId: uniqueId })
        });
        const result = await response.json();
        alert(result.message);
        if (result.success) {
            await loadAllData(); // refresh tabel
        } else {
            buttonElement.disabled = false;
            buttonElement.textContent = 'Konfirmasi';
        }
    } catch (err) {
        alert('Error: ' + err.message);
        buttonElement.disabled = false;
        buttonElement.textContent = 'Konfirmasi';
    }
}
// =====================================================

// Fetch CSV dan parse (dengan tambahan uniqueId)
async function loadAllData() {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Gagal fetch');
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
                deadline: headers.findIndex(h => h.includes('deadline') || h.includes('batas')),
                tipe: headers.findIndex(h => h.includes('tipe') || h.includes('jenis'))
            };
            rawJobs = rows.slice(1).map(row => {
                const cols = row.split(',');
                const job = {
                    timestamp: col.timestamp !== -1 ? (cols[col.timestamp] || '').trim() : '',
                    email: col.email !== -1 ? (cols[col.email] || '').trim() : '',
                    perusahaan: col.perusahaan !== -1 ? (cols[col.perusahaan] || '').trim() : '',
                    posisi: col.posisi !== -1 ? (cols[col.posisi] || '').trim() : '',
                    lokasi: col.lokasi !== -1 ? (cols[col.lokasi] || '').trim() : '',
                    deskripsi: col.deskripsi !== -1 ? (cols[col.deskripsi] || '').trim() : '',
                    gaji: col.gaji !== -1 ? (cols[col.gaji] || '').trim() : '',
                    deadline: col.deadline !== -1 ? (cols[col.deadline] || '').trim() : '',
                    tipe: col.tipe !== -1 ? (cols[col.tipe] || '').trim() : 'Lainnya'
                };
                // TAMBAHKAN UNIQUE ID (gabungan timestamp + email)
                job.uniqueId = job.timestamp + job.email;
                return job;
            }).filter(j => j.perusahaan !== '');
        }
        updateUI();
    } catch (err) {
        console.error(err);
        document.querySelectorAll('.kpi-value').forEach(el => el.innerText = 'Error');
        document.getElementById('recentJobsTable').innerHTML = '<tr><td colspan="4">Gagal memuat data</td></tr>';
        document.getElementById('allJobsTable').innerHTML = '<tr><td colspan="7">Error loading</td></tr>';
    }
}

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
    let recent = [...rawJobs].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,5);
    let recentHtml = '';
    recent.forEach(j => {
        recentHtml += `<tr><td>${escapeHtml(j.timestamp)}</td><td>${escapeHtml(j.perusahaan)}</td><td>${escapeHtml(j.posisi)}</td><td>${escapeHtml(j.lokasi)}</td></tr>`;
    });
    document.getElementById('recentJobsTable').innerHTML = recentHtml || '<tr><td colspan="4">Tidak ada data</td></tr>';

    // Tabel semua lowongan (dengan tombol Konfirmasi jika status belum diatur)
    let allHtml = '';
    rawJobs.forEach((j, idx) => {
        // Asumsikan status default adalah 'Pending' (belum disetujui)
        // Jika ingin menampilkan status dari spreadsheet, Anda perlu tambahkan kolom Status di CSV. Untuk sementara, kita berikan tombol konfirmasi untuk semua.
        allHtml += `<tr>
            <td>${escapeHtml(j.timestamp)}</td>
            <td>${escapeHtml(j.email)}</td>
            <td>${escapeHtml(j.perusahaan)}</td>
            <td>${escapeHtml(j.posisi)}</td>
            <td>${escapeHtml(j.lokasi)}</td>
            <td>${escapeHtml(j.deadline)}</td>
            <td>
                <button class="btn-confirm" data-uniqueid="${escapeHtml(j.uniqueId)}">Konfirmasi</button>
                <button class="view-btn" data-index="${idx}">Detail</button>
            </td>
        </tr>`;
    });
    document.getElementById('allJobsTable').innerHTML = allHtml || '<tr><td colspan="7">Tidak ada data</td></tr>';

    // Event listener untuk tombol konfirmasi (antrean)
    document.querySelectorAll('.btn-confirm').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const uniqueId = btn.getAttribute('data-uniqueid');
            await approveJob(uniqueId, btn);
        });
    });
    // Event listener untuk tombol detail
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let idx = e.target.getAttribute('data-index');
            let job = rawJobs[idx];
            alert(`Detail Lowongan\n\nPerusahaan: ${job.perusahaan}\nPosisi: ${job.posisi}\nLokasi: ${job.lokasi}\nDeskripsi: ${job.deskripsi.substring(0,200)}...\nEmail: ${job.email}\nDeadline: ${job.deadline}\nTanggal: ${job.timestamp}`);
        });
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
    if (trendLineChart) trendLineChart.destroy();
    const lineCtx = document.getElementById('trendLineChart').getContext('2d');
    trendLineChart = new Chart(lineCtx, {
        type: 'line',
        data: { labels: monthLabels, datasets: [{ label: 'Tren Lowongan', data: monthData, borderColor: '#1e3a5f', fill: false }] },
        options: { responsive: true }
    });
}

function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }

// Start
checkLogin();