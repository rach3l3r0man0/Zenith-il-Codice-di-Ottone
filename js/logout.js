/**
 * Gestisce il logout senza usare async/await.
 * Tenta di inviare il tempo accumulato, poi chiude la sessione e pulisce lo storage.
 */
function doLogout() {
    const flush = (typeof flushTempoGioco === 'function') ? flushTempoGioco('logout') : Promise.resolve();

    flush
        .catch((e) => console.warn('Flush tempo durante logout fallito:', e))
        .finally(() => {
            fetch('../php/logout.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            .catch(err => console.error('Logout error:', err))
            .finally(() => {
                // Pulizia lato client: rimuove i dati di sessione (es. username)
                try { sessionStorage.clear(); } catch(e){}
                
                // Pulizia localStorage: rimuove lo stato del gioco salvato e username persistente
                try { 
                    localStorage.removeItem('gameState'); 
                    localStorage.removeItem('username'); 
                } catch(e){}
                
                // Reindirizzamento alla pagina iniziale (Index)
                window.location.href = '../index.html';
            });
        });
}

// Associa la funzione doLogout al click del bottone 'bottoneLogout' quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('bottoneLogout');
    if (btn) btn.addEventListener('click', doLogout);
});
