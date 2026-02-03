/**
 * Variabile di stato: indica se il giocatore ha esaminato la lavagna con gli indizi.
 * È necessaria per poter attivare il puzzle delle valvole (non puoi risolvere senza sapere la pressione target).
 */
let lavagnaEsaminata = false;

/**
 * Variabile di stato: indica se il puzzle "Sala Caldaie" è stato completato con successo.
 * Viene usata per cambiare lo sfondo del livello e sbloccare l'accesso al livello successivo (Nucleo).
 */
let livello2Completato = false;

/**
 * Coordinate degli ingranaggi nascosti (luccichii) sparsi per la scena.
 * - top/left: posizione CSS percentuale.
 * - raccolto: evita che riappaiano una volta presi.
 */
const puntiInteresseLivello2 = [ 
    { top: "80%", left: "30%", id: 1, raccolto: false },
    { top: "95%", left: "90%", id: 2, raccolto: false },
    { top: "65%", left: "40%", id: 3, raccolto: false },
];

/**
 * Variabile di stato che evita che il dialogo introduttivo "Devo girare le valvole..." 
 * appaia ogni volta che si entra nella schermata del puzzle.
 */
let dialogoApparso2 = false;

/**
 * Classe principale "SalaCaldaie"
 * Gestisce la logica del puzzle matematico delle valvole.
 * L'obiettivo è raggiungere esattamente 100.0 BAR di pressione attivando/disattivando le valvole corrette.
 */
class SalaCaldaie {
    /**
     * Costruttore: recupera i riferimenti agli elementi HTML e inizializza lo stato.
     */
    constructor() {
        // Elementi dell'interfaccia utente (UI)
        this.contenitore = document.getElementById('contenitoreSalaCaldaie');
        this.grigliaValvole = document.getElementById('grigliaValvole');
        this.lancetta = document.getElementById('lancettaManometro'); // Animazione visiva
        this.displayTarget = document.getElementById('valoreTarget'); // Obiettivo (es. 100.0)
        this.displayAttuale = document.getElementById('valoreAttuale'); // Somma corrente delle valvole attive
        this.bottoneInvio = document.getElementById('bottoneVapore'); // Tasto "Conferma" o "Attiva Vapore"

        // Variabili logiche del gioco
        this.pressioneTarget = 1000; // Valore interno (100.0 * 10 per evitare problemi coi float)
        this.pressioneAttuale = 0;   // Somma attuale
        this.valvole = [];           // Array di oggetti {id, valore, attiva}
        
        // Assicura che 'this' si riferisca alla classe anche quando chiamato da un evento click
        this.controllaPressione = this.controllaPressione.bind(this);
    }

    /**
     * Metodo di inizializzazione.
     * Prepara il contenitore, rigenera o ricarica il puzzle e mostra le valvole a schermo.
     */
    inizializza() {
        this.grigliaValvole.replaceChildren(); // Pulisce eventuali rimasugli precedenti
        this.contenitore.classList.remove('nascosto');

        // Crea la logica matematica o carica il salvataggio
        this.generaPuzzle();
        // Disegna i pulsanti (valvole) nel DOM
        this.renderizzaValvole();
        
        // Se l'utente ha già finito il livello in precedenza, mostra lo stato "Risolto"
        if(livello2Completato) {
            this.aggiornaManometro();
            this.bottoneInvio.textContent = "PRESSIONE STABILIZZATA";
            this.bottoneInvio.style.backgroundColor = '#4caf50';
            this.bottoneInvio.style.cursor = 'default';

            // Chiude automaticamente il puzzle dopo 1.5 secondi per mostrare l'esplorazione
            setTimeout(() => {
                this.contenitore.classList.add('nascosto');
                avviaLivelloCaldaie();
            }, 1500);
        } else {
            // Altrimenti, abilita il pulsante di verifica soluzione
            this.bottoneInvio.addEventListener('click', this.controllaPressione);
        }
    }

