let livello3Completato = false;
let dialogoApparso3 = false;

/**
 * Classe NucleoTorre. 
 * Gestisce la logica del puzzle finale "Il Nucleo".
 * L'obiettivo è collegare la 'fonte' (ingranaggio di partenza) alla 'destinazione' (ingranaggio finale)
 * posizionando degli ingranaggi intermedi sulla griglia.
 * 
 * MECCANICA:
 * - Gli ingranaggi ruotano trasmettendo il movimento ai vicini.
 * - Due ingranaggi adiacenti ruotano sempre in direzioni opposte (Orario <-> Antiorario).
 */
class NucleoTorre {
    /**
     * Costruttore: Inizializza i riferimenti al DOM e le impostazioni base della griglia.
     */
    constructor() {
        // Elementi dell'interfaccia utente
        this.contenitore = document.getElementById('contenitoreNucleoTorre');
        this.grigliaElemento = document.getElementById('grigliaIngranaggi');
        this.bottoneAvvio = document.getElementById('bottoneAttivaNucleo');
        this.displayIngranaggi = document.getElementById('numIngranaggi');
        this.messaggioErrore = document.getElementById('messaggioErroreNucleo');
        
        // Dimensioni della griglia di gioco (5 x 6)
        this.righe = 5;
        this.colonne = 6;
        
        // Posizione degli ingranaggi fissi
        this.fonte = { riga: 0, colonna: 0 };    // Punto di partenza (prima riga, prima colonna)
        this.destinazione = { riga: 4, colonna: 5 }; // Punto di arrivo (ultima riga, ultima colonna)
        
        // Binding dei metodi per mantenere il contesto 'this' nei listener
        this.gestisciClickCella = this.gestisciClickCella.bind(this);
        this.avviaSimulazione = this.avviaSimulazione.bind(this);
    }

    /**
     * Inizializza il livello.
     * La variabile 'numeroIngranaggi' contiene il numero di ingranaggi disponibili nell'inventario.
     */
    inizializza(numeroIngranaggi) {
        // Resetta l'HTML della griglia
        this.grigliaElemento.replaceChildren();
        this.grigliaDati = []; // Matrice logica di stato
        this.messaggioErrore.classList.add('nascosto');
        this.inEsecuzione = false; 
        
        // Setup Inventario
        this.inventarioMax = 8; // Numero massimo teorico (di default)
        this.inventario = numeroIngranaggi;
        
        // Reset stato bottone
        this.bottoneAvvio.textContent = "AVVIA SISTEMA"; 
        this.bottoneAvvio.style.background = "";
        this.grigliaElemento.style.pointerEvents = 'auto'; // Abilita click

        // Costruzione della griglia
        for (let r = 0; r < this.righe; r++) {
            const rigaDati = [];
            for (let c = 0; c < this.colonne; c++) {
                // Creazione elemento HTML cella
                const cella = document.createElement('div');
                cella.classList.add('cellaGriglia');
                cella.dataset.riga = r;
                cella.dataset.colonna = c;
                
                // Aggiunge listener per il click (posizionamento ingranaggio)
                cella.onclick = () => this.gestisciClickCella(r, c);
                
                this.grigliaElemento.appendChild(cella);

                // Determina il tipo di cella (fonte, destinazione o vuoto)
                let tipo = 'vuoto';
                if (r === this.fonte.riga && c === this.fonte.colonna) tipo = 'fonte';
                else if (r === this.destinazione.riga && c === this.destinazione.colonna) tipo = 'destinazione';
                
                // Salva lo stato della cella nella matrice
                rigaDati.push({
                    tipo: tipo,
                    dom: cella,
                    rotazione: 0 // 0: fermo, 1: orario, -1: antiorario
                });
            }
            this.grigliaDati.push(rigaDati);
        }

        // Recupero salvataggio (statoNucleo) se l'utente ha ricaricato la pagina
        if (window.statoNucleo && Array.isArray(window.statoNucleo)) {
            window.statoNucleo.forEach(posizione => {
                // Controllo validità coordinate
                if(this.inventario > 0 && 
                   posizione.riga >= 0 && posizione.riga < this.righe && 
                   posizione.colonna >= 0 && posizione.colonna < this.colonne) {
                    
                    const cella = this.grigliaDati[posizione.riga][posizione.colonna];
                    // Se la cella è vuota, piazza l'ingranaggio
                    if (cella.tipo === 'vuoto') {
                        cella.tipo = 'giocatore';
                        this.inventario--;
                    }
                }
            });
        }

        // Disegna lo stato iniziale
        this.renderizza();

        // Collega il tasto di avvio
        this.bottoneAvvio.removeEventListener('click', this.avviaSimulazione);
        this.bottoneAvvio.addEventListener('click', this.avviaSimulazione);
    }

