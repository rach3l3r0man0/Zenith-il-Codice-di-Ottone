/**
 * Variabile di stato: traccia se il dialogo introduttivo del livello è già stato mostrato.
 * Evita che il giocatore debba rileggere la stessa parte di trama se ricarica il puzzle.
 */
let dialogoApparso1 = false;

/**
 * Riferimento al timer che gestisce la comparsa ciclica degli ingranaggi (luccichii).
 * Serve per poterlo fermare quando il giocatore entra nella modalità puzzle.
 */
let timerCicloLuccichii = null;

/**
 * Variabile di stato: indica se l'enigma della serratura è stato risolto.
 * Viene usata per mantenere la serratura aperta se l'utente torna in questo livello.
 */
let livello1Completato = false;

/**
 * Configurazione delle posizioni degli ingranaggi da raccogliere (Easter Eggs).
 * id: identificativo univoco per il database.
 * top/left: coordinate CSS per posizionare il luccichio sullo sfondo.
 * raccolto: stato locale per non mostrare ciò che è già stato preso.
 */
const puntiInteresseLivello1 = [ 
    { top: "77%", left: "30%", id: 1, raccolto: false },
    { top: "77%", left: "70%", id: 2, raccolto: false },
    { top: "98%", left: "10%", id: 3, raccolto: false },
];

/**
 * Overlay trasparente che blocca tutti i click durante la verifica della combinazione.
 * Viene mostrato quando l'utente preme il bottone di controllo e tolto solo
 * quando il bottone torna disponibile (errore) oppure quando si passa al livello successivo.
 */