    /**
     * Crea i valori numerici per il puzzle.
     * Genera una soluzione garantita (somma parziale che fa 1000) e aggiunge valori "esca".
     */
    generaPuzzle() {
        this.pressioneTarget = 1000; // Target fisso 100.0 BAR

        // Caso 1: Livello già completato o salvataggio esistente
        if (livello2Completato) {
            try {
                const valvoleSalvate = JSON.parse(localStorage.getItem(getUserKey('salaCaldaie_valvole')));
                if (valvoleSalvate) {
                    this.valvole = valvoleSalvate;
                    // Ricalcola la pressione attuale sommando le valvole attivate nel salvataggio
                    this.pressioneAttuale = this.valvole.reduce((acc, v) => acc + (v.attiva ? v.valore : 0), 0);
                    this.displayTarget.textContent = (this.pressioneTarget / 10).toFixed(1);
                    return;
                }
            } catch(e) { console.error("Errore recupero salvataggio valvole", e); }
        }
        
        // Caso 2: Nuova partita - Generazione procedurale
        let partiNecessarie = 4; // Numero di valvole corrette da trovare
        let rimanente = this.pressioneTarget;
        let valoriSoluzione = [];

        // Genera 3 numeri casuali che siano parte della somma finale
        for (let i = 0; i < partiNecessarie - 1; i++) {
            let val = Math.floor(Math.random() * 300) + 100; // Valore tra 10.0 e 40.0
            val = Math.floor(val / 5) * 5; // Arrotonda ai 0.5 più vicini
            
            valoriSoluzione.push(val);
            rimanente -= val;
        }
        // L'ultimo numero è quello che manca per arrivare esattamente al target
        valoriSoluzione.push(rimanente);

        // Genera 4 valori casuali "esca" (distrattori) che non fanno parte della soluzione
        let valoriEsca = [];
        for(let i=0; i<4; i++){
            let val = Math.floor(Math.random() * 400) + 50;
            val = Math.floor(val / 5) * 5; 
            valoriEsca.push(val);
        }

        // Unisce e mescola l'array, così la soluzione non è ovvia
        let tuttiValori = [...valoriSoluzione, ...valoriEsca];
        tuttiValori.sort(() => Math.random() - 0.5);

        // Mappa i numeri in oggetti utilizzabili
        this.valvole = tuttiValori.map((val, index) => {
            return {
                id: index,
                valore: val, 
                attiva: false // Tutte spente all'inizio
            };
        });

        this.displayTarget.textContent = (this.pressioneTarget / 10).toFixed(1);
    }

    /**
     * Crea fisicamente i pulsanti delle valvole nell'HTML basandosi sui dati generati.
     */
    renderizzaValvole() {
        this.valvole.forEach(valvola => {
            const el = document.createElement('div');
            el.className = 'valvola';
            el.dataset.id = valvola.id;
            
            // Crea l'etichetta col numero (es. "25.5")
            const etichetta = document.createElement('span');
            etichetta.textContent = (valvola.valore / 10).toFixed(1);
            el.appendChild(etichetta);

            // Gestione del click su ogni singola valvola
            el.addEventListener('click', () => {
                this.toggleValvola(valvola, el);
            });

            this.grigliaValvole.appendChild(el);
        });
    }

    /**
     * Gestisce l'attivazione/disattivazione di una valvola.
     * Aggiorna la somma totale e la grafica del pulsante (acceso/spento).
     */
    toggleValvola(objValvola, elemento) {
        if (livello2Completato) return; // Non modificabile se già vinto

        objValvola.attiva = !objValvola.attiva; // Inverte stato
        
        if (objValvola.attiva) {
            elemento.classList.add('attivo'); // Stile CSS "premuto"
            this.pressioneAttuale += objValvola.valore;
        } else {
            elemento.classList.remove('attivo');
            this.pressioneAttuale -= objValvola.valore;
        }

        // Aggiorna feedback visivo (lancetta e numeri)
        this.aggiornaManometro();
        // Salva progressione parziale
        this.salvaStato();
    }

    /**
     * Salva lo stato attuale delle valvole nel LocalStorage.
     * Permette all'utente di chiudere il gioco e riprenderlo senza perdere i calcoli.
     */
    salvaStato() {
        localStorage.setItem(getUserKey('salaCaldaie_valvole'), JSON.stringify(this.valvole));
    }

