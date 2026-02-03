<?php
/**
 * Fornisce una funzione per ottenere una connessione PDO al database.
 * In caso di errore risponde con JSON di errore e termina.
 */

// Includiamo config.php qui, così non dobbiamo farlo negli altri file
require_once 'config.php';

/** Ritorna una connessione PDO pronta all'uso. */
function getDbConnection() {
    try {
        // Creazione della stringa di connessione usando le costanti di config.php
        $pdo = new PDO(DBCONNSTRING, DBUSER, DBPASS);
        
        // Impostiamo la modalità di errore su Exception per beccare subito i problemi
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        return $pdo;
    } catch (PDOException $e) {
        // Se la connessione fallisce, logghiamo l'errore nel server e fermiamo tutto
        // Non mostrare mai $e->getMessage() all'utente finale (sicurezza)
        error_log("Errore di connessione al DB: " . $e->getMessage());
        
        // Restituiamo un JSON di errore e chiudiamo lo script
        header('Content-Type: application/json');
        die(json_encode(['success' => false, 'message' => 'Errore critico di connessione al database']));
    }
}
?>