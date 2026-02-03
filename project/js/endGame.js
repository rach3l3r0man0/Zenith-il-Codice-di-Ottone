/**
 * Gestisce la fine del gioco.
 * Nasconde tutti gli elementi di gioco, mostra un messaggio finale
 * ed esegue il logout prima di reindirizzare alla classifica.
 */
function inizializzaEndGame(){
    // Nascondi schermate di introspezione e contenitori di gioco
    const schermataIntro = document.getElementById('schermataIntro');
    schermataIntro.classList.add('nascosto');

    const contenitoreGioco = document.getElementById('contenitoreGioco');
    contenitoreGioco.classList.add('nascosto');

    const stratoGioco = document.getElementById('stratoGioco');
    stratoGioco.classList.add('nascosto');

    // Nascondi tutti i livelli
    const livello1 = document.getElementById('livello1');
    livello1.classList.add('nascosto');

    const livello2 = document.getElementById('livello2');
    livello2.classList.add('nascosto');

    const livello3 = document.getElementById('livello3');
    livello3.classList.add('nascosto');

    // Funzione interna per gestire logout e redirect
    const eseguiLogoutEVaiAlRanking = () => {
        fetch('../php/logout.php') // Chiama il file PHP che salva e distrugge la sessione
            .finally(() => {
                window.location.href = "../web_pages/ranking.html";
            });
    };

    // Usa la transizione dissolvenza se disponibile, altrimenti esegue subito
    if (typeof mostraIntroLivello === 'function') {
        mostraIntroLivello("Gioco completato!", eseguiLogoutEVaiAlRanking);
    } else {
        eseguiLogoutEVaiAlRanking();
    }
}

/**
 * Gestisce la richiesta di iniziare una nuova partita.
 * Mostra un dialog di conferma per resettare i progressi.
 */
function inizializzaNuovaPartita(){
    // Nascondi tutto il resto per mostrare solo il dialog
    document.querySelectorAll('.livello, #schermataIntro, #stratoGioco, #areaInventario')
            .forEach(el => el.classList.add('nascosto'));

    const sfondoNero = document.getElementById('sfondoNero');
    const container = document.getElementById('container');
    const bottoneSi = document.getElementById('bottoneSi');
    const bottoneNo = document.getElementById('bottoneNo');

    if(!sfondoNero || !container || !bottoneSi || !bottoneNo) return;

    // Rendi visibile lo sfondo e il contenitore del dialog
    sfondoNero.classList.remove('nascosto');
    sfondoNero.style.display = 'flex'; // Forza il display flex per centrare
    sfondoNero.style.opacity = '1';
    sfondoNero.style.pointerEvents = 'auto'; // Abilita i click
    
    container.classList.remove('nascosto');

    // Gestione click "Sì" (Reset)
    bottoneSi.onclick = () => {
        // Chiamata al server per resettare il livello nel DB
        fetch('../php/update_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetGame: true })
        })
        .then(response => response.json())
        .then(data => {
            // Pulizia storage locale
            localStorage.clear(); 
            sessionStorage.clear(); // Resetta sessione (opzionale)
            
            // Ricarica la pagina per tornare allo stato iniziale pulito
            window.location.reload(); 
        })
        .catch(err => {
            console.error("Errore durante il reset:", err);
            // Fallback: forza comunque il riavvio locale
            localStorage.clear();
            window.location.reload();
        });
    }

    // Gestione click "No" (Esci/Home)
    bottoneNo.onclick = () => {
        sfondoNero.classList.add('nascosto');
        window.location.href = "../index.html";
    };
}