<?php
header('Content-Type: application/json');
require_once 'db.php';

$response = ['success' => false, 'ranking' => []];

try {
    // Connessione al database
    $pdo = getDbConnection();

    // Query: prendi i primi 7 utenti con meno punti (classifica ASC)
    $sql = "SELECT 
                User AS Username, 
                Points AS PunteggioCalcolato,
                Achieved_at
            FROM Ranking_Users 
            ORDER BY Points ASC 
            LIMIT 7";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    // Recupero dei risultati
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response['ranking'] = $results;
    $response['success'] = true;

} catch (PDOException $e) {
    // Log errore server e risposta generica
    error_log("Errore recupero classifica: " . $e->getMessage());
    $response['message'] = "Errore calcolo classifica";
}

echo json_encode($response);
?>