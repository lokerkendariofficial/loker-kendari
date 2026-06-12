// ===========================================
// FILE: dataLoader.js
// Fetch CSV dari Google Spreadsheet dan parsing data
// ===========================================
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
                return {
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
            }).filter(j => j.perusahaan !== '');
        }
        updateUI();
    } catch (err) {
        console.error(err);
        document.querySelectorAll('.kpi-value').forEach(el => el.innerText = 'Error');
        document.getElementById('recentJobsTable').innerHTML = '<tr><td colspan="4">Gagal memuat数据</td></tr>';
        document.getElementById('allJobsTable').innerHTML = '<tr><td colspan="7">Error loading</td></tr>';
    }
}