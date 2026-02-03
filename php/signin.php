<?php
/**
 * Esegue il login: controlla username/password e imposta la sessione.
 */

header('Content-Type: application/json');
require_once 'config.php';

session_start();
$response = array();

/** Controlla se le chiavi richieste sono presenti. */
function check_isset($array, $chiavi) {
    foreach ($chiavi as $value) {
        if (!isset($array[$value])) return false;
    }
    return true;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (json_last_error() != JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'message' => 'I dati inviati non possono essere processati (JSON non valido).']);
    exit();
}

if (!check_isset($data, ['username', 'password'])) {
    echo json_encode(['success' => false, 'message' => 'Dati mancanti.']);
    exit();
}

$username = trim($data['username']);
$password = $data['password'];

// Blocca campi vuoti
if ($username == '' || $password == '') {
    echo json_encode(['success' => false, 'message' => 'Uno o più campi vuoti.']);
    exit();
}

// Controlli di formato lato server: l'username deve essere una stringa di lunghezza compresa tra 8 e 20 caratteri
if (!is_string($username) || mb_strlen($username) < 3 || mb_strlen($username) > 20) {
    echo json_encode(['success' => false, 'message' => "Username non valido. Deve avere tra 3 e 20 caratteri."]);
    exit();
}

if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{8,}$/', $password)) {
    echo json_encode(['success' => false, 'message' => "Password non valida."]);
    exit();
}

try{
    // Connessione al database
    $pdo = new PDO(DBCONNSTRING, DBUSER, DBPASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Cerca l'utente per username
    $sql = "SELECT ID, Username, Password_hash FROM Users WHERE Username = :username";
    $statement = $pdo->prepare($sql);
    $statement->bindValue(':username', $username);
    $statement->execute();

    //se abbiamo trovato il giocatore avere come username quello inserito
    if ($statement->rowCount() === 1){
        $row = $statement->fetch(PDO::FETCH_ASSOC);
        $hash_nel_db = $row['Password_hash'];

        if (password_verify($password, $hash_nel_db)){
            // Rigenera l'id di sessione per sicurezza e pulisce eventuale stato di gioco legato alla sessione precedente
            session_regenerate_id(true);
            // pulizia chiavi di stato di gioco se presenti
            if (isset($_SESSION['partita'])) unset($_SESSION['partita']);
            if (isset($_SESSION['partitaDoppia'])) unset($_SESSION['partitaDoppia']);
            if (isset($_SESSION['game_state'])) unset($_SESSION['game_state']);

            $_SESSION['logged_in'] = true;
            $_SESSION['user_id'] = $row['ID'];
            $_SESSION['username'] = $row['Username'];

            $response['success'] = true;
            $response['message'] = "Login effettuato con successo!";
        } 
        else{
            $response['success'] = false;
            $response['message'] = "Username o password errati.";
        }
    } 
    else{
        $response['success'] = false;
        $response['message'] = "Username o password errati.";
    }
    $pdo = null;
} 
catch (PDOException $e){
    $response['success'] = false;
    $response['message'] = "Errore di sistema durante il login. Riprova più tardi.";
}

echo json_encode($response);
?>