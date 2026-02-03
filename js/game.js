/**
 * SistemaDialogo
 * Modulo per la gestione dei dialoghi di gioco (testo a macchina da scrivere).
 * Gestisce la visualizzazione, la digitazione progressiva e l'interazione utente.
 */
const SistemaDialogo = {
    elementi: { finestra: null, parlante: null, testo: null, bottone: null },
    intervalloScrittura: null,   // Riferimento al timer per l'effetto scrittura

    // Inizializza i riferimenti agli elementi DOM necessari
    inizializza() {
        this.elementi.finestra = document.getElementById('finestraDialogo');
        this.elementi.parlante = document.getElementById('parlanteDialogo');
        this.elementi.testo = document.getElementById('testoDialogo');
        this.elementi.bottone = document.getElementById('bottoneAvantiDialogo');
        if(this.elementi.bottone) this.elementi.bottone.style.display = 'none';
    },

    // Mostra un dialogo: imposta il parlante e avvia l'animazione del testo
    show(nomeParlante, contenuto, callbackFine = null) {
        if (!this.elementi.finestra) this.inizializza();
        
        // Mostra il contenitore e imposta il nome
        this.elementi.finestra.classList.remove('nascosto');
        this.elementi.parlante.textContent = nomeParlante;
        this.elementi.testo.textContent = ""; // Pulisce il testo precedente
        this.elementi.bottone.style.display = 'none'; // Nasconde il tasto avanti finché non finisce di scrivere
        
        // Reset eventuale scrittura precedente in corso per evitare sovrapposizioni
        if (this.intervalloScrittura) clearInterval(this.intervalloScrittura);

        let i = 0;
        // Effetto macchina da scrivere: aggiunge un carattere ogni 25ms
        this.intervalloScrittura = setInterval(() => {
            this.elementi.testo.textContent += contenuto.charAt(i);
            i++;
            // Se il testo è finito, ferma il timer e abilita l'avanzamento
            if (i >= contenuto.length) {
                this.completaTesto(contenuto, callbackFine);
            }
        }, 25);
        
        // Se l'utente clicca sul box mentre scrive, completa subito il testo (skip)
        this.elementi.finestra.onclick = () => this.completaTesto(contenuto, callbackFine);
    },

    // Completa istantaneamente la scrittura del testo (funzione di skip o fine naturale)
    completaTesto(contenuto, callback) {
        if (this.intervalloScrittura) {
            clearInterval(this.intervalloScrittura);
            this.intervalloScrittura = null;
        }
        this.elementi.testo.textContent = contenuto; // Mostra tutto il testo immediatamente
        this.elementi.finestra.onclick = null; // Rimuove listener di salto rapido
        this.abilitaBottoneAvanti(callback); // Abilita il pulsante per procedere
    },

    // Attiva il pulsante per chiudere il dialogo o procedere alla prossima azione
    abilitaBottoneAvanti(callback) {
        this.elementi.bottone.style.display = 'block';
        // Clona il bottone per rimuovere vecchi event listener accumulati (pulizia eventi)
        const nuovoBottone = this.elementi.bottone.cloneNode(true);
        this.elementi.bottone.parentNode.replaceChild(nuovoBottone, this.elementi.bottone);
        this.elementi.bottone = nuovoBottone;
        
        // Al click, nasconde il dialogo ed esegue l'eventuale callback successiva
        this.elementi.bottone.addEventListener('click', () => {
            this.elementi.finestra.classList.add('nascosto');
            if (typeof callback === 'function') callback();
        });
    }
};

/**
 * Genera una chiave univoca per il LocalStorage/SessionStorage basata sull'utente corrente.
 * Funzione usata per evitare conflitti se più utenti giocano sullo stesso browser.
 */
function getUserKey(key) {
    const user = sessionStorage.getItem('username') || 'Ingegnere';
    return `${user}_${key}`;
}


// Testo introduttivo della trama per la prima schermata
const contenutoTestoIntro = `Diario di bordo. 
Giorno 12.042 dall'Ascensione.

Se stai leggendo questo messaggio, il sistema biometrico ti ha riconosciuto.
Io sono Ettore Meucci.

Il Sindaco è impazzito. Vuole drenare il Nucleo.
Ho sigillato la Torre. Ho rotto la sequenza.

Tocca a te, collega.
Trova i miei appunti. Ricalibra il sistema.
Salva Zenith.`;