function attivaOverlayBloccaAnelli(){
    let overlay = document.getElementById('overlayBloccaAnelli');
    if (!overlay){
        overlay = document.createElement('div');
        overlay.id = 'overlayBloccaAnelli';
        overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        overlay.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';
}

function disattivaOverlayBloccaAnelli(){
    const overlay = document.getElementById('overlayBloccaAnelli');
    if (overlay){
        overlay.style.display = 'none';
    }
}

/**
 * Classe che gestisce la logica del puzzle "Antica Serratura".
 * Il puzzle consiste in tre anelli concentrici che devono essere ruotati
 * fino ad allineare i simboli nella posizione corretta (angolo 0).
 */
class AnticaSerratura {
    /**
     * Costruttore della classe.
     * Definisce la struttura dati degli anelli, i simboli contenuti e lo stato iniziale.
     */
    constructor() {
        // Definizione dei tre anelli rotanti
        this.anelli = [
            { 
                id: 'anelloEsterno', 
                simboli: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], 
                angolo: 0 
            },
            { 
                id: 'anelloCentrale', 
                simboli: ['I', 'II', 'III', 'IV', 'V', 'VI'], 
                angolo: 0 
            },
            { 
                id: 'anelloInterno', 
                simboli: ['☾', '☀', '★', '⚡'], 
                angolo: 0 
            }
        ];
        
        // Recupera i riferimenti agli elementi DOM dell'interfaccia
        this.contenitore = document.getElementById('contenitoreAnticaSerratura');
        this.bottoneSblocco = document.getElementById('bottoneLivello1');
        
        // Controlli di sicurezza per evitare crash se l'HTML non è caricato correttamente
        if (!this.contenitore) console.error('AnticaSerratura: elemento con id "contenitoreAnticaSerratura" non trovato nel DOM');
        if (!this.bottoneSblocco) console.warn('AnticaSerratura: bottone con id "bottoneLivello1" non trovato nel DOM');
        
        // Assicura che 'this' all'interno di controllaSoluzione si riferisca sempre all'istanza della classe
        this.controllaSoluzione = this.controllaSoluzione.bind(this);
    }

    /**
     * Metodo di inizializzazione principale.
     * Crea gli elementi grafici (div) per ogni anello e imposta gli ascoltatori degli eventi (click).
     * Recupera anche lo stato salvato se il giocatore sta continuando una partita.
     */
    inizializza() {
        if (!this.contenitore) {
            console.error('AnticaSerratura.inizializza(): container non presente');
            return;
        }

        // Reset stato visivo per permettere la rivisitazione del livello completato
        // Rimuove stili 'display: none' residui
        this.contenitore.style.display = '';
        if (this.bottoneSblocco) {
            this.bottoneSblocco.style.display = '';
            this.bottoneSblocco.textContent = "SBLOCCA MECCANISMO";
            this.bottoneSblocco.style.backgroundColor = '';
        }

        // Pulisce il contenitore da eventuali vecchi anelli (evita duplicati)
        this.contenitore.replaceChildren();

        // Tenta di recuperare lo stato salvato dal LocalStorage (persi nella sessione)
        let statoSalvato = null;
        try {
            statoSalvato = JSON.parse(localStorage.getItem(getUserKey('anticaSerratura_stato')));
        } catch(e) {
            console.warn("Errore lettura stato salvato:", e);
        }

        // Ciclo di creazione degli anelli
        this.anelli.forEach(configAnello => {
            // Crea l'elemento cerchio principale
            const elementoAnello = document.createElement('div');
            elementoAnello.id = configAnello.id;
            elementoAnello.className = 'anelloSerratura';
            
            // Calcola l'angolo tra un simbolo e l'altro (es. 360 / 4 = 90 gradi)
            const passo = 360 / configAnello.simboli.length;

            // Posiziona i simboli (lettere/numeri) attorno al cerchio
            configAnello.simboli.forEach((simbolo, indice) => {
                const elementoSimbolo = document.createElement('div');
                elementoSimbolo.className = 'simboloAnello';
                elementoSimbolo.textContent = simbolo;
                // Ruota ogni simbolo per distribuirli radialmente
                elementoSimbolo.style.transform = `rotate(${indice * passo}deg)`;
                elementoAnello.appendChild(elementoSimbolo);
            });

            // Gestisce la posizione iniziale dell'anello
            if (livello1Completato) {
                // Se già risolto, mostra tutto allineato e blocca le interazioni
                configAnello.angolo = 0; 
                elementoAnello.style.pointerEvents = 'none'; 
            } else if (statoSalvato && statoSalvato[configAnello.id] !== undefined) {
                // Se c'è un salvataggio, ripristina l'ultima posizione nota
                configAnello.angolo = statoSalvato[configAnello.id];
            } else {
                // Altrimenti, mescola casualmente per iniziare il puzzle
                const offsetCasuale = Math.floor(Math.random() * configAnello.simboli.length);
                configAnello.angolo = offsetCasuale * passo;
            }
            
            // Applica la rotazione visiva calcolata
            this.aggiornaVista(elementoAnello, configAnello.angolo);

            // Aggiunge l'evento di click per ruotare l'anello (solo se non completato)
            if (!livello1Completato) {
                elementoAnello.addEventListener('click', () => {
                    configAnello.angolo += passo; // Incrementa l'angolo
                    this.aggiornaVista(elementoAnello, configAnello.angolo); // Aggiorna CSS
                    this.salvaStato(); // Salva nuova posizione
                });
            }

            // Inserisce l'anello finito nel DOM
            this.contenitore.appendChild(elementoAnello);
        });

        // Configurazione finale del bottone di sblocco
        if (!livello1Completato) {
            this.salvaStato(); // Salva lo stato iniziale mischiato
        } else {
            this.bottoneSblocco.style.cursor = 'default'; // Disabilita puntatore se finito
        }
        this.bottoneSblocco.addEventListener('click', this.controllaSoluzione);
    }

    /**
     * Aggiorna lo stile CSS per ruotare visivamente un anello.
     * Applica la proprietà 'transform: rotate(...)' all'elemento HTML.
     * La variabile 'elemento' contiene l'elemento DOM dell'anello
     * La variabile 'angolo' contiene l'angolo di rotazione corrente in gradi
     */
    aggiornaVista(elemento, angolo) {
        elemento.style.transform = `rotate(${angolo}deg)`;
    }

    /**
     * Verifica la "Win Condition" del puzzle.
     * Controlla se tutti gli anelli sono posizionati all'angolo 0 (o multipli di 360).
     * Se corretto, avvia la sequenza di successo.
     */
    controllaSoluzione() {
        // Blocca ogni interazione finché non si conclude il controllo
        attivaOverlayBloccaAnelli();

        let risolto = true;

        if(livello1Completato === false){
            // Scorre tutti gli anelli e controlla il resto della divisione per 360
            this.anelli.forEach(anello => {
                let angoloNormalizzato = anello.angolo % 360;
                // Se anche un solo anello non è a 0 gradi, il puzzle non è risolto
                if (angoloNormalizzato !== 0) {
                    risolto = false;
                }
            });
        }

        if (risolto) {
            this.gestisciSuccesso();
        } else {
            this.gestisciFallimento();
        }
    }

    /**
     * Gestisce la sequenza di vittoria, chiamata quando la soluzione è corretta.
     * 1. Cambia il colore del bottone (feedback positivo).
     * 2. Salva il progresso sul server (Livello 1 -> Livello 2).
     * 3. Avvia la transizione grafica verso il livello successivo.
     */
    gestisciSuccesso() {
        this.bottoneSblocco.style.backgroundColor = '#4caf50'; // Verde
        this.bottoneSblocco.textContent = "ACCESSO CONSENTITO";

        // Rimuove la possibilità di tornare indietro durante la transizione di vittoria
        const bottoneRitorno = document.getElementById('bottoneRitorno1');
        bottoneRitorno.removeEventListener('click', inizializzaEsplorazioneLivello1);

        // Se è la prima volta che si completa, salva il progresso nel database
        if(livello1Completato === false){
            // Invia prima il tempo accumulato, poi aggiorna il livello
            (typeof flushTempoGioco === 'function' ? flushTempoGioco('level-up') : Promise.resolve())
            .finally(() => {
                fetch('../php/update_user.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ newLevel: 2 }) // Aggiorna livello utente a 2
                })
                .then(response => response.json())
                .then(data => {
                    if (!data.success) {
                        console.warn("Errore salvataggio livello:", data.message);
                    }
                })
                .catch(err => console.error(err));
            });
            
            livello1Completato = true; // Aggiorna stato locale per evitare salvataggi doppi
        }

        // Ritardo per permettere all'utente di leggere "ACCESSO CONSENTITO"
        setTimeout(() => {
            const sfondoNero = document.getElementById('sfondoNero');
            if (sfondoNero) {
                // Prepara schermata nera per dissolvenza
                sfondoNero.style.opacity = '1';
                sfondoNero.replaceChildren();
                sfondoNero.classList.remove('nascosto');
            }
            
            // Cambio effettivo di livello al termine della dissolvenza (dopo 1s)
            setTimeout(() => {
                // Nasconde il livello attuale
                document.getElementById('livello1').classList.add('nascosto');

                this.contenitore.style.display = 'none'; 
                this.bottoneSblocco.style.display = 'none';

                // Rimuove il blocco click prima di entrare nel livello successivo
                disattivaOverlayBloccaAnelli();

                // Tenta di caricare il codice del livello successivo
                if (typeof inizializzaLivello2 === 'function') {
                    inizializzaLivello2(); 
                } else {
                     console.error("inizializzaLivello2 non trovato!");
                }
            }, 1000); // Durata transizione CSS
        }, 1000); // Durata lettura messaggio vittoria
    }

    /**
     * Mostra un feedback visivo di errore (bottone rosso) temporaneo.
     * Usato quando l'utente clicca "Sblocca" ma la combinazione è errata.
     */
    gestisciFallimento() {
        this.bottoneSblocco.style.backgroundColor = '#f44336'; // Rosso
        this.bottoneSblocco.textContent = "BLOCCATO";
        
        // Ripristina il bottone allo stato originale dopo 1 secondo
        setTimeout(() => {
            this.bottoneSblocco.style.backgroundColor = ''; 
            this.bottoneSblocco.textContent = "SBLOCCA MECCANISMO";
            disattivaOverlayBloccaAnelli();
        }, 1000);
    }

    /**
     * Salva lo stato corrente degli anelli nel localStorage del browser.
     * Funzionalità "Quality of Life": permette all'utente di chiudere il gioco
     * e ritrovare gli anelli nella stessa posizione al ritorno.
     */
    salvaStato() {
        const stato = {};
        // Mappa id_anello => angolo_corrente
        this.anelli.forEach(a => stato[a.id] = a.angolo);
        localStorage.setItem(getUserKey('anticaSerratura_stato'), JSON.stringify(stato));
    }
}

