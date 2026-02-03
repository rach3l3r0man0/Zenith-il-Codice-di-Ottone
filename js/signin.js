// Variabile usata per evitare richieste multiple contemporanee
let accessoInCorso;

/**
 * Inizializza gli event listener per il form di accesso e la gestione dei dialoghi.
 */
function inizializzaAccesso(){
    const accessButton = document.getElementById('accessButton');
    // Se l'utente preme il bottone, vogliamo avviare la procedura di login
    if(accessButton) accessButton.addEventListener('click', accessoAlGioco);

    // Overlay globale per bloccare i click quando compare un dialogo/caricamento
    ottieniOverlayAccesso();

    // Gestione del popup per i messaggi di errore
    const dialogArea = document.getElementById('dialogArea');
    const dialogButton = document.getElementById('dialogButton');

    // Se esistono gli elementi del dialog, aggiungiamo il listener per chiuderlo
    if(dialogButton && dialogArea) {
        dialogButton.addEventListener('click', function() {
            try { 
                // Aggiunge la classe per nascondere il dialog quando si preme OK
                dialogArea.classList.add('nascosto');
                nascondiOverlaySeNessunDialog();
            } 
            catch(e){}
        });
    }

    // Inizializza lo stato del flag di caricamento
    accessoInCorso = false;
}

/**
 * Gestisce la logica di login: validazione input, invio dati al server e reindirizzamento.
 * La variabile 'e' sta ad indicare l'evento click.
 */
function accessoAlGioco(e){
    // Preveniamo il comportamento default del form (ricaricamento pagina)
    if(e){
        e.preventDefault();
    }

    // Se c'è già una richiesta in corso, impediamo ulteriori invii
    if(accessoInCorso){
        mostraErrore('Accesso in corso');
        return;
    }

    // Recuperiamo i valori inseriti dall'utente
    const usr = document.getElementById('usrIn').value;
    const pwd = document.getElementById('pswIn').value;

    // Controllo campi vuoti
    if (usr === '' || pwd === ''){
        mostraErrore('Uno o più campi vuoti');
        return;
    }

    // Regex per validare la password: min 8 caratteri, almeno una maiuscola, una minuscola, un numero e un carattere speciale
    let pwdRE = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{8,}$');

    // Validazione lunghezza username (minimo 3, massimo 20 caratteri)
    if(usr.length < 3 || usr.length > 20){
        mostraErrore("Username non valido");
        return;
    }

    // Validazione robustezza password tramite espressione regolare
    if (!pwdRE.test(pwd)) {
        mostraErrore("Password non valida");
        return;
    }

    // Impostiamo il flag per bloccare altre richieste
    accessoInCorso = true;

    // Mostriamo l'overlay di caricamento visivo (spinner/messaggio)
    const caricamentoArea = document.getElementById('caricamentoArea');
    caricamentoArea.classList.remove('nascosto');
    mostraOverlay();

    // Oggetto dati da inviare al server in formato JSON
    const datiDaInviare = {
        username: usr,
        password: pwd
    };

    // Invio richiesta asincrona POST al server PHP per il login
    fetch('../php/signin.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datiDaInviare)
    })
    .then(response => {
        // Verifica se la risposta HTTP è valida
        if (!response.ok) throw new Error('Server error: ' + response.status);
        return response.json(); // Parsing della risposta JSON
    })
    .then(data => {
        // Se il login ha successo
        if (data && data.success === true) {
            // Salviamo lo username nella sessione per utilizzo futuro nel gioco
            try{ 
                sessionStorage.setItem('username', usr); 
            } 
            catch(e){}

            // Reset dello stato di gioco precedente per garantire una nuova partita pulita all'accesso
            try{
                sessionStorage.removeItem('partita');
                sessionStorage.removeItem('partitaDoppia');
                localStorage.removeItem('gameState');
            } 
            catch(e){}

            // Nascondiamo l'overlay di caricamento prima del redirect
            try{ 
                if (caricamentoArea.isConnected){
                    caricamentoArea.classList.add('nascosto');
                } 
            } 
            catch(e){}
            nascondiOverlaySeNessunDialog();
            
            // Reindirizzamento alla pagina di gioco principale
            window.location.href = '../web_pages/game.html';
        } 
        else{
            // Gestione errore login (es. credenziali errate o utente non trovato)
            try{ 
                if (caricamentoArea.isConnected){ 
                    caricamentoArea.classList.add('nascosto');
                }
            }
            catch(e){}
            nascondiOverlaySeNessunDialog();

            // Mostriamo il messaggio di errore restituito dal server o un messaggio generico
            mostraErrore((data && data.message) ? data.message : 'Accesso fallito');
        }
    })
    .catch(error => {
        // Gestione errori di rete o eccezioni durante la fetch
        try { 
            if (caricamentoArea.isConnected){
                caricamentoArea.classList.add('nascosto');
            }
        }
        catch(e){}
        nascondiOverlaySeNessunDialog();
        
        console.error('Errore:', error);
        mostraErrore("Errore di comunicazione con il server.");
    })
    .finally(() => {
        // Ripristiniamo il flag per permettere nuovi tentativi di login
        accessoInCorso = false;
    });
}

/**
 * Mostra un messaggio di errore nel popup modale.
 * La variabile testo passata nella funzione è il messaggio da visualizzare
 */
function mostraErrore(testo) {
    const dialog = document.getElementById('dialogArea');
    const messaggio = document.getElementById('dialogMessage');

    messaggio.textContent = testo;
    dialog.classList.remove('nascosto');
    mostraOverlay();
}

// Overlay helper (riutilizzato per dialog/caricamento)
function ottieniOverlayAccesso(){
    let overlay = document.getElementById('overlayAccesso');
    if(!overlay){
        overlay = document.createElement('div');
        overlay.id = 'overlayAccesso';
        Object.assign(overlay.style, {
            position: 'fixed',
            inset: '0',
            background: 'rgba(0,0,0,0.45)',
            zIndex: '900',
            display: 'none'
        });
        overlay.addEventListener('click', () => {
            const dialog = document.getElementById('dialogArea');
            if (dialog && !dialog.classList.contains('nascosto')) {
                dialog.classList.add('nascosto');
            }
            nascondiOverlaySeNessunDialog();
        });
        document.body.appendChild(overlay);
    }
    return overlay;
}

function mostraOverlay(){
    const overlay = ottieniOverlayAccesso();
    overlay.style.display = 'block';
}

function nascondiOverlaySeNessunDialog(){
    const overlay = document.getElementById('overlayAccesso');
    const dialog = document.getElementById('dialogArea');
    const loading = document.getElementById('caricamentoArea');
    if(!overlay) return;
    const dialogVisibile = dialog && !dialog.classList.contains('nascosto');
    const loadingVisibile = loading && !loading.classList.contains('nascosto');
    if(!dialogVisibile && !loadingVisibile){
        overlay.style.display = 'none';
    }
}

// Avvio inizializzazione al caricamento del DOM
document.addEventListener('DOMContentLoaded', inizializzaAccesso);