/**
 * Gestisce l'animazione iniziale e la visualizzazione della lettera introduttiva.
 * Viene chiamata solo se l'utente è al "Livello 0" (nuova partita).
 */
function inizializzaLettera(){
    const sfondoNero = document.getElementById('sfondoNero');
    if (sfondoNero) {
        // Reset stato visivo per preparare la dissolvenza
        sfondoNero.style.opacity = '1';
        sfondoNero.replaceChildren();
        sfondoNero.classList.remove('nascosto');

        // Effetto dissolvenza iniziale
        setTimeout(() => { 
            sfondoNero.style.opacity = '0'; 
        }, 1000);
        
        // Nasconde completamente l'elemento dopo la dissolvenza e ripristina per usi futuri
        setTimeout(() => { 
            sfondoNero.classList.add('nascosto');
            sfondoNero.replaceChildren();
            sfondoNero.style.opacity = '1';
        }, 2500);
    }
    
    const bottoneAvvio = document.getElementById('bottoneAvvio');

    // Avvia la scrittura del testo diario con un ritardo di 2 secondi
    setTimeout(() => {
        effettoScrittura(contenutoTestoIntro, 40, () => {
            // Mostra il pulsante "INIZIALIZZA SISTEMA" solo quando il testo è completo
            bottoneAvvio.classList.remove("nascosto");
        }); 
    }, 2000);

    // Gestione click avvio gioco
    bottoneAvvio.addEventListener("click", () => {
        // Salvataggio sul server: l'utente passa al livello 1
        flushTempoGioco('level-up')
            .finally(() => {
                fetch('../php/update_user.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newLevel: 1 })
                }).catch(e => console.error("Errore update level 1:", e));
            });

        console.log("Start button clicked. Calling initLevel1...");
        try {
            // Avvia la logica del primo livello (definita in firstLevel.js)
            if (typeof inizializzaLivello1 === 'function') {
                inizializzaLivello1();
            } else {
                console.error("inizializzaLivello1 function is not defined!");
                alert("Errore: Funzione del livello 1 non trovata. Controlla la console.");
            }
        } catch (e) {
            console.error("Error executing inizializzaLivello1:", e);
        }
    });
}

/**
 * Funzione ricorsiva per l'effetto macchina da scrivere su un elemento specifico.
 * La variabile 'testo' contiene il testo completo da scrivere.
 * La variabile 'velocita' serve per dire alla funzione la velocità, in ms, con la quale mostrare il prossimo carattere.
 * La variabile 'funzioneCallback' contiene il nome della funzione da chiamare al completamento.
 */
function effettoScrittura(testo, velocita, funzioneCallback) {
    const testoIntro = document.getElementById('testoIntro');
    let i = 0;
    testoIntro.textContent = " ";
    
    // Funzione interna che scrive un carattere e si richiama
    function scrivi() {
        if (i < testo.length) {
            testoIntro.textContent += testo.charAt(i);
            i++;
            // Prossimo carattere dopo 'velocita' ms
            setTimeout(scrivi, velocita);
        } else {
            // Fine testo, esegue eventuale azione successiva
            if (funzioneCallback) funzioneCallback();
        }
    }
    scrivi();
}

/**
 * Gestisce l'overlay di transizione tra i livelli (schermo nero con titolo).
 * Crea un'animazione di fade-in/fade-out per il titolo e lo sfondo.
 * La variabile 'titoloTesto' contiene il testo da mostrare al centro (es. "Livello 2").
 * La variabile 'callbackSuccessiva' contiene il nome della funzione che inizializza il livello successivo.
 */
