// ===========================================
// FILE: tabNav.js
// Navigasi antar tab (sidebar)
// ===========================================
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