    /**
     * Aggiorna la grafica del manometro (lancetta girevole) e il display digitale.
     */
    aggiornaManometro() {
        this.displayAttuale.textContent = (this.pressioneAttuale / 10).toFixed(1);

        // Calcolo rotazione lancetta
        const scalaMax = 1500; // Valore massimo previsto per la scala visiva (150.0 BAR)
        let percentuale = this.pressioneAttuale / scalaMax;
        
        // Mappa la percentuale su un range di gradi (-90° a +90°)
        let angolo = -90 + (percentuale * 180);
        
        // Vincoli grafici (clamp)
        if (angolo < -90) angolo = -90;
        if (angolo > 90) angolo = 90;

        this.lancetta.style.transform = `rotate(${angolo}deg)`;

        // Colora di rosso il testo se si supera il target (pericolo)
        if (this.pressioneAttuale > this.pressioneTarget) {
            this.displayAttuale.style.color = '#ff4444';
        } else {
            this.displayAttuale.style.color = '#cfbe86';
        }
    }

    /**
     * Verifica la "Win Condition".
     * Chiamato quando si preme il pulsante "ATTIVA VAPORE".
     */
    controllaPressione() {
        if (this.pressioneAttuale === this.pressioneTarget) {
            // VITTORIA
            this.bottoneInvio.style.backgroundColor = '#4caf50';
            this.bottoneInvio.textContent = "PRESSIONE STABILIZZATA";
            this.bottoneInvio.removeEventListener('click', this.controllaPressione);
            this.bottoneInvio.style.cursor = 'default';

            livello2Completato = true;
            localStorage.setItem(getUserKey('livello2Completato'), 'true');
            this.salvaStato();

            // Salva progresso sul server
            (typeof flushTempoGioco === 'function' ? flushTempoGioco('level-up') : Promise.resolve())
            .finally(() => {
                fetch('../php/update_user.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newLevel: 3 })
                })
                .then(res => res.json())
                .then(data => {
                    if(!data.success) console.warn("Errore update level 3:", data.message);
                })
                .catch(e => console.error("Errore fetch update level:", e));
            });

            // Cambia lo sfondo del livello per riflettere il successo (luci accese)
            const livello2 = document.getElementById('livello2');
            livello2.classList.remove('sfondoLivello2');
            livello2.classList.add('sfondoLivello2Completato');

            // Torna all'esplorazione dopo breve pausa
            setTimeout(() => {
                this.contenitore.classList.add('nascosto');
                inizializzaEsplorazioneLivello2();
            }, 1500);

        } else {
            // ERRORE
            this.bottoneInvio.style.backgroundColor = '#d32f2f';
            this.bottoneInvio.textContent = "ERRORE PRESSIONE";

            // Ripristina pulsante dopo 1 secondo per riprovare
            setTimeout(() => {
                this.bottoneInvio.style.backgroundColor = '#3e2723';
                this.bottoneInvio.textContent = 'ATTIVA VAPORE';
            }, 1000);
        }
    }
}

/**
 * Pulizia di manutenzione: rimuove vecchie chiavi localStorage senza prefisso utente.
 * Utile se ci sono stati aggiornamenti del sistema di salvataggio.
 */
function pulisciVecchiSalvataggiGenerici() {
    const chiaviDaRimuovere = ['livello2Completato', 'salaCaldaie_valvole'];
    chiaviDaRimuovere.forEach(chiave => {
        if (localStorage.getItem(chiave)) {
            localStorage.removeItem(chiave);
        }
    });
}

/**
 * Funzione principale di avvio del Livello 2.
 * Gestisce la pulizia dell'interfaccia, nascondendo gli altri livelli e mostrando
 * l'introduzione "Sala Caldaie".
 */
