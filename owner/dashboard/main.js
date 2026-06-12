// ===========================================
// FILE: main.js
// Fungsi bantuan dan start aplikasi
// ===========================================
function escapeHtml(str) { 
    if (!str) return ''; 
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); 
}

// Jalankan pengecekan login
checkLogin();