<?php
/**
 * Registra un nuovo utente dopo i controlli su dati e password.
 */

header('Content-Type: application/json');
require_once 'config.php';

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

if (!check_isset($data, ['username', 'password', 'confirm_password'])) {
    echo json_encode(['success' => false, 'message' => 'Dati mancanti.']);
    exit();
}

$username = trim($data['username']);
$password = $data['password'];
$confirm_password = $data['confirm_password'];

// Rifiuta campi vuoti
if ($username == '' || $password == '' || $confirm_password == '') {
    echo json_encode(['success' => false, 'message' => 'Uno o più campi vuoti.']);
    exit();
}

// Password devono combaciare
if ($password !== $confirm_password) {
    echo json_encode(['success' => false, 'message' => 'Le password non coincidono.']);
    exit();
}

// Controlli di formato lato server: l'username deve essere una stringa di lunghezza compresa tra 8 e 20 caratteri
if (!is_string($username) || mb_strlen($username) < 3 || mb_strlen($username) > 20) {
    echo json_encode(['success' => false, 'message' => "L'username non rispetta i requisiti: deve avere tra 3 e 20 caratteri."]);
    exit();
}

if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{8,}$/', $password)) {
    echo json_encode(['success' => false, 'message' => "La password deve essere lunga almeno 8 caratteri e deve contenere almeno una lettera maiuscola, una minuscola, un numero e un simbolo."]);
    exit();
}

try {
    // Connessione al database
    $pdo = new PDO(DBCONNSTRING, DBUSER, DBPASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Controlla se l'username è già usato
    $sql_check = 'SELECT COUNT(*) FROM Users WHERE Username = :Username';
    $statement = $pdo->prepare($sql_check);
    $statement->bindValue(':Username', $username);
    $statement->execute();
    $count = $statement->fetchColumn();

    if ($count > 0) {
        echo json_encode(['success' => false, 'message' => 'Username già esistente.']);
        exit();
    } else {
        // Inserisce il nuovo utente con password hashata
        $sql_insert = 'INSERT INTO Users (Username, Password_hash) VALUES (:Username, :Password_hash)';
        $statement = $pdo->prepare($sql_insert);
        $statement->bindValue(':Username', $username);

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $statement->bindValue(':Password_hash', $hashed_password);

        $statement->execute();

        echo json_encode(['success' => true, 'message' => 'Registrazione completata con successo!']);
    }

    $pdo = null;

} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore del server durante la registrazione.']);
    exit();
}

?>