    /**
     * Aggiorna la vista HTML in base allo stato logico della griglia.
     * Gestisce le classi CSS per visualizzare ingranaggi e rotazioni.
     */
    renderizza() {
        // Aggiorna contatore inventario
        if(this.displayIngranaggi) {
            this.displayIngranaggi.textContent = `${this.inventario} / ${this.inventarioMax}`;
        }
        
        for (let r = 0; r < this.righe; r++) {
            for (let c = 0; c < this.colonne; c++) {
                const cellaDati = this.grigliaDati[r][c];
                const cellaDom = cellaDati.dom;
                cellaDom.replaceChildren(); // Pulisce contenuto cella

                // Se c'è qualcosa nella cella, crea l'ingranaggio visivo
                if (cellaDati.tipo !== 'vuoto') {
                    const ingranaggioDiv = document.createElement('div');
                    ingranaggioDiv.classList.add('ingranaggio');
                    
                    // Assegna classe specifica per colore/tipo
                    if (cellaDati.tipo === 'fonte') ingranaggioDiv.classList.add('ing-fonte');
                    else if (cellaDati.tipo === 'destinazione') ingranaggioDiv.classList.add('ing-target'); // mantengo classe css target
                    else if (cellaDati.tipo === 'giocatore') ingranaggioDiv.classList.add('ing-player'); // css player

                    // Applica animazione rotazione se attiva
                    if (cellaDati.rotazione === 1) ingranaggioDiv.classList.add('ruota-cw'); // in senso orario
                    else if (cellaDati.rotazione === -1) ingranaggioDiv.classList.add('ruota-ccw'); // in senso antiorario
                    else if (cellaDati.rotazione === 999) ingranaggioDiv.classList.add('bloccato'); // Errore

                    cellaDom.appendChild(ingranaggioDiv);
                }
            }
        }
    }
    
    /**
     * Gestisce il click su una cella della griglia.
     * Aggiunge o rimuove un ingranaggio se possibile.
     */
    gestisciClickCella(riga, colonna) {
        // Non si può modificare mentre la simulazione gira
        if (this.inEsecuzione) return;

        const cella = this.grigliaDati[riga][colonna];
        
        // Non si possono rimuovere fonte o destinazione
        if (cella.tipo === 'fonte' || cella.tipo === 'destinazione') return;

        // Logica di aggiunta/rimozione
        if (cella.tipo === 'vuoto' && this.inventario > 0) {
            cella.tipo = 'giocatore';
            this.inventario--;
        } else if (cella.tipo === 'giocatore') {
            cella.tipo = 'vuoto';
            this.inventario++;
        }

        // Salva, resetta rotazioni precedenti e aggiorna vista
        this.salvaStato();
        this.reimpostaSimulazione(); 
        this.renderizza();
    }

    /**
     * Ferma tutte le rotazioni e pulisce gli errori.
     */
    reimpostaSimulazione() {
        for (let r = 0; r < this.righe; r++) {
            for (let c = 0; c < this.colonne; c++) {
                this.grigliaDati[r][c].rotazione = 0;
            }
        }
        this.messaggioErrore.classList.add('nascosto');
    }

