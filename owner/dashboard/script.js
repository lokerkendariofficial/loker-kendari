const ACCESS_CODE = '900900';
const PASSWORD = '900900';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5xtxnptjxh-FIyJuBoCct5vudZFFOeaisUUhT8X0R0kjAkY3f2CtD45CYcZjnPxGh52Og7_AXA756/pub?output=csv';

let rawJobs = [];       // data dari CSV (asli)
let jobsMaster = [];    // data setelah digabung dengan override localStorage
let nextId = 1;

// Load data dari localStorage
function loadOverrides() {
    const stored = localStorage.getItem('owner_jobs_overrides');
    if (stored) return JSON.parse(stored);
    else return {};
}
let overrides = loadOverrides();

function saveOverrides() {
    localStorage.setItem('owner_jobs_overrides', JSON.stringify(overrides));
}

// Reset all overrides
function resetOverrides() {
    overrides = {};
    saveOverrides();
    loadAllData(); // reload
}

// Helper: generate ID unik berdasarkan timestamp + email
function generateId(job, idx) {
    return btoa(job.timestamp + job.email + idx).substring(0, 12);
}

// Gabungkan CSV dengan overrides
function mergeJobs(csvJobs) {
    const overridesMap = overrides;
    const merged = csvJobs.map((job, idx) => {
        const id = generateId(job, idx);
        if (overridesMap[id]) {
            return { ...job, ...overridesMap[id], id };
        } else {
            return { ...job, id };
        }
    }).filter(job => !job.deleted); // hapus yang ditandai deleted
    return merged;
}

// Ambil CSV
async function fetchCSV() {
    const response = await fetch(CSV_URL);
    const csvText = await response.text();
    const rows = csvText.split('\n').filter(r => r.trim() !== '');
    if (rows.length < 2) return [];
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
    const jobs = rows.slice(1).map(row => {
        const cols = row.split(',');
        return {
            timestamp: col.timestamp !== -1 ? (cols[col.timestamp] || '').trim() : '',
            email: col.email !== -1 ? (cols[col.email] || '').trim() : '',
            perusahaan: col.perusahaan !== -1 ? (cols[col.perusahaan] || '').trim() : '',
            posisi: col.posisi !== -1 ? (cols[col.posisi] || '').trim() : '',
            lokasi: col.lokasi !== -1 ? (cols[col.lokasi] || '').trim() : '',
            deskripsi: col.deskripsi !== -1 ? (cols[col.deskripsi] || '').trim() : '',
            gaji: col.gaji !== -1 ? (cols[col.gaji] || '').trim() : '',
            deadline: col.deadline !== -1 ? (cols[col.deadline] || '').trim() : '',
            status: 'Pending' // default
        };
    }).filter(j => j.perusahaan !== '');
    return jobs;
}

// Render tabel lowongan
function renderJobsTable() {
    const tbody = document.querySelector('#allJobsTable tbody');
    if (!jobsMaster.length) {
        tbody.innerHTML = '<tr><td colspan="7">Tidak ada lowongan</td></tr>';
        return;
    }
    tbody.innerHTML = jobsMaster.map(job => `
        <tr>
            <td>${escapeHtml(job.id)}</td>
            <td>${escapeHtml(job.timestamp)}</td>
            <td>${escapeHtml(job.perusahaan)}</td>
            <td>${escapeHtml(job.posisi)}</td>
            <td>${escapeHtml(job.lokasi)}</td>
            <td><span class="status-badge" style="background:${job.status === 'Published' ? '#28a745' : '#ffc107'}; color:${job.status === 'Published' ? 'white' : '#1e3a5f'};">${job.status}</span></td>
            <td>
                <button class="btn-confirm" data-id="${job.id}" ${job.status === 'Published' ? 'disabled' : ''}>Konfirmasi</button>
                <button class="btn-edit" data-id="${job.id}">Edit</button>
                <button class="btn-delete" data-id="${job.id}">Hapus</button>
            </td>
        </tr>
    `).join('');
    // Attach events
    document.querySelectorAll('.btn-confirm').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = btn.getAttribute('data-id');
            if (overrides[id]) overrides[id].status = 'Published';
            else {
                const original = jobsMaster.find(j => j.id === id);
                overrides[id] = { ...original, status: 'Published' };
            }
            saveOverrides();
            await loadAllData();
        });
    });
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = btn.getAttribute('data-id');
            const job = jobsMaster.find(j => j.id === id);
            const newPerusahaan = prompt('Edit Nama Perusahaan', job.perusahaan);
            if (newPerusahaan !== null) {
                const newPosisi = prompt('Edit Posisi', job.posisi);
                const newLokasi = prompt('Edit Lokasi', job.lokasi);
                const newDeadline = prompt('Edit Deadline', job.deadline);
                const update = { perusahaan: newPerusahaan, posisi: newPosisi, lokasi: newLokasi, deadline: newDeadline };
                overrides[id] = { ...(overrides[id] || job), ...update };
                saveOverrides();
                await loadAllData();
            }
        });
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm('Hapus lowongan ini?')) {
                const id = btn.getAttribute('data-id');
                overrides[id] = { ...(overrides[id] || jobsMaster.find(j => j.id === id)), deleted: true };
                saveOverrides();
                await loadAllData();
            }
        });
    });
}

