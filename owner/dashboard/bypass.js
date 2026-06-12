// ===========================================
// FILE: bypass.js
// Toggle bypass login (localStorage)
// ===========================================
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