    /**
     * Motore fisico/logico della simulazione.
     * Usa una visita in ampiezza (BFS) per propagare il movimento dalla fonte.
     */
    avviaSimulazione() {
        this.reimpostaSimulazione();
        this.inEsecuzione = true;
        
        // Coda per BFS: { riga, colonna, direzioneRotazione }
        // 1 = Orcario, -1 = Antiorario
        let coda = [{ riga: this.fonte.riga, colonna: this.fonte.colonna, direzione: 1 }];
        
        // Mappa dei nodi visitati per rilevare cicli e conflitti
        // Chiave: "r-c", Valore: direzione
        let visitati = new Map();
        let erroreConflitto = false;

        while (coda.length > 0) {
            let nodoCorrente = coda.shift(); // Estrae il primo elemento
            let chiave = `${nodoCorrente.riga}-${nodoCorrente.colonna}`;
            let cella = this.grigliaDati[nodoCorrente.riga][nodoCorrente.colonna];

            // Se abbiamo già calcolato questa cella
            if (visitati.has(chiave)) {
                // Se la direzione precedentemente calcolata è DIVERSA da quella attuale
                // significa che due ingranaggi spingono questo in direzioni opposte -> BLOCK
                if (visitati.get(chiave) !== nodoCorrente.direzione) {
                    erroreConflitto = true;
                    cella.rotazione = 999; // Codice speciale per visualizzare errore
                }
                continue;
            }

            // Registra visita e applica rotazione
            visitati.set(chiave, nodoCorrente.direzione);
            cella.rotazione = nodoCorrente.direzione;

            if(erroreConflitto) continue; // Se c'è un errore, non propaghiamo oltre il movimento corretto

            // La rotazione si inverte ad ogni passaggio (ingranaggio vicino gira al contrario)
            let prossimaDirezione = nodoCorrente.direzione * -1;
            
            // Definisce coordinate dei 4 vicini (sopra, sotto, sinistra, destra)
            const vicini = [
                {riga: nodoCorrente.riga - 1, colonna: nodoCorrente.colonna}, 
                {riga: nodoCorrente.riga + 1, colonna: nodoCorrente.colonna},
                {riga: nodoCorrente.riga, colonna: nodoCorrente.colonna - 1}, 
                {riga: nodoCorrente.riga, colonna: nodoCorrente.colonna + 1}
            ];

            vicini.forEach(vicino => {
                // Controllo limiti della griglia
                if (vicino.riga >= 0 && vicino.riga < this.righe && 
                    vicino.colonna >= 0 && vicino.colonna < this.colonne) {
                    
                    // Si propaga SOLO se nella cella vicina c'è un ingranaggio reale
                    if (this.grigliaDati[vicino.riga][vicino.colonna].tipo !== 'vuoto') {
                        coda.push({ 
                            riga: vicino.riga, 
                            colonna: vicino.colonna, 
                            direzione: prossimaDirezione 
                        });
                    }
                }
            });
        }

        // Aggiorna la grafica con le nuove rotazioni
        this.renderizza();

        if (this.timerMessaggio) clearTimeout(this.timerMessaggio);

        // Verifica condizioni di fine partita
        // 1. Conflitto meccanico (ingranaggi bloccati)
        // 2. Destinazione non raggiunta (rotazione = 0)
        let cellaDestinazione = this.grigliaDati[this.destinazione.riga][this.destinazione.colonna];
        
        if (erroreConflitto === true || (cellaDestinazione.rotazione === 0)) {
            // *** FALLIMENTO ***
            const testoErrore = erroreConflitto === true ? "CRITICO: Conflitto meccanico!" : "ENERGIA INSUFFICIENTE";
            
            this.messaggioErrore.textContent = testoErrore;
            this.messaggioErrore.classList.remove('nascosto');
            this.inEsecuzione = false;

            // Disabilita interazioni temporaneamente per mostrare errore
            this.grigliaElemento.style.pointerEvents = 'none';
            this.bottoneAvvio.style.pointerEvents = 'none';
            this.bottoneAvvio.style.opacity = '0.5';

            this.timerMessaggio = setTimeout(() => {
                this.messaggioErrore.classList.add('nascosto');
                this.reimpostaSimulazione();
                this.renderizza();

                // Riabilita
                this.grigliaElemento.style.pointerEvents = 'auto';
                this.bottoneAvvio.style.pointerEvents = 'auto';
                this.bottoneAvvio.style.opacity = '1';
            }, 1500);

        } else {
            // Se non ci sono errori e il target ruota
            this.gestisciVittoria();
        }
    }
    
    /**
     * Azioni da compiere quando il puzzle è risolto.
     */
    gestisciVittoria() {
        this.bottoneAvvio.style.background = '#2e7d32';
        this.bottoneAvvio.textContent = "NUCLEO SINCRONIZZATO";
        this.grigliaElemento.style.pointerEvents = 'none'; // Ferma tutto trionfalmente
        
        // Se è la prima volta che si completa, salva il progresso
        if(livello3Completato === false){
            (typeof flushTempoGioco === 'function' ? flushTempoGioco('level-up') : Promise.resolve())
            .finally(() => {
                fetch('../php/update_user.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ newLevel: 4 }) // Il livello 4 indica la fine del gioco
                })
                .then(response => response.json())
                .then(data => {
                    if (!data.success) {
                        console.warn("Errore salvataggio livello:", data.message);
                    }
                })
                .catch(err => console.error(err));
            });
            
            livello3Completato = true;
        }