/**
 * Funzione principale che allestisce il Livello 1.
 * Si occupa di nascondere le interfacce non necessarie, resettare la visuale
 * e determinare se mostrare l'intro narrativa o subito il gioco (se ricaricato).
 */
function inizializzaLivello1(){
    // Nasconde schermate introduttive e inventario durante il caricamento
    const schermataIntro = document.getElementById('schermataIntro');
    schermataIntro.classList.add('nascosto');

    const inventario = document.getElementById('inventario');
    inventario.classList.add('nascosto');

    // Assicura che tutti gli altri livelli siano nascosti
    const livello1 = document.getElementById('livello1');
    livello1.classList.add('nascosto');
    const livello2 = document.getElementById('livello2');
    livello2.classList.add('nascosto');
    const livello3 = document.getElementById('livello3');
    livello3.classList.add('nascosto');

    // Nasconde i contenitori di gioco principali
    const contenitoreGioco = document.getElementById('contenitoreGioco');
    contenitoreGioco.classList.add('nascosto');
    const stratoGioco = document.getElementById('stratoGioco');
    stratoGioco.classList.add('nascosto');

    // Recupera dal server lo stato attuale del giocatore
    // Serve per sapere quali ingranaggi sono già stati presi e se il livello è completo
    fetch('../php/get_user.php')
    .then(r=>r.json())
    .then(data => {
        if(data.success){
            // Se il livello nel DB è >= 2, allora il livello 1 conta come completato
            if(data.currentLevel > 1){
                livello1Completato = true;
            }
            // Sincronizza i luccichii segnando come 'raccolti' quelli presenti nel DB
            if(data.collectedSparkles){
                const luccichiiGiaPresi = data.collectedSparkles
                    .filter(s => parseInt(s.Level_ID) === 1) // Filtra solo per livello 1
                    .map(s => parseInt(s.Sparkle_ID));
                
                // Aggiorna array locale
                puntiInteresseLivello1.forEach(punto => {
                    if (luccichiiGiaPresi.includes(punto.id)) {
                        punto.raccolto = true;
                    }
                });
            }
        }
    })
    .catch(e => console.error("Errore sync livello 1:", e))
    .finally(() => {
        // Mostra l'overlay con il titolo del livello
        if (typeof mostraIntroLivello === 'function') {
            if(livello1Completato === false){
                mostraIntroLivello("Zenith: il Codice di Ottone", () => {
                    inizializzaEsplorazioneLivello1(); // Avvia gioco
                });
            }
            else{
                mostraIntroLivello("Ingresso alla Torre", () => {
                    inizializzaEsplorazioneLivello1(); // Avvia gioco (modalità rivisitazione)
                });
            }
        } else {
            // Fallback se la funzione intro non esiste
            console.error("mostraIntroLivello non definita in game.js");
            inizializzaEsplorazioneLivello1();
        }
    });
}