function mostraIntroLivello(titoloTesto, callbackSuccessiva){
    const sfondoNero = document.getElementById('sfondoNero');
    if (!sfondoNero) {
        if (callbackSuccessiva) callbackSuccessiva();
        return;
    }

    // Reset proprietà CSS per garantire l'avvio pulito dell'animazione
    sfondoNero.replaceChildren();
    sfondoNero.classList.remove('nascosto');
    sfondoNero.classList.add('overlayDissolvenza');
    sfondoNero.style.opacity = '0';
    sfondoNero.style.display = 'flex';

    //creo il titolo che si vedrà al centro dello sfondo
    const titolo = document.createElement('h1');
    titolo.id = 'titoloGioco';
    titolo.textContent = titoloTesto;
    titolo.style.opacity = '0';
    sfondoNero.appendChild(titolo);

    // 1) Comparire con dissolvenza sfondo nero per 1 secondo
    sfondoNero.style.opacity = '1';

    setTimeout(() => {
        // 2) Far apparire la scritta titolo per 2 secondi (dissolvenza in entrata)
        titolo.style.opacity = '1';

        // Attesa: 1s fade-in + 2s lettura = 3000ms
        setTimeout(() => {
            // 3) Rimuovere la scritta con dissolvenza
            titolo.style.opacity = '0';

            // "Dopo un altro secondo" (dopo che è sparita completamene la scritta)
            // Attesa: 1s fade-out + 1s vuoto = 2000ms
            setTimeout(() => {
                // 4) Togliere lo sfondoNero con dissolvenza
                sfondoNero.style.opacity = '0';
                
                // Far comparire il livello (callback)
                if (callbackSuccessiva) callbackSuccessiva();

                // Pulizia finale elemento DOM
                setTimeout(() => {
                    sfondoNero.classList.add('nascosto');
                    sfondoNero.style.display = 'none'; 
                    sfondoNero.replaceChildren();
                    sfondoNero.style.opacity = '1'; 
                }, 1000); // tempo dissolvenza sfondo

            }, 2000); 

        }, 3000); 

    }, 1000);
}

/**
 * Recupera i dati dell'inventario dal server e aggiorna l'interfaccia.
 * Modifica il testo per mostrare "Ingranaggi: X" o "Inventario vuoto".
 */
function caricaDatiInventario() {
    const testoInventario = document.getElementById('testoInventario');
    // Feedback visivo immediato di caricamento
    if (testoInventario) testoInventario.textContent = "Caricamento...";

    fetch('../php/get_user.php')
        .then(response => response.json())
        .then(data => {
            if (testoInventario) {
                // Se i dati sono validi e contengono 'totGear', aggiorna il testo
                const numeroIngranaggi = (data && data.success && typeof data.totGear !== 'undefined') ? data.totGear : 0;
                testoInventario.textContent = (numeroIngranaggi > 0) ? "Ingranaggi: " + numeroIngranaggi : "Inventario vuoto";
            }
        })
        .catch(err => {
            console.error("Errore inventario:", err);
            if (testoInventario) testoInventario.textContent = "Errore dati.";
        });
}

/**
 * Gestisce il ciclo di apparizione dei "luccichii" interattivi (ingranaggi da raccogliere).
 * Funziona ricorsivamente con un timer casuale.
 * La variabile 'contenitore' serve per dire alla funzione l'elemento DOM del livello corrente.
 * La varibile 'luccichiiLivello' è un array di oggetti luccichio/coordinate.
 */
function avviaCicloLuccichiiInteract(contenitore, luccichiiLivello) {
    // Controllo se ci sono ancora ingranaggi da raccogliere
    const disponibili = luccichiiLivello.filter(l => l.raccolto === false);

    if (disponibili.length === 0){
        return; // Tutti raccolti, stop ciclo.
    }

    // Calcola un ritardo casuale (1s - 2.5s) per il prossimo luccichio
    const tempoRandom = Math.random() * 1500 + 1000;

    timerCicloLuccichii = setTimeout(() => {
        // Verifica se il livello è ancora attivo (l'utente potrebbe aver cambiato schermata)
        if (contenitore.classList.contains('nascosto')){ 
            return;
        }

        // Secondo controllo stato luccichii (l'utente potrebbe averne raccolto uno nel frattempo)
        const ancoraDisponibili = luccichiiLivello.filter(l => l.raccolto === false);
        if (ancoraDisponibili.length === 0) {
             return;
        }

        // Seleziona un luccichio casuale tra quelli disponibili
        const luccichioScelto = ancoraDisponibili[Math.floor(Math.random() * ancoraDisponibili.length)];
        
        // Crea l'elemento visivo se non è stato raccolto nel frattempo
        if(luccichioScelto && !luccichioScelto.raccolto) {
            creaLuccichioCliccabile(contenitore, luccichioScelto);
        }
        
        // RICHITAMATA RICORSIVA: pianifica il prossimo tentativo
        avviaCicloLuccichiiInteract(contenitore, luccichiiLivello);
    }, tempoRandom);
}