        // Aggiornamento livello completato
        setTimeout(() => {
            if(typeof inizializzaEndGame === "function"){
                inizializzaEndGame();
            }
            else{
                // Fallback
                window.location.href = "../index.html"; 
            }
        }, 1500);
    }

    /**
     * Salva nello 'window.statoNucleo' le coordinate degli ingranaggi piazzati dall'utente.
     * Permette di non perdere il layout se si cambia schermata.
     */
    salvaStato() {
        const stato = [];
        for (let r = 0; r < this.righe; r++) {
            for (let c = 0; c < this.colonne; c++) {
                if (this.grigliaDati[r][c].tipo === 'giocatore') {
                    stato.push({riga: r, colonna: c});
                }
            }
        }
        window.statoNucleo = stato;
    }
}

/**
 * Elenco dei punti di interesse (ingranaggi nascosti) nello scenario esplorativo.
 */
const  puntiInteresseLivello3 = [ 
    { top: "80%", left: "30%", id: 1, raccolto: false },
    { top: "95%", left: "90%", id: 2, raccolto: false },
];

/**
 * Funzione di avvio principale del Livello 3.
 * Pulisce la scena dai livelli precedenti e carica lo stato di raccolta degli ingranaggi.
 */
function inizializzaLivello3() {
    const schermataIntro = document.getElementById('schermataIntro');
    schermataIntro.classList.add('nascosto');

    const inventario = document.getElementById('inventario');
    inventario.classList.add('nascosto');

    const contenitoreGioco = document.getElementById('contenitoreGioco');
    contenitoreGioco.classList.remove('nascosto');

    const stratoGioco = document.getElementById('stratoGioco');
    stratoGioco.classList.add('nascosto');

    const livello1 = document.getElementById('livello1');
    livello1.classList.add('nascosto');
    const livello2 = document.getElementById('livello2');
    livello2.classList.add('nascosto');
    const livello3 = document.getElementById('livello3');
    livello3.classList.add('nascosto');

    // Recupera la lista degli ingranaggi già raccolti
    fetch('../php/get_user.php')
    .then(r=>r.json())
    .then(data => {
        if(data.success && data.collectedSparkles){
            const dbRaccolti = data.collectedSparkles
                .filter(s => parseInt(s.Level_ID) === 3)
                .map(s => parseInt(s.Sparkle_ID));
            
            puntiInteresseLivello3.forEach(punto => {
                if (dbRaccolti.includes(punto.id)) {
                    punto.raccolto = true;
                }
            });
        }
    })
    .catch(e => console.error("Errore recupero luccichii:", e));

    if (typeof mostraIntroLivello === 'function') {
        mostraIntroLivello("Il Nucleo", () => {
            inizializzaEsplorazioneLivello3();
        });
    } else {
        inizializzaEsplorazioneLivello3();
    }
}

/**
 * Prepara la scena esplorativa del Nucleo.
 * Qui il giocatore può raccogliere ingranaggi nascosti o interagire con il "Baule" (il puzzle vero e proprio).
 */