/**
 * Prepara e mostra la fase ESPLORATIVA del Livello 1.
 * Qui il giocatore vede la porta chiusa e può cercare indizi (la lettera) o ingranaggi.
 * Non è ancora la fase del puzzle vero e proprio.
 */
function inizializzaEsplorazioneLivello1(){
    // Assicura che eventuali blocchi click del puzzle siano disattivati
    disattivaOverlayBloccaAnelli();

    // Nasconde il puzzle (se era aperto)
    const contenitorePuzzle = document.getElementById('contenitorePuzzle');
    contenitorePuzzle.classList.add('nascosto');

    // Mostra il contenitore principale del gioco
    const contenitoreGioco = document.getElementById('contenitoreGioco');
    contenitoreGioco.classList.remove('nascosto');
    contenitoreGioco.style.width = '55rem'; // Larghezza panoramica per l'esplorazione

    const stratoGioco = document.getElementById('stratoGioco');
    stratoGioco.classList.remove('nascosto');

    // Mostra l'inventario in alto
    const inventario = document.getElementById('inventario');
    inventario.classList.remove('nascosto');
    inventario.style.height = '7%';

    // Imposta lo sfondo corretto (porta chiusa da lontano)
    const livello1 = document.getElementById('livello1');
    livello1.classList.remove('sfondoLivello1'); // Rimuove sfondo zoomato
    livello1.classList.add('sfondoIntroLivello1'); // Background 'lontano'
    livello1.classList.remove('nascosto');

    // Avvia la logica dei luccichii (oggetti nascosti da raccogliere)
    avviaCicloLuccichiiInteract(livello1, puntiInteresseLivello1);

    // Nasconde il bottone "Indietro"
    const bottoneRitorno = document.getElementById('bottoneRitorno1');
    bottoneRitorno.classList.add('nascosto');

    // Attiva le aree cliccabili invisibili sopra l'immagine di sfondo
    const areaCliccabile = document.getElementById('areaCliccabile1');
    areaCliccabile.classList.remove('nascosto');

    // Creazione dinamica div interattivi se non esistono già (Carta e Porta)
    if (!document.getElementById('areaCarta')) {
        const areaCarta = document.createElement('div');
        areaCarta.id = 'areaCarta';
        areaCliccabile.appendChild(areaCarta);
    }
    
    if (!document.getElementById('areaPorta')) {
        const areaPorta = document.createElement('div');
        areaPorta.id = 'areaPorta';
        areaCliccabile.appendChild(areaPorta);
    }

    // LISTENER 1: Click sulla carta (mostra indizio testuale)
    const areaCarta = document.getElementById('areaCarta');
    areaCarta.addEventListener('click', () => {
        // Overlay che blocca ogni altro click (solo la carta resta cliccabile)
        if (!document.getElementById('overlayCarta')) {
            const overlayCarta = document.createElement('div');
            overlayCarta.id = 'overlayCarta';
            // Intercetta i click senza fare nulla, così nulla sotto è cliccabile
            overlayCarta.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            document.body.appendChild(overlayCarta);
        }

        if (!document.getElementById('dialogoCarta')){
            // Crea al volo il modale se non esiste
            const dialogoCarta = document.createElement('div');
            dialogoCarta.id = 'dialogoCarta';
            document.body.appendChild(dialogoCarta);

            // Chiude il modale cliccandoci sopra (riabilita l'interazione globale)
            dialogoCarta.addEventListener('click', () =>{
                dialogoCarta.style.display = 'none';
                const overlayCarta = document.getElementById('overlayCarta');
                if (overlayCarta) overlayCarta.style.display = 'none';
            });
        }

        // Mostra il modale e attiva l'overlay blocca-click
        const overlayCarta = document.getElementById('overlayCarta');
        const dialogoCarta = document.getElementById('dialogoCarta');
        if (overlayCarta) overlayCarta.style.display = 'block';
        if (dialogoCarta) dialogoCarta.style.display = 'block';
    });

    // LISTENER 2: Click sulla Porta (avvia la fase puzzle)
    const areaPorta = document.getElementById('areaPorta');
    areaPorta.addEventListener('click', avviaLivello1);

    // Sistema per mostrare l'etichetta "Esamina" che segue il mouse
    if (!document.getElementById('etichettaEsamina')){
        const etichettaEsamina = document.createElement('div');
        etichettaEsamina.id = 'etichettaEsamina';
        etichettaEsamina.textContent = 'Esamina';
        document.body.appendChild(etichettaEsamina);
    }

    const etichettaEsamina = document.getElementById('etichettaEsamina');
    const areeInterattive = ['areaCarta', 'areaPorta'];

    // Funzione helper per aggiungere i listener 'mouseenter', 'mouseleave' e 'mousemove' alle aree
    function aggiungiListenerHover(id){
        const elementoDOM = document.getElementById(id);
        if (!elementoDOM) return;
        
        // Mostra etichetta
        elementoDOM.addEventListener('mouseenter', () => { etichettaEsamina.style.display = 'block'; });
        // Nascondi etichetta
        elementoDOM.addEventListener('mouseleave', () => { etichettaEsamina.style.display = 'none'; });
        // Nascondi al click
        elementoDOM.addEventListener('click', () => { etichettaEsamina.style.display = 'none'; });
        // Muovi etichetta con il cursore
        elementoDOM.addEventListener('mousemove', (e) => {
            etichettaEsamina.style.left = (e.clientX + 40) + 'px';
            etichettaEsamina.style.top = (e.clientY + 16) + 'px';
        });
    }
    // Applica a tutte le aree definite
    areeInterattive.forEach(aggiungiListenerHover);
}

