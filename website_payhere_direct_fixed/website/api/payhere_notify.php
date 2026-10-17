<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/db.php';

$merchant_id = $_POST['merchant_id'] ?? '';
$order_id = $_POST['order_id'] ?? '';
$payhere_amount = $_POST['payhere_amount'] ?? '';
$payhere_currency = $_POST['payhere_currency'] ?? '';
$status_code = $_POST['status_code'] ?? '';
$md5sig = $_POST['md5sig'] ?? '';
$payment_id = $_POST['payment_id'] ?? '';

$merchant_secret = 'OTg4ODUzMDE3NDMwMjcwMzQzNDI4NjYzMzc4NjM5OTAyMjI0OTc=';

$local_md5sig = strtoupper(
    md5(
        $merchant_id . 
        $order_id . 
        $payhere_amount . 
        $payhere_currency . 
        $status_code . 
        strtoupper(md5($merchant_secret))
    )
);

if (($local_md5sig === $md5sig) && ($status_code == 2)) {
    // Payment is successful
    $pdo = Database::getConnection();
    if ($pdo) {
        $stmt = $pdo->prepare("UPDATE orders SET payment_status = 'paid', payment_method = 'payhere_card', order_status = 'confirmed' WHERE id = ?");
        $stmt->execute([$order_id]);

        $logStmt = $pdo->prepare("INSERT INTO order_status_logs (order_id, status, notes) VALUES (?, 'confirmed', ?)");
        $logStmt->execute([$order_id, 'Payment confirmed via PayHere Payment Gateway (Ref: ' . $payment_id . ')']);
    }
}

http_response_code(200);
echo "OK";
