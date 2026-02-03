<?php
/**
 * Restituisce lo stato di gioco dell'utente loggato e pulisce eventuali penalità in classifica.
 */

header('Content-Type: application/json');
require_once 'db.php';
session_start();

$response = ['success' => false];

// Procediamo solo se la sessione è attiva
if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true && isset($_SESSION['user_id'])) {
    
    try {
        // Connessione al database
        $pdo = getDbConnection();
        $userId = $_SESSION['user_id'];

        // 1. RECUPERO DATI E PULIZIA CLASSIFICA
        // Selezioniamo anche Last_Rank_ID per vedere se c'è un record parziale da togliere
        $sqlInfo = "SELECT Current_level, Tot_gear, Last_Rank_ID FROM Users WHERE ID = :id";
        $stmtInfo = $pdo->prepare($sqlInfo);
        $stmtInfo->execute([':id' => $userId]);
        $userData = $stmtInfo->fetch(PDO::FETCH_ASSOC);

        if ($userData) {
            // --- RIGHE AGGIUNTE PER LA PULIZIA PENALITÀ ---
            // Se esiste un record parziale (penalità) in classifica, lo eliminiamo appena rientra
            if (!empty($userData['Last_Rank_ID'])) {
                // Rimuove il record dalla tabella Ranking_Users
                $delRank = $pdo->prepare("DELETE FROM Ranking_Users WHERE ID = :rid");
                $delRank->execute([':rid' => $userData['Last_Rank_ID']]);

                // Svuota il riferimento nel profilo utente (torna a NULL)
                $updateUser = $pdo->prepare("UPDATE Users SET Last_Rank_ID = NULL WHERE ID = :id");
                $updateUser->execute([':id' => $userId]);
            }
            // ----------------------------------------------

            // Prepara la risposta per il gioco
            $response['currentLevel'] = (int)$userData['Current_level'];
            $response['totGear'] = (int)$userData['Tot_gear'];
            $response['success'] = true;

            // 2. RECUPERA LUCCICHII RACCOLTI
            $sqlSparkles = "SELECT Sparkle_ID, Level_ID FROM User_Sparkles WHERE User_ID = :id";
            $stmtSparkles = $pdo->prepare($sqlSparkles);
            $stmtSparkles->execute([':id' => $userId]);
            $response['collectedSparkles'] = $stmtSparkles->fetchAll(PDO::FETCH_ASSOC);

        } else {
            // Fallback se l'utente non viene trovato
            $response['currentLevel'] = 1;
            $response['totGear'] = 0;
            $response['collectedSparkles'] = [];
        }

    } catch (PDOException $e) {
        // Log errore server e messaggio generico
        error_log("Errore database in get_user.php: " . $e->getMessage());
        $response['message'] = "Errore nel caricamento dati.";
    }
} else {
    $response['message'] = "Sessione non valida.";
}

echo json_encode($response);
exit();
?>