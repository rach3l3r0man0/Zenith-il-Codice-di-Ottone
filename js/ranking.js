// Quando il DOM è pronto, avvia il caricamento della classifica
document.addEventListener('DOMContentLoaded', () => {
    caricaClassifica();
});

/**
 * Recupera i dati della classifica dal server e popola la tabella HTML.
 */
function caricaClassifica() {
    // Richiesta GET al file PHP che restituisce il JSON della classifica
    fetch('../php/get_ranking.php')
        .then(response => response.json())
        .then(data => {
            if (data.success){
                const giocatori = data.ranking;
                const maxGiocatori = 7; // Numero massimo di righe da popolare

                // Ciclo per riempire le righe della tabella (da riga 2 a 8, in base all'ID HTML)
                for (let i = 0; i < maxGiocatori; i++){
                    const rigaId = (i + 2).toString();
                    const riga = document.getElementById(rigaId);

                    if (riga) {
                        const celle = riga.getElementsByTagName('td');

                        // Se ci sono dati per questo giocatore, li inseriamo
                        if (giocatori && giocatori[i]) {
                            // Colonna Username
                            celle[1].textContent = giocatori[i].Username || "---";
                            
                            // Colonna Punteggio (se negativo o nullo mette 0)
                            celle[2].textContent = (giocatori[i].PunteggioCalcolato < 0 || !giocatori[i].PunteggioCalcolato) ? "0" : giocatori[i].PunteggioCalcolato; 

                            // Colonna Data: se presente, la formattiamo in stile italiano
                            if (giocatori[i].Achieved_at) {
                                const dataRecord = new Date(giocatori[i].Achieved_at);
                                celle[3].textContent = dataRecord.toLocaleDateString('it-IT');
                            } else {
                                celle[3].textContent = "---";
                            }
                        } else {
                            // Se non ci sono abbastanza giocatori nel DB per riempire la classifica, mettiamo dei segnaposto
                            celle[1].textContent = "---";
                            celle[2].textContent = "---";
                            celle[3].textContent = "---";
                        }
                    }
                }
            } else {
                console.error("Errore nel caricamento dati dal server.");
            }
        })
        .catch(err => {
            console.error("Errore di connessione:", err);
        });
}