// Update statistik dan chart
function updateStatsAndCharts() {
    const total = jobsMaster.length;
    const published = jobsMaster.filter(j => j.status === 'Published').length;
    const pending = total - published;
    const companies = new Set(jobsMaster.map(j => j.perusahaan)).size;
    document.getElementById('totalJobsDummy').innerText = total;
    document.getElementById('companiesDummy').innerText = companies;
    document.getElementById('publishedDummy').innerText = published;
    document.getElementById('pendingDummy').innerText = pending;
    // Chart dummy di overview
    const ctx = document.getElementById('dummyChart');
    if (ctx && window.dummyChart) window.dummyChart.destroy();
    if (ctx) {
        window.dummyChart = new Chart(ctx, {
            type: 'bar', data: { labels: ['Published', 'Pending'], datasets: [{ label: 'Jumlah', data: [published, pending], backgroundColor: '#1e3a5f' }] }
        });
    }
    // Analytics chart
    const ctx2 = document.getElementById('statChart');
    if (ctx2 && window.statChart) window.statChart.destroy();
    if (ctx2) {
        window.statChart = new Chart(ctx2, {
            type: 'pie', data: { labels: ['Published', 'Pending'], datasets: [{ data: [published, pending], backgroundColor: ['#28a745', '#ffc107'] }] }
        });
    }
    const statsList = document.getElementById('statsList');
    if (statsList) statsList.innerHTML = `<li>Total Lowongan: ${total}</li><li>Published: ${published}</li><li>Pending: ${pending}</li><li>Perusahaan: ${companies}</li>`;
}

// Main load
async function loadAllData() {
    const csvJobs = await fetchCSV();
    const merged = mergeJobs(csvJobs);
    jobsMaster = merged.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    renderJobsTable();
    updateStatsAndCharts();
    document.getElementById('lastUpdateBadge').innerHTML = `Update: ${new Date().toLocaleString()}`;
    document.getElementById('csvUrlDisplay').innerText = CSV_URL;
    // juga update di tab overview jika ada
}

// Login logic
function checkLogin() {
    if (sessionStorage.getItem('owner_logged_in') === 'true') {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'flex';
        loadAllData();
    } else {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('dashboardContainer').style.display = 'none';
    }
}
document.getElementById('loginBtn').addEventListener('click', () => {
    const code = document.getElementById('aksesCode').value.trim();
    const pwd = document.getElementById('password').value.trim();
    if (code === ACCESS_CODE && pwd === PASSWORD) {
        sessionStorage.setItem('owner_logged_in', 'true');
        checkLogin();
        document.getElementById('loginError').innerText = '';
    } else {
        document.getElementById('loginError').innerText = 'Salah!';
    }
});
function logout() {
    sessionStorage.removeItem('owner_logged_in');
    checkLogin();
}
document.getElementById('logoutBtnHeader')?.addEventListener('click', logout);
document.getElementById('logoutBtnSidebar')?.addEventListener('click', logout);
document.getElementById('refreshBtn')?.addEventListener('click', () => loadAllData());
document.getElementById('resetLocalStorageBtn')?.addEventListener('click', () => {
    if (confirm('Reset semua perubahan? Data akan kembali ke CSV asli.')) {
        resetOverrides();
    }
});
document.getElementById('editOwnPostingLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Fitur edit postingan sendiri (untuk pengguna) dapat dikembangkan lebih lanjut.');
});

// Tab navigation
document.querySelectorAll('.sidebar-nav li[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-nav li').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        const targetPane = document.getElementById(`tab-${tabId}`);
        if (targetPane) targetPane.classList.add('active');
        // update page title
        const titles = { overview: 'Enterprise Overview', health: 'Enterprise Health', whatif: 'What-if', inventory: 'Inventory', space: 'Space', power: 'Power', cooling: 'Cooling', connectivity: 'Connectivity', jobs: 'Lowongan Management', analytics: 'Analytics', settings: 'Settings' };
        document.getElementById('pageTitle').innerText = titles[tabId] || 'Dashboard';
        if (tabId === 'analytics') updateStatsAndCharts();
    });
});

// Clock
function updateClock() { document.getElementById('clock').innerText = new Date().toLocaleTimeString('id-ID'); }
setInterval(updateClock, 1000);
updateClock();

function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }

checkLogin();