/**
 * Renderizza un luccichio nel DOM e attacca i listener per la raccolta.
 * La variabile 'contenitore' contiene l'elemento padre.
 * La variabile 'datiLuccichio' è un oggetto contenente i dati del luccichio.
 */
function creaLuccichioCliccabile(contenitore, datiLuccichio) {
    // Evita di creare duplicati dello stesso oggetto se già presente in scena
    if (contenitore.querySelector(`.luccichio[data-id="${datiLuccichio.id}"]`)) {
        return;
    }

    // Creazione elemento visuale
    const luccichio = document.createElement('div');
    luccichio.dataset.id = datiLuccichio.id;
    luccichio.classList.add('luccichio'); // Classe CSS per animazione
    luccichio.style.top = datiLuccichio.top;
    luccichio.style.left = datiLuccichio.left;

    // Timer di "vita" del luccichio: sparisce dopo 2 secondi se non cliccato
    const timerAutodistruzione = setTimeout(() => {
        // Controlla se esiste ancora nel DOM prima di rimuovere
        if (luccichio && luccichio.parentNode) {
            luccichio.remove();
        }
    }, 2000);

    // Gestione CLICK (Raccolta)
    luccichio.onclick = function() {
        if (datiLuccichio.raccolto) return; // Evita click doppi/multipli

        clearTimeout(timerAutodistruzione); // Ferma la sparizione
        console.log("Preso luccichio ID:", datiLuccichio.id, ", di livello:", contenitore.id);
        
        // Effetto grafico "+1 Ingranaggio" e feedback visivo immediato
        const feedback = document.createElement('div');
        feedback.textContent = "+1 Ingranaggio";
        feedback.classList.add('feedback-raccolta');
        feedback.style.top = datiLuccichio.top;
        feedback.style.left = datiLuccichio.left;
        contenitore.appendChild(feedback);
        
        // Rimuove feedback dopo animazione entrata/uscita
        setTimeout(() => {
            feedback.remove();
        }, 1500);

        // Identifica ID numerico del livello per DB
        let idLivello = 1;
        if(contenitore.id === 'livello2') idLivello = 2;
        if(contenitore.id === 'livello3') idLivello = 3;

        // Chiamata AJAX asincrona per salvare la raccolta
        fetch('../php/update_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                addGear: true, 
                sparkleCollected: true,
                sparkleId: datiLuccichio.id,
                levelId: idLivello
            })
        }).catch(err => console.error("Errore salvataggio gear:", err));

        // Aggiorna stato locale e pulisce UI
        datiLuccichio.raccolto = true;
        const duplicati = contenitore.querySelectorAll(`.luccichio[data-id="${datiLuccichio.id}"]`);
        duplicati.forEach(el => el.remove());
    };

    // Aggiunge al DOM
    contenitore.appendChild(luccichio);
}

let timerPartita = null;           // Timer locale che conta i secondi giocati
let timerFlushTempo = null;        // Timer periodico per inviare il tempo al server
let tempoLocaleAccum = 0;          // Tempo accumulato in secondi non ancora inviato

/**
 * Invia al server il tempo accumulato (se > 0) e azzera il contatore locale.
 * Viene usato su trigger manuali (logout, cambio livello) e ogni 10s.
 */
function flushTempoGioco(motivo = 'flush') {
    if (!tempoLocaleAccum) return Promise.resolve();

    const daInviare = tempoLocaleAccum;
    tempoLocaleAccum = 0;

    return fetch('../php/update_user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addTime: daInviare, motivo })
    })
    .then(r => r.json())
    .catch(err => {
        console.error('Errore flush tempo:', err);
        // Ri-accumula se fallisce, per non perdere i secondi
        tempoLocaleAccum += daInviare;
    });
}
// Espone la funzione globalmente per altri moduli (es. logout, livelli)
window.flushTempoGioco = flushTempoGioco;