function inizializzaLivello2() {
    pulisciVecchiSalvataggiGenerici();

    // Sincronizza lo stato locale con il server per sapere se il livello è già completato
    fetch('../php/get_user.php', { credentials: 'same-origin' })
        .then(response => response.json())
        .then(data => {
            let livelloCorrente = 0;
            if (data && data.success && data.currentLevel) {
                livelloCorrente = data.currentLevel;
            }

            // Se il livello nel DB è >= 3, significa che questo livello 2 è già fatto
            if (livelloCorrente >= 3) {
                livello2Completato = true;
                localStorage.setItem(getUserKey('livello2Completato'), 'true');
            } 
            else {
                livello2Completato = false;
                localStorage.setItem(getUserKey('livello2Completato'), 'false');
            }
        })
        .catch(err => {
            // Fallback: se il server è irraggiungibile usa il localStorage
            console.warn("Server offline, uso cache locale per livello 2");
            livello2Completato = localStorage.getItem(getUserKey('livello2Completato')) === 'true';
            inizializzaEsplorazioneLivello2();
        });

    // Reset interfaccia utente globale: nasconde tutto tranne la base del gioco
    const schermataIntro = document.getElementById('schermataIntro');
    schermataIntro.classList.add('nascosto');

    const inventario = document.getElementById('inventario');
    inventario.classList.add('nascosto');
    
    // Contenitori specifici del gioco
    const contenitoreGioco = document.getElementById('contenitoreGioco');
    contenitoreGioco.classList.add('nascosto');

    const stratoGioco = document.getElementById('stratoGioco');
    stratoGioco.classList.add('nascosto');

    // Nasconde tutti i div dei livelli
    const livello1 = document.getElementById('livello1');
    livello1.classList.add('nascosto');
    const livello2 = document.getElementById('livello2');
    livello2.classList.add('nascosto');
    const livello3 = document.getElementById('livello3');
    livello3.classList.add('nascosto');

    // Recupera la lista dei luccichii già raccolti per non mostrarli di nuovo
    fetch('../php/get_user.php')
    .then(r=>r.json())
    .then(data => {
        if(data.success && data.collectedSparkles){
            const dbRaccolti = data.collectedSparkles
                .filter(s => parseInt(s.Level_ID) === 2) // Filtro per livello 2
                .map(s => parseInt(s.Sparkle_ID));
            
            puntiInteresseLivello2.forEach(punto => {
                punto.raccolto = dbRaccolti.includes(punto.id);
            });
        }
    })
    .catch(e => console.error("Errore sync luccichii lv2:", e));


    // Mostra il titolo del livello e poi avvia l'esplorazione
    if (typeof mostraIntroLivello === 'function') {
        mostraIntroLivello("Sala Caldaie", () => {
            inizializzaEsplorazioneLivello2();
        });
    } else {
        inizializzaEsplorazioneLivello2();
    }
}

/**
 * Prepara la scena ESPLORATIVA del Livello 2.
 * Qui il giocatore vede la sala caldaie (spenta o accesa) e può interagire con:
 * - Lavagna (indizi)
 * - Caldaia (puzzle)
 * - Porta uscita (indietro)
 * - Scala (avanti, solo se il livello è completato)
 */
