// Konstanta login
const ACCESS_CODE = '900900';
const PASSWORD = '900900';

// URL CSV (sama dengan website utama)
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5xtxnptjxh-FIyJuBoCct5vudZFFOeaisUUhT8X0R0kjAkY3f2CtD45CYcZjnPxGh52Og7_AXA756/pub?output=csv';

let jobsRawData = []; // menyimpan data asli dari CSV

// Cek apakah sudah login (sessionStorage)
function checkLogin() {
    const loggedIn = sessionStorage.getItem('owner_logged_in');
    if (loggedIn === 'true') {
        showDashboard();
        loadDashboardData();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('dashboardContainer').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'block';
}

// Event login
document.getElementById('loginBtn').addEventListener('click', () => {
    const code = document.getElementById('aksesCode').value.trim();
    const pwd = document.getElementById('password').value.trim();
    if (code === ACCESS_CODE && pwd === PASSWORD) {
        sessionStorage.setItem('owner_logged_in', 'true');
        showDashboard();
        loadDashboardData();
        document.getElementById('loginError').innerText = '';
    } else {
        document.getElementById('loginError').innerText = 'Kode atau sandi salah!';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('owner_logged_in');
    showLogin();
    document.getElementById('aksesCode').value = '';
    document.getElementById('password').value = '';
});

// Refresh manual
document.getElementById('refreshBtn').addEventListener('click', () => {
    loadDashboardData();
});

// Ambil data dari CSV dan render dashboard
async function loadDashboardData() {
    const statsGrid = document.getElementById('statsGrid');
    const tableBody = document.getElementById('jobsTableBody');
    const lastUpdateSpan = document.getElementById('lastUpdate');
    
    // Tampilkan loading
    statsGrid.innerHTML = '<div class="stat-card">Memuat statistik...</div>';
    tableBody.innerHTML = '<tr><td colspan="7">Memuat data...</td></tr>';
    
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Gagal fetch CSV');
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim() !== '');
        if (rows.length < 2) {
            statsGrid.innerHTML = '<div class="stat-card">Belum ada data lowongan.</div>';
            tableBody.innerHTML = '<tr><td colspan="7">Tidak ada lowongan.</td></tr>';
            lastUpdateSpan.innerText = `Terakhir: ${new Date().toLocaleString()}`;
            return;
        }
        
        // Parse header
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const colIdx = {
            timestamp: headers.findIndex(h => h.includes('timestamp')),
            email: headers.findIndex(h => h.includes('email')),
            perusahaan: headers.findIndex(h => h.includes('nama perusahaan') || h.includes('perusahaan')),
            posisi: headers.findIndex(h => h.includes('posisi') || h.includes('judul')),
            lokasi: headers.findIndex(h => h.includes('lokasi')),
            deskripsi: headers.findIndex(h => h.includes('deskripsi')),
            gaji: headers.findIndex(h => h.includes('gaji') || h.includes('sistem')),
            deadline: headers.findIndex(h => h.includes('deadline') || h.includes('batas'))
        };
        
        // Proses baris data
        jobsRawData = rows.slice(1).map(row => {
            // Split sederhana (asumsi tidak ada koma dalam kutipan)
            const cols = row.split(',');
            return {
                timestamp: (colIdx.timestamp !== -1 && cols[colIdx.timestamp]) ? cols[colIdx.timestamp].trim() : '',
                email: (colIdx.email !== -1 && cols[colIdx.email]) ? cols[colIdx.email].trim() : '',
                perusahaan: (colIdx.perusahaan !== -1 && cols[colIdx.perusahaan]) ? cols[colIdx.perusahaan].trim() : '',
                posisi: (colIdx.posisi !== -1 && cols[colIdx.posisi]) ? cols[colIdx.posisi].trim() : '',
                lokasi: (colIdx.lokasi !== -1 && cols[colIdx.lokasi]) ? cols[colIdx.lokasi].trim() : '',
                deskripsi: (colIdx.deskripsi !== -1 && cols[colIdx.deskripsi]) ? cols[colIdx.deskripsi].trim() : '',
                gaji: (colIdx.gaji !== -1 && cols[colIdx.gaji]) ? cols[colIdx.gaji].trim() : '',
                deadline: (colIdx.deadline !== -1 && cols[colIdx.deadline]) ? cols[colIdx.deadline].trim() : ''
            };
        }).filter(item => item.perusahaan !== ''); // minimal ada nama perusahaan
        
        // Hitung statistik
        const totalJobs = jobsRawData.length;
        const uniqueCompanies = [...new Set(jobsRawData.map(j => j.perusahaan))].length;
        // Hitung berdasarkan lokasi (sederhana)
        const lokasiCount = {};
        jobsRawData.forEach(j => {
            const loc = j.lokasi || 'Tidak diketahui';
            lokasiCount[loc] = (lokasiCount[loc] || 0) + 1;
        });
        const topLocation = Object.entries(lokasiCount).sort((a,b) => b[1] - a[1])[0];
        
        // Render statistik
        statsGrid.innerHTML = `
            <div class="stat-card"><h3>📢 Total Lowongan</h3><div class="number">${totalJobs}</div></div>
            <div class="stat-card"><h3>🏢 Perusahaan Unik</h3><div class="number">${uniqueCompanies}</div></div>
            <div class="stat-card"><h3>📍 Lokasi Terbanyak</h3><div class="number">${topLocation ? topLocation[0] : '-'}</div><div style="font-size:0.8rem;">${topLocation ? topLocation[1] + ' lowongan' : ''}</div></div>
            <div class="stat-card"><h3>🕒 Update Terakhir</h3><div class="number" style="font-size:1.2rem;">${new Date().toLocaleTimeString()}</div></div>
        `;
        
        // Render tabel
        if (totalJobs === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">Tidak ada data lowongan.</td></tr>';
        } else {
            tableBody.innerHTML = jobsRawData.map(job => `
                <tr>
                    <td>${escapeHtml(job.timestamp)}</td>
                    <td>${escapeHtml(job.email)}</td>
                    <td>${escapeHtml(job.perusahaan)}</td>
                    <td>${escapeHtml(job.posisi)}</td>
                    <td>${escapeHtml(job.lokasi)}</td>
                    <td><span style="background:#28a745; color:white; padding:2px 8px; border-radius:12px; font-size:0.7rem;">Published</span></td>
                    <td><button class="view-btn" data-index="${jobsRawData.indexOf(job)}">👁️ Lihat</button></td>
                </tr>
            `).join('');
            
            // Tambahkan event listener untuk tombol Lihat (detail sederhana)
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    const job = jobsRawData[idx];
                    alert(`Detail Lowongan:\n\nPerusahaan: ${job.perusahaan}\nPosisi: ${job.posisi}\nLokasi: ${job.lokasi}\nDeskripsi: ${job.deskripsi.substring(0, 200)}...\nEmail: ${job.email}\nDeadline: ${job.deadline}`);
                });
            });
        }
        
        lastUpdateSpan.innerText = `Data terakhir: ${new Date().toLocaleString()}`;
        
    } catch (error) {
        console.error(error);
        statsGrid.innerHTML = '<div class="stat-card">❌ Gagal memuat data. Periksa koneksi/URL CSV.</div>';
        tableBody.innerHTML = '<tr><td colspan="7">Error memuat data</td></tr>';
        lastUpdateSpan.innerText = `Gagal update: ${new Date().toLocaleString()}`;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Inisialisasi
checkLogin();