/**
 * Avvia un timer locale che conteggia i secondi giocati senza chiamare il server.
 * L'invio al DB avviene ogni 10s, su cambio livello e su logout.
 */
function avviaTrackerTempo() {
    if (timerPartita) clearInterval(timerPartita);
    if (timerFlushTempo) clearInterval(timerFlushTempo);

    // Conta localmente ogni secondo
    timerPartita = setInterval(() => {
        tempoLocaleAccum += 1;
    }, 1000);

    // Flush ogni 10 secondi (se c'è qualcosa da inviare)
    timerFlushTempo = setInterval(() => {
        flushTempoGioco('interval');
    }, 30000);
}

/**
 * Inizializzazione principale al caricamento della pagina.
 * Gestisce l'apertura dell'inventario e carica lo stato salvato (livello currente).
 */
document.addEventListener("DOMContentLoaded", () => {
    const bottoneInventario = document.getElementById('inventario');
    const areaInventario = document.getElementById('areaInventario');
    const bottoneChiusura = document.getElementById('tornaIndietro');

    /**
     * Crea (se mancante) e restituisce l'overlay che blocca ogni click sul resto del gioco
     * quando l'inventario è aperto.
     */
    function ottieniOverlayInventario(){
        let overlay = document.getElementById('overlayInventario');
        if(!overlay){
            overlay = document.createElement('div');
            overlay.id = 'overlayInventario';
            // Cliccando sull'overlay si chiude l'inventario
            overlay.addEventListener('click', chiudiInventario);
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    function apriInventario(){
        if(!areaInventario) return;
        const overlay = ottieniOverlayInventario();
        overlay.style.display = 'block';
        areaInventario.classList.remove('nascosto');
        // porta l'inventario sopra l'overlay
        areaInventario.style.zIndex = '10000';
        caricaDatiInventario();
    }

    function chiudiInventario(){
        if(!areaInventario) return;
        areaInventario.classList.add('nascosto');
        areaInventario.style.zIndex = '';
        const overlay = document.getElementById('overlayInventario');
        if (overlay) overlay.style.display = 'none';
    }

    // Gestione apertura pannello inventario
    if (bottoneInventario && areaInventario) {
        bottoneInventario.classList.remove('nascosto');
        bottoneInventario.addEventListener('click', apriInventario);
    }

    // Gestione chiusura pannello inventario
    if (bottoneChiusura && areaInventario) {
        bottoneChiusura.addEventListener('click', chiudiInventario);
    }

    // Recupera lo stato dell'utente (livello corrente) per ripristinare la partita
    fetch('../php/get_user.php', { credentials: 'same-origin' })
        .then(response => response.json())
        .then(data => {
            let livelloCorrente = 0;
            if (data && data.success && data.currentLevel) {
                livelloCorrente = data.currentLevel;
            }

            // Carica la funzione di inizializzazione corretta in base al livello
            switch(livelloCorrente) {
                case 1:
                    if (typeof inizializzaLivello1 === 'function') 
                        inizializzaLivello1();
                    break;
                case 2:
                    if (typeof inizializzaLivello2 === 'function') 
                        inizializzaLivello2();
                    break;
                case 3:
                    if (typeof inizializzaLivello3 === 'function') 
                        inizializzaLivello3();
                    break;
                case 4:
                    // Livello 4 indica gioco completato, offre il reset
                    if (typeof inizializzaNuovaPartita === 'function') 
                        inizializzaNuovaPartita();
                    break;
                default:
                    // Livello 0: Mostra intro narrativa
                    inizializzaLettera();
                    break;
            }
        })
        .catch(err => {
            console.warn('Impossibile recuperare dati dal server:', err);
            // Se il server fallisce parte dall'inizio
            inizializzaLettera();
        });
        
    // Avvia il conteggio del tempo in background
    avviaTrackerTempo();
});