/**
 * Configura e avvia la fase PUZZLE del livello (zoom sulla serratura).
 * Viene chiamata quando l'utente clicca sulla porta.
 * - Ferma i luccichii (non si possono raccogliere mentre si risolve il puzzle).
 * - Cambia lo sfondo e mostra l'interfaccia degli anelli.
 * - Mostra un dialogo introduttivo (solo la prima volta).
 */
function avviaLivello1(){
    // Ferma il timer dei luccichii casuali per non distrarre
    if (timerCicloLuccichii) {
        clearTimeout(timerCicloLuccichii);
        timerCicloLuccichii = null;
    }
    // Rimuove eventuali luccichii rimasti a schermo
    const luccichiiAttivi = document.querySelectorAll('.luccichio');
    luccichiiAttivi.forEach(luccichio => luccichio.remove());

    // Configura layout per il puzzle (più stretto, focus centrale)
    const contenitoreGioco = document.getElementById('contenitoreGioco');
    contenitoreGioco.style.width = '40rem'; 

    // Cambia sfondo (zoom sulla serratura)
    const livello1 = document.getElementById('livello1');
    livello1.classList.remove('sfondoIntroLivello1');
    livello1.classList.add('sfondoLivello1'); 

    // Nasconde le aree cliccabili dell'esplorazione (lettera/porta)
    const areaCliccabile = document.getElementById('areaCliccabile1');
    areaCliccabile.replaceChildren(); // Rimuove nodi figli per pulizia
    areaCliccabile.classList.add('nascosto');

    // Mostra il dialogo narrativo del protagonista (solo una volta per sessione)
    if(dialogoApparso1 === false){
        const nomeGiocatore = sessionStorage.getItem('username') || 'Ingegnere';
        SistemaDialogo.show(nomeGiocatore, "La serratura è bloccata. Serve il codice alchemico.");
        dialogoApparso1 = true;
    }

    // Mostra il contenitore degli anelli
    const contenitorePuzzle = document.getElementById('contenitorePuzzle');
    contenitorePuzzle.classList.remove('nascosto');

    // Mostra e configura il bottone per tornare all'esplorazione
    const bottoneRitorno = document.getElementById('bottoneRitorno1');
    bottoneRitorno.classList.remove('nascosto');
    // Rimuovi/Aggiungi listener per evitare accumulo di eventi click (pattern difensivo)
    bottoneRitorno.removeEventListener('click', inizializzaEsplorazioneLivello1);
    bottoneRitorno.addEventListener('click', inizializzaEsplorazioneLivello1);

    // Crea e inizializza l'oggetto che gestisce la logica degli anelli
    const puzzleSerratura = new AnticaSerratura();
    try{ 
        window.puzzleSerratura = puzzleSerratura; // Espone istanza globalmente per debugging
    } 
    catch(e){}
    
    // Avvia la logica del puzzle (creazione anelli, caricamento stato salvato)
    puzzleSerratura.inizializza();
}