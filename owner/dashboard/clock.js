// ===========================================
// FILE: clock.js
// Jam digital
// ===========================================
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('id-ID');
}
setInterval(updateClock, 1000);
updateClock();