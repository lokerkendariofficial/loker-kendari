const ACCESS_CODE = '900900';
const PASSWORD = '900900';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5xtxnptjxh-FIyJuBoCct5vudZFFOeaisUUhT8X0R0kjAkY3f2CtD45CYcZjnPxGh52Og7_AXA756/pub?output=csv';

// Cek login
function checkLogin() {
    const loggedIn = sessionStorage.getItem('owner_logged_in');
    if (loggedIn === 'true') {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('settingsContainer').style.display = 'flex';
        loadSettingsData();
    } else {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('settingsContainer').style.display = 'none';
    }
}

function loadSettingsData() {
    document.getElementById('csvUrlDisplay').innerText = CSV_URL;
    document.getElementById('lastUpdateBadge').innerHTML = `Update: ${new Date().toLocaleString()}`;
}

// Refresh / test koneksi
async function testCsvConnection() {
    try {
        const res = await fetch(CSV_URL);
        if (res.ok) {
            alert('✅ Koneksi ke Google Sheets berhasil! Data siap diambil.');
        } else {
            alert('❌ Gagal terhubung. Periksa URL CSV atau koneksi internet.');
        }
    } catch (err) {
        alert('❌ Error: ' + err.message);
    }
}

function forceRefresh() {
    localStorage.removeItem('owner_jobs_overrides');
    alert('Data lokal telah di-refresh. Kembali ke dashboard untuk melihat perubahan.');
}

function resetAllOverrides() {
    if (confirm('Reset semua perubahan? Data lowongan akan kembali ke CSV asli. Perubahan yang belum dikonfirmasi akan hilang.')) {
        localStorage.removeItem('owner_jobs_overrides');
        alert('Reset berhasil. Silakan refresh dashboard utama.');
    }
}

// Logout
function logout() {
    sessionStorage.removeItem('owner_logged_in');
    window.location.href = '../../index.html'; // redirect ke login dashboard
}

// Redirect ke login
function redirectToLogin() {
    window.location.href = '../../index.html';
}

// Event listeners
document.getElementById('testCsvBtn')?.addEventListener('click', testCsvConnection);
document.getElementById('forceRefreshBtn')?.addEventListener('click', forceRefresh);
document.getElementById('resetLocalStorageBtn')?.addEventListener('click', resetAllOverrides);
document.getElementById('logoutBtn')?.addEventListener('click', logout);
document.getElementById('logoutBtnSidebar')?.addEventListener('click', logout);
document.getElementById('redirectLoginBtn')?.addEventListener('click', redirectToLogin);
document.getElementById('refreshSettingsBtn')?.addEventListener('click', () => {
    loadSettingsData();
    alert('Data settings dimuat ulang.');
});
document.getElementById('editOwnPostingLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Fitur edit postingan sendiri akan dikembangkan lebih lanjut.');
});

// Clock
function updateClock() {
    const clock = document.getElementById('clock');
    if (clock) clock.innerText = new Date().toLocaleTimeString('id-ID');
}
setInterval(updateClock, 1000);
updateClock();

// Start
checkLogin();