function inizializzaEsplorazioneLivello2(){
    // Nasconde l'interfaccia specifica del puzzle caldaia (manometri/valvole)
    const salaCaldaie = document.getElementById('salaCaldaie');
    salaCaldaie.classList.add('nascosto');

    const contenitoreSalaCaldaie = document.getElementById('contenitoreSalaCaldaie');
    contenitoreSalaCaldaie.classList.add('nascosto');

    // Mostra la scena
    const contenitoreGioco = document.getElementById('contenitoreGioco');
    contenitoreGioco.classList.remove('nascosto');

    const stratoGioco = document.getElementById('stratoGioco');
    stratoGioco.classList.remove('nascosto');

    const inventario = document.getElementById('inventario');
    inventario.classList.remove('nascosto');

    const livello2 = document.getElementById('livello2');
    // Imposta lo sfondo corretto in base allo stato "Risolto/Non risolto"
    if(livello2Completato){
        livello2.classList.remove('sfondoLivello2');
        livello2.classList.add('sfondoLivello2Completato'); // Luci accese
    }
    else{
        livello2.classList.add('sfondoLivello2'); // Luci spente / vapore
        livello2.classList.remove('sfondoLivello2Completato');
    }
    livello2.classList.remove('nascosto');

    // Reset luccichii
    if (timerCicloLuccichii) {
        clearTimeout(timerCicloLuccichii);
        timerCicloLuccichii = null;
    }
    const luccichiiAttivi = document.querySelectorAll('.luccichio');
    luccichiiAttivi.forEach(luccichio => luccichio.remove());

    // Avvia spawn luccichii casuali
    avviaCicloLuccichiiInteract(livello2, puntiInteresseLivello2);

    // Nasconde bottone nav generico (usiamo le frecce nella scena)
    const bottoneRitorno2 = document.getElementById('bottoneRitorno2');
    bottoneRitorno2.classList.add('nascosto');

    // Abilita layer interattivo
    const areaCliccabile = document.getElementById('areaCliccabile2');
    areaCliccabile.classList.remove('nascosto');

    // 1. AREA LAVAGNA (Click per vedere schema tecnico/indizi)
    if (!document.getElementById('areaLavagna')) {
        const areaLavagna = document.createElement('div');
        areaLavagna.id = 'areaLavagna';
        areaCliccabile.appendChild(areaLavagna);
    }
    const areaLavagna = document.getElementById('areaLavagna');
    areaLavagna.addEventListener('click', () => {
        // Crea modale lavagna se non esiste
        if (!document.getElementById('dialogoLavagna')){
            const dialogoLavagna = document.createElement('div');
            dialogoLavagna.id = 'dialogoLavagna';
            document.body.appendChild(dialogoLavagna);

            dialogoLavagna.addEventListener('click', () =>{
                document.getElementById('dialogoLavagna').style.display = 'none';
            });
        }

        // Segna che l'utente ha visto l'indizio (necessario per attivare puzzle)
        lavagnaEsaminata = true;

        const dialogoLavagna = document.getElementById('dialogoLavagna');
        dialogoLavagna.style.display = 'block';

        // Mostra commento narrativo solo se il livello non è ancora finito
        if(livello2Completato === false){
            const nomeGiocatore = sessionStorage.getItem('username') || 'Ingegnere';
            SistemaDialogo.show(nomeGiocatore, "La pressione dovrebbe essere 100.0 BAR. Devo sistemarla il prima possibile.");
        }
    });

    // 2. AREA PORTA (Torna al Livello 1)
    if (!document.getElementById('areaPorta1')) {
        const areaPorta = document.createElement('div');
        areaPorta.id = 'areaPorta1';
        areaPorta.textContent = "Esci";
        areaCliccabile.appendChild(areaPorta);
    }
    const areaPorta = document.getElementById('areaPorta1');
    areaPorta.addEventListener('click', () => {
        if (typeof inizializzaLivello1 === 'function') {
            inizializzaLivello1();
        }
    });

    // 3. AREA CALDAIA (Avvia il mini-gioco delle valvole)
    if (!document.getElementById('areaCaldaia')) {
        const areaCaldaia = document.createElement('div');
        areaCaldaia.id = 'areaCaldaia';
        areaCliccabile.appendChild(areaCaldaia);
    }
    const areaCaldaia = document.getElementById('areaCaldaia');
    if(livello2Completato === false){
        // Interattiva solo se non ancora risolta
        areaCaldaia.removeEventListener('click', avviaLivelloCaldaie);
        areaCaldaia.addEventListener('click', avviaLivelloCaldaie);
        areaCaldaia.style.cursor='pointer';
    }
    else{
        areaCaldaia.removeEventListener('click', avviaLivelloCaldaie);
        areaCaldaia.style.cursor='default'; // Non cliccabile se finito
    }

    // 4. AREA SCALA (Vai al Livello 3 - Nucleo)
    if (!document.getElementById('areaScala')) {
        const areaScala = document.createElement('div');
        areaScala.id = 'areaScala';
        areaCliccabile.appendChild(areaScala);
    }
    const areaScala = document.getElementById('areaScala');
    areaScala.addEventListener('click', () => {
        if(livello2Completato === true){
            // Accesso consentito
            setTimeout(() => {
                console.log("Nucleo accessibile");
                livello2.classList.add('nascosto');
                    
                if (typeof inizializzaLivello3 === 'function') {
                    inizializzaLivello3();
                } else {
                    console.error("inizializzaLivello3 non definito!");
                }
            }, 1000);
            
            // Backup sicurezza: forza salvataggio progressione
            fetch('../php/update_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newLevel: 3 })
            })
            .then(res => res.json())
            .then(data => {
                if(!data.success) console.warn("Errore update level 3:", data.message);
            })
            .catch(e => console.error("Errore fetch update level:", e));
        }
        else{
            // Accesso negato
            const nomeGiocatore = sessionStorage.getItem('username') || 'Ingegnere';
            SistemaDialogo.show(nomeGiocatore, "Devo prima sistemare la sala caldaie.");
        }
    });

    // Gestione Etichetta "Esamina" al passaggio del mouse
    if (!document.getElementById('etichettaEsamina')){
        const etichettaEsamina = document.createElement('div');
        etichettaEsamina.id = 'etichettaEsamina';
        etichettaEsamina.textContent = 'Esamina';
        document.body.appendChild(etichettaEsamina);
    }
    const etichettaEsamina = document.getElementById('etichettaEsamina');
    // Se completato, non serve esaminare la caldaia
    let areeAttive = (livello2Completato === false) ? ['areaLavagna', 'areaCaldaia', 'areaScala'] : ['areaLavagna', 'areaScala'];
    
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
    areeAttive.forEach(aggiungiHoverListeners);
}

