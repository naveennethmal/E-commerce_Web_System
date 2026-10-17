<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/db.php';

$input = json_decode(file_get_contents('php://input'), true);
$order_id = $input['order_id'] ?? null;

if ($order_id) {
    $pdo = Database::getConnection();
    if ($pdo) {
        $stmt = $pdo->prepare("UPDATE orders SET payment_status = 'paid', payment_method = 'payhere_card', order_status = 'confirmed' WHERE id = ?");
        $stmt->execute([$order_id]);

        $logStmt = $pdo->prepare("INSERT INTO order_status_logs (order_id, status, notes) VALUES (?, 'confirmed', 'Paid via PayHere Payment Gateway')");
        $logStmt->execute([$order_id]);
    }
}

echo json_encode(['status' => 'success']);
