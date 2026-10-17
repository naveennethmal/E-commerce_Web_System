<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$merchant_id = '1238350';
$merchant_secret = 'OTg4ODUzMDE3NDMwMjcwMzQzNDI4NjYzMzc4NjM5OTAyMjI0OTc=';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['order_id']) || empty($input['amount'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid PayHere payment parameters']);
    exit;
}

$order_id = trim($input['order_id']);
$amount = (float)$input['amount'];
$amount_formatted = number_format($amount, 2, '.', '');
$currency = 'LKR';

// PayHere Hash generation:
// hash = strtoupper(md5(merchant_id + order_id + amount_formatted + currency + strtoupper(md5(merchant_secret))))
$hashed_secret = strtoupper(md5($merchant_secret));
$hash = strtoupper(md5($merchant_id . $order_id . $amount_formatted . $currency . $hashed_secret));

$nameParts = explode(' ', trim($input['customer_name'] ?? 'Customer'), 2);
$first_name = !empty($nameParts[0]) ? $nameParts[0] : 'Customer';
$last_name = !empty($nameParts[1]) ? $nameParts[1] : 'Customer';

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || ($_SERVER['SERVER_PORT'] ?? 80) == 443) ? "https://" : "http://";
$domain = $_SERVER['HTTP_HOST'] ?? 'localhost';
$requestUri = $_SERVER['REQUEST_URI'] ?? '/website/api/payhere.php';
$baseDir = preg_replace('#/api/.*$#', '', parse_url($requestUri, PHP_URL_PATH));
$baseUrl = rtrim($protocol . $domain . $baseDir, '/');

$payhere_params = [
    'sandbox' => true,
    'merchant_id' => $merchant_id,
    'return_url' => $baseUrl . '/index.html?payment=success&order_id=' . urlencode($order_id) . '#checkout',
    'cancel_url' => $baseUrl . '/index.html#checkout',
    'notify_url' => $baseUrl . '/api/payhere_notify.php',
    'order_id' => $order_id,
    'items' => 'Food Express Order #' . $order_id,
    'amount' => $amount_formatted,
    'currency' => $currency,
    'hash' => $hash,
    'first_name' => $first_name,
    'last_name' => $last_name,
    'email' => $input['customer_email'] ?? 'customer@example.com',
    'phone' => $input['customer_phone'] ?? '0771234567',
    'address' => $input['address'] ?? 'Colombo, Sri Lanka',
    'city' => $input['city'] ?? 'Colombo',
    'country' => 'Sri Lanka',
    'delivery_address' => $input['address'] ?? 'Colombo, Sri Lanka',
    'delivery_city' => $input['city'] ?? 'Colombo',
    'delivery_country' => 'Sri Lanka'
];

echo json_encode([
    'status' => 'success',
    'payhere_params' => $payhere_params
]);
