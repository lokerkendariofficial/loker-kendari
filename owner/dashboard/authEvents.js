// ===========================================
// FILE: authEvents.js
// Event listener login, logout, refresh
// ===========================================
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

function logout() {
    sessionStorage.removeItem('owner_logged_in');
    showLogin();
}

document.getElementById('logoutBtnHeader')?.addEventListener('click', logout);
document.getElementById('logoutBtnSidebar')?.addEventListener('click', logout);
document.getElementById('refreshBtn')?.addEventListener('click', () => loadAllData());
document.getElementById('forceRefreshBtn')?.addEventListener('click', () => loadAllData());