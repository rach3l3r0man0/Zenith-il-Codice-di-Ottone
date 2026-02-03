<?php
/**
 * Chiude la sessione e salva una penalità in classifica se si esce prima di finire il gioco.
 */

header('Content-Type: application/json');
require_once 'db.php';
session_start();

$response = ['success' => false];

// Procediamo solo se l'utente è effettivamente loggato
if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true && isset($_SESSION['user_id'])) {
    try {
        // Connessione al database
        $pdo = getDbConnection();
        $userId = $_SESSION['user_id'];
        $username = $_SESSION['username'];

        // 1. Recuperiamo i dati correnti dell'utente e l'eventuale ID della classifica già esistente
        // Nota: Rank_sent non serve più, usiamo Last_Rank_ID
        $sqlData = "SELECT Play_time, Tot_gear, Current_level, Last_Rank_ID FROM Users WHERE ID = :id";
        $stmtData = $pdo->prepare($sqlData);
        $stmtData->execute([':id' => $userId]);
        $user = $stmtData->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $currentLevel = (int)$user['Current_level'];

            // Interveniamo solo se la partita è in corso (Livello 1, 2 o 3)
            if ($currentLevel < 4) {
                
                // Più il livello è basso, più la penalità è alta (per spingere l'utente in fondo alla classifica ASC)
                $penalita = 800; // Default per chi abbandona al Livello 1
                if ($currentLevel === 2) {
                    $penalita = 500; // Abbandono al Livello 2
                } elseif ($currentLevel === 3) {
                    $penalita = 300; // Abbandono al Livello 3
                }

                // Formula Punteggio aggiornata: Tempo + Ingranaggi mancanti + PENALITÀ
                $punteggio = ((floor($user['Play_time'] / 10) * 8) + ((8 - $user['Tot_gear']) * 2) * 10) + $penalita;

                if (!empty($user['Last_Rank_ID'])) {
                    // AGGIORNAMENTO: Esiste già un record parziale per questa partita, lo aggiorniamo
                    $sqlUpdate = "UPDATE Ranking_Users SET Points = :p, Achieved_at = CURRENT_TIMESTAMP WHERE ID = :rid";
                    $pdo->prepare($sqlUpdate)->execute([
                        ':p' => $punteggio, 
                        ':rid' => $user['Last_Rank_ID']
                    ]);
                } else {
                    // INSERIMENTO: È la prima volta che esce in questa partita, creiamo una nuova riga
                    $sqlInsert = "INSERT INTO Ranking_Users (User, Points) VALUES (:u, :p)";
                    $stmtInsert = $pdo->prepare($sqlInsert);
                    $stmtInsert->execute([
                        ':u' => $username, 
                        ':p' => $punteggio
                    ]);
                    
                    // Salviamo l'ID appena creato nel profilo utente
                    $newRankId = $pdo->lastInsertId();
                    $pdo->prepare("UPDATE Users SET Last_Rank_ID = :rid WHERE ID = :id")
                        ->execute([':rid' => $newRankId, ':id' => $userId]);
                }
            }
        }

        // 2. Pulizia della sessione e distruzione
        $_SESSION = array();
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, 
                $params["path"], $params["domain"], $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        $response['success'] = true;

    } catch (PDOException $e) {
        error_log("Errore critico nel logout: " . $e->getMessage());
        $response['message'] = "Errore database";
    }
}

echo json_encode($response);
exit();
?>