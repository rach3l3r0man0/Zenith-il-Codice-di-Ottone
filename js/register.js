// Flag globale per prevenire invii multipli del form
let registrazioneInCorso;

/**
 * Inizializza la gestione degli eventi per la pagina di registrazione.
 * Configura il pulsante di registrazione e la chiusura della finestra di dialogo.
 */
function inizializzaRegistrazione(){
    const accessButton = document.getElementById('accessButton');
    accessButton.addEventListener('click', registrazioneUtente);

    // Overlay globale per bloccare i click quando compare un dialogo/caricamento
    ottieniOverlayAccesso();

    const dialogArea = document.getElementById('dialogArea');
    const dialogButton = document.getElementById('dialogButton');
    dialogButton.addEventListener('click', function() {
        dialogArea.classList.add('nascosto');
        nascondiOverlaySeNessunDialog();
        
        // Verifica se dobbiamo reindirizzare alla pagina di login dopo una registrazione corretta
        if (dialogArea.dataset.redirect) {
            window.location.href = dialogArea.dataset.redirect;
            delete dialogArea.dataset.redirect; 
        }
    });

    registrazioneInCorso = false;
}

/**
 * Gestisce il processo di registrazione utente.
 * Valida i campi, mostra feedback visivo (loading) e invia i dati al server PHP.
 * La variabile 'e' rappresenta l'evento del click sul pulsante
 */
function registrazioneUtente(e){
    // Preveniamo il refresh della pagina se il bottone è dentro un form
    if(e) e.preventDefault();

    // Blocchiamo se c'è già una richiesta attiva
    if(registrazioneInCorso){
        mostraErrore('Registrazione in corso');
        return;
    }

    // Recupero dati dai campi di input
    let usr = document.getElementById('usrIn').value;
    let pwd1 = document.getElementById('pwdIn1').value;
    let pwd2 = document.getElementById('pwdIn2').value;

    // Validazione campi vuoti
    if (usr === '' || pwd1 === '' || pwd2 === ''){
        mostraErrore('Uno o più campi vuoti');
        return;
    }
    
    // Validazione lunghezza username (min 3, max 20)
    if(usr.length < 3){
        mostraErrore("L'username deve essere lungo almeno 3 caratteri");
        return;
    }

    if(usr.length > 20){
        mostraErrore("L'username non può essere più lungo di 20 caratteri");
        return;
    }

    // Espressione regolare per la complessità della password
    let pwdRE = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{8,}$');

    // controlliamo la password principale secondo policy
    if (!pwdRE.test(pwd1)) {
        mostraErrore("La password deve essere lunga almeno 8 caratteri e deve contenere almeno una lettera maiuscola, una minuscola, un numero e un simbolo");
        return;
    }

    // la password ripetuta è controllata solo per uguaglianza
    if (pwd1 !== pwd2) {
        mostraErrore("Le password non coincidono");
        return;
    }

    registrazioneInCorso = true;

    // Mostriamo l'overlay di caricamento visivo (spinner/messaggio)
    const caricamentoArea = document.getElementById('caricamentoArea');
    caricamentoArea.classList.remove('nascosto');
    mostraOverlay();

    const datiDaInviare = {
        username: usr,
        password: pwd1,
        confirm_password: pwd2
    };

    // Invio dati al server PHP (register.php)
    fetch('../php/register.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datiDaInviare)
    })
    .then(response => response.json())
    .then(data => {
        // Rimuoviamo il loading
        if (!caricamentoArea.classList.contains('nascosto')){ 
            caricamentoArea.classList.add('nascosto');
        }
        nascondiOverlaySeNessunDialog();

        if (data.success === true) {
            // Successo: mostriamo messaggio e prepariamo il redirect
            svuotaCampi();
            const dialog = document.getElementById('dialogArea');
            const messaggio = document.getElementById('dialogMessage');
            messaggio.textContent = data.message;
            
            // Impostiamo il redirect per quando l'utente preme OK
            dialog.dataset.redirect = '../web_pages/signin.html';
            dialog.classList.remove('nascosto');
            mostraOverlay();
            
        } else {
            // Errore server (es. username già in uso)
            mostraErrore(data.message);
        }
    })
    .catch(error => {
        if (!caricamentoArea.classList.contains('nascosto')){ 
            caricamentoArea.classList.add('nascosto');
        }
        nascondiOverlaySeNessunDialog();
        console.error('Errore:', error);
        mostraErrore("Errore di comunicazione con il server.");
    })
    .finally(() => {
        if (!caricamentoArea.classList.contains('nascosto')){ 
            caricamentoArea.classList.add('nascosto');
        }
        nascondiOverlaySeNessunDialog();
        registrazioneInCorso = false;
    }); 
}

/**
 * Resetta i campi del modulo di registrazione dopo un successo.
 */
function svuotaCampi(){
    const formArea = document.getElementById('formArea');
    if (formArea) {
        formArea.reset();
    } else {
        // fallback nel caso l'id non fosse disponibile
        document.getElementById('usrIn').value = '';
        document.getElementById('pwdIn1').value = '';
        document.getElementById('pwdIn2').value = '';
    }
}

/**
 * Mostra un messaggio di errore nella finestra di dialogo.
 * La variabile 'testo' contiene il messaggio da visualizzare
 */
function mostraErrore(testo) {
    const dialog = document.getElementById('dialogArea');
    const messaggio = document.getElementById('dialogMessage');

    messaggio.textContent = testo;
    dialog.classList.remove('nascosto');
    mostraOverlay();
}

// Overlay helper: crea se manca e gestisce visibilità
function ottieniOverlayAccesso(){
    let overlay = document.getElementById('overlayAccesso');
    if(!overlay){
        overlay = document.createElement('div');
        overlay.id = 'overlayAccesso';

        // Evita click passanti; chiude se clicchi fuori dal dialog
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

// Avvio automatico al caricamento della pagina
document.addEventListener('DOMContentLoaded', inizializzaRegistrazione);