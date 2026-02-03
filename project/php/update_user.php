<?php
/**
 * Aggiorna lo stato di gioco dell'utente (reset, luccichii, livello, ingranaggi, tempo).
 */
header('Content-Type: application/json');
require_once 'db.php';
session_start();

$response = ['success' => false];

// Controllo autenticazione
if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    $response['message'] = "Non autenticato.";
    echo json_encode($response);
    exit();
}

$userId = $_SESSION['user_id'];
$username = $_SESSION['username'];
$json = file_get_contents('php://input');
$data = json_decode($json, true);

try {
    // Connessione al database
    $pdo = getDbConnection();

    // --- 1. RESET PARTITA ---
    if (isset($data['resetGame']) && $data['resetGame'] === true) {
        // Reset totale: Livello, Ingranaggi, Tempo e soprattutto il flag della Classifica
        $sql = "UPDATE Users SET Current_level = 0, Tot_gear = 0, Play_time = 0, Last_Rank_ID = NULL WHERE ID = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        // Pulizia Sparkles
        $sqlSparkles = "DELETE FROM User_Sparkles WHERE User_ID = :id";
        $stmtSparkles = $pdo->prepare($sqlSparkles);
        $stmtSparkles->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmtSparkles->execute();

        $response['message'] = "Partita resettata. Nuovo record pronto per la classifica.";
        $response['success'] = true;
        echo json_encode($response);
        exit();
    }
    
    // --- 2. RACCOLTA LUCCICHII (Sparkles) ---
    if (isset($data['sparkleCollected'], $data['levelId'], $data['sparkleId'])) {
        $sql = "INSERT INTO User_Sparkles (User_ID, Sparkle_ID, Level_ID) 
                VALUES (:uid, :sid, :lid) 
                ON DUPLICATE KEY UPDATE Collected_At = CURRENT_TIMESTAMP";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':uid' => $userId,
            ':sid' => (int)$data['sparkleId'],
            ':lid' => (int)$data['levelId']
        ]);
    }

    // --- 3. AGGIORNAMENTO LIVELLO / FINE GIOCO ---
    if (isset($data['newLevel'])) {
        $newLevel = (int)$data['newLevel'];

        // Aggiorna il livello attuale
        $sql = "UPDATE Users SET Current_level = :lvl WHERE ID = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':lvl' => $newLevel, ':id' => $userId]);

        // Se il livello è 4 (Fine Gioco), registriamo il punteggio finale
        if ($newLevel >= 4) {
            $stmtData = $pdo->prepare("SELECT Play_time, Tot_gear, Last_Rank_ID FROM Users WHERE ID = :id");
            $stmtData->execute([':id' => $userId]);
            $userData = $stmtData->fetch(PDO::FETCH_ASSOC);

            // 1. Se esiste un record parziale precedente, lo cancelliamo
            if ($userData['Last_Rank_ID']) {
                $pdo->prepare("DELETE FROM Ranking_Users WHERE ID = :rid")->execute([':rid' => $userData['Last_Rank_ID']]);
            }

            // 2. Calcolo Punteggio Finale
            $punteggio = (floor($userData['Play_time'] / 10) * 8) + ((8 - $userData['Tot_gear']) * 2) + 0;

            // 3. Inserimento record definitivo
            $sqlRank = "INSERT INTO Ranking_Users (User, Points) VALUES (:user, :points)";
            $stmtRank = $pdo->prepare($sqlRank);
            $stmtRank->execute([':user' => $username, ':points' => $punteggio]);
            
            // 4. Pulizia del flag Last_Rank_ID perché la partita è finita
            $pdo->prepare("UPDATE Users SET Last_Rank_ID = NULL WHERE ID = :id")->execute([':id' => $userId]);
        }
        $response['success'] = true;
    }

    // --- 4. AGGIORNAMENTO INGRANAGGI ---
    if (isset($data['addGear'])) {
        $sql = "UPDATE Users SET Tot_gear = Tot_gear + 1 WHERE ID = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $userId]);
    }

    // --- 5. AGGIORNAMENTO TEMPO ---
    if (isset($data['addTime'])) {
        $seconds = (int)$data['addTime'];
        $sql = "UPDATE Users SET Play_time = Play_time + :secs WHERE ID = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':secs' => $seconds, ':id' => $userId]);
    }
    
    $response['success'] = true;

} catch (PDOException $e) {
    $response['message'] = "Errore DB: " . $e->getMessage();
}

echo json_encode($response);
?>