function inizializzaEsplorazioneLivello3(){
    // Nasconde puzzle specifico
    const nucleoTorre = document.getElementById('nucleoTorre');
    nucleoTorre.classList.add('nascosto');

    const contenitorenucleoTorre = document.getElementById('contenitoreNucleoTorre');
    contenitorenucleoTorre.classList.add('nascosto');

    // Mostra layer di gioco generale
    const inventario = document.getElementById('inventario');
    inventario.classList.remove('nascosto');

    const contenitoreGioco = document.getElementById('contenitoreGioco');
    contenitoreGioco.classList.remove('nascosto');

    const stratoGioco = document.getElementById('stratoGioco');
    stratoGioco.classList.remove('nascosto');

    const livello3 = document.getElementById('livello3');
    livello3.classList.remove('sfondoBaule');
    livello3.classList.add('sfondoLivello3');
    livello3.classList.remove('nascosto');

    // Avvia sistema luccichii (collezionabili)
    avviaCicloLuccichiiInteract(livello3, puntiInteresseLivello3);

    const bottoneRitorno3 = document.getElementById('bottoneRitorno3');
    bottoneRitorno3.classList.add('nascosto');

    const areaCliccabile = document.getElementById('areaCliccabile3');
    areaCliccabile.classList.remove('nascosto');

    // Crea zone interattive se non esistono
    if (!document.getElementById('areaBaule')) {
        const areaBaule = document.createElement('div');
        areaBaule.id = 'areaBaule';
        areaCliccabile.appendChild(areaBaule);
    }
    
    if (!document.getElementById('areaBotola')) {
        const areaBotola = document.createElement('div');
        areaBotola.id = 'areaBotola';
        areaCliccabile.appendChild(areaBotola);
    }

    const areaBaule = document.getElementById('areaBaule');
    areaBaule.addEventListener('click', avviaLivelloNucleo);

    const areaBotola = document.getElementById('areaBotola');
    areaBotola.addEventListener('click', () => {
        // Torna indietro al livello 2
        if (typeof inizializzaLivello2 === 'function') {
            inizializzaLivello2();
        }
    });

    // Gestione tooltip "Esamina"
    if (!document.getElementById('etichettaEsamina')){
        const etichettaEsamina = document.createElement('div');
        etichettaEsamina.id = 'etichettaEsamina';
        etichettaEsamina.textContent = 'Esamina';
        document.body.appendChild(etichettaEsamina);
    }

    const etichettaEsamina = document.getElementById('etichettaEsamina');
    let aree = ['areaBaule', 'areaBotola'];

    function aggiungiHoverListeners(id){
        const elementDOM = document.getElementById(id);
        if (!elementDOM) return;

        elementDOM.addEventListener('mouseenter', () => { etichettaEsamina.style.display = 'block'; });
        elementDOM.addEventListener('mouseleave', () => { etichettaEsamina.style.display = 'none'; });
        elementDOM.addEventListener('click', () => { etichettaEsamina.style.display = 'none'; });
        elementDOM.addEventListener('mousemove', (e) => {
            etichettaEsamina.style.left = (e.clientX + 40) + 'px';
            etichettaEsamina.style.top = (e.clientY + 16) + 'px';
        });
    }
    aree.forEach(aggiungiHoverListeners);
}

let istanzaNucleo = null;

/**
 * Avvia il puzzle del Nucleo (class NucleoTorre).
 */
function avviaLivelloNucleo(){
    // Ferma luccichii
    if (timerCicloLuccichii) {
        clearTimeout(timerCicloLuccichii);
        timerCicloLuccichii = null;
    }
    const luccichiiAttivi = document.querySelectorAll('.luccichio');
    luccichiiAttivi.forEach(luccichio => luccichio.remove());

    const inventario = document.getElementById('inventario');
    inventario.classList.add('nascosto');

    const livello3 = document.getElementById('livello3');
    livello3.classList.remove('sfondoLivello3');
    livello3.classList.add('sfondoBaule'); // Cambio sfondo (zoom sul macchinario)

    const areaCliccabile = document.getElementById('areaCliccabile3');
    areaCliccabile.replaceChildren();
    areaCliccabile.classList.add('nascosto');

    const nucleoTorre = document.getElementById('nucleoTorre');
    nucleoTorre.classList.remove('nascosto');

    const contenitoreNucleo = document.getElementById('contenitoreNucleoTorre');
    contenitoreNucleo.classList.remove('nascosto');

    // Bottone per uscire dal puzzle e tornare alla stanza
    const bottoneRitorno = document.getElementById('bottoneRitorno3');
    bottoneRitorno.classList.remove('nascosto');
    bottoneRitorno.removeEventListener('click', inizializzaEsplorazioneLivello3);
    bottoneRitorno.addEventListener('click', inizializzaEsplorazioneLivello3);
    
    // Dialogo iniziale
    if(dialogoApparso3 === false){
        const nomeGiocatore = sessionStorage.getItem('username') || 'Ingegnere';
        SistemaDialogo.show(nomeGiocatore, "Questo è il cuore. Devo collegare la rotazione della fonte al nucleo senza bloccare gli ingranaggi.");
        dialogoApparso3 = true;
    }

    if (!istanzaNucleo) {
        // La creiamo solo la prima volta
        istanzaNucleo = new NucleoTorre();
    }
    
    try{
        window.puzzleNucleo = istanzaNucleo; // Esposto per debug
    }
    catch(e){}

    // Recupera numero totale di ingranaggi posseduti dall'utente
    fetch('../php/get_user.php')
        .then(res => res.json())
        .then(data => {
            let numeroIngranaggi = 8;
            if (data && data.success && typeof data.totGear !== 'undefined') {
                numeroIngranaggi = data.totGear;
            }
            istanzaNucleo.inizializza(numeroIngranaggi);
        })
        .catch(err => {
            console.error("Errore recupero ingranaggi:", err);
            // Fallback in caso di errore
            istanzaNucleo.inizializza(0);
        });
}