/**
 * Prepara la transizione verso il puzzle "Sala Caldaie".
 * Mostra l'interfaccia con il grande tasto d'accensione ON/OFF.
 * Controlla se l'utente ha letto la lavagna prima di procedere.
 */
function avviaLivelloCaldaie(){
    // Ferma distrazioni (luccichii)
    if (timerCicloLuccichii) {
        clearTimeout(timerCicloLuccichii);
        timerCicloLuccichii = null;
    }
    const luccichiiAttivi = document.querySelectorAll('.luccichio');
    luccichiiAttivi.forEach(luccichio => luccichio.remove());

    // Pulisce sfondo
    const livello2 = document.getElementById('livello2');
    livello2.classList.remove('sfondoLivello2');
    livello2.classList.remove('sfondoLivello2Completato');

    const areaCliccabile = document.getElementById('areaCliccabile2');
    areaCliccabile.replaceChildren();
    areaCliccabile.classList.add('nascosto');

    // Mostra layer caldaie
    const salaCaldaie = document.getElementById('salaCaldaie');
    salaCaldaie.classList.remove('nascosto');

    // Attiva bottone "Torna Indietro" locale
    const bottoneRitorno2 = document.getElementById('bottoneRitorno2');
    bottoneRitorno2.classList.remove('nascosto');
    bottoneRitorno2.addEventListener('click', inizializzaEsplorazioneLivello2);

    const tastoAccensione = document.getElementById('tastoAccensione');
    tastoAccensione.classList.add('nascosto');

    // LOGICA DI CONTROLLO: Se ho visto la lavagna, posso accendere il sistema
    if (lavagnaEsaminata === true){
        if(livello2Completato !== true){
            if(dialogoApparso2 === false){
                const nomeGiocatore = sessionStorage.getItem('username') || 'Ingegnere';
                SistemaDialogo.show(nomeGiocatore, "Devo girare le valvole giuste per arrivare a 100.0 BAR.");
                dialogoApparso2 = true;
            }
        }

        tastoAccensione.textContent = 'ON';
        tastoAccensione.removeEventListener('click', avviaLivelloCaldaie);
        tastoAccensione.classList.remove('nascosto');
        // Click su ON avvia il gioco vero e proprio
        tastoAccensione.addEventListener('click', avviaGiocoLivello2);
    }
    else{
        // Se NON ho visto la lavagna, il personaggio si rifiuta di toccare a caso
        const nomeGiocatore = sessionStorage.getItem('username') || 'Ingegnere';
        SistemaDialogo.show(nomeGiocatore, "Non ricordo quanto deve essere la pressione esatta. Forse dovrei controllare i progetti.");

        // Rimanda all'esplorazione
        const contenitoreSalaCaldaie = document.getElementById('contenitoreSalaCaldaie');
        contenitoreSalaCaldaie.classList.add('nascosto');
        inizializzaEsplorazioneLivello2();
    }
}

/**
 * Avvia effettivamente la classe SalaCaldaie e mostra le valvole.
 * Chiamato premendo "ON".
 */
function avviaGiocoLivello2(){
    // Doppia sicurezza pulizia luccichii
    if (timerCicloLuccichii) {
        clearTimeout(timerCicloLuccichii);
        timerCicloLuccichii = null;
    }
    const luccichiiAttivi = document.querySelectorAll('.luccichio');
    luccichiiAttivi.forEach(luccichio => luccichio.remove());

    // Istanza del puzzle
    const livelloSalaCaldaie = new SalaCaldaie();
    try{ 
        window.puzzleCaldaie = livelloSalaCaldaie; // Debug
    } 
    catch(e){}
    
    // Gestione toggle del tasto ON -> OFF
    const tastoAccensione = document.getElementById('tastoAccensione');
    if (tastoAccensione) {
        if(livelloSalaCaldaie.contenitore) 
            livelloSalaCaldaie.contenitore.classList.add('nascosto');
        tastoAccensione.textContent = 'OFF';
        tastoAccensione.removeEventListener('click', avviaGiocoLivello2);
        // Se premo OFF torno alla schermata precedente
        tastoAccensione.addEventListener('click', avviaLivelloCaldaie);
        
        // Avvia logica
        livelloSalaCaldaie.inizializza();
    } else {
        livelloSalaCaldaie.inizializza();
    }
}