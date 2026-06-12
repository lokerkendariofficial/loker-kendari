// ===========================================
// FILE: auth.js
// Login check dan show/hide dashboard
// ===========================================
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